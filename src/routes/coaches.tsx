import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Filter, ArrowRight, User } from 'lucide-react';

export const Route = createFileRoute('/coaches')({
  component: CoachesDirectory,
});

function CoachesDirectory() {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('adminToken')) : null;

  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [coaches, setCoaches] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/coaches').then(res => res.json()),
      fetch('/api/public/classes').then(res => res.json()).catch(() => []),
      fetch('/api/categories').then(res => res.json()).catch(() => [])
    ])
      .then(([coachesData, classesData, catsData]) => {
        setCoaches(coachesData);
        setClasses(classesData || []);
        setCategoriesList(catsData || []);
      })
      .catch(err => console.error(err));
  }, []);

  const filteredCoaches = coaches.filter(c => {
    const coachClasses = classes.filter(cls => cls.coachId === c.user?.id && (cls.status === 'APPROVED' || !cls.status));
    
    const searchStr = search ? search.toLowerCase().trim() : '';
    const matchSearch = searchStr ? (
      String(c.fullName || '').toLowerCase().includes(searchStr) || 
      String(c.area || '').toLowerCase().includes(searchStr) ||
      String(c.district || '').toLowerCase().includes(searchStr) ||
      String(c.pincode || '').toLowerCase().includes(searchStr) ||
      String(c.category || '').toLowerCase().includes(searchStr) ||
      String(c.expertise || '').toLowerCase().includes(searchStr) ||
      String(c.user?.email || '').toLowerCase().includes(searchStr) ||
      String(c.user?.phoneNumber || '').toLowerCase().includes(searchStr) ||
      coachClasses.some(cls => String(cls.category || '').toLowerCase().includes(searchStr)) ||
      String(c.headline || '').toLowerCase().includes(searchStr)
    ) : true;
    
    const matchCategory = category ? (
      c.category === category || coachClasses.some(cls => cls.category === category)
    ) : true;
    
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/50 to-orange-50/30 font-sans pb-24">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate({ to: '/' })}>
             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
               <img src="/homelogo.png" alt="Logo" className="w-8 h-8" />
             </div>
             <span className="text-xl font-black text-slate-800 tracking-tight hidden sm:block">CoachKonnects</span>
          </div>
          <div className="flex items-center gap-6">
            {!token && (
              <Link to="/login" className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm transition-colors border border-slate-200/50">
                Log In
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Header & Search */}
        <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[2rem] shadow-xl p-8 mb-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-bl-full -z-10 blur-3xl"></div>
           
           <h1 className="text-4xl font-black text-slate-800 mb-6 tracking-tight">Find Your Perfect Coach</h1>
           
           <div className="flex flex-col md:flex-row gap-4">
             <div className="flex-1 relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500" />
               <input 
                 type="text" 
                 placeholder="Search by name, location, or expertise..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full pl-12 pr-4 py-4 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-bold text-slate-800 placeholder:text-slate-400 shadow-sm"
               />
             </div>
             <div className="relative md:w-64">
               <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500 pointer-events-none" />
               <select 
                 value={category}
                 onChange={(e) => setCategory(e.target.value)}
                 className="w-full pl-12 pr-4 py-4 bg-white/60 border border-slate-200/50 rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-800 appearance-none shadow-sm cursor-pointer"
               >
                 <option value="">All Categories</option>
                 {categoriesList.map((cat: any) => (
                   <option key={cat.id} value={cat.name}>{cat.name}</option>
                 ))}
               </select>
             </div>
           </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCoaches.map((coach: any) => {
             const coachClasses = classes.filter(cls => cls.coachId === coach.user?.id);
             const rating = coach.averageRating > 0 ? coach.averageRating.toFixed(1) : "New";
             const reviews = 12; // placeholder

             return (
               <Link 
                 key={coach.id} 
                 to="/portfolio/$slug" params={{ slug: coach.id }}
                 className="group bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col"
               >
                 {/* Top Image/Gradient Section */}
                 <div className="h-32 relative">
                   {coach.groupImageUrl || coach.coverPhotoUrl ? (
                     <img src={coach.groupImageUrl || coach.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full bg-gradient-to-r from-teal-900 to-[#f26b21]"></div>
                   )}
                   <div className="absolute -bottom-10 left-6">
                     <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center p-1">
                       {coach.profilePhotoUrl || coach.profileImageUrl ? (
                         <img src={coach.profilePhotoUrl || coach.profileImageUrl} alt={coach.fullName} className="w-full h-full object-cover rounded-xl" />
                       ) : (
                         <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                           <User className="w-8 h-8" />
                         </div>
                       )}
                     </div>
                   </div>
                   <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold text-sm flex items-center gap-1 border border-white/30">
                     <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> 
                      {rating} 
                      {coach.reviewCount > 0 && <span className="text-[10px] text-white/70 ml-1">({coach.reviewCount})</span>}
                   </div>
                 </div>

                 {/* Body */}
                 <div className="pt-14 p-6 flex-1 flex flex-col">
                   <h2 className="text-xl font-black text-slate-800 mb-1 group-hover:text-teal-600 transition-colors">{coach.fullName}</h2>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 line-clamp-1">
                     {coach.headline || 'Professional Coach'}
                   </p>
                   
                   <div className="flex items-center gap-2 text-slate-600 text-sm font-medium mb-6">
                     <MapPin className="w-4 h-4 text-orange-500" />
                     {coach.area ? `${coach.area}, ` : ''}{coach.district}
                   </div>

                   {/* Tags */}
                   <div className="flex flex-wrap gap-2 mb-6 flex-1 content-start">
                     {coachClasses.slice(0, 3).map((cls, i) => (
                       <span key={i} className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold border border-teal-100/50">
                         {cls.category}
                       </span>
                     ))}
                     {coachClasses.length > 3 && (
                       <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-xs font-bold border border-slate-200">
                         +{coachClasses.length - 3}
                       </span>
                     )}
                   </div>
                   
                   <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-auto">
                     <span className="text-sm font-bold text-slate-500">
                       {coachClasses.length} Active Classes & Workshops
                     </span>
                     <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white text-orange-500 transition-colors">
                       <ArrowRight className="w-5 h-5" />
                     </div>
                   </div>
                 </div>
               </Link>
             )
          })}
        </div>

        {filteredCoaches.length === 0 && (
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] shadow-sm p-16 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">No coaches found</h3>
            <p className="text-slate-500 font-medium">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </main>
    </div>
  );
}
