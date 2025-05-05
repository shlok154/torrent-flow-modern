
// JavaScript bridge file for scheduleManager
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ScheduleManager {
  constructor() {
    this.schedules = [];
    this.filePath = path.join(__dirname, '../../data/schedules.json');
    this.loadSchedules();
  }

  loadSchedules() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        this.schedules = JSON.parse(data);
      } else {
        // Create directory if it doesn't exist
        const dirPath = path.dirname(this.filePath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        // Create empty schedules file
        fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
      this.schedules = [];
    }
  }

  saveSchedules() {
    try {
      const dirPath = path.dirname(this.filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.schedules, null, 2));
    } catch (error) {
      console.error('Error saving schedules:', error);
    }
  }

  getSchedules() {
    return [...this.schedules];
  }

  getScheduleForTorrent(torrentId) {
    const result = {};
    
    for (const schedule of this.schedules) {
      if (schedule.torrentId === torrentId && schedule.active) {
        if (schedule.action === 'start') {
          result.start = schedule.time;
        } else if (schedule.action === 'stop') {
          result.stop = schedule.time;
        }
      }
    }
    
    return result;
  }

  addSchedule(schedule) {
    const newSchedule = {
      ...schedule,
      id: Date.now().toString()
    };
    
    this.schedules.push(newSchedule);
    this.saveSchedules();
    return newSchedule;
  }

  updateSchedule(id, schedule) {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    this.schedules[index] = { ...this.schedules[index], ...schedule };
    this.saveSchedules();
    return true;
  }

  deleteSchedule(id) {
    const initialLength = this.schedules.length;
    this.schedules = this.schedules.filter(s => s.id !== id);
    
    if (this.schedules.length !== initialLength) {
      this.saveSchedules();
      return true;
    }
    
    return false;
  }

  removeSchedulesByTorrentId(torrentId) {
    const initialLength = this.schedules.length;
    this.schedules = this.schedules.filter(s => s.torrentId !== torrentId);
    
    if (this.schedules.length !== initialLength) {
      this.saveSchedules();
      return true;
    }
    
    return false;
  }

  getActiveSchedules() {
    const now = new Date();
    const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return this.schedules.filter(schedule => {
      return schedule.active && 
             schedule.days.includes(currentDay) && 
             schedule.time === currentTime;
    });
  }
}

export const scheduleManager = new ScheduleManager();
