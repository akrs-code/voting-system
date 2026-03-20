import React, { useEffect, useState } from 'react';
import { UserPlus, Loader2, Search, Trash2, X, AlertCircle, CheckCircle2, Filter } from 'lucide-react';
import { voterService } from '../services/voterService';

interface Voter {
  _id: string;
  studentId: string;
  name: string;
  department: "DIS" | "DCS" | "ALL";
  yearLevel: number;
  hasVoted: boolean;
}

const Voters = () => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    department: 'DIS',
    yearLevel: 1
  });

  const fetchVoters = async () => {
    try {
      setLoading(true);
      const data = await voterService.getAll();
      setVoters(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVoters(); }, []);

  const handleCreateVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await voterService.create({
        ...formData,
        yearLevel: Number(formData.yearLevel),
        password: formData.studentId
      });
      setShowModal(false);
      setFormData({ name: '', studentId: '', department: 'DIS', yearLevel: 1 });
      await fetchVoters();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add voter");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanent delete student record?")) return;
    try {
      await voterService.delete(id);
      setVoters(v => v.filter(item => item._id !== id));
    } catch (error) {
      alert("Delete failed");
    }
  };

  const filteredVoters = voters.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.studentId.includes(searchQuery)
  );

  return (
    <div className="max-w-[1200px] mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header & Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Voter Directory</h1>
          <p className="text-slate-500 text-sm font-normal">Manage student records and monitor voting status.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#2f318d] hover:bg-[#1e206b] text-white px-5 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-all active:scale-95 font-medium text-sm"
        >
          <UserPlus size={18} />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search by name or ID..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#2f318d]/10 focus:border-[#2f318d] transition-all text-sm placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Modern Data Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#2f318d] opacity-40 mb-3" />
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Updating Database...</p>
          </div>
        ) : filteredVoters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <AlertCircle className="w-10 h-10 text-slate-200 mb-3" />
             <p className="text-slate-400 text-sm">No student records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-8 py-4 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Student Name</th>
                  <th className="px-8 py-4 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Department</th>
                  <th className="px-8 py-4 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Voted Status</th>
                  <th className="px-8 py-4 text-slate-500 font-semibold text-[11px] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVoters.map((voter) => (
                  <tr key={voter._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 text-sm leading-none">{voter.name}</span>
                        <span className="text-slate-400 text-xs mt-1.5 font-mono">{voter.studentId}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-slate-700 text-sm font-medium">{voter.department}</span>
                        <span className="text-slate-400 text-[11px]">Level {voter.yearLevel}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        voter.hasVoted 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${voter.hasVoted ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {voter.hasVoted ? 'COMPLETED' : 'PENDING'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => handleDelete(voter._id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refined Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Register Student</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateVoter} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#2f318d] focus:ring-4 focus:ring-[#2f318d]/5 outline-none transition-all" placeholder="Enter full name" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Student ID</label>
                <input required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#2f318d] focus:ring-4 focus:ring-[#2f318d]/5 outline-none transition-all" placeholder="2024-XXXX" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Dept.</label>
                  <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value as any})} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2f318d]">
                    <option value="DIS">DIS</option>
                    <option value="DCS">DCS</option>
                    <option value="ALL">ALL</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Year</label>
                  <select value={formData.yearLevel} onChange={e => setFormData({...formData, yearLevel: Number(e.target.value)})} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2f318d]">
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={createLoading} className="flex-1 bg-[#2f318d] text-white rounded-lg py-2.5 text-sm font-medium shadow-md shadow-blue-900/10 flex items-center justify-center gap-2 active:scale-95 transition-all">
                  {createLoading ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Save Student</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Voters;