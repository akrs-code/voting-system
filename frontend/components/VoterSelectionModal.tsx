import { useEffect, useState, useMemo } from 'react';
import { X, Search, CheckCircle2, Loader2, Users, SlidersHorizontal, UserPlus, CheckSquare, Square, MinusSquare } from 'lucide-react';
import { voterService } from '../services/voterService';
import { electionService } from '../services/electionService';
import { Voter } from '../types/interface';
import Pagination from './Pagination';
import CustomDropdown from './CustomDropdown';
import { Building2, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  electionId: string;
  electionTitle: string;
  onClose: () => void;
}

const VoterSelectionModal = ({ electionId, electionTitle, onClose }: Props) => {
  const [allVoters, setAllVoters] = useState<Voter[]>([]);
  const [selectedVoterIds, setSelectedVoterIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const ordinals = ["", "1st", "2nd", "3rd", "4th"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [voters, assignedVoters] = await Promise.all([
          voterService.getAll(),
          electionService.getVoters(electionId)
        ]);
        setAllVoters(voters);
        setSelectedVoterIds(new Set(assignedVoters.map((v: any) => v._id)));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [electionId]);

  const filteredVoters = useMemo(() => {
    return allVoters.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.studentId.includes(searchQuery);
      const matchesDept = deptFilter === 'ALL' || v.department === deptFilter;
      const matchesYear = yearFilter === 'all' || v.yearLevel === parseInt(yearFilter);
      return matchesSearch && matchesDept && matchesYear;
    });
  }, [allVoters, searchQuery, deptFilter, yearFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, deptFilter, yearFilter]);

  const totalPages = Math.max(Math.ceil(filteredVoters.length / itemsPerPage), 1);

  const currentVoters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVoters.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVoters, currentPage]);

  const toggleVoter = (id: string) => {
    const newSelected = new Set(selectedVoterIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedVoterIds(newSelected);
  };

  const handleSelectFiltered = () => {
    const newSelected = new Set(selectedVoterIds);
    filteredVoters.forEach(v => newSelected.add(v._id));
    setSelectedVoterIds(newSelected);
  };

  const handleDeselectFiltered = () => {
    const newSelected = new Set(selectedVoterIds);
    filteredVoters.forEach(v => newSelected.delete(v._id));
    setSelectedVoterIds(newSelected);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await electionService.assignVoters(electionId, Array.from(selectedVoterIds));
      toast.success("Voter eligibility updated successfully.");
      onClose();
    } catch (error) {
      toast.error("Failed to save voter assignments.");
    } finally {
      setSaving(false);
    }
  };

  const isAllFilteredSelected = filteredVoters.length > 0 && filteredVoters.every(v => selectedVoterIds.has(v._id));
  const isSomeFilteredSelected = filteredVoters.some(v => selectedVoterIds.has(v._id)) && !isAllFilteredSelected;

  const toggleAllFiltered = () => {
    if (isAllFilteredSelected) {
      handleDeselectFiltered();
    } else {
      handleSelectFiltered();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="text-[#2f318d]" size={18} />
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Voter Alignment</h2>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Configuring eligibility for <span className="text-[#2f318d] font-bold">{electionTitle}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 md:p-6 bg-white border-b border-slate-100 space-y-4 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2f318d] transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search by name or ID..."
                className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] text-sm font-medium shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="lg:col-span-1">
              <CustomDropdown
                options={[
                  { label: 'All Departments', value: 'ALL' },
                  { label: 'DIS Department', value: 'DIS' },
                  { label: 'DCS Department', value: 'DCS' },
                ]}
                value={deptFilter}
                onChange={setDeptFilter}
                icon={<Building2 size={18} />}
                placeholder="Department"
              />
            </div>
            <div className="lg:col-span-1">
              <CustomDropdown
                options={[
                  { label: 'All Year Levels', value: 'all' },
                  { label: '1st Year', value: '1' },
                  { label: '2nd Year', value: '2' },
                  { label: '3rd Year', value: '3' },
                  { label: '4th Year', value: '4' },
                ]}
                value={yearFilter}
                onChange={setYearFilter}
                icon={<GraduationCap size={18} />}
                placeholder="Year Level"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-40">
              <Loader2 className="animate-spin text-[#2f318d] mb-4" size={40} />
              <span className="text-[0.7rem] font-bold uppercase tracking-widest text-[#2f318d]">Syncing Registry...</span>
            </div>
          ) : currentVoters.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-slate-400 font-medium italic">No voters match your current filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-md border-b border-slate-200">
                <tr>
                  <th className="px-6 md:px-10 py-4 w-16">
                    <button
                      onClick={toggleAllFiltered}
                      className="p-1 rounded-md transition-colors hover:bg-indigo-100 text-[#2f318d]"
                    >
                      {isAllFilteredSelected ? <CheckSquare size={20} /> : isSomeFilteredSelected ? <MinusSquare size={20} /> : <Square size={20} />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70">Student Name</th>
                  <th className="px-6 py-4 text-[#2f318d] font-bold text-[0.7rem] text-center uppercase tracking-widest opacity-70">ID Number</th>
                  <th className="px-6 py-4 text-[#2f318d] font-bold text-[0.7rem] text-center uppercase tracking-widest opacity-70">Academic Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentVoters.map((voter) => {
                  const isSelected = selectedVoterIds.has(voter._id);
                  return (
                    <tr
                      key={voter._id}
                      onClick={() => toggleVoter(voter._id)}
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/30' : ''}`}
                    >
                      <td className="px-6 md:px-10 py-4">
                        <div className={`p-1 rounded-md transition-colors ${isSelected ? 'text-[#2f318d]' : 'text-slate-300'}`}>
                          {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {voter.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider font-mono">
                          {voter.studentId}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2 items-center">
                          <span className="text-[#2f318d] text-[10px] font-bold px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100 uppercase tracking-wide">
                            {voter.department}
                          </span>
                          <span className="text-slate-400 text-[10px] font-semibold">
                            {ordinals[voter.yearLevel]} Year
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filteredVoters.length > itemsPerPage && (
          <div className="px-6 py-3 border-t border-slate-100 bg-white">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}

        <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selection Pool</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[#2f318d] font-black text-xl">{selectedVoterIds.size}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 font-bold text-sm">{allVoters.length}</span>
              <span className="text-[10px] font-bold text-slate-400 ml-1">ELIGIBLE</span>
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 h-12 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              disabled={saving || loading}
              onClick={handleSave}
              className="flex-1 sm:flex-none px-8 h-12 bg-[#2f318d] text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100/50 hover:bg-[#26287a] disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Update Eligibility Pool
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoterSelectionModal;
