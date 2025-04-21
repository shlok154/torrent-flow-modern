import express from 'express';
import cors from 'cors';
import WebTorrent from 'webtorrent';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Check if dependencies are properly installed
try {
  // These will throw errors if dependencies are missing
  const expressCheck = express;
  const corsCheck = cors;
  const webtorrentCheck = WebTorrent;
  console.log('All required dependencies are installed.');
} catch (error) {
  console.error('Error: Missing dependencies. Please run "npm install" before starting the server.');
  console.error('Specific error:', error.message);
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, '../downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Initialize WebTorrent client
const client = new WebTorrent();

// Configure CORS more explicitly
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.get('/api/torrents', (req, res) => {
  console.log('GET /api/torrents request received');
  try {
    const torrentList = client.torrents.map(torrent => {
      return {
        id: torrent.infoHash,
        name: torrent.name || 'Unknown',
        size: formatBytes(torrent.length || 0),
        progress: Math.round((torrent.progress || 0) * 100),
        status: getStatus(torrent),
        speed: `${formatBytes(torrent.downloadSpeed || 0)}/s`,
        uploadSpeed: `${formatBytes(torrent.uploadSpeed || 0)}/s`,
        peers: torrent.numPeers || 0
      };
    });
    
    console.log(`Returning ${torrentList.length} torrents`);
    res.json(torrentList);
  } catch (error) {
    console.error('Error in GET /api/torrents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NEW API endpoint for getting files in downloads directory
app.get('/api/files', (req, res) => {
  console.log('GET /api/files request received');
  try {
    const files = [];
    
    // Read the downloads directory
    fs.readdir(downloadsDir, { withFileTypes: true }, (err, dirEntries) => {
      if (err) {
        console.error('Error reading downloads directory:', err);
        return res.status(500).json({ error: 'Failed to read downloads directory' });
      }
      
      let processedCount = 0;
      
      // If directory is empty
      if (dirEntries.length === 0) {
        console.log('Downloads directory is empty');
        return res.json([]);
      }
      
      // Process each directory entry
      dirEntries.forEach(entry => {
        const entryPath = path.join(downloadsDir, entry.name);
        
        fs.stat(entryPath, (err, stats) => {
          if (err) {
            console.error(`Error getting stats for ${entry.name}:`, err);
          } else {
            const fileInfo = {
              name: entry.name,
              type: entry.isDirectory() ? 'folder' : 'file',
              size: formatBytes(stats.size),
              date: stats.mtime.toISOString().split('T')[0] // Format: YYYY-MM-DD
            };
            
            files.push(fileInfo);
          }
          
          // Check if this is the last entry to process
          processedCount++;
          if (processedCount === dirEntries.length) {
            console.log(`Returning ${files.length} files/folders from downloads directory`);
            res.json(files);
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in GET /api/files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/torrents/add', (req, res) => {
  const { magnetUrl } = req.body;
  
  console.log('POST /api/torrents/add request received with:', magnetUrl ? 'Valid magnet URL' : 'Missing magnet URL');
  
  if (!magnetUrl) {
    return res.status(400).json({ error: 'Magnet URL is required' });
  }

  try {
    // Check if torrent already exists by looking at magnet URI
    const existingTorrent = client.torrents.find(t => {
      // Compare by magnet URI or infoHash if available
      return t.magnetURI === magnetUrl || 
             (t.infoHash && magnetUrl.includes(t.infoHash));
    });

    if (existingTorrent) {
      console.log(`Torrent already exists: ${existingTorrent.name || 'Unknown'}`);
      return res.json({
        id: existingTorrent.infoHash,
        name: existingTorrent.name || 'Unknown',
        size: formatBytes(existingTorrent.length || 0),
        progress: Math.round((existingTorrent.progress || 0) * 100),
        status: getStatus(existingTorrent),
        message: 'Torrent already added'
      });
    }
    
    // Add some debug logging
    console.log('Adding new torrent with magnet URL:', magnetUrl);
    
    // Set a timeout for torrent addition
    const torrentTimeout = setTimeout(() => {
      console.error('Torrent addition timed out');
      return res.status(408).json({ error: 'Torrent addition timed out' });
    }, 30000); // 30 second timeout
    
    client.add(magnetUrl, { path: downloadsDir }, torrent => {
      // Clear the timeout since we got a response
      clearTimeout(torrentTimeout);
      
      console.log(`Torrent added successfully: ${torrent.name || 'Unknown'}`);
      
      torrent.on('ready', () => {
        console.log(`Torrent ready: ${torrent.name}`);
      });

      torrent.on('download', () => {
        // Progress update events
        const progress = Math.round((torrent.progress || 0) * 100);
        if (progress % 10 === 0) { // Log only at 10% intervals to reduce spam
          console.log(`Progress: ${progress}%`);
        }
      });

      torrent.on('done', () => {
        console.log(`Torrent completed: ${torrent.name}`);
      });

      torrent.on('error', err => {
        console.error(`Torrent error: ${err.message}`);
      });

      res.json({
        id: torrent.infoHash,
        name: torrent.name || 'Unknown',
        size: formatBytes(torrent.length || 0),
        progress: Math.round((torrent.progress || 0) * 100),
        status: getStatus(torrent)
      });
    }).on('error', err => {
      // Handle errors during torrent addition
      clearTimeout(torrentTimeout);
      console.error('Error while adding torrent:', err.message);
      res.status(500).json({ error: `Failed to add torrent: ${err.message}` });
    });
  } catch (error) {
    console.error('Exception adding torrent:', error);
    res.status(500).json({ error: `Exception adding torrent: ${error.message}` });
  }
});

app.post('/api/torrents/:id/pause', (req, res) => {
  const { id } = req.params;
  try {
    const torrent = client.torrents.find(t => t.infoHash === id);
    
    if (!torrent) {
      return res.status(404).json({ error: 'Torrent not found' });
    }
    
    torrent.pause();
    res.json({ success: true, status: 'paused' });
  } catch (error) {
    console.error('Error pausing torrent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/torrents/:id/resume', (req, res) => {
  const { id } = req.params;
  try {
    const torrent = client.torrents.find(t => t.infoHash === id);
    
    if (!torrent) {
      return res.status(404).json({ error: 'Torrent not found' });
    }
    
    torrent.resume();
    res.json({ success: true, status: 'downloading' });
  } catch (error) {
    console.error('Error resuming torrent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/torrents/:id', (req, res) => {
  const { id } = req.params;
  try {
    const torrent = client.torrents.find(t => t.infoHash === id);
    
    if (!torrent) {
      return res.status(404).json({ error: 'Torrent not found' });
    }
    
    const files = torrent.files.map(file => {
      return {
        name: file.name,
        size: formatBytes(file.length || 0),
        progress: Math.round((file.progress || 0) * 100)
      };
    });
    
    res.json({
      id: torrent.infoHash,
      name: torrent.name || 'Unknown',
      size: formatBytes(torrent.length || 0),
      progress: Math.round((torrent.progress || 0) * 100),
      status: getStatus(torrent),
      downloadSpeed: formatBytes(torrent.downloadSpeed || 0) + '/s',
      uploadSpeed: formatBytes(torrent.uploadSpeed || 0) + '/s',
      timeRemaining: formatTime(torrent.timeRemaining),
      peers: torrent.numPeers || 0,
      files: files
    });
  } catch (error) {
    console.error('Error getting torrent details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server listening on all interfaces (0.0.0.0)`);
  console.log(`Try accessing: http://localhost:${PORT}/api/torrents`);
  console.log(`Downloads will be saved to: ${downloadsDir}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try using a different port.`);
    process.exit(1);
  }
});

// Handle process termination signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

function gracefulShutdown() {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    console.log('Server closed.');
    // Destroy WebTorrent client properly
    client.destroy(() => {
      console.log('WebTorrent client destroyed.');
      process.exit(0);
    });
  });
  
  // Force exit after 10 seconds if cleanup is taking too long
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

export default app;
