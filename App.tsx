
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, VerificationStatus, Task, Message, Chat, Notification as AppNotification } from './types.ts';
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
  ChevronRight,
  Users,
  LayoutDashboard,
  BarChart3,
  AlertCircle,
  Send,
  Bell,
  MoreVertical,
  Circle,
  Heart,
  Target,
  Wrench,
  Filter
} from 'lucide-react';

// --- Global Components & Styles ---

const GlobalStyles = () => (
  <style>{`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .animate-in { animation: fadeIn 0.4s ease-out forwards; }
    .animate-slide { animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    .arabic-text { font-family: 'Tajawal', sans-serif; }
    .loading-spinner { border: 3px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 32px; height: 32px; animation: spin 0.8s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .profile-banner { background: linear-gradient(135deg, #065f46 0%, #0d9488 100%); position: relative; overflow: hidden; }
    .profile-banner::after { content: ''; position: absolute; inset: 0; background: url('https://www.transparenttextures.com/patterns/cubes.png'); opacity: 0.1; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .chat-bubble-me { border-radius: 1.5rem 0.2rem 1.5rem 1.5rem; background: #059669; color: white; }
    .chat-bubble-other { border-radius: 0.2rem 1.5rem 1.5rem 1.5rem; background: #f1f5f9; color: #1e293b; }
    .task-card { background: white; border-radius: 2.5rem; padding: 2rem; border: 1px solid #f1f5f9; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .task-card:hover { transform: translateY(-8px); border-color: #10b981; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.08); }
    .glass-input { background: rgba(248, 250, 252, 0.8); backdrop-blur: 8px; border: 1px solid #e2e8f0; border-radius: 1.5rem; padding: 1.25rem; font-weight: 700; width: 100%; transition: all 0.3s; }
    .glass-input:focus { border-color: #10b981; outline: none; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); background: white; }
  `}</style>
);

