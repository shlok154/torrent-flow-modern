
import React from 'react';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const AppLayout = ({ children, className }: AppLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-torrent-bg-dark text-white">
      <Sidebar />
      <main className={cn("flex-1 p-4 md:p-6 overflow-auto", className)}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
