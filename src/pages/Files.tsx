
import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Folder, File, HardDrive } from 'lucide-react';

const Files = () => {
  // Mock data for downloaded files
  const downloadedFiles = [
    { name: 'Ubuntu 23.04', type: 'folder', size: '4.5 GB', date: '2025-04-15' },
    { name: 'Debian 12.0', type: 'folder', size: '3.9 GB', date: '2025-04-12' },
    { name: 'readme.txt', type: 'file', size: '2 KB', date: '2025-04-10' },
    { name: 'Fedora Workstation 38', type: 'folder', size: '2.3 GB', date: '2025-04-08' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text mb-2">Files</h1>
          <p className="text-muted-foreground">Manage your downloaded files</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle>Downloads Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader className="bg-secondary/40">
                  <TableRow>
                    <TableHead className="w-[50%]">Name</TableHead>
                    <TableHead className="w-[20%]">Size</TableHead>
                    <TableHead className="w-[30%]">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {downloadedFiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No files found in downloads directory.
                      </TableCell>
                    </TableRow>
                  ) : (
                    downloadedFiles.map((file, index) => (
                      <TableRow key={index} className="hover:bg-secondary/20">
                        <TableCell className="flex items-center gap-2">
                          {file.type === 'folder' ? (
                            <Folder size={16} className="text-torrent-purple" />
                          ) : (
                            <File size={16} className="text-muted-foreground" />
                          )}
                          <span className="font-medium">{file.name}</span>
                        </TableCell>
                        <TableCell>{file.size}</TableCell>
                        <TableCell>{file.date}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle>Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-2">
              <HardDrive size={20} className="text-torrent-purple" />
              <div className="flex-grow">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Downloads Folder</span>
                  <span className="text-sm">10.7 GB / 20 GB</span>
                </div>
                <div className="h-2 bg-secondary rounded-full">
                  <div className="bg-torrent-purple h-2 rounded-full" style={{ width: '53.5%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Files;
