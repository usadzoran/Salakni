
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
  Wrench
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
    .stat-card { background: white; border-radius: 2rem; padding: 1.5rem; border: 1px solid #f1f5f9; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .stat-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.05); }
  `}</style>
);

// --- Main Application ---

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { currentUser: saved ? JSON.parse(saved) : null, workers: [], view: 'landing' };
  });
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [taskFilters, setTaskFilters] = useState({ category: '', wilaya: '', sortBy: 'newest' });
  const [searchFilters, setSearchFilters] = useState({ query: '', wilaya: '', category: '' });
  const [chatTarget, setChatTarget] = useState<User | null>(null);

  const s = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.map(item => s(item)).filter(Boolean).join(', ');
    if (typeof val === 'object') {
      const firstName = val.first_name || val.firstName;
      const lastName = val.last_name || val.lastName;
      if (firstName || lastName) return `${s(firstName)} ${s(lastName)}`.trim();
      return val.name || val.title || '';
    }
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
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${state.currentUser.id}` 
      }, (payload) => {
        const newNotif = payload.new as AppNotification;
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadNotificationsCount(prev => prev + 1);
      })
      .subscribe();

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', state.currentUser!.id)
        .order('created_at', { ascending: false })
        .limit(20);
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

  const startChatWithUser = async (targetUser: User) => {
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
          .select()
          .single();
        if (newChat) setActiveChat({ ...newChat, other_participant: targetUser });
      }
      setView('chats');
    } catch (e) { console.error(e); } finally { setLoading(false); }
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
                <button onClick={() => setView('register')} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">ابدأ الآن</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onStart={() => setView('search')} onRegister={() => setView('register')} />}
        {state.view === 'search' && <SearchWorkersView onProfile={(w: User) => { setChatTarget(w); setView('profile'); }} filters={searchFilters} onFilterChange={setSearchFilters} safe={s} />}
        {state.view === 'support' && <TasksMarketView currentUser={state.currentUser} safe={s} onContact={startChatWithUser} />}
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
        {state.view === 'edit-profile' && state.currentUser && (
          <EditProfileView user={state.currentUser} onSave={(u: User) => { updateCurrentUser(u); setView('profile'); }} onCancel={() => setView('profile')} />
        )}
        {state.view === 'chats' && state.currentUser && (
          <ChatsView currentUser={state.currentUser} activeChat={activeChat} setActiveChat={setActiveChat} safe={s} />
        )}
        {state.view === 'login' && <AuthForm type="login" onSuccess={(u: User) => { updateCurrentUser(u); setView('profile'); }} onSwitch={() => setView('register')} safe={s} />}
        {state.view === 'register' && <AuthForm type="register" onSuccess={(u: User) => { updateCurrentUser(u); setView('profile'); }} onSwitch={() => setView('login')} safe={s} />}
      </main>

      {/* Mobile Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around md:hidden z-50 px-2 rounded-t-[2rem] shadow-2xl">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={Search} label="الحرفيين" active={state.view === 'search'} onClick={() => setView('search')} />
        <TabItem icon={MessageSquare} label="المحادثات" active={state.view === 'chats'} onClick={() => setView('chats')} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile' || state.view === 'login'} onClick={() => state.currentUser ? setView('profile') : setView('login')} />
      </div>
    </div>
  );
}

// --- Sub-Views ---

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
    <div className="max-w-6xl mx-auto py-10 px-4 md:px-10 animate-in">
      <div className="mb-10 flex justify-between items-center">
        {!isOwn ? (
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-slate-50">
            <ChevronLeft size={20} /> العودة للبحث
          </button>
        ) : (
          <div className="text-emerald-600 font-black text-sm flex items-center gap-2 bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100">
            <UserIcon size={18} /> ملفي الشخصي
          </div>
        )}
        <div className="flex gap-3">
          {isOwn && (
            <>
              <button onClick={onEdit} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-600 shadow-sm hover:bg-slate-50 transition-all"><Settings size={22} /></button>
              <button onClick={onLogout} className="p-3 bg-red-50 text-red-500 border border-red-100 rounded-2xl shadow-sm hover:bg-red-500 hover:text-white transition-all"><LogOut size={22} /></button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 relative">
        <div className="profile-banner h-56 md:h-80"></div>
        <div className="px-6 md:px-16 pb-16 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-10 -mt-28 md:-mt-40 mb-12">
            <div className="relative group">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}`} 
                className="w-56 h-56 md:w-72 md:h-72 rounded-[4rem] border-[12px] border-white shadow-2xl object-cover bg-slate-50 transition-transform group-hover:scale-[1.02]" 
              />
              {isWorker && user.verificationStatus === 'verified' && (
                <div className="absolute bottom-6 right-6 bg-emerald-500 text-white p-2.5 rounded-2xl border-4 border-white shadow-2xl">
                  <CheckCircle2 size={28}/>
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-right pb-4">
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 mb-4">
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">{safe(user.firstName)} {safe(user.lastName)}</h2>
                <VerificationBadge status={user.verificationStatus} />
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {isWorker ? (user.categories || []).map((c: string) => (
                  <span key={safe(c)} className="bg-emerald-50 text-emerald-700 px-6 py-2 rounded-full text-xs font-black border border-emerald-100">{safe(c)}</span>
                )) : <span className="bg-blue-50 text-blue-700 px-6 py-2 rounded-full text-xs font-black border border-blue-100">زبون مسجل</span>}
                <span className="flex items-center gap-2 text-slate-400 font-bold text-xs bg-slate-50 px-6 py-2 rounded-full border border-slate-200">
                  <MapPin size={16} className="text-emerald-500" /> {safe(user.location.wilaya)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-8">
              {/* Stats Card */}
              {isWorker && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="stat-card flex flex-col items-center text-center">
                    <span className="w-10 h-10 bg-yellow-50 text-yellow-500 rounded-xl flex items-center justify-center mb-2"><Star size={20} fill="currentColor"/></span>
                    <span className="text-2xl font-black text-slate-900">{user.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-[10px] text-slate-400 font-bold">التقييم العام</span>
                  </div>
                  <div className="stat-card flex flex-col items-center text-center">
                    <span className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-2"><Briefcase size={20}/></span>
                    <span className="text-2xl font-black text-slate-900">{user.completedJobs || '0'}</span>
                    <span className="text-[10px] text-slate-400 font-bold">مهام مكتملة</span>
                  </div>
                </div>
              )}

              {/* Contact Actions */}
              <div className="bg-slate-950 text-white p-8 md:p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                <h4 className="font-black text-xl mb-8 flex items-center gap-3">تواصل مباشر <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div></h4>
                <div className="space-y-4">
                  {!isOwn && (
                    <button onClick={() => onChat(user)} className="flex items-center justify-center gap-3 w-full bg-emerald-600 py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 hover:bg-emerald-500">
                      <MessageSquare size={22} /> ابدأ محادثة
                    </button>
                  )}
                  <a href={`tel:${user.phone}`} className="flex items-center justify-center gap-3 w-full bg-white/10 py-5 rounded-[2rem] font-black text-xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">
                    <Phone size={22} /> {safe(user.phone)}
                  </a>
                </div>
              </div>

              {/* Skills Tags */}
              {isWorker && user.skills?.length > 0 && (
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <h5 className="font-black text-slate-900 mb-6 flex items-center gap-2"><Target size={18} className="text-emerald-500"/> مهارات خاصة</h5>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((sk: string) => (
                      <span key={sk} className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-bold border border-slate-100">{sk}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-12">
              <section className="animate-in">
                <h4 className="text-3xl font-black text-slate-900 flex items-center gap-4 mb-8">
                  <Award size={32} className="text-emerald-500"/> حول الحرفي
                </h4>
                <div className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 leading-relaxed">
                  <p className="text-slate-600 font-medium text-xl leading-relaxed whitespace-pre-wrap">
                    {safe(user.bio) || 'لا توجد نبذة تعريفية مضافة حالياً. يفضل إضافة وصف دقيق لخبراتك لجذب الزبائن.'}
                  </p>
                </div>
              </section>

              {isWorker && (
                <section className="animate-in">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                      <ImageIcon size={32} className="text-emerald-500"/> معرض الأعمال
                    </h4>
                    {isOwn && (
                      <div className="relative">
                        <button 
                          onClick={() => portfolioInputRef.current?.click()} 
                          disabled={uploading}
                          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-xl hover:bg-emerald-500 active:scale-95 transition-all flex items-center gap-2"
                        >
                          {uploading ? <div className="loading-spinner w-4 h-4 border-2"></div> : <Plus size={20}/>}
                          أضف عمل جديد
                        </button>
                        <input type="file" hidden ref={portfolioInputRef} accept="image/*" onChange={handlePortfolioUpload} />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {(user.portfolio || []).length > 0 ? user.portfolio.map((img: string, idx: number) => (
                      <div key={idx} className="group relative aspect-square rounded-[3rem] overflow-hidden border-[6px] border-white shadow-xl hover:scale-105 transition-all cursor-zoom-in">
                        <img src={img} className="w-full h-full object-cover" />
                        {isOwn && (
                          <button 
                            onClick={async () => {
                              const updated = user.portfolio.filter((_: any, i: number) => i !== idx);
                              await supabase.from('users').update({ portfolio: updated }).eq('id', user.id);
                              onDataUpdate({ ...user, portfolio: updated });
                            }}
                            className="absolute top-4 left-4 p-3 bg-red-500 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={18}/>
                          </button>
                        )}
                        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>
                    )) : (
                      <div className="col-span-full py-24 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-100 text-center flex flex-col items-center justify-center">
                        <ImageIcon size={64} className="text-slate-200 mb-6" />
                        <p className="text-slate-400 font-black text-xl">لم يتم رفع أي أعمال بعد</p>
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

const EditProfileView = ({ user, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({ 
    firstName: user.firstName, 
    lastName: user.lastName, 
    bio: user.bio || '', 
    avatar: user.avatar || '', 
    wilaya: user.location.wilaya,
    categories: Array.isArray(user.categories) ? user.categories : [],
    skills: Array.isArray(user.skills) ? user.skills : []
  });
  const [loading, setLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormData({ ...formData, avatar: reader.result as string });
    reader.readAsDataURL(file);
  };

  const addSkill = () => {
    if (!newSkill.trim() || formData.skills.includes(newSkill.trim())) return;
    setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
    setNewSkill('');
  };

  const removeSkill = (sk: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== sk) });
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
        categories: formData.categories,
        skills: formData.skills
      }).eq('id', user.id);
      
      if (error) throw error;
      onSave({ 
        ...user, 
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        avatar: formData.avatar,
        categories: formData.categories,
        skills: formData.skills,
        location: { ...user.location, wilaya: formData.wilaya } 
      });
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 animate-in">
      <div className="bg-white p-10 md:p-16 rounded-[4rem] shadow-2xl border border-slate-100">
        <h2 className="text-4xl font-black mb-16 border-r-[12px] border-emerald-600 pr-6 tracking-tighter">إدارة البيانات الشخصية</h2>
        
        <form onSubmit={submit} className="space-y-12">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <img 
                src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.firstName}`} 
                className="w-48 h-48 rounded-[3.5rem] object-cover border-[10px] border-emerald-50 shadow-2xl transition-transform group-hover:scale-[1.05]" 
              />
              <div className="absolute inset-0 bg-slate-900/40 rounded-[3.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={40} />
              </div>
            </div>
            <input type="file" hidden ref={avatarInputRef} accept="image/*" onChange={handleAvatarUpload} />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">تحديث صورة الحساب</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الاسم الأول</label>
              <input required className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold shadow-inner" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">اللقب</label>
              <input required className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold shadow-inner" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الولاية الحالية</label>
            <select className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black shadow-inner" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">التخصص الأساسي</label>
            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border-none shadow-inner">
              {SERVICE_CATEGORIES.map(cat => (
                <button 
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    const exists = formData.categories.includes(cat.name);
                    const updated = exists ? formData.categories.filter(c => c !== cat.name) : [...formData.categories, cat.name];
                    setFormData({ ...formData, categories: updated.slice(0, 3) });
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${formData.categories.includes(cat.name) ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-emerald-50'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 mr-2">يمكنك اختيار حتى 3 تخصصات كحد أقصى.</p>
          </div>

          {user.role === UserRole.WORKER && (
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">إدارة المهارات التقنية</label>
              <div className="flex gap-3">
                <input 
                  placeholder="مثال: تركيب الرخام، دهان إيطالي..." 
                  className="flex-1 p-5 bg-slate-50 rounded-2xl border-none font-bold shadow-inner"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button type="button" onClick={addSkill} className="bg-slate-900 text-white px-8 rounded-2xl font-black shadow-lg active:scale-95 transition-all"><Plus/></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map(sk => (
                  <span key={sk} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black border border-emerald-100">
                    {sk} <button type="button" onClick={() => removeSkill(sk)} className="hover:text-red-500"><X size={14}/></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">نبذة تعريفية شاملة</label>
            <textarea 
              className="w-full p-8 bg-slate-50 rounded-[2.5rem] border-none font-medium text-lg leading-relaxed h-64 resize-none shadow-inner" 
              value={formData.bio} 
              onChange={e => setFormData({...formData, bio: e.target.value})} 
              placeholder="اكتب تفاصيل خبرتك ومميزات خدماتك هنا..." 
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-6 pt-6">
            <button 
              disabled={loading} 
              className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all"
            >
              {loading ? <div className="loading-spinner w-6 h-6 border-white mx-auto"></div> : 'حفظ التعديلات الجديدة'}
            </button>
            <button 
              type="button" 
              onClick={onCancel} 
              className="w-full bg-slate-100 text-slate-500 py-6 rounded-[2.5rem] font-black text-2xl active:scale-95 transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Missing View Components ---

// Fix: Add SearchWorkersView component
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

      const { data, error } = await query;
      if (!error && data) {
        setWorkers(data.map(w => ({
          ...w,
          firstName: w.first_name,
          lastName: w.last_name,
          location: { wilaya: w.wilaya, daira: w.daira || '' }
        })));
      }
      setLoading(false);
    };
    fetchWorkers();
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 mb-12 animate-in">
        <h2 className="text-3xl font-black mb-8 flex items-center gap-3"><Search className="text-emerald-600"/> ابحث عن حرفي متخصص</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <input 
            placeholder="مثال: ترصيص صحي، دهان..." 
            className="p-5 bg-slate-50 rounded-2xl border-none font-bold" 
            value={filters.query} 
            onChange={e => onFilterChange({...filters, query: e.target.value})} 
          />
          <select 
            className="p-5 bg-slate-50 rounded-2xl border-none font-black" 
            value={filters.wilaya} 
            onChange={e => onFilterChange({...filters, wilaya: e.target.value})}
          >
            <option value="">كل الولايات</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select 
            className="p-5 bg-slate-50 rounded-2xl border-none font-black" 
            value={filters.category} 
            onChange={e => onFilterChange({...filters, category: e.target.value})}
          >
            <option value="">كل التخصصات</option>
            {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-40 flex justify-center"><div className="loading-spinner"></div></div>
        ) : workers.length > 0 ? workers.map(w => (
          <div key={w.id} onClick={() => onProfile(w)} className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 hover:-translate-y-2 transition-all cursor-pointer group">
            <div className="flex gap-6 items-center mb-6">
              <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-20 h-20 rounded-2xl object-cover shadow-md group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-xl font-black group-hover:text-emerald-600 transition-colors">{safe(w.firstName)} {safe(w.lastName)}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Star size={14} className="text-yellow-500" fill="currentColor"/>
                  <span className="text-xs font-black text-slate-500">{w.rating?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
            </div>
            <p className="text-slate-500 font-medium line-clamp-3 mb-6">{safe(w.bio) || 'لا توجد نبذة تعريفية.'}</p>
            <div className="flex justify-between items-center border-t border-slate-50 pt-6">
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">{safe(w.location.wilaya)}</span>
              <button className="text-emerald-600 font-black text-sm flex items-center gap-1 group-hover:gap-2 transition-all">عرض الملف <ChevronRight size={16}/></button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-24 text-center">
            <p className="text-slate-400 font-black text-xl">لا توجد نتائج مطابقة لبحثك</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Fix: Add TasksMarketView component
const TasksMarketView = ({ currentUser, safe, onContact }: any) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (data) setTasks(data);
      setLoading(false);
    };
    fetchTasks();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-4xl font-black flex items-center gap-4"><ClipboardList className="text-emerald-600" size={36}/> سوق المهام المفتوحة</h2>
        {currentUser?.role === UserRole.SEEKER && (
          <button onClick={() => setShowCreate(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-emerald-500 transition-all flex items-center gap-2">
            <Plus/> أضف طلب خدمة
          </button>
        )}
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="py-20 flex justify-center"><div className="loading-spinner"></div></div>
        ) : tasks.length > 0 ? tasks.map(t => (
          <div key={t.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 hover:border-emerald-200 transition-all">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black">{safe(t.category)}</span>
                <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black">{safe(t.wilaya)}</span>
              </div>
              <h3 className="text-2xl font-black mb-3">{safe(t.title)}</h3>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">{safe(t.description)}</p>
            </div>
            <div className="md:w-64 border-r border-slate-50 pr-8 flex flex-col justify-center gap-4">
              <div className="text-emerald-600 font-black text-3xl">{t.budget} دج</div>
              <button 
                onClick={() => onContact({ id: t.seeker_id, firstName: t.seeker_name || 'صاحب المهمة' })} 
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-emerald-600 transition-all"
              >
                تواصل للعمل
              </button>
            </div>
          </div>
        )) : (
          <div className="py-24 text-center bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100">
            <p className="text-slate-400 font-black text-xl">لا توجد مهام منشورة حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Fix: Add ChatsView component
const ChatsView = ({ currentUser, activeChat, setActiveChat, safe }: any) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          participant_1_user:users!participant_1(*),
          participant_2_user:users!participant_2(*)
        `)
        .or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`)
        .order('updated_at', { ascending: false });

      if (data) {
        setChats(data.map(c => {
          const other = c.participant_1 === currentUser.id ? c.participant_2_user : c.participant_1_user;
          return { 
            ...c, 
            other_participant: { 
              ...other, 
              firstName: other.first_name, 
              lastName: other.last_name, 
              location: { wilaya: other.wilaya, daira: other.daira || '' } 
            } 
          };
        }));
      }
      setLoading(false);
    };
    fetchChats();
  }, [currentUser.id]);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex bg-white my-6 rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in">
      <div className={`w-full md:w-96 border-l border-slate-100 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 border-b border-slate-50">
          <h2 className="text-2xl font-black flex items-center gap-3">المحادثات <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">{chats.length}</span></h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setActiveChat(chat)}
              className={`p-6 flex items-center gap-4 cursor-pointer transition-all border-b border-slate-50 hover:bg-slate-50 ${activeChat?.id === chat.id ? 'bg-emerald-50 border-r-4 border-emerald-500' : ''}`}
            >
              <img src={chat.other_participant?.avatar || `https://ui-avatars.com/api/?name=${chat.other_participant?.firstName}`} className="w-14 h-14 rounded-2xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="font-black text-slate-900 truncate">{safe(chat.other_participant?.firstName)}</h4>
                  <span className="text-[10px] text-slate-400">{new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{chat.last_message || 'ابدأ المحادثة الآن...'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={`flex-1 flex flex-col bg-slate-50/50 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <ChatRoom chat={activeChat} currentUser={currentUser} onBack={() => setActiveChat(null)} safe={safe} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <MessageSquare size={80} className="mb-6 opacity-20" />
            <p className="font-black text-xl">اختر محادثة للبدء</p>
          </div>
        )}
      </div>
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

    const channel = supabase.channel(`chat-${chat.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chat.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      }).subscribe();

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
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden p-2 text-slate-400"><ChevronLeft/></button>
          <img src={chat.other_participant?.avatar || `https://ui-avatars.com/api/?name=${chat.other_participant?.firstName}`} className="w-12 h-12 rounded-2xl object-cover" />
          <div>
            <h4 className="font-black text-slate-900">{safe(chat.other_participant?.firstName)}</h4>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1"><Circle size={8} fill="currentColor"/> متصل الآن</span>
          </div>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 no-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender_id === currentUser.id ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] p-5 text-sm font-medium ${m.sender_id === currentUser.id ? 'chat-bubble-me' : 'chat-bubble-other shadow-sm'}`}>
              {m.content}
              <div className={`text-[9px] mt-2 opacity-60 ${m.sender_id === currentUser.id ? 'text-white' : 'text-slate-400'}`}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex gap-3 bg-slate-50 p-2 rounded-3xl border border-slate-100">
          <input 
            placeholder="اكتب رسالتك هنا..." 
            className="flex-1 bg-transparent px-4 py-3 outline-none font-bold" 
            value={content} 
            onChange={e => setContent(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && send()}
          />
          <button onClick={send} className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg hover:bg-emerald-500 transition-all"><Send size={20}/></button>
        </div>
      </div>
    </div>
  );
};

// Fix: Add AuthForm component
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
        const { data, error } = await supabase.from('users').insert([{
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          wilaya: formData.wilaya,
          categories: [],
          skills: [],
          portfolio: [],
          verification_status: 'none'
        }]).select().single();
        if (error) throw error;
        onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: '' } });
      }
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto py-20 px-6 animate-in">
      <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl border border-slate-100 text-center">
        <Logo size="lg" />
        <h2 className="text-3xl font-black mt-10 mb-4">{type === 'login' ? 'مرحباً بعودتك' : 'انضم إلى مجتمع سلكني'}</h2>
        <p className="text-slate-400 font-bold mb-12">{type === 'login' ? 'سجل دخولك لمتابعة أعمالك وطلباتك' : 'ابدأ رحلتك معنا اليوم كحرفي أو صاحب عمل'}</p>

        <form onSubmit={submit} className="space-y-6 text-right">
          {type === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="الاسم" className="p-5 bg-slate-50 rounded-2xl border-none font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input required placeholder="اللقب" className="p-5 bg-slate-50 rounded-2xl border-none font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          )}
          <input required type="tel" placeholder="رقم الهاتف" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input required type="password" placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          
          {type === 'register' && (
            <>
              <select className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <button type="button" onClick={() => setFormData({...formData, role: UserRole.SEEKER})} className={`flex-1 py-4 rounded-xl font-black transition-all ${formData.role === UserRole.SEEKER ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}>أنا زبون</button>
                <button type="button" onClick={() => setFormData({...formData, role: UserRole.WORKER})} className={`flex-1 py-4 rounded-xl font-black transition-all ${formData.role === UserRole.WORKER ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}>أنا حرفي</button>
              </div>
            </>
          )}

          <button disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-emerald-500 transition-all active:scale-95 mt-8">
            {loading ? <div className="loading-spinner w-6 h-6 border-white mx-auto"></div> : (type === 'login' ? 'دخول' : 'تسجيل')}
          </button>
        </form>

        <p className="mt-12 text-slate-500 font-bold">
          {type === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
          <button onClick={onSwitch} className="text-emerald-600 font-black hover:underline">{type === 'login' ? 'أنشئ حساباً' : 'سجل دخولك'}</button>
        </p>
      </div>
    </div>
  );
};

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

const VerificationBadge = ({ status, size = 'md' }: { status: VerificationStatus, size?: 'sm' | 'md' }) => {
  if (status === 'none' || !status) return null;
  
  const getStatusConfig = (s: VerificationStatus) => {
    switch (s) {
      case 'verified':
        return { icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', text: 'موثق' };
      case 'pending':
        return { icon: ShieldQuestion, color: 'text-amber-600 bg-amber-50 border-amber-200', text: 'قيد المراجعة' };
      case 'rejected':
        return { icon: ShieldAlert, color: 'text-red-600 bg-red-50 border-red-200', text: 'مرفوض' };
      default:
        return null;
    }
  };

  const config = getStatusConfig(status);
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-black ${config.color} ${size === 'sm' ? 'text-[10px]' : 'text-xs shadow-sm'}`}>
      <Icon size={size === 'sm' ? 14 : 16} />
      <span>{config.text}</span>
    </div>
  );
};

const Logo = ({ onClick, size = 'md' }: { onClick?: () => void, size?: 'sm' | 'md' | 'lg' }) => (
  <div onClick={onClick} className="flex items-center gap-2 cursor-pointer group select-none transition-transform active:scale-95 mx-auto">
    <div className={`${size === 'lg' ? 'w-16 h-16 rounded-3xl' : size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'} bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg transition-all group-hover:rotate-6`}>
      <span className={size === 'lg' ? 'text-3xl' : 'text-lg'}>S</span>
    </div>
    <div className="flex flex-col items-start leading-none">
      <span className={`${size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-xl'} font-black text-slate-900 tracking-tighter`}>Salakni</span>
      <span className={`${size === 'lg' ? 'text-sm' : 'text-[10px]'} font-black text-emerald-600 uppercase`}>dz platform</span>
    </div>
  </div>
);

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
        <button onClick={onRegister} className="bg-white/10 backdrop-blur-md text-white px-12 py-5 rounded-[2.5rem] font-black text-xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">سجل كحرفي ⚒️</button>
      </div>
    </div>
  </div>
);
