
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Upload, Play, Pause } from 'lucide-react';

interface SidebarStatsProps {
  collapsed: boolean;
}

const SidebarStats: React.FC<SidebarStatsProps> = ({ collapsed }) => {
  return (
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
  );
};

export default SidebarStats;
