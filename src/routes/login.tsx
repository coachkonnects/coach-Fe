import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { Mail, Music, Palette, Crown, Shield, Camera, MoreHorizontal, Sparkles, ChevronLeft, Calendar, Users, TrendingUp, Award, BookOpen, Key } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

type AuthPath = 'selection' | 'student' | 'coach';

function LoginPage() {
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState<AuthPath>('selection');

  // Interactive Spinner State & Logic
  const spinnerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const isDragging = useRef(false);
  const prevAngle = useRef(0);
  const lastTime = useRef(0);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      if (isDragging.current) return;

      let currentVelocity = velocity;
      let currentRotation = rotation;

      const step = () => {
        if (isDragging.current) return;

        if (Math.abs(currentVelocity) > 0.05) {
          currentRotation += currentVelocity;
          currentVelocity *= 0.97; // friction
          setRotation(currentRotation);
          requestRef.current = requestAnimationFrame(step);
        } else {
          // Snap back to upright (nearest multiple of 360)
          const targetRotation = Math.round(currentRotation / 360) * 360;
          const diff = targetRotation - currentRotation;
          if (Math.abs(diff) > 0.1) {
            currentRotation += diff * 0.15; // snap strength
            setRotation(currentRotation);
            requestRef.current = requestAnimationFrame(step);
          } else {
            setRotation(targetRotation);
            setVelocity(0);
          }
        }
      };

      requestRef.current = requestAnimationFrame(step);
    };

    if (!isDragging.current && (Math.abs(velocity) > 0.05 || rotation % 360 !== 0)) {
      requestRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [velocity]);

  const getAngle = (clientX: number, clientY: number) => {
    if (!spinnerRef.current) return 0;
    const rect = spinnerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    prevAngle.current = getAngle(e.clientX, e.clientY);
    lastTime.current = Date.now();
    setVelocity(0);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const currentAngle = getAngle(e.clientX, e.clientY);
    const currentTime = Date.now();
    const dt = Math.max(1, currentTime - lastTime.current);

    let angleDiff = currentAngle - prevAngle.current;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

    const angleDiffDegrees = (angleDiff * 180) / Math.PI;
    const newVelocity = angleDiffDegrees / (dt / 16);

    setRotation((prev) => prev + angleDiffDegrees);
    setVelocity(newVelocity);

    prevAngle.current = currentAngle;
    lastTime.current = currentTime;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (Math.abs(velocity) > 0.05) {
      const animate = () => {
        if (!isDragging.current && Math.abs(velocity) > 0.05) {
          setRotation((prev) => prev + velocity);
          setVelocity((prev) => prev * 0.97);
          requestRef.current = requestAnimationFrame(animate);
        }
      };
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const handleDoubleClick = () => {
    navigate({ to: '/' });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type === 'student' || type === 'coach') {
      setActivePath(type as AuthPath);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token) {
      navigate({ to: role === 'coach' ? '/coach-dashboard' : '/student-dashboard' });
    }
  }, [navigate]);

  // Auth state
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handlePasskeyLogin = async () => {
    if (!email || !email.includes('@')) {
      setError("Please enter your registered email address first.");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const roleStr = activePath as string;

      const res = await fetch("/api/passkeys/login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const optionsRaw = await res.json();
      const options = optionsRaw.publicKey ?? optionsRaw;
      const asseResp = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch("/api/passkeys/login/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, response: asseResp })
      });

      if (!verifyRes.ok) throw new Error("Passkey login failed. Invalid passcode.");

      const data = await verifyRes.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.email || email);

      if (data.role && data.role.toLowerCase() !== roleStr.toLowerCase()) {
        throw new Error(`This email is registered as a ${data.role}, not a ${roleStr}.`);
      }
      localStorage.setItem('userRole', roleStr);
      // Clear admin sessions to prevent mix-ups
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminEmail");

      navigate({ to: `/${roleStr}-dashboard` });
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
        body: JSON.stringify({ email, intendedRole: activePath.toUpperCase() })
      });

      if (!res.ok) {
        const text = await res.text();
        let errorMessage = `Server Error (${res.status})`;
        try {
          const data = JSON.parse(text);
          if (data.error) errorMessage = data.error;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      setStep('otp');
      setCountdown(30);
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

      const data = await res.json();
      setSuccess('Successfully logged in!');

      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userRole', activePath as string);
      // Clear admin sessions to prevent mix-ups
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminEmail");

      if (activePath === 'coach') {
        navigate({ to: '/coach-dashboard' });
      } else if (activePath === 'student') {
        navigate({ to: '/student-dashboard' });
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
          className="flex-1 relative group cursor-pointer overflow-hidden flex flex-col items-center justify-center p-6 py-10 md:p-12 min-h-[50vh] md:min-h-screen border-b-4 md:border-b-0 md:border-r-4 border-[#FFF8F0]"
        >
          <div className="absolute inset-0 bg-[#FF7F5C] transition-transform duration-700 ease-out group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35] to-[#FF7F5C] opacity-90" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />

          <div className="relative z-10 text-center transform transition-all duration-500 group-hover:-translate-y-2 flex flex-col items-center">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-white/20 backdrop-blur-md rounded-3xl mx-auto mb-4 md:mb-8 flex items-center justify-center shadow-2xl border border-white/30 group-hover:rotate-6 transition-all duration-500">
              <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-2 md:mb-4 tracking-tight drop-shadow-md">
              I'm a Student
            </h2>
            <p className="text-white/90 text-sm md:text-lg font-medium max-w-xs mx-auto drop-shadow-sm hidden sm:block">
              Ready to learn, explore, and connect with amazing coaches.
            </p>

            <div className="mt-6 md:mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-2 text-white font-bold bg-white/20 w-max mx-auto px-6 py-3 rounded-full backdrop-blur-sm border border-white/30">
              Login as Student
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActivePath('coach')}
          className="flex-1 relative group cursor-pointer overflow-hidden flex flex-col items-center justify-center p-6 py-10 pb-24 md:p-12 min-h-[50vh] md:min-h-screen"
        >
          <div className="absolute inset-0 bg-[#0f172a] transition-transform duration-700 ease-out group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900 to-teal-950 opacity-95" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />

          <div className="relative z-10 text-center transform transition-all duration-500 group-hover:-translate-y-2 flex flex-col items-center">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-teal-500/20 backdrop-blur-md rounded-3xl mx-auto mb-4 md:mb-8 flex items-center justify-center shadow-2xl border border-teal-500/30 group-hover:-rotate-6 transition-all duration-500">
              <svg className="w-8 h-8 md:w-12 md:h-12 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-2 md:mb-4 tracking-tight drop-shadow-md group-hover:scale-105 transition-transform">
              I'm a Coach
            </h2>
            <p className="text-teal-200/70 text-sm md:text-lg font-medium max-w-xs mx-auto drop-shadow-sm mb-4 md:mb-8 hidden sm:block">
              Manage your students, schedule classes, and grow your impact.
            </p>

            <div className="mt-6 md:mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-2 text-white font-bold bg-teal-500/20 border border-teal-500/30 w-max mx-auto px-6 py-3 rounded-full backdrop-blur-sm group-hover:bg-emerald-500 group-hover:border-emerald-500">
              Login as Coach
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto">
          <div className="hover:scale-105 transition-transform duration-300 select-none">
            <div 
              ref={spinnerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onDoubleClick={handleDoubleClick}
              style={{ transform: `rotate(${rotation}deg)` }}
              className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-white rounded-full p-1.5 sm:p-2 md:p-3 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            >
              <div className="w-full h-full bg-[#FFF8F0] rounded-full border-[3px] sm:border-[4px] md:border-[6px] border-[#FFF8F0] flex items-center justify-center overflow-hidden pointer-events-none">
                <img src="/homelogo.png" alt="Logo" className="w-14 sm:w-16 md:w-20 h-auto object-contain select-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Register link */}
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-30 w-[85%] sm:w-[90%] max-w-xs sm:max-w-sm">
          <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-2xl border border-white/50 text-xs sm:text-sm md:text-base font-bold text-[#2C1810] text-center w-full">
            Don't have an account?{' '}
            <a href="/register" className="text-[#FF6B35] hover:text-[#B85C38] transition-colors ml-1 inline-block">
              Register
            </a>
          </div>
        </div>
      </div>
    );
  }

  // --- PREMIUM STUDENT LOGIN VIEW ---
  if (activePath === 'student') {
    return (
      <div className="h-screen lg:min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFEFE0] to-[#FFD5BA] relative overflow-hidden font-sans flex flex-col lg:flex-row items-center justify-center p-3 lg:p-8 pt-4 pb-28 lg:pt-12 lg:pb-40">
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
        <div className="w-full lg:flex-1 flex flex-col items-center justify-center relative z-10 p-2 lg:p-10 mt-1 lg:mt-0 shrink-0">
          <div className="relative w-full max-w-[280px] sm:max-w-lg lg:aspect-square flex items-center justify-center">
            {/* Main Illustration */}
            <div className="w-24 h-24 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full shadow-[0_20px_50px_rgba(255,107,53,0.3)] overflow-hidden relative z-20 border-[4px] sm:border-[6px] border-white">
              <img
                src="/student.png"
                alt="Student"
                className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
              />
            </div>

            {/* Floating Orbits with Icons */}
            <div className="hidden sm:block absolute w-[120%] h-[120%] border border-dashed border-[#B85C38]/20 rounded-full animate-[spin_30s_linear_infinite]">
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
        <div className="w-full lg:flex-1 flex items-center justify-center z-10 px-2 mt-2 lg:mt-0 min-h-0">
          <div className="w-full max-w-lg lg:max-w-xl bg-white/60 backdrop-blur-2xl rounded-[1.8rem] lg:rounded-[2.5rem] border border-white/80 shadow-[0_8px_32px_rgba(44,24,16,0.1)] p-4 pb-20 sm:p-10 md:p-14 relative overflow-hidden">

            <button
              onClick={handleBackToSelection}
              className="absolute top-4 left-4 lg:top-6 lg:left-6 flex items-center gap-1 text-xs lg:text-sm font-bold text-[#8B4726] hover:text-[#FF6B35] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
              Back
            </button>

            <div className="text-center mt-4 lg:mt-8 mb-4 lg:mb-8">
              <h1 className="text-2xl lg:text-3xl font-black text-[#2C1810] mb-1 lg:mb-2 tracking-tight flex items-center justify-center gap-2">
                Welcome Back! <span className="text-xl lg:text-2xl animate-bounce">👋</span>
              </h1>
              <p className="text-xs lg:text-sm font-bold text-[#8B4726]">Log in to continue your hobby journey</p>
            </div>

            <form className="space-y-3.5 lg:space-y-5" onSubmit={step === 'email' ? handleRequestOtp : handleVerifyOtp}>
              {error && (
                <div className="text-[#B85C38] text-xs lg:text-sm font-bold text-center bg-[#FF7F5C]/10 py-2.5 px-4 rounded-xl border border-[#FF7F5C]/20 flex items-center gap-2 justify-center">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-emerald-600 text-xs lg:text-sm font-bold text-center bg-emerald-50 py-2.5 px-4 rounded-xl border border-emerald-200 flex items-center gap-2 justify-center">
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
                      className="w-full pl-10 lg:pl-12 pr-4 py-2.5 lg:py-4 bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl border-2 border-[#F4A460]/20 focus:outline-none focus:border-[#FF6B35] text-[#2C1810] transition-all font-medium placeholder:text-[#8B4726]/40 shadow-sm text-sm lg:text-base"
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
                    className="w-full px-5 py-2.5 lg:py-4 bg-white/80 backdrop-blur-sm text-center tracking-widest font-mono text-2xl lg:text-3xl font-black text-[#FF6B35] rounded-xl lg:rounded-2xl border-2 border-[#F4A460]/20 focus:outline-none focus:border-[#FF6B35] transition-all placeholder:text-[#8B4726]/20 shadow-sm"
                    required
                  />
                  <div className="flex justify-between items-center px-1">
                    <p className="text-xs text-[#8B4726] font-medium">
                      Code sent to <span className="font-bold text-[#2C1810]">{email}</span>
                    </p>
                    <div className="flex items-center space-x-3">
                      <button type="button" onClick={() => { setStep('email'); setSuccess(''); setError(''); }} className="text-[#FF6B35] hover:underline text-xs lg:text-sm font-bold">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={countdown > 0 || isLoading}
                        className="text-[#FF6B35] disabled:text-[#8B4726]/40 hover:underline text-xs lg:text-sm font-bold transition-all"
                      >
                        {countdown > 0 ? `Resend (${countdown}s)` : 'Resend'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF7F5C] hover:from-[#FF7F5C] hover:to-[#FF6B35] text-white font-bold text-base lg:text-lg py-2.5 lg:py-4 rounded-xl lg:rounded-2xl transition-all transform active:scale-95 shadow-[0_8px_20px_rgba(255,107,53,0.3)] hover:shadow-[0_12px_25px_rgba(255,107,53,0.4)] flex items-center justify-center gap-2 lg:gap-3 group disabled:opacity-70 disabled:cursor-not-allowed mt-1 lg:mt-2"
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

              {/* Social Media Icons */}
              <div className="mt-5 flex flex-col items-center gap-2">
                <p className="text-[11px] text-[#8B4726]/50 font-semibold uppercase tracking-widest">Follow us on</p>
                <div className="flex items-center gap-3">
                  <a href="https://whatsapp.com/channel/0029VbBrjCH3LdQYRqt5AI29" target="_blank" rel="noopener noreferrer" title="WhatsApp"
                    className="w-8 h-8 rounded-full bg-white/60 border border-white/80 shadow-sm flex items-center justify-center text-[#8B4726]/60 hover:bg-[#25D366] hover:text-white hover:scale-110 transition-all duration-200">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  </a>
                  <a href="https://www.facebook.com/CoachKonnects" target="_blank" rel="noopener noreferrer" title="Facebook"
                    className="w-8 h-8 rounded-full bg-white/60 border border-white/80 shadow-sm flex items-center justify-center text-[#8B4726]/60 hover:bg-[#1877F2] hover:text-white hover:scale-110 transition-all duration-200">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="https://www.instagram.com/coachkonnects/" target="_blank" rel="noopener noreferrer" title="Instagram"
                    className="w-8 h-8 rounded-full bg-white/60 border border-white/80 shadow-sm flex items-center justify-center text-[#8B4726]/60 hover:bg-[#E4405F] hover:text-white hover:scale-110 transition-all duration-200">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                  <a href="https://www.youtube.com/@CoachKonnects" target="_blank" rel="noopener noreferrer" title="YouTube"
                    className="w-8 h-8 rounded-full bg-white/60 border border-white/80 shadow-sm flex items-center justify-center text-[#8B4726]/60 hover:bg-[#FF0000] hover:text-white hover:scale-110 transition-all duration-200">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.872.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                </div>
              </div>

              {step === 'email' && (
                <div className="mt-2.5 lg:mt-4">
                  <div className="relative flex items-center py-1.5 lg:py-2">
                    <div className="flex-grow border-t border-[#F4A460]/30"></div>
                    <span className="flex-shrink-0 mx-4 text-[#8B4726]/50 text-xs lg:text-sm font-bold">OR</span>
                    <div className="flex-grow border-t border-[#F4A460]/30"></div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    disabled={isLoading || !email || !email.includes('@')}
                    className="w-full bg-white hover:bg-[#FFF8F0] text-[#2C1810] font-bold text-base lg:text-lg py-2.5 lg:py-4 rounded-xl lg:rounded-2xl transition-all transform active:scale-95 border-2 border-[#F4A460]/20 hover:border-[#FF6B35] flex items-center justify-center gap-2 lg:gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-1 lg:mt-2"
                  >
                    <Key className="w-5 h-5 text-[#FF6B35]" />
                    Sign in with Passkey
                  </button>
                </div>
              )}

              <div className="mt-4 lg:mt-8 text-center text-xs lg:text-sm font-medium text-[#8B4726]">
                New here?{' '}
                <a href="/register-student" className="font-black text-[#FF6B35] hover:underline transition-colors">
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
              <div key={i} className={`flex-col items-center gap-2 cursor-pointer group ${i >= 4 ? 'hidden md:flex' : 'flex'}`}>
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
    <div className="h-screen lg:min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 relative overflow-hidden font-sans flex flex-col lg:flex-row items-center justify-center p-3 lg:p-8 pt-4 pb-28 lg:pt-12 lg:pb-40">
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
      <div className="w-full lg:flex-1 flex flex-col items-center justify-center relative z-10 p-2 lg:p-10 mt-1 lg:mt-0 shrink-0">
        <div className="relative w-full max-w-[280px] sm:max-w-lg lg:aspect-square flex items-center justify-center">
          {/* Main Illustration */}
          <div className="w-24 h-24 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full shadow-[0_20px_50px_rgba(13,148,136,0.3)] overflow-hidden relative z-20 border-[4px] sm:border-[6px] border-white">
            <img
              src="/coach.png"
              alt="Coaches"
              className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
            />
          </div>

          {/* Floating Orbits with Icons */}
          <div className="hidden sm:block absolute w-[120%] h-[120%] border border-dashed border-teal-400/20 rounded-full animate-[spin_30s_linear_infinite]">
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
      <div className="w-full lg:flex-1 flex items-center justify-center z-10 px-2 mt-2 lg:mt-0 min-h-0">
        <div className="w-full max-w-lg lg:max-w-xl bg-[#0f172a]/60 backdrop-blur-2xl rounded-[1.8rem] lg:rounded-[2.5rem] border border-teal-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-4 pb-20 sm:p-10 md:p-14 relative overflow-hidden">

          {/* Subtle top border accent */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 to-emerald-400" />

          <button
            onClick={handleBackToSelection}
            className="absolute top-4 left-4 lg:top-6 lg:left-6 flex items-center gap-1 text-xs lg:text-sm font-bold text-teal-400/70 hover:text-teal-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
            Back
          </button>

          <div className="text-center mt-4 lg:mt-8 mb-4 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-black text-white mb-1 lg:mb-2 tracking-tight flex items-center justify-center gap-2">
              Coach Portal <span className="text-xl lg:text-2xl animate-pulse">✨</span>
            </h1>
            <p className="text-xs lg:text-sm font-bold text-teal-200/70">Sign in to manage your students</p>
          </div>

          <form className="space-y-3.5 lg:space-y-5" onSubmit={step === 'email' ? handleRequestOtp : handleVerifyOtp}>
            {error && (
              <div className="text-red-300 text-xs lg:text-sm font-bold text-center bg-red-500/10 py-2.5 px-4 rounded-xl border border-red-500/20 flex items-center gap-2 justify-center">
                {error}
              </div>
            )}

            {success && (
              <div className="text-emerald-300 text-xs lg:text-sm font-bold text-center bg-emerald-500/10 py-2.5 px-4 rounded-xl border border-emerald-500/20 flex items-center gap-2 justify-center">
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
                    className="w-full pl-10 lg:pl-12 pr-4 py-2.5 lg:py-4 bg-white/5 backdrop-blur-sm rounded-xl lg:rounded-2xl border-2 border-teal-500/20 focus:outline-none focus:border-teal-400 text-white transition-all font-medium placeholder:text-teal-200/30 shadow-inner text-sm lg:text-base"
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
                  className="w-full px-5 py-2.5 lg:py-4 bg-white/5 backdrop-blur-sm text-center tracking-[1em] font-mono text-2xl lg:text-3xl font-black text-teal-300 rounded-xl lg:rounded-2xl border-2 border-teal-500/20 focus:outline-none focus:border-teal-400 transition-all placeholder:text-teal-200/20 shadow-inner"
                  required
                />
                <div className="flex justify-between items-center px-1">
                  <p className="text-xs text-teal-200/60 font-medium">
                    Code sent to <span className="font-bold text-white">{email}</span>
                  </p>
                  <div className="flex items-center space-x-3">
                    <button type="button" onClick={() => { setStep('email'); setSuccess(''); setError(''); }} className="text-teal-400 hover:underline text-xs lg:text-sm font-bold">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={countdown > 0 || isLoading}
                      className="text-teal-400 disabled:text-teal-200/30 hover:underline text-xs lg:text-sm font-bold transition-all"
                    >
                      {countdown > 0 ? `Resend (${countdown}s)` : 'Resend'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-900 font-bold text-base lg:text-lg py-2.5 lg:py-4 rounded-xl lg:rounded-2xl transition-all transform active:scale-95 shadow-[0_8px_20px_rgba(20,184,166,0.2)] hover:shadow-[0_12px_25px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2 lg:gap-3 group disabled:opacity-70 disabled:cursor-not-allowed mt-1 lg:mt-2"
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
              <div className="mt-2.5 lg:mt-4">
                <div className="relative flex items-center py-1.5 lg:py-2">
                  <div className="flex-grow border-t border-teal-500/20"></div>
                  <span className="flex-shrink-0 mx-4 text-teal-200/50 text-xs lg:text-sm font-bold">OR</span>
                  <div className="flex-grow border-t border-teal-500/20"></div>
                </div>
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isLoading || !email || !email.includes('@')}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold text-base lg:text-lg py-2.5 lg:py-4 rounded-xl lg:rounded-2xl transition-all transform active:scale-95 border-2 border-teal-500/20 hover:border-teal-400 flex items-center justify-center gap-2 lg:gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-1 lg:mt-2"
                >
                  <Key className="w-5 h-5 text-teal-300" />
                  Sign in with Passkey
                </button>
              </div>
            )}

            <div className="mt-4 lg:mt-8 text-center text-xs lg:text-sm font-medium text-teal-200/60">
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
            <div key={i} className={`flex-col items-center gap-2 cursor-pointer group ${i >= 4 ? 'hidden md:flex' : 'flex'}`}>
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


