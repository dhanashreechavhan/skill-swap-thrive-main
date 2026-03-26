import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { Plus, Trash2, BookOpen, GraduationCap, Sparkles, Target, ChevronDown, ChevronUp, Clock, Calendar, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CourseContent {
  courseType?: string;
  whatYouWillLearn?: string;
  topics?: string[];
  duration?: string;
  sessionsPerWeek?: number;
  sessionDurationMinutes?: number;
  prerequisites?: string;
  isFree?: boolean;
  pricePerSession?: number;
}

interface TeachSkill {
  _id: string;
  name: string;
  category: string;
  level?: string;
  yearsExperience?: number;
  description?: string;
  courseContent?: CourseContent;
}

interface LearnSkill {
  skill: string;
  currentLevel?: string;
  targetLevel?: string;
  urgency?: string;
}

const SKILL_CATEGORIES = ["Technology", "Language", "Art", "Music", "Sports", "Cooking", "Other"];
const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const LEARN_LEVELS = ["Absolute Beginner", "Beginner", "Intermediate", "Advanced"];
const URGENCY_LEVELS = ["Low", "Medium", "High"];
const COURSE_TYPES = ["Technical", "Non-Technical"];

const Badge = ({ label, color = "violet" }: { label: string; color?: string }) => {
  const colors: Record<string, string> = {
    violet: "bg-violet-100 text-violet-700", indigo: "bg-indigo-100 text-indigo-700",
    emerald: "bg-emerald-100 text-emerald-700", amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700", teal: "bg-teal-100 text-teal-700",
  };
  return <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${colors[color] || colors.violet}`}>{label}</span>;
};

// ── Course Details Expandable Section ─────────────────────────────────────────
const CourseDetails = ({ course }: { course: CourseContent }) => (
  <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">📚 Course Details</p>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {course.duration && (
        <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
          <Clock className="w-4 h-4 text-violet-500 mx-auto mb-1" />
          <p className="text-xs font-black text-slate-800">{course.duration}</p>
          <p className="text-xs text-slate-400">Duration</p>
        </div>
      )}
      {course.sessionsPerWeek && (
        <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
          <Calendar className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
          <p className="text-xs font-black text-slate-800">{course.sessionsPerWeek}x / week</p>
          <p className="text-xs text-slate-400">Sessions</p>
        </div>
      )}
      {course.sessionDurationMinutes && (
        <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
          <Clock className="w-4 h-4 text-fuchsia-500 mx-auto mb-1" />
          <p className="text-xs font-black text-slate-800">{course.sessionDurationMinutes} min</p>
          <p className="text-xs text-slate-400">Per Session</p>
        </div>
      )}
      <div className="bg-white rounded-xl p-3 text-center border border-slate-100">
        <p className="text-lg mb-1">{course.isFree ? "🆓" : "💰"}</p>
        <p className="text-xs font-black text-slate-800">{course.isFree ? "Free" : `₹${course.pricePerSession}`}</p>
        <p className="text-xs text-slate-400">Per Session</p>
      </div>
    </div>

    {course.whatYouWillLearn && (
      <div className="mb-3">
        <p className="text-xs font-bold text-slate-500 mb-1">What You'll Learn</p>
        <p className="text-sm text-slate-600 leading-relaxed">{course.whatYouWillLearn}</p>
      </div>
    )}

    {course.topics && course.topics.length > 0 && (
      <div className="mb-3">
        <p className="text-xs font-bold text-slate-500 mb-2">Syllabus</p>
        <div className="space-y-1.5">
          {course.topics.map((topic, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-600">{topic}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {course.prerequisites && (
      <div>
        <p className="text-xs font-bold text-slate-500 mb-1">Prerequisites</p>
        <p className="text-sm text-slate-600">{course.prerequisites}</p>
      </div>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const MySkills = () => {
  const [activeTab, setActiveTab] = useState<"teach" | "learn">("teach");
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const [teachSkills, setTeachSkills] = useState<TeachSkill[]>([]);
  const [teachLoading, setTeachLoading] = useState(false);
  const [learnSkills, setLearnSkills] = useState<LearnSkill[]>([]);
  const [learnLoading, setLearnLoading] = useState(false);

  // Basic form
  const [showTeachForm, setShowTeachForm] = useState(false);
  const [teachName, setTeachName] = useState("");
  const [teachCategory, setTeachCategory] = useState("");
  const [teachLevel, setTeachLevel] = useState("");
  const [teachExp, setTeachExp] = useState("");
  const [teachDesc, setTeachDesc] = useState("");
  const [teachSubmitting, setTeachSubmitting] = useState(false);

  // Course content form
  const [courseType, setCourseType] = useState("Technical");
  const [whatYouWillLearn, setWhatYouWillLearn] = useState("");
  const [topicsInput, setTopicsInput] = useState("");
  const [duration, setDuration] = useState("");
  const [sessionsPerWeek, setSessionsPerWeek] = useState("2");
  const [sessionDuration, setSessionDuration] = useState("60");
  const [prerequisites, setPrerequisites] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [pricePerSession, setPricePerSession] = useState("0");

  // Learn form
  const [showLearnForm, setShowLearnForm] = useState(false);
  const [learnName, setLearnName] = useState("");
  const [learnCurrentLevel, setLearnCurrentLevel] = useState("");
  const [learnTargetLevel, setLearnTargetLevel] = useState("");
  const [learnUrgency, setLearnUrgency] = useState("Medium");
  const [learnSubmitting, setLearnSubmitting] = useState(false);

  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const loadTeachSkills = async () => {
    if (!isAuthenticated) return;
    setTeachLoading(true);
    try {
      const res = await apiService.getMySkills();
      if (res.data && (res.data as any).skills) {
        setTeachSkills((res.data as any).skills);
      } else {
        setTeachSkills([]);
      }
    } catch (e) {
      console.error("Error loading teach skills:", e);
      setTeachSkills([]);
    } finally {
      setTeachLoading(false);
    }
  };

  const loadLearnSkills = async () => {
    if (!isAuthenticated) return;
    setLearnLoading(true);
    try {
      const res = await apiService.getProfile();
      if (res.data && (res.data as any).skillsLearning) setLearnSkills((res.data as any).skillsLearning);
    } catch (e) { console.error(e); }
    finally { setLearnLoading(false); }
  };

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    loadTeachSkills();
    loadLearnSkills();
  }, [isAuthenticated]);

  const resetTeachForm = () => {
    setTeachName(""); setTeachCategory(""); setTeachLevel(""); setTeachExp(""); setTeachDesc("");
    setCourseType("Technical"); setWhatYouWillLearn(""); setTopicsInput("");
    setDuration(""); setSessionsPerWeek("2"); setSessionDuration("60");
    setPrerequisites(""); setIsFree(true); setPricePerSession("0");
    setShowTeachForm(false);
  };

  const handleAddTeachSkill = async () => {
    if (!teachName.trim() || !teachCategory || !teachDesc.trim()) {
      toast({ title: "Missing fields", description: "Name, category and description are required.", variant: "destructive" });
      return;
    }
    setTeachSubmitting(true);
    try {
      const topicsArray = topicsInput.split("\n").map(t => t.trim()).filter(t => t.length > 0);
      const res = await apiService.createSkill({
        name: teachName.trim(), category: teachCategory, description: teachDesc.trim(),
        ...(teachLevel && { level: teachLevel }),
        ...(teachExp && !isNaN(Number(teachExp)) && { yearsExperience: Number(teachExp) }),
        courseContent: {
          courseType, whatYouWillLearn: whatYouWillLearn.trim(), topics: topicsArray,
          duration: duration.trim(), sessionsPerWeek: Number(sessionsPerWeek) || 2,
          sessionDurationMinutes: Number(sessionDuration) || 60,
          prerequisites: prerequisites.trim(), isFree,
          pricePerSession: isFree ? 0 : Number(pricePerSession) || 0,
        }
      });
      if ((res as any).error) { toast({ title: "Error", description: (res as any).error, variant: "destructive" }); return; }
      toast({ title: "✅ Skill added!", description: `${teachName} added with course details!` });
      resetTeachForm();
      await loadTeachSkills();
    } catch { toast({ title: "Error", description: "Something went wrong.", variant: "destructive" }); }
    finally { setTeachSubmitting(false); }
  };

  const handleDeleteTeachSkill = async (id: string) => {
    if (!window.confirm("Delete this skill?")) return;
    try {
      const res = await apiService.deleteSkill(id);
      if ((res as any).error) { toast({ title: "Error", description: (res as any).error, variant: "destructive" }); return; }
      toast({ title: "Deleted" });
      await loadTeachSkills();
    } catch { toast({ title: "Error", description: "Something went wrong.", variant: "destructive" }); }
  };

  const handleAddLearnSkill = async () => {
    if (!learnName.trim()) { toast({ title: "Missing field", description: "Skill name is required.", variant: "destructive" }); return; }
    setLearnSubmitting(true);
    try {
      const profileRes = await apiService.getProfile();
      const existing: LearnSkill[] = (profileRes.data as any)?.skillsLearning || [];
      const updated = [...existing, { skill: learnName.trim(), ...(learnCurrentLevel && { currentLevel: learnCurrentLevel }), ...(learnTargetLevel && { targetLevel: learnTargetLevel }), urgency: learnUrgency || "Medium" }];
      const res = await apiService.updateProfile({ skillsLearning: updated });
      if ((res as any).error) { toast({ title: "Error", description: (res as any).error, variant: "destructive" }); return; }
      toast({ title: "✅ Added!", description: `${learnName} added!` });
      setLearnName(""); setLearnCurrentLevel(""); setLearnTargetLevel(""); setLearnUrgency("Medium");
      setShowLearnForm(false);
      await loadLearnSkills();
    } catch { toast({ title: "Error", description: "Something went wrong.", variant: "destructive" }); }
    finally { setLearnSubmitting(false); }
  };

  const handleDeleteLearnSkill = async (index: number) => {
    if (!window.confirm("Remove this skill?")) return;
    const updated = learnSkills.filter((_, i) => i !== index);
    try {
      await apiService.updateProfile({ skillsLearning: updated });
      toast({ title: "Removed" });
      setLearnSkills(updated);
    } catch { toast({ title: "Error", description: "Something went wrong.", variant: "destructive" }); }
  };

  const urgencyColor = (u?: string) => u === "High" ? "rose" : u === "Medium" ? "amber" : "emerald";

  const Spinner = () => (
    <div className="flex items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-slate-400 text-sm">Loading skills...</p>
    </div>
  );

  const Empty = ({ onAdd, label }: { onAdd: () => void; label: string }) => (
    <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
      <div className="w-14 h-14 rounded-3xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-7 h-7 text-violet-400" />
      </div>
      <h3 className="text-base font-black text-slate-800 mb-1">Nothing here yet!</h3>
      <p className="text-slate-400 text-sm mb-4">{label}</p>
      <button onClick={onAdd} className="px-5 py-2.5 text-white text-sm font-bold rounded-2xl hover:opacity-90 shadow-sm" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>Add Your First Skill</button>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf4ff 100%)" }}>
      <Header isLoggedIn={true} />
      <main className="container py-8 max-w-5xl mx-auto px-4">

        {/* Hero */}
        <div className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)" }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-1">My Skills 🧠</h1>
            <p className="text-white/70 text-sm">Manage the skills you teach and the skills you want to learn — all in one place.</p>
            <div className="flex gap-4 mt-4">
              <div className="bg-white/20 rounded-2xl px-4 py-2 text-center">
                <p className="text-xl font-black">{teachSkills.length}</p>
                <p className="text-xs text-white/70">Teaching</p>
              </div>
              <div className="bg-white/20 rounded-2xl px-4 py-2 text-center">
                <p className="text-xl font-black">{learnSkills.length}</p>
                <p className="text-xs text-white/70">Learning</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm w-fit">
          {[{ key: "teach", label: "Skills I Teach", icon: GraduationCap }, { key: "learn", label: "Skills I Want to Learn", icon: BookOpen }].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key as "teach" | "learn")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === key ? "text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}
              style={activeTab === key ? { background: "linear-gradient(135deg, #667eea, #764ba2)" } : {}}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* ══ TEACH TAB ══ */}
        {activeTab === "teach" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900">Skills I Teach <span className="ml-2 text-sm font-normal text-slate-400">({teachSkills.length})</span></h2>
              <button onClick={() => setShowTeachForm(!showTeachForm)}
                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-2xl hover:opacity-90 shadow-sm"
                style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
                <Plus className="w-4 h-4" /> Add Skill
              </button>
            </div>

            {showTeachForm && (
              <div className="bg-white rounded-3xl border border-violet-100 shadow-md p-6 mb-6">
                <h3 className="font-black text-slate-800 mb-1">Add a Teaching Skill</h3>
                <p className="text-xs text-slate-400 mb-5">Fill in basic info + course details so students know exactly what they'll learn!</p>

                {/* Basic Info */}
                <p className="text-xs font-black text-violet-600 uppercase tracking-wider mb-3">Basic Info</p>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Skill Name *</label>
                    <input value={teachName} onChange={e => setTeachName(e.target.value)} placeholder="e.g. Python, Guitar" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Category *</label>
                    <select value={teachCategory} onChange={e => setTeachCategory(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400">
                      <option value="">Select category</option>
                      {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Your Level</label>
                    <select value={teachLevel} onChange={e => setTeachLevel(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400">
                      <option value="">Select level</option>
                      {PROFICIENCY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Years of Experience</label>
                    <input type="number" min="0" max="50" value={teachExp} onChange={e => setTeachExp(e.target.value)} placeholder="e.g. 3" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400" />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Short Description *</label>
                  <textarea value={teachDesc} onChange={e => setTeachDesc(e.target.value)} rows={2} placeholder="Brief overview of what you teach..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400 resize-none" />
                </div>

                {/* Course Details */}
                <div className="border-t border-slate-100 pt-5">
                  <p className="text-xs font-black text-violet-600 uppercase tracking-wider mb-3">📚 Course Details</p>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Course Type</label>
                      <select value={courseType} onChange={e => setCourseType(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400">
                        {COURSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Total Duration</label>
                      <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 4 weeks, 2 months" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Sessions Per Week</label>
                      <input type="number" min="1" max="7" value={sessionsPerWeek} onChange={e => setSessionsPerWeek(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Session Duration (mins)</label>
                      <input type="number" value={sessionDuration} onChange={e => setSessionDuration(e.target.value)} placeholder="60" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">What Students Will Learn</label>
                    <textarea value={whatYouWillLearn} onChange={e => setWhatYouWillLearn(e.target.value)} rows={2} placeholder="Describe the learning outcomes..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400 resize-none" />
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Syllabus / Topics <span className="text-slate-300 font-normal normal-case">(one per line)</span></label>
                    <textarea value={topicsInput} onChange={e => setTopicsInput(e.target.value)} rows={5}
                      placeholder={"Week 1: Introduction & Setup\nWeek 2: Core Concepts\nWeek 3: Hands-on Projects\nWeek 4: Advanced Topics & Review"}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400 resize-none font-mono" />
                    <p className="text-xs text-slate-400 mt-1">Each line = one topic in the syllabus</p>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Prerequisites</label>
                    <input value={prerequisites} onChange={e => setPrerequisites(e.target.value)} placeholder="e.g. Basic computer knowledge, No prior experience needed" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400" />
                  </div>

                

                </div>

                <div className="flex gap-3 mt-5">
                  <button disabled={teachSubmitting} onClick={handleAddTeachSkill}
                    className="px-6 py-2.5 text-white text-sm font-bold rounded-2xl hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
                    {teachSubmitting ? "Adding..." : "Add Skill + Course"}
                  </button>
                  <button onClick={resetTeachForm} className="px-6 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-2xl hover:bg-slate-50">Cancel</button>
                </div>
              </div>
            )}

            {teachLoading ? <Spinner /> : teachSkills.length === 0
              ? <Empty onAdd={() => setShowTeachForm(true)} label="Add skills you can teach others!" />
              : (
                <div className="space-y-4">
                  {teachSkills.map(skill => (
                    <div key={skill._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                      <div className="h-1" style={{ background: "linear-gradient(90deg, #667eea, #764ba2, #f093fb)" }} />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                              style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
                              {skill.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-black text-slate-900">{skill.name}</span>
                                <Badge label={skill.category} color="violet" />
                                {skill.level && <Badge label={skill.level} color="indigo" />}
                                {skill.yearsExperience !== undefined && skill.yearsExperience > 0 && <Badge label={`${skill.yearsExperience} yrs`} color="emerald" />}
                                {skill.courseContent?.courseType && <Badge label={skill.courseContent.courseType} color={skill.courseContent.courseType === "Technical" ? "indigo" : "amber"} />}
                                {skill.courseContent?.isFree !== undefined && <Badge label={skill.courseContent.isFree ? "Free" : `₹${skill.courseContent.pricePerSession}/session`} color={skill.courseContent.isFree ? "teal" : "rose"} />}
                              </div>
                              {skill.description && <p className="text-sm text-slate-500 leading-relaxed">{skill.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => setExpandedCourse(expandedCourse === skill._id ? null : skill._id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold rounded-xl transition-colors">
                              <BookOpen className="w-3.5 h-3.5" />
                              Course
                              {expandedCourse === skill._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            <button onClick={() => handleDeleteTeachSkill(skill._id)}
                              className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition-colors">
                              <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                            </button>
                          </div>
                        </div>
                        {expandedCourse === skill._id && skill.courseContent && <CourseDetails course={skill.courseContent} />}
                        {expandedCourse === skill._id && !skill.courseContent && (
                          <div className="mt-4 bg-slate-50 rounded-2xl p-4 text-center">
                            <p className="text-sm text-slate-400">No course details added yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ══ LEARN TAB ══ */}
        {activeTab === "learn" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900">Skills I Want to Learn <span className="ml-2 text-sm font-normal text-slate-400">({learnSkills.length})</span></h2>
              <button onClick={() => setShowLearnForm(!showLearnForm)}
                className="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-2xl hover:opacity-90 shadow-sm"
                style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
                <Plus className="w-4 h-4" /> Add Skill
              </button>
            </div>

            {showLearnForm && (
              <div className="bg-white rounded-3xl border border-violet-100 shadow-md p-6 mb-6">
                <h3 className="font-black text-slate-800 mb-4">Add a Skill to Learn</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Skill Name *</label>
                    <input value={learnName} onChange={e => setLearnName(e.target.value)} placeholder="e.g. Spanish, React, Cooking" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">My Current Level</label>
                    <select value={learnCurrentLevel} onChange={e => setLearnCurrentLevel(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400">
                      <option value="">Select level</option>
                      {LEARN_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Target Level</label>
                    <select value={learnTargetLevel} onChange={e => setLearnTargetLevel(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400">
                      <option value="">Select target</option>
                      {PROFICIENCY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">How Urgent?</label>
                    <select value={learnUrgency} onChange={e => setLearnUrgency(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400">
                      {URGENCY_LEVELS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button disabled={learnSubmitting} onClick={handleAddLearnSkill}
                    className="px-6 py-2.5 text-white text-sm font-bold rounded-2xl hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
                    {learnSubmitting ? "Adding..." : "Add Skill"}
                  </button>
                  <button onClick={() => setShowLearnForm(false)} className="px-6 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-2xl hover:bg-slate-50">Cancel</button>
                </div>
              </div>
            )}

            {learnLoading ? <Spinner /> : learnSkills.length === 0
              ? <Empty onAdd={() => setShowLearnForm(true)} label="Add skills you want to learn from others!" />
              : (
                <div className="space-y-4">
                  {learnSkills.map((skill, index) => (
                    <div key={index} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                      <div className="h-1" style={{ background: "linear-gradient(90deg, #f093fb, #764ba2, #667eea)" }} />
                      <div className="p-5 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0" style={{ background: "linear-gradient(135deg, #f093fb, #764ba2)" }}>
                            <Target className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-black text-slate-900">{skill.skill}</span>
                              {skill.urgency && <Badge label={`${skill.urgency} priority`} color={urgencyColor(skill.urgency)} />}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              {skill.currentLevel && <span className="text-xs text-slate-500">From: <span className="font-semibold text-slate-700">{skill.currentLevel}</span></span>}
                              {skill.targetLevel && <span className="text-xs text-slate-500">→ Target: <span className="font-semibold text-violet-700">{skill.targetLevel}</span></span>}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteLearnSkill(index)}
                          className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition-colors flex-shrink-0">
                          <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MySkills;
