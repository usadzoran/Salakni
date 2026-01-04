
import React, { useState, useEffect } from 'react';
import { UserRole, AppState, User, Advertisement, Task } from './types';
import { SERVICE_CATEGORIES, WILAYAS } from './constants';
import { supabase } from './lib/supabase';
import { 
  User as UserIcon, 
  LogOut, 
  Settings, 
  Phone, 
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
  BarChart3,
  Users as UsersIcon,
  RefreshCw,
  Circle,
  ToggleLeft as ToggleIcon,
  Info,
  Mail,
  Code2,
  Eye,
  MapPin,
  Award,
  ChevronLeft,
  Star,
  Zap,
  ShieldCheck
} from 'lucide-react';

// --- Global Styles ---

function GlobalStyles() {
  return (
    <style>{`
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .animate-in { animation: fadeIn 0.4s ease-out forwards; }
      .arabic-text { font-family: 'Tajawal', sans-serif; }
      .loading-spinner { border: 3px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 32px; height: 32px; animation: spin 0.8s linear infinite; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .ad-html-container img { max-width: 100%; height: auto; border-radius: 1.5rem; display: block; margin: 0 auto; }
      .admin-stat-card { background: white; border-radius: 2rem; padding: 1.5rem; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
      .emerald-gradient { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    `}</style>
  );
}

// --- Components ---

function Logo({ onClick, size = 'sm' }: { onClick?: () => void; size?: 'sm' | 'md' | 'lg' }) {
  const logoClasses = size === 'lg' ? 'w-16 h-16 rounded-3xl text-3xl' : size === 'md' ? 'w-12 h-12 rounded-2xl text-xl' : 'w-10 h-10 rounded-xl text-lg';
  const textClasses = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-lg';
  
  return (
    <div onClick={onClick} className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-all">
      <div className={`${logoClasses} bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg transition-all group-hover:rotate-6`}>S</div>
      <div className="flex flex-col items-start leading-none">
        <span className={`${textClasses} font-black text-slate-900 tracking-tighter`}>Salakni</span>
        <span className="text-[10px] font-black text-emerald-600 uppercase">dz platform</span>
      </div>
    </div>
  );
}

function NavButton({ children, active, onClick }: { children?: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`font-black text-sm transition-all px-2 py-1 relative ${active ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'}`}>
      {children}
      {active && <span className="absolute -bottom-2 left-0 right-0 h-1 bg-emerald-600 rounded-full animate-in"></span>}
    </button>
  );
}

function TabItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 transition-all ${active ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
      <div className={`p-2 rounded-xl ${active ? 'bg-emerald-50' : ''}`}><Icon size={22} /></div>
      <span className="text-[10px] font-black">{label}</span>
    </button>
  );
}

function AdPlacement({ position }: { position: string }) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  useEffect(() => {
    async function fetchAds() {
      const { data } = await supabase.from('advertisements').select('*').eq('is_active', true).contains('placements', [position]);
      if (data) setAds(data);
    }
    fetchAds();
  }, [position]);
  if (ads.length === 0) return null;
  return (
    <div className="my-6 animate-in space-y-4">
      {ads.map(ad => (
        <div key={ad.id} className="ad-html-container relative group overflow-hidden rounded-[2rem] shadow-sm border border-slate-100 bg-white p-2">
           <div className="text-[9px] font-black text-slate-300 mb-1 flex items-center gap-1 uppercase tracking-tighter mr-2"><Megaphone size={10} /> إعلان ممول</div>
           <div className="overflow-hidden" dangerouslySetInnerHTML={{ __html: ad.html_content }} />
        </div>
      ))}
    </div>
  );
}

// --- Views ---

