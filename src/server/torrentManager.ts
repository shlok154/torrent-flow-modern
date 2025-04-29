import WebTorrent from 'webtorrent';
import { formatBytes, formatTime, getStatus, isValidInfoHash } from './utils';
import { TorrentInfo, TorrentDetails, PeerInfo, TorrentMetrics, BandwidthSettings } from '../types/torrent';
import { ipFilter } from './ipFilter';
import { scheduleManager } from './scheduleManager';
import { queueManager } from './queueManager';
import fs from 'fs';
import path from 'path';

class TorrentManager {
  private client: WebTorrent.Instance;
  private bandwidthSettings: BandwidthSettings;
  private retryAttempts: Map<string, number>;
  private metrics: Map<string, TorrentMetrics>;
  private verifiedTorrents: Set<string>;

  constructor() {
    this.client = new WebTorrent();
    this.retryAttempts = new Map();
    this.metrics = new Map();
    this.verifiedTorrents = new Set();
    this.bandwidthSettings = {
      globalDownloadLimit: 0, // Unlimited by default
      globalUploadLimit: 0,   // Unlimited by default
      perTorrentLimit: false,
      scheduleEnabled: false
    };

    // Initialize event listeners
    this.setupEventListeners();
    
    // Start metrics collection
    setInterval(() => this.updateMetrics(), 10000);
    
    // Apply scheduled bandwidth limits
    setInterval(() => this.applyScheduledSettings(), 60000);
  }

  private setupEventListeners() {
    this.client.on('error', (err) => {
      console.error('WebTorrent client error:', err);
    });
    
    // Apply IP filtering to new peers
    this.client.on('torrent', (torrent) => {
      torrent.on('peerconnect', (peer) => {
        const peerAddress = peer.remoteAddress;
        if (ipFilter.isBlocked(peerAddress)) {
          console.log(`Blocked peer connection from ${peerAddress}`);
          peer.destroy();
        }
      });
    });
  }

  private updateMetrics() {
    this.client.torrents.forEach(torrent => {
      const metrics: TorrentMetrics = {
        downloadTotal: formatBytes(torrent.downloaded || 0),
        uploadTotal: formatBytes(torrent.uploaded || 0),
        ratio: torrent.downloaded > 0 ? +(torrent.uploaded / torrent.downloaded).toFixed(2) : 0,
        pieceCount: torrent.pieces ? torrent.pieces.length : 0,
        pieceLength: formatBytes(torrent.pieceLength || 0),
        averageSpeed: formatBytes((torrent.downloadSpeed + torrent.downloadSpeed) / 2) + '/s',
        connections: torrent.numPeers || 0,
        activeTime: formatTime((Date.now() - (torrent.created?.getTime() || Date.now()))),
        wastedBytes: formatBytes(torrent.waste || 0)
      };
      
      this.metrics.set(torrent.infoHash, metrics);
    });
  }

  private applyScheduledSettings() {
    if (!this.bandwidthSettings.scheduleEnabled) return;
    
    const now = new Date();
    const currentTime = `${now.getHours()}:${now.getMinutes()}`;

    // Process scheduled actions
    scheduleManager.getActiveSchedules().forEach(schedule => {
      const torrent = this.client.torrents.find(t => t.infoHash === schedule.torrentId);
      if (!torrent) return;

      switch (schedule.action) {
        case 'start':
          if (torrent.paused) torrent.resume();
          break;
        case 'stop':
          if (!torrent.paused) torrent.pause();
          break;
        case 'limit':
          if (schedule.limitValue && torrent.throttleDownload) {
            torrent.throttleDownload(schedule.limitValue * 1024); // convert to bytes
          }
          break;
      }
    });

    // Apply peak hour bandwidth limits
    if (this.bandwidthSettings.peakHoursStart && this.bandwidthSettings.peakHoursEnd) {
      const isPeakHours = this.isTimeBetween(
        currentTime, 
        this.bandwidthSettings.peakHoursStart, 
        this.bandwidthSettings.peakHoursEnd
      );
      
      if (isPeakHours && this.bandwidthSettings.peakDownloadLimit) {
        this.setGlobalDownloadLimit(this.bandwidthSettings.peakDownloadLimit);
      } else {
        this.setGlobalDownloadLimit(this.bandwidthSettings.globalDownloadLimit);
      }
    }
  }

