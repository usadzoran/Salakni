
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, Message, Worker, VerificationStatus, Task, TaskStatus } from './types.ts';
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
  Briefcase,
  Clock,
  DollarSign,
  Filter,
  ArrowUpDown,
  Zap,
  CheckCircle2,
  Share2,
  UploadCloud,
  Calendar,
  ExternalLink
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
    input, select, textarea { font-size: 16px !important; }
    .profile-banner { background: linear-gradient(135deg, #065f46 0%, #0d9488 100%); position: relative; overflow: hidden; }
    .profile-banner::after { content: ''; position: absolute; inset: 0; background: url('https://www.transparenttextures.com/patterns/cubes.png'); opacity: 0.1; }
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskFilters, setTaskFilters] = useState({ category: '', wilaya: '', sortBy: 'newest' });
  const [chatTarget, setChatTarget] = useState<User | null>(null);
  const [searchFilters, setSearchFilters] = useState({ query: '', wilaya: '', category: '' });

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
    createdAt: d.created_at
  });

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('users').select('*').eq('role', UserRole.WORKER);
      if (searchFilters.wilaya) query = query.eq('wilaya', searchFilters.wilaya);
      if (searchFilters.category) query = query.contains('categories', [searchFilters.category]);
      const { data, error } = await query;
      if (error) throw error;
      setState(prev => ({ ...prev, workers: (data || []).map(mapDbUser) as Worker[] }));
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
      
      <nav className="hidden md:flex h-20 bg-white/90 backdrop-blur-md border-b sticky top-0 z-50 items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} />
          <div className="flex items-center gap-6">
            <button onClick={() => setView('search')} className={`font-bold transition-all ${state.view === 'search' ? 'text-emerald-600 scale-105' : 'text-slate-600 hover:text-emerald-500'}`}>تصفح الحرفيين</button>
            <button onClick={() => setView('support')} className={`font-bold transition-all ${state.view === 'support' ? 'text-emerald-600 scale-105' : 'text-slate-600 hover:text-emerald-500'}`}>سوق المهام</button>
            {state.currentUser?.role === UserRole.ADMIN && (
              <button onClick={() => setView('admin-panel')} className="font-black text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl"><ShieldCheck size={18} /> الإدارة</button>
            )}
            {state.currentUser ? (
              <div onClick={() => { setChatTarget(null); setView('profile'); }} className="flex items-center gap-3 cursor-pointer bg-slate-100 pl-4 pr-1 py-1 rounded-full border border-slate-200 hover:border-emerald-200 transition-all">
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
                <span className="font-black text-sm">{state.currentUser.firstName}</span>
              </div>
            ) : (
              <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">دخول</button>
            )}
          </div>
        </div>
      </nav>

      <header className="md:hidden flex h-16 bg-white border-b sticky top-0 z-40 items-center px-5 justify-between">
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

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t px-6 py-3 flex justify-between md:hidden z-50 rounded-t-[2.5rem] shadow-2xl border-slate-100">
        <button onClick={() => setView('landing')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${state.view === 'landing' ? 'nav-item-active' : 'text-slate-400'}`}>
          <div className="icon-container p-2 transition-colors"><Home size={22} /></div>
          <span className="text-[10px] font-black">الرئيسية</span>
        </button>
        <button onClick={() => setView('search')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${state.view === 'search' ? 'nav-item-active' : 'text-slate-400'}`}>
          <div className="icon-container p-2 transition-colors"><Search size={22} /></div>
          <span className="text-[10px] font-black">الحرفيين</span>
        </button>
        <button onClick={() => setView('support')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${state.view === 'support' ? 'nav-item-active' : 'text-slate-400'}`}>
          <div className="icon-container p-2 transition-colors"><Briefcase size={22} /></div>
          <span className="text-[10px] font-black">المهام</span>
        </button>
        <button onClick={() => { setChatTarget(null); state.currentUser ? setView('profile') : setView('login'); }} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${state.view === 'profile' ? 'nav-item-active' : 'text-slate-400'}`}>
          <div className="icon-container p-2 transition-colors"><UserIcon size={22} /></div>
          <span className="text-[10px] font-black">حسابي</span>
        </button>
      </div>
    </div>
  );
}

