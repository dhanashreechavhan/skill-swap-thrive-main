import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Video,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  MapPin,
  Repeat,
  Bell
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";

const Schedule = () => {
  const { user } = useAuth();

  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New session form state
  const [form, setForm] = useState({
    skillId: "",
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
    meetingLink: "",
    description: ""
  });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    skillId: "",
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
    meetingLink: "",
    status: "Pending",
    description: ""
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [schedRes, skillsRes] = await Promise.all([
      apiService.getSchedules(),
      apiService.getSkills(),
    ]);
    if (schedRes.data && Array.isArray(schedRes.data)) {
      const mapped = (schedRes.data as any[])
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((s) => ({
          id: s._id,
          title: typeof s.skill === 'object' ? (s.skill.name || s.skill.title || 'Session') : String(s.skill),
          partner: s.student?._id === user?._id ? (s.teacher?.name || 'Partner') : (s.student?.name || 'Partner'),
          partnerAvatar: s.student?._id === user?._id ? (s.teacher?.name?.slice(0,2).toUpperCase() || 'PR') : (s.student?.name?.slice(0,2).toUpperCase() || 'PR'),
          dateISO: s.date,
          date: new Date(s.date).toLocaleDateString(),
          time: `${s.startTime || ''}${s.endTime ? ` - ${s.endTime}` : ''}`,
          skill: typeof s.skill === 'object' ? (s.skill.name || 'Skill') : String(s.skill),
          type: s.student?._id === user?._id ? 'learning' : 'teaching',
          format: s.meetingLink ? 'Video Call' : 'N/A',
          status: (s.status || 'Pending').toLowerCase(),
          description: s.description || s.notes || '',
          raw: s,
        }));
      setSessions(mapped);
    } else if (schedRes.error) {
      setError(schedRes.error);
    }
    const skillsData = skillsRes.data as any;
    if (skillsData && skillsData.skills && Array.isArray(skillsData.skills)) {
      setSkills(skillsData.skills as any[]);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
    "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
  ];

  const durations = ["1 hour", "1.5 hours", "2 hours", "2.5 hours", "3 hours"];

  const handleCreate = async () => {
    if (!user) return;
    
    // Validate required fields
    if (!form.skillId) {
      setError('Please select a skill');
      return;
    }
    if (!form.date) {
      setError('Please select a date');
      return;
    }
    if (!form.startTime) {
      setError('Please select a start time');
      return;
    }
    if (!form.endTime) {
      setError('Please select an end time');
      return;
    }
    
    const skill = skills.find((sk: any) => sk._id === form.skillId);
    if (!skill) { 
      setError('Please select a valid skill'); 
      return; 
    }
    const teacherId = skill.offeredBy?._id;
    if (!teacherId) { 
      setError('Selected skill has no teacher'); 
      return; 
    }
    
    // Validate date format
    const selectedDate = new Date(form.date);
    if (isNaN(selectedDate.getTime())) {
      setError('Please enter a valid date');
      return;
    }
    
    // Clear any previous errors
    setError(null);
    
    const payload = {
      student: user._id,
      teacher: teacherId,
      skill: skill._id,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      status: 'Pending',
      notes: form.notes,
      meetingLink: form.meetingLink,
      description: form.description,
    };
    
    const res = await apiService.createSchedule(payload);
    if (res.error) { 
      setError(res.error); 
      return; 
    }
    
    setShowNewSessionForm(false);
    setForm({ skillId: "", date: "", startTime: "", endTime: "", notes: "", meetingLink: "", description: "" });
    await loadData();
  };

  const handleDelete = async (id: string) => {
    // Add confirmation dialog
    if (!window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError(null);
      const res = await apiService.deleteSchedule(id);
      if (res.error) { 
        setError(res.error); 
        return; 
      }
      await loadData();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError('Failed to delete schedule. Please try again.');
    }
  };

  const startEdit = (session: any) => {
    setEditingId(session.id);
    setShowNewSessionForm(true);
    setEditForm({
      skillId: session.raw?.skill?._id || session.raw?.skill,
      date: session.dateISO?.slice(0,10) || "",
      startTime: session.raw?.startTime || "",
      endTime: session.raw?.endTime || "",
      notes: session.raw?.notes || "",
      meetingLink: session.raw?.meetingLink || "",
      status: session.raw?.status || 'Pending',
      description: session.raw?.description || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    // Validate required fields
    if (!editForm.date) {
      setError('Please select a date');
      return;
    }
    if (!editForm.startTime) {
      setError('Please select a start time');
      return;
    }
    if (!editForm.endTime) {
      setError('Please select an end time');
      return;
    }
    
    // Validate date format
    const selectedDate = new Date(editForm.date);
    if (isNaN(selectedDate.getTime())) {
      setError('Please enter a valid date');
      return;
    }
    
    // Clear any previous errors
    setError(null);
    
    const payload: any = {
      date: editForm.date,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      notes: editForm.notes,
      meetingLink: editForm.meetingLink,
      status: editForm.status,
      description: editForm.description,
    };
    if (editForm.skillId) payload.skill = editForm.skillId;
    
    const res = await apiService.updateSchedule(editingId, payload);
    if (res.error) { 
      setError(res.error); 
      return; 
    }
    
    setEditingId(null);
    setShowNewSessionForm(false);
    await loadData();
  };



  return (
    <div className="min-h-screen" style={{background: "linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf4ff 100%)"}}>
      <Header isLoggedIn={true} />

      <main className="container py-8 max-w-5xl mx-auto px-4">

        {/* Hero Banner */}
        <div className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden"
          style={{background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"}}>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }} />
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black mb-1">Schedule Sessions 📅</h1>
              <p className="text-white/70">Manage your learning and teaching sessions</p>
            </div>
            <button
              onClick={() => setShowNewSessionForm(!showNewSessionForm)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-violet-700 font-bold rounded-2xl hover:bg-amber-50 transition-colors shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Schedule New Session
            </button>
          </div>
        </div>

        {/* New / Edit Session Form */}
        {showNewSessionForm && (
          <div className="bg-white rounded-3xl border border-violet-100 shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-slate-900">{editingId ? 'Edit Session' : 'Schedule a New Session'}</h2>
                <p className="text-xs text-slate-500">Fill in the details below</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Session Notes</label>
                <input
                  placeholder="e.g., React Hooks Deep Dive"
                  value={editingId ? editForm.notes : form.notes}
                  onChange={(e) => editingId ? setEditForm({...editForm, notes: e.target.value}) : setForm({...form, notes: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Choose Skill & Teacher *</label>
                <select
                  value={editingId ? editForm.skillId : form.skillId}
                  onChange={(e) => editingId ? setEditForm({...editForm, skillId: e.target.value}) : setForm({...form, skillId: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-violet-400"
                >
                  <option value="">Select a skill and teacher</option>
                  {skills.filter((sk: any) => sk.offeredBy?.name).map((sk: any) => (
                    <option key={sk._id} value={sk._id}>
                      {sk.name} — by {sk.offeredBy?.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected skill info */}
            {(editingId ? editForm.skillId : form.skillId) && (() => {
              const sel = skills.find((sk: any) => sk._id === (editingId ? editForm.skillId : form.skillId));
              if (!sel) return null;
              return (
                <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
                    {sel.offeredBy?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-violet-900 text-sm">Learning {sel.name} with {sel.offeredBy?.name}</p>
                    <p className="text-xs text-violet-600">{sel.category} • {sel.level} level</p>
                  </div>
                </div>
              );
            })()}

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Date *</label>
                <input type="date"
                  value={editingId ? editForm.date : form.date}
                  onChange={(e) => editingId ? setEditForm({...editForm, date: e.target.value}) : setForm({...form, date: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-violet-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Start Time *</label>
                <select
                  value={editingId ? editForm.startTime : form.startTime}
                  onChange={(e) => editingId ? setEditForm({...editForm, startTime: e.target.value}) : setForm({...form, startTime: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-violet-400"
                >
                  <option value="">Select time</option>
                  {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">End Time *</label>
                <select
                  value={editingId ? editForm.endTime : form.endTime}
                  onChange={(e) => editingId ? setEditForm({...editForm, endTime: e.target.value}) : setForm({...form, endTime: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-violet-400"
                >
                  <option value="">Select time</option>
                  {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Meeting Link</label>
                <input
                  placeholder="https://meet.google.com/..."
                  value={editingId ? editForm.meetingLink : form.meetingLink}
                  onChange={(e) => editingId ? setEditForm({...editForm, meetingLink: e.target.value}) : setForm({...form, meetingLink: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-violet-400"
                />
              </div>
              {editingId && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-violet-400"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
              <textarea
                placeholder="What will you cover in this session?"
                rows={3}
                value={editingId ? editForm.description : form.description}
                onChange={(e) => editingId ? setEditForm({...editForm, description: e.target.value}) : setForm({...form, description: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-violet-400 resize-none"
              />
            </div>

            {error && <p className="text-rose-500 text-sm mb-4 bg-rose-50 px-4 py-2 rounded-xl">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={editingId ? handleSaveEdit : handleCreate}
                disabled={loading}
                className="px-6 py-2.5 text-white font-bold rounded-2xl disabled:opacity-50 hover:opacity-90 shadow-sm"
                style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}
              >
                {loading ? "Saving..." : editingId ? "Save Changes" : "Schedule Session"}
              </button>
              <button
                onClick={() => { setShowNewSessionForm(false); setEditingId(null); }}
                className="px-6 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">Your Upcoming Sessions</h2>
          <span className="text-sm text-slate-500">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-500">Loading sessions...</p>
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
            <div className="w-16 h-16 rounded-3xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">No sessions scheduled</h3>
            <p className="text-slate-400 text-sm mb-4">Schedule your first skill exchange session!</p>
            <button onClick={() => setShowNewSessionForm(true)}
              className="px-6 py-2.5 text-white font-bold rounded-2xl shadow-sm hover:opacity-90"
              style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
              Schedule Now
            </button>
          </div>
        )}

        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="h-1" style={{background: "linear-gradient(90deg, #667eea, #764ba2, #f093fb)"}} />
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                      style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
                      {session.partnerAvatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-lg font-black text-slate-900">{session.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${session.type === 'learning' ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {session.type === 'learning' ? 'Learning' : 'Teaching'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                          session.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                          session.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                          session.status === 'cancelled' ? 'bg-rose-100 text-rose-600' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {session.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> with {session.partner}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" /> {session.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {session.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="w-3.5 h-3.5" /> {session.format}
                        </span>
                      </div>

                      {session.description && (
                        <p className="text-sm text-slate-500 mb-3">{session.description}</p>
                      )}

                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                        {session.skill}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => window.open(session.raw?.meetingLink || '#', '_blank', 'noopener')}
                      className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-bold rounded-xl hover:opacity-90 shadow-sm"
                      style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
                      <Video className="w-3.5 h-3.5" /> Join
                    </button>
                    <button onClick={() => startEdit(session)}
                      className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-violet-50 border border-slate-200 flex items-center justify-center transition-colors">
                      <Edit className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={() => handleDelete(session.id)}
                      className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 flex items-center justify-center transition-colors">
                      <Trash2 className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
};

export default Schedule;