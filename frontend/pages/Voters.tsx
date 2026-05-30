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
  FileSpreadsheet,
} from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { voterService } from '../services/voterService';
import Pagination from '../components/Pagination';
import CustomDropdown from '../components/CustomDropdown';
import { Voter } from 'types/interface';
import { VoterReports } from "../utils/voterReports";
import { useActiveElection } from '../hooks/useActiveElection';
import { CheckCircle2 as CheckIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const Voters = () => {
  const { activeElection } = useActiveElection();
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
      .matches(/^20\d{7}$/, "Institutional ID must start with 20 and be 9 digits")
      .required("Institutional ID is required"),
    email: Yup.string()
      .email("Invalid email")
      .matches(/@s.msumain.edu.ph$/, "Must be an @s.msumain.edu.ph email")
      .required("Institutional email is required"),
    department: Yup.string()
      .oneOf(['DIS', 'DCS'], "Select a valid department")
      .required("Department is required"),
    yearLevel: Yup.number()
      .oneOf([1, 2, 3, 4], "Select a valid year level")
      .required("Year level is required"),
    password: Yup.string().when([], {
      is: () => !isEditing,
      then: (schema) =>
        schema.min(6, "Password must be at least 6 characters").required("Password is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  const fetchVoters = async () => {
    try {
      setLoading(true);
      const data = await voterService.getAll();
      setVoters(data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch voter records.");
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
      await fetchVoters();
      toast.success("Student record deleted successfully.");
    } catch (error) {
      toast.error("Delete failed. Please try again.");
    }
  };

  const filteredVoters = useMemo(() => {
    return voters.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.studentId || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' ? true :
        statusFilter === 'voted' ? v.hasVoted : !v.hasVoted;
      const matchesYear = yearFilter === 'all' ? true : v.yearLevel === parseInt(yearFilter);
      return matchesSearch && matchesStatus && matchesYear;
    });
  }, [voters, searchQuery, statusFilter, yearFilter]);

  const totalPages = Math.max(Math.ceil(filteredVoters.length / itemsPerPage), 1);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const currentVoters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVoters.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVoters, currentPage]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-10 font-poppins">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <h2 className="text-[0.7rem] md:text-[0.75rem] font-bold tracking-[0.07rem] text-[#2f318d] uppercase opacity-80 mb-1">
            MSU CICS Administration
          </h2>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Voter Records</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Manage institutional records and monitor real-time voting status.</p>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={() => VoterReports(voters, activeElection?.title || "MSU CICS Election")}
            className="h-12 w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.97] font-bold text-sm"
          >
            <FileSpreadsheet size={18} />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="h-12 w-full md:w-auto bg-[#2f318d] hover:bg-[#26287a] text-white px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.97] font-bold text-sm"
          >
            <UserPlus size={18} />
            <span>Add New Student</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative group sm:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2f318d] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by name or ID..."
            className="w-full h-12 pl-12 pr-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] transition-all text-sm font-medium shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="lg:col-span-1">
          <CustomDropdown
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'Voted', value: 'voted' },
              { label: 'Pending', value: 'pending' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            icon={<CheckIcon size={18} />}
            placeholder="Status"
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
            placeholder="Year Level"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-[#2f318d] mb-4 opacity-40" />
            <p className="text-[#2f318d] text-[0.7rem] font-bold uppercase tracking-widest opacity-60">Synchronizing Database</p>
          </div>
        ) : filteredVoters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No matching student records found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse min-w-175">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70">Student Details</th>
                    <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] text-center uppercase tracking-widest opacity-70">Academic Unit</th>
                    <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-center">Vote Status</th>
                    <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentVoters.map((voter) => (
                    <tr key={voter._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 md:px-10 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm md:text-[0.95rem]">{voter.name}</span>
                          <span className="mt-1 text-[11px] text-slate-400 font-medium">{voter.studentId}</span>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-4 text-center">
                        <div className="flex justify-center gap-2 items-center">
                          <span className="text-[#2f318d] text-[10px] font-bold px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100 uppercase tracking-wide">
                            {voter.department}
                          </span>
                          <span className="text-slate-400 text-[11px] font-semibold">
                            {voter.yearLevel ? `${['', '1st', '2nd', '3rd', '4th'][voter.yearLevel]} Year` : 'Open Level'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-4 text-center">
                        <div className={`inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-[10px] font-bold border ${voter.hasVoted
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${voter.hasVoted ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          {voter.hasVoted ? 'COMPLETED' : 'PENDING'}
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-4 text-right">
                        <div className="flex justify-end gap-2.5">
                          <button
                            onClick={() => handleOpenModal(voter)}
                            title="Edit Student"
                            className="p-2.5 bg-slate-100 text-slate-500 hover:bg-[#2f318d] hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(voter._id)}
                            title="Delete Student"
                            className="p-2.5 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                          >
                            <Trash2 size={18} />
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

      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-lg bg-white rounded-4xl md:rounded-[2.5rem] shadow-2xl p-6 md:p-10 relative max-h-[95vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute right-6 top-6 md:right-8 md:top-8 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">{isEditing ? 'Update Student' : 'Register Student'}</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                {isEditing ? 'Modify institutional record.' : 'Set login credentials for the student.'}
              </p>
            </div>
            <Formik
              enableReinitialize
              initialValues={{
                name: selectedVoter?.name || '',
                studentId: selectedVoter?.studentId || '',
                email: selectedVoter?.email || '',
                department: selectedVoter?.department || 'DIS',
                yearLevel: selectedVoter?.yearLevel || 1,
                password: '',
              }}
              validationSchema={validationSchema}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  if (isEditing && selectedVoter) {
                    const payload: any = { ...values };
                    if (!values.password) delete payload.password;
                    await voterService.update(selectedVoter._id, payload);
                    toast.success("Student profile updated.");
                  } else {
                    await voterService.create(values);
                    toast.success("New student registered.");
                  }
                  setShowModal(false);
                  await fetchVoters();
                } catch (err: any) {
                  const serverMessage = err.response?.data?.message || err.response?.data?.error || "Student record update failed. Please try again.";
                  toast.error(serverMessage);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, errors, touched, values, setFieldValue }) => (
                <Form className="space-y-4 md:space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-semibold text-slate-700">Full Name</label>
                    <Field name="name" placeholder="John Doe" className={`h-12 md:h-14 w-full border px-4 md:px-5 rounded-2xl outline-none transition-all text-sm ${errors.name && touched.name ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-[#2f318d]'}`} />
                    <ErrorMessage name="name" component="div" className="text-[10px] text-red-500 font-bold ml-1" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-semibold text-slate-700">Institutional ID</label>
                    <Field name="studentId" placeholder="202XXXXXX" className={`h-12 md:h-14 w-full border px-4 md:px-5 rounded-2xl outline-none transition-all text-sm ${errors.studentId && touched.studentId ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-[#2f318d]'}`} />
                    <ErrorMessage name="studentId" component="div" className="text-[10px] text-red-500 font-bold ml-1" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-semibold text-slate-700">Institutional Email</label>
                    <Field
                      name="email"
                      type="email"
                      placeholder="student@email.com"
                      className={`h-12 md:h-14 w-full border px-4 md:px-5 rounded-2xl outline-none transition-all text-sm ${errors.email && touched.email
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-200 focus:border-[#2f318d]'
                        }`}
                    />
                    <ErrorMessage name="email" component="div" className="text-[10px] text-red-500 font-bold ml-1" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-semibold text-slate-700">Password</label>
                    <Field
                      name="password"
                      type="password"
                      placeholder={isEditing ? "Keep empty to skip" : "Enter password"}
                      className={`h-12 md:h-14 w-full border px-4 md:px-5 rounded-2xl outline-none transition-all text-sm ${errors.password && touched.password
                        ? 'border-red-300 bg-red-50'
                        : 'border-slate-200 focus:border-[#2f318d]'
                        }`}
                    />
                    <ErrorMessage name="password" component="div" className="text-[10px] text-red-500 font-bold ml-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-semibold text-slate-700">Department</label>
                      <CustomDropdown
                        options={[
                          { label: 'DIS Department', value: 'DIS' },
                          { label: 'DCS Department', value: 'DCS' },
                        ]}
                        value={values.department}
                        onChange={(val) => setFieldValue('department', val)}
                        placeholder="Select Department"
                      />
                      <ErrorMessage name="department" component="div" className="text-[10px] text-red-500 font-bold ml-1" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-semibold text-slate-700">Year</label>
                      <CustomDropdown
                        options={[
                          { label: '1st Year', value: '1' },
                          { label: '2nd Year', value: '2' },
                          { label: '3rd Year', value: '3' },
                          { label: '4th Year', value: '4' },
                        ]}
                        value={values.yearLevel.toString()}
                        onChange={(val) => setFieldValue('yearLevel', parseInt(val))}
                        placeholder="Select Year"
                      />
                      <ErrorMessage name="yearLevel" component="div" className="text-[10px] text-red-500 font-bold ml-1" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="h-12 md:h-14 w-full bg-[#2f318d] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 mt-2">
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle2 size={18} /> {isEditing ? 'Update Record' : 'Register Student'}</>}
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