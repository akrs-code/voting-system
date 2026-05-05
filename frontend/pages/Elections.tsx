import { useEffect, useState } from 'react';
import {
  Plus, Loader2, Trash2, X,
  CheckCircle2, AlertCircle, Lock, Unlock
} from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { electionService } from '../services/electionService';
import { Election } from 'types/interface';

const Elections = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const validationSchema = Yup.object({
    title: Yup.string().min(5, "Title is too short").required("Election title is required"),
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date()
      .min(Yup.ref('startDate'), "End date cannot be before start date")
      .required("End date is required"),
  });

  const fetchElections = async () => {
    try {
      setLoading(true);
      const data = await electionService.getAll();
      setElections(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchElections(); }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setProcessingId(id);
    try {
      await electionService.toggleActive(id);
      setElections(prev => prev.map(el => ({
        ...el,
        isActive: el._id === id ? !currentStatus : false
      })));
    } catch (error) {
      alert("Status update failed. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleLock = async (id: string, currentLockStatus: boolean) => {
    setProcessingId(id);
    try {
      await electionService.toggleLock(id);
      setElections(prev => prev.map(el => ({
        ...el,
        isLocked: el._id === id ? !currentLockStatus : el.isLocked
      })));
    } catch (error) {
      alert("Failed to update lock status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this election cycle? This action cannot be undone.")) return;
    try {
      await electionService.delete(id);
      setElections(prev => prev.filter(el => el._id !== id));
    } catch (error) {
      alert("Delete failed. Please ensure the election is inactive before deleting.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-10 font-poppins">

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <h2 className="text-[0.7rem] md:text-[0.75rem] font-bold tracking-[0.07rem] text-[#2f318d] uppercase opacity-80 mb-1">
            MSU CICS Administration
          </h2>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Election Management</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">Configure voting timelines and manage active electoral cycles.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="h-12 w-full md:w-auto bg-[#2f318d] hover:bg-[#26287a] text-white px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.97] font-bold text-sm"
        >
          <Plus size={18} />
          <span>New Election Cycle</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-[#2f318d] mb-4 opacity-40" />
            <p className="text-[#2f318d] text-[0.7rem] font-bold uppercase tracking-widest opacity-60">Synchronizing Cycles</p>
          </div>
        ) : elections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No election cycles configured yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-150">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70">Election Details</th>
                  <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-center">Live Status</th>
                  <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {elections.map((election) => (
                  <tr key={election._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 md:px-10 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold  text-sm md:text-[0.95rem]">{election.title}</span>
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] md:text-xs mt-1.5 font-medium">

                          <span className="py-0.5 rounded-md mt-1 text-[11px]font-medium">
                            {new Date(election.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="opacity-30">—</span>
                          <span className="py-0.5 rounded-md mt-1 text-[11px] text-slate-400 font-medium">
                            {new Date(election.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-4 text-center">
                      <div className={`inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all ${election.isActive
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${election.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        {election.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-4 text-right">
                      <div className="flex justify-end items-center gap-3">
                        <button
                          disabled={processingId === election._id}
                          onClick={() => handleToggleActive(election._id, election.isActive)}
                          className={`relative w-11 h-6 flex items-center rounded-full px-1 transition-all duration-300 ${election.isActive ? 'bg-[#2f318d]' : 'bg-slate-200'
                            } ${processingId === election._id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${election.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </button>

                        <div className="h-8 w-px bg-slate-100 mx-1" />
                        <button
                          disabled={processingId === election._id}
                          onClick={() => handleToggleLock(election._id, election.isLocked)}
                          className={`p-2 rounded-xl transition-all ${election.isLocked
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            } ${processingId === election._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={election.isLocked ? "Unlock Election" : "Lock Election"}
                        >
                          {election.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(election._id)}
                          className="p-2 md:p-2.5 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-lg bg-white rounded-4xl md:rounded-[2.5rem] shadow-2xl p-6 md:p-10 relative max-h-[95vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute right-6 top-6 md:right-8 md:top-8 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Initialize Cycle</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1">Set the timeline for the upcoming voting period.</p>
            </div>

            <Formik
              initialValues={{ title: '', startDate: '', endDate: '' }}
              validationSchema={validationSchema}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                try {
                  await electionService.create(values);
                  setShowModal(false);
                  resetForm();
                  await fetchElections();
                } catch (err: any) {
                  alert(err.response?.data?.error || "Transaction failed");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-4 md:space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-semibold text-slate-700">Election Title</label>
                    <Field
                      name="title"
                      placeholder="e.g. Student Council 2026"
                      className={`h-12 md:h-14 w-full border px-4 md:px-5 rounded-2xl outline-none transition-all text-sm ${errors.title && touched.title ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-[#2f318d]'
                        }`}
                    />
                    <ErrorMessage name="title" component="div" className="text-[10px] text-red-500 font-bold ml-1" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-semibold text-slate-700">Start Date</label>
                      <Field
                        type="date"
                        name="startDate"
                        className={`h-12 md:h-14 w-full border bg-slate-50/50 px-3 md:px-4 rounded-2xl text-xs md:text-sm font-bold text-[#2f318d] outline-none transition-all ${errors.startDate && touched.startDate ? 'border-red-300' : 'border-slate-200 focus:border-[#2f318d]'
                          }`}
                      />
                      <ErrorMessage name="startDate" component="div" className="text-[10px] text-red-500 font-bold ml-1" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-semibold text-slate-700">End Date</label>
                      <Field
                        type="date"
                        name="endDate"
                        className={`h-12 md:h-14 w-full border bg-slate-50/50 px-3 md:px-4 rounded-2xl text-xs md:text-sm font-bold text-[#2f318d] outline-none transition-all ${errors.endDate && touched.endDate ? 'border-red-300' : 'border-slate-200 focus:border-[#2f318d]'
                          }`}
                      />
                      <ErrorMessage name="endDate" component="div" className="text-[10px] text-red-500 font-bold ml-1" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 md:h-14 w-full bg-[#2f318d] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 shadow-lg shadow-indigo-100"
                  >
                    {isSubmitting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Initialize Election</span>
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

export default Elections;