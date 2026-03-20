import React, { useEffect, useState } from 'react';
import { UserPlus, Loader2, Plus, Calendar, Trash2, X, CheckCircle2, Clock, MoreHorizontal } from 'lucide-react';
import { electionService } from '../services/electionService';

interface Election {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const Elections = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const data = await electionService.getAll();
      setElections(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchElections(); }, []);

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(newEndDate) <= new Date(newStartDate)) return alert("Invalid Dates");
    setCreateLoading(true);
    try {
      await electionService.create({ title: newTitle, startDate: newStartDate, endDate: newEndDate });
      setShowModal(false);
      setNewTitle('');
      setNewStartDate('');
      setNewEndDate('');
      await fetchElections();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setProcessingId(id);
    try {
      await electionService.toggleActive(id);
      setElections(prev => prev.map(el => ({ ...el, isActive: el._id === id ? !currentStatus : false })));
    } catch (error) {
      alert("Failed to update");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanent delete?")) return;
    try {
      await electionService.delete(id);
      setElections(prev => prev.filter(el => el._id !== id));
    } catch (error) {
      alert("Failed");
    }
  };

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Elections</h1>
            <p className="text-slate-500 text-sm mt-1">Configure and manage active voting cycles.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-all font-medium text-sm"
          >
            <Plus size={18} /> New Election
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2 opacity-40" />
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Loading Elections...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="px-8 py-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Election Details</th>
                    <th className="px-8 py-4 text-slate-400 font-medium text-xs uppercase tracking-wider text-center">Status</th>
                    <th className="px-8 py-4 text-slate-400 font-medium text-xs uppercase tracking-wider text-right">Enable / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {elections.map((election) => (
                    <tr key={election._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-[15px] font-semibold text-slate-700">{election.title}</span>
                          <div className="flex items-center gap-2 text-slate-400 text-xs mt-1.5">
                            <Calendar size={13} />
                            <span>{new Date(election.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="opacity-30">—</span>
                            <span>{new Date(election.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          election.isActive 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-slate-100 text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${election.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          {election.isActive ? 'Live' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-6">
                          {/* Toggle Switch */}
                          <button 
                            disabled={processingId === election._id}
                            onClick={() => handleToggleActive(election._id, election.isActive)}
                            className={`group relative w-11 h-6 flex items-center rounded-full px-1 transition-all duration-300 ${
                                election.isActive ? 'bg-blue-600' : 'bg-slate-200'
                            } ${processingId === election._id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${
                                election.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>

                          <div className="flex items-center gap-1">
                            <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Manage Voters">
                              <UserPlus size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(election._id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modern Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                   <Clock size={20} />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">New Election</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateElection} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Election Title</label>
                <input 
                  required 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                  placeholder="e.g. Student Council 2026" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</label>
                  <input 
                    type="date" 
                    required 
                    value={newStartDate} 
                    onChange={(e) => setNewStartDate(e.target.value)} 
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</label>
                  <input 
                    type="date" 
                    required 
                    value={newEndDate} 
                    onChange={(e) => setNewEndDate(e.target.value)} 
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer" 
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 rounded-md py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createLoading} 
                  className="flex-1 bg-blue-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {createLoading ? <Loader2 size={16} className="animate-spin" /> : 'Create Election'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Elections;