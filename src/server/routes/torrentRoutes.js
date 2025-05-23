import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { torrentManager } from '../torrentManager.js';
import { fileManager } from '../fileManager.js';
import multer from 'multer';
import { generateUID } from '../utils.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer for handling torrent file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const tempDir = path.join(__dirname, '../../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function(req, file, cb) {
    const uniqueFilename = `${Date.now()}-${generateUID()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only accept .torrent files
    if (path.extname(file.originalname).toLowerCase() === '.torrent') {
      cb(null, true);
    } else {
      cb(new Error('Only .torrent files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Get all torrents
router.get('/', (req, res) => {
  try {
    const torrents = torrentManager.getTorrents();
    res.json(torrents);
  } catch (error) {
    console.error('Error getting torrents:', error);
    res.status(500).json({ error: 'Failed to get torrents' });
  }
});

// Get detailed information about a specific torrent
router.get('/:id', (req, res) => {
  try {
    const torrentId = req.params.id;
    const details = torrentManager.getTorrentDetails(torrentId);
    
    if (details) {
      res.json(details);
    } else {
      res.status(404).json({ error: 'Torrent not found' });
    }
  } catch (error) {
    console.error('Error getting torrent details:', error);
    res.status(500).json({ error: 'Failed to get torrent details' });
  }
});

// Add a torrent via magnet link
router.post('/add', async (req, res) => {
  try {
    const { magnetUrl, options } = req.body;
    
    if (!magnetUrl) {
      return res.status(400).json({ error: 'Magnet URL is required' });
    }
    
    // Ensure we have additional trackers
    const enhancedOptions = {
      ...options,
      announce: [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://open.tracker.cl:1337/announce',
        'udp://9.rarbg.com:2810/announce',
        'udp://tracker.openbittorrent.com:6969/announce',
        'http://tracker.openbittorrent.com:80/announce'
      ]
    };
    
    const downloadPath = fileManager.getDownloadsPath();
    const torrent = await torrentManager.addTorrent(magnetUrl, downloadPath, enhancedOptions);
    
    // Manually announce to trackers after adding
    const addedTorrent = torrentManager.client.torrents.find(t => t.infoHash === torrent.id);
    if (addedTorrent) {
      addedTorrent.announce();
    }
    
    res.status(201).json(torrent);
  } catch (error) {
    console.error('Error adding torrent:', error);
    res.status(500).json({ error: error.message || 'Failed to add torrent' });
  }
});

// Upload a .torrent file
router.post('/upload', upload.single('torrent'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Torrent file is required' });
    }
    
    const filePath = req.file.path;
    const downloadPath = fileManager.getDownloadsPath();
    
    // Parse options with additional trackers
    const optionsStr = req.body.options || '{}';
    const parsedOptions = typeof optionsStr === 'string' ? JSON.parse(optionsStr) : optionsStr;
    
    const enhancedOptions = {
      ...parsedOptions,
      announce: [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://open.tracker.cl:1337/announce',
        'udp://9.rarbg.com:2810/announce',
        'udp://tracker.openbittorrent.com:6969/announce',
        'http://tracker.openbittorrent.com:80/announce'
      ]
    };
    
    const torrent = await torrentManager.addTorrentFile(filePath, downloadPath, enhancedOptions);
    
    // Manually announce to trackers after adding
    const addedTorrent = torrentManager.client.torrents.find(t => t.infoHash === torrent.id);
    if (addedTorrent) {
      addedTorrent.announce();
    }
    
    // Remove the temporary file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error removing temp file:', err);
    });
    
    res.status(201).json(torrent);
  } catch (error) {
    console.error('Error uploading torrent file:', error);
    res.status(500).json({ error: error.message || 'Failed to upload torrent file' });
    
    // Clean up the file in case of error
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

// Force announce a torrent to trackers
router.post('/:id/announce', (req, res) => {
  try {
    const torrentId = req.params.id;
    const torrent = torrentManager.client.torrents.find(t => t.infoHash === torrentId);
    
    if (!torrent) {
      return res.status(404).json({ error: 'Torrent not found' });
    }
    
    // Force announce to all trackers
    torrent.announce();
    
    res.json({ success: true, message: 'Announcing to trackers' });
  } catch (error) {
    console.error('Error announcing torrent:', error);
    res.status(500).json({ error: 'Failed to announce torrent' });
  }
});

// Add more trackers to a torrent
router.post('/:id/trackers', (req, res) => {
  try {
    const torrentId = req.params.id;
    const { trackers } = req.body;
    
    if (!Array.isArray(trackers) || trackers.length === 0) {
      return res.status(400).json({ error: 'trackers must be a non-empty array' });
    }
    
    const torrent = torrentManager.client.torrents.find(t => t.infoHash === torrentId);
    
    if (!torrent) {
      return res.status(404).json({ error: 'Torrent not found' });
    }
    
    // Add each tracker
    trackers.forEach(tracker => {
      torrent.addTrackers([tracker]);
    });
    
    // Force announce after adding
    torrent.announce();
    
    res.json({ success: true, message: 'Trackers added and announced' });
  } catch (error) {
    console.error('Error adding trackers:', error);
    res.status(500).json({ error: 'Failed to add trackers' });
  }
});

// Remove a torrent
router.delete('/:id', (req, res) => {
  try {
    const torrentId = req.params.id;
    const removeFiles = req.query.removeFiles === 'true';
    
    const removed = torrentManager.removeTorrent(torrentId, removeFiles);
    
    if (removed) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Torrent not found or could not be removed' });
    }
  } catch (error) {
    console.error('Error removing torrent:', error);
    res.status(500).json({ error: 'Failed to remove torrent' });
  }
});

// Pause a torrent
router.post('/:id/pause', (req, res) => {
  try {
    const torrentId = req.params.id;
    const paused = torrentManager.pauseTorrent(torrentId);
    
    if (paused) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Torrent not found or could not be paused' });
    }
  } catch (error) {
    console.error('Error pausing torrent:', error);
    res.status(500).json({ error: 'Failed to pause torrent' });
  }
});

// Resume a torrent
router.post('/:id/resume', (req, res) => {
  try {
    const torrentId = req.params.id;
    const resumed = torrentManager.resumeTorrent(torrentId);
    
    if (resumed) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Torrent not found or could not be resumed' });
    }
  } catch (error) {
    console.error('Error resuming torrent:', error);
    res.status(500).json({ error: 'Failed to resume torrent' });
  }
});

// Select which files to download
router.post('/:id/files', (req, res) => {
  try {
    const torrentId = req.params.id;
    const { fileIndices } = req.body;
    
    if (!Array.isArray(fileIndices)) {
      return res.status(400).json({ error: 'fileIndices must be an array' });
    }
    
    const success = torrentManager.selectFiles(torrentId, fileIndices);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Torrent not found or files could not be selected' });
    }
  } catch (error) {
    console.error('Error selecting files:', error);
    res.status(500).json({ error: 'Failed to select files' });
  }
});

// Optimize piece selection
router.post('/:id/optimize', (req, res) => {
  try {
    const torrentId = req.params.id;
    const torrent = torrentManager.client.torrents.find(t => t.infoHash === torrentId);
    
    if (!torrent) {
      return res.status(404).json({ error: 'Torrent not found' });
    }
    
    // Configure for better performance
    if (torrent._selections) {
      // Clear existing selections and use rarest-first
      torrent._selections = [];
      
      // Request all pieces in rarest-first order
      torrent.select(0, torrent.pieces.length - 1, 1, true);
    }
    
    // Increase concurrent webseed connections if available
    if (torrent._webseedNumSlots) {
      torrent._webseedNumSlots = 10;
    }
    
    res.json({ success: true, message: 'Torrent piece selection optimized' });
  } catch (error) {
    console.error('Error optimizing torrent:', error);
    res.status(500).json({ error: 'Failed to optimize torrent' });
  }
});

// Download a specific file
router.get('/:id/files/:index', (req, res) => {
  try {
    const torrentId = req.params.id;
    const fileIndex = parseInt(req.params.index, 10);
    
    const fileInfo = torrentManager.getFileInfo(torrentId, fileIndex);
    
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(fileInfo.path, fileInfo.name, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file' });
        }
      }
    });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

export default router;
