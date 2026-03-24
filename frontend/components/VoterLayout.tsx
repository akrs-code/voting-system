import { Outlet } from "react-router-dom";
import VoterNavbar from "../components/VoterNavbar";

const VoterLayout = () => {
  return (
    <div className="min-h-screen font-poppins bg-slate-50 relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(at_0%_0%,rgba(99,102,241,0.08),transparent_50%),radial-gradient(at_100%_100%,rgba(99,102,241,0.05),transparent_50%)]" />

      <div className="relative z-10">
        <VoterNavbar />
        
        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VoterLayout;