
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
  MoreVertical,
  PlusCircle
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
      .glass-card { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
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
    return val.split(',').map(s => s.trim()).filter(Boolean);
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

// --- Specific Views ---

function EditProfileView({ user, onSaved, onCancel }: { user: User; onSaved: (u: User) => void; onCancel: () => void }) {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    bio: user.bio || '',
    wilaya: user.location?.wilaya || WILAYAS[0],
    avatar: user.avatar || '',
    categories: ensureArray(user.categories),
    skills: ensureArray(user.skills),
    portfolio: ensureArray(user.portfolio),
    skillInput: ''
  });
  const [saving, setSaving] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setFormData(prev => ({ ...prev, avatar: base64 }));
    }
  };

  const handlePortfolioAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const remainingSlots = 5 - formData.portfolio.length;
      if (remainingSlots <= 0) {
        alert("لقد وصلت للحد الأقصى (5 صور)");
        return;
      }
      
      // Fix: Explicitly casting f to File to resolve TS 'unknown' inference error from Array.from(FileList)
      const newImages = await Promise.all(
        Array.from(files).slice(0, remainingSlots).map(f => fileToBase64(f as File))
      );
      setFormData(prev => ({ ...prev, portfolio: [...prev.portfolio, ...newImages] }));
    }
  };

  const removePortfolioItem = (idx: number) => {
    setFormData(prev => ({ ...prev, portfolio: prev.portfolio.filter((_, i) => i !== idx) }));
  };

  const toggleCategory = (catName: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(catName) 
        ? prev.categories.filter(c => c !== catName) 
        : [...prev.categories, catName]
    }));
  };

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && formData.skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(formData.skillInput.trim())) {
        setFormData(prev => ({
          ...prev,
          skills: [...prev.skills, formData.skillInput.trim()],
          skillInput: ''
        }));
      }
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedUser: User = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        bio: formData.bio,
        avatar: formData.avatar,
        location: { ...user.location, wilaya: formData.wilaya },
        categories: formData.categories,
        skills: formData.skills,
        portfolio: formData.portfolio
      };
      
      // Simulating Supabase call for now since we're updating in-memory app state for demo
      onSaved(updatedUser);
    } catch (err: any) {
      alert("خطأ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in text-right">
      <SectionHeading title="تعديل الملف الشخصي" subtitle="اجعل بروفايلك أكثر جاذبية للزبائن." />

      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header/Cover Photo Area */}
        <div className="h-40 bg-gradient-to-r from-emerald-600 to-teal-500 relative">
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 md:right-12 md:translate-x-0">
             <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
               <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.firstName}`} className="w-40 h-40 rounded-[3rem] border-8 border-white shadow-xl object-cover bg-white" />
               <div className="absolute inset-0 bg-black/30 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <Camera className="text-white" size={32} />
               </div>
               <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
             </div>
          </div>
        </div>

        <div className="px-8 md:px-12 pt-20 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الاسم الشخصي</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 ring-emerald-500/20" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">اللقب</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 ring-emerald-500/20" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">رقم الهاتف</label>
                <input className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 ring-emerald-500/20" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الولاية</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
             </div>
          </div>

          <div className="space-y-12">
             <section>
                <h4 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">نبذة مهنية (Bio) <Info size={18} className="text-emerald-500"/></h4>
                <textarea rows={4} className="w-full p-6 bg-slate-50 rounded-[2rem] border-none font-medium text-lg focus:ring-2 ring-emerald-500/20" placeholder="أخبر الزبائن عن خبرتك وأسلوب عملك..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
             </section>

             <section>
                <h4 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">التخصصات <Zap size={18} className="text-emerald-500"/></h4>
                <div className="flex flex-wrap gap-2">
                   {SERVICE_CATEGORIES.map(cat => (
                     <button 
                       key={cat.id} 
                       onClick={() => toggleCategory(cat.name)}
                       className={`px-5 py-2.5 rounded-2xl font-black text-sm transition-all border ${formData.categories.includes(cat.name) ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                     >
                       {cat.name}
                     </button>
                   ))}
                </div>
             </section>

             <section>
                <h4 className="text-xl font-black text-slate-900 mb-4">المهارات والتقنيات</h4>
                <div className="space-y-4">
                   <div className="flex gap-3">
                      <input 
                        className="flex-grow p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20" 
                        placeholder="أضف مهارة (مثلاً: جبس بورد، صيانة مضخات...)" 
                        value={formData.skillInput} 
                        onChange={e => setFormData({...formData, skillInput: e.target.value})}
                        onKeyDown={addSkill}
                      />
                      <button onClick={() => addSkill({ key: 'Enter', preventDefault: () => {} } as any)} className="bg-slate-900 text-white p-4 rounded-2xl"><Plus/></button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {formData.skills.map(skill => (
                        <span key={skill} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2">
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                        </span>
                      ))}
                   </div>
                </div>
             </section>

             <section>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">معرض أعمالي <ImageIcon size={18} className="text-emerald-500"/></h4>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{formData.portfolio.length} / 5</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                   {formData.portfolio.map((img, idx) => (
                     <div key={idx} className="relative aspect-square rounded-[1.5rem] overflow-hidden group shadow-sm border border-slate-100">
                        <img src={img} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removePortfolioItem(idx)}
                          className="absolute top-2 left-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        >
                          <Trash2 size={14}/>
                        </button>
                     </div>
                   ))}
                   {formData.portfolio.length < 5 && (
                     <button 
                       onClick={() => portfolioInputRef.current?.click()}
                       className="aspect-square rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all gap-2"
                     >
                        <UploadCloud size={32} />
                        <span className="text-[10px] font-black uppercase">إضافة صورة</span>
                     </button>
                   )}
                </div>
                <input type="file" ref={portfolioInputRef} className="hidden" accept="image/*" multiple onChange={handlePortfolioAdd} />
             </section>
          </div>

          <div className="pt-12 mt-12 border-t border-slate-50 flex flex-col sm:flex-row gap-4">
             <button 
               disabled={saving}
               onClick={handleSave}
               className="flex-grow bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-emerald-200 hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
             >
                {saving ? <div className="loading-spinner w-6 h-6 border-white"></div> : <Save size={24}/>}
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات الآن'}
             </button>
             <button onClick={onCancel} className="px-10 bg-slate-100 text-slate-500 py-5 rounded-[2rem] font-black text-lg hover:bg-slate-200 transition-all">إلغاء</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Chat View ---

