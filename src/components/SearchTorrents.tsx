
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const SearchTorrents = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim() === '') return;
    
    toast({
      title: "Search feature coming soon",
      description: `Your search for "${query}" will be available in the next update`,
    });
  };

  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <Input
                placeholder="Search for torrents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pr-10 bg-secondary/50"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
            </div>
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-[180px] bg-secondary/50">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="movies">Movies</SelectItem>
                <SelectItem value="tv">TV Shows</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="games">Games</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="books">Books</SelectItem>
              </SelectContent>
            </Select>
            
            <Button type="submit" className="bg-torrent-purple hover:bg-torrent-dark-purple">
              Search
            </Button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-muted-foreground">
          <p>Search functionality will be available in the next update.</p>
          <p className="text-sm mt-2">This is a demo UI showcasing the design.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchTorrents;
