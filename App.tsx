
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
  Eye,
  RefreshCw
} from 'lucide-react';

// --- Global Styles ---

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
    .admin-stat-card { background: white; border-radius: 2rem; padding: 1.5rem; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); transition: transform 0.2s; }
    .admin-stat-card:hover { transform: translateY(-4px); }
  `}</style>
);

// --- Main Application ---

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { currentUser: saved ? JSON.parse(saved) : null, workers: [], view: 'landing' };
  });
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [searchFilters, setSearchFilters] = useState({ query: '', wilaya: '', category: '' });
  const [chatTarget, setChatTarget] = useState<User | null>(null);

  const s = (val: any): string => {
    if (val === null || val === undefined) return '';
    return String(val);
  };

  const setView = (view: AppState['view']) => {
    setState(prev => ({ ...prev, view }));
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    window.history.pushState({}, '', url);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as AppState['view'];
    if (viewParam && ['landing', 'search', 'support', 'profile', 'admin-panel'].includes(viewParam)) {
      if (viewParam === 'admin-panel' && state.currentUser?.role !== UserRole.ADMIN) {
        setView('login');
      } else {
        setState(prev => ({ ...prev, view: viewParam }));
      }
    }
  }, []);

  useEffect(() => {
    if (!state.currentUser) return;
    const fetchNotifications = async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', state.currentUser!.id).order('created_at', { ascending: false }).limit(20);
      if (data) setUnreadNotificationsCount(data.filter(n => !n.is_read).length);
    };
    fetchNotifications();
  }, [state.currentUser?.id]);

  const updateCurrentUser = (u: User | null) => {
    setState(prev => ({ ...prev, currentUser: u }));
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user');
  };

  const startChatWithUser = async (targetUser: any) => {
    if (!state.currentUser) return setView('login');
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
      setChatTarget(null);
      setView('profile');
    } catch (e) { console.error(e); }
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
            {state.currentUser?.role === UserRole.ADMIN && (
              <button onClick={() => setView('admin-panel')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs transition-all ${state.view === 'admin-panel' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                <ShieldCheck size={16} /> لوحة التحكم
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div className="flex items-center gap-4">
                <button className="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                  <Bell size={24} />
                  {unreadNotificationsCount > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">{unreadNotificationsCount}</span>}
                </button>
                <div onClick={() => { setChatTarget(null); setView('profile'); }} className="flex items-center gap-3 cursor-pointer p-1 pr-4 bg-slate-100 rounded-full border border-slate-200 hover:border-emerald-200 transition-all">
                  <span className="font-black text-xs hidden sm:block">{s(state.currentUser.firstName)}</span>
                  <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setView('login')} className="hidden sm:block text-slate-500 font-black px-4 py-2">دخول</button>
                <button onClick={() => setView('register')} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">ابدأ الآن</button>
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
            currentUser={state.currentUser}
            isOwn={!chatTarget || chatTarget?.id === state.currentUser?.id} 
            onEdit={() => setView('edit-profile')} 
            onLogout={() => { updateCurrentUser(null); setView('landing'); }} 
            onBack={() => { setChatTarget(null); setView('search'); }} 
            onChat={startChatWithUser}
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            safe={s} 
          />
        )}
        {state.view === 'admin-panel' && state.currentUser?.role === UserRole.ADMIN && <AdminPanelView safe={s} />}
        {state.view === 'login' && <AuthForm type="login" onSuccess={(u: User) => { updateCurrentUser(u); setView('profile'); }} onSwitch={() => setView('register')} safe={s} />}
        {state.view === 'register' && <AuthForm type="register" onSuccess={(u: User) => { updateCurrentUser(u); setView('profile'); }} onSwitch={() => setView('login')} safe={s} />}
        {state.view === 'edit-profile' && state.currentUser && <EditProfileView user={state.currentUser} onSave={(u: User) => { updateCurrentUser(u); setView('profile'); }} onCancel={() => setView('profile')} />}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around md:hidden z-50 px-2 rounded-t-[2rem] shadow-2xl">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={Search} label="الحرفيين" active={state.view === 'search'} onClick={() => setView('search')} />
        <TabItem icon={ClipboardList} label="المهام" active={state.view === 'support'} onClick={() => setView('support')} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile' || state.view === 'login'} onClick={() => state.currentUser ? setView('profile') : setView('login')} />
      </div>
    </div>
  );
}

// --- Admin Panel Component ---

const AdminPanelView = ({ safe }: any) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tasks' | 'verifications'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, workers: 0, tasks: 0, pending: 0 });
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: users } = await supabase.from('users').select('*');
      const { data: tasks } = await supabase.from('tasks').select('*');
      
      const u = users || [];
      const t = tasks || [];
      
      setStats({
        users: u.length,
        workers: u.filter(user => user.role === 'WORKER').length,
        tasks: t.length,
        pending: u.filter(user => user.verification_status === 'pending').length
      });

      if (activeTab === 'users') setData(u);
      else if (activeTab === 'tasks') setData(t);
      else if (activeTab === 'verifications') setData(u.filter(user => user.verification_status === 'pending'));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-in">
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">لوحة التحكم <span className="text-emerald-600">Admin</span></h2>
        <button onClick={fetchData} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-emerald-50 transition-all"><RefreshCw size={20} className="text-emerald-600" /></button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard label="المستخدمين" value={stats.users} icon={Users} color="emerald" />
        <StatCard label="الحرفيين" value={stats.workers} icon={Briefcase} color="blue" />
        <StatCard label="المهام" value={stats.tasks} icon={ClipboardList} color="purple" />
        <StatCard label="طلبات التوثيق" value={stats.pending} icon={ShieldQuestion} color="amber" />
      </div>

      <div className="flex gap-2 mb-8 bg-white p-2 rounded-2xl border border-slate-100 w-fit">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>نظرة عامة</TabButton>
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>المستخدمين</TabButton>
        <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')}>المهام المنشورة</TabButton>
        <TabButton active={activeTab === 'verifications'} onClick={() => setActiveTab('verifications')}>التوثيقات</TabButton>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="loading-spinner"></div></div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          {activeTab === 'overview' ? (
            <div className="p-12 text-center">
              <BarChart3 size={64} className="mx-auto text-slate-200 mb-6" />
              <h3 className="text-2xl font-black text-slate-400">الإحصائيات قيد التطوير...</h3>
            </div>
          ) : (
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 font-black text-slate-500 text-sm">الاسم</th>
                  <th className="px-8 py-5 font-black text-slate-500 text-sm">{activeTab === 'tasks' ? 'العنوان' : 'رقم الهاتف'}</th>
                  <th className="px-8 py-5 font-black text-slate-500 text-sm">الحالة / الولاية</th>
                  <th className="px-8 py-5 font-black text-slate-500 text-sm">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-5 flex items-center gap-4">
                      <img src={item.avatar || `https://ui-avatars.com/api/?name=${item.first_name || item.title}`} className="w-10 h-10 rounded-xl" />
                      <span className="font-bold">{safe(item.first_name || item.title)} {safe(item.last_name)}</span>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-600">{safe(item.phone || item.category)}</td>
                    <td className="px-8 py-5"><span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-black">{safe(item.wilaya || item.status)}</span></td>
                    <td className="px-8 py-5"><button className="text-emerald-600 font-black text-xs hover:underline">عرض</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="admin-stat-card">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-${color}-50 text-${color}-600`}>
      <Icon size={24} />
    </div>
    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">{label}</p>
    <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
  </div>
);

const TabButton = ({ active, children, onClick }: any) => (
  <button onClick={onClick} className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${active ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
    {children}
  </button>
);

// --- Sub-Views ---

const LandingView = ({ onStart, onRegister }: any) => (
  <div className="relative min-h-[85vh] flex items-center justify-center text-center px-6 overflow-hidden">
    <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
    <div className="relative z-10 max-w-4xl animate-in">
      <div className="inline-block bg-emerald-500/20 text-emerald-400 px-6 py-2 rounded-full border border-emerald-500/30 text-xs font-black uppercase tracking-widest mb-8">أكبر تجمع للحرفيين في الجزائر</div>
      <h1 className="text-4xl md:text-8xl font-black text-white mb-8 leading-tight tracking-tighter">ريح بالك، <br className="sm:hidden"/><span className="text-emerald-400 italic">سَلّكني</span> يسلكها!</h1>
      <p className="text-base md:text-2xl text-slate-300 mb-12 font-medium max-w-2xl mx-auto px-4">اطلب أي خدمة منزلية أو مهنية بلمسة زر. أفضل الحرفيين المهرة في الجزائر جاهزون لخدمتك.</p>
      <div className="flex flex-col sm:flex-row gap-6 justify-center">
        <button onClick={onStart} className="bg-emerald-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 hover:scale-105 transition-all">ابحث عن حرفي 🔍</button>
        <button onClick={onRegister} className="bg-white/10 backdrop-blur-md text-white px-12 py-5 rounded-[2.5rem] font-black text-xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">سجل كحرفي ⚒️</button>
      </div>
    </div>
  </div>
);

const SearchWorkersView = ({ filters, onFilterChange, onProfile, safe }: any) => {
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase.from('users').select('*').eq('role', 'WORKER');
      if (filters.wilaya) query = query.eq('wilaya', filters.wilaya);
      if (filters.category) query = query.contains('categories', [filters.category]);
      if (filters.query) query = query.or(`first_name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`);
      const { data } = await query;
      if (data) setWorkers(data.map(w => ({ ...w, firstName: w.first_name, lastName: w.last_name, location: { wilaya: w.wilaya, daira: '' } })));
      setLoading(false);
    };
    fetch();
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 animate-in">
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 mb-12 flex flex-col md:flex-row gap-6">
        <input placeholder="ابحث عن حرفي أو خدمة..." className="flex-1 p-5 bg-slate-50 rounded-[2rem] font-bold border-none" value={filters.query} onChange={e => onFilterChange({...filters, query: e.target.value})} />
        <select className="p-5 bg-slate-50 rounded-[2rem] font-black text-sm" value={filters.wilaya} onChange={e => onFilterChange({...filters, wilaya: e.target.value})}>
          <option value="">كل الولايات</option>
          {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? <div className="col-span-full py-40 flex justify-center"><div className="loading-spinner"></div></div> : workers.map(w => (
          <div key={w.id} onClick={() => onProfile(w)} className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 hover:-translate-y-2 transition-all cursor-pointer">
            <div className="flex gap-4 items-center mb-6">
              <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-16 h-16 rounded-3xl object-cover shadow-sm" />
              <div><h3 className="text-xl font-black">{safe(w.firstName)} {safe(w.lastName)}</h3><p className="text-xs font-bold text-slate-400">{safe(w.location.wilaya)}</p></div>
            </div>
            <p className="text-slate-500 line-clamp-2 text-sm">{safe(w.bio) || 'لا توجد نبذة.'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const TasksMarketView = ({ currentUser, safe, onContact, setView }: any) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase.from('tasks').select('*, users!seeker_id(*)').order('created_at', { ascending: false });
    if (data) setTasks(data.map(t => ({ ...t, seeker_name: `${t.users.first_name} ${t.users.last_name}`, seeker_avatar: t.users.avatar, seeker_phone: t.users.phone })));
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-in">
      <div className="flex justify-between items-center mb-16">
        <div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">سوق المهام <span className="text-emerald-500">DZ</span></h2>
          <p className="text-slate-500 font-bold">تصفح طلبات الزبائن وقدم عروضك.</p>
        </div>
        <button onClick={() => setView('login')} className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl active:scale-95 transition-all"><Plus size={32}/></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading ? <div className="py-40 flex justify-center"><div className="loading-spinner"></div></div> : tasks.map(task => (
          <div key={task.id} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
              <span className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black border border-emerald-100 uppercase tracking-widest">{safe(task.category)}</span>
              <div className="text-emerald-600 font-black text-2xl tracking-tighter">{task.budget > 0 ? `${task.budget} دج` : 'سعر مفتوح'}</div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">{safe(task.title)}</h3>
            <p className="text-slate-500 mb-8 line-clamp-2">{safe(task.description)}</p>
            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <img src={task.seeker_avatar || `https://ui-avatars.com/api/?name=${task.seeker_name}`} className="w-10 h-10 rounded-xl" />
                <span className="text-sm font-black">{safe(task.seeker_name)}</span>
              </div>
              <button onClick={() => setSelectedTask(task)} className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2">
                <Eye size={16} /> عرض التفاصيل
              </button>
            </div>
          </div>
        ))}
      </div>
      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onContact={onContact} safe={safe} />}
    </div>
  );
};

