
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { mockTorrents } from '@/lib/mock-data';

// We'll use the first mock torrent as an example
const selectedTorrent = mockTorrents[0];

const TorrentDetails = () => {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{selectedTorrent.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-muted-foreground">Download Progress</span>
            <span className="text-sm font-medium">{selectedTorrent.progress}%</span>
          </div>
          <Progress value={selectedTorrent.progress} className="h-2" />
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
                <span className="text-sm font-medium">{selectedTorrent.status}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Download Speed:</span>
                <span className="text-sm font-medium">{selectedTorrent.speed}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Upload Speed:</span>
                <span className="text-sm font-medium">0.5 MB/s</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ETA:</span>
                <span className="text-sm font-medium">00:15:42</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Seeders:</span>
                <span className="text-sm font-medium">18</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Leechers:</span>
                <span className="text-sm font-medium">5</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Added:</span>
                <span className="text-sm font-medium">2023-04-19 14:30</span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="files">
            <div className="space-y-2">
              {['file1.mp4', 'file2.jpg', 'readme.txt'].map((file, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <span className="text-sm">{file}</span>
                  <Progress value={selectedTorrent.progress} className="h-2 w-20" />
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="peers">
            <div className="text-sm text-muted-foreground">
              Connected to 18 peers
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TorrentDetails;
