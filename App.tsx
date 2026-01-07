
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
  Trash
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
        transition: all 0.3s ease;
      }
      .craft-card:hover { transform: translateY(-5px); border-color: #10b98155; }
      .btn-primary {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 0 15px 30px -10px rgba(16, 185, 129, 0.4);
      }
      .input-group { position: relative; display: flex; flex-direction: column; gap: 0.5rem; }
      .input-field {
        width: 100%;
        padding: 1.25rem 3.5rem 1.25rem 1.5rem;
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
      .input-icon { position: absolute; right: 1.25rem; top: 3.1rem; color: #94a3b8; }
      .loading-spinner {
        width: 1.5rem; height: 1.5rem;
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
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return [val]; }
  }
  return [];
};

// --- واجهات المستخدم ---

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

      onLogin({
        ...userData,
        firstName: userData.first_name,
        lastName: userData.last_name,
        location: { wilaya: userData.wilaya, daira: userData.daira || '' },
        categories: ensureArray(userData.categories),
        skills: ensureArray(userData.skills),
        portfolio: ensureArray(userData.portfolio),
        verificationStatus: userData.verification_status,
        rating: userData.rating || 0,
        ratingCount: userData.rating_count || 0,
        completedJobs: userData.completed_jobs || 0
      });
    } catch (err: any) {
      setError('خطأ: تأكد من صحة البريد وكلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-24 px-6 text-right animate-fade-in">
      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-[1.8rem] flex items-center justify-center text-emerald-600 mx-auto mb-6">
            <LogIn size={40}/>
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">تسجيل الدخول</h2>
          <p className="text-slate-400 font-bold">أهلاً بك في عائلة سلكني</p>
        </div>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-100 flex items-center gap-2"><AlertCircle size={20}/> {error}</div>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="input-group">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase">البريد الإلكتروني</label>
            <input type="email" required className="input-field" placeholder="example@mail.com" value={email} onChange={e => setEmail(e.target.value)} />
            <Mail className="input-icon" size={20}/>
          </div>
          <div className="input-group">
            <label className="text-xs font-black text-slate-400 mr-2 uppercase">كلمة المرور</label>
            <input type="password" required className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            <Lock className="input-icon" size={20}/>
          </div>
          <button disabled={loading} className="w-full btn-primary py-5 rounded-[2rem] font-black text-xl shadow-xl flex items-center justify-center gap-3">
            {loading ? <div className="loading-spinner border-white"></div> : <Zap size={24}/>}
            {loading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>
        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
          <p className="text-slate-400 font-bold mb-4">ليس لديك حساب؟</p>
          <button onClick={onSwitchToRegister} className="text-emerald-600 font-black text-lg hover:underline">أنشئ حساباً جديداً</button>
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
    firstName: '', lastName: '', email: '', password: '', phone: '',
    wilaya: WILAYAS[0], daira: WILAYA_DATA[WILAYAS[0]][0],
    role: 'WORKER' as UserRole, category: SERVICE_CATEGORIES[0].name
  });

  const handleWilayaChange = (val: string) => {
    setFormData({ ...formData, wilaya: val, daira: WILAYA_DATA[val][0] });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: formData.email, password: formData.password });
      if (authError) throw authError;
      if (!authData.user) throw new Error('فشل التسجيل.');

      const { error: dbError } = await supabase.from('users').insert([{
        id: authData.user.id, first_name: formData.firstName, last_name: formData.lastName,
        phone: formData.phone, role: formData.role, wilaya: formData.wilaya, daira: formData.daira,
        categories: formData.role === 'WORKER' ? [formData.category] : [], verification_status: 'none'
      }]);
      if (dbError) throw dbError;

      onRegister({
        id: authData.user.id, firstName: formData.firstName, lastName: formData.lastName,
        phone: formData.phone, role: formData.role, location: { wilaya: formData.wilaya, daira: formData.daira },
        categories: formData.role === 'WORKER' ? [formData.category] : [], skills: [],
        verificationStatus: 'none', portfolio: [], rating: 0, ratingCount: 0, completedJobs: 0
      });
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-6 text-right animate-fade-in">
      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-[1.8rem] flex items-center justify-center text-emerald-600 mx-auto mb-6"><UserPlus size={40}/></div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">إنشاء حساب جديد</h2>
          <p className="text-slate-400 font-bold italic">كن جزءاً من أكبر منصة حرفية في الجزائر</p>
        </div>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-100"><AlertCircle size={20}/> {error}</div>}
        <form onSubmit={handleRegister} className="space-y-8">
          {step === 1 ? (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setFormData({...formData, role: 'WORKER'})} className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-3 ${formData.role === 'WORKER' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                  <Briefcase size={32}/><span className="font-black">أنا حرفي</span>
                </button>
                <button type="button" onClick={() => setFormData({...formData, role: 'SEEKER'})} className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-3 ${formData.role === 'SEEKER' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                  <SearchIcon size={32}/><span className="font-black">أنا زبون</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="input-group">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase">الاسم</label>
                  <input required className="input-field" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                  <UserIcon className="input-icon" size={20}/>
                </div>
                <div className="input-group">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase">اللقب</label>
                  <input required className="input-field" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  <UserIcon className="input-icon" size={20}/>
                </div>
              </div>
              <button type="button" onClick={() => setStep(2)} disabled={!formData.firstName} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3">
                المتابعة للبيانات <ArrowRight className="rotate-180" size={24}/>
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="input-group"><label className="text-xs font-black text-slate-400 mr-2 uppercase">البريد</label><input required type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /><Mail className="input-icon" size={20}/></div>
              <div className="input-group"><label className="text-xs font-black text-slate-400 mr-2 uppercase">الهاتف</label><input required type="tel" className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /><Phone className="input-icon" size={20}/></div>
              <div className="grid grid-cols-2 gap-6">
                <div className="input-group">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase">الولاية</label>
                  <select className="input-field appearance-none" value={formData.wilaya} onChange={e => handleWilayaChange(e.target.value)}>
                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                  <MapIcon className="input-icon" size={20}/><ChevronDown className="absolute left-5 top-[3.1rem] text-slate-300"/>
                </div>
                <div className="input-group">
                  <label className="text-xs font-black text-slate-400 mr-2 uppercase">الدائرة</label>
                  <select className="input-field appearance-none" value={formData.daira} onChange={e => setFormData({...formData, daira: e.target.value})}>
                    {WILAYA_DATA[formData.wilaya].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Building2 className="input-icon" size={20}/><ChevronDown className="absolute left-5 top-[3.1rem] text-slate-300"/>
                </div>
              </div>
              <div className="input-group"><label className="text-xs font-black text-slate-400 mr-2 uppercase">كلمة المرور</label><input required type="password" minLength={6} className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /><Lock className="input-icon" size={20}/></div>
              <div className="flex gap-4">
                <button disabled={loading} className="flex-grow btn-primary py-5 rounded-[2rem] font-black text-xl shadow-xl flex items-center justify-center gap-3">
                  {loading ? <div className="loading-spinner border-white"></div> : <Zap size={24}/>}
                  {loading ? 'جاري التسجيل...' : 'تأكيد التسجيل'}
                </button>
                <button type="button" onClick={() => setStep(1)} className="px-8 bg-slate-50 text-slate-500 rounded-[2rem] font-black">رجوع</button>
              </div>
            </div>
          )}
        </form>
        <div className="mt-10 pt-8 border-t border-slate-50 text-center"><button onClick={onSwitchToLogin} className="text-emerald-600 font-black text-lg hover:underline">سجل دخولك من هنا</button></div>
      </div>
    </div>
  );
}

