
// Bridge file to export the TypeScript implementation as ES modules
// This file is needed because Node.js with --experimental-modules
// expects proper .js extensions in imports

import { TorrentManager } from './TorrentManager.js';

const torrentManager = new TorrentManager();

// Expose the client temporarily for debugging purposes
torrentManager.client = torrentManager.getClient();

export { torrentManager };
