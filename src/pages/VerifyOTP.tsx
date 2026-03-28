import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Phone, ShieldCheck, ArrowRight, RefreshCw,
  CheckCircle, Upload, FileText, CreditCard, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";

type Method = "email" | "phone" | null;
type Step = "choose" | "enter-contact" | "enter-otp" | "upload-doc" | "done";

const VerifyOTP = () => {
  const [step, setStep] = useState<Step>("choose");
  const [method, setMethod] = useState<Method>(null);
  const [contactValue, setContactValue] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  // Document upload state
  const [docType, setDocType] = useState<"aadhaar" | "college_id">("aadhaar");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    checkStatus();
  }, [isAuthenticated]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const checkStatus = async () => {
    try {
      const res = await apiService.getVerificationStatus();
      if (res.data) {
        const s = res.data as any;
        setVerificationStatus(s);
        // If already fully verified (email + doc approved) → done
        if (s.isVerified) { setStep("done"); return; }
        // If email verified but no doc yet → go to doc upload
        if (s.emailVerified && !s.documentStatus) { setStep("upload-doc"); return; }
        // If doc is pending or approved
        if (s.documentStatus === 'pending') { setStep("done"); return; }
        if (s.documentStatus === 'approved') { setStep("done"); return; }
      }
    } catch (e) { console.error(e); }
  };

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!contactValue.trim()) {
      toast({ title: "Missing info", description: method === "email" ? "Enter your email." : "Enter your phone number.", variant: "destructive" });
      return;
    }
    if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue)) {
      toast({ title: "Invalid email", description: "Enter a valid email address.", variant: "destructive" });
      return;
    }
    if (method === "phone" && !/^[6-9]\d{9}$/.test(contactValue.replace(/^(\+91|91)/, ""))) {
      toast({ title: "Invalid number", description: "Enter a valid 10-digit Indian mobile number.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.sendOTP(method as "email" | "phone", contactValue.trim());
      if ((res as any).error) { toast({ title: "Error", description: (res as any).error, variant: "destructive" }); return; }
      toast({ title: "OTP Sent! 📬", description: `Check your ${method === "email" ? "inbox" : "phone"} for the code.` });
      setStep("enter-otp");
      setOtp(["", "", "", "", "", ""]);
      setResendTimer(60);
    } catch { toast({ title: "Error", description: "Failed to send OTP.", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  // ── OTP input handlers ───────────────────────────────────────────────────────
  const handleOTPChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const n = [...otp]; n[i] = val.slice(-1); setOtp(n);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };
  const handleOTPKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
  };

  // ── Verify OTP ───────────────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) { toast({ title: "Enter all 6 digits", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await apiService.verifyOTP(method as "email" | "phone", otpString);
      if ((res as any).error) { toast({ title: "Incorrect OTP ❌", description: (res as any).error, variant: "destructive" }); return; }
      toast({ title: "OTP Verified! ✅", description: "Now upload your identity document." });
      setVerificationStatus((prev: any) => ({ ...prev, emailVerified: method === "email" ? true : prev?.emailVerified, phoneVerified: method === "phone" ? true : prev?.phoneVerified }));
      setStep("upload-doc");
    } catch { toast({ title: "Error", description: "Verification failed.", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  // ── Document file select ─────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" }); return; }
    setDocFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setDocPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setDocPreview(null); // PDF
    }
  };

  // ── Upload document ──────────────────────────────────────────────────────────
  const handleUploadDoc = async () => {
    if (!docFile) { toast({ title: "Select a file first", variant: "destructive" }); return; }
    setDocUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", docFile);
      formData.append("documentType", docType);

      const response = await fetch(`${(apiService as any).getBaseURL?.() || 'http://localhost:5000/api'}/verification/upload-document`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiService.getToken()}` },
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) { toast({ title: "Upload failed", description: data.message, variant: "destructive" }); return; }
      toast({ title: "Document Submitted! 🎉", description: data.message });
      setVerificationStatus((prev: any) => ({ ...prev, documentStatus: 'pending' }));
      setStep("done");
    } catch { toast({ title: "Error", description: "Upload failed. Try again.", variant: "destructive" }); }
    finally { setDocUploading(false); }
  };

  const pageBg = { background: "linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf4ff 100%)" };
  const btnStyle = { background: "linear-gradient(135deg, #667eea, #764ba2)" };

  return (
    <div className="min-h-screen" style={pageBg}>
      <Header isLoggedIn={true} />
      <main className="container max-w-lg mx-auto px-4 py-12">

        {/* Progress bar */}
        {step !== "done" && (
          <div className="flex items-center gap-2 mb-8">
            {["choose", "enter-contact", "enter-otp", "upload-doc"].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all
                  ${["choose","enter-contact","enter-otp","upload-doc"].indexOf(step) >= i
                    ? "text-white" : "bg-slate-100 text-slate-400"}`}
                  style={["choose","enter-contact","enter-otp","upload-doc"].indexOf(step) >= i ? btnStyle : {}}>
                  {i + 1}
                </div>
                {i < 3 && <div className={`flex-1 h-0.5 ${["choose","enter-contact","enter-otp","upload-doc"].indexOf(step) > i ? "bg-violet-400" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* ══ DONE ══ */}
        {step === "done" && (
          <div className="bg-white rounded-3xl shadow-lg p-10 text-center border border-emerald-100">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
              {verificationStatus?.documentStatus === 'pending'
                ? <Clock className="w-10 h-10 text-amber-500" />
                : <CheckCircle className="w-10 h-10 text-emerald-500" />}
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">
              {verificationStatus?.isVerified ? "Fully Verified! 🎉" : "Almost There! ⏳"}
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              {verificationStatus?.isVerified
                ? "Your identity is confirmed. You have full access to SwapLearnThrive!"
                : verificationStatus?.documentStatus === 'pending'
                  ? "Your document is under review. We'll notify you within 24-48 hours."
                  : "Complete the steps below to get fully verified."}
            </p>

            {/* Status cards */}
            <div className="flex flex-col gap-2 mb-6">
              <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left ${verificationStatus?.emailVerified ? "bg-emerald-50" : "bg-slate-50"}`}>
                <Mail className={`w-4 h-4 ${verificationStatus?.emailVerified ? "text-emerald-600" : "text-slate-400"}`} />
                <span className={`text-sm font-semibold ${verificationStatus?.emailVerified ? "text-emerald-700" : "text-slate-500"}`}>
                  Email verified {verificationStatus?.emailVerified ? "✅" : "❌"}
                </span>
              </div>
              <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left
                ${verificationStatus?.documentStatus === 'approved' ? "bg-emerald-50"
                : verificationStatus?.documentStatus === 'pending' ? "bg-amber-50" : "bg-slate-50"}`}>
                <FileText className={`w-4 h-4
                  ${verificationStatus?.documentStatus === 'approved' ? "text-emerald-600"
                  : verificationStatus?.documentStatus === 'pending' ? "text-amber-600" : "text-slate-400"}`} />
                <span className={`text-sm font-semibold
                  ${verificationStatus?.documentStatus === 'approved' ? "text-emerald-700"
                  : verificationStatus?.documentStatus === 'pending' ? "text-amber-700" : "text-slate-500"}`}>
                  {verificationStatus?.documentStatus === 'approved' ? "Document verified ✅"
                  : verificationStatus?.documentStatus === 'pending' ? "Document under review ⏳"
                  : "Document not uploaded ❌"}
                </span>
              </div>
            </div>

            <button onClick={() => navigate("/dashboard")} className="w-full py-3 text-white font-bold rounded-2xl hover:opacity-90" style={btnStyle}>
              Go to Dashboard →
            </button>
          </div>
        )}

        {/* ══ CHOOSE METHOD ══ */}
        {step === "choose" && (
          <div>
            <div className="rounded-3xl p-8 mb-6 text-white text-center relative overflow-hidden" style={btnStyle}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-black mb-2">Verify Your Identity</h1>
                <p className="text-white/70 text-sm">2 quick steps — OTP + document upload. Keeps SwapLearnThrive scam-free! 🔒</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-5 flex gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-bold text-amber-800">Why verify?</p>
                <p className="text-xs text-amber-700 mt-0.5">One person = one account. Prevents fake accounts from earning unfair commission.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <p className="text-sm font-black text-slate-800 mb-1">Step 1 — Choose OTP method</p>
              <p className="text-xs text-slate-400 mb-4">We'll send a 6-digit code to confirm it's really you.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setMethod("email"); setStep("enter-contact"); }} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-violet-300 hover:bg-violet-50 transition-all text-left group">
                  <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">Verify with Email</p>
                    <p className="text-xs text-slate-400">OTP sent to your email</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-400" />
                </button>
                <button onClick={() => { setMethod("phone"); setStep("enter-contact"); }} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group">
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">Verify with Phone</p>
                    <p className="text-xs text-slate-400">OTP sent via SMS</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ ENTER CONTACT ══ */}
        {step === "enter-contact" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <button onClick={() => setStep("choose")} className="text-xs text-slate-400 hover:text-slate-600 mb-5">← Back</button>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${method === "email" ? "bg-violet-100" : "bg-indigo-100"}`}>
              {method === "email" ? <Mail className="w-6 h-6 text-violet-600" /> : <Phone className="w-6 h-6 text-indigo-600" />}
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">{method === "email" ? "Enter your email" : "Enter your phone number"}</h2>
            <p className="text-sm text-slate-400 mb-6">{method === "email" ? "We'll send a 6-digit code to this email." : "We'll send a 6-digit SMS to this Indian number."}</p>
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">{method === "email" ? "Email Address" : "Phone Number"}</label>
              {method === "phone" ? (
                <div className="flex">
                  <span className="px-4 py-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-sm font-semibold text-slate-500">+91</span>
                  <input type="tel" maxLength={10} value={contactValue} onChange={e => setContactValue(e.target.value.replace(/\D/g, ""))} placeholder="9876543210"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-r-xl text-sm outline-none focus:border-violet-400"
                    onKeyDown={e => e.key === "Enter" && handleSendOTP()} />
                </div>
              ) : (
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

        {/* ══ ENTER OTP ══ */}
        {step === "enter-otp" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${method === "email" ? "bg-violet-100" : "bg-indigo-100"}`}>
              {method === "email" ? <Mail className="w-6 h-6 text-violet-600" /> : <Phone className="w-6 h-6 text-indigo-600" />}
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Enter the code</h2>
            <p className="text-sm text-slate-400 mb-1">Sent to <span className="font-semibold text-slate-700">{method === "phone" ? `+91 ${contactValue}` : contactValue}</span></p>
            <p className="text-xs text-slate-400 mb-8">Expires in 10 minutes.</p>
            <div className="flex gap-2 justify-center mb-8">
              {otp.map((d, i) => (
                <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleOTPChange(i, e.target.value)} onKeyDown={e => handleOTPKey(i, e)}
                  className="w-12 h-14 text-center text-xl font-black border-2 border-slate-200 rounded-xl outline-none focus:border-violet-400 focus:bg-violet-50 transition-all" />
              ))}
            </div>
            <button onClick={handleVerifyOTP} disabled={loading} className="w-full py-3 text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-50 mb-4" style={btnStyle}>
              {loading ? "Verifying..." : "Verify →"}
            </button>
            <div className="text-center">
              {resendTimer > 0
                ? <p className="text-xs text-slate-400">Resend in <span className="font-bold">{resendTimer}s</span></p>
                : <button onClick={() => { setStep("enter-contact"); setOtp(["","","","","",""]); }} className="flex items-center gap-1 text-xs text-violet-600 font-bold mx-auto">
                    <RefreshCw className="w-3 h-3" /> Resend OTP
                  </button>}
            </div>
          </div>
        )}

        {/* ══ UPLOAD DOCUMENT ══ */}
        {step === "upload-doc" && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-5">
              <FileText className="w-6 h-6 text-violet-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Upload Identity Document</h2>
            <p className="text-sm text-slate-400 mb-6">Step 2 of 2 — Upload your Aadhaar card or College ID. Admin will verify within 24-48 hrs.</p>

            {/* Document type choice */}
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Document Type</p>
            <div className="flex gap-3 mb-5">
              <button onClick={() => setDocType("aadhaar")}
                className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${docType === "aadhaar" ? "border-violet-400 bg-violet-50" : "border-slate-100"}`}>
                <CreditCard className={`w-4 h-4 ${docType === "aadhaar" ? "text-violet-600" : "text-slate-400"}`} />
                <span className={`text-sm font-bold ${docType === "aadhaar" ? "text-violet-700" : "text-slate-500"}`}>Aadhaar Card</span>
              </button>
              <button onClick={() => setDocType("college_id")}
                className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${docType === "college_id" ? "border-violet-400 bg-violet-50" : "border-slate-100"}`}>
                <FileText className={`w-4 h-4 ${docType === "college_id" ? "text-violet-600" : "text-slate-400"}`} />
                <span className={`text-sm font-bold ${docType === "college_id" ? "text-violet-700" : "text-slate-500"}`}>College ID</span>
              </button>
            </div>

            {/* File upload zone */}
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-all mb-5">
              {docPreview ? (
                <img src={docPreview} alt="Preview" className="max-h-40 mx-auto rounded-xl object-contain" />
              ) : docFile ? (
                <div className="flex items-center gap-2 justify-center">
                  <FileText className="w-8 h-8 text-violet-500" />
                  <p className="text-sm font-semibold text-slate-700">{docFile.name}</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Click to upload</p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG or PDF · Max 5MB</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" className="hidden" onChange={handleFileSelect} />
            </div>

            {docFile && (
              <p className="text-xs text-slate-400 mb-4 text-center">
                ✅ {docFile.name} ({(docFile.size / 1024).toFixed(0)} KB) selected
              </p>
            )}

            <div className="bg-amber-50 rounded-xl p-3 mb-5 flex gap-2">
              <span className="text-sm">💡</span>
              <p className="text-xs text-amber-700">Make sure the document is <strong>clearly visible</strong> and all text is readable. Blurry photos will be rejected.</p>
            </div>

            <button onClick={handleUploadDoc} disabled={docUploading || !docFile}
              className="w-full py-3 text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-50" style={btnStyle}>
              {docUploading ? "Uploading..." : "Submit Document →"}
            </button>
          </div>
        )}

      </main>
    </div>
  );
};

export default VerifyOTP;
