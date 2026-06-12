// ============================================================================
// SOCKET.IO CLIENT UTILITY
// ============================================================================
// Singleton socket connection manager for real-time events.
// Waiter listens: order:ready, order:modified, order:new_request
// Kitchen listens: order:new, order:modified
// ============================================================================

import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, NGROK_HEADERS } from '@/config/api';

let socket: Socket | null = null;

export const connectSocket = (token: string, role: 'waiter' | 'kitchen'): Socket => {
  if (socket?.connected) {
    console.log('[Socket] Socket already connected, reusing existing connection');
    return socket;
  }

  console.log('[Socket] 🔌 Initializing socket connection...');
  console.log('[Socket] Base URL:', SOCKET_URL);
  console.log('[Socket] Role:', role);
  console.log('[Socket] Token length:', token?.length || 0);
  console.log('[Socket] Token preview:', token?.substring(0, 50) + '...' || 'NO TOKEN');

  socket = io(SOCKET_URL, {
    auth: { token, role },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    extraHeaders: NGROK_HEADERS,
  });

  socket.on('connect', () => {
    console.log('[Socket] ✅ Connected successfully:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] ❌ Disconnected:', reason);
  });

  socket.on('connect_error', (err: any) => {
    console.warn('[Socket] ⚠️ Connection error:', err.message);
    console.warn('[Socket] Error details:', err);
    console.warn('[Socket] Error data:', err.data || 'no data');
  });

  socket.on('error', (data: any) => {
    console.error('[Socket] 🔴 Error event:', data);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  console.log('[Socket] Disconnecting socket:', socket?.id);
  socket?.disconnect();
  socket = null;
};

export const getSocket = (): Socket | null => socket;
