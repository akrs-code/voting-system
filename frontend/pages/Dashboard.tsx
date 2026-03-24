import { useEffect, useState, useMemo } from 'react';
import { Users, UserCheck, UserPlus, PieChart, Trophy, RefreshCcw } from 'lucide-react';
import { ballotService } from '../services/ballotService';
import { voterService } from '../services/voterService';
import { useActiveElection } from '../hooks/useActiveElection';
import { socket } from '../src/socket';

const Dashboard = () => {
  const { activeElection, loading: electionLoading } = useActiveElection();
  const [results, setResults] = useState<any[]>([]);
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    votedCount: 0,
    turnoutPercentage: "0.0"
  });
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('ALL');

  const fetchData = async () => {
    if (!activeElection?._id) return;
    try {
      setLoading(true);
      const [resData, statsData, allVoters] = await Promise.all([
        ballotService.getResults(activeElection._id),
        ballotService.getStats(activeElection._id),
        voterService.getAll()
      ]);

      setResults(resData);
      setStats(statsData);
      setTotalRegistered(allVoters.length);
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeElection?._id) {
      fetchData();
      if (!socket.connected) socket.connect();
      
      const handleNewVote = () => fetchData();
      socket.on('newVoteCast', handleNewVote);
      
      return () => { socket.off('newVoteCast', handleNewVote); };
    }
  }, [activeElection?._id]);

  const filteredResults = useMemo(() => {
    if (selectedDept === 'ALL') return results;
    return results.filter(r => r.department === selectedDept);
  }, [results, selectedDept]);

  if (electionLoading) return <div className="h-screen flex items-center justify-center font-poppins text-slate-400">Syncing with MSU CICS Database...</div>;
  if (!activeElection) return <div className="h-screen flex items-center justify-center font-poppins text-red-500 font-bold tracking-tight uppercase">No Active Election Event Found</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 font-poppins">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Election Analytics</h1>
          <p className="text-slate-500 text-sm">Real-time data for <span className="text-[#2f318d] font-bold">{activeElection.title}</span></p>
        </div>
        
        <div className="flex items-center gap-3">
          {loading && <RefreshCcw size={16} className="animate-spin text-slate-400" />}
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            {['ALL', 'DCS', 'DIS'].map((dept) => (
              <button 
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedDept === dept ? 'bg-[#2f318d] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Registered" value={totalRegistered} icon={<Users size={20}/>} color="bg-[#2f318d] text-white" />
        <StatCard title="Candidates" value={stats.totalCandidates} icon={<UserPlus size={20}/>} color="bg-[#2f318d] text-white" />
        <StatCard title="Actual Ballots" value={stats.votedCount} icon={<UserCheck size={20}/>} color="bg-[#2f318d] text-white" />
        <StatCard title="Participation" value={`${stats.turnoutPercentage}%`} icon={<PieChart size={20}/>} color="bg-[#2f318d] text-white" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredResults.map((pos) => (
          <div key={pos.positionId} className="bg-white rounded-4xl border border-slate-200 shadow-xl overflow-hidden flex flex-col hover:border-[#2f318d]/30 transition-colors">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{pos.positionName}</h3>
                <span className="text-[10px] font-bold text-[#2f318d] uppercase tracking-widest opacity-60">
                  {pos.department === 'ALL' ? 'College-wide' : `${pos.department} Department`}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-slate-800 leading-none">{pos.totalVotes}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-none">Votes</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6 flex-1">
              {pos.candidates.map((candidate: any, idx: number) => (
                <div key={candidate.candidateId} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      {idx === 0 && candidate.totalVotes > 0 && <Trophy size={14} className="text-yellow-500" />}
                      <span className={`font-bold text-sm ${idx === 0 ? 'text-slate-800' : 'text-slate-600'}`}>{candidate.name}</span>
                    </div>
                    <span className="text-xs font-black text-[#2f318d]">{candidate.totalVotes} <span className="text-[10px] text-slate-400 font-normal">({candidate.percentage}%)</span></span>
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
  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-2xl ${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
        <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{value}</p>
      </div>
    </div>
  </div>
);

export default Dashboard;