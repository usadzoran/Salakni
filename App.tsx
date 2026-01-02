
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
  ArrowUpDown
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

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('users').select('*').eq('role', UserRole.WORKER);
      if (searchFilters.wilaya) query = query.eq('wilaya', searchFilters.wilaya);
      if (searchFilters.category) query = query.contains('categories', [searchFilters.category]);
      const { data, error } = await query;
      if (error) throw error;
      setState(prev => ({ ...prev, workers: (data || []).map(d => ({
        ...d, firstName: d.first_name, lastName: d.last_name, location: { wilaya: d.wilaya }, 
        rating: d.rating || 0, ratingCount: d.rating_count || 0, categories: d.categories || [], portfolio: d.portfolio || [],
        verificationStatus: d.verification_status || 'none'
      }))}));
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
            <button onClick={() => setView('search')} className={`font-bold ${state.view === 'search' ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-500'}`}>تصفح الحرفيين</button>
            <button onClick={() => setView('support')} className={`font-bold ${state.view === 'support' ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-500'}`}>سوق المهام</button>
            {state.currentUser?.role === UserRole.ADMIN && (
              <button onClick={() => setView('admin-panel')} className="font-black text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl"><ShieldCheck size={18} /> الإدارة</button>
            )}
            {state.currentUser ? (
              <div onClick={() => { setChatTarget(null); setView('profile'); }} className="flex items-center gap-3 cursor-pointer bg-slate-100 pl-4 pr-1 py-1 rounded-full border border-slate-200">
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
                <span className="font-black text-sm">{state.currentUser.firstName}</span>
              </div>
            ) : (
              <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold">دخول</button>
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
  <div className="relative min-h-[85vh] flex items-center justify-center text-center px-6">
    <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
    <div className="relative z-10 max-w-4xl animate-in">
      <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight">سَلّكني يسلكها <br className="md:hidden" /><span className="text-emerald-400">في الحين!</span></h1>
      <p className="text-base md:text-2xl text-slate-300 mb-10 font-medium">أفضل الحرفيين في الجزائر بانتظارك. تواصل مباشر، أمان، وجدارة.</p>
      <button onClick={onSearch} className="bg-emerald-600 text-white px-10 py-4.5 rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-500 transition-all">ابدأ البحث 🔍</button>
    </div>
  </div>
);

const TasksMarketView = ({ tasks, loading, filters, onFilterChange, currentUser, onTaskCreated }: any) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 animate-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">سوق المهام 🛒</h2>
          <p className="text-slate-500 font-bold">تصفح طلبات الزبائن أو أضف مهمة جديدة.</p>
        </div>
        <button 
          onClick={() => currentUser ? setShowCreateModal(true) : alert('يجب تسجيل الدخول لنشر مهمة')}
          className="w-full md:w-auto bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Plus size={24} /> انشر مهمة جديدة
        </button>
      </div>

      {/* Filters & Sorting */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <select 
            className="p-3 bg-slate-50 rounded-xl font-bold border-none text-sm min-w-[120px]"
            value={filters.wilaya}
            onChange={e => onFilterChange({...filters, wilaya: e.target.value})}
          >
            <option value="">كل الجزائر 🇩🇿</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select 
            className="p-3 bg-slate-50 rounded-xl font-bold border-none text-sm min-w-[140px]"
            value={filters.category}
            onChange={e => onFilterChange({...filters, category: e.target.value})}
          >
            <option value="">كل التخصصات ⚒️</option>
            {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <ArrowUpDown size={18} className="text-slate-400" />
          <select 
            className="flex-1 p-3 bg-slate-50 rounded-xl font-bold border-none text-sm"
            value={filters.sortBy}
            onChange={e => onFilterChange({...filters, sortBy: e.target.value})}
          >
            <option value="newest">الأحدث أولاً</option>
            <option value="budget_desc">الميزانية: الأعلى أولاً</option>
            <option value="budget_asc">الميزانية: الأقل أولاً</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="py-20 flex justify-center"><div className="loading-spinner"></div></div>
      ) : tasks.length === 0 ? (
        <div className="bg-white py-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
          <ClipboardList size={64} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-black text-xl">لا توجد مهام منشورة حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task: Task) => (
            <div key={task.id} className="bg-white p-6 rounded-[2.5rem] shadow-md border border-slate-100 hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">{task.category}</span>
                <span className="text-emerald-600 font-black text-lg">
                  {task.budget > 0 ? `${task.budget} دج` : 'سعر مفتوح'}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 line-clamp-2 leading-tight">{task.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">{task.description}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <MapPin size={14} className="text-emerald-500" /> {task.wilaya}
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <Clock size={14} className="text-emerald-500" /> {new Date(task.created_at).toLocaleDateString('ar-DZ')}
                </div>
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <img src={task.seeker_avatar || `https://ui-avatars.com/api/?name=${task.seeker_name}`} className="w-8 h-8 rounded-full object-cover" />
                  <span className="text-xs font-black text-slate-600 truncate max-w-[100px]">{task.seeker_name}</span>
                </div>
                <button className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black hover:bg-emerald-600 transition-colors active:scale-95">تقديم عرض</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-6 animate-in">
      <div className="bg-white w-full max-w-2xl rounded-t-[3rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 left-6 text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
        <h2 className="text-2xl md:text-3xl font-black mb-8 border-r-8 border-emerald-500 pr-4">انشر مهمة جديدة 📝</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="font-black text-sm text-slate-700">عنوان المهمة (باختصار)</label>
            <input required placeholder="مثال: تركيب مكيف هواء LG" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-4 ring-emerald-50" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-black text-sm text-slate-700">نوع الخدمة</label>
              <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-4 ring-emerald-50" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-black text-sm text-slate-700">الولاية</label>
              <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-4 ring-emerald-50" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-black text-sm text-slate-700">الميزانية المتوقعة (اختياري)</label>
            <div className="relative">
              <input type="number" placeholder="مثال: 5000" className="w-full p-4 pl-12 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-4 ring-emerald-50" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">دج</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-black text-sm text-slate-700">تفاصيل المهمة</label>
            <textarea required placeholder="اشرح بالتفصيل ما الذي تحتاجه..." className="w-full p-5 bg-slate-50 rounded-2xl font-bold h-32 border-none outline-none focus:ring-4 ring-emerald-50" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <button disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-emerald-500 active:scale-95 transition-all">
            {loading ? 'جاري النشر...' : 'انشر المهمة الآن ✅'}
          </button>
        </form>
      </div>
    </div>
  );
};

const SearchWorkersView = ({ workers, loading, filters, onFilterChange, onProfile }: any) => (
  <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 animate-in">
    <div className="bg-white p-4 md:p-8 rounded-[2.5rem] shadow-lg border border-slate-100 mb-12 flex flex-col md:flex-row gap-4">
      <input placeholder="ابحث عن حرفي بالاسم..." className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold border-none" value={filters.query} onChange={e => onFilterChange({...filters, query: e.target.value})} />
      <select className="p-4 bg-slate-50 rounded-2xl font-bold border-none" value={filters.wilaya} onChange={e => onFilterChange({...filters, wilaya: e.target.value})}>
        <option value="">كل الجزائر 🇩🇿</option>
        {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
      </select>
      <select className="p-4 bg-slate-50 rounded-2xl font-bold border-none" value={filters.category} onChange={e => onFilterChange({...filters, category: e.target.value})}>
        <option value="">كل التخصصات ⚒️</option>
        {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {loading ? <div className="col-span-full py-20 flex justify-center"><div className="loading-spinner"></div></div> : workers.map((w: any) => (
        <div key={w.id} onClick={() => onProfile(w)} className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 cursor-pointer hover:-translate-y-2 transition-all">
          <div className="flex items-center gap-4 mb-6">
            <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-16 h-16 rounded-2xl object-cover" />
            <div className="text-right flex-1">
              <h3 className="text-xl font-black">{w.firstName} {w.lastName}</h3>
              <VerificationBadge status={w.verificationStatus} size="sm" />
            </div>
          </div>
          <p className="text-slate-500 text-sm line-clamp-2 h-10 mb-6">{w.bio || 'حرفي مسجل في سلكني.'}</p>
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-slate-400 text-xs font-bold">📍 {w.wilaya}</span>
            <div className="flex items-center gap-1 text-yellow-500 font-black"><Star size={14} fill="currentColor" /> {w.rating?.toFixed(1) || '0.0'}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProfileView = ({ user, isOwn, onEdit, onLogout, onBack }: any) => (
  <div className="max-w-5xl mx-auto py-8 md:py-16 px-6 animate-in">
    {!isOwn && <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-emerald-600 transition-colors"><ChevronLeft size={20} /> العودة</button>}
    
    <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 relative">
      <div className="h-48 bg-gradient-to-r from-emerald-600 to-teal-400"></div>
      <div className="px-6 md:px-12 pb-12 relative -mt-24">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-10">
          <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&background=10b981&color=fff`} className="w-44 h-44 rounded-[2.5rem] border-8 border-white shadow-xl object-cover bg-white" />
          <div className="text-center md:text-right flex-1">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">{user.firstName} {user.lastName}</h2>
              {user.role === UserRole.WORKER && <VerificationBadge status={user.verificationStatus} />}
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
              {user.role === UserRole.WORKER ? (
                user.categories?.map((c: string) => <span key={c} className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-black border border-emerald-100">{c}</span>)
              ) : <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-black border border-blue-100">زبون مميز</span>}
              <span className="text-slate-400 font-bold text-sm bg-slate-50 px-4 py-1.5 rounded-full">📍 {user.location.wilaya}</span>
            </div>
          </div>
          {isOwn && (
            <div className="flex gap-2">
              <button onClick={onEdit} className="p-3 bg-slate-100 rounded-2xl hover:bg-emerald-100 transition-colors shadow-sm"><Settings size={22} /></button>
              <button onClick={onLogout} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-colors shadow-sm"><LogOut size={22} /></button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl text-center">
              <p className="text-slate-400 font-bold mb-1">التقييم العام</p>
              <div className="text-4xl font-black text-yellow-500 flex items-center justify-center gap-2">
                <Star size={36} fill="currentColor" /> {user.rating?.toFixed(1) || '0.0'}
              </div>
              <p className="text-[10px] text-slate-400">من {user.ratingCount || 0} زبون</p>
            </div>
            <div className="bg-slate-900 text-white p-7 rounded-[2rem] shadow-xl">
              <h4 className="font-black mb-3 flex items-center gap-2"><Phone className="text-emerald-400" /> تواصل</h4>
              <p className="text-2xl font-mono text-center mb-6 tracking-widest">{user.phone}</p>
              <button className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-black transition-all">اتصال مباشر</button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-10">
            <div className="glass-card p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <h4 className="text-xl font-black mb-4 flex items-center gap-3"><Award className="text-emerald-500" /> عن الحرفي</h4>
              <p className="text-slate-600 leading-relaxed font-medium">{user.bio || 'لم يكتب هذا الحرفي نبذة بعد.'}</p>
            </div>

            {user.role === UserRole.WORKER && (
              <div>
                <h4 className="text-xl font-black mb-6 flex items-center gap-3"><ImageIcon className="text-emerald-500" /> معرض الأعمال</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {user.portfolio && user.portfolio.length > 0 ? user.portfolio.map((img: string, idx: number) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden shadow-md group relative border-2 border-white">
                      <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    </div>
                  )) : (
                    <div className="col-span-full py-16 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center text-slate-400 font-bold">لا توجد صور للأعمال</div>
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
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-slate-100">
        <h2 className="text-3xl font-black mb-10 text-slate-900 border-r-8 border-emerald-500 pr-4">إعدادات الحساب ⚙️</h2>
        <form onSubmit={submit} className="space-y-12">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.firstName}`} className="w-40 h-40 rounded-[2.5rem] object-cover border-4 border-emerald-50 shadow-xl bg-slate-50" />
              <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={32} /></div>
            </div>
            <input type="file" hidden ref={avatarInputRef} accept="image/*" onChange={e => handleImageUpload(e, 'avatar')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-black text-sm text-slate-700">الاسم الأول</label>
              <input required className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="font-black text-sm text-slate-700">اللقب</label>
              <input required className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-500 active:scale-95 transition-all">
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات ✅'}
            </button>
            <button type="button" onClick={onCancel} className="w-full bg-slate-100 text-slate-600 py-5 rounded-2xl font-black text-lg">إلغاء</button>
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
    <div className="max-w-6xl mx-auto py-12 px-6 animate-in">
      <h2 className="text-4xl font-black mb-8">مراجعة الحسابات</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100 overflow-y-auto max-h-[70vh]">
          {pendingUsers.length === 0 ? <p className="text-center py-10 text-slate-400 font-bold">لا توجد طلبات</p> : pendingUsers.map(u => (
            <div key={u.id} onClick={() => setSelectedUser(u)} className={`p-4 rounded-2xl cursor-pointer mb-4 ${selectedUser?.id === u.id ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <p className="font-black">{u.firstName} {u.lastName}</p>
              <p className="text-xs text-slate-400">{u.location.wilaya}</p>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2">
          {selectedUser && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-emerald-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <img src={selectedUser.idFront} className="rounded-xl aspect-video object-contain bg-slate-900" />
                <img src={selectedUser.idBack} className="rounded-xl aspect-video object-contain bg-slate-900" />
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleAction(selectedUser.id, 'verified')} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-black transition-all shadow-lg active:scale-95">تفعيل</button>
                <button onClick={() => handleAction(selectedUser.id, 'rejected')} className="flex-1 bg-red-50 text-red-600 py-4 rounded-xl font-black transition-all active:scale-95">رفض</button>
              </div>
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
    e.preventDefault(); setLoading(true);
    const { data, error } = await supabase.from('users').select('*').eq('phone', phone).eq('password', password).single();
    if (error) alert("بيانات الدخول غير صحيحة");
    else onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya }, categories: data.categories || [], portfolio: data.portfolio || [], verificationStatus: data.verification_status || 'none' });
    setLoading(false);
  };
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in">
      <form onSubmit={login} className="bg-white p-12 rounded-[3.5rem] shadow-2xl border w-full max-w-md space-y-6 text-right">
        <h2 className="text-3xl font-black mb-10 border-r-8 border-emerald-500 pr-4">تسجيل الدخول 👋</h2>
        <input required placeholder="رقم الهاتف" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black text-lg outline-none" value={phone} onChange={e => setPhone(e.target.value)} />
        <input required type="password" placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black text-lg outline-none" value={password} onChange={e => setPassword(e.target.value)} />
        <button disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-emerald-500 active:scale-95 transition-all">دخول</button>
      </form>
    </div>
  );
};
