import { createFileRoute } from "@tanstack/react-router";
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
          "Verified hobby coaches near you in Mumbai & across India. Browse, connect on WhatsApp, and enroll — zero booking fees.",
      },
      { property: "og:title", content: "CoachKonnects — Where Hobbies Become Identity" },
      {
        property: "og:description",
        content: "Verified hobby coaches near you. Zero booking fees.",
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
  { title: "Aadhaar‑verified coaches", body: "Not anonymous profiles — every coach confirms their real identity before going live." },
  { title: "Admin‑approved, every time", body: "Nobody appears in search until our team has personally reviewed their profile." },
  { title: "Nearby, not just \"available\"", body: "Real GPS‑based matching, not a pincode guess — so \"near you\" actually means near you." },
  { title: "You control the connection", body: "WhatsApp is only shared once both sides confirm — you're never handed to a stranger." },
  { title: "Zero platform fees", body: "What you pay your coach stays between you and your coach. We don't take a cut." },
  { title: "Hobby‑only, always", body: "Just hobbies. That's the whole point, every time." },
];

const featuredCoaches = [
  { img: garba.url, cat: "Rhythm Stars", name: "Coach name · Garba", loc: "Navi Mumbai" },
  { img: guitar.url, cat: "Rhythm Stars", name: "Coach name · Guitar", loc: "Palava" },
  { img: bharatnatyam.url, cat: "Rhythm Stars", name: "Coach name · Bharatanatyam", loc: "Navi Mumbai" },
  { img: piano.url, cat: "Rhythm Stars", name: "Coach name · Piano", loc: "Palava" },
];

function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#" className={`flex min-w-0 items-center gap-2 ${className}`} aria-label="CoachKonnects">
      <img src={logo.url} alt="CoachKonnects" className="h-9 w-auto shrink-0 sm:h-10" />
    </a>
  );
}

function Index() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white font-[var(--font-sans)] text-[color:var(--color-ink)] antialiased">
      {/* HERO */}
