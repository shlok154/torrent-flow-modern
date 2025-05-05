
// JavaScript implementation of TorrentManager.ts
import WebTorrent from 'webtorrent';
import { formatBytes, formatTime, getStatus, isValidInfoHash } from '../utils.js';
import { ipFilter } from '../ipFilter.js';
import { scheduleManager } from '../scheduleManager.js';
import { queueManager } from '../queueManager.js';
import { updateMetrics } from './metricsManager.js';
import { applyScheduledSettings } from './scheduleHelper.js';
import { getFileInfo, handleTorrentFile } from './fileManager.js';
import { setupTorrentEvents, setupRetryLogic } from './eventHandlers.js';

// Helper function for creating default metrics
const createDefaultMetrics = () => ({
  downloadTotal: '0 B',
  uploadTotal: '0 B',
  ratio: 0,
  pieceCount: 0,
  pieceLength: '0 B',
  averageSpeed: '0 B/s',
  connections: 0,
  activeTime: '0s',
  wastedBytes: '0 B'
});

// Helper function for getting peer details
const getPeerDetails = (torrent) => {
  if (!torrent || !torrent.wires || !Array.isArray(torrent.wires)) {
    return [];
  }
  
  return torrent.wires.map(wire => ({
    address: wire.remoteAddress,
    connectionType: wire.type || 'unknown',
    downloadSpeed: formatBytes(wire.downloadSpeed || 0) + '/s',
    uploadSpeed: formatBytes(wire.uploadSpeed || 0) + '/s',
    requests: wire.requests?.length || 0,
    peerInterested: !!wire.peerInterested,
    peerChoking: !!wire.peerChoking
  }));
};

class TorrentManager {
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

  setupEventListeners() {
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

  updateMetrics() {
    updateMetrics(this.client.torrents, this.metrics);
  }

  applyScheduledSettings() {
    if (!this.bandwidthSettings.scheduleEnabled) return;
    applyScheduledSettings(
      this.client.torrents, 
      this.bandwidthSettings, 
      (limit) => this.setGlobalDownloadLimit(limit)
    );
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
      peers: torrent.numPeers || 0,
      verified: this.verifiedTorrents.has(torrent.infoHash),
      added: torrent.created || new Date(),
      errorCount: this.retryAttempts.get(torrent.infoHash) || 0,
      maxBandwidth: this.getBandwidthLimit(torrent),
      priority: torrent.priority || queueManager.getPriority(torrent.infoHash)
    }));
  }

  async addTorrent(magnetUrl, downloadPath, options = {}) {
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
      const torrent = await new Promise((resolve, reject) => {
        const torrentOptions = { 
          path: downloadPath,
          verify: options.verifyPieces || false
        };
        
        // Don't start downloading immediately if queued
        if (options.startImmediately === false) {
          torrentOptions.paused = true;
        }
        
        const newTorrent = this.client.add(magnetUrl, torrentOptions);
        
        const errorHandler = (err) => {
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
        setupRetryLogic(newTorrent, magnetUrl, torrentOptions, this.retryAttempts, this.client);
        
        // Set up verification
        setupTorrentEvents(newTorrent, this.verifiedTorrents);
        
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

  async addTorrentFile(filePath, downloadPath, options = {}) {
    return handleTorrentFile(
      filePath, 
      downloadPath, 
      options, 
      this.client, 
      this.retryAttempts, 
      this.verifiedTorrents
    );
  }

  removeTorrent(infoHash, removeFiles = false) {
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

  getFileInfo(infoHash, fileIndex) {
    return getFileInfo(infoHash, this.client, fileIndex);
  }

  pauseTorrent(infoHash) {
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (!torrent) return false;
    
    torrent.pause();
    return true;
  }

  resumeTorrent(infoHash) {
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (!torrent) return false;
    
    torrent.resume();
    return true;
  }

  getTorrentDetails(infoHash) {
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

    const peerDetails = getPeerDetails(torrent);
    const metrics = this.metrics.get(infoHash) || createDefaultMetrics();
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

  setGlobalDownloadLimit(limitKBs) {
    this.bandwidthSettings.globalDownloadLimit = limitKBs;
    this.client.throttleDownload?.(limitKBs * 1024); // Convert to bytes/sec
  }

  setGlobalUploadLimit(limitKBs) {
    this.bandwidthSettings.globalUploadLimit = limitKBs;
    this.client.throttleUpload?.(limitKBs * 1024); // Convert to bytes/sec
  }

  setTorrentBandwidthLimit(infoHash, limitKBs) {
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (!torrent || !torrent.throttleDownload) return false;
    
    torrent.throttleDownload(limitKBs * 1024); // Convert to bytes/sec
    return true;
  }

  getBandwidthLimit(torrent) {
    // This is a mock implementation since WebTorrent doesn't directly expose this
    // In a real implementation, we would track this in a separate data structure
    return 0; // Unlimited
  }

  getBandwidthSettings() {
    return this.bandwidthSettings;
  }

  updateBandwidthSettings(settings) {
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

  selectFiles(infoHash, fileIndices) {
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (!torrent) return false;
    
    torrent.files.forEach((file, i) => {
      const selected = fileIndices.includes(i);
      file.select();
      queueManager.setFileSelected(infoHash, file.name, selected);
    });
    
    return true;
  }

  setFilePriority(infoHash, fileName, priority) {
    return queueManager.setFilePriority(infoHash, fileName, priority);
  }

  verifyTorrent(infoHash) {
    const torrent = this.client.torrents.find(t => t.infoHash === infoHash);
    if (!torrent || !torrent.verify) return false;
    
    torrent.verify();
    return true;
  }

  isVerified(infoHash) {
    return this.verifiedTorrents.has(infoHash);
  }

  async destroy() {
    return new Promise((resolve) => {
      this.client.destroy(() => {
        resolve();
      });
    });
  }

  getClient() {
    return this.client;
  }
}

export { TorrentManager };
