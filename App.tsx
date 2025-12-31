
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserRole, AppState, User, Worker, Advertisement } from './types.ts';
import { SERVICE_CATEGORIES, WILAYAS, DAIRAS } from './constants.tsx';
import { supabase } from './lib/supabase.ts';

// --- أنماط مخصصة ---
const GlobalStyles = () => (
  <style>{`
    @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
    .animate-float { animation: float 5s ease-in-out infinite; }
    .arabic-text { font-family: 'Tajawal', sans-serif; }
    .loading-spinner { border: 4px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
    
    .portfolio-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; }
    @media (min-width: 768px) { .portfolio-grid { grid-template-columns: repeat(5, 1fr); } }
    .admin-tab-active { border-bottom: 3px solid #10b981; color: #10b981; }
  `}</style>
);

// مكون لعرض الإعلانات
const AdRenderer: React.FC<{ placement: Advertisement['placement'] }> = ({ placement }) => {
  const [ad, setAd] = useState<Advertisement | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      const { data } = await supabase.from('advertisements').select('*').eq('placement', placement).eq('is_active', true).single();
      if (data) setAd(data);
    };
    fetchAd();
  }, [placement]);

  if (!ad) return null;
  return <div className="my-6 overflow-hidden flex justify-center w-full" dangerouslySetInnerHTML={{ __html: ad.html_content }} />;
};

