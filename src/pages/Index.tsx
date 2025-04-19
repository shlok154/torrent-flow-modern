
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import TorrentList from '@/components/TorrentList';
import TorrentDetails from '@/components/TorrentDetails';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchTorrents from '@/components/SearchTorrents';

const Index = () => {
  const [magnetUrl, setMagnetUrl] = useState('');
  const { toast } = useToast();

  const handleAddTorrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!magnetUrl) return;
    
    toast({
      title: "Demo Mode",
      description: "This is a UI demo. Adding torrents is not functional in this version.",
    });
    
    setMagnetUrl('');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text mb-2">TorrentFlow</h1>
          <p className="text-muted-foreground">A modern BitTorrent client with an elegant UI</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle>Add New Torrent</CardTitle>
            <CardDescription>
              Enter a magnet link or drop a torrent file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTorrent} className="flex flex-col md:flex-row gap-3">
              <Input 
                placeholder="magnet:?xt=urn:btih:..." 
                value={magnetUrl}
                onChange={(e) => setMagnetUrl(e.target.value)}
                className="flex-grow bg-secondary/50"
              />
              <Button type="submit" className="bg-torrent-purple hover:bg-torrent-dark-purple">
                Add Torrent
              </Button>
            </form>
          </CardContent>
        </Card>

        <Tabs defaultValue="downloads" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="downloads">Downloads</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>
          
          <TabsContent value="downloads" className="space-y-6">
            <TorrentList />
            <TorrentDetails />
          </TabsContent>
          
          <TabsContent value="search">
            <SearchTorrents />
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>TorrentFlow - Modern BitTorrent Client Demo</p>
        <p className="mt-1">
          This is a UI demonstration. Full functionality would require Python backend integration with libtorrent.
        </p>
      </div>
    </AppLayout>
  );
};

export default Index;