// --- Main Application ---

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { currentUser: saved ? JSON.parse(saved) : null, workers: [], view: 'landing' };
  });
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [searchFilters, setSearchFilters] = useState({ query: '', wilaya: '', category: '' });
  const [chatTarget, setChatTarget] = useState<User | null>(null);

  const s = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    return String(val);
  };

  const setView = (view: AppState['view']) => {
    setState(prev => ({ ...prev, view }));
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    if (!state.currentUser) return;
    const notificationChannel = supabase
      .channel(`user-notifications-${state.currentUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${state.currentUser.id}` }, (payload) => {
        setNotifications(prev => [payload.new as AppNotification, ...prev]);
        setUnreadNotificationsCount(prev => prev + 1);
      }).subscribe();

    const fetchNotifications = async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', state.currentUser!.id).order('created_at', { ascending: false }).limit(20);
      if (data) {
        setNotifications(data);
        setUnreadNotificationsCount(data.filter(n => !n.is_read).length);
      }
    };
    fetchNotifications();
    return () => { notificationChannel.unsubscribe(); };
  }, [state.currentUser?.id]);

  const updateCurrentUser = (u: User | null) => {
    setState(prev => ({ ...prev, currentUser: u }));
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user');
  };

  const startChatWithUser = async (targetUser: any) => {
    if (!state.currentUser) return setView('login');
    setLoading(true);
    try {
      const { data: existingChat } = await supabase
        .from('chats')
        .select('*')
        .or(`and(participant_1.eq.${state.currentUser.id},participant_2.eq.${targetUser.id}),and(participant_1.eq.${targetUser.id},participant_2.eq.${state.currentUser.id})`)
        .maybeSingle();

      if (existingChat) {
        setActiveChat({ ...existingChat, other_participant: targetUser });
      } else {
        const { data: newChat } = await supabase
          .from('chats')
          .insert([{ participant_1: state.currentUser.id, participant_2: targetUser.id }])
          .select().single();
        if (newChat) setActiveChat({ ...newChat, other_participant: targetUser });
      }
      setView('chats');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-24 md:pb-0" dir="rtl">
      <GlobalStyles />
      
      <nav className="sticky top-0 z-50 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} size="md" />
          <div className="hidden md:flex items-center gap-8">
            <NavButton active={state.view === 'search'} onClick={() => setView('search')}>تصفح الحرفيين</NavButton>
            <NavButton active={state.view === 'support'} onClick={() => setView('support')}>سوق المهام</NavButton>
            <NavButton active={state.view === 'chats'} onClick={() => setView('chats')}>المحادثات</NavButton>
          </div>
          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div className="flex items-center gap-4">
                <button className="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                  <Bell size={24} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>
                <div onClick={() => { setChatTarget(null); setView('profile'); }} className="flex items-center gap-3 cursor-pointer p-1 pr-4 bg-slate-100 rounded-full border border-slate-200 hover:border-emerald-200 transition-all">
                  <span className="font-black text-xs hidden sm:block">{s(state.currentUser.firstName)}</span>
                  <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setView('login')} className="hidden sm:block text-slate-500 font-black px-4 py-2 hover:text-emerald-600 transition-colors">دخول</button>
                <button onClick={() => setView('register')} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-xl shadow-emerald-600/20 transition-all">ابدأ الآن</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onStart={() => setView('search')} onRegister={() => setView('register')} />}
        {state.view === 'search' && <SearchWorkersView onProfile={(w: User) => { setChatTarget(w); setView('profile'); }} filters={searchFilters} onFilterChange={setSearchFilters} safe={s} />}
        {state.view === 'support' && <TasksMarketView currentUser={state.currentUser} safe={s} onContact={startChatWithUser} setView={setView} />}
        {state.view === 'profile' && (state.currentUser || chatTarget) && (
          <ProfileView 
            user={chatTarget || state.currentUser!} 
            isOwn={!chatTarget || chatTarget?.id === state.currentUser?.id} 
            onEdit={() => setView('edit-profile')} 
            onLogout={() => { updateCurrentUser(null); setView('landing'); }} 
            onBack={() => { setChatTarget(null); setView('search'); }} 
            onChat={startChatWithUser}
            onDataUpdate={(u: User) => { if (chatTarget) setChatTarget(u); if (state.currentUser?.id === u.id) updateCurrentUser(u); }}
            safe={s} 
          />
        )}
        {state.view === 'edit-profile' && state.currentUser && <EditProfileView user={state.currentUser} onSave={(u: User) => { updateCurrentUser(u); setView('profile'); }} onCancel={() => setView('profile')} />}
        {state.view === 'chats' && state.currentUser && <ChatsView currentUser={state.currentUser} activeChat={activeChat} setActiveChat={setActiveChat} safe={s} />}
        {state.view === 'login' && <AuthForm type="login" onSuccess={(u: User) => { updateCurrentUser(u); setView('profile'); }} onSwitch={() => setView('register')} safe={s} />}
        {state.view === 'register' && <AuthForm type="register" onSuccess={(u: User) => { updateCurrentUser(u); setView('profile'); }} onSwitch={() => setView('login')} safe={s} />}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around md:hidden z-50 px-2 rounded-t-[2rem] shadow-2xl">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={Search} label="الحرفيين" active={state.view === 'search'} onClick={() => setView('search')} />
        <TabItem icon={ClipboardList} label="المهام" active={state.view === 'support'} onClick={() => setView('support')} />
        <TabItem icon={MessageSquare} label="المحادثات" active={state.view === 'chats'} onClick={() => setView('chats')} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile' || state.view === 'login'} onClick={() => state.currentUser ? setView('profile') : setView('login')} />
      </div>
    </div>
  );
}

// --- Sub-Views (Tasks Market) ---

