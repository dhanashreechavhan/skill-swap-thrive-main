import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import { Award, ArrowLeft, Download, Calendar, Star } from "lucide-react";

const Certificates = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDownload = (session: any) => {
    const skillName = typeof session.skill === 'object' ? session.skill.name : session.skill;
    const date = new Date(session.date).toLocaleDateString();
    const userName = user?.name || 'User';

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Georgia, serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f8f0ff; }
          .certificate { background: white; width: 800px; padding: 60px; text-align: center; border: 8px double #764ba2; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
          .logo { font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 20px; }
          .title { font-size: 48px; color: #764ba2; margin: 20px 0; font-style: italic; }
          .subtitle { font-size: 18px; color: #666; margin-bottom: 30px; }
          .name { font-size: 36px; color: #333; font-weight: bold; border-bottom: 2px solid #764ba2; padding-bottom: 10px; margin: 20px auto; width: fit-content; }
          .skill { font-size: 28px; color: #667eea; font-weight: bold; margin: 20px 0; }
          .date { font-size: 16px; color: #888; margin-top: 30px; }
          .stamp { font-size: 60px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="logo">🎓 SwapLearnThrive</div>
          <div class="title">Certificate of Completion</div>
          <div class="subtitle">This is to certify that</div>
          <div class="name">${userName}</div>
          <div class="subtitle">has successfully completed the skill</div>
          <div class="skill">${skillName}</div>
          <div class="stamp">🏆</div>
          <div class="date">Completed on: ${date}</div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${skillName}-${date}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf4ff 100%)" }}>
      <Header isLoggedIn={true} />
      <main className="container py-8 max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900">My Certificates 🏆</h1>
            <p className="text-slate-500">Your skill completion certificates</p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
              🏆
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900">{sessions.length}</p>
              <p className="text-slate-500">Certificates Earned</p>
            </div>
          </div>
        </div>

        {/* Certificates Grid */}
        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((session, i) => {
              const skillName = typeof session.skill === 'object' ? session.skill.name : session.skill;
              const partner = session.teacher?._id === user?._id ? session.student?.name : session.teacher?.name;
              return (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                  <div className="h-3" style={{ background: "linear-gradient(90deg, #667eea, #764ba2, #f093fb)" }} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ background: "linear-gradient(135deg, #faf5ff, #eff6ff)" }}>
                        🎓
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        ✅ Completed
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">{skillName}</h3>
                    <p className="text-sm text-slate-500 mb-4">with {partner || 'Partner'}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(session.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        SwapLearnThrive
                      </span>
                    </div>
                    <button onClick={() => handleDownload(session)}
                      className="w-full py-2.5 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                      style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
                      <Download className="w-4 h-4" /> Download Certificate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No Certificates Yet!</h3>
            <p className="text-slate-500 mb-6">Complete your sessions to earn certificates!</p>
            <button onClick={() => navigate('/schedule')}
              className="px-6 py-3 text-white font-semibold rounded-2xl"
              style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
              View Sessions
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Certificates;