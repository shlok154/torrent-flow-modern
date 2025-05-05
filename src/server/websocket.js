
/**
 * WebSocket handler for real-time torrent updates
 */

let updateInterval;
const SOCKET_UPDATE_INTERVAL = 1000; // Update frequency in ms

export function setupWebSocketHandlers(io, torrentManager) {
  io.on('connection', (socket) => {
    console.log('WebSocket client connected:', socket.id);
    
    // Send initial torrent list on connection
    sendTorrentUpdates(socket, torrentManager);
    
    // Start periodic updates if none exist
    if (!updateInterval) {
      updateInterval = setInterval(() => {
        broadcastTorrentUpdates(io, torrentManager);
      }, SOCKET_UPDATE_INTERVAL);
    }
    
    // Event listeners for client requests
    socket.on('torrent:subscribe', (torrentId) => {
      console.log(`Client ${socket.id} subscribed to torrent: ${torrentId}`);
      socket.join(`torrent:${torrentId}`);
      // Send immediate update for this specific torrent
      sendTorrentDetails(socket, torrentManager, torrentId);
    });
    
    socket.on('torrent:unsubscribe', (torrentId) => {
      console.log(`Client ${socket.id} unsubscribed from torrent: ${torrentId}`);
      socket.leave(`torrent:${torrentId}`);
    });

    // Add a specific handler for DHT and tracker announcements
    socket.on('torrent:announce', (torrentId) => {
      console.log(`Manually announcing torrent: ${torrentId}`);
      const torrent = torrentManager.client.torrents.find(t => t.infoHash === torrentId);
      if (torrent) {
        // Force announce to all trackers
        torrent.announce();
        socket.emit('torrent:announce:response', { success: true, message: 'Announcing to trackers and DHT' });
      } else {
        socket.emit('torrent:announce:response', { success: false, message: 'Torrent not found' });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Clear interval if no more clients
      if (io.engine.clientsCount === 0 && updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
      }
    });
  });
}

// Send torrent list to a specific client
function sendTorrentUpdates(socket, torrentManager) {
  try {
    const torrents = torrentManager.getTorrents();
    socket.emit('torrent:list', torrents);
  } catch (error) {
    console.error('Error sending torrent updates:', error);
  }
}

// Broadcast torrent list to all connected clients
function broadcastTorrentUpdates(io, torrentManager) {
  try {
    const torrents = torrentManager.getTorrents();
    io.emit('torrent:list', torrents);
    
    // Also send individual torrent details to subscribed rooms
    torrents.forEach(torrent => {
      if (io.sockets.adapter.rooms.has(`torrent:${torrent.id}`)) {
        const details = torrentManager.getTorrentDetails(torrent.id);
        if (details) {
          io.to(`torrent:${torrent.id}`).emit('torrent:details', details);
        }
      }
    });
  } catch (error) {
    console.error('Error broadcasting torrent updates:', error);
  }
}

// Send details for a specific torrent
function sendTorrentDetails(socket, torrentManager, torrentId) {
  try {
    const details = torrentManager.getTorrentDetails(torrentId);
    if (details) {
      socket.emit('torrent:details', details);
    }
  } catch (error) {
    console.error('Error sending torrent details:', error);
  }
}
