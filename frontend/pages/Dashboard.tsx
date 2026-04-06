import { useEffect, useState, useMemo, useCallback } from 'react';
import { Users, UserCheck, UserPlus, PieChart, Trophy, RefreshCcw, DownloadIcon } from 'lucide-react';
import { ballotService } from '../services/ballotService';
import { useActiveElection } from '../hooks/useActiveElection';
import { socket } from '../src/socket';
import { generateExcelReport } from '../utils/exportReports';

const Dashboard = () => {
  const { activeElection, loading: electionLoading } = useActiveElection();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('ALL');

  const [stats, setStats] = useState({
    totalVoters: 0,
    totalCandidates: 0,
    votedCount: 0,
    turnoutPercentage: "0.00"
  });

  const fetchData = useCallback(async (dept: string) => {
    if (!activeElection?._id) return;
    try {
      setLoading(true);
      const [resData, statsData] = await Promise.all([
        ballotService.getResults(activeElection._id),
        ballotService.getStats(activeElection._id, dept)
      ]);

      setResults(resData || []);
      setStats({
        totalVoters: statsData?.totalVoters || 0,
        totalCandidates: statsData?.totalCandidates || 0,
        votedCount: statsData?.votedCount || 0,
        turnoutPercentage: statsData?.turnoutPercentage || "0.00"
      });
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, [activeElection?._id]);

  useEffect(() => {
    if (activeElection?._id) {
      fetchData(selectedDept);

      if (!socket.connected) socket.connect();

      const handleNewVote = (data: any) => {
        if (data.electionId === activeElection._id) {
          fetchData(selectedDept);
        }
      };

      socket.on('newVoteCast', handleNewVote);
      return () => { socket.off('newVoteCast', handleNewVote); };
    }
  }, [activeElection?._id, selectedDept, fetchData]);

  const filteredResults = useMemo(() => {
    if (selectedDept === 'ALL') return results;
    return results.filter(pos =>
      pos.department === selectedDept || pos.department === 'ALL'
    );
  }, [results, selectedDept]);

  const handleDownload = () => {
    generateExcelReport(activeElection, stats.totalVoters, stats, results);
  };

  if (electionLoading) return <div className="h-screen flex items-center justify-center font-poppins text-slate-400">Syncing with MSU CICS Database...</div>;
  if (!activeElection) return <div className="h-screen flex items-center justify-center font-poppins text-red-500 font-bold tracking-tight uppercase">No Active Election Event Found</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8 font-poppins">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Election Analytics</h1>
          <p className="text-slate-500 text-sm">Real-time data for <span className="text-[#2f318d] font-bold">{activeElection.title}</span></p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {loading && <RefreshCcw size={16} className="animate-spin text-slate-400 shrink-0" />}

          <button
            onClick={handleDownload}
            className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 md:px-6 py-3 md:h-12 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <DownloadIcon size={14} /> 
            <span className="whitespace-nowrap">Export Excel</span>
          </button>

          <div className="flex flex-1 md:flex-none items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            {['ALL', 'DCS', 'DIS'].map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedDept === dept ? 'bg-[#2f318d] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard title="Registered" value={stats.totalVoters} icon={<Users size={18} />} color="bg-[#2f318d] text-white" />
        <StatCard title="Candidates" value={stats.totalCandidates} icon={<UserPlus size={18} />} color="bg-[#2f318d] text-white" />
        <StatCard title="Ballots" value={stats.votedCount} icon={<UserCheck size={18} />} color="bg-[#2f318d] text-white" />
        <StatCard title="Turnout" value={`${stats.turnoutPercentage}%`} icon={<PieChart size={18} />} color="bg-[#2f318d] text-white" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {filteredResults.map((pos) => (
          <div key={pos.positionId} className="bg-white rounded-4xl md:rounded-4xl border border-slate-200 shadow-lg overflow-hidden flex flex-col hover:border-[#2f318d]/30 transition-colors">
            <div className="p-5 md:p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-base md:text-lg font-bold text-slate-800 leading-tight">{pos.positionName}</h3>
                <span className="text-[9px] md:text-[10px] font-bold text-[#2f318d] uppercase tracking-widest opacity-60">
                  {pos.department === 'ALL' ? 'College-wide' : `${pos.department} Department`}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xl md:text-2xl font-black text-slate-800 leading-none">{pos.totalVotes}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-none">Votes</p>
              </div>
            </div>

            <div className="p-5 md:p-6 space-y-5 md:space-y-6 flex-1">
              {pos.candidates.map((candidate: any, idx: number) => (
                <div key={candidate.candidateId} className="space-y-2">
                  <div className="flex justify-between items-end gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {idx === 0 && candidate.totalVotes > 0 && <Trophy size={14} className="text-yellow-500 shrink-0" />}
                      <span className={`font-bold text-xs md:text-sm truncate ${idx === 0 ? 'text-slate-800' : 'text-slate-600'}`}>
                        {candidate.name}
                      </span>
                    </div>
                    <span className="text-xs font-black text-[#2f318d] shrink-0">
                      {candidate.totalVotes} <span className="text-[10px] text-xs  text-slate-400 font-semibold">({candidate.percentage}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${idx === 0 ? 'bg-[#2f318d]' : 'bg-slate-300'}`}
                      style={{ width: `${candidate.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              {pos.candidates.length === 0 && <p className="text-center text-slate-300 text-xs py-4 italic">No candidates registered</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-4xl border border-slate-200 shadow-sm flex flex-row items-center gap-3 md:gap-4">
    
    <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl shrink-0 flex items-center justify-center ${color}`}>
      {icon}
    </div>

    <div className="flex flex-col min-w-0">
      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1 truncate">
        {title}
      </p>
      <p className="text-lg md:text-2xl font-black text-slate-800 tracking-tight leading-none truncate">
        {value}
      </p>
    </div>

  </div>
);

export default Dashboard;