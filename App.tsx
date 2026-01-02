
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, Message, Worker, VerificationStatus } from './types.ts';
import { SERVICE_CATEGORIES, WILAYAS } from './constants.tsx';
import { supabase } from './lib/supabase.ts';
import { 
  MapPin, 
  Star, 
  User as UserIcon, 
  LogOut, 
  Settings, 
  Phone, 
  MessageSquare,
  Home,
  Search,
  ClipboardList,
  Camera,
  Image as ImageIcon,
  X,
  ChevronLeft,
  Award,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Eye,
  UserCheck,
  UserX,
  Briefcase
} from 'lucide-react';

// --- Components ---

const VerificationBadge = ({ status, size = 'md' }: { status?: VerificationStatus, size?: 'sm' | 'md' }) => {
  const isSm = size === 'sm';
  switch (status) {
    case 'verified':
      return (
        <div className={`flex items-center gap-1.5 text-emerald-600 bg-emerald-50 ${isSm ? 'px-2 py-0.5 rounded-lg' : 'px-4 py-1.5 rounded-full'} border border-emerald-100 font-black ${isSm ? 'text-[9px]' : 'text-xs'} animate-in fade-in`}>
          <span className={`${isSm ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'} bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]`}></span>
          {isSm ? 'مفعل' : 'حساب مفعل'}
        </div>
      );
    case 'pending':
      return (
        <div className={`flex items-center gap-1.5 text-orange-600 bg-orange-50 ${isSm ? 'px-2 py-0.5 rounded-lg' : 'px-4 py-1.5 rounded-full'} border border-orange-100 font-black ${isSm ? 'text-[9px]' : 'text-xs'}`}>
          <span className={`${isSm ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'} bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]`}></span>
          {isSm ? 'انتظار' : 'قيد التفعيل'}
        </div>
      );
    default:
      return (
        <div className={`flex items-center gap-1.5 text-red-600 bg-red-50 ${isSm ? 'px-2 py-0.5 rounded-lg' : 'px-4 py-1.5 rounded-full'} border border-red-100 font-black ${isSm ? 'text-[9px]' : 'text-xs'}`}>
          <span className={`${isSm ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'} bg-red-500 rounded-full`}></span>
          {isSm ? 'غير مفعل' : 'غير مفعل'}
        </div>
      );
  }
};

const GlobalStyles = () => (
  <style>{`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: fadeIn 0.4s ease-out forwards; }
    .arabic-text { font-family: 'Tajawal', sans-serif; }
    .loading-spinner { border: 3px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 32px; height: 32px; animation: spin 0.8s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
    .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
    .nav-item-active { color: #059669; transform: scale(1.1); }
    .nav-item-active .icon-container { background: #ecfdf5; border-radius: 12px; }
    input, select, textarea { font-size: 16px !important; } /* Prevent auto-zoom on iOS */
  `}</style>
);

