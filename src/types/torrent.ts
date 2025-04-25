
export interface TorrentFile {
  name: string;
  size: string;
  progress: number;
  selected: boolean; // Added for file selection feature
  priority?: 'high' | 'normal' | 'low'; // Added for queue management
}

export interface TorrentInfo {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: 'Downloading' | 'Seeding' | 'Paused' | 'Queued' | 'Error';
  speed?: string;
  uploadSpeed?: string;
  peers: number;
  verified: boolean; // Added for security feature
  added: Date; // Added for scheduler feature
  errorCount?: number; // Added for error handling
  maxBandwidth?: number; // Added for bandwidth limiting
  priority?: number; // Added for queue management
}

export interface TorrentDetails extends TorrentInfo {
  downloadSpeed: string;
  uploadSpeed: string;
  timeRemaining: string;
  files: TorrentFile[];
  peerDetails: PeerInfo[]; // Added for peer information
  metrics: TorrentMetrics; // Added for performance metrics
  bandwidthLimit?: number; // Added for bandwidth limiting
  ipFilterEnabled?: boolean; // Added for IP filtering
  scheduledStart?: string; // Added for scheduler
  scheduledStop?: string; // Added for scheduler
}

export interface PeerInfo {
  ip: string;
  port: number;
  client: string;
  progress: number;
  downloadSpeed: string;
  uploadSpeed: string;
  flags: string[];
  country?: string;
}

export interface TorrentMetrics {
  downloadTotal: string;
  uploadTotal: string;
  ratio: number;
  pieceCount: number;
  pieceLength: string;
  averageSpeed: string;
  connections: number;
  activeTime: string;
  wastedBytes?: string;
}

export interface IPFilterRule {
  id: string;
  range: string;
  description: string;
  blocked: boolean;
}

export interface ScheduleItem {
  id: string;
  torrentId: string;
  action: 'start' | 'stop' | 'limit';
  time: string;
  days: string[];
  active: boolean;
  limitValue?: number;
}

export interface BandwidthSettings {
  globalDownloadLimit: number; // in KB/s
  globalUploadLimit: number; // in KB/s
  perTorrentLimit: boolean;
  scheduleEnabled: boolean;
  peakHoursStart?: string;
  peakHoursEnd?: string;
  peakDownloadLimit?: number;
  peakUploadLimit?: number;
}
