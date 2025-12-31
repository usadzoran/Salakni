
import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, AppState, User, Worker } from './types.ts';
import { SERVICE_CATEGORIES, WILAYAS, DAIRAS } from './constants.tsx';
import { supabase } from './lib/supabase.ts';

// --- أنماط مخصصة ---
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

const Logo: React.FC<{ size?: 'sm' | 'lg', onClick?: () => void }> = ({ size = 'sm', onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-3 group cursor-pointer transition-all duration-500 ${size === 'lg' ? 'scale-110 md:scale-125' : ''}`}>
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
    <div className="relative z-10 max-w-5xl">
      <div className="mb-12 animate-float inline-block">
        <Logo size="lg" />
      </div>
      <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-tight">ريح بالك، <span className="text-emerald-400">سَلّكني</span> يسلكها</h1>
      <p className="text-xl md:text-3xl text-slate-300 mb-16 font-medium max-w-3xl mx-auto">المنصة الجزائرية رقم #1 لربط الحرفيين المهرة بالزبائن بكل ثقة وأمان. خدمتك في جيبك بضغطة زر.</p>
      <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
        <button onClick={() => onStart('search')} className="bg-emerald-600 px-16 py-6 rounded-[2.5rem] font-black text-2xl hover:bg-emerald-500 transition-all shadow-xl active:scale-95 group">
          اطلب خدمة الآن 🔍
        </button>
        <button onClick={() => onStart('register')} className="bg-white/10 backdrop-blur-md px-16 py-6 rounded-[2.5rem] font-black text-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">
          سجل كحرفي 🛠️
        </button>
      </div>
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
          rating: 4.8 + Math.random() * 0.2, // محاكاة تقييم
          completedJobs: Math.floor(Math.random() * 50) + 10
        })) as Worker[]);
      }
    } catch (e) {
      console.error("خطأ في جلب البيانات:", e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-right">
      <div className="bg-emerald-900/5 p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] mb-16 border border-emerald-100 shadow-sm">
        <h2 className="text-3xl md:text-4xl font-black mb-8">ابحث عن الحرفي المثالي 🔍</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <input 
            type="text" 
            placeholder="عن ماذا تبحث؟" 
            className="md:col-span-2 p-5 bg-white border-2 border-emerald-50 rounded-3xl outline-none focus:border-emerald-500 font-bold"
            value={filters.query}
            onChange={e => setFilters({...filters, query: e.target.value})}
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
      </div>

      {loading ? (
        <div className="flex justify-center py-40"><div className="loading-spinner"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {workers.map(w => (
            <div key={w.id} className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 group hover:-translate-y-2 transition-all flex flex-col">
              <div className="flex gap-6 items-center mb-6 flex-row-reverse">
                <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}+${w.lastName}&background=random&size=128`} className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-emerald-50" alt="" />
                <div className="text-right flex-1">
                  <h3 className="text-xl font-black">{w.firstName} {w.lastName}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-row-reverse">
                    <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full">{w.category}</span>
                    <span className="text-yellow-500 font-bold text-xs">⭐ {w.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 line-clamp-3 mb-6 font-medium leading-relaxed">{w.bio}</p>
              <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-center flex-row-reverse">
                <span className="text-gray-500 font-bold text-sm">📍 {w.location.wilaya}</span>
                <button className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-emerald-600 transition-colors">تواصل الآن</button>
              </div>
            </div>
          ))}
          {workers.length === 0 && (
            <div className="col-span-full text-center py-32">
              <p className="text-gray-400 text-2xl font-black">لا يوجد حرفيون يطابقون بحثك حالياً.</p>
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

    // حساب المدير التجريبي
    if (formData.phone === '0777117663' && formData.password === 'vampirewahab31') {
      onSuccess({ id: 'admin-1', firstName: 'عبد الوهاب', lastName: 'المدير', phone: '0777117663', role: UserRole.ADMIN, location: { wilaya: 'الجزائر', daira: 'الجزائر' }, isVerified: true });
      return;
    }

    try {
      if (type === 'login') {
        const { data, error } = await supabase.from('users').select('*').eq('phone', formData.phone).eq('password', formData.password).single();
        if (error || !data) throw new Error("رقم الهاتف أو كلمة المرور غير صحيحة");
        
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
        
        if (error) {
          if (error.code === '23505') throw new Error("رقم الهاتف مسجل بالفعل");
          throw error;
        }

        alert(formData.role === UserRole.WORKER ? "تم تسجيلك بنجاح! حسابك قيد المراجعة." : "تم إنشاء الحساب بنجاح!");
        onSuccess({
          id: data.id, firstName: data.first_name, lastName: data.last_name, phone: data.phone,
          role: data.role as UserRole, location: { wilaya: data.wilaya, daira: data.daira }, isVerified: data.is_verified
        });
      }
    } catch (err: any) {
      alert(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-12 p-8 md:p-12 bg-white rounded-[3rem] shadow-2xl text-center border border-gray-50">
      <h2 className="text-3xl font-black mb-8">{type === 'login' ? 'مرحباً بعودتك 👋' : 'انضم إلينا 🚀'}</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        {type === 'register' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" required placeholder="الاسم" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-right" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input type="text" required placeholder="اللقب" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-right" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
            <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-2">
              <button type="button" onClick={() => setFormData({...formData, role: UserRole.SEEKER})} className={`flex-1 py-3 rounded-xl font-black transition-all ${formData.role === UserRole.SEEKER ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}>أبحث عن خدمة</button>
              <button type="button" onClick={() => setFormData({...formData, role: UserRole.WORKER})} className={`flex-1 py-3 rounded-xl font-black transition-all ${formData.role === UserRole.WORKER ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}>أنا حرفي</button>
            </div>
            {formData.role === UserRole.WORKER && (
              <select className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-right" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            )}
            <div className="grid grid-cols-2 gap-4">
               <select className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-right" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value, daira: DAIRAS[e.target.value][0]})}>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
               </select>
               <select className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-right" value={formData.daira} onChange={e => setFormData({...formData, daira: e.target.value})}>
                  {DAIRAS[formData.wilaya]?.map(d => <option key={d} value={d}>{d}</option>)}
               </select>
            </div>
          </>
        )}
        <input type="tel" required placeholder="رقم الهاتف" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 font-black text-right" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        <input type="password" required placeholder="كلمة المرور" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 font-black text-right" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
        <button type="submit" disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95">
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
      alert("فشل تحديث البيانات في قاعدة البيانات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-12 p-10 bg-white rounded-[3rem] shadow-xl text-right">
      <h2 className="text-3xl font-black mb-8">تعديل الملف الشخصي 🛠️</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-lg font-black mb-2 text-gray-700">التخصص الحالي:</label>
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-bold">{user.category || 'غير محدد'}</div>
        </div>
        <div>
          <label className="block text-lg font-black mb-2 text-gray-700">المهارات (افصل بينها بفاصلة):</label>
          <input type="text" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" value={skills} onChange={e => setSkills(e.target.value)} placeholder="مثلاً: صيانة، تركيب، تلحيم..." />
        </div>
        <div>
          <label className="block text-lg font-black mb-2 text-gray-700">وصف الخدمة:</label>
          <textarea rows={5} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" value={bio} onChange={e => setBio(e.target.value)} placeholder="اكتب نبذة تجذب الزبائن..." />
        </div>
        <button onClick={handleSave} disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xl shadow-lg hover:bg-emerald-700">
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
      if (data) {
        setUnverifiedUsers(data.map(u => ({
          ...u,
          firstName: u.first_name,
          lastName: u.last_name,
          location: { wilaya: u.wilaya, daira: u.daira }
        })));
      }
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
    <div className="min-h-screen bg-slate-950 text-white p-8 md:p-12 text-right">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-12 flex-row-reverse">
          <h1 className="text-4xl font-black">لوحة الإدارة 🔐</h1>
          <button onClick={onExit} className="bg-white/10 px-6 py-2 rounded-xl font-black hover:bg-white/20 transition-all">خروج</button>
        </div>
        {loading ? <div className="loading-spinner mx-auto"></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {unverifiedUsers.map(u => (
              <div key={u.id} className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 shadow-2xl">
                <h3 className="text-xl font-black mb-1">{u.firstName} {u.lastName}</h3>
                <p className="text-emerald-400 font-bold text-sm mb-4">{u.category} | {u.location.wilaya}</p>
                <p className="text-slate-500 mb-6 text-sm">{u.phone}</p>
                <div className="flex gap-3">
                  <button onClick={() => handleVerify(u.id, true)} className="flex-1 bg-emerald-600 py-3 rounded-xl font-black text-sm">تفعيل ✅</button>
                  <button onClick={() => handleVerify(u.id, false)} className="px-6 bg-red-600/10 text-red-500 py-3 rounded-xl font-black text-sm">حذف</button>
                </div>
              </div>
            ))}
            {unverifiedUsers.length === 0 && <p className="text-center col-span-full py-20 text-slate-500 font-bold">لا توجد طلبات توثيق حالياً.</p>}
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
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden arabic-text" dir="rtl">
      <GlobalStyles />
      {state.view !== 'admin' && (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100 h-20 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
            <Logo onClick={() => handleNavigate('landing')} />
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => handleNavigate('landing')} className={`${state.view === 'landing' ? 'text-emerald-600 font-black' : 'text-gray-500'} hover:text-emerald-500 transition font-bold`}>الرئيسية</button>
              <button onClick={() => handleNavigate('search')} className={`${state.view === 'search' ? 'text-emerald-600 font-black' : 'text-gray-500'} hover:text-emerald-500 transition font-bold`}>تصفح الحرفيين</button>
              {!state.currentUser ? (
                <button onClick={() => handleNavigate('register')} className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-black shadow-md hover:bg-emerald-500 transition-all">انضم إلينا</button>
              ) : (
                <div className="flex items-center gap-3 bg-gray-50 p-1.5 pr-4 rounded-2xl border border-gray-100 cursor-pointer hover:bg-white transition-all" onClick={() => handleNavigate('profile')}>
                  <span className="text-sm font-black text-gray-800">{state.currentUser.firstName}</span>
                  <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}&background=random`} className="w-10 h-10 rounded-xl object-cover" />
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
      
      <main className="flex-grow">
        {state.view === 'landing' && <LandingHero onStart={handleNavigate} />}
        {state.view === 'search' && <SearchPage />}
        {state.view === 'profile' && state.currentUser && (
          <div className="max-w-3xl mx-auto my-12 p-10 md:p-16 bg-white rounded-[3rem] shadow-2xl text-center border border-gray-50">
            <div className="relative inline-block mb-8">
              <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}&size=256&background=random`} className="w-40 h-40 rounded-[2.5rem] mx-auto border-4 border-gray-50 shadow-lg object-cover" />
              {state.currentUser.isVerified && <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg border-2 border-white">✔</span>}
            </div>
            <h2 className="text-3xl font-black mb-2">{state.currentUser.firstName} {state.currentUser.lastName}</h2>
            <p className="text-emerald-600 font-black text-xl mb-6">{state.currentUser.category || (state.currentUser.role === UserRole.SEEKER ? 'باحث عن خدمة' : 'مدير')}</p>
            <p className="text-gray-400 font-bold mb-10">📍 {state.currentUser.location.wilaya}، {state.currentUser.location.daira}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {state.currentUser.role === UserRole.WORKER && (
                <button onClick={() => handleNavigate('edit-profile')} className="px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black hover:bg-emerald-600 hover:text-white transition-all">تعديل الملف الشخصي</button>
              )}
              <button onClick={handleLogout} className="px-8 py-4 bg-red-50 text-red-500 rounded-2xl font-black hover:bg-red-500 hover:text-white transition-all">خروج</button>
            </div>
          </div>
        )}
        {state.view === 'edit-profile' && state.currentUser && (
          <EditProfile user={state.currentUser} onUpdate={(u) => setState({...state, currentUser: u, view: 'profile'})} />
        )}
        {state.view === 'admin' && state.currentUser?.role === UserRole.ADMIN && <AdminDashboard onExit={() => handleNavigate('landing')} />}
        {(state.view === 'login' || state.view === 'register') && <AuthForm type={state.view} onSuccess={handleLoginSuccess} />}
      </main>

      <footer className="bg-slate-900 text-white py-12 px-6 text-center">
        <div className="max-w-7xl mx-auto">
          <Logo onClick={() => handleNavigate('landing')} />
          <p className="mt-4 text-slate-400 font-medium">أكبر شبكة للحرفيين في الجزائر 🇩🇿</p>
          <div className="border-t border-white/5 mt-10 pt-8 text-slate-500 font-bold">
            جميع الحقوق محفوظة © {new Date().getFullYear()} سلكني
          </div>
        </div>
      </footer>
    </div>
  );
}
