
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, VerificationStatus, Task } from './types.ts';
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
  Plus,
  Trash2,
  X,
  ChevronLeft,
  Award,
  Image as ImageIcon,
  Briefcase,
  Clock,
  DollarSign,
  ArrowUpDown,
  Zap,
  CheckCircle2,
  Share2,
  UploadCloud,
  Calendar,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ClipboardList,
  Camera,
  Menu,
  ChevronRight
} from 'lucide-react';

// --- Global Components & Styles ---

const GlobalStyles = () => (
  <style>{`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: fadeIn 0.4s ease-out forwards; }
    .arabic-text { font-family: 'Tajawal', sans-serif; }
    .loading-spinner { border: 3px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 32px; height: 32px; animation: spin 0.8s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .profile-banner { background: linear-gradient(135deg, #065f46 0%, #0d9488 100%); position: relative; overflow: hidden; }
    .profile-banner::after { content: ''; position: absolute; inset: 0; background: url('https://www.transparenttextures.com/patterns/cubes.png'); opacity: 0.1; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .glass-morphism { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.2); }
    input, select, textarea { -webkit-appearance: none; appearance: none; }
    .custom-shadow { box-shadow: 0 15px 40px -10px rgba(16, 185, 129, 0.2); }
  `}</style>
);

const VerificationBadge = ({ status, size = 'md' }: { status?: VerificationStatus, size?: 'sm' | 'md' }) => {
  if (status !== 'verified' && status !== 'pending') return null;
  const isSm = size === 'sm';
  const config = status === 'verified' 
    ? { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500', text: isSm ? 'مفعل' : 'موثق' }
    : { color: 'text-orange-600 bg-orange-50 border-orange-100', dot: 'bg-orange-500 animate-pulse', text: isSm ? 'انتظار' : 'قيد المراجعة' };

  return (
    <div className={`flex items-center gap-1.5 ${config.color} ${isSm ? 'px-2 py-0.5 rounded-lg' : 'px-4 py-1.5 rounded-full'} border font-black ${isSm ? 'text-[9px]' : 'text-xs'}`}>
      <span className={`${isSm ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'} rounded-full ${config.dot} shadow-sm`}></span>
      {config.text}
    </div>
  );
};

const Logo = ({ onClick, size = 'md' }: { onClick?: () => void, size?: 'sm' | 'md' | 'lg' }) => (
  <div onClick={onClick} className="flex items-center gap-2 cursor-pointer group select-none transition-transform active:scale-95">
    <div className={`${size === 'lg' ? 'w-16 h-16 rounded-3xl' : size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'} bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg transition-all group-hover:rotate-6`}>
      <span className={size === 'lg' ? 'text-3xl' : 'text-lg'}>S</span>
    </div>
    <div className="flex flex-col items-start leading-none">
      <span className={`${size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-xl'} font-black text-slate-900 tracking-tighter`}>Salakni</span>
      <span className={`${size === 'lg' ? 'text-sm' : 'text-[10px]'} font-black text-emerald-600 uppercase`}>dz platform</span>
    </div>
  </div>
);

// --- Main Application ---

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { currentUser: saved ? JSON.parse(saved) : null, workers: [], view: 'landing' };
  });
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskFilters, setTaskFilters] = useState({ category: '', wilaya: '', sortBy: 'newest' });
  const [searchFilters, setSearchFilters] = useState({ query: '', wilaya: '', category: '' });
  const [chatTarget, setChatTarget] = useState<User | null>(null);

  // Helper function to safely render strings and avoid [object Object]
  const s = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.map(item => s(item)).join(', ');
    if (typeof val === 'object') {
      // Handle cases where the object might be a user object from a join
      if (val.first_name || val.last_name) {
        return `${s(val.first_name)} ${s(val.last_name)}`.trim();
      }
      if (val.name) return s(val.name);
      if (val.title) return s(val.title);
      return ''; // Explicitly return empty string for other objects to avoid [object Object]
    }
    return String(val);
  };

  const toArray = (val: any): any[] => Array.isArray(val) ? val : (val ? [val] : []);

  const setView = (view: AppState['view']) => {
    setState(prev => ({ ...prev, view }));
    window.scrollTo(0, 0);
  };

  const mapDbUser = (d: any): User => ({
    ...d,
    id: s(d.id),
    firstName: s(d.first_name),
    lastName: s(d.last_name),
    phone: s(d.phone),
    role: d.role || UserRole.SEEKER,
    location: { wilaya: s(d.wilaya), daira: s(d.daira) },
    avatar: d.avatar,
    bio: s(d.bio),
    categories: toArray(d.categories).map(c => s(c)),
    skills: toArray(d.skills).map(sk => s(sk)),
    portfolio: toArray(d.portfolio),
    verificationStatus: d.verification_status || 'none',
    rating: d.rating || 0,
    ratingCount: d.rating_count || 0,
    completedJobs: d.completed_jobs || 0,
    createdAt: d.created_at
  });

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('users').select('*').eq('role', UserRole.WORKER);
      if (searchFilters.wilaya) query = query.eq('wilaya', searchFilters.wilaya);
      if (searchFilters.category) query = query.contains('categories', [searchFilters.category]);
      if (searchFilters.query) query = query.or(`first_name.ilike.%${searchFilters.query}%,last_name.ilike.%${searchFilters.query}%,bio.ilike.%${searchFilters.query}%`);
      
      const { data, error } = await query;
      if (error) throw error;
      setState(prev => ({ ...prev, workers: (data || []).map(mapDbUser) }));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = supabase.from('tasks').select('*, users!inner(first_name, last_name, avatar)').order('created_at', { ascending: taskFilters.sortBy === 'oldest' });
      if (taskFilters.wilaya) query = query.eq('wilaya', taskFilters.wilaya);
      if (taskFilters.category) query = query.eq('category', taskFilters.category);
      if (taskFilters.sortBy === 'budget_desc') query = query.order('budget', { ascending: false });
      if (taskFilters.sortBy === 'budget_asc') query = query.order('budget', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      setTasks((data || []).map(t => {
        // Safe extraction of nested user data from joined query
        const userData = Array.isArray(t.users) ? t.users[0] : t.users;
        return {
          ...t,
          seeker_name: userData ? s(userData) : 'مستخدم مجهول',
          seeker_avatar: userData?.avatar
        };
      }));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (state.view === 'search') fetchWorkers();
    if (state.view === 'support') fetchTasks();
  }, [state.view, searchFilters, taskFilters]);

  const updateCurrentUser = (u: User | null) => {
    setState(prev => ({ ...prev, currentUser: u }));
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user');
  };

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-24 md:pb-0" dir="rtl">
      <GlobalStyles />
      
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} size="md" />
          
          <div className="hidden md:flex items-center gap-8">
            <NavButton active={state.view === 'search'} onClick={() => setView('search')}>تصفح الحرفيين</NavButton>
            <NavButton active={state.view === 'support'} onClick={() => setView('support')}>سوق المهام</NavButton>
            {state.currentUser?.role === UserRole.ADMIN && (
              <button onClick={() => setView('admin-panel')} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2"><ShieldCheck size={18} /> الإدارة</button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div onClick={() => { setChatTarget(null); setView('profile'); }} className="flex items-center gap-3 cursor-pointer p-1 pr-4 bg-slate-100 rounded-full border border-slate-200 hover:border-emerald-200 transition-all">
                <span className="font-black text-xs hidden sm:block">{s(state.currentUser.firstName)}</span>
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setView('login')} className="hidden sm:block text-slate-500 font-black px-4 py-2 hover:text-emerald-600 transition-colors">دخول</button>
                <button onClick={() => setView('register')} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">ابدأ الآن</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onStart={() => setView('search')} onRegister={() => setView('register')} />}
        {state.view === 'search' && <SearchWorkersView workers={state.workers} loading={loading} filters={searchFilters} onFilterChange={setSearchFilters} onProfile={(w: User) => { setChatTarget(w); setView('profile'); }} safe={s} />}
        {state.view === 'support' && <TasksMarketView tasks={tasks} loading={loading} filters={taskFilters} onFilterChange={setTaskFilters} currentUser={state.currentUser} onTaskCreated={fetchTasks} safe={s} />}
        {state.view === 'profile' && (state.currentUser || chatTarget) && (
          <ProfileView user={chatTarget || state.currentUser!} isOwn={!chatTarget || chatTarget?.id === state.currentUser?.id} onEdit={() => setView('edit-profile')} onLogout={() => { updateCurrentUser(null); setView('landing'); }} onBack={() => { setChatTarget(null); setView('search'); }} onDataUpdate={(u: User) => { if (chatTarget) setChatTarget(u); if (state.currentUser?.id === u.id) updateCurrentUser(u); }} safe={s} />
        )}
        {state.view === 'edit-profile' && state.currentUser && <EditProfileView user={state.currentUser} onSave={(u: User) => { updateCurrentUser(u); setView('profile'); }} onCancel={() => setView('profile')} />}
        {state.view === 'login' && <AuthForm type="login" onSuccess={(u: User) => { updateCurrentUser(u); setView('profile'); }} onSwitch={() => setView('register')} safe={s} />}
        {state.view === 'register' && <AuthForm type="register" onSuccess={(u: User) => { updateCurrentUser(u); setView('profile'); }} onSwitch={() => setView('login')} safe={s} />}
        {state.view === 'admin-panel' && state.currentUser?.role === UserRole.ADMIN && <AdminPanelView safe={s} />}
      </main>

      {/* Mobile Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around md:hidden z-50 px-2 rounded-t-[2rem] shadow-2xl">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={Search} label="الحرفيين" active={state.view === 'search'} onClick={() => setView('search')} />
        <TabItem icon={Briefcase} label="المهام" active={state.view === 'support'} onClick={() => setView('support')} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile' || state.view === 'login'} onClick={() => state.currentUser ? setView('profile') : setView('login')} />
      </div>
    </div>
  );
}

// --- Helper Components ---

const NavButton = ({ children, active, onClick }: any) => (
  <button onClick={onClick} className={`font-black text-sm transition-all px-2 py-1 relative ${active ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'}`}>
    {children}
    {active && <span className="absolute -bottom-2 left-0 right-0 h-1 bg-emerald-600 rounded-full animate-in"></span>}
  </button>
);

const TabItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 transition-all ${active ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
    <div className={`p-2 rounded-xl ${active ? 'bg-emerald-50' : ''}`}><Icon size={22} /></div>
    <span className="text-[10px] font-black">{label}</span>
  </button>
);

// --- Sub-Views ---

const LandingView = ({ onStart, onRegister }: any) => (
  <div className="relative min-h-[85vh] flex items-center justify-center text-center px-6 overflow-hidden">
    <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
    <div className="relative z-10 max-w-4xl animate-in">
      <div className="inline-block bg-emerald-500/20 text-emerald-400 px-6 py-2 rounded-full border border-emerald-500/30 text-xs font-black uppercase tracking-widest mb-8">أكبر تجمع للحرفيين في الجزائر</div>
      <h1 className="text-4xl md:text-8xl font-black text-white mb-8 leading-tight tracking-tighter">ريح بالك، <br className="sm:hidden"/><span className="text-emerald-400">سَلّكني</span> يسلكها!</h1>
      <p className="text-base md:text-2xl text-slate-300 mb-12 font-medium max-w-2xl mx-auto px-4">اطلب أي خدمة منزلية أو مهنية بلمسة زر. أفضل الحرفيين المهرة في ولايتك جاهزون لخدمتك.</p>
      <div className="flex flex-col sm:flex-row gap-6 justify-center">
        <button onClick={onStart} className="bg-emerald-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 hover:scale-105 transition-all">ابحث عن حرفي 🔍</button>
        <button onClick={onRegister} className="bg-white/10 backdrop-blur-md text-white px-12 py-5 rounded-[2.5rem] font-black text-xl border border-white/20 hover:bg-white/20 transition-all">سجل كحرفي ⚒️</button>
      </div>
    </div>
  </div>
);

const SearchWorkersView = ({ workers, loading, filters, onFilterChange, onProfile, safe }: any) => (
  <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-16 animate-in">
    <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 mb-12 flex flex-col md:flex-row gap-6">
      <div className="flex-1 relative">
        <input placeholder="ابحث عن حرفي أو خدمة..." className="w-full p-5 pr-14 bg-slate-50 rounded-[2rem] font-bold border-none focus:ring-4 ring-emerald-50 transition-all" value={filters.query} onChange={e => onFilterChange({...filters, query: e.target.value})} />
        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
      </div>
      <select className="p-5 bg-slate-50 rounded-[2rem] font-black text-sm min-w-[180px] border-none focus:ring-4 ring-emerald-50 transition-all cursor-pointer" value={filters.wilaya} onChange={e => onFilterChange({...filters, wilaya: e.target.value})}>
        <option value="">كل الولايات 🇩🇿</option>
        {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
      </select>
      <select className="p-5 bg-slate-50 rounded-[2rem] font-black text-sm min-w-[200px] border-none focus:ring-4 ring-emerald-50 transition-all cursor-pointer" value={filters.category} onChange={e => onFilterChange({...filters, category: e.target.value})}>
        <option value="">كل التخصصات ⚒️</option>
        {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {loading ? (
        <div className="col-span-full py-40 flex flex-col items-center gap-4">
          <div className="loading-spinner"></div>
          <p className="text-slate-400 font-bold">جاري البحث عن الكفاءات...</p>
        </div>
      ) : (workers || []).length > 0 ? workers.map((w: User) => (
        <div key={w.id} onClick={() => onProfile(w)} className="bg-white p-8 rounded-[3.5rem] shadow-lg border border-slate-100 cursor-pointer hover:-translate-y-3 hover:shadow-2xl transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[3.5rem] -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-6 mb-8 relative z-10">
            <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-20 h-20 rounded-[2rem] object-cover border-4 border-white shadow-md bg-slate-100" />
            <div className="text-right flex-1 truncate">
              <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{safe(w.firstName)} {safe(w.lastName)}</h3>
              <div className="mt-1 flex gap-2"><VerificationBadge status={w.verificationStatus} size="sm" /></div>
            </div>
          </div>
          <p className="text-slate-500 text-sm line-clamp-3 h-14 mb-8 font-medium leading-relaxed">{safe(w.bio) || 'حرفي متمرس يسعى لتقديم أفضل خدمة لزبائن سلكني.'}</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {w.categories.slice(0, 2).map(c => <span key={safe(c)} className="bg-slate-50 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black border border-slate-100 uppercase">{safe(c)}</span>)}
            {w.categories.length > 2 && <span className="text-slate-300 font-black text-[10px]">+ {w.categories.length - 2}</span>}
          </div>
          <div className="flex justify-between items-center pt-6 border-t border-slate-50">
            <span className="text-slate-400 text-xs font-black flex items-center gap-1.5"><MapPin size={16} className="text-emerald-500" /> {safe(w.location.wilaya)}</span>
            <div className="flex items-center gap-1.5 text-yellow-500 font-black text-lg bg-yellow-50 px-4 py-1 rounded-full"><Star size={18} fill="currentColor" /> {w.rating?.toFixed(1) || '0.0'}</div>
          </div>
        </div>
      )) : (
        <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8"><Search size={48} className="text-slate-200" /></div>
          <p className="text-slate-500 font-black text-3xl mb-4">لم نجد أي حرفيين</p>
          <p className="text-slate-400 font-bold text-lg">جرب تغيير الفلتر أو البحث في ولاية أخرى</p>
        </div>
      )}
    </div>
  </div>
);

const AuthForm = ({ type, onSuccess, onSwitch, safe }: any) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', password: '', role: UserRole.SEEKER, wilaya: WILAYAS[0] });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'login') {
        const { data, error } = await supabase.from('users').select('*').eq('phone', formData.phone).eq('password', formData.password).single();
        if (error) throw new Error("بيانات الدخول غير صحيحة");
        onSuccess(mapUser(data));
      } else {
        const { data, error } = await supabase.from('users').insert([{
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          wilaya: formData.wilaya,
          verification_status: 'none'
        }]).select().single();
        if (error) throw error;
        onSuccess(mapUser(data));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const mapUser = (d: any): User => {
    const toArray = (v: any) => Array.isArray(v) ? v : (v ? [v] : []);
    return {
      ...d,
      id: safe(d.id),
      firstName: safe(d.first_name),
      lastName: safe(d.last_name),
      location: { wilaya: safe(d.wilaya), daira: '' },
      categories: toArray(d.categories).map(c => safe(c)),
      skills: toArray(d.skills).map(sk => safe(sk)),
      portfolio: toArray(d.portfolio),
      verificationStatus: d.verification_status || 'none',
      rating: d.rating || 0,
      ratingCount: d.rating_count || 0,
      completedJobs: d.completed_jobs || 0
    };
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in">
      <div className="bg-white w-full max-w-xl p-10 md:p-16 rounded-[4rem] shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16"></div>
        <h2 className="text-4xl md:text-5xl font-black mb-12 border-r-[12px] border-emerald-600 pr-6 tracking-tighter leading-none">
          {type === 'login' ? 'مرحباً بك مجدداً 👋' : 'أنشئ حسابك الآن ✨'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {type === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الاسم</label>
                  <input required placeholder="الاسم" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold focus:ring-4 ring-emerald-50" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">اللقب</label>
                  <input required placeholder="اللقب" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold focus:ring-4 ring-emerald-50" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الولاية</label>
                <select className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold focus:ring-4 ring-emerald-50" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">نوع الحساب</label>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setFormData({...formData, role: UserRole.SEEKER})} className={`flex-1 py-4 rounded-2xl font-black transition-all border-2 ${formData.role === UserRole.SEEKER ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-900/20' : 'bg-slate-50 text-slate-400 border-transparent'}`}>أنا زبون</button>
                  <button type="button" onClick={() => setFormData({...formData, role: UserRole.WORKER})} className={`flex-1 py-4 rounded-2xl font-black transition-all border-2 ${formData.role === UserRole.WORKER ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-900/20' : 'bg-slate-50 text-slate-400 border-transparent'}`}>أنا حرفي</button>
                </div>
              </div>
            </>
          )}

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">رقم الهاتف</label>
            <input required placeholder="0550123456" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black text-xl tracking-widest focus:ring-4 ring-emerald-50" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">كلمة المرور</label>
            <input required type="password" placeholder="••••••••" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black text-xl focus:ring-4 ring-emerald-50" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          <button disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-emerald-900/30 hover:bg-emerald-500 active:scale-95 transition-all mt-6">
            {loading ? 'جاري التحقق...' : type === 'login' ? 'دخول' : 'إنشاء الحساب'}
          </button>

          <p className="text-center font-bold text-slate-400 mt-6">
            {type === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
            <button type="button" onClick={onSwitch} className="text-emerald-600 font-black hover:underline">{type === 'login' ? 'سجل الآن' : 'سجل دخولك'}</button>
          </p>
        </form>
      </div>
    </div>
  );
};

const TasksMarketView = ({ tasks, loading, filters, onFilterChange, currentUser, onTaskCreated, safe }: any) => {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-12 animate-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
        <div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-3 tracking-tighter">سوق المهام <span className="text-emerald-500">DZ</span> 🇩🇿</h2>
          <p className="text-slate-500 font-bold text-lg md:text-xl">تصفح طلبات الزبائن في جميع الولايات.</p>
        </div>
        <button onClick={() => currentUser ? setShowCreate(true) : alert('يجب تسجيل الدخول لنشر طلب')} className="w-full md:w-auto bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-900/30 hover:bg-emerald-500 hover:scale-105 transition-all flex items-center justify-center gap-4">
          <Plus size={28} /> انشر طلبك الآن
        </button>
      </div>

      <div className="bg-white p-6 rounded-[3rem] shadow-xl border border-slate-100 mb-12 flex flex-col md:flex-row gap-6">
        <select className="p-5 bg-slate-50 rounded-[2rem] font-black border-none min-w-[160px]" value={filters.wilaya} onChange={e => onFilterChange({...filters, wilaya: e.target.value})}>
          <option value="">كل الولايات</option>
          {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <select className="p-5 bg-slate-50 rounded-[2rem] font-black border-none min-w-[180px]" value={filters.category} onChange={e => onFilterChange({...filters, category: e.target.value})}>
          <option value="">كل التخصصات</option>
          {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? <div className="col-span-full py-40 flex justify-center"><div className="loading-spinner"></div></div> : (tasks || []).length > 0 ? tasks.map((t: any) => (
          <div key={t.id} className="bg-white p-8 rounded-[3.5rem] shadow-lg border border-slate-100 group hover:shadow-2xl transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-xl text-[10px] font-black border border-emerald-100 uppercase">{safe(t.category)}</span>
              <span className="text-emerald-600 font-black text-2xl tracking-tighter">{t.budget > 0 ? `${t.budget.toLocaleString()} دج` : 'سعر مفتوح'}</span>
            </div>
            <h3 className="text-2xl font-black mb-4 line-clamp-2 leading-tight group-hover:text-emerald-600 transition-colors">{safe(t.title)}</h3>
            <p className="text-slate-500 text-sm line-clamp-3 h-14 mb-8">{safe(t.description)}</p>
            <div className="flex items-center gap-4 text-slate-400 text-xs font-black mb-8">
              <span className="flex items-center gap-1.5"><MapPin size={16} className="text-emerald-500"/> {safe(t.wilaya)}</span>
              <span className="flex items-center gap-1.5"><Calendar size={16} className="text-emerald-500"/> {new Date(t.created_at).toLocaleDateString('ar-DZ')}</span>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <img src={t.seeker_avatar || `https://ui-avatars.com/api/?name=${t.seeker_name}`} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" />
                <span className="text-xs font-black text-slate-800">{safe(t.seeker_name)}</span>
              </div>
              <button className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all">تقديم عرض</button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
            <ClipboardList size={64} className="mx-auto text-slate-100 mb-6" />
            <p className="text-slate-300 font-black text-2xl">لا توجد طلبات منشورة حالياً</p>
          </div>
        )}
      </div>

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} currentUser={currentUser} onCreated={onTaskCreated} />}
    </div>
  );
};

const CreateTaskModal = ({ onClose, currentUser, onCreated }: any) => {
  const [formData, setFormData] = useState({ title: '', description: '', category: SERVICE_CATEGORIES[0].name, wilaya: WILAYAS[0], budget: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('tasks').insert({
        seeker_id: currentUser.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        wilaya: formData.wilaya,
        budget: formData.budget ? parseInt(formData.budget) : 0,
        status: 'open'
      });
      if (error) throw error;
      onCreated();
      onClose();
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in">
      <div className="bg-white w-full max-w-2xl p-8 sm:p-12 rounded-t-[3rem] sm:rounded-[3.5rem] relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <button onClick={onClose} className="absolute top-8 left-8 text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
        <h2 className="text-4xl font-black mb-10 border-r-[12px] border-emerald-600 pr-6 tracking-tighter">طلب خدمة جديد ⚒️</h2>
        <form onSubmit={submit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">ماذا تحتاج؟</label>
            <input required placeholder="عنوان مختصر لطلبك" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold shadow-inner" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">التصنيف</label>
              <select className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black shadow-inner" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الولاية</label>
              <select className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black shadow-inner" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الميزانية المقترحة (دج)</label>
            <input type="number" placeholder="أدخل مبلغ تقريبي" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold shadow-inner" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">تفاصيل الطلب</label>
            <textarea required rows={4} placeholder="اشرح لنا ما الذي يجب فعله..." className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold resize-none shadow-inner" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <button disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-emerald-900/30 transition-all hover:bg-emerald-500 active:scale-95">
            {loading ? 'جاري النشر...' : 'انشر المهمة الآن'}
          </button>
        </form>
      </div>
    </div>
  );
};

const ProfileView = ({ user, isOwn, onEdit, onLogout, onBack, onDataUpdate, safe }: any) => {
  const isWorker = user.role === UserRole.WORKER;
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePortfolio = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const current = Array.isArray(user.portfolio) ? user.portfolio : [];
      if (current.length >= 10) return alert('الحد الأقصى 10 صور');
      const next = [...current, base64];
      const { error } = await supabase.from('users').update({ portfolio: next }).eq('id', user.id);
      if (!error) onDataUpdate({ ...user, portfolio: next });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 md:px-10 animate-in">
      <div className="mb-8 flex justify-between items-center">
        {!isOwn ? (
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:text-emerald-600"><ChevronLeft size={20} /> العودة</button>
        ) : <div className="text-emerald-600 font-black text-sm flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">حسابي الشخصي</div>}
        <div className="flex gap-2">
          {isOwn && (
            <>
              <button onClick={onEdit} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-600 shadow-sm transition-all hover:bg-emerald-50"><Settings size={20} /></button>
              <button onClick={onLogout} className="p-3 bg-red-50 text-red-500 border border-red-100 rounded-2xl shadow-sm transition-all hover:bg-red-500 hover:text-white"><LogOut size={20} /></button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] md:rounded-[4.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="profile-banner h-48 md:h-72"></div>
        <div className="px-6 md:px-16 pb-16 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8 -mt-24 md:-mt-36 mb-16">
            <div className="relative">
              <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}`} className="w-48 h-48 md:w-64 md:h-64 rounded-[3.5rem] border-[12px] border-white shadow-2xl object-cover bg-slate-50" />
              {isWorker && user.verificationStatus === 'verified' && (
                <div className="absolute bottom-4 right-4 bg-emerald-500 text-white p-2 rounded-2xl border-4 border-white shadow-xl"><CheckCircle2 size={24}/></div>
              )}
            </div>
            <div className="flex-1 text-center md:text-right pb-4">
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-4">
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">{safe(user.firstName)} {safe(user.lastName)}</h2>
                <VerificationBadge status={user.verificationStatus} />
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {isWorker ? (user.categories || []).map((c: string) => <span key={safe(c)} className="bg-emerald-50 text-emerald-700 px-5 py-2 rounded-full text-xs font-black border border-emerald-100 uppercase">{safe(c)}</span>) : <span className="bg-blue-50 text-blue-700 px-5 py-2 rounded-full text-xs font-black border border-blue-100">عضو زبون</span>}
                <span className="flex items-center gap-2 text-slate-400 font-bold text-xs bg-slate-50 px-5 py-2 rounded-full border border-slate-200"><MapPin size={16} className="text-emerald-500" /> {safe(user.location.wilaya)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-slate-950 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/20 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                <h4 className="font-black text-xl mb-8 flex items-center gap-3">اتصل الآن <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div></h4>
                <div className="space-y-4">
                  <div className="text-4xl font-mono text-center py-6 bg-white/5 rounded-3xl tracking-widest border border-white/10 select-all">{safe(user.phone)}</div>
                  <a href={`tel:${user.phone}`} className="flex items-center justify-center gap-3 w-full bg-emerald-600 py-6 rounded-[2.5rem] font-black text-2xl shadow-xl transition-all active:scale-95"><Phone size={24} /> اتصــال</a>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-16">
              <section className="animate-in">
                <h4 className="text-3xl font-black text-slate-900 flex items-center gap-4 mb-8"><Award size={32} className="text-emerald-500"/> نبذة تعريفية</h4>
                <div className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 leading-relaxed"><p className="text-slate-600 font-medium text-xl leading-relaxed">{safe(user.bio) || 'لم يتم إضافة نبذة تعريفية بعد.'}</p></div>
              </section>

              {isWorker && (
                <section className="animate-in">
                  <div className="flex items-center justify-between mb-10">
                    <h4 className="text-3xl font-black text-slate-900 flex items-center gap-4"><ImageIcon size={32} className="text-emerald-500"/> ألبوم الأعمال</h4>
                    {isOwn && (
                      <>
                        <button onClick={() => portfolioInputRef.current?.click()} disabled={uploading} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-xl disabled:bg-slate-300 transition-all active:scale-95 flex items-center gap-2"><Plus size={18}/> أضف صورة</button>
                        <input type="file" hidden ref={portfolioInputRef} accept="image/*" onChange={handlePortfolio} />
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {(user.portfolio || []).length > 0 ? user.portfolio.map((img: string, idx: number) => (
                      <div key={idx} className="group relative aspect-square rounded-[3rem] overflow-hidden border-[6px] border-white shadow-xl hover:scale-105 transition-all">
                        <img src={img} className="w-full h-full object-cover" />
                        {isOwn && (
                          <button onClick={async () => { 
                            const next = user.portfolio.filter((_: any, i: number) => i !== idx);
                            await supabase.from('users').update({ portfolio: next }).eq('id', user.id);
                            onDataUpdate({ ...user, portfolio: next });
                          }} className="absolute top-4 left-4 p-3 bg-red-500 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                        )}
                      </div>
                    )) : (
                      <div className="col-span-full py-20 bg-slate-50 rounded-[3.5rem] border-4 border-dashed border-slate-100 text-center"><p className="text-slate-300 font-black text-xl">لا توجد أعمال منشورة</p></div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditProfileView = ({ user, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({ firstName: user.firstName, lastName: user.lastName, bio: user.bio || '', avatar: user.avatar || '', wilaya: user.location.wilaya });
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatar = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormData({ ...formData, avatar: reader.result as string });
    reader.readAsDataURL(file);
  };

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('users').update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
        avatar: formData.avatar,
        wilaya: formData.wilaya
      }).eq('id', user.id);
      if (error) throw error;
      onSave({ ...user, ...formData, location: { ...user.location, wilaya: formData.wilaya } });
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in">
      <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl border border-slate-100">
        <h2 className="text-4xl font-black mb-16 border-r-[12px] border-emerald-600 pr-6 tracking-tighter">إعدادات الحساب ⚙️</h2>
        <form onSubmit={submit} className="space-y-12">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.firstName}`} className="w-48 h-48 rounded-[3.5rem] object-cover border-[10px] border-emerald-50 shadow-2xl" />
              <div className="absolute inset-0 bg-slate-900/40 rounded-[3.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={48} /></div>
            </div>
            <input type="file" hidden ref={avatarInputRef} accept="image/*" onChange={handleAvatar} />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">تغيير الصورة الشخصية</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <input required className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold shadow-inner" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            <input required className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold shadow-inner" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <textarea className="w-full p-8 bg-slate-50 rounded-[2.5rem] border-none font-medium text-lg leading-relaxed h-56 resize-none shadow-inner" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="اكتب نبذة عن نفسك للزبائن..." />
          <div className="flex flex-col sm:flex-row gap-6">
            <button disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all">{loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}</button>
            <button type="button" onClick={onCancel} className="w-full bg-slate-100 text-slate-500 py-6 rounded-[2.5rem] font-black text-2xl active:scale-95 transition-all">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPanelView = ({ safe }: any) => {
  const [pending, setPending] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('users').select('*').eq('verification_status', 'pending');
      setPending((data || []).map(d => ({ 
        ...d, 
        firstName: safe(d.first_name), 
        lastName: safe(d.last_name), 
        location: { wilaya: safe(d.wilaya), daira: '' } 
      } as any)));
      setLoading(false);
    };
    fetch();
  }, []);

  const handle = async (id: string, status: VerificationStatus) => {
    await supabase.from('users').update({ verification_status: status }).eq('id', id);
    setPending(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto py-16 px-6 animate-in">
      <h2 className="text-5xl font-black mb-16 tracking-tighter">إدارة التوثيقات <span className="text-emerald-500">ADMIN</span></h2>
      {loading ? <div className="loading-spinner mx-auto"></div> : (
        <div className="grid gap-8">
          {pending.length > 0 ? pending.map(u => (
            <div key={u.id} className="bg-white p-10 rounded-[4rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center gap-10">
              <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.firstName}`} className="w-24 h-24 rounded-3xl object-cover" />
              <div className="flex-1 text-center md:text-right">
                <h3 className="text-3xl font-black">{u.firstName} {u.lastName}</h3>
                <p className="text-slate-500 font-bold">{safe(u.phone)} | {safe(u.location.wilaya)}</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => handle(u.id, 'verified')} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black active:scale-95 shadow-lg shadow-emerald-900/20 transition-all">قبول ✅</button>
                <button onClick={() => handle(u.id, 'rejected')} className="bg-red-50 text-red-600 px-10 py-4 rounded-2xl font-black active:scale-95 border border-red-100 transition-all">رفض ❌</button>
              </div>
            </div>
          )) : <div className="py-20 text-center text-slate-300 font-black text-3xl">لا يوجد طلبات معلقة</div>}
        </div>
      )}
    </div>
  );
};
