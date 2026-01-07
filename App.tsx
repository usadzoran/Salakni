
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
  Map as MapIcon
} from 'lucide-react';

// --- الأنماط العامة ---
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap');
      .arabic-text { font-family: 'Tajawal', sans-serif; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
      .craft-card { 
        background: white; 
        border-radius: 3.5rem; 
        border: 1px solid rgba(226, 232, 240, 0.8);
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
      }
      .btn-primary {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 0 15px 30px -10px rgba(16, 185, 129, 0.4);
      }
      .input-group {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .input-field {
        width: 100%;
        padding: 1.25rem 3.5rem 1.25rem 1.5rem;
        background-color: #f8fafc;
        border-radius: 1.5rem;
        border: 2px solid transparent;
        font-weight: 700;
        transition: all 0.3s ease;
        font-size: 1rem;
      }
      .input-field:focus {
        border-color: #10b981;
        background-color: white;
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        outline: none;
      }
      .input-icon {
        position: absolute;
        right: 1.25rem;
        top: 3.1rem;
        color: #94a3b8;
        transition: color 0.3s ease;
      }
      .input-field:focus + .input-icon,
      .input-field:focus ~ .input-icon {
        color: #10b981;
      }
      .loading-spinner {
        width: 1.5rem;
        height: 1.5rem;
        border: 3px solid rgba(16, 185, 129, 0.1);
        border-top-color: #10b981;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
  );
}

const ensureArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [];
};

// --- واجهة تسجيل الدخول ---
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

      const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
      if (userError) throw userError;

      const user: User = {
        ...userData,
        firstName: userData.first_name,
        lastName: userData.last_name,
        location: { wilaya: userData.wilaya, daira: userData.daira || '' },
        categories: ensureArray(userData.categories),
        skills: ensureArray(userData.skills),
        portfolio: ensureArray(userData.portfolio),
        verificationStatus: userData.verification_status || 'none',
        rating: userData.rating || 0,
        ratingCount: userData.rating_count || 0,
        completedJobs: userData.completed_jobs || 0
      };
      onLogin(user);
    } catch (err: any) {
      setError('خطأ في الدخول: يرجى التأكد من البريد الإلكتروني وكلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6 text-right animate-fade-in">
      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-10 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-[1.8rem] flex items-center justify-center text-emerald-600 mx-auto mb-6">
            <LogIn size={40}/>
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-2">دخول الحرفيين</h2>
          <p className="text-slate-400 font-bold">أهلاً بك مجدداً في عائلة سلكني</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center gap-3 text-sm border border-red-100"><AlertCircle size={20}/> {error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="input-group">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">البريد الإلكتروني</label>
            <input type="email" required className="input-field" placeholder="example@mail.com" value={email} onChange={e => setEmail(e.target.value)} />
            <Mail className="input-icon" size={20}/>
          </div>
          <div className="input-group">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">كلمة المرور</label>
            <input type="password" required className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            <Lock className="input-icon" size={20}/>
          </div>
          <button disabled={loading} className="w-full btn-primary py-5 rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            {loading ? <div className="loading-spinner border-white"></div> : <Zap size={24}/>}
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
          <p className="text-slate-400 font-bold mb-4">ليس لديك حساب حرفي؟</p>
          <button onClick={onSwitchToRegister} className="text-emerald-600 font-black text-lg hover:underline transition-all">إنشاء بروفايل مهني جديد</button>
        </div>
      </div>
    </div>
  );
}

