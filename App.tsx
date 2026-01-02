
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
  Briefcase
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
    .animate-in { animation: fadeIn 0.5s ease-out forwards; }
    .arabic-text { font-family: 'Tajawal', sans-serif; }
    .loading-spinner { border: 4px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
    .star-active { color: #fbbf24; fill: #fbbf24; }
    .star-inactive { color: #d1d5db; }
    .profile-card { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .portfolio-img:hover { transform: scale(1.05); filter: brightness(1.1); }
  `}</style>
);

const Logo: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <div onClick={onClick} className="flex items-center gap-2 cursor-pointer group">
    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg group-hover:rotate-12 transition-transform">S</div>
    <span className="text-2xl font-black text-slate-900">Salakni <span className="text-emerald-600">سلكني</span></span>
  </div>
);

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { currentUser: saved ? JSON.parse(saved) : null, workers: [], view: 'landing' };
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatTarget, setChatTarget] = useState<User | null>(null);
  const [searchFilters, setSearchFilters] = useState({ query: '', wilaya: '', category: '' });

  const setView = (view: AppState['view']) => setState(prev => ({ ...prev, view }));

  const handleLogout = () => {
    localStorage.removeItem('user');
    setState({ currentUser: null, workers: [], view: 'landing' });
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error: dbError } = await supabase.from('tasks').select(`*, users:seeker_id (first_name, last_name, avatar)`).order('created_at', { ascending: false });
      if (dbError) throw dbError;
      setTasks(data.map(t => ({ ...t, seeker_name: `${t.users?.first_name} ${t.users?.last_name}`, seeker_avatar: t.users?.avatar })));
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('users').select('*').eq('role', UserRole.WORKER);
      if (searchFilters.wilaya) query = query.eq('wilaya', searchFilters.wilaya);
      if (searchFilters.category) query = query.contains('categories', [searchFilters.category]);
      const { data, error: dbError } = await query;
      if (dbError) throw dbError;
      setState(prev => ({ ...prev, workers: data.map(d => ({ ...d, firstName: d.first_name, lastName: d.last_name, location: { wilaya: d.wilaya }, rating: d.rating || 0, ratingCount: d.rating_count || 0, categories: d.categories || [], portfolio: d.portfolio || [] })) }));
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (state.view === 'search') fetchWorkers();
    if (state.view === 'support') fetchTasks();
  }, [state.view, searchFilters]);

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-20 md:pb-0" dir="rtl">
      <GlobalStyles />
      <nav className="h-20 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} />
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => setView('search')} className="font-bold hover:text-emerald-600 transition-colors">البحث عن حرفي</button>
            <button onClick={() => setView('support')} className="font-bold hover:text-emerald-600 transition-colors">سوق المهام</button>
            {state.currentUser ? (
              <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer bg-slate-100 px-4 py-2 rounded-2xl hover:bg-emerald-50 transition-colors">
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-9 h-9 rounded-xl object-cover" />
                <span className="font-black text-sm">{state.currentUser.firstName}</span>
              </div>
            ) : (
              <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold">دخول</button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-4 flex justify-between md:hidden z-50 rounded-t-[2rem] shadow-2xl">
        <button onClick={() => setView('landing')} className={`flex flex-col items-center gap-1 ${state.view === 'landing' ? 'text-emerald-600' : 'text-slate-400'}`}><Home size={20} /><span className="text-[10px] font-bold">الرئيسية</span></button>
        <button onClick={() => setView('search')} className={`flex flex-col items-center gap-1 ${state.view === 'search' ? 'text-emerald-600' : 'text-slate-400'}`}><Search size={20} /><span className="text-[10px] font-bold">البحث</span></button>
        <button onClick={() => setView('support')} className={`flex flex-col items-center gap-1 ${state.view === 'support' ? 'text-emerald-600' : 'text-slate-400'}`}><ClipboardList size={20} /><span className="text-[10px] font-bold">المهام</span></button>
        <button onClick={() => state.currentUser ? setView('profile') : setView('login')} className={`flex flex-col items-center gap-1 ${state.view === 'profile' ? 'text-emerald-600' : 'text-slate-400'}`}><UserIcon size={20} /><span className="text-[10px] font-bold">حسابي</span></button>
      </div>

      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onSearch={() => setView('search')} />}
        {state.view === 'search' && <SearchWorkersView workers={state.workers} filters={searchFilters} onFilterChange={setSearchFilters} onProfile={(w) => { setChatTarget(w); setView('profile'); }} />}
        {state.view === 'profile' && (state.currentUser || chatTarget) && (
          <ProfileView 
            user={chatTarget || state.currentUser!} 
            isOwn={!chatTarget || chatTarget?.id === state.currentUser?.id} 
            onEdit={() => setView('edit-profile')} 
            onLogout={handleLogout}
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
        {state.view === 'support' && <TasksView tasks={tasks} currentUser={state.currentUser} onRefresh={fetchTasks} />}
        {state.view === 'login' && <AuthForm onSuccess={(u) => { setState(prev => ({ ...prev, currentUser: u, view: 'profile' })); }} />}
      </main>
    </div>
  );
}

// --- Components ---

const LandingView = ({ onSearch }: any) => (
  <div className="relative min-h-[80vh] flex items-center justify-center text-center px-6 overflow-hidden">
    <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000')] bg-cover bg-center opacity-30"></div>
    <div className="relative z-10 max-w-4xl">
      <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-8">حرفتك، <span className="text-emerald-400">سلكني</span> يسلكها لك!</h1>
      <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">سوق الحرفيين الأول في الجزائر. ابحث عن خبير أو اعرض خدماتك اليوم.</p>
      <button onClick={onSearch} className="bg-emerald-600 text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:scale-105 transition-transform">اكتشف الحرفيين الآن 🔍</button>
    </div>
  </div>
);

const SearchWorkersView = ({ workers, filters, onFilterChange, onProfile }: any) => (
  <div className="max-w-7xl mx-auto px-6 py-12">
    <div className="bg-white p-8 rounded-[3rem] shadow-xl border mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
      <input placeholder="بحث بالاسم..." className="p-4 bg-slate-50 rounded-2xl border-none font-bold" value={filters.query} onChange={e => onFilterChange({...filters, query: e.target.value})} />
      <select className="p-4 bg-slate-50 rounded-2xl border-none font-bold" value={filters.wilaya} onChange={e => onFilterChange({...filters, wilaya: e.target.value})}>
        <option value="">كل الولايات</option>
        {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
      </select>
      <select className="p-4 bg-slate-50 rounded-2xl border-none font-bold" value={filters.category} onChange={e => onFilterChange({...filters, category: e.target.value})}>
        <option value="">كل التخصصات</option>
        {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {workers.map((w: any) => (
        <div key={w.id} onClick={() => onProfile(w)} className="bg-white p-8 rounded-[3.5rem] shadow-lg border border-slate-100 cursor-pointer hover:shadow-2xl transition-all profile-card">
          <div className="flex items-center gap-5 mb-6">
            <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-20 h-20 rounded-3xl object-cover shadow-md" />
            <div className="text-right flex-1">
              <h3 className="text-xl font-black text-slate-900">{w.firstName} {w.lastName}</h3>
              <div className="flex gap-1 flex-wrap mt-2">
                {w.categories?.slice(0, 2).map((c: string) => <span key={c} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg font-bold">#{c.split(' ')[0]}</span>)}
              </div>
            </div>
          </div>
          <p className="text-slate-500 text-sm line-clamp-2 mb-6 h-10">{w.bio || 'حرفي متميز يهدف لتقديم أفضل الخدمات بجودة عالية.'}</p>
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-slate-400 text-xs font-bold flex items-center gap-1"><MapPin size={14} /> {w.wilaya}</span>
            <div className="flex items-center gap-1 text-yellow-500 font-black"><Star size={16} fill="currentColor" /> {w.rating?.toFixed(1) || '0.0'}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProfileView = ({ user, isOwn, onEdit, onLogout, onBack }: any) => {
  const [userRating, setUserRating] = useState(0);

  return (
    <div className="max-w-5xl mx-auto py-8 md:py-16 px-6 animate-in">
      {!isOwn && <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-emerald-600"><ChevronLeft size={20} /> العودة للبحث</button>}
      
      <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="h-48 md:h-64 bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-500"></div>
        <div className="px-8 md:px-16 pb-16 relative -mt-24">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-12">
            <div className="relative group">
              <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&background=10b981&color=fff`} className="w-48 h-48 md:w-56 md:h-56 rounded-[3.5rem] border-8 border-white shadow-2xl object-cover bg-white" />
              {isOwn && <button onClick={onEdit} className="absolute bottom-4 left-4 bg-slate-900 text-white p-3 rounded-2xl shadow-xl hover:bg-emerald-600 transition-colors"><Camera size={20} /></button>}
            </div>
            <div className="text-center md:text-right flex-1">
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-3">{user.firstName} {user.lastName}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {user.role === UserRole.WORKER ? (
                  user.categories?.map((cat: string) => <span key={cat} className="bg-emerald-600 text-white px-5 py-2 rounded-2xl font-black text-sm shadow-md">{cat}</span>)
                ) : <span className="bg-blue-600 text-white px-5 py-2 rounded-2xl font-black text-sm">زبون مميز</span>}
                <span className="bg-slate-100 text-slate-600 px-5 py-2 rounded-2xl font-bold text-sm">📍 {user.location.wilaya}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-1 space-y-8">
              <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 text-center">
                <p className="text-slate-400 font-bold mb-2">تقييم الحرفي</p>
                <div className="text-5xl font-black text-yellow-500 flex items-center justify-center gap-3">
                  <Star size={48} fill="currentColor" /> {user.rating?.toFixed(1) || '0.0'}
                </div>
                <p className="text-xs text-slate-400 mt-2">({user.ratingCount || 0} تقييم)</p>
                {!isOwn && (
                  <div className="mt-6 flex justify-center gap-1">
                    {[1,2,3,4,5].map(s => <Star key={s} size={28} className={`cursor-pointer ${userRating >= s ? 'star-active' : 'star-inactive'}`} onClick={() => setUserRating(s)} />)}
                  </div>
                )}
              </div>
              
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white">
                <h4 className="text-xl font-black mb-4 flex items-center gap-3"><Phone className="text-emerald-400" /> تواصل مباشر</h4>
                <p className="text-3xl font-mono tracking-widest">{user.phone}</p>
                <button className="w-full mt-6 bg-emerald-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors"><MessageSquare size={20} /> إرسال رسالة</button>
              </div>

              {isOwn && (
                <div className="flex flex-col gap-3">
                  <button onClick={onEdit} className="bg-white border-2 border-slate-100 text-slate-900 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-50"><Settings size={20} /> إعدادات الملف</button>
                  <button onClick={onLogout} className="bg-red-50 text-red-500 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-colors"><LogOut size={20} /> تسجيل الخروج</button>
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-12">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100">
                <h4 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3"><Award className="text-emerald-500" /> من أنا؟</h4>
                <p className="text-slate-600 leading-relaxed text-lg font-medium">{user.bio || 'لم يقم هذا الحرفي بإضافة نبذة شخصية بعد.'}</p>
              </div>

              {user.role === UserRole.WORKER && (
                <div>
                  <h4 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3"><ImageIcon className="text-emerald-500" /> معرض الأعمال (5 صور)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {user.portfolio && user.portfolio.length > 0 ? (
                      user.portfolio.map((img: string, idx: number) => (
                        <div key={idx} className="aspect-square rounded-[2.5rem] overflow-hidden shadow-lg border-4 border-white">
                          <img src={img} className="w-full h-full object-cover portfolio-img transition-all cursor-pointer" />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center text-slate-400 font-bold">لم يتم رفع أي صور للأعمال بعد</div>
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
};

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

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) 
        ? prev.categories.filter(c => c !== cat) 
        : [...prev.categories, cat]
    }));
  };

  const updatePortfolio = (idx: number, url: string) => {
    setFormData(prev => {
      const p = [...prev.portfolio];
      p[idx] = url;
      return { ...prev, portfolio: p.filter(Boolean) };
    });
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
      onSave({ ...user, ...formData, location: { wilaya: formData.wilaya } });
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="bg-white p-10 md:p-16 rounded-[4rem] shadow-2xl border">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-black text-slate-900">تحديث الملف الشخصي ⚙️</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-red-500"><X size={32} /></button>
        </div>

        <form onSubmit={submit} className="space-y-10">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.firstName}`} className="w-40 h-40 rounded-[3rem] object-cover border-4 border-emerald-100 shadow-xl" />
              <div className="absolute inset-0 bg-black/30 rounded-[3rem] opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white">تغيير</div>
            </div>
            <input placeholder="رابط صورة البروفايل (URL)" className="w-full max-w-md p-4 bg-slate-50 rounded-2xl border-none font-bold text-center" value={formData.avatar} onChange={e => setFormData({...formData, avatar: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input required placeholder="الاسم" className="p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            <input required placeholder="اللقب" className="p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>

          <div>
            <label className="block font-black mb-4 text-slate-700">التخصصات (اختر أكثر من حرفة) 🛠️</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICE_CATEGORIES.map(c => (
                <div key={c.id} onClick={() => toggleCategory(c.name)} className={`p-4 rounded-2xl border-2 text-center font-black cursor-pointer transition-all ${formData.categories.includes(c.name) ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500'}`}>{c.name}</div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-black mb-4 text-slate-700">معرض الصور (5 روابط صور لأعمالك) 📸</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="bg-slate-50 rounded-2xl p-2 border-2 border-dashed border-slate-200">
                  <input placeholder="رابط الصورة" className="w-full text-[10px] bg-transparent outline-none font-bold" value={formData.portfolio[i] || ''} onChange={e => updatePortfolio(i, e.target.value)} />
                  {formData.portfolio[i] && <img src={formData.portfolio[i]} className="w-full aspect-square mt-2 rounded-xl object-cover" />}
                </div>
              ))}
            </div>
          </div>

          <textarea placeholder="تحدث عن خبرتك ومميزات عملك..." className="w-full p-6 bg-slate-50 rounded-3xl border-none font-bold h-40" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />

          <div className="flex gap-4 pt-6">
            <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl active:scale-95 disabled:opacity-50">حفظ البيانات ✅</button>
            <button type="button" onClick={onCancel} className="px-10 bg-slate-100 text-slate-600 rounded-[2rem] font-black">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Other Views (Simplified for focus) ---

const TasksView = ({ tasks, onRefresh }: any) => {
  useEffect(() => { onRefresh(); }, []);
  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <h2 className="text-4xl font-black mb-12 text-slate-900">سوق المهام المفتوحة ⚒️</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {tasks.map((t: any) => (
          <div key={t.id} className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 profile-card">
            <div className="flex justify-between items-start mb-6">
              <span className="bg-emerald-50 text-emerald-700 px-4 py-1 rounded-full text-xs font-black">#{t.category}</span>
              <span className="text-slate-400 text-xs font-bold">{new Date(t.created_at).toLocaleDateString()}</span>
            </div>
            <h3 className="text-2xl font-black mb-4">{t.title}</h3>
            <p className="text-slate-500 mb-8 h-20 overflow-hidden">{t.description}</p>
            <div className="flex justify-between items-center border-t pt-6">
               <div className="flex items-center gap-3">
                 <img src={t.seeker_avatar || `https://ui-avatars.com/api/?name=${t.seeker_name}`} className="w-10 h-10 rounded-full" />
                 <span className="font-bold">{t.seeker_name}</span>
               </div>
               <button className="bg-slate-900 text-white px-8 py-2 rounded-2xl font-black hover:bg-emerald-600 transition-colors">تواصل</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AuthForm = ({ onSuccess }: any) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = async (e: any) => {
    e.preventDefault(); setLoading(true);
    const { data, error } = await supabase.from('users').select('*').eq('phone', phone).eq('password', password).single();
    if (error) alert("فشل الدخول ❌");
    else {
      const u = { ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya }, categories: data.categories || [], portfolio: data.portfolio || [] };
      localStorage.setItem('user', JSON.stringify(u)); onSuccess(u);
    }
    setLoading(false);
  };
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <form onSubmit={login} className="bg-white p-12 rounded-[3.5rem] shadow-2xl border w-full max-w-md space-y-6">
        <h2 className="text-3xl font-black mb-8 border-r-4 border-emerald-500 pr-4">تسجيل الدخول 👋</h2>
        <input required placeholder="رقم الهاتف" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={phone} onChange={e => setPhone(e.target.value)} />
        <input required type="password" placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={password} onChange={e => setPassword(e.target.value)} />
        <button disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl">دخول</button>
      </form>
    </div>
  );
};
