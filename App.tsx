
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, Chat, Message, Notification, Task } from './types';
import { SERVICE_CATEGORIES, WILAYAS } from './constants';
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
  Users as UsersIcon,
  MapPin,
  Star,
  Zap,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
  Trophy,
  Clock,
  Banknote,
  Filter,
  LogOut,
  MessageSquare,
  Phone,
  Info,
  Edit,
  Save,
  Check,
  ExternalLink,
  Camera,
  Image as ImageIcon,
  UploadCloud,
  Bell,
  Send,
  MoreVertical
} from 'lucide-react';

// --- Global Styles ---

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap');
      .arabic-text { font-family: 'Tajawal', sans-serif; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
      .loading-spinner { border: 3px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 0.8s linear infinite; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .worker-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }
      .chat-bubble-me { background: #10b981; color: white; border-radius: 1.5rem 1.5rem 0.2rem 1.5rem; }
      .chat-bubble-other { background: #f1f5f9; color: #1e293b; border-radius: 1.5rem 1.5rem 1.5rem 0.2rem; }
    `}</style>
  );
}

// --- Utilities ---

const ensureArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    if (val.trim().startsWith('[') && val.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return val.split(',').map(s => s.trim());
  }
  return [];
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// --- Shared Components ---

function Logo({ onClick, size = 'sm' }: { onClick?: () => void; size?: 'sm' | 'md' | 'lg' }) {
  const logoClasses = size === 'lg' ? 'w-20 h-20 rounded-[2.5rem] text-4xl' : size === 'md' ? 'w-12 h-12 rounded-2xl text-2xl' : 'w-10 h-10 rounded-xl text-lg';
  const textClasses = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg';
  return (
    <div onClick={onClick} className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-all">
      <div className={`${logoClasses} bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-200 transition-all group-hover:rotate-6`}>S</div>
      <div className="flex flex-col items-start leading-none">
        <span className={`${textClasses} font-black text-slate-900 tracking-tighter`}>Salakni</span>
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">DZ Platform</span>
      </div>
    </div>
  );
}

function SectionHeading({ title, subtitle, centered = false }: { title: string; subtitle?: string; centered?: boolean }) {
  return (
    <div className={`mb-10 ${centered ? 'text-center' : 'text-right'}`}>
      <h2 className="text-3xl font-black text-slate-900 mb-2">{title}</h2>
      {subtitle && <p className="text-slate-500 font-medium">{subtitle}</p>}
      <div className={`h-1.5 w-16 bg-emerald-500 rounded-full mt-3 ${centered ? 'mx-auto' : ''}`}></div>
    </div>
  );
}

function NavButton({ children, active, onClick, badge }: { children?: React.ReactNode; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className={`font-black text-sm transition-all relative py-2 ${active ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'}`}>
      {children}
      {badge ? (
        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-pulse">{badge}</span>
      ) : null}
      {active && <span className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-full animate-fade-in"></span>}
    </button>
  );
}

function TabItem({ icon: Icon, label, active, onClick, badge }: { icon: any; label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all relative ${active ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
      <Icon size={24} />
      {badge ? (
        <span className="absolute top-0 right-1/4 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">{badge}</span>
      ) : null}
      <span className="text-[10px] font-black">{label}</span>
    </button>
  );
}

// --- Chat Components ---

function ChatView({ currentUser, activeChat, onBack }: { currentUser: User; activeChat: Chat | null; onBack: () => void }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(activeChat);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChats = async () => {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`)
        .order('updated_at', { ascending: false });
      
      if (data) {
        // Simulating user join logic for now
        setChats(data.map(c => ({
          ...c,
          other_participant: c.participant_1 === currentUser.id ? { firstName: 'مستخدم', lastName: 'نشط' } : { firstName: 'صاحب', lastName: 'الطلب' }
        } as Chat)));
      }
    };
    fetchChats();
  }, [currentUser]);

  useEffect(() => {
    if (selectedChat) {
      const fetchMessages = async () => {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', selectedChat.id)
          .order('created_at', { ascending: true });
        if (data) setMessages(data);
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      };
      fetchMessages();

      const subscription = supabase
        .channel(`chat_${selectedChat.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${selectedChat.id}` }, 
          payload => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();
      
      return () => { supabase.removeChannel(subscription); };
    }
  }, [selectedChat]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    const msg = {
      chat_id: selectedChat.id,
      sender_id: currentUser.id,
      content: newMessage,
    };
    const { error } = await supabase.from('messages').insert([msg]);
    if (!error) setNewMessage('');
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-160px)] flex flex-col md:flex-row bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-fade-in mt-6 mb-6">
      {/* Sidebar - Chats List */}
      <div className={`w-full md:w-1/3 border-l border-slate-50 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 border-b border-slate-50">
          <h2 className="text-2xl font-black text-slate-900">المحادثات</h2>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-2">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setSelectedChat(chat)}
              className={`p-5 rounded-3xl cursor-pointer transition-all flex items-center gap-4 ${selectedChat?.id === chat.id ? 'bg-emerald-50 border-emerald-100' : 'hover:bg-slate-50 border-transparent'} border`}
            >
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-xl">
                {chat.other_participant?.firstName[0]}
              </div>
              <div className="flex-grow text-right">
                <h4 className="font-black text-slate-900">{chat.other_participant?.firstName} {chat.other_participant?.lastName}</h4>
                <p className="text-xs text-slate-400 font-bold truncate">{chat.last_message || 'لا توجد رسائل بعد'}</p>
              </div>
            </div>
          ))}
          {chats.length === 0 && (
            <div className="text-center py-20 text-slate-300">
               <MessageSquare size={48} className="mx-auto mb-4 opacity-20"/>
               <p className="font-bold">لا توجد محادثات نشطة</p>
            </div>
          )}
        </div>
      </div>

      {/* Main - Chat Area */}
      <div className={`flex-grow flex flex-col ${!selectedChat ? 'hidden md:flex bg-slate-50 items-center justify-center' : 'flex'}`}>
        {selectedChat ? (
          <>
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 text-slate-400"><ArrowRight/></button>
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                  {selectedChat.other_participant?.firstName[0]}
                </div>
                <div className="text-right">
                  <h3 className="font-black text-slate-900 leading-none">{selectedChat.other_participant?.firstName} {selectedChat.other_participant?.lastName}</h3>
                  <span className="text-[10px] text-emerald-500 font-black uppercase">نشط الآن</span>
                </div>
              </div>
              <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl"><MoreVertical size={20}/></button>
            </div>
            
            <div className="flex-grow overflow-y-auto custom-scrollbar p-8 space-y-6 bg-slate-50/30">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender_id === currentUser.id ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-4 px-6 shadow-sm font-medium ${m.sender_id === currentUser.id ? 'chat-bubble-me' : 'chat-bubble-other'}`}>
                    <p>{m.content}</p>
                    <span className="text-[9px] opacity-60 block mt-1 text-left">
                      {new Date(m.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div className="p-6 bg-white border-t border-slate-50">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="اكتب رسالتك هنا..." 
                  className="flex-grow p-4 px-6 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                />
                <button 
                  onClick={sendMessage}
                  className="bg-emerald-600 text-white p-4 px-6 rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-500 transition-all active:scale-95"
                >
                  <Send size={24}/>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-20 space-y-4">
             <div className="w-24 h-24 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center text-emerald-600 mx-auto mb-6"><MessageSquare size={48}/></div>
             <h3 className="text-2xl font-black text-slate-900">اختر محادثة للبدء</h3>
             <p className="text-slate-400 font-bold max-w-xs mx-auto">تواصل مع الزبائن والحرفيين مباشرة لإتمام مشاريعك بنجاح.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Notification View ---

function NotificationsView({ notifications, onMarkRead }: { notifications: Notification[]; onMarkRead: (id: string) => void }) {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 animate-fade-in text-right">
      <SectionHeading title="التنبيهات" subtitle="تابع آخر التحديثات على طلباتك ورسائلك الجديدة." />
      <div className="space-y-4">
        {notifications.map(n => (
          <div 
            key={n.id} 
            onClick={() => onMarkRead(n.id)}
            className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer flex gap-5 items-start ${n.is_read ? 'bg-white border-slate-100 opacity-60' : 'bg-emerald-50/50 border-emerald-100 shadow-sm'}`}
          >
            <div className={`p-3 rounded-2xl ${n.type === 'message' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {n.type === 'message' ? <MessageSquare size={20}/> : <Zap size={20}/>}
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-black text-slate-900">{n.title}</h4>
                <span className="text-[10px] font-bold text-slate-400">{new Date(n.created_at).toLocaleDateString('ar-DZ')}</span>
              </div>
              <p className="text-slate-500 text-sm font-medium">{n.content}</p>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-100">
             <Bell size={48} className="text-slate-200 mx-auto mb-4"/>
             <p className="text-slate-400 font-black">لا توجد تنبيهات جديدة حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main App Logic ---

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { 
      currentUser: saved ? JSON.parse(saved) : null, 
      selectedWorker: null,
      activeChat: null,
      workers: [], 
      notifications: [],
      view: 'landing' 
    };
  });

  const setView = (view: AppState['view']) => { setState(prev => ({ ...prev, view })); window.scrollTo(0, 0); };
  
  const updateCurrentUser = (u: User | null) => { 
    setState(prev => ({ ...prev, currentUser: u })); 
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user'); 
    }
  };

  const handleProfileUpdate = (updatedUser: User) => {
    updateCurrentUser(updatedUser);
    setView('profile');
  };

  const openWorkerDetails = (worker: User) => {
    setState(prev => ({ ...prev, selectedWorker: worker, view: 'worker-details' }));
    window.scrollTo(0, 0);
  };

  const startChat = async (participantId: string) => {
    if (!state.currentUser) {
      setView('login');
      return;
    }
    // Simple mock logic for creating/fetching chat
    const chatId = [state.currentUser.id, participantId].sort().join('_');
    const mockChat: Chat = {
      id: chatId,
      participant_1: state.currentUser.id,
      participant_2: participantId,
      updated_at: new Date().toISOString(),
      other_participant: { firstName: 'جاري', lastName: 'التحميل...' } as User
    };
    setState(prev => ({ ...prev, activeChat: mockChat, view: 'chats' }));
  };

  const unreadMessages = 2; // Simulated
  const unreadNotifications = state.notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-24 md:pb-0 custom-scrollbar" dir="rtl">
      <GlobalStyles />
      
      <nav className="sticky top-0 z-50 h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} size="md" />
          <div className="hidden md:flex items-center gap-12">
            <NavButton active={state.view === 'landing'} onClick={() => setView('landing')}>الرئيسية</NavButton>
            <NavButton active={state.view === 'search' || state.view === 'worker-details'} onClick={() => setView('search')}>الحرفيين</NavButton>
            <NavButton active={state.view === 'support'} onClick={() => setView('support')}>سوق المهام</NavButton>
            {state.currentUser && (
              <>
                <NavButton active={state.view === 'chats'} onClick={() => setView('chats')} badge={unreadMessages}>الرسائل</NavButton>
                <NavButton active={state.view === 'notifications'} onClick={() => setView('notifications')} badge={unreadNotifications}>التنبيهات</NavButton>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer p-1.5 pr-5 bg-white rounded-full border border-slate-200 hover:border-emerald-200 transition-all shadow-sm">
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-black text-sm text-slate-800">{state.currentUser.firstName}</span>
                  <span className="text-[9px] font-black text-emerald-600 uppercase">حسابي</span>
                </div>
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" />
              </div>
            ) : (
              <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-10 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 active:scale-95 transition-all">دخول</button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onStart={() => setView('search')} onRegister={() => setView('register')} />}
        {state.view === 'search' && <SearchWorkersView onNavigate={setView} onViewWorker={openWorkerDetails} />}
        {state.view === 'worker-details' && state.selectedWorker && (
           <WorkerView worker={state.selectedWorker} onBack={() => setView('search')} onStartChat={() => startChat(state.selectedWorker!.id)} />
        )}
        {state.view === 'chats' && state.currentUser && <ChatView currentUser={state.currentUser} activeChat={state.activeChat || null} onBack={() => setView('landing')} />}
        {state.view === 'notifications' && <NotificationsView notifications={state.notifications} onMarkRead={(id) => {}} />}
        {state.view === 'support' && <TasksMarketView onStartChat={(seekerId) => startChat(seekerId)} />}
        
        {state.view === 'profile' && state.currentUser && (
          <div className="max-w-4xl mx-auto py-24 px-6 animate-fade-in text-right">
             <div className="bg-white rounded-[4rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="h-40 bg-gradient-to-r from-emerald-600 to-teal-500"></div>
                <div className="px-12 pb-12">
                   <div className="relative -mt-20 mb-8">
                     <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-40 h-40 rounded-[3rem] border-8 border-white mx-auto shadow-2xl object-cover bg-white" />
                     {state.currentUser.verificationStatus === 'verified' && (
                       <div className="absolute bottom-4 right-1/2 translate-x-12 translate-y-2 bg-blue-500 text-white p-2 rounded-2xl border-4 border-white shadow-lg"><Check size={24}/></div>
                     )}
                   </div>
                   <div className="text-center mb-12">
                     <h2 className="text-4xl font-black mb-2">{state.currentUser.firstName} {state.currentUser.lastName}</h2>
                     <p className="text-emerald-600 font-bold flex items-center justify-center gap-2"><MapPin size={18}/> {state.currentUser.location.wilaya}</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                         <h4 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-2">نبذة شخصية</h4>
                         <p className="text-slate-600 font-medium leading-relaxed">{state.currentUser.bio || 'لا توجد سيرة ذاتية مكتوبة بعد.'}</p>
                         <h4 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-2 pt-4">التخصصات</h4>
                         <div className="flex flex-wrap gap-2">
                           {ensureArray(state.currentUser.categories).map(c => <span key={c} className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-xl font-black text-xs">{c}</span>)}
                         </div>
                      </div>
                      <div className="space-y-6">
                         <h4 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-2">المهارات</h4>
                         <div className="flex flex-wrap gap-2">
                           {ensureArray(state.currentUser.skills).map(s => <span key={s} className="bg-slate-50 text-slate-600 px-4 py-1.5 rounded-xl font-black text-xs">{s}</span>)}
                         </div>
                         <div className="pt-10 flex flex-col gap-4">
                            <button onClick={() => setView('edit-profile')} className="bg-slate-900 text-white p-5 rounded-3xl font-black flex items-center justify-center gap-3 shadow-lg hover:bg-emerald-600 transition-all active:scale-95"><Edit size={20}/> تعديل بياناتي</button>
                            <button onClick={() => updateCurrentUser(null)} className="bg-red-50 text-red-500 p-5 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-red-100 transition-all active:scale-95"><LogOut size={20}/> تسجيل الخروج</button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
        
        {state.view === 'edit-profile' && state.currentUser && <EditProfileView user={state.currentUser} onSaved={handleProfileUpdate} onCancel={() => setView('profile')} />}
        
        {['login', 'register'].includes(state.view) && (
          <div className="py-40 text-center animate-fade-in">
             <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600"><Plus size={48}/></div>
             <h3 className="text-3xl font-black text-slate-800 mb-4">قريباً جداً...</h3>
             <p className="text-slate-500 font-bold max-w-sm mx-auto">نحن نضع اللمسات الأخيرة لنظام التسجيل والدخول لضمان أعلى مستويات الأمان.</p>
             <button onClick={() => setView('landing')} className="mt-10 text-emerald-600 font-black flex items-center gap-2 mx-auto"><ArrowRight size={20} className="rotate-180" /> العودة للرئيسية</button>
          </div>
        )}
      </main>

      {/* Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-around md:hidden z-50 px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={SearchIcon} label="البحث" active={state.view === 'search' || state.view === 'worker-details'} onClick={() => setView('search')} />
        <TabItem icon={MessageSquare} label="الرسائل" active={state.view === 'chats'} onClick={() => setView('chats')} badge={unreadMessages} />
        <TabItem icon={Bell} label="تنبيهات" active={state.view === 'notifications'} onClick={() => setView('notifications')} badge={unreadNotifications} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile' || state.view === 'edit-profile'} onClick={() => setView(state.currentUser ? 'profile' : 'login')} />
      </div>
    </div>
  );
}

// --- Specific View Function Refactorings ---

function WorkerView({ worker, onBack, onStartChat }: { worker: User; onBack: () => void; onStartChat: () => void }) {
  const portfolio = ensureArray(worker.portfolio);
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in text-right">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-black mb-8 hover:text-emerald-600 transition-all"><ArrowRight size={20} className="rotate-180"/> العودة</button>
      <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden mb-10">
        <div className="h-48 bg-gradient-to-r from-emerald-600 to-teal-500"></div>
        <div className="px-8 md:px-12 pb-12">
          <div className="relative -mt-20 mb-8 flex flex-col md:flex-row items-center md:items-end gap-6">
            <img src={worker.avatar || `https://ui-avatars.com/api/?name=${worker.firstName}`} className="w-44 h-44 rounded-[3.5rem] border-[10px] border-white shadow-2xl object-cover bg-slate-50" />
            <div className="text-center md:text-right flex-grow">
               <h2 className="text-4xl font-black text-slate-900 mb-2">{worker.firstName} {worker.lastName}</h2>
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-emerald-600 font-black">
                  <span className="flex items-center gap-1.5"><MapPin size={18}/> {worker.location.wilaya}</span>
                  <div className="flex items-center gap-1 text-yellow-500"><Star size={18} fill="currentColor"/> 5.0</div>
               </div>
            </div>
            <div className="flex gap-3">
               <button onClick={onStartChat} className="bg-emerald-600 text-white p-4 rounded-3xl shadow-lg hover:bg-emerald-500 transition-all"><MessageSquare size={24}/></button>
               <button className="bg-slate-900 text-white p-4 rounded-3xl shadow-lg hover:bg-slate-800 transition-all"><Phone size={24}/></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
             <div className="md:col-span-2 space-y-10">
                <section>
                  <h4 className="text-xl font-black text-slate-900 mb-4">حول الحرفي</h4>
                  <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100"><p className="text-slate-600 font-medium text-lg leading-relaxed">{worker.bio || 'مبدع يسعى لتقديم الأفضل.'}</p></div>
                </section>
                <section>
                  <h4 className="text-xl font-black text-slate-900 mb-4">معرض الأعمال</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {portfolio.length > 0 ? portfolio.map((img, i) => (
                      <div key={i} className="aspect-square rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm"><img src={img} className="w-full h-full object-cover"/></div>
                    )) : <p className="col-span-full text-slate-400 font-bold py-10">لا يوجد صور بعد.</p>}
                  </div>
                </section>
             </div>
             <div className="space-y-6">
                <div className="bg-emerald-600 text-white p-8 rounded-[3rem] shadow-xl relative overflow-hidden group">
                   <h5 className="font-black text-xl mb-4 relative z-10">إحصائيات</h5>
                   <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-center bg-white/10 p-3 rounded-2xl"><span>مهام مكتملة</span><span className="font-black">12</span></div>
                      <div className="flex justify-between items-center bg-white/10 p-3 rounded-2xl"><span>سنوات الخبرة</span><span className="font-black">+5</span></div>
                   </div>
                </div>
                <button onClick={onStartChat} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all">تحدث معه الآن</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TasksMarketView({ onStartChat }: { onStartChat: (id: string) => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
    <div className="max-w-7xl mx-auto py-10 px-6 animate-fade-in text-right">
      <SectionHeading title="سوق المهام" subtitle="فرص عمل جديدة تنتظرك، تواصل مع الزبائن مباشرة." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tasks.map(task => (
          <div key={task.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col cursor-pointer hover:border-emerald-200 transition-all" onClick={() => setSelectedTask(task)}>
            <div className="flex justify-between mb-6">
               <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-xl font-black text-xs">{task.category}</span>
               <span className="text-emerald-600 font-black text-xl">{task.budget} <span className="text-xs">دج</span></span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4">{task.title}</h3>
            <p className="text-slate-500 font-medium line-clamp-2 mb-6">{task.description}</p>
            <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
               <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><MapPin size={14}/> {task.wilaya}</span>
               <button onClick={(e) => {e.stopPropagation(); onStartChat(task.seeker_id);}} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-emerald-600 transition-all">تواصل</button>
            </div>
          </div>
        ))}
      </div>
      {selectedTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in text-right">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 relative">
             <button onClick={() => setSelectedTask(null)} className="absolute top-8 left-8 p-3 text-slate-400 hover:bg-slate-50 rounded-2xl"><X size={24}/></button>
             <h2 className="text-3xl font-black mb-6">{selectedTask.title}</h2>
             <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-6 rounded-3xl"><p className="text-xs text-slate-400 font-black">الميزانية</p><p className="text-2xl font-black text-emerald-600">{selectedTask.budget} دج</p></div>
                <div className="bg-slate-50 p-6 rounded-3xl"><p className="text-xs text-slate-400 font-black">الموقع</p><p className="text-2xl font-black text-slate-700">{selectedTask.wilaya}</p></div>
             </div>
             <p className="text-slate-600 font-medium text-lg leading-relaxed mb-10">{selectedTask.description}</p>
             <div className="flex gap-4">
                <button onClick={() => onStartChat(selectedTask.seeker_id)} className="flex-grow bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-3">
                   <MessageSquare/> تواصل وقدم عرضك
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// (Remaining views like EditProfile, LandingView, etc. stay largely same but can now call onStartChat)

function LandingView({ onStart, onRegister }: { onStart: () => void; onRegister: () => void }) {
  return (
    <div className="animate-fade-in">
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-slate-950 bg-[url('https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2000')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
        <div className="relative z-10 max-w-5xl text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full text-xs font-black mb-8 border border-white/10 tracking-widest uppercase"><Trophy size={16} className="text-yellow-400"/> المنصة الأولى للخدمات الاحترافية</div>
          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tighter">ريح بالك، <span className="text-emerald-400 italic">سَلّكني</span> يسلكها!</h1>
          <p className="text-xl md:text-3xl text-slate-300 mb-12 font-medium max-w-3xl mx-auto leading-relaxed">بوابتك الذكية للوصول إلى أفضل الحرفيين المهرة في الجزائر.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
             <button onClick={onStart} className="bg-emerald-600 px-14 py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-emerald-500 transition-all active:scale-95 w-full sm:w-auto">اطلب خدمة الآن 🔍</button>
             <button onClick={onRegister} className="bg-white/10 backdrop-blur-md px-14 py-6 rounded-[2.5rem] font-black text-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-95 w-full sm:w-auto">انضم كحرفي 🛠️</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SearchWorkersView({ onNavigate, onViewWorker }: { onNavigate: (view: AppState['view']) => void, onViewWorker: (worker: User) => void }) {
  const [workers, setWorkers] = useState<User[]>([]);
  useEffect(() => {
    supabase.from('users').select('*').eq('role', 'WORKER').then(({ data }) => {
      if (data) setWorkers(data.map(u => ({ ...u, firstName: u.first_name, lastName: u.last_name, location: { wilaya: u.wilaya } } as User)));
    });
  }, []);
  return (
    <div className="max-w-7xl mx-auto py-10 px-6 animate-fade-in text-right">
      <SectionHeading title="اكتشف الحرفيين" subtitle="تواصل مع المبدعين الموثقين بالقرب منك." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {workers.map(w => (
          <div key={w.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 cursor-pointer hover:border-emerald-200 transition-all" onClick={() => onViewWorker(w)}>
            <div className="flex gap-4 items-center mb-6">
              <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-50"/>
              <div className="flex-grow">
                 <h3 className="text-xl font-black text-slate-900">{w.firstName} {w.lastName}</h3>
                 <span className="text-emerald-600 font-bold text-xs">{w.location.wilaya}</span>
              </div>
            </div>
            <p className="text-slate-500 font-medium line-clamp-2 mb-6">{w.bio || 'حرفي محترف.'}</p>
            <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-sm">عرض الملف</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditProfileView({ user, onSaved, onCancel }: { user: User; onSaved: (u: User) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({ firstName: user.firstName, lastName: user.lastName, bio: user.bio || '', wilaya: user.location.wilaya });
  return (
    <div className="max-w-2xl mx-auto py-20 px-6 animate-fade-in text-right">
       <SectionHeading title="تعديل الملف" subtitle="حدث بياناتك المهنية." />
       <div className="bg-white p-10 rounded-[3rem] shadow-xl space-y-6">
          <input className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="الاسم" />
          <input className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="اللقب" />
          <textarea rows={4} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="نبذة عنك" />
          <button onClick={() => onSaved({...user, ...formData, location: { ...user.location, wilaya: formData.wilaya }})} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg">حفظ التغييرات</button>
          <button onClick={onCancel} className="w-full bg-slate-100 text-slate-400 py-5 rounded-2xl font-black text-xl">إلغاء</button>
       </div>
    </div>
  );
}
