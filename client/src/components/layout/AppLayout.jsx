import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout = () => {
  // On desktop default open, on mobile default closed
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const location = useLocation();

  // Automatically close mobile drawer when navigating to a new route
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 transition-colors flex flex-col">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        } pl-0`}
      >
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
