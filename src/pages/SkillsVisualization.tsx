import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { TrendingUp, ArrowLeft, Star, BookOpen, Users, Calendar } from "lucide-react";

const SkillsVisualization = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);

  const getSkillCount = (skills: any[]) => {
    if (!Array.isArray(skills)) return 0;
    return skills.length;
  };

  const calculateSkillProgress = (currentLevel: string, targetLevel: string, urgency?: string): number => {
    const levelMap = { 'Absolute Beginner': 0, 'Beginner': 25, 'Intermediate': 50, 'Advanced': 75, 'Expert': 100 };
    const current = levelMap[currentLevel as keyof typeof levelMap] || 0;
    const target = levelMap[targetLevel as keyof typeof levelMap] || 100;
    if (current >= target) return 100;
    const progressRange = target - current;
    const additional = urgency === 'High' ? 0.6 : urgency === 'Medium' ? 0.4 : 0.2;
    return Math.min(current + progressRange * additional, 95);
  };

  useEffect(() => {
    const fetchData = async () => {
      const result = await apiService.getProfile();
      if (result.data) setProfile(result.data);
      const schedulesResult = await apiService.getSchedules();
if (schedulesResult.data && Array.isArray(schedulesResult.data)) {
  const upcoming = schedulesResult.data
    .filter((s: any) => new Date(s.date) >= new Date())
    .slice(0, 10);
  setUpcomingSessions(upcoming);
}
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const teachingSkills = profile?.skillsTeaching || [];
  const learningSkills = profile?.skillsLearning || [];

  const learningProgressData = learningSkills.slice(0, 5).map((s: any) => ({
    name: typeof s === 'string' ? s : s?.skill,
    progress: Math.round(calculateSkillProgress(s?.currentLevel || 'Beginner', s?.targetLevel || 'Intermediate', s?.urgency)),
    current: s?.currentLevel || 'Beginner',
    target: s?.targetLevel || 'Intermediate',
  }));

  const radarData = [
    { subject: 'Teaching', value: getSkillCount(teachingSkills) },
    { subject: 'Learning', value: getSkillCount(learningSkills) },
    { subject: 'Progress', value: learningProgressData.reduce((a: number, b: any) => a + b.progress, 0) / (learningProgressData.length || 1) },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf4ff 100%)" }}>
      <Header isLoggedIn={true} />
      <main className="container py-8 max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Skills Analytics</h1>
            <p className="text-slate-500">Detailed view of your skill journey</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Skills Teaching', value: getSkillCount(teachingSkills), color: 'from-violet-500 to-purple-600', icon: Users },
            { label: 'Skills Learning', value: getSkillCount(learningSkills), color: 'from-indigo-500 to-blue-600', icon: BookOpen },
            { label: 'Avg Progress', value: `${Math.round(learningProgressData.reduce((a: number, b: any) => a + b.progress, 0) / (learningProgressData.length || 1))}%`, color: 'from-fuchsia-500 to-pink-600', icon: TrendingUp },
            { label: 'Total Skills', value: getSkillCount(teachingSkills) + getSkillCount(learningSkills), color: 'from-amber-500 to-orange-500', icon: Star },
            { label: 'Active Sessions', value: upcomingSessions.length, color: 'from-emerald-500 to-teal-500', icon: Calendar },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-slate-900 mb-4">Teaching vs Learning</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { name: 'Teaching', count: getSkillCount(teachingSkills) },
                { name: 'Learning', count: getSkillCount(learningSkills) },
              ]}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  <Cell fill="#667eea" />
                  <Cell fill="#f093fb" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-black text-slate-900 mb-4">Skills Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={[
                  { name: 'Teaching', value: getSkillCount(teachingSkills) || 1 },
                  { name: 'Learning', value: getSkillCount(learningSkills) || 1 },
                ]} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                  <Cell fill="#667eea" />
                  <Cell fill="#f093fb" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Learning Progress */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6">
          <h3 className="font-black text-slate-900 mb-5">Learning Progress per Skill</h3>
          {learningProgressData.length > 0 ? learningProgressData.map((skill: any, i: number) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-slate-800 text-sm">{skill.name}</span>
                <span className="font-black text-violet-600 text-sm">{skill.progress}%</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Current: {skill.current}</span>
                <span>Target: {skill.target}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${skill.progress}%`, background: "linear-gradient(90deg, #667eea, #f093fb)" }} />
              </div>
            </div>
          )) : (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm mb-3">No learning skills added yet!</p>
              <button onClick={() => navigate('/profile/edit')}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm">
                Add Learning Skills
              </button>
            </div>
          )}
        </div>

        {/* Teaching Skills List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-black text-slate-900 mb-5">Your Teaching Skills</h3>
          {teachingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {teachingSkills.map((s: any, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-xl text-sm font-semibold">
                  {typeof s === 'string' ? s : s?.skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No teaching skills added yet!</p>
          )}
        </div>

      </main>
    </div>
  );
};

export default SkillsVisualization;