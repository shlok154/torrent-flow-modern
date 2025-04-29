
import express from 'express';
import { torrentManager } from '../torrentManager.js';
import { fileManager } from '../fileManager.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { generateUID } from '../utils.js';

const router = express.Router();

// Configure multer for .torrent file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${generateUID()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/x-bittorrent' || path.extname(file.originalname) === '.torrent') {
      cb(null, true);
    } else {
      cb(new Error('Only .torrent files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// GET /api/torrents - Get all torrents
router.get('/', (req, res) => {
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

// POST /api/torrents/add - Add torrent by magnet link
router.post('/add', async (req, res) => {
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

// POST /api/torrents/upload - Upload .torrent file
router.post('/upload', upload.single('torrentFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No torrent file uploaded' });
    }
    
    const filePath = req.file.path;
    console.log(`Torrent file uploaded to ${filePath}`);
    
    const result = await torrentManager.addTorrentFile(
      filePath,
      fileManager.getDownloadsPath(),
      req.body.options ? JSON.parse(req.body.options) : {}
    );
    
    // Clean up the uploaded file after adding it to the client
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting torrent file:', err);
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error uploading torrent file:', error);
    res.status(500).json({ error: `Failed to add torrent file: ${error.message}` });
  }
});

// GET /api/torrents/:id - Get torrent details
router.get('/:id', (req, res) => {
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

// DELETE /api/torrents/:id - Remove torrent
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { removeFiles = false } = req.query;
  
  try {
    const success = torrentManager.removeTorrent(id, removeFiles === 'true');
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Torrent not found' });
    }
  } catch (error) {
    console.error('Error removing torrent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/torrents/:id/pause - Pause torrent
router.post('/:id/pause', (req, res) => {
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

// POST /api/torrents/:id/resume - Resume torrent
router.post('/:id/resume', (req, res) => {
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

// POST /api/torrents/:id/files - Select files to download
router.post('/:id/files', (req, res) => {
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

// GET /api/torrents/:id/files/:index - Download a file directly
router.get('/:id/files/:index', (req, res) => {
  const { id, index } = req.params;
  
  try {
    const fileInfo = torrentManager.getFileInfo(id, parseInt(index));
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const { path: filePath, name } = fileInfo;
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(name)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      } else {
        res.end();
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
