import { useState, useEffect } from "react";
import { ShieldCheck, Mail, FileText, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { apiService } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const VerificationStatus = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await apiService.getVerificationStatus();
        if (res.data) setStatus(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchStatus();
  }, []);

  if (loading) return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
  );

  if (!status) return null;

  const isFullyVerified = status.isVerified && status.documentStatus === 'approved';
  const isPending = status.documentStatus === 'pending';
  const isRejected = status.documentStatus === 'rejected';

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="h-1" style={{ background: isFullyVerified ? "linear-gradient(90deg, #10b981, #059669)" : isPending ? "linear-gradient(90deg, #f59e0b, #d97706)" : "linear-gradient(90deg, #667eea, #764ba2)" }} />

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${isFullyVerified ? "text-emerald-500" : "text-violet-500"}`} />
            <h3 className="font-black text-slate-800 text-sm">Identity Verification</h3>
          </div>
          {isFullyVerified
            ? <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">Verified ✅</span>
            : isPending
            ? <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">Under Review ⏳</span>
            : <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-lg">Incomplete</span>}
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {/* Email */}
          <div className={`flex items-center gap-3 p-3 rounded-xl ${status.emailVerified ? "bg-emerald-50" : "bg-slate-50"}`}>
            {status.emailVerified
              ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              : <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />}
            <div className="flex-1">
              <p className={`text-xs font-bold ${status.emailVerified ? "text-emerald-700" : "text-slate-500"}`}>
                Email OTP Verified
              </p>
              {status.emailVerified && status.email && (
                <p className="text-xs text-emerald-600 mt-0.5">{status.email}</p>
              )}
            </div>
            <Mail className={`w-4 h-4 ${status.emailVerified ? "text-emerald-500" : "text-slate-300"}`} />
          </div>

          {/* Document */}
          <div className={`flex items-center gap-3 p-3 rounded-xl
            ${status.documentStatus === 'approved' ? "bg-emerald-50"
            : status.documentStatus === 'pending' ? "bg-amber-50"
            : status.documentStatus === 'rejected' ? "bg-rose-50" : "bg-slate-50"}`}>
            {status.documentStatus === 'approved'
              ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              : status.documentStatus === 'pending'
              ? <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
              : status.documentStatus === 'rejected'
              ? <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              : <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />}
            <div className="flex-1">
              <p className={`text-xs font-bold
                ${status.documentStatus === 'approved' ? "text-emerald-700"
                : status.documentStatus === 'pending' ? "text-amber-700"
                : status.documentStatus === 'rejected' ? "text-rose-700" : "text-slate-500"}`}>
                {status.documentStatus === 'approved' ? "Document Approved"
                : status.documentStatus === 'pending' ? "Document Under Review"
                : status.documentStatus === 'rejected' ? "Document Rejected"
                : "Identity Document"}
              </p>
              {status.documentType && (
                <p className="text-xs text-slate-500 mt-0.5 capitalize">
                  {status.documentType === 'college_id' ? 'College ID Card' : 'Aadhaar Card'}
                </p>
              )}
              {status.documentStatus === 'rejected' && status.documentRejectionReason && (
                <p className="text-xs text-rose-600 mt-1">❌ {status.documentRejectionReason}</p>
              )}
            </div>
            <FileText className={`w-4 h-4
              ${status.documentStatus === 'approved' ? "text-emerald-500"
              : status.documentStatus === 'pending' ? "text-amber-500"
              : status.documentStatus === 'rejected' ? "text-rose-500" : "text-slate-300"}`} />
          </div>
        </div>

        {/* Rejection warning */}
        {isRejected && (
          <div className="mt-3 flex gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700">Your document was rejected. Please re-upload a clearer photo.</p>
          </div>
        )}

        {/* Action button */}
        {!isFullyVerified && !isPending && (
          <button onClick={() => navigate("/verify")}
            className="w-full mt-4 py-2.5 text-white text-sm font-bold rounded-2xl hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
            {isRejected ? "Re-upload Document →" : !status.emailVerified ? "Start Verification →" : "Upload Document →"}
          </button>
        )}

        {isPending && (
          <div className="mt-4 text-center">
            <p className="text-xs text-amber-600 font-semibold">⏳ Admin review in progress. Usually 24-48 hours.</p>
          </div>
        )}

        {isFullyVerified && (
          <div className="mt-4 text-center">
            <p className="text-xs text-emerald-600 font-semibold">🎉 You are fully verified! All features unlocked.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationStatus;
