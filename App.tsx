
/* 
تنبيه هام - تحديث قاعدة البيانات (Supabase SQL Editor):
يرجى تشغيل هذا الكود لتحديث الجداول لدعم الميزات الجديدة:

-- إضافة أعمدة جديدة لجدول المستخدمين
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS categories text[],
ADD COLUMN IF NOT EXISTS portfolio text[],
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0;

-- تحديث السياسات لتسمح بتحديث الملف الشخصي
CREATE POLICY "Users can update their own profile data" 
ON users FOR UPDATE 
USING (auth.uid() = id);
*/

import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, Message, Worker } from './types.ts';
import { SERVICE_CATEGORIES, WILAYAS, DAIRAS } from './constants.tsx';
import { supabase } from './lib/supabase.ts';
import { 
  MapPin, 
  Star, 
  CheckCircle, 
  Briefcase, 
  User as UserIcon, 
  LogOut, 
  Settings, 
  Phone, 
  ShieldCheck, 
  Calendar,
  MessageSquare,
  Home,
  Search,
  PlusCircle,
  ClipboardList,
  Clock,
  DollarSign,
  Send,
  AlertCircle,
  RefreshCcw,
  Camera,
  Image as ImageIcon,
  X,
  ChevronLeft
} from 'lucide-react';

interface Task {
  id: string;
  seeker_id: string;
  title: string;
  description: string;
  category: string;
  wilaya: string;
  daira: string;
  budget: string;
  created_at: string;
  seeker_name?: string;
  seeker_avatar?: string;
}

// --- أنماط مخصصة ---
const GlobalStyles = () => (
  <style>{`
    @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
    .animate-float { animation: float 5s ease-in-out infinite; }
    .arabic-text { font-family: 'Tajawal', sans-serif; }
    .loading-spinner { border: 4px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
    .chat-bubble-me { background: #10b981; color: white; border-radius: 1.2rem 1.2rem 0 1.2rem; }
    .chat-bubble-them { background: #f3f4f6; color: #1f2937; border-radius: 1.2rem 1.2rem 1.2rem 0; }
    .bottom-nav-active { color: #10b981; transform: translateY(-4px); }
    .task-card { transition: all 0.3s ease; }
    .task-card:hover { transform: scale(1.02); }
    .star-rating { color: #fbbf24; cursor: pointer; transition: transform 0.2s; }
    .star-rating:hover { transform: scale(1.2); }
    .portfolio-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem; }
    @media (max-width: 640px) {
      .hero-title { font-size: 2.5rem !important; line-height: 1.2 !important; }
      .portfolio-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `}</style>
);

const REQ_IMAGE = "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000";

const Logo: React.FC<{ size?: 'sm' | 'lg', onClick?: () => void, inverse?: boolean }> = ({ size = 'sm', onClick, inverse }) => (
  <div onClick={onClick} className={`flex items-center gap-2 md:gap-3 group cursor-pointer transition-all ${size === 'lg' ? 'scale-100 md:scale-110' : ''}`}>
    <div className={`relative ${size === 'lg' ? 'w-14 h-14 md:w-16 md:h-16' : 'w-10 h-10'} flex-shrink-0`}>
      <div className={`absolute inset-0 bg-gradient-to-tr from-emerald-600 via-teal-500 to-yellow-400 rounded-xl rotate-3 group-hover:rotate-12 transition-transform shadow-xl`}></div>
      <div className="absolute inset-0 flex items-center justify-center text-white font-black z-10">S</div>
    </div>
    <div className="flex flex-col items-start leading-none">
      <div className="flex items-baseline gap-1">
        <span className={`${size === 'lg' ? 'text-2xl md:text-4xl' : 'text-xl md:text-2xl'} font-black ${inverse ? 'text-white' : 'text-emerald-950'}`}>Salakni</span>
        <span className="text-yellow-500 font-bold text-xs md:text-sm">سلكني</span>
      </div>
    </div>
  </div>
);