const TaskDetailModal = ({ task, onClose, onContact, safe }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in">
    <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden relative animate-slide p-10 space-y-8">
      <button onClick={onClose} className="absolute top-6 left-6 p-2 bg-slate-50 text-slate-400 rounded-xl"><X size={24}/></button>
      <div className="flex gap-3">
        <span className="bg-emerald-50 text-emerald-700 px-5 py-2 rounded-2xl text-xs font-black border border-emerald-100 uppercase">{safe(task.category)}</span>
        <span className="bg-slate-50 text-slate-500 px-5 py-2 rounded-2xl text-xs font-black border border-slate-100">{safe(task.wilaya)}</span>
      </div>
      <h2 className="text-3xl font-black text-slate-900 leading-tight">{safe(task.title)}</h2>
      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-50 text-slate-600 font-medium leading-relaxed">{safe(task.description)}</div>
      <div className="flex items-center justify-between py-6 border-y border-slate-50">
        <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الميزانية</p><p className="text-3xl font-black text-emerald-600 tracking-tighter">{task.budget > 0 ? `${task.budget} دج` : 'سعر مفتوح'}</p></div>
        <div className="text-left"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">تاريخ النشر</p><p className="font-bold text-slate-900">{new Date(task.created_at).toLocaleDateString('ar-DZ')}</p></div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 flex-1">
          <img src={task.seeker_avatar || `https://ui-avatars.com/api/?name=${task.seeker_name}`} className="w-14 h-14 rounded-2xl object-cover shadow-sm" />
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">صاحب الطلب</p><h5 className="text-lg font-black text-slate-900">{safe(task.seeker_name)}</h5></div>
        </div>
        <button onClick={() => { onContact({ id: task.seeker_id, firstName: task.seeker_name, avatar: task.seeker_avatar }); onClose(); }} className="bg-emerald-600 text-white px-8 py-4 rounded-[2rem] font-black shadow-xl hover:bg-emerald-500 transition-all flex items-center gap-3">
          <MessageSquare size={20} /> تواصل
        </button>
      </div>
    </div>
  </div>
);

