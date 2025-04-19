
import React from 'react';
import { useLocation } from "react-router-dom";
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-6 max-w-md">
        <div className="mb-6">
          <h1 className="text-6xl font-bold gradient-text">404</h1>
          <p className="text-xl text-muted-foreground mt-2">Page not found</p>
        </div>
        <p className="mb-6 text-muted-foreground">
          Sorry, we couldn't find the page you were looking for at<br/>
          <span className="font-mono bg-secondary px-2 py-1 rounded text-sm mt-1 inline-block">
            {location.pathname}
          </span>
        </p>
        <Button className="bg-torrent-purple hover:bg-torrent-dark-purple" asChild>
          <a href="/">Return Home</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
