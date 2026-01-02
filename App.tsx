
/* 
تنبيه هام - إعداد قاعدة البيانات (Supabase SQL Editor):
يرجى إضافة جدول المهام لضمان عمل النظام:

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  wilaya text NOT NULL,
  daira text,
  budget text,
  status text DEFAULT 'open', -- 'open', 'closed'
  created_at timestamp with time zone DEFAULT now()
);

-- سياسات الأمان للمهام
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Seekers can insert tasks" ON tasks FOR INSERT WITH CHECK (true);
*/

import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, Message, Notification, Advertisement, SupportRequest, Worker } from './types.ts';
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
  RefreshCcw
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
    @media (max-width: 640px) {
      .hero-title { font-size: 2.5rem !important; line-height: 1.2 !important; }
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
      // استخدام alias لربط seeker_id بجدول المستخدمين بشكل صريح
      const { data, error: dbError } = await supabase
        .from('tasks')
        .select(`
          *,
          users:seeker_id (
            first_name,
            last_name,
            avatar
          )
        `)
        .order('created_at', { ascending: false });
      
      if (dbError) throw dbError;

      const mappedTasks = (data || []).map(t => ({
        ...t,
        seeker_name: t.users ? `${t.users.first_name} ${t.users.last_name}` : 'زبون سلكني',
        seeker_avatar: t.users?.avatar
      }));
      setTasks(mappedTasks);
    } catch (e: any) {
      console.error("Tasks error details:", e);
      setError(e.message || "حدث خطأ أثناء تحميل المهام. تأكد من إعداد جدول tasks في Supabase.");
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
      if (searchFilters.category) query = query.eq('category', searchFilters.category);
      if (searchFilters.query) query = query.or(`first_name.ilike.%${searchFilters.query}%,last_name.ilike.%${searchFilters.query}%,bio.ilike.%${searchFilters.query}%`);

      const { data, error: dbError } = await query;
      if (dbError) throw dbError;
      
      const mappedWorkers: Worker[] = (data || []).map(d => ({
        id: d.id, firstName: d.first_name, lastName: d.last_name, phone: d.phone, role: UserRole.WORKER,
        location: { wilaya: d.wilaya, daira: d.daira }, avatar: d.avatar, bio: d.bio, category: d.category,
        isVerified: d.is_verified, rating: Number(d.rating) || 0, completedJobs: d.completed_jobs || 0, skills: d.skills || []
      }));
      setState(prev => ({ ...prev, workers: mappedWorkers }));
    } catch (e: any) { 
      console.error("Workers error details:", e);
      setError(e.message || "حدث خطأ أثناء البحث عن الحرفيين.");
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
            tasks={tasks} 
            loading={loading} 
            error={error}
            currentUser={state.currentUser} 
            onRefresh={fetchTasks}
            onPostTask={() => { if(!state.currentUser) setView('login'); }}
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
        {state.view === 'profile' && state.currentUser && <ProfileView user={state.currentUser} onLogout={handleLogout} />}
        {state.view === 'search' && <SearchWorkersView loading={loading} error={error} workers={state.workers} filters={searchFilters} onFilterChange={setSearchFilters} onContact={(w) => { setChatTarget(w); setView('messages'); }} />}
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

const TasksMarketView: React.FC<{ 
  tasks: Task[], 
  loading: boolean, 
  error: string | null,
  currentUser: User | null, 
  onRefresh: () => void,
  onPostTask: () => void,
  onContact: (id: string, name: string) => void
}> = ({ tasks, loading, error, currentUser, onRefresh, onPostTask, onContact }) => {
  const [showForm, setShowForm] = useState(false);
  const [taskData, setTaskData] = useState({ title: '', description: '', category: SERVICE_CATEGORIES[0].name, wilaya: WILAYAS[0], budget: '' });

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return onPostTask();
    const { error } = await supabase.from('tasks').insert([{
      seeker_id: currentUser.id,
      ...taskData
    }]);
    if (error) alert(error.message);
    else {
      setShowForm(false);
      onRefresh();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
      <div className="flex justify-between items-center mb-12 flex-row-reverse">
        <div>
           <h2 className="text-3xl md:text-5xl font-black text-slate-900">سوق المهام ⚒️</h2>
           <p className="text-slate-500 font-bold mt-2">طلبات عمل من زبائن حقيقيين في الجزائر</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-emerald-500 transition-all">
          {showForm ? 'إلغاء' : 'نشر طلب عمل +'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-emerald-100 mb-12 animate-in slide-in-from-top duration-500 text-right">
           <h3 className="text-2xl font-black mb-6">ما الذي تحتاجه اليوم؟ ✨</h3>
           <form onSubmit={handlePost} className="space-y-6">
              <input required placeholder="عنوان الطلب (مثلاً: تصليح سخان ماء)" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} />
              <textarea required placeholder="صف المشكلة أو الخدمة المطلوبة بالتفصيل..." className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium h-32" value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" value={taskData.category} onChange={e => setTaskData({...taskData, category: e.target.value})}>
                  {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
                <select className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" value={taskData.wilaya} onChange={e => setTaskData({...taskData, wilaya: e.target.value})}>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <input placeholder="الميزانية التقريبية (اختياري)" className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" value={taskData.budget} onChange={e => setTaskData({...taskData, budget: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg">نشر الآن ✅</button>
           </form>
        </div>
      )}

      {error ? (
        <div className="bg-red-50 border-2 border-red-100 p-12 rounded-[3rem] text-center">
           <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
           <p className="text-xl font-black text-red-700 mb-6">{error}</p>
           <button onClick={onRefresh} className="flex items-center gap-2 mx-auto bg-red-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-red-700 transition-colors">
             إعادة المحاولة <RefreshCcw size={20} />
           </button>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20"><div className="loading-spinner"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tasks.map(t => (
            <div key={t.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50 task-card flex flex-col text-right">
              <div className="flex justify-between items-start mb-4 flex-row-reverse">
                <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-black">{t.category}</span>
                <span className="text-gray-400 text-xs flex items-center gap-1"><Clock size={14} /> {new Date(t.created_at).toLocaleDateString('ar-DZ')}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-4">{t.title}</h3>
              <p className="text-gray-500 mb-6 flex-grow leading-relaxed">{t.description}</p>
              <div className="flex flex-wrap gap-4 mb-8 flex-row-reverse">
                 <div className="flex items-center gap-2 text-slate-600 font-bold bg-gray-50 px-3 py-2 rounded-xl text-sm"><MapPin size={16} /> {t.wilaya}</div>
                 {t.budget && <div className="flex items-center gap-2 text-yellow-600 font-black bg-yellow-50 px-3 py-2 rounded-xl text-sm"><DollarSign size={16} /> {t.budget} دج</div>}
              </div>
              <div className="pt-6 border-t border-gray-100 flex items-center justify-between flex-row-reverse">
                 <div className="flex items-center gap-3 flex-row-reverse">
                   <img src={t.seeker_avatar || `https://ui-avatars.com/api/?name=${t.seeker_name}&background=random`} className="w-10 h-10 rounded-full object-cover" />
                   <span className="font-bold text-slate-800">{t.seeker_name}</span>
                 </div>
                 {currentUser?.role === UserRole.WORKER && currentUser.id !== t.seeker_id && (
                    <button onClick={() => onContact(t.seeker_id, t.seeker_name || 'صاحب المهمة')} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-colors">
                      اتفاق <Send size={16} />
                    </button>
                 )}
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-50">
               <ClipboardList size={64} className="mx-auto mb-4" />
               <p className="text-2xl font-black">لا توجد مهام منشورة حالياً</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SearchWorkersView: React.FC<{ loading: boolean, error: string | null, workers: Worker[], filters: any, onFilterChange: (f: any) => void, onContact: (w: Worker) => void }> = ({ loading, error, workers, filters, onFilterChange, onContact }) => (
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
    
    {error ? (
      <div className="text-center py-20">
         <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
         <p className="text-xl font-bold text-red-600">{error}</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading ? <div className="col-span-full py-20 flex justify-center"><div className="loading-spinner"></div></div> : workers.map(w => (
          <div key={w.id} className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-50 hover:shadow-2xl transition-all text-right group animate-in slide-in-from-bottom-5">
              <div className="flex gap-4 items-center mb-6 flex-row-reverse">
                <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-20 h-20 rounded-3xl object-cover" />
                <div className="flex-1">
                    <h3 className="font-black text-xl">{w.firstName} {w.lastName}</h3>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1 rounded-full">{w.category}</span>
                      {w.isVerified && <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-black">موثق ✓</span>}
                    </div>
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10">{w.bio || 'حرفي متميز يهدف لتقديم أفضل الخدمات.'}</p>
              <div className="flex justify-between items-center mb-6 flex-row-reverse">
                <span className="text-slate-400 text-xs font-bold">📍 {w.location.wilaya}</span>
                <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">⭐ 4.5</div>
              </div>
              <button onClick={() => onContact(w)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black group-hover:bg-emerald-600 transition-colors">تواصل الآن</button>
          </div>
        ))}
        {!loading && workers.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-50">
              <p className="text-2xl font-black">لا يوجد حرفيين مطابقين لخيارات البحث</p>
          </div>
        )}
      </div>
    )}
  </div>
);

// --- بقية النماذج ---

const WorkerRegistrationForm: React.FC<{ onSuccess: (u: User) => void, onBack: () => void }> = ({ onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', password: '', wilaya: WILAYAS[0], daira: '', category: SERVICE_CATEGORIES[0].name, bio: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('users').insert([{ ...formData, first_name: formData.firstName, last_name: formData.lastName, role: UserRole.WORKER }]).select().single();
    if (error) alert(error.message);
    else if (data) {
      const u = { id: data.id, firstName: data.first_name, lastName: data.last_name, phone: data.phone, role: data.role as UserRole, location: { wilaya: data.wilaya, daira: data.daira }, category: data.category };
      localStorage.setItem('user', JSON.stringify(u));
      onSuccess(u);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto my-12 px-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-right">
        <button onClick={onBack} className="text-emerald-600 font-bold mb-6 hover:underline">← رجوع</button>
        <h2 className="text-3xl font-black mb-8">انضم كحرفي محترف ⚒️</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="الاسم" className="p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            <input required placeholder="اللقب" className="p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <input required placeholder="رقم الهاتف" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <select className="p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <select className="p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <input type="password" required placeholder="كلمة المرور" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <button disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-lg">تأكيد التسجيل ✅</button>
        </form>
      </div>
    </div>
  );
};

const SeekerRegistrationForm: React.FC<{ onSuccess: (u: User) => void, onBack: () => void }> = ({ onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', password: '', wilaya: WILAYAS[0] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('users').insert([{ ...formData, first_name: formData.firstName, last_name: formData.lastName, role: UserRole.SEEKER }]).select().single();
    if (error) alert(error.message);
    else if (data) {
      const u = { id: data.id, firstName: data.first_name, lastName: data.last_name, phone: data.phone, role: data.role as UserRole, location: { wilaya: data.wilaya, daira: '' } };
      localStorage.setItem('user', JSON.stringify(u));
      onSuccess(u);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto my-12 px-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-right">
        <button onClick={onBack} className="text-blue-600 font-bold mb-6 hover:underline">← رجوع</button>
        <h2 className="text-3xl font-black mb-8 text-blue-900">سجل كزبون جديد 👤</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="الاسم" className="p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            <input required placeholder="اللقب" className="p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <input required placeholder="رقم الهاتف" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <select className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <input type="password" required placeholder="كلمة المرور" className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <button disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-lg">تأكيد الحساب 🚀</button>
        </form>
      </div>
    </div>
  );
};

const RegistrationChoice: React.FC<{ onChoice: (role: UserRole) => void }> = ({ onChoice }) => (
  <div className="max-w-4xl mx-auto my-20 px-4 text-center">
    <h2 className="text-4xl font-black mb-12">كيف تريد الانضمام إلينا؟ ✨</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div onClick={() => onChoice(UserRole.WORKER)} className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-transparent hover:border-emerald-500 cursor-pointer transition-all">
        <div className="text-6xl mb-6">🛠️</div>
        <h3 className="text-2xl font-black mb-4">أنا حرفي محترف</h3>
        <p className="text-gray-500">أريد عرض خدماتي واستقبال عروض العمل.</p>
      </div>
      <div onClick={() => onChoice(UserRole.SEEKER)} className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-transparent hover:border-blue-500 cursor-pointer transition-all">
        <div className="text-6xl mb-6">🔍</div>
        <h3 className="text-2xl font-black mb-4">أنا أبحث عن حرفي</h3>
        <p className="text-gray-500">أريد طلب خدمات أو نشر مهمة عمل.</p>
      </div>
    </div>
  </div>
);

const AuthForm: React.FC<{ onSuccess: (u: User) => void }> = ({ onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from('users').select('*').eq('phone', phone).eq('password', password).single();
    if (error) alert("بيانات الدخول خاطئة ❌");
    else if (data) {
      const u = { id: data.id, firstName: data.first_name, lastName: data.last_name, phone: data.phone, role: data.role as UserRole, location: { wilaya: data.wilaya, daira: data.daira }, category: data.category };
      localStorage.setItem('user', JSON.stringify(u));
      onSuccess(u);
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

const ProfileView: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => (
  <div className="max-w-4xl mx-auto my-12 px-4 text-center animate-in fade-in duration-700">
    <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
      <div className="h-40 bg-gradient-to-r from-emerald-600 to-blue-500"></div>
      <div className="px-12 pb-12 relative -mt-20">
        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&background=10b981&color=fff`} className="w-40 h-40 rounded-[3rem] border-8 border-white shadow-2xl mx-auto object-cover" />
        <h2 className="text-3xl font-black mt-6 text-slate-900">{user.firstName} {user.lastName}</h2>
        <p className="text-emerald-600 font-black mt-2 text-xl">{user.role === UserRole.WORKER ? `حرفي (${user.category})` : 'زبون مميز'}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2"><Settings size={20} /> تعديل الملف</button>
          <button onClick={onLogout} className="bg-red-50 text-red-500 px-10 py-4 rounded-2xl font-black border border-red-100"><LogOut size={20} className="inline ml-2" /> خروج</button>
        </div>
      </div>
    </div>
  </div>
);

const ChatView: React.FC<{ currentUser: User, targetUser?: User | null }> = ({ currentUser, targetUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (targetUser) {
      const fetchMessages = async () => {
        const { data } = await supabase.from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${currentUser.id})`)
          .order('created_at', { ascending: true });
        setMessages(data || []);
      };
      fetchMessages();
      const sub = supabase.channel('chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [...prev, payload.new as Message]);
      }).subscribe();
      return () => { sub.unsubscribe(); };
    }
  }, [targetUser]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !targetUser) return;
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
