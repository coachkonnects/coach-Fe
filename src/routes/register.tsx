import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/register')({
  component: RegisterSelectionPage,
});

function RegisterSelectionPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Student Half */}
      <div 
        onClick={() => navigate({ to: '/register-student' })}
        className="flex-1 relative group cursor-pointer overflow-hidden flex flex-col items-center justify-center p-12 min-h-[50vh] md:min-h-screen border-b-4 md:border-b-0 md:border-r-4 border-[#FFF8F0]"
      >
        {/* Background & Hover Effects */}
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
            Register as Student
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
        </div>
      </div>

      {/* Coach Half */}
      <div 
        onClick={() => navigate({ to: '/register-coach' })}
        className="flex-1 relative group cursor-pointer overflow-hidden flex flex-col items-center justify-center p-12 min-h-[50vh] md:min-h-screen"
      >
        {/* Background & Hover Effects */}
        <div className="absolute inset-0 bg-[#2C1810] transition-transform duration-700 ease-out group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2C1810] to-[#1A0F0A] opacity-90" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
        
        <div className="relative z-10 text-center transform transition-all duration-500 group-hover:-translate-y-2">
          <div className="w-24 h-24 bg-[#B85C38]/20 backdrop-blur-md rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl border border-[#B85C38]/30 group-hover:-rotate-6 transition-all duration-500">
            <svg className="w-12 h-12 text-[#F4A460]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#FFF8F0] mb-4 tracking-tight drop-shadow-md">
            I'm a Coach
          </h2>
          <p className="text-[#F4A460]/90 text-lg font-medium max-w-xs mx-auto drop-shadow-sm">
            Manage your students, schedule classes, and grow your impact.
          </p>

          <div className="mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-2 text-[#FFF8F0] font-bold bg-[#B85C38]/30 w-max mx-auto px-6 py-3 rounded-full backdrop-blur-sm border border-[#B85C38]/50">
            Register as Coach
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
        </div>
      </div>
      
      {/* Center Logo Overlay */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none hidden md:block">
        <div className="w-32 h-32 bg-white rounded-full p-3 shadow-2xl flex items-center justify-center">
          <div className="w-full h-full bg-[#FFF8F0] rounded-full border-[6px] border-[#FFF8F0] flex items-center justify-center overflow-hidden">
             <img src="/homelogo.png" alt="Logo" className="w-20 h-auto" />
          </div>
        </div>
      </div>

      {/* Login link */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-white/50 text-sm font-bold text-[#2C1810]">
          Already have an account?{' '}
          <a href="/login" className="text-[#FF6B35] hover:text-[#B85C38] transition-colors ml-1">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
