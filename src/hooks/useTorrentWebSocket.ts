
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { TorrentInfo, TorrentDetails } from '../types/torrent';

type TorrentWebSocketOptions = {
  autoConnect?: boolean;
  serverUrl?: string;
};

const DEFAULT_SERVER_URL = 'http://localhost:3001';

export const useTorrentWebSocket = (options: TorrentWebSocketOptions = {}) => {
  const { autoConnect = true, serverUrl = DEFAULT_SERVER_URL } = options;
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [torrents, setTorrents] = useState<TorrentInfo[]>([]);
  const [torrentDetails, setTorrentDetails] = useState<Record<string, TorrentDetails>>({});
  const [error, setError] = useState<Error | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;
    
    const socketInstance = io(serverUrl);
    setSocket(socketInstance);
    
    socketInstance.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Connected to torrent WebSocket server');
    });
    
    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from torrent WebSocket server');
    });
    
    socketInstance.on('connect_error', (err) => {
      setError(err);
      console.error('WebSocket connection error:', err);
    });
    
    return () => {
      socketInstance.disconnect();
    };
  }, [autoConnect, serverUrl]);
  
  // Set up listeners for torrent data
  useEffect(() => {
    if (!socket) return;
    
    // Listen for torrent list updates
    socket.on('torrent:list', (data: TorrentInfo[]) => {
      setTorrents(data);
    });
    
    // Listen for detailed torrent updates
    socket.on('torrent:details', (data: TorrentDetails) => {
      setTorrentDetails(prev => ({
        ...prev,
        [data.id]: data
      }));
    });
    
    return () => {
      socket.off('torrent:list');
      socket.off('torrent:details');
    };
  }, [socket]);
  
  // Subscribe to detailed updates for specific torrents
  const subscribeTorrent = useCallback((torrentId: string) => {
    if (socket && isConnected) {
      socket.emit('torrent:subscribe', torrentId);
    }
  }, [socket, isConnected]);
  
  // Unsubscribe from detailed updates
  const unsubscribeTorrent = useCallback((torrentId: string) => {
    if (socket && isConnected) {
      socket.emit('torrent:unsubscribe', torrentId);
    }
  }, [socket, isConnected]);
  
  // Connect manually (if autoConnect is false)
  const connect = useCallback(() => {
    if (!socket) {
      const socketInstance = io(serverUrl);
      setSocket(socketInstance);
    } else if (!socket.connected) {
      socket.connect();
    }
  }, [socket, serverUrl]);
  
  // Disconnect manually
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
  }, [socket]);

  return {
    isConnected,
    error,
    torrents,
    torrentDetails,
    subscribeTorrent,
    unsubscribeTorrent,
    connect,
    disconnect
  };
};
