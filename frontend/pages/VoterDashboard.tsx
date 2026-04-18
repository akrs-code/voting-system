import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useActiveElection } from '../hooks/useActiveElection';
import { ballotService } from '../services/ballotService';
import {
  Loader2, Check, User, Eye, ArrowRight, X,
  CheckCircle2, ShieldCheck, AlertCircle
} from 'lucide-react';

const VoterDashboard = () => {
  const { user } = useAuth();
  const { activeElection, loading: electionLoading } = useActiveElection();

  const [positions, setPositions] = useState<any[]>([]);
  const [selectedVotes, setSelectedVotes] = useState<{ [positionId: string]: string[] }>({});
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showReview, setShowReview] = useState(false);

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


  const handleSelect = (positionId: string, candidateId: string, maxVote: number) => {
    setSelectedVotes(prev => {
      const currentSelection = prev[positionId] || [];
      const isAlreadySelected = currentSelection.includes(candidateId);

      if (isAlreadySelected) {
        return {
          ...prev,
          [positionId]: currentSelection.filter(id => id !== candidateId)
        };
      }

      if (maxVote === 1) {
        return {
          ...prev,
          [positionId]: [candidateId]
        };
      }

      if (currentSelection.length < maxVote) {
        return {
          ...prev,
          [positionId]: [...currentSelection, candidateId]
        };
      }

      return prev;
    });
  };

  const filledCount = Object.values(selectedVotes).filter(arr => arr.length > 0).length;

  const handleSubmit = async () => {
    if (!activeElection?._id) return;
    setSubmitting(true);
    try {
      const votesArray = Object.entries(selectedVotes).map(([pId, candidateIds]) => ({
        positionId: pId,
        candidateIds: candidateIds
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-poppins">
      <Loader2 className="w-10 h-10 animate-spin text-[#2f318d] mb-4 opacity-40" />
      <p className="text-[#2f318d] text-[0.7rem] font-bold uppercase tracking-widest opacity-60">
        Loading Official Ballot
      </p>
    </div>
  );

  if (activeElection?.isLocked) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-6 font-poppins">
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 max-w-md w-full border border-slate-100 flex flex-col items-center">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-amber-50 rounded-full flex items-center justify-center text-red-500 mb-6 shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-red-400 opacity-10 animate-pulse rounded-full" />
          <AlertCircle className="w-10 h-10 md:w-12 md:h-12 relative z-10" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Election Period Pending</h1>
        <p className="text-slate-500 text-xs md:text-sm mt-3 leading-relaxed">
          The election <strong>{activeElection.title}</strong> is currently locked.
        </p>
      </div>
    </div>
  );

  if (hasVoted) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-6 font-poppins">
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 max-w-md w-full border border-slate-100 flex flex-col items-center">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6 shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-400 opacity-20 animate-ping rounded-full" />
          <ShieldCheck className="w-10 h-10 md:w-12 md:h-12 relative z-10" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Vote Successfully Cast!</h1>
        <p className="text-slate-500 text-xs md:text-sm mt-3 leading-relaxed">
          Your ballot has been securely recorded. Thank you for participating in the {activeElection?.title || 'current'} election.
        </p>
      </div>
    </div>
  );

  return (
    <div className="font-poppins text-slate-800 bg-slate-50 min-h-screen pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-10 md:pt-16">
        <header className="text-center mb-10 px-4">
          <h2 className="text-[0.65rem] md:text-[0.75rem] font-bold tracking-[0.07rem] text-[#2f318d] uppercase opacity-80 mb-2">
            MSU CICS Student Portal
          </h2>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-800">
            Official Ballot
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-3 max-w-xl mx-auto">
            Carefully review the candidates and select your preferred leaders for each position.
          </p>
        </header>

        <div className="space-y-24">
          {positions.map((pos) => {
            const maxVote: number = pos.maxVote ?? 1;
            const selected = selectedVotes[pos.positionId] || [];

            return (
              <div key={pos.positionId} className="flex flex-col items-center">
                <div className="relative mb-10 md:mb-14">
                  <div className="relative border-slate-100 px-6 md:px-8 py-2.5 md:py-3 rounded-full shadow-lg flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#2f318d] animate-pulse" />
                    <h2 className="text-xs md:text-sm lg:text-base font-bold tracking-widest text-[#2f318d] uppercase text-center">
                      {pos.positionName}
                    </h2>

                    {maxVote > 1 && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[#2f318d] text-[10px] font-bold">
                        {selected.length}/{maxVote} selected
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 w-full place-items-center px-2">
                  {pos.candidates.map((candidate: any) => {
                    const isSelected = selected.includes(candidate.candidateId);

                    const isFull = !isSelected && selected.length >= maxVote;
                    const partylistName = candidate.partylist || "Independent";

                    return (
                      <div
                        key={candidate.candidateId}
                        onClick={() => handleSelect(pos.positionId, candidate.candidateId, maxVote)}
                        className={`group relative cursor-pointer w-full max-w-70 sm:max-w-none sm:w-65 lg:w-70 aspect-3/4 rounded-4xl overflow-hidden transition-all duration-500 ease-out border-2
                          ${isSelected
                            ? "border-[#2f318d] shadow-2xl shadow-indigo-900/30 scale-[1.02] md:scale-105"
                            : isFull
                              ? "border-transparent shadow-md opacity-40 cursor-not-allowed"
                              : "border-transparent bg-white hover:border-indigo-50 shadow-md hover:shadow-xl hover:-translate-y-2"
                          }`}
                      >
                        <div className="absolute inset-0 bg-slate-100">
                          {candidate.profileImage ? (
                            <img
                              src={candidate.profileImage}
                              alt={candidate.name}
                              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${!isSelected && "grayscale group-hover:grayscale-0"}`}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                              <User size={64} className={isSelected ? 'text-[#2f318d]' : 'text-slate-300'} />
                            </div>
                          )}
                        </div>

                        <div className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-20 transition-all duration-500 ${isSelected
                          ? 'bg-[#2f318d] text-white scale-100 opacity-100 shadow-md'
                          : 'bg-white/90 backdrop-blur-sm text-slate-300 scale-75 opacity-0 group-hover:opacity-100'
                          }`}>
                          <Check size={16} strokeWidth={3} />
                        </div>

                        {isSelected && maxVote > 1 && (
                          <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-[#2f318d] text-white text-xs font-black flex items-center justify-center z-20 shadow-md">
                            {selected.indexOf(candidate.candidateId) + 1}
                          </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 pt-16 bg-linear-to-t from-slate-900/50 via-slate-900/20 to-transparent">
                          <div className={`w-full rounded-[1.25rem] p-4 transition-all duration-500 flex flex-col items-start text-left ${isSelected
                            ? "bg-[#2f318d] text-white shadow-[0_0_20px_rgba(47,49,141,0.3)]"
                            : "bg-white/95 backdrop-blur-md shadow-lg"
                            }`}>
                            <h3 className={`text-base md:text-lg font-black leading-tight line-clamp-2 w-full transition-colors mb-2 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                              {candidate.name}
                            </h3>
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[0.55rem] md:text-[0.6rem] font-black tracking-widest uppercase transition-colors ${isSelected
                              ? 'bg-white/20 text-indigo-50'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-[#2f318d]/10 group-hover:text-[#2f318d]'
                              }`}>
                              {partylistName}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[95%] sm:w-[92%] max-w-2xl z-40 transition-all duration-500">
        <div className="bg-white/90 border border-slate-200/50 shadow-[0_20px_50px_rgba(47,49,141,0.15)] rounded-3xl md:rounded-4xl p-3 md:p-4 flex justify-between items-center px-5 md:px-8">
          <div className="flex flex-col">
            <span className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-0.5">Your Progress</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[#2f318d] font-black text-lg md:text-2xl leading-none">{filledCount}</span>
              <span className="text-slate-300 font-medium">/</span>
              <span className="text-slate-500 font-bold text-xs md:text-base leading-none">{positions.length}</span>
              <span className="text-[10px] md:text-xs font-semibold text-slate-400 ml-1 hidden sm:inline">Filled</span>
            </div>
          </div>

          <button
            onClick={() => setShowReview(true)}
            disabled={filledCount === 0}
            className={`h-10 md:h-14 px-5 md:px-8 rounded-2xl md:rounded-[1.25rem] text-xs md:text-sm font-bold transition-all flex items-center gap-2 md:gap-2.5 active:scale-[0.98] ${filledCount > 0
              ? "bg-[#2f318d] text-white shadow-lg shadow-indigo-900/20 hover:bg-[#26287a]"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
          >
            <Eye size={16} />
            <span>Review Ballot</span>
          </button>
        </div>
      </div>

      {showReview && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl md:rounded-[2.5rem] shadow-2xl relative max-h-[90vh] md:max-h-[95vh] flex flex-col overflow-hidden">
            <div className="p-5 md:p-8 border-b border-slate-100 flex justify-between items-start bg-white z-10 shrink-0">
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-slate-800">Review Ballot</h2>
                <p className="text-[11px] md:text-sm text-slate-500 mt-1">Please verify your selections before submitting.</p>
              </div>
              <button onClick={() => setShowReview(false)} className="text-slate-400 hover:text-slate-600 p-1.5 md:p-2 bg-slate-50 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 md:p-8 overflow-y-auto flex-1 bg-slate-50/50">
              {filledCount < positions.length && (
                <div className="mb-5 md:mb-6 p-3 md:p-4 bg-amber-50 border border-amber-100 rounded-xl md:rounded-2xl flex gap-3 items-start">
                  <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-[11px] md:text-sm text-red-700 font-medium leading-relaxed">
                    You have left some positions blank. These will be counted as abstain.
                  </p>
                </div>
              )}

              <div className="space-y-2.5 md:space-y-4">
                {positions.map((pos) => {
                  const selected = selectedVotes[pos.positionId] || [];
                  const maxVote: number = pos.maxVote ?? 1;
                  const selectedCandidates = pos.candidates.filter((c: any) =>
                    selected.includes(c.candidateId)
                  );

                  return (
                    <div key={pos.positionId} className={`p-3 md:p-5 rounded-xl md:rounded-2xl border transition-colors ${selectedCandidates.length > 0
                      ? 'bg-white border-indigo-50 shadow-sm'
                      : 'bg-slate-50 border-slate-100 border-dashed'
                      }`}>
                      <div className="flex items-center gap-3 md:gap-4 mb-2">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${selectedCandidates.length > 0 ? 'bg-indigo-50 text-[#2f318d]' : 'bg-slate-200 text-slate-400'}`}>
                          {selectedCandidates.length > 0 ? <CheckCircle2 size={18} /> : <X size={18} />}
                        </div>
                        <div>
                          <p className="text-[0.6rem] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                            {pos.positionName}
                            {maxVote > 1 && (
                              <span className="ml-2 normal-case text-indigo-400">
                                (vote for up to {maxVote})
                              </span>
                            )}
                          </p>
                          {selectedCandidates.length === 0 ? (
                            <p className="text-xs md:text-base font-bold text-slate-400 italic">
                              No Candidate Selected (Abstain)
                            </p>
                          ) : (

                            <div className="flex flex-col gap-0.5">
                              {selectedCandidates.map((c: any, i: number) => (
                                <p key={c.candidateId} className="text-xs md:text-base font-bold text-slate-800">
                                  {maxVote > 1 && (
                                    <span className="text-[10px] text-[#2f318d] font-black mr-1.5">#{i + 1}</span>
                                  )}
                                  {c.name}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 md:p-8 bg-white border-t border-slate-100 flex flex-col gap-3 sm:flex-row md:gap-4 shrink-0">
              <button
                onClick={() => setShowReview(false)}
                className="w-full sm:flex-1 h-12 md:h-14 font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl md:rounded-2xl transition-colors text-xs md:text-sm order-2 sm:order-1"
              >
                Edit Selections
              </button>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full sm:flex-2 h-12 md:h-14 bg-[#2f318d] text-white rounded-xl md:rounded-2xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-[#26287a] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 text-xs md:text-sm order-1 sm:order-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Cast Final Vote</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-up {
          0% { transform: translate(-50%, 100%); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default VoterDashboard;