const Logo: React.FC<{ size?: 'sm' | 'lg', onClick?: () => void, inverse?: boolean }> = ({ size = 'sm', onClick, inverse }) => (
  <div onClick={onClick} className={`flex items-center gap-2 md:gap-3 group cursor-pointer transition-all duration-500 ${size === 'lg' ? 'scale-100 md:scale-125' : ''}`}>
    <div className={`relative ${size === 'lg' ? 'w-16 h-16 md:w-24 md:h-24' : 'w-10 h-10 md:w-12 md:h-12'} flex-shrink-0`}>
      <div className={`absolute inset-0 bg-gradient-to-tr from-emerald-600 via-teal-500 to-yellow-400 ${size === 'lg' ? 'rounded-2xl md:rounded-[2.5rem]' : 'rounded-xl md:rounded-2xl'} rotate-3 group-hover:rotate-12 transition-transform duration-500 shadow-xl overflow-hidden`}>
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center text-white font-black ${size === 'lg' ? 'text-3xl md:text-5xl' : 'text-xl md:text-2xl'} z-10 group-hover:scale-110 transition-transform`}>S</div>
    </div>
    <div className="flex flex-col items-start leading-none gap-0.5">
      <div className="flex items-baseline gap-1 md:gap-1.5">
        <span className={`${size === 'lg' ? 'text-4xl md:text-8xl' : 'text-2xl md:text-3xl'} font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r ${inverse ? 'from-white via-emerald-100 to-teal-50' : 'from-emerald-950 via-emerald-800 to-teal-700'}`}>Salakni</span>
        <span className={`${size === 'lg' ? 'text-2xl md:text-4xl' : 'text-lg md:text-xl'} arabic-text font-black text-yellow-500`}>سلكني</span>
      </div>
    </div>
  </div>
);

const LandingHero: React.FC<{ onStart: (v: AppState['view']) => void }> = ({ onStart }) => (
  <div className="relative min-h-[90vh] md:min-h-[95vh] flex items-center justify-center text-white text-center p-4 md:p-6 overflow-hidden">
    <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
    <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 via-emerald-950/70 to-teal-900/80"></div>
    <div className="relative z-10 max-w-5xl px-2">
      <div className="mb-8 md:mb-12 animate-float inline-block">
        <Logo size="lg" inverse />
      </div>
      <h1 className="text-4xl md:text-8xl font-black mb-6 md:mb-8 tracking-tighter leading-tight">ريح بالك، <span className="text-emerald-400">سَلّكني</span> يسلكها</h1>
      <p className="text-lg md:text-3xl text-slate-300 mb-10 md:mb-16 font-medium max-w-3xl mx-auto leading-relaxed px-4">المنصة الجزائرية رقم #1 لربط الحرفيين المهرة بالزبائن بكل ثقة وأمان. خدمتك في جيبك بضغطة زر.</p>
      <div className="flex flex-col sm:flex-row gap-4 md:gap-8 justify-center items-center px-4 w-full">
        <button onClick={() => onStart('search')} className="w-full sm:w-auto bg-emerald-600 px-8 md:px-16 py-4 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-2xl hover:bg-emerald-500 transition-all shadow-xl active:scale-95 group">
          اطلب خدمة الآن 🔍
        </button>
        <button onClick={() => onStart('register')} className="w-full sm:w-auto bg-white/10 backdrop-blur-md px-8 md:px-16 py-4 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">
          سجل كحرفي 🛠️
        </button>
      </div>
      <AdRenderer placement="hero_bottom" />
    </div>
  </div>
);

const SearchPage: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ wilaya: '', category: '', query: '' });

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('users').select('*').eq('role', UserRole.WORKER).eq('is_verified', true);
      if (filters.wilaya) query = query.eq('wilaya', filters.wilaya);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.query) {
        query = query.or(`first_name.ilike.%${filters.query}%,last_name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setWorkers(data.map(w => ({
          ...w,
          id: w.id,
          firstName: w.first_name,
          lastName: w.last_name,
          location: { wilaya: w.wilaya, daira: w.daira },
          skills: w.skills || [],
          bio: w.bio || 'حرفي ماهر مستعد للعمل.',
          category: w.category,
          rating: 4.8 + Math.random() * 0.2,
          completedJobs: Math.floor(Math.random() * 50) + 10,
          portfolio: w.portfolio || []
        })) as Worker[]);
      }
    } catch (e) {
      console.error("خطأ:", e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 text-right">
      <AdRenderer placement="search_top" />
      <div className="bg-emerald-900/5 p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] mb-10 md:mb-16 border border-emerald-100 shadow-sm">
        <h2 className="text-2xl md:text-4xl font-black mb-6 md:mb-8">ابحث عن الحرفي المثالي 🔍</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          <input 
            type="text" 
            placeholder="عن ماذا تبحث؟" 
            className="md:col-span-2 p-4 md:p-5 bg-white border-2 border-emerald-50 rounded-2xl md:rounded-3xl outline-none focus:border-emerald-500 font-bold"
            value={filters.query}
            onChange={e => setFilters({...filters, query: e.target.value})}
          />
          <select 
            className="p-4 md:p-5 bg-white border-2 border-emerald-50 rounded-2xl md:rounded-3xl outline-none focus:border-emerald-500 font-bold"
            value={filters.wilaya}
            onChange={e => setFilters({...filters, wilaya: e.target.value})}
          >
            <option value="">كل الولايات</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select 
            className="p-4 md:p-5 bg-white border-2 border-emerald-50 rounded-2xl md:rounded-3xl outline-none focus:border-emerald-500 font-bold"
            value={filters.category}
            onChange={e => setFilters({...filters, category: e.target.value})}
          >
            <option value="">كل التخصصات</option>
            {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-20"><div className="loading-spinner"></div></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
              {workers.map(w => (
                <div key={w.id} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-gray-100 group hover:-translate-y-1 transition-all flex flex-col">
                  <div className="flex gap-4 md:gap-6 items-center mb-4 md:mb-6 flex-row-reverse">
                    <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}+${w.lastName}&background=random&size=128`} className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl object-cover shadow-md border-2 border-emerald-50" alt="" />
                    <div className="text-right flex-1">
                      <h3 className="text-lg md:text-xl font-black">{w.firstName} {w.lastName}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 flex-row-reverse">
                        <span className="text-emerald-600 font-bold text-[10px] md:text-xs bg-emerald-50 px-2 md:px-3 py-1 rounded-full">{w.category}</span>
                        <span className="text-yellow-500 font-bold text-[10px] md:text-xs">⭐ {w.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 line-clamp-3 mb-4 font-medium text-sm md:text-base leading-relaxed">{w.bio}</p>
                  <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center flex-row-reverse">
                    <span className="text-gray-500 font-bold text-xs md:text-sm">📍 {w.location.wilaya}</span>
                    <button className="bg-slate-900 text-white px-4 md:px-6 py-2 rounded-xl font-black text-[10px] md:text-xs hover:bg-emerald-600 transition-colors">تواصل الآن</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <aside className="lg:w-72">
          <AdRenderer placement="search_sidebar" />
        </aside>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'verification' | 'users' | 'ads'>('verification');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'verification') {
        const { data } = await supabase.from('users').select('*').eq('is_verified', false).eq('role', UserRole.WORKER);
        setItems(data || []);
      } else if (activeTab === 'users') {
        const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        setItems(data || []);
      } else if (activeTab === 'ads') {
        const { data } = await supabase.from('advertisements').select('*');
        setItems(data || []);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleVerify = async (userId: string, status: boolean) => {
    await supabase.from('users').update({ is_verified: status }).eq('id', userId);
    fetchData();
  };

  const updateAd = async (id: string, html: string, active: boolean) => {
    await supabase.from('advertisements').update({ html_content: html, is_active: active }).eq('id', id);
    alert("تم حفظ الإعلان");
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-12 text-right">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10 flex-row-reverse border-b border-white/10 pb-6">
          <h1 className="text-2xl md:text-4xl font-black">لوحة الإدارة المركزية 🔒</h1>
          <button onClick={onExit} className="bg-white/10 px-6 py-2 rounded-xl font-black hover:bg-white/20 text-sm">تسجيل خروج</button>
        </div>

        <div className="flex gap-8 mb-10 border-b border-white/5 flex-row-reverse">
          <button onClick={() => setActiveTab('verification')} className={`pb-4 font-black transition-all ${activeTab === 'verification' ? 'admin-tab-active' : 'text-slate-500'}`}>التوثيق (المستندات)</button>
          <button onClick={() => setActiveTab('users')} className={`pb-4 font-black transition-all ${activeTab === 'users' ? 'admin-tab-active' : 'text-slate-500'}`}>كافة المسجلين</button>
          <button onClick={() => setActiveTab('ads')} className={`pb-4 font-black transition-all ${activeTab === 'ads' ? 'admin-tab-active' : 'text-slate-500'}`}>إعلانات HTML</button>
        </div>

        {loading ? <div className="loading-spinner mx-auto mt-20"></div> : (
          <div className="mt-6">
            {activeTab === 'verification' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.map(u => (
                  <div key={u.id} className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 shadow-2xl">
                    <h3 className="text-xl font-black mb-2">{u.first_name} {u.last_name}</h3>
                    <p className="text-emerald-400 font-bold text-sm mb-4">{u.category} | {u.wilaya}</p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                       <div className="text-center">
                          <p className="text-[10px] text-slate-500 mb-1">صورة الهوية (وجه)</p>
                          {u.idFront ? <img src={u.idFront} className="h-32 w-full object-cover rounded-xl border border-white/10 cursor-zoom-in" onClick={() => window.open(u.idFront)} /> : <div className="h-32 bg-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-600">لم ترفع</div>}
                       </div>
                       <div className="text-center">
                          <p className="text-[10px] text-slate-500 mb-1">صورة الهوية (ظهر)</p>
                          {u.idBack ? <img src={u.idBack} className="h-32 w-full object-cover rounded-xl border border-white/10 cursor-zoom-in" onClick={() => window.open(u.idBack)} /> : <div className="h-32 bg-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-600">لم ترفع</div>}
                       </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleVerify(u.id, true)} className="flex-1 bg-emerald-600 py-3 rounded-xl font-black text-sm">تفعيل الحساب ✅</button>
                      <button onClick={() => handleVerify(u.id, false)} className="px-6 bg-red-600/10 text-red-500 py-3 rounded-xl font-black text-sm">رفض</button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <p className="col-span-full text-center py-20 text-slate-600 font-bold">لا يوجد مستندات معلقة.</p>}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-slate-900 rounded-[2rem] border border-white/5 overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-white/5 text-slate-400 text-sm">
                    <tr>
                      <th className="p-4">الاسم الكامل</th>
                      <th className="p-4">الرتبة</th>
                      <th className="p-4">الولاية</th>
                      <th className="p-4">الهاتف</th>
                      <th className="p-4">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(u => (
                      <tr key={u.id} className="border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors" onClick={() => setSelectedUser(u)}>
                        <td className="p-4 font-bold">{u.first_name} {u.last_name}</td>
                        <td className="p-4 text-xs">
                          <span className={`px-2 py-1 rounded-full ${u.role === 'WORKER' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {u.role === 'WORKER' ? 'حرفي' : 'زبون'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">{u.wilaya}</td>
                        <td className="p-4 font-mono text-sm">{u.phone}</td>
                        <td className="p-4">
                          <span className={u.is_verified ? 'text-emerald-500' : 'text-yellow-500'}>
                            {u.is_verified ? '● موثق' : '○ غير موثق'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'ads' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {items.map(ad => (
                  <div key={ad.id} className="bg-slate-900 p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                    <div className="flex justify-between items-center mb-6 flex-row-reverse">
                      <h3 className="text-xl font-black">{ad.placement === 'hero_bottom' ? 'أسفل البطل (الرئيسية)' : ad.placement === 'search_top' ? 'أعلى البحث' : ad.placement === 'search_sidebar' ? 'جانب البحث' : 'فوق التذييل'}</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs font-bold">{ad.is_active ? 'مفعل' : 'معطل'}</span>
                        <input type="checkbox" checked={ad.is_active} onChange={e => updateAd(ad.id, ad.html_content, e.target.checked)} className="accent-emerald-500" />
                      </label>
                    </div>
                    <textarea 
                      className="w-full h-48 bg-slate-950 border border-white/10 rounded-xl p-4 font-mono text-xs text-emerald-400 outline-none focus:border-emerald-500 mb-6"
                      value={ad.html_content}
                      onChange={e => {
                        const newItems = items.map(i => i.id === ad.id ? {...i, html_content: e.target.value} : i);
                        setItems(newItems);
                      }}
                    />
                    <button onClick={() => updateAd(ad.id, ad.html_content, ad.is_active)} className="w-full py-4 bg-emerald-600 rounded-xl font-black shadow-lg">حفظ شفرة HTML</button>
                  </div>
                ))}
                {items.length === 0 && <p className="col-span-full text-center py-20 text-slate-600 font-bold">يرجى تهيئة جدول الإعلانات في Supabase أولاً.</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* مودال تفاصيل المستخدم */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setSelectedUser(null)}>
          <div className="bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 border border-white/10 text-right shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex gap-6 items-center mb-8 flex-row-reverse">
               <img src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.first_name}`} className="w-24 h-24 rounded-3xl object-cover border-2 border-emerald-500" />
               <div className="flex-1">
                  <h2 className="text-3xl font-black">{selectedUser.first_name} {selectedUser.last_name}</h2>
                  <p className="text-emerald-500 font-bold text-xl">{selectedUser.category || 'باحث عن خدمة'}</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 text-slate-300">
               <div className="bg-slate-800/50 p-6 rounded-2xl">
                  <p className="text-xs text-slate-500 mb-1">رقم الهاتف</p>
                  <p className="font-mono text-xl">{selectedUser.phone}</p>
               </div>
               <div className="bg-slate-800/50 p-6 rounded-2xl">
                  <p className="text-xs text-slate-500 mb-1">الموقع</p>
                  <p className="text-xl">{selectedUser.wilaya} - {selectedUser.daira}</p>
               </div>
               <div className="md:col-span-2 bg-slate-800/50 p-6 rounded-2xl">
                  <p className="text-xs text-slate-500 mb-1">نبذة تعريفية</p>
                  <p className="leading-relaxed">{selectedUser.bio || 'لا يوجد وصف مضاف.'}</p>
               </div>
            </div>
            <button onClick={() => setSelectedUser(null)} className="w-full py-5 bg-white/5 rounded-2xl font-black hover:bg-white/10 transition-all">إغلاق التفاصيل</button>
          </div>
        </div>
      )}
    </div>
  );
};

const EditProfile: React.FC<{ user: User, onUpdate: (u: User) => void }> = ({ user, onUpdate }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [skills, setSkills] = useState(user.skills?.join(', ') || '');
  const [portfolio, setPortfolio] = useState<string[]>(user.portfolio || []);
  const [idFront, setIdFront] = useState(user.idFront || '');
  const [idBack, setIdBack] = useState(user.idBack || '');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'front') setIdFront(reader.result as string);
      else setIdBack(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const skillsArr = skills.split(',').map(s => s.trim()).filter(s => s);
      const { error } = await supabase.from('users').update({ 
        bio, skills: skillsArr, portfolio, idFront, idBack 
      }).eq('id', user.id);
      if (error) throw error;
      onUpdate({ ...user, bio, skills: skillsArr, portfolio, idFront, idBack });
      alert("تم الحفظ بنجاح!");
    } catch (err) { alert("خطأ في الحفظ"); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 md:my-12 px-4 md:px-0">
      <div className="p-8 md:p-10 bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl text-right">
        <h2 className="text-2xl font-black mb-8 text-emerald-950">تعديل ملفك الحرفي 🛠️</h2>
        <div className="space-y-6 text-gray-900">
          <div>
            <label className="block text-sm font-black mb-2">نبذة عنك (تجذب الزبائن):</label>
            <textarea rows={3} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-emerald-500 outline-none" value={bio} onChange={e => setBio(e.target.value)} />
          </div>
          
          <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
            <h3 className="font-black mb-4">وثائق التوثيق (سرية وآمنة) 🔐</h3>
            <p className="text-xs text-gray-500 mb-6">ارفع صورة بطاقة التعريف أو رخصة السياقة للحصول على شارة "موثق" وزيادة ثقة الزبائن.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <p className="text-xs font-bold mb-2">وجه البطاقة:</p>
                  <div className="relative aspect-[1.6/1] bg-white border-2 border-dashed border-gray-200 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:border-emerald-400" onClick={() => document.getElementById('id-f')?.click()}>
                     {idFront ? <img src={idFront} className="w-full h-full object-cover" /> : <span className="text-2xl text-gray-300">+</span>}
                     <input type="file" id="id-f" className="hidden" accept="image/*" onChange={e => handleDocUpload(e, 'front')} />
                  </div>
               </div>
               <div>
                  <p className="text-xs font-bold mb-2">ظهر البطاقة:</p>
                  <div className="relative aspect-[1.6/1] bg-white border-2 border-dashed border-gray-200 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:border-emerald-400" onClick={() => document.getElementById('id-b')?.click()}>
                     {idBack ? <img src={idBack} className="w-full h-full object-cover" /> : <span className="text-2xl text-gray-300">+</span>}
                     <input type="file" id="id-b" className="hidden" accept="image/*" onChange={e => handleDocUpload(e, 'back')} />
                  </div>
               </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 text-xl">
             {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- المكون الرئيسي App ---
export default function App() {
  const initialUser = JSON.parse(localStorage.getItem('user')) || null;
  const [state, setState] = useState<AppState>({ currentUser: initialUser, workers: [], view: 'landing' });
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#/admin-portal') {
        setState(prev => ({ ...prev, view: 'admin-login' }));
      } else if (window.location.hash === '') {
        setState(prev => ({ ...prev, view: prev.currentUser?.role === UserRole.ADMIN ? 'admin' : 'landing' }));
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigate = (view: AppState['view']) => {
    if (view === 'landing') window.location.hash = '';
    window.scrollTo(0, 0);
    setState(prev => ({ ...prev, view }));
  };
  
  const handleLoginSuccess = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user, view: user.role === UserRole.ADMIN ? 'admin' : 'profile' }));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.hash = '';
    setState(prev => ({ ...prev, currentUser: null, view: 'landing' }));
  };

  const isManagementView = state.view === 'admin' || state.view === 'admin-login';

  return (
    <div className={`min-h-screen flex flex-col overflow-x-hidden arabic-text transition-colors duration-700 ${isManagementView ? 'bg-slate-950' : 'bg-gray-50'}`} dir="rtl">
      <GlobalStyles />
      
      {selectedImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md cursor-zoom-out" onClick={() => setSelectedImg(null)}>
          <img src={selectedImg} className="max-w-[95%] max-h-[90%] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" />
        </div>
      )}

      {state.view !== 'admin' && (
        <nav className={`sticky top-0 z-50 backdrop-blur-xl shadow-sm border-b h-16 md:h-24 flex items-center px-4 md:px-6 ${isManagementView ? 'bg-slate-900/95 border-white/5' : 'bg-white/95 border-gray-100'}`}>
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            <Logo onClick={() => handleNavigate('landing')} inverse={isManagementView} />
            {state.view !== 'admin-login' && (
              <div className="hidden lg:flex items-center gap-10">
                <button onClick={() => handleNavigate('landing')} className={`${state.view === 'landing' ? 'text-emerald-600 font-black' : 'text-gray-500'} font-bold`}>الرئيسية</button>
                <button onClick={() => handleNavigate('search')} className={`${state.view === 'search' ? 'text-emerald-600 font-black' : 'text-gray-500'} font-bold`}>تصفح الحرفيين</button>
              </div>
            )}
            <div className="flex items-center gap-3">
              {!state.currentUser ? (
                <div className="flex items-center gap-4">
                   {state.view !== 'admin-login' && <button onClick={() => handleNavigate('login')} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-sm">دخول</button>}
                </div>
              ) : (
                <div className={`flex items-center gap-3 p-1.5 rounded-2xl border cursor-pointer ${isManagementView ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100 text-gray-800'}`} onClick={() => handleNavigate('profile')}>
                  <div className="flex flex-col items-start leading-none"><span className="text-xs font-black">{state.currentUser.firstName}</span></div>
                  <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-8 h-8 rounded-lg" />
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
      
      <main className="flex-grow">
        {state.view === 'landing' && <LandingHero onStart={handleNavigate} />}
        {state.view === 'search' && <SearchPage />}
        {state.view === 'admin-login' && <AuthForm type="admin" onSuccess={handleLoginSuccess} />}
        {state.view === 'profile' && state.currentUser && (
          <div className="max-w-4xl mx-auto my-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`rounded-[3rem] shadow-2xl border overflow-hidden ${isManagementView ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-gray-50 text-gray-900'}`}>
              <div className="p-8 md:p-16 text-center">
                <div className="relative inline-block mb-8">
                  <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}&size=256&background=random`} className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] mx-auto border-4 border-emerald-50 shadow-2xl object-cover" />
                  {state.currentUser.isVerified && <span className="absolute -bottom-2 -right-2 bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg border-2 border-white">✔</span>}
                </div>
                <h2 className="text-3xl md:text-5xl font-black mb-3">{state.currentUser.firstName} {state.currentUser.lastName}</h2>
                <p className="text-emerald-500 font-black text-xl mb-10">{state.currentUser.category || 'عضو في سلكني'}</p>
                
                {state.currentUser.role === UserRole.WORKER && (
                  <div className="text-right border-t border-gray-50 pt-10 mb-10">
                    <h3 className="text-2xl font-black mb-8">نموذج من أعمالي 📸</h3>
                    {state.currentUser.portfolio && state.currentUser.portfolio.length > 0 ? (
                      <div className="portfolio-grid">
                        {state.currentUser.portfolio.map((img, idx) => (
                          <div key={idx} className="aspect-square rounded-[2rem] overflow-hidden border-2 border-emerald-50 cursor-zoom-in hover:scale-105 transition-transform" onClick={() => setSelectedImg(img)}>
                            <img src={img} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-gray-400 text-center py-10">لم تضف أعمالاً بعد.</p>}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {state.currentUser.role === UserRole.ADMIN && <button onClick={() => handleNavigate('admin')} className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl">دخول الإدارة ⚡</button>}
                  {state.currentUser.role === UserRole.WORKER && <button onClick={() => handleNavigate('edit-profile')} className="px-10 py-5 bg-emerald-50 text-emerald-600 rounded-2xl font-black">تعديل ملفي</button>}
                  <button onClick={handleLogout} className="px-10 py-5 bg-red-50 text-red-500 rounded-2xl font-black">خروج</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {state.view === 'edit-profile' && state.currentUser && <EditProfile user={state.currentUser} onUpdate={(u) => setState({...state, currentUser: u, view: 'profile'})} />}
        {state.view === 'admin' && state.currentUser?.role === UserRole.ADMIN && <AdminDashboard onExit={handleLogout} />}
        {(state.view === 'login' || state.view === 'register') && <AuthForm type={state.view} onSuccess={handleLoginSuccess} />}
      </main>

      {!isManagementView && (
        <>
          <AdRenderer placement="footer_top" />
          <footer className="bg-slate-900 text-white py-12 px-4 text-center mt-12">
            <Logo onClick={() => handleNavigate('landing')} inverse />
            <p className="mt-6 text-slate-400">أكبر منصة للحرفيين في الجزائر 🇩🇿</p>
            <div className="border-t border-white/5 mt-12 pt-10 text-slate-500 text-sm font-bold">حقوق النشر محفوظة © {new Date().getFullYear()} سلكني</div>
          </footer>
        </>
      )}
    </div>
  );
}

// مكون AuthForm منفصل (تبسيط)
const AuthForm: React.FC<{ type: 'login' | 'register' | 'admin', onSuccess: (user: User) => void }> = ({ type, onSuccess }) => {
  const [formData, setFormData] = useState({ phone: '', password: '', firstName: '', lastName: '', role: UserRole.SEEKER as UserRole, wilaya: 'الجزائر', daira: 'الجزائر', category: SERVICE_CATEGORIES[0].name });
  const [loading, setLoading] = useState(false);
  const isAdminMode = type === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (formData.phone === '0777117663' && formData.password === 'vampirewahab31') {
      const u: User = { id: 'admin-1', firstName: 'عبد الوهاب', lastName: 'المدير', phone: '0777117663', role: UserRole.ADMIN, location: { wilaya: 'الجزائر', daira: 'الجزائر' }, isVerified: true };
      localStorage.setItem('user', JSON.stringify(u));
      onSuccess(u);
      return;
    }
    if (isAdminMode) { alert("بيانات خاطئة!"); setLoading(false); return; }
    try {
      if (type === 'login') {
        const { data } = await supabase.from('users').select('*').eq('phone', formData.phone).eq('password', formData.password).single();
        if (!data) throw new Error("بيانات خاطئة");
        const u = { ...data, id: data.id, firstName: data.first_name, lastName: data.last_name, role: data.role as UserRole, location: { wilaya: data.wilaya, daira: data.daira } };
        localStorage.setItem('user', JSON.stringify(u));
        onSuccess(u);
      } else {
        const { data } = await supabase.from('users').insert({ first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone, password: formData.password, role: formData.role, wilaya: formData.wilaya, daira: formData.daira, category: formData.role === UserRole.WORKER ? formData.category : null }).select().single();
        const u = { ...data, id: data.id, firstName: data.first_name, lastName: data.last_name, role: data.role as UserRole, location: { wilaya: data.wilaya, daira: data.daira } };
        localStorage.setItem('user', JSON.stringify(u));
        onSuccess(u);
      }
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div className={`max-w-xl mx-auto my-12 px-4 ${isAdminMode ? 'pt-10' : ''}`}>
      <div className={`p-8 md:p-12 rounded-[3rem] shadow-2xl text-center border ${isAdminMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-gray-50'}`}>
        <h2 className="text-2xl font-black mb-8">{isAdminMode ? 'دخول المدير 🔒' : type === 'login' ? 'مرحباً بعودتك' : 'انضم إلينا'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="الاسم" className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900" onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input type="text" placeholder="اللقب" className="p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900" onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          )}
          <input type="tel" placeholder="رقم الهاتف" className="w-full p-4 border-2 rounded-2xl text-right text-gray-900" onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input type="password" placeholder="كلمة المرور" className="w-full p-4 border-2 rounded-2xl text-right text-gray-900" onChange={e => setFormData({...formData, password: e.target.value})} />
          <button type="submit" disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg">دخول</button>
        </form>
      </div>
    </div>
  );
};
