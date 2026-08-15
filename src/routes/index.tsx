import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, MapPin, Sparkles, Star, ChevronRight, BookOpen, Users, ShieldCheck, Heart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CoachKonnects — Find Your Perfect Coach" },
      {
        name: "description",
        content: "Verified coaches near you in Mumbai & across India. Browse, connect, and enroll.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/coaches", search: { q: searchQuery } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/50 to-orange-50/30 font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate({ to: '/' })}>
             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
               <img src="/homelogo.png" alt="Logo" className="w-8 h-8" />
             </div>
             <span className="text-xl font-black text-slate-800 tracking-tight hidden sm:block">CoachKonnects</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/coaches" className="hidden sm:flex font-bold text-slate-600 hover:text-teal-600 transition-colors">
              Browse Coaches
            </Link>
            <div className="flex gap-3">
              <Link to="/login" className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm transition-colors border border-slate-200/50">
                Log In
              </Link>
              <Link to="/register" className="px-5 py-2.5 bg-gradient-to-r from-[#f26b21] to-[#ff8a4c] hover:from-[#d95d1c] hover:to-[#e67333] text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95">
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden px-4">
        {/* Background blobs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-teal-400/20 rounded-full blur-[100px] -z-10 mix-blend-multiply opacity-70"></div>
        <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-orange-400/20 rounded-full blur-[100px] -z-10 mix-blend-multiply opacity-70"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white mb-8 shadow-sm text-teal-800 font-bold text-sm animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Discover Top Local & Online Coaches</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tight mb-8 leading-[1.1] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Master your passion with the <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-500">perfect mentor.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 font-medium mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Whether you're looking to learn a new sport, master an instrument, or improve your fitness, CoachKonnects brings the best verified coaches directly to you.
          </p>

          {/* Search Bar Glassmorphic */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative group animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-orange-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative flex flex-col md:flex-row items-center bg-white/80 backdrop-blur-2xl border border-white rounded-3xl shadow-xl p-2 md:p-3 gap-3">
              
              <div className="flex-1 flex items-center px-4 w-full md:border-r border-slate-200">
                <MapPin className="w-6 h-6 text-orange-500 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Navi Mumbai & India"
                  disabled
                  className="w-full bg-transparent border-none focus:ring-0 text-slate-800 font-bold px-3 py-3 placeholder:text-slate-400 disabled:opacity-70"
                />
              </div>

              <div className="flex-1 flex items-center px-4 w-full">
                <Search className="w-6 h-6 text-teal-500 shrink-0" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search a skill or hobby..."
                  className="w-full bg-transparent border-none focus:ring-0 text-slate-800 font-bold px-3 py-3 placeholder:text-slate-400 outline-none"
                />
              </div>
              
              <button 
                type="submit"
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-[#f26b21] to-[#ff8a4c] hover:from-[#d95d1c] hover:to-[#e67333] text-white rounded-2xl font-black text-lg shadow-md transition-transform active:scale-95"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">Explore Categories</h2>
              <p className="text-slate-500 font-medium text-lg">Find the perfect coach for your favorite activities.</p>
            </div>
            <Link to="/coaches" className="hidden md:flex items-center gap-2 text-teal-600 font-bold hover:text-teal-700 transition-colors group">
              View all <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { title: 'Garba', img: '/GARBA.png', color: 'from-orange-500/20 to-rose-500/20', border: 'border-orange-100' },
              { title: 'Guitar', img: '/GUITAR.png', color: 'from-teal-500/20 to-emerald-500/20', border: 'border-teal-100' },
              { title: 'Dance', img: '/BHARATNATYAM.png', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-100' },
              { title: 'Piano', img: '/PIANO.png', color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-100' }
            ].map((cat, i) => (
              <div key={i} onClick={() => navigate({ to: '/coaches', search: { q: cat.title } })} className={`cursor-pointer group relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${cat.color} backdrop-blur-xl border ${cat.border} aspect-square flex flex-col items-center justify-center p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2`}>
                <div className="absolute inset-0 bg-white/40 group-hover:bg-transparent transition-colors duration-300"></div>
                <img src={cat.img} alt={cat.title} className="w-24 h-24 object-contain relative z-10 mb-4 group-hover:scale-110 transition-transform duration-500" />
                <h3 className="text-xl font-black text-slate-800 relative z-10">{cat.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white/40 backdrop-blur-3xl border-y border-white/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-6">Why Choose CoachKonnects?</h2>
            <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">We've built the most secure, seamless platform for students and coaches to connect and grow together.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-xl hover:shadow-2xl transition-all group">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-8 h-8 text-teal-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-4">Verified Coaches</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Every coach undergoes a manual verification process by our admin team to ensure quality and safety.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-xl hover:shadow-2xl transition-all group">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-4">Zero Booking Fees</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Connect directly via WhatsApp and pay the coach directly. We don't take a cut of your learning journey.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-xl hover:shadow-2xl transition-all group">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-4">Secure & Private</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Your data is safe with us. We use Passkey integrations and strict DPDP compliant moderation protocols.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-orange-500/20 mix-blend-overlay"></div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 relative z-10">Ready to start your journey?</h2>
          <p className="text-slate-300 font-medium text-lg md:text-xl max-w-2xl mx-auto mb-10 relative z-10">Join thousands of students and expert coaches already learning and growing on CoachKonnects.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Link to="/register-student" className="px-8 py-4 bg-[#f26b21] hover:bg-[#d95d1c] text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 transition-all active:scale-95">
              I am a Student
            </Link>
            <Link to="/register-coach" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-2xl font-black text-lg border border-white/10 transition-all active:scale-95">
              I am a Coach
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 bg-white/50 backdrop-blur-md py-12 px-4 text-center">
        <p className="text-slate-500 font-bold">© 2026 CoachKonnects. All rights reserved.</p>
      </footer>
    </div>
  );
}
