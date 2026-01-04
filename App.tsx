
import React, { useState, useEffect } from 'react';
import { UserRole, AppState, User, Advertisement, Task, TaskStatus } from './types';
import { SERVICE_CATEGORIES, WILAYAS } from './constants';
import { supabase } from './lib/supabase';
import { 
  User as UserIcon, 
  Settings, 
  Home,
  Plus,
  Trash2,
  X,
  Briefcase,
  CheckCircle2,
  Shield,
  Search as SearchIcon,
  ClipboardList,
  Megaphone,
  Users as UsersIcon,
  RefreshCw,
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
  LogOut
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
      .glass-card { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
      .loading-spinner { border: 3px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 0.8s linear infinite; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `}</style>
  );
}

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

// Fix: Setting children to optional in the prop type definition to satisfy specific TS checks while maintaining usage
function NavButton({ children, active, onClick }: { children?: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`font-black text-sm transition-all relative ${active ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'}`}>
      {children}
      {active && <span className="absolute -bottom-2 left-0 right-0 h-1 bg-emerald-600 rounded-full"></span>}
    </button>
  );
}

function TabItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
      <Icon size={24} />
      <span className="text-[10px] font-black">{label}</span>
    </button>
  );
}

// --- Specific Views ---

function SearchWorkersView() {
  const [filters, setFilters] = useState({ query: '', wilaya: '', category: '' });
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      let query = supabase.from('users').select('*').eq('role', 'WORKER');
      if (filters.wilaya) query = query.eq('wilaya', filters.wilaya);
      if (filters.category) query = query.contains('categories', [filters.category]);
      if (filters.query) query = query.or(`first_name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`);
      const { data } = await query;
      if (data) setWorkers(data.map(u => ({ ...u, firstName: u.first_name, lastName: u.last_name, location: { wilaya: u.wilaya, daira: '' }, verificationStatus: u.verification_status })));
      setLoading(false);
    };
    fetchWorkers();
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 animate-fade-in">
      <SectionHeading title="اكتشف المحترفين" subtitle="تصفح قائمة الحرفيين الموثقين في ولايتك وتواصل معهم مباشرة." />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 sticky top-28">
            <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Filter size={18} className="text-emerald-600" /> أدوات البحث</h4>
            <div className="space-y-4">
              <input placeholder="ابحث بالاسم أو المهنة..." className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20" value={filters.query} onChange={e => setFilters({...filters, query: e.target.value})} />
              <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" value={filters.wilaya} onChange={e => setFilters({...filters, wilaya: e.target.value})}>
                <option value="">كل الولايات</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
                <option value="">كل التخصصات</option>
                {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <button onClick={() => setFilters({query:'', wilaya:'', category:''})} className="w-full py-3 text-emerald-600 font-black text-xs hover:bg-emerald-50 rounded-xl transition-all">إعادة ضبط</button>
            </div>
          </div>
        </aside>
        <div className="lg:col-span-3">
          {loading ? (
            <div className="py-20 flex justify-center"><div className="loading-spinner"></div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workers.map(w => (
                <div key={w.id} className="bg-white p-6 rounded-[2.5rem] shadow-md border border-slate-100 hover:shadow-xl transition-all group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-50 shadow-sm" />
                      {w.verificationStatus === 'verified' && <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white"><CheckCircle2 size={12}/></div>}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{w.firstName} {w.lastName}</h3>
                      <div className="flex items-center gap-1 text-yellow-500"><Star size={14} fill="currentColor"/><span className="text-xs font-black text-slate-400 mr-1">5.0 (12)</span></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {w.categories.map(c => <span key={c} className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black">{c}</span>)}
                  </div>
                  <p className="text-slate-500 text-xs font-medium line-clamp-2 mb-6">{w.bio || 'حرفي محترف في خدمتك.'}</p>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                    <span className="text-[10px] font-black text-slate-400 flex items-center gap-1"><MapPin size={12}/> {w.location.wilaya}</span>
                    <button className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-[10px] hover:bg-emerald-600 transition-all">الملف الكامل</button>
                  </div>
                </div>
              ))}
              {workers.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-black">لا توجد نتائج مطابقة لبحثك</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TasksMarketView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data.map(t => ({ ...t, seeker_name: t.seeker_name || 'صاحب المهمة' })));
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 animate-fade-in">
      <div className="flex justify-between items-end mb-10">
        <SectionHeading title="سوق المهام المفتوحة" subtitle="تصفح الطلبات الحالية أو أضف مهمتك ليقوم الحرفيون بالتقديم عليها." />
        <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 transition-all mb-6">
          <Plus size={18} /> اطلب مهمة
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="loading-spinner"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map(task => (
            <div key={task.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black">{task.category}</span>
                <span className="text-emerald-600 font-black text-lg flex items-center gap-1"><Banknote size={16}/> {task.budget} دج</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">{task.title}</h3>
              <p className="text-slate-500 text-sm font-medium mb-6 line-clamp-3">{task.description}</p>
              <div className="flex flex-col gap-3 pt-6 border-t border-slate-50">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1"><MapPin size={14} className="text-emerald-500" /> {task.wilaya}</span>
                  <span className="flex items-center gap-1"><Clock size={14} className="text-emerald-500" /> منذ ساعة</span>
                </div>
                <button className="w-full bg-slate-50 text-slate-800 py-3 rounded-xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-all">تفاصيل المهمة</button>
              </div>
            </div>
          ))}
          {tasks.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-black">لا توجد مهام متاحة حالياً</div>}
        </div>
      )}
      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} onSaved={() => { setShowAddModal(false); fetchTasks(); }} />}
    </div>
  );
}

function AddTaskModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [formData, setFormData] = useState({ title: '', description: '', budget: '', category: '', wilaya: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('tasks').insert([{
      title: formData.title,
      description: formData.description,
      budget: Number(formData.budget),
      category: formData.category,
      wilaya: formData.wilaya,
      status: 'open'
    }]);
    if (error) alert(error.message); else onSaved();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-right">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-8 relative">
        <button onClick={onClose} className="absolute top-6 left-6 p-2 text-slate-400 hover:bg-slate-50 rounded-xl"><X size={20}/></button>
        <h3 className="text-2xl font-black text-slate-900 mb-6">اطلب مهمة جديدة</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="عنوان المهمة (مثلاً: تصليح تسرب مياه)" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          <textarea required rows={4} placeholder="وصف تفصيلي لما تحتاجه..." className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
             <input required type="number" placeholder="الميزانية المقترحة (دج)" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
             <select required className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                <option value="">اختر الولاية</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
             </select>
          </div>
          <select required className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
             <option value="">اختر التخصص</option>
             {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <button disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 transition-all">{loading ? 'جاري النشر...' : 'نشر المهمة الآن'}</button>
        </form>
      </div>
    </div>
  );
}

// --- Landing Page View ---

function LandingView({ onStart, onRegister }: { onStart: () => void; onRegister: () => void }) {
  return (
    <div className="animate-fade-in">
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-slate-950 bg-[url('https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2000')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
        <div className="relative z-10 max-w-4xl text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black mb-8 border border-white/10">
            <Trophy size={14} className="text-yellow-400"/> المنصة الأولى للخدمات في الجزائر
          </div>
          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tighter">ريح بالك، <span className="text-emerald-400 italic">سَلّكني</span> يسلكها!</h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 font-medium max-w-2xl mx-auto">أفضل الحرفيين المهرة في ولايتك بين يديك. جودة، ثقة، وسرعة في التنفيذ.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
             <button onClick={onStart} className="bg-emerald-600 px-10 py-5 rounded-2xl font-black text-xl shadow-2xl hover:bg-emerald-500 transition-all active:scale-95">اطلب خدمة الآن 🔍</button>
             <button onClick={onRegister} className="bg-white/10 backdrop-blur-md px-10 py-5 rounded-2xl font-black text-xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">انضم كحرفي 🛠️</button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading title="لماذا يثق بنا آلاف الجزائريين؟" centered />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: 'حرفيون موثقون', desc: 'نتحقق من هوية وأعمال كل حرفي لضمان راحتك وأمانك.', icon: ShieldCheck },
              { title: 'سهولة الاستخدام', desc: 'بلمسة زر واحدة، ستجد أقرب حرفي متاح في منطقتك.', icon: Zap },
              { title: 'تقييمات حقيقية', desc: 'نظام تقييم شفاف يعتمد على تجارب الزبائن السابقة حصراً.', icon: Star }
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 text-center hover:bg-emerald-50 transition-all group">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-6 group-hover:scale-110 transition-transform"><item.icon size={32}/></div>
                <h4 className="text-xl font-black text-slate-900 mb-4">{item.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { currentUser: saved ? JSON.parse(saved) : null, workers: [], view: 'landing' };
  });

  const setView = (view: AppState['view']) => { setState(prev => ({ ...prev, view })); window.scrollTo(0, 0); };
  const updateCurrentUser = (u: User | null) => { 
    setState(prev => ({ ...prev, currentUser: u })); 
    if (u) localStorage.setItem('user', JSON.stringify(u)); 
    else localStorage.removeItem('user'); 
  };

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-24 md:pb-0" dir="rtl">
      <GlobalStyles />
      <nav className="sticky top-0 z-50 h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} size="md" />
          <div className="hidden md:flex items-center gap-10">
            <NavButton active={state.view === 'landing'} onClick={() => setView('landing')}>الرئيسية</NavButton>
            <NavButton active={state.view === 'search'} onClick={() => setView('search')}>البحث عن حرفيين</NavButton>
            <NavButton active={state.view === 'support'} onClick={() => setView('support')}>سوق المهام</NavButton>
          </div>
          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer p-1 pr-4 bg-white rounded-full border border-slate-200 hover:border-emerald-200 transition-all">
                <span className="font-black text-xs hidden sm:block">{state.currentUser.firstName}</span>
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-12 h-12 rounded-full object-cover border-2 border-white" />
              </div>
            ) : (
              <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">دخول</button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onStart={() => setView('search')} onRegister={() => setView('register')} />}
        {state.view === 'search' && <SearchWorkersView />}
        {state.view === 'support' && <TasksMarketView />}
        {state.view === 'profile' && (
          <div className="max-w-2xl mx-auto py-20 px-6 text-center animate-fade-in">
             <img src={state.currentUser?.avatar || `https://ui-avatars.com/api/?name=${state.currentUser?.firstName}`} className="w-32 h-32 rounded-[2.5rem] border-4 border-emerald-500 mx-auto mb-6 shadow-xl" />
             <h2 className="text-3xl font-black mb-2">{state.currentUser?.firstName} {state.currentUser?.lastName}</h2>
             <p className="text-slate-500 font-bold mb-10">مستخدم سلكني</p>
             {/* Fix: Using LogOut which is now correctly imported */}
             <button onClick={() => updateCurrentUser(null)} className="bg-red-50 text-red-500 px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 mx-auto"><LogOut size={18}/> تسجيل الخروج</button>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 pt-16 pb-32 md:pb-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2 space-y-6">
            <Logo size="md" onClick={() => setView('landing')} />
            <p className="text-slate-500 leading-relaxed font-bold text-sm max-w-sm">سلكني هي بوابتك الجزائرية للوصول إلى أمهر الحرفيين. نهدف إلى خلق مجتمع مهني موثوق يدعم الاقتصاد المحلي.</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-slate-900">روابط سريعة</h4>
            <ul className="space-y-2">
              <li><button onClick={() => setView('search')} className="text-slate-500 hover:text-emerald-600 font-bold">تصفح الحرفيين</button></li>
              <li><button onClick={() => setView('support')} className="text-slate-500 hover:text-emerald-600 font-bold">سوق المهام</button></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-slate-900">تواصل</h4>
            <div className="space-y-2 text-slate-500 font-bold text-sm">
              <p>support@salakni.dz</p>
              <p>+213 777 11 76 63</p>
            </div>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around md:hidden z-50 px-4">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={SearchIcon} label="البحث" active={state.view === 'search'} onClick={() => setView('search')} />
        <TabItem icon={ClipboardList} label="المهام" active={state.view === 'support'} onClick={() => setView('support')} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile'} onClick={() => setView(state.currentUser ? 'profile' : 'login')} />
      </div>
    </div>
  );
}
