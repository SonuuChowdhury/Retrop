import { authService } from './authService.js';
import { managerService } from './managerService.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// WEBSOCKET SERVICE
// ============================================================================
// Handles Socket.io connections, authentication, session management,
// and real-time activity tracking for manager sessions

// Store active sessions: socketId -> { adminId, sessionId, createdAt }
const activeSessions = new Map();

// Store session timeouts for activity-based cleanup
const sessionTimeouts = new Map();

export const socketService = {
  // Initialize socket handlers
  initializeSocket: (io) => {
    io.on('connection', async (socket) => {
      logger.info(`[Socket] Client attempting connection: ${socket.id}`);

      try {
        // ─── Authenticate with JWT token ─────────────────────────────────
        const token = socket.handshake.auth.token;
        if (!token) {
          logger.warn(`[Socket] Rejected connection - no token: ${socket.id}`);
          socket.emit('manager:error', { message: 'Authentication token required' });
          socket.disconnect();
          return;
        }

        // Verify token
        const decoded = authService.verifyToken(token, false);
        if (!decoded || !decoded.adminId) {
          logger.warn(`[Socket] Rejected connection - invalid token: ${socket.id}`);
          socket.emit('manager:error', { message: 'Invalid or expired token' });
          socket.disconnect();
          return;
        }

        const { adminId } = decoded;
        logger.info(`[Socket] Token verified for admin: ${adminId}`);

        // ─── Create manager session ──────────────────────────────────────
        const ipAddress = socket.handshake.address || socket.request.socket.remoteAddress;
        const userAgent = socket.request.headers['user-agent'] || 'Unknown';

        const sessionResult = await managerService.createManagerSession(
          adminId,
          socket.id,
          ipAddress,
          userAgent
        );

        if (!sessionResult.success) {
          logger.error(`[Socket] Failed to create session for admin ${adminId}`);
          socket.emit('manager:error', { message: 'Session creation failed' });
          socket.disconnect();
          return;
        }

        const sessionId = sessionResult.data.sessionId;
        
        // Store active session
        activeSessions.set(socket.id, {
          adminId,
          sessionId,
          createdAt: new Date(),
        });

        logger.info(
          `[Socket] Manager connected - Admin: ${adminId}, Session: ${sessionId}, Socket: ${socket.id}`
        );

        // ─── Emit connection success ─────────────────────────────────────
        socket.emit('connected', {
          sessionId,
          adminId,
          message: 'Connected to manager service',
        });

        // ─── Listen for activity heartbeat ───────────────────────────────
        socket.on('manager:activity', async () => {
          const session = activeSessions.get(socket.id);
          if (!session) {
            logger.warn(`[Socket] Activity event from unknown session: ${socket.id}`);
            return;
          }

          try {
            // Update last activity timestamp in database
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
          logger.info(`[Socket] Manager disconnected: ${socket.id}`);
          
          const session = activeSessions.get(socket.id);
          if (session) {
            try {
              // Close session in database
              await managerService.closeManagerSession(session.sessionId);
              logger.info(`[Socket] Session closed - Admin: ${session.adminId}, Session: ${session.sessionId}`);
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
          }
        });

        // ─── Set initial activity timeout ────────────────────────────────
        socketService.resetActivityTimeout(socket.id, socket);

      } catch (error) {
        logger.error(`[Socket] Connection error: ${error.message}`);
        socket.emit('manager:error', { message: 'Connection failed' });
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
    logger.info('[Socket] All sessions closed');
  },
};
