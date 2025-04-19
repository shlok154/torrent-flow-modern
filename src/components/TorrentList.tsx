
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Pause, Play, File } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { mockTorrents } from '@/lib/mock-data';

const TorrentList = () => {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader className="bg-secondary/40">
          <TableRow>
            <TableHead className="w-[40%]">Name</TableHead>
            <TableHead className="w-[15%]">Size</TableHead>
            <TableHead className="w-[15%]">Progress</TableHead>
            <TableHead className="w-[10%]">Status</TableHead>
            <TableHead className="w-[10%]">Speed</TableHead>
            <TableHead className="w-[10%]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockTorrents.map((torrent) => (
            <TableRow key={torrent.id} className="hover:bg-secondary/20">
              <TableCell className="flex items-center gap-2">
                <File size={16} className="text-torrent-purple" />
                <span className="font-medium truncate max-w-[350px]">{torrent.name}</span>
              </TableCell>
              <TableCell>{torrent.size}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={torrent.progress} className="h-2" />
                  <span className="text-xs">{torrent.progress}%</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={torrent.status === 'Downloading' ? 'default' : 
                          torrent.status === 'Seeding' ? 'secondary' : 
                          torrent.status === 'Paused' ? 'outline' : 'destructive'}
                  className={torrent.status === 'Downloading' ? 'bg-torrent-purple hover:bg-torrent-dark-purple' : ''}
                >
                  {torrent.status}
                </Badge>
              </TableCell>
              <TableCell>{torrent.speed}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    {torrent.status === 'Paused' ? <Play size={14} /> : <Pause size={14} />}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TorrentList;