// --- واجهة التسجيل ---
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
    daira: WILAYA_DATA[WILAYAS[0]][0],
    role: 'WORKER' as UserRole,
    category: SERVICE_CATEGORIES[0].name
  });

  const handleWilayaChange = (val: string) => {
    const dairas = WILAYA_DATA[val] || [];
    setFormData({
      ...formData,
      wilaya: val,
      daira: dairas[0] || ''
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('فشل إنشاء الحساب.');

      const { error: dbError } = await supabase.from('users').insert([{
        id: authData.user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        role: formData.role,
        wilaya: formData.wilaya,
        daira: formData.daira,
        categories: formData.role === 'WORKER' ? [formData.category] : [],
        verification_status: 'none',
        rating: 0,
        rating_count: 0,
        completed_jobs: 0
      }]);

      if (dbError) throw dbError;

      const user: User = {
        id: authData.user.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
        location: { wilaya: formData.wilaya, daira: formData.daira },
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
      setError(err.message || 'حدث خطأ غير متوقع.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-6 text-right animate-fade-in">
      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-[1.8rem] flex items-center justify-center text-emerald-600 mx-auto mb-6">
            <UserPlus size={40}/>
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-2">تسجيل حرفي جديد</h2>
          <p className="text-slate-400 font-bold italic">كن جزءاً من نخبة الحرفيين في الجزائر</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center gap-3 text-sm border border-red-100"><AlertCircle size={20}/> {error}</div>}

        <form onSubmit={handleRegister} className="space-y-8">
          {step === 1 ? (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="input-group">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الاسم الشخصي</label>
                  <input required className="input-field" placeholder="مثال: أحمد" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                  <UserIcon className="input-icon" size={20}/>
                </div>
                <div className="input-group">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">اللقب</label>
                  <input required className="input-field" placeholder="مثال: علي" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  <UserIcon className="input-icon" size={20}/>
                </div>
              </div>

              <div className="input-group">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">رقم الهاتف الجوال</label>
                <input required type="tel" className="input-field" placeholder="05XXXXXXXX" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <Phone className="input-icon" size={20}/>
              </div>

              <div className="input-group">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">البريد الإلكتروني</label>
                <input required type="email" className="input-field" placeholder="haraf@mail.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <Mail className="input-icon" size={20}/>
              </div>

              <button type="button" onClick={() => setStep(2)} disabled={!formData.firstName || !formData.phone || !formData.email} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                المتابعة لاختيار الموقع <ArrowRight className="rotate-180" size={24}/>
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="input-group">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الولاية</label>
                  <select className="input-field appearance-none" value={formData.wilaya} onChange={e => handleWilayaChange(e.target.value)}>
                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                  <MapIcon className="input-icon" size={20}/>
                  <ChevronDown className="absolute left-5 top-[3.1rem] text-slate-400 pointer-events-none" size={20}/>
                </div>
                <div className="input-group">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">البلدية / الدائرة</label>
                  <select className="input-field appearance-none" value={formData.daira} onChange={e => setFormData({...formData, daira: e.target.value})}>
                    {(WILAYA_DATA[formData.wilaya] || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Building2 className="input-icon" size={20}/>
                  <ChevronDown className="absolute left-5 top-[3.1rem] text-slate-400 pointer-events-none" size={20}/>
                </div>
              </div>

              <div className="input-group">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">التخصص المهني</label>
                <select className="input-field appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <Briefcase className="input-icon" size={20}/>
                <ChevronDown className="absolute left-5 top-[3.1rem] text-slate-400 pointer-events-none" size={20}/>
              </div>

              <div className="input-group">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">إنشاء كلمة مرور</label>
                <input required type="password" minLength={6} className="input-field" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                <Lock className="input-icon" size={20}/>
              </div>

              <div className="flex gap-4">
                <button disabled={loading} className="flex-grow btn-primary py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  {loading ? <div className="loading-spinner border-white"></div> : <Zap size={24}/>}
                  {loading ? 'جاري إنشاء بروفايلك...' : 'تأكيد التسجيل النهائي'}
                </button>
                <button type="button" onClick={() => setStep(1)} className="px-8 bg-slate-50 text-slate-500 rounded-[2rem] font-black hover:bg-slate-100 transition-all">رجوع</button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
          <p className="text-slate-400 font-bold mb-4">لديك حساب بالفعل؟</p>
          <button onClick={onSwitchToLogin} className="text-emerald-600 font-black text-lg hover:underline transition-all">سجل دخولك من هنا</button>
        </div>
      </div>
    </div>
  );
}

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
  };

  const updateCurrentUser = (u: User | null) => {
    setState(prev => ({ ...prev, currentUser: u }));
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else {
      localStorage.removeItem('user');
      supabase.auth.signOut();
    }
  };

  const startChat = (id: string, initialMsg?: string) => {
    if (!state.currentUser) { setView('login'); return; }
    const mockChat: Chat = { id: 'c_'+id, participant_1: state.currentUser.id, participant_2: id, updated_at: new Date().toISOString() };
    if (initialMsg) setOfferText(initialMsg);
    setState(prev => ({ ...prev, activeChat: mockChat, view: 'chats' }));
  };

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-24 md:pb-0" dir="rtl">
      <GlobalStyles />
      
      <nav className="sticky top-0 z-50 h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} />
          <div className="hidden md:flex items-center gap-12">
            <NavButton active={state.view === 'landing'} onClick={() => setView('landing')}>الرئيسية</NavButton>
            <NavButton active={state.view === 'search'} onClick={() => setView('search')}>دليل الحرفيين</NavButton>
            <NavButton active={state.view === 'support'} onClick={() => setView('support')}>سوق المهام</NavButton>
          </div>
          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer p-2 pr-6 bg-white rounded-full border border-slate-200 hover:border-emerald-200 shadow-sm transition-all">
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-black text-base text-slate-800">{state.currentUser.firstName}</span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase">حسابي</span>
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
        {state.view === 'login' && <LoginView onLogin={(u) => { updateCurrentUser(u); setView('landing'); }} onSwitchToRegister={() => setView('register')} />}
        {state.view === 'register' && <RegisterView onRegister={(u) => { updateCurrentUser(u); setView('landing'); }} onSwitchToLogin={() => setView('login')} />}
        
        {state.view === 'profile' && state.currentUser && (
          <WorkerView worker={state.currentUser} isOwnProfile={true} onBack={() => setView('landing')} onEdit={() => setView('edit-profile')} />
        )}
        
        {state.view === 'worker-details' && state.selectedWorker && (
           <WorkerView worker={state.selectedWorker} onBack={() => setView('search')} onStartChat={() => startChat(state.selectedWorker!.id)} />
        )}

        {state.view === 'edit-profile' && state.currentUser && (
           <EditProfileView user={state.currentUser} onSaved={(u) => { updateCurrentUser(u); setView('profile'); }} onCancel={() => setView('profile')} />
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-around md:hidden z-[60] px-6 shadow-2xl rounded-t-[3rem]">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={SearchIcon} label="الحرفيين" active={state.view === 'search'} onClick={() => setView('search')} />
        <TabItem icon={ClipboardList} label="المهام" active={state.view === 'support'} onClick={() => setView('support')} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile' || state.view === 'edit-profile'} onClick={() => setView(state.currentUser ? 'profile' : 'login')} />
      </div>
    </div>
  );
}

// --- مكونات الهبوط ---
function LandingView({ onStart, onRegister }: { onStart: () => void; onRegister: () => void }) {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 px-6">
      <div className="absolute inset-0 bg-slate-950 bg-[url('https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=2000')] bg-cover bg-center opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
      <div className="relative z-10 max-w-5xl text-center text-white">
        <h1 className="text-6xl md:text-9xl font-black mb-10 tracking-tighter">سَلّكني <span className="text-emerald-400 italic">يسلكها!</span></h1>
        <p className="text-2xl md:text-4xl text-slate-300 mb-16 font-medium max-w-3xl mx-auto leading-relaxed">بوابتك الذكية للوصول إلى أمهر الحرفيين في الجزائر بكل احترافية وأمان.</p>
        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
           <button onClick={onStart} className="btn-primary px-16 py-8 rounded-[3rem] font-black text-3xl shadow-2xl active:scale-95 transition-all w-full sm:w-auto">اطلب خدمة الآن 🔍</button>
           <button onClick={onRegister} className="bg-white/10 backdrop-blur-md px-16 py-8 rounded-[3rem] font-black text-3xl border border-white/20 hover:bg-white/20 transition-all w-full sm:w-auto active:scale-95">سجل كحرفي 🛠️</button>
        </div>
      </div>
    </div>
  );
}

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-3 cursor-pointer group">
      <div className="w-12 h-12 bg-emerald-600 flex items-center justify-center text-white font-black rounded-2xl group-hover:rotate-6 transition-transform">S</div>
      <span className="text-2xl font-black text-slate-900 tracking-tighter">Salakni <span className="text-emerald-600">سلكني</span></span>
    </div>
  );
}

function NavButton({ children, active, onClick }: { children?: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`font-black text-lg transition-all ${active ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'}`}>
      {children}
    </button>
  );
}

function TabItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
      <Icon size={24} />
      <span className="text-[10px] font-black">{label}</span>
    </button>
  );
}

