import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { apiService } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Users, BookOpen, Calendar, MessageSquare, ArrowLeft, Shield, TrendingUp } from 'lucide-react';

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [statsRes, usersRes, skillsRes] = await Promise.all([
        apiService.adminGetStats(),
        apiService.adminListUsers(),
        apiService.adminListSkills(),
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (usersRes.data) setUsers((usersRes.data as any[]) || []);
      if (skillsRes.data) setSkills((skillsRes.data as any[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const bannedUsers = users.filter(u => u.profile?.isBanned).length;
  const adminUsers = users.filter(u => u.isAdmin).length;
  const regularUsers = users.length - adminUsers;

  const skillCategories = skills.reduce((acc: any, s: any) => {
    const cat = s.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const skillCategoryData = Object.entries(skillCategories).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={true} hideDashboard={true} />
      <main className="container py-8 max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Analytics</h1>
            <p className="text-muted-foreground">Platform overview and insights</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats?.userCount || 0, color: 'bg-violet-100 text-violet-700', icon: Users },
            { label: 'Total Skills', value: stats?.skillCount || 0, color: 'bg-blue-100 text-blue-700', icon: BookOpen },
            { label: 'Total Sessions', value: stats?.scheduleCount || 0, color: 'bg-purple-100 text-purple-700', icon: Calendar },
            { label: 'Total Messages', value: stats?.messageCount || 0, color: 'bg-green-100 text-green-700', icon: MessageSquare },
          ].map((stat, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Platform Overview Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'Users', count: stats?.userCount || 0 },
                  { name: 'Skills', count: stats?.skillCount || 0 },
                  { name: 'Sessions', count: stats?.scheduleCount || 0 },
                  { name: 'Messages', count: stats?.messageCount || 0 },
                ]}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    <Cell fill="#667eea" />
                    <Cell fill="#f093fb" />
                    <Cell fill="#764ba2" />
                    <Cell fill="#43e97b" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Breakdown Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={[
                    { name: 'Regular Users', value: regularUsers || 1 },
                    { name: 'Admins', value: adminUsers || 0 },
                    { name: 'Banned', value: bannedUsers || 0 },
                  ]} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value">
                    <Cell fill="#667eea" />
                    <Cell fill="#f093fb" />
                    <Cell fill="#ff6b6b" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Skills by Category */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Skills by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {skillCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={skillCategoryData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No skills data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Users', value: users.length, color: 'bg-violet-100 text-violet-700' },
                { label: 'Admin Users', value: adminUsers, color: 'bg-blue-100 text-blue-700' },
                { label: 'Banned Users', value: bannedUsers, color: 'bg-red-100 text-red-700' },
                { label: 'Regular Users', value: regularUsers, color: 'bg-green-100 text-green-700' },
                { label: 'Total Skills', value: skills.length, color: 'bg-pink-100 text-pink-700' },
                { label: 'Skill Categories', value: Object.keys(skillCategories).length, color: 'bg-amber-100 text-amber-700' },
              ].map((item, i) => (
                <div key={i} className={`rounded-2xl p-4 ${item.color}`}>
                  <p className="text-2xl font-black">{item.value}</p>
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default AdminAnalytics;