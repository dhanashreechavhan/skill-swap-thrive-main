import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  MapPin, 
  Star, 
  Clock, 
  Heart,
  MessageSquare,
  Calendar,
  RefreshCw,
  Filter,
  Search,
  TrendingUp,
  Users,
  Award
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast, handleAsyncOperation } from '@/lib/errorHandling';

interface Match {
  _id: string;
  teacher: {
    _id: string;
    name: string;
    profile?: {
      avatar?: string;
      location?: string;
      bio?: string;
    };
    rating?: {
      averageRating: number;
      totalRatings: number;
    };
  };
  skill: {
    _id: string;
    name: string;
    category: string;
    level: string;
    description: string;
  };
  matchScore: number;
  factors: {
    skillCompatibility?: number;
    locationDistance?: number;
    ratingScore?: number;
    experienceLevel?: number;
  };
  status: string;
  studentInterested: boolean;
  teacherInterested: boolean;
}

interface MatchesResponse {
  matches: Match[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const Matches = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingMatches, setGeneratingMatches] = useState(false);
  const [filter, setFilter] = useState({
    minScore: '30',
    skillName: '',
    category: 'all'
  });

  const loadMatches = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    const result = await handleAsyncOperation(async () => {
      const params: any = {};
      if (filter.minScore) params.minScore = filter.minScore;
      if (filter.skillName) params.skillName = filter.skillName;
      if (filter.category && filter.category !== 'all') params.category = filter.category;
      
      const apiResult = await apiService.getMatches(params);
      
      if (apiResult.error) {
        throw new Error(apiResult.error);
      }
      
      return apiResult.data as MatchesResponse;
    });
    
    if (result) {
      setMatches(result.matches || []);
    } else {
      setError('Failed to load your matches. Please try refreshing the page.');
    }
    
    setLoading(false);
  };

  const generateNewMatches = async () => {
    setGeneratingMatches(true);
    
    const result = await handleAsyncOperation(
      async () => {
        const apiResult = await apiService.generateMatches();
        if (apiResult.error) {
          throw new Error(apiResult.error);
        }
        return apiResult.data;
      },
      "New matches have been generated successfully!",
      "Match Generation Failed"
    );
    
    if (result) {
      await loadMatches();
    }
    
    setGeneratingMatches(false);
  };

  const expressInterest = async (matchId: string) => {
    const result = await handleAsyncOperation(
      async () => {
        const apiResult = await apiService.expressInterest(matchId);
        if (apiResult.error) {
          throw new Error(apiResult.error);
        }
        return apiResult.data;
      },
      "Your interest has been recorded! The teacher will be notified.",
      "Failed to Express Interest"
    );
    
    if (result) {
      await loadMatches();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getMatchQuality = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-500' };
    if (score >= 60) return { label: 'Good', color: 'bg-blue-500' };
    if (score >= 40) return { label: 'Fair', color: 'bg-yellow-500' };
    return { label: 'Poor', color: 'bg-red-500' };
  };

  useEffect(() => {
    if (user) {
      loadMatches();
    }
  }, [user, filter]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to view your matches.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={true} />
      
      <main className="container py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Skill Matches</h1>
              <p className="text-muted-foreground">
                Discover skilled teachers who match your learning interests
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={generateNewMatches} 
                disabled={generatingMatches}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${generatingMatches ? 'animate-spin' : ''}`} />
                Generate New Matches
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Skill Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search skills..."
                    value={filter.skillName}
                    onChange={(e) => setFilter(prev => ({ ...prev, skillName: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={filter.category} onValueChange={(value) => setFilter(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Language">Language</SelectItem>
                    <SelectItem value="Art">Art</SelectItem>
                    <SelectItem value="Music">Music</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Cooking">Cooking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Minimum Match Score</label>
                <Select value={filter.minScore} onValueChange={(value) => setFilter(prev => ({ ...prev, minScore: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select minimum score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30+ (Any)</SelectItem>
                    <SelectItem value="50">50+ (Good)</SelectItem>
                    <SelectItem value="70">70+ (Great)</SelectItem>
                    <SelectItem value="80">80+ (Excellent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading your matches...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-red-600">
                <span>❌</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Matches Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No matches found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or generate new matches
                </p>
                <Button onClick={generateNewMatches} disabled={generatingMatches}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Matches
                </Button>
              </div>
            ) : (
              matches.map((match) => {
                // Add safety checks for match data
                if (!match.teacher) {
                  console.warn('Match missing teacher data:', match);
                  return null; // Skip rendering this match
                }
                
                const quality = getMatchQuality(match.matchScore);
                
                return (
                  <Card key={match._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {match.teacher.name ? getInitials(match.teacher.name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{match.teacher.name || 'Unknown Teacher'}</h3>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {match.teacher.profile?.location || 'Location not specified'}
                            </div>
                          </div>
                        </div>
                        
                        <Badge className={quality.color}>
                          {match.matchScore}%
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Skill Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-4 w-4 text-primary" />
                          <span className="font-medium">{match.skill?.name || 'Unknown Skill'}</span>
                          <Badge variant="outline">{match.skill?.level || 'N/A'}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {match.skill?.description || 'No description available'}
                        </p>
                      </div>

                      {/* Rating */}
                      {match.teacher.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">
                            {match.teacher.rating.averageRating?.toFixed(1) || 'N/A'} ({match.teacher.rating.totalRatings || 0} reviews)
                          </span>
                        </div>
                      )}

                      {/* Match Factors */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Match Factors:</p>
                        {match.factors?.skillCompatibility && (
                          <div className="flex items-center justify-between text-sm">
                            <span>Skill Compatibility</span>
                            <span>{match.factors.skillCompatibility}%</span>
                          </div>
                        )}
                        {match.factors?.locationDistance && (
                          <div className="flex items-center justify-between text-sm">
                            <span>Location Match</span>
                            <span>{match.factors.locationDistance}%</span>
                          </div>
                        )}
                        {match.factors?.ratingScore && (
                          <div className="flex items-center justify-between text-sm">
                            <span>Teacher Rating</span>
                            <span>{Math.round(match.factors.ratingScore)}%</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {match.studentInterested ? (
                          <Button variant="outline" disabled className="flex-1">
                            <Heart className="h-4 w-4 mr-2 text-red-500" />
                            Interest Expressed
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => expressInterest(match._id)}
                            className="flex-1"
                          >
                            <Heart className="h-4 w-4 mr-2" />
                            Express Interest
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Matches;