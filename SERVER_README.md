
# TorrentFlow Server

A full-featured BitTorrent management server that powers the TorrentFlow client.

## Features

- ✅ Complete torrent management (add, remove, pause, resume)  
- ✅ File selection within torrents
- ✅ Bandwidth control and scheduling
- ✅ IP filtering for enhanced privacy
- ✅ Real-time updates via WebSockets
- ✅ Queue management and priority control
- ✅ REST API for all torrent operations
- ✅ File downloads through the browser

## Technology Stack

- Node.js backend with Express
- WebTorrent for BitTorrent functionality
- Socket.io for real-time updates
- TypeScript for better code quality

## Setup and Installation

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/torrentflow.git
   cd torrentflow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the server:
   ```bash
   npm run server
   ```
   
   Or run both frontend and server concurrently:
   ```bash
   npm start
   ```

## How to Test the Server

1. Start the server:
   ```bash
   npm run server
   ```

2. Access the frontend at http://localhost:5173 (or the port shown in your terminal)

3. Test the API endpoints using curl or Postman:

   - Add a torrent:
     ```bash
     curl -X POST -H "Content-Type: application/json" -d '{"magnetUrl":"magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel"}' http://localhost:3001/api/torrents/add
     ```

   - Get torrent list:
     ```bash
     curl http://localhost:3001/api/torrents
     ```

   - Get torrent details:
     ```bash
     curl http://localhost:3001/api/torrents/08ada5a7a6183aae1e09d831df6748d566095a10
     ```

   - Remove a torrent:
     ```bash
     curl -X DELETE http://localhost:3001/api/torrents/08ada5a7a6183aae1e09d831df6748d566095a10
     ```

4. Test WebSocket connection using the frontend application.

## Troubleshooting

If you experience slow connections or download issues:

1. Force announce to trackers and DHT:
   ```bash
   curl -X POST http://localhost:3001/api/torrents/:id/announce
   ```

2. Check the console logs for connection and peer information.

3. Ensure your firewall/router allows BitTorrent traffic.

## API Endpoints

### Torrents

- `GET /api/torrents` - List all torrents
- `POST /api/torrents/add` - Add a torrent using a magnet link
  ```json
  {
    "magnetUrl": "magnet:?xt=...",
    "options": {
      "maxBandwidth": 1000,
      "verifyPieces": true,
      "priority": 1,
      "startImmediately": true
    }
  }
  ```
- `POST /api/torrents/upload` - Upload a .torrent file (multipart/form-data)
- `GET /api/torrents/:id` - Get detailed information about a torrent
- `DELETE /api/torrents/:id` - Remove a torrent (use query param `?removeFiles=true` to also delete files)
- `POST /api/torrents/:id/pause` - Pause a torrent
- `POST /api/torrents/:id/resume` - Resume a torrent
- `POST /api/torrents/:id/announce` - Force announce to trackers and DHT
- `POST /api/torrents/:id/files` - Select which files to download
  ```json
  {
    "fileIndices": [0, 2, 3]
  }
  ```
- `GET /api/torrents/:id/files/:index` - Download a specific file directly

### Files

- `GET /api/files` - List all downloaded files

### Bandwidth

- `GET /api/bandwidth` - Get current bandwidth settings
- `POST /api/bandwidth` - Update global bandwidth settings
- `POST /api/bandwidth/torrents/:id` - Set bandwidth limit for a specific torrent

### IP Filtering

- `GET /api/ipfilter` - Get IP filtering rules
- `POST /api/ipfilter` - Add a new IP filter rule
- `PUT /api/ipfilter/:id` - Update an IP filter rule
- `DELETE /api/ipfilter/:id` - Delete an IP filter rule
- `POST /api/ipfilter/enable` - Enable IP filtering
- `POST /api/ipfilter/disable` - Disable IP filtering

### Queue Management

- `GET /api/queue` - Get queue status
- `POST /api/queue/max` - Set maximum concurrent downloads

### Scheduling

- `GET /api/schedule` - Get all scheduled actions
- `POST /api/schedule` - Create a new scheduled action
- `PUT /api/schedule/:id` - Update a scheduled action
- `DELETE /api/schedule/:id` - Delete a scheduled action

## WebSocket API

Connect to the WebSocket server at the same host/port as the HTTP server to receive real-time updates.

### Events

#### Client to Server
- `torrent:subscribe` - Subscribe to detailed updates for a specific torrent
  ```javascript
  socket.emit('torrent:subscribe', torrentId);
  ```
- `torrent:unsubscribe` - Unsubscribe from detailed updates
  ```javascript
  socket.emit('torrent:unsubscribe', torrentId);
  ```
- `torrent:announce` - Force announce to trackers and DHT
  ```javascript
  socket.emit('torrent:announce', torrentId);
  ```

#### Server to Client
- `torrent:list` - Full list of torrents (sent periodically)
- `torrent:details` - Detailed information about a specific torrent (when subscribed)
- `torrent:announce:response` - Response after announce request

## Running in Production

For production deployment, consider using a process manager:

```bash
npm install -g pm2
pm2 start src/server.js --name torrentflow
```

## Security Considerations

- This server does not implement authentication by default
- Consider adding authentication for production use
- Be aware of legal restrictions on BitTorrent usage in your location
