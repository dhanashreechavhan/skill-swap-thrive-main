import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { UserPlus, Search, MessageCircle, Calendar, Award, ArrowRight, CheckCircle, Star, Users, BookOpen, Shield, Zap, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// ── Steps ─────────────────────────────────────────────────────────────────────
const steps = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Sign up and build your skill profile in minutes.",
    details: ["Upload your photo and write a short bio", "List skills you can teach with proficiency level", "Add skills you want to learn with priority", "Set your availability and timezone"],
    gradient: "from-violet-500 to-purple-600",
    emoji: "👤",
  },
  {
    icon: Search,
    title: "Find Perfect Matches",
    description: "Browse the marketplace or let our AI recommend partners.",
    details: ["Search by skill name, category, or level", "Get AI-powered match recommendations", "View profiles, ratings, and portfolios", "Filter by availability and location"],
    gradient: "from-indigo-500 to-blue-600",
    emoji: "🔍",
  },
  {
    icon: MessageCircle,
    title: "Connect & Plan",
    description: "Chat with your match and plan your learning exchange.",
    details: ["Real-time messaging with file sharing", "Discuss learning goals and expectations", "Set milestones and deliverables", "Plan session structure and timeline"],
    gradient: "from-fuchsia-500 to-pink-600",
    emoji: "💬",
  },
  {
    icon: Calendar,
    title: "Schedule Sessions",
    description: "Book sessions at mutually convenient times.",
    details: ["Integrated scheduling with reminders", "Join video calls directly from the platform", "Set recurring sessions for ongoing learning", "Track attendance and session notes"],
    gradient: "from-amber-500 to-orange-500",
    emoji: "📅",
  },
  {
    icon: Award,
    title: "Learn & Get Certified",
    description: "Complete milestones and earn verified certificates.",
    details: ["Track progress with structured milestones", "Rate and review your learning partners", "Download PDF certificates of completion", "Build your verified skills portfolio"],
    gradient: "from-emerald-500 to-teal-600",
    emoji: "🏆",
  },
];

// ── FAQs ──────────────────────────────────────────────────────────────────────
const faqs = [
  { q: "How does the skill exchange work?", a: "You teach someone a skill you know well, and in return, learn a skill from someone else. No money involved — just knowledge exchanged between two people who both benefit." },
  { q: "Is SwapLearnThrive free to use?", a: "The core platform is completely free! We offer optional Pro (₹199/mo) and Premium (₹499/mo) plans for users who want unlimited matches, verified badges, and certificates." },
  { q: "How are matches determined?", a: "Our AI matching system analyzes your teaching skills, learning goals, availability, proficiency levels, and past interactions to suggest the most compatible partners." },
  { q: "What if I'm a complete beginner?", a: "Perfect! Many of our community members love teaching beginners. You can always offer skills you're confident in, even if you're new to other areas — everyone has something to teach." },
  { q: "How do I verify someone's skills?", a: "Users can verify skills through peer endorsements, portfolio uploads, and our rating system where previous partners vouch for their teaching quality." },
  { q: "Can I learn multiple skills at once?", a: "Yes! You can have multiple active partnerships. We recommend starting with 1-2 to maintain quality and focus, then expanding as you get comfortable with the platform." },
  { q: "What happens if a session doesn't go well?", a: "We have a rating system and feedback process. You can report issues to our admin team who will help resolve any conflicts fairly and promptly." },
  { q: "How long do learning partnerships typically last?", a: "It varies! Some are single sessions for quick tips, others span weeks for comprehensive skill development. You and your partner decide the timeline together." },
];

// ── Testimonials ──────────────────────────────────────────────────────────────
const testimonials = [
  { name: "Adarsh K.", role: "Taught Python • Learned React", content: "The AI matching is incredible — found someone who needed exactly what I teach and knows exactly what I want to learn. Win-win!", rating: 5, initials: "AK", gradient: "from-violet-500 to-purple-600" },
  { name: "Priya S.", role: "Taught Graphic Design • Learned Node.js", content: "I was skeptical at first but the platform made it so easy to connect, schedule, and track my progress. Got my certificate in 3 weeks!", rating: 5, initials: "PS", gradient: "from-fuchsia-500 to-pink-600" },
  { name: "Rohan M.", role: "Taught Data Science • Learned Public Speaking", content: "Never thought I'd be confident on stage. My swap partner was incredibly patient and the structured milestones kept us on track.", rating: 5, initials: "RM", gradient: "from-indigo-500 to-blue-600" },
];

