import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/coaches')({
  component: CoachesDirectory,
});

function CoachesDirectory() {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/public/coaches').then(res => res.json()),
      fetch('/api/public/classes').then(res => res.json()).catch(() => [])
    ])
      .then(([coachesData, classesData]) => {
        setCoaches(coachesData);
        setClasses(classesData || []);
      })
      .catch(err => console.error(err));
  }, []);

  const getCoachSpecialties = (coachEmail: string) => {
    const coachClasses = classes.filter(c => c.user?.email === coachEmail);
    const types = new Set(coachClasses.map(c => c.type).filter(t => t && t !== 'REGULAR'));
    return Array.from(types);
  };

  const filteredCoaches = coaches.filter(coach => {
    const searchLower = search.toLowerCase();
    const searchableFields = [
      coach.fullName,
      coach.district,
      coach.state,
      coach.expertise,
      coach.pincode,
      coach.area,
      coach.location,
      coach.user?.email,
      coach.user?.phoneNumber
    ].map(field => (field || '').toLowerCase());

    const matchesSearch = searchableFields.some(field => field.includes(searchLower));
    const matchesCategory = category ? coach.category === category : true;
    return matchesSearch && matchesCategory && coach.status === 'APPROVED';
  });

  const featuredCoaches = filteredCoaches.filter(c => c.isFeatured);
  const regularCoaches = filteredCoaches.filter(c => !c.isFeatured);

  const renderCoachCard = (coach: any, isFeatured: boolean = false) => {
    const specialties = getCoachSpecialties(coach.user?.email);
    return (
      <div key={coach.id} className={`bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border ${isFeatured ? 'border-[#f26b21]' : 'border-gray-100'} overflow-hidden flex flex-col group relative`}>
        {isFeatured && (
          <div className="absolute top-0 right-0 bg-[#f26b21] text-white text-xs font-bold px-4 py-1 rounded-bl-xl z-20 shadow-md">
            FEATURED
          </div>
        )}
        <div 
          className="h-32 bg-gray-100 relative overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: coach.profileImageUrl ? `url(${coach.profileImageUrl})` : 'none' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 opacity-50 group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-6 text-white text-sm font-bold bg-teal-600 px-3 py-1 rounded-full shadow-lg z-10">
            {coach.category}
          </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{coach.fullName}</h3>
          <p className="text-[#f26b21] font-medium mb-3">{coach.expertise}</p>
          
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {specialties.map((type: any) => (
                <span key={type} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700">
                  {type.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
          
          <div className="space-y-2 mb-6">
            <div className="flex items-center text-gray-500 text-sm">
              <span className="mr-2">📍</span>
              {coach.area ? `${coach.area}, ` : ''}{coach.district}, {coach.state}
            </div>
            {coach.classMode && (
              <div className="flex items-center text-gray-500 text-sm">
                <span className="mr-2">👥</span>
                {coach.classMode}
              </div>
            )}
            {coach.pricing && (
              <div className="flex items-center text-gray-500 text-sm">
                <span className="mr-2">💰</span>
                {coach.pricing}
              </div>
            )}
          </div>
          
          <div className="mt-auto">
            <Link 
              to={`/coaches/${coach.slug}` as any}
              className={`block w-full py-3 rounded-xl font-bold transition-all text-center ${isFeatured ? 'bg-[#f26b21] text-white hover:bg-[#e05a10]' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-gray-900 text-white py-16 px-6 sm:px-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#f26b21] via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Find Your Perfect <span className="text-[#f26b21]">Coach</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Browse our curated directory of expert coaches. Whether you're looking to master a new sport, learn a skill, or improve your fitness, we have the right mentor for you.
          </p>

          <div className="flex flex-col sm:flex-row max-w-3xl mx-auto gap-4 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
            <input
              type="text"
              placeholder="Search by name, location, or expertise..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-6 py-4 rounded-xl outline-none text-gray-900 font-medium bg-white/90 placeholder-gray-500 focus:bg-white transition-all"
            />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="px-6 py-4 rounded-xl outline-none text-gray-900 font-medium bg-white/90 focus:bg-white transition-all appearance-none cursor-pointer border-r-8 border-transparent"
            >
              <option value="">All Categories</option>
              <option value="Sports">Sports</option>
              <option value="Fitness">Fitness</option>
              <option value="Academics">Academics</option>
              <option value="Music">Music</option>
              <option value="Arts">Arts</option>
            </select>
          </div>
        </div>
      </header>

      {/* Directory Grid */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 py-16">
        {featuredCoaches.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
              <span className="text-[#f26b21]">★</span> Featured Coaches
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCoaches.map(coach => renderCoachCard(coach, true))}
            </div>
          </div>
        )}

        <div>
          {featuredCoaches.length > 0 && (
            <h2 className="text-3xl font-extrabold text-gray-900 mb-8">All Coaches</h2>
          )}
          {regularCoaches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularCoaches.map(coach => renderCoachCard(coach, false))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No coaches found</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                We couldn't find any coaches matching your search criteria. Try adjusting your filters or search terms.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
