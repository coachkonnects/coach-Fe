import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Music, Palette, Crown, Shield, Camera, Search, MoreHorizontal } from "lucide-react";
import desktopBg from "@/assets/desktop-bg.png.asset.json";
import mobileBg from "@/assets/mobile-bg.png.asset.json";
const logo = { url: "/homelogo.png" };
const garba = { url: "/GARBA.png" };
const guitar = { url: "/GUITAR.png" };
const bharatnatyam = { url: "/BHARATNATYAM.png" };
const piano = { url: "/PIANO.png" };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CoachKonnects — Find Your Hobby. Find Your People." },
      {
        name: "description",
        content:
          "Discover passionate hobby coaches near you in Mumbai & across India. Browse, connect on WhatsApp, and enroll — zero booking fees.",
      },
      { property: "og:title", content: "CoachKonnects — Where Hobbies Become Identity" },
      {
        property: "og:description",
        content: "Discover passionate hobby coaches near you. Zero booking fees.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const categories = [
  { title: "Mind Masters", desc: "Chess, Rubik's cube, abacus, phonics puzzles", icon: "🧠" },
  { title: "Rhythm Stars", desc: "Dance, music, piano, guitar, vocals", icon: "🎵" },
  { title: "Kitchen Champs", desc: "Baking, cooking, cake decorating", icon: "👨‍🍳" },
  { title: "Sports & Fitness", desc: "Yoga, zumba, cricket, tennis, gym", icon: "🏃" },
  { title: "Creative Sparks", desc: "Arts, mandala, pottery, drawing, resin art", icon: "🎨" },
];

const steps = [
  {
    n: 1,
    title: "Tell us what you're looking for",
    body: "Chess for a 9‑year‑old. Bharatanatyam for a teenager. Zumba for yourself. Tell us the skill and your pincode — we do the rest.",
  },
  {
    n: 2,
    title: "We check the coach before you do",
    body: "Every coach submits a masked Aadhaar, a real photo, and their teaching history. Our admin team reviews every profile before it goes live.",
  },
  {
    n: 3,
    title: "Connect directly. No middlemen.",
    body: "Once both sides say yes, we hand you the coach's WhatsApp. Talk fees and timing directly — no commission, no fee in between.",
  },
];

const trustPoints = [
  // { title: "Aadhaar‑verified coaches", body: "Not anonymous profiles — every coach confirms their real identity before going live." },
  { title: "Admin‑approved, every time", body: "Nobody appears in search until our team has personally reviewed their profile." },
  { title: "Nearby, not just \"available\"", body: "Real GPS‑based matching, not a pincode guess — so \"near you\" actually means near you." },
  { title: "You control the connection", body: "WhatsApp is only shared once both sides confirm — you're never handed to a stranger." },
  { title: "Zero platform fees", body: "What you pay your coach stays between you and your coach. We don't take a cut." },
  { title: "Hobby‑only, always", body: "Just hobbies. That's the whole point, every time." },
];



function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="/" className={`flex min-w-0 items-center gap-2 ${className}`} aria-label="CoachKonnects">
      <img src="/favicon.png" alt="CoachKonnects" className="h-10 w-10 sm:hidden rounded-full object-cover shrink-0 bg-white p-1 shadow-sm" />
      <img src={logo.url} alt="CoachKonnects" className="hidden sm:block h-10 w-auto shrink-0 rounded-[1.5rem]" />
    </a>
  );
}