const TasksMarketView = ({ currentUser, safe, onContact, setView }: any) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({ wilaya: '', category: '' });

  const fetchTasks = async () => {
    setLoading(true);
    let query = supabase.from('tasks').select(`*, users!seeker_id(id, first_name, last_name, avatar, phone)`).order('created_at', { ascending: false });
    if (filters.wilaya) query = query.eq('wilaya', filters.wilaya);
    if (filters.category) query = query.eq('category', filters.category);
    
    const { data } = await query;
    if (data) {
      setTasks(data.map((t: any) => ({
        ...t,
        seeker_name: `${t.users.first_name} ${t.users.last_name}`,
        seeker_avatar: t.users.avatar,
        seeker_phone: t.users.phone
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-in">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
        <div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tighter">سوق المهام <span className="text-emerald-500">DZ</span></h2>
          <p className="text-slate-500 font-bold text-lg">تصفح احتياجات الزبائن في ولايتك وقدم عروضك مباشرة.</p>
        </div>
        <button 
          onClick={() => currentUser ? setShowCreateModal(true) : setView('login')}
          className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center gap-3"
        >
          <Plus size={24} /> انشر مهمة جديدة
        </button>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-xl border border-slate-100 mb-12 flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex items-center gap-3">
          <Filter className="text-emerald-500" size={24} />
          <span className="font-black text-slate-400">تصفية حسب:</span>
        </div>
        <select 
          className="p-5 bg-slate-50 rounded-2xl border-none font-black text-sm cursor-pointer focus:ring-4 ring-emerald-50"
          value={filters.wilaya}
          onChange={e => setFilters({...filters, wilaya: e.target.value})}
        >
          <option value="">كل الولايات</option>
          {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <select 
          className="p-5 bg-slate-50 rounded-2xl border-none font-black text-sm cursor-pointer focus:ring-4 ring-emerald-50"
          value={filters.category}
          onChange={e => setFilters({...filters, category: e.target.value})}
        >
          <option value="">كل التصنيفات</option>
          {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-full py-40 flex justify-center"><div className="loading-spinner"></div></div>
        ) : tasks.length > 0 ? tasks.map(task => (
          <div key={task.id} className="task-card flex flex-col h-full relative group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-wrap gap-2">
                <span className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">{safe(task.category)}</span>
                <span className="bg-slate-50 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black border border-slate-100">{safe(task.wilaya)}</span>
              </div>
              <div className="text-emerald-600 font-black text-2xl tracking-tighter">{task.budget > 0 ? `${task.budget} دج` : 'سعر مفتوح'}</div>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-4 leading-tight">{safe(task.title)}</h3>
            <p className="text-slate-500 font-medium text-lg leading-relaxed line-clamp-3 mb-8 flex-1">{safe(task.description)}</p>
            
            <div className="flex items-center justify-between pt-8 border-t border-slate-50">
              <div className="flex items-center gap-4">
                <img src={task.seeker_avatar || `https://ui-avatars.com/api/?name=${task.seeker_name}`} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm" />
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900">{safe(task.seeker_name)}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{new Date(task.created_at).toLocaleDateString('ar-DZ')}</span>
                </div>
              </div>
              <button 
                onClick={() => onContact({ id: task.seeker_id, firstName: task.seeker_name, avatar: task.seeker_avatar })}
                className="bg-slate-950 text-white px-8 py-4 rounded-[1.5rem] font-black text-sm shadow-xl shadow-slate-900/10 active:scale-95 hover:bg-emerald-600 transition-all flex items-center gap-2"
              >
                <MessageSquare size={18} /> تواصل للعمل
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-32 bg-white rounded-[4rem] border-4 border-dashed border-slate-100 text-center flex flex-col items-center justify-center">
            <ClipboardList size={80} className="text-slate-200 mb-6" />
            <p className="text-slate-400 font-black text-2xl">لا توجد مهام منشورة في هذا التصنيف حالياً</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <PostTaskModal 
          onClose={() => setShowCreateModal(false)} 
          currentUser={currentUser} 
          onSuccess={() => { setShowCreateModal(false); fetchTasks(); }}
        />
      )}
    </div>
  );
};

const PostTaskModal = ({ onClose, currentUser, onSuccess }: any) => {
  const [formData, setFormData] = useState({ title: '', description: '', category: SERVICE_CATEGORIES[0].name, wilaya: currentUser?.location?.wilaya || WILAYAS[0], budget: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('tasks').insert([{
        seeker_id: currentUser.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        wilaya: formData.wilaya,
        budget: parseInt(formData.budget) || 0,
        status: 'open'
      }]);
      if (error) throw error;
      onSuccess();
    } catch (err: any) { alert(err.message); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in">
      <div className="bg-white w-full max-w-3xl rounded-[4rem] shadow-2xl overflow-hidden animate-slide">
        <div className="p-8 md:p-12 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-3xl font-black text-slate-900">نشر مهمة جديدة 📝</h2>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={28}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">عنوان المهمة</label>
            <input required placeholder="مثال: أحتاج سباك لتصليح تسرب في المطبخ" className="glass-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">التصنيف</label>
              <select className="glass-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الولاية</label>
              <select className="glass-input" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الميزانية المتوقعة (دج)</label>
            <input type="number" placeholder="مثال: 5000" className="glass-input" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
            <p className="text-[10px] text-slate-400 mr-2 italic">اترك الحقل فارغاً إذا كنت تريد ترك السعر للمناقشة.</p>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">تفاصيل إضافية</label>
            <textarea required rows={4} className="glass-input resize-none" placeholder="اشرح بالتفصيل ما الذي تحتاجه بالضبط..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <button 
            disabled={submitting}
            className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all mt-8"
          >
            {submitting ? 'جاري النشر...' : 'انشر المهمة الآن 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Other Shared Components ---

const LandingView = ({ onStart, onRegister }: any) => (
  <div className="relative min-h-[90vh] flex items-center justify-center text-center px-6 overflow-hidden">
    <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
    <div className="relative z-10 max-w-5xl animate-in">
      <div className="inline-block bg-emerald-500/20 text-emerald-400 px-6 py-2 rounded-full border border-emerald-500/30 text-xs font-black uppercase tracking-widest mb-10">المنصة الأولى للخدمات في الجزائر</div>
      <h1 className="text-5xl md:text-8xl font-black text-white mb-8 leading-tight tracking-tighter">ريح بالك، <br className="sm:hidden"/><span className="text-emerald-400 italic">سَلّكني</span> يسلكها!</h1>
      <p className="text-xl md:text-3xl text-slate-300 mb-14 font-medium max-w-3xl mx-auto px-4">اطلب أي خدمة منزلية أو مهنية بلمسة زر. أفضل الحرفيين المهرة في الجزائر جاهزون لخدمتك.</p>
      <div className="flex flex-col sm:flex-row gap-8 justify-center">
        <button onClick={onStart} className="bg-emerald-600 text-white px-16 py-6 rounded-[3rem] font-black text-2xl shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 transition-all">ابحث عن حرفي 🔍</button>
        <button onClick={onRegister} className="bg-white/10 backdrop-blur-md text-white px-16 py-6 rounded-[3rem] font-black text-2xl border border-white/20 hover:bg-white/20 transition-all">سجل كحرفي ⚒️</button>
      </div>
    </div>
  </div>
);

const SearchWorkersView = ({ onProfile, filters, onFilterChange, safe }: any) => {
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      let query = supabase.from('users').select('*').eq('role', UserRole.WORKER);
      if (filters.wilaya) query = query.eq('wilaya', filters.wilaya);
      if (filters.category) query = query.contains('categories', [filters.category]);
      if (filters.query) query = query.or(`first_name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`);
      const { data } = await query;
      if (data) setWorkers(data.map(w => ({ ...w, firstName: w.first_name, lastName: w.last_name, location: { wilaya: w.wilaya, daira: w.daira || '' } })));
      setLoading(false);
    };
    fetchWorkers();
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto py-16 px-6">
      <div className="bg-white p-10 md:p-16 rounded-[4rem] shadow-xl border border-slate-100 mb-16 animate-in">
        <h2 className="text-4xl font-black mb-10 flex items-center gap-4 tracking-tighter"><Search className="text-emerald-600" size={36}/> ابحث عن الحرفي المثالي</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <input placeholder="مثال: ترصيص صحي، دهان..." className="glass-input" value={filters.query} onChange={e => onFilterChange({...filters, query: e.target.value})} />
          <select className="glass-input" value={filters.wilaya} onChange={e => onFilterChange({...filters, wilaya: e.target.value})}>
            <option value="">كل الولايات</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select className="glass-input" value={filters.category} onChange={e => onFilterChange({...filters, category: e.target.value})}>
            <option value="">كل التخصصات</option>
            {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? <div className="col-span-full py-40 flex justify-center"><div className="loading-spinner"></div></div> : workers.length > 0 ? workers.map(w => (
          <div key={w.id} onClick={() => onProfile(w)} className="bg-white p-10 rounded-[3.5rem] shadow-lg border border-slate-100 hover:-translate-y-3 transition-all cursor-pointer group">
            <div className="flex gap-6 items-center mb-8">
              <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-24 h-24 rounded-[2rem] object-cover shadow-xl group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-2xl font-black group-hover:text-emerald-600 transition-colors">{safe(w.firstName)} {safe(w.lastName)}</h3>
                <div className="flex items-center gap-2 mt-2"><Star size={16} className="text-yellow-500" fill="currentColor"/><span className="text-sm font-black text-slate-500">{w.rating?.toFixed(1) || '0.0'}</span></div>
              </div>
            </div>
            <p className="text-slate-500 font-medium text-lg line-clamp-3 mb-8">{safe(w.bio) || 'لا توجد نبذة تعريفية.'}</p>
            <div className="flex justify-between items-center border-t border-slate-50 pt-8">
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-full">{safe(w.location.wilaya)}</span>
              <button className="text-emerald-600 font-black text-base flex items-center gap-2">عرض الملف <ChevronRight size={20}/></button>
            </div>
          </div>
        )) : <div className="col-span-full py-32 text-center text-slate-400 font-black text-2xl">لا توجد نتائج مطابقة لبحثك</div>}
      </div>
    </div>
  );
};

const ProfileView = ({ user, isOwn, onEdit, onLogout, onBack, onChat, onDataUpdate, safe }: any) => {
  const isWorker = user.role === UserRole.WORKER;
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePortfolioUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const currentPortfolio = Array.isArray(user.portfolio) ? user.portfolio : [];
      const updatedPortfolio = [...currentPortfolio, base64].slice(0, 10);
      const { error } = await supabase.from('users').update({ portfolio: updatedPortfolio }).eq('id', user.id);
      if (!error) onDataUpdate({ ...user, portfolio: updatedPortfolio });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-in">
      <div className="mb-10 flex justify-between items-center">
        {!isOwn ? (
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold bg-white px-8 py-4 rounded-[1.5rem] border border-slate-100 shadow-sm transition-all hover:bg-slate-50"><ChevronLeft size={20} /> العودة للبحث</button>
        ) : <div className="text-emerald-600 font-black text-base flex items-center gap-3 bg-emerald-50 px-6 py-3 rounded-[1.5rem] border border-emerald-100"><UserIcon size={20} /> ملفي الشخصي</div>}
        <div className="flex gap-4">{isOwn && (<><button onClick={onEdit} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-600 shadow-sm hover:bg-slate-50 transition-all"><Settings size={24}/></button><button onClick={onLogout} className="p-4 bg-red-50 text-red-500 border border-red-100 rounded-2xl shadow-sm hover:bg-red-500 hover:text-white transition-all"><LogOut size={24}/></button></>)}</div>
      </div>
      <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 relative">
        <div className="profile-banner h-64 md:h-80"></div>
        <div className="px-6 md:px-16 pb-16 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-12 -mt-32 md:-mt-44 mb-16">
            <div className="relative group">
              <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}`} className="w-64 h-64 md:w-80 md:h-80 rounded-[4rem] border-[15px] border-white shadow-2xl object-cover bg-slate-50 transition-transform group-hover:scale-[1.02]" />
              {isWorker && user.verificationStatus === 'verified' && (<div className="absolute bottom-8 right-8 bg-emerald-500 text-white p-3 rounded-2xl border-4 border-white shadow-2xl"><CheckCircle2 size={32}/></div>)}
            </div>
            <div className="flex-1 text-center md:text-right pb-6">
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-6 mb-6">
                <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">{safe(user.firstName)} {safe(user.lastName)}</h2>
                <VerificationBadge status={user.verificationStatus} />
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                {isWorker ? (user.categories || []).map((c: string) => (<span key={c} className="bg-emerald-50 text-emerald-700 px-8 py-3 rounded-full text-sm font-black border border-emerald-100">{safe(c)}</span>)) : <span className="bg-blue-50 text-blue-700 px-8 py-3 rounded-full text-sm font-black border border-blue-100">زبون سلكني</span>}
                <span className="flex items-center gap-2 text-slate-400 font-bold text-sm bg-slate-50 px-8 py-3 rounded-full border border-slate-200"><MapPin size={20} className="text-emerald-500" /> {safe(user.location.wilaya)}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-1 space-y-10">
              {isWorker && (<div className="grid grid-cols-2 gap-6"><div className="task-card flex flex-col items-center p-8 text-center"><Star size={24} className="text-yellow-500 mb-2" fill="currentColor"/><span className="text-3xl font-black">{user.rating?.toFixed(1) || '0.0'}</span><span className="text-[10px] text-slate-400 font-bold uppercase">التقييم</span></div><div className="task-card flex flex-col items-center p-8 text-center"><Briefcase size={24} className="text-emerald-500 mb-2"/><span className="text-3xl font-black">{user.completedJobs || '0'}</span><span className="text-[10px] text-slate-400 font-bold uppercase">مهام</span></div></div>)}
              <div className="bg-slate-950 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-600/20 blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform"></div>
                <h4 className="font-black text-2xl mb-10 flex items-center gap-4">تواصل الآن <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div></h4>
                <div className="space-y-6">
                  {!isOwn && (<button onClick={() => onChat(user)} className="flex items-center justify-center gap-4 w-full bg-emerald-600 py-6 rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-emerald-500 active:scale-95 transition-all"><MessageSquare size={28} /> محادثة</button>)}
                  <a href={`tel:${user.phone}`} className="flex items-center justify-center gap-4 w-full bg-white/10 py-6 rounded-[2.5rem] font-black text-2xl border border-white/20 hover:bg-white/20 active:scale-95 transition-all"><Phone size={28} /> {safe(user.phone)}</a>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-16">
              <section><h4 className="text-4xl font-black text-slate-900 flex items-center gap-6 mb-10"><Award size={40} className="text-emerald-500"/> حول الحرفي</h4><div className="bg-slate-50 p-12 rounded-[4rem] border border-slate-100 leading-relaxed text-2xl font-medium text-slate-600 whitespace-pre-wrap">{safe(user.bio) || 'لم يقم بإضافة نبذة بعد.'}</div></section>
              {isWorker && (<section><div className="flex items-center justify-between mb-10"><h4 className="text-4xl font-black text-slate-900 flex items-center gap-6"><ImageIcon size={40} className="text-emerald-500"/> معرض الأعمال</h4>{isOwn && (<button onClick={() => portfolioInputRef.current?.click()} className="bg-emerald-600 text-white px-8 py-4 rounded-[1.5rem] font-black shadow-xl hover:bg-emerald-500 flex items-center gap-3">{uploading ? <div className="loading-spinner w-5 h-5 border-2"></div> : <Plus size={24}/>}أضف صورة</button>)}<input type="file" hidden ref={portfolioInputRef} accept="image/*" onChange={handlePortfolioUpload} /></div><div className="grid grid-cols-2 md:grid-cols-3 gap-8">{(user.portfolio || []).length > 0 ? user.portfolio.map((img: string, idx: number) => (<div key={idx} className="group relative aspect-square rounded-[3rem] overflow-hidden border-[8px] border-white shadow-xl hover:scale-105 transition-all"><img src={img} className="w-full h-full object-cover" />{isOwn && (<button onClick={async () => { const updated = user.portfolio.filter((_: any, i: number) => i !== idx); await supabase.from('users').update({ portfolio: updated }).eq('id', user.id); onDataUpdate({ ...user, portfolio: updated }); }} className="absolute top-6 left-6 p-4 bg-red-500 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={20}/></button>)}</div>)) : <div className="col-span-full py-32 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-100 text-center"><p className="text-slate-300 font-black text-2xl">لا توجد أعمال لعرضها</p></div>}</div></section>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditProfileView = ({ user, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({ firstName: user.firstName, lastName: user.lastName, bio: user.bio || '', avatar: user.avatar || '', wilaya: user.location.wilaya, categories: Array.isArray(user.categories) ? user.categories : [], skills: Array.isArray(user.skills) ? user.skills : [] });
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: any) => {
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
      const { error } = await supabase.from('users').update({ first_name: formData.firstName, last_name: formData.lastName, bio: formData.bio, avatar: formData.avatar, wilaya: formData.wilaya, categories: formData.categories }).eq('id', user.id);
      if (error) throw error;
      onSave({ ...user, firstName: formData.firstName, lastName: formData.lastName, bio: formData.bio, avatar: formData.avatar, categories: formData.categories, location: { ...user.location, wilaya: formData.wilaya } });
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-6 animate-in">
      <div className="bg-white p-12 md:p-20 rounded-[5rem] shadow-2xl border border-slate-100">
        <h2 className="text-4xl font-black mb-16 border-r-[15px] border-emerald-600 pr-8 tracking-tighter">إعدادات الحساب الشخصي</h2>
        <form onSubmit={submit} className="space-y-12">
          <div className="flex flex-col items-center gap-8"><div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}><img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.firstName}`} className="w-64 h-64 rounded-[4rem] object-cover border-[12px] border-emerald-50 shadow-2xl group-hover:scale-105 transition-all" /><div className="absolute inset-0 bg-slate-900/40 rounded-[4rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={48} /></div></div><input type="file" hidden ref={avatarInputRef} accept="image/*" onChange={handleAvatarUpload} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3"><label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الاسم الأول</label><input required className="glass-input" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
            <div className="space-y-3"><label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">اللقب</label><input required className="glass-input" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
          </div>
          <div className="space-y-3"><label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الولاية الحالية</label><select className="glass-input" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>{WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}</select></div>
          <div className="space-y-3"><label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">التخصصات</label><div className="flex flex-wrap gap-3 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">{SERVICE_CATEGORIES.map(cat => (<button key={cat.id} type="button" onClick={() => { const exists = formData.categories.includes(cat.name); const updated = exists ? formData.categories.filter(c => c !== cat.name) : [...formData.categories, cat.name]; setFormData({ ...formData, categories: updated.slice(0, 3) }); }} className={`px-6 py-3 rounded-2xl text-[10px] font-black transition-all ${formData.categories.includes(cat.name) ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400'}`}>{cat.name}</button>))}</div></div>
          <div className="space-y-3"><label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">نبذة عنك</label><textarea className="glass-input h-64 resize-none" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="اكتب تفاصيل خبرتك ومميزات خدماتك..." /></div>
          <div className="flex flex-col sm:flex-row gap-8 pt-10"><button disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-[3rem] font-black text-2xl shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all">{loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button><button type="button" onClick={onCancel} className="w-full bg-slate-100 text-slate-500 py-6 rounded-[3rem] font-black text-2xl active:scale-95 transition-all">إلغاء</button></div>
        </form>
      </div>
    </div>
  );
};

const ChatsView = ({ currentUser, activeChat, setActiveChat, safe }: any) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      const { data } = await supabase.from('chats').select(`*, participant_1_user:users!participant_1(*), participant_2_user:users!participant_2(*)`).or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`).order('updated_at', { ascending: false });
      if (data) {
        setChats(data.map(c => {
          const other = c.participant_1 === currentUser.id ? c.participant_2_user : c.participant_1_user;
          return { ...c, other_participant: { ...other, firstName: other.first_name, lastName: other.last_name } };
        }));
      }
      setLoading(false);
    };
    fetchChats();
  }, [currentUser.id]);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex bg-white my-8 rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden animate-in">
      <div className={`w-full md:w-96 border-l border-slate-50 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-10 border-b border-slate-50"><h2 className="text-3xl font-black">المحادثات</h2></div>
        <div className="flex-1 overflow-y-auto no-scrollbar">{chats.map(chat => (<div key={chat.id} onClick={() => setActiveChat(chat)} className={`p-8 flex items-center gap-5 cursor-pointer transition-all border-b border-slate-50 hover:bg-slate-50 ${activeChat?.id === chat.id ? 'bg-emerald-50 border-r-8 border-emerald-500' : ''}`}><img src={chat.other_participant?.avatar || `https://ui-avatars.com/api/?name=${chat.other_participant?.firstName}`} className="w-16 h-16 rounded-2xl object-cover" /><div className="flex-1 min-w-0"><div className="flex justify-between items-baseline mb-2"><h4 className="font-black text-lg text-slate-900 truncate">{safe(chat.other_participant?.firstName)}</h4><span className="text-[10px] text-slate-400">{new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><p className="text-xs text-slate-500 truncate">{chat.last_message || 'ابدأ المحادثة...'}</p></div></div>))}</div>
      </div>
      <div className={`flex-1 flex flex-col bg-slate-50/50 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>{activeChat ? <ChatRoom chat={activeChat} currentUser={currentUser} onBack={() => setActiveChat(null)} safe={safe} /> : <div className="flex-1 flex flex-col items-center justify-center text-slate-300"><MessageSquare size={100} className="mb-8 opacity-20" /><p className="font-black text-2xl">اختر محادثة للبدء</p></div>}</div>
    </div>
  );
};

const ChatRoom = ({ chat, currentUser, onBack, safe }: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('chat_id', chat.id).order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
    const channel = supabase.channel(`chat-${chat.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chat.id}` }, (payload) => { setMessages(prev => [...prev, payload.new as Message]); }).subscribe();
    return () => { channel.unsubscribe(); };
  }, [chat.id]);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const send = async () => {
    if (!content.trim()) return;
    const msg = { chat_id: chat.id, sender_id: currentUser.id, content: content.trim() };
    await supabase.from('messages').insert([msg]);
    await supabase.from('chats').update({ last_message: content.trim(), updated_at: new Date().toISOString() }).eq('id', chat.id);
    setContent('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between"><div className="flex items-center gap-6"><button onClick={onBack} className="md:hidden p-2 text-slate-400"><ChevronLeft size={32}/></button><img src={chat.other_participant?.avatar || `https://ui-avatars.com/api/?name=${chat.other_participant?.firstName}`} className="w-14 h-14 rounded-2xl object-cover" /><div><h4 className="font-black text-xl text-slate-900">{safe(chat.other_participant?.firstName)}</h4><span className="text-xs text-emerald-500 font-bold flex items-center gap-1.5"><Circle size={10} fill="currentColor"/> متصل الآن</span></div></div><button className="p-4 text-slate-400 hover:text-emerald-600 transition-colors"><MoreVertical size={24}/></button></div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/50 no-scrollbar">{messages.map(m => (<div key={m.id} className={`flex ${m.sender_id === currentUser.id ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[75%] p-6 text-base font-medium shadow-sm ${m.sender_id === currentUser.id ? 'chat-bubble-me' : 'chat-bubble-other'}`}>{m.content}<div className={`text-[9px] mt-3 font-bold ${m.sender_id === currentUser.id ? 'text-emerald-100 text-left' : 'text-slate-400 text-right'}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div></div>))}</div>
      <div className="p-8 bg-white border-t border-slate-50"><div className="flex gap-4 max-w-5xl mx-auto"><input placeholder="اكتب رسالتك..." className="flex-1 bg-slate-50 px-8 py-5 rounded-[2rem] outline-none font-bold text-lg border border-slate-100 focus:bg-white focus:border-emerald-200 transition-all" value={content} onChange={e => setContent(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()} /><button onClick={send} className="bg-emerald-600 text-white p-5 rounded-[2rem] shadow-xl hover:bg-emerald-500 transition-all active:scale-95"><Send size={28}/></button></div></div>
    </div>
  );
};

const AuthForm = ({ type, onSuccess, onSwitch, safe }: any) => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', password: '', role: UserRole.SEEKER as UserRole, wilaya: WILAYAS[0] });
  const [loading, setLoading] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'login') {
        const { data, error } = await supabase.from('users').select('*').eq('phone', formData.phone).eq('password', formData.password).maybeSingle();
        if (error || !data) throw new Error('بيانات الدخول غير صحيحة');
        onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: '' } });
      } else {
        const { data: existing } = await supabase.from('users').select('id').eq('phone', formData.phone).maybeSingle();
        if (existing) throw new Error('رقم الهاتف مسجل مسبقاً');
        const { data, error } = await supabase.from('users').insert([{ first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone, password: formData.password, role: formData.role, wilaya: formData.wilaya, categories: [], skills: [], portfolio: [], verification_status: 'none' }]).select().single();
        if (error) throw error;
        onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: '' } });
      }
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto py-20 px-6 animate-in">
      <div className="bg-white p-12 md:p-20 rounded-[5rem] shadow-2xl border border-slate-100 text-center">
        <Logo size="lg" />
        <h2 className="text-4xl font-black mt-12 mb-4 tracking-tighter">{type === 'login' ? 'مرحباً بعودتك' : 'انضم إلى سلكني'}</h2>
        <p className="text-slate-400 font-bold mb-16">{type === 'login' ? 'سجل دخولك لمتابعة أعمالك وطلباتك' : 'ابدأ رحلتك معنا اليوم كحرفي أو صاحب عمل'}</p>
        <form onSubmit={submit} className="space-y-6 text-right">
          {type === 'register' && (<div className="grid grid-cols-2 gap-4"><input required placeholder="الاسم" className="glass-input" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /><input required placeholder="اللقب" className="glass-input" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>)}
          <input required type="tel" placeholder="رقم الهاتف" className="glass-input text-xl tracking-widest" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input required type="password" placeholder="كلمة المرور" className="glass-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          {type === 'register' && (<><select className="glass-input" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>{WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}</select><div className="flex bg-slate-50 p-3 rounded-[2rem] border border-slate-100"><button type="button" onClick={() => setFormData({...formData, role: UserRole.SEEKER})} className={`flex-1 py-5 rounded-[1.5rem] font-black transition-all ${formData.role === UserRole.SEEKER ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}>أنا زبون</button><button type="button" onClick={() => setFormData({...formData, role: UserRole.WORKER})} className={`flex-1 py-5 rounded-[1.5rem] font-black transition-all ${formData.role === UserRole.WORKER ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}>أنا حرفي</button></div></>)}
          <button disabled={loading} className="w-full bg-emerald-600 text-white py-7 rounded-[3rem] font-black text-2xl shadow-2xl hover:bg-emerald-500 active:scale-95 transition-all mt-10">{loading ? <div className="loading-spinner w-8 h-8 border-white mx-auto"></div> : (type === 'login' ? 'دخول' : 'تسجيل')}</button>
        </form>
        <p className="mt-12 text-slate-500 font-bold">{type === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}<button onClick={onSwitch} className="text-emerald-600 font-black hover:underline">{type === 'login' ? 'أنشئ حساباً' : 'سجل دخولك'}</button></p>
      </div>
    </div>
  );
};

// --- Helper Components ---

const NavButton = ({ children, active, onClick }: any) => (
  <button onClick={onClick} className={`font-black text-sm transition-all px-2 py-1 relative ${active ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'}`}>{children}{active && <span className="absolute -bottom-2 left-0 right-0 h-1 bg-emerald-600 rounded-full animate-in"></span>}</button>
);

const TabItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 transition-all ${active ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}><div className={`p-2.5 rounded-2xl ${active ? 'bg-emerald-50' : ''}`}><Icon size={24} /></div><span className="text-[10px] font-black">{label}</span></button>
);

const VerificationBadge = ({ status }: any) => {
  if (status !== 'verified') return null;
  return (<div className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 font-black text-xs shadow-sm"><ShieldCheck size={18}/> موثق</div>);
};

const Logo = ({ onClick, size = 'md' }: any) => (
  <div onClick={onClick} className="flex items-center gap-3 cursor-pointer group select-none transition-transform active:scale-95">
    <div className={`${size === 'lg' ? 'w-20 h-20 rounded-[2.5rem]' : 'w-12 h-12 rounded-2xl'} bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg transition-all group-hover:rotate-6`}><span className={size === 'lg' ? 'text-4xl' : 'text-2xl'}>S</span></div>
    <div className="flex flex-col items-start leading-none"><span className={`${size === 'lg' ? 'text-4xl' : 'text-2xl'} font-black text-slate-900 tracking-tighter`}>Salakni</span><span className={`${size === 'lg' ? 'text-sm' : 'text-[10px]'} font-black text-emerald-600 uppercase tracking-widest`}>dz platform</span></div>
  </div>
);
