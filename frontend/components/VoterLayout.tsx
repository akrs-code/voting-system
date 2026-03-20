import { Outlet } from "react-router-dom";

const VoterLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-xl font-bold mb-4">Voter Panel</h1>
      <Outlet />
    </div>
  );
};

export default VoterLayout;