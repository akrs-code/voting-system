import { useState } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { useActiveElection } from "../hooks/useActiveElection";
import { useAuth } from "../hooks/useAuth";

const VoterNavbar = () => {
    const { activeElection } = useActiveElection();
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const getInitials = (name: string) => {
        return name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2) || "??";
    };

    return (
        <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 px-6 py-3 font-poppins">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                
                <div className="flex items-center gap-3">
                    <img src="/cics.png" alt="Logo" className="w-10 h-10 object-contain" />
                    <div className="hidden sm:block">
                        <h1 className="text-sm font-bold tracking-tight text-[#2f318d] uppercase leading-none">
                            MSU CICS VOTER PORTAL
                        </h1>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">
                            {activeElection?.title || "No Active Election"}
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-2 p-1 pr-3 hover:bg-slate-50 rounded-full transition-all border border-transparent hover:border-slate-200"
                    >
                        <div className="w-9 h-9 rounded-full bg-[#2f318d] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {user ? getInitials(user.name) : "V"}
                        </div>
                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setIsOpen(false)} 
                            />
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in duration-150">
                                <div className="px-4 py-3 border-b border-slate-50">
                                    <p className="text-sm font-bold text-slate-800">{user?.name || "Voter"}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.studentId || "Student ID"}</p>
                                </div>
                                
                                <div className="p-2">
                                    <div className="px-3 py-2 mb-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Info</p>
                                        <p className="text-xs font-medium text-slate-600 mt-1">{user?.department} - {user?.yearLevel ? `${['', '1st', '2nd', '3rd', '4th'][user.yearLevel]} Year` : ''}</p>
                                    </div>
                                    
                                    <button 
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors border-none bg-transparent cursor-pointer"
                                    >
                                        <LogOut size={18} />
                                        Logout
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

export default VoterNavbar;