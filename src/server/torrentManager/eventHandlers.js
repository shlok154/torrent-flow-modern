
// JavaScript implementation of eventHandlers

export const setupTorrentEvents = (torrent, verifiedTorrents) => {
  // Once download is complete, mark as verified
  torrent.on('done', () => {
    verifiedTorrents.add(torrent.infoHash);
    console.log(`Torrent ${torrent.infoHash} download complete and verified`);
  });

  // Add additional logging for debugging
  torrent.on('warning', (err) => {
    console.warn(`Torrent warning (${torrent.name || torrent.infoHash}):`, err);
  });
  
  torrent.on('wire', (wire, addr) => {
    console.log(`New peer connection: ${addr} for ${torrent.name || torrent.infoHash}`);
    
    wire.on('download', (bytes) => {
      if (bytes > 1000000) { // Log only significant chunks
        console.log(`Downloaded ${bytes / 1000000}MB chunk from ${addr}`);
      }
    });
  });
};

export const setupRetryLogic = (torrent, source, torrentOptions, retryAttempts, client, isFile = false) => {
  torrent.on('error', (err) => {
    console.error(`Torrent error (${torrent.name || torrent.infoHash}):`, err);
    
    const currentAttempts = retryAttempts.get(torrent.infoHash) || 0;
    if (currentAttempts < 3) { // Retry up to 3 times
      retryAttempts.set(torrent.infoHash, currentAttempts + 1);
      console.log(`Retrying torrent ${torrent.infoHash}, attempt ${currentAttempts + 1}`);
      
      // Retry the torrent with a delay
      setTimeout(() => {
        if (isFile && typeof source === 'string') {
          // For file torrents, we need to re-read the file
          try {
            const fs = require('fs');
            const torrentBuffer = fs.readFileSync(source);
            client.add(torrentBuffer, torrentOptions);
          } catch (readError) {
            console.error(`Failed to read torrent file for retry: ${readError.message}`);
          }
        } else {
          // For magnet links, we can just re-add
          client.add(source, torrentOptions);
        }
      }, 5000);
    }
  });
  
  // Force announce to trackers periodically
  let announceInterval;
  
  torrent.on('metadata', () => {
    // After we have metadata, force announce every 5 minutes
    announceInterval = setInterval(() => {
      try {
        if (torrent.announce && !torrent.destroyed) {
          console.log(`Force announcing ${torrent.name || torrent.infoHash} to trackers`);
          torrent.announce();
        }
      } catch (announceError) {
        console.error(`Error during announce: ${announceError.message}`);
      }
    }, 5 * 60 * 1000); // 5 minutes
  });
  
  torrent.on('close', () => {
    if (announceInterval) {
      clearInterval(announceInterval);
    }
  });
};
