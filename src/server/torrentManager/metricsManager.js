
// JavaScript implementation of metricsManager
import { formatBytes, formatTime } from '../utils.js';

export const updateMetrics = (torrents, metricsMap) => {
  torrents.forEach(torrent => {
    const metrics = {
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
    
    metricsMap.set(torrent.infoHash, metrics);
  });
};
