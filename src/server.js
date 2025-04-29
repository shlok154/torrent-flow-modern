
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { torrentManager } from './server/torrentManager.js';
import { Server } from 'socket.io';
import http from 'http';

// Import routes
import torrentRoutes from './server/routes/torrentRoutes.js';
import fileRoutes from './server/routes/fileRoutes.js';
import bandwidthRoutes from './server/routes/bandwidthRoutes.js';
import ipFilterRoutes from './server/routes/ipFilterRoutes.js';
import queueRoutes from './server/routes/queueRoutes.js';
import scheduleRoutes from './server/routes/scheduleRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check dependencies
try {
  const expressCheck = express;
  const corsCheck = cors;
  console.log('All required dependencies are installed.');
} catch (error) {
  console.error('Error: Missing dependencies. Please run "npm install" before starting the server.');
  console.error('Specific error:', error.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for Socket.io
const httpServer = http.createServer(app);

// Configure CORS with options that will work for both Express and Socket.io
const corsOptions = {
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Setup Socket.io with same CORS settings
const io = new Server(httpServer, {
  cors: corsOptions
});

// Initialize WebSocket connection handling
import { setupWebSocketHandlers } from './server/websocket.js';
setupWebSocketHandlers(io, torrentManager);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Mount routes
app.use('/api/torrents', torrentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/bandwidth', bandwidthRoutes);
app.use('/api/ipfilter', ipFilterRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/schedule', scheduleRoutes);

// Start the server
const serverInstance = httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server listening on all interfaces (0.0.0.0)`);
  console.log(`Access the API at: http://localhost:${PORT}/api/torrents`);
  console.log(`WebSocket server is also running on port ${PORT}`);
});

// Handle server errors
serverInstance.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try using a different port.`);
    process.exit(1);
  }
});

// Handle process termination signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

async function gracefulShutdown() {
  console.log('Shutting down server gracefully...');
  serverInstance.close(async () => {
    console.log('Server closed.');
    await torrentManager.destroy();
    console.log('WebTorrent client destroyed.');
    process.exit(0);
  });
  
  // Force exit after 10 seconds if cleanup is taking too long
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

export default app;
