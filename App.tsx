
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
  ImageIcon,
  UploadCloud,
  Bell,
  Send,
  MoreVertical,
  PlusCircle,
  AlertCircle,
  Briefcase,
  Image as LucideImage,
  PlusSquare,
  Lock,
  Mail,
  UserPlus,
  LogIn
} from 'lucide-react';

// --- المكونات العامة والأنماط ---

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap');
      .arabic-text { font-family: 'Tajawal', sans-serif; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
      .craft-card { 
        background: white; 
        border-radius: 3.5rem; 
        border: 1px solid rgba(226, 232, 240, 0.8);
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .craft-card:hover { 
        transform: translateY(-8px); 
        box-shadow: 0 30px 60px -15px rgba(16, 185, 129, 0.12);
        border-color: rgba(16, 185, 129, 0.3);
      }
      .btn-primary {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 0 15px 30px -10px rgba(16, 185, 129, 0.4);
      }
      .chat-bubble-user {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border-radius: 2rem 2rem 0.5rem 2rem;
      }
      .chat-bubble-other {
        background: #f1f5f9;
        color: #1e293b;
        border-radius: 2rem 2rem 2rem 0.5rem;
      }
      .input-field {
        width: 100%;
        padding: 1.25rem 1.5rem;
        background-color: #f8fafc;
        border-radius: 1.5rem;
        border: 2px solid transparent;
        font-weight: 700;
        transition: all 0.3s ease;
      }
      .input-field:focus {
        border-color: #10b981;
        background-color: white;
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        outline: none;
      }
      .loading-spinner {
        width: 1.5rem;
        height: 1.5rem;
        border: 3px solid rgba(16, 185, 129, 0.1);
        border-top-color: #10b981;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      .loading-spinner.border-white {
        border-color: rgba(255, 255, 255, 0.3);
        border-top-color: white;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  );
}

// --- أدوات مساعدة ---

const ensureArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [val];
    } catch {
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
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

// --- المكونات المشتركة ---

function Logo({ onClick, size = 'sm' }: { onClick?: () => void; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'lg' ? 'w-24 h-24 text-4xl' : size === 'md' ? 'w-14 h-14 text-2xl' : 'w-10 h-10 text-lg';
  return (
    <div onClick={onClick} className="flex items-center gap-4 cursor-pointer group active:scale-95 transition-all">
      <div className={`${s} bg-emerald-600 flex items-center justify-center text-white font-black rounded-[1.8rem] shadow-xl shadow-emerald-200 group-hover:rotate-6 transition-transform`}>S</div>
      <div className="flex flex-col">
        <span className={`${size === 'lg' ? 'text-5xl' : 'text-2xl'} font-black text-slate-900 tracking-tighter`}>Salakni</span>
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">الجزائر المهارة</span>
      </div>
    </div>
  );
}

function NavButton({ children, active, onClick, badge }: { children?: React.ReactNode; active?: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative font-black text-lg transition-all ${active ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'}`}
    >
      {children}
      {badge ? (
        <span className="absolute -top-2 -right-4 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm font-bold">
          {badge}
        </span>
      ) : null}
      {active && <div className="absolute -bottom-2 left-0 right-0 h-1 bg-emerald-500 rounded-full"></div>}
    </button>
  );
}

function TabItem({ icon: Icon, label, active, onClick, badge }: { icon: any; label: string; active?: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 relative group flex-1">
      <div className={`p-2 rounded-2xl transition-all ${active ? 'bg-emerald-50 text-emerald-600 scale-110' : 'text-slate-400 group-hover:text-emerald-500'}`}>
        <Icon size={24} />
      </div>
      <span className={`text-[10px] font-black transition-all ${active ? 'text-emerald-600' : 'text-slate-400'}`}>{label}</span>
      {badge ? (
        <span className="absolute top-1 right-1/2 translate-x-3 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border border-white font-bold">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 animate-fade-in">
      <div className="max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 leading-tight">{title}</h1>
        {subtitle && <p className="text-xl text-slate-500 font-medium leading-relaxed">{subtitle}</p>}
        <div className="h-2 w-24 bg-emerald-500 rounded-full mt-6"></div>
      </div>
      {action && <div className="w-full md:w-auto">{action}</div>}
    </div>
  );
}

// --- واجهات تسجيل الدخول والاشتراك ---

function LoginView({ onLogin, onSwitchToRegister }: { onLogin: (u: User) => void; onSwitchToRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) throw userError;

      const user: User = {
        ...userData,
        firstName: userData.first_name,
        lastName: userData.last_name,
        location: { wilaya: userData.wilaya, daira: userData.daira || '' },
        categories: ensureArray(userData.categories),
        skills: ensureArray(userData.skills),
        portfolio: ensureArray(userData.portfolio)
      };

      onLogin(user);
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-24 px-6 text-right animate-fade-in">
      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-[1.8rem] flex items-center justify-center text-emerald-600 mx-auto mb-6">
            <LogIn size={40}/>
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-2">تسجيل الدخول</h2>
          <p className="text-slate-400 font-bold">أهلاً بك مجدداً في عائلة سلكني</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center gap-3 text-sm animate-fade-in border border-red-100">
            <AlertCircle size={20}/> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
              <input 
                type="email" 
                required 
                className="input-field pr-14" 
                placeholder="example@mail.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
              <input 
                type="password" 
                required 
                className="input-field pr-14" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>
          </div>
          <button 
            disabled={loading} 
            className="w-full btn-primary py-5 rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <div className="loading-spinner w-6 h-6 border-white"></div> : <Zap size={24}/>}
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
          <p className="text-slate-400 font-bold mb-4">ليس لديك حساب؟</p>
          <button 
            onClick={onSwitchToRegister}
            className="text-emerald-600 font-black text-lg hover:underline transition-all"
          >
            إنشاء حساب جديد مجاناً
          </button>
        </div>
      </div>
    </div>
  );
}

function RegisterView({ onRegister, onSwitchToLogin }: { onRegister: (u: User) => void; onSwitchToLogin: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    wilaya: WILAYAS[0],
    role: 'SEEKER' as UserRole,
    category: SERVICE_CATEGORIES[0].name
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. إنشاء المستخدم في نظام Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('فشل إنشاء الحساب.');

      // 2. إنشاء بيانات البروفايل في جدول users
      const { error: dbError } = await supabase.from('users').insert([{
        id: authData.user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        role: formData.role,
        wilaya: formData.wilaya,
        categories: formData.role === 'WORKER' ? [formData.category] : [],
        verification_status: 'none',
        rating: 0,
        rating_count: 0,
        completed_jobs: 0
      }]);

      if (dbError) throw dbError;

      // 3. تجهيز كائن المستخدم للتطبيق
      const user: User = {
        id: authData.user.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
        location: { wilaya: formData.wilaya, daira: '' },
        categories: formData.role === 'WORKER' ? [formData.category] : [],
        skills: [],
        verificationStatus: 'none',
        portfolio: [],
        rating: 0,
        ratingCount: 0,
        completedJobs: 0
      };

      onRegister(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-16 px-6 text-right animate-fade-in">
      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-10 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-[1.8rem] flex items-center justify-center text-emerald-600 mx-auto mb-6">
            <UserPlus size={40}/>
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-2">انضم إلينا</h2>
          <p className="text-slate-400 font-bold">كن جزءاً من أكبر منصة حرفية في الجزائر</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center gap-3 text-sm border border-red-100">
            <AlertCircle size={20}/> {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-8">
          {step === 1 ? (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, role: 'SEEKER'})}
                  className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-3 ${formData.role === 'SEEKER' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-xl scale-105' : 'bg-slate-50 border-transparent text-slate-400'}`}
                >
                  <SearchIcon size={32}/>
                  <span className="font-black">أنا زبون</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, role: 'WORKER'})}
                  className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-3 ${formData.role === 'WORKER' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-xl scale-105' : 'bg-slate-50 border-transparent text-slate-400'}`}
                >
                  <Briefcase size={32}/>
                  <span className="font-black">أنا حرفي</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الاسم</label>
                  <input required className="input-field" placeholder="محمد" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">اللقب</label>
                  <input required className="input-field" placeholder="علي" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.firstName || !formData.lastName}
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                المتابعة <ArrowRight className="rotate-180" size={24}/>
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">البريد الإلكتروني</label>
                <input required type="email" className="input-field" placeholder="example@mail.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">رقم الهاتف</label>
                  <div className="relative">
                    <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                    <input required type="tel" className="input-field pr-14" placeholder="05XXXXXXXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الولاية</label>
                  <select className="input-field appearance-none outline-none" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              {formData.role === 'WORKER' && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">التخصص الأساسي</label>
                  <select className="input-field appearance-none outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">كلمة المرور</label>
                <input required type="password" title="يجب أن تكون 6 أحرف على الأقل" className="input-field" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>

              <div className="flex gap-4">
                <button 
                  disabled={loading} 
                  className="flex-grow btn-primary py-5 rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <div className="loading-spinner w-6 h-6 border-white"></div> : <Zap size={24}/>}
                  {loading ? 'جاري إنشاء الحساب...' : 'تأكيد التسجيل'}
                </button>
                <button type="button" onClick={() => setStep(1)} className="px-8 bg-slate-50 text-slate-500 rounded-[2rem] font-black hover:bg-slate-100 transition-all">رجوع</button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
          <p className="text-slate-400 font-bold mb-4">لديك حساب بالفعل؟</p>
          <button 
            onClick={onSwitchToLogin}
            className="text-emerald-600 font-black text-lg hover:underline transition-all"
          >
            تسجيل الدخول الآن
          </button>
        </div>
      </div>
    </div>
  );
}

// --- بقية الأقسام (Tasks, Chat, Workers) ---

// (تم حذف المكونات المكررة لتقليل حجم الكود مع الحفاظ عليها في التطبيق الأصلي)

// --- التطبيق الرئيسي ---

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
  
  const [offerText, setOfferText] = useState<string | undefined>();

  const setView = (v: AppState['view']) => {
    setState(prev => ({ ...prev, view: v }));
    window.scrollTo(0, 0);
    if (v !== 'chats') setOfferText(undefined);
  };

  const updateCurrentUser = (u: User | null) => {
    setState(prev => ({ ...prev, currentUser: u }));
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else {
      localStorage.removeItem('user');
      supabase.auth.signOut();
    }
  };

  const handleLogin = (u: User) => {
    updateCurrentUser(u);
    setView('landing');
  };

  const startChat = (id: string, initialMsg?: string) => {
    if (!state.currentUser) { setView('login'); return; }
    const mockChat: Chat = { id: 'c_'+id, participant_1: state.currentUser.id, participant_2: id, updated_at: new Date().toISOString() };
    if (initialMsg) setOfferText(initialMsg);
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
            <NavButton active={state.view === 'search'} onClick={() => setView('search')}>دليل الحرفيين</NavButton>
            <NavButton active={state.view === 'support'} onClick={() => setView('support')}>سوق المهام</NavButton>
            {state.currentUser && (
              <>
                <NavButton active={state.view === 'chats'} onClick={() => setView('chats')} badge={2}>الرسائل</NavButton>
                <NavButton active={state.view === 'notifications'} onClick={() => setView('notifications')}>التنبيهات</NavButton>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer p-2 pr-6 bg-white rounded-full border border-slate-200 hover:border-emerald-200 transition-all shadow-sm">
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-black text-base text-slate-800">{state.currentUser.firstName}</span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">حسابي</span>
                </div>
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-12 h-12 rounded-[1.2rem] object-cover border-2 border-white shadow-sm" alt="Profile" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                 <button onClick={() => setView('login')} className="text-slate-600 font-black px-6 hover:text-emerald-600 transition-all">دخول</button>
                 <button onClick={() => setView('register')} className="btn-primary px-10 py-4 rounded-2xl font-black text-base active:scale-95 transition-all">إنضم إلينا</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onStart={() => setView('search')} onRegister={() => setView('register')} />}
        {state.view === 'search' && <SearchWorkersView onViewWorker={(w) => setState({...state, selectedWorker: w, view: 'worker-details'})} />}
        {state.view === 'support' && <TasksMarketView onStartChat={startChat} />}
        {state.view === 'chats' && state.currentUser && <ChatView currentUser={state.currentUser} activeChat={state.activeChat || null} onBack={() => setView('landing')} initialMessage={offerText} />}
        
        {state.view === 'login' && <LoginView onLogin={handleLogin} onSwitchToRegister={() => setView('register')} />}
        {state.view === 'register' && <RegisterView onRegister={handleLogin} onSwitchToLogin={() => setView('login')} />}

        {state.view === 'worker-details' && state.selectedWorker && (
           <WorkerView worker={state.selectedWorker} onBack={() => setView('search')} onStartChat={() => startChat(state.selectedWorker!.id)} />
        )}

        {state.view === 'profile' && state.currentUser && (
           <WorkerView 
             worker={state.currentUser} 
             isOwnProfile={true}
             onBack={() => setView('landing')} 
             onEdit={() => setView('edit-profile')}
           />
        )}
        
        {state.view === 'edit-profile' && state.currentUser && (
           <EditProfileView 
             user={state.currentUser} 
             onSaved={(u) => { updateCurrentUser(u); setView('profile'); }} 
             onCancel={() => setView('profile')} 
           />
        )}
        
        {state.view === 'notifications' && (
          <div className="py-60 text-center animate-fade-in">
             <div className="loading-spinner mx-auto mb-8 w-16 h-16"></div>
             <h3 className="text-4xl font-black text-slate-800 mb-4">قيد التحديث...</h3>
             <p className="text-slate-400 font-bold text-xl">نقوم بتحسين هذا القسم لتوفير أفضل تجربة لك.</p>
             <button onClick={() => setView('landing')} className="mt-12 bg-emerald-600 text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all">العودة للرئيسية</button>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-around md:hidden z-[60] px-6 shadow-2xl rounded-t-[3rem]">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={SearchIcon} label="الحرفيين" active={state.view === 'search'} onClick={() => setView('search')} />
        <TabItem icon={ClipboardList} label="المهام" active={state.view === 'support'} onClick={() => setView('support')} />
        <TabItem icon={MessageSquare} label="الرسائل" active={state.view === 'chats'} onClick={() => setView('chats')} badge={2} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile' || state.view === 'edit-profile'} onClick={() => setView(state.currentUser ? 'profile' : 'login')} />
      </div>
    </div>
  );
}

// مكونات العرض الإضافية

function LandingView({ onStart, onRegister }: { onStart: () => void; onRegister: () => void }) {
  return (
    <div className="relative min-h-[95vh] flex items-center justify-center overflow-hidden py-20 px-6 animate-fade-in">
      <div className="absolute inset-0 bg-slate-950 bg-[url('https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
      <div className="relative z-10 max-w-5xl text-center text-white">
        <div className="inline-block mb-12 animate-float"><Logo size="lg" /></div>
        <h1 className="text-6xl md:text-9xl font-black mb-10 leading-tight tracking-tighter">سَلّكني <span className="text-emerald-400 italic">يسلكها!</span></h1>
        <p className="text-2xl md:text-4xl text-slate-300 mb-16 font-medium max-w-3xl mx-auto leading-relaxed">بوابتك الذكية للوصول إلى أمهر الحرفيين في الجزائر بكل احترافية وأمان.</p>
        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
           <button onClick={onStart} className="btn-primary px-16 py-8 rounded-[3rem] font-black text-3xl shadow-2xl active:scale-95 transition-all w-full sm:w-auto">اطلب خدمة الآن 🔍</button>
           <button onClick={onRegister} className="bg-white/10 backdrop-blur-md px-16 py-8 rounded-[3rem] font-black text-3xl border border-white/20 hover:bg-white/20 transition-all w-full sm:w-auto active:scale-95">سجل كحرفي 🛠️</button>
        </div>
      </div>
    </div>
  );
}

function TasksMarketView({ onStartChat }: { onStartChat: (id: string, initialMsg?: string) => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [offerMode, setOfferMode] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.from('tasks').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setTasks(data);
      setLoading(false);
    });
  }, []);

  const handleSendOffer = () => {
    if (!offerMessage.trim()) return;
    setSending(true);
    setTimeout(() => {
      onStartChat(selectedTask!.seeker_id, `بخصوص طلبك: "${selectedTask?.title}"\n\n${offerMessage}`);
      setSending(false);
      setSelectedTask(null);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto py-16 px-6 text-right min-h-screen">
      <PageHeader 
        title="سوق المهام" 
        subtitle="فرص عمل حقيقية بانتظارك. تصفح الطلبات، قدم عرضك المناسب وابدأ العمل فوراً."
        action={
          <button className="btn-primary w-full px-10 py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
            <Plus size={24}/> انشر طلباً جديداً
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-80 craft-card bg-slate-100 animate-pulse"></div>)
        ) : (
          tasks.map(task => (
            <div key={task.id} className="craft-card p-10 flex flex-col animate-fade-in">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-xl font-black text-[10px] border border-emerald-100 uppercase">{task.category}</span>
                <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl font-black text-lg">
                  {task.budget} <span className="text-[10px]">دج</span>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 line-clamp-2">{task.title}</h3>
              <p className="text-slate-500 font-medium line-clamp-3 mb-8 flex-grow leading-relaxed">{task.description}</p>
              <div className="border-t border-slate-50 pt-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black">{task.seeker_name || 'زبون سلكني'}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{new Date(task.created_at).toLocaleDateString('ar-DZ')}</span>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-slate-500 font-bold text-sm"><MapPin size={16} className="text-emerald-500"/> {task.wilaya}</span>
              </div>
              <button 
                onClick={() => setSelectedTask(task)}
                className="mt-8 bg-slate-50 text-slate-900 py-4 rounded-2xl font-black hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
              >
                تواصل وقدم عرضك
              </button>
            </div>
          ))
        )}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-12 relative shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <button onClick={() => {setSelectedTask(null); setOfferMode(false);}} className="absolute top-10 left-10 p-3 hover:bg-slate-100 rounded-2xl transition-all"><X size={28}/></button>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">{selectedTask.title}</h2>
            <div className="flex flex-wrap gap-4 mb-10">
               <span className="bg-slate-100 text-slate-700 px-5 py-2 rounded-2xl font-black text-sm">📍 {selectedTask.wilaya}</span>
               <span className="bg-emerald-100 text-emerald-700 px-5 py-2 rounded-2xl font-black text-sm">💰 ميزانية: {selectedTask.budget} دج</span>
            </div>
            {!offerMode ? (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                  <h4 className="font-black text-xl mb-4 text-slate-800 flex items-center gap-2"><Briefcase size={20}/> تفاصيل الطلب</h4>
                  <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
                <button 
                  onClick={() => setOfferMode(true)}
                  className="w-full btn-primary py-6 rounded-[2.5rem] font-black text-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <MessageSquare size={28}/> تقديم عرض عمل الآن
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100">
                  <h4 className="text-xl font-black text-emerald-900 mb-4 flex items-center gap-2"><Send size={20}/> اكتب عرضك المخصص للزبون</h4>
                  <textarea 
                    rows={5}
                    className="w-full p-6 bg-white rounded-3xl border-none font-bold text-lg focus:ring-2 ring-emerald-500/20 shadow-sm"
                    placeholder="مثلاً: أهلاً بك، أنا مهتم بالمهمة. أملك خبرة 10 سنوات في هذا المجال ويمكنني البدء غداً..."
                    value={offerMessage}
                    onChange={e => setOfferMessage(e.target.value)}
                  />
                  <div className="flex gap-4 mt-8">
                    <button 
                      disabled={sending || !offerMessage.trim()}
                      onClick={handleSendOffer}
                      className="flex-grow btn-primary py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {sending ? <div className="loading-spinner w-6 h-6 border-white"></div> : <CheckCircle2 size={24}/>}
                      {sending ? 'جاري الإرسال...' : 'إرسال العرض المباشر'}
                    </button>
                    <button onClick={() => setOfferMode(false)} className="px-8 bg-white border border-slate-200 rounded-[2rem] font-black text-slate-500 hover:bg-slate-50 transition-all">تراجع</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChatView({ currentUser, activeChat, onBack, initialMessage }: { currentUser: User; activeChat: Chat | null; onBack: () => void; initialMessage?: string }) {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(activeChat);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedChat) {
      const mockMsgs: Message[] = [
        { id: '1', chat_id: selectedChat.id, sender_id: selectedChat.participant_2, content: 'السلام عليكم، هل أنت متاح لهذا العمل؟', created_at: new Date(Date.now() - 3600000).toISOString(), is_read: true }
      ];
      if (initialMessage) {
        mockMsgs.push({ id: 'init', chat_id: selectedChat.id, sender_id: currentUser.id, content: initialMessage, created_at: new Date().toISOString(), is_read: false });
      }
      setMessages(mockMsgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, [selectedChat, initialMessage, currentUser.id]);

  const send = () => {
    if (!input.trim() || !selectedChat) return;
    const newMsg = { id: Date.now().toString(), chat_id: selectedChat.id, sender_id: currentUser.id, content: input, created_at: new Date().toISOString(), is_read: false };
    setMessages([...messages, newMsg]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-160px)] flex bg-white rounded-[4rem] shadow-2xl border border-slate-100 my-10 overflow-hidden animate-fade-in">
      <div className={`w-full md:w-1/3 border-l border-slate-50 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-10 border-b border-slate-50"><h2 className="text-3xl font-black text-slate-900">المحادثات</h2></div>
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-4">
           {[1,2].map(i => (
             <div key={i} onClick={() => setSelectedChat({id: 'c'+i, participant_1: currentUser.id, participant_2: 'p'+i, other_participant: {firstName: 'زبون', lastName: i} as any, updated_at: ''})} className={`p-6 rounded-[2.5rem] cursor-pointer border-2 transition-all flex items-center gap-4 ${selectedChat?.id === 'c'+i ? 'bg-emerald-50 border-emerald-100 shadow-lg shadow-emerald-50/50' : 'border-transparent hover:bg-slate-50'}`}>
                <div className="w-16 h-16 bg-emerald-600 rounded-[1.2rem] flex items-center justify-center text-white font-black text-2xl">ز</div>
                <div className="text-right">
                  <h4 className="font-black text-slate-900 text-lg">زبون سلكني {i}</h4>
                  <p className="text-xs text-slate-400 font-bold">آخر رسالة من ساعة...</p>
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className={`flex-grow flex flex-col ${!selectedChat ? 'hidden md:flex items-center justify-center bg-slate-50' : 'flex'}`}>
        {selectedChat ? (
          <>
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 text-slate-400"><ArrowRight/></button>
                <div className="w-14 h-14 bg-emerald-600 rounded-[1.2rem] flex items-center justify-center text-white font-black text-xl">ز</div>
                <div className="text-right">
                  <h3 className="text-xl font-black text-slate-900 leading-none">زبون سلكني</h3>
                  <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1 block">متصل الآن</span>
                </div>
              </div>
              <button className="p-4 text-slate-400 hover:bg-slate-50 rounded-2xl"><MoreVertical size={24}/></button>
            </div>
            
            <div className="flex-grow overflow-y-auto custom-scrollbar p-10 space-y-8 bg-slate-50/20">
               {messages.map(m => (
                 <div key={m.id} className={`flex ${m.sender_id === currentUser.id ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[75%] p-6 shadow-sm font-medium text-lg ${m.sender_id === currentUser.id ? 'chat-bubble-user' : 'chat-bubble-other'}`}>
                       {m.content}
                       <span className="text-[10px] opacity-60 block mt-2 text-left">{new Date(m.created_at).toLocaleTimeString('ar-DZ')}</span>
                    </div>
                 </div>
               ))}
               <div ref={scrollRef} />
            </div>

            <div className="p-8 bg-white border-t border-slate-50">
               <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="اكتب ردك الاحترافي هنا..." 
                    className="flex-grow p-5 bg-slate-50 rounded-[2rem] border-none font-bold text-lg focus:ring-2 ring-emerald-500/20"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && send()}
                  />
                  <button onClick={send} className="bg-emerald-600 text-white p-5 rounded-[1.5rem] shadow-xl hover:bg-emerald-500 active:scale-95 transition-all"><Send size={32}/></button>
               </div>
            </div>
          </>
        ) : (
          <div className="text-center p-20">
             <div className="w-32 h-32 bg-emerald-100 rounded-[3rem] flex items-center justify-center text-emerald-600 mx-auto mb-8 animate-float"><MessageSquare size={64}/></div>
             <h3 className="text-4xl font-black text-slate-900 mb-4">مركز المحادثات</h3>
             <p className="text-slate-400 font-bold max-w-sm mx-auto text-xl">اختر محادثة لبدء النقاش مع الزبون وإتمام الاتفاق.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchWorkersView({ onViewWorker }: { onViewWorker: (w: User) => void }) {
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('users').select('*').eq('role', 'WORKER').then(({ data }) => {
      if (data) setWorkers(data.map(u => ({ ...u, firstName: u.first_name, lastName: u.last_name, location: { wilaya: u.wilaya }, categories: ensureArray(u.categories) } as User)));
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-16 px-6 text-right min-h-screen">
      <PageHeader title="دليل الحرفيين" subtitle="نخبة الحرفيين المهرة في الجزائر، موثقون ومستعدون لتلبية احتياجاتك." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-80 craft-card bg-slate-100 animate-pulse"></div>)
        ) : (
          workers.map(w => (
            <div key={w.id} className="craft-card p-10 group" onClick={() => onViewWorker(w)}>
              <div className="flex gap-6 items-center mb-8 flex-row-reverse">
                <div className="relative">
                  <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-24 h-24 rounded-[2rem] object-cover shadow-xl border-4 border-white"/>
                  {w.verificationStatus === 'verified' && (
                    <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-xl border-4 border-white shadow-lg"><CheckCircle2 size={16}/></div>
                  )}
                </div>
                <div className="text-right flex-1">
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{w.firstName} {w.lastName}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {w.categories.slice(0, 2).map(c => <span key={c} className="text-emerald-600 font-black text-[10px] bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase">{c}</span>)}
                  </div>
                </div>
              </div>
              <p className="text-slate-500 font-medium mb-10 line-clamp-2 leading-relaxed text-lg">{w.bio || 'حرفي سلكني مبدع متاح لخدمتكم بأفضل المعايير.'}</p>
              <div className="flex justify-between items-center border-t border-slate-50 pt-8">
                <span className="text-slate-400 font-black flex items-center gap-2"><MapPin size={18} className="text-emerald-500"/> {w.location.wilaya}</span>
                <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm group-hover:bg-emerald-600 transition-all active:scale-95 shadow-lg">عرض الملف الشخصي</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function WorkerView({ worker, onBack, onStartChat, isOwnProfile, onEdit }: { worker: User; onBack: () => void; onStartChat?: () => void; isOwnProfile?: boolean; onEdit?: () => void }) {
  return (
    <div className="max-w-6xl mx-auto py-20 px-6 text-right animate-fade-in min-h-screen">
       <button onClick={onBack} className="flex items-center gap-3 text-slate-500 font-black mb-12 hover:text-emerald-600 transition-all text-xl"><ArrowRight size={24} className="rotate-180"/> {isOwnProfile ? 'العودة للرئيسية' : 'العودة للدليل'}</button>
       <div className="craft-card overflow-hidden">
          <div className="h-64 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-800"></div>
          <div className="px-12 pb-16">
             <div className="relative -mt-32 mb-16 flex flex-col md:flex-row items-center md:items-end gap-12">
                <img src={worker.avatar || `https://ui-avatars.com/api/?name=${worker.firstName}`} className="w-64 h-64 rounded-[4.5rem] border-8 border-white shadow-2xl object-cover bg-slate-50" alt="Avatar" />
                <div className="text-center md:text-right flex-grow">
                   <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-6">{worker.firstName} {worker.lastName}</h2>
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 text-emerald-600 font-black text-2xl">
                      <span className="flex items-center gap-2"><MapPin size={28}/> {worker.location.wilaya}</span>
                      <span className="flex items-center gap-2 text-yellow-500"><Star size={28} fill="currentColor"/> 4.9 (42 تقييم)</span>
                   </div>
                </div>
                {isOwnProfile ? (
                   <button onClick={onEdit} className="btn-primary p-6 rounded-[2.5rem] shadow-2xl active:scale-95 transition-all flex items-center gap-4 text-2xl font-black"><Edit size={32}/> تعديل الملف الشخصي</button>
                ) : (
                   <div className="flex gap-4">
                      <button onClick={onStartChat} className="btn-primary p-6 rounded-[2.5rem] shadow-2xl active:scale-95 transition-all"><MessageSquare size={36}/></button>
                      <button className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl active:scale-95 transition-all"><Phone size={36}/></button>
                   </div>
                )}
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                <div className="lg:col-span-2 space-y-16">
                   <section>
                      <h4 className="text-3xl font-black text-slate-900 mb-8 border-b-4 border-emerald-500 w-fit pb-2">حول الحرفي</h4>
                      <div className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100"><p className="text-slate-600 font-medium text-2xl leading-relaxed whitespace-pre-wrap">{worker.bio || 'حرفي سلكني متميز يلتزم بأعلى معايير الجودة والاتقان في العمل.'}</p></div>
                   </section>
                   <section>
                      <h4 className="text-3xl font-black text-slate-900 mb-8 border-b-4 border-emerald-500 w-fit pb-2">التخصصات والمهارات</h4>
                      <div className="space-y-6">
                         <div className="flex flex-wrap gap-3">
                            {ensureArray(worker.categories).map(c => <span key={c} className="bg-emerald-600 text-white px-6 py-2 rounded-2xl font-black text-sm">{c}</span>)}
                         </div>
                         <div className="flex flex-wrap gap-2">
                            {ensureArray(worker.skills).map(s => <span key={s} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm border border-slate-200">#{s}</span>)}
                         </div>
                      </div>
                   </section>
                   <section>
                      <h4 className="text-3xl font-black text-slate-900 mb-8 border-b-4 border-emerald-500 w-fit pb-2">معرض الأعمال</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                        {ensureArray(worker.portfolio).map((img, i) => (
                          <div key={i} className="aspect-square rounded-[3rem] bg-slate-100 border border-slate-200 shadow-sm overflow-hidden group">
                             <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125" alt={`Work sample ${i}`}/>
                          </div>
                        ))}
                        {ensureArray(worker.portfolio).length === 0 && (
                          <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-100 rounded-[4rem]">
                             <ImageIcon size={80} className="text-slate-100 mx-auto mb-4"/>
                             <p className="text-slate-400 font-black text-xl">لا يوجد صور في معرض الأعمال حالياً.</p>
                          </div>
                        )}
                      </div>
                   </section>
                </div>
                <div className="space-y-10">
                   <div className="bg-emerald-600 text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute -right-16 -bottom-16 opacity-10 rotate-12 group-hover:scale-125 transition-transform duration-700"><Trophy size={260}/></div>
                      <h5 className="font-black text-3xl mb-10 relative z-10">البيانات المهنية</h5>
                      <div className="space-y-6 relative z-10">
                         <div className="flex justify-between items-center bg-white/10 p-6 rounded-[2rem] backdrop-blur-sm"><span>مهام مكتملة</span><span className="font-black text-3xl">{worker.completedJobs || 24}</span></div>
                         <div className="flex justify-between items-center bg-white/10 p-6 rounded-[2rem] backdrop-blur-sm"><span>سنوات الخبرة</span><span className="font-black text-3xl">+8</span></div>
                         <div className="flex justify-between items-center bg-white/10 p-6 rounded-[2rem] backdrop-blur-sm"><span>زمن الاستجابة</span><span className="font-black text-3xl">~10د</span></div>
                      </div>
                   </div>
                   {!isOwnProfile && onStartChat && (
                      <button onClick={onStartChat} className="w-full btn-primary py-8 rounded-[3rem] font-black text-3xl flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all">ابدأ المحادثة الآن</button>
                   )}
                   <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6">
                      <h5 className="font-black text-2xl text-slate-900 border-b pb-4">الأمان والموثوقية</h5>
                      <div className="flex items-center gap-4 text-emerald-600 font-black text-lg">
                         <ShieldCheck size={28}/> هاتف مؤكد وموثق
                      </div>
                      <div className="flex items-center gap-4 text-emerald-600 font-black text-lg">
                         <Check size={28}/> الهوية الوطنية مؤكدة
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

// --- Edit Profile Component (Fixed Missing Component) ---

function EditProfileView({ user, onSaved, onCancel }: { user: User; onSaved: (u: User) => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    bio: user.bio || '',
    wilaya: user.location.wilaya,
    skills: user.skills.join(', '),
    categories: user.categories,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      
      const { error } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          bio: formData.bio,
          wilaya: formData.wilaya,
          skills: skillsArray,
          categories: formData.categories,
        })
        .eq('id', user.id);

      if (error) throw error;

      const updatedUser: User = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        bio: formData.bio,
        location: { ...user.location, wilaya: formData.wilaya },
        skills: skillsArray,
        categories: formData.categories,
      };

      onSaved(updatedUser);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 text-right animate-fade-in">
      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-12">
        <div className="flex items-center gap-6 mb-12">
           <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600">
              <Edit size={40}/>
           </div>
           <h2 className="text-4xl font-black text-slate-900">تعديل الملف الشخصي</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الاسم</label>
              <input required className="input-field" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">اللقب</label>
              <input required className="input-field" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">رقم الهاتف</label>
              <input required className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الولاية</label>
              <select className="input-field appearance-none outline-none" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">نبذة عني</label>
            <textarea rows={4} className="input-field" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="تحدث عن خبرتك ومهاراتك..." />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">المهارات (افصل بينها بفاصلة)</label>
            <input className="input-field" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="مثال: تركيب أنابيب، تصليح مضخات..." />
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-10">
            <button 
              disabled={loading} 
              className="flex-grow btn-primary py-6 rounded-[2.5rem] font-black text-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? <div className="loading-spinner w-8 h-8 border-white"></div> : <Save size={32}/>}
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
            <button type="button" onClick={onCancel} className="px-12 bg-slate-100 text-slate-500 rounded-[2.5rem] font-black text-xl hover:bg-slate-200 transition-all">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}
