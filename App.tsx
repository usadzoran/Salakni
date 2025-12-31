
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, Message, Notification, Advertisement, SupportRequest } from './types.ts';
import { SERVICE_CATEGORIES, WILAYAS } from './constants.tsx';
import { supabase } from './lib/supabase.ts';

// --- أنماط مخصصة ---
const GlobalStyles = () => (
  <style>{`
    @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
    .animate-float { animation: float 5s ease-in-out infinite; }
    .arabic-text { font-family: 'Tajawal', sans-serif; }
    .loading-spinner { border: 4px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
    .admin-tab-active { border-bottom: 3px solid #10b981; color: #10b981; transform: translateY(-2px); }
    .hero-bg-overlay { background: linear-gradient(to bottom, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.7) 50%, rgba(15, 23, 42, 0.95) 100%); }
    .chat-bubble-me { background: #10b981; color: white; border-radius: 1.2rem 1.2rem 0 1.2rem; }
    .chat-bubble-them { background: #f3f4f6; color: #1f2937; border-radius: 1.2rem 1.2rem 1.2rem 0; }
    
    /* Responsive Table Wrapper */
    .table-container { -webkit-overflow-scrolling: touch; }
    
    @media (max-width: 640px) {
      .hero-title { font-size: 2.25rem !important; line-height: 1.2 !important; }
      .card-p { padding: 1.5rem !important; border-radius: 1.5rem !important; }
      .section-p { padding: 1.5rem !important; border-radius: 2rem !important; }
    }
  `}</style>
);

const REQ_IMAGE = "https://st3.depositphotos.com/9744818/17392/i/950/depositphotos_173923044-stock-photo-woman-giving-money-man-corrupted.jpg";

const Logo: React.FC<{ size?: 'sm' | 'lg', onClick?: () => void, inverse?: boolean }> = ({ size = 'sm', onClick, inverse }) => (
  <div onClick={onClick} className={`flex items-center gap-2 md:gap-3 group cursor-pointer transition-all ${size === 'lg' ? 'scale-100 md:scale-110' : ''}`}>
    <div className={`relative ${size === 'lg' ? 'w-14 h-14 md:w-16 md:h-16' : 'w-10 h-10'} flex-shrink-0`}>
      <div className={`absolute inset-0 bg-gradient-to-tr from-emerald-600 via-teal-500 to-yellow-400 rounded-xl rotate-3 group-hover:rotate-12 transition-transform shadow-xl`}></div>
      <div className="absolute inset-0 flex items-center justify-center text-white font-black z-10">S</div>
    </div>
    <div className="flex flex-col items-start leading-none">
      <div className="flex items-baseline gap-1">
        <span className={`${size === 'lg' ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl'} font-black ${inverse ? 'text-white' : 'text-emerald-950'}`}>Salakni</span>
        <span className="text-yellow-500 font-bold text-xs md:text-sm">سلكني</span>
      </div>
    </div>
  </div>
);

