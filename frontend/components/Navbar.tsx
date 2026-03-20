import { useState } from 'react';
import { Search, LogOut, User, Menu as MenuIcon } from 'lucide-react';
import { useAuth } from "../hooks/useAuth";

interface NavbarProps {
    onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();

    return (
        <nav className="sticky top-0 z-[60] w-full bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-6 py-3">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between">

                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <MenuIcon size={24} />
                    </button>

                    <img src="/cics.png" alt="Logo" className="w-10 h-10 object-contain" />
                    <h1 className="text-sm font-black tracking-tight text-[#2f318d] uppercase leading-none">
                        MSU CICS ELECTION DAY
                    </h1>
                </div>

                <div className="relative w-full max-w-md mx-12 hidden md:block">
                    <input
                        type="text"
                        placeholder="Search elections, voters..."
                        className="h-11 w-full border border-slate-200 px-5 pr-12 text-sm rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2f318d]/5 focus:border-[#2f318d] transition-all"
                    />
                    <Search className="absolute right-4 top-3 h-5 w-5 text-slate-400" />
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`flex items-center justify-center h-11 w-11 rounded-2xl transition-all active:scale-95 border shadow-sm ${isOpen
                                ? "bg-slate-100 border-slate-300 ring-4 ring-slate-100"
                                : "bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200"
                            }`}
                    >
                        <div className="h-9 w-9 rounded-xl bg-[#2f318d] flex items-center justify-center text-white shadow-lg shadow-blue-900/10 shrink-0 font-bold">
                            {user?.name?.charAt(0) || <User size={20} />}
                        </div>
                    </button>

                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                            <div className="absolute right-0 mt-3 w-72 bg-white border border-slate-100 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-6 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4">
                                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-[#2f318d] flex items-center justify-center text-white font-bold text-xl">
                                        {user?.name?.charAt(0) || "A"}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-black text-slate-900 truncate">
                                            {user?.name || "Admin User"}
                                        </span>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                            {user?.role || "System Administrator"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3">
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-4 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl flex items-center gap-3 transition-colors"
                                    >
                                        <LogOut size={18} strokeWidth={2.5} />
                                        Sign Out Account
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </nav>
    );
};

export default Navbar;