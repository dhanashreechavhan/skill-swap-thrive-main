import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, ShieldCheck, ArrowRight, RefreshCw, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";

type Method = "email" | "phone" | null;

const VerifyOTP = () => {
  const [step, setStep] = useState<"choose" | "enter-contact" | "enter-otp" | "done">("choose");
  const [method, setMethod] = useState<Method>(null);
  const [contactValue, setContactValue] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    checkVerificationStatus();
  }, [isAuthenticated]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const checkVerificationStatus = async () => {
    try {
      const res = await apiService.getVerificationStatus();
      if (res.data) {
        setVerificationStatus(res.data);
        if ((res.data as any).isVerified) setStep("done");
      }
    } catch (e) { console.error(e); }
  };

  const handleChooseMethod = (chosen: Method) => {
    setMethod(chosen);
    setStep("enter-contact");
    setContactValue("");
  };

  const handleSendOTP = async () => {
    if (!contactValue.trim()) {
      toast({ title: "Missing info", description: method === "email" ? "Please enter your email address." : "Please enter your phone number.", variant: "destructive" });
      return;
    }
    if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (method === "phone" && !/^[6-9]\d{9}$/.test(contactValue.replace(/^(\+91|91)/, ""))) {
      toast({ title: "Invalid number", description: "Please enter a valid 10-digit Indian mobile number.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.sendOTP(method as "email" | "phone", contactValue.trim());
      if ((res as any).error) { toast({ title: "Error", description: (res as any).error, variant: "destructive" }); return; }
      toast({ title: "OTP Sent! 📬", description: `Check your ${method === "email" ? "inbox" : "phone"} for the 6-digit code.` });
      setStep("enter-otp");
      setOtp(["", "", "", "", "", ""]);
      setResendTimer(60);
    } catch (e) {
      toast({ title: "Error", description: "Failed to send OTP. Please try again.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) { toast({ title: "Enter complete OTP", description: "Please enter all 6 digits.", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await apiService.verifyOTP(method as "email" | "phone", otpString);
      if ((res as any).error) { toast({ title: "Incorrect OTP ❌", description: (res as any).error, variant: "destructive" }); return; }
      toast({ title: "Verified! 🎉", description: "Your account is now verified." });
      setVerificationStatus({
        ...(verificationStatus || {}), isVerified: true,
        emailVerified: method === "email" ? true : verificationStatus?.emailVerified,
        phoneVerified: method === "phone" ? true : verificationStatus?.phoneVerified,
      });
      setStep("done");
    } catch (e) {
      toast({ title: "Error", description: "Verification failed. Please try again.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const pageBg = { background: "linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf4ff 100%)" };
  const btnStyle = { background: "linear-gradient(135deg, #667eea, #764ba2)" };

  return (
    <div className="min-h-screen" style={pageBg}>
      <Header isLoggedIn={true} />
      <main className="container max-w-lg mx-auto px-4 py-16">

        {step === "done" && (
          <div className="bg-white rounded-3xl shadow-lg p-10 text-center border border-emerald-100">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">You're Verified! 🎉</h1>
            <p className="text-slate-500 text-sm mb-6">Your identity has been confirmed. You now have full access to SwapLearnThrive — teach, learn, and earn!</p>
            <div className="flex flex-col gap-3 mb-6">
              {verificationStatus?.emailVerified && (
                <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-2 justify-center">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">Email verified ✅</span>
                </div>
              )}
              {verificationStatus?.phoneVerified && (
                <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-2 justify-center">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">Phone verified ✅</span>
                </div>
              )}
            </div>
            <button onClick={() => navigate("/dashboard")} className="w-full py-3 text-white font-bold rounded-2xl hover:opacity-90" style={btnStyle}>
              Go to Dashboard →
            </button>
          </div>
        )}

        {step === "choose" && (
          <div>
            <div className="rounded-3xl p-8 mb-8 text-white text-center relative overflow-hidden" style={btnStyle}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-black mb-2">Verify Your Identity</h1>
                <p className="text-white/70 text-sm">One quick step to keep SwapLearnThrive safe and scam-free for everyone. 🔒</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex gap-3 items-start">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-bold text-amber-800">Why do we verify?</p>
                <p className="text-xs text-amber-700 mt-1">To prevent scammers from creating multiple fake accounts to earn unfair commission. One person = one verified account.</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <p className="text-sm font-black text-slate-800 mb-1">Choose verification method</p>
              <p className="text-xs text-slate-400 mb-5">We'll send a 6-digit code to confirm it's really you.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleChooseMethod("email")} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-violet-300 hover:bg-violet-50 transition-all text-left group">
                  <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                    <Mail className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">Verify with Email</p>
                    <p className="text-xs text-slate-400">We'll send a code to your email address</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-400 transition-colors" />
                </button>
                <button onClick={() => handleChooseMethod("phone")} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group">
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <Phone className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">Verify with Phone</p>
                    <p className="text-xs text-slate-400">We'll send a code via SMS to your number</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "enter-contact" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <button onClick={() => setStep("choose")} className="text-xs text-slate-400 hover:text-slate-600 mb-5 flex items-center gap-1">← Back</button>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${method === "email" ? "bg-violet-100" : "bg-indigo-100"}`}>
              {method === "email" ? <Mail className="w-6 h-6 text-violet-600" /> : <Phone className="w-6 h-6 text-indigo-600" />}
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">{method === "email" ? "Enter your email" : "Enter your phone number"}</h2>
            <p className="text-sm text-slate-400 mb-6">{method === "email" ? "We'll send a 6-digit code to this email address." : "We'll send a 6-digit SMS to this Indian mobile number."}</p>
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">{method === "email" ? "Email Address" : "Phone Number (10 digits)"}</label>
              {method === "phone" && (
                <div className="flex">
                  <span className="px-4 py-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-sm font-semibold text-slate-500">+91</span>
                  <input type="tel" maxLength={10} value={contactValue} onChange={e => setContactValue(e.target.value.replace(/\D/g, ""))} placeholder="9876543210"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-r-xl text-sm outline-none focus:border-violet-400"
                    onKeyDown={e => e.key === "Enter" && handleSendOTP()} />
                </div>
              )}
              {method === "email" && (
                <input type="email" value={contactValue} onChange={e => setContactValue(e.target.value)} placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400"
                  onKeyDown={e => e.key === "Enter" && handleSendOTP()} />
              )}
            </div>
            <button onClick={handleSendOTP} disabled={loading} className="w-full py-3 text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-50" style={btnStyle}>
              {loading ? "Sending..." : "Send OTP →"}
            </button>
          </div>
        )}

        {step === "enter-otp" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${method === "email" ? "bg-violet-100" : "bg-indigo-100"}`}>
              {method === "email" ? <Mail className="w-6 h-6 text-violet-600" /> : <Phone className="w-6 h-6 text-indigo-600" />}
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Enter the code</h2>
            <p className="text-sm text-slate-400 mb-1">We sent a 6-digit code to <span className="font-semibold text-slate-700">{method === "phone" ? `+91 ${contactValue}` : contactValue}</span></p>
            <p className="text-xs text-slate-400 mb-8">It expires in 10 minutes.</p>
            <div className="flex gap-2 justify-center mb-8">
              {otp.map((digit, i) => (
                <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={e => handleOTPChange(i, e.target.value)} onKeyDown={e => handleOTPKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-black border-2 border-slate-200 rounded-xl outline-none focus:border-violet-400 focus:bg-violet-50 transition-all" />
              ))}
            </div>
            <button onClick={handleVerifyOTP} disabled={loading} className="w-full py-3 text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-50 mb-4" style={btnStyle}>
              {loading ? "Verifying..." : "Verify →"}
            </button>
            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-xs text-slate-400">Resend OTP in <span className="font-bold text-slate-600">{resendTimer}s</span></p>
              ) : (
                <button onClick={() => { setStep("enter-contact"); setOtp(["", "", "", "", "", ""]); }}
                  className="flex items-center gap-1 text-xs text-violet-600 font-bold hover:text-violet-800 mx-auto">
                  <RefreshCw className="w-3 h-3" /> Resend OTP
                </button>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default VerifyOTP;
