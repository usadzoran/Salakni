
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, VerificationStatus, Task, TaskStatus } from './types.ts';
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
  // Fix: Added missing icons
  ClipboardList,
  Camera
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
    .custom-shadow { shadow: 0 10px 40px -10px rgba(16, 185, 129, 0.2); }
  `}</style>
);

const VerificationBadge = ({ status, size = 'md' }: { status?: VerificationStatus, size?: 'sm' | 'md' }) => {
  const isSm = size === 'sm';
  switch (status) {
    case 'verified':
      return (
        <div className={`flex items-center gap-1.5 text-emerald-600 bg-emerald-50 ${isSm ? 'px-2 py-0.5 rounded-lg' : 'px-4 py-1.5 rounded-full'} border border-emerald-100 font-black ${isSm ? 'text-[9px]' : 'text-xs'}`}>
          <span className={`${isSm ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'} bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]`}></span>
          {isSm ? 'مفعل' : 'حساب موثق'}
        </div>
      );
    case 'pending':
      return (
        <div className={`flex items-center gap-1.5 text-orange-600 bg-orange-50 ${isSm ? 'px-2 py-0.5 rounded-lg' : 'px-4 py-1.5 rounded-full'} border border-orange-100 font-black ${isSm ? 'text-[9px]' : 'text-xs'}`}>
          <span className={`${isSm ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5'} bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]`}></span>
          {isSm ? 'انتظار' : 'قيد المراجعة'}
        </div>
      );
    default:
      return null;
  }
};

