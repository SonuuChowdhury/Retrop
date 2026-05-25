import { Server } from 'socket.io';
import { managerService } from '../services/managerService.js';
import { waiterService } from '../services/waiterService.js';
import { logger } from '../utils/logger.js';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/constants.js';
import { nowIST } from '../utils/time.js';

// Map to store manager socket connections: { adminId: socketId }
const managerConnections = new Map();

// ============================================================================
// SOCKET.IO SETUP AND CONFIGURATION
// ============================================================================

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // ============================================================================
  // MIDDLEWARE: Verify JWT Token
  // ============================================================================

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Missing authentication token'));
      }

      const decoded = jwt.verify(token, JWT_CONFIG.SECRET);
      socket.adminId = decoded.adminId;
      socket.role = decoded.role;

      logger.debug(`Socket authenticated for admin: ${decoded.adminId}`);
      next();
    } catch (error) {
      logger.warn('Socket authentication failed', error.message);
      next(new Error('Invalid authentication token'));
    }
  });

  // ============================================================================
  // CONNECTION EVENT
  // ============================================================================

  io.on('connection', async (socket) => {
    try {
      const adminId = socket.adminId;
      // FIX: use socket.handshake.address instead of deprecated req.connection.remoteAddress
      const ipAddress = socket.handshake.address;
      const userAgent = socket.request.headers['user-agent'];

      logger.info(`Manager connected: ${adminId} (Socket: ${socket.id})`);

      // Create manager session in database
      const sessionResult = await managerService.createManagerSession(
        adminId,
        socket.id,
        ipAddress,
        userAgent
      );

      if (!sessionResult.success) {
        socket.emit('error', {
          message: 'Failed to create session',
        });
        socket.disconnect();
        return;
      }

      // Store connection
      managerConnections.set(adminId, socket.id);
      socket.sessionId = sessionResult.data.sessionId;

      // Emit successful connection
      socket.emit('connected', {
        status: 'success',
        message: 'Connected to manager dashboard',
        sessionId: socket.sessionId,
      });

      // Broadcast manager online status to all managers
      io.emit('manager:online', {
        adminId,
        timestamp: nowIST(),
      });

      // ============================================================================
      // WAITER MANAGEMENT EVENTS
      // ============================================================================

      // Request all active waiters
      socket.on('manager:get-active-waiters', async () => {
        try {
          const result = await waiterService.getActiveWaiters();
          socket.emit('manager:active-waiters', {
            status: 'success',
            data: result.data,
          });
        } catch (error) {
          logger.error('Get active waiters socket error', error.message);
          socket.emit('manager:error', {
            message: 'Failed to fetch active waiters',
          });
        }
      });

      // Request waiter profile
      socket.on('manager:get-waiter-profile', async (data) => {
        try {
          const { waiterId } = data;
          const result = await waiterService.getWaiterProfile(waiterId);

          if (!result.success) {
            return socket.emit('manager:error', {
              message: result.error,
            });
          }

          socket.emit('manager:waiter-profile', {
            status: 'success',
            data: result.data,
          });
        } catch (error) {
          logger.error('Get waiter profile socket error', error.message);
          socket.emit('manager:error', {
            message: 'Failed to fetch waiter profile',
          });
        }
      });

      // ============================================================================
      // ACTIVITY TRACKING
      // ============================================================================

      // Update session activity on any event
      socket.on('manager:activity', async () => {
        try {
          await managerService.updateSessionActivity(socket.sessionId);
        } catch (error) {
          logger.error('Update activity error', error.message);
        }
      });

      // ============================================================================
      // REAL-TIME SUBSCRIPTIONS
      // ============================================================================

      socket.on('manager:subscribe-waiter-updates', (data) => {
        const { waiterId } = data;
        socket.join(`waiter:${waiterId}`);
        logger.debug(`Manager subscribed to waiter updates: ${waiterId}`);
      });

      socket.on('manager:subscribe-order-updates', (data) => {
        const { tableNo } = data;
        socket.join(`table:${tableNo}`);
        logger.debug(`Manager subscribed to table updates: ${tableNo}`);
      });

      // ============================================================================
      // DISCONNECTION EVENT
      // ============================================================================

      socket.on('disconnect', async () => {
        try {
          logger.info(`Manager disconnected: ${adminId}`);

          // Close manager session
          await managerService.closeManagerSession(socket.sessionId);

          // Remove connection
          managerConnections.delete(adminId);

          // Broadcast manager offline status
          io.emit('manager:offline', {
            adminId,
            timestamp: nowIST(),
          });
        } catch (error) {
          logger.error('Disconnect handler error', error.message);
        }
      });

      // ============================================================================
      // ERROR HANDLING
      // ============================================================================

      socket.on('error', (error) => {
        logger.error('Socket error', error.message);
      });
    } catch (error) {
      logger.error('Connection handler error', error.message);
      socket.emit('error', {
        message: 'Connection initialization failed',
      });
      socket.disconnect();
    }
  });

  // ============================================================================
  // CLEANUP INACTIVE SESSIONS (Run every 5 minutes)
  // ============================================================================

  setInterval(async () => {
    try {
      await managerService.cleanupInactiveSessions();
    } catch (error) {
      logger.error('Session cleanup error', error.message);
    }
  }, 5 * 60 * 1000);

  return io;
};

// ============================================================================
// HELPER FUNCTIONS: Broadcast real-time updates
// ============================================================================

export const broadcastWaiterUpdate = (io, waiterId, updateData) => {
  io.to(`waiter:${waiterId}`).emit('waiter:updated', {
    waiterId,
    ...updateData,
    timestamp: nowIST(),
  });
};

export const broadcastTableUpdate = (io, tableNo, updateData) => {
  io.to(`table:${tableNo}`).emit('table:updated', {
    tableNo,
    ...updateData,
    timestamp: nowIST(),
  });
};

export const broadcastOrderUpdate = (io, orderId, updateData) => {
  io.to(`order:${orderId}`).emit('order:updated', {
    orderId,
    ...updateData,
    timestamp: nowIST(),
  });
};

// ============================================================================
// HELPER FUNCTIONS: Connection management
// ============================================================================

export const getManagerSocket = (adminId) => {
  return managerConnections.get(adminId);
};

export const isManagerConnected = (adminId) => {
  return managerConnections.has(adminId);
};