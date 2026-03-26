import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyOTP from "./pages/VerifyOTP";
import AdminRoute from "./components/AdminRoute";

const ReviewsPage = lazy(() => import("./pages/Reviews"));
const MySkills = lazy(() => import("./pages/MySkills"));
const Subscription = lazy(() => import("./pages/Subscription"));
// Lazy load page components
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ExploreSkills = lazy(() => import("./pages/ExploreSkills"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const About = lazy(() => import("./pages/About"));
const FindSkills = lazy(() => import("./pages/FindSkills"));
const OfferSkills = lazy(() => import("./pages/OfferSkills"));
const Messages = lazy(() => import("./pages/Messages"));
const Matches = lazy(() => import("./pages/Matches"));
const Schedule = lazy(() => import("./pages/Schedule"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const InterestedStudents = lazy(() => import("./pages/InterestedStudents"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const SkillsVisualization = lazy(() => import("./pages/SkillsVisualization"));
const Certificates = lazy(() => import("./pages/Certificates"));

const queryClient = new QueryClient();

// Loading component for lazy-loaded pages
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/explore" element={<Navigate to="/learn" replace />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/learn" element={<FindSkills />} />
          <Route path="/teach" element={<OfferSkills />} />
          <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/interested-students" element={<ProtectedRoute><InterestedStudents /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute><AdminRoute><AdminAnalytics /></AdminRoute></ProtectedRoute>} />
          <Route path="/skills-visualization" element={<ProtectedRoute><SkillsVisualization /></ProtectedRoute>} />
          <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
<Route path="/my-skills" element={<ProtectedRoute><MySkills /></ProtectedRoute>} />
<Route path="/verify" element={<VerifyOTP />} /> 
<Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
          <Route path="/reviews/:userId" element={<ReviewsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
