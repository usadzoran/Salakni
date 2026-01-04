
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
  Circle
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

  // Real-time Subscriptions
  useEffect(() => {
    if (!state.currentUser) return;

    // Listen for new notifications
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
        // Toast logic could be added here
      })
      .subscribe();

    // Fetch initial notifications
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

    return () => {
      notificationChannel.unsubscribe();
    };
  }, [state.currentUser?.id]);

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
    categories: Array.isArray(d.categories) ? d.categories : [],
    skills: Array.isArray(d.skills) ? d.skills : [],
    portfolio: Array.isArray(d.portfolio) ? d.portfolio : [],
    verificationStatus: d.verification_status || 'none',
    rating: d.rating || 0,
    ratingCount: d.rating_count || 0,
    completedJobs: d.completed_jobs || 0,
    createdAt: d.created_at
  });

  const updateCurrentUser = (u: User | null) => {
    setState(prev => ({ ...prev, currentUser: u }));
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user');
  };

  const startChatWithUser = async (targetUser: User) => {
    if (!state.currentUser) return setView('login');
    setLoading(true);
    try {
      // Check if chat exists
      const { data: existingChats } = await supabase
        .from('chats')
        .select('*')
        .or(`and(participant_1.eq.${state.currentUser.id},participant_2.eq.${targetUser.id}),and(participant_1.eq.${targetUser.id},participant_2.eq.${state.currentUser.id})`)
        .single();

      if (existingChats) {
        setActiveChat({ ...existingChats, other_participant: targetUser });
      } else {
        const { data: newChat, error } = await supabase
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
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
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
            safe={s} 
          />
        )}
        {state.view === 'chats' && state.currentUser && (
          <ChatsView 
            currentUser={state.currentUser} 
            activeChat={activeChat} 
            setActiveChat={setActiveChat} 
            safe={s} 
          />
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

const ChatsView = ({ currentUser, activeChat, setActiveChat, safe }: any) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          p1:participant_1(id, first_name, last_name, avatar),
          p2:participant_2(id, first_name, last_name, avatar)
        `)
        .or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`)
        .order('updated_at', { ascending: false });

      if (data) {
        const mappedChats = data.map((c: any) => {
          const other = c.participant_1 === currentUser.id ? c.p2 : c.p1;
          return {
            ...c,
            other_participant: {
              id: other.id,
              firstName: other.first_name,
              lastName: other.last_name,
              avatar: other.avatar
            }
          };
        });
        setChats(mappedChats);
      }
      setLoading(false);
    };
    fetchChats();
  }, [currentUser.id]);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-5rem)] flex animate-in">
      <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-l border-slate-100 bg-white`}>
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-2xl font-black">المحادثات</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 flex justify-center"><div className="loading-spinner"></div></div>
          ) : chats.length > 0 ? chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setActiveChat(chat)}
              className={`p-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-slate-50 border-b border-slate-50 ${activeChat?.id === chat.id ? 'bg-emerald-50/50 border-r-4 border-emerald-500' : ''}`}
            >
              <img src={chat.other_participant?.avatar || `https://ui-avatars.com/api/?name=${chat.other_participant?.firstName}`} className="w-14 h-14 rounded-2xl object-cover" />
              <div className="flex-1 truncate">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-sm">{safe(chat.other_participant?.firstName)} {safe(chat.other_participant?.lastName)}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{new Date(chat.updated_at).toLocaleDateString('ار-DZ')}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{chat.last_message || 'ابدأ المحادثة الآن...'}</p>
              </div>
            </div>
          )) : (
            <div className="p-10 text-center text-slate-400 font-bold">لا يوجد محادثات حالياً</div>
          )}
        </div>
      </div>

      <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-50/30`}>
        {activeChat ? (
          <ChatRoom chat={activeChat} currentUser={currentUser} onBack={() => setActiveChat(null)} safe={safe} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <MessageSquare size={100} className="mb-6 opacity-20" />
            <p className="text-xl font-black">اختر محادثة للبدء</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatRoom = ({ chat, currentUser, onBack, safe }: any) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`chat-room-${chat.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `chat_id=eq.${chat.id}` 
      }, (payload) => {
        const msg = payload.new as Message;
        setMessages(prev => [...prev, msg]);
      })
      .subscribe();

    return () => { messageChannel.unsubscribe(); };
  }, [chat.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert([{
        chat_id: chat.id,
        sender_id: currentUser.id,
        content: newMessage
      }]);
      if (!error) {
        setNewMessage('');
        // Update chat's updated_at and last_message
        await supabase.from('chats').update({ 
          last_message: newMessage, 
          updated_at: new Date().toISOString() 
        }).eq('id', chat.id);

        // Notify other user
        const otherId = chat.participant_1 === currentUser.id ? chat.participant_2 : chat.participant_1;
        await supabase.from('notifications').insert([{
          user_id: otherId,
          title: 'رسالة جديدة',
          content: `${currentUser.firstName}: ${newMessage.substring(0, 30)}...`,
          type: 'message',
          link: `/chats?id=${chat.id}`
        }]);
      }
    } catch (e) { console.error(e); } finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-full bg-white md:bg-transparent">
      <div className="p-4 md:p-6 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="md:hidden p-2 text-slate-400"><ChevronRight size={24} /></button>
          <img src={chat.other_participant?.avatar || `https://ui-avatars.com/api/?name=${chat.other_participant?.firstName}`} className="w-12 h-12 rounded-xl object-cover" />
          <div>
            <h3 className="font-black text-sm">{safe(chat.other_participant?.firstName)} {safe(chat.other_participant?.lastName)}</h3>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1"><Circle size={8} fill="currentColor" /> متصل الآن</span>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><MoreVertical size={20} /></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-slate-50/50">
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-4 shadow-sm ${isMe ? 'chat-bubble-me' : 'chat-bubble-other'}`}>
                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                <span className={`block text-[8px] mt-2 font-bold uppercase ${isMe ? 'text-emerald-100 text-left' : 'text-slate-400 text-right'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('ار-DZ', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={sendMessage} className="p-4 md:p-6 bg-white border-t border-slate-100">
        <div className="flex gap-4 items-center max-w-4xl mx-auto">
          <button type="button" className="p-3 text-slate-400 hover:text-emerald-600 transition-colors bg-slate-50 rounded-2xl"><Plus size={24} /></button>
          <input 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..." 
            className="flex-1 p-4 bg-slate-50 border-none rounded-[2rem] font-bold text-sm focus:ring-4 ring-emerald-50 transition-all"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="p-4 bg-emerald-600 text-white rounded-[2rem] shadow-xl shadow-emerald-900/20 hover:bg-emerald-500 active:scale-95 disabled:bg-slate-300 transition-all"
          >
            <Send size={24} />
          </button>
        </div>
      </form>
    </div>
  );
};

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

