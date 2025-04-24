
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getSettings, updateSettings } from '@/utils/settings';

const Settings = () => {
  const [settings, setSettings] = useState(getSettings());
  const { toast } = useToast();

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = updateSettings({ [key]: value });
    setSettings(newSettings);
    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved."
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure your TorrentFlow preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Downloads</CardTitle>
            <CardDescription>Configure how downloads are handled</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="downloadPath">Download Location</Label>
              <Input
                id="downloadPath"
                value={settings.downloadPath}
                onChange={(e) => handleSettingChange('downloadPath', e.target.value)}
                placeholder="./downloads"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxDownloads">Maximum Concurrent Downloads</Label>
              <Input
                id="maxDownloads"
                type="number"
                min={1}
                max={10}
                value={settings.maxDownloads}
                onChange={(e) => handleSettingChange('maxDownloads', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about completed downloads
                </p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-start Downloads</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically start downloading when adding new torrents
                </p>
              </div>
              <Switch
                checked={settings.autoStart}
                onCheckedChange={(checked) => handleSettingChange('autoStart', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage</CardTitle>
            <CardDescription>Manage your downloaded files</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => {
                // This is where we would implement clearing downloads
                toast({
                  title: "Clear Downloads",
                  description: "This feature will be implemented in the next update."
                });
              }}
            >
              Clear All Downloads
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Settings;