// --- نظام الرسائل المتجاوب ---
const ChatView: React.FC<{ currentUser: User, targetUser?: User | null }> = ({ currentUser, targetUser }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<User | null>(targetUser || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showConvList, setShowConvList] = useState(!targetUser);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    const { data } = await supabase.rpc('get_conversations', { user_uuid: currentUser.id });
    setConversations(data || []);
  };

  const fetchMessages = async (partnerId: string) => {
    const { data } = await supabase.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  useEffect(() => {
    fetchConversations();
    const subscription = supabase.channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new as Message;
        if ((msg.sender_id === activeChat?.id || msg.receiver_id === activeChat?.id)) {
          setMessages(prev => [...prev, msg]);
        }
        fetchConversations();
      })
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, [activeChat]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      if (window.innerWidth < 768) setShowConvList(false);
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    const msg = { sender_id: currentUser.id, receiver_id: activeChat.id, content: newMessage.trim() };
    await supabase.from('messages').insert([msg]);
    setNewMessage('');
  };

  return (
    <div className="max-w-6xl mx-auto my-4 md:my-10 h-[85vh] md:h-[80vh] bg-white rounded-3xl md:rounded-[3rem] shadow-2xl overflow-hidden border flex flex-col md:flex-row-reverse">
      {/* القائمة الجانبية (تظهر بالكامل في الحاسوب وتتبادل مع الدردشة في الهاتف) */}
      <div className={`${showConvList ? 'flex' : 'hidden md:flex'} w-full md:w-1/3 border-l bg-gray-50 flex-col h-full`}>
        <div className="p-4 md:p-6 border-b bg-white flex justify-between items-center flex-row-reverse">
          <h2 className="text-lg md:text-xl font-black">المحادثات</h2>
          {activeChat && <button className="md:hidden text-emerald-600 font-bold" onClick={() => setShowConvList(false)}>رجوع للدردشة</button>}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.map((conv: any) => (
            <div key={conv.id} onClick={() => setActiveChat(conv)} className={`p-4 flex items-center gap-4 flex-row-reverse cursor-pointer hover:bg-emerald-50 transition-all ${activeChat?.id === conv.id ? 'bg-emerald-100' : ''}`}>
              <img src={conv.avatar || `https://ui-avatars.com/api/?name=${conv.first_name}`} className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover" />
              <div className="text-right flex-1">
                <p className="font-black text-sm">{conv.first_name} {conv.last_name}</p>
                <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
              </div>
              {conv.unread_count > 0 && <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">{conv.unread_count}</span>}
            </div>
          ))}
          {conversations.length === 0 && <p className="text-center py-10 text-gray-400 font-bold">لا توجد محادثات.</p>}
        </div>
      </div>

      {/* منطقة الدردشة */}
      <div className={`${!showConvList ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white h-full`}>
        {activeChat ? (
          <>
            <div className="p-4 md:p-6 border-b flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-3 md:gap-4 flex-row-reverse">
                <img src={activeChat.avatar || `https://ui-avatars.com/api/?name=${activeChat.firstName}`} className="w-8 h-8 md:w-10 md:h-10 rounded-xl" />
                <div className="text-right">
                  <p className="font-black text-sm md:text-base">{activeChat.firstName} {activeChat.lastName}</p>
                  <p className="text-[10px] text-emerald-500 font-bold">نشط الآن</p>
                </div>
              </div>
              <button className="md:hidden text-gray-500 font-bold text-xs" onClick={() => setShowConvList(true)}>كل المحادثات</button>
            </div>
            <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_id === currentUser.id ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] p-3 md:p-4 text-sm font-medium ${m.sender_id === currentUser.id ? 'chat-bubble-me' : 'chat-bubble-them'}`}>
                    {m.content}
                    <p className="text-[8px] mt-1 opacity-70 text-left">{new Date(m.created_at).toLocaleTimeString('ar-DZ')}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-4 md:p-6 border-t bg-gray-50 flex gap-2 md:gap-4">
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="رسالتك..." className="flex-1 p-3 md:p-4 bg-white border rounded-xl md:rounded-2xl outline-none focus:border-emerald-500 font-medium text-sm" />
              <button type="submit" className="bg-emerald-600 text-white px-4 md:px-8 rounded-xl md:rounded-2xl font-black hover:bg-emerald-500 transition-all text-sm">إرسال</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 font-bold px-10 text-center">اختر محادثة من القائمة الجانبية لبدء المراسلة.</div>
        )}
      </div>
    </div>
  );
};

// --- لوحة الآدمن المتجاوبة ---
const AdminDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'verification' | 'users' | 'ads' | 'support'>('stats');
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalWorkers: 0, totalSeekers: 0, pendingVerifications: 0, openSupport: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedSupport, setSelectedSupport] = useState<SupportRequest | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { count: workers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', UserRole.WORKER);
    const { count: seekers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', UserRole.SEEKER);
    const { count: pending } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', UserRole.WORKER).eq('is_verified', false);
    const { count: support } = await supabase.from('support_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    
    setStats({ totalWorkers: workers || 0, totalSeekers: seekers || 0, pendingVerifications: pending || 0, openSupport: support || 0 });

    const tabQueries: any = {
      users: () => supabase.from('users').select('*').order('created_at', { ascending: false }),
      verification: () => supabase.from('users').select('*').eq('role', UserRole.WORKER).eq('is_verified', false),
      ads: () => supabase.from('advertisements').select('*').order('created_at', { ascending: false }),
      support: () => supabase.from('support_requests').select('*').order('created_at', { ascending: false })
    };

    if (tabQueries[activeTab]) {
      const { data } = await tabQueries[activeTab]();
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-12 text-right">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 md:mb-12 border-b border-white/10 pb-6 flex-row-reverse">
          <div className="flex items-center gap-2 md:gap-4">
            <Logo size="lg" inverse />
          </div>
          <button onClick={onExit} className="bg-red-600/20 text-red-500 px-4 md:px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition-all text-xs md:text-base">خروج</button>
        </header>
        
        <nav className="flex gap-4 md:gap-8 mb-8 md:mb-12 border-b border-white/5 flex-row-reverse overflow-x-auto whitespace-nowrap pb-2 custom-scrollbar no-scrollbar">
          <button onClick={() => setActiveTab('stats')} className={`pb-3 text-sm md:text-base font-black transition-all ${activeTab === 'stats' ? 'admin-tab-active' : 'text-slate-500'}`}>الإحصائيات</button>
          <button onClick={() => setActiveTab('verification')} className={`pb-3 text-sm md:text-base font-black transition-all ${activeTab === 'verification' ? 'admin-tab-active' : 'text-slate-500'}`}>التوثيق</button>
          <button onClick={() => setActiveTab('support')} className={`pb-3 text-sm md:text-base font-black transition-all ${activeTab === 'support' ? 'admin-tab-active' : 'text-slate-500'}`}>الدعم ({stats.openSupport})</button>
          <button onClick={() => setActiveTab('users')} className={`pb-3 text-sm md:text-base font-black transition-all ${activeTab === 'users' ? 'admin-tab-active' : 'text-slate-500'}`}>المستخدمين</button>
          <button onClick={() => setActiveTab('ads')} className={`pb-3 text-sm md:text-base font-black transition-all ${activeTab === 'ads' ? 'admin-tab-active' : 'text-slate-500'}`}>الإعلانات</button>
        </nav>
        
        {loading ? <div className="flex justify-center py-20"><div className="loading-spinner"></div></div> : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'stats' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
                <div className="bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5">
                  <p className="text-slate-400 font-bold mb-1 text-xs md:text-sm">الحرفيين</p>
                  <p className="text-2xl md:text-4xl font-black text-emerald-500">{stats.totalWorkers}</p>
                </div>
                <div className="bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5">
                  <p className="text-slate-400 font-bold mb-1 text-xs md:text-sm">الزبائن</p>
                  <p className="text-2xl md:text-4xl font-black text-blue-500">{stats.totalSeekers}</p>
                </div>
                <div className="bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-yellow-500/10">
                  <p className="text-slate-400 font-bold mb-1 text-xs md:text-sm">التوثيق</p>
                  <p className="text-2xl md:text-4xl font-black text-yellow-500">{stats.pendingVerifications}</p>
                </div>
                <div className="bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-red-500/10">
                  <p className="text-slate-400 font-bold mb-1 text-xs md:text-sm">الشكاوي</p>
                  <p className="text-2xl md:text-4xl font-black text-red-500">{stats.openSupport}</p>
                </div>
              </div>
            )}

            {activeTab !== 'stats' && (
              <div className="bg-slate-900 rounded-2xl md:rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl overflow-x-auto table-container">
                <table className="w-full text-right min-w-[700px]">
                  <thead className="bg-white/5 text-slate-400 text-[10px] md:text-xs">
                    <tr>
                      <th className="p-4 md:p-6">المستخدم / العنصر</th>
                      <th className="p-4 md:p-6">التفاصيل</th>
                      <th className="p-4 md:p-6">الحالة</th>
                      <th className="p-4 md:p-6 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 md:p-6">
                           <div className="flex items-center gap-3 flex-row-reverse">
                             <img src={item.avatar || item.image_data || `https://ui-avatars.com/api/?name=${item.first_name || item.user_name || 'Item'}`} className="w-10 h-10 rounded-lg object-cover" />
                             <div className="text-right">
                               <p className="font-black text-slate-200 text-sm">{item.first_name || item.user_name || item.title}</p>
                               <p className="text-[10px] text-slate-500">{item.phone || item.user_phone || item.placement}</p>
                             </div>
                           </div>
                        </td>
                        <td className="p-4 md:p-6 max-w-xs">
                          <p className="text-xs text-slate-400 line-clamp-1">{item.bio || item.description || item.category || '---'}</p>
                        </td>
                        <td className="p-4 md:p-6">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-black ${item.is_verified || item.status === 'resolved' || item.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {item.is_verified ? 'موثق' : (item.status === 'pending' ? 'مفتوح' : (item.is_active ? 'نشط' : 'معطل'))}
                          </span>
                        </td>
                        <td className="p-4 md:p-6 text-center">
                          <button onClick={() => { activeTab === 'support' ? setSelectedSupport(item) : setSelectedUser(item) }} className="text-emerald-500 text-xs font-bold">معاينة</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const getInitialUser = () => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  };

  const getInitialView = (user: User | null): AppState['view'] => {
    const hash = window.location.hash.replace('#/', '');
    if (hash === 'admin-portal') return 'admin-login';
    if (hash === 'support' && user) return 'support';
    if (hash === 'messages' && user) return 'messages';
    if (hash === 'search') return 'search';
    if (hash === 'login') return 'login';
    if (hash === 'register') return 'register';
    if (hash === 'profile' && user) return 'profile';
    if (hash === 'admin' && user?.role === UserRole.ADMIN) return 'admin';
    return user?.role === UserRole.ADMIN ? 'admin' : 'landing';
  };

  const [state, setState] = useState<AppState>(() => {
    const user = getInitialUser();
    return { currentUser: user, workers: [], view: getInitialView(user) };
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifList, setShowNotifList] = useState(false);
  const [chatTarget, setChatTarget] = useState<User | null>(null);

  /**
   * Fix: Add startChat function to navigate to messages and set the recipient.
   */
  const startChat = (user: any) => {
    if (!state.currentUser) {
      setView('login');
      return;
    }
    setChatTarget({
      id: user.id,
      firstName: user.first_name || user.firstName || 'حرفي',
      lastName: user.last_name || user.lastName || '',
      phone: user.phone || '',
      role: user.role || UserRole.WORKER,
      location: user.location || { wilaya: '', daira: '' },
      avatar: user.avatar
    } as User);
    setView('messages');
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '');
      const user = getInitialUser();
      const viewMap: any = {
        'support': 'support',
        'messages': 'messages',
        'search': 'search',
        'login': 'login',
        'register': 'register',
        'profile': 'profile',
        'admin': user?.role === UserRole.ADMIN ? 'admin' : null
      };
      
      const newView = viewMap[hash] || (user?.role === UserRole.ADMIN ? 'admin' : 'landing');
      setState(prev => ({ ...prev, view: newView, currentUser: user }));
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const fetchNotifications = async () => {
    if (!state.currentUser) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', state.currentUser.id).order('created_at', { ascending: false });
    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.is_read).length || 0);
  };

  useEffect(() => {
    if (state.currentUser) {
      fetchNotifications();
      const sub = supabase.channel('notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${state.currentUser.id}` }, fetchNotifications)
        .subscribe();
      return () => { sub.unsubscribe(); };
    }
  }, [state.currentUser]);

  const setView = (view: AppState['view']) => {
    window.location.hash = view === 'landing' ? '' : `#/${view}`;
    setState(prev => ({ ...prev, view }));
  };

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setState(prev => ({ ...prev, currentUser: user }));
    setView(user.role === UserRole.ADMIN ? 'admin' : 'profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.hash = '';
    setState({ currentUser: null, workers: [], view: 'landing' });
  };

  const isManagementView = state.view === 'admin' || state.view === 'admin-login';

  return (
    <div className={`min-h-screen flex flex-col arabic-text transition-colors duration-700 ${isManagementView ? 'bg-slate-950' : 'bg-gray-50'}`} dir="rtl">
      <GlobalStyles />
      <nav className={`h-20 md:h-24 flex items-center px-4 md:px-6 sticky top-0 z-50 backdrop-blur-xl border-b transition-all ${isManagementView ? 'bg-slate-900/90 border-white/5' : 'bg-white/90 border-gray-100 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} inverse={isManagementView} />
          {state.view !== 'admin' && (
            <div className="flex items-center gap-2 md:gap-8">
              <button onClick={() => setView('landing')} className={`hidden sm:block ${state.view === 'landing' ? 'text-emerald-600 font-black' : (isManagementView ? 'text-slate-400' : 'text-slate-500')} font-bold text-sm md:text-base`}>الرئيسية</button>
              <button onClick={() => setView('search')} className={`${state.view === 'search' ? 'text-emerald-600 font-black' : (isManagementView ? 'text-slate-400' : 'text-slate-500')} font-bold text-xs md:text-base`}>الحرفيين</button>
              
              {state.currentUser && (
                <div className="flex items-center gap-3 md:gap-4 relative">
                  <button onClick={() => setView('messages')} className="p-2 text-slate-500 hover:text-emerald-600 relative">
                    💬 {unreadCount > 0 && <span className="absolute top-1 right-1 bg-emerald-500 text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center font-bold">!</span>}
                  </button>
                  <button onClick={() => setShowNotifList(!showNotifList)} className="p-2 relative text-slate-500 hover:text-emerald-600">
                    🔔 {unreadCount > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">{unreadCount}</span>}
                  </button>
                  
                  {showNotifList && (
                    <div className="absolute top-12 left-0 w-64 md:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                      <div className="p-3 md:p-4 border-b bg-gray-50 flex justify-between items-center">
                        <span className="font-black text-xs md:text-sm">الإشعارات</span>
                        <button onClick={async () => { await supabase.from('notifications').update({ is_read: true }).eq('user_id', state.currentUser!.id); fetchNotifications(); }} className="text-[9px] md:text-[10px] text-emerald-600 font-bold">تحديد كقروء</button>
                      </div>
                      <div className="max-h-64 md:max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.map(n => (
                          <div key={n.id} className={`p-3 md:p-4 border-b text-right hover:bg-gray-50 transition-all ${!n.is_read ? 'bg-emerald-50' : ''}`}>
                            <p className="font-black text-[10px] md:text-xs">{n.title}</p>
                            <p className="text-[9px] md:text-[10px] text-gray-500 mt-1">{n.content}</p>
                          </div>
                        ))}
                        {notifications.length === 0 && <div className="p-10 text-center text-gray-400 font-bold text-xs">لا توجد إشعارات.</div>}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {!state.currentUser ? (
                <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl font-black shadow-lg text-xs md:text-base">دخول</button>
              ) : (
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('profile')}>
                  <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 border-emerald-500/20" />
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && (
          <div className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
            <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${REQ_IMAGE})` }}></div>
            <div className="absolute inset-0 hero-bg-overlay"></div>
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-16 w-full text-center">
              <div className="scale-75 md:scale-100 flex justify-center mb-6 md:mb-10"><Logo size="lg" inverse /></div>
              <h1 className="hero-title text-4xl md:text-8xl font-black text-white mt-6 md:mt-10 tracking-tight">ريح بالك، <span className="text-emerald-400">سَلّكني</span> يسلكها</h1>
              <p className="text-lg md:text-3xl text-slate-300 mt-4 md:mt-6 font-medium max-w-3xl mx-auto leading-relaxed">المنصة الجزائرية رقم #1 لربط خيرة الحرفيين بالزبائن بضمان وثقة.</p>
              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 mt-10 md:mt-16 justify-center px-4">
                <button onClick={() => setView('search')} className="w-full sm:w-auto bg-emerald-600 px-10 md:px-16 py-4 md:py-5 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl text-white shadow-xl hover:bg-emerald-500 transition-all">ابحث عن حرفي 🔍</button>
                <button onClick={() => setView('register')} className="w-full sm:w-auto bg-white/10 backdrop-blur-md px-10 md:px-16 py-4 md:py-5 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl text-white border border-white/20">سجل كحرفي 🛠️</button>
              </div>
            </div>
          </div>
        )}
        
        {state.view === 'search' && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 text-right">
            <div className="section-p bg-emerald-900/5 p-6 md:p-12 rounded-3xl md:rounded-[3rem] mb-8 md:mb-12 border border-emerald-100 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-black mb-6 md:mb-8">ابحث عن الحرفي المثالي 🔍</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                <input placeholder="عن ماذا تبحث؟ (مثلاً: كهربائي)" className="md:col-span-2 p-4 md:p-5 bg-white border-2 border-emerald-50 rounded-xl md:rounded-2xl outline-none text-sm md:text-base font-bold" />
                <select className="p-4 md:p-5 bg-white border-2 border-emerald-50 rounded-xl md:rounded-2xl outline-none text-sm md:text-base font-bold">
                  <option value="">كل الولايات</option>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <select className="p-4 md:p-5 bg-white border-2 border-emerald-50 rounded-xl md:rounded-2xl outline-none text-sm md:text-base font-bold">
                  <option value="">كل التخصصات</option>
                  {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="card-p bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 group hover:-translate-y-1 transition-all">
                  <div className="flex gap-4 items-center mb-4 md:mb-6 flex-row-reverse">
                    <img src={`https://ui-avatars.com/api/?name=Worker${i}&background=random`} className="w-14 h-14 md:w-16 md:h-16 rounded-xl border-2 border-emerald-50 object-cover" />
                    <div className="text-right flex-1">
                      <h3 className="text-base md:text-lg font-black">حرفي محترف {i}</h3>
                      <span className="text-emerald-600 font-bold text-[10px] md:text-xs bg-emerald-50 px-2 py-1 rounded-lg">سباكة / ترصيص</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs md:text-sm mb-4 md:mb-6 flex-1 leading-relaxed">خبرة سنوات في تقديم خدمات عالية الجودة وبضمان تام لجميع زبائننا الكرام.</p>
                  <div className="flex justify-between items-center flex-row-reverse pt-4 border-t border-gray-50">
                    <span className="text-gray-500 font-bold text-[10px] md:text-xs">📍 الجزائر العاصمة</span>
                    <button onClick={() => startChat({ id: `worker-${i}`, first_name: 'حرفي', last_name: i.toString() })} className="bg-slate-900 text-white px-4 md:px-6 py-2 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs hover:bg-emerald-600 transition-all">تواصل</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.view === 'messages' && state.currentUser && <ChatView currentUser={state.currentUser} targetUser={chatTarget} />}
        
        {state.view === 'profile' && state.currentUser && (
          <div className="max-w-4xl mx-auto my-8 md:my-20 px-4 md:px-6">
            <div className="section-p bg-white p-8 md:p-16 rounded-3xl md:rounded-[3rem] shadow-2xl text-center border border-gray-100">
              <div className="relative inline-block mb-6 md:mb-8">
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-28 h-28 md:w-40 md:h-40 rounded-3xl md:rounded-[3rem] border-4 border-emerald-50 shadow-xl object-cover" />
                {state.currentUser.isVerified && <span className="absolute bottom-2 right-2 bg-emerald-500 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-sm md:text-xl">✓</span>}
              </div>
              <h2 className="text-2xl md:text-5xl font-black mb-3 md:mb-4">أهلاً، {state.currentUser.firstName} ✨</h2>
              <p className="text-slate-500 text-base md:text-xl mb-8 md:mb-12 font-medium">حساب {state.currentUser.role === UserRole.WORKER ? 'حرفي' : 'زبون'} - ولاية {state.currentUser.location.wilaya}</p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <button className="bg-slate-900 text-white px-8 md:px-12 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-lg shadow-xl">تعديل الملف ⚙️</button>
                <button onClick={handleLogout} className="bg-red-50 text-red-500 px-8 md:px-12 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-lg border border-red-100">تسجيل الخروج</button>
              </div>
            </div>
          </div>
        )}

        {(state.view === 'login' || state.view === 'register' || state.view === 'admin-login') && <AuthForm type={state.view === 'admin-login' ? 'admin' : state.view as any} onSuccess={handleLoginSuccess} />}
        {state.view === 'admin' && state.currentUser?.role === UserRole.ADMIN && <AdminDashboard onExit={handleLogout} />}
        {state.view === 'support' && state.currentUser && <SupportView currentUser={state.currentUser} />}
      </main>

      {!isManagementView && (
        <footer className="bg-slate-900 text-white py-10 md:py-16 px-6 text-center mt-auto border-t border-white/5">
          <div className="flex justify-center mb-4 md:mb-6"><Logo size="sm" inverse /></div>
          <p className="text-slate-400 text-xs md:text-sm font-medium">سلكني - المنصة الأولى لربط خيرة الحرفيين بالزبائن في الجزائر 🇩🇿</p>
          <div className="border-t border-white/5 mt-8 md:mt-12 pt-6 md:pt-10 text-slate-500 text-[10px] md:text-xs font-bold">جميع الحقوق محفوظة &copy; {new Date().getFullYear()} سلكني</div>
        </footer>
      )}
    </div>
  );
}

