
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { 
  Folder, 
  Search, 
  Settings, 
  Download,
  Pause,
  Play,
  Upload
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { id: 'downloads', name: 'Downloads', icon: Download, path: '/' },
    { id: 'search', name: 'Search', icon: Search, path: '/' },
    { id: 'files', name: 'Files', icon: Folder, path: '/files' },
    { id: 'settings', name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleClick = (id: string, path: string) => {
    if (id === 'search') {
      // For search, we stay on the home page but activate the search tab
      navigate('/');
      // We'll handle the tab switching in the Index component
      localStorage.setItem('activeTab', 'search');
      window.dispatchEvent(new Event('storage'));
    } else {
      navigate(path);
    }
  };
  
  const handleAddTorrent = () => {
    toast({
      title: "Feature coming soon",
      description: "Adding torrents will be available in the next update",
    });
  };

  const getActiveItem = () => {
    if (location.pathname === '/') {
      const activeTab = localStorage.getItem('activeTab');
      return activeTab === 'search' ? 'search' : 'downloads';
    }
    if (location.pathname === '/files') return 'files';
    if (location.pathname === '/settings') return 'settings';
    return '';
  };

  const activeItem = getActiveItem();

  return (
    <div className={cn(
      "bg-card h-auto md:h-screen transition-all duration-200 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 flex items-center mb-6 justify-between">
        {!collapsed && (
          <h1 className="text-xl font-bold gradient-text">TorrentFlow</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? ">" : "<"}
        </Button>
      </div>
      
      <div className="mb-6 px-3">
        <Button 
          variant="default" 
          className="w-full bg-torrent-purple hover:bg-torrent-dark-purple text-white flex items-center justify-center gap-2"
          onClick={handleAddTorrent}
        >
          <Download size={18} />
          {!collapsed && <span>Add Torrent</span>}
        </Button>
      </div>
      
      <div className="space-y-1 px-3">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeItem === item.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              activeItem === item.id && "bg-secondary hover:bg-secondary/80",
              collapsed ? "px-2" : ""
            )}
            onClick={() => handleClick(item.id, item.path)}
          >
            <item.icon className={cn("h-5 w-5", activeItem === item.id ? "text-primary" : "text-muted-foreground")} />
            {!collapsed && <span className="ml-2">{item.name}</span>}
          </Button>
        ))}
      </div>
      
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <div className="p-3 bg-secondary/50 rounded-md mb-2">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <Download size={14} className="text-torrent-purple mr-2" />
              {!collapsed && <span className="text-xs">2.5 MB/s</span>}
            </div>
            <div className="flex items-center">
              <Upload size={14} className="text-green-400 mr-2" />
              {!collapsed && <span className="text-xs">1.2 MB/s</span>}
            </div>
          </div>
          {!collapsed && (
            <div className="flex justify-center space-x-2">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                <Play size={14} />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                <Pause size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
