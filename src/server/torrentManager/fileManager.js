
// JavaScript implementation of fileManager.ts
import fs from 'fs';
import path from 'path';
import { formatBytes, getStatus, isValidInfoHash } from '../utils.js';
import { setupRetryLogic, setupTorrentEvents } from './eventHandlers.js';

export function getFileInfo(infoHash, client, fileIndex) {
  if (!isValidInfoHash(infoHash)) {
    return null;
  }
  
  const torrent = client.torrents.find(t => t.infoHash === infoHash);
  if (!torrent || !torrent.files || fileIndex >= torrent.files.length) {
    return null;
  }
  
  const file = torrent.files[fileIndex];
  
  return {
    path: file.path,
    name: path.basename(file.path)
  };
}

export async function handleTorrentFile(
  filePath,
  downloadPath,
  options,
  client,
  retryAttempts,
  verifiedTorrents
) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Torrent file not found at ${filePath}`);
    }

    return new Promise((resolve, reject) => {
      const torrentOptions = { 
        path: downloadPath,
        verify: options.verifyPieces || false
      };
      
      if (options.startImmediately === false) {
        torrentOptions.paused = true;
      }
      
      const torrentBuffer = fs.readFileSync(filePath);
      const newTorrent = client.add(torrentBuffer, torrentOptions);
      
      const errorHandler = (err) => {
        reject(new Error(`Failed to add torrent file: ${err.message}`));
        newTorrent.removeListener('error', errorHandler);
        newTorrent.removeListener('metadata', metadataHandler);
      };
      
      const metadataHandler = () => {
        const torrentInfo = {
          id: newTorrent.infoHash,
          name: newTorrent.name || 'Unknown',
          size: formatBytes(newTorrent.length || 0),
          progress: Math.round((newTorrent.progress || 0) * 100),
          status: getStatus(newTorrent),
          peers: newTorrent.numPeers || 0,
          verified: verifiedTorrents.has(newTorrent.infoHash),
          added: newTorrent.created || new Date()
        };
        
        resolve(torrentInfo);
        newTorrent.removeListener('error', errorHandler);
        newTorrent.removeListener('metadata', metadataHandler);
      };
      
      newTorrent.on('error', errorHandler);
      newTorrent.on('metadata', metadataHandler);
      
      // Set up verification
      setupTorrentEvents(newTorrent, verifiedTorrents);
      
      if (options.maxBandwidth && newTorrent.throttleDownload) {
        newTorrent.throttleDownload(options.maxBandwidth * 1024);
      }
      
      if (options.priority && newTorrent.queueManager) {
        newTorrent.queueManager.setPriority(newTorrent.infoHash, options.priority);
      }
    });
  } catch (error) {
    console.error('Error in addTorrentFile:', error);
    throw new Error(`Failed to add torrent file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