function SearchWorkersView({ onViewWorker }: { onViewWorker: (w: User) => void }) {
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ query: '', wilaya: '', category: '' });

  useEffect(() => {
    fetchWorkers();
  }, [filters]);

  const fetchWorkers = async () => {
    setLoading(true);
    let query = supabase.from('users').select('*').eq('role', 'WORKER');
    if (filters.wilaya) query = query.eq('wilaya', filters.wilaya);
    if (filters.category) query = query.contains('categories', [filters.category]);
    if (filters.query) query = query.or(`first_name.ilike.%${filters.query}%,last_name.ilike.%${filters.query}%`);

    const { data } = await query;
    if (data) setWorkers(data.map(u => ({
      ...u, firstName: u.first_name, lastName: u.last_name,
      location: { wilaya: u.wilaya, daira: u.daira },
      categories: ensureArray(u.categories), skills: ensureArray(u.skills), portfolio: ensureArray(u.portfolio),
      verificationStatus: u.verification_status
    })));
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-16 px-6 text-right min-h-screen">
      <div className="mb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-8 leading-tight">دليل الحرفيين الجزائريين</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100">
          <div className="md:col-span-2 input-group"><input className="input-field" placeholder="ابحث بالاسم أو الخبرة..." value={filters.query} onChange={e => setFilters({...filters, query: e.target.value})} /><SearchIcon className="input-icon" size={20}/></div>
          <div className="input-group">
            <select className="input-field appearance-none" value={filters.wilaya} onChange={e => setFilters({...filters, wilaya: e.target.value})}>
              <option value="">كل الولايات</option>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <MapIcon className="input-icon" size={20}/>
          </div>
          <div className="input-group">
            <select className="input-field appearance-none" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
              <option value="">كل التخصصات</option>
              {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <Briefcase className="input-icon" size={20}/>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? [1,2,3].map(i => <div key={i} className="h-80 craft-card bg-slate-100 animate-pulse"></div>) :
          workers.map(w => (
            <div key={w.id} className="craft-card p-10 cursor-pointer" onClick={() => onViewWorker(w)}>
              <div className="flex items-center gap-6 mb-8 flex-row-reverse text-right">
                <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-20 h-20 rounded-[1.5rem] object-cover border-4 border-white shadow-lg"/>
                <div className="flex-1">
                   <h3 className="text-xl font-black text-slate-900">{w.firstName} {w.lastName}</h3>
                   <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-lg">{w.categories[0] || 'حرفي مبدع'}</span>
                </div>
              </div>
              <p className="text-slate-500 font-medium mb-10 line-clamp-2 leading-relaxed">{w.bio || 'حرفي متميز يلتزم بأعلى معايير الجودة والاتقان في العمل.'}</p>
              <div className="flex justify-between items-center border-t pt-8">
                 <span className="text-slate-400 font-black flex items-center gap-2"><MapPin size={18} className="text-emerald-500"/> {w.location.wilaya}</span>
                 <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-sm hover:bg-emerald-600 transition-all shadow-md">الملف الشخصي</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function TasksMarketView({ onStartChat, currentUser }: { onStartChat: any, currentUser: User | null }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', category: SERVICE_CATEGORIES[0].name, budget: 0, wilaya: WILAYAS[0] });

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data.map(t => ({ ...t, status: t.status as any })));
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!currentUser) return;
    const { error } = await supabase.from('tasks').insert([{
      seeker_id: currentUser.id, seeker_name: `${currentUser.firstName} ${currentUser.lastName}`,
      title: newTask.title, description: newTask.description, category: newTask.category,
      budget: newTask.budget, wilaya: newTask.wilaya, status: 'open'
    }]);
    if (!error) { setShowCreate(false); fetchTasks(); }
  };

  return (
    <div className="max-w-7xl mx-auto py-16 px-6 text-right min-h-screen">
      <div className="flex justify-between items-end mb-16">
         <div>
            <h1 className="text-4xl font-black text-slate-900 mb-4">سوق المهام (الطلبات)</h1>
            <p className="text-slate-500 font-bold text-lg">تصفح طلبات الزبائن أو أضف طلبك الخاص ليقوم الحرفيون بمراسلتم.</p>
         </div>
         <button onClick={() => setShowCreate(true)} className="btn-primary px-10 py-5 rounded-[2rem] font-black text-xl flex items-center gap-3"><Plus size={24}/> أضف طلباً جديداً</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? [1,2,3].map(i => <div key={i} className="h-80 craft-card bg-slate-100 animate-pulse"></div>) :
          tasks.map(t => (
            <div key={t.id} className="craft-card p-10 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase border border-emerald-100">{t.category}</span>
                <span className="font-black text-xl text-slate-900">{t.budget} <span className="text-xs">دج</span></span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 line-clamp-1">{t.title}</h3>
              <p className="text-slate-500 font-medium mb-10 flex-grow line-clamp-3 leading-relaxed">{t.description}</p>
              <div className="border-t pt-8 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black">{t.seeker_name?.[0] || 'ز'}</div>
                    <div className="flex flex-col text-right"><span className="text-xs font-black">{t.seeker_name || 'زبون'}</span><span className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleDateString('ar-DZ')}</span></div>
                 </div>
                 <button onClick={() => onStartChat(t.seeker_id, `بخصوص طلبك: ${t.title}`)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-emerald-600 transition-all">تواصل الآن</button>
              </div>
            </div>
          ))
        }
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 relative">
             <button onClick={() => setShowCreate(false)} className="absolute top-8 left-8 p-2 text-slate-400"><X size={28}/></button>
             <h2 className="text-3xl font-black mb-8">نشر طلب خدمة جديد</h2>
             <div className="space-y-6">
                <div className="input-group"><label className="text-xs font-black text-slate-400 mr-2 uppercase">عنوان الطلب</label><input className="input-field" placeholder="مثلاً: نحتاج رصاص لتركيب سخان" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} /></div>
                <div className="input-group"><label className="text-xs font-black text-slate-400 mr-2 uppercase">الوصف التفصيلي</label><textarea rows={3} className="input-field" placeholder="اشرح ما تحتاجه بدقة..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="input-group"><label className="text-xs font-black text-slate-400 mr-2 uppercase">الميزانية التقديرية (دج)</label><input type="number" className="input-field" value={newTask.budget} onChange={e => setNewTask({...newTask, budget: parseInt(e.target.value)})} /></div>
                   <div className="input-group"><label className="text-xs font-black text-slate-400 mr-2 uppercase">الولاية</label><select className="input-field appearance-none" value={newTask.wilaya} onChange={e => setNewTask({...newTask, wilaya: e.target.value})}>{WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}</select></div>
                </div>
                <button onClick={handleCreate} className="w-full btn-primary py-5 rounded-[2rem] font-black text-xl shadow-xl flex items-center justify-center gap-3"><CheckCircle2 size={24}/> نشر الطلب للجميع</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatView({ currentUser, onBack }: { currentUser: User; onBack: () => void }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) fetchMessages();
  }, [selectedChat]);

  const fetchChats = async () => {
    const { data } = await supabase.from('chats').select('*').or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`).order('updated_at', { ascending: false });
    if (data) setChats(data);
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;
    const { data } = await supabase.from('messages').select('*').eq('chat_id', selectedChat.id).order('created_at', { ascending: true });
    if (data) setMessages(data);
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const send = async () => {
    if (!input.trim() || !selectedChat) return;
    const { error } = await supabase.from('messages').insert([{
      chat_id: selectedChat.id, sender_id: currentUser.id, content: input, is_read: false
    }]);
    if (!error) { setInput(''); fetchMessages(); }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-160px)] flex bg-white rounded-[3rem] shadow-2xl border my-10 overflow-hidden animate-fade-in">
       <div className={`w-full md:w-1/3 border-l flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-8 border-b"><h2 className="text-2xl font-black">المحادثات</h2></div>
          <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-4">
             {chats.map(c => (
               <div key={c.id} onClick={() => setSelectedChat(c)} className={`p-6 rounded-[2rem] cursor-pointer border-2 transition-all flex items-center gap-4 ${selectedChat?.id === c.id ? 'bg-emerald-50 border-emerald-100 shadow-lg' : 'border-transparent hover:bg-slate-50'}`}>
                  <div className="w-14 h-14 bg-emerald-600 rounded-[1.2rem] flex items-center justify-center text-white font-black text-xl">ز</div>
                  <div className="text-right flex-grow">
                     <h4 className="font-black text-slate-900">محادثة رقم {c.id.slice(0,5)}</h4>
                     <p className="text-xs text-slate-400 font-bold truncate">انقر لعرض المحادثة...</p>
                  </div>
               </div>
             ))}
             {chats.length === 0 && <div className="text-center py-20 text-slate-300 font-black">لا توجد محادثات نشطة</div>}
          </div>
       </div>
       <div className={`flex-grow flex flex-col ${!selectedChat ? 'hidden md:flex items-center justify-center bg-slate-50' : 'flex'}`}>
          {selectedChat ? (
            <>
              <div className="p-6 border-b flex items-center gap-4 bg-white">
                 <button onClick={() => setSelectedChat(null)} className="md:hidden p-2"><ArrowRight/></button>
                 <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black">ز</div>
                 <h3 className="text-xl font-black">محادثة نشطة</h3>
              </div>
              <div className="flex-grow overflow-y-auto custom-scrollbar p-8 space-y-6 bg-slate-50/20">
                 {messages.map(m => (
                   <div key={m.id} className={`flex ${m.sender_id === currentUser.id ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] p-5 rounded-[2rem] font-medium ${m.sender_id === currentUser.id ? 'bg-emerald-600 text-white' : 'bg-white shadow-sm'}`}>
                         {m.content}
                         <span className="text-[10px] opacity-60 block mt-1">{new Date(m.created_at).toLocaleTimeString('ar-DZ')}</span>
                      </div>
                   </div>
                 ))}
                 <div ref={scrollRef}/>
              </div>
              <div className="p-6 bg-white border-t">
                 <div className="flex gap-4">
                    <input className="flex-grow p-4 bg-slate-50 rounded-[1.5rem] border-none font-bold" placeholder="اكتب رسالتك..." value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()} />
                    <button onClick={send} className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg hover:bg-emerald-500 transition-all"><Send size={24}/></button>
                 </div>
              </div>
            </>
          ) : (
            <div className="text-center p-20"><MessageSquare size={80} className="text-slate-100 mx-auto mb-6"/><p className="text-slate-400 font-black text-xl">اختر محادثة للبدء في التفاوض والاتفاق</p></div>
          )}
       </div>
    </div>
  );
}

