
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, Chat, Message, Notification, Task } from './types';
import { SERVICE_CATEGORIES, WILAYAS, WILAYA_DATA } from './constants';
import { supabase } from './lib/supabase';
import { 
  User as UserIcon, 
  Home,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Search as SearchIcon,
  ClipboardList,
  MapPin,
  Star,
  Zap,
  ShieldCheck,
  ArrowRight,
  Trophy,
  LogOut,
  MessageSquare,
  Phone,
  Edit,
  Save,
  Check,
  ImageIcon,
  Bell,
  Send,
  MoreVertical,
  Briefcase,
  Image as LucideImage,
  PlusSquare,
  Lock,
  Mail,
  UserPlus,
  LogIn,
  AlertCircle,
  ChevronDown,
  Building2,
  Map as MapIcon,
  Layout,
  Clock,
  CheckCircle,
  Upload,
  Eye,
  Smartphone,
  Key,
  ChevronLeft
} from 'lucide-react';

// --- مساعدات البيانات ---
const ensureArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return [val]; }
  }
  return [];
};

const mapUserData = (u: any): User => ({
  ...u,
  firstName: u.first_name || u.firstName,
  lastName: u.last_name || u.lastName,
  location: { 
    wilaya: u.wilaya || u.location?.wilaya || '', 
    daira: u.daira || u.location?.daira || '' 
  },
  categories: ensureArray(u.categories || u.category),
  skills: ensureArray(u.skills),
  portfolio: ensureArray(u.portfolio),
  verificationStatus: u.verification_status || u.verificationStatus || 'none',
  rating: u.rating || 0,
  ratingCount: u.rating_count || u.ratingCount || 0,
  completedJobs: u.completed_jobs || u.completedJobs || 0,
  bio: u.bio || ''
});

