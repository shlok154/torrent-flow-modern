
import express from 'express';
import { torrentManager } from '../torrentManager.js';
import { fileManager } from '../fileManager.js';

const router = express.Router();

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

router.post('/:id/files/:fileName/priority', (req, res) => {
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

export default router;