export default function App() {
  const getInitialUser = () => JSON.parse(localStorage.getItem('user') || 'null');
  const [state, setState] = useState<AppState>(() => ({ currentUser: getInitialUser(), workers: [], view: 'landing' }));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatTarget, setChatTarget] = useState<User | null>(null);
  const [registerRole, setRegisterRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState({ query: '', wilaya: '', category: '' });

  const setView = (view: AppState['view']) => setState(prev => ({ ...prev, view }));

  const handleLogout = () => {
    localStorage.removeItem('user');
    setState({ currentUser: null, workers: [], view: 'landing' });
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('tasks')
        .select(`*, users:seeker_id (first_name, last_name, avatar)`)
        .order('created_at', { ascending: false });
      
      if (dbError) throw dbError;
      const mappedTasks = (data || []).map(t => ({
        ...t,
        seeker_name: t.users ? `${t.users.first_name} ${t.users.last_name}` : 'زبون سلكني',
        seeker_avatar: t.users?.avatar
      }));
      setTasks(mappedTasks);
    } catch (e: any) {
      setError(e.message || "حدث خطأ أثناء تحميل المهام.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('users').select('*').eq('role', UserRole.WORKER);
      if (searchFilters.wilaya) query = query.eq('wilaya', searchFilters.wilaya);
      if (searchFilters.category) query = query.contains('categories', [searchFilters.category]);
      if (searchFilters.query) query = query.or(`first_name.ilike.%${searchFilters.query}%,last_name.ilike.%${searchFilters.query}%,bio.ilike.%${searchFilters.query}%`);

      const { data, error: dbError } = await query;
      if (dbError) throw dbError;
      
      const mappedWorkers: Worker[] = (data || []).map(d => ({
        id: d.id, firstName: d.first_name, lastName: d.last_name, phone: d.phone, role: UserRole.WORKER,
        location: { wilaya: d.wilaya, daira: d.daira }, avatar: d.avatar, bio: d.bio, categories: d.categories || [],
        isVerified: d.is_verified, rating: Number(d.rating) || 0, ratingCount: d.rating_count || 0, 
        completedJobs: d.completed_jobs || 0, skills: d.skills || [], portfolio: d.portfolio || []
      }));
      setState(prev => ({ ...prev, workers: mappedWorkers }));
    } catch (e: any) { 
      setError(e.message || "حدث خطأ أثناء البحث.");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (state.view === 'search') fetchWorkers();
  }, [state.view, searchFilters]);

  useEffect(() => {
    if (state.view === 'support') fetchTasks();
  }, [state.view]);

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-gray-50 pb-24 md:pb-0" dir="rtl">
      <GlobalStyles />
      <nav className="h-20 flex items-center px-4 md:px-6 sticky top-0 z-50 backdrop-blur-xl border-b bg-white/90 border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} />
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => setView('search')} className={`font-bold transition-colors ${state.view === 'search' ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600'}`}>تصفح الحرفيين</button>
            <button onClick={() => setView('support')} className={`font-bold transition-colors ${state.view === 'support' ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600'}`}>سوق المهام</button>
            {state.currentUser ? (
              <div className="flex items-center gap-4">
                <button onClick={() => setView('messages')} className={`text-xl ${state.view === 'messages' ? 'text-emerald-600' : 'text-slate-600'}`}><MessageSquare size={24} /></button>
                <div onClick={() => setView('profile')} className="w-10 h-10 rounded-xl bg-emerald-100 cursor-pointer overflow-hidden border-2 border-white shadow-sm hover:border-emerald-500">
                   <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                 <button onClick={() => setView('login')} className="text-gray-500 font-bold px-4 py-2 hover:text-emerald-600">دخول</button>
                 <button onClick={() => setView('register')} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black shadow-lg">سجل الآن</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 py-4 flex justify-between items-center md:hidden rounded-t-[2.5rem] shadow-2xl">
        <button onClick={() => setView('landing')} className={`flex flex-col items-center gap-1 ${state.view === 'landing' ? 'bottom-nav-active' : 'text-slate-400'}`}><Home size={22} /><span className="text-[10px] font-black">الرئيسية</span></button>
        <button onClick={() => setView('search')} className={`flex flex-col items-center gap-1 ${state.view === 'search' ? 'bottom-nav-active' : 'text-slate-400'}`}><Search size={22} /><span className="text-[10px] font-black">البحث</span></button>
        <div className="relative -mt-10">
           <button onClick={() => setView('support')} className={`p-4 rounded-full shadow-2xl transition-all active:scale-90 ${state.view === 'support' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 border border-emerald-100'}`}><ClipboardList size={28} /></button>
        </div>
        <button onClick={() => state.currentUser ? setView('messages') : setView('login')} className={`flex flex-col items-center gap-1 ${state.view === 'messages' ? 'bottom-nav-active' : 'text-slate-400'}`}><MessageSquare size={22} /><span className="text-[10px] font-black">الرسائل</span></button>
        <button onClick={() => state.currentUser ? setView('profile') : setView('login')} className={`flex flex-col items-center gap-1 ${state.view === 'profile' ? 'bottom-nav-active' : 'text-slate-400'}`}><UserIcon size={22} /><span className="text-[10px] font-black">حسابي</span></button>
      </div>

      <main className="flex-grow pb-12">
        {state.view === 'landing' && <LandingView onSearch={() => setView('search')} onPost={() => setView('support')} />}
        
        {state.view === 'support' && (
          <TasksMarketView 
            tasks={tasks} loading={loading} error={error} currentUser={state.currentUser} 
            onRefresh={fetchTasks} onPostTask={() => { if(!state.currentUser) setView('login'); }}
            onContact={(seekerId, seekerName) => {
               setChatTarget({ id: seekerId, firstName: seekerName, lastName: '', role: UserRole.SEEKER } as User);
               setView('messages');
            }}
          />
        )}

        {state.view === 'register' && !registerRole && <RegistrationChoice onChoice={setRegisterRole} />}
        {state.view === 'register' && registerRole === UserRole.WORKER && <WorkerRegistrationForm onSuccess={(u) => { setState(prev => ({ ...prev, currentUser: u, view: 'profile' })); }} onBack={() => setRegisterRole(null)} />}
        {state.view === 'register' && registerRole === UserRole.SEEKER && <SeekerRegistrationForm onSuccess={(u) => { setState(prev => ({ ...prev, currentUser: u, view: 'profile' })); }} onBack={() => setRegisterRole(null)} />}
        {state.view === 'login' && <AuthForm onSuccess={(u) => { setState(prev => ({ ...prev, currentUser: u, view: 'profile' })); }} />}
        
        {state.view === 'profile' && state.currentUser && (
          <ProfileView 
            user={state.currentUser} 
            onLogout={handleLogout} 
            onEdit={() => setView('edit-profile')} 
          />
        )}

        {state.view === 'edit-profile' && state.currentUser && (
          <EditProfileView 
            user={state.currentUser} 
            onSave={(u) => { setState(prev => ({ ...prev, currentUser: u, view: 'profile' })); localStorage.setItem('user', JSON.stringify(u)); }}
            onCancel={() => setView('profile')}
          />
        )}

        {state.view === 'search' && (
          <SearchWorkersView 
            loading={loading} error={error} workers={state.workers} 
            filters={searchFilters} onFilterChange={setSearchFilters} 
            onContact={(w) => { setChatTarget(w); setView('messages'); }} 
            onRate={async (workerId, rating) => {
              // Simple rating update logic
              const worker = state.workers.find(w => w.id === workerId);
              if (worker) {
                const newRatingCount = (worker.ratingCount || 0) + 1;
                const newRating = ((worker.rating * (worker.ratingCount || 0)) + rating) / newRatingCount;
                await supabase.from('users').update({ rating: newRating, rating_count: newRatingCount }).eq('id', workerId);
                fetchWorkers();
              }
            }}
          />
        )}
        
        {state.view === 'messages' && state.currentUser && <ChatView currentUser={state.currentUser} targetUser={chatTarget} />}
      </main>
    </div>
  );
}

