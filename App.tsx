
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, Message, Notification, Advertisement, SupportRequest } from './types.ts';
import { SERVICE_CATEGORIES, WILAYAS, DAIRAS } from './constants.tsx';
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
    .table-container { -webkit-overflow-scrolling: touch; }
    @media (max-width: 640px) {
      .hero-title { font-size: 2.25rem !important; line-height: 1.2 !important; }
      .card-p { padding: 1.5rem !important; border-radius: 1.5rem !important; }
      .section-p { padding: 1.5rem !important; border-radius: 2rem !important; }
    }
  `}</style>
);

const REQ_IMAGE = "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000";

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

// --- مكون اختيار نوع التسجيل ---
const RegistrationChoice: React.FC<{ onChoice: (role: UserRole) => void }> = ({ onChoice }) => (
  <div className="max-w-4xl mx-auto my-12 md:my-20 px-4">
    <h2 className="text-3xl md:text-5xl font-black text-center mb-12 text-slate-900">كيف تريد الانضمام إلينا؟ ✨</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div 
        onClick={() => onChoice(UserRole.WORKER)}
        className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-transparent hover:border-emerald-500 cursor-pointer transition-all group text-center"
      >
        <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">🛠️</div>
        <h3 className="text-2xl font-black mb-4">أنا حرفي محترف</h3>
        <p className="text-slate-500 font-medium">أريد عرض خدماتي، بناء سمعتي، والوصول لمئات الزبائن في ولايتي.</p>
        <button className="mt-8 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black w-full">سجل كحرفي</button>
      </div>
      <div 
        onClick={() => onChoice(UserRole.SEEKER)}
        className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-transparent hover:border-blue-500 cursor-pointer transition-all group text-center"
      >
        <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">🔍</div>
        <h3 className="text-2xl font-black mb-4">أنا أبحث عن حرفي</h3>
        <p className="text-slate-500 font-medium">أبحث عن أفضل المهنيين الموثوقين في منطقتي لإنجاز أعمالي بكل سهولة.</p>
        <button className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black w-full">سجل كزبون</button>
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
        </div>
      </div>
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
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-4 md:p-6 border-t bg-gray-50 flex gap-2 md:gap-4">
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="رسالتك..." className="flex-1 p-3 md:p-4 bg-white border rounded-xl md:rounded-2xl outline-none" />
              <button type="submit" className="bg-emerald-600 text-white px-4 md:px-8 rounded-xl md:rounded-2xl font-black">إرسال</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 font-bold">اختر محادثة لبدء المراسلة.</div>
        )}
      </div>
    </div>
  );
};

// --- لوحة الآدمن ---
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
    const { data } = await supabase.from(activeTab === 'support' ? 'support_requests' : activeTab === 'ads' ? 'advertisements' : 'users').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-12 text-right">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 md:mb-12 border-b border-white/10 pb-6 flex-row-reverse">
          <Logo size="lg" inverse />
          <button onClick={onExit} className="bg-red-600/20 text-red-500 px-4 md:px-6 py-2 rounded-xl font-bold">خروج</button>
        </header>
        <nav className="flex gap-4 md:gap-8 mb-8 md:mb-12 border-b border-white/5 flex-row-reverse overflow-x-auto whitespace-nowrap pb-2">
          {['stats', 'verification', 'support', 'users', 'ads'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-3 text-sm md:text-base font-black transition-all ${activeTab === tab ? 'admin-tab-active' : 'text-slate-500'}`}>
              {tab === 'stats' ? 'الإحصائيات' : tab === 'verification' ? 'التوثيق' : tab === 'support' ? `الدعم (${stats.openSupport})` : tab === 'users' ? 'المستخدمين' : 'الإعلانات'}
            </button>
          ))}
        </nav>
        {loading ? <div className="loading-spinner mx-auto"></div> : (
          <div className="bg-slate-900 rounded-3xl border border-white/5 overflow-x-auto p-4">
             {/* جداول البيانات هنا كما في النسخة السابقة */}
             <p className="text-center py-10">جاري عرض بيانات {activeTab}...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const getInitialUser = () => JSON.parse(localStorage.getItem('user') || 'null');
  const [state, setState] = useState<AppState>(() => ({ currentUser: getInitialUser(), workers: [], view: 'landing' }));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifList, setShowNotifList] = useState(false);
  const [chatTarget, setChatTarget] = useState<User | null>(null);
  const [registerRole, setRegisterRole] = useState<UserRole | null>(null);

  const setView = (view: AppState['view']) => setState(prev => ({ ...prev, view }));

  const startChat = (user: any) => {
    if (!state.currentUser) return setView('login');
    setChatTarget(user);
    setView('messages');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setState({ currentUser: null, workers: [], view: 'landing' });
  };

  const isManagementView = state.view === 'admin' || state.view === 'admin-login';

  return (
    <div className={`min-h-screen flex flex-col arabic-text transition-colors duration-700 ${isManagementView ? 'bg-slate-950' : 'bg-gray-50'}`} dir="rtl">
      <GlobalStyles />
      <nav className="h-20 md:h-24 flex items-center px-4 md:px-6 sticky top-0 z-50 backdrop-blur-xl border-b bg-white/90 border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} />
          <div className="flex items-center gap-4">
            <button onClick={() => setView('search')} className="font-bold text-slate-500 hover:text-emerald-600">الحرفيين</button>
            {state.currentUser ? (
              <div className="flex items-center gap-4">
                <button onClick={() => setView('messages')} className="text-slate-500">💬</button>
                <div onClick={() => setView('profile')} className="w-10 h-10 rounded-xl bg-emerald-100 cursor-pointer overflow-hidden border-2 border-white shadow-sm">
                   <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black">دخول</button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && (
          <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950">
            <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${REQ_IMAGE})` }}></div>
            <div className="absolute inset-0 hero-bg-overlay"></div>
            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
              <h1 className="hero-title text-4xl md:text-8xl font-black text-white leading-tight">ريح بالك، <span className="text-emerald-400">سَلّكني</span> يسلكها</h1>
              <p className="text-lg md:text-3xl text-slate-300 mt-6 font-medium">المنصة الأولى في الجزائر لربط الحرفيين بالزبائن.</p>
              <div className="flex flex-col sm:flex-row gap-6 mt-12 justify-center">
                <button onClick={() => setView('search')} className="bg-emerald-600 px-12 py-4 rounded-2xl font-black text-white text-xl shadow-xl">اطلب خدمة 🔍</button>
                <button onClick={() => { setRegisterRole(null); setView('register'); }} className="bg-white/10 backdrop-blur-md px-12 py-4 rounded-2xl font-black text-white text-xl border border-white/20">انضم إلينا 🛠️</button>
              </div>
            </div>
          </div>
        )}

        {state.view === 'register' && !registerRole && <RegistrationChoice onChoice={(role) => setRegisterRole(role)} />}
        
        {state.view === 'register' && registerRole === UserRole.WORKER && (
          <WorkerRegistrationForm onSuccess={(user) => { 
            localStorage.setItem('user', JSON.stringify(user)); 
            setState(prev => ({ ...prev, currentUser: user, view: 'profile' })); 
          }} onBack={() => setRegisterRole(null)} />
        )}

        {state.view === 'register' && registerRole === UserRole.SEEKER && (
          <SeekerRegistrationForm onSuccess={(user) => { 
            localStorage.setItem('user', JSON.stringify(user)); 
            setState(prev => ({ ...prev, currentUser: user, view: 'profile' })); 
          }} onBack={() => setRegisterRole(null)} />
        )}

        {state.view === 'search' && (
          <div className="max-w-7xl mx-auto px-4 py-12 text-right">
            <h2 className="text-3xl font-black mb-8">ابحث عن الحرفي المثالي 🔍</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                    <div className="flex gap-4 items-center mb-6 flex-row-reverse">
                       <img src={`https://ui-avatars.com/api/?name=W${i}`} className="w-16 h-16 rounded-2xl" />
                       <div className="text-right flex-1">
                          <h3 className="font-black">حرفي {i}</h3>
                          <span className="text-emerald-600 text-xs font-bold">كهرباء</span>
                       </div>
                    </div>
                    <button onClick={() => startChat({ id: i })} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black">تواصل الآن</button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {state.view === 'messages' && state.currentUser && <ChatView currentUser={state.currentUser} targetUser={chatTarget} />}
        {state.view === 'login' && <AuthForm type="login" onSuccess={(u) => { localStorage.setItem('user', JSON.stringify(u)); setState(prev => ({ ...prev, currentUser: u, view: u.role === UserRole.ADMIN ? 'admin' : 'profile' })); }} />}
        {state.view === 'profile' && state.currentUser && <ProfileView user={state.currentUser} onLogout={handleLogout} />}
        {state.view === 'admin' && <AdminDashboard onExit={handleLogout} />}
      </main>

      <footer className="bg-slate-900 text-white py-12 text-center mt-auto">
        <Logo inverse />
        <p className="mt-4 text-slate-500 font-bold">سلكني - منصتكم الموثوقة للحرف والمهن 🇩🇿</p>
      </footer>
    </div>
  );
}

// --- لوحة تسجيل الحرفي ---
const WorkerRegistrationForm: React.FC<{ onSuccess: (u: User) => void, onBack: () => void }> = ({ onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    firstName: '', lastName: '', phone: '', password: '', 
    wilaya: WILAYAS[0], daira: '', category: SERVICE_CATEGORIES[0].name, bio: '' 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('users').insert([{
      first_name: formData.firstName, last_name: formData.lastName,
      phone: formData.phone, password: formData.password,
      role: UserRole.WORKER, wilaya: formData.wilaya, daira: formData.daira,
      category: formData.category, bio: formData.bio, is_verified: false
    }]).select().single();
    if (data) onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: data.daira } });
    else alert("حدث خطأ في التسجيل");
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto my-12 px-6">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-emerald-100 text-right">
        <button onClick={onBack} className="text-slate-400 font-bold mb-6 hover:text-emerald-600 transition-all">← الرجوع للوراء</button>
        <h2 className="text-3xl font-black mb-2">سجل كحرفي محترف 🛠️</h2>
        <p className="text-slate-500 mb-10 font-medium">املأ بياناتك لتبدأ في استقبال طلبات العمل من الزبائن.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-black pr-2">الاسم</label>
              <input required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="font-black pr-2">اللقب</label>
              <input required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="font-black pr-2">رقم الهاتف</label>
            <input required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-mono" placeholder="05 / 06 / 07" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-black pr-2">الولاية</label>
              <select className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value, daira: ''})}>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-black pr-2">الدائرة</label>
              <select className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.daira} onChange={e => setFormData({...formData, daira: e.target.value})}>
                <option value="">اختر الدائرة</option>
                {DAIRAS[formData.wilaya]?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-black pr-2">التخصص الرئيسي</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICE_CATEGORIES.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setFormData({...formData, category: c.name})}
                  className={`p-4 border-2 rounded-2xl text-center cursor-pointer transition-all ${formData.category === c.name ? 'border-emerald-600 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200'}`}
                >
                  <div className="text-2xl mb-1">{c.icon}</div>
                  <div className="text-[10px] font-black leading-tight">{c.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-black pr-2">نبذة عن خبرتك (Bio)</label>
            <textarea className="w-full p-4 bg-gray-50 border rounded-2xl outline-none h-32" placeholder="اشرح للزبائن مهاراتك وسنوات خبرتك..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="font-black pr-2">كلمة المرور</label>
            <input type="password" required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-emerald-500 transition-all">
            {loading ? 'جاري إنشاء الحساب...' : 'تأكيد التسجيل كحرفي'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- لوحة تسجيل الزبون ---
const SeekerRegistrationForm: React.FC<{ onSuccess: (u: User) => void, onBack: () => void }> = ({ onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', password: '', wilaya: WILAYAS[0] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('users').insert([{
      first_name: formData.firstName, last_name: formData.lastName,
      phone: formData.phone, password: formData.password,
      role: UserRole.SEEKER, wilaya: formData.wilaya, is_verified: true
    }]).select().single();
    if (data) onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: '' } });
    else alert("خطأ في التسجيل");
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-blue-100 text-right">
        <button onClick={onBack} className="text-slate-400 font-bold mb-6 hover:text-blue-600 transition-all">← رجوع</button>
        <h2 className="text-3xl font-black mb-2 text-blue-900">سجل كزبون 🔍</h2>
        <p className="text-slate-500 mb-10 font-medium">ابحث عن الحرفيين وتواصل معهم بكل سهولة.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input placeholder="الاسم" required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
          <input placeholder="اللقب" required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          <input placeholder="رقم الهاتف" required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-mono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <select className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <input type="password" placeholder="كلمة المرور" required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-blue-500 transition-all">
            {loading ? 'جاري التحميل...' : 'تأكيد التسجيل'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- المكونات البسيطة الأخرى ---
const ProfileView: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => (
  <div className="max-w-4xl mx-auto my-12 md:my-20 px-4">
    <div className="bg-white p-12 rounded-[4rem] shadow-2xl text-center">
       <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}`} className="w-32 h-32 rounded-[2.5rem] mx-auto mb-6" />
       <h2 className="text-4xl font-black mb-2">{user.firstName} {user.lastName}</h2>
       <p className="text-emerald-600 font-bold mb-8">{user.role === UserRole.WORKER ? `حرفي (${user.category})` : 'زبون'}</p>
       <button onClick={onLogout} className="bg-red-50 text-red-500 px-12 py-3 rounded-2xl font-black">تسجيل الخروج</button>
    </div>
  </div>
);

const AuthForm: React.FC<{ type: 'login' | 'admin', onSuccess: (u: User) => void }> = ({ type, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ phone: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (type === 'admin') {
       if (formData.phone === '0777117663' && formData.password === 'vampirewahab31') {
          onSuccess({ id: 'admin', firstName: 'عبد الوهاب', lastName: 'المدير', phone: '0777117663', role: UserRole.ADMIN, location: { wilaya: 'الجزائر', daira: 'الجزائر' } });
       } else alert("بيانات خاطئة");
    } else {
      const { data } = await supabase.from('users').select('*').eq('phone', formData.phone).eq('password', formData.password).single();
      if (data) onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: data.daira } });
      else alert("رقم الهاتف أو كلمة المرور غير صحيحة");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md text-right">
        <h2 className="text-3xl font-black mb-8">{type === 'admin' ? 'دخول الإدارة 🔒' : 'مرحباً بعودتك 👋'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input placeholder="رقم الهاتف" required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-mono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input type="password" placeholder="كلمة المرور" required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl">{loading ? 'جاري التحقق...' : 'دخول'}</button>
        </form>
      </div>
    </div>
  );
};
