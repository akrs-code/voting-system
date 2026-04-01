import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  Plus, Loader2, Trash2, X, Edit3,
  CheckCircle2, AlertCircle, Search,
  Building2, Briefcase, Camera
} from 'lucide-react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { candidateService } from '../services/candidateService';
import { positionService } from '../services/positionService';
import { electionService } from '../services/electionService';
import Pagination from '../components/Pagination';
import { Candidate } from 'types/interface';

const FormWatcher = ({ onElectionChange }: { onElectionChange: (id: string) => void }) => {
  const { values } = useFormikContext<{ electionId: string }>();
  
  useEffect(() => {
    onElectionChange(values.electionId);
  }, [values.electionId, onElectionChange]);

  return null;
};

const Candidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [modalPositions, setModalPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCand, setSelectedCand] = useState<Candidate | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const validationSchema = Yup.object({
    name: Yup.string().min(3, "Too short").required("Required"),
    partylist: Yup.string().required("Required"),
    department: Yup.string().required("Required"),
    position: Yup.string().required("Required"),
    electionId: Yup.string().required("Required"),
    yearLevel: Yup.number().nullable().typeError("Must be a number"),
  });


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const dept = selectedDepartment || "ALL";
      const [candData, elData, posData] = await Promise.all([
        candidateService.getAll(dept, selectedElectionId),
        electionService.getAll(),
        positionService.getPositions("ALL", selectedElectionId)
      ]);
      setCandidates(candData);
      setElections(elData);
      setPositions(posData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment, selectedElectionId]);

  const handleElectionChangeInModal = useCallback(async (electionId: string) => {
    if (!electionId) {
      setModalPositions([]);
      return;
    }
    try {
      const data = await positionService.getPositions("ALL", electionId);
      setModalPositions(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData])

  const filteredCandidates = useMemo(() => {
    setCurrentPage(1);
    return candidates.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.partylist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.position?.name.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [candidates, searchTerm]);

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const currentCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (cand?: Candidate) => {
    setIsEditing(!!cand);
    setSelectedCand(cand || null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this candidate?")) return;
    try {
      await candidateService.delete(id);
      fetchData();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 font-poppins">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 px-2">
        <div>
          <h2 className="text-[0.75rem] font-bold tracking-[0.07rem] text-[#2f318d] uppercase opacity-80 mb-1">MSU CICS Administration</h2>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Candidate Registry</h1>
          <p className="text-slate-500 text-sm mt-1">Manage student representatives and their respective partylists.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="h-12 bg-[#2f318d] hover:bg-[#26287a] text-white px-6 rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-[0.97] font-bold text-sm"
        >
          <Plus size={18} /> Add Candidate
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2f318d] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search candidates..."
            className="w-full h-12 pl-12 pr-4 border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] transition-all bg-white shadow-sm font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <select
            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] appearance-none text-sm font-semibold text-slate-600 cursor-pointer shadow-sm"
            value={selectedElectionId}
            onChange={(e) => setSelectedElectionId(e.target.value)}
          >
            <option value="">All Election Cycles</option>
            {elections.map(el => <option key={el._id} value={el._id}>{el.title}</option>)}
          </select>
        </div>

        <div className="relative">
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <select
            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] appearance-none text-sm font-semibold text-slate-600 cursor-pointer shadow-sm"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            <option value="ALL">General (ALL)</option>
            <option value="DIS">DIS</option>
            <option value="DCS">DCS</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-[#2f318d] mb-4 opacity-40" />
            <p className="text-[#2f318d] text-[0.7rem] font-bold uppercase tracking-widest opacity-60">Synchronizing Registry</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No candidates match your current filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70">Candidate Details</th>
                    <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-center">Partylist</th>
                    <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-center">Eligibility Scope</th>
                    <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentCandidates.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-10 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.profilePicture || "https://ui-avatars.com/api/?name=" + c.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-100"
                            alt={c.name}
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-[0.95rem]">{c.name}</span>
                            <span className="text-slate-400 text-[0.75rem] font-medium italic">{c.position?.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className="font-semibold text-slate-700 text-sm">{c.partylist}</span>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-full text-[10px] font-bold">
                          {c.department} {c.yearLevel && <span className="opacity-50 ml-1">Year {c.yearLevel}</span>}
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end items-center gap-3">
                          <button onClick={() => handleOpenModal(c)} className="p-2.5 bg-slate-100 text-slate-500 hover:bg-[#2f318d] hover:text-white rounded-xl transition-all shadow-sm">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => handleDelete(c._id)} className="p-2.5 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm">
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
          <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-10 relative animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto border border-white/20">
            <button onClick={() => setShowModal(false)} className="absolute right-8 top-8 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">{isEditing ? 'Edit Profile' : 'New Candidate'}</h2>
              <p className="text-sm text-slate-500 mt-1">Configure candidate background and electoral scope.</p>
            </div>

            <Formik
              enableReinitialize
              initialValues={{
                name: selectedCand?.name || '',
                partylist: selectedCand?.partylist || '',
                department: selectedCand?.department || 'ALL',
                position: selectedCand?.position?._id || '',
                electionId: selectedCand?.election?._id || selectedElectionId || '',
                yearLevel: selectedCand?.yearLevel || '',
              }}
              validationSchema={validationSchema}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                try {
                  const formData = new FormData();
                  Object.keys(values).forEach(key => {
                    formData.append(key, (values as any)[key]);
                  });

                  if (fileInputRef.current?.files?.[0]) {
                    formData.append('image', fileInputRef.current.files[0]);
                  }

                  if (isEditing && selectedCand) await candidateService.update(selectedCand._id, formData);
                  else await candidateService.create(formData);

                  setShowModal(false);
                  resetForm();
                  fetchData();
                } catch (err: any) {
                  alert(err.response?.data?.error || "Transaction failed");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, errors, touched, values }) => (
                <Form className="space-y-6">
                  <FormWatcher onElectionChange={handleElectionChangeInModal} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <div className="md:col-span-2 flex justify-center mb-4">
                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-40 h-40 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-[#2f318d] group-hover:bg-indigo-50">
                          {selectedCand?.profilePicture ? (
                            <img src={selectedCand.profilePicture} className="w-full h-full object-cover" alt="preview" />
                          ) : (
                            <>
                              <Camera className="text-slate-400 group-hover:text-[#2f318d] mb-1" size={28} />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-[#2f318d]">Upload Photo</span>
                            </>
                          )}
                        </div>
                        <input type="file" ref={fileInputRef} hidden accept="image/*" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                      <Field name="name" placeholder="e.g. Juan Dela Cruz" className={`h-14 w-full border px-5 rounded-2xl outline-none transition-all ${errors.name && touched.name ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-[#2f318d]'}`} />
                      <ErrorMessage name="name" component="div" className="text-xs text-red-500 font-bold ml-2" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Partylist</label>
                      <Field name="partylist" placeholder="e.g. Progressive Alliance" className={`h-14 w-full border px-5 rounded-2xl outline-none transition-all ${errors.partylist && touched.partylist ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-[#2f318d]'}`} />
                      <ErrorMessage name="partylist" component="div" className="text-xs text-red-500 font-bold ml-2" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Election Cycle</label>
                      <Field as="select" name="electionId" className="h-14 w-full border border-slate-200 px-5 rounded-2xl outline-none focus:border-[#2f318d] bg-slate-50/50 font-bold text-[#2f318d] appearance-none cursor-pointer">
                        <option value="">Select Election Cycle...</option>
                        {elections.map(el => <option key={el._id} value={el._id}>{el.title}</option>)}
                      </Field>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Target Position</label>
                      <Field as="select" name="position" className="h-14 w-full border border-slate-200 px-5 rounded-2xl outline-none focus:border-[#2f318d] bg-slate-50/50 font-bold text-[#2f318d] appearance-none cursor-pointer">
                        <option value="">{values.electionId ? "Select Position..." : "Pick an Election first"}</option>
                        {modalPositions.map(pos => <option key={pos._id} value={pos._id}>{pos.name}</option>)}
                      </Field>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Department Scope</label>
                      <Field as="select" name="department" className="h-14 w-full border border-slate-200 px-5 rounded-2xl outline-none focus:border-[#2f318d] bg-slate-50/50 font-bold text-[#2f318d] appearance-none cursor-pointer">
                        <option value="ALL">ALL (College-wide)</option>
                        <option value="DIS">DIS (Information Tech&Systems)</option>
                        <option value="DCS">DCS (Computer Science)</option>
                      </Field>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Year Level (only for representative)</label>
                      <Field as="select"
                        name="yearLevel" className="h-14 w-full border border-slate-200 px-5 rounded-2xl outline-none focus:border-[#2f318d] bg-slate-50/50 font-bold text-[#2f318d] appearance-none cursor-pointer">
                        <option value="null"></option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </Field>
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="h-14 w-full bg-[#2f318d] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-lg shadow-indigo-100">
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle2 size={20} /> <span>{isEditing ? 'Save Profile' : 'Register Candidate'}</span></>}
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

export default Candidates;