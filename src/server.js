
import express from 'express';
import cors from 'cors';
import { torrentManager } from './server/torrentManager';
import { fileManager } from './server/fileManager';
import path from 'path';

// Check dependencies
try {
  const expressCheck = express;
  const corsCheck = cors;
  console.log('All required dependencies are installed.');
} catch (error) {
  console.error('Error: Missing dependencies. Please run "npm install" before starting the server.');
  console.error('Specific error:', error.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS
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
    const torrentList = torrentManager.getTorrents();
    console.log(`Returning ${torrentList.length} torrents`);
    res.json(torrentList);
  } catch (error) {
    console.error('Error in GET /api/torrents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/files', async (req, res) => {
  console.log('GET /api/files request received');
  try {
    const files = await fileManager.getFiles();
    console.log(`Returning ${files.length} files/folders from downloads directory`);
    res.json(files);
  } catch (error) {
    console.error('Error in GET /api/files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/torrents/add', async (req, res) => {
  const { magnetUrl } = req.body;
  console.log('POST /api/torrents/add request received with:', magnetUrl ? 'Valid magnet URL' : 'Missing magnet URL');
  
  if (!magnetUrl) {
    return res.status(400).json({ error: 'Magnet URL is required' });
  }

  try {
    const result = await torrentManager.addTorrent(magnetUrl, fileManager.getDownloadsPath());
    res.json(result);
  } catch (error) {
    console.error('Error adding torrent:', error);
    res.status(500).json({ error: `Failed to add torrent: ${error.message}` });
  }
});

app.post('/api/torrents/:id/pause', (req, res) => {
  const { id } = req.params;
  try {
    const success = torrentManager.pauseTorrent(id);
    if (success) {
      res.json({ success: true, status: 'paused' });
    } else {
      res.status(404).json({ error: 'Torrent not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/torrents/:id/resume', (req, res) => {
  const { id } = req.params;
  try {
    const success = torrentManager.resumeTorrent(id);
    if (success) {
      res.json({ success: true, status: 'downloading' });
    } else {
      res.status(404).json({ error: 'Torrent not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/torrents/:id', (req, res) => {
  const { id } = req.params;
  try {
    const details = torrentManager.getTorrentDetails(id);
    if (details) {
      res.json(details);
    } else {
      res.status(404).json({ error: 'Torrent not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server listening on all interfaces (0.0.0.0)`);
  console.log(`Try accessing: http://localhost:${PORT}/api/torrents`);
  console.log(`Downloads will be saved to: ${fileManager.getDownloadsPath()}`);
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

async function gracefulShutdown() {
  console.log('Shutting down server gracefully...');
  server.close(async () => {
    console.log('Server closed.');
    await torrentManager.destroy();
    console.log('WebTorrent client destroyed.');
    process.exit(0);
  });
  
  // Force exit after 10 seconds if cleanup is taking too long
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

export default app;
