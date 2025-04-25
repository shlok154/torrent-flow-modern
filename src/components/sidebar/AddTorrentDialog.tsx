
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';

interface AddTorrentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddTorrentDialog: React.FC<AddTorrentDialogProps> = ({ isOpen, onOpenChange }) => {
  const [magnetUrl, setMagnetUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAddTorrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magnetUrl) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/torrents/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ magnetUrl })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Torrent Added",
          description: `Started downloading: ${data.name}`
        });
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to add torrent",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding torrent:', error);
      toast({
        title: "Connection Error",
        description: "Could not connect to the torrent server.",
        variant: "destructive"
      });
    } finally {
      setMagnetUrl('');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Torrent</DialogTitle>
          <DialogDescription>
            Enter a magnet link to start downloading
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddTorrent}>
          <div className="grid gap-4 py-4">
            <Input 
              placeholder="magnet:?xt=urn:btih:..." 
              value={magnetUrl}
              onChange={(e) => setMagnetUrl(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="bg-torrent-purple hover:bg-torrent-dark-purple"
              disabled={isSubmitting || !magnetUrl}
            >
              {isSubmitting ? 'Adding...' : 'Add Torrent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTorrentDialog;
