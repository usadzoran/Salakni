
import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, AppState, User, Worker, Advertisement } from './types.ts';
import { SERVICE_CATEGORIES, WILAYAS } from './constants.tsx';
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
    .admin-tab-active { border-bottom: 3px solid #10b981; color: #10b981; transform: translateY(-2px); }
    .hero-bg-overlay { background: linear-gradient(to bottom, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.7) 50%, rgba(15, 23, 42, 0.95) 100%); }
  `}</style>
);

const REQ_IMAGE = "https://st3.depositphotos.com/9744818/17392/i/950/depositphotos_173923044-stock-photo-woman-giving-money-man-corrupted.jpg";

// --- مكون عرض الإعلانات ---
const AdRenderer: React.FC<{ placement: Advertisement['placement'] }> = ({ placement }) => {
  const [ad, setAd] = useState<Advertisement | null>(null);
  useEffect(() => {
    const fetchAd = async () => {
      const { data } = await supabase.from('advertisements').select('*').eq('placement', placement).eq('is_active', true).limit(1).maybeSingle();
      if (data) setAd(data);
    };
    fetchAd();
  }, [placement]);
  if (!ad) return null;
  return <div className="my-6 flex justify-center w-full" dangerouslySetInnerHTML={{ __html: ad.html_content }} />;
};

const Logo: React.FC<{ size?: 'sm' | 'lg', onClick?: () => void, inverse?: boolean }> = ({ size = 'sm', onClick, inverse }) => (
  <div onClick={onClick} className={`flex items-center gap-2 md:gap-3 group cursor-pointer transition-all ${size === 'lg' ? 'scale-110' : ''}`}>
    <div className={`relative ${size === 'lg' ? 'w-16 h-16' : 'w-10 h-10'} flex-shrink-0`}>
      <div className={`absolute inset-0 bg-gradient-to-tr from-emerald-600 via-teal-500 to-yellow-400 rounded-xl rotate-3 group-hover:rotate-12 transition-transform shadow-xl`}></div>
      <div className="absolute inset-0 flex items-center justify-center text-white font-black z-10">S</div>
    </div>
    <div className="flex flex-col items-start leading-none">
      <div className="flex items-baseline gap-1">
        <span className={`${size === 'lg' ? 'text-4xl' : 'text-2xl'} font-black ${inverse ? 'text-white' : 'text-emerald-950'}`}>Salakni</span>
        <span className="text-yellow-500 font-bold">سلكني</span>
      </div>
    </div>
  </div>
);

// --- لوحة التحكم المتطورة ---
const AdminDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'verification' | 'users' | 'ads'>('stats');
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalWorkers: 0, totalSeekers: 0, pendingVerifications: 0 });
  const [loading, setLoading] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [newAd, setNewAd] = useState({ title: '', placement: 'hero_bottom', html_content: '', is_active: true });

  const fetchStats = async () => {
    const { count: workers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', UserRole.WORKER);
    const { count: seekers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', UserRole.SEEKER);
    const { count: pending } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', UserRole.WORKER).eq('is_verified', false);
    setStats({ totalWorkers: workers || 0, totalSeekers: seekers || 0, pendingVerifications: pending || 0 });
  };

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'stats') await fetchStats();
    else if (activeTab === 'verification') {
      const { data } = await supabase.from('users').select('*').eq('role', UserRole.WORKER).eq('is_verified', false);
      setData(data || []);
    } else if (activeTab === 'users') {
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      setData(data || []);
    } else if (activeTab === 'ads') {
      const { data } = await supabase.from('advertisements').select('*').order('created_at', { ascending: false });
      setData(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleVerify = async (userId: string, status: boolean) => {
    const { error } = await supabase.from('users').update({ is_verified: status }).eq('id', userId);
    if (!error) fetchData();
  };

  const handleToggleAd = async (id: string, active: boolean) => {
    await supabase.from('advertisements').update({ is_active: active }).eq('id', id);
    fetchData();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المستخدم نهائياً؟")) {
      await supabase.from('users').delete().eq('id', id);
      fetchData();
    }
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('advertisements').insert([newAd]);
    if (!error) { setShowAdModal(false); fetchData(); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 text-right">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6 flex-row-reverse">
          <div className="flex items-center gap-4">
            <Logo size="lg" inverse />
            <span className="bg-emerald-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">Admin Control</span>
          </div>
          <button onClick={onExit} className="bg-red-600/20 text-red-500 px-6 py-2 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all">تسجيل خروج</button>
        </header>

        <nav className="flex gap-8 mb-12 border-b border-white/5 flex-row-reverse overflow-x-auto whitespace-nowrap pb-1">
          <button onClick={() => setActiveTab('stats')} className={`pb-4 font-black transition-all ${activeTab === 'stats' ? 'admin-tab-active' : 'text-slate-500'}`}>الرئيسية</button>
          <button onClick={() => setActiveTab('verification')} className={`pb-4 font-black transition-all ${activeTab === 'verification' ? 'admin-tab-active' : 'text-slate-500'}`}>طلبات التوثيق ({stats.pendingVerifications})</button>
          <button onClick={() => setActiveTab('users')} className={`pb-4 font-black transition-all ${activeTab === 'users' ? 'admin-tab-active' : 'text-slate-500'}`}>إدارة المستخدمين</button>
          <button onClick={() => setActiveTab('ads')} className={`pb-4 font-black transition-all ${activeTab === 'ads' ? 'admin-tab-active' : 'text-slate-500'}`}>الإعلانات</button>
        </nav>

        {loading ? <div className="flex justify-center py-20"><div className="loading-spinner"></div></div> : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                  <p className="text-slate-400 font-bold mb-2">إجمالي الحرفيين</p>
                  <p className="text-5xl font-black text-emerald-500">{stats.totalWorkers}</p>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                  <p className="text-slate-400 font-bold mb-2">إجمالي الزبائن</p>
                  <p className="text-5xl font-black text-blue-500">{stats.totalSeekers}</p>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/5 shadow-2xl border-emerald-500/30">
                  <p className="text-slate-400 font-bold mb-2">طلبات معلقة</p>
                  <p className="text-5xl font-black text-yellow-500">{stats.pendingVerifications}</p>
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {data.map(user => (
                  <div key={user.id} className="bg-slate-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl space-y-6">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <div className="flex items-center gap-4 flex-row-reverse">
                        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.first_name}`} className="w-16 h-16 rounded-2xl object-cover" />
                        <div className="text-right">
                          <h3 className="text-xl font-black">{user.first_name} {user.last_name}</h3>
                          <p className="text-emerald-400 font-bold">{user.category}</p>
                        </div>
                      </div>
                      <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold">قيد المراجعة</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 p-2 rounded-xl border border-white/5 text-center">
                        <p className="text-[10px] text-slate-500 mb-2">بطاقة التعريف (وجه)</p>
                        {user.id_front ? <img src={user.id_front} className="h-32 w-full object-cover rounded-lg cursor-pointer" onClick={() => window.open(user.id_front)} /> : <div className="h-32 flex items-center justify-center text-xs italic">لا توجد صورة</div>}
                      </div>
                      <div className="bg-black/40 p-2 rounded-xl border border-white/5 text-center">
                        <p className="text-[10px] text-slate-500 mb-2">بطاقة التعريف (ظهر)</p>
                        {user.id_back ? <img src={user.id_back} className="h-32 w-full object-cover rounded-lg cursor-pointer" onClick={() => window.open(user.id_back)} /> : <div className="h-32 flex items-center justify-center text-xs italic">لا توجد صورة</div>}
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => handleVerify(user.id, true)} className="flex-1 bg-emerald-600 py-3 rounded-xl font-black text-sm hover:bg-emerald-500">تفعيل الحساب ✅</button>
                      <button onClick={() => handleDeleteUser(user.id)} className="px-6 bg-red-600/10 text-red-500 py-3 rounded-xl font-black text-sm hover:bg-red-600 hover:text-white">رفض وحذف</button>
                    </div>
                  </div>
                ))}
                {data.length === 0 && <p className="col-span-full text-center py-20 text-slate-500 font-bold">لا توجد طلبات توثيق حالياً.</p>}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-slate-900 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-right">
                  <thead className="bg-white/5 text-slate-400 text-sm">
                    <tr>
                      <th className="p-6">المستخدم</th>
                      <th className="p-6">النوع</th>
                      <th className="p-6">الولاية</th>
                      <th className="p-6">الهاتف</th>
                      <th className="p-6 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-6 flex items-center gap-3 flex-row-reverse">
                          <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.first_name}`} className="w-10 h-10 rounded-lg" />
                          <div className="text-right">
                            <p className="font-black">{u.first_name} {u.last_name}</p>
                            <p className="text-[10px] text-slate-500">{new Date(u.created_at).toLocaleDateString('ar-DZ')}</p>
                          </div>
                        </td>
                        <td className="p-6"><span className={`px-3 py-1 rounded-full text-[10px] font-black ${u.role === UserRole.WORKER ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>{u.role === UserRole.WORKER ? 'حرفي' : 'زبون'}</span></td>
                        <td className="p-6 text-slate-300">{u.wilaya}</td>
                        <td className="p-6 font-mono text-sm">{u.phone}</td>
                        <td className="p-6 text-center">
                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-400 bg-red-500/10 p-2 rounded-lg">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'ads' && (
              <div className="space-y-8">
                <div className="flex justify-end">
                  <button onClick={() => setShowAdModal(true)} className="bg-blue-600 px-8 py-3 rounded-2xl font-black shadow-lg">إضافة إعلان جديد 📢</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {data.map(ad => (
                    <div key={ad.id} className="bg-slate-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col gap-6">
                      <div className="flex justify-between items-center flex-row-reverse">
                        <h3 className="font-black text-xl">{ad.title}</h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={ad.is_active} onChange={e => handleToggleAd(ad.id, e.target.checked)} className="accent-emerald-500" />
                          <span className="text-xs font-bold">{ad.is_active ? 'مفعل' : 'معطل'}</span>
                        </label>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-white/5 font-mono text-xs text-blue-400 overflow-x-auto whitespace-pre">
                        {ad.html_content}
                      </div>
                      <div className="mt-auto border-t border-white/5 pt-4 text-center">
                        <p className="text-[10px] text-slate-500 mb-2">معاينة مباشرة</p>
                        <div className="bg-white rounded-xl p-2 min-h-[50px] flex items-center justify-center text-black" dangerouslySetInnerHTML={{ __html: ad.html_content }}></div>
                      </div>
                      <button onClick={async () => { await supabase.from('advertisements').delete().eq('id', ad.id); fetchData(); }} className="bg-red-600/10 text-red-500 py-2 rounded-xl text-xs font-bold">حذف الإعلان</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showAdModal && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-2xl rounded-[3rem] p-8 md:p-10 border border-white/10 text-right shadow-2xl">
            <h2 className="text-2xl font-black mb-6">إنشاء إعلان جديد</h2>
            <form onSubmit={handleAddAd} className="space-y-6">
              <input required className="w-full bg-slate-800 border border-white/10 p-4 rounded-xl outline-none" placeholder="عنوان الإعلان" value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} />
              <select className="w-full bg-slate-800 border border-white/10 p-4 rounded-xl outline-none" value={newAd.placement} onChange={e => setNewAd({...newAd, placement: e.target.value})}>
                <option value="hero_bottom">أسفل الرئيسية</option>
                <option value="search_top">أعلى نتائج البحث</option>
                <option value="search_sidebar">جانب البحث</option>
                <option value="footer_top">فوق التذييل</option>
              </select>
              <textarea required className="w-full h-40 bg-black/50 border border-white/10 p-4 rounded-xl font-mono text-xs outline-none" placeholder="كود HTML هنا..." value={newAd.html_content} onChange={e => setNewAd({...newAd, html_content: e.target.value})} />
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-emerald-600 py-4 rounded-xl font-black">إضافة الآن</button>
                <button type="button" onClick={() => setShowAdModal(false)} className="px-8 bg-white/5 py-4 rounded-xl font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- المكونات الأخرى (Landing, Search, Auth) ---
// (تم الاحتفاظ بالبنية الأصلية مع تحسين الربط)

const LandingHero: React.FC<{ onStart: (v: AppState['view']) => void }> = ({ onStart }) => (
  <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
    <div className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105" style={{ backgroundImage: `url(${REQ_IMAGE})` }}></div>
    <div className="absolute inset-0 hero-bg-overlay"></div>
    <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 w-full text-center">
      <div className="flex flex-col items-center gap-10">
        <Logo size="lg" inverse />
        <h1 className="text-4xl md:text-8xl font-black text-white leading-tight px-4">ريح بالك، <span className="text-emerald-400">سَلّكني</span> يسلكها</h1>
        <p className="text-lg md:text-3xl text-slate-300 font-medium max-w-3xl mx-auto px-4">المنصة الجزائرية رقم #1 لربط الحرفيين بالزبائن بضمان وثقة.</p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full px-4">
          <button onClick={() => onStart('search')} className="w-full sm:w-auto bg-emerald-600 px-12 md:px-20 py-5 rounded-[2rem] font-black text-xl md:text-2xl text-white shadow-xl">ابحث عن حرفي 🔍</button>
          <button onClick={() => onStart('register')} className="w-full sm:w-auto bg-white/10 backdrop-blur-md px-12 md:px-20 py-5 rounded-[2rem] font-black text-xl md:text-2xl text-white border border-white/20">سجل كحرفي 🛠️</button>
        </div>
      </div>
      <div className="mt-16"><AdRenderer placement="hero_bottom" /></div>
    </div>
  </div>
);

const AuthForm: React.FC<{ type: 'login' | 'register' | 'admin', onSuccess: (user: User) => void }> = ({ type, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', password: '', role: UserRole.SEEKER as UserRole, wilaya: WILAYAS[0] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (type === 'admin') {
        if (formData.phone === '0777117663' && formData.password === 'vampirewahab31') {
          const adminUser: User = { id: 'admin-id', firstName: 'عبد الوهاب', lastName: 'المدير', phone: formData.phone, role: UserRole.ADMIN, location: { wilaya: 'الجزائر', daira: 'الجزائر' }, isVerified: true };
          onSuccess(adminUser);
        } else { alert("بيانات دخول الإدارة غير صحيحة!"); }
      } else if (type === 'login') {
        const { data, error } = await supabase.from('users').select('*').eq('phone', formData.phone).eq('password', formData.password).single();
        if (data) onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: data.daira } });
        else alert("خطأ في تسجيل الدخول");
      } else {
        const { data, error } = await supabase.from('users').insert([{ first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone, password: formData.password, role: formData.role, wilaya: formData.wilaya, is_verified: formData.role === UserRole.SEEKER }]).select().single();
        if (data) onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: data.daira } });
        else alert("خطأ في التسجيل: " + error?.message);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-md text-right border border-gray-100">
        <h2 className="text-3xl font-black mb-8 text-slate-900">{type === 'admin' ? 'دخول المدير 🔒' : type === 'login' ? 'مرحباً بعودتك' : 'انضم إلينا'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="الاسم" required className="p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input placeholder="اللقب" required className="p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          )}
          <input placeholder="رقم الهاتف" required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input type="password" placeholder="كلمة المرور" required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          {type === 'register' && (
            <select className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
              <option value={UserRole.SEEKER}>أبحث عن حرفي</option>
              <option value={UserRole.WORKER}>أنا حرفي</option>
            </select>
          )}
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-500 transition-all">{loading ? 'جاري التحميل...' : 'دخول'}</button>
        </form>
      </div>
    </div>
  );
};

