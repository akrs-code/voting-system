import { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Loader2,
  Trash2,
  X,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { positionService } from '../services/positionService';
import { electionService } from '../services/electionService';
import { Position } from 'types/interface';

const Positions = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);

  const validationSchema = Yup.object({
    name: Yup.string()
      .min(2, "Position name is too short")
      .required("Position name is required"),
    department: Yup.string().required("Department scope is required"),
    electionId: Yup.string().required("Election cycle is required"),
    yearLevel: Yup.string().nullable(),
    maxVote: Yup.number()
      .min(1, "Must allow at least 1 vote")
      .required("Max votes is required")
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [posData, elData] = await Promise.all([
        positionService.getPositions("ALL", selectedElectionId),
        electionService.getAll()
      ]);
      setPositions(posData);
      setElections(elData);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedElectionId]);

  const filteredPositions = useMemo(() => {
    return positions.filter(pos => {
      const matchesSearch = pos.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'ALL' || pos.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [positions, searchTerm, deptFilter]);

  const handleOpenModal = (pos?: Position) => {
    if (pos) {
      setIsEditing(true);
      setSelectedPos(pos);
    } else {
      setIsEditing(false);
      setSelectedPos(null);
    }
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this position? Associated candidate records may be affected.")) return;
    try {
      await positionService.delete(id);
      setPositions(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      alert("Delete failed. Please try again.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-10 font-poppins">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <h2 className="text-[0.7rem] md:text-[0.75rem] font-bold tracking-[0.07rem] text-[#2f318d] uppercase opacity-80 mb-1">
            MSU CICS Administration
          </h2>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Electoral Positions</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">
            Configure and manage {filteredPositions.length} roles available for the student body.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="h-12 w-full md:w-auto bg-[#2f318d] hover:bg-[#26287a] text-white px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.97] font-bold text-sm"
        >
          <Plus size={18} />
          <span>Add New Position</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative group sm:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2f318d] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search position name..."
            className="w-full h-12 pl-12 pr-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] transition-all text-sm font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={selectedElectionId}
            onChange={(e) => setSelectedElectionId(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] appearance-none text-sm font-semibold text-slate-600 cursor-pointer shadow-sm"
          >
            <option value="">All Election Cycles</option>
            {elections.map(el => <option key={el._id} value={el._id}>{el.title}</option>)}
          </select>
        </div>

        <div className="relative">
          <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] appearance-none text-sm font-semibold text-slate-600 cursor-pointer shadow-sm"
          >
            <option value="ALL">All Departments</option>
            <option value="DIS">DIS Department</option>
            <option value="DCS">DCS Department</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-[#2f318d] mb-4 opacity-40" />
            <p className="text-[#2f318d] text-[0.7rem] font-bold uppercase tracking-widest opacity-60">Synchronizing Database</p>
          </div>
        ) : filteredPositions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No matching positions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-175">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70">Position Details</th>
                  <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] text-center uppercase tracking-widest opacity-70">Scope</th>
                  <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] text-center uppercase tracking-widest opacity-70">Max Vote</th>
                  <th className="px-6 md:px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPositions.map((pos) => (
                  <tr key={pos._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 md:px-10 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm md:text-[0.95rem]">{pos.name}</span>
                        <span className="mt-1 text-[11px] text-slate-400 font-medium">{pos.election?.title || 'Unassigned Cycle'}</span>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-4 text-center">
                      <div className="flex justify-center gap-2 items-center">
                        <span className="text-[#2f318d] text-[10px] font-bold px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100 uppercase tracking-wide">
                          {pos.department}
                        </span>
                        
                        <span className="text-slate-400 text-[11px] font-semibold">
                          {pos.yearLevel ? `Year ${pos.yearLevel}` : 'All Levels'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 md:px-10 py-4 text-center">
                      <div className="flex justify-center gap-2 items-center">
                       
                        <span className="text-[#2f318d] text-[10px] font-bold px-2 py-0.5 bg-[#2f318d]-50 rounded-md border border-[#2f318d]-100 uppercase">
                          Max: {pos.maxVote || 0}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 md:px-10 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal(pos)} className="p-2 md:p-2.5 bg-slate-100 text-slate-500 hover:bg-[#2f318d] hover:text-white rounded-xl transition-all">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDelete(pos._id)} className="p-2 md:p-2.5 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
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
          <div className="w-full max-w-md bg-white rounded-4xl md:rounded-[2.5rem] shadow-2xl p-6 md:p-10 relative max-h-[95vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute right-6 top-6 md:right-8 md:top-8 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">{isEditing ? 'Update Position' : 'New Position'}</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1">Configure position scope and voting rules.</p>
            </div>

            <Formik
              enableReinitialize
              initialValues={{
                name: selectedPos?.name || '',
                department: selectedPos?.department || 'DIS',
                yearLevel: selectedPos?.yearLevel || '',
                electionId: selectedPos?.election?._id || selectedPos?.election || selectedElectionId || '',
                maxVote: selectedPos?.maxVote || 1,
              }}
              validationSchema={validationSchema}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  const payload = {
                    ...values,
                    yearLevel: values.yearLevel === "" ? null : Number(values.yearLevel),
                    election: values.electionId,
                    maxVote: Number(values.maxVote),
                  };

                  if (isEditing && selectedPos) {
                    await positionService.update(selectedPos._id, payload);
                  } else {
                    await positionService.create(payload);
                  }

                  setShowModal(false);
                  fetchData();
                } catch (err) {
                  alert("Transaction failed. Please try again.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-4 md:space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs md:text-sm font-semibold text-slate-700">Position Name</label>
                    <Field name="name" placeholder="e.g. Prime Minister" className={`h-12 md:h-14 w-full border px-4 md:px-5 rounded-2xl outline-none transition-all text-sm ${errors.name && touched.name ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-[#2f318d]'}`} />
                    <ErrorMessage name="name" component="div" className="text-[10px] text-red-500 font-bold ml-1" />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-semibold text-slate-700">Election Cycle</label>
                      <Field as="select" name="electionId" className="h-12 md:h-14 w-full border border-slate-200 bg-slate-50/50 px-3 md:px-4 rounded-2xl text-xs md:text-sm font-bold text-[#2f318d] outline-none">
                        <option value="">Select Cycle...</option>
                        {elections.map(el => <option key={el._id} value={el._id}>{el.title}</option>)}
                      </Field>
                      <ErrorMessage name="electionId" component="div" className="text-[10px] text-red-500 font-bold ml-1" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-semibold text-slate-700">Scope</label>
                      <Field as="select" name="department" className="h-12 md:h-14 w-full border border-slate-200 bg-slate-50/50 px-3 md:px-4 rounded-2xl text-xs md:text-sm font-bold text-[#2f318d] outline-none">
                        <option value="ALL">All Department</option>
                        <option value="DIS">DIS Department</option>
                        <option value="DCS">DCS Department</option>
                      </Field>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-semibold text-slate-700">Year</label>
                      <Field as="select" name="yearLevel" className="h-12 md:h-14 w-full border border-slate-200 bg-slate-50/50 px-3 md:px-4 rounded-2xl text-xs md:text-sm font-bold text-[#2f318d] outline-none">
                        <option value="">All Years</option>
                        {[1, 2, 3, 4].map(lvl => <option key={lvl} value={lvl}>Year {lvl}</option>)}
                      </Field>
                    </div>
                    <div className="space-y-1.5 col-span-1 md:col-span-1">
                      <label className="text-xs md:text-sm font-semibold text-slate-700">Max Votes</label>
                      <Field
                        type="number"
                        name="maxVote"
                        className={`h-12 md:h-14 w-full border px-4 rounded-2xl text-sm font-bold text-[#2f318d] outline-none transition-all ${errors.maxVote && touched.maxVote ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-[#2f318d]'}`}
                      />
                      <ErrorMessage name="maxVote" component="div" className="text-[10px] text-red-500 font-bold ml-1" />
                    </div>

                  </div>


                  <button type="submit" disabled={isSubmitting} className="h-12 md:h-14 w-full bg-[#2f318d] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 mt-2">
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><CheckCircle2 size={18} /> {isEditing ? 'Update Position' : 'Confirm Position'}</>}
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

export default Positions;