import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  User, 
  MessageSquare, 
  Star, 
  MapPin, 
  Clock,
  CheckCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface InterestedStudent {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    profile?: {
      avatar?: string;
      location?: string;
      bio?: string;
    };
    avgRating?: number;
    totalReviews?: number;

  };
  skill: {
    _id: string;
    name: string;
    category: string;
    level: string;
  };
  matchScore: number;
  factors?: {
    skillCompatibility?: number;
    locationDistance?: number;
    ratingScore?: number;
    experienceLevel?: number;
  };
  studentInterested: boolean;
  teacherInterested: boolean;
  lastContactDate?: string;
}

export const InterestedStudents = () => {
  const [interestedStudents, setInterestedStudents] = useState<InterestedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [studentRatings, setStudentRatings] = useState<Record<string, {avg: number, total: number}>>({});

const fetchRatings = async (students: InterestedStudent[]) => {
  const token = localStorage.getItem("token");
  const ratings: Record<string, {avg: number, total: number}> = {};
  await Promise.all(
    students.map(async (match) => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/reviews/user/${match.student._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        ratings[match.student._id] = {
          avg: data.stats?.averageRating || 0,
          total: data.stats?.totalReviews || 0
        };
      } catch { /* silent */ }
    })
  );
  setStudentRatings(ratings);
};
  const navigate = useNavigate();

  const loadInterestedStudents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.getInterestedStudents();
      console.log('Interested students result:', result);
      
      if (result.data) {
        const data = result.data as any;
        if (data && data.interestedStudents && Array.isArray(data.interestedStudents)) {
          setInterestedStudents(data.interestedStudents);
          fetchRatings(data.interestedStudents);
        } else {
          console.log('No interested students array found in response:', data);
          setInterestedStudents([]);
        }
      } else if (result.error) {
        console.error('Error loading interested students:', result.error);
        setError(result.error);
        setInterestedStudents([]);
      } else {
        console.log('Unexpected response format:', result);
        setInterestedStudents([]);
      }
    } catch (err) {
      console.error('Exception loading interested students:', err);
      setError('Failed to load interested students');
      setInterestedStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const acceptStudent = async (matchId: string, studentName: string) => {
    setProcessingId(matchId);
    
    try {
      await apiService.acceptStudent(matchId);
      
      toast({
        title: "Student Accepted!",
        description: `You've accepted ${studentName}. You can now schedule sessions together.`,
      });
      
      // Refresh the list
      await loadInterestedStudents();
      
    } catch (err) {
      console.error('Error accepting student:', err);
      toast({
        title: "Error",
        description: "Failed to accept student",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const sendMessage = (studentId: string, studentName: string) => {
    navigate('/messages', { 
      state: { 
        recipientId: studentId,
        recipientName: studentName 
      } 
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getMatchQuality = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-700' };
    if (score >= 60) return { label: 'Good', color: 'bg-blue-100 text-blue-700' };
    if (score >= 40) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Basic', color: 'bg-gray-100 text-gray-700' };
  };

  useEffect(() => {
    loadInterestedStudents();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Interested Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading interested students...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Interested Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadInterestedStudents} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (interestedStudents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Interested Students
          </CardTitle>
          <CardDescription>Students who want to learn from you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No interested students yet</p>
            <p className="text-sm text-muted-foreground">
              Students will appear here when they express interest in your skills
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Interested Students ({interestedStudents.length})
            </CardTitle>
            <CardDescription>Students who want to learn from you</CardDescription>
          </div>
          <Button onClick={loadInterestedStudents} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {interestedStudents.filter(match => match && match.student && match.skill).map((match) => {
            const quality = getMatchQuality(match.matchScore);
            const isProcessing = processingId === match._id;
            
            return (
              <div 
                key={match._id} 
                className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
              > 
                {/* Student Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback> 
                       {match.student ? getInitials(match.student.name) : '?'}
                      </AvatarFallback>  
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{match.student?.name || 'Unknown'}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {match.student.profile?.location || 'Location not specified'}
                      </div>
                      <div className="flex items-center gap-1 text-sm mt-1">
  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
  {studentRatings[match.student._id]?.avg
    ? <> 
        <span className="font-medium text-slate-700">
          {studentRatings[match.student._id].avg.toFixed(1)}
        </span>
        <span className="text-muted-foreground">
          ({studentRatings[match.student._id].total} {studentRatings[match.student._id].total === 1 ? 'review' : 'reviews'})
        </span>
      </>
    : <span className="text-muted-foreground text-xs">No reviews yet</span>
  }
</div>

                      {match.lastContactDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          Interested {new Date(match.lastContactDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Badge className={quality.color}>
                    {match.matchScore}% match
                  </Badge>
                </div>

                {/* Skill Info */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="font-medium">Wants to learn: {match.skill.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {match.skill.level}
                    </Badge>
                  </div>
                  
                  {/* Match Factors */}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {match.factors?.skillCompatibility && (
                      <span>Skill Match: {match.factors.skillCompatibility}%</span>
                    )}
                    {match.factors?.locationDistance && (
                      <span>• Location: {match.factors.locationDistance}%</span>
                    )}
                    {match.factors?.experienceLevel && (
                      <span>• Experience: {match.factors.experienceLevel}%</span>
                    )}
                  </div>
                </div>

                {/* Student Bio */}
                {match.student.profile?.bio && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      "{match.student.profile.bio.length > 100 
                        ? `${match.student.profile.bio.substring(0, 100)}...` 
                        : match.student.profile.bio}"
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {match.teacherInterested ? (
                    <Button variant="outline" disabled className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Already Accepted
                    </Button>
                  ) : (
                    <Button 
                     onClick={() => acceptStudent(match._id, match.student?.name || 'Student')}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Accept Student
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                   onClick={() => sendMessage(match.student?._id, match.student?.name || 'Student')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>

                  <Button 
  variant="outline"
  onClick={() => navigate(`/reviews/${match.student?._id}`)}
>
  <Star className="h-4 w-4 mr-2" />
  Review
</Button>





                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};