interface ConnectionManagerOptions {
  wsUrl: string;
  onOpen?: () => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  heartbeatInterval?: number;
}

interface CachedConnection {
  ws: WebSocket;
  lastActivity: number;
  isHealthy: boolean;
  connectionId: string;
}

class ConnectionManager {
  private static instance: ConnectionManager;
  private connections: Map<string, CachedConnection> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly CONNECTION_TIMEOUT = 30000; // 30 seconds
  private readonly HEARTBEAT_INTERVAL = 10000; // 10 seconds

  private constructor() {}

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  async getOrCreateConnection(
    connectionId: string,
    options: ConnectionManagerOptions
  ): Promise<WebSocket> {
    // Check if we have a healthy cached connection
    const cached = this.connections.get(connectionId);
    if (cached && this.isConnectionHealthy(cached)) {
      console.log(`♻️ Reusing cached connection for ${connectionId}`);
      cached.lastActivity = Date.now();
      return cached.ws;
    }

    // Clean up old connection if exists
    if (cached) {
      this.cleanupConnection(connectionId);
    }

    // Create new connection
    console.log(`🔗 Creating new connection for ${connectionId}`);
    return this.createConnection(connectionId, options);
  }

  private async createConnection(
    connectionId: string,
    options: ConnectionManagerOptions
  ): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(options.wsUrl);
      const timeoutId = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, this.CONNECTION_TIMEOUT);

      ws.onopen = () => {
        clearTimeout(timeoutId);
        console.log(`✅ Connection established for ${connectionId}`);
        
        const cachedConnection: CachedConnection = {
          ws,
          lastActivity: Date.now(),
          isHealthy: true,
          connectionId
        };

        this.connections.set(connectionId, cachedConnection);
        this.startHeartbeat(connectionId, options.heartbeatInterval || this.HEARTBEAT_INTERVAL);
        
        if (options.onOpen) options.onOpen();
        resolve(ws);
      };

      ws.onmessage = (event) => {
        const cached = this.connections.get(connectionId);
        if (cached) {
          cached.lastActivity = Date.now();
          cached.isHealthy = true;
        }
        if (options.onMessage) options.onMessage(event);
      };

      ws.onclose = () => {
        clearTimeout(timeoutId);
        console.log(`🔌 Connection closed for ${connectionId}`);
        this.cleanupConnection(connectionId);
        if (options.onClose) options.onClose();
      };

      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error(`❌ Connection error for ${connectionId}:`, error);
        this.markConnectionUnhealthy(connectionId);
        if (options.onError) options.onError(error);
        reject(error);
      };
    });
  }

  private isConnectionHealthy(cached: CachedConnection): boolean {
    const now = Date.now();
    const isRecent = (now - cached.lastActivity) < this.CONNECTION_TIMEOUT;
    const isOpen = cached.ws.readyState === WebSocket.OPEN;
    return cached.isHealthy && isRecent && isOpen;
  }

  private startHeartbeat(connectionId: string, interval: number): void {
    const heartbeatId = setInterval(() => {
      const cached = this.connections.get(connectionId);
      if (!cached || !this.isConnectionHealthy(cached)) {
        this.cleanupConnection(connectionId);
        return;
      }

      // Send heartbeat
      try {
        cached.ws.send(JSON.stringify({ event: 'ping' }));
      } catch (error) {
        console.error(`💓 Heartbeat failed for ${connectionId}:`, error);
        this.markConnectionUnhealthy(connectionId);
      }
    }, interval);

    this.heartbeatIntervals.set(connectionId, heartbeatId);
  }

  private markConnectionUnhealthy(connectionId: string): void {
    const cached = this.connections.get(connectionId);
    if (cached) {
      cached.isHealthy = false;
    }
  }

  private cleanupConnection(connectionId: string): void {
    const cached = this.connections.get(connectionId);
    if (cached) {
      try {
        if (cached.ws.readyState === WebSocket.OPEN) {
          cached.ws.close();
        }
      } catch (error) {
        console.error(`Error closing connection ${connectionId}:`, error);
      }
    }

    const heartbeatId = this.heartbeatIntervals.get(connectionId);
    if (heartbeatId) {
      clearInterval(heartbeatId);
      this.heartbeatIntervals.delete(connectionId);
    }

    this.connections.delete(connectionId);
  }

  closeConnection(connectionId: string): void {
    console.log(`🔒 Explicitly closing connection ${connectionId}`);
    this.cleanupConnection(connectionId);
  }

  closeAllConnections(): void {
    console.log('🔒 Closing all connections');
    for (const connectionId of this.connections.keys()) {
      this.cleanupConnection(connectionId);
    }
  }

  isConnected(connectionId: string): boolean {
    const cached = this.connections.get(connectionId);
    return cached ? this.isConnectionHealthy(cached) : false;
  }

  sendMessage(connectionId: string, message: any): boolean {
    const cached = this.connections.get(connectionId);
    if (!cached || !this.isConnectionHealthy(cached)) {
      console.error(`❌ Cannot send message: no healthy connection for ${connectionId}`);
      return false;
    }

    try {
      cached.ws.send(JSON.stringify(message));
      cached.lastActivity = Date.now();
      return true;
    } catch (error) {
      console.error(`❌ Failed to send message on ${connectionId}:`, error);
      this.markConnectionUnhealthy(connectionId);
      return false;
    }
  }
}

export default ConnectionManager;