// --- الأنماط العامة ---
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap');
      .arabic-text { font-family: 'Tajawal', sans-serif; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
      .craft-card { 
        background: white; 
        border-radius: 2rem; 
        border: 1px solid rgba(226, 232, 240, 0.8);
        box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
      }
      .btn-primary {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.3);
      }
      .input-field {
        width: 100%;
        padding: 1rem 3rem 1rem 1.25rem;
        background-color: #f8fafc;
        border-radius: 1.25rem;
        border: 2px solid transparent;
        font-weight: 600;
        transition: all 0.2s ease;
      }
      .input-field:focus {
        border-color: #10b981;
        background-color: white;
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.05);
        outline: none;
      }
      .loading-spinner {
        width: 1.2rem; height: 1.2rem;
        border: 3px solid rgba(16, 185, 129, 0.1);
        border-top-color: #10b981;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .message-bubble-me {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border-bottom-right-radius: 0.25rem;
      }
      .message-bubble-other {
        background: white;
        color: #1e293b;
        border-bottom-left-radius: 0.25rem;
        border: 1px solid #f1f5f9;
      }
    `}</style>
  );
}

// --- واجهة تسجيل الدخول ---
function LoginView({ onLoginSuccess, onSwitchToRegister }: { onLoginSuccess: (u: User) => void, onSwitchToRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (authData.user) {
        const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
        if (userError) throw userError;
        onLoginSuccess(mapUserData(userData));
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4 animate-fade-in text-right">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><LogIn size={32} /></div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">تسجيل الدخول</h2>
          <p className="text-slate-500 font-bold">أهلاً بك مجدداً في سلكني</p>
        </div>
        {error && <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase">البريد الإلكتروني</label>
            <div className="relative">
              <input type="email" required className="input-field" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase">كلمة المرور</label>
            <div className="relative">
              <input type="password" required className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary py-4 rounded-2xl font-black text-xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-70 transition-all">
            {loading ? <div className="loading-spinner border-white"></div> : 'دخول'}
          </button>
        </form>
        <div className="mt-10 text-center border-t border-slate-50 pt-8">
          <p className="text-slate-500 font-bold text-sm mb-4">ليس لديك حساب؟</p>
          <button onClick={onSwitchToRegister} className="text-emerald-600 font-black hover:underline">إنشاء حساب جديد مجاناً</button>
        </div>
      </div>
    </div>
  );
}

// --- واجهة تسجيل حساب جديد ---
function RegisterView({ onRegisterSuccess, onSwitchToLogin }: { onRegisterSuccess: (u: User) => void, onSwitchToLogin: () => void }) {
  const [role, setRole] = useState<UserRole>('SEEKER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '', wilaya: WILAYAS[0], daira: WILAYA_DATA[WILAYAS[0]][0], category: SERVICE_CATEGORIES[0].name });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: formData.email, password: formData.password });
      if (authError) throw authError;
      if (authData.user) {
        const { error: userError } = await supabase.from('users').insert([{ id: authData.user.id, first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone, role: role, wilaya: formData.wilaya, daira: formData.daira, categories: role === 'WORKER' ? [formData.category] : [], rating: 0, completed_jobs: 0 }]);
        if (userError) throw userError;
        const { data: userData, error: fetchError } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
        if (fetchError) throw fetchError;
        onRegisterSuccess(mapUserData(userData));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-fade-in text-right pb-32">
      <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 border border-slate-100">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 mb-2">انضم إلى سلكني</h2>
          <p className="text-slate-500 font-bold">اختر نوع الحساب وابدأ تجربتك</p>
        </div>
        <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-10">
          <button onClick={() => setRole('SEEKER')} className={`flex-1 py-4 rounded-xl font-black text-sm transition-all ${role === 'SEEKER' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>زبون (أبحث عن خدمة)</button>
          <button onClick={() => setRole('WORKER')} className={`flex-1 py-4 rounded-xl font-black text-sm transition-all ${role === 'WORKER' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}>حرفي (أقدم خدمات)</button>
        </div>
        {error && <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input required className="input-field" placeholder="الاسم" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            <input required className="input-field" placeholder="اللقب" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input required className="input-field" placeholder="رقم الهاتف" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input type="email" required className="input-field" placeholder="البريد الإلكتروني" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <input type="password" required className="input-field" placeholder="كلمة المرور" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <select className="input-field appearance-none" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value, daira: WILAYA_DATA[e.target.value][0]})}>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <select className="input-field appearance-none" value={formData.daira} onChange={e => setFormData({...formData, daira: e.target.value})}>
              {(WILAYA_DATA[formData.wilaya] || []).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {role === 'WORKER' && (
            <select className="input-field appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          )}
          <button type="submit" disabled={loading} className="w-full btn-primary py-5 rounded-2xl font-black text-xl shadow-xl transition-all disabled:opacity-70">
            {loading ? <div className="loading-spinner border-white"></div> : 'إنشاء حسابي'}
          </button>
        </form>
        <div className="mt-10 text-center border-t border-slate-50 pt-8">
          <p className="text-slate-500 font-bold text-sm mb-4">لديك حساب بالفعل؟</p>
          <button onClick={onSwitchToLogin} className="text-emerald-600 font-black hover:underline">تسجيل الدخول</button>
        </div>
      </div>
    </div>
  );
}

// --- واجهة المحادثات (Chats) ---
function ChatsView({ currentUser, activeChat, onSelectChat, onBack }: { currentUser: User, activeChat: Chat | null, onSelectChat: (c: Chat) => void, onBack: () => void }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  // جلب المحادثات والاشتراك في التحديثات
  useEffect(() => {
    const fetchChats = async () => {
      setLoadingChats(true);
      const { data } = await supabase
        .from('chats')
        .select('*, p1:participant_1(id, first_name, last_name, avatar), p2:participant_2(id, first_name, last_name, avatar)')
        .or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`)
        .order('updated_at', { ascending: false });

      if (data) {
        setChats(data.map(c => ({
          ...c,
          other_participant: mapUserData(c.participant_1 === currentUser.id ? c.p2 : c.p1)
        })));
      }
      setLoadingChats(false);
    };

    fetchChats();

    const chatsChannel = supabase
      .channel('public:chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => fetchChats())
      .subscribe();

    return () => { supabase.removeChannel(chatsChannel); };
  }, [currentUser.id]);

  // جلب الرسائل والاشتراك فيها
  useEffect(() => {
    if (!activeChat) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('chat_id', activeChat.id).order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const msgChannel = supabase
      .channel(`chat_messages_${activeChat.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${activeChat.id}` }, payload => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(msgChannel); };
  }, [activeChat?.id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    const msg = newMessage;
    setNewMessage('');
    const { error } = await supabase.from('messages').insert([{ chat_id: activeChat.id, sender_id: currentUser.id, content: msg }]);
    if (!error) {
      await supabase.from('chats').update({ updated_at: new Date().toISOString(), last_message: msg }).eq('id', activeChat.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col md:flex-row bg-white overflow-hidden shadow-2xl md:rounded-[3rem] border border-slate-100 animate-fade-in">
      {/* قائمة المحادثات */}
      <div className={`w-full md:w-96 flex-shrink-0 flex flex-col border-l border-slate-100 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900">محادثاتي</h2>
          <button onClick={onBack} className="md:hidden p-2 text-slate-400"><X size={24}/></button>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-3">
          {loadingChats ? <div className="p-10 text-center"><div className="loading-spinner mx-auto"></div></div> :
            chats.length > 0 ? chats.map(chat => (
              <div key={chat.id} onClick={() => onSelectChat(chat)} className={`p-4 rounded-3xl flex items-center gap-4 cursor-pointer transition-all ${activeChat?.id === chat.id ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-50 border border-transparent'}`}>
                <img src={chat.other_participant?.avatar || `https://ui-avatars.com/api/?name=${chat.other_participant?.firstName}`} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-sm truncate">{chat.other_participant?.firstName} {chat.other_participant?.lastName}</h3>
                  <p className={`text-xs truncate font-medium ${activeChat?.id === chat.id ? 'text-white/80' : 'text-slate-400'}`}>{chat.last_message || 'لا توجد رسائل...'}</p>
                </div>
              </div>
            )) : <div className="text-center py-20 text-slate-300 font-bold">ابدأ محادثة جديدة الآن!</div>}
        </div>
      </div>

      {/* نافذة الدردشة */}
      <div className={`flex-grow flex flex-col bg-slate-50/20 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            <div className="p-6 md:p-8 bg-white border-b border-slate-50 flex items-center justify-between shadow-sm">
               <div className="flex items-center gap-4">
                  <button onClick={() => onSelectChat(null as any)} className="md:hidden text-slate-400"><ArrowRight size={24}/></button>
                  <img src={activeChat.other_participant?.avatar || `https://ui-avatars.com/api/?name=${activeChat.other_participant?.firstName}`} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                  <div>
                    <h3 className="font-black text-slate-900 leading-tight">{activeChat.other_participant?.firstName} {activeChat.other_participant?.lastName}</h3>
                    <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> متصل</span>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <a href={`tel:${activeChat.other_participant?.phone}`} className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><Phone size={20}/></a>
                  <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><MoreVertical size={20}/></button>
               </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-6 flex flex-col">
              {messages.map((m) => {
                const isMe = m.sender_id === currentUser.id;
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-start' : 'justify-end animate-fade-in'}`}>
                    <div className={`max-w-[80%] px-6 py-4 rounded-[1.8rem] text-sm md:text-base font-medium shadow-sm relative ${isMe ? 'message-bubble-me' : 'message-bubble-other'}`}>
                      {m.content}
                      <span className={`text-[9px] mt-1 block opacity-60 text-left ${isMe ? 'text-white' : 'text-slate-400'}`}>{new Date(m.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 md:p-8 bg-white border-t border-slate-50">
              <div className="relative flex items-center gap-4">
                <input type="text" className="input-field pr-14" placeholder="اكتب رسالتك..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                <button type="submit" className="absolute right-3 bg-slate-900 text-white p-3 rounded-xl hover:bg-emerald-600 transition-all shadow-md active:scale-90"><Send size={20} className="rotate-180"/></button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-300 p-10 text-center">
             <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-6"><MessageSquare size={40}/></div>
             <h3 className="text-xl font-black text-slate-400 mb-2">تواصل مع المحترفين</h3>
             <p className="max-w-xs font-medium text-slate-400">اختر محادثة من القائمة الجانبية أو ابحث عن حرفي لبدء التواصل.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- واجهة عرض البروفايل ---
function WorkerView({ worker, isOwnProfile, onBack, onEdit, onStartChat, onLogout, onGoToTasks }: any) {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  return (
    <div className="max-w-6xl mx-auto py-8 md:py-12 px-4 md:px-6 animate-fade-in text-right">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-emerald-600 font-black hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all"><ArrowRight size={20} className="rotate-180"/> العودة</button>
        {isOwnProfile && <div className="flex gap-4">
          <button onClick={onGoToTasks} className="bg-emerald-50 text-emerald-700 font-bold flex items-center gap-2 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-all border border-emerald-100"><ClipboardList size={20}/> مهامي</button>
          <button onClick={onLogout} className="text-red-500 font-bold flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-xl transition-all"><LogOut size={20}/> خروج</button>
        </div>}
      </div>
      <div className="craft-card overflow-hidden">
        <div className="h-48 md:h-64 bg-gradient-to-l from-emerald-600 to-teal-800 relative shadow-inner">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          {isOwnProfile && <button onClick={onEdit} className="absolute top-4 left-4 bg-white/90 backdrop-blur shadow-lg text-emerald-700 px-5 py-2.5 rounded-2xl font-black border border-white hover:bg-white transition-all flex items-center gap-2 text-sm"><Edit size={18}/> تعديل بروفايلي</button>}
        </div>
        <div className="px-6 md:px-12 pb-12 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 -mt-20 md:-mt-24 mb-10 text-center md:text-right">
            <div className="relative group">
              <img src={worker.avatar || `https://ui-avatars.com/api/?name=${worker.firstName}&background=10b981&color=fff`} className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] border-8 border-white shadow-2xl object-cover bg-slate-100" />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2.5 rounded-2xl shadow-xl border-4 border-white"><ShieldCheck size={24}/></div>
            </div>
            <div className="flex-grow pb-2">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-3">{worker.firstName} {worker.lastName}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm md:text-lg font-bold text-slate-500">
                <span className="flex items-center gap-1.5"><MapPin size={18} className="text-emerald-500"/> {worker.location.wilaya}</span>
                <span className="flex items-center gap-1.5"><Briefcase size={18} className="text-emerald-500"/> {worker.categories[0]}</span>
                <span className="flex items-center gap-1.5 text-yellow-500"><Star size={18} fill="currentColor"/> {worker.rating > 0 ? worker.rating : 'جديد'}</span>
              </div>
            </div>
            {!isOwnProfile && <div className="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
               <button onClick={onStartChat} className="btn-primary flex-grow md:flex-none px-10 py-5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><MessageSquare size={24}/> تواصل مباشر</button>
               <a href={`tel:${worker.phone}`} className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3"><Phone size={24}/></a>
            </div>}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <section className="bg-slate-50/50 p-6 md:p-10 rounded-[2.5rem] border border-slate-100">
                <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2"><Layout size={20} className="text-emerald-600"/> نبذة مهنية</h3>
                <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-line font-medium">{worker.bio || 'لم يقم الحرفي بإضافة نبذة بعد.'}</p>
              </section>
              <section>
                <h3 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2"><Zap size={20} className="text-emerald-600"/> المهارات المتوفرة</h3>
                <div className="flex flex-wrap gap-3">
                   {worker.skills.length > 0 ? worker.skills.map((skill: string) => (
                     <span key={skill} className="bg-white text-emerald-700 px-6 py-2.5 rounded-2xl font-black text-sm border-2 border-emerald-50 shadow-sm transition-all hover:bg-emerald-50">#{skill}</span>
                   )) : <span className="text-slate-400 font-bold italic">لا توجد مهارات مضافة</span>}
                </div>
              </section>
              <section>
                <h3 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2"><ImageIcon size={20} className="text-emerald-600"/> معرض الأعمال المنجزة</h3>
                {worker.portfolio && worker.portfolio.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {worker.portfolio.map((img: string, i: number) => (
                      <div key={i} onClick={() => setActiveImage(img)} className="aspect-square bg-slate-100 rounded-[2rem] overflow-hidden border-4 border-white shadow-lg cursor-zoom-in group relative">
                        <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Eye className="text-white" size={30}/></div>
                      </div>
                    ))}
                  </div>
                ) : <div className="py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center"><LucideImage size={50} className="mx-auto mb-4 text-slate-300"/><p className="text-slate-400 font-bold">لا توجد صور في المعرض حالياً</p></div>}
              </section>
            </div>
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
                 <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                 <h4 className="text-lg font-black mb-8 flex items-center gap-2"><Trophy className="text-yellow-400" size={24}/> الإحصائيات</h4>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10"><span className="text-slate-400 font-bold text-sm">المهام المكتملة</span><span className="text-3xl font-black text-emerald-400">+{worker.completedJobs}</span></div>
                    <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10"><span className="text-slate-400 font-bold text-sm">التقييم العام</span><span className="text-3xl font-black text-yellow-400">{worker.rating || 'جديد'}</span></div>
                 </div>
              </div>
              <div className="bg-white border-2 border-slate-50 p-8 rounded-[3rem]">
                 <h4 className="text-lg font-black text-slate-900 mb-6">التواصل المباشر</h4>
                 <div className="space-y-5">
                    <div className="flex items-center gap-4 text-slate-600 font-bold"><div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><Phone size={20}/></div><span dir="ltr">{worker.phone}</span></div>
                    <div className="flex items-center gap-4 text-slate-600 font-bold"><div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><Building2 size={20}/></div><span>{worker.location.daira}، {worker.location.wilaya}</span></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {activeImage && <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setActiveImage(null)}><button className="absolute top-8 left-8 text-white p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X size={32}/></button><img src={activeImage} className="max-w-full max-h-[90vh] rounded-3xl shadow-2xl object-contain" /></div>}
    </div>
  );
}

// --- واجهة تعديل البروفايل مع رفع الصور من الجهاز ---
function EditProfileView({ user, onSaved, onCancel }: { user: User, onSaved: (u: User) => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone, bio: user.bio || '', wilaya: user.location.wilaya, daira: user.location.daira, category: user.categories[0] || SERVICE_CATEGORIES[0].name, skills: user.skills.join(', '), portfolio: user.portfolio || [] });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert('الصورة كبيرة جداً (2 ميجا بحد أقصى)');
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, portfolio: [...prev.portfolio, reader.result as string] }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      const { error } = await supabase.from('users').update({ first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone, bio: formData.bio, wilaya: formData.wilaya, daira: formData.daira, categories: [formData.category], skills: skillsArray, portfolio: formData.portfolio }).eq('id', user.id);
      if (error) throw error;
      onSaved(mapUserData({ ...user, ...formData, skills: skillsArray, location: { wilaya: formData.wilaya, daira: formData.daira }, categories: [formData.category] }));
    } catch (err: any) {
      alert('خطأ: ' + err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-fade-in text-right pb-32">
       <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 border border-slate-100">
          <div className="flex justify-between items-center mb-10 border-b pb-6">
             <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3"><Edit className="text-emerald-600" size={28}/> إعدادات الحرفي</h2>
             <button onClick={onCancel} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"><X size={24}/></button>
          </div>
          <form onSubmit={handleSave} className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input required className="input-field" placeholder="الاسم" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <input required className="input-field" placeholder="اللقب" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input required className="input-field" placeholder="الهاتف" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <select className="input-field appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
             </div>
             <textarea rows={4} className="input-field h-auto py-4" placeholder="نبذة مهنية..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
             <input className="input-field" placeholder="المهارات (افصل بينها بفاصلة)" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
             <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center">
                   <h3 className="text-lg font-black text-slate-900">معرض أعمالي</h3>
                   <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md active:scale-95"><Upload size={18}/> رفع صورة من جهازي</button>
                   <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                </div>
                {formData.portfolio.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {formData.portfolio.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group">
                          <img src={img} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setFormData({...formData, portfolio: formData.portfolio.filter((_, idx) => idx !== i)})} className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-md"><Trash2 size={16}/></button>
                        </div>
                    ))}
                  </div>
                ) : <div className="py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400 font-bold">لم تقم برفع أي صور بعد.</div>}
             </div>
             <div className="flex flex-col md:flex-row gap-4 pt-10">
                <button disabled={loading} className="flex-grow btn-primary py-4 rounded-2xl font-black text-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95">
                   {loading ? <div className="loading-spinner border-white"></div> : <Save size={24}/>}
                   {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
                <button type="button" onClick={onCancel} className="px-10 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-lg hover:bg-slate-100">إلغاء</button>
             </div>
          </form>
       </div>
    </div>
  );
}

// --- واجهة مهامي الشخصية (My Tasks) ---
function MyTasksView({ currentUser, onBack }: { currentUser: User, onBack: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTasks = async () => {
      setLoading(true);
      const { data } = await supabase.from('tasks').select('*').eq('seeker_id', currentUser.id).order('created_at', { ascending: false });
      if (data) setTasks(data.map(t => ({ ...t, status: t.status as any })));
      setLoading(false);
    };
    fetchMyTasks();
  }, [currentUser]);

  const deleteTask = async (id: string) => {
    if (window.confirm('حذف هذا الطلب؟')) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (!error) setTasks(tasks.filter(t => t.id !== id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-right min-h-screen animate-fade-in">
      <div className="flex justify-between items-center mb-10">
         <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><ClipboardList className="text-emerald-600"/> إدارة مهامي</h1>
         <button onClick={onBack} className="text-slate-500 font-bold hover:text-emerald-600">عودة</button>
      </div>
      <div className="space-y-6">
        {loading ? [1,2].map(i => <div key={i} className="h-40 bg-white rounded-3xl animate-pulse border border-slate-100"></div>) :
          tasks.map(t => (
            <div key={t.id} className="craft-card p-6 md:p-8 relative overflow-hidden">
               <div className={`absolute top-0 right-0 w-2 h-full ${t.status === 'open' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                     <h3 className="text-xl font-black text-slate-900 mb-1">{t.title}</h3>
                     <span className="text-xs text-slate-400 font-bold">{new Date(t.created_at).toLocaleDateString('ar-DZ')} • {t.category}</span>
                  </div>
                  <button onClick={() => deleteTask(t.id)} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={22}/></button>
               </div>
               <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed line-clamp-2">{t.description}</p>
               <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                  <span className="text-emerald-600 font-black">الميزانية: {t.budget} دج</span>
                  <span className={`text-xs font-black ${t.status === 'open' ? 'text-emerald-600' : 'text-slate-400'}`}>{t.status === 'open' ? 'نشط حالياً' : 'مكتمل'}</span>
               </div>
            </div>
          ))
        }
        {!loading && tasks.length === 0 && <div className="text-center py-24 text-slate-300 font-bold">لا توجد طلبات منشورة.</div>}
      </div>
    </div>
  );
}

// --- واجهة البحث عن الحرفيين ---
function SearchWorkersView({ onViewWorker }: { onViewWorker: (worker: User) => void }) {
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<User[]>([]);
  const [filters, setFilters] = useState({ query: '', wilaya: '', category: '' });

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let baseQuery = supabase.from('users').select('*').eq('role', 'WORKER');
      if (filters.wilaya) baseQuery = baseQuery.eq('wilaya', filters.wilaya);
      if (filters.category) baseQuery = baseQuery.or(`categories.ilike.%${filters.category}%,category.ilike.%${filters.category}%`);
      const { data } = await baseQuery;
      let filtered = (data || []).map(mapUserData);
      if (filters.query) {
        const q = filters.query.toLowerCase();
        filtered = filtered.filter(w => w.firstName.toLowerCase().includes(q) || w.lastName.toLowerCase().includes(q) || w.bio?.toLowerCase().includes(q) || w.skills.some(s => s.toLowerCase().includes(q)));
      }
      setWorkers(filtered);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchWorkers(); }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 text-right">
      <div className="bg-emerald-50 p-8 md:p-12 rounded-[3rem] mb-12 border border-emerald-100 shadow-sm">
        <h2 className="text-3xl font-black mb-8 text-slate-900">البحث المتقدم 🔍</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          <input className="input-field md:col-span-2" placeholder="ابحث بالاسم أو المهنة..." value={filters.query} onChange={e => setFilters({...filters, query: e.target.value})} />
          <select className="input-field appearance-none" value={filters.wilaya} onChange={e => setFilters({...filters, wilaya: e.target.value})}><option value="">كل الولايات</option>{WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}</select>
          <select className="input-field appearance-none" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}><option value="">كل التخصصات</option>{SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
        </div>
        <button onClick={fetchWorkers} disabled={loading} className="mt-8 btn-primary px-12 py-4 rounded-xl font-black shadow-xl active:scale-95 transition-all">{loading ? 'جاري البحث...' : 'ابدأ البحث الآن'}</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading ? [1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse"></div>) :
          workers.map(worker => (
            <div key={worker.id} onClick={() => onViewWorker(worker)} className="craft-card p-8 cursor-pointer group hover:-translate-y-2 transition-all">
              <div className="flex gap-4 items-center mb-6 flex-row-reverse">
                <img src={worker.avatar || `https://ui-avatars.com/api/?name=${worker.firstName}`} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                <div className="text-right flex-1"><h3 className="text-lg font-black text-slate-900">{worker.firstName} {worker.lastName}</h3><span className="text-xs font-black text-emerald-600 uppercase">{worker.categories[0]}</span></div>
              </div>
              <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium">{worker.bio || 'لا توجد نبذة.'}</p>
              <div className="flex justify-between items-center border-t border-slate-50 pt-6">
                <span className="text-slate-400 font-bold text-xs">📍 {worker.location.wilaya}</span>
                <div className="flex items-center gap-1 text-yellow-500 font-black"><Star size={14} fill="currentColor"/> {worker.rating > 0 ? worker.rating : 'جديد'}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// --- واجهة سوق المهام (Tasks Market) ---
function TasksMarketView({ currentUser, onStartChat }: { currentUser: User | null, onStartChat: any }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', category: SERVICE_CATEGORIES[0].name, budget: 0, wilaya: WILAYAS[0] });

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const { data } = await supabase.from('tasks').select('*').eq('status', 'open').order('created_at', { ascending: false });
      if (data) setTasks(data.map(t => ({ ...t, status: t.status as any })));
      setLoading(false);
    };
    fetchTasks();
  }, []);

  const handleCreate = async () => {
    if (!currentUser) return alert('سجل دخولك أولاً');
    const { error } = await supabase.from('tasks').insert([{ seeker_id: currentUser.id, seeker_name: `${currentUser.firstName} ${currentUser.lastName}`, title: newTask.title, description: newTask.description, category: newTask.category, budget: newTask.budget, wilaya: newTask.wilaya, status: 'open' }]);
    if (!error) { setShowCreate(false); window.location.reload(); } else alert('خطأ في النشر');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 text-right">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div><h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">سوق المهام المفتوحة 📋</h1><p className="text-slate-500 font-bold">تواصل مباشرة مع الزبائن وقدم عروضك.</p></div>
        <button onClick={() => setShowCreate(true)} className="btn-primary px-10 py-5 rounded-2xl font-black text-xl shadow-xl flex items-center gap-3 active:scale-95 transition-all"><PlusSquare size={26}/> انشر طلبك الخاص</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading ? [1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse"></div>) :
          tasks.map(t => (
            <div key={t.id} className="craft-card p-8 flex flex-col h-full hover:border-emerald-200 transition-all">
               <div className="flex justify-between items-center mb-6">
                  <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-xl font-black text-xs border border-emerald-100">{t.category}</span>
                  <div className="font-black text-xl text-slate-900">{t.budget} <span className="text-xs">دج</span></div>
               </div>
               <h3 className="text-xl font-black text-slate-900 mb-4 line-clamp-2">{t.title}</h3>
               <p className="text-slate-500 font-medium mb-8 flex-grow line-clamp-3 text-sm">{t.description}</p>
               <div className="border-t pt-6 flex justify-between items-center mt-auto">
                  <div className="text-right"><span className="text-xs font-black block text-slate-900">{t.seeker_name}</span><span className="text-[10px] text-slate-400 font-bold">{t.wilaya}</span></div>
                  <button onClick={() => onStartChat(t.seeker_id)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-emerald-600 transition-all">إرسال عرض مباشر</button>
               </div>
            </div>
          ))
        }
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 md:p-12 relative shadow-2xl overflow-y-auto max-h-[90vh]">
              <button onClick={() => setShowCreate(false)} className="absolute top-6 left-6 text-slate-300 hover:text-red-500 transition-all"><X size={28}/></button>
              <h2 className="text-2xl font-black mb-8">نشر طلب خدمة</h2>
              <div className="space-y-6">
                 <input className="input-field" placeholder="ما هي الخدمة؟" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                 <textarea rows={3} className="input-field h-auto py-4" placeholder="التفاصيل..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                 <div className="grid grid-cols-2 gap-4">
                    <input type="number" className="input-field" placeholder="الميزانية" value={newTask.budget} onChange={e => setNewTask({...newTask, budget: parseInt(e.target.value) || 0})} />
                    <select className="input-field appearance-none" value={newTask.wilaya} onChange={e => setNewTask({...newTask, wilaya: e.target.value})}>{WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}</select>
                 </div>
                 <select className="input-field appearance-none" value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value})}>{SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
                 <button onClick={handleCreate} className="w-full btn-primary py-5 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95">نشر الآن للجميع</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- التطبيق الرئيسي ---
export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { currentUser: saved ? mapUserData(JSON.parse(saved)) : null, selectedWorker: null, activeChat: null, workers: [], notifications: [], view: 'landing' };
  });
  
  const setView = (v: AppState['view']) => { setState(prev => ({ ...prev, view: v })); window.scrollTo(0, 0); };

  const updateCurrentUser = (u: User | null) => {
    const mappedUser = u ? mapUserData(u) : null;
    setState(prev => ({ ...prev, currentUser: mappedUser }));
    if (mappedUser) localStorage.setItem('user', JSON.stringify(mappedUser));
    else { localStorage.removeItem('user'); supabase.auth.signOut(); }
  };

  const handleStartChat = async (otherUserId: string) => {
    if (!state.currentUser) return setView('login');
    if (state.currentUser.id === otherUserId) return alert('لا يمكنك مراسلة نفسك!');

    const { data: existing } = await supabase
      .from('chats')
      .select('*')
      .or(`and(participant_1.eq.${state.currentUser.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${state.currentUser.id})`)
      .single();

    if (existing) {
      const { data: otherUser } = await supabase.from('users').select('*').eq('id', otherUserId).single();
      setState(prev => ({ ...prev, activeChat: { ...existing, other_participant: mapUserData(otherUser) }, view: 'chats' }));
    } else {
      const { data: newChat } = await supabase.from('chats').insert([{ participant_1: state.currentUser.id, participant_2: otherUserId }]).select().single();
      if (newChat) {
        const { data: otherUser } = await supabase.from('users').select('*').eq('id', otherUserId).single();
        setState(prev => ({ ...prev, activeChat: { ...newChat, other_participant: mapUserData(otherUser) }, view: 'chats' }));
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-[#fcfdfe] text-slate-900 pb-24 md:pb-0" dir="rtl">
      <GlobalStyles />
      <nav className="sticky top-0 z-50 h-20 md:h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div onClick={() => setView('landing')} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 flex items-center justify-center text-white font-black rounded-xl md:rounded-2xl group-hover:rotate-6 transition-transform">S</div>
            <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">Salakni <span className="text-emerald-600">سلكني</span></span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <button onClick={() => setView('landing')} className={`font-black text-lg ${state.view === 'landing' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}>الرئيسية</button>
            <button onClick={() => setView('search')} className={`font-black text-lg ${state.view === 'search' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}>الحرفيين</button>
            <button onClick={() => setView('support')} className={`font-black text-lg ${state.view === 'support' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}>سوق المهام</button>
            {state.currentUser && <button onClick={() => setView('chats')} className={`font-black text-lg ${state.view === 'chats' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}>الرسائل</button>}
          </div>
          <div className="flex items-center gap-3">
            {state.currentUser ? <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer p-1 pr-4 bg-white rounded-full border border-slate-200 hover:border-emerald-300 transition-all"><div className="flex flex-col items-start leading-tight"><span className="font-black text-sm">{state.currentUser.firstName}</span><span className="text-[9px] text-emerald-600 font-black">حسابي</span></div><img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}&background=10b981&color=fff`} className="w-10 h-10 rounded-xl object-cover" /></div> :
              <div className="flex gap-2"><button onClick={() => setView('login')} className="text-slate-600 font-black px-4">دخول</button><button onClick={() => setView('register')} className="btn-primary px-6 py-2.5 rounded-xl font-black">انضم</button></div>}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && <div className="relative min-h-[90vh] flex items-center justify-center py-16 px-6 overflow-hidden"><div className="absolute inset-0 bg-slate-950 bg-[url('https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=2000')] bg-cover bg-center opacity-30"></div><div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div><div className="relative z-10 max-w-5xl text-center text-white"><h1 className="text-5xl md:text-8xl font-black mb-8 animate-fade-in tracking-tighter leading-tight">سَلّكني <span className="text-emerald-400 italic underline decoration-white/20">يسلكها!</span></h1><p className="text-xl md:text-3xl text-slate-300 mb-12 font-medium max-w-2xl mx-auto leading-relaxed">المنصة الجزائرية رقم #1 لربط أمهر الحرفيين بالزبائن في جميع الولايات.</p><div className="flex flex-col sm:flex-row gap-6 justify-center"><button onClick={() => setView('search')} className="btn-primary px-12 py-6 rounded-[2rem] font-black text-2xl shadow-2xl active:scale-95 transition-all">اطلب خدمة 🔍</button><button onClick={() => setView('register')} className="bg-white/10 backdrop-blur-md px-12 py-6 rounded-[2rem] font-black text-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">سجل كحرفي 🛠️</button></div></div></div>}
        {state.view === 'login' && <LoginView onLoginSuccess={(u) => { updateCurrentUser(u); setView('landing'); }} onSwitchToRegister={() => setView('register')} />}
        {state.view === 'register' && <RegisterView onRegisterSuccess={(u) => { updateCurrentUser(u); setView('landing'); }} onSwitchToLogin={() => setView('login')} />}
        {state.view === 'search' && <SearchWorkersView onViewWorker={(w) => setState({...state, selectedWorker: w, view: 'worker-details'})} />}
        {state.view === 'support' && <TasksMarketView currentUser={state.currentUser} onStartChat={handleStartChat} />}
        {state.view === 'chats' && state.currentUser && <ChatsView currentUser={state.currentUser} activeChat={state.activeChat || null} onSelectChat={(c) => setState(prev => ({ ...prev, activeChat: c }))} onBack={() => setView('landing')} />}
        {state.view === 'profile' && state.currentUser && <WorkerView worker={state.currentUser} isOwnProfile={true} onBack={() => setView('landing')} onEdit={() => setView('edit-profile')} onLogout={() => updateCurrentUser(null)} onGoToTasks={() => setView('dashboard')} />}
        {state.view === 'dashboard' && state.currentUser && <MyTasksView currentUser={state.currentUser} onBack={() => setView('profile')} />}
        {state.view === 'edit-profile' && state.currentUser && <EditProfileView user={state.currentUser} onSaved={(u) => { updateCurrentUser(u); setView('profile'); }} onCancel={() => setView('profile')} />}
        {state.view === 'worker-details' && state.selectedWorker && <WorkerView worker={state.selectedWorker} onBack={() => setView('search')} onStartChat={() => handleStartChat(state.selectedWorker!.id)} />}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex items-center