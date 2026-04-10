import { Menu as MenuIcon } from 'lucide-react';
import { useActiveElection } from "../hooks/useActiveElection";

interface NavbarProps {
    onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
    const { activeElection } = useActiveElection();

    return (
        <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-6 py-3 font-poppins">
            <div className="max-w-7xl mx-auto flex items-center justify-between">           
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <MenuIcon size={24} />
                    </button>

                    <img src="/cics.png" alt="Logo" className="w-10 h-10 object-contain" />
                    <div className="hidden sm:block">
                        <h1 className="text-sm font-bold tracking-tight text-[#2f318d] uppercase leading-none">
                            MSU CICS BYTES ELECTION SYSTEM
                        </h1>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">
                            Official Electoral Dashboard
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                    <div className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeElection ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${activeElection ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                    </div>
                    


                    {activeElection && (
                        <>
                            <div className="h-6 w-px bg-slate-200 mx-2" />
                            <div className="flex flex-col max-w-37.5 md:max-w-75">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    Active Election
                                </span>
                                <span className="text-[11px] font-bold text-[#2f318d] truncate mt-0.5">
                                    {activeElection.title}
                                </span>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </nav>
    );
};

export default Navbar;