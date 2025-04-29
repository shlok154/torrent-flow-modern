
import type WebTorrent from 'webtorrent';

export function setupRetryLogic(
  torrent: WebTorrent.Torrent, 
  magnetUrl: string, 
  torrentOptions: WebTorrent.TorrentOptions,
  retryAttempts: Map<string, number>,
  client: WebTorrent.Instance
): void {
  torrent.on('error', (err) => {
    const currentAttempts = retryAttempts.get(torrent.infoHash) || 0;
    if (currentAttempts < 3) { // Retry up to 3 times
      retryAttempts.set(torrent.infoHash, currentAttempts + 1);
      console.log(`Retrying torrent ${torrent.infoHash}, attempt ${currentAttempts + 1}`);
      // Retry the torrent with a delay
      setTimeout(() => {
        client.add(magnetUrl, torrentOptions);
      }, 5000);
    }
  });
}

export function setupTorrentEvents(
  torrent: WebTorrent.Torrent,
  verifiedTorrents: Set<string>
): void {
  torrent.on('done', () => {
    // Once download is complete, mark as verified
    verifiedTorrents.add(torrent.infoHash);
  });
}
