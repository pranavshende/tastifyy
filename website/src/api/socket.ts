import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '');

class SocketService {
  private socket: Socket | null = null;
  private onReconnectCallback: (() => void) | null = null;

  connect(role: string, id: string) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
      });

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        this.socket?.emit('join', { role, id });
      });

      this.socket.on('reconnect', () => {
        console.log('WebSocket reconnected — re-joining rooms');
        this.socket?.emit('join', { role, id });
        // Trigger REST re-fetch so UI isn't stale
        if (this.onReconnectCallback) {
          this.onReconnectCallback();
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });
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
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

const socketService = new SocketService();
export default socketService;
