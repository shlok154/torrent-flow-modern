
# TorrentFlow - Modern BitTorrent Client

A sleek, responsive BitTorrent client with a beautiful dark interface built with React, TypeScript, and WebTorrent.

## Project info

**URL**: https://lovable.dev/projects/3f3915c9-a758-4eb0-82fd-00c8423ccfa7

## Features

TorrentFlow is a fully functional BitTorrent client that offers:

- ✅ Complete torrent management (add, remove, pause, resume)
- ✅ Beautiful dark theme UI with purple accents
- ✅ Torrent list with real-time progress indicators
- ✅ Detailed torrent information panel
- ✅ File selection within torrents
- ✅ Bandwidth control and scheduling
- ✅ Real-time updates via WebSockets
- ✅ Responsive design that works on mobile devices
- ✅ Collapsible sidebar

## Requirements

- Node.js v16 or later
- npm or yarn

## Dependencies

The application uses:

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- shadcn UI Components
- Socket.io client for real-time updates
- React Query for data fetching

### Backend
- Express.js for the REST API
- WebTorrent for BitTorrent functionality
- Socket.io for WebSocket connections
- Multer for file uploads

## Running the Application

To run TorrentFlow locally:

1. Install dependencies:
```bash
npm install
```

2. Run both frontend and backend concurrently:
```bash
npm start
```

This will start:
- Frontend development server (typically on http://localhost:5173)
- Backend API server on http://localhost:3001

Alternatively, you can run them separately:

- For frontend only:
```bash
npm run dev
```

- For backend server only:
```bash
npm run server
```

## API Documentation

See the [SERVER_README.md](SERVER_README.md) file for detailed API documentation and server features.

## Technology Stack

- React + TypeScript
- Tailwind CSS
- Express.js
- WebTorrent
- Socket.io
- WebSockets for real-time updates

## License

This project is open source and available under the MIT License.
