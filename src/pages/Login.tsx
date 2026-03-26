
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";

const Login = () => {
  const { user, isLoading, login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);

    const result = await login(email, password);
    setLocalLoading(false);

    if (result.error) {
      toast({
        title: "Login failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Welcome back! 👋",
      description: "Logged in successfully.",
    });

    // Mark fresh login so useEffect can redirect
    setJustLoggedIn(true);
  };

  // Redirect after user state is set
  useEffect(() => {
    if (justLoggedIn && !localLoading && user) {
      // ✅ Admins go to admin panel, everyone else goes to /verify first
      if ((user as any).isAdmin) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/verify", { replace: true });
      }
    }
  }, [justLoggedIn, localLoading, user]);

  // Already logged in — show options instead of auto-redirecting
  if (user && !justLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="text-white text-lg">You're already signed in.</div>
          <div className="grid grid-cols-1 gap-2">
            <Button onClick={() => navigate((user as any).isAdmin ? "/admin" : "/dashboard")}>
              Go to {(user as any).isAdmin ? 'Admin' : 'Dashboard'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/register')}>
              Register a new account
            </Button>
            <Button variant="ghost" onClick={() => {
              apiService.logout();
              window.location.href = '/login';
            }}>
              Log out to switch accounts
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold text-white">SkillSwap</span>
          </Link>
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue learning
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={isLoading || localLoading}
              >
                {(isLoading || localLoading) ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium ml-1">
              Sign up
            </Link>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-white/70 mt-4">
          By signing in, you agree to our{" "}
          <Link to="/terms" className="underline hover:text-white">Terms of Service</Link>
          {" "}and{" "}
          <Link to="/privacy" className="underline hover:text-white">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
