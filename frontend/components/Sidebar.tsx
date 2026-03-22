import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Users, Vote, UserPlus, X, LucideIcon, Trophy } from 'lucide-react';
import { cn } from "@/lib/utils";

interface MenuItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    { label: 'Live Analytics', icon: BarChart3, href: '/dashboard/admin' },
    { label: 'Voters', icon: Users, href: '/dashboard/admin/voters' },
    { label: 'Elections', icon: Vote, href: '/dashboard/admin/elections' },
    { label: 'Positions', icon: Trophy, href: '/dashboard/admin/positions' },
    { label: 'Candidates', icon: UserPlus, href: '/dashboard/admin/candidates' },
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
    if (onClose) onClose();
  };

  return (
    <aside className="flex flex-col w-full h-full text-white font-poppins ">
      <div className="p-8 flex items-center justify-between">
        <h2 className="text-[0.9rem] font-semibold tracking-[0.2em] uppercase">
          Menu
        </h2>
        <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = item.href === '/dashboard/admin' 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
          
          return (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "w-full flex items-center py-3.5 px-4 rounded-xl font-bold transition-all text-[0.85rem] border-none cursor-pointer",
                isActive 
                  ? "bg-[#2f318d] text-white shadow-lg" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;