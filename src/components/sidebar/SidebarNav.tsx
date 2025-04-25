
import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { Download, Search, Folder, Settings } from 'lucide-react';

interface SidebarNavProps {
  collapsed: boolean;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ collapsed }) => {
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
      navigate('/');
      localStorage.setItem('activeTab', 'search');
      window.dispatchEvent(new Event('storage'));
    } else {
      navigate(path);
    }
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
  );
};

export default SidebarNav;
