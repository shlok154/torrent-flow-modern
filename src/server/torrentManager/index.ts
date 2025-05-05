
import { TorrentManager } from './TorrentManager';

const torrentManager = new TorrentManager();

// Expose the client temporarily for debugging
// @ts-ignore - Adding a non-standard property for debugging purposes
torrentManager.client = torrentManager.getClient();

export { torrentManager };