/**
 * VerificationBadge component for displaying user verification status.
 * Fixes: "Cannot find name 'VerificationBadge'"
 */
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
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-black ${config.color} ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
      <Icon size={size === 'sm' ? 14 : 16} />
      <span>{config.text}</span>
    </div>
  );
};

// --- Reuseable Components from previous update (simplified) ---

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

const ProfileView = ({ user, isOwn, onEdit, onLogout, onBack, onChat, safe }: any) => {
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
                <h4 className="font-black text-xl mb-8 flex items-center gap-3">تواصل الآن <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div></h4>
                <div className="space-y-4">
                  <button onClick={() => onChat(user)} className="flex items-center justify-center gap-3 w-full bg-emerald-600 py-6 rounded-[2.5rem] font-black text-2xl shadow-xl transition-all active:scale-95 mb-4"><MessageSquare size={24} /> محادثة فورية</button>
                  <a href={`tel:${user.phone}`} className="flex items-center justify-center gap-3 w-full bg-white/10 py-6 rounded-[2.5rem] font-black text-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-95"><Phone size={24} /> اتصــال هاتفـي</a>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-16">
              <section className="animate-in">
                <h4 className="text-3xl font-black text-slate-900 flex items-center gap-4 mb-8"><Award size={32} className="text-emerald-500"/> نبذة تعريفية</h4>
                <div className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 leading-relaxed"><p className="text-slate-600 font-medium text-xl leading-relaxed">{safe(user.bio) || 'لم يتم إضافة نبذة تعريفية بعد.'}</p></div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ... AuthForm, SearchWorkersView, TasksMarketView (keep from previous versions but ensure 'safe' and 'onContact' / 'onChat' work together)

const SearchWorkersView = ({ workers, loading, filters, onFilterChange, onProfile, safe }: any) => {
  const [localWorkers, setLocalWorkers] = useState<User[]>([]);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLocalLoading(true);
      let query = supabase.from('users').select('*').eq('role', UserRole.WORKER);
      if (filters.wilaya) query = query.eq('wilaya', filters.wilaya);
      if (filters.category) query = query.contains('categories', [filters.category]);
      if (filters.query) query = query.or(`first_name.ilike.%${filters.query}%,last_name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`);
      const { data } = await query;
      if (data) setLocalWorkers(data.map((d: any) => ({
        ...d,
        firstName: d.first_name,
        lastName: d.last_name,
        location: { wilaya: d.wilaya, daira: d.daira },
        categories: Array.isArray(d.categories) ? d.categories : [],
        verificationStatus: d.verification_status,
      })));
      setLocalLoading(false);
    };
    fetch();
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-16 animate-in">
      <div className="bg-white p-6 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 mb-12 flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative">
          <input placeholder="ابحث عن حرفي أو خدمة..." className="w-full p-5 pr-14 bg-slate-50 rounded-[2rem] font-bold border-none focus:ring-4 ring-emerald-50 transition-all" value={filters.query} onChange={e => onFilterChange({...filters, query: e.target.value})} />
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
        </div>
        <select className="p-5 bg-slate-50 rounded-[2rem] font-black text-sm border-none focus:ring-4 ring-emerald-50 cursor-pointer" value={filters.wilaya} onChange={e => onFilterChange({...filters, wilaya: e.target.value})}>
          <option value="">كل الولايات</option>
          {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <select className="p-5 bg-slate-50 rounded-[2rem] font-black text-sm border-none focus:ring-4 ring-emerald-50 cursor-pointer" value={filters.category} onChange={e => onFilterChange({...filters, category: e.target.value})}>
          <option value="">كل التخصصات</option>
          {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {localLoading ? <div className="col-span-full py-40 flex justify-center"><div className="loading-spinner"></div></div> : localWorkers.length > 0 ? localWorkers.map((w: any) => (
          <div key={w.id} onClick={() => onProfile(w)} className="bg-white p-8 rounded-[3.5rem] shadow-lg border border-slate-100 cursor-pointer hover:-translate-y-3 hover:shadow-2xl transition-all group overflow-hidden relative">
            <div className="flex items-center gap-6 mb-8 relative z-10">
              <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-20 h-20 rounded-[2rem] object-cover border-4 border-white shadow-md bg-slate-100" />
              <div className="text-right flex-1 truncate">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{safe(w.firstName)} {safe(w.lastName)}</h3>
                <div className="mt-1 flex gap-2"><VerificationBadge status={w.verificationStatus} size="sm" /></div>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-black flex items-center gap-1.5"><MapPin size={16} className="text-emerald-500" /> {safe(w.location.wilaya)}</p>
          </div>
        )) : <div className="col-span-full text-center py-20 text-slate-400">لا توجد نتائج</div>}
      </div>
    </div>
  );
};

const TasksMarketView = ({ currentUser, safe, onContact }: any) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*, users(id, first_name, last_name, avatar, phone)')
        .order('created_at', { ascending: false });
      if (data) setTasks(data.map((t: any) => {
        const u = Array.isArray(t.users) ? t.users[0] : t.users;
        return {
          ...t,
          seeker_id: u?.id,
          seeker_name: `${u?.first_name} ${u?.last_name}`,
          seeker_avatar: u?.avatar,
          seeker_phone: u?.phone,
        };
      }));
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-12 animate-in">
      <div className="mb-16">
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-3 tracking-tighter">سوق المهام <span className="text-emerald-500">DZ</span></h2>
        <p className="text-slate-500 font-bold">تصفح طلبات الزبائن وتواصل معهم مباشرة.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? <div className="col-span-full py-40 flex justify-center"><div className="loading-spinner"></div></div> : tasks.map((t: any) => (
          <div key={t.id} className="bg-white p-8 rounded-[3.5rem] shadow-lg border border-slate-100 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
              <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-xl text-[10px] font-black border border-emerald-100 uppercase">{safe(t.category)}</span>
              <span className="text-emerald-600 font-black text-2xl tracking-tighter">{t.budget > 0 ? `${t.budget} دج` : 'سعر مفتوح'}</span>
            </div>
            <h3 className="text-2xl font-black mb-4 line-clamp-2 leading-tight">{safe(t.title)}</h3>
            <p className="text-slate-500 text-sm line-clamp-3 mb-8 flex-1">{safe(t.description)}</p>
            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <img src={t.seeker_avatar || `https://ui-avatars.com/api/?name=${t.seeker_name}`} className="w-10 h-10 rounded-xl object-cover" />
                <span className="text-xs font-black text-slate-800">{safe(t.seeker_name)}</span>
              </div>
              <button 
                onClick={() => onContact({ id: t.seeker_id, firstName: t.seeker_name, phone: t.seeker_phone })} 
                className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-black text-sm active:scale-95 transition-all hover:bg-emerald-600"
              >
                تواصل الآن
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
        onSuccess({
          ...data,
          firstName: data.first_name,
          lastName: data.last_name,
          location: { wilaya: data.wilaya, daira: data.daira },
        });
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
        onSuccess({
          ...data,
          firstName: data.first_name,
          lastName: data.last_name,
          location: { wilaya: data.wilaya, daira: data.daira },
        });
      }
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in">
      <div className="bg-white w-full max-w-xl p-10 md:p-16 rounded-[4rem] shadow-2xl border border-slate-100 relative overflow-hidden">
        <h2 className="text-4xl font-black mb-12 border-r-[12px] border-emerald-600 pr-6">
          {type === 'login' ? 'مرحباً بك مجدداً 👋' : 'أنشئ حسابك الآن ✨'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="الاسم" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input required placeholder="اللقب" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          )}
          <input required placeholder="رقم الهاتف" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black text-xl tracking-widest" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input required type="password" placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <button disabled={loading} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-emerald-900/30 hover:bg-emerald-500 active:scale-95 transition-all mt-6">
            {loading ? 'جاري التحقق...' : type === 'login' ? 'دخول' : 'إنشاء الحساب'}
          </button>
          <p className="text-center font-bold text-slate-400 mt-6">
            <button type="button" onClick={onSwitch} className="text-emerald-600 font-black hover:underline">{type === 'login' ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ سجل دخولك'}</button>
          </p>
        </form>
      </div>
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