const AuthForm: React.FC<{ type: 'login' | 'register' | 'admin', onSuccess: (user: User) => void }> = ({ type, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', password: '', role: UserRole.SEEKER as UserRole, wilaya: WILAYAS[0] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'admin') {
        if (formData.phone === '0777117663' && formData.password === 'vampirewahab31') {
          const adminUser: User = { id: 'admin-id', firstName: 'عبد الوهاب', lastName: 'المدير', phone: formData.phone, role: UserRole.ADMIN, location: { wilaya: 'الجزائر', daira: 'الجزائر' }, isVerified: true };
          onSuccess(adminUser);
        } else { alert("بيانات الدخول غير صحيحة"); }
      } else if (type === 'login') {
        const { data } = await supabase.from('users').select('*').eq('phone', formData.phone).eq('password', formData.password).single();
        if (data) onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: data.daira }, isVerified: data.is_verified });
        else alert("فشل الدخول");
      } else {
        const { data } = await supabase.from('users').insert([{ first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone, password: formData.password, role: formData.role, wilaya: formData.wilaya, is_verified: formData.role === UserRole.SEEKER }]).select().single();
        if (data) onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: data.daira }, isVerified: data.is_verified });
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="bg-white p-6 md:p-12 rounded-3xl md:rounded-[3rem] shadow-2xl w-full max-w-md text-right border border-gray-100">
        <h2 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 text-slate-900">{type === 'admin' ? 'دخول الإدارة 🔒' : type === 'login' ? 'مرحباً بعودتك 👋' : 'انضم إلى سلكني ✨'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {type === 'register' && (
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <input placeholder="الاسم" required className="p-3 md:p-4 bg-gray-50 border rounded-xl md:rounded-2xl outline-none text-sm font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input placeholder="اللقب" required className="p-3 md:p-4 bg-gray-50 border rounded-xl md:rounded-2xl outline-none text-sm font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          )}
          <input placeholder="رقم الهاتف" required className="w-full p-3 md:p-4 bg-gray-50 border rounded-xl md:rounded-2xl outline-none font-bold font-mono text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input type="password" placeholder="كلمة المرور" required className="w-full p-3 md:p-4 bg-gray-50 border rounded-xl md:rounded-2xl outline-none font-bold text-sm" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          {type === 'register' && (
            <>
              <select className="w-full p-3 md:p-4 bg-gray-50 border rounded-xl md:rounded-2xl outline-none font-bold text-sm" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                <option value={UserRole.SEEKER}>أبحث عن حرفي</option>
                <option value={UserRole.WORKER}>أنا حرفي (أعرض خدماتي)</option>
              </select>
              <select className="w-full p-3 md:p-4 bg-gray-50 border rounded-xl md:rounded-2xl outline-none font-bold text-sm" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </>
          )}
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl hover:bg-emerald-500 transition-all shadow-lg">{loading ? 'جاري التحقق...' : 'تأكيد'}</button>
        </form>
      </div>
    </div>
  );
};

