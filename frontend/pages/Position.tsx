import { useEffect, useState, useMemo } from 'react';
import {
  Plus, Loader2, Trash2, X, Edit3,
  CheckCircle2, AlertCircle, Briefcase, Search,
  SlidersHorizontal
} from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { positionService } from '../services/positionService';
import { electionService } from '../services/electionService';

interface Position {
  _id: string;
  name: string;
  maxVote: number;
  department: "DIS" | "DCS" | "ALL";
  yearLevel: number | null;
  election: string;
}

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
    name: Yup.string().min(2, "Too short").required("Required"),
    maxVote: Yup.number().min(1, "Min 1").required("Required"),
    department: Yup.string().required("Required"),
    electionId: Yup.string().required("Required"),
    yearLevel: Yup.string().nullable()
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedElectionId]);

  const filteredPositions = useMemo(() => {
    return positions.filter(pos => {
      const matchesSearch = pos.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'ALL' || pos.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [positions, searchTerm, deptFilter]);

  const handleOpenModal = (pos?: Position) => {
    setIsEditing(!!pos);
    setSelectedPos(pos || null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure? This will delete associated candidates.")) {
      try {
        await positionService.delete(id);
        fetchData();
      } catch (err) { alert("Delete failed"); }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 font-poppins">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 px-2">
        <div>
          <h2 className="text-[0.75rem] font-bold tracking-[0.07rem] text-[#2f318d] uppercase opacity-80 mb-1">MSU CICS Administration</h2>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Electoral Positions</h1>
          <p className="text-slate-500 text-sm mt-1">Manage {filteredPositions.length} roles and eligibility scopes.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="h-12 bg-[#2f318d] hover:bg-[#26287a] text-white px-6 rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-[0.98] font-bold text-sm"
        >
          <Plus size={18} /> Add New Position
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-2">
        <div className="relative group md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2f318d] transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by position name..."
            className="w-full h-12 pl-12 pr-6 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] transition-all text-sm font-medium shadow-sm"
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
          <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <select
            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-[#2f318d] appearance-none text-sm font-semibold text-slate-600 cursor-pointer shadow-sm"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            <option value="DIS">DIS Only</option>
            <option value="DCS">DCS Only</option>
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
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">No matching electoral positions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70">Position Details</th>
                  <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-center">SCOPE</th>
                  <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-center">Vote Limit</th>
                  <th className="px-10 py-4 text-[#2f318d] font-bold text-[0.7rem] uppercase tracking-widest opacity-70 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPositions.map((pos) => (
                  <tr key={pos._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-[0.95rem]">{pos.name}</span>
                      </div>
                    </td>
                    <td className="px-10 py-4 text-center">
                      <div className="flex justify-center gap-2 items-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex flex-row items-center justify-center gap-2">
                            <span className="text-[#2f318d] text-[10px] font-bold px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100 uppercase tracking-wide">
                              {pos.department}
                            </span>
                            <span className="text-slate-400 text-[11px] font-semibold">
                              {pos.yearLevel ? `Year ${pos.yearLevel}` : 'Open Level'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 border-slate-100 rounded-full border font-bold text-[10px]">
                        {pos.maxVote} MAX
                      </span>
                    </td>
                    <td className="px-10 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal(pos)} className="p-2.5 bg-slate-100 text-slate-500 hover:bg-[#2f318d] hover:text-white rounded-xl transition-all shadow-sm">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDelete(pos._id)} className="p-2.5 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm">
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
          <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 relative border border-white/20">
            <button onClick={() => setShowModal(false)} className="absolute right-8 top-8 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">{isEditing ? 'Update Position' : 'Create Position'}</h2>
              <p className="text-sm text-slate-500 mt-1">Configure position scope and constraints.</p>
            </div>

            <Formik
              enableReinitialize
              initialValues={{
                name: selectedPos?.name || '',
                maxVote: selectedPos?.maxVote || 1,
                department: selectedPos?.department || 'ALL',
                yearLevel: selectedPos?.yearLevel || '',
                electionId: selectedPos?.election || selectedElectionId || '',
              }}
              validationSchema={validationSchema}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  const payload = { ...values, yearLevel: values.yearLevel === "" ? null : Number(values.yearLevel) };
                  if (isEditing && selectedPos) await positionService.update(selectedPos._id, payload);
                  else await positionService.create(payload);
                  setShowModal(false);
                  fetchData();
                } catch (err) { alert("Action failed"); } finally { setSubmitting(false); }
              }}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Position Name</label>
                    <Field
                      name="name"
                      className={`h-14 w-full border px-5 rounded-2xl outline-none transition-all ${errors.name && touched.name ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-[#2f318d]'}`}
                      placeholder="e.g. Prime Minister"
                    />
                    <ErrorMessage name="name" component="div" className="text-[10px] text-red-500 font-bold ml-2" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Election Cycle</label>
                    <Field as="select" name="electionId" className="h-14 w-full border border-slate-200 px-4 rounded-2xl font-bold text-[#2f318d] bg-slate-50/50 outline-none focus:border-[#2f318d] appearance-none cursor-pointer">
                      <option value="">Select Election Cycle...</option>
                      {elections.map(el => <option key={el._id} value={el._id}>{el.title}</option>)}
                    </Field>
                    <ErrorMessage name="electionId" component="div" className="text-[10px] text-red-500 font-bold ml-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dept. Scope</label>
                      <Field as="select" name="department" className="h-14 w-full border border-slate-200 bg-slate-50/50 px-4 rounded-2xl font-bold text-[#2f318d] outline-none focus:border-[#2f318d] cursor-pointer">
                        <option value="ALL">ALL</option>
                        <option value="DIS">DIS</option>
                        <option value="DCS">DCS</option>
                      </Field>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Year Level</label>
                      <Field as="select" name="yearLevel" className="h-14 w-full border border-slate-200 bg-slate-50/50 px-4 rounded-2xl font-bold text-[#2f318d] outline-none focus:border-[#2f318d] cursor-pointer">
                        <option value="">All Years</option>
                        {[1, 2, 3, 4].map(lvl => <option key={lvl} value={lvl}>Year {lvl}</option>)}
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Max Votes Allowable</label>
                    <Field
                      type="number"
                      name="maxVote"
                      className={`h-14 w-full border px-5 rounded-2xl outline-none transition-all ${errors.maxVote && touched.maxVote ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-[#2f318d]'}`}
                    />
                    <ErrorMessage name="maxVote" component="div" className="text-[10px] text-red-500 font-bold ml-2" />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-14 w-full bg-[#2f318d] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#26287a] transition-all active:scale-[0.98] shadow-lg disabled:opacity-50 mt-4"
                  >
                    {isSubmitting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        <span>{isEditing ? 'Update Position' : 'Create Position'}</span>
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

export default Positions;