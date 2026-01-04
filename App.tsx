
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
  Award
} from 'lucide-react';

// --- Global Styles ---

function GlobalStyles() {
  return (
    <style>{`
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      .animate-in { animation: fadeIn 0.4s ease-out forwards; }
      .animate-slide { animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      .arabic-text { font-family: 'Tajawal', sans-serif; }
      .loading-spinner { border: 3px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 32px; height: 32px; animation: spin 0.8s linear infinite; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .ad-html-container img { max-width: 100%; height: auto; border-radius: 1.5rem; display: block; margin: 0 auto; }
      .ad-html-container iframe { max-width: 100%; border-radius: 1rem; border: none; }
      .admin-stat-card { background: white; border-radius: 2rem; padding: 1.5rem; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); transition: transform 0.2s; }
      .admin-stat-card:hover { transform: translateY(-4px); }
      .emerald-gradient { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    `}</style>
  );
}

// --- Helper Functions ---

function s(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val);
}

// --- Shared Components ---

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
           <div className="text-[9px] font-black text-slate-300 mb-1 flex items-center gap-1 uppercase tracking-tighter mr-2">
             <Megaphone size={10} /> إعلان ممول
           </div>
           <div className="overflow-hidden" dangerouslySetInnerHTML={{ __html: ad.html_content }} />
        </div>
      ))}
    </div>
  );
}

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

// Fixed NavButton: added optional flag to children to prevent "missing children" TS errors at call sites
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

// --- Admin Sub-components ---

function AdminAdForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({ title: '', html_content: '', placements: [] as string[] });
  const [loading, setLoading] = useState(false);

  const placementOptions = [
    { id: 'landing_top', name: 'أعلى الرئيسية' },
    { id: 'search_sidebar', name: 'جانب البحث' },
    { id: 'market_banner', name: 'سوق المهام' },
    { id: 'profile_bottom', name: 'أسفل الملف الشخصي' }
  ];

  const togglePlacement = (id: string) => {
    setFormData(prev => ({
      ...prev,
      placements: prev.placements.includes(id) 
        ? prev.placements.filter(p => p !== id) 
        : [...prev.placements, id]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.html_content || formData.placements.length === 0) {
      alert('يرجى ملء جميع الحقول واختيار مكان واحد على الأقل');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('advertisements').insert([{
      title: formData.title,
      html_content: formData.html_content,
      placements: formData.placements,
      is_active: true
    }]);

    if (error) {
      alert('خطأ في الحفظ: ' + error.message);
    } else {
      onSave();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 relative overflow-y-auto max-h-[90vh] no-scrollbar">
        <button onClick={onClose} className="absolute top-6 left-6 p-2 text-slate-400 hover:bg-slate-50 rounded-xl"><X size={20}/></button>
        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
           <Code2 className="text-emerald-600" /> إضافة إعلان مخصص (HTML)
        </h3>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="text-xs font-black text-slate-400 mr-2 uppercase block mb-1">عنوان الإعلان</label>
            <input required className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="مثال: عرض اتصالات الجزائر" />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 mr-2 uppercase block mb-1">كود الـ HTML للإعلان</label>
            <textarea required rows={6} className="w-full p-4 bg-slate-900 text-emerald-400 rounded-2xl border-none font-mono text-sm leading-relaxed" value={formData.html_content} onChange={e => setFormData({...formData, html_content: e.target.value})} placeholder="<div style='...'>...</div> أو كود AdSense" />
          </div>
          <div>
            <label className="text-xs font-black text-slate-400 mr-2 uppercase block mb-2">أماكن الظهور</label>
            <div className="grid grid-cols-2 gap-2">
              {placementOptions.map(p => (
                <button key={p.id} type="button" onClick={() => togglePlacement(p.id)} className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between font-black text-xs ${formData.placements.includes(p.id) ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                  {p.name}
                  {formData.placements.includes(p.id) ? <CheckCircle2 size={14}/> : <Circle size={14}/>}
                </button>
              ))}
            </div>
          </div>
          <button disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-500 transition-all">
            {loading ? 'جاري النشر...' : 'نشر الإعلان الآن'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Main Views ---

function LandingView({ onStart, onRegister }: { onStart: () => void; onRegister: () => void }) {
  return (
    <div className="animate-in">
      <div className="relative min-h-[85vh] flex items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
        <div className="relative z-10 max-w-4xl">
          <div className="inline-block bg-emerald-500/20 text-emerald-400 px-6 py-2 rounded-full border border-emerald-500/30 text-xs font-black uppercase tracking-widest mb-8">أكبر تجمع للحرفيين في الجزائر</div>
          <h1 className="text-4xl md:text-8xl font-black text-white mb-8 leading-tight tracking-tighter">ريح بالك، <br className="sm:hidden"/><span className="text-emerald-400 italic">سَلّكني</span> يسلكها!</h1>
          <p className="text-base md:text-2xl text-slate-300 mb-12 font-medium max-w-2xl mx-auto px-4 text-center">اطلب أي خدمة منزلية بلمسة زر. أفضل الحرفيين المهرة في الجزائر جاهزون لخدمتك.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button onClick={onStart} className="bg-emerald-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 transition-all active:scale-95">ابحث عن حرفي 🔍</button>
            <button onClick={onRegister} className="bg-white/10 backdrop-blur-md text-white px-12 py-5 rounded-[2.5rem] font-black text-xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">سجل كحرفي ⚒️</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6">
        <AdPlacement position="landing_top" />
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

      const usersList = (u || []) as any[];
      const tasksList = (t || []) as any[];
      const adsList = (a || []) as any[];

      setStats({
        users: usersList.length,
        workers: usersList.filter(x => x.role === 'WORKER').length,
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
        <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <Shield className="text-emerald-600" /> لوحة المشرف الرئيسي
        </h2>
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
        <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>نظرة عامة</button>
        <button onClick={() => setActiveTab('users')} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>إدارة المستخدمين</button>
        <button onClick={() => setActiveTab('tasks')} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap ${activeTab === 'tasks' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>إدارة المهام</button>
        <button onClick={() => setActiveTab('ads')} className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all whitespace-nowrap ${activeTab === 'ads' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>إدارة الإعلانات 📢</button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="loading-spinner"></div></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-6 animate-in">
          {activeTab === 'overview' && (
            <div className="text-center py-10 space-y-4">
              <BarChart3 size={48} className="mx-auto text-emerald-100" />
              <h3 className="text-xl font-black text-slate-700">مرحباً بك في لوحة الإدارة</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto font-bold leading-relaxed">يمكنك التحكم في نشاط المنصة، مراجعة الحسابات، وتوزيع الإعلانات المبرمجة بكل سهولة.</p>
            </div>
          )}
          {activeTab === 'users' && (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                    <th className="pb-4 pr-2">المستخدم</th>
                    <th className="pb-4">الهاتف</th>
                    <th className="pb-4">النوع</th>
                    <th className="pb-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 pr-2">
                        <div className="flex items-center gap-3 font-bold text-slate-700">
                          <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.first_name}`} className="w-8 h-8 rounded-lg" />
                          {u.first_name} {u.last_name}
                        </div>
                      </td>
                      <td className="py-4 font-black text-xs text-slate-500">{u.phone}</td>
                      <td className="py-4"><span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black">{u.role}</span></td>
                      <td className="py-4 text-center"><button className="p-1.5 text-slate-300 hover:text-emerald-600"><Settings size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'tasks' && (
            <div className="overflow-x-auto no-scrollbar">
               <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                    <th className="pb-4 pr-2">المهمة</th>
                    <th className="pb-4">الميزانية</th>
                    <th className="pb-4">الحالة</th>
                    <th className="pb-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 pr-2">
                        <div className="flex flex-col">
                           <span className="font-bold text-slate-700 text-sm">{t.title}</span>
                           <span className="text-[10px] text-slate-400 font-black">{t.category} | {t.wilaya}</span>
                        </div>
                      </td>
                      <td className="py-4 font-black text-xs text-emerald-600">{t.budget ? `${t.budget} دج` : 'مفتوح'}</td>
                      <td className="py-4"><span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black">{t.status}</span></td>
                      <td className="py-4 text-center"><button className="p-1.5 text-slate-300 hover:text-emerald-600"><Eye size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'ads' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.map(ad => (
                <div key={ad.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group relative animate-in">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-black text-slate-800 text-sm">{ad.title}</h4>
                    <div className="flex gap-1">
                       <button onClick={async () => { await supabase.from('advertisements').update({ is_active: !ad.is_active }).eq('id', ad.id); refresh(); }} className={`p-1.5 rounded-lg transition-all ${ad.is_active ? 'text-emerald-600 bg-emerald-100' : 'text-slate-300 bg-white shadow-sm'}`}>
                        <ToggleIcon size={16}/>
                       </button>
                       <button onClick={async () => { if(confirm('هل أنت متأكد من حذف هذا الإعلان؟')) { await supabase.from('advertisements').delete().eq('id', ad.id); refresh(); } }} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl text-[8px] font-mono text-emerald-400/60 overflow-hidden h-16 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                    {ad.html_content}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(ad.placements || []).map((p: string) => (
                      <span key={p} className="text-[8px] font-black text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-full uppercase">{p}</span>
                    ))}
                  </div>
                </div>
              ))}
              {data.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-black italic">لا يوجد إعلانات منشورة</div>}
            </div>
          )}
        </div>
      )}

      {showAdForm && <AdminAdForm onClose={() => setShowAdForm(false)} onSave={() => { setShowAdForm(false); refresh(); }} />}
    </div>
  );
}

function SearchWorkersView() {
  const [filters, setFilters] = useState({ query: '', wilaya: '', category: '' });
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    let query = supabase.from('users').select('*').eq('role', 'WORKER');
    if (filters.wilaya) query = query.eq('wilaya', filters.wilaya);
    if (filters.category) query = query.contains('categories', [filters.category]);
    if (filters.query) query = query.or(`first_name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`);
    const { data } = await query;
    if (data) {
      setWorkers(data.map(u => ({
        ...u,
        firstName: u.first_name,
        lastName: u.last_name,
        location: { wilaya: u.wilaya, daira: '' },
        verificationStatus: u.verification_status
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchWorkers(); }, [filters]);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-in">
      <div className="flex flex-col md:flex-row gap-6 mb-12 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
        <input placeholder="ابحث عن حرفي أو خدمة..." className="flex-1 p-5 bg-slate-50 rounded-[2rem] font-bold outline-none focus:bg-emerald-50 transition-all" value={filters.query} onChange={e => setFilters({...filters, query: e.target.value})} />
        <select className="p-5 bg-slate-50 rounded-[2rem] font-black text-sm outline-none" value={filters.wilaya} onChange={e => setFilters({...filters, wilaya: e.target.value})}>
          <option value="">كل الولايات</option>
          {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? <div className="col-span-full py-20 flex justify-center"><div className="loading-spinner"></div></div> : workers.map(w => (
          <div key={w.id} className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 group hover:-translate-y-2 transition-all cursor-pointer">
            <div className="flex items-center gap-4 mb-6">
              <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-16 h-16 rounded-[1.5rem] object-cover border-4 border-slate-50" />
              <div><h3 className="text-xl font-black text-slate-800">{w.firstName} {w.lastName}</h3><p className="text-emerald-600 font-bold text-sm">📍 {w.location.wilaya}</p></div>
            </div>
            <p className="text-slate-500 font-medium line-clamp-2 mb-6">{w.bio || 'لا توجد نبذة حالياً.'}</p>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{w.categories[0] || 'خدمات عامة'}</span>
              <button className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-emerald-600 transition-all">تواصل</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TasksMarketView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (data) setTasks(data);
      setLoading(false);
    }
    fetchTasks();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-in">
      <h2 className="text-4xl font-black mb-12 flex items-center gap-4">سوق المهام <span className="text-emerald-500 italic">DZ</span> <ClipboardList size={32}/></h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? <div className="col-span-full py-20 flex justify-center"><div className="loading-spinner"></div></div> : tasks.map(t => (
          <div key={t.id} className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 flex flex-col h-full hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
              <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{t.category}</span>
              <span className="text-slate-300 font-black text-xs">{new Date(t.created_at).toLocaleDateString('ar-DZ')}</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-4">{t.title}</h3>
            <p className="text-slate-500 font-medium mb-8 flex-grow">{t.description}</p>
            <div className="flex justify-between items-center pt-6 border-t border-slate-50">
              <div className="flex items-center gap-3 font-bold text-slate-700"><MapPin size={16} className="text-emerald-500" /> {t.wilaya}</div>
              <div className="text-emerald-600 font-black text-2xl tracking-tighter">{t.budget ? `${t.budget} دج` : 'سعر مفتوح'}</div>
            </div>
          </div>
        ))}
        {tasks.length === 0 && !loading && <div className="col-span-full py-40 text-center text-slate-300 font-black italic text-2xl">لا توجد مهام منشورة حالياً.</div>}
      </div>
    </div>
  );
}

function AuthForm({ type, onSuccess, onSwitch }: { type: 'login' | 'register'; onSuccess: (u: User) => void; onSwitch: () => void }) {
  const [formData, setFormData] = useState({ phone: '', password: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const is_admin = formData.phone === '0777117663' && formData.password === 'vampirewahab31_';
      const user: User = {
        id: 'user-id-' + Math.random(),
        firstName: is_admin ? 'سلكني' : (formData.firstName || 'مستخدم'),
        lastName: is_admin ? 'المشرف' : (formData.lastName || 'جديد'),
        phone: formData.phone,
        role: is_admin ? UserRole.ADMIN : UserRole.SEEKER,
        location: { wilaya: 'الجزائر', daira: '' },
        categories: [],
        skills: [],
        portfolio: [],
        verificationStatus: 'verified',
        rating: 5,
        ratingCount: 0,
        completedJobs: 0
      };
      onSuccess(user);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6 animate-in">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-8">{type === 'login' ? 'مرحباً بعودتك' : 'إنشاء حساب'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          {type === 'register' && (
            <div className="grid grid-cols-2 gap-2">
              <input required placeholder="الاسم" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input required placeholder="اللقب" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          )}
          <input required placeholder="رقم الهاتف" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black text-lg text-center tracking-widest" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input required type="password" placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-center" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <button disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl hover:bg-emerald-500 transition-all">
            {loading ? 'جاري التحقق...' : (type === 'login' ? 'دخول' : 'تسجيل')}
          </button>
        </form>
        <button onClick={onSwitch} className="mt-8 text-emerald-600 font-black hover:underline">{type === 'login' ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب؟ ادخل هنا'}</button>
      </div>
    </div>
  );
}

function ProfileView({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6 animate-in">
       <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100">
         <div className="h-40 emerald-gradient"></div>
         <div className="px-10 pb-16 relative">
            <div className="flex flex-col md:flex-row items-end gap-6 -mt-20 mb-10">
               <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}`} className="w-40 h-40 rounded-[2.5rem] border-8 border-white shadow-xl object-cover" />
               <div className="flex-1 pb-4">
                  <h2 className="text-3xl font-black text-slate-900">{user.firstName} {user.lastName}</h2>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{user.role}</span>
                    <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{user.location.wilaya}</span>
                  </div>
               </div>
               <button onClick={onLogout} className="mb-4 bg-red-50 text-red-500 p-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><LogOut size={20}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="md:col-span-2 space-y-8">
                  <section>
                    <h4 className="text-xl font-black mb-4 flex items-center gap-2"><Award size={20} className="text-emerald-500"/> نبذة تعريفية</h4>
                    <div className="bg-slate-50 p-6 rounded-3xl text-slate-500 font-medium leading-relaxed">{user.bio || 'لا توجد نبذة حالياً.'}</div>
                  </section>
                  <AdPlacement position="profile_bottom" />
               </div>
               <div className="space-y-6">
                  <div className="bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-xl">
                    <h4 className="font-black text-lg mb-6">معلومات التواصل</h4>
                    <div className="space-y-4">
                       <div className="flex items-center gap-3"><Phone size={18} className="text-emerald-500"/> <span className="font-bold tracking-widest">{user.phone}</span></div>
                       <div className="flex items-center gap-3"><Mail size={18} className="text-emerald-500"/> <span className="font-bold">dz-user@salakni.dz</span></div>
                    </div>
                  </div>
               </div>
            </div>
         </div>
       </div>
    </div>
  );
}

// --- Main App Component ---

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { currentUser: saved ? JSON.parse(saved) : null, workers: [], view: 'landing' };
  });

  function setView(view: AppState['view']) {
    setState(prev => ({ ...prev, view }));
    window.scrollTo(0, 0);
  }

  function updateCurrentUser(u: User | null) {
    setState(prev => ({ ...prev, currentUser: u }));
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user');
  }

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
              <button onClick={() => setView('admin-panel')} className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${state.view === 'admin-panel' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                <Shield size={16}/> بوابة الإدارة
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer p-1 pr-4 bg-slate-100 rounded-full border border-slate-200 hover:border-emerald-200 transition-all">
                <span className="font-black text-xs hidden sm:block">{state.currentUser.firstName}</span>
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setView('login')} className="hidden sm:block text-slate-500 font-black px-4 py-2 hover:text-emerald-600 transition-colors">دخول</button>
                <button onClick={() => setView('register')} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all">ابدأ الآن</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onStart={() => setView('search')} onRegister={() => setView('register')} />}
        {state.view === 'admin-panel' && state.currentUser?.role === UserRole.ADMIN && <AdminPanelView />}
        {state.view === 'search' && <SearchWorkersView />}
        {state.view === 'support' && <TasksMarketView />}
        {state.view === 'login' && <AuthForm type="login" onSuccess={u => { updateCurrentUser(u); setView(u.role === UserRole.ADMIN ? 'admin-panel' : 'profile'); }} onSwitch={() => setView('register')} />}
        {state.view === 'register' && <AuthForm type="register" onSuccess={u => { updateCurrentUser(u); setView('profile'); }} onSwitch={() => setView('login')} />}
        {state.view === 'profile' && state.currentUser && <ProfileView user={state.currentUser} onLogout={() => { updateCurrentUser(null); setView('landing'); }} />}
      </main>

      <footer className="bg-white border-t border-slate-100 pt-16 pb-32 md:pb-12 px-6 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2 space-y-6">
              <Logo size="md" onClick={() => setView('landing')} />
              <div className="space-y-4">
                <h4 className="text-xl font-black text-slate-900 flex items-center gap-2"><Info className="text-emerald-600" size={20} /> مـن نحن؟</h4>
                <p className="text-slate-500 leading-relaxed font-bold text-sm text-justify">
                  <span className="text-emerald-600">سلكني (Salakni)</span> هي المنصة الجزائرية الرائدة التي تسعى لتغيير مفهوم الخدمات المنزلية والمهنية في 58 ولاية. نجمع بين التكنولوجيا والمهارة اليدوية لضمان جودة الحياة.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="text-lg font-black text-slate-900">روابـط سريعة</h4>
              <ul className="space-y-4">
                <li><button onClick={() => setView('search')} className="footer-link flex items-center gap-2 text-slate-500 font-bold hover:text-emerald-600 transition-all"><SearchIcon size={16} /> تصفح الحرفيين</button></li>
                <li><button onClick={() => setView('support')} className="footer-link flex items-center gap-2 text-slate-500 font-bold hover:text-emerald-600 transition-all"><ClipboardList size={16} /> سوق المهام</button></li>
                <li><button onClick={() => setView('register')} className="footer-link flex items-center gap-2 text-slate-500 font-bold hover:text-emerald-600 transition-all"><UserIcon size={16} /> انضم كحرفي</button></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-lg font-black text-slate-900">تواصـل معنا</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-500 font-bold text-sm"><Mail size={16} className="text-emerald-500"/> support@salakni.dz</li>
                <li className="flex items-center gap-3 text-slate-500 font-bold text-sm"><Phone size={16} className="text-emerald-500"/> +213 777 11 76 63</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-50 text-center">
            <p className="text-slate-300 font-black text-[10px] uppercase">جميع الحقوق محفوظة &copy; سلكني 2025 🇩🇿</p>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around md:hidden z-50 px-2 rounded-t-[2rem] shadow-2xl">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={SearchIcon} label="الحرفيين" active={state.view === 'search'} onClick={() => setView('search')} />
        <TabItem icon={ClipboardList} label="المهام" active={state.view === 'support'} onClick={() => setView('support')} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile' || state.view === 'login' || state.view === 'admin-panel'} onClick={() => {
          if (state.currentUser) {
            if (state.currentUser.role === UserRole.ADMIN) setView('admin-panel');
            else setView('profile');
          } else {
            setView('login');
          }
        }} />
      </div>
    </div>
  );
}
