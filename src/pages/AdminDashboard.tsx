import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { apiService } from '@/lib/api';
import { Search, Filter, Calendar, MessageSquare, User, Trash2, Activity, Clock, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [auditPage, setAuditPage] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [u, s, sch, m, statsRes, auditRes] = await Promise.all([
      apiService.adminListUsers(),
      apiService.adminListSkills(),
      apiService.adminListSchedules(),
      apiService.adminListMessages(),
      apiService.adminGetStats(),
      apiService.adminGetAuditLogs(auditPage, 50, auditActionFilter),
    ]);
    if (u.error) setError(u.error); else setUsers((u.data as any[]) || []);
    if (s.error) setError(s.error); else setSkills((s.data as any[]) || []);
    if (sch.error) setError(sch.error); else setSchedules((sch.data as any[]) || []);
    if (m.error) setError(m.error); else setMessages((m.data as any[]) || []);
    if (statsRes.error) setError(statsRes.error); else setStats(statsRes.data);
    if (auditRes.error) setError(auditRes.error); else setAuditLogs((auditRes.data?.logs as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [auditPage, auditActionFilter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={true} hideDashboard={true} />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, skills, and monitor activity</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{stats.userCount}</p>
                  </div>
                  <User className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Skills Offered</p>
                    <p className="text-2xl font-bold">{stats.skillCount}</p>
                  </div>
                  <Filter className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sessions</p>
                    <p className="text-2xl font-bold">{stats.scheduleCount}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Messages</p>
                    <p className="text-2xl font-bold">{stats.messageCount}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <Tabs defaultValue="users" className="space-y-8">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>


          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Users ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {loading && <div>Loading...</div>}
                {error && <div className="text-red-600">{error}</div>}
                {!loading && !error && (
                  <div className="space-y-3">
                    {users
                      .filter(u => 
                        searchTerm === '' || 
                        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((u) => (
                      <div key={u._id} className="flex items-center justify-between border rounded p-3">
                        <div>
                          <div className="font-medium">
                            {u.name} 
                            {u.isAdmin && <Badge variant="secondary" className="ml-2">Admin</Badge>}
                            {u.profile?.isBanned && <Badge variant="destructive" className="ml-2">Banned</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">{u.email}</div>
                          <div className="text-xs text-muted-foreground">Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={async () => {
                            const res = await apiService.adminSetUserAdmin(u._id, !u.isAdmin);
                            if (!(res as any).error) {
                              loadData();
                            } else {
                              setError((res as any).error);
                            }
                          }}>{u.isAdmin ? 'Revoke Admin' : 'Make Admin'}</Button>
                          <Button 
                            variant={u.profile?.isBanned ? "outline" : "destructive"} 
                            size="sm" 
                            onClick={async () => {
                              try {
                                console.log('Ban/Unban clicked for user:', u._id, 'Current ban status:', u.profile?.isBanned);
                                const res = u.profile?.isBanned 
                                  ? await apiService.adminUnbanUser(u._id)
                                  : await apiService.adminBanUser(u._id);
                                console.log('API response:', res);
                                if (!(res as any).error) {
                                  loadData();
                                } else {
                                  console.error('API error:', (res as any).error);
                                  setError((res as any).error);
                                }
                              } catch (err) {
                                console.error('Exception:', err);
                                setError(u.profile?.isBanned ? 'Failed to unban user' : 'Failed to ban user');
                              }
                            }}
                          >
                            {u.profile?.isBanned ? 'Unban' : 'Ban'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Skills ({skills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search skills..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {loading && <div>Loading...</div>}
                {error && <div className="text-red-600">{error}</div>}
                {!loading && !error && (
                  <div className="space-y-3">
                    {skills
                      .filter(s => 
                        searchTerm === '' || 
                        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (s.offeredBy?.name && s.offeredBy.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map((s) => (
                      <div key={s._id} className="flex items-center justify-between border rounded p-3">
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-sm text-muted-foreground">{s.category} • {s.offeredBy?.name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">Created: {new Date(s.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="destructive" size="sm" onClick={async () => {
                            const res = await apiService.adminDeleteSkill(s._id);
                            if (!(res as any).error) loadData();
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedules">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedules ({schedules.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading && <div>Loading...</div>}
                {error && <div className="text-red-600">{error}</div>}
                {!loading && !error && (
                  <div className="space-y-3">
                    {schedules.map((s) => (
                      <div key={s._id} className="flex items-center justify-between border rounded p-3">
                        <div>
                          <div className="font-medium">{s.skill?.name || 'Unknown Skill'}</div>
                          <div className="text-sm text-muted-foreground">
                            {s.student?.name} → {s.teacher?.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(s.date).toLocaleDateString()} • {s.startTime} - {s.endTime}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={s.status === 'Confirmed' ? 'default' : 'secondary'}>
                            {s.status}
                          </Badge>
                          <Button variant="destructive" size="sm" onClick={async () => {
                            const res = await apiService.adminDeleteSchedule(s._id);
                            if (!(res as any).error) loadData();
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages ({messages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading && <div>Loading...</div>}
                {error && <div className="text-red-600">{error}</div>}
                {!loading && !error && (
                  <div className="space-y-3">
                    {messages.map((m) => (
                      <div key={m._id} className="flex items-center justify-between border rounded p-3">
                        <div className="flex-1">
                          <div className="font-medium">{m.sender?.name} → {m.receiver?.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">{m.content}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="destructive" size="sm" onClick={async () => {
                            const res = await apiService.adminDeleteMessage(m._id);
                            if (!(res as any).error) loadData();
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Audit Logs ({auditLogs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search audit logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="USER_BANNED">User Banned</SelectItem>
                      <SelectItem value="USER_UNBANNED">User Unbanned</SelectItem>
                      <SelectItem value="USER_ADMIN_GRANTED">Admin Granted</SelectItem>
                      <SelectItem value="SKILL_DELETED">Skill Deleted</SelectItem>
                      <SelectItem value="SCHEDULE_DELETED">Schedule Deleted</SelectItem>
                      <SelectItem value="MESSAGE_DELETED">Message Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {loading && <div>Loading...</div>}
                {error && <div className="text-red-600">{error}</div>}
                {!loading && !error && (
                  <div className="space-y-3">
                    {auditLogs
                      .filter(log => 
                        (searchTerm === '' || 
                        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.admin?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.details?.toLowerCase().includes(searchTerm.toLowerCase())) &&
                        (auditActionFilter === 'all' || auditActionFilter === '' || log.action === auditActionFilter)
                      )
                      .map((log) => (
                      <div key={log._id} className="flex items-center justify-between border rounded p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {log.action.includes('DELETE') ? (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            ) : log.action.includes('ADMIN') ? (
                              <Shield className="h-4 w-4 text-blue-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{log.action.replace(/_/g, ' ')}</div>
                            <div className="text-sm text-muted-foreground">
                              {log.targetType} • by {log.admin?.name || 'System'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </div>
                            {log.details && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {log.details}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {log.targetType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Overview</CardTitle>
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
              <Card>
                <CardHeader>
                  <CardTitle>Content Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Users', value: stats?.userCount || 0 },
                          { name: 'Skills', value: stats?.skillCount || 0 },
                          { name: 'Sessions', value: stats?.scheduleCount || 0 },
                          { name: 'Messages', value: stats?.messageCount || 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#667eea" />
                        <Cell fill="#f093fb" />
                        <Cell fill="#764ba2" />
                        <Cell fill="#43e97b" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Quick Stats Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Users', value: stats?.userCount || 0, color: 'bg-violet-100 text-violet-700' },
                      { label: 'Total Skills', value: stats?.skillCount || 0, color: 'bg-pink-100 text-pink-700' },
                      { label: 'Total Sessions', value: stats?.scheduleCount || 0, color: 'bg-purple-100 text-purple-700' },
                      { label: 'Total Messages', value: stats?.messageCount || 0, color: 'bg-green-100 text-green-700' },
                    ].map((item, i) => (
                      <div key={i} className={`rounded-2xl p-4 ${item.color}`}>
                        <p className="text-2xl font-black">{item.value}</p>
                        <p className="text-sm font-medium">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;


