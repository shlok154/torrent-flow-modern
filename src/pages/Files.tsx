
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Folder, File, HardDrive, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from '@/components/ui/use-toast';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size: string;
  date: string;
}

const Files = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useRealApi, setUseRealApi] = useState(false);
  const { toast } = useToast();

  // Mock data for downloaded files (fallback if API fails)
  const mockFiles = [
    { name: 'Ubuntu 23.04', type: 'folder' as const, size: '4.5 GB', date: '2025-04-15' },
    { name: 'Debian 12.0', type: 'folder' as const, size: '3.9 GB', date: '2025-04-12' },
    { name: 'readme.txt', type: 'file' as const, size: '2 KB', date: '2025-04-10' },
    { name: 'Fedora Workstation 38', type: 'folder' as const, size: '2.3 GB', date: '2025-04-08' },
  ];

  // Check if server API is available
  useEffect(() => {
    fetch('http://localhost:3001/api/files')
      .then(response => {
        if (response.ok) {
          setUseRealApi(true);
        } else {
          throw new Error('API unavailable');
        }
      })
      .catch(error => {
        console.log('Using mock file data:', error);
        setFiles(mockFiles);
        setLoading(false);
        toast({
          title: "Connection Error",
          description: "Could not connect to server. Using demo data instead.",
        });
      });
  }, [toast]);

  // Fetch files data if API is available
  useEffect(() => {
    if (!useRealApi) return;
    
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/files');
        
        if (response.ok) {
          const data = await response.json();
          setFiles(data);
          setError(null);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch files');
        }
      } catch (error) {
        console.error('Error fetching files:', error);
        setError('Failed to load files. Please try again later.');
        toast({
          title: "Error",
          description: "Failed to load files from downloads directory.",
          variant: "destructive"
        });
        
        // Fall back to mock data
        setFiles(mockFiles);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [useRealApi, toast]);

  // Calculate total size for storage display
  const totalSize = 10.7; // GB - For mock display
  const storageLimit = 20; // GB - For mock display
  const storagePercentage = (totalSize / storageLimit) * 100;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text mb-2">Files</h1>
          <p className="text-muted-foreground">Manage your downloaded files</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        Loading files...
                      </TableCell>
                    </TableRow>
                  ) : files.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No files found in downloads directory.
                      </TableCell>
                    </TableRow>
                  ) : (
                    files.map((file, index) => (
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
                  <span className="text-sm">{totalSize} GB / {storageLimit} GB</span>
                </div>
                <div className="h-2 bg-secondary rounded-full">
                  <div className="bg-torrent-purple h-2 rounded-full" style={{ width: `${storagePercentage}%` }}></div>
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
