
const express = require('express');
const cors = require('cors');
const WebTorrent = require('webtorrent');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, '../downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Initialize WebTorrent client
const client = new WebTorrent();
const torrents = {};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.get('/api/torrents', (req, res) => {
  const torrentList = client.torrents.map(torrent => {
    return {
      id: torrent.infoHash,
      name: torrent.name,
      size: formatBytes(torrent.length),
      progress: Math.round(torrent.progress * 100),
      status: getStatus(torrent),
      speed: `${formatBytes(torrent.downloadSpeed)}/s`,
      uploadSpeed: `${formatBytes(torrent.uploadSpeed)}/s`,
      peers: torrent.numPeers
    };
  });
  
  res.json(torrentList);
});

app.post('/api/torrents/add', (req, res) => {
  const { magnetUrl } = req.body;
  
  if (!magnetUrl) {
    return res.status(400).json({ error: 'Magnet URL is required' });
  }

  try {
    client.add(magnetUrl, { path: downloadsDir }, torrent => {
      torrent.on('ready', () => {
        console.log(`Torrent added: ${torrent.name}`);
      });

      torrent.on('download', () => {
        // Progress update events
        console.log(`Progress: ${Math.round(torrent.progress * 100)}%`);
      });

      torrent.on('done', () => {
        console.log(`Torrent completed: ${torrent.name}`);
      });

      torrent.on('error', err => {
        console.error(`Torrent error: ${err.message}`);
      });

      res.json({
        id: torrent.infoHash,
        name: torrent.name,
        size: formatBytes(torrent.length),
        progress: Math.round(torrent.progress * 100),
        status: getStatus(torrent)
      });
    });
  } catch (error) {
    console.error('Error adding torrent:', error);
    res.status(500).json({ error: 'Failed to add torrent' });
  }
});

app.post('/api/torrents/:id/pause', (req, res) => {
  const { id } = req.params;
  const torrent = client.torrents.find(t => t.infoHash === id);
  
  if (!torrent) {
    return res.status(404).json({ error: 'Torrent not found' });
  }
  
  torrent.pause();
  res.json({ success: true, status: 'paused' });
});

app.post('/api/torrents/:id/resume', (req, res) => {
  const { id } = req.params;
  const torrent = client.torrents.find(t => t.infoHash === id);
  
  if (!torrent) {
    return res.status(404).json({ error: 'Torrent not found' });
  }
  
  torrent.resume();
  res.json({ success: true, status: 'downloading' });
});

app.get('/api/torrents/:id', (req, res) => {
  const { id } = req.params;
  const torrent = client.torrents.find(t => t.infoHash === id);
  
  if (!torrent) {
    return res.status(404).json({ error: 'Torrent not found' });
  }
  
  const files = torrent.files.map(file => {
    return {
      name: file.name,
      size: formatBytes(file.length),
      progress: Math.round(file.progress * 100)
    };
  });
  
  res.json({
    id: torrent.infoHash,
    name: torrent.name,
    size: formatBytes(torrent.length),
    progress: Math.round(torrent.progress * 100),
    status: getStatus(torrent),
    downloadSpeed: formatBytes(torrent.downloadSpeed) + '/s',
    uploadSpeed: formatBytes(torrent.uploadSpeed) + '/s',
    timeRemaining: formatTime(torrent.timeRemaining),
    peers: torrent.numPeers,
    files: files
  });
});

// Helper functions
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatTime(ms) {
  if (!ms || !isFinite(ms)) return 'Unknown';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function getStatus(torrent) {
  if (torrent.paused) return 'Paused';
  if (torrent.done) return 'Seeding';
  return 'Downloading';
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Downloads will be saved to: ${downloadsDir}`);
});

module.exports = app;
