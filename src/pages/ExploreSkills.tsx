import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, Star, Calendar, MapPin, Grid, List, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiService, buildAssetUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const ExploreSkills = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [skillProviders, setSkillProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    level: 'all',
    availability: 'all',
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
        availability: filters.availability !== 'all' ? filters.availability : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: pagination.currentPage,
        limit: pagination.itemsPerPage
      };

      const result = await apiService.getSkills(params);
      
      if (result.data) {
        const responseData = result.data as any;
        setSkillProviders(responseData.skills || []);
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
    }, 300); // Reduced debounce time for better UX

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
      // Create a schedule request
      const result = await apiService.createSchedule({
        teacherId: skill.offeredBy._id,
        skillId: skill._id,
        type: 'learning',
        status: 'pending',
        notes: `Learning session request for ${skill.name}`
      });
      
      if (result.data) {
        toast({
          title: "Session Requested",
          description: `Your request for ${skill.name} has been sent!`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to request session",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while requesting the session",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = (skill: any) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to send messages",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    navigate('/messages', { 
      state: { 
        recipientId: skill.offeredBy._id,
        recipientName: skill.offeredBy.name,
        skillContext: skill.name
      } 
    });
  };

  const handleViewProfile = (skill: any) => {
    navigate(`/profile/${skill.offeredBy._id}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle rating and price range filters
  const [priceRange, setPriceRange] = useState([25, 100]);
  const [minRating, setMinRating] = useState('all');

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={!!user} />
      
      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Explore Skills</h1>
          <p className="text-muted-foreground">Discover expert mentors and teachers for any skill you want to learn</p>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search skills, technologies, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category === "All Categories" ? "all" : category.toLowerCase()}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Experience Level */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Experience Level</label>
                  <Select value={filters.level} onValueChange={(value) => handleFilterChange('level', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any level</SelectItem>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                  <Select value={minRating} onValueChange={setMinRating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any rating</SelectItem>
                      <SelectItem value="4.8">4.8+ ⭐</SelectItem>
                      <SelectItem value="4.5">4.5+ ⭐</SelectItem>
                      <SelectItem value="4.0">4.0+ ⭐</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Hourly Rate ($)</label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={200}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}+</span>
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Availability</label>
                  <Select value={filters.availability} onValueChange={(value) => handleFilterChange('availability', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any time</SelectItem>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading..." : `Showing ${pagination.totalItems} results`}
              </p>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Newest first</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="level">Level</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading skills...</span>
              </div>
            ) : skillProviders.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No skills found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {skillProviders.map((skill) => (
                  <Card key={skill._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                          {skill.offeredBy?.name ? skill.offeredBy.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-foreground">{skill.name}</h3>
                              <p className="text-sm text-muted-foreground">by {skill.offeredBy?.name || 'Unknown'}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs">
                                {skill.level}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">{skill.category}</p>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {skill.description}
                          </p>
                          
                          {/* Tags */}
                          {skill.tags && skill.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {skill.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {skill.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{skill.tags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* Meta Info */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
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
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {skill.offeredBy.ratings.average.toFixed(1)} ({skill.offeredBy.ratings.count})
                              </div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleRequestSession(skill)}
                            >
                              Request Session
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSendMessage(skill)}
                            >
                              Message
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewProfile(skill)}
                            >
                              View Profile
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExploreSkills;