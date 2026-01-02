
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, Message, Worker } from './types.ts';
import { SERVICE_CATEGORIES, WILAYAS } from './constants.tsx';
import { supabase } from './lib/supabase.ts';
import { 
  MapPin, 
  Star, 
  User as UserIcon, 
  LogOut, 
  Settings, 
  Phone, 
  MessageSquare,
  Home,
  Search,
  ClipboardList,
  Clock,
  DollarSign,
  Send,
  AlertCircle,
  RefreshCcw,
  Camera,
  Image as ImageIcon,
  X,
  ChevronLeft,
  Award,
  Plus,
  Trash2,
  Check
} from 'lucide-react';

interface Task {
  id: string;
  seeker_id: string;
  title: string;
  description: string;
  category: string;
  wilaya: string;
  budget: string;
  created_at: string;
  seeker_name?: string;
  seeker_avatar?: string;
}

const GlobalStyles = () => (
  <style>{`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: fadeIn 0.4s ease-out forwards; }
    .arabic-text { font-family: 'Tajawal', sans-serif; }
    .loading-spinner { border: 4px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
    .portfolio-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; }
    .tag-chip { transition: all 0.2s; cursor: pointer; }
    .tag-chip:active { transform: scale(0.95); }
    .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3); }
    @media (max-width: 640px) {
      .portfolio-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `}</style>
);

