
# Running the Torrent Server

This application uses a Node.js server to manage and control torrents.

## Setup and Running

1. Make sure you have Node.js installed (v14 or later)

2. Install dependencies:
   ```
   npm install
   ```

3. Run the full application (both frontend and server):
   ```
   npm start
   ```

4. To run only the server:
   ```
   npm run server
   ```

The server will start on port 3001 by default. You can change this by setting the PORT environment variable.

## Troubleshooting

If you encounter errors about missing modules:

1. Make sure all dependencies are installed:
   ```
   npm install
   ```

2. Run the scripts update helper:
   ```
   node update-scripts.js
   ```

3. If TypeScript files aren't compiling correctly, try:
   ```
   npx tsc -p tsconfig.server.json
   ```

## API Endpoints

The server provides various API endpoints for torrent management:
- GET `/api/torrents` - List all torrents
- POST `/api/torrents/add` - Add a new torrent
- GET `/api/torrents/:id` - Get details about a specific torrent
- POST `/api/torrents/:id/pause` - Pause a specific torrent
- POST `/api/torrents/:id/resume` - Resume a specific torrent

And many others for bandwidth management, IP filtering, queue management, and scheduling.