function NotificationsView({ currentUser }: { currentUser: User }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    if (data) setNotifications(data.map(n => ({ ...n, type: n.type as any })));
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchNotifications();
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-6 text-right animate-fade-in min-h-screen">
       <h1 className="text-3xl font-black mb-12">مركز التنبيهات</h1>
       <div className="space-y-6">
          {loading ? [1,2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-[2rem] animate-pulse"></div>) :
            notifications.map(n => (
              <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-8 rounded-[2.5rem] border-2 transition-all flex items-center gap-6 cursor-pointer ${n.is_read ? 'bg-white border-transparent grayscale' : 'bg-emerald-50 border-emerald-100 shadow-lg'}`}>
                 <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-emerald-600 shadow-sm"><Bell size={32}/></div>
                 <div className="flex-grow">
                    <h4 className="text-xl font-black text-slate-900 mb-1">{n.title}</h4>
                    <p className="text-slate-500 font-medium">{n.content}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block">{new Date(n.created_at).toLocaleString('ar-DZ')}</span>
                 </div>
                 {!n.is_read && <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>}
              </div>
            ))
          }
          {!loading && notifications.length === 0 && <div className="text-center py-20"><Bell size={64} className="text-slate-100 mx-auto mb-4"/><p className="text-slate-400 font-black text-xl">لا توجد تنبيهات جديدة حالياً</p></div>}
       </div>
    </div>
  );
}

function EditProfileView({ user, onSaved, onCancel }: { user: User, onSaved: (u: User) => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName, lastName: user.lastName, phone: user.phone, bio: user.bio || '',
    wilaya: user.location.wilaya, daira: user.location.daira, categories: user.categories, skills: user.skills.join(', ')
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      const { error } = await supabase.from('users').update({
        first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone,
        bio: formData.bio, wilaya: formData.wilaya, daira: formData.daira,
        categories: formData.categories, skills: skillsArray
      }).eq('id', user.id);

      if (error) throw error;
      onSaved({
        ...user, firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone, bio: formData.bio,
        location: { wilaya: formData.wilaya, daira: formData.daira }, categories: formData.categories, skills: skillsArray
      });
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-6 text-right animate-fade-in">
       <div className="bg-white rounded-[3.5rem] shadow-2xl p-12 border border-slate-100">
          <h2 className="text-3xl font-black mb-12 border-b pb-6 flex items-center gap-4"><Edit className="text-emerald-600"/> تعديل الملف الشخصي</h2>
          <form onSubmit={handleSave} className="space-y-8">
             <div className="grid grid-cols-2 gap-8">
                <div className="input-group"><label className="text-xs font-black text-slate-400 mr-2 uppercase">الاسم</label><input required className="input-field" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /><UserIcon className="input-icon" size={20}/></div>
                <div className="input-group"><label className="text-xs font-black text-slate-400 mr-2 uppercase">اللقب</label><input required className="input-field" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /><UserIcon className="input-icon" size={20}/></div>
             </div>
             <div className="input-group"><label className="text-xs font-black text-slate-400 mr-2 uppercase">نبذة مهنية</label><textarea rows={4} className="input-field" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} /><Briefcase className="input-icon" size={20}/></div>
             <div className="input-group"><label className="text-xs font-black text-slate-400 mr-2 uppercase">المهارات (افصل بينها بفاصلة)</label><input className="input-field" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} /><Zap className="input-icon" size={20}/></div>
             <div className="flex gap-4 pt-10">
                <button disabled={loading} className="flex-grow btn-primary py-5 rounded-[2rem] font-black text-xl shadow-xl flex items-center justify-center gap-3">
                   {loading ? <div className="loading-spinner border-white"></div> : <Save size={24}/>}
                   {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button type="button" onClick={onCancel} className="px-10 bg-slate-50 text-slate-500 rounded-[2rem] font-black">إلغاء</button>
             </div>
          </form>
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
      selectedWorker: null, activeChat: null,
      workers: [], notifications: [], view: 'landing' 
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
    else { localStorage.removeItem('user'); supabase.auth.signOut(); }
  };

  const startChat = (id: string, initialMsg?: string) => {
    if (!state.currentUser) { setView('login'); return; }
    const mockChat: Chat = { id: `chat_${Date.now()}`, participant_1: state.currentUser.id, participant_2: id, updated_at: new Date().toISOString() };
    if (initialMsg) setOfferText(initialMsg);
    setState(prev => ({ ...prev, activeChat: mockChat, view: 'chats' }));
  };

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-24 md:pb-0" dir="rtl">
      <GlobalStyles />
      <nav className="sticky top-0 z-50 h-24 bg-white/80 backdrop-blur-xl border-b flex items-center px-4 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div onClick={() => setView('landing')} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-12 h-12 bg-emerald-600 flex items-center justify-center text-white font-black rounded-2xl group-hover:rotate-6 transition-transform">S</div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">Salakni <span className="text-emerald-600">سلكني</span></span>
          </div>
          <div className="hidden md:flex items-center gap-12">
            <button onClick={() => setView('landing')} className={`font-black text-lg ${state.view === 'landing' ? 'text-emerald-600' : 'text-slate-500'}`}>الرئيسية</button>
            <button onClick={() => setView('search')} className={`font-black text-lg ${state.view === 'search' ? 'text-emerald-600' : 'text-slate-500'}`}>دليل الحرفيين</button>
            <button onClick={() => setView('support')} className={`font-black text-lg ${state.view === 'support' ? 'text-emerald-600' : 'text-slate-500'}`}>سوق المهام</button>
            {state.currentUser && <button onClick={() => setView('chats')} className={`font-black text-lg ${state.view === 'chats' ? 'text-emerald-600' : 'text-slate-500'}`}>المحادثات</button>}
          </div>
          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div className="flex items-center gap-4">
                 <button onClick={() => setView('notifications')} className="p-3 text-slate-400 hover:text-emerald-600 relative"><Bell size={24}/>{state.notifications.length > 0 && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}</button>
                 <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer p-2 pr-5 bg-white rounded-full border border-slate-200 hover:border-emerald-200 shadow-sm transition-all">
                    <div className="flex flex-col items-start leading-tight"><span className="font-black text-base text-slate-800">{state.currentUser.firstName}</span><span className="text-[10px] font-black text-emerald-600 uppercase">حسابي</span></div>
                    <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-11 h-11 rounded-[1.2rem] object-cover border-2 border-white shadow-sm" />
                 </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                 <button onClick={() => setView('login')} className="text-slate-600 font-black px-6 hover:text-emerald-600 transition-all">دخول</button>
                 <button onClick={() => setView('register')} className="btn-primary px-10 py-4 rounded-2xl font-black text-base active:scale-95 transition-all shadow-md">إنضم إلينا</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && (
          <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 px-6">
            <div className="absolute inset-0 bg-slate-950 bg-[url('https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=2000')] bg-cover bg-center opacity-30"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
            <div className="relative z-10 max-w-5xl text-center text-white">
              <h1 className="text-6xl md:text-9xl font-black mb-10 tracking-tighter leading-tight animate-fade-in">سَلّكني <span className="text-emerald-400 italic">يسلكها!</span></h1>
              <p className="text-2xl md:text-4xl text-slate-300 mb-16 font-medium max-w-3xl mx-auto leading-relaxed opacity-80">بوابتك الذكية للوصول إلى أمهر الحرفيين في الجزائر بكل احترافية وأمان.</p>
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                 <button onClick={() => setView('search')} className="btn-primary px-16 py-8 rounded-[3rem] font-black text-3xl shadow-2xl active:scale-95 transition-all w-full sm:w-auto">اطلب خدمة الآن 🔍</button>
                 <button onClick={() => setView('register')} className="bg-white/10 backdrop-blur-md px-16 py-8 rounded-[3rem] font-black text-3xl border border-white/20 hover:bg-white/20 transition-all w-full sm:w-auto active:scale-95">سجل كحرفي 🛠️</button>
              </div>
            </div>
          </div>
        )}
        {state.view === 'search' && <SearchWorkersView onViewWorker={(w) => setState({...state, selectedWorker: w, view: 'worker-details'})} />}
        {state.view === 'support' && <TasksMarketView currentUser={state.currentUser} onStartChat={startChat} />}
        {state.view === 'login' && <LoginView onLogin={(u) => { updateCurrentUser(u); setView('landing'); }} onSwitchToRegister={() => setView('register')} />}
        {state.view === 'register' && <RegisterView onRegister={(u) => { updateCurrentUser(u); setView('landing'); }} onSwitchToLogin={() => setView('login')} />}
        {state.view === 'chats' && state.currentUser && <ChatView currentUser={state.currentUser} onBack={() => setView('landing')} />}
        {state.view === 'notifications' && state.currentUser && <NotificationsView currentUser={state.currentUser} />}
        {state.view === 'profile' && state.currentUser && (
           <div className="max-w-4xl mx-auto py-20 px-6 animate-fade-in">
              <div className="craft-card p-12 text-center relative">
                 <button onClick={() => updateCurrentUser(null)} className="absolute top-10 left-10 text-red-500 font-bold flex items-center gap-2 hover:bg-red-50 p-4 rounded-2xl transition-all"><LogOut size={20}/> خروج</button>
                 <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-40 h-40 rounded-[3rem] mx-auto mb-8 border-4 border-emerald-500 p-1 object-cover" />
                 <h2 className="text-4xl font-black text-slate-900 mb-2">{state.currentUser.firstName} {state.currentUser.lastName}</h2>
                 <div className="flex flex-col items-center gap-2 text-slate-500 font-bold mb-10">
                    <span className="flex items-center gap-2 text-xl"><MapPin size={24} className="text-emerald-500"/> {state.currentUser.location.wilaya} - {state.currentUser.location.daira}</span>
                    <span className="flex items-center gap-2 text-xl"><Phone size={24} className="text-emerald-500"/> {state.currentUser.phone}</span>
                 </div>
                 <div className="flex justify-center gap-4">
                    <button onClick={() => setView('edit-profile')} className="btn-primary px-12 py-5 rounded-2xl font-black text-xl shadow-xl flex items-center gap-3"><Edit size={24}/> تعديل ملفي</button>
                    {state.currentUser.role === 'WORKER' && <button onClick={() => setView('worker-details')} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-xl flex items-center gap-3">عرض ملفي العام</button>}
                 </div>
              </div>
           </div>
        )}
        {state.view === 'edit-profile' && state.currentUser && <EditProfileView user={state.currentUser} onSaved={(u) => { updateCurrentUser(u); setView('profile'); }} onCancel={() => setView('profile')} />}
        {state.view === 'worker-details' && (state.selectedWorker || state.currentUser) && (
           <div className="max-w-6xl mx-auto py-20 px-6 animate-fade-in text-right">
              <button onClick={() => setView('search')} className="flex items-center gap-2 text-emerald-600 font-black mb-10"><ArrowRight className="rotate-180"/> العودة للدليل</button>
              <div className="craft-card overflow-hidden">
                 <div className="h-64 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-800"></div>
                 <div className="px-12 pb-16 relative">
                    <div className="relative -mt-32 mb-12 flex flex-col md:flex-row items-end gap-10">
                       <img src={(state.selectedWorker || state.currentUser)?.avatar || `https://ui-avatars.com/api/?name=${(state.selectedWorker || state.currentUser)?.firstName}`} className="w-64 h-64 rounded-[4rem] border-8 border-white shadow-2xl object-cover" />
                       <div className="flex-grow pb-4">
                          <h2 className="text-5xl font-black text-slate-900 mb-4">{(state.selectedWorker || state.currentUser)?.firstName} {(state.selectedWorker || state.currentUser)?.lastName}</h2>
                          <div className="flex flex-wrap gap-6 text-xl font-black text-emerald-600">
                             <span className="flex items-center gap-2"><MapPin size={28}/> {(state.selectedWorker || state.currentUser)?.location.wilaya}</span>
                             <span className="flex items-center gap-2 text-yellow-500"><Star size={28} fill="currentColor"/> 4.9 (موثوق)</span>
                          </div>
                       </div>
                       {state.selectedWorker && (
                         <div className="flex gap-4 pb-4">
                            <button onClick={() => startChat(state.selectedWorker!.id)} className="btn-primary p-6 rounded-[2rem] shadow-xl"><MessageSquare size={32}/></button>
                            <button className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl"><Phone size={32}/></button>
                         </div>
                       )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                       <div className="lg:col-span-2 space-y-12">
                          <section>
                             <h4 className="text-2xl font-black text-slate-900 mb-6 border-b-4 border-emerald-500 w-fit pb-1">حول الحرفي</h4>
                             <p className="text-slate-600 font-medium text-xl leading-relaxed bg-slate-50 p-8 rounded-[2rem]">{(state.selectedWorker || state.currentUser)?.bio || 'حرفي متميز يلتزم بأعلى معايير الجودة والاتقان في العمل.'}</p>
                          </section>
                          <section>
                             <h4 className="text-2xl font-black text-slate-900 mb-6 border-b-4 border-emerald-500 w-fit pb-1">التخصصات والمهارات</h4>
                             <div className="flex flex-wrap gap-3">
                                {(state.selectedWorker || state.currentUser)?.categories.map(c => <span key={c} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-sm">{c}</span>)}
                                {(state.selectedWorker || state.currentUser)?.skills.map(s => <span key={s} className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl font-bold text-sm">#{s}</span>)}
                             </div>
                          </section>
                       </div>
                       <div className="space-y-10">
                          <div className="bg-emerald-600 text-white p-10 rounded-[3rem] shadow-xl">
                             <h5 className="font-black text-2xl mb-8">البيانات المهنية</h5>
                             <div className="space-y-4">
                                <div className="flex justify-between bg-white/10 p-5 rounded-2xl"><span>مهام مكتملة</span><span className="font-black text-2xl">{(state.selectedWorker || state.currentUser)?.completedJobs || 24}</span></div>
                                <div className="flex justify-between bg-white/10 p-5 rounded-2xl"><span>سنوات الخبرة</span><span className="font-black text-2xl">+8</span></div>
                             </div>
                          </div>
                          <div className="bg-white p-8 rounded-[3rem] border shadow-sm">
                             <h5 className="font-black text-xl mb-6 border-b pb-4">الأمان والموثوقية</h5>
                             <div className="space-y-4 text-emerald-600 font-black">
                                <div className="flex items-center gap-3"><ShieldCheck size={24}/> الهاتف موثق</div>
                                <div className="flex items-center gap-3"><Check size={24}/> الهوية الوطنية مؤكدة</div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 backdrop-blur-2xl border-t flex items-center justify-around md:hidden z-[60] shadow-2xl rounded-t-[3rem]">
        <button onClick={() => setView('landing')} className={`flex flex-col items-center gap-1 ${state.view === 'landing' ? 'text-emerald-600' : 'text-slate-400'}`}><Home size={24}/><span className="text-[10px] font-black">الرئيسية</span></button>
        <button onClick={() => setView('search')} className={`flex flex-col items-center gap-1 ${state.view === 'search' ? 'text-emerald-600' : 'text-slate-400'}`}><SearchIcon size={24}/><span className="text-[10px] font-black">الحرفيين</span></button>
        <button onClick={() => setView('support')} className={`flex flex-col items-center gap-1 ${state.view === 'support' ? 'text-emerald-600' : 'text-slate-400'}`}><ClipboardList size={24}/><span className="text-[10px] font-black">المهام</span></button>
        <button onClick={() => setView(state.currentUser ? 'profile' : 'login')} className={`flex flex-col items-center gap-1 ${state.view === 'profile' ? 'text-emerald-600' : 'text-slate-400'}`}><UserIcon size={24}/><span className="text-[10px] font-black">حسابي</span></button>
      </div>
    </div>
  );
}
