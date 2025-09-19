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
import { apiService, buildAssetUrl, API_BASE_URL } from "@/lib/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkAuth } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [recommendedMatches, setRecommendedMatches] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);

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
        // Fetch profile data
        const profileResult = await apiService.getProfile();
        if (profileResult.data) {
          setProfile(profileResult.data);
        }

        // Fetch schedules for upcoming sessions
        const schedulesResult = await apiService.getSchedules();
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
        }

        // Fetch skills for recommended matches (temporarily disabled due to TypeScript issues)
        // const skillsResult = await apiService.getSkills();
        // Set empty recommended matches for now
        setRecommendedMatches([]);

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

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={true} />
      
      <main className="container py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {profile?.name || user.name}! 👋</h1>
          <p className="text-muted-foreground">Ready to continue your learning journey?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      My Profile
                    </CardTitle>
                    <CardDescription>Manage your profile information and settings</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/profile/edit')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {profile?.profile?.avatar ? (
                      <>
                        {console.log('Avatar path from API:', profile.profile.avatar)}
                        {console.log('Constructed asset URL:', buildAssetUrl(profile.profile.avatar, true))}
                        <img
                          src={buildAssetUrl(profile.profile.avatar, true)}
                          alt="Avatar"
                          className="w-20 h-20 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.log('Avatar load error, trying direct path');
                            // Try direct path as fallback
                            const baseUrl = API_BASE_URL.replace('/api', '');
                            if (profile.profile.avatar.startsWith('uploads/')) {
                              target.onerror = null;
                              target.src = `${baseUrl}/${profile.profile.avatar}`;
                            } else {
                              target.onerror = null;
                              target.src = `${baseUrl}/uploads/${profile.profile.avatar}`;
                            }
                          }}
                        />
                      </>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold">
                        {profile?.name ? profile.name.charAt(0).toUpperCase() + profile.name.charAt(1).toUpperCase() : 'JD'}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                      onClick={() => navigate('/profile/edit')}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{profile?.name || user.name}</h3>
                    <p className="text-muted-foreground">{profile?.email || user.email}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="secondary">{getSkillCount(profile?.skillsTeaching)} Skills Teaching</Badge>
                      <Badge variant="secondary">{getSkillCount(profile?.skillsLearning)} Skills Learning</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Bio</h4>
                    <p className="text-sm text-muted-foreground">
                      {profile?.profile?.bio || 'No bio available.'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Skills I'm Teaching</h4>
                    <div className="flex flex-wrap gap-1 max-w-full overflow-auto">
                      {profile?.skillsTeaching?.map((skillObj: any, index: number) => {
                        // Handle both old format (strings) and new format (objects)
                        const skillName = typeof skillObj === 'string' ? skillObj : skillObj?.skill || 'Unknown Skill';
                        return (
                          <Badge key={index} variant="outline">{skillName}</Badge>
                        );
                      }) || <p>No skills listed.</p>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Skills I'm Learning</h4>
                    <div className="flex flex-wrap gap-1">
                      {profile?.skillsLearning?.map((skillObj: any, index: number) => {
                        // Handle both old format (strings) and new format (objects)
                        const skillName = typeof skillObj === 'string' ? skillObj : skillObj?.skill || 'Unknown Skill';
                        return (
                          <Badge key={index} variant="outline">{skillName}</Badge>
                        );
                      }) || <p>No skills listed.</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Quick Stats</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Profile Completion</span>
                        <span>{(typeof profile?.profile?.profileCompletion === 'number' && profile?.profile?.profileCompletion > 0
                          ? profile?.profile?.profileCompletion
                          : computeCompletion(profile))}%</span>
                      </div>
                      <Progress value={(typeof profile?.profile?.profileCompletion === 'number' && profile?.profile?.profileCompletion > 0
                        ? profile?.profile?.profileCompletion
                        : computeCompletion(profile))} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Complete your profile to get better matches
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Upcoming Sessions
                    </CardTitle>
                    <CardDescription>Your scheduled skill exchange sessions</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${session.type === 'learning' ? 'bg-blue-500' : 'bg-green-500'}`} />
                      <div>
                        <p className="font-medium">{session.title}</p>
                        <p className="text-sm text-muted-foreground">with {session.partner} • {session.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{session.time}</p>
                      <Badge variant={session.type === 'learning' ? 'default' : 'secondary'}>
                        {session.type === 'learning' ? 'Learning' : 'Teaching'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Progress Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Learning Progress
                </CardTitle>
                <CardDescription>Track your skill development journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {getLearningProgress().length > 0 ? (
                  getLearningProgress().map((skill, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{skill.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={skill.urgency === 'High' ? 'destructive' : skill.urgency === 'Medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {skill.urgency}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{skill.progress}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Current: {skill.currentLevel}</span>
                        <span className="text-xs text-muted-foreground">Target: {skill.targetLevel}</span>
                      </div>
                      <Progress value={skill.progress} className="h-2" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No learning skills added yet.</p>
                    <Button variant="outline" onClick={() => navigate('/profile/edit')}>
                      Add Learning Skills
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Recommended Matches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recommended Matches
                </CardTitle>
                <CardDescription>Perfect skill exchange partners for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendedMatches.map((match) => (
                  <div key={match.id} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {match.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{match.name}</p>
                      <p className="text-xs text-muted-foreground">{match.skill}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs">{match.rating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">• {match.sessions} sessions</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {match.match}% match
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full" size="sm" onClick={() => navigate('/schedule')}>
                  View All Matches
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/learn')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Find Skills to Learn
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/teach')}>
                  <Users className="mr-2 h-4 w-4" />
                  Offer Your Skills
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/messages')}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/schedule')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Session
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/interested-students')}>
                  <Users className="mr-2 h-4 w-4" />
                  View Interested Students
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;