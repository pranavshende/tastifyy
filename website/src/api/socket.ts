import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://tastifyy.onrender.com';

class SocketService {
  private socket: Socket | null = null;
  private onReconnectCallback: (() => void) | null = null;
  private identity: { role: string; id: string } | null = null;
  private accessToken: string | null = null;

  connect(role: string, id: string, token: string) {
    const identityChanged = this.identity?.role !== role || this.identity?.id !== id;
    const tokenChanged = this.accessToken !== token;
    this.identity = { role, id };
    this.accessToken = token;

    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        auth: { token: this.accessToken },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
      });

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        if (this.identity) this.socket?.emit('join', this.identity);
      });

      this.socket.on('reconnect', () => {
        console.log('WebSocket reconnected — re-joining rooms');
        if (this.identity) this.socket?.emit('join', this.identity);
        // Trigger REST re-fetch so UI isn't stale
        if (this.onReconnectCallback) {
          this.onReconnectCallback();
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });
    } else if (identityChanged || tokenChanged) {
      this.updateToken(token);
    }
  }

  updateToken(token: string) {
    this.accessToken = token;
    if (!this.socket) return;

    this.socket.auth = { token };
    if (this.socket.connected) {
      this.socket.disconnect();
      this.socket.connect();
    }
  }

  joinRestaurant(restaurantId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_restaurant', { restaurant_id: restaurantId });
    } else {
      // If not yet connected, wait for connection
      this.socket?.once('connect', () => {
        this.socket?.emit('join_restaurant', { restaurant_id: restaurantId });
      });
    }
  }

  setReconnectCallback(cb: () => void) {
    this.onReconnectCallback = cb;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.onReconnectCallback = null;
    this.identity = null;
    this.accessToken = null;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

const socketService = new SocketService();
export default socketService;
