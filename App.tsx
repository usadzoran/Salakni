
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
  ExternalLink
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
  // التعامل مع كلا التنسيقين: category (مفرد) و categories (مصفوفة)
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
        border-radius: 2.5rem; 
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
    `}</style>
  );
}

// --- واجهة عرض البروفايل ---
function WorkerView({ worker, isOwnProfile, onBack, onEdit, onStartChat, onLogout }: any) {
  return (
    <div className="max-w-6xl mx-auto py-8 md:py-12 px-4 md:px-6 animate-fade-in text-right">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-emerald-600 font-black hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all">
          <ArrowRight size={20} className="rotate-180"/> العودة
        </button>
        {isOwnProfile && (
           <button onClick={onLogout} className="text-red-500 font-bold flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-xl transition-all">
             <LogOut size={20}/> تسجيل الخروج
           </button>
        )}
      </div>

      <div className="craft-card overflow-hidden">
        <div className="h-40 md:h-56 bg-gradient-to-l from-emerald-600 via-teal-500 to-emerald-800 relative shadow-inner">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          {isOwnProfile && (
             <div className="absolute top-4 left-4">
                <button onClick={onEdit} className="bg-white/90 backdrop-blur shadow-lg text-emerald-700 px-5 py-2.5 rounded-2xl font-black border border-white hover:bg-white transition-all flex items-center gap-2 text-sm">
                   <Edit size={18}/> تعديل بياناتي
                </button>
             </div>
          )}
        </div>

        <div className="px-6 md:px-12 pb-12 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 -mt-20 md:-mt-24 mb-10">
            <div className="relative group">
              <img 
                src={worker.avatar || `https://ui-avatars.com/api/?name=${worker.firstName}&background=10b981&color=fff`} 
                className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] md:rounded-[4rem] border-8 border-white shadow-2xl object-cover bg-slate-100" 
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2.5 rounded-2xl shadow-xl border-4 border-white">
                <ShieldCheck size={24}/>
              </div>
            </div>
            
            <div className="flex-grow pb-2 text-center md:text-right">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mb-3">
                <h1 className="text-3xl md:text-5xl font-black text-slate-900">{worker.firstName} {worker.lastName}</h1>
                {worker.verificationStatus === 'verified' && (
                  <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 border border-blue-100">
                    <CheckCircle2 size={14}/> حساب موثق
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 text-sm md:text-lg font-bold text-slate-500">
                <span className="flex items-center gap-1.5"><MapPin size={18} className="text-emerald-500"/> {worker.location.wilaya}</span>
                <span className="flex items-center gap-1.5"><Briefcase size={18} className="text-emerald-500"/> {worker.categories[0] || 'حرفي'}</span>
                <span className="flex items-center gap-1.5 text-yellow-500"><Star size={18} fill="currentColor"/> {worker.rating > 0 ? worker.rating : 'جديد'}</span>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
                 <button onClick={onStartChat} className="btn-primary flex-grow md:flex-none px-8 py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3">
                    <MessageSquare size={20}/> دردشة
                 </button>
                 <a href={`tel:${worker.phone}`} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3">
                    <Phone size={20}/> اتصال
                 </a>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <section className="bg-slate-50/50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
                <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                   <Layout size={20} className="text-emerald-600"/> نبذة مهنية
                </h3>
                <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-line font-medium">
                   {worker.bio || 'لم يتم إضافة نبذة بعد لهذا الحرفي.'}
                </p>
              </section>

              <section>
                <h3 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
                   <Zap size={20} className="text-emerald-600"/> المهارات
                </h3>
                <div className="flex flex-wrap gap-2.5">
                   {worker.skills.length > 0 ? worker.skills.map((skill: string) => (
                     <span key={skill} className="bg-white text-emerald-700 px-5 py-2 rounded-xl font-black text-sm border-2 border-emerald-50 shadow-sm transition-all hover:bg-emerald-50">#{skill}</span>
                   )) : <span className="text-slate-400 font-bold text-sm italic">لا توجد مهارات مضافة</span>}
                </div>
              </section>

              <section>
                <h3 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2">
                   <ImageIcon size={20} className="text-emerald-600"/> معرض الأعمال
                </h3>
                {worker.portfolio.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {worker.portfolio.map((img: string, i: number) => (
                      <div key={i} className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border-2 border-white shadow-md">
                        <img src={img} className="w-full h-full object-cover" alt="Portfolio" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                    <LucideImage size={40} className="mx-auto mb-3 text-slate-300"/>
                    <p className="text-slate-400 font-bold">لا توجد صور في المعرض حالياً</p>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                 <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl"></div>
                 <h4 className="text-lg font-black mb-8 flex items-center gap-2"><Trophy className="text-yellow-400" size={20}/> الإنجازات</h4>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/10">
                       <span className="text-slate-400 font-bold text-sm">المهام المكتملة</span>
                       <span className="text-3xl font-black text-emerald-400">+{worker.completedJobs || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/10">
                       <span className="text-slate-400 font-bold text-sm">التقييم العام</span>
                       <span className="text-3xl font-black text-yellow-400">{worker.rating || 'جديد'}</span>
                    </div>
                 </div>
              </div>

              <div className="bg-white border-2 border-slate-50 p-6 rounded-[2.5rem]">
                 <h4 className="text-lg font-black text-slate-900 mb-5">معلومات رسمية</h4>
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-600 font-bold">
                       <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Phone size={18}/></div>
                       <span dir="ltr" className="text-base">{worker.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 font-bold">
                       <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Building2 size={18}/></div>
                       <span className="text-base">{worker.location.daira}، {worker.location.wilaya}</span>
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
    setFormData({ ...formData, wilaya: val, daira: WILAYA_DATA[val][0] || '' });
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
      
      onSaved(mapUserData({
        ...user,
        ...formData,
        skills: skillsArray,
        location: { wilaya: formData.wilaya, daira: formData.daira },
        categories: [formData.category]
      }));
    } catch (err: any) {
      alert('خطأ في التحديث: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-fade-in text-right">
       <div className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 border border-slate-100">
          <div className="flex justify-between items-center mb-10 border-b pb-6">
             <h2 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
                <Edit className="text-emerald-600" size={28}/> تعديل بروفايل الحرفي
             </h2>
             <button onClick={onCancel} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"><X size={24}/></button>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الاسم الأول</label>
                   <div className="relative">
                     <input required className="input-field" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                     <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">اللقب (العائلة)</label>
                   <div className="relative">
                     <input required className="input-field" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                     <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">رقم هاتف العمل</label>
                   <div className="relative">
                     <input required className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                     <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">التخصص الأساسي</label>
                   <div className="relative">
                     <select className="input-field appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                     </select>
                     <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                     <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">الولاية</label>
                   <div className="relative">
                     <select className="input-field appearance-none" value={formData.wilaya} onChange={e => handleWilayaChange(e.target.value)}>
                        {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                     </select>
                     <MapIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                     <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">البلدية / الدائرة</label>
                   <div className="relative">
                     <select className="input-field appearance-none" value={formData.daira} onChange={e => setFormData({...formData, daira: e.target.value})}>
                        {(WILAYA_DATA[formData.wilaya] || []).map(d => <option key={d} value={d}>{d}</option>)}
                     </select>
                     <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                     <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
                   </div>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">نبذة تعريفية لجذب الزبائن</label>
                <div className="relative">
                  <textarea rows={5} className="input-field h-auto py-4" placeholder="مثلاً: خبير في صيانة السخانات المنزلية بخبرة تفوق 10 سنوات..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                  <Layout className="absolute right-4 top-5 text-slate-300" size={20}/>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-widest">كلمات دلالية للمهارات (بينها فاصلة)</label>
                <div className="relative">
                  <input className="input-field" placeholder="ترصيص، تلحيم، ديكور، بناء.." value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
                  <Zap className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                </div>
             </div>

             <div className="flex flex-col md:flex-row gap-4 pt-6">
                <button disabled={loading} className="flex-grow btn-primary py-4 rounded-2xl font-black text-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70">
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

// --- واجهة البحث عن الحرفيين ---
function SearchWorkersView({ onViewWorker }: { onViewWorker: (worker: User) => void }) {
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<User[]>([]);
  const [filters, setFilters] = useState({
    query: '',
    wilaya: '',
    category: ''
  });

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let baseQuery = supabase.from('users').select('*').eq('role', 'WORKER');
      
      if (filters.wilaya) {
        baseQuery = baseQuery.eq('wilaya', filters.wilaya);
      }
      if (filters.category) {
        // نستخدم الفلترة هنا بناءً على التخصص الأساسي المخزن في العمود category أو categories
        baseQuery = baseQuery.or(`categories.ilike.%${filters.category}%,category.ilike.%${filters.category}%`);
      }
      
      const { data, error } = await baseQuery;
      
      if (error) throw error;
      
      let filtered = (data || []).map(mapUserData);
      
      if (filters.query) {
        const q = filters.query.toLowerCase();
        filtered = filtered.filter(w => 
          w.firstName.toLowerCase().includes(q) || 
          w.lastName.toLowerCase().includes(q) || 
          (w.bio && w.bio.toLowerCase().includes(q)) ||
          w.skills.some(s => s.toLowerCase().includes(q))
        );
      }
      
      setWorkers(filtered);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 text-right">
      <div className="bg-emerald-50 p-8 md:p-12 rounded-[3rem] mb-12 border border-emerald-100 shadow-sm animate-fade-in">
        <h2 className="text-3xl md:text-4xl font-black mb-8 text-slate-900">ابحث عن الحرفي المثالي 🔍</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          <div className="md:col-span-2 relative">
            <input 
              type="text" 
              placeholder="عن ماذا تبحث؟ (مثلاً: ترصيص)" 
              className="input-field" 
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            />
            <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
          </div>
          <div className="relative">
            <select 
              className="input-field appearance-none"
              value={filters.wilaya}
              onChange={(e) => setFilters({ ...filters, wilaya: e.target.value })}
            >
              <option value="">كل الولايات</option>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <MapIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
          </div>
          <div className="relative">
            <select 
              className="input-field appearance-none"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">كل التخصصات</option>
              {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
          </div>
        </div>
        <button 
          onClick={fetchWorkers}
          disabled={loading}
          className="mt-8 btn-primary px-12 py-4 rounded-2xl font-black text-xl shadow-xl flex items-center gap-3 active:scale-95 transition-all"
        >
          {loading ? <div className="loading-spinner border-white"></div> : <SearchIcon size={24}/>}
          {loading ? 'جاري البحث...' : 'ابدأ البحث'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {loading ? (
          <div className="col-span-full py-40 flex flex-col items-center gap-4">
            <div className="loading-spinner w-12 h-12"></div>
            <p className="text-slate-400 font-bold">جاري تحميل النتائج...</p>
          </div>
        ) : workers.length > 0 ? (
          workers.map((worker) => (
            <div 
              key={worker.id} 
              onClick={() => onViewWorker(worker)}
              className="craft-card p-8 md:p-10 cursor-pointer group hover:-translate-y-2 hover:shadow-2xl transition-all relative overflow-hidden"
            >
              <div className="flex gap-6 items-center mb-8 flex-row-reverse">
                <div className="relative">
                  <img 
                    src={worker.avatar || `https://ui-avatars.com/api/?name=${worker.firstName}&background=10b981&color=fff`} 
                    className="w-20 h-20 rounded-3xl object-cover shadow-lg border-2 border-emerald-50"
                  />
                  {worker.verificationStatus === 'verified' && (
                    <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1 rounded-lg border-2 border-white">
                      <Check size={12}/>
                    </div>
                  )}
                </div>
                <div className="text-right flex-1">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{worker.firstName} {worker.lastName}</h3>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <span className="text-yellow-500 font-black text-sm">{worker.rating > 0 ? worker.rating : 'جديد'}</span>
                    <Star size={14} fill="currentColor" className="text-yellow-500"/>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-end mb-6">
                {worker.categories.slice(0, 2).map(cat => (
                  <span key={cat} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-black border border-emerald-100">{cat}</span>
                ))}
              </div>

              <p className="text-slate-500 line-clamp-2 mb-8 font-medium text-sm h-10">{worker.bio || 'لا توجد نبذة تعريفية متاحة لهذا الحرفي حالياً.'}</p>
              
              <div className="flex justify-between items-center flex-row-reverse border-t pt-6 border-slate-50">
                <span className="text-slate-400 font-bold text-sm flex items-center gap-1">
                  <MapPin size={16} className="text-emerald-500"/> {worker.location.wilaya}
                </span>
                <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-md hover:bg-emerald-600 transition-all flex items-center gap-2">
                   عرض البروفايل <ArrowRight size={14} className="rotate-180"/>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <SearchIcon size={48} className="mx-auto mb-4 text-slate-300"/>
            <p className="text-slate-400 font-black text-xl">لم نجد أي حرفيين يطابقون بحثك.</p>
            <p className="text-slate-400 text-sm mt-2">حاول تغيير الكلمات الدلالية أو الولاية.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- التطبيق الرئيسي ---
export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { 
      currentUser: saved ? mapUserData(JSON.parse(saved)) : null, 
      selectedWorker: null, 
      activeChat: null,
      workers: [], 
      notifications: [], 
      view: 'landing' 
    };
  });
  
  const setView = (v: AppState['view']) => {
    setState(prev => ({ ...prev, view: v }));
    window.scrollTo(0, 0);
  };

  const updateCurrentUser = (u: User | null) => {
    const mappedUser = u ? mapUserData(u) : null;
    setState(prev => ({ ...prev, currentUser: mappedUser }));
    if (mappedUser) localStorage.setItem('user', JSON.stringify(mappedUser));
    else { localStorage.removeItem('user'); supabase.auth.signOut(); }
  };

  const handleWorkerSelection = (worker: User) => {
    setState(prev => ({ ...prev, selectedWorker: mapUserData(worker), view: 'worker-details' }));
  };

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-[#fcfdfe] text-slate-900 pb-24 md:pb-0" dir="rtl">
      <GlobalStyles />
      
      <nav className="sticky top-0 z-50 h-20 md:h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div onClick={() => setView('landing')} className="flex items-center gap-2 md:gap-3 cursor-pointer group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-600 flex items-center justify-center text-white font-black rounded-xl md:rounded-2xl group-hover:rotate-6 transition-transform">S</div>
            <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">Salakni <span className="text-emerald-600">سلكني</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <button onClick={() => setView('landing')} className={`font-black text-lg ${state.view === 'landing' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}>الرئيسية</button>
            <button onClick={() => setView('search')} className={`font-black text-lg ${state.view === 'search' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}>الحرفيين</button>
            {state.currentUser && <button onClick={() => setView('profile')} className={`font-black text-lg ${state.view === 'profile' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}>بروفايلي</button>}
          </div>

          <div className="flex items-center gap-3">
            {state.currentUser ? (
               <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer p-1.5 pr-4 bg-white rounded-full border border-slate-200 shadow-sm transition-all hover:border-emerald-200">
                  <div className="flex flex-col items-start leading-tight">
                    <span className="font-black text-sm md:text-base">{state.currentUser.firstName}</span>
                    <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">حسابي</span>
                  </div>
                  <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}&background=10b981&color=fff`} className="w-9 h-9 md:w-11 md:h-11 rounded-xl object-cover border-2 border-white" />
               </div>
            ) : (
              <div className="flex gap-2">
                 <button onClick={() => setView('login')} className="text-slate-600 font-black px-4 text-sm md:text-base">دخول</button>
                 <button onClick={() => setView('register')} className="btn-primary px-5 md:px-8 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-black text-sm md:text-base">انضم</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && (
          <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-16 px-6">
            <div className="absolute inset-0 bg-slate-950 bg-[url('https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=2000')] bg-cover bg-center opacity-30"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
            <div className="relative z-10 max-w-5xl text-center text-white">
              <h1 className="text-5xl md:text-9xl font-black mb-8 tracking-tighter leading-tight animate-fade-in">سَلّكني <span className="text-emerald-400 italic">يسلكها!</span></h1>
              <p className="text-xl md:text-3xl text-slate-300 mb-12 md:mb-16 font-medium max-w-3xl mx-auto leading-relaxed">المنصة الجزائرية رقم #1 لربط الحرفيين المهرة بالزبائن في جميع الولايات.</p>
              <div className="flex flex-col sm:flex-row gap-6 md:gap-8 justify-center items-center">
                 <button onClick={() => setView('search')} className="btn-primary px-12 md:px-16 py-6 md:py-8 rounded-[2rem] md:rounded-[3rem] font-black text-2xl md:text-3xl shadow-2xl active:scale-95 transition-all w-full sm:w-auto">اطلب خدمة 🔍</button>
                 <button onClick={() => setView('register')} className="bg-white/10 backdrop-blur-md px-12 md:px-16 py-6 md:py-8 rounded-[2rem] md:rounded-[3rem] font-black text-2xl md:text-3xl border border-white/20 hover:bg-white/20 transition-all w-full sm:w-auto active:scale-95">سجل كحرفي 🛠️</button>
              </div>
            </div>
          </div>
        )}

        {state.view === 'search' && <SearchWorkersView onViewWorker={handleWorkerSelection} />}
        
        {state.view === 'profile' && state.currentUser && (
           <WorkerView 
            worker={state.currentUser} 
            isOwnProfile={true} 
            onBack={() => setView('landing')} 
            onEdit={() => setView('edit-profile')} 
            onLogout={() => updateCurrentUser(null)}
          />
        )}
        
        {state.view === 'edit-profile' && state.currentUser && (
           <EditProfileView user={state.currentUser} onSaved={(u) => { updateCurrentUser(u); setView('profile'); }} onCancel={() => setView('profile')} />
        )}
        
        {state.view === 'worker-details' && state.selectedWorker && (
           <WorkerView 
            worker={state.selectedWorker} 
            onBack={() => setView('search')} 
            onStartChat={() => alert('ميزة المحادثات قادمة قريباً..')} 
          />
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-around md:hidden z-[60] shadow-[0_-5px_15px_-3px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
        <button onClick={() => setView('landing')} className={`flex flex-col items-center gap-1 ${state.view === 'landing' ? 'text-emerald-600' : 'text-slate-400'}`}><Home size={22}/><span className="text-[10px] font-black">الرئيسية</span></button>
        <button onClick={() => setView('search')} className={`flex flex-col items-center gap-1 ${state.view === 'search' ? 'text-emerald-600' : 'text-slate-400'}`}><SearchIcon size={22}/><span className="text-[10px] font-black">البحث</span></button>
        <button onClick={() => setView(state.currentUser ? 'profile' : 'login')} className={`flex flex-col items-center gap-1 ${state.view === 'profile' ? 'text-emerald-600' : 'text-slate-400'}`}><UserIcon size={22}/><span className="text-[10px] font-black">حسابي</span></button>
      </div>
    </div>
  );
}
