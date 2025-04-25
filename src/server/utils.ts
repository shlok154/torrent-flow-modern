
import { TorrentInfo } from '../types/torrent';

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const;
  
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i < sizes.length ? i : sizes.length - 1]}`;
};

export const formatTime = (ms: number): string => {
  if (!ms || !isFinite(ms) || ms <= 0) return 'Unknown';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

export const getStatus = (torrent: { 
  paused: boolean; 
  done: boolean; 
  infoHash?: string;
  numPeers?: number;
  timeRemaining?: number;
}): 'Downloading' | 'Seeding' | 'Paused' | 'Queued' | 'Error' => {
  if (!torrent) return 'Error';
  
  if (torrent.paused) return 'Paused';
  
  // Check queue status (placeholder, actual implementation would depend on queueManager)
  // if (queueManager.isQueued(torrent.infoHash) && !queueManager.isActive(torrent.infoHash)) return 'Queued';
  
  if (torrent.done) return 'Seeding';
  
  // If there are no peers and not completed, could be "stalled" but we'll still call it Downloading
  return 'Downloading';
};

export const generateUID = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const sanitizeFileName = (name: string): string => {
  return name.replace(/[/\\?%*:|"<>]/g, '_');
};

/**
 * Enhanced verification of torrent info hash
 * @param infoHash The info hash to verify
 * @returns boolean indicating if the hash is valid
 */
export const isValidInfoHash = (infoHash: string): boolean => {
  // SHA-1 hashes are 40 hex chars
  const hexPattern = /^[0-9a-fA-F]{40}$/;
  return typeof infoHash === 'string' && hexPattern.test(infoHash);
};

/**
 * Parse torrent name from magnet URI
 * @param magnetUri The magnet URI string
 * @returns The name from dn parameter or null if not found
 */
export const getTorrentNameFromMagnet = (magnetUri: string): string | null => {
  if (!magnetUri || typeof magnetUri !== 'string') return null;
  
  const match = magnetUri.match(/dn=([^&]+)/i);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1].replace(/\+/g, ' '));
    } catch (_) {
      return match[1];
    }
  }
  return null;
};