const ProfileView = ({ user, currentUser, isOwn, onEdit, onLogout, onBack, onChat, activeChat, setActiveChat, safe }: any) => {
  const [showChats, setShowChats] = useState(!!activeChat);
  const isWorker = user.role === UserRole.WORKER;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 md:px-10 animate-in">
      <div className="mb-8 flex justify-between items-center">
        {!isOwn ? (
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:text-emerald-600"><ChevronLeft size={20} /> العودة</button>
        ) : <div className="text-emerald-600 font-black text-sm flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">حسابي الشخصي</div>}
        <div className="flex gap-2">
          {isOwn && (
            <>
              <button onClick={() => setShowChats(!showChats)} className={`p-3 rounded-2xl transition-all flex items-center gap-2 font-black text-sm ${showChats ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-100 text-slate-600'}`}>
                <MessageSquare size={20} /> {showChats ? 'عرض البروفايل' : 'المحادثات'}
              </button>
              <button onClick={onEdit} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-600 shadow-sm hover:bg-emerald-50 transition-all"><Settings size={20} /></button>
              <button onClick={onLogout} className="p-3 bg-red-50 text-red-500 border border-red-100 rounded-2xl shadow-sm hover:bg-red-500 hover:text-white transition-all"><LogOut size={20} /></button>
            </>
          )}
        </div>
      </div>

      {showChats && isOwn ? (
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 h-[600px] flex animate-in">
          <ChatsSubView currentUser={currentUser} activeChat={activeChat} setActiveChat={setActiveChat} safe={safe} />
        </div>
      ) : (
        <div className="bg-white rounded-[3.5rem] md:rounded-[4.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in">
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
                  {user.verificationStatus === 'verified' && <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 font-black text-xs shadow-sm"><ShieldCheck size={18}/> موثق</div>}
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  {isWorker ? (user.categories || []).map((c: string) => <span key={c} className="bg-emerald-50 text-emerald-700 px-5 py-2 rounded-full text-xs font-black border border-emerald-100">{safe(c)}</span>) : <span className="bg-blue-50 text-blue-700 px-5 py-2 rounded-full text-xs font-black border border-blue-100">زبون سلكني</span>}
                  <span className="flex items-center gap-2 text-slate-400 font-bold text-xs bg-slate-50 px-5 py-2 rounded-full border border-slate-200"><MapPin size={16} className="text-emerald-500" /> {safe(user.location.wilaya)}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1 space-y-8">
                <div className="bg-slate-950 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                  <h4 className="font-black text-xl mb-8 flex items-center gap-3">تواصل الآن</h4>
                  <div className="space-y-4">
                    {!isOwn && <button onClick={() => onChat(user)} className="flex items-center justify-center gap-3 w-full bg-emerald-600 py-6 rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-emerald-500 active:scale-95 transition-all"><MessageSquare size={24} /> محادثة فورية</button>}
                    <a href={`tel:${user.phone}`} className="flex items-center justify-center gap-3 w-full bg-white/10 py-6 rounded-[2.5rem] font-black text-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-95"><Phone size={24} /> اتصــال</a>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-16">
                <section><h4 className="text-3xl font-black text-slate-900 flex items-center gap-4 mb-8"><Award size={32} className="text-emerald-500"/> نبذة تعريفية</h4><div className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 leading-relaxed font-medium text-xl text-slate-600">{safe(user.bio) || 'لا توجد نبذة.'}</div></section>
                {isWorker && (
                  <section>
                    <h4 className="text-3xl font-black text-slate-900 flex items-center gap-4 mb-8"><ImageIcon size={32} className="text-emerald-500"/> ألبوم الأعمال</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">{(user.portfolio || []).length > 0 ? user.portfolio.map((img: string, idx: number) => <div key={idx} className="aspect-square rounded-[2rem] overflow-hidden border-4 border-white shadow-xl hover:scale-105 transition-all"><img src={img} className="w-full h-full object-cover" /></div>) : <div className="col-span-full py-20 text-center text-slate-300 font-black">لا توجد أعمال منشورة</div>}</div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatsSubView = ({ currentUser, activeChat, setActiveChat, safe }: any) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      const { data } = await supabase.from('chats').select(`*, participant_1_user:users!participant_1(*), participant_2_user:users!participant_2(*)`).or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`).order('updated_at', { ascending: false });
      if (data) setChats(data.map(c => {
        const other = c.participant_1 === currentUser.id ? c.participant_2_user : c.participant_1_user;
        return { ...c, other_participant: { ...other, firstName: other.first_name, lastName: other.last_name } };
      }));
      setLoading(false);
    };
    fetchChats();
  }, [currentUser.id]);

  return (
    <>
      <div className={`w-full md:w-80 border-l border-slate-50 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 border-b border-slate-50 flex items-center justify-between"><h2 className="text-xl font-black">المحادثات</h2><RefreshCw size={16} className="text-slate-300 cursor-pointer" onClick={() => window.location.reload()}/></div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading ? <div className="p-10 flex justify-center"><div className="loading-spinner"></div></div> : chats.map(chat => (
            <div key={chat.id} onClick={() => setActiveChat(chat)} className={`p-6 flex items-center gap-4 cursor-pointer border-b border-slate-50 transition-all ${activeChat?.id === chat.id ? 'bg-emerald-50 border-r-4 border-emerald-600' : 'hover:bg-slate-50'}`}>
              <img src={chat.other_participant?.avatar || `https://ui-avatars.com/api/?name=${chat.other_participant?.firstName}`} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
              <div className="flex-1 min-w-0"><h4 className="font-black text-sm truncate">{safe(chat.other_participant?.firstName)}</h4><p className="text-[10px] text-slate-500 truncate">{chat.last_message || 'ابدأ المحادثة...'}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className={`flex-1 flex flex-col bg-slate-50/30 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? <ChatRoom chat={activeChat} currentUser={currentUser} onBack={() => setActiveChat(null)} safe={safe} /> : <div className="flex-1 flex flex-col items-center justify-center text-slate-300"><MessageSquare size={80} className="mb-6 opacity-20" /><p className="font-black text-lg">اختر محادثة لبدء التواصل</p></div>}
      </div>
    </>
  );
};

const ChatRoom = ({ chat, currentUser, onBack, safe }: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('messages').select('*').eq('chat_id', chat.id).order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetch();
    const ch = supabase.channel(`chat-${chat.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chat.id}` }, (payload) => setMessages(prev => [...prev, payload.new as Message])).subscribe();
    return () => { ch.unsubscribe(); };
  }, [chat.id]);

  useEffect(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), [messages]);

  const send = async () => {
    if (!content.trim()) return;
    await supabase.from('messages').insert([{ chat_id: chat.id, sender_id: currentUser.id, content: content.trim() }]);
    await supabase.from('chats').update({ last_message: content.trim(), updated_at: new Date().toISOString() }).eq('id', chat.id);
    setContent('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden p-2 text-slate-400"><ChevronLeft size={24}/></button>
          <img src={chat.other_participant?.avatar || `https://ui-avatars.com/api/?name=${chat.other_participant?.firstName}`} className="w-10 h-10 rounded-xl" />
          <h4 className="font-black text-sm">{safe(chat.other_participant?.firstName)}</h4>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 no-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender_id === currentUser.id ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] p-4 text-sm font-medium shadow-sm ${m.sender_id === currentUser.id ? 'chat-bubble-me' : 'chat-bubble-other'}`}>{m.content}</div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-100 flex gap-2">
        <input placeholder="اكتب رسالة..." className="flex-1 bg-slate-50 px-5 py-3 rounded-2xl outline-none font-bold text-sm" value={content} onChange={e => setContent(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()} />
        <button onClick={send} className="bg-emerald-600 text-white p-3 rounded-2xl active:scale-95"><Send size={20}/></button>
      </div>
    </div>
  );
};

// --- Helper Components ---

const Logo = ({ onClick, size }: any) => (
  <div onClick={onClick} className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-all">
    <div className={`${size === 'lg' ? 'w-16 h-16 rounded-3xl' : 'w-10 h-10 rounded-xl'} bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg transition-all group-hover:rotate-6`}>S</div>
    <div className="flex flex-col items-start leading-none">
      <span className={`${size === 'lg' ? 'text-3xl' : 'text-xl'} font-black text-slate-900 tracking-tighter`}>Salakni</span>
      <span className={`${size === 'lg' ? 'text-sm' : 'text-[10px]'} font-black text-emerald-600 uppercase`}>dz platform</span>
    </div>
  </div>
);

const NavButton = ({ children, active, onClick }: any) => (
  <button onClick={onClick} className={`font-black text-sm transition-all px-2 py-1 relative ${active ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'}`}>
    {children}
    {active && <span className="absolute -bottom-2 left-0 right-0 h-1 bg-emerald-600 rounded-full"></span>}
  </button>
);

const TabItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 transition-all ${active ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
    <div className={`p-2 rounded-xl ${active ? 'bg-emerald-50' : ''}`}><Icon size={22} /></div>
    <span className="text-[10px] font-black">{label}</span>
  </button>
);

const AuthForm = ({ type, onSuccess, onSwitch }: any) => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', password: '', role: 'SEEKER' });
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
        const { data, error } = await supabase.from('users').insert([{ first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone, password: formData.password, role: formData.role, wilaya: WILAYAS[0], categories: [], skills: [], portfolio: [], verification_status: 'none' }]).select().single();
        if (error) throw error;
        onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: '' } });
      }
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto py-20 px-6 animate-in text-center">
      <h2 className="text-4xl font-black mb-10">{type === 'login' ? 'مرحباً بعودتك' : 'حساب جديد'}</h2>
      <form onSubmit={submit} className="space-y-6 text-right bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
        {type === 'register' && (<div className="grid grid-cols-2 gap-4"><input required placeholder="الاسم" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /><input required placeholder="اللقب" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>)}
        <input required placeholder="رقم الهاتف" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black text-lg tracking-widest" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        <input required type="password" placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
        <button disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all">{loading ? 'جاري التحقق...' : (type === 'login' ? 'دخول' : 'تسجيل')}</button>
      </form>
      <button onClick={onSwitch} className="mt-8 text-emerald-600 font-black hover:underline">{type === 'login' ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ ادخل هنا'}</button>
    </div>
  );
};

const EditProfileView = ({ user, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({ firstName: user.firstName, bio: user.bio || '', wilaya: user.location.wilaya });
  const [loading, setLoading] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from('users').update({ first_name: formData.firstName, bio: formData.bio, wilaya: formData.wilaya }).eq('id', user.id);
      onSave({ ...user, ...formData, location: { ...user.location, wilaya: formData.wilaya } });
    } catch (err) { alert('خطأ في الحفظ'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto py-20 px-6 animate-in">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
        <h2 className="text-2xl font-black mb-8">إعدادات الحساب</h2>
        <form onSubmit={submit} className="space-y-6">
          <input required placeholder="الاسم" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
          <textarea className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold h-32" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="نبذة عنك..." />
          <div className="flex gap-4"><button disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-[1.5rem] font-black">{loading ? '...' : 'حفظ'}</button><button type="button" onClick={onCancel} className="w-full bg-slate-100 py-4 rounded-[1.5rem] font-black">إلغاء</button></div>
        </form>
      </div>
    </div>
  );
};