const Logo = ({ onClick, size = 'md' }: { onClick?: () => void, size?: 'sm' | 'md' }) => (
  <div onClick={onClick} className="flex items-center gap-2 cursor-pointer group select-none">
    <div className={`${size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'} bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg transition-transform group-active:scale-90`}>S</div>
    <span className={`${size === 'sm' ? 'text-lg' : 'text-xl md:text-2xl'} font-black text-slate-900 tracking-tight`}>Salakni <span className="text-emerald-600">سلكني</span></span>
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

  const setView = (view: AppState['view']) => {
    setState(prev => ({ ...prev, view }));
    window.scrollTo(0, 0);
  };

  const mapDbUser = (d: any): User => ({
    ...d,
    id: d.id,
    firstName: d.first_name,
    lastName: d.last_name,
    phone: d.phone,
    role: d.role,
    location: { wilaya: d.wilaya, daira: d.daira || '' },
    avatar: d.avatar,
    bio: d.bio,
    categories: d.categories || [],
    portfolio: d.portfolio || [],
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
      let query = supabase.from('tasks').select('*, users(first_name, last_name, avatar)').order('created_at', { ascending: taskFilters.sortBy === 'oldest' });
      if (taskFilters.wilaya) query = query.eq('wilaya', taskFilters.wilaya);
      if (taskFilters.category) query = query.eq('category', taskFilters.category);
      if (taskFilters.sortBy === 'budget_desc') query = query.order('budget', { ascending: false });
      if (taskFilters.sortBy === 'budget_asc') query = query.order('budget', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      setTasks((data || []).map(t => ({
        ...t,
        seeker_name: `${t.users?.first_name} ${t.users?.last_name}`,
        seeker_avatar: t.users?.avatar
      })));
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
      
      {/* Desktop Navbar */}
      <nav className="hidden md:flex h-20 bg-white/95 backdrop-blur-md border-b sticky top-0 z-50 items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} />
          <div className="flex items-center gap-8">
            <button onClick={() => setView('search')} className={`font-black text-sm transition-all ${state.view === 'search' ? 'text-emerald-600 scale-105' : 'text-slate-600 hover:text-emerald-500'}`}>تصفح الحرفيين</button>
            <button onClick={() => setView('support')} className={`font-black text-sm transition-all ${state.view === 'support' ? 'text-emerald-600 scale-105' : 'text-slate-600 hover:text-emerald-500'}`}>سوق المهام</button>
            {state.currentUser?.role === UserRole.ADMIN && (
              <button onClick={() => setView('admin-panel')} className="font-black text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl text-sm"><ShieldCheck size={18} /> الإدارة</button>
            )}
            {state.currentUser ? (
              <div onClick={() => { setChatTarget(null); setView('profile'); }} className="flex items-center gap-3 cursor-pointer bg-slate-100 pl-4 pr-1 py-1 rounded-full border border-slate-200 hover:border-emerald-200 transition-all">
                <span className="font-black text-xs text-slate-700">{state.currentUser.firstName}</span>
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
              </div>
            ) : (
              <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-black text-sm shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">دخول</button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="md:hidden flex h-16 bg-white border-b sticky top-0 z-40 items-center px-5 justify-between shadow-sm">
        <Logo size="sm" onClick={() => setView('landing')} />
        {state.currentUser && (
          <img onClick={() => { setChatTarget(null); setView('profile'); }} src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-9 h-9 rounded-full object-cover border-2 border-emerald-100" />
        )}
      </header>

      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onSearch={() => setView('search')} />}
        {state.view === 'search' && <SearchWorkersView workers={state.workers} loading={loading} filters={searchFilters} onFilterChange={setSearchFilters} onProfile={(w: User) => { setChatTarget(w); setView('profile'); }} />}
        
        {state.view === 'profile' && (state.currentUser || chatTarget) && (
          <ProfileView 
            user={chatTarget || state.currentUser!} 
            isOwn={!chatTarget || chatTarget?.id === state.currentUser?.id} 
            onEdit={() => setView('edit-profile')} 
            onLogout={() => { updateCurrentUser(null); setView('landing'); }}
            onBack={() => { setChatTarget(null); setView('search'); }}
            onDataUpdate={(updated: User) => {
              if (chatTarget && chatTarget.id === updated.id) setChatTarget(updated);
              if (state.currentUser && state.currentUser.id === updated.id) updateCurrentUser(updated);
            }}
          />
        )}

        {state.view === 'edit-profile' && state.currentUser && (
          <EditProfileView 
            user={state.currentUser} 
            onSave={(u: User) => { updateCurrentUser(u); setView('profile'); }}
            onCancel={() => setView('profile')}
          />
        )}

        {state.view === 'support' && (
          <TasksMarketView 
            tasks={tasks} 
            loading={loading} 
            filters={taskFilters} 
            onFilterChange={setTaskFilters} 
            currentUser={state.currentUser}
            onTaskCreated={fetchTasks}
          />
        )}

        {state.view === 'admin-panel' && state.currentUser?.role === UserRole.ADMIN && <AdminPanelView />}
        {state.view === 'login' && <AuthForm onSuccess={(u: User) => { updateCurrentUser(u); setView('profile'); }} />}
      </main>

      {/* Navigation Bottom (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t px-6 py-3 flex justify-between md:hidden z-50 rounded-t-[2.5rem] shadow-2xl border-slate-100">
        <button onClick={() => setView('landing')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${state.view === 'landing' ? 'nav-item-active' : 'text-slate-400'}`}>
          <div className="p-2 rounded-xl transition-colors"><Home size={22} /></div>
          <span className="text-[10px] font-black">الرئيسية</span>
        </button>
        <button onClick={() => setView('search')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${state.view === 'search' ? 'nav-item-active' : 'text-slate-400'}`}>
          <div className="p-2 rounded-xl transition-colors"><Search size={22} /></div>
          <span className="text-[10px] font-black">الحرفيين</span>
        </button>
        <button onClick={() => setView('support')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${state.view === 'support' ? 'nav-item-active' : 'text-slate-400'}`}>
          <div className="p-2 rounded-xl transition-colors"><Briefcase size={22} /></div>
          <span className="text-[10px] font-black">المهام</span>
        </button>
        <button onClick={() => { setChatTarget(null); state.currentUser ? setView('profile') : setView('login'); }} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${state.view === 'profile' ? 'nav-item-active' : 'text-slate-400'}`}>
          <div className="p-2 rounded-xl transition-colors"><UserIcon size={22} /></div>
          <span className="text-[10px] font-black">حسابي</span>
        </button>
      </div>
    </div>
  );
}

// --- Views Components ---

const LandingView = ({ onSearch }: any) => (
  <div className="relative min-h-[90vh] flex items-center justify-center text-center px-6 overflow-hidden">
    <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
    <div className="relative z-10 max-w-4xl animate-in">
      <div className="inline-block bg-emerald-500/20 backdrop-blur-md px-6 py-2 rounded-full border border-emerald-500/30 text-emerald-400 font-black text-xs mb-8 uppercase tracking-[0.2em]">الجزائر رقم #1</div>
      <h1 className="text-4xl md:text-8xl font-black text-white mb-8 leading-tight tracking-tighter">ريح بالك، <br className="md:hidden" /><span className="text-emerald-400">سَلّكني</span> يسلكها!</h1>
      <p className="text-base md:text-2xl text-slate-300 mb-12 font-medium px-4 max-w-2xl mx-auto">أفضل الحرفيين المهرة في الجزائر بانتظارك. تواصل مباشر، أمان تام، وخدمة احترافية.</p>
      <div className="flex flex-col sm:flex-row gap-6 justify-center">
        <button onClick={onSearch} className="bg-emerald-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-emerald-900/50 hover:bg-emerald-500 hover:scale-105 transition-all">اطلب خدمة الآن 🔍</button>
        <button className="bg-white/10 backdrop-blur-xl text-white px-12 py-5 rounded-[2.5rem] font-black text-xl border border-white/20 hover:bg-white/20 transition-all">سجل كحرفي ⚒️</button>
      </div>
    </div>
  </div>
);

const ProfileView = ({ user, isOwn, onEdit, onLogout, onBack, onDataUpdate }: { user: User, isOwn: boolean, onEdit: () => void, onLogout: () => void, onBack: () => void, onDataUpdate: (u: User) => void }) => {
  const isWorker = user.role === UserRole.WORKER;
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleQuickPortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const currentPortfolio = user.portfolio || [];
      if (currentPortfolio.length >= 10) {
        alert('الحد الأقصى هو 10 صور في الألبوم');
        setUploading(false);
        return;
      }
      const newPortfolio = [...currentPortfolio, base64];

      const { data, error } = await supabase.from('users').update({ portfolio: newPortfolio }).eq('id', user.id).select().single();
      if (!error) {
        onDataUpdate({ ...user, portfolio: newPortfolio });
      } else {
        alert('فشل تحديث الألبوم');
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const removePortfolioImage = async (idx: number) => {
    if (!isOwn) return;
    const newPortfolio = (user.portfolio || []).filter((_, i) => i !== idx);
    const { error } = await supabase.from('users').update({ portfolio: newPortfolio }).eq('id', user.id);
    if (!error) onDataUpdate({ ...user, portfolio: newPortfolio });
  };

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-16 px-4 md:px-6 animate-in">
      {/* Top Nav Buttons */}
      <div className="mb-8 flex justify-between items-center">
        {!isOwn ? (
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold hover:text-emerald-600 transition-colors bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100">
            <ChevronLeft size={20} /> العودة للبحث
          </button>
        ) : <div className="text-emerald-600 font-black text-sm flex items-center gap-2 bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100"><UserIcon size={18} /> لوحة التحكم الخاصة بك</div>}
        
        <div className="flex gap-2">
          <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 transition-colors shadow-sm"><Share2 size={20} /></button>
          {isOwn && (
            <>
              <button onClick={onEdit} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-600 hover:bg-emerald-50 transition-colors shadow-sm"><Settings size={20} /></button>
              <button onClick={onLogout} className="p-3 bg-red-50 text-red-500 border border-red-100 rounded-2xl hover:bg-red-500 hover:text-white transition-colors shadow-sm"><LogOut size={20} /></button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="profile-banner h-44 md:h-72"></div>
        <div className="px-6 md:px-16 pb-16 relative">
          {/* Main Info */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8 -mt-24 md:-mt-36 mb-16">
            <div className="relative group">
              <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&background=10b981&color=fff`} className="w-48 h-48 md:w-64 md:h-64 rounded-[3.5rem] md:rounded-[4.5rem] border-[10px] md:border-[15px] border-white shadow-2xl object-cover bg-white" />
              {isWorker && user.verificationStatus === 'verified' && (
                <div className="absolute bottom-3 right-3 md:bottom-6 md:right-6 bg-emerald-500 text-white p-2 rounded-2xl border-4 border-white shadow-xl">
                  <CheckCircle2 size={28} />
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-right pb-6">
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-4">
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">{user.firstName} {user.lastName}</h2>
                <VerificationBadge status={user.verificationStatus} />
              </div>
              <div className="flex wrap items-center justify-center md:justify-start gap-3">
                {isWorker ? (
                  user.categories?.map(c => <span key={c} className="bg-emerald-50 text-emerald-700 px-5 py-2 rounded-full text-xs font-black border border-emerald-100 shadow-sm">{c}</span>)
                ) : <span className="bg-blue-50 text-blue-700 px-5 py-2 rounded-full text-xs font-black border border-blue-100">زبون مسجل</span>}
                <span className="flex items-center gap-2 text-slate-500 font-bold text-xs bg-slate-50 px-5 py-2 rounded-full border border-slate-200"><MapPin size={16} className="text-emerald-500" /> {user.location.wilaya}</span>
                <span className="flex items-center gap-2 text-slate-400 font-bold text-xs bg-slate-50 px-5 py-2 rounded-full border border-slate-100"><Calendar size={16} /> انضم منذ {user.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}</span>
              </div>
            </div>
          </div>

          {/* Worker Stats */}
          {isWorker && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              <div className="bg-white border border-slate-100 p-8 rounded-[3rem] text-center shadow-sm hover:shadow-xl transition-all">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">التقييم العام</p>
                <div className="text-4xl font-black text-yellow-500 flex items-center justify-center gap-2"><Star size={28} fill="currentColor" /> {user.rating?.toFixed(1) || '0.0'}</div>
                <p className="text-[10px] text-slate-300 font-bold mt-1">من {user.ratingCount || 0} تقييم</p>
              </div>
              <div className="bg-white border border-slate-100 p-8 rounded-[3rem] text-center shadow-sm hover:shadow-xl transition-all">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">المهام المنجزة</p>
                <div className="text-4xl font-black text-slate-800 flex items-center justify-center gap-2"><Briefcase size={28} className="text-emerald-500" /> {user.completedJobs || 0}</div>
              </div>
              <div className="bg-white border border-slate-100 p-8 rounded-[3rem] text-center shadow-sm hover:shadow-xl transition-all">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">المصداقية</p>
                <div className="text-4xl font-black text-blue-600 flex items-center justify-center gap-2"><Zap size={28} /> 100%</div>
              </div>
              <div className="bg-white border border-slate-100 p-8 rounded-[3rem] text-center shadow-sm hover:shadow-xl transition-all">
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">سرعة الرد</p>
                <div className="text-4xl font-black text-slate-800 flex items-center justify-center gap-2"><Clock size={28} className="text-orange-400" /> سريع</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contacts & Actions */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-slate-950 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/20 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                <h4 className="font-black text-xl mb-8 flex items-center gap-3">تواصل الآن <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div></h4>
                <div className="space-y-5">
                  <div className="text-4xl font-mono text-center py-6 bg-white/5 rounded-3xl tracking-[0.2em] border border-white/10 select-all">{user.phone}</div>
                  <a href={`tel:${user.phone}`} className="flex items-center justify-center gap-3 w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-[2.5rem] font-black text-2xl transition-all shadow-xl shadow-emerald-950/50 active:scale-95"><Phone size={24} /> اتصــال</a>
                  <button className="flex items-center justify-center gap-3 w-full bg-white/5 hover:bg-white/10 py-6 rounded-[2.5rem] font-black text-xl border border-white/10 transition-all active:scale-95"><MessageSquare size={22} /> مراسلة سلكني</button>
                </div>
              </div>
              {isWorker && user.skills && user.skills.length > 0 && (
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2 text-lg"><Zap className="text-emerald-500" size={20} /> المهارات الأساسية</h4>
                  <div className="flex wrap gap-2.5">
                    {user.skills.map(s => <span key={s} className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-black border border-slate-100">{s}</span>)}
                  </div>
                </div>
              )}
            </div>

            {/* Bio & Portfolio */}
            <div className="lg:col-span-2 space-y-16">
              <section className="animate-in">
                <h4 className="text-3xl font-black text-slate-900 flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600"><Award size={24} /></div>
                  نبذة عن {user.firstName}
                </h4>
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-8 left-10 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000"><Briefcase size={160} /></div>
                  <p className="text-slate-600 font-medium text-xl leading-relaxed relative z-10 whitespace-pre-wrap">{user.bio || 'لم يقم هذا المستخدم بإضافة نبذة تعريفية بعد.'}</p>
                </div>
              </section>

              {isWorker && (
                <section className="animate-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between mb-10 px-4">
                    <h4 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600"><ImageIcon size={24} /></div>
                      ألبوم الأعمال الموثقة
                    </h4>
                    <div className="flex items-center gap-3">
                      {isOwn && (
                        <>
                          <button 
                            onClick={() => portfolioInputRef.current?.click()}
                            disabled={uploading}
                            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-xl shadow-emerald-100 hover:bg-emerald-500 transition-all flex items-center gap-2 active:scale-95 disabled:bg-slate-300"
                          >
                            {uploading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Plus size={18} />}
                            أضف صورة
                          </button>
                          <input type="file" hidden ref={portfolioInputRef} accept="image/*" onChange={handleQuickPortfolioUpload} />
                        </>
                      )}
                      {user.portfolio?.length > 0 && <span className="hidden md:block text-slate-400 font-black text-xs bg-slate-100 px-5 py-2 rounded-full border border-slate-200">{user.portfolio.length} صور</span>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {user.portfolio && user.portfolio.length > 0 ? user.portfolio.map((img, idx) => (
                      <div key={idx} className="group relative aspect-square rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-xl border-[6px] border-white transition-all hover:scale-[1.03] active:scale-95 cursor-zoom-in">
                        <img src={img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-8">
                          <div className="flex items-center justify-between w-full">
                            <span className="text-white text-[10px] font-black uppercase bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">عمل رقم {idx+1}</span>
                            {isOwn && (
                              <button onClick={(e) => { e.stopPropagation(); removePortfolioImage(idx); }} className="bg-red-500 text-white p-3 rounded-2xl shadow-xl hover:bg-red-600 transition-all"><Trash2 size={18} /></button>
                            )}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-28 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200 text-center flex flex-col items-center justify-center group">
                        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-xl mb-8 group-hover:scale-110 transition-transform"><ImageIcon className="text-slate-200" size={48} /></div>
                        <p className="text-slate-500 font-black text-2xl mb-2 tracking-tight">الألبوم لا يزال فارغاً</p>
                        {isOwn ? (
                          <button onClick={() => portfolioInputRef.current?.click()} className="text-emerald-600 font-black flex items-center gap-2 hover:underline">انشر عملك الأول لجذب الزبائن <Plus size={18}/></button>
                        ) : <p className="text-slate-300 font-bold text-base">تواصل مع الحرفي لمشاهدة عينات من عمله</p>}
                      </div>
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

const TasksMarketView = ({ tasks, loading, filters, onFilterChange, currentUser, onTaskCreated }: any) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16 animate-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
        <div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-3 tracking-tighter">سوق المهام <span className="text-emerald-500">DZ</span> 🇩🇿</h2>
          <p className="text-slate-500 font-bold text-lg md:text-xl">تصفح طلبات الزبائن المتاحة الآن في ولايتك.</p>
        </div>
        <button 
          onClick={() => currentUser ? setShowCreateModal(true) : alert('يجب تسجيل الدخول لنشر طلب')}
          className="w-full md:w-auto bg-emerald-600 text-white px-12 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-emerald-900/30 hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
        >
          <Plus size={28} /> انشر طلبك مجاناً
        </button>
      </div>

      <div className="bg-white p-6 rounded-[3rem] shadow-xl border border-slate-100 mb-12 flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex gap-4 overflow-x-auto no-scrollbar">
          <select className="p-5 bg-slate-50 rounded-2xl font-black text-sm min-w-[160px] border-none focus:ring-4 ring-emerald-50 transition-all" value={filters.wilaya} onChange={e => onFilterChange({...filters, wilaya: e.target.value})}>
            <option value="">كل الولايات 🇩🇿</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select className="p-5 bg-slate-50 rounded-2xl font-black text-sm min-w-[200px] border-none focus:ring-4 ring-emerald-50 transition-all" value={filters.category} onChange={e => onFilterChange({...filters, category: e.target.value})}>
            <option value="">كل الحرف ⚒️</option>
            {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4 border-t md:border-t-0 pt-6 md:pt-0 border-slate-100">
          <ArrowUpDown size={20} className="text-slate-400" />
          <select className="flex-1 p-5 bg-slate-50 rounded-2xl font-black text-sm border-none focus:ring-4 ring-emerald-50 transition-all" value={filters.sortBy} onChange={e => onFilterChange({...filters, sortBy: e.target.value})}>
            <option value="newest">الأحدث أولاً</option>
            <option value="budget_desc">الميزانية الأعلى</option>
            <option value="budget_asc">الميزانية الأقل</option>
          </select>
        </div>
      </div>

      {loading ? <div className="py-40 flex justify-center"><div className="loading-spinner"></div></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {tasks.length > 0 ? tasks.map((task: any) => (
            <div key={task.id} className="bg-white p-8 rounded-[3.5rem] shadow-lg border border-slate-100 hover:shadow-2xl transition-all group">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-emerald-50 text-emerald-700 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">{task.category}</span>
                <span className="text-emerald-600 font-black text-2xl tracking-tighter">{task.budget > 0 ? `${task.budget.toLocaleString()} دج` : 'سعر مفتوح'}</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 line-clamp-2 leading-tight group-hover:text-emerald-600 transition-colors">{task.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-3 mb-8 font-medium leading-relaxed h-14">{task.description}</p>
              
              <div className="space-y-4 mb-8 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                <div className="flex items-center gap-3 text-slate-500 text-xs font-black"><MapPin size={18} className="text-emerald-500" /> {task.wilaya}</div>
                <div className="flex items-center gap-3 text-slate-500 text-xs font-black"><Clock size={18} className="text-emerald-500" /> {new Date(task.created_at).toLocaleDateString('ar-DZ', {day:'numeric', month:'short'})}</div>
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <img src={task.seeker_avatar || `https://ui-avatars.com/api/?name=${task.seeker_name}`} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" />
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 truncate max-w-[120px]">{task.seeker_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">زبون موثق</p>
                  </div>
                </div>
                <button className="bg-slate-950 text-white px-8 py-4 rounded-[1.5rem] text-sm font-black hover:bg-emerald-600 transition-all shadow-xl active:scale-95">تقديم عرض</button>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 shadow-inner">
              <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8"><ClipboardList size={56} className="text-slate-200" /></div>
              <p className="text-slate-500 font-black text-3xl mb-4 tracking-tight">لا توجد مهام حالياً</p>
              <p className="text-slate-300 font-bold text-lg">كن أول من ينشر طلباً في ولايتك!</p>
            </div>
          )}
        </div>
      )}

      {showCreateModal && <CreateTaskModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); onTaskCreated(); }} currentUser={currentUser} />}
    </div>
  );
};

