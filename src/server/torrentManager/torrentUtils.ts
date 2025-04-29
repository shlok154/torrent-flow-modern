
import type WebTorrent from 'webtorrent';
import { formatBytes } from '../utils';
import { PeerInfo, TorrentMetrics } from '../../types/torrent';

export function createDefaultMetrics(): TorrentMetrics {
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

export function getPeerDetails(torrent: WebTorrent.Torrent): PeerInfo[] {
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
        flags: getPeerFlags(wire),
        country: getCountryFromIP(wire.remoteAddress || '')
      });
    });
  }
  
  return peers;
}

function getPeerFlags(wire: any): string[] {
  const flags: string[] = [];
  if (wire.peerChoking === false) flags.push('unchoked');
  if (wire.peerInterested) flags.push('interested');
  if (wire.amChoking === false) flags.push('allowing');
  if (wire.amInterested) flags.push('downloading');
  return flags;
}

function getCountryFromIP(ip: string): string {
  // In a real implementation, this would use a GeoIP database
  return 'Unknown';
}
