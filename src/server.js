import express from 'express';
import cors from 'cors';
import { torrentManager } from './server/torrentManager.js';
import { fileManager } from './server/fileManager.js';
import { ipFilter } from './server/ipFilter.js';
import { queueManager } from './server/queueManager.js';
import { scheduleManager } from './server/scheduleManager.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const { magnetUrl, options = {} } = req.body;
  console.log('POST /api/torrents/add request received with:', magnetUrl ? 'Valid magnet URL' : 'Missing magnet URL');
  
  if (!magnetUrl) {
    return res.status(400).json({ error: 'Magnet URL is required' });
  }

  try {
    const result = await torrentManager.addTorrent(
      magnetUrl, 
      fileManager.getDownloadsPath(),
      options
    );
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

// Bandwidth limiting
app.get('/api/bandwidth', (req, res) => {
  try {
    const settings = torrentManager.getBandwidthSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/bandwidth', (req, res) => {
  try {
    const settings = torrentManager.updateBandwidthSettings(req.body);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/torrents/:id/bandwidth', (req, res) => {
  const { id } = req.params;
  const { limit } = req.body;
  
  if (typeof limit !== 'number') {
    return res.status(400).json({ error: 'Bandwidth limit must be a number' });
  }
  
  try {
    const success = torrentManager.setTorrentBandwidthLimit(id, limit);
    if (success) {
      res.json({ success: true, limit });
    } else {
      res.status(404).json({ error: 'Torrent not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// IP Filtering
app.get('/api/ipfilter', (req, res) => {
  try {
    const rules = ipFilter.getRules();
    res.json({
      enabled: ipFilter.isEnabled(),
      rules
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/ipfilter', (req, res) => {
  try {
    const { range, description, blocked } = req.body;
    if (!range) {
      return res.status(400).json({ error: 'IP range is required' });
    }
    
    const newRule = ipFilter.addRule({ range, description: description || '', blocked: !!blocked });
    res.json(newRule);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/ipfilter/:id', (req, res) => {
  const { id } = req.params;
  try {
    const success = ipFilter.updateRule(id, req.body);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Rule not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/ipfilter/:id', (req, res) => {
  const { id } = req.params;
  try {
    const success = ipFilter.deleteRule(id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Rule not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/ipfilter/enable', (req, res) => {
  try {
    ipFilter.enableFilters();
    res.json({ success: true, enabled: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/ipfilter/disable', (req, res) => {
  try {
    ipFilter.disableFilters();
    res.json({ success: true, enabled: false });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Queue Management
app.get('/api/queue', (req, res) => {
  try {
    const queue = queueManager.getQueue();
    res.json({
      maxConcurrent: queueManager.getMaxConcurrent(),
      queue
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/queue/max', (req, res) => {
  const { value } = req.body;
  if (typeof value !== 'number' || value < 1) {
    return res.status(400).json({ error: 'Max concurrent downloads must be a positive number' });
  }
  
  try {
    queueManager.setMaxConcurrent(value);
    res.json({ success: true, maxConcurrent: value });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/torrents/:id/priority', (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;
  
  if (typeof priority !== 'number') {
    return res.status(400).json({ error: 'Priority must be a number' });
  }
  
  try {
    const success = queueManager.setPriority(id, priority);
    if (success) {
      res.json({ success: true, priority });
    } else {
      res.status(404).json({ error: 'Torrent not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/torrents/:id/files', (req, res) => {
  const { id } = req.params;
  const { fileIndices } = req.body;
  
  if (!Array.isArray(fileIndices)) {
    return res.status(400).json({ error: 'File indices must be an array' });
  }
  
  try {
    const success = torrentManager.selectFiles(id, fileIndices);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Torrent not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/torrents/:id/files/:fileName/priority', (req, res) => {
  const { id, fileName } = req.params;
  const { priority } = req.body;
  
  if (!['high', 'normal', 'low'].includes(priority)) {
    return res.status(400).json({ error: 'Priority must be one of: high, normal, low' });
  }
  
  try {
    const success = torrentManager.setFilePriority(id, fileName, priority);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Torrent or file not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Scheduler
app.get('/api/schedule', (req, res) => {
  try {
    const schedules = scheduleManager.getSchedules();
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/schedule', (req, res) => {
  try {
    const { torrentId, action, time, days, active, limitValue } = req.body;
    
    if (!torrentId || !action || !time || !Array.isArray(days)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newSchedule = scheduleManager.addSchedule({
      torrentId,
      action,
      time,
      days,
      active: active !== false,
      limitValue
    });
    
    res.json(newSchedule);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/schedule/:id', (req, res) => {
  const { id } = req.params;
  try {
    const success = scheduleManager.updateSchedule(id, req.body);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Schedule not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/schedule/:id', (req, res) => {
  const { id } = req.params;
  try {
    const success = scheduleManager.deleteSchedule(id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Schedule not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
const serverInstance = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server listening on all interfaces (0.0.0.0)`);
  console.log(`Try accessing: http://localhost:${PORT}/api/torrents`);
  console.log(`Downloads will be saved to: ${fileManager.getDownloadsPath()}`);
});

// Handle server errors
serverInstance.on('error', (error) => {
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
  serverInstance.close(async () => {
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
