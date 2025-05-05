
// JavaScript implementation of utils.ts
export const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i < sizes.length ? i : sizes.length - 1]}`;
};

export const formatTime = (ms) => {
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

export const getStatus = (torrent) => {
  if (!torrent) return 'Error';
  
  if (torrent.paused) return 'Paused';
  
  // Check queue status (placeholder, actual implementation would depend on queueManager)
  // if (queueManager.isQueued(torrent.infoHash) && !queueManager.isActive(torrent.infoHash)) return 'Queued';
  
  if (torrent.done) return 'Seeding';
  
  // If there are no peers and not completed, could be "stalled" but we'll still call it Downloading
  return 'Downloading';
};

export const generateUID = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const sanitizeFileName = (name) => {
  return name.replace(/[/\\?%*:|"<>]/g, '_');
};

export const isValidInfoHash = (infoHash) => {
  // SHA-1 hashes are 40 hex chars
  const hexPattern = /^[0-9a-fA-F]{40}$/;
  return typeof infoHash === 'string' && hexPattern.test(infoHash);
};

export const getTorrentNameFromMagnet = (magnetUri) => {
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
