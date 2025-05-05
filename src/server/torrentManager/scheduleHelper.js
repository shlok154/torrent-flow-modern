
// JavaScript implementation of scheduleHelper
import { scheduleManager } from '../scheduleManager.js';

export const applyScheduledSettings = (torrents, bandwidthSettings, setGlobalDownloadLimit) => {
  const now = new Date();
  const currentTime = `${now.getHours()}:${now.getMinutes()}`;

  // Process scheduled actions
  scheduleManager.getActiveSchedules().forEach(schedule => {
    const torrent = torrents.find(t => t.infoHash === schedule.torrentId);
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
  if (bandwidthSettings.peakHoursStart && bandwidthSettings.peakHoursEnd) {
    const isPeakHours = isTimeBetween(
      currentTime, 
      bandwidthSettings.peakHoursStart, 
      bandwidthSettings.peakHoursEnd
    );
    
    if (isPeakHours && bandwidthSettings.peakDownloadLimit) {
      setGlobalDownloadLimit(bandwidthSettings.peakDownloadLimit);
    } else {
      setGlobalDownloadLimit(bandwidthSettings.globalDownloadLimit);
    }
  }
};

export const isTimeBetween = (time, start, end) => {
  // Simple time comparison based on hour:minute format
  return time >= start && time <= end;
};
