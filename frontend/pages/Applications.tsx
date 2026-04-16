import { useEffect, useState, useMemo } from 'react';
import {
  Loader2,
  Search,
  XCircle,
  SlidersHorizontal,
  Clock,
  UserCheck,
  Eye,
  X,
  AlertCircle
} from 'lucide-react';
import { authService } from '../services/authService';
import Pagination from '../components/Pagination';
import { User } from '../types/interface';

const Applications = () => {
  const [applications, setApplications] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedApp, setSelectedApp] = useState<User | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await authService.getPendingApplications();
      setApplications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    const message = action === 'approved'
      ? "Approve this student for voting access?"
      : "Reject and delete this application?";

    if (!window.confirm(message)) return;

    try {
      setIsProcessing(true);
      await authService.manageApplication(id, action);
      setApplications(prev => prev.filter(app => app._id !== id));
      setShowViewModal(false);
    } catch (error: any) {
      const serverMessage = error.response?.data?.error || "Action failed. Please try again.";
      alert(serverMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDetails = (app: User) => {
    setSelectedApp(app);
    setShowViewModal(true);
  };

  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.studentId.includes(searchQuery);
      const matchesDept = deptFilter === 'all' ? true : app.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [applications, searchQuery, deptFilter]);

  const totalPages = Math.max(Math.ceil(filteredApps.length / itemsPerPage), 1);
  const currentApps = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredApps.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredApps, currentPage]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-10 font-poppins">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <h2 className="text-[0.7rem] md:text-[0.75rem] font-bold tracking-[0.07rem] text-[#2f318d] uppercase opacity-80 mb-1">
            Membership Gatekeeper
          </h2>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Pending Applications</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Review and verify student registrations for the election cycle.</p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 self-start md:self-center">
          <Clock className="text-[#2f318d]" size={18} />
          <span className="text-[#2f318d] font-semibold text-sm">{applications.length} Requests Pending</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative group sm:col-span-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2f318d] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search applicants by name or ID..."
            className="w-full h-12 pl-12 pr-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] transition-all text-sm font-medium shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="relative">
          <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] appearance-none text-sm font-semibold text-slate-600 cursor-pointer shadow-sm"
          >
            <option value="all">All Departments</option>
            <option value="DIS">DIS</option>
            <option value="DCS">DCS</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-[#2f318d] mb-4 opacity-40" />
            <p className="text-[#2f318d] text-[0.7rem] font-bold uppercase tracking-widest opacity-60">Loading Applications</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-200 text-[0.7rem] font-bold uppercase tracking-widest">Inbox clear. No pending applications.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse min-w-175">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70">Applicant Details</th>
                    <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] text-center uppercase tracking-widest opacity-70">Academic Unit</th>
                    <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-center">Status</th>
                    <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentApps.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 md:px-10 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm md:text-[0.95rem]">{app.name}</span>
                          <span className="mt-1 text-[11px] text-slate-400 font-medium">{app.studentId}</span>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-4 text-center">
                        <div className="flex justify-center gap-2 items-center">
                          <span className="text-[#2f318d] text-[10px] font-bold px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100 uppercase tracking-wide">
                            {app.department}
                          </span>
                          <span className="text-slate-400 text-[11px] font-semibold">
                            {app.yearLevel ? `Year ${app.yearLevel}` : 'Pending Level'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-4 text-center">
                        <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-600 border-amber-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          REVIEW REQUIRED
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleViewDetails(app)} className="p-2 md:p-2.5 bg-slate-100 text-slate-500 hover:bg-[#2f318d] hover:text-white rounded-xl transition-all">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => handleAction(app._id, 'approved')} className="p-2 md:p-2.5 bg-slate-100 text-slate-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all">
                            <UserCheck size={15} />
                          </button>
                          <button onClick={() => handleAction(app._id, 'rejected')} className="p-2 md:p-2.5 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                            <XCircle size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-50">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </>
        )}
      </div>

      {showViewModal && selectedApp && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-md bg-white rounded-4xl md:rounded-[2.5rem] shadow-2xl p-6 md:p-10 relative max-h-[95vh] overflow-y-auto">
            <button
              onClick={() => setShowViewModal(false)}
              className="absolute right-6 top-6 md:right-8 md:top-8 text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
            >
              <X size={20} />
            </button>

            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Application Details</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1">Verify student information before approval.</p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
              <div className="space-y-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#2f318d] uppercase tracking-widest opacity-60 mb-1">Full Name</span>
                  <span className="text-lg font-bold text-slate-800">{selectedApp.name}</span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#2f318d] uppercase tracking-widest opacity-60 mb-1">Institutional Email</span>
                    <span className="text-sm font-semibold text-slate-600">{selectedApp.email}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#2f318d] uppercase tracking-widest opacity-60 mb-1">Student ID Number</span>
                    <span className="text-sm font-mono font-bold text-slate-700">{selectedApp.studentId}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200/60 grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#2f318d] uppercase tracking-widest opacity-60 mb-1">Department</span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span className="text-sm font-bold text-slate-800">{selectedApp.department}</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#2f318d] uppercase tracking-widest opacity-60 mb-1">Year Level</span>
                    <span className="text-sm font-bold text-slate-800">{selectedApp.yearLevel} Year</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                disabled={isProcessing}
                onClick={() => handleAction(selectedApp._id, 'approved')}
                className="h-14 w-full bg-[#2f318d] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-[#26287a] active:scale-[0.98] shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <UserCheck size={18} />}
                Approve Application
              </button>
              <button
                disabled={isProcessing}
                onClick={() => handleAction(selectedApp._id, 'rejected')}
                className="h-14 w-full bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;