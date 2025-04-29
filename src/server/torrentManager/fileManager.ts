
import fs from 'fs';
import path from 'path';
import type WebTorrent from 'webtorrent';
import { formatBytes, getStatus, isValidInfoHash } from '../utils';
import { TorrentInfo } from '../../types/torrent';
import { setupRetryLogic, setupTorrentEvents } from './eventHandlers';
import { queueManager } from '../queueManager';

export function getFileInfo(
  infoHash: string, 
  client: WebTorrent.Instance,
  fileIndex: number
): { path: string, name: string } | null {
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
  filePath: string,
  downloadPath: string,
  options: { 
    maxBandwidth?: number,
    verifyPieces?: boolean,
    priority?: number,
    startImmediately?: boolean
  },
  client: WebTorrent.Instance,
  retryAttempts: Map<string, number>,
  verifiedTorrents: Set<string>
): Promise<TorrentInfo> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Torrent file not found at ${filePath}`);
    }

    const torrent = await new Promise<WebTorrent.Torrent>((resolve, reject) => {
      const torrentOptions: WebTorrent.TorrentOptions = { 
        path: downloadPath,
        verify: options.verifyPieces || false
      };
      
      if (options.startImmediately === false) {
        torrentOptions.paused = true;
      }
      
      const torrentBuffer = fs.readFileSync(filePath);
      const newTorrent = client.add(torrentBuffer, torrentOptions);
      
      const errorHandler = (err: Error) => {
        reject(new Error(`Failed to add torrent file: ${err.message}`));
        newTorrent.removeListener('error', errorHandler);
        newTorrent.removeListener('metadata', metadataHandler);
      };
      
      const metadataHandler = () => {
        resolve(newTorrent);
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
      
      if (options.priority) {
        queueManager.setPriority(newTorrent.infoHash, options.priority);
      }
    });

    return {
      id: torrent.infoHash,
      name: torrent.name || 'Unknown',
      size: formatBytes(torrent.length || 0),
      progress: Math.round((torrent.progress || 0) * 100),
      status: getStatus(torrent),
      peers: torrent.numPeers || 0,
      verified: verifiedTorrents.has(torrent.infoHash),
      added: torrent.created || new Date()
    };
  } catch (error) {
    console.error('Error in addTorrentFile:', error);
    throw new Error(`Failed to add torrent file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
