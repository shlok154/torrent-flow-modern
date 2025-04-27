
import express from 'express';
import { torrentManager } from '../torrentManager.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const settings = torrentManager.getBandwidthSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', (req, res) => {
  try {
    const settings = torrentManager.updateBandwidthSettings(req.body);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/torrents/:id', (req, res) => {
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

export default router;

