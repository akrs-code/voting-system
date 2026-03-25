import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useActiveElection } from '../hooks/useActiveElection';
import { ballotService } from '../services/ballotService';
import { Loader2, Check, User, Eye, ArrowRight, X } from 'lucide-react';

const VoterDashboard = () => {
  const { user } = useAuth();
  const { activeElection, loading: electionLoading } = useActiveElection();

  const [positions, setPositions] = useState<any[]>([]);
  const [selectedVotes, setSelectedVotes] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showReview, setShowReview] = useState(false); // New state for Review

  useEffect(() => {
    const initDashboard = async () => {
      if (activeElection && user) {
        const votedList = (user as any).votedElections || [];
        if (votedList.includes(activeElection._id)) {
          setHasVoted(true);
        } else {
          await fetchBallotData();
        }
      }
    };
    initDashboard();
  }, [activeElection, user]);

  const fetchBallotData = async () => {
    if (!activeElection?._id) return;
    setFetching(true);
    try {
      const data = await ballotService.getBallot(activeElection._id);
      setPositions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch ballot:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSelect = (positionId: string, candidateId: string) => {
    setSelectedVotes(prev => ({ ...prev, [positionId]: candidateId }));
  };

  const handleSubmit = async () => {
    if (!activeElection?._id) return;
    setSubmitting(true);
    try {
      const votesArray = Object.entries(selectedVotes).map(([pId, cId]) => ({
        positionId: pId,
        candidateId: cId
      }));

      await ballotService.castBallot({
        electionId: activeElection._id,
        votes: votesArray
      });

      setHasVoted(true);
      setShowReview(false);
    } catch (error: any) {
      alert(error.response?.data?.error || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (electionLoading || (fetching && !hasVoted)) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-[#2f318d]" size={48} />
    </div>
  );

  if (hasVoted) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white text-center px-6 font-poppins">
      <div className="bg-green-100 p-8 rounded-[2.5rem] text-green-600 mb-6 shadow-xl shadow-green-100/50">
        <Check size={48} strokeWidth={3} />
      </div>
      <h1 className="text-3xl font-bold text-[#1e1b4b]">Vote Cast Successfully!</h1>
      <p className="text-slate-500 mt-2">Thank you for participating in the election.</p>
    </div>
  );

  return (
    <div className="min-h-screen font-poppins text-[#1e1b4b] bg-slate-50 pb-40">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-32">
        <header className="text-center mb-20">
          <h2 className="text-[0.75rem] font-bold tracking-[0.2rem] text-[#2f318d] uppercase opacity-60 mb-3">
            Official MSU CICS Ballot
          </h2>
          <h1 className="text-5xl font-black uppercase tracking-tight">
            Now Cast Your <span className="text-[#2f318d] italic">Votes!</span>
          </h1>
        </header>

        <div className="space-y-32">
          {positions.map((pos) => (
            <div key={pos.positionId} className="text-center">
              <div className="inline-block px-6 py-2 bg-indigo-50 rounded-full mb-8">
                 <h2 className="text-xl font-extrabold tracking-tight text-[#2f318d] uppercase">{pos.positionName}</h2> 
              </div>
              
              <div className="flex flex-wrap justify-center gap-10">
                {pos.candidates.map((candidate: any) => {
                  const isSelected = selectedVotes[pos.positionId] === candidate.candidateId;

                  return (
                    <div
                      key={candidate.candidateId}
                      onClick={() => handleSelect(pos.positionId, candidate.candidateId)}
                      className={`group relative cursor-pointer w-full max-w-sm bg-white rounded-[3rem] p-10 transition-all duration-500 
                        ${isSelected
                          ? "ring-4 ring-[#2f318d] ring-offset-8 shadow-2xl scale-[1.03]"
                          : "hover:shadow-xl hover:-translate-y-2 border border-slate-100"
                        }`}
                    >
          
                      {isSelected && (
                        <div className="absolute -top-4 -right-4 bg-[#2f318d] text-white p-3 rounded-full shadow-lg z-10 animate-in zoom-in">
                          <Check size={24} strokeWidth={3} />
                        </div>
                      )}

                      <div className="relative w-48 h-48 mx-auto mb-8">
                        <div className={`absolute inset-0 rounded-full transition-transform duration-700 group-hover:rotate-12 ${isSelected ? 'bg-indigo-100' : 'bg-slate-50'}`} />
                        
                        <div className={`relative w-full h-full rounded-full p-2 border-2 transition-colors duration-300 ${isSelected ? 'border-[#2f318d]' : 'border-transparent'}`}>
                            <div className="w-full h-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                            {candidate.profileImage ? (
                                <img src={candidate.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                                <User size={64} />
                                </div>
                            )}
                            </div>
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-slate-800 mb-2">{candidate.name}</h3>
                      
                      <span className={`inline-block px-4 py-1 rounded-full text-[0.7rem] font-black tracking-widest uppercase mb-10 transition-colors bg-[#2f318d] text-white : 
                      }`}>
                        {candidate.partylist}
                      </span>

                      <div
                        className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${isSelected
                            ? "bg-[#2f318d] text-white"
                            : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-[#2f318d]"
                          }`}
                      >
                        {isSelected ? "Candidate Selected" : "Select Candidate"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-40">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-4 flex justify-between items-center px-10">
            <div className="flex flex-col">
                <span className="text-[0.65rem] uppercase font-bold text-slate-400 tracking-wider">Progress</span>
                <div className="text-[#2f318d] font-black text-lg">
                {Object.keys(selectedVotes).length} <span className="text-slate-300 mx-1">/</span> {positions.length} <span className="text-sm font-medium text-slate-500 ml-1">Selected positions</span>
                </div>
            </div>

            <div className="flex gap-4">
                <button
                onClick={() => setShowReview(true)}
                disabled={Object.keys(selectedVotes).length === 0}
                className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 ${Object.keys(selectedVotes).length > 0
                    ? "bg-[#2f318d] text-white shadow-lg shadow-indigo-200 hover:bg-[#1e1b4b]"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                >
                <Eye size={20} />
                Review & Submit
                </button>
            </div>
        </div>
      </div>

      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Review Your Ballot</h2>
                    <button onClick={() => setShowReview(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                        {positions.map((pos) => {
                            const selectedId = selectedVotes[pos.positionId];
                            const candidate = pos.candidates.find((c: any) => c.candidateId === selectedId);
                            return (
                                <div key={pos.positionId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div>
                                        <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">{pos.positionName}</p>
                                        <p className="font-bold text-lg text-[#2f318d]">{candidate ? candidate.name : "No Selection"}</p>
                                    </div>
                                    {candidate ? <Check className="text-green-500" /> : <X className="text-red-400" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="p-8 bg-slate-50 flex gap-4">
                    <button 
                        onClick={() => setShowReview(false)}
                        className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-700"
                    >
                        Go Back
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 bg-[#2f318d] text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-[#1e1b4b] flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : <>Confirm Final Vote <ArrowRight size={18} /></>}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default VoterDashboard;