import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Users, DollarSign, Star, MapPin, Calendar, Clock, Globe, Briefcase, ChevronLeft, Link as LinkIcon, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

export const Route = createFileRoute('/portfolio/$slug')({
  component: CoachPortfolioPage,
});

function CoachPortfolioPage() {
  const { slug } = Route.useParams();
  const [coach, setCoach] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
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
      if (!res.ok) {
        // Backend returns 400 with {error: ...} if exists
        const data = await res.json().catch(() => ({}));
        if (data.error) {
          if (type === 'email') setEmailError('Email already registered. Please log in first.');
          if (type === 'mobile') setPhoneError('Phone already registered. Please log in first.');
        }
      } else {
        if (type === 'email') setEmailError('');
        if (type === 'mobile') setPhoneError('');
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
      fetch(`/api/public/coach/${slug}/classes`).then(res => res.ok ? res.json() : []),
      fetch(`/api/public/coach/${slug}/reviews`).then(res => res.ok ? res.json() : [])
    ])
      .then(([coachData, classesData, reviewsData]) => {
        setCoach(coachData);
        setClasses(classesData);
        setReviews(reviewsData);
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
  }, [showModal, coach?.expertise, coach?.timeSlots]);

  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pincodeError || emailError || phoneError) {
      alert("Please fix the validation errors before submitting.");
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
          message: `I am interested to join your classes for ${selectedSkill}. Preferred timing: ${selectedTiming}. ${enquiryMessage}`
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f26b21]"></div></div>;
  if (error || !coach) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="text-center"><h1 className="text-3xl font-black text-slate-800 mb-4">Coach Not Found</h1><p className="text-slate-500">The profile you are looking for does not exist or is pending approval.</p></div></div>;

  const regularClasses = classes.filter(c => c.type === 'REGULAR');
  const workshopClasses = classes.filter(c => c.type === 'WORKSHOP');
  const demoClasses = classes.filter(c => c.type === 'DEMO' || c.type === 'TRIAL');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-[#f26b21] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !coach) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col gap-4 p-8 text-center">
        <h1 className="text-4xl font-black text-slate-800">Coach Not Found</h1>
        <p className="text-slate-500 text-lg">We couldn't find the portfolio you're looking for.</p>
        <button onClick={() => window.location.href = '/'} className="mt-4 px-8 py-3 bg-[#f26b21] text-white rounded-xl font-bold">Return Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-orange-500 selection:text-white">
      {/* Dynamic Cover Section */}
      <div className="relative h-64 md:h-96 w-full overflow-hidden bg-slate-900">
        {(coach.groupImageUrl || coach.coverPhotoUrl) ? (
          <>
            <img src={coach.groupImageUrl || coach.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#f26b21] via-amber-600 to-teal-800 opacity-90"></div>
        )}
        
        {/* Navbar inside cover */}
        <nav className="absolute top-0 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-sm" onClick={() => window.location.href = '/'}>
               <img src="/homelogo.png" alt="Logo" className="w-6 h-6 brightness-0 invert" />
               <span className="text-lg font-black text-white tracking-tight hidden sm:block">CoachKonnects</span>
            </div>
            <button onClick={() => window.history.back()} className="px-5 py-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full font-bold text-sm transition-colors border border-white/20 shadow-sm flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </nav>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 md:-mt-48 relative z-20">
        
        {/* Main Profile Card */}
        <div className="bg-white rounded-[2rem] shadow-2xl p-6 md:p-10 mb-10 border border-slate-100 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
          
          <div className="relative -mt-24 md:-mt-28 shrink-0">
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-[2rem] bg-white p-2 shadow-xl relative z-10 mx-auto">
              <div className="w-full h-full rounded-[1.6rem] overflow-hidden bg-slate-100 flex items-center justify-center">
                 {coach.profilePhotoUrl || coach.profileImageUrl ? (
                   <img src={coach.profilePhotoUrl || coach.profileImageUrl} alt={coach.fullName} className="w-full h-full object-cover" />
                 ) : (
                   <Users className="w-20 h-20 text-slate-300" />
                 )}
              </div>
            </div>
            {/* Verified Badge */}
            <div className="absolute bottom-4 right-2 md:bottom-8 md:-right-2 z-20 bg-teal-500 text-white rounded-xl px-4 py-1.5 shadow-lg border-4 border-white flex items-center gap-1.5 text-sm font-black">
              <Star className="w-4 h-4 fill-white" />
              Verified
            </div>
          </div>

          <div className="flex-1 w-full pt-2 md:pt-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{coach.fullName}</h1>
                <p className="text-xl md:text-2xl font-bold text-[#f26b21] mt-2 uppercase tracking-wide">
                  {coach.expertise || coach.category || 'Professional Coach'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold transition-all flex items-center justify-center gap-2"
                >
                  <LinkIcon className="w-5 h-5" /> Share
                </button>
                <button 
                  onClick={() => { setEnquiryMessage(''); setShowModal(true); }}
                  className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Book / Enquire
                </button>
              </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 my-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-semibold text-sm">
                <MapPin className="w-4 h-4 text-rose-500" />
                {[coach.area, coach.district, coach.state].filter(Boolean).join(', ') || "Location not specified"}
              </div>
              {coach.targetAudience && (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-semibold text-sm">
                  <Users className="w-4 h-4 text-indigo-500" />
                  {coach.targetAudience}
                </div>
              )}
              {(coach.minPrice !== null && coach.minPrice !== undefined) && (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-semibold text-sm">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  ₹{coach.minPrice} {coach.maxPrice ? `- ₹${coach.maxPrice}` : ''}
                </div>
              )}
              {reviews && reviews.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {(reviews.reduce((acc: any, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1)} ({reviews.length} Reviews)
                </div>
              )}
            </div>
            
            {/* Bio */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">About The Coach</h3>
              <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                {coach.description || 'This coach has not provided a detailed biography yet.'}
              </p>
            </div>
          </div>
        </div>

        {/* Two Column Layout for Details & Classes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
          
          {/* Left Column - Detailed Info */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-[#f26b21]" /> At a Glance
              </h3>
              <ul className="space-y-5">
                {coach.classMode && (
                  <li>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Class Mode</div>
                    <div className="font-semibold text-slate-800">{coach.classMode.replace(/_/g, ' ')}</div>
                  </li>
                )}
                {coach.availableDays && (
                  <li>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Available Days</div>
                    <div className="font-semibold text-slate-800">{coach.availableDays.replace(/,/g, ', ')}</div>
                  </li>
                )}
                {coach.timeSlots && (
                  <li>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Time Slots</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {coachTimings.map((t: string) => (
                        <span key={t} className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg">{t}</span>
                      ))}
                    </div>
                  </li>
                )}
                {coach.gender && (
                  <li>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</div>
                    <div className="font-semibold text-slate-800">{coach.gender}</div>
                  </li>
                )}
              </ul>
            </div>

            {coach.socialLinks && (
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Globe className="w-6 h-6 text-blue-500" /> Connect
                </h3>
                <div className="flex flex-wrap gap-3">
                  <a href={coach.socialLinks.includes('http') ? coach.socialLinks : `https://instagram.com/${coach.socialLinks.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-50 hover:bg-orange-50 text-slate-600 hover:text-orange-500 rounded-xl transition-colors">
                    <Instagram className="w-6 h-6" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Classes */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Workshops Section */}
            {workshopClasses.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800">Special Workshops</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {workshopClasses.map(c => <ClassCard key={c.id} c={c} onEnquire={() => { setEnquiryMessage(`I'm interested in the workshop: ${c.title}`); setShowModal(true); }} />)}
                </div>
              </div>
            )}

            {/* Regular Classes Section */}
            {regularClasses.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800">Regular Classes</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {regularClasses.map(c => <ClassCard key={c.id} c={c} onEnquire={() => { setEnquiryMessage(`I'm interested in the regular class: ${c.title}`); setShowModal(true); }} />)}
                </div>
              </div>
            )}

            {/* Demo/Trial Classes Section */}
            {demoClasses.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Star className="w-5 h-5" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800">Demo & Trial Sessions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {demoClasses.map(c => <ClassCard key={c.id} c={c} onEnquire={() => { setEnquiryMessage(`I'm interested in the demo class: ${c.title}`); setShowModal(true); }} />)}
                </div>
              </div>
            )}

            {classes.length === 0 && (
              <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-slate-100 border-dashed text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">No Active Classes</h3>
                <p className="text-slate-500">This coach is currently not running any public classes. Click Enquire to ask for private sessions.</p>
              </div>
            )}
            
            {/* Reviews Section */}
            {reviews.length > 0 && (
              <div className="pt-8 border-t border-slate-200/60">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center">
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-800">Student Reviews</h2>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 shrink-0">
                        {r.student?.fullName ? r.student.fullName.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-800">{r.student?.fullName || "Student"}</h4>
                          <span className="text-xs font-semibold text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex text-amber-400 text-sm mb-3">
                          {Array.from({length: 5}).map((_, i) => <span key={i}>{i < r.rating ? '★' : '☆'}</span>)}
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">{r.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Enquiry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 p-8 md:p-10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 bg-slate-100 rounded-full p-2 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h2 className="text-3xl font-black text-slate-800 mb-2">Send an Enquiry</h2>
            <p className="text-slate-500 mb-8 font-medium">Directly to: <span className="text-[#f26b21] font-bold">{coach.fullName}</span></p>

            <form onSubmit={handleSendEnquiry} className="space-y-5 max-h-[60vh] overflow-y-auto px-1 -mx-1">
              {!userEmail && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Full Name <span className="text-orange-500">*</span></label>
                      <input type="text" required value={enquiryName} onChange={e => setEnquiryName(e.target.value)} placeholder="John Doe" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#f26b21] focus:ring-4 focus:ring-orange-500/10 transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Phone <span className="text-orange-500">*</span></label>
                      <input type="tel" required pattern="[0-9]{10}" maxLength={10} value={enquiryPhone} onChange={e => setEnquiryPhone(e.target.value.replace(/\D/g, ''))} onBlur={() => checkDuplicate('mobile', enquiryPhone)} placeholder="9876543210" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#f26b21] focus:ring-4 focus:ring-orange-500/10 transition-all font-medium" />
                      {phoneError && <p className="text-xs text-red-500 ml-1 font-semibold">{phoneError}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Email Address <span className="text-orange-500">*</span></label>
                      <input type="email" required value={enquiryEmail} onChange={e => setEnquiryEmail(e.target.value)} onBlur={() => checkDuplicate('email', enquiryEmail)} placeholder="hello@example.com" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#f26b21] focus:ring-4 focus:ring-orange-500/10 transition-all font-medium" />
                      {emailError && <p className="text-xs text-red-500 ml-1 font-semibold">{emailError}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Pincode <span className="text-orange-500">*</span></label>
                      <input type="text" required pattern="[0-9]{6}" maxLength={6} value={enquiryPincode} onChange={handlePincodeChange} placeholder="e.g. 400001" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#f26b21] focus:ring-4 focus:ring-orange-500/10 transition-all font-medium" />
                      {pincodeError && <p className="text-xs text-red-500 ml-1 font-semibold">{pincodeError}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Location <span className="text-slate-400 font-normal">(Auto-filled)</span></label>
                    <input type="text" required readOnly value={enquiryLocation} placeholder="City, State" className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 focus:outline-none cursor-not-allowed font-medium" />
                  </div>
                </>
              )}
              <div className="space-y-6 pt-2">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 ml-1">Skill of Interest *</label>
                  <div className="flex flex-wrap gap-2">
                    {coachSkills.map((skill: string) => (
                      <label key={skill} className={`cursor-pointer px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${selectedSkill === skill ? 'border-[#f26b21] bg-orange-50 text-[#f26b21]' : 'border-slate-200 bg-white text-slate-500 hover:border-orange-200'}`}>
                        <input type="radio" name="skill" value={skill} checked={selectedSkill === skill} onChange={() => setSelectedSkill(skill)} className="hidden" />
                        {skill}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 ml-1">Preferred Timing *</label>
                  <div className="flex flex-wrap gap-2">
                    {coachTimings.map((timing: string) => (
                      <label key={timing} className={`cursor-pointer px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${selectedTiming === timing ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-500 hover:border-teal-200'}`}>
                        <input type="radio" name="timing" value={timing} checked={selectedTiming === timing} onChange={() => setSelectedTiming(timing)} className="hidden" />
                        {timing}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" disabled={sending} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-lg py-4 rounded-2xl transition-transform active:scale-95 shadow-xl mt-6 flex justify-center items-center gap-2">
                {sending ? 'Sending...' : 'Send Message Now'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowShareModal(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in-95 duration-200 text-center z-10">
            <button 
              onClick={() => { setShowShareModal(false); setLinkCopied(false); }}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="w-16 h-16 bg-orange-100 text-[#f26b21] rounded-full flex items-center justify-center mx-auto mb-6">
              <LinkIcon className="w-8 h-8" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-800 mb-2">Share This Profile</h3>
            <p className="text-slate-500 font-medium mb-8">
              Copy the link below to share {coach.fullName}'s profile with your friends!
            </p>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-slate-600 truncate flex-1 text-left select-all">
                {typeof window !== 'undefined' ? window.location.href : ''}
              </div>
            </div>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 3000);
              }}
              className={`w-full py-4 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${linkCopied ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/20' : 'bg-[#f26b21] hover:bg-[#d95d1c] text-white shadow-orange-500/20'}`}
            >
              {linkCopied ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ClassCard({ c, onEnquire }: { c: any, onEnquire: () => void }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group">
      {c.imageUrl && (
        <div className="h-48 w-full overflow-hidden relative">
          <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4">
             <h3 className="font-black text-xl text-white drop-shadow-md">{c.title}</h3>
          </div>
        </div>
      )}
      <div className="p-6 flex-1 flex flex-col">
        {!c.imageUrl && <h3 className="font-black text-xl text-slate-800 mb-2">{c.title}</h3>}
        
        <p className="text-slate-600 font-medium text-sm mb-6 flex-1 line-clamp-3">{c.description}</p>
        
        <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-center text-sm font-bold text-slate-600">
            <Clock className="w-4 h-4 mr-2 text-teal-500" />
            <span className="truncate">{c.schedule || 'Flexible Timings'}</span>
          </div>
          {c.startDate && c.endDate && (
             <div className="flex items-center text-sm font-bold text-slate-600">
                <Calendar className="w-4 h-4 mr-2 text-teal-500" />
                <span className="truncate">{new Date(c.startDate).toLocaleDateString()} to {new Date(c.endDate).toLocaleDateString()}</span>
             </div>
          )}
          <div className="flex items-center text-sm font-bold text-slate-600">
            <Users className="w-4 h-4 mr-2 text-indigo-500" />
            Max {c.capacity} Students
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="text-2xl font-black text-slate-800">
            {c.price === 0 ? <span className="text-teal-500 bg-teal-50 px-3 py-1 rounded-lg text-lg">FREE</span> : `₹${c.price}`}
          </div>
          <button onClick={onEnquire} className="px-5 py-2.5 bg-[#f26b21] hover:bg-[#d95d1c] text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm">
            Enquire
          </button>
        </div>
      </div>
    </div>
  );
}
 
