
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

class FileManager {
  constructor() {
    // Determine the downloads directory based on the current working directory
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    this.downloadsDir = path.resolve(process.cwd(), 'downloads');
    
    // Create downloads directory if it doesn't exist
    this.ensureDownloadsDirectory();
  }
  
  ensureDownloadsDirectory() {
    if (!fs.existsSync(this.downloadsDir)) {
      try {
        fs.mkdirSync(this.downloadsDir, { recursive: true });
        console.log(`Created downloads directory at: ${this.downloadsDir}`);
      } catch (error) {
        console.error(`Failed to create downloads directory: ${error.message}`);
      }
    }
  }
  
  getDownloadsPath() {
    return this.downloadsDir;
  }
  
  async getFiles() {
    try {
      // Make sure the directory exists
      this.ensureDownloadsDirectory();
      
      const files = await fs.promises.readdir(this.downloadsDir);
      const fileDetails = await Promise.all(
        files.map(async (fileName) => {
          const filePath = path.join(this.downloadsDir, fileName);
          const stats = await fs.promises.stat(filePath);
          
          return {
            name: fileName,
            path: filePath,
            size: stats.size,
            isDirectory: stats.isDirectory(),
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
      );
      
      return fileDetails;
    } catch (error) {
      console.error('Error getting files:', error);
      throw error;
    }
  }
  
  async deleteFile(fileName) {
    try {
      const filePath = path.join(this.downloadsDir, fileName);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }
      
      const stats = await fs.promises.stat(filePath);
      
      if (stats.isDirectory()) {
        await fs.promises.rmdir(filePath, { recursive: true });
      } else {
        await fs.promises.unlink(filePath);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
  }
}

export const fileManager = new FileManager();
