
import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, AppState, User, Worker, Advertisement } from './types.ts';
import { SERVICE_CATEGORIES, WILAYAS, DAIRAS } from './constants.tsx';
import { supabase } from './lib/supabase.ts';

// --- Custom Styles ---
const GlobalStyles = () => (
  <style>{`
    @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
    .animate-float { animation: float 5s ease-in-out infinite; }
    .shimmer { position: relative; overflow: hidden; }
    .shimmer::after { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent); transform: rotate(45deg); animation: shimmer 3s infinite; }
    @keyframes shimmer { 0% { transform: translateX(-100%) rotate(45deg); } 100% { transform: translateX(100%) rotate(45deg); } }
    .arabic-text { font-family: 'Tajawal', sans-serif; }
    .loading-spinner { border: 4px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
  `}</style>
);

const Logo: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'sm' }) => (
  <div className={`flex items-center gap-3 group cursor-pointer transition-all duration-500 ${size === 'lg' ? 'scale-110 md:scale-125' : ''}`}>
    <div className={`relative ${size === 'lg' ? 'w-24 h-24' : 'w-12 h-12'} flex-shrink-0`}>
      <div className={`absolute inset-0 bg-gradient-to-tr from-emerald-600 via-teal-500 to-yellow-400 ${size === 'lg' ? 'rounded-[2.5rem]' : 'rounded-2xl'} rotate-3 group-hover:rotate-12 transition-transform duration-500 shadow-xl overflow-hidden`}>
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center text-white font-black ${size === 'lg' ? 'text-5xl' : 'text-2xl'} z-10 group-hover:scale-110 transition-transform`}>S</div>
    </div>
    <div className="flex flex-col items-start leading-none gap-0.5">
      <div className="flex items-baseline gap-1.5">
        <span className={`${size === 'lg' ? 'text-6xl md:text-8xl' : 'text-3xl'} font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-700`}>Salakni</span>
        <span className={`${size === 'lg' ? 'text-4xl' : 'text-xl'} arabic-text font-black text-yellow-500`}>سلكني</span>
      </div>
    </div>
  </div>
);

const LandingHero: React.FC<{ onStart: (v: AppState['view']) => void }> = ({ onStart }) => (
  <div className="relative min-h-[95vh] flex items-center justify-center text-white text-center p-6 overflow-hidden">
    <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
    <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 via-emerald-950/70 to-teal-900/80"></div>
    <div className="relative z-10 max-w-5xl animate-fade-in">
      <div className="mb-12 animate-float inline-block">
        <Logo size="lg" />
      </div>
      <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-tight">ريح بالك، <span className="text-emerald-400">سَلّكني</span> يسلكها</h1>
      <p className="text-xl md:text-3xl text-slate-300 mb-16 font-medium max-w-3xl mx-auto">المنصة الجزائرية رقم #1 لربط الحرفيين المهرة بالزبائن بكل ثقة وأمان. خدمتك في جيبك بضغطة زر.</p>
      <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
        <button onClick={() => onStart('search')} className="bg-emerald-600 px-16 py-6 rounded-[2.5rem] font-black text-2xl hover:bg-emerald-500 transition-all shadow-[0_20px_50px_rgba(16,185,129,0.3)] active:scale-95 group">
          اطلب خدمة الآن <span className="inline-block group-hover:translate-x-[-10px] transition-transform">🔍</span>
        </button>
        <button onClick={() => onStart('register')} className="bg-white/10 backdrop-blur-md px-16 py-6 rounded-[2.5rem] font-black text-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">
          سجل كحرفي 🛠️
        </button>
      </div>
      <div className="mt-24 grid grid-cols-3 gap-8 text-center border-t border-white/10 pt-12">
        <div><h4 className="text-4xl font-black text-emerald-400">50k+</h4><p className="text-slate-400 font-bold">حرفي موثق</p></div>
        <div><h4 className="text-4xl font-black text-yellow-400">58</h4><p className="text-slate-400 font-bold">ولاية مغطاة</p></div>
        <div><h4 className="text-4xl font-black text-teal-400">100k+</h4><p className="text-slate-400 font-bold">عملية ناجحة</p></div>
      </div>
    </div>
  </div>
);

const SearchPage: React.FC<{ user: User | null }> = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ wilaya: '', category: '', query: '' });

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('users').select('*').eq('role', UserRole.WORKER).eq('is_verified', true);
      
      if (filters.wilaya) query = query.eq('wilaya', filters.wilaya);
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.query) query = query.or(`first_name.ilike.%${filters.query}%,last_name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`);

      const { data, error } = await query;
      if (error) throw error;
      
      if (data) {
        setWorkers(data.map(w => ({
          ...w,
          firstName: w.first_name,
          lastName: w.last_name,
          location: { wilaya: w.wilaya, daira: w.daira },
          skills: w.skills || [],
          bio: w.bio || 'لا يوجد وصف حالياً.'
        })) as Worker[]);
      }
    } catch (e) {
      console.error("Worker Fetch Fail", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkers(); }, [filters.wilaya, filters.category]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-right">
      <div className="bg-emerald-900/5 p-12 rounded-[4rem] mb-16 border border-emerald-100 shadow-sm">
        <h2 className="text-4xl font-black mb-8">ابحث عن الحرفي المثالي 🔍</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <input 
            type="text" 
            placeholder="عن ماذا تبحث؟ (مثلاً: رصاص في العاصمة)" 
            className="md:col-span-2 p-5 bg-white border-2 border-emerald-50 rounded-3xl outline-none focus:border-emerald-500 font-bold"
            value={filters.query}
            onChange={e => setFilters({...filters, query: e.target.value})}
            onKeyPress={e => e.key === 'Enter' && fetchWorkers()}
          />
          <select 
            className="p-5 bg-white border-2 border-emerald-50 rounded-3xl outline-none focus:border-emerald-500 font-bold"
            value={filters.wilaya}
            onChange={e => setFilters({...filters, wilaya: e.target.value})}
          >
            <option value="">كل الولايات</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select 
            className="p-5 bg-white border-2 border-emerald-50 rounded-3xl outline-none focus:border-emerald-500 font-bold"
            value={filters.category}
            onChange={e => setFilters({...filters, category: e.target.value})}
          >
            <option value="">كل التخصصات</option>
            {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="mt-8 flex gap-4">
           <button onClick={fetchWorkers} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all">بحث</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-40"><div className="loading-spinner"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {workers.map(w => (
            <div key={w.id} className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-gray-100 group hover:-translate-y-2 transition-all flex flex-col">
              <div className="flex gap-6 items-center mb-8 flex-row-reverse">
                <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}&background=random&size=128`} className="w-24 h-24 rounded-3xl object-cover shadow-lg border-2 border-emerald-50" alt="" />
                <div className="text-right flex-1">
                  <h3 className="text-2xl font-black">{w.firstName} {w.lastName}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-row-reverse">
                    <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full">{w.category}</span>
                    <span className="text-yellow-500 font-bold text-sm">⭐ 4.9</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 line-clamp-3 mb-8 font-medium">{w.bio}</p>
              <div className="mt-auto pt-8 border-t border-gray-50 flex justify-between items-center flex-row-reverse">
                <span className="text-gray-500 font-bold flex items-center gap-1">📍 {w.location.wilaya}</span>
                <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-emerald-600 transition-colors shadow-lg">تواصل الآن</button>
              </div>
            </div>
          ))}
          {workers.length === 0 && (
            <div className="col-span-full text-center py-32">
              <div className="text-8xl mb-6 opacity-20">🔍</div>
              <p className="text-gray-400 text-2xl font-black">لم نجد حرفيين يطابقون بحثك حالياً.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AuthForm: React.FC<{ type: 'login' | 'register', onSuccess: (user: User) => void }> = ({ type, onSuccess }) => {
  const [formData, setFormData] = useState({
    phone: '', password: '', firstName: '', lastName: '', role: UserRole.SEEKER as UserRole,
    wilaya: 'الجزائر', daira: 'الجزائر', category: SERVICE_CATEGORIES[0].name
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.phone === '0777117663' && formData.password === 'vampirewahab31') {
      onSuccess({ id: 'admin-1', firstName: 'عبد الوهاب', lastName: 'المدير', phone: '0777117663', role: UserRole.ADMIN, location: { wilaya: 'الجزائر', daira: 'الجزائر' }, isVerified: true });
      return;
    }

    try {
      if (type === 'login') {
        const { data, error } = await supabase.from('users').select('*').eq('phone', formData.phone).eq('password', formData.password).single();
        if (error || !data) throw new Error("بيانات غير صحيحة");
        onSuccess({
          id: data.id, firstName: data.first_name, lastName: data.last_name, phone: data.phone,
          role: data.role as UserRole, location: { wilaya: data.wilaya, daira: data.daira }, isVerified: data.is_verified,
          avatar: data.avatar, bio: data.bio, category: data.category, skills: data.skills
        });
      } else {
        const { data, error } = await supabase.from('users').insert({
          first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone, password: formData.password,
          role: formData.role, wilaya: formData.wilaya, daira: formData.daira, category: formData.role === UserRole.WORKER ? formData.category : null,
          is_verified: formData.role === UserRole.SEEKER
        }).select().single();
        if (error) throw error;
        alert(formData.role === UserRole.WORKER ? "تم تسجيلك! طلبك قيد المراجعة من قبل الإدارة." : "تم التسجيل بنجاح!");
        onSuccess({
          id: data.id, firstName: data.first_name, lastName: data.last_name, phone: data.phone,
          role: data.role as UserRole, location: { wilaya: data.wilaya, daira: data.daira }, isVerified: data.is_verified
        });
      }
    } catch (err: any) {
      alert("حدث خطأ: " + (err.message || "يرجى المحاولة لاحقاً"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-20 p-14 bg-white rounded-[4rem] shadow-[0_30px_100px_rgba(0,0,0,0.1)] text-center border border-gray-50">
      <div className="mb-10"><Logo /></div>
      <h2 className="text-4xl font-black mb-10">{type === 'login' ? 'مرحباً بعودتك 👋' : 'انضم لعائلة سلكني 🚀'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {type === 'register' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" required placeholder="الاسم" className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-emerald-500 font-bold text-right" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input type="text" required placeholder="اللقب" className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-emerald-500 font-bold text-right" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
            <div className="flex bg-gray-100 p-2 rounded-3xl gap-2">
              <button type="button" onClick={() => setFormData({...formData, role: UserRole.SEEKER})} className={`flex-1 py-4 rounded-2xl font-black transition-all ${formData.role === UserRole.SEEKER ? 'bg-white shadow-md text-emerald-600' : 'text-gray-500'}`}>أبحث عن خدمة</button>
              <button type="button" onClick={() => setFormData({...formData, role: UserRole.WORKER})} className={`flex-1 py-4 rounded-2xl font-black transition-all ${formData.role === UserRole.WORKER ? 'bg-white shadow-md text-emerald-600' : 'text-gray-500'}`}>أنا حرفي</button>
            </div>
            {formData.role === UserRole.WORKER && (
              <select className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-emerald-500 font-bold text-right" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            )}
            <div className="grid grid-cols-2 gap-4">
               <select className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-emerald-500 font-bold text-right" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value, daira: DAIRAS[e.target.value][0]})}>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
               </select>
               <select className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-emerald-500 font-bold text-right" value={formData.daira} onChange={e => setFormData({...formData, daira: e.target.value})}>
                  {DAIRAS[formData.wilaya]?.map(d => <option key={d} value={d}>{d}</option>)}
               </select>
            </div>
          </>
        )}
        <input type="tel" required placeholder="رقم الهاتف (0xxxxxxxxx)" className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-emerald-500 font-black text-right tracking-widest" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        <input type="password" required placeholder="كلمة المرور" className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-emerald-500 font-black text-right" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
        <button type="submit" disabled={loading} className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black text-2xl shadow-xl hover:bg-emerald-700 transition-all active:scale-95 shimmer">
          {loading ? 'جاري المعالجة...' : type === 'login' ? 'دخول' : 'إنشاء حساب'}
        </button>
      </form>
    </div>
  );
};

const EditProfile: React.FC<{ user: User, onUpdate: (u: User) => void }> = ({ user, onUpdate }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [skills, setSkills] = useState(user.skills?.join(', ') || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const skillsArr = skills.split(',').map(s => s.trim()).filter(s => s);
      const { error } = await supabase.from('users').update({ bio, skills: skillsArr }).eq('id', user.id);
      if (error) throw error;
      onUpdate({ ...user, bio, skills: skillsArr });
      alert("تم تحديث الملف بنجاح!");
    } catch (err) {
      alert("خطأ في التحديث");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-20 p-16 bg-white rounded-[4rem] shadow-2xl text-right">
      <h2 className="text-4xl font-black mb-12">تعديل الملف الشخصي 🛠️</h2>
      <div className="space-y-8">
        <div>
          <label className="block text-xl font-black mb-4">التخصص: <span className="text-emerald-600">{user.category}</span></label>
        </div>
        <div>
          <label className="block text-xl font-black mb-4">المهارات (افصل بينها بفاصلة):</label>
          <input type="text" className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" value={skills} onChange={e => setSkills(e.target.value)} placeholder="مثلاً: صيانة الأنابيب، تركيب السخانات، تلحيم..." />
        </div>
        <div>
          <label className="text-xl font-black block mb-4">وصف الخدمة (Bio):</label>
          <textarea rows={6} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" value={bio} onChange={e => setBio(e.target.value)} placeholder="اكتب نبذة تجذب الزبائن..." />
        </div>
        <button onClick={handleSave} disabled={loading} className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black text-xl shadow-xl hover:bg-emerald-700">
          {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [unverifiedUsers, setUnverifiedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUnverified = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').eq('is_verified', false).eq('role', UserRole.WORKER);
      if (error) throw error;
      if (data) setUnverifiedUsers(data.map(u => ({ ...u, firstName: u.first_name, lastName: u.last_name, location: { wilaya: u.wilaya, daira: u.daira } })));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchUnverified(); }, []);

  const handleVerify = async (userId: string, status: boolean) => {
    try {
      const { error } = await supabase.from('users').update({ is_verified: status }).eq('id', userId);
      if (error) throw error;
      fetchUnverified();
    } catch (err) { alert("فشل تحديث الحالة"); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-12 text-right">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-16 flex-row-reverse">
          <h1 className="text-5xl font-black">لوحة الإدارة <span className="text-emerald-400">سلكني</span></h1>
          <button onClick={onExit} className="bg-white/10 px-8 py-3 rounded-2xl font-black hover:bg-white/20">خروج</button>
        </div>
        {loading ? <div className="loading-spinner mx-auto"></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {unverifiedUsers.map(u => (
              <div key={u.id} className="bg-slate-900 p-8 rounded-[3rem] border border-white/10 shadow-2xl">
                <h3 className="text-2xl font-black mb-2">{u.firstName} {u.lastName}</h3>
                <p className="text-emerald-400 font-bold mb-4">{u.category} | {u.location.wilaya}</p>
                <p className="text-slate-400 mb-8">{u.phone}</p>
                <div className="flex gap-4">
                  <button onClick={() => handleVerify(u.id, true)} className="flex-1 bg-emerald-600 py-4 rounded-2xl font-black">تفعيل ✅</button>
                  <button onClick={() => handleVerify(u.id, false)} className="px-8 bg-red-600/10 text-red-500 py-4 rounded-2xl font-black">حذف</button>
                </div>
              </div>
            ))}
            {unverifiedUsers.length === 0 && <p className="text-center col-span-full py-20 text-slate-500 font-bold">لا توجد طلبات توثيق معلقة.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<AppState>({ currentUser: null, workers: [], view: 'landing' });

  const handleNavigate = (view: AppState['view']) => {
    window.scrollTo(0, 0);
    setState(prev => ({ ...prev, view }));
  };
  
  const handleLoginSuccess = (user: User) => setState(prev => ({ ...prev, currentUser: user, view: user.role === UserRole.ADMIN ? 'admin' : 'search' }));
  const handleLogout = () => setState(prev => ({ ...prev, currentUser: null, view: 'landing' }));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden arabic-text selection:bg-emerald-200" dir="rtl">
      <GlobalStyles />
      {state.view !== 'admin' && (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100 h-24 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
            <div onClick={() => handleNavigate('landing')}><Logo /></div>
            <div className="hidden md:flex items-center gap-10">
              <button onClick={() => handleNavigate('landing')} className={`${state.view === 'landing' ? 'text-emerald-600 font-black' : 'text-gray-600'} hover:text-emerald-500 transition font-bold text-lg`}>الرئيسية</button>
              <button onClick={() => handleNavigate('search')} className={`${state.view === 'search' ? 'text-emerald-600 font-black' : 'text-gray-600'} hover:text-emerald-500 transition font-bold text-lg`}>تصفح الحرفيين</button>
              {!state.currentUser ? (
                <div className="flex items-center gap-4">
                  <button onClick={() => handleNavigate('login')} className="text-gray-600 hover:text-emerald-500 font-black text-lg">دخول</button>
                  <button onClick={() => handleNavigate('register')} className="bg-emerald-600 text-white px-10 py-3.5 rounded-2xl font-black shadow-[0_10px_30px_rgba(16,185,129,0.2)] hover:bg-emerald-500 active:scale-95 transition-all">انضم إلينا</button>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-gray-50 p-2 pr-5 rounded-3xl border border-gray-100 cursor-pointer group hover:bg-white transition-all shadow-sm" onClick={() => handleNavigate('profile')}>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-base font-black text-gray-800">{state.currentUser.firstName}</span>
                    <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{state.currentUser.role === UserRole.ADMIN ? 'مدير المنصة' : 'حسابي'}</span>
                  </div>
                  <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}&background=random`} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md" />
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
      
      <main className="flex-grow">
        {state.view === 'landing' && <LandingHero onStart={handleNavigate} />}
        {state.view === 'search' && <SearchPage user={state.currentUser} />}
        {state.view === 'profile' && state.currentUser && (
          <div className="max-w-4xl mx-auto my-20 p-16 bg-white rounded-[5rem] shadow-2xl text-center border border-gray-50">
            <div className="relative inline-block mb-10">
              <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}&size=256&background=random`} className="w-48 h-48 rounded-[4rem] mx-auto border-8 border-gray-50 shadow-2xl object-cover" />
              {state.currentUser.isVerified && <span className="absolute -bottom-2 -right-2 bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-xl border-4 border-white">✔</span>}
            </div>
            <h2 className="text-5xl font-black mb-4">{state.currentUser.firstName} {state.currentUser.lastName}</h2>
            <p className="text-emerald-600 font-black text-2xl mb-4 uppercase tracking-tighter">{state.currentUser.category || (state.currentUser.role === UserRole.SEEKER ? 'باحث عن خدمة' : 'حساب سلكني')}</p>
            <p className="text-gray-500 font-bold mb-12">📍 {state.currentUser.location.wilaya}، {state.currentUser.location.daira}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {state.currentUser.role === UserRole.WORKER && (
                <button onClick={() => handleNavigate('edit-profile')} className="px-10 py-5 bg-emerald-50 text-emerald-600 rounded-3xl font-black text-xl hover:bg-emerald-600 hover:text-white transition-all shadow-md">تعديل معلوماتي</button>
              )}
              <button onClick={handleLogout} className="px-10 py-5 bg-red-50 text-red-500 rounded-3xl font-black text-xl hover:bg-red-500 hover:text-white transition-all shadow-md">تسجيل الخروج 👋</button>
            </div>
          </div>
        )}
        {state.view === 'edit-profile' && state.currentUser && (
          <EditProfile user={state.currentUser} onUpdate={(u) => setState({...state, currentUser: u, view: 'profile'})} />
        )}
        {state.view === 'admin' && state.currentUser?.role === UserRole.ADMIN && <AdminDashboard onExit={() => handleNavigate('landing')} />}
        {(state.view === 'login' || state.view === 'register') && <AuthForm type={state.view} onSuccess={handleLoginSuccess} />}
      </main>

      {state.view !== 'admin' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:hidden">
          <div className="flex justify-around items-center h-24 pb-safe">
            <button onClick={() => handleNavigate('landing')} className={`flex flex-col items-center gap-1 px-8 ${state.view === 'landing' ? 'text-emerald-600 scale-110' : 'text-gray-400 opacity-60'} transition-all`}>
              <span className="text-3xl">🏠</span>
              <span className="text-[12px] font-black">الرئيسية</span>
            </button>
            <button onClick={() => handleNavigate('search')} className={`flex flex-col items-center gap-1 px-8 ${state.view === 'search' ? 'text-emerald-600 scale-110' : 'text-gray-400 opacity-60'} transition-all`}>
              <span className="text-3xl">🔍</span>
              <span className="text-[12px] font-black">تصفح</span>
            </button>
            <button onClick={() => state.currentUser ? handleNavigate('profile') : handleNavigate('register')} className={`flex flex-col items-center gap-1 px-8 ${state.view === 'profile' || state.view === 'register' ? 'text-emerald-600 scale-110' : 'text-gray-400 opacity-60'} transition-all`}>
              <span className="text-3xl">👤</span>
              <span className="text-[12px] font-black">{state.currentUser ? 'حسابي' : 'انضم'}</span>
            </button>
          </div>
        </div>
      )}

      <footer className="bg-slate-900 text-white py-20 px-6 mt-20 hidden md:block">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
           <div className="col-span-2">
             <Logo size="lg" />
             <p className="mt-8 text-slate-400 text-xl font-medium max-w-md">أكبر شبكة للحرفيين في الجزائر. نضمن لك الجودة، الأمان، والسرعة في التنفيذ.</p>
           </div>
           <div>
             <h4 className="text-2xl font-black mb-8">روابط سريعة</h4>
             <ul className="space-y-4 text-slate-400 font-bold">
               <li className="hover:text-emerald-400 cursor-pointer">عن سلكني</li>
               <li className="hover:text-emerald-400 cursor-pointer">انضم كحرفي</li>
               <li className="hover:text-emerald-400 cursor-pointer">سياسة الخصوصية</li>
               <li className="hover:text-emerald-400 cursor-pointer">اتصل بنا</li>
             </ul>
           </div>
           <div>
             <h4 className="text-2xl font-black mb-8">تواصل معنا</h4>
             <div className="flex gap-4 mb-8">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-colors">FB</div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-colors">IG</div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-colors">TW</div>
             </div>
             <p className="text-slate-400 font-bold">الجزائر، الجزائر 🇩🇿</p>
           </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/10 mt-20 pt-10 text-center text-slate-500 font-bold">
           جميع الحقوق محفوظة © {new Date().getFullYear()} سلكني (Salakni)
        </div>
      </footer>
    </div>
  );
}
