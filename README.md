
# TorrentFlow - Modern BitTorrent Client

A sleek, responsive BitTorrent client with a beautiful dark interface built with React, TypeScript, and WebTorrent.

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

## Setup and Installation

1. Install dependencies:
```bash
npm install
```

2. Update scripts for TypeScript support:
```bash
node update-ts-scripts.js
```

3. Run both frontend and backend concurrently:
```bash
npm start
```

This will start:
- Frontend development server (typically on http://localhost:5173 or http://localhost:8080)
- Backend API server on http://localhost:3001

## Development Scripts

- Start development environment (frontend + backend):
```bash
npm start
```

- Frontend development server only:
```bash
npm run dev
```

- Backend server only:
```bash
npm run server
```

- Build for production:
```bash
npm run build && npm run build:server
```

- Run production version:
```bash
npm run start:prod
```

## Dependencies

### Frontend
- React with TypeScript
- Tailwind CSS
- shadcn/ui Components
- Socket.io client
- React Query
- Recharts for data visualization

### Backend
- Express.js
- WebTorrent
- Socket.io
- Multer for file uploads
- ts-node for TypeScript execution

## API Documentation

See the [SERVER_README.md](SERVER_README.md) file for detailed API documentation and server features.

## License

This project is open source and available under the MIT License.