function AboutUsView() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6 animate-in text-right">
      <div className="bg-white rounded-[3.5rem] p-10 md:p-16 shadow-2xl border border-slate-100">
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 tracking-tighter">
          من نحن؟ <span className="text-emerald-600">سلكني</span> يسلكها!
        </h2>
        <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-medium">
          <p>
            <span className="text-emerald-600 font-black">سلكني (Salakni)</span> هي المنصة الجزائرية الأولى التي تهدف إلى عصرنة قطاع الخدمات المنزلية والمهنية. نحن نؤمن بأن الحرفي الجزائري يمتلك مهارات ذهبية، لكنه يحتاج إلى الوسيلة الصحيحة للوصول إلى جمهوره.
          </p>
          <p>
            مهمتنا هي تبسيط حياة المواطنين عبر توفير قاعدة بيانات موثوقة تضم أفضل الحرفيين في 58 ولاية، مع نظام تقييم شفاف يضمن جودة الخدمة وأمان التعامل.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <ShieldCheck className="text-emerald-600 mb-4" size={32}/>
              <h4 className="font-black text-slate-900 mb-2">ثقة وأمان</h4>
              <p className="text-sm">نحرص على التحقق من هوية الحرفيين لضمان أقصى درجات الأمان.</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <Zap className="text-emerald-600 mb-4" size={32}/>
              <h4 className="font-black text-slate-900 mb-2">سرعة قصوى</h4>
              <p className="text-sm">بلمسة زر واحدة، ستجد أقرب حرفي متاح في منطقتك.</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <Star className="text-emerald-600 mb-4" size={32}/>
              <h4 className="font-black text-slate-900 mb-2">جودة مضمونة</h4>
              <p className="text-sm">نعتمد على تقييمات الزبائن الحقيقية لاختيار النخبة فقط.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPanelView() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tasks' | 'ads'>('overview');
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, workers: 0, tasks: 0, ads: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdForm, setShowAdForm] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const { data: u } = await supabase.from('users').select('*');
      const { data: t } = await supabase.from('tasks').select('*');
      const { data: a } = await supabase.from('advertisements').select('*');
      const usersList = (u || []);
      const tasksList = (t || []);
      const adsList = (a || []);
      setStats({
        users: usersList.length,
        workers: usersList.filter((x:any) => x.role === 'WORKER').length,
        tasks: tasksList.length,
        ads: adsList.length
      });
      if (activeTab === 'users') setData(usersList);
      else if (activeTab === 'tasks') setData(tasksList);
      else if (activeTab === 'ads') setData(adsList);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { refresh(); }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 animate-in">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3"><Shield className="text-emerald-600" /> بوابة المسؤول</h2>
        <div className="flex gap-2">
          {activeTab === 'ads' && (
            <button onClick={() => setShowAdForm(true)} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg hover:bg-emerald-500 transition-all">
              <Plus size={18} /> إضافة إعلان HTML
            </button>
          )}
          <button onClick={refresh} className="bg-white border border-slate-100 p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 transition-all"><RefreshCw size={20}/></button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div className="admin-stat-card border-t-4 border-emerald-500">
          <UsersIcon className="text-emerald-500 mb-3" size={24}/>
          <p className="text-[10px] font-black text-slate-400 uppercase">المستخدمين</p>
          <h4 className="text-2xl font-black">{stats.users}</h4>
        </div>
        <div className="admin-stat-card border-t-4 border-blue-500">
          <Briefcase className="text-blue-500 mb-3" size={24}/>
          <p className="text-[10px] font-black text-slate-400 uppercase">الحرفيين</p>
          <h4 className="text-2xl font-black">{stats.workers}</h4>
        </div>
        <div className="admin-stat-card border-t-4 border-orange-500">
          <ClipboardList className="text-orange-500 mb-3" size={24}/>
          <p className="text-[10px] font-black text-slate-400 uppercase">المهام</p>
          <h4 className="text-2xl font-black">{stats.tasks}</h4>
        </div>
        <div className="admin-stat-card border-t-4 border-purple-500">
          <Megaphone className="text-purple-500 mb-3" size={24}/>
          <p className="text-[10px] font-black text-slate-400 uppercase">الإعلانات</p>
          <h4 className="text-2xl font-black">{stats.ads}</h4>
        </div>
      </div>

      <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-100 w-fit shadow-sm overflow-x-auto max-w-full no-scrollbar">
        <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>نظرة عامة</button>
        <button onClick={() => setActiveTab('users')} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>إدارة المستخدمين</button>
        <button onClick={() => setActiveTab('tasks')} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap ${activeTab === 'tasks' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>إدارة المهام</button>
        <button onClick={() => setActiveTab('ads')} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap ${activeTab === 'ads' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>إدارة الإعلانات</button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="loading-spinner"></div></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-6 animate-in">
          {activeTab === 'users' && (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                    <th className="pb-4 pr-2">المستخدم</th>
                    <th className="pb-4">الهاتف</th>
                    <th className="pb-4">النوع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 pr-2 flex items-center gap-3 font-bold text-slate-700">
                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.first_name}`} className="w-8 h-8 rounded-lg" />
                        {u.first_name} {u.last_name}
                      </td>
                      <td className="py-4 font-black text-xs text-slate-500">{u.phone}</td>
                      <td className="py-4"><span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black">{u.role}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'ads' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.map(ad => (
                <div key={ad.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group relative">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-black text-slate-800 text-sm">{ad.title}</h4>
                    <div className="flex gap-1">
                       <button onClick={async () => { await supabase.from('advertisements').update({ is_active: !ad.is_active }).eq('id', ad.id); refresh(); }} className={`p-1.5 rounded-lg transition-all ${ad.is_active ? 'text-emerald-600 bg-emerald-100' : 'text-slate-300 bg-white'}`}><ToggleIcon size={16}/></button>
                       <button onClick={async () => { if(confirm('حذف؟')) { await supabase.from('advertisements').delete().eq('id', ad.id); refresh(); } }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl text-[8px] font-mono text-emerald-400/60 overflow-hidden h-16 relative">{ad.html_content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {showAdForm && <AdminAdForm onClose={() => setShowAdForm(false)} onSave={() => { setShowAdForm(false); refresh(); }} />}
    </div>
  );
}

function AdminAdForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({ title: '', html_content: '', placements: [] as string[] });
  const [loading, setLoading] = useState(false);
  const togglePlacement = (id: string) => setFormData(prev => ({ ...prev, placements: prev.placements.includes(id) ? prev.placements.filter(p => p !== id) : [...prev.placements, id] }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('advertisements').insert([{ title: formData.title, html_content: formData.html_content, placements: formData.placements, is_active: true }]);
    if (error) alert(error.message); else onSave();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in text-right">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 relative overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-6 left-6 p-2 text-slate-400 hover:bg-slate-50 rounded-xl"><X size={20}/></button>
        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2 flex-row-reverse"><Code2 className="text-emerald-600" /> إضافة إعلان HTML مخصص</h3>
        <form onSubmit={handleSave} className="space-y-6">
          <input required placeholder="عنوان الإعلان" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          <textarea required rows={6} className="w-full p-4 bg-slate-900 text-emerald-400 rounded-2xl border-none font-mono text-sm" value={formData.html_content} onChange={e => setFormData({...formData, html_content: e.target.value})} placeholder="<img src='...' />" />
          <div className="grid grid-cols-2 gap-2">
            {['landing_top', 'search_sidebar', 'market_banner', 'profile_bottom'].map(p => (
              <button key={p} type="button" onClick={() => togglePlacement(p)} className={`p-3 rounded-xl border-2 transition-all font-black text-xs ${formData.placements.includes(p) ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-transparent text-slate-400'}`}>{p}</button>
            ))}
          </div>
          <button disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-500 transition-all">{loading ? 'جاري الحفظ...' : 'نشر الإعلان الآن'}</button>
        </form>
      </div>
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
  const updateCurrentUser = (u: User | null) => { setState(prev => ({ ...prev, currentUser: u })); if (u) localStorage.setItem('user', JSON.stringify(u)); else localStorage.removeItem('user'); };

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-24 md:pb-0" dir="rtl">
      <GlobalStyles />
      <nav className="sticky top-0 z-50 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} size="md" />
          <div className="hidden md:flex items-center gap-8">
            <NavButton active={state.view === 'search'} onClick={() => setView('search')}>تصفح الحرفيين</NavButton>
            <NavButton active={state.view === 'support'} onClick={() => setView('support')}>سوق المهام</NavButton>
            {state.currentUser?.role === UserRole.ADMIN && (
              <button onClick={() => setView('admin-panel')} className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${state.view === 'admin-panel' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}><Shield size={16}/> بوابة المسؤول</button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer p-1 pr-4 bg-slate-100 rounded-full border border-slate-200 hover:border-emerald-200 transition-all">
                <span className="font-black text-xs hidden sm:block">{state.currentUser.firstName}</span>
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
              </div>
            ) : (
              <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all">دخول</button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && (
          <div className="animate-in">
            <div className="relative min-h-[85vh] flex items-center justify-center text-center px-6 overflow-hidden text-white">
              <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
              <div className="relative z-10 max-w-4xl">
                <h1 className="text-4xl md:text-8xl font-black mb-8 leading-tight tracking-tighter">ريح بالك، <span className="text-emerald-400 italic">سَلّكني</span> يسلكها!</h1>
                <p className="text-xl md:text-3xl text-slate-300 mb-12 font-medium max-w-2xl mx-auto">أول منصة جزائرية تربطك بأفضل المهرة في منطقتك بضغطة زر واحدة.</p>
                <button onClick={() => setView('search')} className="bg-emerald-600 px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-emerald-500 transition-all active:scale-95">اطلب خدمة الآن 🔍</button>
              </div>
            </div>
          </div>
        )}
        {state.view === 'admin-panel' && <AdminPanelView />}
        {state.view === 'about' && <AboutUsView />}
        {/* views stubs below for clarity */}
        {state.view === 'search' && <div className="py-20 text-center font-black text-3xl">صفحة البحث قريباً...</div>}
        {state.view === 'support' && <div className="py-20 text-center font-black text-3xl">سوق المهام قريباً...</div>}
      </main>

      <footer className="bg-white border-t border-slate-100 pt-16 pb-32 md:pb-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2 space-y-6">
            <Logo size="md" onClick={() => setView('landing')} />
            <p className="text-slate-500 leading-relaxed font-bold text-sm text-justify">سلكني هي بوابتك الجزائرية للخدمات الاحترافية. نحن نربط الحرفيين بالزبائن لضمان جودة الحياة في كل بيت جزائري.</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-slate-900">روابط مهمة</h4>
            <ul className="space-y-2">
              <li><button onClick={() => setView('about')} className="text-slate-500 hover:text-emerald-600 font-bold transition-all flex items-center gap-2"><Info size={16}/> من نحن؟</button></li>
              <li><button onClick={() => setView('search')} className="text-slate-500 hover:text-emerald-600 font-bold transition-all flex items-center gap-2"><SearchIcon size={16}/> تصفح الحرفيين</button></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-black text-slate-900">تواصل معنا</h4>
            <ul className="space-y-2 text-slate-500 font-bold">
              <li className="flex items-center gap-2"><Mail size={16} className="text-emerald-600"/> contact@salakni.dz</li>
              <li className="flex items-center gap-2"><Phone size={16} className="text-emerald-600"/> +213 777 11 76 63</li>
            </ul>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around md:hidden z-50">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={SearchIcon} label="البحث" active={state.view === 'search'} onClick={() => setView('search')} />
        <TabItem icon={ClipboardList} label="المهام" active={state.view === 'support'} onClick={() => setView('support')} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile' || state.view === 'admin-panel'} onClick={() => setView(state.currentUser ? (state.currentUser.role === UserRole.ADMIN ? 'admin-panel' : 'profile') : 'login')} />
      </div>
    </div>
  );
}
