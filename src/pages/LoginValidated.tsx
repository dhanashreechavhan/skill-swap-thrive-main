import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/Logo";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import { loginSchema, type LoginFormData } from "@/lib/validationSchemas";

const LoginValidated = () => {
  const { user, isLoading, login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    }
  });

  const watchedFields = watch();

  // Clear server errors when user starts typing
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      clearErrors();
    }
  }, [watchedFields, clearErrors]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login(data.email, data.password);

      if (result.error) {
        // Handle specific server validation errors
        if (result.error.toLowerCase().includes('email')) {
          setError('email', { 
            type: 'server', 
            message: result.error 
          });
        } else if (result.error.toLowerCase().includes('password')) {
          setError('password', { 
            type: 'server', 
            message: result.error 
          });
        } else {
          toast({
            title: "Login failed",
            description: result.error,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      // Mark that this navigation is due to a fresh login
      setJustLoggedIn(true);
    } catch (error) {
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Navigate after user state changes to authenticated
  useEffect(() => {
    // Only redirect after a fresh login, not when visiting /login while already signed in
    if (justLoggedIn && !isSubmitting && user) {
      const target = (user as any).isAdmin ? "/admin" : (from || "/dashboard");
      navigate(target, { replace: true });
    }
  }, [justLoggedIn, isSubmitting, from, user, navigate]);

  // If already authenticated and user navigates to /login manually, show options instead of auto-redirecting
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
            <Logo size="lg" textClassName="text-white" />
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
            {/* Enhanced Login Form with Validation */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register("email")}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    className={errors.password ? 'border-red-500 focus:border-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    {...register("rememberMe")}
                  />
                  <Label 
                    htmlFor="rememberMe" 
                    className="text-sm font-normal cursor-pointer text-muted-foreground"
                  >
                    Remember me
                  </Label>
                </div>
                <Link 
                  to="/forgot-password" 
                  className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  Forgot password?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link 
              to="/register" 
              className="text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              Sign up
            </Link>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-white/70 mt-4">
          By signing in, you agree to our{" "}
          <Link 
            to="/terms" 
            className="underline hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 rounded"
          >
            Terms of Service
          </Link>
          {" "}and{" "}
          <Link 
            to="/privacy" 
            className="underline hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 rounded"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginValidated;