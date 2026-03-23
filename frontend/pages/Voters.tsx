import { useEffect, useState, useMemo } from 'react';
import {
  UserPlus,
  Loader2,
  Search,
  Trash2,
  X,
  Edit3,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { voterService } from '../services/voterService';
import Pagination from '../components/Pagination';

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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);

  const validationSchema = Yup.object({
    name: Yup.string()
      .min(2, "Name is too short")
      .matches(/^[a-zA-Z\s.-]+$/, "Name should only contain letters")
      .required("Name is required"),
    studentId: Yup.string()
      .matches(/^202\d{6}$/, "Institutional ID must start with 202 and be 9 digits")
      .required("Institutional ID is required"),
    department: Yup.string().required("Department is required"),
    yearLevel: Yup.number().required("Year level is required"),
  });

  const fetchVoters = async () => {
    try {
      setLoading(true);
      const data = await voterService.getAll();
      setVoters(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoters();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, yearFilter]);

  const handleOpenModal = (voter?: Voter) => {
    if (voter) {
      setIsEditing(true);
      setSelectedVoter(voter);
    } else {
      setIsEditing(false);
      setSelectedVoter(null);
    }
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this student record?")) return;
    try {
      await voterService.delete(id);
      setVoters(v => v.filter(item => item._id !== id));
    } catch (error) {
      alert("Delete failed. Please try again.");
    }
  };

  const filteredVoters = useMemo(() => {
    return voters.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.studentId.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' ? true :
        statusFilter === 'voted' ? v.hasVoted : !v.hasVoted;
      const matchesYear = yearFilter === 'all' ? true : v.yearLevel === parseInt(yearFilter);
      return matchesSearch && matchesStatus && matchesYear;
    });
  }, [voters, searchQuery, statusFilter, yearFilter]);

  const totalPages = Math.ceil(filteredVoters.length / itemsPerPage);
  const currentVoters = filteredVoters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 font-poppins">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 px-2">
        <div>
          <h2 className="text-[0.75rem] font-bold tracking-[0.07rem] text-[#2f318d] uppercase opacity-80 mb-1">
            MSU CICS Administration
          </h2>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Voter Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage institutional records and monitor real-time voting status.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="h-12 bg-[#2f318d] hover:bg-[#26287a] text-white px-6 rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-[0.97] font-bold text-sm"
        >
          <UserPlus size={18} />
          <span>Add New Student</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-2">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2f318d] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search students by name or ID..."
            className="w-full h-12 pl-12 pr-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] transition-all text-sm font-medium shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="relative">
          <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] appearance-none text-sm font-semibold text-slate-600 cursor-pointer shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="voted">Voted (Completed)</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="relative">
          <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] appearance-none text-sm font-semibold text-slate-600 cursor-pointer shadow-sm"
          >
            <option value="all">All Year Levels</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-[#2f318d] mb-4 opacity-40" />
            <p className="text-[#2f318d] text-[0.7rem] font-bold uppercase tracking-widest opacity-60">Synchronizing Database</p>
          </div>
        ) : filteredVoters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No matching student records found.</p>
            {(statusFilter !== 'all' || yearFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setYearFilter('all'); }}
                className="mt-4 text-[#2f318d] text-xs font-bold uppercase tracking-wider hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70">Student Details</th>
                    <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] text-center uppercase tracking-widest opacity-70">Academic Unit</th>
                    <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-center">Vote Status</th>
                    <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentVoters.map((voter) => (
                    <tr key={voter._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-10 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[0.95rem]">{voter.name}</span>
                          <span className="text-slate-400 text-xs mt-1 font-mono uppercase">{voter.studentId}</span>
                        </div>
                      </td>
                      <td className="px-10 py-4 text-center">
                        <div className="flex justify-center gap-2 items-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex flex-row items-center justify-center gap-2">
                              <span className="text-[#2f318d] text-[10px] font-bold px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100 uppercase tracking-wide">
                                {voter.department}
                              </span>
                              <span className="text-slate-400 text-[11px] font-semibold">
                                {voter.yearLevel ? `Year ${voter.yearLevel}` : 'Open Level'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-4 text-center">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold border ${voter.hasVoted
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${voter.hasVoted ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          {voter.hasVoted ? 'COMPLETED' : 'PENDING'}
                        </div>
                      </td>
                      <td className="px-10 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenModal(voter)} className="p-2.5 bg-slate-100 text-slate-500 hover:bg-[#2f318d] hover:text-white rounded-xl transition-all">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDelete(voter._id)} className="p-2.5 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 relative">
            <button onClick={() => setShowModal(false)} className="absolute right-8 top-8 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">{isEditing ? 'Update Student' : 'Register Student'}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {isEditing ? 'Modify institutional record.' : 'Firstname in lowercase will be their initial password.'}
              </p>
            </div>
            <Formik
              enableReinitialize
              initialValues={{
                name: selectedVoter?.name || '',
                studentId: selectedVoter?.studentId || '',
                department: selectedVoter?.department || 'DIS',
                yearLevel: selectedVoter?.yearLevel || 1,
              }}
              validationSchema={validationSchema}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  if (isEditing && selectedVoter) {
                    await voterService.update(selectedVoter._id, values);
                  } else {
                    const initialPassword = values.name.trim().split(' ')[0].toLowerCase();
                    await voterService.create({ ...values, password: initialPassword });
                  }
                  setShowModal(false);
                  await fetchVoters();
                } catch (err: any) {
                  alert(err.response?.data?.error || "Transaction failed");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <Field name="name" placeholder="John Doe" className={`h-14 w-full border px-5 rounded-2xl outline-none transition-all ${errors.name && touched.name ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-[#2f318d]'}`} />
                    <ErrorMessage name="name" component="div" className="text-xs text-red-500 font-bold ml-2" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Institutional ID</label>
                    <Field name="studentId" placeholder="202XXXXXX" className={`h-14 w-full border px-5 rounded-2xl outline-none transition-all ${errors.studentId && touched.studentId ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-[#2f318d]'}`} />
                    <ErrorMessage name="studentId" component="div" className="text-xs text-red-500 font-bold ml-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Dept.</label>
                      <Field as="select" name="department" className="h-14 w-full border border-slate-200 bg-slate-50/50 px-4 rounded-2xl text-sm font-bold text-[#2f318d] outline-none">
                        <option value="DIS">DIS</option>
                        <option value="DCS">DCS</option>
                        <option value="ALL">ALL</option>
                      </Field>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Year Level</label>
                      <Field as="select" name="yearLevel" className="h-14 w-full border border-slate-200 bg-slate-50/50 px-4 rounded-2xl text-sm font-bold text-[#2f318d] outline-none">
                        {[1, 2, 3, 4].map(lvl => <option key={lvl} value={lvl}>{lvl} Year</option>)}
                      </Field>
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="h-14 w-full bg-[#2f318d] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 mt-4">
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle2 size={20} /> {isEditing ? 'Update Record' : 'Register Student'}</>}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
};

export default Voters;