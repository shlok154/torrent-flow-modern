
import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

const Settings = () => {
  const { toast } = useToast();
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully."
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure your TorrentFlow client</p>
        </div>

        <form onSubmit={handleSave}>
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle>Download Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="download-location">Download Location</Label>
                    <Input id="download-location" defaultValue="./downloads" className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-downloads">Maximum Concurrent Downloads</Label>
                    <Input id="max-downloads" type="number" min="1" max="10" defaultValue="3" className="bg-secondary/50" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="auto-start" defaultChecked />
                  <Label htmlFor="auto-start">Start downloads automatically</Label>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle>Connection Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="port">Listening Port</Label>
                    <Input id="port" type="number" min="1024" max="65535" defaultValue="6881" className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-connections">Maximum Connections</Label>
                    <Input id="max-connections" type="number" min="10" max="200" defaultValue="55" className="bg-secondary/50" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="upnp" defaultChecked />
                  <Label htmlFor="upnp">Enable UPnP port mapping</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="dht" defaultChecked />
                  <Label htmlFor="dht">Enable DHT network</Label>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle>Bandwidth Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="download-limit">Download Limit (KB/s, 0 for unlimited)</Label>
                    <Input id="download-limit" type="number" min="0" defaultValue="0" className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upload-limit">Upload Limit (KB/s, 0 for unlimited)</Label>
                    <Input id="upload-limit" type="number" min="0" defaultValue="50" className="bg-secondary/50" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button type="submit" className="bg-torrent-purple hover:bg-torrent-dark-purple">
                Save Settings
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default Settings;
