
// JavaScript implementation of torrentUtils
import path from 'path';
import { formatBytes } from '../utils.js';

export const createDefaultMetrics = () => {
  return {
    downloadTotal: '0 B',
    uploadTotal: '0 B',
    ratio: 0,
    pieceCount: 0,
    pieceLength: '0 B',
    averageSpeed: '0 B/s',
    connections: 0,
    activeTime: '0s',
    wastedBytes: '0 B'
  };
};

export const getPeerDetails = (torrent) => {
  const peers = [];
  
  // Handle peer details extraction
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
};

const getPeerFlags = (wire) => {
  const flags = [];
  if (wire.peerChoking === false) flags.push('unchoked');
  if (wire.peerInterested) flags.push('interested');
  if (wire.amChoking === false) flags.push('allowing');
  if (wire.amInterested) flags.push('downloading');
  return flags;
};

const getCountryFromIP = (ip) => {
  // In a real implementation, this would use a GeoIP database
  return 'Unknown';
};