// --- مكونات الصفحات ---

const LandingView: React.FC<{ onSearch: () => void, onPost: () => void }> = ({ onSearch, onPost }) => (
  <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950">
    <div className="absolute inset-0 bg-cover bg-center opacity-30 animate-pulse" style={{ backgroundImage: `url(${REQ_IMAGE})` }}></div>
    <div className="absolute inset-0 bg-gradient-to-tr from-gray-900/90 to-emerald-900/40"></div>
    <div className="relative z-10 max-w-5xl mx-auto px-6 text-center animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <h1 className="hero-title text-4xl md:text-8xl font-black text-white leading-tight">ريح بالك، <span className="text-emerald-400">سَلّكني</span> يسلكها</h1>
      <p className="text-lg md:text-2xl text-slate-300 mt-6 font-medium max-w-2xl mx-auto">تواصل مع أفضل الحرفيين في منطقتك، أو انشر مهمة واترك الباقي لنا.</p>
      <div className="flex flex-col sm:flex-row gap-6 mt-12 justify-center">
        <button onClick={onSearch} className="bg-emerald-600 px-10 py-5 rounded-3xl font-black text-white text-xl shadow-2xl active:scale-95">تصفح الحرفيين 🔍</button>
        <button onClick={onPost} className="bg-white/10 backdrop-blur-md px-10 py-5 rounded-3xl font-black text-white text-xl border border-white/20 active:scale-95">نشر مهمة عمل ⚒️</button>
      </div>
    </div>
  </div>
);

// --- واجهة تعديل الملف الشخصي الجديدة ---
const EditProfileView: React.FC<{ user: User, onSave: (u: User) => void, onCancel: () => void }> = ({ user, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio || '',
    avatar: user.avatar || '',
    categories: user.categories || [user.category].filter(Boolean) as string[],
    wilaya: user.location.wilaya,
    daira: user.location.daira,
    portfolio: user.portfolio || []
  });

  const handleCategoryToggle = (catName: string) => {
    setFormData(prev => {
      const exists = prev.categories.includes(catName);
      if (exists) return { ...prev, categories: prev.categories.filter(c => c !== catName) };
      return { ...prev, categories: [...prev.categories, catName] };
    });
  };

  const handlePortfolioUpdate = (index: number, url: string) => {
    setFormData(prev => {
      const newP = [...prev.portfolio];
      newP[index] = url;
      return { ...prev, portfolio: newP.filter(Boolean) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        daira: formData.daira,
        portfolio: formData.portfolio
      }).eq('id', user.id);

      if (error) throw error;
      onSave({ 
        ...user, 
        firstName: formData.firstName, 
        lastName: formData.lastName, 
        bio: formData.bio, 
        avatar: formData.avatar, 
        categories: formData.categories, 
        location: { wilaya: formData.wilaya, daira: formData.daira },
        portfolio: formData.portfolio
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 px-4 animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 p-8 md:p-12 text-right">
        <div className="flex justify-between items-center mb-10 flex-row-reverse">
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">تعديل ملفك الشخصي <Settings className="text-emerald-500" /></h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-red-500 transition-colors"><X size={32} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative group">
              <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.firstName}`} className="w-32 h-32 rounded-3xl border-4 border-emerald-100 object-cover shadow-xl" />
              <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera className="text-white" size={32} />
              </div>
            </div>
            <input 
              placeholder="رابط الصورة الشخصية (URL)" 
              className="w-full max-w-md p-4 bg-gray-50 border-2 rounded-2xl text-center font-bold text-sm"
              value={formData.avatar}
              onChange={e => setFormData({...formData, avatar: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-700 font-black mb-2">الاسم</label>
              <input required className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div>
              <label className="block text-slate-700 font-black mb-2">اللقب</label>
              <input required className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>

          {user.role === UserRole.WORKER && (
            <div className="space-y-6">
              <div>
                <label className="block text-slate-700 font-black mb-4">التخصصات (اختر كل ما تتقنه) ⚒️</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {SERVICE_CATEGORIES.map(cat => (
                    <div 
                      key={cat.id} 
                      onClick={() => handleCategoryToggle(cat.name)}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all text-sm font-black text-center flex items-center justify-center gap-2 ${formData.categories.includes(cat.name) ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-gray-100 text-slate-600 hover:border-emerald-200'}`}
                    >
                      {cat.icon} {cat.name.split(' ')[0]}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-black mb-4">معرض أعمالك (أضف حتى 5 صور لنتائج عملك) 📸</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {[0, 1, 2, 3, 4].map(idx => (
                    <div key={idx} className="relative aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden group">
                      {formData.portfolio[idx] ? (
                        <>
                          <img src={formData.portfolio[idx]} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => handlePortfolioUpdate(idx, '')}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 gap-2 p-2">
                          <ImageIcon size={24} />
                          <input 
                            placeholder="رابط الصورة" 
                            className="text-[10px] w-full text-center bg-transparent outline-none border-b border-gray-100 focus:border-emerald-300" 
                            onBlur={(e) => handlePortfolioUpdate(idx, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-black mb-2">نبذة عنك</label>
            <textarea className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-medium h-32" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="أخبر الزبائن لماذا أنت الأفضل..." />
          </div>

          <div className="flex gap-4 pt-6">
            <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl active:scale-95 disabled:opacity-50">
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات ✅'}
            </button>
            <button type="button" onClick={onCancel} className="px-8 bg-gray-100 text-slate-600 rounded-2xl font-black">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProfileView: React.FC<{ user: User, onLogout: () => void, onEdit: () => void }> = ({ user, onLogout, onEdit }) => (
  <div className="max-w-4xl mx-auto my-8 md:my-16 px-4 animate-in fade-in duration-700">
    <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
      <div className="h-40 md:h-56 bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-500"></div>
      <div className="px-6 md:px-12 pb-12 relative -mt-20">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
          <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&background=10b981&color=fff`} className="w-40 h-40 md:w-48 md:h-48 rounded-[3rem] border-8 border-white shadow-2xl object-cover bg-white" />
          <div className="text-center md:text-right flex-1">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-2">{user.firstName} {user.lastName}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              {user.role === UserRole.WORKER ? (
                user.categories?.map(cat => (
                  <span key={cat} className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full font-black text-sm border border-emerald-100">{cat}</span>
                ))
              ) : <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full font-black text-sm">زبون مميز</span>}
              <span className="text-slate-400 font-bold text-sm bg-gray-50 px-4 py-1.5 rounded-full">📍 {user.location.wilaya}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <button onClick={onEdit} className="flex-1 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"><Settings size={20} /> تعديل الملف</button>
          <button onClick={onLogout} className="bg-red-50 text-red-500 px-10 py-4 rounded-2xl font-black border border-red-100 hover:bg-red-500 hover:text-white transition-colors">خروج</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
          <div className="md:col-span-1 space-y-6">
             <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 text-center">
                <p className="text-slate-400 font-bold mb-1">التقييم</p>
                <div className="text-3xl font-black text-yellow-500 flex items-center justify-center gap-2">
                  <Star size={32} fill="currentColor" /> {user.rating?.toFixed(1) || '0.0'}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">بناءً على {user.ratingCount || 0} تقييم</p>
             </div>
             <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100">
               <h4 className="font-black text-slate-800 mb-2 flex items-center gap-2 flex-row-reverse">تواصل <Phone size={18} className="text-emerald-500" /></h4>
               <p className="text-slate-600 font-mono font-bold">{user.phone}</p>
             </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <div className="bg-emerald-50/50 p-8 rounded-[3rem] border border-emerald-100">
              <h4 className="text-xl font-black text-emerald-900 mb-4">نبذة عني</h4>
              <p className="text-slate-700 leading-relaxed font-medium">{user.bio || 'لا يوجد وصف متاح.'}</p>
            </div>

            {user.role === UserRole.WORKER && (
              <div>
                <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 flex-row-reverse">معرض الأعمال 📸</h4>
                <div className="portfolio-grid">
                  {user.portfolio && user.portfolio.length > 0 ? (
                    user.portfolio.map((img, idx) => (
                      <img key={idx} src={img} className="w-full aspect-square rounded-2xl object-cover shadow-md hover:scale-105 transition-transform cursor-pointer" />
                    ))
                  ) : (
                    <div className="col-span-full py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-center text-gray-400 font-bold">
                      لم يتم إضافة صور للأعمال بعد
                    </div>
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

const SearchWorkersView: React.FC<{ 
  loading: boolean, error: string | null, workers: Worker[], 
  filters: any, onFilterChange: (f: any) => void, onContact: (w: Worker) => void,
  onRate: (id: string, rating: number) => void
}> = ({ loading, error, workers, filters, onFilterChange, onContact, onRate }) => {
  const [ratingTarget, setRatingTarget] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-right">
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 mb-12 animate-in fade-in">
         <h2 className="text-3xl font-black mb-6">ابحث عن حرفي متميز 🇩🇿</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="بحث بالاسم أو التخصص..." className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" value={filters.query} onChange={e => onFilterChange({...filters, query: e.target.value})} />
            <select className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" value={filters.wilaya} onChange={e => onFilterChange({...filters, wilaya: e.target.value})}>
              <option value="">كل الولايات</option>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <select className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" value={filters.category} onChange={e => onFilterChange({...filters, category: e.target.value})}>
              <option value="">كل التخصصات</option>
              {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
         </div>
      </div>
      
      {error && <p className="text-red-500 text-center mb-8">{error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading ? <div className="col-span-full py-20 flex justify-center"><div className="loading-spinner"></div></div> : workers.map(w => (
          <div key={w.id} className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-50 hover:shadow-2xl transition-all text-right group flex flex-col">
              <div className="flex gap-4 items-center mb-6 flex-row-reverse">
                <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-20 h-20 rounded-3xl object-cover shadow-md" />
                <div className="flex-1">
                    <h3 className="font-black text-xl">{w.firstName} {w.lastName}</h3>
                    <div className="flex flex-wrap gap-1 justify-end mt-1">
                      {w.categories?.slice(0, 2).map(cat => (
                        <span key={cat} className="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full">{cat.split(' ')[0]}</span>
                      ))}
                      {w.isVerified && <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-black">✓</span>}
                    </div>
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10 flex-grow">{w.bio || 'حرفي متميز يهدف لتقديم أفضل الخدمات.'}</p>
              
              <div className="flex justify-between items-center mb-6 flex-row-reverse">
                <span className="text-slate-400 text-xs font-bold flex items-center gap-1"><MapPin size={12} /> {w.wilaya}</span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 font-black text-sm">{w.rating?.toFixed(1) || '0.0'}</span>
                  <Star size={16} className="text-yellow-500" fill="currentColor" />
                  <button onClick={() => setRatingTarget(w.id)} className="text-[10px] text-emerald-500 font-bold hover:underline mr-2">قيم الآن</button>
                </div>
              </div>

              {ratingTarget === w.id && (
                <div className="mb-4 p-3 bg-gray-50 rounded-2xl flex justify-center gap-2 animate-in slide-in-from-top-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <Star 
                      key={num} 
                      size={24} 
                      className="star-rating" 
                      onClick={() => { onRate(w.id, num); setRatingTarget(null); }} 
                    />
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => onContact(w)} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black group-hover:bg-emerald-600 transition-colors">تواصل الآن</button>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- باقي المكونات (مختصرة للتركيز على التعديلات) ---

const TasksMarketView: React.FC<{ 
  tasks: Task[], loading: boolean, error: string | null, currentUser: User | null, onRefresh: () => void, onPostTask: () => void, onContact: (id: string, name: string) => void
}> = ({ tasks, loading, error, currentUser, onRefresh, onPostTask, onContact }) => {
  const [showForm, setShowForm] = useState(false);
  const [taskData, setTaskData] = useState({ title: '', description: '', category: SERVICE_CATEGORIES[0].name, wilaya: WILAYAS[0], budget: '' });
  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return onPostTask();
    await supabase.from('tasks').insert([{ seeker_id: currentUser.id, ...taskData }]);
    setShowForm(false);
    onRefresh();
  };
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-16 text-right">
      <div className="flex justify-between items-center mb-12 flex-row-reverse">
        <div><h2 className="text-3xl md:text-5xl font-black text-slate-900">سوق المهام ⚒️</h2><p className="text-slate-500 font-bold mt-2">اطلب خدمة وسيتواصل معك الحرفيون</p></div>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl">{showForm ? 'إلغاء' : 'نشر طلب عمل +'}</button>
      </div>
      {showForm && (
        <form onSubmit={handlePost} className="bg-white p-8 rounded-[3rem] shadow-xl mb-12 space-y-4 border-2 border-emerald-50">
          <input required placeholder="عنوان الطلب" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} />
          <textarea required placeholder="وصف الخدمة" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-medium h-32" value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select className="p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={taskData.wilaya} onChange={e => setTaskData({...taskData, wilaya: e.target.value})}>{WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}</select>
            <select className="p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={taskData.category} onChange={e => setTaskData({...taskData, category: e.target.value})}>{SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
            <input placeholder="الميزانية" className="p-4 bg-gray-50 border-2 rounded-2xl font-bold col-span-2" value={taskData.budget} onChange={e => setTaskData({...taskData, budget: e.target.value})} />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black">نشر الآن ✅</button>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {tasks.map(t => (
          <div key={t.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50 text-right flex flex-col">
            <h3 className="text-xl font-black mb-4">{t.title}</h3>
            <p className="text-gray-500 mb-6 flex-grow">{t.description}</p>
            <div className="flex justify-between items-center flex-row-reverse border-t pt-4">
              <span className="text-emerald-600 font-black">{t.category}</span>
              <button onClick={() => onContact(t.seeker_id, t.seeker_name || 'صاحب المهمة')} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold">اتفاق</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WorkerRegistrationForm: React.FC<{ onSuccess: (u: User) => void, onBack: () => void }> = ({ onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', password: '', wilaya: WILAYAS[0], daira: '', category: SERVICE_CATEGORIES[0].name, bio: '' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { data, error } = await supabase.from('users').insert([{ ...formData, first_name: formData.firstName, last_name: formData.lastName, role: UserRole.WORKER, categories: [formData.category] }]).select().single();
    if (error) alert(error.message);
    else if (data) {
      const u = { id: data.id, firstName: data.first_name, lastName: data.last_name, phone: data.phone, role: data.role as UserRole, location: { wilaya: data.wilaya, daira: data.daira }, categories: data.categories };
      localStorage.setItem('user', JSON.stringify(u)); onSuccess(u);
    }
    setLoading(false);
  };
  return (
    <div className="max-w-2xl mx-auto my-12 px-6"><div className="bg-white p-10 rounded-[3rem] shadow-2xl text-right">
      <button onClick={onBack} className="text-emerald-600 font-bold mb-6 hover:underline">← رجوع</button>
      <h2 className="text-3xl font-black mb-8">انضم كحرفي محترف ⚒️</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="الاسم" className="p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
          <input required placeholder="اللقب" className="p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
        </div>
        <input required placeholder="رقم الهاتف" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        <div className="grid grid-cols-2 gap-4">
          <select className="p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>{WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}</select>
          <select className="p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
        </div>
        <input type="password" required placeholder="كلمة المرور" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
        <button disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black">تأكيد التسجيل ✅</button>
      </form>
    </div></div>
  );
};

const SeekerRegistrationForm: React.FC<{ onSuccess: (u: User) => void, onBack: () => void }> = ({ onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', password: '', wilaya: WILAYAS[0] });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { data, error } = await supabase.from('users').insert([{ ...formData, first_name: formData.firstName, last_name: formData.lastName, role: UserRole.SEEKER }]).select().single();
    if (error) alert(error.message);
    else if (data) {
      const u = { id: data.id, firstName: data.first_name, lastName: data.last_name, phone: data.phone, role: data.role as UserRole, location: { wilaya: data.wilaya, daira: '' } };
      localStorage.setItem('user', JSON.stringify(u)); onSuccess(u);
    }
    setLoading(false);
  };
  return (
    <div className="max-w-xl mx-auto my-12 px-6"><div className="bg-white p-10 rounded-[3rem] shadow-2xl text-right">
      <button onClick={onBack} className="text-blue-600 font-bold mb-6 hover:underline">← رجوع</button>
      <h2 className="text-3xl font-black mb-8 text-blue-900">سجل كزبون جديد 👤</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="الاسم" className="p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
          <input required placeholder="اللقب" className="p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
        </div>
        <input required placeholder="رقم الهاتف" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        <select className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>{WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}</select>
        <input type="password" required placeholder="كلمة المرور" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
        <button disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black">تأكيد الحساب 🚀</button>
      </form>
    </div></div>
  );
};

const RegistrationChoice: React.FC<{ onChoice: (role: UserRole) => void }> = ({ onChoice }) => (
  <div className="max-w-4xl mx-auto my-20 px-4 text-center animate-in zoom-in duration-500">
    <h2 className="text-4xl font-black mb-12">كيف تريد الانضمام إلينا؟ ✨</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div onClick={() => onChoice(UserRole.WORKER)} className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-transparent hover:border-emerald-500 cursor-pointer transition-all">
        <div className="text-6xl mb-6">🛠️</div><h3 className="text-2xl font-black mb-4">أنا حرفي محترف</h3><p className="text-gray-500">أريد عرض خدماتي واستقبال عروض العمل.</p>
      </div>
      <div onClick={() => onChoice(UserRole.SEEKER)} className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-transparent hover:border-blue-500 cursor-pointer transition-all">
        <div className="text-6xl mb-6">🔍</div><h3 className="text-2xl font-black mb-4">أنا أبحث عن حرفي</h3><p className="text-gray-500">أريد طلب خدمات أو نشر مهمة عمل.</p>
      </div>
    </div>
  </div>
);

const AuthForm: React.FC<{ onSuccess: (u: User) => void }> = ({ onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { data, error } = await supabase.from('users').select('*').eq('phone', phone).eq('password', password).single();
    if (error) alert("بيانات الدخول خاطئة ❌");
    else if (data) {
      const u = { id: data.id, firstName: data.first_name, lastName: data.last_name, phone: data.phone, role: data.role as UserRole, location: { wilaya: data.wilaya, daira: data.daira }, categories: data.categories, bio: data.bio, avatar: data.avatar, portfolio: data.portfolio, rating: data.rating, ratingCount: data.rating_count };
      localStorage.setItem('user', JSON.stringify(u)); onSuccess(u);
    }
    setLoading(false);
  };
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md text-right">
        <h2 className="text-3xl font-black mb-8 border-r-4 border-emerald-500 pr-4">تسجيل الدخول 👋</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input required placeholder="رقم الهاتف" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={phone} onChange={e => setPhone(e.target.value)} />
          <input type="password" required placeholder="كلمة المرور" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={password} onChange={e => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg">دخول</button>
        </form>
      </div>
    </div>
  );
};

const ChatView: React.FC<{ currentUser: User, targetUser?: User | null }> = ({ currentUser, targetUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (targetUser) {
      const fetchMessages = async () => {
        const { data } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${currentUser.id})`).order('created_at', { ascending: true });
        setMessages(data || []);
      };
      fetchMessages();
      const sub = supabase.channel('chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => { setMessages(prev => [...prev, payload.new as Message]); }).subscribe();
      return () => { sub.unsubscribe(); };
    }
  }, [targetUser]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newMessage.trim() || !targetUser) return;
    await supabase.from('messages').insert([{ sender_id: currentUser.id, receiver_id: targetUser.id, content: newMessage.trim() }]);
    setNewMessage('');
  };
  return (
    <div className="max-w-4xl mx-auto my-4 md:my-10 h-[80vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border flex flex-col">
      <div className="p-6 border-b flex items-center justify-between flex-row-reverse bg-gray-50">
        {targetUser ? <div className="flex items-center gap-4 flex-row-reverse"><img src={`https://ui-avatars.com/api/?name=${targetUser.firstName}`} className="w-10 h-10 rounded-xl" /><div className="text-right font-black">{targetUser.firstName} {targetUser.lastName}</div></div> : <p>المحادثة</p>}
      </div>
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender_id === currentUser.id ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] p-4 text-sm font-medium ${m.sender_id === currentUser.id ? 'chat-bubble-me' : 'chat-bubble-them'}`}>{m.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={send} className="p-6 border-t bg-gray-50 flex gap-4">
        <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="اكتب رسالة..." className="flex-1 p-4 bg-white border-2 rounded-2xl outline-none" />
        <button type="submit" className="bg-emerald-600 text-white px-8 rounded-2xl font-black"><Send size={24} /></button>
      </form>
    </div>
  );
};
