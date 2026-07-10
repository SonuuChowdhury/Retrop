// ============================================================================
// MANAGER SECTION LAYOUT
// ============================================================================
// Auth guard + WebSocket connection.
// ============================================================================

import { Stack, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { SOCKET_CONFIG, getSocketUrl } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { ThemeTransitionView, useTheme } from "@/context/ThemeContext";

// ============================================================================
// MANAGER LAYOUT
// ============================================================================

export default function ManagerLayout() {
  const { isAuthenticated, isLoading, accessToken } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const c = theme.colors;

  const socketRef = useRef<any>(null);
  const activityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Auth Guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading]);

  // ─── WebSocket Connection ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    connectManagerSocket(accessToken);
    return () => { disconnectSocket(); };
  }, [isAuthenticated, accessToken]);

  const connectManagerSocket = async (token: string) => {
    try {
      const { io } = await import("socket.io-client").catch(() => ({ io: null }));
      if (!io) return;

      socketRef.current = io(getSocketUrl(), {
        auth: { token },
        ...SOCKET_CONFIG,
        transports: ["websocket"],
      });

      socketRef.current.on("connected", (data: any) => {
        console.log("[Socket] Manager connected:", data?.sessionId);
      });
      socketRef.current.on("disconnect", () => {
        console.log("[Socket] Manager disconnected");
      });
      socketRef.current.on("manager:error", (data: any) => {
        console.warn("[Socket] Manager error:", data?.message);
      });

      activityIntervalRef.current = setInterval(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit("manager:activity");
        }
      }, 60_000);
    } catch (error) {
      console.warn("[Socket] Connection failed:", error);
    }
  };

  const disconnectSocket = () => {
    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
      activityIntervalRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  if (isLoading || !isAuthenticated) return null;

  return (
    <ThemeTransitionView style={{ flex: 1, backgroundColor: c.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.background },
          animation: "slide_from_right",
          animationDuration: 200,
        }}
      />
    </ThemeTransitionView>
  );
}
