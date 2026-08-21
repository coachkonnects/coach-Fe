import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';

export const Route = createFileRoute('/register')({
  component: RegisterSelectionPage,
});

function RegisterSelectionPage() {
  const navigate = useNavigate();

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
      if (!isDragging.current && Math.abs(velocity) > 0.05) {
        setRotation((prev) => prev + velocity);
        setVelocity((prev) => prev * 0.97); // friction coefficient
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    if (Math.abs(velocity) > 0.05 && !isDragging.current) {
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

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Student Half */}
      <div
        onClick={() => navigate({ to: '/register-student' })}
        className="flex-1 relative group cursor-pointer overflow-hidden flex flex-col items-center justify-center p-6 py-10 md:p-12 min-h-[50vh] md:min-h-screen border-b-4 md:border-b-0 md:border-r-4 border-[#FFF8F0]"
      >
        {/* Background & Hover Effects */}
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
            Register as Student
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
        </div>
      </div>

      {/* Coach Half */}
      <div
        onClick={() => navigate({ to: '/register-coach' })}
        className="flex-1 relative group cursor-pointer overflow-hidden flex flex-col items-center justify-center p-6 py-10 pb-24 md:p-12 min-h-[50vh] md:min-h-screen"
      >
        {/* Background & Hover Effects */}
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
            Register as Coach
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </div>
        </div>
      </div>

      {/* Center Logo Overlay */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto">
        <div className="hover:scale-105 transition-transform duration-300 select-none">
          <div 
            ref={spinnerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={handleDoubleClick}
            style={{ transform: `rotate(${rotation}deg)` }}
            className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-white rounded-full p-1.5 sm:p-2 md:p-3 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <div className="w-full h-full bg-[#FFF8F0] rounded-full border-[3px] sm:border-[4px] md:border-[6px] border-[#FFF8F0] flex items-center justify-center overflow-hidden pointer-events-none">
              <img src="/homelogo.png" alt="Logo" className="w-10 sm:w-16 md:w-20 h-auto object-contain select-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Login link */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-30 w-[85%] sm:w-[90%] max-w-xs sm:max-w-sm">
        <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-2xl border border-white/50 text-xs sm:text-sm md:text-base font-bold text-[#2C1810] text-center w-full">
          Already have an account?{' '}
          <a href="/login" className="text-[#FF6B35] hover:text-[#B85C38] transition-colors ml-1 inline-block">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