const Logo = ({ onClick }: { onClick?: () => void }) => (
  <div onClick={onClick} className="flex items-center gap-2 cursor-pointer group">
    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg group-hover:rotate-12 transition-transform">S</div>
    <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Salakni <span className="text-emerald-600">سلكني</span></span>
  </div>
);

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { currentUser: saved ? JSON.parse(saved) : null, workers: [], view: 'landing' };
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatTarget, setChatTarget] = useState<User | null>(null);
  const [searchFilters, setSearchFilters] = useState({ query: '', wilaya: '', category: '' });

  const setView = (view: AppState['view']) => setState(prev => ({ ...prev, view }));

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('users').select('*').eq('role', UserRole.WORKER);
      if (searchFilters.wilaya) query = query.eq('wilaya', searchFilters.wilaya);
      if (searchFilters.category) query = query.contains('categories', [searchFilters.category]);
      
      const { data, error } = await query;
      if (error) throw error;
      setState(prev => ({ ...prev, workers: (data || []).map(d => ({
        ...d, firstName: d.first_name, lastName: d.last_name, location: { wilaya: d.wilaya }, 
        rating: d.rating || 0, ratingCount: d.rating_count || 0, categories: d.categories || [], portfolio: d.portfolio || []
      }))}));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (state.view === 'search') fetchWorkers();
  }, [state.view, searchFilters]);

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-20 md:pb-0" dir="rtl">
      <GlobalStyles />
      <nav className="h-20 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} />
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => setView('search')} className="font-bold hover:text-emerald-600">تصفح الحرفيين</button>
            <button onClick={() => setView('support')} className="font-bold hover:text-emerald-600">سوق المهام</button>
            {state.currentUser ? (
              <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer bg-slate-100 pl-4 pr-1 py-1 rounded-full hover:bg-emerald-50 transition-colors">
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
                <span className="font-black text-sm">{state.currentUser.firstName}</span>
              </div>
            ) : (
              <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold">دخول</button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onSearch={() => setView('search')} />}
        {state.view === 'search' && <SearchWorkersView workers={state.workers} loading={loading} filters={searchFilters} onFilterChange={setSearchFilters} onProfile={(w) => { setChatTarget(w); setView('profile'); }} />}
        
        {state.view === 'profile' && (state.currentUser || chatTarget) && (
          <ProfileView 
            user={chatTarget || state.currentUser!} 
            isOwn={!chatTarget || chatTarget?.id === state.currentUser?.id} 
            onEdit={() => setView('edit-profile')} 
            onLogout={() => { localStorage.removeItem('user'); setState({ ...state, currentUser: null, view: 'landing' }); }}
            onBack={() => { setChatTarget(null); setView('search'); }}
          />
        )}

        {state.view === 'edit-profile' && state.currentUser && (
          <EditProfileView 
            user={state.currentUser} 
            onSave={(u) => { setState(prev => ({ ...prev, currentUser: u, view: 'profile' })); localStorage.setItem('user', JSON.stringify(u)); }}
            onCancel={() => setView('profile')}
          />
        )}

        {state.view === 'login' && <AuthForm onSuccess={(u) => { setState(prev => ({ ...prev, currentUser: u, view: 'profile' })); }} />}
      </main>

      {/* Mobile Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-8 py-4 flex justify-between md:hidden z-50 rounded-t-3xl shadow-2xl">
        <button onClick={() => setView('landing')} className={state.view === 'landing' ? 'text-emerald-600' : 'text-slate-400'}><Home size={22} /></button>
        <button onClick={() => setView('search')} className={state.view === 'search' ? 'text-emerald-600' : 'text-slate-400'}><Search size={22} /></button>
        <button onClick={() => setView('support')} className={state.view === 'support' ? 'text-emerald-600' : 'text-slate-400'}><ClipboardList size={22} /></button>
        <button onClick={() => setView('profile')} className={state.view === 'profile' ? 'text-emerald-600' : 'text-slate-400'}><UserIcon size={22} /></button>
      </div>
    </div>
  );
}

// --- Views ---

const LandingView = ({ onSearch }: any) => (
  <div className="relative min-h-[85vh] flex items-center justify-center text-center px-6">
    <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
    <div className="relative z-10 max-w-4xl">
      <h1 className="text-5xl md:text-7xl font-black text-white mb-8">سَلّكني يسلكها <span className="text-emerald-400">في الحين!</span></h1>
      <p className="text-lg md:text-2xl text-slate-300 mb-12">اربط بين مهارتك واحتياجات الناس. بوابتك رقم #1 للحرفيين في الجزائر.</p>
      <button onClick={onSearch} className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-2xl hover:bg-emerald-500 transition-all">ابدأ البحث 🔍</button>
    </div>
  </div>
);

const ProfileView = ({ user, isOwn, onEdit, onLogout, onBack }: any) => (
  <div className="max-w-5xl mx-auto py-8 md:py-16 px-6 animate-in">
    {!isOwn && <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-emerald-600"><ChevronLeft size={20} /> العودة</button>}
    
    <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100">
      <div className="h-48 bg-gradient-to-r from-emerald-600 to-teal-400"></div>
      <div className="px-6 md:px-12 pb-12 relative -mt-24">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-10">
          <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&background=10b981&color=fff`} className="w-44 h-44 rounded-[2.5rem] border-8 border-white shadow-xl object-cover bg-white" />
          <div className="text-center md:text-right flex-1">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900">{user.firstName} {user.lastName}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
              {user.categories?.map((c: string) => <span key={c} className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-black border border-emerald-100">{c}</span>)}
              <span className="text-slate-400 font-bold text-sm bg-slate-50 px-4 py-1.5 rounded-full">📍 {user.location.wilaya}</span>
            </div>
          </div>
          {isOwn && (
            <div className="flex gap-2">
              <button onClick={onEdit} className="p-3 bg-slate-100 rounded-2xl hover:bg-emerald-100 transition-colors"><Settings size={22} /></button>
              <button onClick={onLogout} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-colors"><LogOut size={22} /></button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl text-center">
              <p className="text-slate-400 font-bold mb-1">التقييم العام</p>
              <div className="text-4xl font-black text-yellow-500 flex items-center justify-center gap-2">
                <Star size={36} fill="currentColor" /> {user.rating?.toFixed(1) || '0.0'}
              </div>
              <p className="text-[10px] text-slate-400">من {user.ratingCount || 0} زبون</p>
            </div>
            <div className="bg-slate-900 text-white p-6 rounded-3xl">
              <h4 className="font-black mb-3 flex items-center gap-2"><Phone className="text-emerald-400" /> تواصل</h4>
              <p className="text-2xl font-mono text-center mb-4">{user.phone}</p>
              <button className="w-full bg-emerald-600 py-3 rounded-xl font-black">اتصال مباشر</button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-10">
            <div className="glass-card p-8 rounded-[2.5rem]">
              <h4 className="text-xl font-black mb-4 flex items-center gap-3"><Award className="text-emerald-500" /> عن الحرفي</h4>
              <p className="text-slate-600 leading-relaxed font-medium">{user.bio || 'لم يكتب هذا الحرفي نبذة بعد.'}</p>
            </div>

            {user.role === UserRole.WORKER && (
              <div>
                <h4 className="text-xl font-black mb-6 flex items-center gap-3"><ImageIcon className="text-emerald-500" /> معرض الأعمال الاحترافي</h4>
                <div className="portfolio-grid">
                  {user.portfolio && user.portfolio.length > 0 ? user.portfolio.map((img: string, idx: number) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden shadow-md group relative">
                      <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    </div>
                  )) : (
                    <div className="col-span-full py-16 bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200 text-center text-slate-400 font-bold">لا توجد صور للأعمال</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const EditProfileView = ({ user, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio || '',
    avatar: user.avatar || '',
    categories: user.categories || [],
    wilaya: user.location.wilaya,
    portfolio: user.portfolio || []
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'portfolio') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'avatar') {
        setFormData(prev => ({ ...prev, avatar: base64 }));
      } else {
        if (formData.portfolio.length >= 5) {
          alert('يمكنك إضافة 5 صور كحد أقصى');
          return;
        }
        setFormData(prev => ({ ...prev, portfolio: [...prev.portfolio, base64] }));
      }
    };
    reader.readAsDataURL(files[0]);
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) 
        ? prev.categories.filter(c => c !== cat) 
        : [...prev.categories, cat]
    }));
  };

  const removePortfolioImg = (idx: number) => {
    setFormData(prev => ({ ...prev, portfolio: prev.portfolio.filter((_: any, i: number) => i !== idx) }));
  };

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('users').update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
        avatar: formData.avatar,
        categories: formData.categories,
        wilaya: formData.wilaya,
        portfolio: formData.portfolio
      }).eq('id', user.id);
      if (error) throw error;
      onSave({ ...user, ...formData, location: { ...user.location, wilaya: formData.wilaya } });
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border">
        <h2 className="text-3xl font-black mb-10 text-slate-900 border-r-8 border-emerald-500 pr-4">تعديل ملفك الاحترافي ⚙️</h2>
        
        <form onSubmit={submit} className="space-y-12">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.firstName}`} className="w-40 h-40 rounded-[2.5rem] object-cover border-4 border-emerald-50 shadow-xl" />
              <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={32} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400">انقر لتغيير الصورة الشخصية</p>
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={e => handleImageUpload(e, 'avatar')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-black text-slate-700">الاسم</label>
              <input required className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="font-black text-slate-700">اللقب</label>
              <input required className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block font-black mb-4 text-slate-700">تخصصاتك المهنية (اختر كل ما تتقنه) ⚒️</label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_CATEGORIES.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => toggleCategory(c.name)}
                  className={`tag-chip px-5 py-2.5 rounded-xl font-black text-sm border-2 flex items-center gap-2 ${formData.categories.includes(c.name) ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}
                >
                  {formData.categories.includes(c.name) && <Check size={14} />} {c.name}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-black mb-4 text-slate-700">معرض الأعمال (ارفع حتى 5 صور من أعمالك) 📸</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {formData.portfolio.map((img: string, idx: number) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group">
                  <img src={img} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePortfolioImg(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                </div>
              ))}
              {formData.portfolio.length < 5 && (
                <div 
                  onClick={() => portfolioInputRef.current?.click()}
                  className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all"
                >
                  <Plus size={32} />
                  <span className="text-[10px] font-black mt-1">إضافة صورة</span>
                </div>
              )}
            </div>
            <input type="file" hidden ref={portfolioInputRef} accept="image/*" onChange={e => handleImageUpload(e, 'portfolio')} />
          </div>

          <div className="space-y-2">
            <label className="font-black text-slate-700">نبذة عن خبرتك (Bio)</label>
            <textarea className="w-full p-6 bg-slate-50 rounded-3xl font-bold h-40 border-none" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="اشرح للزبائن لماذا يجب عليهم اختيارك..." />
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl active:scale-95 disabled:opacity-50">
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات ✅'}
            </button>
            <button type="button" onClick={onCancel} className="px-10 bg-slate-100 text-slate-600 rounded-2xl font-black">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SearchWorkersView = ({ workers, loading, filters, onFilterChange, onProfile }: any) => (
  <div className="max-w-7xl mx-auto px-6 py-12">
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border mb-12 flex flex-col md:flex-row gap-4">
      <input placeholder="ابحث عن حرفي..." className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold border-none" value={filters.query} onChange={e => onFilterChange({...filters, query: e.target.value})} />
      <select className="p-4 bg-slate-50 rounded-2xl font-bold border-none" value={filters.wilaya} onChange={e => onFilterChange({...filters, wilaya: e.target.value})}>
        <option value="">كل الولايات</option>
        {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
      </select>
      <select className="p-4 bg-slate-50 rounded-2xl font-bold border-none" value={filters.category} onChange={e => onFilterChange({...filters, category: e.target.value})}>
        <option value="">كل الحرف</option>
        {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {loading ? <div className="col-span-full py-20 flex justify-center"><div className="loading-spinner"></div></div> : workers.map((w: any) => (
        <div key={w.id} onClick={() => onProfile(w)} className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 cursor-pointer hover:-translate-y-2 transition-all">
          <div className="flex items-center gap-4 mb-6">
            <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-16 h-16 rounded-2xl object-cover" />
            <div className="text-right">
              <h3 className="text-lg font-black">{w.firstName} {w.lastName}</h3>
              <div className="flex gap-1 flex-wrap">
                {w.categories?.slice(0, 1).map((c: string) => <span key={c} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg font-black">{c}</span>)}
              </div>
            </div>
          </div>
          <p className="text-slate-500 text-sm line-clamp-2 h-10 mb-6">{w.bio || 'حرفي متميز في سلكني.'}</p>
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-slate-400 text-xs font-bold">📍 {w.wilaya}</span>
            <div className="flex items-center gap-1 text-yellow-500 font-black"><Star size={14} fill="currentColor" /> {w.rating?.toFixed(1) || '0.0'}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AuthForm = ({ onSuccess }: any) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = async (e: any) => {
    e.preventDefault(); setLoading(true);
    const { data, error } = await supabase.from('users').select('*').eq('phone', phone).eq('password', password).single();
    if (error) alert("خطأ في بيانات الدخول");
    else {
      const u = { ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya }, categories: data.categories || [], portfolio: data.portfolio || [] };
      localStorage.setItem('user', JSON.stringify(u)); onSuccess(u);
    }
    setLoading(false);
  };
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <form onSubmit={login} className="bg-white p-10 rounded-[3rem] shadow-2xl border w-full max-w-md space-y-6 text-right">
        <h2 className="text-2xl font-black mb-8">تسجيل الدخول 👋</h2>
        <input required placeholder="رقم الهاتف" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" value={phone} onChange={e => setPhone(e.target.value)} />
        <input required type="password" placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" value={password} onChange={e => setPassword(e.target.value)} />
        <button disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl">دخول</button>
      </form>
    </div>
  );
};
