
import WebTorrent from 'webtorrent';
import { formatBytes, formatTime, getStatus } from './utils';

class TorrentManager {
  private client: WebTorrent.Instance;

  constructor() {
    this.client = new WebTorrent();
  }

  getTorrents() {
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

  addTorrent(magnetUrl: string, downloadPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const existingTorrent = this.client.torrents.find(t => 
        t.magnetURI === magnetUrl || (t.infoHash && magnetUrl.includes(t.infoHash))
      );

      if (existingTorrent) {
        resolve({
          id: existingTorrent.infoHash,
          name: existingTorrent.name || 'Unknown',
          size: formatBytes(existingTorrent.length || 0),
          progress: Math.round((existingTorrent.progress || 0) * 100),
          status: getStatus(existingTorrent),
          message: 'Torrent already added'
        });
        return;
      }

      this.client.add(magnetUrl, { path: downloadPath }, torrent => {
        resolve({
          id: torrent.infoHash,
          name: torrent.name || 'Unknown',
          size: formatBytes(torrent.length || 0),
          progress: Math.round((torrent.progress || 0) * 100),
          status: getStatus(torrent)
        });
      });
    });
  }

  pauseTorrent(infoHash: string) {
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (torrent) {
      torrent.pause();
      return true;
    }
    return false;
  }

  resumeTorrent(infoHash: string) {
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (torrent) {
      torrent.resume();
      return true;
    }
    return false;
  }

  getTorrentDetails(infoHash: string) {
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
      downloadSpeed: formatBytes(torrent.downloadSpeed || 0) + '/s',
      uploadSpeed: formatBytes(torrent.uploadSpeed || 0) + '/s',
      timeRemaining: formatTime(torrent.timeRemaining),
      peers: torrent.numPeers || 0,
      files: files
    };
  }

  destroy(): Promise<void> {
    return new Promise((resolve) => {
      this.client.destroy(() => {
        resolve();
      });
    });
  }
}

export const torrentManager = new TorrentManager();
