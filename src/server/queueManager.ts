
interface QueuedTorrent {
  id: string;
  priority: number;
  fileSelections: { [filename: string]: boolean };
  filePriorities: { [filename: string]: 'high' | 'normal' | 'low' };
}

class QueueManager {
  private queue: QueuedTorrent[];
  private maxConcurrent: number;

  constructor() {
    this.queue = [];
    this.maxConcurrent = 5; // Default to 5 concurrent downloads
  }

  getQueue(): QueuedTorrent[] {
    return [...this.queue];
  }

  setPriority(torrentId: string, priority: number): boolean {
    const queueItem = this.queue.find(item => item.id === torrentId);
    
    if (queueItem) {
      queueItem.priority = priority;
      this.sortQueue();
      return true;
    } else {
      this.queue.push({
        id: torrentId,
        priority,
        fileSelections: {},
        filePriorities: {}
      });
      this.sortQueue();
      return true;
    }
  }

  getPriority(torrentId: string): number {
    const queueItem = this.queue.find(item => item.id === torrentId);
    return queueItem ? queueItem.priority : 0;
  }

  setMaxConcurrent(value: number): void {
    this.maxConcurrent = value;
  }

  getMaxConcurrent(): number {
    return this.maxConcurrent;
  }

  getTopNTorrents(): string[] {
    return this.queue
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.maxConcurrent)
      .map(item => item.id);
  }

  setFileSelected(torrentId: string, fileName: string, selected: boolean): boolean {
    const queueItem = this.getOrCreateQueueItem(torrentId);
    queueItem.fileSelections[fileName] = selected;
    return true;
  }

  isFileSelected(torrentId: string, fileName: string): boolean | undefined {
    const queueItem = this.queue.find(item => item.id === torrentId);
    if (!queueItem) return undefined;
    return queueItem.fileSelections[fileName];
  }

  setFilePriority(torrentId: string, fileName: string, priority: 'high' | 'normal' | 'low'): boolean {
    const queueItem = this.getOrCreateQueueItem(torrentId);
    queueItem.filePriorities[fileName] = priority;
    return true;
  }

  getFilePriority(torrentId: string, fileName: string): 'high' | 'normal' | 'low' | undefined {
    const queueItem = this.queue.find(item => item.id === torrentId);
    if (!queueItem) return undefined;
    return queueItem.filePriorities[fileName];
  }

  // Add the missing removeTorrent method
  removeTorrent(torrentId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(item => item.id !== torrentId);
    return this.queue.length !== initialLength;
  }

  private getOrCreateQueueItem(torrentId: string): QueuedTorrent {
    let queueItem = this.queue.find(item => item.id === torrentId);
    
    if (!queueItem) {
      queueItem = {
        id: torrentId,
        priority: 0,
        fileSelections: {},
        filePriorities: {}
      };
      this.queue.push(queueItem);
    }
    
    return queueItem;
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => b.priority - a.priority);
  }
}

export const queueManager = new QueueManager();
