
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pause, Play, File } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { mockTorrents } from '@/lib/mock-data';

interface Torrent {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: string;
  speed: string;
}

const TorrentList = () => {
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [loading, setLoading] = useState(true);
  const [useRealApi, setUseRealApi] = useState(false);
  const { toast } = useToast();

  // Check if API is available
  useEffect(() => {
    fetch('http://localhost:3001/api/torrents')
      .then(response => {
        if (response.ok) {
          setUseRealApi(true);
        } else {
          throw new Error('API unavailable');
        }
      })
      .catch(error => {
        console.log('Using mock data:', error);
        setTorrents(mockTorrents);
        setLoading(false);
      });
  }, []);

  // Fetch torrents if API is available
  useEffect(() => {
    if (!useRealApi) return;
    
    const fetchTorrents = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/torrents');
        if (response.ok) {
          const data = await response.json();
          setTorrents(data);
        } else {
          throw new Error('Failed to fetch torrents');
        }
      } catch (error) {
        console.error('Error fetching torrents:', error);
        toast({
          title: "Connection Error",
          description: "Could not connect to torrent server. Using demo data instead.",
        });
        setTorrents(mockTorrents);
      } finally {
        setLoading(false);
      }
    };

    fetchTorrents();
    
    // Set up polling for updates
    const interval = setInterval(fetchTorrents, 2000);
    return () => clearInterval(interval);
  }, [useRealApi, toast]);

  const handleToggleTorrent = async (torrent: Torrent) => {
    if (!useRealApi) {
      toast({
        title: "Demo Mode",
        description: "This is a UI demo. Torrent controls are not functional.",
      });
      return;
    }
    
    try {
      const endpoint = torrent.status === 'Paused' 
        ? `http://localhost:3001/api/torrents/${torrent.id}/resume`
        : `http://localhost:3001/api/torrents/${torrent.id}/pause`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to update torrent');
      }
      
      // The next polling cycle will update the UI
    } catch (error) {
      console.error('Error updating torrent:', error);
      toast({
        title: "Error",
        description: "Failed to update torrent status.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="py-4 text-center">Loading torrents...</div>;
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader className="bg-secondary/40">
          <TableRow>
            <TableHead className="w-[40%]">Name</TableHead>
            <TableHead className="w-[15%]">Size</TableHead>
            <TableHead className="w-[15%]">Progress</TableHead>
            <TableHead className="w-[10%]">Status</TableHead>
            <TableHead className="w-[10%]">Speed</TableHead>
            <TableHead className="w-[10%]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {torrents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No torrents found. Add a torrent to begin.
              </TableCell>
            </TableRow>
          ) : (
            torrents.map((torrent) => (
              <TableRow key={torrent.id} className="hover:bg-secondary/20">
                <TableCell className="flex items-center gap-2">
                  <File size={16} className="text-torrent-purple" />
                  <span className="font-medium truncate max-w-[350px]">{torrent.name}</span>
                </TableCell>
                <TableCell>{torrent.size}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="flex-grow">
                      <Progress 
                        value={torrent.progress} 
                        className="h-2 bg-secondary/50" 
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {torrent.progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={torrent.status === 'Downloading' ? 'default' : 
                            torrent.status === 'Seeding' ? 'secondary' : 
                            torrent.status === 'Paused' ? 'outline' : 'destructive'}
                    className={torrent.status === 'Downloading' ? 'bg-torrent-purple hover:bg-torrent-dark-purple' : ''}
                  >
                    {torrent.status}
                  </Badge>
                </TableCell>
                <TableCell>{torrent.speed}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleToggleTorrent(torrent)}
                    >
                      {torrent.status === 'Paused' ? <Play size={14} /> : <Pause size={14} />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TorrentList;