function TasksMarketView({ onStartChat }: { onStartChat: any }) { return <div className="p-20 text-center font-black">سوق المهام قريباً...</div>; }
function SearchWorkersView({ onViewWorker }: { onViewWorker: any }) { return <div className="p-20 text-center font-black">دليل الحرفيين قريباً...</div>; }

function WorkerView({ worker, isOwnProfile, onBack, onEdit }: any) { 
  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <button onClick={onBack} className="mb-10 text-emerald-600 font-bold flex items-center gap-2"><ArrowRight size={20} className="rotate-180"/> رجوع</button>
      <div className="craft-card p-12 text-center">
        <img src={worker.avatar || `https://ui-avatars.com/api/?name=${worker.firstName}`} className="w-40 h-40 rounded-[3rem] mx-auto mb-8 border-4 border-emerald-500 p-1 object-cover" />
        <h2 className="text-4xl font-black text-slate-900 mb-2">{worker.firstName} {worker.lastName}</h2>
        <div className="flex flex-col items-center gap-2 text-slate-500 font-bold mb-10">
           <span className="flex items-center gap-2 text-xl"><MapPin size={24} className="text-emerald-500"/> {worker.location.wilaya} - {worker.location.daira}</span>
           <span className="flex items-center gap-2 text-xl"><Phone size={24} className="text-emerald-500"/> {worker.phone}</span>
        </div>
        {isOwnProfile && <button onClick={onEdit} className="btn-primary px-12 py-5 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all flex items-center gap-3 mx-auto"><Edit size={24}/> تعديل ملفي الشخصي</button>}
      </div>
    </div>
  );
}

function EditProfileView({ user, onSaved, onCancel }: any) { 
  const [formData, setFormData] = useState({...user});
  return (
    <div className="max-w-3xl mx-auto py-20 px-6 animate-fade-in">
       <div className="bg-white rounded-[3.5rem] shadow-2xl p-12">
          <h2 className="text-3xl font-black mb-10 border-b pb-6">تعديل البيانات المهنية</h2>
          <div className="space-y-6">
             <div className="input-group">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase">رقم الهاتف</label>
                <input className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <Phone className="input-icon" size={20}/>
             </div>
             <div className="flex gap-6 pt-10">
                <button onClick={() => onSaved(formData)} className="flex-grow btn-primary py-5 rounded-2xl font-black text-xl shadow-xl">حفظ التعديلات</button>
                <button onClick={onCancel} className="px-10 bg-slate-50 text-slate-500 rounded-2xl font-black">إلغاء</button>
             </div>
          </div>
       </div>
    </div>
  ); 
}
