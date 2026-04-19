import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  Plus, Loader2, Trash2, X, Edit3, CheckCircle2, AlertCircle,
  Search, Building2, Briefcase, Camera, ChevronDown,
} from 'lucide-react';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { candidateService } from '../services/candidateService';
import { positionService } from '../services/positionService';
import { electionService } from '../services/electionService';
import Pagination from '../components/Pagination';
import { Candidate } from 'types/interface';

const FormWatcher = ({ onFilterChange }: { onFilterChange: (electionId: string, dept: string) => void }) => {
  const { values, setFieldValue } = useFormikContext<{ electionId: string; department: string; position: string }>();
  const prevValues = useRef({ electionId: values.electionId, department: values.department });

  useEffect(() => {
    if (prevValues.current.electionId !== values.electionId || prevValues.current.department !== values.department) {
      setFieldValue('position', '');
      prevValues.current = { electionId: values.electionId, department: values.department };
    }
    if (values.electionId) {
      onFilterChange(values.electionId, values.department);
    }
  }, [values.electionId, values.department, onFilterChange, setFieldValue]);

  return null;
};

const Candidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<any[]>([]);
  const [modalPositions, setModalPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCand, setSelectedCand] = useState<Candidate | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const validationSchema = Yup.object({
    name: Yup.string().min(3, "Name too short").required("Full name is required"),
    partylist: Yup.string().required("Partylist is required"),
    position: Yup.string().required("Position is required"),
    electionId: Yup.string().required("Election cycle is required"),
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [candData, elData] = await Promise.all([
        candidateService.getAll(selectedDepartment, selectedElectionId),
        electionService.getAll()
      ]);
      setCandidates(candData);
      setElections(elData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment, selectedElectionId]);

  const handleModalFilterChange = useCallback(async (electionId: string, department: string) => {
    if (!electionId) {
      setModalPositions([]);
      return;
    }
    try {
      const data = await positionService.getPositions(department, electionId);
      setModalPositions(data);
    } catch (error) {
      setModalPositions([]);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.partylist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.position?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [candidates, searchTerm]);

  const currentCandidates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCandidates.slice(start, start + itemsPerPage);
  }, [filteredCandidates, currentPage]);

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);

  const handleOpenModal = (cand?: Candidate) => {
    setIsEditing(!!cand);
    setSelectedCand(cand || null);
    setPreviewUrl(cand?.profilePicture || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCand(null);
    setPreviewUrl(null);
    setModalPositions([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanent Action: Remove this candidate?")) return;
    try {
      await candidateService.delete(id);
      fetchData();
    } catch {
      alert("Error: Could not remove candidate.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-10 font-poppins">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <h2 className="text-[0.7rem] md:text-[0.75rem] font-bold tracking-[0.07rem] text-[#2f318d] uppercase opacity-80 mb-1">
            MSU CICS Administration
          </h2>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Candidate Registry</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Found {filteredCandidates.length} registered candidates.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="h-12 w-full md:w-auto bg-[#2f318d] hover:bg-[#26287a] text-white px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.97] font-bold text-sm"
        >
          <Plus size={18} />
          <span>Add Candidate</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative group sm:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2f318d] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search candidates..."
            className="w-full h-12 pl-12 pr-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] transition-all text-sm font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <select
            className="w-full h-12 pl-12 pr-10 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] appearance-none text-sm font-semibold text-slate-600 cursor-pointer shadow-sm"
            value={selectedElectionId}
            onChange={(e) => setSelectedElectionId(e.target.value)}
          >
            <option value="">All Election Cycles</option>
            {elections.map(el => <option key={el._id} value={el._id}>{el.title}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
        </div>

        <div className="relative">
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <select
            className="w-full h-12 pl-12 pr-10 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] appearance-none text-sm font-semibold text-slate-600 cursor-pointer shadow-sm"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            <option value="DIS">DIS Department</option>
            <option value="DCS">DCS Department</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-[#2f318d] mb-4 opacity-40" />
            <p className="text-[#2f318d] text-[0.7rem] font-bold uppercase tracking-widest opacity-60">Synchronizing Registry</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No candidates match your current filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-200">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="px-6 md:px-10 py-5 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70">Candidate Identity</th>
                    <th className="px-6 py-5 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-center">Partylist</th>
                    <th className="px-6 py-5 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-center">Academic Scope</th>
                    <th className="px-6 md:px-10 py-5 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentCandidates.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 md:px-10 py-5">
                        <div className="flex items-center gap-4">
                          <img
                            src={c.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=f1f5f9&color=2f318d`}
                            className="w-11 h-11 rounded-2xl object-cover border-2 border-slate-50 shadow-sm transition-transform group-hover:scale-105"
                            alt={c.name}
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm md:text-[0.95rem]">{c.name}</span>
                            <span className="text-[11px] text-slate-400 font-medium">{c.position?.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-[10px] bg-slate-100 px-3 py-1.5 rounded-lg text-slate-500 font-bold uppercase tracking-wide">
                          {c.partylist}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="px-3 py-1 bg-indigo-50 text-[#2f318d] border border-indigo-100 rounded-full text-[10px] font-bold uppercase tracking-wide">
                            {c.department}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-5 text-right">
                        <div className="flex justify-end gap-2 md:gap-3">
                          <button onClick={() => handleOpenModal(c)} className="p-2 md:p-2.5 bg-slate-100 text-slate-500 hover:bg-[#2f318d] hover:text-white rounded-xl transition-all">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => handleDelete(c._id)} className="p-2 md:p-2.5 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                            <Trash2 size={15} />
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
            <button onClick={closeModal} className="absolute right-6 top-6 md:right-8 md:top-8 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <div className="mb-6 md:mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">{isEditing ? 'Update Profile' : 'Register Candidate'}</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1">Configure candidate credentials.</p>
            </div>

            <Formik
              enableReinitialize
              initialValues={{
                name: selectedCand?.name || '',
                partylist: selectedCand?.partylist || '',
                position: selectedCand?.position?._id || '',
                electionId: selectedCand?.election?._id || selectedElectionId || '',
                department: selectedCand?.department || 'ALL',
              }}
              validationSchema={validationSchema}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                try {
                  const formData = new FormData();
                  const { department, ...dataToSave } = values;

                  Object.entries(dataToSave).forEach(([key, value]) => {
                    if (value !== null && value !== '') formData.append(key, String(value));
                  });

                  if (fileInputRef.current?.files?.[0]) {
                    formData.append('image', fileInputRef.current.files[0]);
                  }
                  if (isEditing && selectedCand) {
                    await candidateService.update(selectedCand._id, formData);
                  } else {
                    await candidateService.create(formData);
                  }
                  closeModal();
                  resetForm();
                  fetchData();
                } catch (err: any) {
                  alert(err.response?.data?.error || "Error encountered.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, errors, touched, values }) => (
                <Form className="space-y-6">
                  <FormWatcher onFilterChange={handleModalFilterChange} />
                  
                  <div className="flex justify-center mb-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-32 h-32 md:w-36 md:h-36 rounded-4xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-[#2f318d] group-hover:bg-indigo-50/30">
                        {previewUrl ? (
                          <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
                        ) : (
                          <>
                            <Camera className="text-slate-300 group-hover:text-[#2f318d] mb-2" size={32} />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#2f318d]">Photo</span>
                          </>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-2 bg-white rounded-xl shadow-lg border border-slate-100 text-[#2f318d]">
                        <Plus size={16} />
                      </div>
                      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-semibold text-slate-700">Full Name</label>
                      <Field name="name" placeholder="John B. Doe" className={`h-12 md:h-14 w-full border px-5 rounded-2xl outline-none transition-all text-sm font-medium ${errors.name && touched.name ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-[#2f318d]'}`} />
                      <ErrorMessage name="name" component="div" className="text-[10px] text-red-500 font-bold ml-2" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-semibold text-slate-700">Partylist</label>
                      <Field name="partylist" placeholder="Independent" className={`h-12 md:h-14 w-full border px-5 rounded-2xl outline-none transition-all text-sm font-medium ${errors.partylist && touched.partylist ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-[#2f318d]'}`} />
                      <ErrorMessage name="partylist" component="div" className="text-[10px] text-red-500 font-bold ml-2" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-semibold text-slate-700">Election Cycle</label>
                      <Field as="select" name="electionId" className="h-12 md:h-14 w-full border border-slate-200 px-5 rounded-2xl font-bold text-[#2f318d] bg-slate-50/50 appearance-none outline-none focus:border-[#2f318d] cursor-pointer text-sm">
                        <option value="">Choose Election Cycle...</option>
                        {elections.map(el => <option key={el._id} value={el._id}>{el.title}</option>)}
                      </Field>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-semibold text-slate-700">Department Scope</label>
                      <Field as="select" name="department" className="h-12 md:h-14 w-full border border-slate-200 px-5 rounded-2xl font-bold text-[#2f318d] bg-slate-50/50 appearance-none outline-none focus:border-[#2f318d] cursor-pointer text-sm">
                        <option value="ALL">ALL Department</option>
                        <option value="DIS">DIS Department</option>
                        <option value="DCS">DCS Department</option>
                      </Field>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-semibold text-slate-700">Position Title</label>
                      <Field as="select" name="position" className="h-12 md:h-14 w-full border border-slate-200 px-5 rounded-2xl font-bold text-[#2f318d] bg-slate-50/50 appearance-none outline-none focus:border-[#2f318d] cursor-pointer text-sm">
                        <option value="">
                          {!values.electionId ? "Select Election first..." : modalPositions.length === 0 ? "No positions found" : "Select Official Position..."}
                        </option>
                        {modalPositions.map(pos => <option key={pos._id} value={pos._id}>{pos.name}</option>)}
                      </Field>
                      <ErrorMessage name="position" component="div" className="text-[10px] text-red-500 font-bold ml-2" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 md:h-14 w-full bg-[#2f318d] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 mt-6 shadow-xl shadow-indigo-100/50"
                  >
                    {isSubmitting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        <span>{isEditing ? 'Save Profile' : 'Complete Registration'}</span>
                      </>
                    )}
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