const SearchPage: React.FC = () => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ wilaya: '', category: '', query: '' });

  const fetchWorkers = async () => {
    setLoading(true);
    let query = supabase.from('users').select('*').eq('role', UserRole.WORKER).eq('is_verified', true);
    if (filters.wilaya) query = query.eq('wilaya', filters.wilaya);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.query) query = query.or(`first_name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`);
    const { data } = await query.order('created_at', { ascending: false });
    setWorkers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchWorkers(); }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-right">
      <AdRenderer placement="search_top" />
      <div className="bg-emerald-900/5 p-8 rounded-[3rem] mb-12 border border-emerald-100">
        <h2 className="text-3xl font-black mb-8">ابحث عن الحرفي المثالي 🔍</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input placeholder="عن ماذا تبحث؟" className="md:col-span-2 p-4 bg-white border rounded-2xl outline-none" value={filters.query} onChange={e => setFilters({...filters, query: e.target.value})} />
          <select className="p-4 bg-white border rounded-2xl outline-none" value={filters.wilaya} onChange={e => setFilters({...filters, wilaya: e.target.value})}>
            <option value="">كل الولايات</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select className="p-4 bg-white border rounded-2xl outline-none" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
            <option value="">كل التخصصات</option>
            {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-20"><div className="loading-spinner"></div></div> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {workers.map(w => (
            <div key={w.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col">
              <div className="flex gap-4 items-center mb-6 flex-row-reverse">
                <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.first_name}`} className="w-16 h-16 rounded-xl object-cover border" />
                <div className="text-right flex-1">
                  <h3 className="text-lg font-black">{w.first_name} {w.last_name}</h3>
                  <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">{w.category}</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-6 flex-1">{w.bio || 'حرفي ماهر في منصة سلكني.'}</p>
              <div className="flex justify-between items-center flex-row-reverse pt-4 border-t">
                <span className="text-gray-500 font-bold text-xs">📍 {w.wilaya}</span>
                <button className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-emerald-600">تواصل الآن</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-12"><AdRenderer placement="footer_top" /></div>
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<AppState>({ currentUser: JSON.parse(localStorage.getItem('user')) || null, workers: [], view: 'landing' });

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#/admin-portal') setState(prev => ({ ...prev, view: 'admin-login' }));
      else if (window.location.hash === '') setState(prev => ({ ...prev, view: prev.currentUser?.role === UserRole.ADMIN ? 'admin' : 'landing' }));
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setState({ ...state, currentUser: user, view: user.role === UserRole.ADMIN ? 'admin' : 'profile' });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.hash = '';
    setState({ ...state, currentUser: null, view: 'landing' });
  };

  const isManagementView = state.view === 'admin' || state.view === 'admin-login';

  return (
    <div className={`min-h-screen flex flex-col arabic-text ${isManagementView ? 'bg-slate-950' : 'bg-gray-50'}`} dir="rtl">
      <GlobalStyles />
      <nav className={`h-24 flex items-center px-6 sticky top-0 z-50 backdrop-blur-xl border-b ${isManagementView ? 'bg-slate-900/90 border-white/5' : 'bg-white/90 border-gray-100'}`}>
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setState({...state, view: 'landing'})} inverse={isManagementView} />
          {state.view !== 'admin' && (
            <div className="flex items-center gap-6">
              <button onClick={() => setState({...state, view: 'landing'})} className={`${state.view === 'landing' ? 'text-emerald-600 font-black' : 'text-slate-500'} font-bold`}>الرئيسية</button>
              <button onClick={() => setState({...state, view: 'search'})} className={`${state.view === 'search' ? 'text-emerald-600 font-black' : 'text-slate-500'} font-bold`}>تصفح الحرفيين</button>
              {!state.currentUser ? <button onClick={() => setState({...state, view: 'login'})} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black">دخول</button> : <button onClick={() => setState({...state, view: 'profile'})} className="font-bold text-slate-700">{state.currentUser.firstName}</button>}
            </div>
          )}
        </div>
      </nav>
      <main className="flex-grow">
        {state.view === 'landing' && <LandingHero onStart={(v) => setState({...state, view: v})} />}
        {state.view === 'search' && <SearchPage />}
        {state.view === 'login' && <AuthForm type="login" onSuccess={handleLoginSuccess} />}
        {state.view === 'register' && <AuthForm type="register" onSuccess={handleLoginSuccess} />}
        {state.view === 'admin-login' && <AuthForm type="admin" onSuccess={handleLoginSuccess} />}
        {state.view === 'admin' && <AdminDashboard onExit={handleLogout} />}
        {state.view === 'profile' && (
          <div className="max-w-2xl mx-auto my-20 bg-white p-12 rounded-[3rem] shadow-xl text-center border">
            <h2 className="text-3xl font-black mb-6">أهلاً بك {state.currentUser?.firstName} 👋</h2>
            <p className="text-slate-500 mb-8">ملفك الشخصي قيد التطوير. شكراً لانضمامك إلى سلكني.</p>
            <button onClick={handleLogout} className="bg-red-50 text-red-500 px-8 py-3 rounded-xl font-bold">تسجيل الخروج</button>
          </div>
        )}
      </main>
      {!isManagementView && (
        <footer className="bg-slate-900 text-white py-12 px-6 text-center mt-auto">
          <Logo size="sm" inverse />
          <p className="mt-4 text-slate-500 font-bold">سلكني - منصتكم الموثوقة للحرف والمهن 🇩🇿</p>
        </footer>
      )}
    </div>
  );
}
