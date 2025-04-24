
export interface TorrentFile {
  name: string;
  size: string;
  progress: number;
}

export interface TorrentInfo {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: 'Downloading' | 'Seeding' | 'Paused';
  speed?: string;
  uploadSpeed?: string;
  peers: number;
}

export interface TorrentDetails extends TorrentInfo {
  downloadSpeed: string;
  uploadSpeed: string;
  timeRemaining: string;
  files: TorrentFile[];
}
