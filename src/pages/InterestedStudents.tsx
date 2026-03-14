import Header from "@/components/Header";
import { InterestedStudents as InterestedStudentsComponent } from "@/components/InterestedStudents";

const InterestedStudentsPage = () => {
  return (
    <div className="min-h-screen" style={{background: "linear-gradient(135deg, #faf5ff 0%, #eff6ff 50%, #fdf4ff 100%)"}}>
      <Header isLoggedIn={true} />

      <main className="container py-8 max-w-5xl mx-auto px-4">

        {/* Hero Banner */}
        <div className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden"
          style={{background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"}}>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }} />
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-1">Interested Students 👥</h1>
            <p className="text-white/70">Manage students who want to learn from your skills</p>
          </div>
        </div>

        <InterestedStudentsComponent />

      </main>
    </div>
  );
};

export default InterestedStudentsPage;