const SupportView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('support_requests').insert([{ user_id: currentUser.id, user_name: `${currentUser.firstName} ${currentUser.lastName}`, user_phone: currentUser.phone, description, image_data: image, status: 'pending' }]);
      if (error) throw error;
      setSuccess(true);
      setDescription('');
      setImage(null);
    } catch (err) { alert("فشل الإرسال"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 md:my-12 px-4 md:px-6">
      <div className="section-p bg-white p-6 md:p-12 rounded-3xl md:rounded-[3rem] shadow-2xl border border-gray-100 text-right">
        <h2 className="text-2xl md:text-3xl font-black mb-4">الدعم الفني والشكاوي 🛠️</h2>
        <p className="text-slate-500 mb-6 md:mb-8 font-medium text-sm md:text-base">يرجى توضيح المشكلة مع إرفاق صورة إن وجد لنسرع في حل طلبك.</p>
        {success ? (
          <div className="bg-emerald-50 p-6 md:p-8 rounded-2xl text-center border border-emerald-100">
            <p className="text-emerald-700 font-black mb-4">تم إرسال طلبك بنجاح ✅</p>
            <button onClick={() => setSuccess(false)} className="text-emerald-600 text-xs font-bold underline">إرسال طلب آخر</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <textarea required className="w-full h-40 md:h-48 p-4 md:p-5 bg-gray-50 border rounded-2xl outline-none text-sm font-medium" placeholder="وصف المشكلة هنا..." value={description} onChange={e => setDescription(e.target.value)} />
            <input type="file" accept="image/*" className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setImage(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />
            <button type="submit" disabled={loading} className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl bg-emerald-600 text-white font-black text-base md:text-xl shadow-xl">{loading ? 'جاري الإرسال...' : 'إرسال الشكوى'}</button>
          </form>
        )}
      </div>
    </div>
  );
};
