
import express from 'express';
import { fileManager } from '../fileManager.js';

const router = express.Router();

router.get('/', async (req, res) => {
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

export default router;

