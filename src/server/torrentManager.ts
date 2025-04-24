
import WebTorrent from 'webtorrent';
import { formatBytes, formatTime, getStatus } from './utils';
import { TorrentInfo, TorrentDetails } from '../types/torrent';

class TorrentManager {
  private client: WebTorrent.Instance;

  constructor() {
    this.client = new WebTorrent();
  }

  getTorrents(): TorrentInfo[] {
    return this.client.torrents.map(torrent => ({
      id: torrent.infoHash,
      name: torrent.name || 'Unknown',
      size: formatBytes(torrent.length || 0),
      progress: Math.round((torrent.progress || 0) * 100),
      status: getStatus(torrent),
      speed: `${formatBytes(torrent.downloadSpeed || 0)}/s`,
      uploadSpeed: `${formatBytes(torrent.uploadSpeed || 0)}/s`,
      peers: torrent.numPeers || 0
    }));
  }

  async addTorrent(magnetUrl: string, downloadPath: string): Promise<TorrentInfo> {
    const existingTorrent = this.client.torrents.find(t => 
      t.magnetURI === magnetUrl || (t.infoHash && magnetUrl.includes(t.infoHash))
    );

    if (existingTorrent) {
      return {
        id: existingTorrent.infoHash,
        name: existingTorrent.name || 'Unknown',
        size: formatBytes(existingTorrent.length || 0),
        progress: Math.round((existingTorrent.progress || 0) * 100),
        status: getStatus(existingTorrent),
        peers: existingTorrent.numPeers || 0
      };
    }

    return new Promise((resolve, reject) => {
      try {
        this.client.add(magnetUrl, { path: downloadPath }, torrent => {
          resolve({
            id: torrent.infoHash,
            name: torrent.name || 'Unknown',
            size: formatBytes(torrent.length || 0),
            progress: Math.round((torrent.progress || 0) * 100),
            status: getStatus(torrent),
            peers: torrent.numPeers || 0
          });
        });
      } catch (error) {
        reject(new Error(`Failed to add torrent: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }

  pauseTorrent(infoHash: string): boolean {
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (!torrent) return false;
    
    torrent.pause();
    return true;
  }

  resumeTorrent(infoHash: string): boolean {
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (!torrent) return false;
    
    torrent.resume();
    return true;
  }

  getTorrentDetails(infoHash: string): TorrentDetails | null {
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (!torrent) return null;

    const files = torrent.files.map(file => ({
      name: file.name,
      size: formatBytes(file.length || 0),
      progress: Math.round((file.progress || 0) * 100)
    }));

    return {
      id: torrent.infoHash,
      name: torrent.name || 'Unknown',
      size: formatBytes(torrent.length || 0),
      progress: Math.round((torrent.progress || 0) * 100),
      status: getStatus(torrent),
      downloadSpeed: `${formatBytes(torrent.downloadSpeed || 0)}/s`,
      uploadSpeed: `${formatBytes(torrent.uploadSpeed || 0)}/s`,
      timeRemaining: formatTime(torrent.timeRemaining),
      peers: torrent.numPeers || 0,
      files
    };
  }

  async destroy(): Promise<void> {
    return new Promise((resolve) => {
      this.client.destroy(() => {
        resolve();
      });
    });
  }
}

export const torrentManager = new TorrentManager();