const Logo = ({ onClick, size = 'md' }: { onClick?: () => void, size?: 'sm' | 'md' }) => (
  <div onClick={onClick} className="flex items-center gap-2 cursor-pointer group">
    <div className={`${size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'} bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg transition-transform group-active:scale-90`}>S</div>
    <span className={`${size === 'sm' ? 'text-lg' : 'text-xl md:text-2xl'} font-black text-slate-900 tracking-tight`}>Salakni <span className="text-emerald-600">سلكني</span></span>
  </div>
);

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { currentUser: saved ? JSON.parse(saved) : null, workers: [], view: 'landing' };
  });
  const [loading, setLoading] = useState(false);
  const [chatTarget, setChatTarget] = useState<User | null>(null);
  const [searchFilters, setSearchFilters] = useState({ query: '', wilaya: '', category: '' });

  const setView = (view: AppState['view']) => {
    setState(prev => ({ ...prev, view }));
    window.scrollTo(0, 0);
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('users').select('*').eq('role', UserRole.WORKER);
      if (searchFilters.wilaya) query = query.eq('wilaya', searchFilters.wilaya);
      if (searchFilters.category) query = query.contains('categories', [searchFilters.category]);
      
      const { data, error } = await query;
      if (error) throw error;
      
      let results = (data || []).map(d => ({
        ...d, firstName: d.first_name, lastName: d.last_name, location: { wilaya: d.wilaya }, 
        rating: d.rating || 0, ratingCount: d.rating_count || 0, categories: d.categories || [], portfolio: d.portfolio || [],
        verificationStatus: d.verification_status || 'none', idFront: d.id_front, idBack: d.id_back
      }));

      if (searchFilters.query) {
        const q = searchFilters.query.toLowerCase();
        results = results.filter(w => 
          w.firstName.toLowerCase().includes(q) || 
          w.lastName.toLowerCase().includes(q) ||
          (w.bio && w.bio.toLowerCase().includes(q))
        );
      }

      setState(prev => ({ ...prev, workers: results }));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (state.view === 'search') fetchWorkers();
  }, [state.view, searchFilters.wilaya, searchFilters.category]);

  const updateCurrentUser = (u: User | null) => {
    setState(prev => ({ ...prev, currentUser: u }));
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user');
  };

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-24 md:pb-0" dir="rtl">
      <GlobalStyles />
      
      {/* Navbar Desktop */}
      <nav className="hidden md:flex h-20 bg-white/90 backdrop-blur-md border-b sticky top-0 z-50 items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} />
          <div className="flex items-center gap-6">
            <button onClick={() => setView('search')} className={`font-bold transition-colors ${state.view === 'search' ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-500'}`}>تصفح الحرفيين</button>
            <button onClick={() => setView('support')} className={`font-bold transition-colors ${state.view === 'support' ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-500'}`}>سوق المهام</button>
            {state.currentUser?.role === UserRole.ADMIN && (
              <button onClick={() => setView('admin-panel')} className="font-black text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl"><ShieldCheck size={18} /> الإدارة</button>
            )}
            {state.currentUser ? (
              <div onClick={() => { setChatTarget(null); setView('profile'); }} className="flex items-center gap-3 cursor-pointer bg-slate-100 pl-4 pr-1 py-1 rounded-full hover:bg-emerald-50 transition-colors border border-slate-200">
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
                <span className="font-black text-sm">{state.currentUser.firstName}</span>
              </div>
            ) : (
              <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">دخول</button>
            )}
          </div>
        </div>
      </nav>

      {/* Header Mobile */}
      <header className="md:hidden flex h-16 bg-white border-b sticky top-0 z-40 items-center px-5 justify-between">
        <Logo size="sm" onClick={() => setView('landing')} />
        {state.currentUser && (
          <img 
            onClick={() => { setChatTarget(null); setView('profile'); }} 
            src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} 
            className="w-9 h-9 rounded-full object-cover border-2 border-emerald-100" 
          />
        )}
      </header>

      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onSearch={() => setView('search')} />}
        {state.view === 'search' && <SearchWorkersView workers={state.workers} loading={loading} filters={searchFilters} onFilterChange={setSearchFilters} onProfile={(w: User) => { setChatTarget(w); setView('profile'); }} onRefresh={fetchWorkers} />}
        
        {state.view === 'profile' && (state.currentUser || chatTarget) && (
          <ProfileView 
            user={chatTarget || state.currentUser!} 
            isOwn={!chatTarget || chatTarget?.id === state.currentUser?.id} 
            onEdit={() => setView('edit-profile')} 
            onLogout={() => { updateCurrentUser(null); setView('landing'); }}
            onBack={() => { setChatTarget(null); setView('search'); }}
          />
        )}

        {state.view === 'edit-profile' && state.currentUser && (
          <EditProfileView 
            user={state.currentUser} 
            onSave={(u: User) => { updateCurrentUser(u); setView('profile'); }}
            onCancel={() => setView('profile')}
          />
        )}

        {state.view === 'admin-panel' && state.currentUser?.role === UserRole.ADMIN && (
          <AdminPanelView />
        )}

        {state.view === 'login' && <AuthForm onSuccess={(u: User) => { updateCurrentUser(u); setView('profile'); }} />}
        
        {state.view === 'support' && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6">
              <ClipboardList size={40} />
            </div>
            <h2 className="text-2xl font-black mb-2">سوق المهام قريباً</h2>
            <p className="text-slate-500 font-bold">نحن نعمل على إطلاق منصة لطلب الخدمات المباشرة.</p>
          </div>
        )}
      </main>

      {/* Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t px-6 py-3 flex justify-between md:hidden z-50 rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.08)] border-slate-100">
        <button onClick={() => setView('landing')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${state.view === 'landing' ? 'nav-item-active' : 'text-slate-400'}`}>
          <div className="icon-container p-2 transition-colors"><Home size={22} strokeWidth={state.view === 'landing' ? 2.5 : 2} /></div>
          <span className="text-[10px] font-black">الرئيسية</span>
        </button>
        <button onClick={() => setView('search')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${state.view === 'search' ? 'nav-item-active' : 'text-slate-400'}`}>
          <div className="icon-container p-2 transition-colors"><Search size={22} strokeWidth={state.view === 'search' ? 2.5 : 2} /></div>
          <span className="text-[10px] font-black">البحث</span>
        </button>
        <button onClick={() => setView('support')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${state.view === 'support' ? 'nav-item-active' : 'text-slate-400'}`}>
          <div className="icon-container p-2 transition-colors"><Briefcase size={22} strokeWidth={state.view === 'support' ? 2.5 : 2} /></div>
          <span className="text-[10px] font-black">المهام</span>
        </button>
        <button onClick={() => { setChatTarget(null); state.currentUser ? setView('profile') : setView('login'); }} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${state.view === 'profile' ? 'nav-item-active' : 'text-slate-400'}`}>
          <div className="icon-container p-2 transition-colors"><UserIcon size={22} strokeWidth={state.view === 'profile' ? 2.5 : 2} /></div>
          <span className="text-[10px] font-black">حسابي</span>
        </button>
      </div>
    </div>
  );
}

// --- Responsive Views ---

const LandingView = ({ onSearch }: any) => (
  <div className="relative min-h-[85vh] flex items-center justify-center text-center px-6 overflow-hidden">
    <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/60 to-slate-900"></div>
    <div className="relative z-10 max-w-4xl animate-in">
      <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight">سَلّكني يسلكها <br className="md:hidden" /><span className="text-emerald-400">في الحين!</span></h1>
      <p className="text-base md:text-2xl text-slate-300 mb-10 font-medium px-4">أفضل الحرفيين في الجزائر بانتظارك. تواصل مباشر، أمان، وجدارة.</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
        <button onClick={onSearch} className="bg-emerald-600 text-white px-10 py-4.5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/40 active:scale-95 transition-all">ابدأ البحث 🔍</button>
        <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-4.5 rounded-2xl font-black text-lg active:scale-95 transition-all">تعرف علينا</button>
      </div>
    </div>
  </div>
);

const SearchWorkersView = ({ workers, loading, filters, onFilterChange, onProfile, onRefresh }: any) => (
  <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 animate-in">
    <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-lg border border-slate-100 mb-8 md:mb-12 space-y-4">
      <div className="relative">
        <input 
          placeholder="ابحث عن حرفي بالاسم..." 
          className="w-full p-4.5 pr-12 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all outline-none" 
          value={filters.query} 
          onChange={e => onFilterChange({...filters, query: e.target.value})} 
        />
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <select 
          className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none appearance-none cursor-pointer" 
          value={filters.wilaya} 
          onChange={e => onFilterChange({...filters, wilaya: e.target.value})}
        >
          <option value="">كل الجزائر 🇩🇿</option>
          {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <select 
          className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none appearance-none cursor-pointer" 
          value={filters.category} 
          onChange={e => onFilterChange({...filters, category: e.target.value})}
        >
          <option value="">كل التخصصات ⚒️</option>
          {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      <button 
        onClick={onRefresh} 
        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl active:scale-98 transition-all md:hidden"
      >
        بحث
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
      {loading ? (
        <div className="col-span-full py-20 flex flex-col items-center gap-4">
          <div className="loading-spinner"></div>
          <p className="text-slate-400 font-bold">جاري تحميل الحرفيين...</p>
        </div>
      ) : workers.length === 0 ? (
        <div className="col-span-full py-20 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Search size={32} />
          </div>
          <p className="text-slate-500 font-black text-xl">لا يوجد حرفيون يطابقون بحثك</p>
          <button onClick={() => onFilterChange({query:'', wilaya:'', category:''})} className="mt-4 text-emerald-600 font-bold underline">إعادة ضبط الفلاتر</button>
        </div>
      ) : workers.map((w: any) => (
        <div 
          key={w.id} 
          onClick={() => onProfile(w)} 
          className="bg-white p-5 md:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-md border border-slate-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden"
        >
          <div className="flex items-center gap-4 mb-5">
            <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-sm bg-slate-50 border border-slate-100" />
            <div className="text-right flex-1 min-w-0">
              <h3 className="text-lg md:text-xl font-black text-slate-900 truncate group-hover:text-emerald-600 transition-colors">{w.firstName} {w.lastName}</h3>
              <div className="flex gap-2 flex-wrap mt-1.5">
                <VerificationBadge status={w.verificationStatus} size="sm" />
              </div>
            </div>
          </div>
          <p className="text-slate-500 text-sm line-clamp-2 h-10 mb-6 font-medium leading-relaxed">{w.bio || 'حرفي مسجل في سلكني مستعد لخدمتكم بأفضل جودة.'}</p>
          <div className="flex justify-between items-center pt-4 border-t border-slate-50">
            <span className="text-slate-400 text-[11px] md:text-xs font-black flex items-center gap-1"><MapPin size={12} className="text-emerald-500" /> {w.wilaya}</span>
            <div className="flex items-center gap-1 text-yellow-500 font-black text-sm"><Star size={16} fill="currentColor" /> {w.rating?.toFixed(1) || '0.0'}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProfileView = ({ user, isOwn, onEdit, onLogout, onBack }: any) => (
  <div className="max-w-5xl mx-auto py-6 md:py-16 px-4 md:px-6 animate-in">
    <div className="mb-6 flex justify-between items-center">
      {!isOwn ? (
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold hover:text-emerald-600 transition-colors"><ChevronLeft size={20} /> العودة</button>
      ) : <div></div>}
      {isOwn && (
        <div className="flex gap-2">
          <button onClick={onEdit} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-emerald-50 transition-colors shadow-sm"><Settings size={22} className="text-slate-600" /></button>
          <button onClick={onLogout} className="p-3 bg-red-50 text-red-500 border border-red-100 rounded-2xl hover:bg-red-500 hover:text-white transition-colors shadow-sm"><LogOut size={22} /></button>
        </div>
      )}
    </div>
    
    <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl overflow-hidden border border-slate-100">
      <div className="h-32 md:h-48 bg-gradient-to-r from-emerald-600 to-teal-400"></div>
      <div className="px-5 md:px-12 pb-10 relative -mt-16 md:-mt-24">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-10 text-center md:text-right">
          <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&background=10b981&color=fff`} className="w-36 h-36 md:w-44 md:h-44 rounded-[2.2rem] md:rounded-[2.5rem] border-[6px] md:border-8 border-white shadow-xl object-cover bg-white" />
          <div className="flex-1 space-y-2">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">{user.firstName} {user.lastName}</h2>
              <VerificationBadge status={user.verificationStatus} />
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              {user.role === UserRole.WORKER ? (
                user.categories?.map((c: string) => <span key={c} className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black border border-emerald-100">{c}</span>)
              ) : <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black border border-blue-100">زبون مميز</span>}
              <span className="text-slate-400 font-bold text-xs bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 flex items-center gap-1"><MapPin size={12} /> {user.location.wilaya}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-50/50 p-6 rounded-3xl text-center border border-slate-100">
              <p className="text-slate-400 font-black text-xs uppercase mb-1">التقييم</p>
              <div className="text-4xl font-black text-yellow-500 flex items-center justify-center gap-2">
                <Star size={36} fill="currentColor" /> {user.rating?.toFixed(1) || '0.0'}
              </div>
              <p className="text-[10px] text-slate-400 font-bold mt-1">من {user.ratingCount || 0} زبائن</p>
            </div>
            <div className="bg-slate-900 text-white p-7 rounded-[2rem] shadow-xl">
              <h4 className="font-black mb-4 flex items-center gap-2 text-sm"><Phone className="text-emerald-400" size={18} /> تواصل مباشر</h4>
              <p className="text-2xl font-mono text-center mb-6 tracking-widest">{user.phone}</p>
              <button className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-emerald-900/20">اتصال هاتفـي</button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <h4 className="text-lg font-black mb-4 flex items-center gap-3 text-slate-900"><Award className="text-emerald-500" size={20} /> نبذة عن الحرفي</h4>
              <p className="text-slate-600 leading-relaxed font-medium text-base">{user.bio || 'لم يكتب هذا الحرفي نبذة شخصية حتى الآن.'}</p>
            </div>

            {user.role === UserRole.WORKER && (
              <div>
                <h4 className="text-lg font-black mb-5 flex items-center gap-3 text-slate-900 px-2"><ImageIcon className="text-emerald-500" size={20} /> معرض الأعمال</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                  {user.portfolio && user.portfolio.length > 0 ? user.portfolio.map((img: string, idx: number) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden shadow-md group relative border-2 border-white transition-transform active:scale-95">
                      <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    </div>
                  )) : (
                    <div className="col-span-full py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center text-slate-400 font-bold">لا توجد أعمال معروضة حالياً</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const EditProfileView = ({ user, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio || '',
    avatar: user.avatar || '',
    categories: user.categories || [],
    wilaya: user.location.wilaya,
    portfolio: user.portfolio || [],
    idFront: user.idFront || '',
    idBack: user.idBack || '',
    verificationStatus: user.verificationStatus || 'none'
  });
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'portfolio' | 'idFront' | 'idBack') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'avatar') setFormData(prev => ({ ...prev, avatar: base64 }));
      else if (type === 'idFront') setFormData(prev => ({ ...prev, idFront: base64 }));
      else if (type === 'idBack') setFormData(prev => ({ ...prev, idBack: base64 }));
      else {
        if (formData.portfolio.length >= 5) { alert('الحد الأقصى 5 صور'); return; }
        setFormData(prev => ({ ...prev, portfolio: [...prev.portfolio, base64] }));
      }
    };
    reader.readAsDataURL(files[0]);
  };

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isSendingNewVerification = 
        (formData.idFront !== user.idFront || formData.idBack !== user.idBack) && 
        formData.idFront && formData.idBack;

      const newStatus = isSendingNewVerification ? 'pending' : formData.verificationStatus;

      const { error } = await supabase.from('users').update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
        avatar: formData.avatar,
        categories: formData.categories,
        wilaya: formData.wilaya,
        portfolio: formData.portfolio,
        id_front: formData.idFront,
        id_back: formData.idBack,
        verification_status: newStatus
      }).eq('id', user.id);
      
      if (error) throw error;
      onSave({ ...user, ...formData, verificationStatus: newStatus });
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 md:py-12 md:px-6 animate-in">
      <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-slate-100">
        <h2 className="text-2xl md:text-3xl font-black mb-8 text-slate-900 border-r-4 md:border-r-8 border-emerald-500 pr-4">إعدادات الحساب ⚙️</h2>
        
        <form onSubmit={submit} className="space-y-10 md:space-y-12">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.firstName}`} className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] md:rounded-[2.5rem] object-cover border-4 border-emerald-50 shadow-lg bg-slate-50" />
              <div className="absolute inset-0 bg-black/40 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center opacity-0 group-active:opacity-100 md:group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={32} />
              </div>
            </div>
            <p className="text-xs font-black text-slate-400">تغيير الصورة الشخصية</p>
            <input type="file" hidden ref={avatarInputRef} accept="image/*" onChange={e => handleImageUpload(e, 'avatar')} />
          </div>

          {/* Verification (Mobile-friendly) */}
          {user.role === UserRole.WORKER && (
            <div className="bg-emerald-50/50 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-emerald-100">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-emerald-600" size={24} />
                <h4 className="text-lg md:text-xl font-black text-emerald-900">توثيق الهوية</h4>
              </div>
              <p className="text-slate-600 text-[13px] md:text-sm mb-6 font-bold leading-relaxed">ارفع صورة واضحة لبطاقة هويتك (الوجه والأمام) ليتم تفعيل حسابك وإظهار العلامة الخضراء للزبائن.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div onClick={() => idFrontRef.current?.click()} className="aspect-video bg-white border-2 border-dashed border-emerald-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer active:bg-emerald-100 transition-all overflow-hidden relative">
                  {formData.idFront ? <img src={formData.idFront} className="w-full h-full object-cover" /> : (
                    <div className="text-center p-4">
                      <ImageIcon className="text-emerald-300 mx-auto" size={32} />
                      <span className="text-[10px] font-black text-emerald-600 mt-2 block">الوجه الأمامي للبطاقة</span>
                    </div>
                  )}
                  <input type="file" hidden ref={idFrontRef} accept="image/*" onChange={e => handleImageUpload(e, 'idFront')} />
                </div>
                <div onClick={() => idBackRef.current?.click()} className="aspect-video bg-white border-2 border-dashed border-emerald-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer active:bg-emerald-100 transition-all overflow-hidden relative">
                  {formData.idBack ? <img src={formData.idBack} className="w-full h-full object-cover" /> : (
                    <div className="text-center p-4">
                      <ImageIcon className="text-emerald-300 mx-auto" size={32} />
                      <span className="text-[10px] font-black text-emerald-600 mt-2 block">الوجه الخلفي للبطاقة</span>
                    </div>
                  )}
                  <input type="file" hidden ref={idBackRef} accept="image/*" onChange={e => handleImageUpload(e, 'idBack')} />
                </div>
              </div>
              <div className="mt-5">
                <VerificationBadge status={formData.verificationStatus} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-black text-sm text-slate-700 mr-1">الاسم الأول</label>
              <input required className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-emerald-100" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="font-black text-sm text-slate-700 mr-1">اللقب (العائلة)</label>
              <input required className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-emerald-100" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block font-black text-sm text-slate-700 mb-3 mr-1">التخصصات (الحرف) ⚒️</label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_CATEGORIES.map(c => (
                <button 
                  key={c.id} 
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    categories: prev.categories.includes(c.name) ? prev.categories.filter(x => x !== c.name) : [...prev.categories, c.name]
                  }))}
                  className={`px-4 py-2.5 rounded-xl font-black text-[11px] border-2 transition-all ${formData.categories.includes(c.name) ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-black text-sm text-slate-700 mr-1">نبذة تعريفية</label>
            <textarea className="w-full p-5 bg-slate-50 rounded-2xl font-bold h-32 border-none outline-none focus:ring-2 ring-emerald-100" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="اكتب خبرتك بكلمات بسيطة للزبائن..." />
          </div>

          <div>
            <label className="block font-black text-sm text-slate-700 mb-4 mr-1">معرض أعمالك (أضف حتى 5 صور) 📸</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {formData.portfolio.map((img: string, idx: number) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-slate-100">
                  <img src={img} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormData(prev => ({...prev, portfolio: prev.portfolio.filter((_, i) => i !== idx)}))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg shadow-md"><Trash2 size={12} /></button>
                </div>
              ))}
              {formData.portfolio.length < 5 && (
                <div onClick={() => portfolioInputRef.current?.click()} className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer active:bg-emerald-50">
                  <Plus size={24} />
                  <span className="text-[8px] font-black mt-1">إضافة</span>
                </div>
              )}
            </div>
            <input type="file" hidden ref={portfolioInputRef} accept="image/*" onChange={e => handleImageUpload(e, 'portfolio')} />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/20 active:scale-95 transition-all">
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات ✅'}
            </button>
            <button type="button" onClick={onCancel} className="w-full bg-slate-100 text-slate-600 py-5 rounded-2xl font-black text-lg active:scale-95">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Admin, Auth, etc (Rest of App.tsx logic remains similar but refined) ---

const AdminPanelView = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('users').select('*').eq('verification_status', 'pending');
    if (!error) setPendingUsers((data || []).map(d => ({
      ...d, firstName: d.first_name, lastName: d.last_name, location: { wilaya: d.wilaya }, 
      idFront: d.id_front, idBack: d.id_back, verificationStatus: d.verification_status
    })));
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (userId: string, status: VerificationStatus) => {
    const { error } = await supabase.from('users').update({ verification_status: status }).eq('id', userId);
    if (!error) {
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      setSelectedUser(null);
      alert(status === 'verified' ? 'تم التفعيل ✅' : 'تم الرفض ❌');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 md:py-12 px-4 md:px-6 animate-in">
      <h2 className="text-2xl md:text-4xl font-black mb-8 flex items-center gap-3"><ShieldCheck className="text-emerald-600" /> مراجعة الحسابات</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100 overflow-y-auto max-h-[60vh] md:max-h-[70vh]">
          <h3 className="font-black text-slate-400 mb-6 uppercase text-[10px] tracking-widest">طلبات التفعيل ({pendingUsers.length})</h3>
          <div className="space-y-4">
            {pendingUsers.length === 0 ? <p className="text-center py-10 text-slate-400 font-bold">لا توجد طلبات</p> : pendingUsers.map(u => (
              <div key={u.id} onClick={() => setSelectedUser(u)} className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-4 ${selectedUser?.id === u.id ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-transparent shadow-sm hover:shadow-md border'}`}>
                <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.firstName}`} className="w-12 h-12 rounded-xl object-cover" />
                <div className="text-right min-w-0 flex-1">
                  <p className="font-black text-slate-900 truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-[10px] text-slate-400 font-bold tracking-tight">📍 {u.location.wilaya}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-emerald-100">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <img src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.firstName}`} className="w-16 h-16 rounded-2xl object-cover" />
                  <div className="text-right">
                    <h3 className="text-xl font-black text-slate-900">{selectedUser.firstName} {selectedUser.lastName}</h3>
                    <p className="text-slate-500 font-bold text-sm">{selectedUser.phone}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-slate-300 hover:text-red-500"><X size={28} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-3">
                  <p className="font-black text-xs text-slate-600 mr-2 uppercase">البطاقة (أمام)</p>
                  <div className="rounded-2xl border-2 border-slate-50 overflow-hidden shadow-sm bg-slate-900 aspect-video flex items-center justify-center">
                    {selectedUser.idFront ? <img src={selectedUser.idFront} className="w-full h-full object-contain" /> : <p className="text-white/20">لا توجد صورة</p>}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="font-black text-xs text-slate-600 mr-2 uppercase">البطاقة (خلف)</p>
                  <div className="rounded-2xl border-2 border-slate-50 overflow-hidden shadow-sm bg-slate-900 aspect-video flex items-center justify-center">
                    {selectedUser.idBack ? <img src={selectedUser.idBack} className="w-full h-full object-contain" /> : <p className="text-white/20">لا توجد صورة</p>}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => handleAction(selectedUser.id, 'verified')} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"><UserCheck size={20} /> تفعيل الحساب</button>
                <button onClick={() => handleAction(selectedUser.id, 'rejected')} className="flex-1 bg-red-50 text-red-600 py-4 rounded-2xl font-black border-2 border-red-100 hover:bg-red-600 hover:text-white active:scale-95 transition-all"><UserX size={20} /> رفض</button>
              </div>
            </div>
          ) : <div className="h-full min-h-[300px] bg-slate-100 rounded-[2.5rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 p-10 text-center"><ShieldQuestion size={64} strokeWidth={1} /><p className="mt-4 text-xl font-black">اختر طلباً لمراجعته</p></div>}
        </div>
      </div>
    </div>
  );
};

