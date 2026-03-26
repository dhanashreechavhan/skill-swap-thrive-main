import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { Check, Zap, Crown, Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// ── Plan config ────────────────────────────────────────────────────────────────
const PLANS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    priceLabel: "₹0",
    period: "forever",
    tagline: "Get started for free",
    icon: Sparkles,
    gradient: "from-slate-400 to-slate-600",
    border: "border-slate-200",
    badge: null,
    features: [
      { text: "1 skill listing only", included: true },
      { text: "2 matches per month", included: true },
      { text: "Limited messaging (5/day)", included: true },
      { text: "Verified badge", included: false },
      { text: "Certificate generation", included: false },
      { text: "Video sessions", included: false },
      { text: "Priority in search", included: false },
      { text: "See who liked you", included: false },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: 149,
    priceLabel: "₹149",
    period: "per week",
    tagline: "Try premium for a week!",
    icon: Zap,
    gradient: "from-violet-500 to-indigo-600",
    border: "border-violet-300",
    badge: "Most Popular",
    features: [
      { text: "5 skills listing", included: true },
      { text: "10 matches per week", included: true },
      { text: "Unlimited messaging", included: true },
      { text: "Verified badge", included: true },
      { text: "Certificate generation", included: true },
      { text: "Video sessions (3/week)", included: true },
      { text: "Priority in search", included: false },
      { text: "See who liked you", included: false },
    ],
  },
  {
    key: "premium",
    name: "Premium",
    price: 499,
    priceLabel: "₹499",
    period: "per month",
    tagline: "Unlimited everything!",
    icon: Crown,
    gradient: "from-amber-400 to-orange-500",
    border: "border-amber-300",
    badge: "Best Value — Save 46%",
    features: [
      { text: "Unlimited skills listing", included: true },
      { text: "Unlimited matches", included: true },
      { text: "Unlimited messaging", included: true },
      { text: "Verified badge", included: true },
      { text: "Certificate generation", included: true },
      { text: "Unlimited video sessions", included: true },
      { text: "Priority in search", included: true },
      { text: "See who liked you", included: true },
    ],
  },
];

