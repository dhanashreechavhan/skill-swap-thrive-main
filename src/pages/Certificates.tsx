import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { apiService } from "@/lib/api";
import { ArrowLeft, Download, Award } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const CertificateCard = ({ userName, skillName, date, mentorName, isPreview = false }: {
  userName: string;
  skillName: string;
  date: string;
  mentorName?: string;
  isPreview?: boolean;
}) => (
  <div style={{
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 25px 80px rgba(102,126,234,0.4)",
    position: "relative",
    background: "linear-gradient(135deg, #2d1b69, #4c1d95, #6d28d9)",
    border: "1px solid rgba(255,255,255,0.15)"
  }}>
    <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "250px", height: "250px", borderRadius: "50%", background: "rgba(167,139,250,0.15)", pointerEvents: "none" }} />
    <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(240,147,251,0.1)", pointerEvents: "none" }} />
    <div style={{ position: "absolute", top: "50%", left: "-80px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(102,126,234,0.1)", pointerEvents: "none" }} />

    <div style={{ padding: "40px 50px", textAlign: "center", position: "relative" }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "4px" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          background: "#7c3aed",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 3px rgba(255,255,255,0.2)"
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontSize: "20px", fontWeight: "800", color: "white", letterSpacing: "-0.5px" }}>SwapLearnThrive</span>
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", margin: "14px 0" }}>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.2)" }} />
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", letterSpacing: "3px", textTransform: "uppercase" }}>Certificate of Completion</span>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.2)" }} />
      </div>

      {/* Name Box */}
      <div style={{
        margin: "16px 0", padding: "20px 30px",
        background: "rgba(255,255,255,0.08)",
        borderRadius: "16px", border: "1px solid rgba(255,255,255,0.15)"
      }}>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "2px" }}>This is to certify that</p>
        <h2 style={{ fontSize: "30px", fontWeight: "900", margin: 0, color: "white", fontFamily: "Georgia, serif", textShadow: "0 2px 10px rgba(167,139,250,0.5)" }}>{userName}</h2>
      </div>

      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "12px 0" }}>has successfully mastered</p>

      {/* Skill */}
      <div style={{
        display: "inline-block", padding: "10px 36px",
        background: "white", borderRadius: "50px",
        marginBottom: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
      }}>
        <span style={{
          fontSize: "20px", fontWeight: "900",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>{skillName}</span>
      </div>

      {mentorName && (
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "0 0 16px" }}>
          under the guidance of <strong style={{ color: "#c4b5fd" }}>{mentorName}</strong>
        </p>
      )}

      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: "8px", margin: "12px 0" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#a78bfa" }} />
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f093fb" }} />
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#667eea" }} />
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        padding: "16px 20px",
        background: "rgba(0,0,0,0.2)", borderRadius: "12px",
        marginTop: "16px", border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ textAlign: "left" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", margin: 0, textTransform: "uppercase", letterSpacing: "1.5px" }}>Date issued</p>
          <p style={{ color: "white", fontSize: "13px", fontWeight: "700", margin: "3px 0 0" }}>{date}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <div style={{
            width: "54px", height: "54px", borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            border: "2px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", letterSpacing: "1px", textTransform: "uppercase" }}>Verified</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", margin: 0, textTransform: "uppercase", letterSpacing: "1.5px" }}>Issued by</p>
          <p style={{ color: "white", fontSize: "13px", fontWeight: "700", margin: "3px 0 0" }}>SwapLearnThrive</p>
        </div>
      </div>

      {isPreview && (
        <div style={{
          marginTop: "16px", padding: "12px 20px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.3)"
        }}>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: "600", margin: 0 }}>
            🌟 Sample Preview — Complete a session to earn your real certificate!
          </p>
        </div>
      )}
    </div>

    <div style={{ height: "6px", background: "linear-gradient(90deg, #667eea, #a78bfa, #f093fb, #764ba2)" }} />
  </div>
);

const Certificates = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);
  const certificateRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await apiService.getSchedules();
      if (result.data && Array.isArray(result.data)) {
        const completed = result.data.filter((s: any) => s.status === 'Completed');
        setSessions(completed);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleDownloadPDF = async (index: number, skillName: string) => {
    const element = certificateRefs.current[index];
    if (!element) return;
    setDownloading(index);
    try {
      const canvas = await html2canvas(element, {
        scale: 3, useCORS: true,
        backgroundColor: "#2d1b69", logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const yPos = (pdfHeight - imgHeight) / 2;
      pdf.addImage(imgData, 'PNG', 10, yPos, imgWidth, imgHeight);
      pdf.save(`SwapLearnThrive-Certificate-${skillName}.pdf`);
    } catch (error) {
      console.error('PDF error:', error);
    }
    setDownloading(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf4ff 100%)" }}>
      <Header isLoggedIn={true} />
      <main className="container py-8 max-w-4xl mx-auto px-4">

        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-xl transition-all hover:opacity-90"
style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", boxShadow: "0 0 20px rgba(102,126,234,0.5)" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Certificates 🏆</h1>
            <p className="text-muted-foreground">Your skill completion certificates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-3">
              <Award className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-slate-900">{sessions.length}</p>
            <p className="text-sm text-slate-500 mt-0.5">Certificates Earned</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mb-3">
              <Download className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-slate-900">{sessions.length}</p>
            <p className="text-sm text-slate-500 mt-0.5">Available Downloads</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center mb-3">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-slate-900">PDF</p>
            <p className="text-sm text-slate-500 mt-0.5">Download Format</p>
          </div>
        </div>

        {sessions.length > 0 ? (
          <div className="space-y-8">
            {sessions.map((session, i) => {
              const skillName = typeof session.skill === 'object' ? session.skill.name : session.skill;
              const mentorName = session.teacher?._id === user?._id ? session.student?.name : session.teacher?.name;
              return (
                <div key={i}>
                  <div ref={el => certificateRefs.current[i] = el}>
                    <CertificateCard
                      userName={user?.name || 'User'}
                      skillName={skillName}
                      date={new Date(session.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      mentorName={mentorName}
                    />
                  </div>
                  <button
                    onClick={() => handleDownloadPDF(i, skillName)}
                    disabled={downloading === i}
                    className="w-full mt-4 py-3 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
                    {downloading === i ? <>⏳ Generating PDF...</> : <><Download className="w-4 h-4" /> Download PDF Certificate</>}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 text-center">
              <p className="text-slate-600 font-semibold mb-1">🎓 Certificate Preview</p>
              <p className="text-slate-400 text-sm">This is how your certificate will look when you complete a session!</p>
            </div>
            <CertificateCard
              userName={user?.name || 'Your Name'}
              skillName="JavaScript"
              date={new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              mentorName="SwapLearnThrive Mentor"
              isPreview={true}
            />
            <div className="text-center">
              <button onClick={() => navigate('/schedule')}
                className="px-8 py-3 text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
                View Sessions → Earn Your Certificate! 🏆
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Certificates;