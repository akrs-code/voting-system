import React, { useEffect, useState } from 'react';
import { 
  Plus, Loader2, Calendar, Trash2, X, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
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

  const validationSchema = Yup.object({
    title: Yup.string().min(5, "Title is too short").required("Required"),
    startDate: Yup.date().required("Required"),
    endDate: Yup.date()
      .min(Yup.ref('startDate'), "End date cannot be before start date")
      .required("Required"),
  });

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

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setProcessingId(id);
    try {
      await electionService.toggleActive(id);
      setElections(prev => prev.map(el => ({ 
        ...el, 
        isActive: el._id === id ? !currentStatus : false 
      })));
    } catch (error) {
      alert("Update failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanently delete this election cycle?")) return;
    try {
      await electionService.delete(id);
      setElections(prev => prev.filter(el => el._id !== id));
    } catch (error) {
      alert("Delete failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 font-poppins">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 px-2">
        <div>
          <h2 className="text-[0.75rem] font-bold tracking-[0.07rem] text-[#2f318d] uppercase opacity-80 mb-1">MSU CICS Administration</h2>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Election Management</h1>
          <p className="text-slate-500 text-sm mt-1">Configure voting timelines and active electoral cycles.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="h-12 bg-[#2f318d] hover:bg-[#26287a] text-white px-6 rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-[0.97] font-bold text-sm"
        >
          <Plus size={18} /> New Election Cycle
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-[#2f318d] mb-4 opacity-40" />
            <p className="text-[#2f318d] text-[0.7rem] font-bold uppercase tracking-widest opacity-60">Fetching Cycles</p>
          </div>
        ) : elections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No election cycles configured yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70">Election Details</th>
                  <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-center">Live Status</th>
                  <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {elections.map((election) => (
                  <tr key={election._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-[0.95rem]">{election.title}</span>
                        <div className="flex items-center gap-2 text-slate-400 text-[0.75rem] mt-1 font-medium">
                          <Calendar size={13} className="text-[#2f318d] opacity-50" />
                          <span>{new Date(election.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="opacity-30 px-1">—</span>
                          <span>{new Date(election.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold border transition-colors ${
                        election.isActive 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${election.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        {election.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end items-center gap-4">
                        <button 
                          disabled={processingId === election._id}
                          onClick={() => handleToggleActive(election._id, election.isActive)}
                          className={`relative w-11 h-6 flex items-center rounded-full px-1 transition-all duration-300 ${
                              election.isActive ? 'bg-[#2f318d]' : 'bg-slate-200'
                          } ${processingId === election._id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${
                              election.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                        <div className="h-8 w-[1px] bg-slate-100 mx-2" />
                        <button 
                          onClick={() => handleDelete(election._id)}
                          className="p-2.5 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                        >
                          <Trash2 size={16} />
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
          <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute right-8 top-8 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">New Election</h2>
              <p className="text-sm text-slate-500 mt-1">Set the timeline for the upcoming voting period.</p>
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
                <Form className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Election Title</label>
                    <Field 
                      name="title" 
                      placeholder="e.g. Student Council 2026"
                      className={`h-14 w-full border px-5 rounded-2xl outline-none transition-all ${
                        errors.title && touched.title ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-[#2f318d]'
                      }`} 
                    />
                    <ErrorMessage name="title" component="div" className="text-xs text-red-500 font-bold ml-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Start Date</label>
                      <Field 
                        type="date" 
                        name="startDate" 
                        className={`h-14 w-full border bg-slate-50/50 px-4 rounded-2xl text-sm font-bold text-[#2f318d] outline-none transition-all ${
                          errors.startDate && touched.startDate ? 'border-red-300' : 'border-slate-200 focus:border-[#2f318d]'
                        }`} 
                      />
                      <ErrorMessage name="startDate" component="div" className="text-xs text-red-500 font-bold ml-2" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">End Date</label>
                      <Field 
                        type="date" 
                        name="endDate" 
                        className={`h-14 w-full border bg-slate-50/50 px-4 rounded-2xl text-sm font-bold text-[#2f318d] outline-none transition-all ${
                          errors.endDate && touched.endDate ? 'border-red-300' : 'border-slate-200 focus:border-[#2f318d]'
                        }`} 
                      />
                      <ErrorMessage name="endDate" component="div" className="text-xs text-red-500 font-bold ml-2" />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="h-14 w-full bg-[#2f318d] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-lg shadow-indigo-100"
                  >
                    {isSubmitting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={20} /> Initialize Election
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