  private isTimeBetween(time: string, start: string, end: string): boolean {
    // Simple time comparison based on hour:minute format
    return time >= start && time <= end;
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
      peers: torrent.numPeers || 0,
      verified: this.verifiedTorrents.has(torrent.infoHash),
      added: torrent.created || new Date(),
      errorCount: this.retryAttempts.get(torrent.infoHash) || 0,
      maxBandwidth: this.getBandwidthLimit(torrent),
      priority: torrent.priority || queueManager.getPriority(torrent.infoHash)
    }));
  }

  async addTorrent(magnetUrl: string, downloadPath: string, options: { 
    maxBandwidth?: number,
    verifyPieces?: boolean,
    priority?: number,
    startImmediately?: boolean
  } = {}): Promise<TorrentInfo> {
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
        peers: existingTorrent.numPeers || 0,
        verified: this.verifiedTorrents.has(existingTorrent.infoHash),
        added: existingTorrent.created || new Date()
      };
    }

    try {
      const torrent = await new Promise<WebTorrent.Torrent>((resolve, reject) => {
        const torrentOptions: WebTorrent.TorrentOptions = { 
          path: downloadPath,
          verify: options.verifyPieces || false
        };
        
        // Don't start downloading immediately if queued
        if (options.startImmediately === false) {
          torrentOptions.paused = true;
        }
        
        const newTorrent = this.client.add(magnetUrl, torrentOptions);
        
        const errorHandler = (err: Error) => {
          reject(new Error(`Failed to add torrent: ${err.message}`));
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
        
        // Set up retry logic for this torrent
        newTorrent.on('error', (err) => {
          const currentAttempts = this.retryAttempts.get(newTorrent.infoHash) || 0;
          if (currentAttempts < 3) { // Retry up to 3 times
            this.retryAttempts.set(newTorrent.infoHash, currentAttempts + 1);
            console.log(`Retrying torrent ${newTorrent.infoHash}, attempt ${currentAttempts + 1}`);
            // Retry the torrent with a delay
            setTimeout(() => {
              this.client.add(magnetUrl, torrentOptions);
            }, 5000);
          }
        });
        
        // Set up verification
        newTorrent.on('done', () => {
          // Once download is complete, mark as verified
          this.verifiedTorrents.add(newTorrent.infoHash);
        });
        
        // Set bandwidth limit if specified
        if (options.maxBandwidth && newTorrent.throttleDownload) {
          newTorrent.throttleDownload(options.maxBandwidth * 1024); // Convert KB/s to B/s
        }
        
        // Set priority if specified
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
        verified: this.verifiedTorrents.has(torrent.infoHash),
        added: torrent.created || new Date()
      };
    } catch (error) {
      console.error('Error in addTorrent:', error);
      throw new Error(`Failed to add torrent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addTorrentFile(filePath: string, downloadPath: string, options: { 
    maxBandwidth?: number,
    verifyPieces?: boolean,
    priority?: number,
    startImmediately?: boolean
  } = {}): Promise<TorrentInfo> {
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
        const newTorrent = this.client.add(torrentBuffer, torrentOptions);
        
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
        
        // Set up retry logic, verification and bandwidth settings
        // as in addTorrent method
        newTorrent.on('done', () => {
          this.verifiedTorrents.add(newTorrent.infoHash);
        });
        
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
        verified: this.verifiedTorrents.has(torrent.infoHash),
        added: torrent.created || new Date()
      };
    } catch (error) {
      console.error('Error in addTorrentFile:', error);
      throw new Error(`Failed to add torrent file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  removeTorrent(infoHash: string, removeFiles = false): boolean {
    if (!isValidInfoHash(infoHash)) {
      return false;
    }
    
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (!torrent) return false;
    
    console.log(`Removing torrent: ${torrent.name || infoHash}`);
    console.log(`Also removing files: ${removeFiles}`);
    
    // Remove from various trackers
    this.retryAttempts.delete(infoHash);
    this.metrics.delete(infoHash);
    this.verifiedTorrents.delete(infoHash);
    queueManager.removeTorrent(infoHash);
    scheduleManager.removeSchedulesByTorrentId(infoHash);
    
    try {
      this.client.remove(infoHash, { destroyStore: removeFiles });
      return true;
    } catch (error) {
      console.error('Error removing torrent:', error);
      return false;
    }
  }

  getFileInfo(infoHash: string, fileIndex: number): { path: string, name: string } | null {
    if (!isValidInfoHash(infoHash)) {
      return null;
    }
    
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (!torrent || !torrent.files || fileIndex >= torrent.files.length) {
      return null;
    }
    
    const file = torrent.files[fileIndex];
    
    return {
      path: file.path,
      name: path.basename(file.path)
    };
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

    const files = torrent.files.map(file => {
      const selected = queueManager.isFileSelected(infoHash, file.name);
      const priority = queueManager.getFilePriority(infoHash, file.name);
      
      return {
        name: file.name,
        size: formatBytes(file.length || 0),
        progress: Math.round((file.progress || 0) * 100),
        selected: selected !== false,
        priority: priority || 'normal'
      };
    });

    const peerDetails = this.getPeerDetails(torrent);
    const metrics = this.metrics.get(infoHash) || this.createDefaultMetrics();
    const scheduledTimes = scheduleManager.getScheduleForTorrent(infoHash);

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
      files,
      peerDetails,
      metrics,
      verified: this.verifiedTorrents.has(infoHash),
      added: torrent.created || new Date(),
      bandwidthLimit: this.getBandwidthLimit(torrent),
      ipFilterEnabled: ipFilter.isEnabledForTorrent(infoHash),
      scheduledStart: scheduledTimes?.start,
      scheduledStop: scheduledTimes?.stop
    };
  }

  private getPeerDetails(torrent: WebTorrent.Torrent): PeerInfo[] {
    const peers: PeerInfo[] = [];
    
    // WARNING: This is a mock implementation since WebTorrent doesn't expose all peer details
    // In a real implementation, we would need to access the underlying bittorrent-protocol
    if (torrent.wires && torrent.wires.length > 0) {
      torrent.wires.forEach((wire, i) => {
        peers.push({
          ip: wire.remoteAddress || `192.168.1.${i + 1}`,
          port: wire.remotePort || 6881 + i,
          client: wire.peerExtendedHandshake?.v || 'Unknown Client',
          progress: wire.downloaded > 0 ? Math.min(100, Math.round((wire.downloaded / (torrent.length || 1)) * 100)) : 0,
          downloadSpeed: formatBytes(wire.downloadSpeed()) + '/s',
          uploadSpeed: formatBytes(wire.uploadSpeed()) + '/s',
          flags: this.getPeerFlags(wire),
          country: this.getCountryFromIP(wire.remoteAddress || '')
        });
      });
    }
    
    return peers;
  }
  
  private getPeerFlags(wire: any): string[] {
    const flags: string[] = [];
    if (wire.peerChoking === false) flags.push('unchoked');
    if (wire.peerInterested) flags.push('interested');
    if (wire.amChoking === false) flags.push('allowing');
    if (wire.amInterested) flags.push('downloading');
    return flags;
  }
  
  private getCountryFromIP(ip: string): string {
    // In a real implementation, this would use a GeoIP database
    return 'Unknown';
  }
  
  private createDefaultMetrics(): TorrentMetrics {
    return {
      downloadTotal: '0 B',
      uploadTotal: '0 B',
      ratio: 0,
      pieceCount: 0,
      pieceLength: '0 B',
      averageSpeed: '0 B/s',
      connections: 0,
      activeTime: '0s'
    };
  }

  // Bandwidth limiting functions
  setGlobalDownloadLimit(limitKBs: number): void {
    this.bandwidthSettings.globalDownloadLimit = limitKBs;
    this.client.throttleDownload?.(limitKBs * 1024); // Convert to bytes/sec
  }

  setGlobalUploadLimit(limitKBs: number): void {
    this.bandwidthSettings.globalUploadLimit = limitKBs;
    this.client.throttleUpload?.(limitKBs * 1024); // Convert to bytes/sec
  }

  setTorrentBandwidthLimit(infoHash: string, limitKBs: number): boolean {
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (!torrent || !torrent.throttleDownload) return false;
    
    torrent.throttleDownload(limitKBs * 1024); // Convert to bytes/sec
    return true;
  }

  getBandwidthLimit(torrent: WebTorrent.Torrent): number {
    // This is a mock implementation since WebTorrent doesn't directly expose this
    // In a real implementation, we would track this in a separate data structure
    return 0; // Unlimited
  }

  getBandwidthSettings(): BandwidthSettings {
    return this.bandwidthSettings;
  }

  updateBandwidthSettings(settings: Partial<BandwidthSettings>): BandwidthSettings {
    this.bandwidthSettings = { ...this.bandwidthSettings, ...settings };
    
    // Apply new global limits if set
    if (settings.globalDownloadLimit !== undefined) {
      this.setGlobalDownloadLimit(settings.globalDownloadLimit);
    }
    
    if (settings.globalUploadLimit !== undefined) {
      this.setGlobalUploadLimit(settings.globalUploadLimit);
    }
    
    return this.bandwidthSettings;
  }

  // File selection functions
  selectFiles(infoHash: string, fileIndices: number[]): boolean {
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (!torrent) return false;
    
    torrent.files.forEach((file, i) => {
      const selected = fileIndices.includes(i);
      file.select();
      queueManager.setFileSelected(infoHash, file.name, selected);
    });
    
    return true;
  }

  setFilePriority(infoHash: string, fileName: string, priority: 'high' | 'normal' | 'low'): boolean {
    return queueManager.setFilePriority(infoHash, fileName, priority);
  }

  // Security and verification functions
  verifyTorrent(infoHash: string): boolean {
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (!torrent || !torrent.verify) return false;
    
    torrent.verify();
    return true;
  }

  isVerified(infoHash: string): boolean {
    return this.verifiedTorrents.has(infoHash);
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