const AuthForm = ({ onSuccess }: any) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = async (e: any) => {
    e.preventDefault(); setLoading(true);
    const { data, error } = await supabase.from('users').select('*').eq('phone', phone).eq('password', password).single();
    if (error) alert("بيانات الدخول غير صحيحة");
    else onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya }, categories: data.categories || [], portfolio: data.portfolio || [], verificationStatus: data.verification_status || 'none', idFront: data.id_front, idBack: data.id_back });
    setLoading(false);
  };
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in">
      <form onSubmit={login} className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border w-full max-w-md space-y-6 text-right">
        <h2 className="text-2xl md:text-3xl font-black mb-8 border-r-8 border-emerald-500 pr-4">تسجيل الدخول 👋</h2>
        <div className="space-y-2">
          <label className="font-black text-slate-500 mr-1 text-sm">رقم الهاتف</label>
          <input required placeholder="0550123456" className="w-full p-4.5 bg-slate-50 rounded-2xl border-none font-black text-lg outline-none focus:ring-4 ring-emerald-50 transition-all" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="font-black text-slate-500 mr-1 text-sm">كلمة المرور</label>
          <input required type="password" placeholder="••••••••" className="w-full p-4.5 bg-slate-50 rounded-2xl border-none font-black text-lg outline-none focus:ring-4 ring-emerald-50 transition-all" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button disabled={loading} className="w-full bg-emerald-600 text-white py-4.5 rounded-2xl font-black text-xl shadow-xl hover:bg-emerald-500 active:scale-95 transition-all">
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>
        <p className="text-center text-slate-400 font-bold text-sm">ليس لديك حساب؟ <span className="text-emerald-600 cursor-pointer">سجل الآن</span></p>
      </form>
    </div>
  );
};
