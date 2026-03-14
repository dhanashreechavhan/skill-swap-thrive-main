import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { 
  Plus, 
  Upload, 
  Award, 
  Clock, 
  Users, 
  Star,
  Edit,
  Trash2,
  Eye,

  Calendar
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const OfferSkills = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState<string | undefined>(undefined);
  const [newSkillDescription, setNewSkillDescription] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<string | undefined>(undefined);
  const [newSkillExperience, setNewSkillExperience] = useState("");
  const [newSkillAvailability, setNewSkillAvailability] = useState("");
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [mySkills, setMySkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<any | null>(null);
  const [viewingSkill, setViewingSkill] = useState<any | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file upload
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setPortfolioFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setPortfolioFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleChooseFiles = () => {
    fileInputRef.current?.click();
  };
  
  // Load user's skills
  const loadMySkills = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getMySkills();
      if (result.data && (result.data as any).skills) {
        setMySkills((result.data as any).skills);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error loading skills:', err);
      setError('Failed to load your skills');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadMySkills();
  }, [isAuthenticated]);
  
  const handleCreateSkill = async () => {
    if (!isAuthenticated) {
      toast({ title: "Please login", description: "You must be logged in to add a skill.", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (!newSkillName.trim() || !newSkillCategory || !newSkillDescription.trim()) {
      toast({ title: "Missing fields", description: "Name, category, and description are required.", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const skillData: any = {
        name: newSkillName.trim(),
        category: newSkillCategory,
        description: newSkillDescription.trim(),
      };
      
      // Add optional fields if provided
      if (newSkillLevel) {
        skillData.level = newSkillLevel;
      }
      if (newSkillExperience && !isNaN(Number(newSkillExperience))) {
        skillData.yearsExperience = Number(newSkillExperience);
      }
      if (newSkillAvailability.trim()) {
        skillData.availabilityDescription = newSkillAvailability.trim();
      }
      
      const res = await apiService.createSkill(skillData);
      setSubmitting(false);
      if ((res as any).error) {
        toast({ title: "Failed to add skill", description: (res as any).error, variant: "destructive" });
        return;
      }
      toast({ title: "Skill added", description: "Your skill is now available for scheduling." });
      // Reset form and reload skills
      setNewSkillName("");
      setNewSkillCategory(undefined);
      setNewSkillDescription("");
      setNewSkillLevel(undefined);
      setNewSkillExperience("");
      setNewSkillAvailability("");
      setPortfolioFiles([]);
      setShowAddForm(false);
      await loadMySkills(); // Reload the skills list
    } catch (e) {
      setSubmitting(false);
      toast({ title: "Error", description: "Unexpected error adding skill.", variant: "destructive" });
    }
  };
  
  const handleDeleteSkill = async (skillId: string) => {
    console.log('Delete skill called with ID:', skillId);
    
    if (!skillId) {
      toast({ title: "Error", description: "Invalid skill ID", variant: "destructive" });
      return;
    }
    
    // Add confirmation dialog
    if (!window.confirm('Are you sure you want to delete this skill? This action cannot be undone.')) {
      return;
    }
    
    try {
      console.log('Attempting to delete skill:', skillId);
      const res = await apiService.deleteSkill(skillId);
      console.log('Delete response:', res);
      
      if ((res as any).error) {
        console.error('Delete skill error:', (res as any).error);
        toast({ title: "Failed to delete skill", description: (res as any).error, variant: "destructive" });
        return;
      }
      
      toast({ title: "Skill deleted", description: "Your skill has been removed." });
      await loadMySkills(); // Reload the skills list
    } catch (e) {
      console.error('Delete skill exception:', e);
      toast({ title: "Error", description: "Unexpected error deleting skill.", variant: "destructive" });
    }
  };

  const handleEditSkill = (skill: any) => {
    setEditingSkill(skill);
    setNewSkillName(skill.name);
    setNewSkillCategory(skill.category);
    setNewSkillDescription(skill.description || '');
    setNewSkillLevel(skill.level || undefined);
    setNewSkillExperience(skill.yearsExperience ? String(skill.yearsExperience) : "");
    setNewSkillAvailability(skill.availabilityDescription || "");
    setPortfolioFiles([]); // Reset portfolio files for editing
    setShowAddForm(true);
  };

  const handleViewSkill = (skill: any) => {
    setViewingSkill(skill);
  };

  const handleUpdateSkill = async () => {
    if (!editingSkill || !newSkillName.trim() || !newSkillCategory || !newSkillDescription.trim()) {
      toast({ title: "Missing fields", description: "Name, category, and description are required.", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const skillData: any = {
        name: newSkillName.trim(),
        category: newSkillCategory,
        description: newSkillDescription.trim(),
      };
      
      // Add optional fields if provided
      if (newSkillLevel) {
        skillData.level = newSkillLevel;
      }
      if (newSkillExperience && !isNaN(Number(newSkillExperience))) {
        skillData.yearsExperience = Number(newSkillExperience);
      }
      if (newSkillAvailability.trim()) {
        skillData.availabilityDescription = newSkillAvailability.trim();
      }
      
      const res = await apiService.updateSkill(editingSkill._id || editingSkill.id, skillData);
      setSubmitting(false);
      if ((res as any).error) {
        toast({ title: "Failed to update skill", description: (res as any).error, variant: "destructive" });
        return;
      }
      toast({ title: "Skill updated", description: "Your skill has been updated successfully." });
      // Reset form and reload skills
      setNewSkillName("");
      setNewSkillCategory(undefined);
      setNewSkillDescription("");
      setNewSkillLevel(undefined);
      setNewSkillExperience("");
      setNewSkillAvailability("");
      setPortfolioFiles([]);
      setEditingSkill(null);
      setShowAddForm(false);
      await loadMySkills();
    } catch (e) {
      setSubmitting(false);
      toast({ title: "Error", description: "Unexpected error updating skill.", variant: "destructive" });
    }
  };
  // Must align with backend enum in backend/models/Skill.js
  const skillCategories = [
    "Technology", "Language", "Art", "Music", "Sports", "Cooking", "Other"
  ];

  const proficiencyLevels = [
    "Beginner", "Intermediate", "Advanced", "Expert"
  ];

  const analytics = {
    totalStudents: mySkills.length > 0 ? mySkills.reduce((sum, skill) => sum + (skill.studentsHelped || 0), 0) : 0,
    totalSessions: mySkills.length > 0 ? mySkills.reduce((sum, skill) => sum + (skill.totalSessions || 0), 0) : 0,
    averageRating: mySkills.length > 0 ? (mySkills.reduce((sum, skill) => sum + (skill.rating || 0), 0) / mySkills.length).toFixed(1) : "0.0",
    totalEarnings: mySkills.length > 0 ? mySkills.reduce((sum, skill) => sum + (skill.earnings || 0), 0) : 0
  };

  return (
    <div className="min-h-screen" style={{background: "linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf4ff 100%)"}}>
      <Header isLoggedIn={true} />

      <main className="container py-8 max-w-7xl mx-auto px-4">

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
              <h1 className="text-3xl font-black mb-1">Offer Your Skills 🎓</h1>
              <p className="text-white/70">Share your expertise and help others learn while earning teaching credits</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-violet-700 font-bold rounded-2xl hover:bg-amber-50 transition-colors shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add New Skill
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, value: analytics.totalStudents, label: "Students Helped", color: "from-violet-500 to-purple-600", bg: "bg-violet-50 text-violet-600" },
            { icon: Calendar, value: analytics.totalSessions, label: "Sessions Completed", color: "from-indigo-500 to-blue-600", bg: "bg-indigo-50 text-indigo-600" },
            { icon: Star, value: analytics.averageRating, label: "Average Rating", color: "from-amber-500 to-orange-500", bg: "bg-amber-50 text-amber-600" },
            { icon: Award, value: analytics.totalEarnings, label: "Credits Earned", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50 text-emerald-600" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Add / Edit Skill Form */}
        {showAddForm && (
          <div className="bg-white rounded-3xl border border-violet-100 shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-slate-900">{editingSkill ? 'Edit Skill' : 'Add a New Skill to Teach'}</h2>
                <p className="text-xs text-slate-500">Fill in the details below</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Skill Name *</label>
                <input
                  placeholder="e.g., React, Python, Guitar"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Category *</label>
                <select
                  value={newSkillCategory || ""}
                  onChange={(e) => setNewSkillCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-violet-400"
                >
                  <option value="">Select category</option>
                  {skillCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Proficiency Level</label>
                <select
                  value={newSkillLevel || ""}
                  onChange={(e) => setNewSkillLevel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-violet-400"
                >
                  <option value="">Select level</option>
                  {proficiencyLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Years of Experience</label>
                <input
                  type="number"
                  placeholder="e.g., 3"
                  value={newSkillExperience}
                  onChange={(e) => setNewSkillExperience(e.target.value)}
                  min="0" max="50"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-violet-400"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description *</label>
              <textarea
                placeholder="Describe what you can teach, your teaching style, and what students will learn..."
                value={newSkillDescription}
                onChange={(e) => setNewSkillDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
              />
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Availability</label>
              <textarea
                placeholder="When are you available to teach? (e.g., Weekday evenings, Saturday mornings)"
                value={newSkillAvailability}
                onChange={(e) => setNewSkillAvailability(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-violet-400 resize-none"
              />
            </div>

            {!editingSkill && (
              <div className="mb-6">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Portfolio / Certifications</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-violet-300 transition-colors cursor-pointer"
                  onClick={handleChooseFiles}>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500 mb-1">Upload certificates, portfolio pieces, or work samples</p>
                  <span className="text-xs font-semibold text-violet-600">Choose Files</span>
                  <input ref={fileInputRef} type="file" multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileSelect} className="hidden" />
                </div>
                {portfolioFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {portfolioFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-sm">
                        <span className="truncate text-slate-700">{file.name}</span>
                        <button onClick={() => handleRemoveFile(i)} className="text-rose-400 hover:text-rose-600 ml-2 font-bold">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                disabled={submitting}
                onClick={editingSkill ? handleUpdateSkill : handleCreateSkill}
                className="px-6 py-2.5 text-white font-bold rounded-2xl disabled:opacity-50 transition-opacity hover:opacity-90 shadow-sm"
                style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}
              >
                {submitting ? (editingSkill ? "Updating..." : "Adding...") : (editingSkill ? "Update Skill" : "Add Skill")}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false); setEditingSkill(null);
                  setNewSkillName(""); setNewSkillCategory(undefined);
                  setNewSkillDescription(""); setNewSkillLevel(undefined);
                  setNewSkillExperience(""); setNewSkillAvailability("");
                  setPortfolioFiles([]);
                }}
                className="px-6 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Skills List */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">Your Teaching Skills</h2>
          <span className="text-sm text-slate-500">{mySkills.length} skill{mySkills.length !== 1 ? 's' : ''}</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-500">Loading your skills...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-rose-500 bg-rose-50 rounded-2xl">{error}</div>
        )}

        {!loading && !error && mySkills.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
            <div className="w-16 h-16 rounded-3xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">No skills added yet</h3>
            <p className="text-slate-400 text-sm mb-4">Click "Add New Skill" to get started!</p>
            <button onClick={() => setShowAddForm(true)}
              className="px-6 py-2.5 text-white font-bold rounded-2xl shadow-sm hover:opacity-90"
              style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
              Add Your First Skill
            </button>
          </div>
        )}

        <div className="space-y-4">
          {!loading && !error && mySkills.map((skill) => (
            <div key={skill.id || skill._id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="h-1" style={{background: "linear-gradient(90deg, #667eea, #764ba2, #f093fb)"}} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                      style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
                      {skill.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-black text-slate-900">{skill.name}</h3>
                        <span className="px-2.5 py-0.5 bg-violet-100 text-violet-700 rounded-lg text-xs font-bold">{skill.category}</span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${skill.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {skill.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">{skill.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <button onClick={() => handleEditSkill(skill)}
                      className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 flex items-center justify-center transition-colors">
                      <Edit className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={() => handleViewSkill(skill)}
                      className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 flex items-center justify-center transition-colors">
                      <Eye className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={() => handleDeleteSkill(skill._id || skill.id)}
                      className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition-colors">
                      <Trash2 className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Students", value: skill.studentsHelped || 0 },
                    { label: "Experience", value: `${skill.yearsExperience || 0} yrs` },
                    { label: "Requests", value: `${skill.requests || 0} pending` },
                    { label: "Rating", value: skill.rating || 'N/A', star: true },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-50 rounded-2xl p-3">
                      <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                      <div className="flex items-center gap-1">
                        {item.star && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                        <span className="font-black text-slate-800 text-sm">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  {skill.availabilityDescription || skill.availability || 'Availability not specified'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View Skill Modal */}
        {viewingSkill && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="h-1 rounded-full mb-5 -mx-1"
                style={{background: "linear-gradient(90deg, #667eea, #764ba2, #f093fb)"}} />
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg"
                    style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
                    {viewingSkill.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{viewingSkill.name}</h3>
                    <span className="text-xs text-slate-500">{viewingSkill.category}</span>
                  </div>
                </div>
                <button onClick={() => setViewingSkill(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                  ✕
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-slate-50 rounded-2xl p-3">
                  <p className="text-xs font-bold text-slate-400 mb-1">Description</p>
                  <p className="text-slate-700">{viewingSkill.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-2xl p-3">
                    <p className="text-xs font-bold text-slate-400 mb-1">Level</p>
                    <p className="text-slate-700 font-semibold">{viewingSkill.level || 'Not specified'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3">
                    <p className="text-xs font-bold text-slate-400 mb-1">Experience</p>
                    <p className="text-slate-700 font-semibold">{viewingSkill.yearsExperience || 0} years</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3">
                    <p className="text-xs font-bold text-slate-400 mb-1">Students</p>
                    <p className="text-slate-700 font-semibold">{viewingSkill.studentsHelped || 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3">
                    <p className="text-xs font-bold text-slate-400 mb-1">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-slate-700 font-semibold">{viewingSkill.rating || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3">
                  <p className="text-xs font-bold text-slate-400 mb-1">Availability</p>
                  <p className="text-slate-700">{viewingSkill.availabilityDescription || viewingSkill.availability || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => { setViewingSkill(null); handleEditSkill(viewingSkill); }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-2xl hover:bg-slate-50">
                  Edit
                </button>
                <button onClick={() => setViewingSkill(null)}
                  className="flex-1 py-2.5 text-white font-bold rounded-2xl hover:opacity-90"
                  style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default OfferSkills;