function ChatView({ currentUser, activeChat, onBack }: { currentUser: User; activeChat: Chat | null; onBack: () => void }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(activeChat);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In a real app, this would be a Supabase subscription
    // Mocking initial chats
    setChats([
      { id: 'chat_1', participant_1: currentUser.id, participant_2: 'w_1', last_message: 'مرحباً، هل أنت متاح؟', updated_at: new Date().toISOString(), other_participant: { firstName: 'أحمد', lastName: 'الكهربائي', avatar: '' } as User },
      { id: 'chat_2', participant_1: currentUser.id, participant_2: 'w_2', last_message: 'سأرسل لك الموقع الآن', updated_at: new Date().toISOString(), other_participant: { firstName: 'ياسين', lastName: 'مرصص', avatar: '' } as User },
    ]);
  }, [currentUser]);

  useEffect(() => {
    if (selectedChat) {
      setMessages([
        { id: '1', chat_id: selectedChat.id, sender_id: selectedChat.participant_2, content: 'السلام عليكم، كيف يمكنني مساعدتك؟', created_at: new Date().toISOString(), is_read: true },
        { id: '2', chat_id: selectedChat.id, sender_id: currentUser.id, content: 'وعليكم السلام، أحتاج لصيانة عطل كهربائي في منزلي', created_at: new Date().toISOString(), is_read: true }
      ]);
    }
  }, [selectedChat, currentUser]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;
    const msg: Message = {
      id: Date.now().toString(),
      chat_id: selectedChat.id,
      sender_id: currentUser.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      is_read: false
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-160px)] flex flex-col md:flex-row bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-fade-in mt-6 mb-6">
      <div className={`w-full md:w-1/3 border-l border-slate-50 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 border-b border-slate-50"><h2 className="text-2xl font-black text-slate-900">المحادثات</h2></div>
        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-2">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setSelectedChat(chat)}
              className={`p-5 rounded-3xl cursor-pointer transition-all flex items-center gap-4 ${selectedChat?.id === chat.id ? 'bg-emerald-50 border-emerald-100' : 'hover:bg-slate-50 border-transparent'} border`}
            >
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-xl">
                {chat.other_participant?.avatar ? <img src={chat.other_participant.avatar} className="w-full h-full object-cover rounded-2xl"/> : chat.other_participant?.firstName[0]}
              </div>
              <div className="flex-grow text-right">
                <h4 className="font-black text-slate-900">{chat.other_participant?.firstName} {chat.other_participant?.lastName}</h4>
                <p className="text-xs text-slate-400 font-bold truncate">{chat.last_message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                  <span className="text-[10px] text-emerald-500 font-black uppercase">متصل الآن</span>
                </div>
              </div>
              <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl"><MoreVertical size={20}/></button>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-8 space-y-6 bg-slate-50/30">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender_id === currentUser.id ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-4 px-6 shadow-sm font-medium ${m.sender_id === currentUser.id ? 'chat-bubble-me' : 'chat-bubble-other'}`}>
                    <p>{m.content}</p>
                    <span className="text-[9px] opacity-60 block mt-1 text-left">{new Date(m.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
            <div className="p-6 bg-white border-t border-slate-50">
              <div className="flex gap-3">
                <input type="text" placeholder="اكتب رسالتك..." className="flex-grow p-4 px-6 bg-slate-50 rounded-2xl border-none font-bold focus:ring-2 ring-emerald-500/20" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} />
                <button onClick={sendMessage} className="bg-emerald-600 text-white p-4 px-6 rounded-2xl shadow-lg hover:bg-emerald-500 transition-all"><Send size={24}/></button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-20 space-y-4">
             <div className="w-24 h-24 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center text-emerald-600 mx-auto mb-6"><MessageSquare size={48}/></div>
             <h3 className="text-2xl font-black text-slate-900">ابدأ المحادثة</h3>
             <p className="text-slate-400 font-bold max-w-xs mx-auto">تواصل مباشرة مع الحرفيين أو الزبائن لمناقشة التفاصيل.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- App Main Logic ---

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
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user'); 
  };

  const openWorkerDetails = (worker: User) => {
    setState(prev => ({ ...prev, selectedWorker: worker, view: 'worker-details' }));
    window.scrollTo(0, 0);
  };

  const startChat = (workerId: string) => {
    if (!state.currentUser) { setView('login'); return; }
    // Mock creating chat
    const mockChat: Chat = {
      id: `chat_${workerId}`,
      participant_1: state.currentUser.id,
      participant_2: workerId,
      updated_at: new Date().toISOString(),
      other_participant: { firstName: 'مبدع', lastName: 'سلكني', avatar: '' } as User
    };
    setState(prev => ({ ...prev, activeChat: mockChat, view: 'chats' }));
  };

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-24 md:pb-0 custom-scrollbar" dir="rtl">
      <GlobalStyles />
      <nav className="sticky top-0 z-50 h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} size="md" />
          <div className="hidden md:flex items-center gap-12">
            <NavButton active={state.view === 'landing'} onClick={() => setView('landing')}>الرئيسية</NavButton>
            <NavButton active={state.view === 'search'} onClick={() => setView('search')}>الحرفيين</NavButton>
            <NavButton active={state.view === 'support'} onClick={() => setView('support')}>سوق المهام</NavButton>
            {state.currentUser && (
              <>
                <NavButton active={state.view === 'chats'} onClick={() => setView('chats')} badge={2}>الرسائل</NavButton>
                <NavButton active={state.view === 'notifications'} onClick={() => setView('notifications')} badge={3}>التنبيهات</NavButton>
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
        {state.view === 'search' && <SearchWorkersView onViewWorker={openWorkerDetails} />}
        {state.view === 'worker-details' && state.selectedWorker && <WorkerView worker={state.selectedWorker} onBack={() => setView('search')} onStartChat={() => startChat(state.selectedWorker!.id)} />}
        {state.view === 'chats' && state.currentUser && <ChatView currentUser={state.currentUser} activeChat={state.activeChat || null} onBack={() => setView('landing')} />}
        {state.view === 'profile' && state.currentUser && (
          <div className="max-w-4xl mx-auto py-24 px-6 animate-fade-in text-right">
             <div className="bg-white rounded-[4rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="h-48 bg-gradient-to-r from-emerald-600 to-teal-500"></div>
                <div className="px-12 pb-12">
                   <div className="relative -mt-24 mb-12">
                     <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-48 h-48 rounded-[3.5rem] border-8 border-white mx-auto shadow-2xl object-cover bg-white" />
                     {state.currentUser.verificationStatus === 'verified' && (
                       <div className="absolute bottom-6 right-1/2 translate-x-16 translate-y-2 bg-blue-500 text-white p-2.5 rounded-2xl border-4 border-white shadow-lg"><CheckCircle2 size={24}/></div>
                     )}
                   </div>
                   <div className="text-center mb-16">
                     <h2 className="text-5xl font-black text-slate-900 mb-4">{state.currentUser.firstName} {state.currentUser.lastName}</h2>
                     <div className="flex items-center justify-center gap-4 text-slate-500 font-bold">
                        <span className="flex items-center gap-1.5"><MapPin size={20} className="text-emerald-500"/> {state.currentUser.location.wilaya}</span>
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                        <span className="flex items-center gap-1.5 text-emerald-600 font-black"><Trophy size={20}/> حرفي معتمد</span>
                     </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                      <div className="space-y-10">
                         <section>
                            <h4 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4 mb-4">النبذة الشخصية</h4>
                            <p className="text-slate-600 font-medium leading-relaxed text-lg">{state.currentUser.bio || 'لم يتم إضافة نبذة بعد.'}</p>
                         </section>
                         <section>
                            <h4 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4 mb-4">التخصصات والخدمات</h4>
                            <div className="flex flex-wrap gap-2.5">
                               {ensureArray(state.currentUser.categories).map(c => <span key={c} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-black text-xs border border-emerald-100">{c}</span>)}
                            </div>
                         </section>
                      </div>
                      <div className="space-y-10">
                         <section>
                            <h4 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4 mb-4">المهارات والتقنيات</h4>
                            <div className="flex flex-wrap gap-2.5">
                               {ensureArray(state.currentUser.skills).map(s => <span key={s} className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl font-black text-xs border border-slate-100">{s}</span>)}
                            </div>
                         </section>
                         <div className="pt-10 flex flex-col gap-4">
                            <button onClick={() => setView('edit-profile')} className="bg-slate-900 text-white p-6 rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-600 transition-all active:scale-95"><Edit size={24}/> تعديل ملفي الشخصي</button>
                            <button onClick={() => updateCurrentUser(null)} className="bg-red-50 text-red-500 p-6 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-red-100 transition-all active:scale-95"><LogOut size={24}/> تسجيل الخروج</button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
        {state.view === 'edit-profile' && state.currentUser && <EditProfileView user={state.currentUser} onSaved={(u) => { updateCurrentUser(u); setView('profile'); }} onCancel={() => setView('profile')} />}
        {['login', 'register'].includes(state.view) && (
          <div className="py-40 text-center animate-fade-in"><div className="loading-spinner mx-auto mb-6"></div><h3 className="text-3xl font-black">قريباً...</h3><button onClick={() => setView('landing')} className="mt-8 text-emerald-600 font-black">العودة للرئيسية</button></div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-around md:hidden z-50 px-6 shadow-2xl">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={SearchIcon} label="البحث" active={state.view === 'search'} onClick={() => setView('search')} />
        <TabItem icon={MessageSquare} label="الرسائل" active={state.view === 'chats'} onClick={() => setView('chats')} badge={2} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile' || state.view === 'edit-profile'} onClick={() => setView(state.currentUser ? 'profile' : 'login')} />
      </div>
    </div>
  );
}

// Sub-views refactoring for brevity
function LandingView({ onStart, onRegister }: { onStart: () => void; onRegister: () => void }) {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 px-6 animate-fade-in">
      <div className="absolute inset-0 bg-slate-950 bg-[url('https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=2000')] bg-cover bg-center opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
      <div className="relative z-10 max-w-5xl text-center text-white">
        <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tighter">ريح بالك، <span className="text-emerald-400 italic">سَلّكني</span> يسلكها!</h1>
        <p className="text-xl md:text-3xl text-slate-300 mb-12 font-medium max-w-3xl mx-auto">بوابتك للوصول إلى أفضل الحرفيين المهرة في الجزائر بكل ثقة.</p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
           <button onClick={onStart} className="bg-emerald-600 px-14 py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-emerald-500 transition-all active:scale-95 w-full sm:w-auto">اطلب خدمة الآن 🔍</button>
           <button onClick={onRegister} className="bg-white/10 backdrop-blur-md px-14 py-6 rounded-[2.5rem] font-black text-2xl border border-white/20 hover:bg-white/20 transition-all w-full sm:w-auto">انضم كحرفي 🛠️</button>
        </div>
      </div>
    </div>
  );
}

function SearchWorkersView({ onViewWorker }: { onViewWorker: (w: User) => void }) {
  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fade-in text-right">
       <SectionHeading title="اكتشف الحرفيين" subtitle="تواصل مع المبدعين الموثقين بالقرب منك." />
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 hover:-translate-y-2 transition-all cursor-pointer group" onClick={() => onViewWorker({id: 'w_'+i, firstName: 'محمد', lastName: 'الحرفي', avatar: '', location: {wilaya: 'الجزائر'} } as User)}>
               <div className="flex gap-6 items-center mb-8 flex-row-reverse">
                  <div className="w-20 h-20 rounded-[2rem] bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-2xl">م</div>
                  <div className="text-right flex-1">
                     <h3 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600">محمد الحرفي</h3>
                     <span className="text-emerald-600 font-bold text-sm">ترصيص صحي</span>
                  </div>
               </div>
               <p className="text-slate-500 font-medium mb-8 line-clamp-2">خبير في تركيب وصيانة جميع أنواع الأنابيب والتدفئة المركزية بخبرة تتجاوز 10 سنوات.</p>
               <div className="flex justify-between items-center border-t border-slate-50 pt-6">
                  <span className="text-slate-400 font-bold">📍 الجزائر العاصمة</span>
                  <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm group-hover:bg-emerald-600">عرض الملف</button>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}

function WorkerView({ worker, onBack, onStartChat }: { worker: User; onBack: () => void; onStartChat: () => void }) {
  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fade-in text-right">
       <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-black mb-8 hover:text-emerald-600 transition-all"><ArrowRight size={20} className="rotate-180"/> العودة</button>
       <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-emerald-600 to-teal-500"></div>
          <div className="px-12 pb-12">
             <div className="relative -mt-24 mb-12 flex flex-col md:flex-row items-center md:items-end gap-8">
                <img src={worker.avatar || `https://ui-avatars.com/api/?name=${worker.firstName}`} className="w-48 h-48 rounded-[3.5rem] border-8 border-white shadow-2xl object-cover bg-slate-50" />
                <div className="text-center md:text-right flex-grow">
                   <h2 className="text-5xl font-black text-slate-900 mb-4">{worker.firstName} {worker.lastName}</h2>
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-emerald-600 font-black">
                      <span className="flex items-center gap-2"><MapPin size={22}/> {worker.location.wilaya}</span>
                      <span className="flex items-center gap-2 text-yellow-500"><Star size={22} fill="currentColor"/> 4.9 (24 تقييم)</span>
                   </div>
                </div>
                <div className="flex gap-4">
                   <button onClick={onStartChat} className="bg-emerald-600 text-white p-5 rounded-[2rem] shadow-xl hover:bg-emerald-500 transition-all"><MessageSquare size={28}/></button>
                   <button className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-xl hover:bg-slate-800 transition-all"><Phone size={28}/></button>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
                <div className="md:col-span-2 space-y-12">
                   <section>
                      <h4 className="text-2xl font-black text-slate-900 mb-6">حول الحرفي</h4>
                      <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100"><p className="text-slate-600 font-medium text-xl leading-relaxed">{worker.bio || 'مبدع سلكني يسعى لتقديم الأفضل.'}</p></div>
                   </section>
                   <section>
                      <h4 className="text-2xl font-black text-slate-900 mb-6">أعمال سابقة</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        {[1,2,3].map(i => <div key={i} className="aspect-square rounded-[2.5rem] bg-slate-100 border border-slate-200 shadow-sm overflow-hidden"><img src={`https://picsum.photos/400/400?random=${i}`} className="w-full h-full object-cover"/></div>)}
                      </div>
                   </section>
                </div>
                <div className="space-y-8">
                   <div className="bg-emerald-600 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                      <h5 className="font-black text-2xl mb-6 relative z-10">إحصائيات العمل</h5>
                      <div className="space-y-5 relative z-10">
                         <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl"><span>مهام مكتملة</span><span className="font-black text-2xl">18</span></div>
                         <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl"><span>سنوات الخبرة</span><span className="font-black text-2xl">+7</span></div>
                      </div>
                   </div>
                   <button onClick={onStartChat} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all">ابدأ المحادثة الآن</button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