function Index() {

  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [featuredCoaches, setFeaturedCoaches] = useState<any[]>([]);

  // Demands state
  const [demands, setDemands] = useState<any[]>([]);
  const [showAllDemands, setShowAllDemands] = useState(false);
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [demandForm, setDemandForm] = useState({ skillName: '', location: '', email: '', mobileNumber: '', pincode: '', area: '', district: '', state: '' });
  const [demandStatus, setDemandStatus] = useState('');
  const [serverCategories, setServerCategories] = useState<any[]>([]);
  const [showAllCatsModal, setShowAllCatsModal] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setServerCategories(data))
      .catch(err => console.error(err));
    fetch('/api/public/coaches')
      .then(res => res.json())
      .then(data => {
        const manualFeatured = data.filter((c: any) => c.isFeatured === true);
        const remaining = data.filter((c: any) => c.isFeatured !== true);
        const topStudents = remaining.sort((a: any, b: any) => (b.studentCount || 0) - (a.studentCount || 0)).slice(0, Math.max(0, 6 - manualFeatured.length));
        setFeaturedCoaches([...manualFeatured.slice(0, 6), ...topStudents].slice(0, 6));
      })
      .catch(err => console.error(err));

    fetch('/api/public/demands')
      .then(res => res.json())
      .then(data => {
        const grouped = data.reduce((acc: any, curr: any) => {
          const key = curr.skillName.trim().toLowerCase();
          if (!acc[key]) {
            acc[key] = { ...curr, count: 1, locations: [curr.location.trim()] };
          } else {
            acc[key].count += 1;
            if (!acc[key].locations.includes(curr.location.trim())) {
              acc[key].locations.push(curr.location.trim());
            }
          }
          return acc;
        }, {});
        const sorted = Object.values(grouped).sort((a: any, b: any) => b.count - a.count);
        // format location strings
        sorted.forEach((d: any) => {
          d.location = d.locations.length > 1 ? 'Multiple Locations' : d.locations[0];
        });
        setDemands(sorted);
      })
      .catch(err => console.error(err));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    navigate({ to: `/coaches?${params.toString()}` as any });
  };
  const handleDemandPincodeChange = async (pincode: string) => {
    setDemandForm(prev => ({ ...prev, pincode }));
    if (pincode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (data && data[0].Status === "Success") {
          const po = data[0].PostOffice[0];
          setDemandForm(prev => ({
            ...prev,
            area: po.Name,
            district: po.District,
            state: po.State,
            location: `${po.Name}, ${po.District}, ${po.State}`
          }));
        } else {
          alert("Invalid Pincode! Please enter a valid 6-digit Indian pincode.");
          setDemandForm(prev => ({ ...prev, pincode: '', location: '', area: '', district: '', state: '' }));
        }
      } catch (e) {
        console.error("Pincode fetch failed", e);
      }
    }
  };

  const handleDemandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandForm.mobileNumber || demandForm.mobileNumber.length !== 10) {
      setDemandStatus('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!demandForm.pincode || demandForm.pincode.length !== 6) {
      setDemandStatus('Please enter a 6-digit pincode.');
      return;
    }
    setDemandStatus('Verifying pincode...');
    try {
      const pinRes = await fetch(`https://api.postalpincode.in/pincode/${demandForm.pincode}`);
      const pinData = await pinRes.json();
      if (!pinData || pinData[0].Status !== "Success") {
        setDemandStatus('Invalid Pincode! Please enter a valid Indian pincode.');
        return;
      }
    } catch (e) {
      setDemandStatus('Error verifying pincode. Please try again.');
      return;
    }

    setDemandStatus('Sending...');
    try {
      const res = await fetch('/api/public/demands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demandForm)
      });
      if (res.ok) {
        setDemandStatus('Success! We will notify you when a coach joins.');
        setTimeout(() => { setShowDemandModal(false); setDemandStatus(''); setDemandForm({ skillName: '', location: '', email: '', mobileNumber: '', pincode: '', area: '', district: '', state: '' }); }, 2000);
        // Refresh demands
        fetch('/api/public/demands').then(r => r.json()).then(data => {
          const grouped = data.reduce((acc: any, curr: any) => {
            const key = curr.skillName.trim().toLowerCase();
            if (!acc[key]) {
              acc[key] = { ...curr, count: 1, locations: [curr.location.trim()] };
            } else {
              acc[key].count += 1;
              if (!acc[key].locations.includes(curr.location.trim())) {
                acc[key].locations.push(curr.location.trim());
              }
            }
            return acc;
          }, {});
          const sorted = Object.values(grouped).sort((a: any, b: any) => b.count - a.count);
          sorted.forEach((d: any) => {
            d.location = d.locations.length > 1 ? 'Multiple Locations' : d.locations[0];
          });
          setDemands(sorted);
        });
      } else {
        setDemandStatus('Error submitting request.');
      }
    } catch {
      setDemandStatus('Error connecting to server.');
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[color:var(--color-background)] selection:bg-[color:var(--color-brand)] selection:text-white text-slate-900">
      {/* Background Glow Effects for Light Glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/20 blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-amber-400/20 blur-[100px] pointer-events-none" />

      <main className="relative z-10 w-full">
        {/* HERO */}
        <section className="relative isolate w-full sm:overflow-hidden bg-transparent min-h-[75svh] md:min-h-[720px] lg:min-h-[760px] xl:min-h-0 md:aspect-video">
          <picture>
            <source media="(max-width: 639px)" srcSet="/Mobile_BG.jpg" />
            <source media="(min-width: 640px)" srcSet="/Desktop%20BG.png" />
            <img
              src="/Desktop%20BG.png"
              alt="Hero background"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 h-full w-full select-none object-cover object-center"
            />
          </picture>
          {/* Soft fade for text legibility on the left */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 hidden md:block bg-gradient-to-r from-[#fdf5ed] via-[#fdf5ed]/85 to-transparent md:from-[#fdf5ed] md:via-[#fdf5ed]/70 md:to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 -z-10 h-40 hidden md:block bg-gradient-to-b from-transparent to-white"
          />

          <header className="relative z-10 w-full pt-1 sm:pt-4">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
              <Logo />
              <nav className="flex shrink-0 items-center gap-3 sm:gap-5">
                <Link
                  to="/login"
                  className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-[color:var(--color-brand)] hover:text-[color:var(--color-brand)] sm:px-6 sm:py-2.5"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[color:var(--color-brand-dark)] sm:px-6 sm:py-2.5"
                >
                  Get Started
                </Link>
              </nav>
            </div>
          </header>

          {/* Hero content */}
          <div className="relative z-10 mx-auto w-full min-w-0 max-w-7xl px-5 pb-10 pt-1 sm:px-8 sm:pb-32 sm:pt-14 lg:pb-48 text-left flex flex-col justify-between min-h-[80svh] sm:min-h-[unset] sm:block">

            {/* Launching Badge (Mobile) */}
            <div className="flex sm:hidden justify-center w-full mb-6 mt-4">
              <span className="inline-block rounded-full border border-white/40 bg-white/40 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-orange-900 shadow-sm">
                🚀 Launching in Mumbai & India
              </span>
            </div>

            {/* TOP SECTION */}
            <div className="w-full min-w-0 max-w-lg lg:max-w-[50%] xl:max-w-2xl flex flex-col items-center text-center sm:items-start sm:text-left mx-auto sm:mx-0 bg-white/30 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none p-3 sm:p-0 rounded-[1.5rem] sm:rounded-none border border-white/40 sm:border-transparent shadow-lg sm:shadow-none">
              <span className="hidden sm:inline-block mb-5 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-orange-700 shadow-sm backdrop-blur-md">
                🚀 Launching in Mumbai & India
              </span>
              <h1 className="font-[var(--font-display)] text-[22px] sm:text-4xl md:text-5xl lg:text-[68px] font-bold leading-[1.08] tracking-tight text-balance text-slate-900">
                Find The Perfect Class{" "}
                <em className="font-medium not-italic text-slate-700 italic">Or</em>{" "}
                Coach For{" "}
                <span className="inline-block bg-orange-500 text-white px-2 py-0.5 mt-0.5 rounded-lg shadow-sm text-[22px] sm:text-4xl md:text-5xl lg:text-[68px]">Your Child.</span>
              </h1>
              <p className="hidden sm:block mt-5 max-w-lg text-pretty text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
                Discover passionate hobby coaches near you. Browse, connect directly on WhatsApp,
                and enroll — zero booking fees.
              </p>

              {/* CTAs (Desktop) */}
              <div className="hidden sm:flex mt-8 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Link
                  to="/coaches"
                  className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(249,115,22,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(249,115,22,0.4)] sm:w-auto"
                >
                  📍 Find Classes Near Me <span aria-hidden="true">→</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white/80 px-7 py-3.5 text-sm font-semibold text-slate-800 backdrop-blur-md transition-all hover:border-orange-500 hover:text-orange-600 sm:w-auto shadow-sm"
                >
                  👤 Are You A Hobby Coach?
                </Link>
              </div>
              <p className="hidden sm:block mt-4 text-[13px] font-bold text-orange-600/90">
                ✨ <span className="underline decoration-orange-300 underline-offset-4">Registration is 100% free</span> for the first few coaches!
              </p>

            </div>

            {/* BOTTOM SECTION  */}
            <div className="w-full min-w-0 max-w-xl mt-auto pt-8 flex flex-col gap-4">

              {/* CTAs (Mobile) */}
              <div className="flex sm:hidden flex-row items-center justify-between w-full pb-2 gap-1.5 px-1">
                <Link
                  to="/coaches"
                  className="flex-1 flex flex-col items-center justify-center rounded-2xl bg-white/40 border border-white/50 backdrop-blur-md py-2.5 px-2 text-[11px] leading-tight font-bold text-slate-900 shadow-sm text-center h-[52px]"
                >
                  <span>📍 Find Classes</span>
                </Link>

                <Link
                  to="/coaches"
                  className="shrink-0 flex items-center justify-center w-[46px] h-[46px] rounded-2xl bg-orange-500 text-white shadow-md"
                >
                  <Search className="w-5 h-5" strokeWidth={3} />
                </Link>

                <Link
                  to="/register"
                  className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-white/50 bg-white/40 backdrop-blur-md py-2.5 px-2 text-[11px] leading-tight font-bold text-slate-900 shadow-sm text-center h-[52px]"
                >
                  <span>👤 Are You Coach?</span>
                </Link>
              </div>
              <p className="sm:hidden text-[11px] font-bold text-center text-orange-600/90 bg-white/40 backdrop-blur-md py-1.5 rounded-full border border-white/40 shadow-sm mx-1 mt-1">
                ✨ Registration is <span className="underline decoration-orange-300 underline-offset-2">100% free</span> for the first few coaches!
              </p>

              {/* Trust chips - white box on mobile, raw on desktop */}
              <div className="hidden sm:block bg-white/90 backdrop-blur-xl sm:bg-transparent sm:backdrop-blur-none rounded-3xl p-4 sm:p-0 shadow-lg sm:shadow-none border border-white sm:border-transparent">
                <div className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm font-semibold text-[color:var(--color-ink)] sm:text-[15px]">

                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
                    <svg className="w-6 h-6 sm:w-5 sm:h-5 text-[color:var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Passionate<br className="sm:hidden" /> Coaches</span>
                  </div>

                  <div className="hidden sm:block h-5 w-px bg-slate-300"></div>

                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
                    <svg className="w-6 h-6 sm:w-5 sm:h-5 text-[color:var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Quality<br className="sm:hidden" /> Assured</span>
                  </div>

                  <div className="hidden sm:block h-5 w-px bg-slate-300"></div>

                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
                    <svg className="w-6 h-6 sm:w-5 sm:h-5 text-[color:var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Direct Connect<br className="sm:hidden" /> on WhatsApp</span>
                  </div>

                  <div className="hidden sm:block h-5 w-px bg-slate-300"></div>

                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
                    <svg className="w-6 h-6 sm:w-5 sm:h-5 text-[color:var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>No Platform<br className="sm:hidden" /> Fees</span>
                  </div>

                </div>

                <div className="hidden sm:flex items-center gap-3 mt-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-[18px] h-[18px] text-[color:var(--color-brand)] fill-current" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-[15px] font-medium text-[#1E293B]">
                    Trusted by hobby enthusiasts across India
                  </span>
                </div>
              </div>

              {/* Search */}
              <div className="hidden sm:block w-full">
                <form onSubmit={handleSearch} className="flex w-full min-w-0 flex-col gap-2 rounded-3xl border border-black/5 bg-white p-2 shadow-xl sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-1.5 sm:pl-5">
                  <div className="hidden sm:flex shrink-0 items-center gap-2 border-b border-slate-200 pb-2 text-sm font-medium text-[color:var(--color-ink-muted)] sm:whitespace-nowrap sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
                    <span className="shrink-0 text-[color:var(--color-brand)]">📍</span>
                  </div>
                  <div className="flex sm:hidden shrink-0 items-center pl-3">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search a skill, hobby or coaches near you😎"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full min-w-0 flex-1 bg-transparent px-2 py-2 text-sm sm:text-base outline-none placeholder:text-slate-400 sm:px-4"
                  />
                  <button type="submit" className="shrink-0 w-full sm:w-auto whitespace-nowrap rounded-full bg-[color:var(--color-brand)] px-6 py-3 sm:py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[color:var(--color-brand-dark)]">
                    Search
                  </button>
                </form>
              </div>

            </div>
          </div>
        </section>

        {/* Quick Categories (Mobile Only) */}
        <section className="relative z-10 w-full sm:hidden px-3 pb-8 -mt-2">
          <div className="flex w-full items-start justify-between px-4 py-4 rounded-[2rem] bg-white/30 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            {[
              { name: 'Guitar', icon: <Music className="w-6 h-6 drop-shadow-md" strokeWidth={2.5} /> },
              { name: 'Painting', icon: <Palette className="w-6 h-6 drop-shadow-md" strokeWidth={2.5} /> },
              { name: 'Chess', icon: <Crown className="w-6 h-6 drop-shadow-md" strokeWidth={2.5} /> },
              { name: 'Defense', icon: <Shield className="w-6 h-6 drop-shadow-md" strokeWidth={2.5} /> },
              { name: 'Photo', icon: <Camera className="w-6 h-6 drop-shadow-md" strokeWidth={2.5} /> },
            ].map((cat, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="flex items-center justify-center text-orange-600">
                  {cat.icon}
                </div>
                <span className="text-[10px] font-bold text-slate-800">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>



      </main>

      {/* DEMANDED CLASSES SECTION */}
      <section className="w-full bg-[#fdf5ed] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="text-center md:text-left">
              <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-[color:var(--color-ink)] md:text-4xl">
                What students are demanding
              </h2>
              <p className="mt-4 text-lg text-[color:var(--color-ink-muted)] max-w-2xl mx-auto md:mx-0">
                Can't find the exact skill you're looking for? Students across India are requesting these classes right now. Are you a coach who can teach them?
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
              <button
                onClick={() => setShowAllCatsModal(true)}
                className="w-full sm:w-auto rounded-full bg-teal-600 px-6 py-3.5 font-semibold text-white shadow-lg transition-transform hover:-translate-y-1 hover:bg-teal-700 flex items-center justify-center text-sm sm:text-base"
              >
                View all skills and hobbies
              </button>
              <button
                onClick={() => setShowDemandModal(true)}
                className="w-full sm:w-auto rounded-full bg-[color:var(--color-brand)] px-6 py-3.5 font-semibold text-white shadow-lg shadow-orange-500/20 transition-transform hover:-translate-y-1 flex items-center justify-center text-sm sm:text-base"
              >
                ✋ Request a Skill
              </button>
            </div>
          </div>

          {demands.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(showAllDemands ? demands : demands.slice(0, 3)).map((d: any) => (
                  <div key={d.id} className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-orange-50 opacity-50 transition-transform group-hover:scale-150"></div>
                    <div className="relative z-10">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-600">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
                        </span>
                        {d.count > 1 ? `🔥 ${d.count} Students Waiting` : 'High Demand'}
                      </div>
                      <h3 className="mb-1 font-[var(--font-display)] text-xl font-bold text-slate-800">{d.skillName}</h3>
                      <p className="text-sm font-medium text-slate-500">📍 {d.location}</p>
                      <Link to={`/register-coach?demandId=${d.id}` as any} className="mt-6 inline-flex items-center font-bold text-[color:var(--color-brand)] hover:text-orange-700 transition-colors">
                        I can teach this <span className="ml-2 text-lg">→</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              {demands.length > 3 && (
                <div className="mt-12 text-center">
                  <button
                    onClick={() => setShowAllDemands(!showAllDemands)}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-orange-200 text-orange-600 font-bold hover:bg-orange-50 hover:border-orange-300 transition-all active:scale-95"
                  >
                    {showAllDemands ? 'View Less' : `View ${demands.length - 3} More Demands`}
                    <span className={`transform transition-transform ${showAllDemands ? 'rotate-180' : ''}`}>↓</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-slate-500 italic">No specific demands right now. Be the first to request!</div>
          )}
        </div>
      </section>

      {/* Modal */}
      {showDemandModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 sm:p-8 text-center relative">
              <button onClick={() => setShowDemandModal(false)} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold">×</button>
              <h3 className="font-[var(--font-display)] text-2xl font-bold text-slate-800">Request a Skill</h3>
              <p className="mt-2 text-sm text-slate-600">Tell us what you want to learn. We'll find a coach for you.</p>
            </div>
            <form onSubmit={handleDemandSubmit} className="p-6 sm:p-8 flex flex-col gap-5">
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Skill Name (e.g. Garba)</label>
                <input required type="text" value={demandForm.skillName} onChange={e => setDemandForm({ ...demandForm, skillName: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-orange-500 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                <input required type="email" pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}" title="Please enter a valid email address (e.g. name@example.com)" value={demandForm.email} onChange={e => setDemandForm({ ...demandForm, email: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-orange-500 focus:bg-white outline-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Mobile Number</label>
                <input required type="tel" maxLength={10} pattern="[0-9]{10}" title="Please enter a valid 10-digit mobile number" value={demandForm.mobileNumber} onChange={e => setDemandForm({ ...demandForm, mobileNumber: e.target.value.replace(/\D/g, '') })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-orange-500 focus:bg-white outline-none" placeholder="10-digit mobile number" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 ml-1">Pincode</label>
                <input required type="text" maxLength={6} pattern="[0-9]{6}" title="Please enter a valid 6-digit pincode" value={demandForm.pincode} onChange={e => handleDemandPincodeChange(e.target.value.replace(/\D/g, ''))} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-orange-500 focus:bg-white outline-none" placeholder="6-digit pincode" />
              </div>
              {demandForm.pincode.length === 6 && demandForm.location && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 ml-1">Area</label>
                    <input readOnly type="text" value={demandForm.area} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 outline-none text-slate-500" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 ml-1">District</label>
                    <input readOnly type="text" value={demandForm.district} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 outline-none text-slate-500" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 ml-1">State</label>
                    <input readOnly type="text" value={demandForm.state} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 outline-none text-slate-500" />
                  </div>
                </div>
              )}

              {demandStatus && <div className="text-center text-sm font-bold text-orange-600">{demandStatus}</div>}

              <button type="submit" className="mt-2 w-full rounded-full bg-slate-900 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      <section className="w-full px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
          <div className="min-w-0 text-center md:text-left">
            <span className="mb-4 inline-block rounded-full bg-[color:var(--color-brand-light)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--color-brand-dark)]">
              Verified hobby coaches, near you
            </span>
            <h2 className="font-[var(--font-display)] text-[clamp(1.75rem,4.5vw,3rem)] font-bold leading-tight tracking-tight text-balance text-[color:var(--color-ink)]">
              Your kid has a spark. <br />Find the coach who won't let it fade.
            </h2>
            <p className="mt-5 text-base font-semibold text-[color:var(--color-ink)] sm:text-lg">
              Palava & Navi Mumbai first, India next.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[color:var(--color-ink-muted)] sm:text-lg">
              Every parent has felt it — the WhatsApp forward from three groups ago,
              the "trial class" that ghosted after payment, the coach who lives 40
              minutes away and teaches on Zoom anyway.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[color:var(--color-ink-muted)] sm:text-lg">
              CoachKonnects is different. Every coach is verified, every profile is
              real, and every match is someone actually teaching near you.
            </p>
          </div>

          {/* Four characters collage */}
          <div className="grid min-w-0 w-full grid-cols-2 gap-3 sm:gap-4">
            {[
              { src: garba.url, alt: "Garba dancer", bg: "from-amber-50 to-rose-50" },
              { src: guitar.url, alt: "Guitar coach", bg: "from-orange-50 to-amber-100" },
              { src: bharatnatyam.url, alt: "Bharatanatyam dancer", bg: "from-yellow-50 to-orange-50" },
              { src: piano.url, alt: "Piano student", bg: "from-teal-50 to-cyan-50" },
            ].map((c) => (
              <div
                key={c.alt}
                className={`relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br ${c.bg} shadow-[0_15px_40px_-15px_rgba(0,0,0,0.15)]`}
              >
                <img
                  src={c.src}
                  alt={c.alt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-contain p-2 scale-[0.67] sm:scale-[0.75] transition-transform"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="w-full bg-slate-50 px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="font-[var(--font-display)] text-[clamp(1.75rem,4.5vw,44px)] font-bold tracking-tight text-balance">
              3 steps. Zero guesswork.
            </h2>
            <p className="mt-4 text-base text-[color:var(--color-ink-muted)] sm:text-lg">
              Our Two‑Gate Trust System checks both sides before a single phone
              number is shared.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:border-[color:var(--color-brand-light)] hover:shadow-[0_20px_50px_-10px_rgba(242,107,33,0.12)] sm:p-10"
              >
                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[color:var(--color-brand-light)] font-[var(--font-brand)] text-2xl font-extrabold text-[color:var(--color-brand)] shadow-[0_8px_16px_rgba(242,107,33,0.15)]">
                  {s.n}
                </div>
                <h3 className="mb-3 font-[var(--font-display)] text-xl font-bold sm:text-2xl">
                  {s.title}
                </h3>
                <p className="text-base leading-relaxed text-[color:var(--color-ink-muted)]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED COACHES */}
      <section className="w-full px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="mb-4 inline-block rounded-full bg-[color:var(--color-brand-light)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--color-brand-dark)]">
              Featured Coaches
            </span>
            <h2 className="font-[var(--font-display)] text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-balance">
              Real coaches. Real students. Right here nearby.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCoaches.map((c) => (
              <Link
                to="/coach/$slug" params={{ slug: c.id }}
                key={c.id}
                className="flex flex-col h-full overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(242,107,33,0.15)] relative"
              >
                {c.isFeatured && (
                  <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-black px-2 py-1 rounded-lg shadow-md z-10">FEATURED</div>
                )}
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 shrink-0">
                  <img
                    src={c.profileImageUrl || c.profilePhotoUrl || '/homelogo.png'}
                    alt={c.fullName}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.05em] text-[color:var(--color-brand-dark)] flex justify-between">
                    <span>{c.category || c.expertise || 'Expert Coach'}</span>
                    <span className="flex items-center gap-2">
                      <span className="flex items-center text-yellow-500"><svg className="w-3 h-3 mr-1 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>{c.averageRating > 0 ? c.averageRating.toFixed(1) : "New"}</span>
                      <span className="text-orange-500 font-black">🎯 {c.studentCount || 0}</span>
                    </span>
                  </div>
                  <h4 className="font-[var(--font-display)] text-lg font-bold truncate">{c.fullName}</h4>
                  <p className="mt-1 text-sm text-[color:var(--color-ink-muted)] truncate">📍 {c.area || c.location || 'Mumbai'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="w-full bg-slate-50 px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="mb-4 inline-block rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--color-brand-dark)]">
              Why parents trust us
            </span>
            <h2 className="font-[var(--font-display)] text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-balance">
              Verification isn't a feature. It's the whole point.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trustPoints.map((t) => (
              <div key={t.title} className="rounded-2xl bg-white p-8 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03)]">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-lg font-extrabold text-emerald-600">
                  ✓
                </div>
                <h3 className="mb-2 font-[var(--font-display)] text-lg font-bold">{t.title}</h3>
                <p className="text-sm leading-relaxed text-[color:var(--color-ink-muted)]">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR COACHES */}
      <section className="w-full px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-10 rounded-3xl bg-[#fdf5ed] p-8 text-[color:var(--color-ink)] sm:p-12 md:grid-cols-2 md:gap-12 md:p-16">
            <div className="min-w-0 text-center md:text-left">
              <span className="mb-4 inline-block rounded-full bg-[color:var(--color-brand-light)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--color-brand-dark)]">
                For Coaches
              </span>
              <h2 className="font-[var(--font-display)] text-[clamp(1.75rem,4vw,40px)] font-bold leading-tight text-balance">
                You teach it well. Let more families find out.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[color:var(--color-ink-muted)] sm:text-lg">
                You didn't get into teaching chess, dance, or baking to spend evenings
                chasing leads on WhatsApp groups. CoachKonnects brings genuine, nearby
                students to you — pre‑interested and ready to connect once you confirm
                the fit. No cost to join. No commission today.
              </p>
              <Link
                to="/register-coach"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-[color:var(--color-brand)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(242,107,33,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[color:var(--color-brand-dark)]"
              >
                ✨ Start Teaching
              </Link>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-100 sm:aspect-square">
              <img
                src={guitar.url}
                alt="Coach in action"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-contain p-4"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full bg-[#fdf5ed] px-5 py-14 text-[color:var(--color-ink)] sm:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-16 text-center">
            <span className="mb-2 inline-block text-sm font-semibold text-[color:var(--color-brand)]">Why CoachKonnects</span>
            <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
              Built for people who learn for the love of it
            </h2>
          </div>

          <div className="mb-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "🛡️", title: "Passionate coaches", desc: "Every coach is passionate about their craft and dedicated to helping students discover their hidden talents." },
              { icon: "⚡", title: "Hobby Focused Only", desc: "Dance, art, music, chess, yoga and more. No tuition. No pressure." },
              { icon: "🏅", title: "Direct Coach Connect", desc: "Once matched, connect directly with your coach on WhatsApp. Simple and personal." },
              { icon: "❤️", title: "Discover Near You", desc: "Find hobby coaches in your city or online, across Maharashtra - at your schedule and pace." }
            ].map(f => (
              <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 text-left">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-[color:var(--color-brand-light)] text-[color:var(--color-brand)]">
                  {f.icon}
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm text-[color:var(--color-ink-muted)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 border-t border-slate-200/60 pt-10 text-left">
            <div className="lg:col-span-2">
              <Logo className="mb-4" />
              <p className="text-sm text-[color:var(--color-ink-muted)] mt-4 max-w-sm mb-6">
                The premium marketplace where ambitious learners meet world-class coaches. Find your edge.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://whatsapp.com/channel/0029VbBrjCH3LdQYRqt5AI29" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-[#25D366] hover:text-white transition-all shadow-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                </a>
                <a href="https://www.facebook.com/CoachKonnects" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-[#1877F2] hover:text-white transition-all shadow-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="https://www.instagram.com/coachkonnects/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-[#E4405F] hover:text-white transition-all shadow-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
                <a href="https://www.youtube.com/@CoachKonnects" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-[#FF0000] hover:text-white transition-all shadow-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.872.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
              </div>
            </div>
            <div className="flex flex-col lg:items-end">
              <div>
                <h4 className="mb-4 font-semibold text-slate-900">Company</h4>
                <ul className="flex flex-col gap-3 text-sm text-[color:var(--color-ink-muted)]">
                  <li><a href="mailto:support@coachkonnects.com" className="hover:text-[color:var(--color-brand)] transition-colors font-medium">support@coachkonnects.com</a></li>
                  {/* <li><a href="#" className="hover:text-[color:var(--color-brand)] transition-colors font-medium">FAQ</a></li> */}
                  <li><a href="#" className="hover:text-[color:var(--color-brand)] transition-colors font-medium">Terms & Privacy</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-200/60 pt-8 text-sm text-[color:var(--color-ink-muted)] sm:flex-row">
            <p>© 2026 CoachKonnects. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Made with intention in India.</p>
          </div>
        </div>
      </footer>
      {showAllCatsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[2rem] bg-white shadow-2xl flex flex-col">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 sm:p-8 text-center relative shrink-0">
              <button onClick={() => setShowAllCatsModal(false)} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold">×</button>
              <h3 className="font-[var(--font-display)] text-2xl font-bold text-slate-800">All Skills & Hobbies</h3>
              <p className="mt-2 text-sm text-slate-600">Discover everything our coaches have to offer.</p>
            </div>
            <div className="p-6 sm:p-8 overflow-y-auto bg-slate-50 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serverCategories.map((category) => (
                  <div key={category.name} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 transition-shadow hover:shadow-md">
                    <h4 className="font-bold text-slate-800 text-lg mb-1">{category.name}</h4>
                    {category.expertises ? (
                      <p className="text-sm text-orange-600 font-medium leading-relaxed">{category.expertises}</p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">General coaching available</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