// ── Main Component ─────────────────────────────────────────────────────────────
const Subscription = () => {
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ── Load current plan ────────────────────────────────────────────────────
  const loadPlan = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await apiService.getMyPlan();
      if (res.data) {
        setCurrentPlan((res.data as any).currentPlan || "free");
        setExpiresAt((res.data as any).expiresAt || null);
      }
    } catch (e) {
      console.error("Error loading plan:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    loadPlan();
  }, [isAuthenticated]);

  // ── Upgrade / downgrade ──────────────────────────────────────────────────
  const handleSelectPlan = async (planKey: string) => {
  if (planKey === currentPlan) return;

  // Downgrade to free
  if (planKey === "free") {
    if (!window.confirm("Cancel subscription and go back to Free?")) return;
    setUpgrading("free");
    const res = await apiService.cancelPlan();
    if (!(res as any).error) {
      toast({ title: "Cancelled", description: "You are now on the Free plan." });
      await loadPlan();
    }
    setUpgrading(null);
    return;
  }

  // Upgrade to pro/premium — open Razorpay popup
  setUpgrading(planKey);
  try {
    const res = await apiService.createPaymentOrder(planKey);
    if ((res as any).error) {
      toast({ title: "Error", description: (res as any).error, variant: "destructive" });
      setUpgrading(null);
      return;
    }

    const { orderId, amount, currency, keyId, planName } = res.data as any;

    const options = {
      key: keyId,
      amount,
      currency,
      name: "SwapLearnThrive",
      description: `${planName} - 30 days`,
      order_id: orderId,
      handler: async (response: any) => {
        // Payment done — verify it
        const verifyRes = await apiService.verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          plan: planKey,
        });
        if ((verifyRes as any).error) {
          toast({ title: "Verification failed", description: (verifyRes as any).error, variant: "destructive" });
        } else {
          toast({ title: "🎉 Payment successful!", description: `Welcome to ${planName}!` });
          await loadPlan();
        }
        setUpgrading(null);
      },
      prefill: { name: "", email: "" },
      theme: { color: "#667eea" },
      modal: {
        ondismiss: () => setUpgrading(null)
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  } catch {
    toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    setUpgrading(null);
  }
};

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric"
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf4ff 100%)" }}>
      <Header isLoggedIn={true} />

      <main className="container py-10 max-w-6xl mx-auto px-4">

        {/* ── Hero ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100 text-violet-700 rounded-full text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Choose Your Plan
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            Unlock Your Full Potential 🚀
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Start free and upgrade anytime. All plans include access to SkillSwap's core features.
          </p>

          {/* Current plan banner */}
          {!loading && (
            <div className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-white border border-slate-200 rounded-2xl text-sm shadow-sm">
              <span className="text-slate-500">Current plan:</span>
              <span className="font-black text-violet-700 capitalize">{currentPlan}</span>
              {expiresAt && (
                <span className="text-slate-400 text-xs">· Expires {formatDate(expiresAt)}</span>
              )}
            </div>
          )}
        </div>

        {/* ── Plan cards ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = currentPlan === plan.key;
              const isPopular = plan.key === "pro";

              return (
                <div key={plan.key}
                  className={`bg-white rounded-3xl border-2 shadow-sm overflow-hidden transition-all hover:shadow-lg relative
                    ${isCurrentPlan ? "border-violet-400 shadow-violet-100" : plan.border}
                    ${isPopular ? "md:-mt-4 md:mb-4" : ""}
                  `}>

                  {/* Badge */}
                  {plan.badge && (
                    <div className={`text-center py-2 text-xs font-black text-white bg-gradient-to-r ${plan.gradient}`}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Current plan indicator */}
                  {isCurrentPlan && (
                    <div className="text-center py-2 text-xs font-black text-white"
                      style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
                      ✅ Your Current Plan
                    </div>
                  )}

                  <div className="p-6">
                    {/* Icon + name */}
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h2>
                    <p className="text-slate-400 text-sm mb-4">{plan.tagline}</p>

                    {/* Price */}
                    <div className="mb-6">
                      <span className="text-4xl font-black text-slate-900">{plan.priceLabel}</span>
                      <span className="text-slate-400 text-sm ml-1">/{plan.period}</span>
                    </div>

                    {/* CTA button */}
                    <button
                      disabled={isCurrentPlan || upgrading !== null}
                      onClick={() => handleSelectPlan(plan.key)}
                      className={`w-full py-3 rounded-2xl text-sm font-black transition-all mb-6 disabled:opacity-50
                        ${isCurrentPlan
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : plan.key === "free"
                            ? "border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
                            : "text-white hover:opacity-90 shadow-md"
                        }`}
                      style={!isCurrentPlan && plan.key !== "free"
                        ? { background: `linear-gradient(135deg, ${plan.key === "pro" ? "#667eea, #764ba2" : "#f59e0b, #ef4444"})` }
                        : {}}>
                      {upgrading === plan.key
                        ? "Processing..."
                        : isCurrentPlan
                          ? "Current Plan"
                          : plan.key === "free"
                            ? "Downgrade to Free"
                            : `Get ${plan.name}`}
                    </button>

                    {/* Features list */}
                    <div className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${feature.included ? "bg-emerald-100" : "bg-slate-100"}`}>
                            {feature.included
                              ? <Check className="w-3 h-3 text-emerald-600" />
                              : <X className="w-3 h-3 text-slate-400" />}
                          </div>
                          <span className={`text-sm ${feature.included ? "text-slate-700" : "text-slate-400"}`}>
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer note ── */}
        <p className="text-center text-slate-400 text-xs mt-10">
          🔒 Secure payments via Razorpay &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; 30-day validity
        </p>

      </main>
    </div>
  );
};

export default Subscription;