// --- View: Search Workers ---

const SearchWorkersView = ({ workers, loading, filters, onFilterChange, onProfile }: any) => (
  <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16 animate-in">
    <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 mb-16 flex flex-col md:flex-row gap-8">
      <div className="flex-1 relative">
        <input placeholder="ابحث عن حرفي بالاسم أو نوع الخدمة..." className="w-full p-6 pr-16 bg-slate-50 rounded-[2.5rem] font-black text-xl border-none focus:ring-4 ring-emerald-50 transition-all" value={filters.query} onChange={e => onFilterChange({...filters, query: e.target.value})} />
        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={28} />
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <select className="p-6 bg-slate-50 rounded-[2.5rem] font-black text-lg border-none min-w-[200px] focus:ring-4 ring-emerald-50 transition-all" value={filters.wilaya} onChange={e => onFilterChange({...filters, wilaya: e.target.value})}>
          <option value="">كل الجزائر 🇩🇿</option>
          {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <select className="p-6 bg-slate-50 rounded-[2.5rem] font-black text-lg border-none min-w-[220px] focus:ring-4 ring-emerald-50 transition-all" value={filters.category} onChange={e => onFilterChange({...filters, category: e.target.value})}>
          <option value="">كل التخصصات ⚒️</option>
          {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
      {loading ? <div className="col-span-full py-40 flex justify-center"><div className="loading-spinner"></div></div> : workers.length > 0 ? workers.map((w: any) => (
        <div key={w.id} onClick={() => onProfile(w)} className="bg-white p-10 rounded-[4rem] shadow-lg border border-slate-100 cursor-pointer hover:-translate-y-4 hover:shadow-2xl transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[4rem] -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-6 mb-10 relative z-10">
            <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-24 h-24 rounded-[2.5rem] object-cover border-4 border-white shadow-xl" />
            <div className="text-right flex-1 min-w-0">
              <h3 className="text-2xl font-black text-slate-900 truncate group-hover:text-emerald-600 transition-colors tracking-tighter">{w.firstName} {w.lastName}</h3>
              <div className="mt-2 flex gap-2"><VerificationBadge status={w.verificationStatus} size="sm" /></div>
            </div>
          </div>
          <p className="text-slate-500 text-base line-clamp-3 h-18 mb-10 font-medium leading-relaxed">{w.bio || 'حرفي متمرس يسعى لتقديم أفضل خدمة لزبائن سلكني.'}</p>
          <div className="flex wrap gap-2 mb-10">
            {w.categories?.slice(0, 2).map((c: string) => <span key={c} className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black border border-slate-100 uppercase">{c}</span>)}
            {w.categories?.length > 2 && <span className="text-slate-300 font-black text-[10px] self-center">+ {w.categories.length - 2}</span>}
          </div>
          <div className="flex justify-between items-center pt-8 border-t border-slate-50 relative z-10">
            <span className="text-slate-400 text-xs font-black flex items-center gap-2"><MapPin size={16} className="text-emerald-500" /> {w.location.wilaya}</span>
            <div className="flex items-center gap-2 text-yellow-500 font-black text-xl bg-yellow-50 px-5 py-2 rounded-full border border-yellow-100 shadow-sm"><Star size={20} fill="currentColor" /> {w.rating?.toFixed(1) || '0.0'}</div>
          </div>
        </div>
      )) : (
        <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 shadow-inner">
          <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10"><UserIcon className="text-slate-200" size={64} /></div>
          <p className="text-slate-500 font-black text-4xl mb-4 tracking-tighter">لم نجد أي حرفيين</p>
          <p className="text-slate-400 font-bold text-xl">جرب تغيير معايير البحث أو اختيار مدينة أخرى.</p>
        </div>
      )}
    </div>
  </div>
);

// --- Modals & Helpers ---

const CreateTaskModal = ({ onClose, onCreated, currentUser }: any) => {
  const [formData, setFormData] = useState({ title: '', description: '', category: SERVICE_CATEGORIES[0].name, wilaya: WILAYAS[0], budget: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-end md:items-center justify-center p-0 md:p-6 animate-in">
      <div className="bg-white w-full max-w-2xl rounded-t-[4rem] md:rounded-[4rem] p-10 md:p-16 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <button onClick={onClose} className="absolute top-8 left-8 text-slate-300 hover:text-red-500 transition-colors p-3 bg-slate-50 rounded-2xl"><X size={32} /></button>
        <h2 className="text-3xl md:text-5xl font-black mb-12 border-r-[12px] border-emerald-500 pr-6 tracking-tighter">نشر طلب خدمة ⚒️</h2>
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-4">
            <label className="font-black text-slate-500 mr-2 text-sm uppercase tracking-widest">عنوان الطلب</label>
            <input required placeholder="مثال: تصليح غسالة سامسونج" className="w-full p-6 bg-slate-50 rounded-3xl font-black text-xl border-none focus:ring-4 ring-emerald-50 transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="font-black text-slate-500 mr-2 text-sm uppercase tracking-widest">التصنيف</label>
              <select className="w-full p-6 bg-slate-50 rounded-3xl font-black text-lg border-none focus:ring-4 ring-emerald-50 transition-all cursor-pointer" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <label className="font-black text-slate-500 mr-2 text-sm uppercase tracking-widest">الولاية</label>
              <select className="w-full p-6 bg-slate-50 rounded-3xl font-black text-lg border-none focus:ring-4 ring-emerald-50 transition-all cursor-pointer" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <label className="font-black text-slate-500 mr-2 text-sm uppercase tracking-widest">الميزانية المقترحة (دج)</label>
            <div className="relative">
              <input type="number" placeholder="أدخل مبلغ تقريبي" className="w-full p-6 pl-20 bg-slate-50 rounded-3xl font-black text-xl border-none focus:ring-4 ring-emerald-50 transition-all" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
              <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-slate-400">DA</span>
            </div>
          </div>
          <div className="space-y-4">
            <label className="font-black text-slate-500 mr-2 text-sm uppercase tracking-widest">تفاصيل المهمة</label>
            <textarea required placeholder="اشرح لنا المشكلة بالتفصيل..." className="w-full p-8 bg-slate-50 rounded-[2.5rem] font-black text-xl h-48 border-none focus:ring-4 ring-emerald-50 transition-all leading-relaxed" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <button disabled={loading} className="w-full bg-emerald-600 text-white py-7 rounded-[3rem] font-black text-2xl shadow-2xl shadow-emerald-900/30 hover:bg-emerald-500 active:scale-95 transition-all">
            {loading ? <div className="loading-spinner mx-auto border-t-white"></div> : 'انشر طلبك الآن ✅'}
          </button>
        </form>
      </div>
    </div>
  );
};

const EditProfileView = ({ user, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio || '',
    avatar: user.avatar || '',
    wilaya: user.location.wilaya,
    portfolio: user.portfolio || [],
  });
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'portfolio') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'avatar') setFormData(prev => ({ ...prev, avatar: base64 }));
      else {
        if (formData.portfolio.length >= 10) return alert('الحد الأقصى 10 صور');
        setFormData(prev => ({ ...prev, portfolio: [...prev.portfolio, base64] }));
      }
    };
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
        wilaya: formData.wilaya,
        portfolio: formData.portfolio,
      }).eq('id', user.id);
      if (error) throw error;
      onSave({ ...user, ...formData, location: { ...user.location, wilaya: formData.wilaya } });
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in">
      <div className="bg-white p-10 md:p-16 rounded-[4rem] shadow-2xl border border-slate-100">
        <h2 className="text-3xl md:text-5xl font-black mb-16 text-slate-900 border-r-[12px] border-emerald-500 pr-6 tracking-tighter">إعدادات الملف الشخصي ⚙️</h2>
        <form onSubmit={submit} className="space-y-16">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.firstName}`} className="w-48 h-48 rounded-[3.5rem] object-cover border-[10px] border-emerald-50 shadow-2xl bg-slate-50 transition-all group-hover:scale-105" />
              <div className="absolute inset-0 bg-slate-900/40 rounded-[3.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={48} /></div>
              <div className="absolute bottom-4 right-4 bg-emerald-600 text-white p-3 rounded-2xl shadow-xl border-4 border-white"><UploadCloud size={24} /></div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">تحديث صورة الحساب</p>
            <input type="file" hidden ref={avatarInputRef} accept="image/*" onChange={e => handleImageUpload(e, 'avatar')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="font-black text-slate-500 mr-2 text-sm uppercase tracking-widest">الاسم الأول</label>
              <input required className="w-full p-6 bg-slate-50 rounded-3xl font-black text-xl border-none focus:ring-4 ring-emerald-50 transition-all" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-4">
              <label className="font-black text-slate-500 mr-2 text-sm uppercase tracking-widest">اللقب</label>
              <input required className="w-full p-6 bg-slate-50 rounded-3xl font-black text-xl border-none focus:ring-4 ring-emerald-50 transition-all" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>

          <div className="space-y-4">
            <label className="font-black text-slate-500 mr-2 text-sm uppercase tracking-widest">نبذة تعريفية</label>
            <textarea className="w-full p-8 bg-slate-50 rounded-[2.5rem] font-black text-xl h-56 border-none focus:ring-4 ring-emerald-50 transition-all leading-relaxed" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="أخبر الزبائن عن خبرتك وما يميز خدماتك..." />
          </div>

          <div className="space-y-4">
            <label className="font-black text-slate-500 mr-2 text-sm uppercase tracking-widest">الولاية</label>
            <select className="w-full p-6 bg-slate-50 rounded-3xl font-black text-xl border-none focus:ring-4 ring-emerald-50 transition-all cursor-pointer" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          {/* Portfolio Management */}
          <div className="space-y-8 pt-8">
            <div className="flex items-center justify-between px-4">
              <label className="block font-black text-2xl text-slate-900 tracking-tight">ألبوم الأعمال 📸</label>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-5 py-2 rounded-full border border-emerald-100">{formData.portfolio.length} / 10 صور</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
              {formData.portfolio.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-[2rem] overflow-hidden group border-4 border-slate-50 shadow-md">
                  <img src={img} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button type="button" onClick={() => setFormData(prev => ({...prev, portfolio: prev.portfolio.filter((_, i) => i !== idx)}))} className="bg-red-500 text-white p-4 rounded-2xl shadow-2xl hover:bg-red-600 active:scale-90 transition-all"><Trash2 size={24} /></button>
                  </div>
                </div>
              ))}
              {formData.portfolio.length < 10 && (
                <div onClick={() => portfolioInputRef.current?.click()} className="aspect-square bg-emerald-50/50 rounded-[2rem] border-4 border-dashed border-emerald-100 flex flex-col items-center justify-center text-emerald-600 cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all group">
                  <div className="p-5 bg-white rounded-2xl shadow-xl mb-4 group-hover:scale-110 transition-transform"><Plus size={36} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">إضافة صورة</span>
                  <input type="file" hidden ref={portfolioInputRef} accept="image/*" onChange={e => handleImageUpload(e, 'portfolio')} />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 pt-12">
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-7 rounded-[3rem] font-black text-2xl shadow-2xl shadow-emerald-900/20 hover:bg-emerald-500 active:scale-95 transition-all">
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات ✅'}
            </button>
            <button type="button" onClick={onCancel} className="w-full bg-slate-100 text-slate-600 py-7 rounded-[3rem] font-black text-2xl active:scale-95 transition-all">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminPanelView = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('users').select('*').eq('verification_status', 'pending');
    if (!error) setPendingUsers((data || []).map(d => ({
      ...d, firstName: d.first_name, lastName: d.last_name, phone: d.phone, role: d.role,
      location: { wilaya: d.wilaya, daira: d.daira || '' }, avatar: d.avatar, bio: d.bio,
      idFront: d.id_front, idBack: d.id_back, verificationStatus: d.verification_status, portfolio: d.portfolio || []
    } as User)));
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (userId: string, status: VerificationStatus) => {
    const { error } = await supabase.from('users').update({ verification_status: status }).eq('id', userId);
    if (!error) {
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      setSelectedUser(null);
      alert(status === 'verified' ? 'تم التفعيل بنجاح ✅' : 'تم الرفض ❌');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-in">
      <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tighter">إدارة التوثيقات <span className="text-emerald-500">ADMIN</span></h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 overflow-y-auto max-h-[75vh] no-scrollbar">
          <h3 className="font-black text-slate-400 mb-8 uppercase text-xs tracking-[0.3em] mr-2">طلبات معلقة ({pendingUsers.length})</h3>
          {pendingUsers.length === 0 ? <p className="text-center py-24 text-slate-300 font-bold">كل شيء نظيف! لا يوجد طلبات</p> : pendingUsers.map(u => (
            <div key={u.id} onClick={() => setSelectedUser(u)} className={`p-6 rounded-[2rem] cursor-pointer mb-6 transition-all border-4 flex items-center gap-5 ${selectedUser?.id === u.id ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-100 shadow-sm'}`}>
               <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.firstName}`} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" />
               <div className="text-right flex-1 truncate">
                  <p className="font-black text-slate-900 truncate text-lg">{u.firstName} {u.lastName}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{u.location.wilaya}</p>
               </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-emerald-100">
              <div className="flex items-center gap-6 mb-12 border-b border-slate-50 pb-10">
                <img src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.firstName}`} className="w-24 h-24 rounded-[2.5rem] object-cover border-4 border-emerald-50 shadow-2xl" />
                <div className="text-right">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <p className="text-slate-500 font-bold text-lg">{selectedUser.phone} | {selectedUser.location.wilaya}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                <div className="space-y-4">
                   <p className="font-black text-xs text-slate-400 uppercase tracking-widest mr-2">الهوية (أمام)</p>
                   <div className="rounded-[3rem] aspect-video border-4 border-slate-50 overflow-hidden bg-slate-950 flex items-center justify-center shadow-inner group">
                     {selectedUser.idFront ? <img src={selectedUser.idFront} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000" /> : <ShieldAlert className="text-white/20" size={64} />}
                   </div>
                </div>
                <div className="space-y-4">
                   <p className="font-black text-xs text-slate-400 uppercase tracking-widest mr-2">الهوية (خلف)</p>
                   <div className="rounded-[3rem] aspect-video border-4 border-slate-50 overflow-hidden bg-slate-950 flex items-center justify-center shadow-inner group">
                     {selectedUser.idBack ? <img src={selectedUser.idBack} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000" /> : <ShieldAlert className="text-white/20" size={64} />}
                   </div>
                </div>
              </div>
              <div className="flex gap-6">
                <button onClick={() => handleAction(selectedUser.id, 'verified')} className="flex-1 bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all">قبول التوثيق ✅</button>
                <button onClick={() => handleAction(selectedUser.id, 'rejected')} className="flex-1 bg-red-50 text-red-600 py-6 rounded-[2.5rem] font-black text-2xl border-2 border-red-100 active:scale-95 transition-all hover:bg-red-600 hover:text-white">رفض الطلب ❌</button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-200 p-16 text-center shadow-inner">
              <ShieldQuestion size={120} strokeWidth={1} />
              <p className="mt-8 text-3xl font-black text-slate-400 tracking-tight">يرجى اختيار حساب لمراجعته</p>
              <p className="text-slate-300 font-bold text-lg mt-3">سيتم عرض مستندات الهوية هنا بشكل كامل</p>
            </div>
          )}
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
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('users').select('*').eq('phone', phone).eq('password', password).single();
    if (error) {
      alert("بيانات الدخول خاطئة، يرجى التحقق من الرقم وكلمة المرور.");
    } else {
      onSuccess({
        ...data,
        firstName: data.first_name,
        lastName: data.last_name,
        location: { wilaya: data.wilaya, daira: data.daira || '' },
        categories: data.categories || [],
        portfolio: data.portfolio || [],
        verificationStatus: data.verification_status || 'none',
        createdAt: data.created_at
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in">
      <form onSubmit={login} className="bg-white p-12 md:p-20 rounded-[4rem] shadow-2xl border w-full max-w-xl space-y-10 text-right relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-bl-[6rem] -mr-24 -mt-24"></div>
        <h2 className="text-4xl md:text-6xl font-black mb-16 border-r-[15px] border-emerald-500 pr-8 tracking-tighter leading-none">مرحباً بك <br/> مجدداً 👋</h2>
        <div className="space-y-6">
          <label className="font-black text-slate-500 mr-4 text-xs uppercase tracking-[0.3em]">رقم الهاتف</label>
          <input required placeholder="مثال: 0550123456" className="w-full p-6 bg-slate-50 rounded-[2.5rem] border-none font-black text-2xl outline-none focus:ring-4 ring-emerald-50 transition-all shadow-inner" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="space-y-6">
          <label className="font-black text-slate-500 mr-4 text-xs uppercase tracking-[0.3em]">كلمة المرور</label>
          <input required type="password" placeholder="••••••••" className="w-full p-6 bg-slate-50 rounded-[2.5rem] border-none font-black text-2xl outline-none focus:ring-4 ring-emerald-50 transition-all shadow-inner" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button disabled={loading} className="w-full bg-emerald-600 text-white py-8 rounded-[3rem] font-black text-2xl shadow-2xl shadow-emerald-900/30 hover:bg-emerald-500 active:scale-95 transition-all mt-12">
          {loading ? 'جاري الدخول...' : 'دخول إلى سلكني'}
        </button>
        <div className="text-center space-y-4 mt-8">
           <p className="text-slate-400 font-bold text-sm">ليس لديك حساب؟ <span className="text-emerald-600 cursor-pointer hover:underline" onClick={() => alert('التسجيل متاح عبر التطبيق قريباً')}>سجل الآن كحرفي</span></p>
           <button type="button" className="text-slate-300 font-black text-xs uppercase tracking-widest hover:text-emerald-500">نسيت كلمة المرور؟</button>
        </div>
      </form>
    </div>
  );
};
