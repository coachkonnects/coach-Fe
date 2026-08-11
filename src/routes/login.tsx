import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<'student' | 'coach'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          throw new Error(`Server Error (${res.status}): Please check the backend terminal for logs.`);
        }
      }
      
      const data = await res.json();
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
          throw new Error(`Server Error (${res.status}): Please check the backend terminal for logs.`);
        }
      }
      
      const data = await res.json();
      setSuccess('Successfully logged in!');    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 selection:bg-[#f26b21] selection:text-white">      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-center px-16 text-white shadow-2xl">        <div className="absolute inset-0 bg-gradient-to-br from-[#f26b21] via-[#d95914] to-[#f98246] animate-gradient-xy"></div>        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative max-w-lg z-10">
          <div className="flex items-center gap-3 mb-16 group">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl shadow-lg border border-white/20 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform duration-300">C</div>
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">CoachKonnects</span>
          </div>
          
          <h1 className="text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
            Your growth journey starts with the right coach.
          </h1>
        </div>
        
        <div className="absolute bottom-8 left-16 text-sm text-white/60 font-medium z-10">
          © CoachKonnects 2026
        </div>
      </div>      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24 relative z-10">
        <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-10 transform transition-all hover:shadow-3xl hover:-translate-y-1 duration-500">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-gray-900">Welcome back</h2>
            <p className="text-gray-500 font-medium">Sign in securely to continue your journey</p>
          </div>          <div className="flex p-1.5 bg-gray-100/80 backdrop-blur-md rounded-2xl mb-8 shadow-inner">
            <button
              onClick={() => setRole('student')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                role === 'student' ? 'bg-white text-[#f26b21] shadow-md scale-[1.02]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Student / Parent
            </button>
            <button
              onClick={() => setRole('coach')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                role === 'coach' ? 'bg-white text-[#f26b21] shadow-md scale-[1.02]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Coach
            </button>
          </div>          <div className="mb-8 p-4 bg-orange-50/80 backdrop-blur-md border border-orange-200/50 rounded-2xl text-sm text-orange-900 flex gap-3 items-start shadow-sm transition-all duration-300 hover:bg-orange-50">
            <svg className="w-5 h-5 text-[#f26b21] shrink-0 mt-0.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="leading-relaxed">
              <strong className="font-bold text-[#f26b21]">Secure Login Only.</strong> Passwords have been permanently removed. All logins now use a highly secure One-Time Password sent to your email.
            </div>
          </div>

          <form className="space-y-6" onSubmit={step === 'email' ? handleRequestOtp : handleVerifyOtp}>            {error && <div className="text-red-500 text-sm font-medium text-center bg-red-50 py-2 rounded-lg border border-red-100">{error}</div>}
            {success && <div className="text-green-600 text-sm font-medium text-center bg-green-50 py-2 rounded-lg border border-green-100">{success}</div>}

            {step === 'email' ? (
              <div className="space-y-2 group">
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 ml-1">
                  Email <span className="text-[#f26b21]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="w-full px-5 py-4 bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-transparent focus:outline-none focus:bg-white focus:border-[#f26b21] focus:ring-4 focus:ring-[#f26b21]/10 transition-all duration-300 shadow-sm hover:shadow-md"
                    required
                  />
                  <div className="absolute inset-0 rounded-2xl border border-gray-200 pointer-events-none group-focus-within:border-transparent transition-colors"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <label htmlFor="otp" className="block text-sm font-bold text-gray-700 ml-1">
                  6-Digit Security Code <span className="text-[#f26b21]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    disabled={isLoading}
                    className="w-full px-5 py-4 bg-white/50 backdrop-blur-sm text-center tracking-[1em] font-mono text-2xl font-bold rounded-2xl border-2 border-transparent focus:outline-none focus:bg-white focus:border-[#f26b21] focus:ring-4 focus:ring-[#f26b21]/10 transition-all duration-300 shadow-sm hover:shadow-md"
                    required
                  />
                  <div className="absolute inset-0 rounded-2xl border border-gray-200 pointer-events-none focus-within:border-transparent transition-colors"></div>
                </div>
                <p className="text-sm text-gray-500 text-center mt-4 font-medium">
                  Code sent to <strong className="text-gray-900">{email}</strong>. <button type="button" onClick={() => { setStep('email'); setSuccess(''); setError(''); }} className="text-[#f26b21] hover:text-[#d95914] hover:underline transition-colors ml-1">Change email</button>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#f26b21] to-[#f98246] hover:from-[#d95914] hover:to-[#f26b21] text-white font-bold text-lg py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-[#f26b21]/30 hover:shadow-xl hover:shadow-[#f26b21]/40 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : (step === 'email' ? 'Send Security Code' : 'Secure Sign In')}
              {!isLoading && (
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </button>
          </form>

          <div className="mt-10 text-center text-sm font-medium text-gray-500">
            No account? <a href="/register" className="text-[#f26b21] font-bold hover:text-[#d95914] hover:underline transition-colors ml-1">Create one</a>
          </div>
        </div>
      </div>
    </div>
  );
}
