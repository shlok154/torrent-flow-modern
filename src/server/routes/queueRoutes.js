
import express from 'express';
import { queueManager } from '../queueManager.js';

const router = express.Router();

router.get('/', (req, res) => {
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

router.post('/max', (req, res) => {
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

export default router;

