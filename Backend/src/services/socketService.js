import { authService } from './authService.js';
import { waiterAuthService } from './waiterAuthService.js';
import { kitchenAuthService } from './kitchenAuthService.js';
import { managerService } from './managerService.js';
import { logger } from '../utils/logger.js';
import { supabase } from '../config/supabase.js';

// ============================================================================
// WEBSOCKET SERVICE
// ============================================================================
// Handles Socket.io connections, authentication, session management,
// and real-time activity tracking for manager/waiter/kitchen sessions

// Store active sessions: socketId -> { adminId, sessionId, createdAt } or { userId, role, createdAt }
const activeSessions = new Map();

// Store session timeouts for activity-based cleanup
const sessionTimeouts = new Map();

// Reference to the active Socket.io instance
let ioInstance = null;

// ─── Helper: Verify token with role-specific secrets ──────────────────────
const verifyTokenWithRole = (token, role) => {
  logger.debug(`[Socket] Attempting token verification for role: ${role || 'auto'}`);
  
  // Try admin secret first (if no role specified or role is admin/manager)
  if (!role || role === 'admin' || role === 'manager') {
    const adminDecoded = authService.verifyToken(token, false);
    if (adminDecoded && adminDecoded.adminId) {
      logger.debug(`[Socket] Token verified as ADMIN with adminId: ${adminDecoded.adminId}`);
      return { decoded: adminDecoded, detectedRole: 'admin' };
    }
  }

  // Try waiter secret
  if (!role || role === 'waiter') {
    const waiterDecoded = waiterAuthService.verifyToken(token, false);
    if (waiterDecoded && waiterDecoded.waiterId) {
      logger.debug(`[Socket] Token verified as WAITER with waiterId: ${waiterDecoded.waiterId}`);
      return { decoded: waiterDecoded, detectedRole: 'waiter' };
    }
  }

  // Try kitchen secret
  if (!role || role === 'kitchen') {
    const kitchenDecoded = kitchenAuthService.verifyToken(token, false);
    if (kitchenDecoded && kitchenDecoded.kitchenId) {
      logger.debug(`[Socket] Token verified as KITCHEN with kitchenId: ${kitchenDecoded.kitchenId}`);
      return { decoded: kitchenDecoded, detectedRole: 'kitchen' };
    }
  }

  logger.warn(`[Socket] Failed to verify token with any secret for claimed role: ${role || 'unknown'}`);
  return null;
};

