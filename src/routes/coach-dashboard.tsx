import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/coach-dashboard')({
  component: CoachDashboard,
});

function CoachDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');

    if (!email || role !== 'coach') {
      navigate({ to: '/login' });
      return;
    }

    fetch(`/api/profile/coach/me?email=${email}`)
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setProfile(data.profile);
          setFlags(data.flags || []);
        } else {
          // If no profile, they might need to complete registration
          navigate({ to: '/register-coach', search: { edit: true } as any });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleToggleActive = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      const res = await fetch(`/api/profile/coach/toggle-active?email=${email}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProfile({ ...profile, active: data.isActive });
      } else {
        alert("Failed to toggle status.");
      }
    } catch (e) {
      alert("Error connecting to server.");
    }
  };

  const getStatusBanner = () => {
    if (profile?.active === false) {
      return (
        <div className="bg-slate-100 border-l-4 border-slate-500 p-6 rounded-r-2xl mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-slate-500 text-white flex items-center justify-center">⏸️</span>
            Profile on Leave (Inactive)
          </h2>
          <p className="mt-2 text-slate-600">Your profile is currently hidden from the public directory. Students cannot find or book you right now.</p>
        </div>
      );
    }
    switch (profile?.status) {
      case 'PENDING_APPROVAL':
        return (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl mb-8 shadow-sm">
            <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center">⏳</span>
              Profile Under Review
            </h2>
            <p className="mt-2 text-amber-700">Your profile has been submitted and is currently being reviewed by our team. You will be notified once it is live!</p>
          </div>
        );
      case 'APPROVED':
        return (
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-2xl mb-8 shadow-sm">
            <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">✓</span>
              You are Live!
            </h2>
            <p className="mt-2 text-green-700">Your profile is live on the platform. Students can now find and book you!</p>
          </div>
        );
      case 'REQUEST_CHANGE':
        return (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-2xl mb-8 shadow-sm">
            <h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">!</span>
              Action Required
            </h2>
            <p className="mt-2 text-red-700 font-medium">Your profile requires changes before it can be approved:</p>
            <ul className="mt-4 space-y-3">
              {flags.map((f, i) => (
                <li key={i} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex flex-col gap-2">
                  <span className="font-bold text-slate-800 uppercase text-xs tracking-wider">Field Flagged: {f.flaggedField}</span> 
                  <span className="text-slate-600 font-medium">{f.reasonNote}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <button onClick={() => navigate({ to: '/register-coach', search: { edit: true } as any })} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg active:scale-95 transition-all">
                Edit Profile Now
              </button>
            </div>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="bg-slate-50 border-l-4 border-slate-500 p-6 rounded-r-2xl mb-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Profile Rejected</h2>
            <p className="mt-2 text-slate-600">Your profile has been rejected due to multiple policy violations.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Coach Dashboard</h1>
          <button onClick={() => {
            localStorage.clear();
            navigate({ to: '/login' });
          }} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 font-bold shadow-sm transition-all hover:border-slate-300">Logout</button>
        </div>

        {getStatusBanner()}

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 overflow-hidden relative">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-50 to-teal-50 rounded-bl-full -z-10 opacity-50"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">Welcome, {profile?.fullName.split(' ')[0]}!</h1>
              <p className="text-slate-500">Manage your coaching profile and status.</p>
            </div>
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
              <span className={`text-sm font-bold ${profile?.active ? 'text-teal-600' : 'text-slate-500'}`}>
                {profile?.active ? 'Available' : 'On Leave'}
              </span>
              <button 
                onClick={handleToggleActive}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${profile?.active ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${profile?.active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-slate-100 relative z-10">
            <img src={profile?.profileImageUrl || '/placeholder.png'} alt="Profile" className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl" />
            <div className="text-center sm:text-left mt-2">
              <h2 className="text-2xl font-extrabold text-slate-900">{profile?.fullName}</h2>
              <p className="text-slate-500 font-medium text-lg mt-1">{profile?.expertise} • {profile?.location}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pricing</h3>
              <p className="font-bold text-slate-800 text-lg">{profile?.pricing}</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Audience</h3>
              <p className="font-bold text-slate-800 text-lg">{profile?.targetAudience}</p>
            </div>
            <div className="col-span-1 sm:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
              <p className="font-medium text-slate-700 leading-relaxed">{profile?.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