// ── Main Component ─────────────────────────────────────────────────────────────
const HowItWorks = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf4ff 100%)" }}>
      <Header />

      <main>

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden py-20">
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)" }} />
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 container max-w-5xl mx-auto px-4 text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-6">
              <Zap className="w-4 h-4" /> Simple · Fast · Free
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              How SwapLearnThrive<br />
              <span className="text-yellow-300">Actually Works</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
              Teach what you know. Learn what you love. No money, no barriers — just pure peer-to-peer knowledge exchange.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => navigate('/register')}
                className="flex items-center gap-2 px-6 py-3 bg-white text-violet-700 font-black rounded-2xl hover:bg-yellow-50 transition-colors shadow-lg">
                Start Learning Free <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/learn')}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-bold rounded-2xl hover:bg-white/30 transition-colors border border-white/30">
                Browse Skills
              </button>
            </div>
          </div>
        </section>

        {/* ══ QUICK STATS ═════════════════════════════════════════════════════ */}
        <section className="py-12 container max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, value: "10+", label: "Beta Users", color: "from-violet-500 to-purple-600" },
              { icon: BookOpen, value: "50+", label: "Skills Listed", color: "from-indigo-500 to-blue-600" },
              { icon: Award, value: "15+", label: "Sessions Done", color: "from-fuchsia-500 to-pink-600" },
              { icon: Heart, value: "100%", label: "Free Core", color: "from-amber-500 to-orange-500" },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-3xl p-5 text-center border border-slate-100 shadow-sm">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-3`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ 5 STEPS ═════════════════════════════════════════════════════════ */}
        <section className="py-16 container max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">5 Simple Steps 🚀</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From signing up to earning your certificate — here's the full journey</p>
          </div>

          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className={`h-1 bg-gradient-to-r ${step.gradient}`} />
                <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
                  {/* Step number + icon */}
                  <div className="flex items-center gap-4 md:flex-col md:items-center md:w-20 flex-shrink-0">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
                      <step.icon className="w-7 h-7" />
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                      <span className="text-sm font-black text-slate-600">{i + 1}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{step.emoji}</span>
                      <h3 className="text-lg font-black text-slate-900">{step.title}</h3>
                    </div>
                    <p className="text-slate-500 text-sm mb-4">{step.description}</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {step.details.map((d, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-600">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ TESTIMONIALS ════════════════════════════════════════════════════ */}
        <section className="py-16 container max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">What Our Users Say ⭐</h2>
            <p className="text-slate-500">Real feedback from real skill swappers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
                <div className={`h-1 rounded-full mb-4 bg-gradient-to-r ${t.gradient}`} />
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-5 italic">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ FAQ ═════════════════════════════════════════════════════════════ */}
        <section className="py-16 container max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Frequently Asked Questions 

              
            </h2>
            <p className="text-slate-500">Everything you need to know about SwapLearnThrive</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="p-5 flex items-center justify-between gap-4">
                  <p className="font-bold text-slate-900 text-sm">{faq.q}</p>
                  <span className={`text-violet-600 font-black text-lg flex-shrink-0 transition-transform ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </div>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <div className="h-px bg-slate-100 mb-4" />
                    <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ══ CTA ════════════════════════════════════════════════════════════ */}
        <section className="py-16 container max-w-5xl mx-auto px-4 mb-8">
          <div className="rounded-3xl p-12 text-white text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)" }}>
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
            <div className="relative z-10">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-3xl font-black mb-3">Ready to Start Your First Swap?</h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Join our beta community of learners and teachers. It's free, it's fun, and it works!
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => navigate('/register')}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-violet-700 font-black rounded-2xl hover:bg-yellow-50 transition-colors shadow-lg">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate('/learn')}
                  className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-bold rounded-2xl hover:bg-white/30 transition-colors border border-white/30">
                  Browse Skills First
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
