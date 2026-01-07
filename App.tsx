
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
  Layout
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
        font-size: 1rem;
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

// --- المكونات الفرعية لضمان عمل الكود ---

function SearchWorkersView({ onViewWorker }: { onViewWorker: (w: User) => void }) {
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ query: '', wilaya: '', category: '' });

  useEffect(() => {
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
        verificationStatus: u.verification_status, rating: u.rating || 0, ratingCount: u.rating_count || 0, completedJobs: u.completed_jobs || 0
      })));
      setLoading(false);
    };
    fetchWorkers();
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto py-16 px-6 text-right min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-8">اكتشف أمهر الحرفيين في منطقتك</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
           <div className="md:col-span-2 input-group">
             <input className="input-field" placeholder="عن ماذا تبحث؟ (مثلاً: رصاص، كهربائي...)" value={filters.query} onChange={e => setFilters({...filters, query: e.target.value})} />
             <SearchIcon className="input-icon" size={20}/>
           </div>
           <select className="input-field appearance-none" value={filters.wilaya} onChange={e => setFilters({...filters, wilaya: e.target.value})}>
              <option value="">كل الولايات</option>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
           </select>
           <select className="input-field appearance-none" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
              <option value="">كل التخصصات</option>
              {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
           </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading ? [1,2,3].map(i => <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-[3rem]"></div>) :
          workers.map(w => (
            <div key={w.id} className="craft-card p-8 cursor-pointer hover:-translate-y-2 transition-all border-b-8 border-b-emerald-100" onClick={() => onViewWorker(w)}>
              <div className="flex gap-4 items-center mb-6 flex-row-reverse">
                <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                <div className="flex-1 text-right">
                   <h3 className="text-xl font-black">{w.firstName} {w.lastName}</h3>
                   <span className="text-emerald-600 font-bold text-xs">{w.categories[0]}</span>
                </div>
              </div>
              <p className="text-slate-500 font-medium line-clamp-2 mb-6 leading-relaxed">{w.bio || 'حرفي متميز يلتزم بأعلى معايير الجودة والاتقان.'}</p>
              <div className="flex justify-between items-center border-t pt-6">
                <span className="text-slate-400 font-bold text-sm">📍 {w.location.wilaya}</span>
                <div className="flex items-center gap-1 text-yellow-500 font-black">
                   <Star size={14} fill="currentColor"/> {w.rating || 'جديد'}
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// --- واجهة عرض البروفايل (عام وخاص) ---
function WorkerView({ worker, isOwnProfile, onBack, onEdit, onStartChat }: { worker: User, isOwnProfile?: boolean, onBack: () => void, onEdit?: () => void, onStartChat?: () => void }) {
  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-fade-in text-right">
      <button onClick={onBack} className="flex items-center gap-2 text-emerald-600 font-black mb-8 hover:bg-emerald-50 px-6 py-3 rounded-2xl transition-all">
        <ArrowRight size={24} className="rotate-180"/> العودة للخلف
      </button>

      <div className="craft-card overflow-hidden">
        {/* Header/Cover */}
        <div className="h-48 bg-gradient-to-l from-emerald-600 to-teal-400 relative">
          {isOwnProfile && (
             <div className="absolute top-6 left-6 flex gap-3">
                <button onClick={onEdit} className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-black border border-white/30 hover:bg-white/30 transition-all flex items-center gap-2">
                   <Edit size={20}/> تعديل البروفايل
                </button>
             </div>
          )}
        </div>

        {/* Info Area */}
        <div className="px-12 pb-16 relative">
          <div className="flex flex-col md:flex-row items-end gap-10 -mt-20 mb-12">
            <div className="relative">
              <img src={worker.avatar || `https://ui-avatars.com/api/?name=${worker.firstName}`} className="w-56 h-56 rounded-[4rem] border-8 border-white shadow-2xl object-cover bg-slate-100" />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-3 rounded-2xl shadow-lg">
                <ShieldCheck size={28}/>
              </div>
            </div>
            
            <div className="flex-grow pb-4">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-5xl font-black text-slate-900">{worker.firstName} {worker.lastName}</h1>
                {worker.verificationStatus === 'verified' && <CheckCircle2 className="text-blue-500" size={32} />}
              </div>
              <div className="flex flex-wrap gap-6 text-xl font-bold text-slate-500">
                <span className="flex items-center gap-2"><MapPin className="text-emerald-500"/> {worker.location.wilaya} - {worker.location.daira}</span>
                <span className="flex items-center gap-2"><Briefcase className="text-emerald-500"/> {worker.categories[0] || 'حرفي عام'}</span>
                <span className="flex items-center gap-2 text-yellow-500"><Star fill="currentColor"/> {worker.rating} ({worker.ratingCount} تقييم)</span>
              </div>
            </div>

            {!isOwnProfile && onStartChat && (
              <div className="flex gap-4 pb-4">
                 <button onClick={onStartChat} className="btn-primary p-6 rounded-[2.5rem] shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    <MessageSquare size={32}/>
                 </button>
                 <a href={`tel:${worker.phone}`} className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    <Phone size={32}/>
                 </a>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              <section>
                <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                   <div className="w-2 h-8 bg-emerald-500 rounded-full"></div> نبذة عن الحرفي
                </h3>
                <div className="bg-slate-50 p-8 rounded-[2.5rem] text-slate-600 text-xl font-medium leading-relaxed">
                   {worker.bio || 'هذا الحرفي لم يضف نبذة شخصية بعد، ولكنه متاح لتقديم أفضل الخدمات.'}
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                   <div className="w-2 h-8 bg-emerald-500 rounded-full"></div> المهارات والخبرات
                </h3>
                <div className="flex flex-wrap gap-3">
                   {worker.skills.length > 0 ? worker.skills.map(skill => (
                     <span key={skill} className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl font-black text-lg border border-emerald-100 italic">#{skill}</span>
                   )) : <span className="text-slate-400 font-bold italic">لا توجد مهارات محددة حالياً.</span>}
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                   <div className="w-2 h-8 bg-emerald-500 rounded-full"></div> معرض الأعمال
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {worker.portfolio.length > 0 ? worker.portfolio.map((img, i) => (
                      <div key={i} className="aspect-square bg-slate-100 rounded-[2rem] overflow-hidden border border-slate-200">
                         <img src={img} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                      </div>
                   )) : (
                     <div className="col-span-full py-12 border-4 border-dashed border-slate-100 rounded-[3rem] text-center text-slate-300 font-black">
                        <ImageIcon size={48} className="mx-auto mb-4 opacity-20"/>
                        قريباً.. سيتم إضافة صور لأعمال سابقة
                     </div>
                   )}
                </div>
              </section>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-8">
              <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                 <h4 className="text-2xl font-black mb-10 flex items-center gap-3"><Trophy className="text-yellow-400"/> إنجازات الحرفي</h4>
                 <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl">
                       <span className="text-slate-400 font-bold">مهام منجزة</span>
                       <span className="text-4xl font-black text-emerald-400">+{worker.completedJobs}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl">
                       <span className="text-slate-400 font-bold">نسبة الرضا</span>
                       <span className="text-4xl font-black text-emerald-400">100%</span>
                    </div>
                 </div>
              </div>

              <div className="bg-white border border-slate-100 p-8 rounded-[3.5rem] shadow-sm">
                 <h4 className="text-xl font-black text-slate-900 mb-6 border-b pb-4">معلومات الاتصال</h4>
                 <div className="space-y-4">
                    <div className="flex items-center gap-4 text-slate-600 font-bold">
                       <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Phone size={20}/></div>
                       {worker.phone}
                    </div>
                    <div className="flex items-center gap-4 text-slate-600 font-bold">
                       <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><MapPin size={20}/></div>
                       {worker.location.wilaya}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- واجهة تعديل البروفايل ---
function EditProfileView({ user, onSaved, onCancel }: { user: User, onSaved: (u: User) => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    bio: user.bio || '',
    wilaya: user.location.wilaya,
    daira: user.location.daira,
    category: user.categories[0] || SERVICE_CATEGORIES[0].name,
    skills: user.skills.join(', ')
  });

  const handleWilayaChange = (val: string) => {
    setFormData({ ...formData, wilaya: val, daira: WILAYA_DATA[val][0] });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      const { error } = await supabase.from('users').update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        bio: formData.bio,
        wilaya: formData.wilaya,
        daira: formData.daira,
        categories: [formData.category],
        skills: skillsArray
      }).eq('id', user.id);

      if (error) throw error;
      
      onSaved({
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        bio: formData.bio,
        location: { wilaya: formData.wilaya, daira: formData.daira },
        categories: [formData.category],
        skills: skillsArray
      });
    } catch (err: any) {
      alert('فشل الحفظ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-fade-in text-right">
       <div className="bg-white rounded-[3.5rem] shadow-2xl p-12 border border-slate-100">
          <div className="flex justify-between items-center mb-12 border-b pb-8">
             <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                <Edit className="text-emerald-600" size={32}/> إعدادات الملف الشخصي المهني
             </h2>
             <button onClick={onCancel} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition-all"><X/></button>
          </div>

          <form onSubmit={handleSave} className="space-y-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="input-group">
                   <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الاسم الشخصي</label>
                   <input required className="input-field" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                   <UserIcon className="input-icon" size={20}/>
                </div>
                <div className="input-group">
                   <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">اللقب</label>
                   <input required className="input-field" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                   <UserIcon className="input-icon" size={20}/>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="input-group">
                   <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">رقم الهاتف</label>
                   <input required className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                   <Phone className="input-icon" size={20}/>
                </div>
                <div className="input-group">
                   <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">التخصص الأساسي</label>
                   <select className="input-field appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                   </select>
                   <Briefcase className="input-icon" size={20}/><ChevronDown className="absolute left-5 top-[3.1rem] text-slate-300 pointer-events-none"/>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="input-group">
                   <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الولاية</label>
                   <select className="input-field appearance-none" value={formData.wilaya} onChange={e => handleWilayaChange(e.target.value)}>
                      {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                   </select>
                   <MapIcon className="input-icon" size={20}/><ChevronDown className="absolute left-5 top-[3.1rem] text-slate-300 pointer-events-none"/>
                </div>
                <div className="input-group">
                   <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الدائرة / البلدية</label>
                   <select className="input-field appearance-none" value={formData.daira} onChange={e => setFormData({...formData, daira: e.target.value})}>
                      {WILAYA_DATA[formData.wilaya].map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                   <Building2 className="input-icon" size={20}/><ChevronDown className="absolute left-5 top-[3.1rem] text-slate-300 pointer-events-none"/>
                </div>
             </div>

             <div className="input-group">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">نبذة مهنية (Bio)</label>
                <textarea rows={5} className="input-field h-auto py-5" placeholder="أخبر الزبائن عن خبرتك وأسلوبك في العمل..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                <Layout className="input-icon" size={20}/>
             </div>

             <div className="input-group">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">المهارات (افصل بينها بفاصلة)</label>
                <input className="input-field" placeholder="مثال: تركيب أنابيب، تصليح سخانات، لحام.." value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
                <Zap className="input-icon" size={20}/>
             </div>

             <div className="flex gap-6 pt-10">
                <button disabled={loading} className="flex-grow btn-primary py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                   {loading ? <div className="loading-spinner border-white"></div> : <Save size={28}/>}
                   {loading ? 'جاري الحفظ...' : 'تحديث البيانات'}
                </button>
                <button type="button" onClick={onCancel} className="px-12 bg-slate-50 text-slate-500 rounded-[2.5rem] font-black text-xl hover:bg-slate-100 transition-all">إلغاء</button>
             </div>
          </form>
       </div>
    </div>
  );
}

// --- واجهة تسجيل الدخول (تبسيط لضمان عمل الكود) ---
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
    } catch (err: any) { setError('خطأ في البيانات'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto py-24 px-6 text-right animate-fade-in">
       <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-8"><LogIn size={40}/></div>
          <h2 className="text-3xl font-black mb-10">تسجيل الدخول</h2>
          <form onSubmit={handleLogin} className="space-y-6">
             <div className="input-group"><input type="email" required className="input-field" placeholder="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} /><Mail className="input-icon" size={20}/></div>
             <div className="input-group"><input type="password" required className="input-field" placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} /><Lock className="input-icon" size={20}/></div>
             <button disabled={loading} className="w-full btn-primary py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3">
               {loading ? <div className="loading-spinner border-white"></div> : 'دخول للمنصة'}
             </button>
          </form>
          <div className="mt-10 pt-8 border-t"><button onClick={onSwitchToRegister} className="text-emerald-600 font-black">ليس لديك حساب؟ سجل كحرفي</button></div>
       </div>
    </div>
  );
}

// --- واجهة التسجيل (تبسيط لضمان عمل الكود) ---
function RegisterView({ onRegister, onSwitchToLogin }: { onRegister: (u: User) => void; onSwitchToLogin: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', wilaya: WILAYAS[0], daira: WILAYA_DATA[WILAYAS[0]][0], category: SERVICE_CATEGORIES[0].name });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: formData.email, password: formData.password });
      if (authError) throw authError;
      const { error: dbError } = await supabase.from('users').insert([{
        id: authData.user.id, first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone, role: 'WORKER', wilaya: formData.wilaya, daira: formData.daira, categories: [formData.category], verification_status: 'none'
      }]);
      if (dbError) throw dbError;
      onRegister({ id: authData.user.id, firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone, role: 'WORKER', location: { wilaya: formData.wilaya, daira: formData.daira }, categories: [formData.category], skills: [], verificationStatus: 'none', portfolio: [], rating: 0, ratingCount: 0, completedJobs: 0 });
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-6 text-right animate-fade-in">
       <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl border border-slate-100">
          <h2 className="text-3xl font-black text-center mb-10">إنشاء حساب حرفي جديد</h2>
          <form onSubmit={handleRegister} className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <input className="input-field" placeholder="الاسم" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <input className="input-field" placeholder="اللقب" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
             </div>
             <input type="email" className="input-field" placeholder="البريد الإلكتروني" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             <input type="tel" className="input-field" placeholder="رقم الهاتف" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
             <div className="grid grid-cols-2 gap-4">
                <select className="input-field" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value, daira: WILAYA_DATA[e.target.value][0]})}>{WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}</select>
                <select className="input-field" value={formData.daira} onChange={e => setFormData({...formData, daira: e.target.value})}>{WILAYA_DATA[formData.wilaya].map(d => <option key={d} value={d}>{d}</option>)}</select>
             </div>
             <input type="password" required className="input-field" placeholder="كلمة المرور" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
             <button disabled={loading} className="w-full btn-primary py-5 rounded-2xl font-black text-xl">
               {loading ? 'جاري إنشاء الحساب...' : 'تأكيد التسجيل'}
             </button>
          </form>
          <div className="mt-8 text-center"><button onClick={onSwitchToLogin} className="text-emerald-600 font-black underline">لديك حساب؟ سجل دخولك</button></div>
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
  
  const setView = (v: AppState['view']) => {
    setState(prev => ({ ...prev, view: v }));
    window.scrollTo(0, 0);
  };

  const updateCurrentUser = (u: User | null) => {
    setState(prev => ({ ...prev, currentUser: u }));
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else { localStorage.removeItem('user'); supabase.auth.signOut(); }
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
          <div className="hidden md:flex items-center gap-10">
            <button onClick={() => setView('landing')} className={`font-black text-lg ${state.view === 'landing' ? 'text-emerald-600' : 'text-slate-500'}`}>الرئيسية</button>
            <button onClick={() => setView('search')} className={`font-black text-lg ${state.view === 'search' ? 'text-emerald-600' : 'text-slate-500'}`}>الحرفيين</button>
            {state.currentUser && <button onClick={() => setView('profile')} className={`font-black text-lg ${state.view === 'profile' ? 'text-emerald-600' : 'text-slate-500'}`}>ملفي الشخصي</button>}
          </div>
          <div className="flex items-center gap-4">
            {state.currentUser ? (
               <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer p-2 pr-5 bg-white rounded-full border border-slate-200 shadow-sm transition-all">
                  <div className="flex flex-col items-start leading-tight"><span className="font-black text-base">{state.currentUser.firstName}</span><span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">حسابي</span></div>
                  <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-11 h-11 rounded-[1.2rem] object-cover border-2 border-white shadow-sm" />
               </div>
            ) : (
              <div className="flex gap-4">
                 <button onClick={() => setView('login')} className="text-slate-600 font-black px-4">دخول</button>
                 <button onClick={() => setView('register')} className="btn-primary px-8 py-4 rounded-2xl font-black text-base shadow-md">ابدأ الآن</button>
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
              <p className="text-2xl md:text-4xl text-slate-300 mb-16 font-medium max-w-3xl mx-auto leading-relaxed">المنصة الجزائرية رقم #1 لربط الحرفيين المهرة والزبائن.</p>
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                 <button onClick={() => setView('search')} className="btn-primary px-16 py-8 rounded-[3rem] font-black text-3xl shadow-2xl active:scale-95 transition-all w-full sm:w-auto">اطلب خدمة 🔍</button>
                 <button onClick={() => setView('register')} className="bg-white/10 backdrop-blur-md px-16 py-8 rounded-[3rem] font-black text-3xl border border-white/20 hover:bg-white/20 transition-all w-full sm:w-auto active:scale-95">سجل كحرفي 🛠️</button>
              </div>
            </div>
          </div>
        )}
        {state.view === 'search' && <SearchWorkersView onViewWorker={(w) => setState({...state, selectedWorker: w, view: 'worker-details'})} />}
        {state.view === 'login' && <LoginView onLogin={(u) => { updateCurrentUser(u); setView('profile'); }} onSwitchToRegister={() => setView('register')} />}
        {state.view === 'register' && <RegisterView onRegister={(u) => { updateCurrentUser(u); setView('profile'); }} onSwitchToLogin={() => setView('login')} />}
        {state.view === 'profile' && state.currentUser && (
           <WorkerView worker={state.currentUser} isOwnProfile={true} onBack={() => setView('landing')} onEdit={() => setView('edit-profile')} />
        )}
        {state.view === 'edit-profile' && state.currentUser && (
           <EditProfileView user={state.currentUser} onSaved={(u) => { updateCurrentUser(u); setView('profile'); }} onCancel={() => setView('profile')} />
        )}
        {state.view === 'worker-details' && state.selectedWorker && (
           <WorkerView worker={state.selectedWorker} onBack={() => setView('search')} onStartChat={() => alert('ميزة المحادثات قادمة..')} />
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/90 backdrop-blur-2xl border-t flex items-center justify-around md:hidden z-[60] shadow-2xl rounded-t-[3rem]">
        <button onClick={() => setView('landing')} className={`flex flex-col items-center gap-1 ${state.view === 'landing' ? 'text-emerald-600' : 'text-slate-400'}`}><Home size={24}/><span className="text-[10px] font-black">الرئيسية</span></button>
        <button onClick={() => setView('search')} className={`flex flex-col items-center gap-1 ${state.view === 'search' ? 'text-emerald-600' : 'text-slate-400'}`}><SearchIcon size={24}/><span className="text-[10px] font-black">الحرفيين</span></button>
        <button onClick={() => setView(state.currentUser ? 'profile' : 'login')} className={`flex flex-col items-center gap-1 ${state.view === 'profile' ? 'text-emerald-600' : 'text-slate-400'}`}><UserIcon size={24}/><span className="text-[10px] font-black">حسابي</span></button>
      </div>
    </div>
  );
}
