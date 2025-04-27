
import express from 'express';
import { ipFilter } from '../ipFilter.js';

const router = express.Router();

router.get('/', (req, res) => {
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

router.post('/', (req, res) => {
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

router.put('/:id', (req, res) => {
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

router.delete('/:id', (req, res) => {
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

router.post('/enable', (req, res) => {
  try {
    ipFilter.enableFilters();
    res.json({ success: true, enabled: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/disable', (req, res) => {
  try {
    ipFilter.disableFilters();
    res.json({ success: true, enabled: false });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

