import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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
    meetingLink: ""
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
    status: "Pending"
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
    };
    
    const res = await apiService.createSchedule(payload);
    if (res.error) { 
      setError(res.error); 
      return; 
    }
    
    setShowNewSessionForm(false);
    setForm({ skillId: "", date: "", startTime: "", endTime: "", notes: "", meetingLink: "" });
    await loadData();
  };

  const handleDelete = async (id: string) => {
    const res = await apiService.deleteSchedule(id);
    if (res.error) { setError(res.error); return; }
    await loadData();
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
      status: session.raw?.status || 'Pending'
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

  const sessionFormats = [
    { value: "video", label: "Video Call", icon: Video },
    { value: "inperson", label: "In Person", icon: MapPin },
    { value: "chat", label: "Chat Only", icon: Users }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={true} />
      
      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Schedule Sessions</h1>
          <p className="text-muted-foreground">Manage your learning and teaching sessions</p>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-8">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="availability">My Availability</TabsTrigger>
          </TabsList>

          {/* Upcoming Sessions */}
          <TabsContent value="upcoming" className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Your Upcoming Sessions</h2>
              <Button onClick={() => setShowNewSessionForm(!showNewSessionForm)}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule New Session
              </Button>
            </div>

            {/* New Session Form */}
            {showNewSessionForm && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>{editingId ? 'Edit Session' : 'Schedule a New Session'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Session Title</label>
                      {editingId ? (
                        <Input placeholder="e.g., React Hooks Deep Dive" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                      ) : (
                        <Input placeholder="e.g., React Hooks Deep Dive" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Choose Skill & Teacher *</label>
                      <Select value={editingId ? editForm.skillId : form.skillId} onValueChange={(v) => editingId ? setEditForm({ ...editForm, skillId: v }) : setForm({ ...form, skillId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a skill and teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {skills
                            .filter((sk: any) => sk.offeredBy && sk.offeredBy.name) // Only show skills with valid teachers
                            .length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                              No available skills with teachers found.
                              <br />Please check back later or browse skills to find teachers.
                            </div>
                          ) : (
                            skills
                              .filter((sk: any) => sk.offeredBy && sk.offeredBy.name)
                              .map((sk: any) => (
                              <SelectItem key={sk._id} value={sk._id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{sk.name || sk.title || 'Skill'}</span>
                                  <span className="text-sm text-muted-foreground">
                                    by {sk.offeredBy?.name || 'Unknown Teacher'}
                                    {sk.offeredBy?.profile?.location && ` • ${sk.offeredBy.profile.location}`}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Selected Skill Info */}
                  {(editingId ? editForm.skillId : form.skillId) && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      {(() => {
                        const selectedSkill = skills.find((sk: any) => sk._id === (editingId ? editForm.skillId : form.skillId));
                        if (!selectedSkill) return null;
                        return (
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                              {selectedSkill.offeredBy?.name ? selectedSkill.offeredBy.name.charAt(0).toUpperCase() : 'T'}
                            </div>
                            <div>
                              <p className="font-medium text-blue-900">
                                You'll be learning {selectedSkill.name} with {selectedSkill.offeredBy?.name || 'Unknown Teacher'}
                              </p>
                              <p className="text-sm text-blue-600">
                                {selectedSkill.offeredBy?.profile?.location || 'Location not specified'} • {selectedSkill.category} • {selectedSkill.level} level
                              </p>
                            </div>
                          </div>
                        );
                      })()} 
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date *</label>
                      <Input type="date" value={editingId ? editForm.date : form.date} onChange={(e) => editingId ? setEditForm({ ...editForm, date: e.target.value }) : setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Start Time *</label>
                      <Select value={editingId ? editForm.startTime : form.startTime} onValueChange={(v) => editingId ? setEditForm({ ...editForm, startTime: v }) : setForm({ ...form, startTime: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">End Time *</label>
                      <Select value={editingId ? editForm.endTime : form.endTime} onValueChange={(v) => editingId ? setEditForm({ ...editForm, endTime: v }) : setForm({ ...form, endTime: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Session Format</label>
                    <div className="grid grid-cols-3 gap-4">
                      {sessionFormats.map((format) => (
                        <Card key={format.value} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4 text-center">
                            <format.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                            <p className="text-sm font-medium">{format.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Session Description</label>
                    <Textarea 
                      placeholder="What will you cover in this session? Include any preparation materials or goals..."
                      className="min-h-24"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Meeting Link</label>
                      <Input placeholder="https://..." value={editingId ? editForm.meetingLink : form.meetingLink} onChange={(e) => editingId ? setEditForm({ ...editForm, meetingLink: e.target.value }) : setForm({ ...form, meetingLink: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Notes</label>
                      <Textarea placeholder="Add details for your session" value={editingId ? editForm.notes : form.notes} onChange={(e) => editingId ? setEditForm({ ...editForm, notes: e.target.value }) : setForm({ ...form, notes: e.target.value })} />
                    </div>
                  </div>

                  {editingId && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Confirmed">Confirmed</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex gap-4">
                    {editingId ? (
                      <Button onClick={handleSaveEdit} disabled={loading}>Save Changes</Button>
                    ) : (
                      <Button onClick={handleCreate} disabled={loading}>Schedule Session</Button>
                    )}
                    <Button variant="outline" onClick={() => setShowNewSessionForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sessions List */}
            <div className="space-y-6">
              {error && (<div className="text-sm text-red-600">{error}</div>)}
              {loading && (<div className="text-sm">Loading sessions...</div>)}
              {sessions.map((session) => (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{session.title}</h3>
                          <Badge variant={session.type === 'learning' ? 'default' : 'secondary'}>
                            {session.type === 'learning' ? 'Learning' : 'Teaching'}
                          </Badge>
                          <Badge 
                            className={
                              session.status === 'confirmed' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }
                          >
                            {session.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-6 mb-3 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                              {session.partnerAvatar}
                            </div>
                            <span>with {session.partner}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{session.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{session.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Video className="h-4 w-4 text-muted-foreground" />
                            <span>{session.format}</span>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4">{session.description}</p>

                        <Badge variant="outline">{session.skill}</Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => { const url = session.raw?.meetingLink || '#'; window.open(url, '_blank', 'noopener'); }}>
                          <Video className="mr-2 h-4 w-4" />
                          Join Session
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => startEdit(session)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(session.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-8">
            <div className="grid lg:grid-cols-4 gap-8">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>
                    {selectedDate 
                      ? selectedDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'Select a date'
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        {sessions
                          .filter(session => {
                            const sessionDate = new Date(session.dateISO);
                            return sessionDate.toDateString() === selectedDate.toDateString();
                          })
                          .map((session) => (
                            <div key={session.id} className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{session.title}</h4>
                                <Badge variant={session.type === 'learning' ? 'default' : 'secondary'}>
                                  {session.type === 'learning' ? 'Learning' : 'Teaching'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {session.time} with {session.partner}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">{session.skill}</p>
                            </div>
                          ))}
                        {sessions.filter(session => {
                          const sessionDate = new Date(session.dateISO);
                          return sessionDate.toDateString() === selectedDate.toDateString();
                        }).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <CalendarIcon className="h-8 w-8 mx-auto mb-2" />
                            <p>No sessions scheduled for this day</p>
                          </div>
                        )}
                      </div>
                      <Button className="w-full" onClick={() => {
                        setForm(prev => ({ ...prev, date: selectedDate.toISOString().split('T')[0] }));
                        setShowNewSessionForm(true);
                      }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Session for This Day
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Select a date to view sessions</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Availability */}
          <TabsContent value="availability" className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-6">Set Your Availability</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex items-center gap-6">
                        <div className="w-24">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" defaultChecked={day !== 'Sunday'} />
                            <span className="font-medium">{day}</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4 flex-1">
                          <Select defaultValue="09:00">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time.toLowerCase().replace(/[: ]/g, '')}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select defaultValue="17:00">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time.toLowerCase().replace(/[: ]/g, '')}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t">
                    <Button>Save Availability</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Time Zone Settings */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Timezone & Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Timezone</label>
                    <Select defaultValue="pst">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
                        <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                        <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
                        <SelectItem value="utc">Coordinated Universal Time (UTC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">Allow weekend sessions</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">Send reminder notifications</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Auto-accept sessions from verified users</span>
                    </label>
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

export default Schedule;