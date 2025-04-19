
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { mockTorrents } from '@/lib/mock-data';

interface TorrentDetail {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: string;
  downloadSpeed: string;
  uploadSpeed: string;
  timeRemaining?: string;
  peers: number;
  files: { name: string; size: string; progress: number }[];
}

// Start with mock data
const defaultTorrent = {
  ...mockTorrents[0],
  downloadSpeed: '2.5 MB/s',
  uploadSpeed: '0.5 MB/s',
  timeRemaining: '00:15:42',
  peers: 18,
  files: [
    { name: 'file1.mp4', size: '1.2 GB', progress: 45 },
    { name: 'file2.jpg', size: '5.4 MB', progress: 100 },
    { name: 'readme.txt', size: '2 KB', progress: 100 }
  ]
};

const TorrentDetails = () => {
  const [torrentDetails, setTorrentDetails] = useState<TorrentDetail | null>(null);
  const [useRealApi, setUseRealApi] = useState(false);
  const [selectedTorrentId, setSelectedTorrentId] = useState<string | null>(null);

  // Check if API is available
  useEffect(() => {
    fetch('http://localhost:3001/api/torrents')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('API unavailable');
      })
      .then(data => {
        if (data && data.length > 0) {
          setUseRealApi(true);
          setSelectedTorrentId(data[0].id);
        }
      })
      .catch(error => {
        console.log('Using mock data:', error);
        setTorrentDetails(defaultTorrent as TorrentDetail);
      });
  }, []);

  // Fetch torrent details if API is available
  useEffect(() => {
    if (!useRealApi || !selectedTorrentId) return;
    
    const fetchTorrentDetails = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/torrents/${selectedTorrentId}`);
        if (response.ok) {
          const data = await response.json();
          setTorrentDetails(data);
        } else {
          throw new Error('Failed to fetch torrent details');
        }
      } catch (error) {
        console.error('Error fetching torrent details:', error);
        setTorrentDetails(defaultTorrent as TorrentDetail);
      }
    };

    fetchTorrentDetails();
    
    // Set up polling for updates
    const interval = setInterval(fetchTorrentDetails, 2000);
    return () => clearInterval(interval);
  }, [useRealApi, selectedTorrentId]);

  if (!torrentDetails) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-6 text-center">
          Select a torrent to view details or add one to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{torrentDetails.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-muted-foreground">Download Progress</span>
            <span className="text-sm font-medium">{torrentDetails.progress}%</span>
          </div>
          <Progress value={torrentDetails.progress} className="h-2" />
        </div>
        
        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="peers">Peers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm font-medium">{torrentDetails.status}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Download Speed:</span>
                <span className="text-sm font-medium">{torrentDetails.downloadSpeed || '0 B/s'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Upload Speed:</span>
                <span className="text-sm font-medium">{torrentDetails.uploadSpeed || '0 B/s'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ETA:</span>
                <span className="text-sm font-medium">{torrentDetails.timeRemaining || 'Unknown'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Seeders/Peers:</span>
                <span className="text-sm font-medium">{torrentDetails.peers || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Size:</span>
                <span className="text-sm font-medium">{torrentDetails.size}</span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="files">
            <div className="space-y-2">
              {(torrentDetails.files || []).map((file, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                    <Progress value={file.progress} className="h-2 w-20" />
                  </div>
                </div>
              ))}
              {(!torrentDetails.files || torrentDetails.files.length === 0) && (
                <div className="text-center py-2 text-muted-foreground">
                  No files available for this torrent
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="peers">
            <div className="text-sm text-muted-foreground text-center py-2">
              Connected to {torrentDetails.peers || 0} peers
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TorrentDetails;
