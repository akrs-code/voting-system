import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f8fafc]">
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden relative">
        <div className={`
          fixed inset-y-0 left-0 z-70 w-72 transform transition-transform duration-300 ease-in-out bg-[#14164d]
          lg:relative lg:translate-x-0 lg:flex
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-65 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto py-8 md:py-10 px-5">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;