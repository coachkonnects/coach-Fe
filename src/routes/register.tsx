import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
});

function RegisterPage() {
  const [role, setRole] = useState<'student' | 'coach'>('student');
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    mobile: '',
    dob: '',
    district: '',
    state: '',
    pincode: '',
    area: '',
    location: ''
  });

  const [isLocating, setIsLocating] = useState(false);

  const fallbackToIpLocation = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data && data.city) {
        setFormData(prev => ({ ...prev, district: data.city, state: data.region || '' }));
      } else {
        alert("Location detection failed. Please enter manually.");
      }
    } catch (e) {
      console.error("IP fallback failed", e);
      alert("Location detection failed. Please enter manually.");
    }
    setIsLocating(false);
  };

  const handlePincodeChange = async (pincode: string) => {
    setFormData(prev => ({ ...prev, pincode }));
    if (pincode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (data && data[0].Status === "Success") {
          const po = data[0].PostOffice[0];
          setFormData(prev => ({
            ...prev,
            pincode,
            area: po.Name,
            district: po.District,
            state: po.State
          }));
        }
      } catch (e) { console.error("Pincode fetch failed", e); }
    }
  };

  const handleDetectLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
          const data = await res.json();
          if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state_district || data.address.suburb || '';
            const state = data.address.state || '';
            const postcode = data.address.postcode || '';
            
            if (postcode) {
              handlePincodeChange(postcode); // Auto-trigger the pincode API for standardisation
              setIsLocating(false);
            } else if (city || state) {
              setFormData(prev => ({ ...prev, district: city, state: state }));
              setIsLocating(false);
            } else {
              fallbackToIpLocation();
            }
          } else {
             fallbackToIpLocation();
          }
        } catch (e) {
          console.error("Nominatim error", e);
          fallbackToIpLocation();
        }
      }, (err) => {
        fallbackToIpLocation();
      });
    } else {
      fallbackToIpLocation();
    }
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 3 && val.length <= 4) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    } else if (val.length > 4) {
      val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4, 8);
    }
    setFormData(prev => ({ ...prev, dob: val }));
  };

  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);

  const handleSendOtp = async () => {
    if (!formData.email) return alert("Please enter an email first");
    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      if (res.ok) {
        setOtpSent(true);
        alert("OTP sent to your email!");
      }
    } catch (err) {
      console.error(err);
    }
    setIsVerifying(false);
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) return alert("Please enter the OTP");
    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: otpCode })
      });
      if (res.ok) {
        setOtpSent(false);
        setEmailVerified(true);
      } else {
        alert("Invalid OTP! Try again.");
      }
    } catch (err) {
      console.error(err);
    }
    setIsVerifying(false);
  };

  const handleSubmitProfile = async () => {
    if (!emailVerified) return alert("Please verify your email first!");
    if (!formData.fullName) return alert("Please enter your name!");
    
    try {
      const res = await fetch(`/api/profile/${role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          mobile: formData.mobile,
          dob: formData.dob,
          district: formData.district,
          state: formData.state,
          pincode: formData.pincode,
          area: formData.area,
          location: formData.location
        })
      });
      if (res.ok) {
        alert(`Success! Your ${role} profile has been submitted and is Pending Admin Approval!`);
      } else {
        const err = await res.text();
        alert("Failed to save: " + err);
      }
    } catch(e) {
      console.error(e);
      alert("Error connecting to server");
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] font-[var(--font-sans)] text-slate-900 flex flex-col items-center py-12 px-4 relative overflow-hidden">
      {/* Background Glow Effects for Light Glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-400/20 blur-[150px] pointer-events-none" />

      <div className="flex items-center gap-3 mb-10 relative z-10">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/30">C</div>
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          CoachKonnects {role === 'coach' ? 'for Coaches' : ''}
        </span>
      </div>

      <div className="w-full max-w-2xl bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white p-8 sm:p-12 relative z-10">

        {role === 'student' ? (
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create your account</h1>
            <p className="text-slate-500 text-sm mb-6">Start your learning journey today</p>

            <div className="flex p-1 bg-white/80 rounded-full w-max border border-slate-100 backdrop-blur-md shadow-sm">
              <button
                onClick={() => setRole('student')}
                className="px-6 py-2 text-sm font-bold bg-white text-slate-900 rounded-full shadow-sm"
              >
                I'm A Student
              </button>
              <button
                onClick={() => setRole('coach')}
                className="px-6 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 rounded-full transition-colors"
              >
                I'm A Coach
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-10">
            <button onClick={() => setRole('student')} className="text-gray-400 text-sm font-medium hover:text-gray-700 flex items-center gap-1 mb-6 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              I'm a student instead
            </button>

            <div className="flex gap-2 mb-2">
              <div className="h-1.5 flex-1 bg-[#f26b21] rounded-full"></div>
              <div className="h-1.5 flex-1 bg-gray-100 rounded-full"></div>
              <div className="h-1.5 flex-1 bg-gray-100 rounded-full"></div>
              <div className="h-1.5 flex-1 bg-gray-100 rounded-full"></div>
              <div className="h-1.5 flex-1 bg-gray-100 rounded-full"></div>
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-8 px-1">
              <span className="text-gray-900">Basics</span>
              <span>Expertise</span>
              <span>Class Details</span>
              <span>Schedule</span>
              <span>Media</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight">Step 1: Basics</h1>
          </div>
        )}

        <form className="space-y-6" onSubmit={e => e.preventDefault()}>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  disabled={emailVerified}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/80 border border-slate-200 rounded-2xl focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all disabled:opacity-50 text-slate-900 placeholder-slate-400 shadow-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={emailVerified || isVerifying || otpSent}
                className={`px-6 py-3.5 border rounded-2xl font-bold transition-colors whitespace-nowrap shadow-sm ${emailVerified
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {emailVerified ? 'Verified ✓' : otpSent ? 'OTP Sent' : isVerifying ? 'Sending...' : 'Verify email'}
              </button>
            </div>
          </div>

          {/* OTP Input Box (Only shows after sending OTP) */}
          {otpSent && !emailVerified && (
            <div className="space-y-2 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
              <label className="text-sm font-medium text-gray-700">Enter OTP sent to your email</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#f26b21] focus:ring-1 focus:ring-[#f26b21] font-mono tracking-widest text-center text-lg"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isVerifying || otpCode.length !== 6}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  Confirm OTP
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full name <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Aarav Mehta"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f26b21] focus:ring-1 focus:ring-[#f26b21] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mobile <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.mobile}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="9876543210"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f26b21] focus:ring-1 focus:ring-[#f26b21] transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="text"
                  value={formData.dob}
                  onChange={handleDobChange}
                  maxLength={10}
                  placeholder="dd/mm/yyyy"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f26b21] focus:ring-1 focus:ring-[#f26b21] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pincode <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, ''))}
                  placeholder="400001"
                  className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f26b21] focus:ring-1 focus:ring-[#f26b21] transition-all font-mono"
                />
              </div>
              <p className="text-xs text-gray-400">Type 6 digits to auto-fill District & State!</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Area</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.area}
                  onChange={e => setFormData({ ...formData, area: e.target.value })}
                  placeholder="Andheri West"
                  className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f26b21] focus:ring-1 focus:ring-[#f26b21] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">District</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.district}
                  onChange={e => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Mumbai"
                  className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f26b21] focus:ring-1 focus:ring-[#f26b21] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">State</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Maharashtra"
                  className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f26b21] focus:ring-1 focus:ring-[#f26b21] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Specific Location / Landmark</label>
            <div className="relative">
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Near Train Station"
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f26b21] focus:ring-1 focus:ring-[#f26b21] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-2 pl-4 bg-violet-50/50 border border-violet-100 rounded-2xl mt-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-violet-700 text-sm font-medium">
              <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Auto-detect your location
            </div>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="px-6 py-2 bg-white border border-violet-200 rounded-xl text-violet-700 text-sm font-bold hover:bg-violet-50 shadow-sm transition-colors disabled:opacity-50"
            >
              {isLocating ? 'Detecting...' : 'Detect'}
            </button>
          </div>

          <div className="flex justify-between items-center pt-8 mt-4">
            <button type="button" className="px-8 py-3.5 bg-white border border-slate-200 rounded-full text-slate-500 font-bold hover:text-slate-900 shadow-sm transition-colors">
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmitProfile}
              className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-full font-bold shadow-[0_8px_20px_rgba(124,58,237,0.3)] transition-all flex items-center gap-2"
            >
              Continue
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