export const socketService = {
  // Initialize socket handlers
  initializeSocket: (io) => {
    ioInstance = io;
    io.on('connection', async (socket) => {
      logger.info(`[Socket] Client attempting connection: ${socket.id}`);

      try {
        // ─── Authenticate with JWT token ─────────────────────────────────
        const token = socket.handshake.auth.token;
        const claimedRole = socket.handshake.auth.role;

        logger.debug(`[Socket] Handshake auth - claimed role: ${claimedRole || 'none'}, token present: ${!!token}`);

        if (!token) {
          logger.warn(`[Socket] Rejected connection - no token: ${socket.id}`);
          socket.emit('error', { message: 'Authentication token required' });
          socket.disconnect();
          return;
        }

        // Verify token with multi-secret strategy
        let verification = verifyTokenWithRole(token, claimedRole);
        if (!verification && claimedRole === 'customer') {
          try {
            const { data: order } = await supabase
              .from('orders')
              .select('ordersId, tokenValidUntil')
              .eq('customerToken', token)
              .maybeSingle();

            if (order) {
              const expiry = new Date(order.tokenValidUntil);
              if (expiry >= new Date()) {
                verification = { decoded: { orderId: order.ordersId }, detectedRole: 'customer' };
              }
            }
          } catch (err) {
            logger.error(`[Socket] Customer token verification error: ${err.message}`);
          }
        }

        if (!verification) {
          logger.error(`[Socket] REJECTED - Token verification FAILED for ${socket.id}. Claimed role: ${claimedRole}`);
          socket.emit('error', { message: 'Invalid or expired token' });
          socket.disconnect();
          return;
        }

        const { decoded, detectedRole } = verification;

        // Extract ID based on detected role
        const userId = decoded.adminId || decoded.waiterId || decoded.kitchenId || decoded.orderId;
        if (!userId) {
          logger.error(`[Socket] REJECTED - No valid user ID found in token for ${socket.id}`);
          socket.emit('error', { message: 'Invalid token: missing user ID' });
          socket.disconnect();
          return;
        }

        logger.info(`[Socket] ✅ VERIFIED - User: ${userId}, DetectedRole: ${detectedRole}, ClaimedRole: ${claimedRole}, Socket: ${socket.id}`);

        // ─── Create manager session (only for admin/manager role) ────────
        if (decoded.adminId) {
          logger.debug(`[Socket] Admin user detected, creating manager session...`);
          
          const ipAddress = socket.handshake.address || socket.request.socket.remoteAddress;
          const userAgent = socket.request.headers['user-agent'] || 'Unknown';

          const sessionResult = await managerService.createManagerSession(
            decoded.adminId,
            socket.id,
            ipAddress,
            userAgent
          );

          if (!sessionResult.success) {
            logger.error(`[Socket] Failed to create session for admin ${decoded.adminId}`);
            socket.emit('error', { message: 'Session creation failed' });
            socket.disconnect();
            return;
          }

          const sessionId = sessionResult.data.sessionId;
          
          // Store active session (admin/manager only)
          activeSessions.set(socket.id, {
            adminId: decoded.adminId,
            sessionId,
            userId: decoded.adminId,
            role: 'admin',
            createdAt: new Date(),
          });

          logger.info(
            `[Socket] ✅ Manager connected - Admin: ${decoded.adminId}, Session: ${sessionId}, Socket: ${socket.id}`
          );

          // ─── Emit connection success ─────────────────────────────────────
          socket.emit('connected', {
            sessionId,
            adminId: decoded.adminId,
            message: 'Connected to manager service',
          });
        } else {
          // For waiter/kitchen, just store minimal session info
          logger.debug(`[Socket] Non-admin user detected (role: ${detectedRole}), creating minimal session...`);
          
          activeSessions.set(socket.id, {
            userId,
            role: detectedRole,
            createdAt: new Date(),
          });

          logger.info(
            `[Socket] ✅ ${detectedRole} connected - User: ${userId}, Socket: ${socket.id}`
          );

          // ─── Emit connection success ─────────────────────────────────────
          socket.emit('connected', {
            userId,
            role: detectedRole,
            message: `Connected as ${detectedRole}`,
          });
        }

        // ─── Listen for activity heartbeat ─────────────────────────────── (admin only)
        socket.on('manager:activity', async () => {
          const session = activeSessions.get(socket.id);
          if (!session || !session.sessionId) {
            // Ignore for non-admin users
            return;
          }

          try {
            // Update last activity timestamp in database (admin only)
            await managerService.updateSessionActivity(session.sessionId);
            
            logger.debug(`[Socket] Activity recorded - Session: ${session.sessionId}`);

            // Reset activity timeout
            socketService.resetActivityTimeout(socket.id, socket);
          } catch (error) {
            logger.error(`[Socket] Failed to update session activity`, error.message);
          }
        });

        // ─── Listen for disconnect ───────────────────────────────────────
        socket.on('disconnect', async () => {
          const session = activeSessions.get(socket.id);
          if (!session) {
            logger.info(`[Socket] Client disconnected: ${socket.id}`);
            return;
          }

          logger.info(`[Socket] ${session.role} disconnected: ${socket.id}`);
          
          try {
            // Close session in database (admin only)
            if (session.sessionId && session.adminId) {
              await managerService.closeManagerSession(session.sessionId);
              logger.info(`[Socket] Session closed - Admin: ${session.adminId}, Session: ${session.sessionId}`);
            }
          } catch (error) {
            logger.error(`[Socket] Failed to close session`, error.message);
          }

          // Clean up timeout
          if (sessionTimeouts.has(socket.id)) {
            clearTimeout(sessionTimeouts.get(socket.id));
            sessionTimeouts.delete(socket.id);
          }

          // Remove from active sessions
          activeSessions.delete(socket.id);
        });

        // ─── Set initial activity timeout (admin only) ────────────────────
        if (decoded.adminId) {
          socketService.resetActivityTimeout(socket.id, socket);
        }

      } catch (error) {
        logger.error(`[Socket] ❌ Connection FAILED: ${error.message}`, error);
        logger.error(`[Socket] Stack trace: ${error.stack}`);
        socket.emit('error', { message: 'Connection failed', error: error.message });
        socket.disconnect();
      }
    });
  },

  // Reset activity timeout - session expires after 30 minutes of inactivity
  resetActivityTimeout: (socketId, socket) => {
    // Clear existing timeout
    if (sessionTimeouts.has(socketId)) {
      clearTimeout(sessionTimeouts.get(socketId));
    }

    const ACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

    const timeout = setTimeout(() => {
      const session = activeSessions.get(socketId);
      if (session) {
        logger.warn(
          `[Socket] Session inactive timeout - Admin: ${session.adminId}, Session: ${session.sessionId}`
        );
        socket.emit('manager:error', { message: 'Session timeout due to inactivity' });
        socket.disconnect();
      }
    }, ACTIVITY_TIMEOUT_MS);

    sessionTimeouts.set(socketId, timeout);
  },

  // Get active session count
  getActiveSessionCount: () => {
    return activeSessions.size;
  },

  // Get all active sessions (for debugging)
  getActiveSessions: () => {
    const sessions = [];
    activeSessions.forEach((session, socketId) => {
      sessions.push({
        socketId,
        ...session,
      });
    });
    return sessions;
  },

  // Close socket service gracefully
  closeService: async () => {
    logger.info('[Socket] Closing all active sessions');
    
    for (const [socketId, session] of activeSessions) {
      try {
        await managerService.closeManagerSession(session.sessionId);
      } catch (error) {
        logger.error(`[Socket] Error closing session ${session.sessionId}`, error.message);
      }
      
      if (sessionTimeouts.has(socketId)) {
        clearTimeout(sessionTimeouts.get(socketId));
      }
    }

    activeSessions.clear();
    sessionTimeouts.clear();
    ioInstance = null;
    logger.info('[Socket] All sessions closed');
  },

  // Helper to emit events to all connected clients (e.g. order status updates)
  emitToAll: (event, data) => {
    if (ioInstance) {
      ioInstance.emit(event, data);
    } else {
      logger.warn(`[Socket] Attempted to emit event "${event}" but ioInstance is null`);
    }
  },
};
