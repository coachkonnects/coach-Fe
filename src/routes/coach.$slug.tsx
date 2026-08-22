import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Users, DollarSign, Star } from 'lucide-react';

export const Route = createFileRoute('/coach/$slug')({
  component: CoachProfilePage,
});

function CoachProfilePage() {
  const { slug } = Route.useParams();
  const [coach, setCoach] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('contact=true')) {
      setShowModal(true);
    }
  }, []);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryEmail, setEnquiryEmail] = useState('');
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryLocation, setEnquiryLocation] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedTiming, setSelectedTiming] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const [enquiryPincode, setEnquiryPincode] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEnquiryPincode(val);
    if (val.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
        const data = await res.json();
        if (data && data[0].Status === 'Success') {
          const location = data[0].PostOffice[0];
          setEnquiryLocation(`${location.District}, ${location.State}`);
          setPincodeError('');
        } else {
          setPincodeError('Invalid Pincode');
        }
      } catch (err) {
        setPincodeError('Error verifying pincode');
      }
    } else {
      setPincodeError('');
    }
  };

  const checkDuplicate = async (type: string, value: string) => {
    if (!value) return;
    try {
      const res = await fetch(`/api/auth/check-${type}?${type === 'mobile' ? 'mobile' : 'email'}=${encodeURIComponent(value)}`);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.exists) {
          if (type === 'email') setEmailError('Whoa there! Looks like you already have an account! 😎 Please login first.');
          if (type === 'mobile') setPhoneError('Whoa there! Looks like this number is already VIP! 😎 Please login first.');
        } else {
          if (type === 'email') setEmailError('');
          if (type === 'mobile') setPhoneError('');
        }
      } else {
         const data = await res.json().catch(() => ({}));
         if (data.error) {
            if (type === 'email') setEmailError(data.error);
            if (type === 'mobile') setPhoneError(data.error);
         }
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;

  useEffect(() => {
    Promise.all([
      fetch(`/api/public/coach/${slug}`).then(res => {
        if (!res.ok) throw new Error('Coach not found');
        return res.json();
      }),
      fetch(`/api/public/coach/${slug}/classes`).then(res => res.ok ? res.json() : [])
    ])
      .then(([coachData, classesData]) => {
        setCoach(coachData);
        setClasses(classesData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  
  const coachSkills = coach?.expertise ? coach.expertise.split(/\s+/).filter(Boolean) : ['General'];
  const coachTimings = coach?.timeSlots ? coach.timeSlots.split(',').map((s: string) => s.trim()).filter(Boolean) : ['Morning', 'Afternoon', 'Evening'];
  
  // Auto-select first option if not selected
  useEffect(() => {
    if (showModal) {
      if (!selectedSkill && coachSkills.length > 0) setSelectedSkill(coachSkills[0]);
      if (!selectedTiming && coachTimings.length > 0) setSelectedTiming(coachTimings[0]);
    }
  }, [showModal, coach?.expertise, coach?.timeSlots]); // Use primitive strings in deps to avoid infinite loops

  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pincodeError || emailError || phoneError) {
      alert("Hold your horses! 🐎 Looks like you're already registered. Please log in to your profile first so we can tie this enquiry to your VIP account!");
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/enquiries/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail || enquiryEmail,
          name: enquiryName,
          phone: enquiryPhone,
          location: enquiryLocation,
          coachSlug: slug,
          message: `I am interested to join your classes for ${selectedSkill}. Preferred timing: ${selectedTiming}.`
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.token) {
           localStorage.setItem('token', data.token);
           localStorage.setItem('userEmail', userEmail || enquiryEmail);
           navigate({ to: '/student-dashboard' });
        } else {
           setEnquiryMessage('');
           setShowModal(false);
           alert('Enquiry sent successfully!');
           if (userEmail || localStorage.getItem('userEmail')) {
             navigate({ to: '/student-dashboard' });
           }
        }
      } else {
        alert(data.error || 'Failed to send enquiry. Please try again.');
      }
    } catch (e) {
      alert('Error connecting to server.');
    }
    setSending(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div></div>;
  if (error || !coach) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><h1 className="text-2xl font-bold text-slate-800">Coach not found.</h1></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/50 to-orange-50/30 font-sans pb-24">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
             <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
               <img src="/homelogo.png" alt="Logo" className="w-10 h-10 object-contain" />
             </div>
             <span className="text-xl font-black text-slate-800 tracking-tight hidden sm:block">CoachKonnects</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => window.history.back()} className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-sm transition-colors border border-slate-200/50 shadow-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Profile Header (Glassmorphic) */}
        <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[3rem] shadow-xl p-8 md:p-12 mb-12 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8">
           {(coach.groupImageUrl || coach.coverPhotoUrl) && (
             <div className="absolute inset-0 z-[-1] opacity-60">
               <img src={coach.groupImageUrl || coach.coverPhotoUrl} alt="Cover Background" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-white/95"></div>
             </div>
           )}
           <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-bl-full -z-10 blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-tr-full -z-10 blur-3xl"></div>
           
           <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2rem] bg-gradient-to-br from-teal-900 to-[#f26b21] p-1 shrink-0 shadow-2xl relative">
             <div className="w-full h-full bg-white rounded-[1.8rem] overflow-hidden flex items-center justify-center relative">
                {coach.profilePhotoUrl || coach.profileImageUrl ? (
                  <img src={coach.profilePhotoUrl || coach.profileImageUrl} alt={coach.fullName} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-20 h-20 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )}
             </div>
             {/* Verified Badge */}
             <div className="absolute -bottom-3 -right-3 bg-teal-500 text-white rounded-xl px-3 py-1.5 shadow-lg border-2 border-white flex items-center gap-1 text-sm font-bold">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
               Verified
             </div>
           </div>

           <div className="flex-1 text-center md:text-left z-10 w-full">
             <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-2 tracking-tight">{coach.fullName}</h1>
             <p className="text-xl font-bold text-orange-500 mb-6 uppercase tracking-wider">{coach.expertise || coach.headline || coach.category || 'Professional Coach'}</p>
             
             <p className="text-lg text-slate-800 font-medium mb-8 leading-relaxed max-w-2xl mx-auto md:mx-0">{coach.bio || coach.description || 'Passionate about sharing knowledge.'}</p>
             
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-slate-100 rounded-xl text-slate-800 font-bold text-sm shadow-sm">
                  <svg className="w-5 h-5 text-teal-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {[coach.area, coach.district, coach.state, coach.pincode].filter(Boolean).join(', ') || "Location not specified"}
                </div>
                {coach.targetAudience && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md border border-slate-100 rounded-xl text-slate-700 font-bold text-sm shadow-sm">
                    <Users className="w-5 h-5 text-indigo-500 shrink-0" />
                    {coach.targetAudience}
                  </div>
                )}
                {(coach.minPrice !== null && coach.minPrice !== undefined) && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md border border-slate-100 rounded-xl text-slate-700 font-bold text-sm shadow-sm">
                    <DollarSign className="w-5 h-5 text-green-500 shrink-0" />
                    ₹{coach.minPrice} {coach.maxPrice ? `- ₹${coach.maxPrice}` : ''}
                  </div>
                )}
                {reviews && reviews.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md border border-slate-100 rounded-xl text-slate-700 font-bold text-sm shadow-sm">
                    <Star className="w-5 h-5 text-amber-500 shrink-0 fill-amber-500" />
                    { (reviews.reduce((acc: any, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1) } ({reviews.length} Reviews)
                  </div>
                )}
             </div>

             <button 
               onClick={() => setShowModal(true)}
               className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-[#f26b21] to-[#ff8a4c] hover:from-[#d95d1c] hover:to-[#e67333] text-white rounded-2xl font-black text-lg shadow-md shadow-orange-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
             >
               Send Enquiry
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
             </button>
           </div>
        </div>

        {/* Classes Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">
             <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
             </div>
             Available Classes & Workshops
          </h2>
          
          {classes.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-md rounded-3xl p-12 text-center border border-slate-200 border-dashed">
              <p className="text-slate-500 font-medium text-lg">This coach hasn't listed any active classes yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {classes.map(c => (
                <div key={c.id} className="group bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                  {c.imageUrl && (
                    <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                      {c.type === 'WORKSHOP' && (
                        <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-lg z-10 tracking-widest">WORKSHOP</div>
                      )}
                      <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                  )}
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <h3 className="font-black text-2xl text-slate-800">{c.title}</h3>
                      {c.type !== 'WORKSHOP' && c.type !== 'REGULAR' && (
                        <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap uppercase tracking-wider">
                          {c.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 font-medium mb-8 flex-1 line-clamp-3 leading-relaxed">{c.description}</p>
                    
                    <div className="space-y-4 pt-6 border-t border-slate-100 mt-auto">
                      <div className="flex items-center text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <svg className="w-5 h-5 mr-3 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {c.schedule}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm font-bold text-slate-600">
                          <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          Max {c.capacity}
                        </div>
                        <div className="text-2xl font-black text-slate-800">
                          {c.price === 0 ? <span className="text-teal-500">Free</span> : `₹${c.price}`}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setEnquiryMessage(`I would like to enquire about your class: ${c.title}`);
                          setShowModal(true);
                        }}
                        className="w-full mt-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                      >
                        Enquire about Class
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Reviews Section */}
        {reviews && reviews.length > 0 && (
          <div className="mb-8 mt-12">
            <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              </div>
              Student Reviews
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((r: any) => (
                <div key={r.id} className="bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-[2rem] shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">VS</div>
                    <div>
                      <div className="font-bold text-slate-800">Verified Student</div>
                      <div className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="ml-auto text-amber-400 font-bold tracking-widest text-lg">
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{r.comment || "No comment provided."}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Enquiry Modal (Glassmorphic) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => setShowModal(false)}></div>
          <div className="bg-white/90 backdrop-blur-2xl border border-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 p-8 md:p-10 animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 bg-white shadow-sm border border-slate-100 rounded-full p-2 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h2 className="text-3xl font-black text-slate-800 mb-2">Send an Enquiry</h2>
            <p className="text-slate-500 mb-8 font-medium">To: <span className="text-teal-600 font-bold">{coach.fullName}</span></p>

            <form onSubmit={handleSendEnquiry} className="space-y-5">
              {!userEmail && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Full Name <span className="text-orange-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={enquiryName}
                        onChange={e => setEnquiryName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-5 py-3.5 bg-white border border-slate-200/60 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Phone Number <span className="text-orange-500">*</span></label>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        maxLength={10}
                        title="Please enter a valid 10-digit phone number"
                        value={enquiryPhone}
                        onChange={e => setEnquiryPhone(e.target.value.replace(/\D/g, ''))}
                        onBlur={() => checkDuplicate('mobile', enquiryPhone)}
                        placeholder="9876543210"
                        className="w-full px-5 py-3.5 bg-white border border-slate-200/60 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm font-medium"
                      />
                      {phoneError && <p className="text-xs text-red-500 ml-1 font-semibold">{phoneError}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Email Address <span className="text-orange-500">*</span></label>
                      <input
                        type="email"
                        required
                        value={enquiryEmail}
                        onChange={e => setEnquiryEmail(e.target.value)}
                        onBlur={() => checkDuplicate('email', enquiryEmail)}
                        placeholder="hello@example.com"
                        className="w-full px-5 py-3.5 bg-white border border-slate-200/60 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm font-medium"
                      />
                      {emailError && <p className="text-xs text-red-500 ml-1 font-semibold">{emailError}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Pincode <span className="text-orange-500">*</span></label>
                      <input
                        type="text"
                        required
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={enquiryPincode}
                        onChange={handlePincodeChange}
                        placeholder="e.g. 400001"
                        className="w-full px-5 py-3.5 bg-white border border-slate-200/60 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm font-medium"
                      />
                      {pincodeError && <p className="text-xs text-red-500 ml-1 font-semibold">{pincodeError}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Location <span className="text-slate-400 font-normal">(Auto-filled)</span></label>
                      <input
                        type="text"
                        required
                        readOnly
                        value={enquiryLocation}
                        placeholder="City, State"
                        className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200/60 rounded-2xl text-slate-600 focus:outline-none cursor-not-allowed font-medium"
                      />
                    </div>
                </>
              )}

              <div className="space-y-6 pt-2">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 ml-1">What skill are you interested in? <span className="text-orange-500">*</span></label>
                  <div className="flex flex-wrap gap-3">
                    {coachSkills.map((skill: string) => (
                      <label key={skill} className={`cursor-pointer px-4 py-2 rounded-xl border-2 font-medium transition-all ${selectedSkill === skill ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-200'}`}>
                        <input type="radio" name="skill" value={skill} checked={selectedSkill === skill} onChange={() => setSelectedSkill(skill)} className="hidden" />
                        {skill}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 ml-1">Preferred Timing <span className="text-orange-500">*</span></label>
                  <div className="flex flex-wrap gap-3">
                    {coachTimings.map((timing: string) => (
                      <label key={timing} className={`cursor-pointer px-4 py-2 rounded-xl border-2 font-medium transition-all ${selectedTiming === timing ? 'border-[#f26b21] bg-orange-50 text-[#f26b21]' : 'border-slate-200 bg-white text-slate-600 hover:border-orange-200'}`}>
                        <input type="radio" name="timing" value={timing} checked={selectedTiming === timing} onChange={() => setSelectedTiming(timing)} className="hidden" />
                        {timing}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-600">
                  <span className="font-bold text-slate-800">Preview:</span> "I am interested to join your classes for {selectedSkill}. Preferred timing: {selectedTiming}."
                </div>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-gradient-to-r from-[#f26b21] to-[#ff8a4c] hover:from-[#d95d1c] hover:to-[#e67333] text-white font-black text-lg py-4 rounded-2xl transition-transform active:scale-95 shadow-md mt-4 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {sending ? 'Sending...' : 'Send Enquiry'}
                {!sending && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
