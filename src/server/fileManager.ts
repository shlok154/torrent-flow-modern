
import fs from 'fs';
import path from 'path';
import { formatBytes } from './utils';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileManager {
  private downloadsDir: string;

  constructor() {
    this.downloadsDir = path.join(__dirname, '../../downloads');
    this.ensureDownloadsDirectory();
  }

  private ensureDownloadsDirectory() {
    if (!fs.existsSync(this.downloadsDir)) {
      fs.mkdirSync(this.downloadsDir, { recursive: true });
    }
  }

  async getFiles() {
    try {
      const dirEntries = await fs.promises.readdir(this.downloadsDir, { withFileTypes: true });
      
      const files = await Promise.all(
        dirEntries.map(async (entry) => {
          const entryPath = path.join(this.downloadsDir, entry.name);
          const stats = await fs.promises.stat(entryPath);
          
          return {
            name: entry.name,
            type: entry.isDirectory() ? 'folder' : 'file',
            size: formatBytes(stats.size),
            date: stats.mtime.toISOString().split('T')[0]
          };
        })
      );
      
      return files;
    } catch (error) {
      console.error('Error reading downloads directory:', error);
      throw error;
    }
  }

  getDownloadsPath() {
    return this.downloadsDir;
  }
}

export const fileManager = new FileManager();
