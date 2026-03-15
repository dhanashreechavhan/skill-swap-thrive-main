import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  MessageSquare,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  Star,
  ArrowRight,
  User,
  Settings,
  Camera
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { apiService, buildAssetUrl, API_BASE_URL, ASSET_BASE_URL } from "@/lib/api";
import { InterestedStudents } from "@/components/InterestedStudents";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkAuth } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [recommendedMatches, setRecommendedMatches] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const computeCompletion = (data: any) => {
    if (!data) return 0;
    const bio = !!(data.profile && typeof data.profile.bio === 'string' && data.profile.bio.trim().length > 0);
    const teach = Array.isArray(data.skillsTeaching) && data.skillsTeaching.length > 0;
    const learn = Array.isArray(data.skillsLearning) && data.skillsLearning.length > 0;
    const avatar = !!(data.profile && typeof data.profile.avatar === 'string' && data.profile.avatar.trim().length > 0);
    let c = 0;
    if (bio) c += 25;
    if (teach) c += 25;
    if (learn) c += 25;
    if (avatar) c += 25;
    return c;
  };

  // Helper function to calculate learning progress based on current vs target level
  const calculateSkillProgress = (currentLevel: string, targetLevel: string, urgency?: string): number => {
    const levelMap = {
      'Absolute Beginner': 0,
      'Beginner': 25,
      'Intermediate': 50,
      'Advanced': 75,
      'Expert': 100
    };
    
    const current = levelMap[currentLevel as keyof typeof levelMap] || 0;
    const target = levelMap[targetLevel as keyof typeof levelMap] || 100;
    
    // If already at or beyond target
    if (current >= target) return 100;
    
    // Calculate base progress (current level achievement)
    const baseProgress = current;
    
    // Add simulated progress toward next level based on urgency
    let additionalProgress = 0;
    const progressRange = (target - current);
    
    switch (urgency) {
      case 'High':
        additionalProgress = progressRange * 0.6; // 60% toward target
        break;
      case 'Medium':
        additionalProgress = progressRange * 0.4; // 40% toward target
        break;
      case 'Low':
        additionalProgress = progressRange * 0.2; // 20% toward target
        break;
      default:
        additionalProgress = progressRange * 0.3; // 30% default
    }
    
    return Math.min(baseProgress + additionalProgress, 95); // Cap at 95%
  };

  // Helper function to get learning progress data from user's skills
  const getLearningProgress = () => {
    if (!profile?.skillsLearning || !Array.isArray(profile.skillsLearning)) {
      return [];
    }
    
    return profile.skillsLearning.slice(0, 3).map((skillObj: any) => {
      const skillName = typeof skillObj === 'string' ? skillObj : skillObj?.skill || 'Unknown Skill';
      const currentLevel = skillObj?.currentLevel || 'Beginner';
      const targetLevel = skillObj?.targetLevel || 'Intermediate';
      const urgency = skillObj?.urgency || 'Medium';
      const progress = calculateSkillProgress(currentLevel, targetLevel, urgency);
      
      return {
        name: skillName,
        currentLevel,
        targetLevel,
        urgency,
        progress: Math.round(progress)
      };
    });
  };

  // Helper function to count skills (handles both string and object formats)
  const getSkillCount = (skills: any[]) => {
    if (!Array.isArray(skills)) return 0;
    return skills.length;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user) {
        setLoading(true);
        setError(null);
        try {
          // Fetch profile data
          const profileResult = await apiService.getProfile();
          console.log('Profile result:', profileResult);
          if (profileResult.data) {
            setProfile(profileResult.data);
          } else if (profileResult.error) {
            console.error('Profile fetch error:', profileResult.error);
            // Don't set error for profile - continue with other requests
          }

          // Fetch schedules for upcoming sessions
          const schedulesResult = await apiService.getSchedules();
          console.log('Schedules result:', schedulesResult);
          if (schedulesResult.data && Array.isArray(schedulesResult.data)) {
            const upcoming = schedulesResult.data
              .filter((s: any) => new Date(s.date) >= new Date())
              .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 2)
              .map((s: any) => ({
                id: s._id,
                title: typeof s.skill === 'object' ? (s.skill.name || s.skill.title || 'Session') : String(s.skill),
                partner: s.student?._id === user._id ? (s.teacher?.name || 'Partner') : (s.student?.name || 'Partner'),
                time: new Date(s.date).toLocaleDateString() + " " + (s.startTime || ''),
                type: s.student?._id === user._id ? 'learning' : 'teaching',
                status: s.status || 'Pending'
              }));
            setUpcomingSessions(upcoming);
          } else if (schedulesResult.error) {
            console.error('Schedules fetch error:', schedulesResult.error);
            // Don't set error - continue with other requests
          }

          // Fetch matches for recommended matches section
          try {
            const matchesResult = await apiService.getMatches({ limit: 3, minScore: 50 });
            console.log('Matches result:', matchesResult);
            if (matchesResult.data) {
              const matchesData = matchesResult.data as any;
              if (matchesData.matches && Array.isArray(matchesData.matches)) {
                const formattedMatches = matchesData.matches.slice(0, 3).map((match: any) => ({
                  id: match._id,
                  name: match.teacher?.name || 'Unknown Teacher',
                  avatar: match.teacher?.name ? match.teacher.name.slice(0, 2).toUpperCase() : 'TH',
                  skill: match.skill?.name || 'Unknown Skill',
                  rating: match.teacher?.rating?.averageRating?.toFixed(1) || '0.0',
                  sessions: match.teacher?.rating?.totalRatings || 0,
                  match: Math.round(match.matchScore),
                  location: match.teacher?.profile?.location || 'Location not specified'
                }));
                setRecommendedMatches(formattedMatches);
              } else {
                setRecommendedMatches([]);
              }
            } else if (matchesResult.error) {
              console.error('Matches fetch error:', matchesResult.error);
              setRecommendedMatches([]);
            }
          } catch (matchError) {
            console.error('Error fetching matches:', matchError);
            setRecommendedMatches([]);
          }
        } catch (err) {
          console.error('Dashboard data fetch error:', err);
          setError('Failed to load some dashboard data, but you can still use the dashboard');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDashboardData();
  }, [user, location]);

  // Update stats when profile or sessions change
  useEffect(() => {
    if (profile) {
      const completion = typeof profile.profile?.profileCompletion === 'number' && profile.profile.profileCompletion > 0
        ? profile.profile.profileCompletion
        : computeCompletion(profile);
      const stats = [
        { label: "Skills Learned", value: getSkillCount(profile.skillsLearning), icon: BookOpen, color: "text-blue-600" },
        { label: "Skills Taught", value: getSkillCount(profile.skillsTeaching), icon: Users, color: "text-green-600" },
        { label: "Active Sessions", value: upcomingSessions.length, icon: Calendar, color: "text-purple-600" },
        { label: "Profile Completion", value: completion, icon: Award, color: "text-orange-600" }
      ];
      setStats(stats);
    }
  }, [profile, upcomingSessions]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading dashboard: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf4ff 100%)" }}>
        <Header isLoggedIn={true} />

        <main className="container py-8 max-w-7xl mx-auto px-4">

          {/* Welcome Banner */}
          <div className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)" }}>
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "28px 28px"
            }} />
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-black mb-1">Welcome back, {profile?.name?.split(' ')[0] || user.name}! 👋</h1>
                <p className="text-white/70">Ready to continue your learning journey?</p>
              </div>
              <button onClick={() => navigate('/profile/edit')}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-2xl transition-colors flex items-center gap-2">
                <Settings className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => {
              const gradients = [
                "from-violet-500 to-purple-600",
                "from-indigo-500 to-blue-600",
                "from-fuchsia-500 to-pink-600",
                "from-amber-500 to-orange-500"
              ];
              return (
                <div key={index} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradients[index]} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-black text-slate-900">{stat.value}{stat.label === "Profile Completion" ? "%" : ""}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Profile Card */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="h-2 w-full" style={{ background: "linear-gradient(90deg, #667eea, #764ba2, #f093fb)" }} />
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      {profile?.profile?.avatar ? (
                        <img src={buildAssetUrl(profile.profile.avatar, true)} alt="Avatar"
                          className="w-20 h-20 rounded-2xl object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `${ASSET_BASE_URL}/uploads/${profile.profile.avatar}`;
                          }} />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black"
                          style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
                          {profile?.name ? profile.name.charAt(0).toUpperCase() + (profile.name.charAt(1) || '').toUpperCase() : 'JD'}
                        </div>
                      )}
                      <button onClick={() => navigate('/profile/edit')}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm hover:bg-slate-50">
                        <Camera className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-slate-900">{profile?.name || user.name}</h3>
                      <p className="text-slate-500 text-sm">{profile?.email || user.email}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                          {getSkillCount(profile?.skillsTeaching)} Teaching
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          {getSkillCount(profile?.skillsLearning)} Learning
                        </span>
                        {profile?.skillsTeaching?.slice(0, 2).map((skillObj: any, i: number) => (
                          <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {typeof skillObj === 'string' ? skillObj : skillObj?.skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <h4 className="font-bold text-slate-700 text-sm mb-2">Bio</h4>
                      <p className="text-sm text-slate-500">{profile?.profile?.bio || 'No bio added yet.'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <h4 className="font-bold text-slate-700 text-sm mb-2">Skills Teaching</h4>
                      <div className="flex flex-wrap gap-1">
                        {profile?.skillsTeaching?.length > 0 ? profile.skillsTeaching.map((s: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-lg text-xs font-medium">
                            {typeof s === 'string' ? s : s?.skill}
                          </span>
                        )) : <p className="text-xs text-slate-400">None added yet</p>}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <h4 className="font-bold text-slate-700 text-sm mb-2">Skills Learning</h4>
                      <div className="flex flex-wrap gap-1">
                        {profile?.skillsLearning?.length > 0 ? profile.skillsLearning.map((s: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium">
                            {typeof s === 'string' ? s : s?.skill}
                          </span>
                        )) : <p className="text-xs text-slate-400">None added yet</p>}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <h4 className="font-bold text-slate-700 text-sm mb-2">Profile Completion</h4>
                      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>Progress</span>
                        <span className="font-bold text-violet-600">
                          {typeof profile?.profile?.profileCompletion === 'number' && profile?.profile?.profileCompletion > 0
                            ? profile?.profile?.profileCompletion : computeCompletion(profile)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${typeof profile?.profile?.profileCompletion === 'number' && profile?.profile?.profileCompletion > 0
                            ? profile?.profile?.profileCompletion : computeCompletion(profile)}%`,
                          background: "linear-gradient(90deg, #667eea, #764ba2)"
                        }} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Complete profile for better matches</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900">Upcoming Sessions</h3>
                      <p className="text-xs text-slate-500">Your scheduled exchanges</p>
                    </div>
                  </div>
                  <button onClick={() => navigate('/schedule')}
                    className="text-sm font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {upcomingSessions.length > 0 ? upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${session.type === 'learning' ? 'bg-violet-500' : 'bg-emerald-500'}`} />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{session.title}</p>
                        <p className="text-xs text-slate-500">with {session.partner} • {session.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-700">{session.time}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${session.type === 'learning' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {session.type === 'learning' ? 'Learning' : 'Teaching'}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-slate-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No upcoming sessions yet</p>
                  </div>
                )}
              </div>

              

              {/* Skills Visualization Button */}
<div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
        <TrendingUp className="w-5 h-5 text-violet-600" />
      </div>
      <div>
        <h3 className="font-black text-slate-900">Skills Analytics</h3>
        <p className="text-xs text-slate-500">View detailed skills visualization</p>
      </div>
    </div>
    <button onClick={() => navigate('/skills-visualization')}
      className="px-5 py-2.5 text-white font-semibold rounded-2xl flex items-center gap-2"
      style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
      <TrendingUp className="w-4 h-4" /> View Analytics
    </button>
  </div>
</div>
  



              {/* Interested Students */}
              <InterestedStudents />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Recommended Matches */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-fuchsia-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-fuchsia-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">Recommended Matches</h3>
                    <p className="text-xs text-slate-500">Perfect partners for you</p>
                  </div>
                </div>
                {recommendedMatches.length > 0 ? recommendedMatches.map((match) => (
                  <div key={match.id}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors mb-2"
                    onClick={() => navigate('/matches')}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
                      {match.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{match.name}</p>
                      <p className="text-xs text-slate-500 truncate">{match.skill}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-slate-600">{match.rating}</span>
                        <span className="text-xs text-slate-400">• {match.sessions} reviews</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-violet-100 text-violet-700 rounded-xl flex-shrink-0">
                      {match.match}%
                    </span>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-400 mb-3">No matches yet</p>
                    <button onClick={() => navigate('/matches')}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
                      Generate Matches
                    </button>
                  </div>
                )}
                <button onClick={() => navigate('/matches')}
                  className="w-full mt-3 py-2.5 border border-slate-200 text-slate-700 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  View All Matches <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-black text-slate-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { icon: BookOpen, label: "Find Skills to Learn", path: "/learn", color: "bg-violet-100 text-violet-600" },
                    { icon: Users, label: "Offer Your Skills", path: "/teach", color: "bg-indigo-100 text-indigo-600" },
                    { icon: MessageSquare, label: "Messages", path: "/messages", color: "bg-fuchsia-100 text-fuchsia-600" },
                    { icon: Calendar, label: "Schedule Session", path: "/schedule", color: "bg-amber-100 text-amber-600" },
                    { icon: Users, label: "Interested Students", path: "/interested-students", color: "bg-emerald-100 text-emerald-600" },
                    { icon: Star, label: "My Reviews", path: `/reviews/${user._id}`, color: "bg-rose-100 text-rose-600" },
                  ].map((action, i) => (
                    <button key={i} onClick={() => navigate(action.path)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left">
                      <div className={`w-8 h-8 rounded-xl ${action.color} flex items-center justify-center flex-shrink-0`}>
                        <action.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{action.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto" />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;