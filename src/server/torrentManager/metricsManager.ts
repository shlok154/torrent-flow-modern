
import type WebTorrent from 'webtorrent';
import { formatBytes, formatTime } from '../utils';
import { TorrentMetrics } from '../../types/torrent';

export function updateMetrics(torrents: WebTorrent.Torrent[], metricsMap: Map<string, TorrentMetrics>): void {
  torrents.forEach(torrent => {
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
    
    metricsMap.set(torrent.infoHash, metrics);
  });
}
