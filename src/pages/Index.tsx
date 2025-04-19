
import React, { useState, useEffect } from 'react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('downloads');
  const { toast } = useToast();

  // Listen for tab changes from sidebar
  useEffect(() => {
    const handleStorageChange = () => {
      const newTab = localStorage.getItem('activeTab');
      if (newTab) {
        setActiveTab(newTab);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Check on initial load too
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleAddTorrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magnetUrl) return;
    
    setIsSubmitting(true);
    
    try {
      // Try to use the real API first
      const response = await fetch('http://localhost:3001/api/torrents/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ magnetUrl })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Torrent Added",
          description: `Started downloading: ${data.name}`
        });
      } else {
        // If API call fails, show demo message
        throw new Error('API unavailable');
      }
    } catch (error) {
      console.log('API error:', error);
      toast({
        title: "Demo Mode",
        description: "This is a UI demo. Adding torrents is not functional in this version.",
      });
    } finally {
      setMagnetUrl('');
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('activeTab', value);
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
              <Button 
                type="submit" 
                className="bg-torrent-purple hover:bg-torrent-dark-purple"
                disabled={isSubmitting || !magnetUrl}
              >
                {isSubmitting ? 'Adding...' : 'Add Torrent'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
        <p>TorrentFlow - Modern BitTorrent Client</p>
        <p className="mt-1">
          Downloads are saved to the "downloads" folder in your project directory.
        </p>
      </div>
    </AppLayout>
  );
};

export default Index;
