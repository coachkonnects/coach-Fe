import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Mail, Music, Palette, Crown, Shield, Camera, MoreHorizontal, Sparkles, ChevronLeft, Calendar, Users, TrendingUp, Award, BookOpen, Key } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

type AuthPath = 'selection' | 'student' | 'coach';

function LoginPage() {
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState<AuthPath>('selection');
  
  // Auth state
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasskeyLogin = async () => {
    if (!email || !email.includes('@')) {
      setError("Please enter your registered email address first.");
      return;
    }
    
    setError("");
    setIsLoading(true);
    try {
      const profileRes = await fetch(`/api/profile/coach?email=${email}`);
      if (!profileRes.ok) {
        throw new Error("This email is not registered. Please apply as a coach first.");
      }

      const res = await fetch("/api/passkeys/login/start");
      const options = await res.json();
      const asseResp = await startAuthentication({ optionsJSON: options });
      
      const verifyRes = await fetch("/api/passkeys/login/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asseResp)
      });

      if (!verifyRes.ok) throw new Error("Passkey login failed. Invalid passcode.");
      
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userRole', 'coach');
      navigate({ to: "/coach-dashboard" });
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with Passkey");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          throw new Error(data.error || 'Failed to send OTP');
        } catch (e) {
          throw new Error(`Server Error (${res.status})`);
        }
      }
      
      setStep('otp');
      setSuccess('Security code sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp })
      });
      
      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          throw new Error(data.error || 'Invalid OTP');
        } catch (e) {
          throw new Error(`Server Error (${res.status})`);
        }
      }
      
      setSuccess('Successfully logged in!');
      
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userRole', activePath as string);

      if (activePath === 'coach') {
        navigate({ to: '/coach-dashboard' });
      } else {
        navigate({ to: '/' });
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setStep('email');
    setOtp('');
    setError('');
    setSuccess('');
    setEmail('');
  };

  const handleBackToSelection = () => {
    setActivePath('selection');
    resetState();
  };

  // --- SELECTION VIEW ---
  if (activePath === 'selection') {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col md:flex-row overflow-hidden font-sans">
        <div 
          onClick={() => setActivePath('student')}
          className="flex-1 relative group cursor-pointer overflow-hidden flex flex-col items-center justify-center p-12 min-h-[50vh] md:min-h-screen border-b-4 md:border-b-0 md:border-r-4 border-[#FFF8F0]"
        >
          <div className="absolute inset-0 bg-[#FF7F5C] transition-transform duration-700 ease-out group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35] to-[#FF7F5C] opacity-90" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          
          <div className="relative z-10 text-center transform transition-all duration-500 group-hover:-translate-y-2">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl border border-white/30 group-hover:rotate-6 transition-all duration-500">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-md">
              I'm a Student
            </h2>
            <p className="text-white/90 text-lg font-medium max-w-xs mx-auto drop-shadow-sm">
              Ready to learn, explore, and connect with amazing coaches.
            </p>
            
            <div className="mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-2 text-white font-bold bg-white/20 w-max mx-auto px-6 py-3 rounded-full backdrop-blur-sm border border-white/30">
              Login as Student
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActivePath('coach')}
          className="flex-1 relative group cursor-pointer overflow-hidden flex flex-col items-center justify-center p-12 min-h-[50vh] md:min-h-screen"
        >
          <div className="absolute inset-0 bg-[#0f172a] transition-transform duration-700 ease-out group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900 to-teal-950 opacity-95" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
          
          <div className="relative z-10 text-center transform transition-all duration-500 group-hover:-translate-y-2">
            <div className="w-24 h-24 bg-teal-500/20 backdrop-blur-md rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl border border-teal-500/30 group-hover:-rotate-6 transition-all duration-500">
              <svg className="w-12 h-12 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-md group-hover:scale-105 transition-transform">
              I'm a Coach
            </h2>
            <p className="text-teal-200/70 text-lg font-medium max-w-xs mx-auto drop-shadow-sm mb-8">
              Manage your students, schedule classes, and grow your impact.
            </p>

            <div className="mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-2 text-white font-bold bg-teal-500/20 border border-teal-500/30 w-max mx-auto px-6 py-3 rounded-full backdrop-blur-sm group-hover:bg-emerald-500 group-hover:border-emerald-500">
              Login as Coach
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>
        </div>
        
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none hidden md:block">
          <div className="w-32 h-32 bg-white rounded-full p-3 shadow-2xl flex items-center justify-center">
            <div className="w-full h-full bg-[#FFF8F0] rounded-full border-[6px] border-[#FFF8F0] flex items-center justify-center overflow-hidden">
               <img src="/homelogo.png" alt="Logo" className="w-20 h-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- PREMIUM STUDENT LOGIN VIEW ---
  if (activePath === 'student') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFEFE0] to-[#FFD5BA] relative overflow-hidden font-sans flex flex-col lg:flex-row items-center justify-center p-4 md:p-8 pt-12 pb-40">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-[#FF7F5C]/20 to-[#FF6B35]/20 blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#F4A460]/30 to-[#B85C38]/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Floating Background Icons & Sparkles (Hidden on very small screens) */}
        <div className="hidden md:block absolute inset-0 pointer-events-none z-0">
          <Sparkles className="absolute top-[15%] left-[20%] text-[#FF6B35]/40 w-10 h-10 animate-bounce" />
          <Sparkles className="absolute top-[30%] right-[30%] text-[#F4A460]/50 w-6 h-6 animate-ping" />
          <Sparkles className="absolute bottom-[25%] left-[10%] text-[#FF7F5C]/40 w-8 h-8 animate-pulse" />
          
          {/* Subtle outlined glowing rings */}
          <div className="absolute top-[20%] left-[15%] w-32 h-32 border border-[#FF6B35]/30 rounded-full shadow-[0_0_15px_rgba(255,107,53,0.2)] animate-[spin_10s_linear_infinite]" />
          <div className="absolute bottom-[20%] right-[15%] w-48 h-48 border border-[#F4A460]/30 rounded-full shadow-[0_0_20px_rgba(244,164,96,0.2)] animate-[spin_15s_linear_infinite_reverse]" />
        </div>

        {/* Left Side: Creative Illustration Area */}
        <div className="flex-1 w-full h-full hidden lg:flex flex-col items-center justify-center relative z-10 p-10">
          <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
            {/* Main Illustration */}
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full shadow-[0_20px_50px_rgba(255,107,53,0.3)] overflow-hidden relative z-20 border-[6px] border-white">
               <img 
                 src="/student.png" 
                 alt="Student" 
                 className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" 
               />
            </div>
            
            {/* Floating Orbits with Icons */}
            <div className="absolute w-[120%] h-[120%] border border-dashed border-[#B85C38]/20 rounded-full animate-[spin_30s_linear_infinite]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center transform -rotate-12">
                <Music className="w-8 h-8 text-[#FF6B35]" />
              </div>
              <div className="absolute bottom-10 -left-4 w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center transform rotate-12">
                <Palette className="w-7 h-7 text-[#F4A460]" />
              </div>
              <div className="absolute top-1/3 -right-6 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center transform rotate-6">
                <Crown className="w-10 h-10 text-[#8B4726]" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Glassmorphic Login Card */}
        <div className="flex-1 w-full flex items-center justify-center z-10 w-full px-2 mt-4 lg:mt-0">
          <div className="w-full max-w-lg lg:max-w-xl bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/80 shadow-[0_8px_32px_rgba(44,24,16,0.1)] p-6 sm:p-10 md:p-14 relative overflow-hidden">
            
            <button 
              onClick={handleBackToSelection}
              className="absolute top-6 left-6 flex items-center gap-1 text-sm font-bold text-[#8B4726] hover:text-[#FF6B35] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            <div className="text-center mt-8 mb-8">
              <h1 className="text-3xl font-black text-[#2C1810] mb-2 tracking-tight flex items-center justify-center gap-2">
                Welcome Back! <span className="text-2xl animate-bounce">👋</span>
              </h1>
              <p className="text-sm font-bold text-[#8B4726]">Log in to continue your hobby journey</p>
            </div>

            <form className="space-y-5" onSubmit={step === 'email' ? handleRequestOtp : handleVerifyOtp}>
              {error && (
                <div className="text-[#B85C38] text-sm font-bold text-center bg-[#FF7F5C]/10 py-3 px-4 rounded-xl border border-[#FF7F5C]/20 flex items-center gap-2 justify-center">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="text-emerald-600 text-sm font-bold text-center bg-emerald-50 py-3 px-4 rounded-xl border border-emerald-200 flex items-center gap-2 justify-center">
                  {success}
                </div>
              )}

              {step === 'email' ? (
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8B4726]/50 group-focus-within:text-[#FF6B35] transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      disabled={isLoading}
                      className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-[#F4A460]/20 focus:outline-none focus:border-[#FF6B35] text-[#2C1810] transition-all font-medium placeholder:text-[#8B4726]/40 shadow-sm"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="------"
                      disabled={isLoading}
                      className="w-full px-5 py-4 bg-white/80 backdrop-blur-sm text-center tracking-widest font-mono text-3xl font-black text-[#FF6B35] rounded-2xl border-2 border-[#F4A460]/20 focus:outline-none focus:border-[#FF6B35] transition-all placeholder:text-[#8B4726]/20 shadow-sm"
                      required
                    />
                  <div className="flex justify-between items-center px-1">
                    <p className="text-sm text-[#8B4726] font-medium">
                      Code sent to <span className="font-bold text-[#2C1810]">{email}</span>
                    </p>
                    <button type="button" onClick={() => { setStep('email'); setSuccess(''); setError(''); }} className="text-[#FF6B35] hover:underline text-sm font-bold">
                      Edit
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF7F5C] hover:from-[#FF7F5C] hover:to-[#FF6B35] text-white font-bold text-lg py-4 rounded-2xl transition-all transform active:scale-95 shadow-[0_8px_20px_rgba(255,107,53,0.3)] hover:shadow-[0_12px_25px_rgba(255,107,53,0.4)] flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    {step === 'email' ? 'Continue' : 'Login'}
                    <svg className="w-5 h-5 transform group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>



              <div className="mt-8 text-center text-sm font-medium text-[#8B4726]">
                New here?{' '}
                <a href="/register" className="font-black text-[#FF6B35] hover:underline transition-colors">
                  Create an account
                </a>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Glassmorphic Toolbar */}
        <div className="fixed lg:absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] lg:w-auto max-w-4xl bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-3xl p-3 md:px-8 md:py-4 z-50 overflow-x-auto overflow-y-hidden hide-scrollbar">
          <div className="flex items-center justify-between lg:justify-center min-w-max gap-4 lg:gap-12 px-2">
            {[
              { icon: <Music className="w-5 h-5 md:w-6 md:h-6" />, label: 'Guitar' },
              { icon: <Palette className="w-5 h-5 md:w-6 md:h-6" />, label: 'Painting' },
              { icon: <Crown className="w-5 h-5 md:w-6 md:h-6" />, label: 'Chess' },
              { icon: <Shield className="w-5 h-5 md:w-6 md:h-6" />, label: 'Self Defense' },
              { icon: <Camera className="w-5 h-5 md:w-6 md:h-6" />, label: 'Photography' },
              { icon: <Music className="w-5 h-5 md:w-6 md:h-6" />, label: 'Music' },
              { icon: <MoreHorizontal className="w-5 h-5 md:w-6 md:h-6" />, label: 'More' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/50 border border-white/60 flex items-center justify-center text-[#8B4726] shadow-sm transition-all duration-300 group-hover:bg-[#FF6B35] group-hover:text-white group-hover:-translate-y-1 group-hover:shadow-[0_8px_20px_rgba(255,107,53,0.3)]">
                  {item.icon}
                </div>
                <span className="text-[10px] md:text-xs font-bold text-[#8B4726] group-hover:text-[#FF6B35] transition-colors">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- PREMIUM COACH LOGIN VIEW ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 relative overflow-hidden font-sans flex flex-col lg:flex-row items-center justify-center p-4 md:p-8 pt-12 pb-40">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-teal-500/20 to-teal-400/20 blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-300/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Floating Background Icons & Sparkles */}
      <div className="hidden md:block absolute inset-0 pointer-events-none z-0">
        <Sparkles className="absolute top-[15%] left-[20%] text-teal-300/40 w-10 h-10 animate-bounce" />
        <Sparkles className="absolute top-[30%] right-[30%] text-teal-400/50 w-6 h-6 animate-ping" />
        <Sparkles className="absolute bottom-[25%] left-[10%] text-emerald-400/40 w-8 h-8 animate-pulse" />
        
        <div className="absolute top-[20%] left-[15%] w-32 h-32 border border-teal-500/30 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.2)] animate-[spin_10s_linear_infinite]" />
        <div className="absolute bottom-[20%] right-[15%] w-48 h-48 border border-emerald-500/30 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-[spin_15s_linear_infinite_reverse]" />
      </div>

      {/* Left Side: Creative Illustration Area */}
      <div className="flex-1 w-full h-full hidden lg:flex flex-col items-center justify-center relative z-10 p-10">
        <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
          {/* Main Illustration */}
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-full shadow-[0_20px_50px_rgba(13,148,136,0.3)] overflow-hidden relative z-20 border-[6px] border-white">
             <img 
               src="/coach.png" 
               alt="Female Coach" 
               className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" 
             />
          </div>
          
          {/* Floating Orbits with Icons */}
          <div className="absolute w-[120%] h-[120%] border border-dashed border-teal-400/20 rounded-full animate-[spin_30s_linear_infinite]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center transform -rotate-12 border border-teal-300/20">
              <Users className="w-8 h-8 text-teal-300" />
            </div>
            <div className="absolute bottom-10 -left-4 w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center transform rotate-12 border border-teal-300/20">
              <TrendingUp className="w-7 h-7 text-emerald-300" />
            </div>
            <div className="absolute top-1/3 -right-6 w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center transform rotate-6 border border-teal-300/20">
              <Calendar className="w-10 h-10 text-teal-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Glassmorphic Login Card */}
      <div className="flex-1 w-full flex items-center justify-center z-10 w-full px-2 mt-4 lg:mt-0">
        <div className="w-full max-w-lg lg:max-w-xl bg-[#0f172a]/60 backdrop-blur-2xl rounded-[2.5rem] border border-teal-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-6 sm:p-10 md:p-14 relative overflow-hidden">
          
          {/* Subtle top border accent */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 to-emerald-400" />

          <button 
            onClick={handleBackToSelection}
            className="absolute top-6 left-6 flex items-center gap-1 text-sm font-bold text-teal-400/70 hover:text-teal-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className="text-center mt-8 mb-8">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center justify-center gap-2">
              Coach Portal <span className="text-2xl animate-pulse">✨</span>
            </h1>
            <p className="text-sm font-bold text-teal-200/70">Sign in to manage your students</p>
          </div>

          <form className="space-y-5" onSubmit={step === 'email' ? handleRequestOtp : handleVerifyOtp}>
            {error && (
              <div className="text-red-300 text-sm font-bold text-center bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20 flex items-center gap-2 justify-center">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-emerald-300 text-sm font-bold text-center bg-emerald-500/10 py-3 px-4 rounded-xl border border-emerald-500/20 flex items-center gap-2 justify-center">
                {success}
              </div>
            )}

            {step === 'email' ? (
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-teal-400/50 group-focus-within:text-teal-300 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-sm rounded-2xl border-2 border-teal-500/20 focus:outline-none focus:border-teal-400 text-white transition-all font-medium placeholder:text-teal-200/30 shadow-inner"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  disabled={isLoading}
                  className="w-full px-5 py-4 bg-white/5 backdrop-blur-sm text-center tracking-[1em] font-mono text-3xl font-black text-teal-300 rounded-2xl border-2 border-teal-500/20 focus:outline-none focus:border-teal-400 transition-all placeholder:text-teal-200/20 shadow-inner"
                  required
                />
                <div className="flex justify-between items-center px-1">
                  <p className="text-sm text-teal-200/60 font-medium">
                    Code sent to <span className="font-bold text-white">{email}</span>
                  </p>
                  <button type="button" onClick={() => { setStep('email'); setSuccess(''); setError(''); }} className="text-teal-400 hover:underline text-sm font-bold">
                    Edit
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-900 font-bold text-lg py-4 rounded-2xl transition-all transform active:scale-95 shadow-[0_8px_20px_rgba(20,184,166,0.2)] hover:shadow-[0_12px_25px_rgba(20,184,166,0.3)] flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  {step === 'email' ? 'Continue' : 'Secure Login'}
                  <svg className="w-5 h-5 transform group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>

            {step === 'email' && (
              <div className="mt-4">
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-teal-500/20"></div>
                  <span className="flex-shrink-0 mx-4 text-teal-200/50 text-sm font-bold">OR</span>
                  <div className="flex-grow border-t border-teal-500/20"></div>
                </div>
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isLoading || !email || !email.includes('@')}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold text-lg py-4 rounded-2xl transition-all transform active:scale-95 border-2 border-teal-500/20 hover:border-teal-400 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  <Key className="w-5 h-5 text-teal-300" />
                  Sign in with Passkey
                </button>
              </div>
            )}

            <div className="mt-8 text-center text-sm font-medium text-teal-200/60">
              New to CoachKonnects?{' '}
              <a href="/register" className="font-black text-teal-400 hover:underline transition-colors">
                Apply as a Coach
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Glassmorphic Toolbar (Coach specific icons) */}
      <div className="fixed lg:absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] lg:w-auto max-w-4xl bg-[#0f172a]/60 backdrop-blur-2xl border border-teal-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-3xl p-3 md:px-8 md:py-4 z-50 overflow-x-auto overflow-y-hidden hide-scrollbar">
        <div className="flex items-center justify-between lg:justify-center min-w-max gap-4 lg:gap-12 px-2">
          {[
            { icon: <Calendar className="w-5 h-5 md:w-6 md:h-6" />, label: 'Schedule' },
            { icon: <Users className="w-5 h-5 md:w-6 md:h-6" />, label: 'Students' },
            { icon: <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />, label: 'Analytics' },
            { icon: <Award className="w-5 h-5 md:w-6 md:h-6" />, label: 'Certificates' },
            { icon: <BookOpen className="w-5 h-5 md:w-6 md:h-6" />, label: 'Curriculum' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/5 border border-teal-500/20 flex items-center justify-center text-teal-400/80 shadow-sm transition-all duration-300 group-hover:bg-teal-500 group-hover:text-slate-900 group-hover:-translate-y-1 group-hover:shadow-[0_8px_20px_rgba(20,184,166,0.3)]">
                {item.icon}
              </div>
              <span className="text-[10px] md:text-xs font-bold text-teal-300/70 group-hover:text-teal-300 transition-colors">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


