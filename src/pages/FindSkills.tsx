import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Star, Calendar, MapPin, Grid, List, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const FindSkills = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [skillProviders, setSkillProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    level: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Initialize search term from URL parameters
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  const categories = [
    "All Categories",
    "Technology",
    "Language", 
    "Art",
    "Music",
    "Sports",
    "Cooking",
    "Other"
  ];

  // Fetch skills data
  const fetchSkills = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm || undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        level: filters.level !== 'all' ? filters.level : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      };

      const result = await apiService.getSkills(params);
      
      if (result.data) {
        const responseData = result.data as any;
        const skills = responseData.skills || [];
        
        setSkillProviders(skills);
        setPagination(responseData.pagination || pagination);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch skills",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching skills",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchSkills();
  }, [filters, pagination.currentPage]);

  // Debounced search - separate from other filters
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.currentPage === 1) {
        fetchSkills();
      } else {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle action functions
  const handleRequestSession = async (skill: any) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to request a session",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    try {
      // Create a direct session request without requiring skill matching
      // This allows any user to request sessions from any teacher regardless of skill compatibility
      const result = await apiService.requestDirectSession({
        teacherId: skill.offeredBy._id,
        skillId: skill._id,
        skillName: skill.name,
        message: `Hi! I would like to request a learning session for ${skill.name}. Looking forward to learning from you!`
      });
      
      if (result.data) {
        toast({
          title: "Session Request Sent",
          description: `Your session request for ${skill.name} has been sent to ${skill.offeredBy?.name || 'the teacher'}!`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send session request",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Request session error:', error);
      toast({
        title: "Error",
        description: "An error occurred while sending your session request",
        variant: "destructive"
      });
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

 return (
    <div className="min-h-screen" style={{background: "linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf4ff 100%)"}}>
      <Header isLoggedIn={!!user} />

      <main className="container py-8 max-w-7xl mx-auto px-4">

        {/* Hero Header */}
        <div className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden"
          style={{background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"}}>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }} />
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2">Learn New Skills 🚀</h1>
            <p className="text-white/70 mb-6">Discover expert mentors and teachers for any skill you want to learn</p>

            {/* Search bar */}
            <div className="flex gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  placeholder="Search skills, technologies, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder:text-white/60 outline-none focus:bg-white/30 text-sm"
                />
              </div>
              {/* Category */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white outline-none text-sm cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat === "All Categories" ? "all" : cat}
                    className="text-slate-800 bg-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Filters Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Filter className="w-4 h-4 text-violet-600" />
                </div>
                <h3 className="font-black text-slate-900">Filters</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Experience Level</label>
                  <select
                    value={filters.level}
                    onChange={(e) => handleFilterChange('level', e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-violet-400"
                  >
                    <option value="all">Any level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>
            </div>

            {/* View toggle */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">View Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === 'grid' ? 'text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  style={viewMode === 'grid' ? {background: "linear-gradient(135deg, #667eea, #764ba2)"} : {}}
                >
                  <Grid className="w-4 h-4" /> Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${viewMode === 'list' ? 'text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  style={viewMode === 'list' ? {background: "linear-gradient(135deg, #667eea, #764ba2)"} : {}}
                >
                  <List className="w-4 h-4" /> List
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">

            {/* Results header */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-semibold text-slate-600">
                {loading ? "Loading..." : `Showing ${pagination.totalItems} results`}
              </p>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-violet-400 shadow-sm"
              >
                <option value="createdAt">Newest first</option>
                <option value="name">Name A-Z</option>
                <option value="level">Level</option>
                <option value="category">Category</option>
              </select>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
                <p className="text-slate-500 text-sm">Loading skills...</p>
              </div>
            ) : skillProviders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">No skills found</h3>
                <p className="text-slate-400 text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {skillProviders.map((skill) => (
                  <div key={skill._id}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden group">

                    {/* Top gradient bar */}
                    <div className="h-1 w-full"
                      style={{background: "linear-gradient(90deg, #667eea, #764ba2, #f093fb)"}} />

                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                          style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}>
                          {skill.offeredBy?.name ? skill.offeredBy.name.charAt(0).toUpperCase() : 'U'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <h3 className="font-black text-slate-900">{skill.name}</h3>
                              <p className="text-xs text-slate-500">by {skill.offeredBy?.name || 'Unknown'}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-violet-100 text-violet-700">
                                {skill.level}
                              </span>
                              <p className="text-xs text-slate-400 mt-1">{skill.category}</p>
                            </div>
                          </div>

                          {skill.description && (
                            <p className="text-sm text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                              {skill.description}
                            </p>
                          )}

                          {/* Tags */}
                          {skill.tags && skill.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {skill.tags.slice(0, 3).map((tag: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                                  {tag}
                                </span>
                              ))}
                              {skill.tags.length > 3 && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-lg text-xs">
                                  +{skill.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Meta */}
                          <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {skill.availability || 'Available'}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {skill.offeredBy?.profile?.location || 'Location not specified'}
                            </div>
                            {skill.offeredBy?.ratings?.average && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span className="font-semibold text-slate-600">
                                  {skill.offeredBy.ratings.average.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Button */}
                          <button
                            onClick={() => handleRequestSession(skill)}
                            className="w-full py-2.5 rounded-2xl text-white text-sm font-bold transition-opacity hover:opacity-90 shadow-sm"
                            style={{background: "linear-gradient(135deg, #667eea, #764ba2)"}}
                          >
                            Request Session
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPagination(prev => ({...prev, currentPage: prev.currentPage - 1}))}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-slate-50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500 font-medium">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({...prev, currentPage: prev.currentPage + 1}))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FindSkills;