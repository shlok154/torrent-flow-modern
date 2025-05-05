
// Check if this file exists and if not, create it with proper imports
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import path from 'path';
import torrentRoutes from './server/routes/torrentRoutes.js';
import bandwidthRoutes from './server/routes/bandwidthRoutes.js';
import fileRoutes from './server/routes/fileRoutes.js';
import ipFilterRoutes from './server/routes/ipFilterRoutes.js';
import queueRoutes from './server/routes/queueRoutes.js';
import scheduleRoutes from './server/routes/scheduleRoutes.js';
import { setupWebSocketHandlers } from './server/websocket.js';
import { torrentManager } from './server/torrentManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, set this to your frontend origin
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// API routes
app.use('/api/torrents', torrentRoutes);
app.use('/api/bandwidth', bandwidthRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/ipfilter', ipFilterRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/schedule', scheduleRoutes);

// WebSocket setup
setupWebSocketHandlers(io, torrentManager);

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server active on ws://localhost:${PORT}`);
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await torrentManager.destroy();
  process.exit(0);
});