// --- Views Components ---

const LandingView = ({ onSearch }: any) => (
  <div className="relative min-h-[85vh] flex items-center justify-center text-center px-6 overflow-hidden">
    <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
    <div className="relative z-10 max-w-4xl animate-in">
      <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight">سَلّكني يسلكها <br className="md:hidden" /><span className="text-emerald-400">في الحين!</span></h1>
      <p className="text-base md:text-2xl text-slate-300 mb-10 font-medium px-4">أفضل الحرفيين في الجزائر بانتظارك. تواصل مباشر، أمان، وجدارة.</p>
      <button onClick={onSearch} className="bg-emerald-600 text-white px-10 py-4.5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/40 active:scale-95 transition-all">ابدأ البحث 🔍</button>
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
      const newPortfolio = [...(user.portfolio || []), base64];
      if (newPortfolio.length > 10) {
        alert('الحد الأقصى للصور هو 10 صور');
        setUploading(false);
        return;
      }

      const { data, error } = await supabase.from('users').update({ portfolio: newPortfolio }).eq('id', user.id).select().single();
      if (!error && data) {
        onDataUpdate({ ...user, portfolio: newPortfolio });
      } else {
        alert('فشل رفع الصورة، يرجى المحاولة لاحقاً');
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-16 px-4 md:px-6 animate-in">
      <div className="mb-8 flex justify-between items-center">
        {!isOwn ? (
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold hover:text-emerald-600 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border">
            <ChevronLeft size={20} /> العودة للبحث
          </button>
        ) : (
          <div className="bg-emerald-50 px-4 py-2 rounded-xl text-emerald-700 font-black text-sm flex items-center gap-2 border border-emerald-100">
            <UserIcon size={16} /> ملفك الشخصي
          </div>
        )}
        <div className="flex gap-2">
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 transition-colors shadow-sm">
            <Share2 size={20} />
          </button>
          {isOwn && (
            <>
              <button onClick={onEdit} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-emerald-50 transition-colors shadow-sm">
                <Settings size={20} />
              </button>
              <button onClick={onLogout} className="p-3 bg-red-50 text-red-500 border border-red-100 rounded-2xl hover:bg-red-500 hover:text-white transition-colors shadow-sm">
                <LogOut size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 relative">
        {/* Banner Section */}
        <div className="profile-banner h-40 md:h-64 shadow-inner"></div>
        
        <div className="px-6 md:px-16 pb-16 relative">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-20 md:-mt-32 mb-12">
            <div className="relative">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&background=10b981&color=fff`} 
                className="w-40 h-40 md:w-56 md:h-56 rounded-[2.5rem] md:rounded-[4rem] border-[8px] md:border-[12px] border-white shadow-2xl object-cover bg-white" 
              />
              {isWorker && user.verificationStatus === 'verified' && (
                <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-emerald-500 text-white p-1.5 md:p-2 rounded-2xl border-4 border-white shadow-lg">
                  <CheckCircle2 size={24} />
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-right pb-4">
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 mb-3">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{user.firstName} {user.lastName}</h2>
                <VerificationBadge status={user.verificationStatus} />
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                {isWorker ? (
                  user.categories?.map((c: string) => (
                    <span key={c} className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black border border-emerald-100 shadow-sm">{c}</span>
                  ))
                ) : (
                  <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black border border-blue-100">زبون مميز</span>
                )}
                <span className="flex items-center gap-1.5 text-slate-500 font-bold text-xs bg-slate-100/50 px-4 py-1.5 rounded-full border border-slate-200">
                  <MapPin size={14} className="text-emerald-600" /> {user.location.wilaya}
                </span>
                <span className="flex items-center gap-1.5 text-slate-400 font-bold text-xs bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                  <Calendar size={14} /> انضم {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-DZ', {month:'long', year:'numeric'}) : 'منذ فترة'}
                </span>
              </div>
            </div>
          </div>

          {/* Professional Stats Cards */}
          {isWorker && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-[2.5rem] text-center transition-all hover:shadow-lg hover:-translate-y-1">
                <p className="text-slate-400 font-black text-[10px] uppercase mb-1">التقييم</p>
                <div className="text-3xl font-black text-yellow-500 flex items-center justify-center gap-2">
                  <Star size={24} fill="currentColor" /> {user.rating?.toFixed(1) || '0.0'}
                </div>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-[2.5rem] text-center transition-all hover:shadow-lg hover:-translate-y-1">
                <p className="text-slate-400 font-black text-[10px] uppercase mb-1">المهام المنجزة</p>
                <div className="text-3xl font-black text-slate-800 flex items-center justify-center gap-2">
                  <Briefcase size={24} className="text-emerald-500" /> {user.ratingCount || 0}
                </div>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[2.5rem] text-center transition-all hover:shadow-lg hover:-translate-y-1">
                <p className="text-slate-400 font-black text-[10px] uppercase mb-1">المصداقية</p>
                <div className="text-3xl font-black text-blue-600 flex items-center justify-center gap-2">
                  <Zap size={24} /> 100%
                </div>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-[2.5rem] text-center transition-all hover:shadow-lg hover:-translate-y-1">
                <p className="text-slate-400 font-black text-[10px] uppercase mb-1">سرعة الرد</p>
                <div className="text-3xl font-black text-slate-800 flex items-center justify-center gap-2">
                  <Clock size={24} className="text-blue-400" /> سريع
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Actions & Contacts */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/20 blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                <h4 className="font-black text-lg mb-6 flex items-center gap-3">تواصل الآن <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div></h4>
                <div className="space-y-4">
                  <p className="text-3xl font-mono text-center py-5 bg-white/5 rounded-2xl tracking-[0.2em] border border-white/5">{user.phone}</p>
                  <a href={`tel:${user.phone}`} className="flex items-center justify-center gap-3 w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-[2rem] font-black text-xl transition-all shadow-xl shadow-emerald-900/40 active:scale-95">
                    <Phone size={24} /> اتصال هاتفـي
                  </a>
                  <button className="flex items-center justify-center gap-3 w-full bg-white/10 hover:bg-white/20 py-5 rounded-[2rem] font-black text-lg border border-white/10 transition-all active:scale-95">
                    <MessageSquare size={22} /> مراسلة سلكني
                  </button>
                </div>
              </div>

              {isWorker && user.skills && user.skills.length > 0 && (
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2"><Zap className="text-emerald-500" size={18} /> المهارات</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((s: string) => (
                      <span key={s} className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold border border-slate-100">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Bio & Portfolio */}
            <div className="lg:col-span-2 space-y-12">
              <section className="animate-in">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                      <Award size={22} />
                    </div>
                    حول الحرفي
                  </h4>
                </div>
                <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm leading-relaxed relative overflow-hidden">
                  <div className="absolute top-6 left-8 opacity-[0.03] pointer-events-none">
                    <Briefcase size={140} />
                  </div>
                  <p className="text-slate-600 font-medium text-lg relative z-10 whitespace-pre-wrap">
                    {user.bio || 'هذا الحرفي لم يضف نبذة تعريفية بعد، ولكن يمكنك التواصل معه لمعرفة المزيد عن خدماته المتميزة.'}
                  </p>
                </div>
              </section>

              {isWorker && (
                <section className="animate-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between mb-8 px-2">
                    <h4 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                        <ImageIcon size={22} />
                      </div>
                      معرض الأعمال
                    </h4>
                    <div className="flex items-center gap-3">
                      {isOwn && (
                        <button 
                          onClick={() => portfolioInputRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl text-sm font-black shadow-lg hover:bg-emerald-500 transition-all active:scale-95 disabled:bg-slate-300"
                        >
                          {uploading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Plus size={18} />}
                          تحميل صورة
                        </button>
                      )}
                      <input type="file" hidden ref={portfolioInputRef} accept="image/*" onChange={handleQuickPortfolioUpload} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {user.portfolio && user.portfolio.length > 0 ? (
                      user.portfolio.map((img: string, idx: number) => (
                        <div 
                          key={idx} 
                          className="group relative aspect-square rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-lg border-4 border-white transition-all hover:scale-[1.03] active:scale-95 cursor-pointer"
                        >
                          <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-6">
                            <div className="flex items-center justify-between w-full">
                              <span className="text-white text-[10px] font-black bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">عمل رقم {idx+1}</span>
                              <ExternalLink size={16} className="text-white" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                          <ImageIcon className="text-slate-200" size={40} />
                        </div>
                        <p className="text-slate-400 font-black text-xl mb-2">الألبوم فارغ</p>
                        {isOwn ? (
                          <button onClick={() => portfolioInputRef.current?.click()} className="mt-4 text-emerald-600 font-black flex items-center justify-center gap-2 mx-auto hover:scale-105 transition-transform"><Plus size={20} /> انشر عملك الأول واجذب الزبائن</button>
                        ) : (
                          <p className="text-slate-300 font-bold text-sm">تواصل مع الحرفي لطلب نماذج لعمله</p>
                        )}
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

// --- Other Views (Search, Tasks, etc) remain optimized as before ---

const TasksMarketView = ({ tasks, loading, filters, onFilterChange, currentUser, onTaskCreated }: any) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 animate-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">سوق المهام <span className="text-emerald-500">DZ</span> 🇩🇿</h2>
          <p className="text-slate-500 font-bold">تصفح طلبات الزبائن المفتوحة حالياً.</p>
        </div>
        <button 
          onClick={() => currentUser ? setShowCreateModal(true) : alert('يجب تسجيل الدخول لنشر مهمة')}
          className="w-full md:w-auto bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Plus size={24} /> انشر طلبك الآن
        </button>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <select 
            className="p-4 bg-slate-50 rounded-2xl font-bold border-none text-sm min-w-[140px] focus:ring-2 ring-emerald-50"
            value={filters.wilaya}
            onChange={e => onFilterChange({...filters, wilaya: e.target.value})}
          >
            <option value="">كل الولايات 🇩🇿</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select 
            className="p-4 bg-slate-50 rounded-2xl font-bold border-none text-sm min-w-[160px] focus:ring-2 ring-emerald-50"
            value={filters.category}
            onChange={e => onFilterChange({...filters, category: e.target.value})}
          >
            <option value="">كل الحرف ⚒️</option>
            {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <ArrowUpDown size={18} className="text-slate-400" />
          <select 
            className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold border-none text-sm focus:ring-2 ring-emerald-50"
            value={filters.sortBy}
            onChange={e => onFilterChange({...filters, sortBy: e.target.value})}
          >
            <option value="newest">الأحدث أولاً</option>
            <option value="budget_desc">الميزانية: الأعلى أولاً</option>
            <option value="budget_asc">الميزانية: الأقل أولاً</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="loading-spinner"></div></div>
      ) : tasks.length === 0 ? (
        <div className="bg-white py-24 rounded-[4rem] text-center border-2 border-dashed border-slate-100 shadow-inner">
          <ClipboardList size={80} className="mx-auto text-slate-100 mb-6" strokeWidth={1} />
          <p className="text-slate-400 font-black text-xl">لا توجد مهام منشورة تناسب بحثك</p>
          <button onClick={() => onFilterChange({category:'', wilaya:'', sortBy:'newest'})} className="mt-4 text-emerald-600 font-black text-sm hover:underline">إعادة ضبط البحث</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tasks.map((task: Task) => (
            <div key={task.id} className="bg-white p-8 rounded-[3rem] shadow-md border border-slate-100 hover:shadow-2xl transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-sm">{task.category}</span>
                <span className="text-emerald-600 font-black text-xl flex items-center gap-1">
                  <DollarSign size={20} className="text-emerald-400" />
                  {task.budget > 0 ? `${task.budget.toLocaleString()} دج` : 'سعر مفتوح'}
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">{task.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-3 mb-8 font-medium leading-relaxed">{task.description}</p>
              
              <div className="space-y-3 mb-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                  <MapPin size={16} className="text-emerald-500" /> {task.wilaya}
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                  <Clock size={16} className="text-emerald-500" /> {new Date(task.created_at).toLocaleDateString('ar-DZ', {day:'numeric', month:'short'})}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <img src={task.seeker_avatar || `https://ui-avatars.com/api/?name=${task.seeker_name}`} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" />
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 truncate max-w-[120px]">{task.seeker_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">زبون سلكني</p>
                  </div>
                </div>
                <button className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-sm font-black hover:bg-emerald-600 transition-all active:scale-95 shadow-lg">تقديم عرض</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateTaskModal 
          onClose={() => setShowCreateModal(false)} 
          onCreated={() => { setShowCreateModal(false); onTaskCreated(); }} 
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

// --- View: Search Workers ---

const SearchWorkersView = ({ workers, loading, filters, onFilterChange, onProfile }: any) => (
  <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 animate-in">
    <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-xl border border-slate-100 mb-12 flex flex-col md:flex-row gap-6">
      <div className="flex-1 relative">
        <input 
          placeholder="ابحث عن حرفي بالاسم أو الخبرة..." 
          className="w-full p-5 pr-12 bg-slate-50 rounded-[2rem] font-bold border-none focus:ring-4 ring-emerald-50 transition-all" 
          value={filters.query} 
          onChange={e => onFilterChange({...filters, query: e.target.value})} 
        />
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
      </div>
      <select 
        className="p-5 bg-slate-50 rounded-[2rem] font-bold border-none min-w-[180px] focus:ring-4 ring-emerald-50 transition-all cursor-pointer" 
        value={filters.wilaya} 
        onChange={e => onFilterChange({...filters, wilaya: e.target.value})}
      >
        <option value="">كل الجزائر 🇩🇿</option>
        {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
      </select>
      <select 
        className="p-5 bg-slate-50 rounded-[2rem] font-bold border-none min-w-[200px] focus:ring-4 ring-emerald-50 transition-all cursor-pointer" 
        value={filters.category} 
        onChange={e => onFilterChange({...filters, category: e.target.value})}
      >
        <option value="">كل التخصصات ⚒️</option>
        {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {loading ? (
        <div className="col-span-full py-40 flex flex-col items-center gap-4">
          <div className="loading-spinner"></div>
          <p className="text-slate-400 font-bold">جاري البحث عن أفضل الحرفيين...</p>
        </div>
      ) : workers.length === 0 ? (
        <div className="col-span-full py-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserIcon className="text-slate-200" size={40} />
          </div>
          <p className="text-slate-500 font-black text-2xl mb-2">عذراً، لم نجد حرفيين</p>
          <p className="text-slate-400 font-medium">جرب تغيير معايير البحث أو اختيار ولاية أخرى</p>
        </div>
      ) : (
        workers.map((w: any) => (
          <div 
            key={w.id} 
            onClick={() => onProfile(w)} 
            className="bg-white p-8 rounded-[3.5rem] shadow-lg border border-slate-100 cursor-pointer hover:-translate-y-3 hover:shadow-2xl transition-all group overflow-hidden"
          >
            <div className="flex items-center gap-5 mb-8">
              <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-20 h-20 rounded-[2rem] object-cover border-4 border-emerald-50 shadow-sm" />
              <div className="text-right flex-1 min-w-0">
                <h3 className="text-2xl font-black text-slate-900 truncate group-hover:text-emerald-600 transition-colors">{w.firstName} {w.lastName}</h3>
                <div className="mt-1 flex gap-2">
                  <VerificationBadge status={w.verificationStatus} size="sm" />
                </div>
              </div>
            </div>
            <p className="text-slate-500 text-sm line-clamp-3 h-14 mb-8 font-medium leading-relaxed">{w.bio || 'حرفي متمرس يسعى لتقديم أفضل خدمة لزبائن منصة سلكني.'}</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {w.categories?.slice(0, 2).map((c: string) => (
                <span key={c} className="bg-slate-50 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black border border-slate-100">{c}</span>
              ))}
              {w.categories?.length > 2 && <span className="text-slate-300 font-black text-[10px]">+ {w.categories.length - 2}</span>}
            </div>
            <div className="flex justify-between items-center pt-6 border-t border-slate-50">
              <span className="text-slate-400 text-xs font-black flex items-center gap-1.5"><MapPin size={14} className="text-emerald-500" /> {w.location.wilaya}</span>
              <div className="flex items-center gap-1.5 text-yellow-500 font-black text-lg bg-yellow-50 px-3 py-1 rounded-full"><Star size={18} fill="currentColor" /> {w.rating?.toFixed(1) || '0.0'}</div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// --- Auth & Profile Modals (Unchanged logic, just ensure consistency) ---

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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-6 animate-in">
      <div className="bg-white w-full max-w-2xl rounded-t-[3rem] md:rounded-[4rem] p-8 md:p-14 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-8 left-8 text-slate-300 hover:text-red-500 transition-colors p-2"><X size={32} /></button>
        <h2 className="text-3xl md:text-4xl font-black mb-10 border-r-8 border-emerald-500 pr-5">نشر طلب جديد ⚒️</h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="font-black text-sm text-slate-700 mr-2 uppercase tracking-wide">ماذا تحتاج؟ (عنوان الطلب)</label>
            <input required placeholder="مثال: إصلاح تسرب مياه في المطبخ" className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-4 ring-emerald-50 transition-all text-lg" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="font-black text-sm text-slate-700 mr-2 uppercase tracking-wide">نوع الحرفة</label>
              <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-4 ring-emerald-50 transition-all cursor-pointer" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="font-black text-sm text-slate-700 mr-2 uppercase tracking-wide">الولاية</label>
              <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-4 ring-emerald-50 transition-all cursor-pointer" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-black text-sm text-slate-700 mr-2 uppercase tracking-wide">الميزانية المقترحة (دج)</label>
            <div className="relative">
              <input type="number" placeholder="أدخل مبلغ تقريبي أو اتركه فارغاً" className="w-full p-5 pl-14 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-4 ring-emerald-50 transition-all" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">DA</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-black text-sm text-slate-700 mr-2 uppercase tracking-wide">وصف المشكلة بالتفصيل</label>
            <textarea required placeholder="اشرح لنا ما الذي يجب فعله ليتمكن الحرفي من تقديم عرض دقيق..." className="w-full p-6 bg-slate-50 rounded-2xl font-bold h-40 border-none outline-none focus:ring-4 ring-emerald-50 transition-all text-lg leading-relaxed" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <button disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-emerald-500 active:scale-95 transition-all shadow-emerald-900/20">
            {loading ? <div className="flex items-center justify-center gap-3"><div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> جاري النشر...</div> : 'انشر المهمة الآن ✅'}
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'portfolio') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'avatar') setFormData(prev => ({ ...prev, avatar: base64 }));
      else {
        if (formData.portfolio.length >= 10) { alert('الحد الأقصى 10 صور'); return; }
        setFormData(prev => ({ ...prev, portfolio: [...prev.portfolio, base64] }));
      }
    };
    reader.readAsDataURL(files[0]);
  };

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
        avatar: formData.avatar,
        categories: formData.categories,
        wilaya: formData.wilaya,
        portfolio: formData.portfolio,
      }).eq('id', user.id).select().single();
      
      if (error) throw error;
      onSave({ ...user, ...formData });
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in">
      <div className="bg-white p-8 md:p-14 rounded-[4rem] shadow-2xl border border-slate-100">
        <h2 className="text-3xl font-black mb-12 text-slate-900 border-r-8 border-emerald-500 pr-5 tracking-tight">إعدادات الحساب ⚙️</h2>
        <form onSubmit={submit} className="space-y-12">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.firstName}`} className="w-44 h-44 rounded-[3.5rem] object-cover border-8 border-emerald-50 shadow-2xl bg-slate-50 transition-all group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 rounded-[3.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={40} /></div>
              <div className="absolute bottom-4 right-4 bg-emerald-600 text-white p-2.5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform border-4 border-white"><UploadCloud size={24} /></div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">تغيير الصورة الشخصية</p>
            <input type="file" hidden ref={avatarInputRef} accept="image/*" onChange={e => handleImageUpload(e, 'avatar')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="font-black text-sm text-slate-700 mr-2 uppercase tracking-wide">الاسم الأول</label>
              <input required className="w-full p-5 bg-slate-50 rounded-[2rem] font-bold border-none focus:ring-4 ring-emerald-50 transition-all text-lg" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-3">
              <label className="font-black text-sm text-slate-700 mr-2 uppercase tracking-wide">اللقب</label>
              <input required className="w-full p-5 bg-slate-50 rounded-[2rem] font-bold border-none focus:ring-4 ring-emerald-50 transition-all text-lg" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-black text-sm text-slate-700 mr-2 uppercase tracking-wide">نبذة تعريفية عنك</label>
            <textarea className="w-full p-6 bg-slate-50 rounded-[2.5rem] font-bold h-44 border-none focus:ring-4 ring-emerald-50 transition-all text-lg leading-relaxed" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="اكتب للزبائن عن خبرتك وخدماتك..." />
          </div>

          {/* Portfolio Management */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <label className="block font-black text-xl text-slate-900">معرض أعمالك 📸</label>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">{formData.portfolio.length} / 10 صور</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {formData.portfolio.map((img: string, idx: number) => (
                <div key={idx} className="relative aspect-square rounded-[2rem] overflow-hidden group border-4 border-slate-50 shadow-md">
                  <img src={img} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button type="button" onClick={() => setFormData(prev => ({...prev, portfolio: prev.portfolio.filter((_, i) => i !== idx)}))} className="bg-red-500 text-white p-3 rounded-2xl shadow-xl hover:bg-red-600 active:scale-90 transition-all"><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
              
              {formData.portfolio.length < 10 && (
                <div 
                  onClick={() => portfolioInputRef.current?.click()} 
                  className="aspect-square bg-emerald-50/50 rounded-[2.5rem] border-4 border-dashed border-emerald-100 flex flex-col items-center justify-center text-emerald-600 cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
                >
                  <div className="p-4 bg-white rounded-2xl shadow-md mb-3 group-hover:scale-110 transition-transform"><Plus size={32} /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">إضافة صورة</span>
                  <input type="file" hidden ref={portfolioInputRef} accept="image/*" onChange={e => handleImageUpload(e, 'portfolio')} />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-10">
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-emerald-500 active:scale-95 transition-all shadow-emerald-900/20">
              {loading ? <div className="flex items-center justify-center gap-3"><div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> جاري الحفظ...</div> : 'حفظ التغييرات ✅'}
            </button>
            <button type="button" onClick={onCancel} className="w-full bg-slate-100 text-slate-600 py-6 rounded-[2.5rem] font-black text-2xl active:scale-95 transition-all">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Admin Panel ---

const AdminPanelView = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('users').select('*').eq('verification_status', 'pending');
    if (!error) setPendingUsers((data || []).map(d => ({
      id: d.id, firstName: d.first_name, lastName: d.last_name, phone: d.phone, role: d.role,
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
      alert(status === 'verified' ? 'تم تفعيل الحساب بنجاح ✅' : 'تم رفض الطلب ❌');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-in">
      <h2 className="text-4xl font-black mb-10 tracking-tight">مراجعة التوثيقات <span className="text-emerald-500">ADMIN</span></h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 overflow-y-auto max-h-[75vh]">
          <h3 className="font-black text-slate-400 mb-6 uppercase text-xs tracking-[0.2em]">طلبات الانتظار ({pendingUsers.length})</h3>
          {pendingUsers.length === 0 ? <p className="text-center py-20 text-slate-300 font-bold">لا توجد طلبات جديدة</p> : pendingUsers.map(u => (
            <div key={u.id} onClick={() => setSelectedUser(u)} className={`p-5 rounded-2xl cursor-pointer mb-4 transition-all border-2 flex items-center gap-4 ${selectedUser?.id === u.id ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
               <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.firstName}`} className="w-12 h-12 rounded-xl object-cover" />
               <div className="text-right flex-1 truncate">
                  <p className="font-black text-slate-900 truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{u.location.wilaya}</p>
               </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-emerald-100">
              <div className="flex items-center gap-5 mb-10 border-b pb-8 border-slate-50">
                <img src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.firstName}`} className="w-20 h-20 rounded-2xl object-cover border-4 border-emerald-50 shadow-lg" />
                <div className="text-right">
                  <h3 className="text-2xl font-black text-slate-900">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <p className="text-slate-500 font-bold">{selectedUser.phone} | {selectedUser.location.wilaya}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-4">
                   <p className="font-black text-xs text-slate-400 uppercase tracking-widest mr-2">الهوية (أمام)</p>
                   <div className="rounded-[2.5rem] aspect-video border-4 border-slate-50 overflow-hidden bg-slate-900 flex items-center justify-center shadow-inner">
                     {selectedUser.idFront ? <img src={selectedUser.idFront} className="w-full h-full object-contain" /> : <ShieldAlert className="text-white/20" size={48} />}
                   </div>
                </div>
                <div className="space-y-4">
                   <p className="font-black text-xs text-slate-400 uppercase tracking-widest mr-2">الهوية (خلف)</p>
                   <div className="rounded-[2.5rem] aspect-video border-4 border-slate-50 overflow-hidden bg-slate-900 flex items-center justify-center shadow-inner">
                     {selectedUser.idBack ? <img src={selectedUser.idBack} className="w-full h-full object-contain" /> : <ShieldAlert className="text-white/20" size={48} />}
                   </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleAction(selectedUser.id, 'verified')} className="flex-1 bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xl transition-all shadow-xl shadow-emerald-900/20 active:scale-95">تفعيل الحساب ✅</button>
                <button onClick={() => handleAction(selectedUser.id, 'rejected')} className="flex-1 bg-red-50 text-red-600 py-5 rounded-[2rem] font-black text-xl border-2 border-red-100 transition-all hover:bg-red-600 hover:text-white active:scale-95">رفض الطلب ❌</button>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-slate-100/50 rounded-[4rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 p-12 text-center">
              <ShieldQuestion size={100} strokeWidth={1} />
              <p className="mt-6 text-2xl font-black">يرجى اختيار حساب للمراجعة</p>
              <p className="text-sm font-bold mt-2">سيتم عرض مستندات الهوية هنا بعد الاختيار</p>
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
      alert("بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى");
    } else {
      const user = {
        ...data,
        firstName: data.first_name,
        lastName: data.last_name,
        location: { wilaya: data.wilaya, daira: data.daira || '' },
        categories: data.categories || [],
        portfolio: data.portfolio || [],
        verificationStatus: data.verification_status || 'none',
        createdAt: data.created_at
      };
      onSuccess(user);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 animate-in">
      <form onSubmit={login} className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl border w-full max-w-lg space-y-8 text-right relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16"></div>
        <h2 className="text-3xl md:text-5xl font-black mb-12 border-r-[12px] border-emerald-500 pr-6 tracking-tighter">مرحباً بك مجدداً 👋</h2>
        
        <div className="space-y-4">
          <label className="font-black text-slate-500 mr-2 text-sm uppercase tracking-widest">رقم الهاتف</label>
          <input required placeholder="مثال: 0550123456" className="w-full p-5 bg-slate-50 rounded-[2rem] border-none font-black text-xl outline-none focus:ring-4 ring-emerald-50 transition-all" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        
        <div className="space-y-4">
          <label className="font-black text-slate-500 mr-2 text-sm uppercase tracking-widest">كلمة المرور</label>
          <input required type="password" placeholder="••••••••" className="w-full p-5 bg-slate-50 rounded-[2rem] border-none font-black text-xl outline-none focus:ring-4 ring-emerald-50 transition-all" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        
        <button disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-xl shadow-emerald-900/20 hover:bg-emerald-500 active:scale-95 transition-all mt-10">
          {loading ? 'جاري الدخول...' : 'دخول إلى سلكني'}
        </button>
        
        <p className="text-center text-slate-400 font-bold text-sm">ليس لديك حساب بعد؟ <span className="text-emerald-600 cursor-pointer hover:underline" onClick={() => alert('التسجيل قيد التطوير')}>سجل كحرفي جديد</span></p>
      </form>
    </div>
  );
};
