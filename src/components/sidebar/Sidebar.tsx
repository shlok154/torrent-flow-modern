
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { Download } from 'lucide-react';
import SidebarNav from './SidebarNav';
import SidebarStats from './SidebarStats';
import AddTorrentDialog from './AddTorrentDialog';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isAddTorrentDialogOpen, setIsAddTorrentDialogOpen] = useState(false);

  return (
    <>
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
            onClick={() => setIsAddTorrentDialogOpen(true)}
          >
            <Download size={18} />
            {!collapsed && <span>Add Torrent</span>}
          </Button>
        </div>

        <SidebarNav collapsed={collapsed} />
        <SidebarStats collapsed={collapsed} />
      </div>

      <AddTorrentDialog 
        isOpen={isAddTorrentDialogOpen}
        onOpenChange={setIsAddTorrentDialogOpen}
      />
    </>
  );
};

export default Sidebar;
