import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { User, Mail, Calendar, MapPin, AlertCircle, CheckCircle, Info, Edit3, Heart, Target, Sparkles, ChevronRight, BookOpen, Key, X } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';

export const Route = createFileRoute('/student-dashboard')({
  component: StudentDashboard,
});

function StudentDashboard() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Passkey State
  const [passkeyStatus, setPasskeyStatus] = useState<"SUCCESS" | "ERROR" | null>(
    localStorage.getItem("hasPasskeyRegistered") === "true" ? "SUCCESS" : null
  );
  const [passkeyMessage, setPasskeyMessage] = useState(
    localStorage.getItem("hasPasskeyRegistered") === "true" ? "Passkey active for secure login!" : ""
  );

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showParentOtpModal, setShowParentOtpModal] = useState(false);
  const [parentOtp, setParentOtp] = useState("");
  const [isVerifyingParentOtp, setIsVerifyingParentOtp] = useState(false);
  const [parentResendCountdown, setParentResendCountdown] = useState(30);

  useEffect(() => {
    let timer: any;
    if (showParentOtpModal && parentResendCountdown > 0) {
      timer = setInterval(() => setParentResendCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showParentOtpModal, parentResendCountdown]);
  const isProfileIncomplete = profile && (!profile.dateOfBirth || !profile.interests || !profile.district);

  const handleFindCoachClick = () => {
    if (isProfileIncomplete) {
      alert("Please complete your profile details (DOB, Interests, Location) before finding a coach.");
      setIsEditing(true);
    } else {
      navigate({ to: '/coaches' });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      navigate({ to: '/login' });
      return;
    }

    let isNewProfile = false;
    try {
      const res = await fetch(`/api/profile/student/me?email=${email}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 404 || errorData.error === 'Student profile not found.' || res.status === 400) {
          setProfile(null);
          setEditForm({});
          isNewProfile = true;
          // Don't throw, let them see the dashboard but with a warning
        } else {
          throw new Error(errorData.error || 'Failed to fetch profile');
        }
      } else {
        const data = await res.json();
        setProfile(data.profile);
        setEditForm(data.profile);
        if (!data.profile || data.profile.id === null) {
          isNewProfile = true;
        }
      }

      try {
        const enqRes = await fetch(`/api/enquiries/student?email=${email}`);
        if (enqRes.ok) {
          const enqData = await enqRes.json();
          setEnquiries(enqData);
          if (enqData.length > 0) {
            const latestEnq = enqData[enqData.length - 1];
            setEditForm((prev: any) => ({
              ...prev,
              fullName: prev?.fullName || latestEnq.leadName || '',
              area: prev?.area || latestEnq.leadLocation || '',
              location: prev?.location || latestEnq.leadLocation || ''
            }));
            setProfile((prev: any) => ({
              ...prev,
              fullName: prev?.fullName || latestEnq.leadName || '',
              area: prev?.area || latestEnq.leadLocation || '',
              location: prev?.location || latestEnq.leadLocation || ''
            }));
          }
        }
      } catch (e) {
        console.error("Failed to fetch enquiries");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleSetupPasskey = async () => {
    setPasskeyStatus(null);
    setPasskeyMessage("");
    try {
      const email = localStorage.getItem('userEmail');
      const startRes = await fetch(`/api/passkeys/register/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!startRes.ok) throw new Error("Failed to start passkey registration");
      const options = await startRes.json();

      const asseResp = await startRegistration({ optionsJSON: options });

      const finishRes = await fetch(`/api/passkeys/register/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asseResp)
      });
      if (!finishRes.ok) throw new Error("Failed to finish passkey registration");
      setPasskeyStatus("SUCCESS");
      setPasskeyMessage("Passkey active for secure login!");
      localStorage.setItem("hasPasskeyRegistered", "true");
    } catch (err: any) {
      setPasskeyStatus("ERROR");
      setPasskeyMessage(err.message || "Passkey registration failed.");
    }
  };


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

  const isUnder18 = calculateAge(editForm.dob || editForm.dateOfBirth) < 18;

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
    setEditForm((prev: any) => ({ ...prev, dob: val, dateOfBirth: val }));
  };

  const handlePincodeChange = async (pincode: string) => {
    setEditForm((prev: any) => ({ ...prev, pincode }));
    if (pincode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (data && data[0].Status === "Success") {
          const po = data[0].PostOffice[0];
          setEditForm((prev: any) => ({
            ...prev,
            area: po.Name,
            district: po.District,
            state: po.State
          }));
        } else {
          alert("Invalid Pincode! Please enter a valid 6-digit Indian pincode.");
          setEditForm((prev: any) => ({ ...prev, area: '', district: '', state: '' }));
        }
      } catch (e) {
        console.error("Pincode fetch failed", e);
        setEditForm((prev: any) => ({ ...prev, area: '', district: '', state: '' }));
      }
    } else {
      setEditForm((prev: any) => ({ ...prev, area: '', district: '', state: '' }));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm.mobile && (!/^[6-9]/.test(editForm.mobile) || editForm.mobile.length !== 10)) {
      return alert("Mobile number must be exactly 10 digits and start with 6, 7, 8, or 9!");
    }
    if (editForm.interests && editForm.interests.trim().split(/\s+/).length > 250) {
      return alert("Interests section must not exceed 250 words!");
    }
    if (isUnder18) {
      if (!editForm.parentalConsent || !editForm.parentName || !editForm.parentContact || !editForm.parentEmail) {
        alert("Parental consent and all parent details (Name, Contact, Email) are required for students under 18.");
        return;
      }
      if (editForm.parentContact.length !== 10) {
        alert("Parent contact number must be exactly 10 digits.");
        return;
      }
      const validDomains = ['@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com', '@icloud.com'];
      if (!validDomains.some((domain: string) => editForm.parentEmail.toLowerCase().endsWith(domain))) {
        alert("Please use a valid popular email provider (gmail, yahoo, outlook, etc.) for the parent's email.");
        return;
      }
      if (editForm.parentEmail.toLowerCase() === localStorage.getItem('userEmail')?.toLowerCase()) {
        alert("Student and parent cannot use the same email address.");
        return;
      }
    }
    setIsSaving(true);
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch(`/api/profile/student/me?email=${email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to update profile");
      }
      
      await fetchProfile();
      setIsEditing(false);
      
      if (isUnder18) {
        setShowParentOtpModal(true);
      } else {
        alert("Profile updated successfully!");
      }
    } catch (err: any) {
      alert(err.message || "Error saving profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendParentOtp = async () => {
    try {
      const res = await fetch('/api/profile/resend-parent-otp', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        setParentResendCountdown(30);
        alert("OTP resent successfully!");
      } else {
        alert("Failed to resend OTP.");
      }
    } catch (e) {
      alert("Error resending OTP.");
    }
  };

  const handleVerifyParentOtp = async () => {
    if (!parentOtp) return alert("Please enter the OTP.");
    setIsVerifyingParentOtp(true);
    try {
      const res = await fetch('/api/profile/verify-parent-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ otp: parentOtp })
      });
      if (res.ok) {
        alert("Parental consent verified!");
        setShowParentOtpModal(false);
        await fetchProfile();
      } else {
        const err = await res.json();
        alert(err.error || "Invalid OTP!");
      }
    } catch (e) {
      alert("Error verifying OTP.");
    }
    setIsVerifyingParentOtp(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-orange-50/30 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full"></div>

        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 transform transition-all">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </div>
              <h3 className="text-2xl font-black text-center text-slate-800 mb-2">Homework Done?</h3>
              <p className="text-center text-slate-500 mb-8">Finished learning for the day, or just procrastinating? Are you sure you want to log out?</p>
              <div className="flex gap-4">
                <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-6 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Back to Learning</button>
                <button onClick={() => { localStorage.clear(); setShowLogoutModal(false); navigate({ to: '/' }); }} className="flex-1 px-6 py-3 font-bold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-all">Yes, Log out</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-orange-50/30 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-[2rem] shadow-2xl max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">Oops!</h2>
          <p className="text-slate-600 mb-6">{error || 'Profile not found'}</p>
          <button onClick={() => navigate({ to: '/login' })} className="px-6 py-3 bg-teal-500 text-white rounded-xl font-bold hover:bg-teal-600 transition-colors w-full">
            Back to Login
          </button>
        </div>

        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 transform transition-all">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </div>
              <h3 className="text-2xl font-black text-center text-slate-800 mb-2">Homework Done?</h3>
              <p className="text-center text-slate-500 mb-8">Finished learning for the day, or just procrastinating? Are you sure you want to log out?</p>
              <div className="flex gap-4">
                <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-6 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Back to Learning</button>
                <button onClick={() => { localStorage.clear(); setShowLogoutModal(false); navigate({ to: '/' }); }} className="flex-1 px-6 py-3 font-bold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-all">Yes, Log out</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }



  const getStatusDisplay = (status: string, reason?: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 text-emerald-800 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
            <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <h3 className="text-lg font-black text-emerald-900 mb-1">Profile Approved</h3>
              <p className="text-sm font-medium">Your profile is active. You can now enroll in classes and contact coaches!</p>
            </div>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-800 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
            <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-black text-red-900 mb-1">Action Required: Profile Rejected</h3>
              <p className="text-sm font-medium mb-3">Your profile requires updates before it can be approved.</p>
              {reason && (
                <div className="bg-white/60 p-4 rounded-xl text-sm border border-red-100 font-medium shadow-inner">
                  <span className="font-bold text-red-900">Reason:</span> {reason}
                </div>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
              >
                <Edit3 className="w-4 h-4" /> Update Profile
              </button>
            </div>
          </div>
        );
      case 'REQUEST_CHANGE':
        return (
          <div className="bg-orange-50/80 backdrop-blur-sm border border-orange-200 text-orange-800 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
            <Info className="w-8 h-8 text-orange-500 shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-black text-orange-900 mb-1">Changes Requested</h3>
              <p className="text-sm font-medium mb-3">An admin has flagged your profile for review.</p>
              {reason && (
                <div className="bg-white/60 p-4 rounded-xl text-sm border border-orange-100 font-medium shadow-inner">
                  <span className="font-bold text-orange-900">Note:</span> {reason}
                </div>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 text-blue-800 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
            <Info className="w-8 h-8 text-blue-500 shrink-0" />
            <div>
              <h3 className="text-lg font-black text-blue-900 mb-1">Profile Under Review</h3>
              <p className="text-sm font-medium">We are reviewing your profile. We'll notify you once it's approved.</p>
            </div>

            {showLogoutModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 transform transition-all">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </div>
                  <h3 className="text-2xl font-black text-center text-slate-800 mb-2">Homework Done?</h3>
                  <p className="text-center text-slate-500 mb-8">Finished learning for the day, or just procrastinating? Are you sure you want to log out?</p>
                  <div className="flex gap-4">
                    <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-6 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Back to Learning</button>
                    <button onClick={() => { localStorage.clear(); setShowLogoutModal(false); navigate({ to: '/' }); }} className="flex-1 px-6 py-3 font-bold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-all">Yes, Log out</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-orange-50/30 font-sans pb-24 relative">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
              <img src="/homelogo.png" alt="Logo" className="w-8 h-8" />
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tight hidden sm:block">CoachKonnects</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleFindCoachClick}
              className="hidden sm:flex px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl font-bold text-sm transition-colors items-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> Browse Coaches
            </button>
            <button onClick={handleLogout} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors border border-slate-200/50">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {!profile && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4">
            <div>
              <h3 className="text-orange-800 font-black text-xl mb-1">Complete Your Profile</h3>
              <p className="text-orange-700/80 font-medium">Please fill all the details for a better experience and to gain full access to your dashboard features.</p>
            </div>

          </div>
        )}

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-3">
              Hello, {profile?.fullName ? profile.fullName.split(' ')[0] : 'Student'} <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
            </h1>
            <p className="text-slate-500 font-medium text-lg">Welcome to CoachKonnects</p>
          </div>

          <button
            onClick={handleFindCoachClick}
            className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-2xl font-bold shadow-md transition-all flex items-center gap-2 group active:scale-[0.98] sm:hidden w-full justify-center"
          >
            Find a Coach <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Status Alert */}
        <div className="mb-10">
          {isProfileIncomplete && !isEditing && (
            <div className="mb-4 bg-orange-100 border border-orange-300 text-orange-800 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Your profile is incomplete. Please fill in your DOB, Interests, and Location before you can contact coaches.</span>
              </div>
              <button onClick={() => { setEditForm({ ...profile, mobile: profile?.user?.phoneNumber || profile?.mobile }); setIsEditing(true); }} className="ml-4 whitespace-nowrap bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm">Complete Now</button>
            </div>
          )}
          {profile && getStatusDisplay(profile.status, profile.rejectReason)}

          {profile?.parentalConsent && (
            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold shadow-sm ${profile.parentConsentVerified
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
              {profile.parentConsentVerified ? (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Parental Consent: Verified</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Parental Consent: Pending Email Verification</>
              )}
            </div>
          )}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-xl p-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/10 to-orange-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>

              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-800">My Profile</h2>
                <button
                  onClick={() => { setEditForm({ ...profile, mobile: profile?.user?.phoneNumber || profile?.mobile }); setIsEditing(true); }}
                  className="p-2 bg-slate-50 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                    <p className="text-slate-800 font-bold">{profile?.fullName || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</p>
                    <p className="text-slate-800 font-bold">{profile?.user?.email || localStorage.getItem('userEmail')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile Number</p>
                    <p className="text-slate-800 font-bold">{profile?.user?.phoneNumber || profile?.mobile || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date of Birth</p>
                    <p className="text-slate-800 font-bold">{profile?.dateOfBirth || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gender</p>
                    <p className="text-slate-800 font-bold">{profile?.gender || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</p>
                    <p className="text-slate-800 font-bold">
                      {[profile?.location, profile?.area, profile?.district, profile?.state].filter(Boolean).join(', ') || 'Not provided'}
                      {profile?.pincode ? ` - ${profile.pincode}` : ''}
                    </p>
                  </div>
                </div>

                {profile?.parentalConsent && (
                  <>
                    <div className="w-full h-px bg-slate-100 my-2"></div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parent / Guardian</p>
                        <p className="text-slate-800 font-bold">{profile?.parentName || 'Not provided'}</p>
                        <p className="text-slate-500 text-sm font-medium">{profile?.parentEmail} • {profile?.parentContact}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Interests & Preferences Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-xl p-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <h2 className="text-xl font-black text-slate-800 mb-6">Learning Profile</h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-slate-700 font-bold mb-2">
                    <Heart className="w-5 h-5 text-rose-500" /> Interests
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile?.interests ? profile.interests.split(',').map((interest: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-rose-50 text-rose-700 rounded-lg text-sm font-bold border border-rose-100">
                        {interest.trim()}
                      </span>
                    )) : (
                      <span className="text-slate-400 text-sm italic font-medium">None specified</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-slate-700 font-bold mb-2">
                    <Target className="w-5 h-5 text-indigo-500" /> Preference
                  </div>
                  <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold border border-indigo-100">
                    {profile?.preference || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Main Content Area + Passkey */}
          <div className="lg:col-span-2 space-y-8">

            {/* Passkey Card (Premium Green vs Blue) */}
            <div className={`backdrop-blur-xl border rounded-[2rem] shadow-xl p-8 relative overflow-hidden transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-6 ${passkeyStatus === 'SUCCESS' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 text-white'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 ${passkeyStatus === 'SUCCESS' ? 'bg-white/20' : 'bg-white/10'}`}>
                  <Key className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black mb-1">
                    {passkeyStatus === 'SUCCESS' ? 'Passkey Registered' : 'Setup Passkey'}
                  </h3>
                  <p className="text-white/80 font-medium text-sm max-w-md">
                    {passkeyStatus === 'SUCCESS'
                      ? 'You can now log in instantly using FaceID, TouchID, or Windows Hello without needing an OTP.'
                      : 'Set up Passkeys (FaceID, TouchID) for faster, more secure login without OTP.'}
                  </p>
                  {passkeyMessage && passkeyStatus === 'ERROR' && (
                    <p className="text-red-200 text-sm mt-2 font-bold bg-black/20 p-2 rounded-lg inline-block">{passkeyMessage}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSetupPasskey}
                disabled={passkeyStatus === 'SUCCESS'}
                className={`px-6 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 shrink-0 ${passkeyStatus === 'SUCCESS'
                  ? 'bg-white/20 text-white cursor-default'
                  : 'bg-white text-blue-600 hover:bg-blue-50 cursor-pointer hover:shadow-xl'
                  }`}
              >
                {passkeyStatus === 'SUCCESS' ? 'Active' : 'Register Passkey'}
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-xl p-8 relative overflow-hidden h-full min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2"><BookOpen className="w-6 h-6 text-teal-500" /> My Classes & Enquiries</h3>
                {enquiries.length > 0 && (
                  <button
                    onClick={handleFindCoachClick}
                    className="px-4 py-2 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-xl font-bold text-sm transition-colors flex items-center gap-1"
                  >
                    Find More <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {enquiries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-12 h-12 text-teal-300" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">No Classes Yet</h4>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                    You haven't enrolled or enquired about any classes yet. Browse our coaches to get started!
                  </p>
                  <button
                    onClick={handleFindCoachClick}
                    className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/20 transition-all flex items-center gap-2 group hover:-translate-y-1"
                  >
                    Browse Coaches Directory <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 max-h-[350px]">
                  {enquiries.map((enq: any) => (
                    <div key={enq.id} className="p-5 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                      <img src={enq.coach?.profileImageUrl || '/homelogo.png'} alt="Coach" className="w-16 h-16 rounded-xl object-cover" />
                      <div className="flex-1 text-left">
                        <h4 className="text-lg font-bold text-slate-800">{enq.coach?.fullName}</h4>
                        <p className="text-sm text-slate-500 line-clamp-1 mb-2">{enq.message}</p>
                        <div className="flex flex-col gap-3 mt-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${enq.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                              enq.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                              {enq.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                              {new Date(enq.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {enq.status === 'APPROVED' && (
                            <div className="flex items-center gap-2 mt-1">
                              {enq.coach?.user?.phoneNumber && (
                                <a
                                  href={`https://wa.me/${enq.coach.user.phoneNumber.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                >
                                  WhatsApp
                                </a>
                              )}
                              {enq.coach?.user?.email && (
                                <a
                                  href={`mailto:${enq.coach.user.email}`}
                                  className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm border border-slate-200"
                                >
                                  Email Coach
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Premium Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => !isSaving && setIsEditing(false)}></div>

          {/* Modal Content */}
          <div className="relative bg-white/90 backdrop-blur-2xl border border-white/80 w-full max-w-3xl rounded-[2.5rem] shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => !isSaving && setIsEditing(false)}
              className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-3xl font-black text-slate-800 mb-2">Edit Profile</h2>
            <p className="text-slate-500 mb-8 font-medium">Update your student information below.</p>

            <form onSubmit={handleSaveProfile} className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.fullName || ''}
                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Date of Birth</label>
                  <input
                    type="text"
                    value={editForm.dob || editForm.dateOfBirth || ''}
                    onChange={handleDobChange}
                    maxLength={10}
                    placeholder="DD/MM/YYYY"
                    className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Mobile Number</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editForm.mobile || editForm.user?.phoneNumber || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setEditForm({ ...editForm, mobile: val });
                    }}
                    placeholder="e.g. 9876543210"
                    className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Gender</label>
                  <select
                    value={editForm.gender || ''}
                    onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Pincode</label>
                  <input
                    type="text"
                    value={editForm.pincode || ''}
                    maxLength={6}
                    onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, ''))}
                    placeholder="400001"
                    className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-1">
                  <label className="text-sm font-bold text-slate-700 ml-1">State</label>
                  <input
                    type="text"
                    value={editForm.state || ''}
                    onChange={e => setEditForm({ ...editForm, state: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <label className="text-sm font-bold text-slate-700 ml-1">District / City</label>
                  <input
                    type="text"
                    value={editForm.district || ''}
                    onChange={e => setEditForm({ ...editForm, district: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <label className="text-sm font-bold text-slate-700 ml-1">Area</label>
                  <input
                    type="text"
                    value={editForm.area || ''}
                    onChange={e => setEditForm({ ...editForm, area: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Interests</label>
                  <input
                    type="text"
                    value={editForm.interests || ''}
                    onChange={e => setEditForm({ ...editForm, interests: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Learning Preference</label>
                  <select
                    value={editForm.preference || ''}
                    onChange={e => setEditForm({ ...editForm, preference: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                  >
                    <option value="">Select Mode</option>
                    <option value="Online">Online</option>
                    <option value="In-person">In-person</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>


              {/* Age Gate: Parental Consent */}
              {isUnder18 && (
                <div className="p-6 bg-orange-50/50 border border-orange-200/50 rounded-2xl space-y-6">
                  <div className="mb-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                      <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Parent / Guardian Information
                    </h3>
                    <p className="text-slate-500 text-sm mt-1 ml-7">Looks like someone is still under 18! Time to bring in the adults (😎).</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-7 mb-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Name</label>
                      <input
                        type="text"
                        value={editForm.parentName || ''}
                        onChange={e => setEditForm({ ...editForm, parentName: e.target.value })}
                        placeholder="Full Name"
                        className="w-full px-5 py-3 bg-white/60 border border-slate-200/50 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Contact Number</label>
                      <input
                        type="tel"
                        maxLength={10}
                        value={editForm.parentContact || ''}
                        onChange={e => setEditForm({ ...editForm, parentContact: e.target.value.replace(/\D/g, '').substring(0, 10) })}
                        placeholder="Mobile Number"
                        className="w-full px-5 py-3 bg-white/60 border border-slate-200/50 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                      <input
                        type="email"
                        value={editForm.parentEmail || ''}
                        onChange={e => setEditForm({ ...editForm, parentEmail: e.target.value })}
                        placeholder="Email Address"
                        className="w-full px-5 py-3 bg-white/60 border border-slate-200/50 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 ml-7">
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        id="parentalConsent"
                        checked={editForm.parentalConsent || false}
                        onChange={e => setEditForm({ ...editForm, parentalConsent: e.target.checked })}
                        className="w-5 h-5 text-orange-500 rounded border-orange-300 focus:ring-orange-500"
                      />
                    </div>
                    <label htmlFor="parentalConsent" className="text-sm font-bold text-slate-700 leading-relaxed">
                      I am the parent/guardian of {editForm.fullName || 'this student'} and I consent to their registration on CoachKonnects.
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-6 border-t border-slate-100 gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => !isSaving && setIsEditing(false)}
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-70 flex items-center gap-2"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 transform transition-all">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </div>
            <h3 className="text-2xl font-black text-center text-slate-800 mb-2">Homework Done?</h3>
            <p className="text-center text-slate-500 mb-8">Finished learning for the day, or just procrastinating? Are you sure you want to log out?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-6 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Back to Learning</button>
              <button onClick={() => { localStorage.clear(); setShowLogoutModal(false); navigate({ to: '/' }); }} className="flex-1 px-6 py-3 font-bold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-all">Yes, Log out</button>
            </div>
          </div>
        </div>
      )}
      {/* Parent OTP Modal */}
      {showParentOtpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 transform transition-all">
            <h3 className="text-2xl font-black text-center text-slate-800 mb-2">Parental Consent Required</h3>
            <p className="text-center text-slate-500 mb-6">We just sent a 6-digit OTP to your parent's email address. Please enter it below to verify their consent.</p>
            <input
              type="text"
              maxLength={6}
              value={parentOtp}
              onChange={(e) => setParentOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit OTP"
              className="w-full text-center text-2xl tracking-[0.5em] px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none transition-all mb-6 font-mono font-bold"
            />
            <button
              onClick={handleVerifyParentOtp}
              disabled={isVerifyingParentOtp || parentOtp.length !== 6}
              className="w-full py-4 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isVerifyingParentOtp ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Verifying...</>
              ) : 'Verify & Complete'}
            </button>
            <div className="mt-4 text-center">
              {parentResendCountdown > 0 ? (
                <span className="text-sm text-slate-500 font-medium">Resend OTP in {parentResendCountdown}s</span>
              ) : (
                <button onClick={handleResendParentOtp} className="text-sm text-amber-600 font-bold hover:underline">
                  Resend OTP
                </button>
              )}
            </div>
            <button
              onClick={() => setShowParentOtpModal(false)}
              className="mt-4 w-full py-3 text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
