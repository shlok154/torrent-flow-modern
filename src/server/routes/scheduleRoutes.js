
import express from 'express';
import { scheduleManager } from '../scheduleManager.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const schedules = scheduleManager.getSchedules();
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', (req, res) => {
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

router.put('/:id', (req, res) => {
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

router.delete('/:id', (req, res) => {
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

export default router;