<section className="relative isolate w-full overflow-hidden bg-[color:var(--color-cream)] md:aspect-video md:min-h-[720px] lg:min-h-[760px] xl:min-h-0">
        <picture>
          <source media="(min-width: 768px)" srcSet="/Desktop%20BG.png" />
          <img
            src="/Mobile%20BG1.png"
            alt="Hero background"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full select-none object-cover object-bottom md:object-right-bottom"
          />
        </picture>
        {/* Soft fade for text legibility on the left */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fdf5ed] via-[#fdf5ed]/85 to-transparent md:from-[#fdf5ed] md:via-[#fdf5ed]/70 md:to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-white"
        />

        {/* Header */}
        <header className="relative z-10 w-full pt-4">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
            <Logo />
            <nav className="flex shrink-0 items-center gap-3 sm:gap-5">
              <a
                href="#"
                className="hidden text-sm font-semibold text-[color:var(--color-ink)] transition-colors hover:text-[color:var(--color-brand)] sm:inline"
              >
                Sign in
              </a>
              <a
                href="#"
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[color:var(--color-brand-dark)] sm:px-6 sm:py-2.5"
              >
                Get Started
              </a>
            </nav>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 mx-auto w-full min-w-0 max-w-7xl px-5 pb-24 pt-8 sm:px-8 sm:pb-32 sm:pt-14 md:pb-40 md:pt-16 lg:pb-48 text-left">
          <div className="w-full min-w-0 max-w-lg lg:max-w-[50%] xl:max-w-2xl">
            <span className="mb-5 inline-block rounded-full border border-[#f9ded0] bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--color-brand-dark)] shadow-[0_4px_12px_rgba(242,107,33,0.08)] backdrop-blur">
              🚀 Launching in Mumbai & India
            </span>
            <h1 className="font-[var(--font-display)] text-[clamp(2rem,7vw,68px)] font-bold leading-[1.08] tracking-tight text-balance text-[color:var(--color-ink)]">
              Find the perfect class{" "}
              <em className="font-medium not-italic text-[color:var(--color-ink-muted)] italic">or</em>{" "}
              coach for{" "}
              <span className="text-[color:var(--color-brand)]">your child.</span>
            </h1>
            <p className="mt-5 max-w-lg text-pretty text-base font-medium leading-relaxed text-[color:var(--color-ink-muted)] sm:text-lg md:text-xl">
              Verified hobby coaches near you. Browse, connect directly on WhatsApp,
              and enroll — zero booking fees.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <a
                href="#"
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[color:var(--color-brand)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(242,107,33,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[color:var(--color-brand-dark)] sm:w-auto"
              >
                📍 Find Classes <span aria-hidden="true">→</span>
              </a>
              <a
                href="#"
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white/80 px-7 py-3.5 text-sm font-semibold text-[color:var(--color-ink)] backdrop-blur transition-all hover:border-[color:var(--color-brand)] hover:text-[color:var(--color-brand)] sm:w-auto"
              >
                👤 Are You A Coach?
              </a>
            </div>

            {/* Trust chips */}
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[color:var(--color-ink)] sm:gap-5 sm:text-[15px]">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[color:var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Verified Coaches
                </div>
                <div className="h-5 w-px bg-slate-300"></div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[color:var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Online & Offline
                </div>
                <div className="h-5 w-px bg-slate-300"></div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[color:var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Across India
                </div>
              </div>
              <div className="flex items-center gap-3">
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
            <div className="mt-8 w-full min-w-0 max-w-xl">
              <div className="flex w-full min-w-0 flex-col gap-2 rounded-2xl border border-black/5 bg-white p-3 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-1.5 sm:pl-5">
                <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 pb-2 text-sm font-medium text-[color:var(--color-ink-muted)] sm:whitespace-nowrap sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
                  <span className="shrink-0 text-[color:var(--color-brand)]">📍</span> Navi Mumbai & India
                </div>
                <input
                  type="text"
                  placeholder="Search a skill or hobby"
                  className="w-full min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-slate-400 sm:px-4"
                />
                <button className="shrink-0 whitespace-nowrap rounded-full bg-[color:var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[color:var(--color-brand-dark)]">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES — overlapping hero */}
      <div className="relative z-20 mx-auto -mt-28 w-full min-w-0 max-w-7xl px-5 sm:-mt-32 sm:px-8">
        <div className="rounded-3xl border border-white/80 bg-white/96 p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] backdrop-blur-xl sm:p-8 md:p-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <button
                key={c.title}
                className="group flex cursor-pointer flex-col items-center rounded-2xl border border-slate-100 bg-white p-6 text-center transition-all hover:-translate-y-2 hover:border-[color:var(--color-brand-light)] hover:shadow-[0_20px_40px_-12px_rgba(242,107,33,0.15)]"
              >
                <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[color:var(--color-brand-light)] text-3xl text-[color:var(--color-brand)] sm:h-20 sm:w-20 sm:text-4xl">
                  {c.icon}
                </div>
                <h3 className="mb-2 font-[var(--font-display)] text-base font-bold text-[color:var(--color-ink)]">
                  {c.title}
                </h3>
                <p className="text-xs leading-snug text-[color:var(--color-ink-muted)] sm:text-[13px]">
                  {c.desc}
                </p>
              </button>
            ))}
          </div>
          <p className="mt-8 text-center text-sm font-medium text-[color:var(--color-ink-muted)]">
            And many more hobbies to explore…
          </p>
          <div className="mt-8 text-center">
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--color-brand)] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(242,107,33,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[color:var(--color-brand-dark)]"
            >
              View all categories
            </a>
          </div>
        </div>
      </div>

      {/* SPARK SECTION */}
      <section className="w-full px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
          <div className="min-w-0">
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
                  className="absolute inset-0 h-full w-full object-contain p-2"
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
              <article
                key={c.name}
                className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(242,107,33,0.15)]"
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100">
                  <img
                    src={c.img}
                    alt={c.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-contain p-3"
                  />
                </div>
                <div className="p-5">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.05em] text-[color:var(--color-brand-dark)]">
                    {c.cat}
                  </div>
                  <h4 className="font-[var(--font-display)] text-lg font-bold">{c.name}</h4>
                  <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">📍 {c.loc}</p>
                </div>
              </article>
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
            <div className="min-w-0">
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
              <a
                href="#"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-[color:var(--color-brand)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(242,107,33,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[color:var(--color-brand-dark)]"
              >
                ✨ Start Teaching — It's Free
              </a>
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

      {/* FINAL CTA */}
      <section className="w-full px-5 pb-24 sm:px-8">
        <div className="mx-auto w-full max-w-4xl text-center">
          <h2 className="font-[var(--font-display)] text-[clamp(1.75rem,5vw,3rem)] font-bold leading-tight tracking-tight text-balance">
            Stop scrolling group chats. <br />Start finding the right coach.
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <a
              href="#"
              className="inline-flex w-full items-center justify-center rounded-full bg-[color:var(--color-brand)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(242,107,33,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[color:var(--color-brand-dark)] sm:w-auto"
            >
              🔍 Find Classes Near You
            </a>
            <a
              href="#"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-[color:var(--color-ink)] transition-all hover:border-[color:var(--color-brand)] hover:text-[color:var(--color-brand)] sm:w-auto"
            >
              ✨ Are You a Coach? Join Free
            </a>
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
              { icon: "🛡️", title: "Verified coaches", desc: "Every coach is personally reviewed and Aadhaar-verified by our team before going live." },
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

          <div className="grid grid-cols-1 gap-8 border-t border-slate-200/60 pt-10 text-left md:grid-cols-4">
            <div className="md:col-span-1">
              <Logo className="mb-4" />
              <p className="text-sm text-[color:var(--color-ink-muted)] mt-4">
                The premium marketplace where ambitious learners meet world-class coaches. Find your edge.
              </p>
            </div>
            
            <div>
              <h4 className="mb-4 font-semibold">Platform</h4>
              <ul className="flex flex-col gap-2 text-sm text-[color:var(--color-ink-muted)]">
                <li><a href="#" className="hover:text-[color:var(--color-brand)] transition-colors">Find Coaches</a></li>
                <li><a href="#" className="hover:text-[color:var(--color-brand)] transition-colors">Become a Coach</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4 font-semibold">Company</h4>
              <ul className="flex flex-col gap-2 text-sm text-[color:var(--color-ink-muted)]">
                <li><a href="#" className="hover:text-[color:var(--color-brand)] transition-colors">About</a></li>
                <li><a href="#" className="hover:text-[color:var(--color-brand)] transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-[color:var(--color-brand)] transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-[color:var(--color-brand)] transition-colors">Terms & Privacy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4 font-semibold">Dashboards</h4>
              <ul className="flex flex-col gap-2 text-sm text-[color:var(--color-ink-muted)]">
                <li><a href="#" className="hover:text-[color:var(--color-brand)] transition-colors">Student</a></li>
                <li><a href="#" className="hover:text-[color:var(--color-brand)] transition-colors">Coach</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-200/60 pt-8 text-sm text-[color:var(--color-ink-muted)] sm:flex-row">
            <p>© 2026 CoachKonnects. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Made with intention in India.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
