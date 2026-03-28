import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, buildAssetUrl } from "@/lib/api";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { X, Upload, Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import VerificationStatus from "@/components/VerificationStatus";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    skillsTeaching: [] as (string | any)[],
    skillsLearning: [] as (string | any)[],
    avatar: null as File | null,
  });
  const [newSkillTeaching, setNewSkillTeaching] = useState("");
  const [newSkillLearning, setNewSkillLearning] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Calculate profile completion
  const calculateCompletion = () => {
    const bio = profile.bio.trim().length > 0;
    const teach = profile.skillsTeaching.length > 0;
    const learn = profile.skillsLearning.length > 0;
    const avatar = avatarPreview !== null;
    let completion = 0;
    if (bio) completion += 25;
    if (teach) completion += 25;
    if (learn) completion += 25;
    if (avatar) completion += 25;
    return completion;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const result = await apiService.getProfile();
        if (result.data) {
          const data = result.data as any;
          
          // Helper function to extract skill names from skill objects or arrays
          const extractSkillNames = (skills: any[]): string[] => {
            if (!Array.isArray(skills)) return [];
            return skills.map(skillItem => {
              if (typeof skillItem === 'string') {
                return skillItem;
              } else if (typeof skillItem === 'object' && skillItem?.skill) {
                // Extract skill name from object (handles both teaching and learning skill formats)
                return typeof skillItem.skill === 'string' ? skillItem.skill : skillItem.skill?.name || skillItem.skill?.title || 'Unknown Skill';
              }
              return 'Unknown Skill';
            });
          };
          
          setProfile({
            name: data.name || "",
            email: data.email || "",
            bio: data.profile?.bio || "",
            skillsTeaching: extractSkillNames(data.skillsTeaching),
            skillsLearning: extractSkillNames(data.skillsLearning),
            avatar: null,
          });
          if (data.profile?.avatar) {
            setAvatarPreview(buildAssetUrl(data.profile.avatar));
          }
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfile({ ...profile, avatar: file });
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSkillTeaching = () => {
    const newSkill = newSkillTeaching.trim();
    if (newSkill) {
      // Check if skill already exists
      const existingSkillNames = profile.skillsTeaching.map(s => 
        typeof s === 'string' ? s : ((s as any)?.skill || (s as any)?.name || 'Unknown Skill')
      );
      
      if (!existingSkillNames.includes(newSkill)) {
        setProfile({
          ...profile,
          skillsTeaching: [...profile.skillsTeaching, newSkill],
        });
        setNewSkillTeaching("");
      }
    }
  };

  const removeSkillTeaching = (skillToRemove: string) => {
    setProfile({
      ...profile,
      skillsTeaching: profile.skillsTeaching.filter((s) => {
        const skillName = typeof s === 'string' ? s : ((s as any)?.skill || (s as any)?.name || 'Unknown Skill');
        return skillName !== skillToRemove;
      }),
    });
  };

  const addSkillLearning = () => {
    const newSkill = newSkillLearning.trim();
    if (newSkill) {
      // Check if skill already exists
      const existingSkillNames = profile.skillsLearning.map(s => 
        typeof s === 'string' ? s : ((s as any)?.skill || (s as any)?.name || 'Unknown Skill')
      );
      
      if (!existingSkillNames.includes(newSkill)) {
        setProfile({
          ...profile,
          skillsLearning: [...profile.skillsLearning, newSkill],
        });
        setNewSkillLearning("");
      }
    }
  };

  const removeSkillLearning = (skillToRemove: string) => {
    setProfile({
      ...profile,
      skillsLearning: profile.skillsLearning.filter((s) => {
        const skillName = typeof s === 'string' ? s : ((s as any)?.skill || (s as any)?.name || 'Unknown Skill');
        return skillName !== skillToRemove;
      }),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

      try {
        const formData = new FormData();
        formData.append("name", profile.name);
        formData.append("email", profile.email);
        formData.append("bio", profile.bio);
        
        // Ensure we're sending skill names as strings
        const teachingSkillNames = profile.skillsTeaching.map(s => 
          typeof s === 'string' ? s : ((s as any)?.skill || (s as any)?.name || 'Unknown Skill')
        );
        const learningSkillNames = profile.skillsLearning.map(s => 
          typeof s === 'string' ? s : ((s as any)?.skill || (s as any)?.name || 'Unknown Skill')
        );
        
        formData.append("skillsTeaching", JSON.stringify(teachingSkillNames));
        formData.append("skillsLearning", JSON.stringify(learningSkillNames));

        // Only append avatar if it is a File (new upload)
        if (profile.avatar instanceof File) {
          formData.append("avatar", profile.avatar);
        }

        const result = await apiService.updateProfile(formData);
        if (result.data) {
          const data = result.data as any;
          toast.success("Profile updated successfully!");
          // Update avatar preview with the new avatar URL from the response if available
          if (data.profile?.avatar) {
            // Append a timestamp to force image refresh and avoid caching issues
            setAvatarPreview(buildAssetUrl(data.profile.avatar, true));
            // Force image reload by temporarily clearing and resetting avatarPreview
            setTimeout(() => {
              setAvatarPreview(null);
              setTimeout(() => {
                setAvatarPreview(buildAssetUrl(data.profile.avatar, true));
              }, 50);
            }, 50);
          }
          navigate("/dashboard");
        } else {
          toast.error(result.error || "Failed to update profile");
          console.error("Update profile error:", result.error);
        }
      } catch (error) {
        toast.error("An error occurred while updating profile");
        console.error("Exception during profile update:", error);
      } finally {
        setLoading(false);
      }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to edit your profile.</p>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-background">
      <Header isLoggedIn={true} />

      <main className="container py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Profile</h1>
          <p className="text-muted-foreground">Update your profile information and skills</p>
          
          {/* Profile Completion Indicator */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Profile Completion</span>
                <span className="text-sm text-muted-foreground">{calculateCompletion()}%</span>
              </div>
              <Progress value={calculateCompletion()} className="h-2 mb-3" />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-3 w-3 ${profile.bio.trim().length > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>Bio</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-3 w-3 ${profile.skillsTeaching.length > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>Teaching Skills</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-3 w-3 ${profile.skillsLearning.length > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>Learning Skills</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-3 w-3 ${avatarPreview !== null ? 'text-green-500' : 'text-gray-400'}`} />
                  <span>Profile Picture</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Verification Status */}
        <div className="mb-6">
          <VerificationStatus />
        </div>

        

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Basic information about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold">
                      {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="avatar-upload" className="text-sm text-muted-foreground">
                    Click the upload icon to change your profile picture
                  </Label>
                </div>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your full name"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="your.email@example.com"
                  required
                  autoComplete="off"
                />
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  autoComplete="off"
                />
              </div>

              {/* Skills Teaching */}
              <div>
                <Label htmlFor="new-skill-teaching">Skills I'm Teaching</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="new-skill-teaching"
                    value={newSkillTeaching}
                    onChange={(e) => setNewSkillTeaching(e.target.value)}
                    placeholder="Add a skill you can teach"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkillTeaching())}
                    autoComplete="off"
                  />
                  <Button type="button" onClick={addSkillTeaching} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.skillsTeaching.map((skill, index) => {
                    // Safety check: ensure skill is a string
                    const skillName = typeof skill === 'string' ? skill : ((skill as any)?.skill || (skill as any)?.name || 'Unknown Skill');
                    return (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skillName}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeSkillTeaching(skillName)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Skills Learning */}
              <div>
                <Label htmlFor="new-skill-learning">Skills I'm Learning</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="new-skill-learning"
                    value={newSkillLearning}
                    onChange={(e) => setNewSkillLearning(e.target.value)}
                    placeholder="Add a skill you want to learn"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkillLearning())}
                    autoComplete="off"
                  />
                  <Button type="button" onClick={addSkillLearning} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.skillsLearning.map((skill, index) => {
                    // Safety check: ensure skill is a string
                    const skillName = typeof skill === 'string' ? skill : ((skill as any)?.skill || (skill as any)?.name || 'Unknown Skill');
                    return (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skillName}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeSkillLearning(skillName)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
};

export default EditProfile;
