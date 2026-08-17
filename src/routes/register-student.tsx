import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/register-student')({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    mobile: '',
    dob: '',
    parentalConsent: false,
    parentName: '',
    parentContact: '',
    gender: '',
    district: '',
    state: '',
    pincode: '',
    area: '',
    location: '',
    interests: '',
    preference: '',
    heardFrom: ''
  });

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


  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');

    if (val.length >= 2) {
      let day = parseInt(val.substring(0, 2));
      if (day > 31) val = '31' + val.substring(2);
      if (day === 0) val = '01' + val.substring(2);
    }
    if (val.length >= 4) {
      let month = parseInt(val.substring(2, 4));
      if (month > 12) val = val.substring(0, 2) + '12' + val.substring(4);
      if (month === 0) val = val.substring(0, 2) + '01' + val.substring(4);
    }

    if (val.length >= 3 && val.length <= 4) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    } else if (val.length > 4) {
      val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4, 8);
    }
    setFormData(prev => ({ ...prev, dob: val }));
  };

  const [isVerifying, setIsVerifying] = useState(false);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [nameError, setNameError] = useState('');
  const [interestsError, setInterestsError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [otpCode, setOtpCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const calculateAge = (dobString: string) => {
    if (!dobString || dobString.length < 10) return 99;
    const parts = dobString.split('/');
    if (parts.length !== 3) return 99;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const dob = new Date(year, month, day);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const isUnder18 = calculateAge(formData.dob) < 18;

  const fetchBlockedWords = async () => {
    try {
      const res = await fetch('/api/config/blocked-words');
      if (res.ok) setBlockedWords(await res.json());
    } catch(e) {}
  };

  useEffect(() => {
    fetchBlockedWords();
  }, []);

  const validateNoBlockedWords = (text: string): string | null => {
    for (const word of blockedWords) {
      if (text.includes(word)) {
        return `The word "${word}" is not allowed.`;
      }
    }
    return null;
  };

  const handleSendOtp = async () => {
    if (!formData.email) return alert("Please enter an email first");
    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, intendedRole: "STUDENT" })
      });
      if (res.ok) {
        setOtpSent(true);
        setCountdown(30);
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
        const data = await res.json();
        setAuthToken(data.token || data.session_token);
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
    if (nameError || interestsError) return alert("Please remove blocked words before submitting.");
    if (!formData.mobile || formData.mobile.length < 10) return alert("Please enter a valid 10-digit mobile number!");
    if (!formData.dob) return alert("Please enter your Date of Birth!");
    if (!formData.gender) return alert("Please select your Gender!");
    if (!formData.pincode) return alert("Please enter your Pincode!");
    if (!formData.interests) return alert("Please select your Interests/Subjects!");
    if (!formData.preference) return alert("Please select your Learning Preference!");
    
    if (isUnder18 && (!formData.parentalConsent || !formData.parentName || !formData.parentContact)) {
      alert("Parental consent and details are required for students under 18.");
      return;
    }

    try {
      const res = await fetch(`/api/profile/student`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert(`Success! Your Student profile has been submitted and is Pending Admin Approval!`);
        navigate({ to: '/' });
      } else {
        const err = await res.text();
        alert("Failed to save: " + err);
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to server");
    }
  };

  const handleResetForm = () => {
    setFormData({ email: '', fullName: '', mobile: '', dob: '', parentalConsent: false, parentName: '', parentContact: '', gender: '', district: '', state: '', pincode: '', area: '', location: '', heardFrom: '', interests: '', preference: '' });
    setOtpSent(false);
    setEmailVerified(false);
    setOtpCode('');
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] font-sans text-slate-900 flex flex-col items-center py-12 px-4 relative overflow-hidden">
      {/* Background Glow Effects (Orange & Teal) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/20 blur-[150px] pointer-events-none" />

      {/* Logo */}
      <div className="mb-10 relative z-10 flex flex-col items-center">
        <a href="/" className="inline-block mb-2 hover:scale-105 transition-transform">
          <img src="/homelogo.png" alt="CoachKonnects" className="h-12 w-auto" />
        </a>
      </div>

      <div className="w-full max-w-2xl bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white p-8 sm:p-12 relative z-10">

        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-slate-900">Student Registration</h1>
          <p className="text-slate-500 text-base mb-8">Start your learning journey today</p>
        </div>

        <form className="space-y-6" onSubmit={e => e.preventDefault()}>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Email Address <span className="text-orange-500">*</span></label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="hello@example.com"
                  disabled={emailVerified}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/60 border border-slate-200/50 backdrop-blur-sm rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all disabled:opacity-50 text-slate-900 placeholder-slate-400 shadow-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={emailVerified || isVerifying || otpSent}
                className={`px-6 py-3.5 border rounded-2xl font-bold transition-all whitespace-nowrap shadow-sm ${emailVerified
                  ? 'bg-teal-50 border-teal-200 text-teal-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-orange-500 hover:text-orange-600'
                  }`}
              >
                {emailVerified ? 'Verified ✓' : otpSent ? 'OTP Sent' : isVerifying ? 'Sending...' : 'Verify email'}
              </button>
            </div>
          </div>

          {/* OTP Input Box */}
          {otpSent && !emailVerified && (
            <div className="space-y-3 p-5 bg-orange-50 border border-orange-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-bold text-orange-900">Enter the 6-digit code sent to your email</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="flex-1 px-4 py-3 bg-white border border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono tracking-widest text-center text-xl font-bold shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isVerifying || otpCode.length !== 6}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold shadow-md disabled:opacity-50 transition-all"
                >
                  Confirm
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <button 
                  type="button" 
                  onClick={handleSendOtp} 
                  disabled={countdown > 0 || isVerifying}
                  className="text-sm text-orange-600 font-bold hover:underline disabled:opacity-50 disabled:hover:no-underline"
                >
                  {countdown > 0 ? `Resend (${countdown}s)` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Full Name <span className="text-orange-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => {
                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                    setFormData({ ...formData, fullName: val });
                    setNameError(validateNoBlockedWords(val) || '');
                  }}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/60 border border-slate-200/50 backdrop-blur-sm rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Mobile Number <span className="text-orange-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.mobile}
                  onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                  placeholder="9876543210"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/60 border border-slate-200/50 backdrop-blur-sm rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-mono shadow-sm placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Date of Birth <span className="text-orange-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="text"
                  value={formData.dob}
                  onChange={handleDobChange}
                  maxLength={10}
                  placeholder="DD/MM/YYYY"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Gender <span className="text-orange-500">*</span></label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm text-slate-700"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Pincode <span className="text-orange-500">*</span></label>
              <input
                type="text"
                maxLength={6}
                value={formData.pincode}
                onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, ''))}
                placeholder="400001"
                className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 backdrop-blur-sm rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-mono shadow-sm placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-500 ml-1 font-medium">Type 6 digits to auto-fill District & State!</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Area</label>
              <input
                type="text"
                value={formData.area}
                onChange={e => setFormData({ ...formData, area: e.target.value })}
                placeholder="e.g. Andheri West"
                className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 backdrop-blur-sm rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">District / City</label>
              <input
                type="text"
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
                placeholder="e.g. Mumbai"
                className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 backdrop-blur-sm rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Maharashtra"
                className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 backdrop-blur-sm rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Specific Location / Landmark</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Near Train Station"
              className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 backdrop-blur-sm rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Interests / Subjects <span className="text-orange-500">*</span></label>
              <input
                type="text"
                value={formData.interests}
                onChange={e => {
                    const val = e.target.value;
                    setFormData({ ...formData, interests: val });
                    setInterestsError(validateNoBlockedWords(val) || '');
                  }}
                placeholder="e.g. Photography, Yoga, Guitar"
                className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Learning Preference <span className="text-orange-500">*</span></label>
              <select
                value={formData.preference}
                onChange={e => setFormData({ ...formData, preference: e.target.value })}
                className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm text-slate-700"
              >
                <option value="">Select Mode</option>
                <option value="Online">Online</option>
                <option value="In-person">In-person</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <label className="text-sm font-bold text-slate-700 ml-1">Where did you hear about us?</label>
            <input
              type="text"
              value={formData.heardFrom}
              onChange={e => setFormData({ ...formData, heardFrom: e.target.value })}
              placeholder="e.g. Google, Friend, Social Media"
              className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm placeholder:text-slate-400"
            />
          </div>



              <div className="flex justify-between items-center pt-8 mt-4 border-t border-slate-100">
                <button type="button" onClick={handleResetForm} className="px-8 py-4 bg-white/60 border border-slate-200/50 backdrop-blur-sm rounded-2xl text-slate-500 font-bold hover:text-slate-900 hover:border-slate-300 shadow-sm transition-colors">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitProfile}
                  className="px-10 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-2xl font-bold shadow-md transition-all flex items-center gap-2 group active:scale-[0.98]"
                >
                  Submit Student Profile
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>

        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-500">
            Already have an account? <a href="/login" className="text-teal-600 font-bold hover:text-teal-700 hover:underline transition-colors ml-1">Sign in</a>
          </div>
          <div className="text-sm font-medium bg-orange-50 px-4 py-2 rounded-xl text-orange-900 border border-orange-100">
            Want to teach? <a href="/register-coach" className="text-orange-600 font-bold hover:underline transition-colors ml-1">Register as a Coach</a>
          </div>
        </div>
      </div>
    </div>
  );
}
