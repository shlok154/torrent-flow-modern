
// JavaScript implementation of eventHandlers.ts
export function setupRetryLogic(torrent, magnetUrl, torrentOptions, retryAttempts, client) {
  torrent.on('error', (err) => {
    console.error(`Torrent error (${torrent.infoHash}):`, err.message);
    const currentAttempts = retryAttempts.get(torrent.infoHash) || 0;
    if (currentAttempts < 3) { // Retry up to 3 times
      retryAttempts.set(torrent.infoHash, currentAttempts + 1);
      console.log(`Retrying torrent ${torrent.infoHash}, attempt ${currentAttempts + 1}`);
      // Retry the torrent with a delay
      setTimeout(() => {
        client.add(magnetUrl, torrentOptions);
      }, 5000);
    }
  });

  // Handle DHT-related events
  torrent.on('warning', (err) => {
    console.warn(`Torrent warning (${torrent.infoHash}):`, err.message);
    // If warning mentions DHT, try to re-announce
    if (err.message.includes('DHT')) {
      console.log('Re-announcing to DHT due to warning');
      torrent.announce();
    }
  });

  // Improved tracker handling
  torrent.on('trackerAnnounce', () => {
    console.log(`Tracker announce for ${torrent.name || torrent.infoHash}`);
  });

  torrent.on('trackerError', (err) => {
    console.error(`Tracker error for ${torrent.name || torrent.infoHash}:`, err.message);
  });
  
  // Set up better peer connection handling
  torrent.on('wire', (wire) => {
    console.log(`New peer connection for ${torrent.name || torrent.infoHash}: ${wire.remoteAddress}`);
    
    // Configure wire for better performance
    wire.setTimeout(30000); // 30 second timeout
    
    // Handle wire disconnection
    wire.on('close', () => {
      console.log(`Peer disconnected from ${torrent.name || torrent.infoHash}: ${wire.remoteAddress}`);
    });
    
    // Handle wire errors
    wire.on('error', (err) => {
      console.error(`Peer error for ${torrent.name || torrent.infoHash} from ${wire.remoteAddress}:`, err.message);
    });
    
    // Log piece data
    wire.on('download', (bytes) => {
      if (bytes > 1000000) { // Only log significant downloads (>1MB)
        console.log(`Downloaded ${bytes} bytes from ${wire.remoteAddress}`);
      }
    });
    
    // Optimize request pipelining - increase the number of requests in flight
    if (typeof wire.peerExtendedHandshake === 'object') {
      // If peer supports extended handshake, they likely support good request pipelining
      wire.setKeepAlive(true);
    }
  });

  // Handle download speed fluctuations
  let lowSpeedCount = 0;
  const speedInterval = setInterval(() => {
    if (!torrent.client) {
      clearInterval(speedInterval);
      return;
    }
    
    // If speed is very low but we have peers, try to optimize
    if (torrent.downloadSpeed < 10000 && torrent.numPeers > 2) { // Less than 10KB/s with multiple peers
      lowSpeedCount++;
      
      if (lowSpeedCount > 5) { // After ~30 seconds of low speed
        console.log(`Torrent ${torrent.name || torrent.infoHash} has low speed. Re-announcing to trackers.`);
        torrent.announce();
        
        // Reset counter
        lowSpeedCount = 0;
      }
    } else {
      // Reset counter if speed is good
      lowSpeedCount = 0;
    }
  }, 6000); // Check every 6 seconds
  
  // Clear interval when torrent is removed
  torrent.on('close', () => {
    clearInterval(speedInterval);
  });
}

export function setupTorrentEvents(torrent, verifiedTorrents) {
  torrent.on('done', () => {
    console.log(`Torrent completed: ${torrent.name || torrent.infoHash}`);
    // Once download is complete, mark as verified
    verifiedTorrents.add(torrent.infoHash);
  });
  
  // Add piece verification logging
  torrent.on('verified', (pieceIndex) => {
    // Log every 10th piece to avoid console spam
    if (pieceIndex % 10 === 0 || pieceIndex === 0) {
      console.log(`Verified piece ${pieceIndex}/${torrent.pieces?.length || 0} for ${torrent.name || torrent.infoHash}`);
    }
  });
  
  // Add download progress logging
  let lastProgress = 0;
  torrent.on('download', () => {
    const progress = Math.floor(torrent.progress * 100);
    // Only log when progress increases by 10%
    if (progress % 10 === 0 && progress > lastProgress) {
      console.log(`Torrent ${torrent.name || torrent.infoHash} progress: ${progress}%`);
      lastProgress = progress;
    }
  });
  
  // Handle metadata
  torrent.on('metadata', () => {
    console.log(`Got metadata for ${torrent.name || torrent.infoHash}`);
    console.log(`Files: ${torrent.files.length}, Total size: ${torrent.length} bytes`);
    
    // Log file information
    torrent.files.forEach((file, i) => {
      console.log(`File ${i}: ${file.name} (${file.length} bytes)`);
    });
  });
}
