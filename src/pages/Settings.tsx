import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';
import { Slider } from "@/components/ui/slider";
import { getSettings, updateSettings } from '@/utils/settings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Filter, Shield, SlidersHorizontal, Calendar, Bug, List } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState(getSettings());
  const [bandwidthSettings, setBandwidthSettings] = useState({
    globalDownloadLimit: 0,
    globalUploadLimit: 0,
    perTorrentLimit: false,
    scheduleEnabled: false,
    peakHoursStart: '08:00',
    peakHoursEnd: '18:00',
    peakDownloadLimit: 0
  });
  const [ipRules, setIpRules] = useState([]);
  const [ipFilterEnabled, setIpFilterEnabled] = useState(false);
  const [maxConcurrentDownloads, setMaxConcurrentDownloads] = useState(5);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBandwidthSettings = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/bandwidth');
        if (response.ok) {
          const data = await response.json();
          setBandwidthSettings(data);
        }
      } catch (error) {
        console.error('Error fetching bandwidth settings:', error);
      }
    };
    
    const fetchIpFilterSettings = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/ipfilter');
        if (response.ok) {
          const data = await response.json();
          setIpRules(data.rules);
          setIpFilterEnabled(data.enabled);
        }
      } catch (error) {
        console.error('Error fetching IP filter settings:', error);
      }
    };
    
    const fetchQueueSettings = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/queue');
        if (response.ok) {
          const data = await response.json();
          setMaxConcurrentDownloads(data.maxConcurrent);
        }
      } catch (error) {
        console.error('Error fetching queue settings:', error);
      }
    };

    fetchBandwidthSettings().catch(console.error);
    fetchIpFilterSettings().catch(console.error);
    fetchQueueSettings().catch(console.error);
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = updateSettings({ [key]: value });
    setSettings(newSettings);
    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved."
    });
  };

  const updateBandwidthSettings = async (updates: Partial<typeof bandwidthSettings>) => {
    try {
      const response = await fetch('http://localhost:3001/api/bandwidth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const data = await response.json();
        setBandwidthSettings(data);
        toast({
          title: "Bandwidth Settings Updated",
          description: "Your bandwidth limits have been applied."
        });
      }
    } catch (error) {
      console.error('Error updating bandwidth settings:', error);
      toast({
        title: "Error",
        description: "Failed to update bandwidth settings.",
        variant: "destructive"
      });
    }
  };

  const toggleIpFilter = async (enable: boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/api/ipfilter/${enable ? 'enable' : 'disable'}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setIpFilterEnabled(enable);
        toast({
          title: `IP Filter ${enable ? 'Enabled' : 'Disabled'}`,
          description: `IP filtering is now ${enable ? 'active' : 'inactive'}.`
        });
      }
    } catch (error) {
      console.error('Error toggling IP filter:', error);
      toast({
        title: "Error",
        description: "Failed to update IP filter settings.",
        variant: "destructive"
      });
    }
  };

  const updateMaxConcurrentDownloads = async (value: number) => {
    try {
      const response = await fetch('http://localhost:3001/api/queue/max', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
      
      if (response.ok) {
        setMaxConcurrentDownloads(value);
        toast({
          title: "Queue Settings Updated",
          description: `Maximum concurrent downloads set to ${value}.`
        });
      }
    } catch (error) {
      console.error('Error updating queue settings:', error);
      toast({
        title: "Error",
        description: "Failed to update queue settings.",
        variant: "destructive"
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure your TorrentFlow preferences</p>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="bandwidth" className="flex items-center gap-1">
              <SlidersHorizontal size={14} />
              <span>Bandwidth</span>
            </TabsTrigger>
            <TabsTrigger value="ipfilter" className="flex items-center gap-1">
              <Filter size={14} />
              <span>IP Filter</span>
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-1">
              <List size={14} />
              <span>Queue</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1">
              <Calendar size={14} />
              <span>Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1">
              <Shield size={14} />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
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

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Storage</CardTitle>
                <CardDescription>Manage your downloaded files</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => {
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
          </TabsContent>
          
          <TabsContent value="bandwidth">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-torrent-purple" />
                  <span>Bandwidth Limits</span>
                </CardTitle>
                <CardDescription>Control your download and upload speeds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Global Download Limit</Label>
                      <span className="text-sm font-medium">
                        {bandwidthSettings.globalDownloadLimit === 0 ? 
                          'Unlimited' : 
                          `${bandwidthSettings.globalDownloadLimit} KB/s`}
                      </span>
                    </div>
                    <Slider
                      value={[bandwidthSettings.globalDownloadLimit]}
                      min={0}
                      max={10000}
                      step={100}
                      onValueChange={(values) => {
                        setBandwidthSettings(prev => ({...prev, globalDownloadLimit: values[0]}));
                      }}
                      onValueCommit={(values) => {
                        updateBandwidthSettings({ globalDownloadLimit: values[0] });
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Set to 0 for unlimited download speed
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Global Upload Limit</Label>
                      <span className="text-sm font-medium">
                        {bandwidthSettings.globalUploadLimit === 0 ? 
                          'Unlimited' : 
                          `${bandwidthSettings.globalUploadLimit} KB/s`}
                      </span>
                    </div>
                    <Slider
                      value={[bandwidthSettings.globalUploadLimit]}
                      min={0}
                      max={5000}
                      step={50}
                      onValueChange={(values) => {
                        setBandwidthSettings(prev => ({...prev, globalUploadLimit: values[0]}));
                      }}
                      onValueCommit={(values) => {
                        updateBandwidthSettings({ globalUploadLimit: values[0] });
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Set to 0 for unlimited upload speed
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label>Per-torrent Bandwidth Limits</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow setting individual bandwidth limits for each torrent
                    </p>
                  </div>
                  <Switch
                    checked={bandwidthSettings.perTorrentLimit}
                    onCheckedChange={(checked) => {
                      updateBandwidthSettings({ perTorrentLimit: checked });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Scheduled Bandwidth Limits</CardTitle>
                <CardDescription>Automatically adjust bandwidth during specific hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Scheduled Bandwidth Management</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable time-based bandwidth controls
                    </p>
                  </div>
                  <Switch
                    checked={bandwidthSettings.scheduleEnabled}
                    onCheckedChange={(checked) => {
                      updateBandwidthSettings({ scheduleEnabled: checked });
                    }}
                  />
                </div>
                
                {bandwidthSettings.scheduleEnabled && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Peak Hours Start</Label>
                        <Input
                          type="time"
                          value={bandwidthSettings.peakHoursStart}
                          onChange={(e) => {
                            setBandwidthSettings(prev => ({...prev, peakHoursStart: e.target.value}));
                          }}
                          onBlur={() => {
                            updateBandwidthSettings({ peakHoursStart: bandwidthSettings.peakHoursStart });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Peak Hours End</Label>
                        <Input
                          type="time"
                          value={bandwidthSettings.peakHoursEnd}
                          onChange={(e) => {
                            setBandwidthSettings(prev => ({...prev, peakHoursEnd: e.target.value}));
                          }}
                          onBlur={() => {
                            updateBandwidthSettings({ peakHoursEnd: bandwidthSettings.peakHoursEnd });
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Peak Hours Download Limit</Label>
                        <span className="text-sm font-medium">
                          {bandwidthSettings.peakDownloadLimit === 0 ? 
                            'Unlimited' : 
                            `${bandwidthSettings.peakDownloadLimit} KB/s`}
                        </span>
                      </div>
                      <Slider
                        value={[bandwidthSettings.peakDownloadLimit || 0]}
                        min={0}
                        max={10000}
                        step={100}
                        onValueChange={(values) => {
                          setBandwidthSettings(prev => ({...prev, peakDownloadLimit: values[0]}));
                        }}
                        onValueCommit={(values) => {
                          updateBandwidthSettings({ peakDownloadLimit: values[0] });
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ipfilter">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter size={18} className="text-torrent-purple" />
                  <span>IP Filtering</span>
                </CardTitle>
                <CardDescription>Block connections from specific IP addresses or ranges</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable IP Filtering</Label>
                    <p className="text-sm text-muted-foreground">
                      Block peer connections from specified IP addresses
                    </p>
                  </div>
                  <Switch
                    checked={ipFilterEnabled}
                    onCheckedChange={(checked) => toggleIpFilter(checked)}
                  />
                </div>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>IP Filter Rules</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Add IP Filter",
                            description: "This feature will be implemented in the next update."
                          });
                        }}
                      >
                        Add Rule
                      </Button>
                    </div>
                    <div className="border rounded-md">
                      {ipRules && ipRules.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>IP Range</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="w-[100px] text-right">Blocked</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ipRules.map((rule: any) => (
                              <TableRow key={rule.id}>
                                <TableCell>{rule.range}</TableCell>
                                <TableCell>{rule.description}</TableCell>
                                <TableCell className="text-right">
                                  <Switch
                                    checked={rule.blocked}
                                    onCheckedChange={() => {
                                      toast({
                                        title: "Update IP Filter",
                                        description: "This feature will be implemented in the next update."
                                      });
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No IP filter rules have been added yet.
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You can add individual IPs, CIDR ranges (e.g., 192.168.1.0/24), or IP ranges (e.g., 192.168.1.1-192.168.1.255)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="queue">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List size={18} className="text-torrent-purple" />
                  <span>Download Queue</span>
                </CardTitle>
                <CardDescription>Manage download priority and concurrency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Maximum Concurrent Downloads</Label>
                      <span className="text-sm font-medium">{maxConcurrentDownloads}</span>
                    </div>
                    <Slider
                      value={[maxConcurrentDownloads]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(values) => setMaxConcurrentDownloads(values[0])}
                      onValueCommit={(values) => updateMaxConcurrentDownloads(values[0])}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Limit the number of torrents downloading simultaneously
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label>Auto-Queue New Torrents</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically queue new torrents based on available slots
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoQueue}
                    onCheckedChange={(checked) => handleSettingChange('autoQueue', checked)}
                  />
                </div>
                
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Queue Management",
                        description: "Visit the Downloads tab to manage torrent priorities."
                      });
                    }}
                  >
                    Manage Torrent Queue
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>File Selection</CardTitle>
                <CardDescription>Default file selection preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Select All Files by Default</Label>
                      <p className="text-sm text-muted-foreground">
                        Download all files in a torrent by default
                      </p>
                    </div>
                    <Switch
                      checked={settings.selectAllFiles}
                      onCheckedChange={(checked) => handleSettingChange('selectAllFiles', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Skip Small Files</Label>
                      <p className="text-sm text-muted-foreground">
                        Skip files smaller than 1MB (usually readme or nfo files)
                      </p>
                    </div>
                    <Switch
                      checked={settings.skipSmallFiles}
                      onCheckedChange={(checked) => handleSettingChange('skipSmallFiles', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={18} className="text-torrent-purple" />
                  <span>Download Scheduler</span>
                </CardTitle>
                <CardDescription>Schedule downloads to start and stop automatically</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Scheduler",
                        description: "The scheduler feature will be implemented in the next update."
                      });
                    }}
                  >
                    Add Scheduled Task
                  </Button>
                  
                  <div className="border rounded-md p-4 text-center text-sm text-muted-foreground">
                    No scheduled tasks have been added yet.
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    You can schedule torrents to automatically start or stop at specific times.
                    This is useful for scheduling downloads during off-peak hours.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield size={18} className="text-torrent-purple" />
                  <span>Security</span>
                </CardTitle>
                <CardDescription>Configure security and verification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Verify Torrent Downloads</Label>
                    <p className="text-sm text-muted-foreground">
                      Verify the integrity of downloaded data
                    </p>
                  </div>
                  <Switch
                    checked={settings.verifyDownloads}
                    onCheckedChange={(checked) => handleSettingChange('verifyDownloads', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Block Suspicious Torrents</Label>
                    <p className="text-sm text-muted-foreground">
                      Prevent downloading of potentially malicious torrents
                    </p>
                  </div>
                  <Switch
                    checked={settings.blockSuspicious}
                    onCheckedChange={(checked) => handleSettingChange('blockSuspicious', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Use Anonymous Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Don't share identifying information with trackers or peers
                    </p>
                  </div>
                  <Switch
                    checked={settings.anonymousMode}
                    onCheckedChange={(checked) => handleSettingChange('anonymousMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug size={18} className="text-torrent-purple" />
                  <span>Error Handling</span>
                </CardTitle>
                <CardDescription>Configure how errors are handled</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-retry Failed Downloads</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically retry downloads that encounter errors
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoRetry}
                      onCheckedChange={(checked) => handleSettingChange('autoRetry', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Maximum Retry Attempts</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={settings.maxRetries || 3}
                      onChange={(e) => handleSettingChange('maxRetries', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
