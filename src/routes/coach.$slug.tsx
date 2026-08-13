import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/coach/$slug')({
  component: CoachProfilePage,
});

function CoachProfilePage() {
  const { slug } = Route.useParams();
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryEmail, setEnquiryEmail] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/public/coach/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Coach not found');
        return res.json();
      })
      .then(data => {
        setCoach(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/enquiries/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: enquiryEmail,
          coachSlug: slug,
          message: enquiryMessage
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('Your enquiry has been sent to the coach successfully!');
        setShowModal(false);
        setEnquiryMessage('');
      } else {
        alert(data.error || 'Failed to send enquiry. Make sure you are registered as a Student.');
      }
    } catch (e) {
      alert('Error connecting to server.');
    }
    setSending(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  if (error || !coach) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><h1 className="text-2xl font-bold text-gray-800">Coach not found.</h1></div>;

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] font-sans text-slate-900 pb-20 relative overflow-hidden">
      {/* Premium Gradient Backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-400/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-6 border-b border-white/20 bg-white/40 backdrop-blur-md sticky top-0 z-40 shadow-sm flex items-center justify-between">
        <a href="/coaches" className="flex items-center gap-2 text-slate-600 hover:text-orange-600 font-bold transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Directory
        </a>
        <img src="/homelogo.png" alt="CoachKonnects" className="h-8 w-auto hidden sm:block" />
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-12 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-8 sm:p-12 shadow-xl shadow-slate-200/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 mb-8">
              <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg flex items-center justify-center text-5xl font-extrabold text-white shrink-0 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                {coach.fullName.charAt(0)}
              </div>
              <div>
                <div className="inline-block px-3 py-1 bg-teal-100 text-teal-800 text-xs font-black tracking-wider uppercase rounded-full mb-3 border border-teal-200">
                  {coach.category || 'Professional Coach'}
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-2">{coach.fullName}</h1>
                <div className="flex items-center gap-4 text-slate-500 font-medium text-lg">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                    {coach.district}, {coach.state}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">About Me</h2>
              <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                {coach.description || `${coach.fullName} is a highly dedicated professional coach specializing in ${coach.expertise || 'various disciplines'}.`}
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Expertise & Details</h2>
            <div className="md:col-span-1 space-y-6">
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Schedule & Availability
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Days</span>
                    <span className="font-medium text-slate-900">{coach.availableDays || 'Contact to schedule'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Slots</span>
                    <span className="font-medium text-slate-900">{coach.timeSlots || 'Flexible'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Class Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Mode</span>
                    <span className="font-medium text-slate-900">{coach.classMode || 'Online & Offline'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Pricing</span>
                    <span className="font-medium text-slate-900 text-right">{coach.pricing || 'Contact for pricing'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Audience</span>
                    <span className="font-medium text-slate-900 text-right">{coach.targetAudience || 'All Ages'}</span>
                  </div>
                </div>
              </div>

              {coach.groupImageUrl && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Action Gallery
                  </h3>
                  <div className="rounded-xl overflow-hidden shadow-sm border border-slate-100">
                    <img src={coach.groupImageUrl} alt="Group/Action" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" />
                  </div>
                </div>
              )}

              {coach.introVideoUrl && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Intro Video
                  </h3>
                  <a 
                    href={coach.introVideoUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block w-full py-3 bg-red-50 text-red-600 font-bold text-center rounded-xl hover:bg-red-100 transition-colors"
                  >
                    Watch Introduction →
                  </a>
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider">Pincode</div>
                <div className="text-lg font-bold text-slate-900">{coach.pincode || 'Not specified'}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Action Column */}
        <div className="space-y-6">
          <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-2xl shadow-orange-500/10 sticky top-32">
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Ready to start?</h3>
            <p className="text-slate-500 mb-8 font-medium">Send an enquiry directly to {coach.fullName.split(' ')[0]} to discuss your goals and schedule.</p>
            
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-[0_8px_20px_rgba(249,115,22,0.25)] hover:shadow-[0_8px_25px_rgba(249,115,22,0.35)] flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              Contact Coach
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
            <div className="mt-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
              Secured by CoachKonnects
            </div>
          </div>
        </div>

      </main>

      {/* Enquiry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-full p-2 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Send an Enquiry</h2>
            <p className="text-slate-500 mb-8 font-medium">To: {coach.fullName}</p>

            <form onSubmit={handleSendEnquiry} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Your Registered Student Email <span className="text-orange-500">*</span></label>
                <input
                  type="email"
                  required
                  value={enquiryEmail}
                  onChange={e => setEnquiryEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Message <span className="text-orange-500">*</span></label>
                <textarea
                  required
                  rows={4}
                  value={enquiryMessage}
                  onChange={e => setEnquiryMessage(e.target.value)}
                  placeholder="Hi, I'm interested in your classes. What is your availability?"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {sending ? 'Sending...' : 'Send Message'}
                {!sending && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
