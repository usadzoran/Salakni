
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserRole, AppState, User, Worker } from './types.ts';
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
  `}</style>
);

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
      console.error("خطأ في جلب البيانات:", e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 text-right">
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

      {loading ? (
        <div className="flex justify-center py-20 md:py-40"><div className="loading-spinner"></div></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
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
              
              {w.portfolio && w.portfolio.length > 0 && (
                <div className="flex gap-2 mb-6 flex-row-reverse overflow-hidden">
                  {w.portfolio.slice(0, 3).map((img, idx) => (
                    <img key={idx} src={img} className="w-12 h-12 rounded-lg object-cover border border-gray-100" alt="work" />
                  ))}
                  {w.portfolio.length > 3 && (
                    <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-400">+{w.portfolio.length - 3}</div>
                  )}
                </div>
              )}

              <div className="mt-auto pt-4 md:pt-6 border-t border-gray-50 flex justify-between items-center flex-row-reverse">
                <span className="text-gray-500 font-bold text-xs md:text-sm">📍 {w.location.wilaya}</span>
                <button className="bg-slate-900 text-white px-4 md:px-6 py-2 rounded-xl font-black text-[10px] md:text-xs hover:bg-emerald-600 transition-colors">تواصل الآن</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AuthForm: React.FC<{ type: 'login' | 'register' | 'admin', onSuccess: (user: User) => void }> = ({ type, onSuccess }) => {
  const [formData, setFormData] = useState({
    phone: '', password: '', firstName: '', lastName: '', role: UserRole.SEEKER as UserRole,
    wilaya: 'الجزائر', daira: 'الجزائر', category: SERVICE_CATEGORIES[0].name
  });
  const [loading, setLoading] = useState(false);

  const isAdminMode = type === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // التحقق الصارم من بيانات دخول الإدارة
    if (formData.phone === '0777117663' && formData.password === 'vampirewahab31') {
      const adminUser: User = { 
        id: 'admin-1', 
        firstName: 'عبد الوهاب', 
        lastName: 'المدير', 
        phone: '0777117663', 
        role: UserRole.ADMIN, 
        location: { wilaya: 'الجزائر', daira: 'الجزائر' }, 
        isVerified: true 
      };
      localStorage.setItem('user', JSON.stringify(adminUser));
      onSuccess(adminUser);
      return;
    }

    if (isAdminMode) {
      alert("عذراً، بيانات الدخول غير صحيحة لبوابة الإدارة.");
      setLoading(false);
      return;
    }

    try {
      if (type === 'login') {
        const { data, error } = await supabase.from('users').select('*').eq('phone', formData.phone).eq('password', formData.password).single();
        if (error || !data) throw new Error("رقم الهاتف أو كلمة المرور غير صحيحة");
        
        if (data.role === UserRole.ADMIN) {
           throw new Error("يرجى استخدام بوابة الإدارة الخاصة للدخول بصلاحيات المدير.");
        }

        const loggedInUser: User = {
          id: data.id, firstName: data.first_name, lastName: data.last_name, phone: data.phone,
          role: data.role as UserRole, location: { wilaya: data.wilaya, daira: data.daira }, isVerified: data.is_verified,
          avatar: data.avatar, bio: data.bio, category: data.category, skills: data.skills, portfolio: data.portfolio
        };
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        onSuccess(loggedInUser);
      } else {
        const { data, error } = await supabase.from('users').insert({
          first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone, password: formData.password,
          role: formData.role, wilaya: formData.wilaya, daira: formData.daira, category: formData.role === UserRole.WORKER ? formData.category : null,
          is_verified: formData.role === UserRole.SEEKER, portfolio: []
        }).select().single();
        
        if (error) {
          if (error.code === '23505') throw new Error("رقم الهاتف مسجل بالفعل");
          throw error;
        }

        const registeredUser: User = {
          id: data.id, firstName: data.first_name, lastName: data.last_name, phone: data.phone,
          role: data.role as UserRole, location: { wilaya: data.wilaya, daira: data.daira }, isVerified: data.is_verified, portfolio: []
        };
        localStorage.setItem('user', JSON.stringify(registeredUser));
        onSuccess(registeredUser);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-xl mx-auto my-8 md:my-12 px-4 md:px-0 ${isAdminMode ? 'pt-10' : ''}`}>
      <div className={`p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl text-center border transition-all duration-500 ${isAdminMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-gray-50'}`}>
        <h2 className="text-2xl md:text-3xl font-black mb-8">
          {isAdminMode ? 'بوابة الإدارة المركزية 🔒' : type === 'login' ? 'مرحباً بعودتك 👋' : 'انضم إلينا 🚀'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          {type === 'register' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" required placeholder="الاسم" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-right text-gray-900" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <input type="text" required placeholder="اللقب" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-right text-gray-900" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-2">
                <button type="button" onClick={() => setFormData({...formData, role: UserRole.SEEKER})} className={`flex-1 py-3 rounded-xl font-black text-sm md:text-base transition-all ${formData.role === UserRole.SEEKER ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}>أبحث عن خدمة</button>
                <button type="button" onClick={() => setFormData({...formData, role: UserRole.WORKER})} className={`flex-1 py-3 rounded-xl font-black text-sm md:text-base transition-all ${formData.role === UserRole.WORKER ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}>أنا حرفي</button>
              </div>
            </>
          )}
          <input type="tel" required placeholder="رقم الهاتف" className={`w-full p-4 border-2 rounded-2xl outline-none focus:border-emerald-500 font-black text-right ${isAdminMode ? 'bg-slate-800 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input type="password" required placeholder="كلمة المرور" className={`w-full p-4 border-2 rounded-2xl outline-none focus:border-emerald-500 font-black text-right ${isAdminMode ? 'bg-slate-800 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <button type="submit" disabled={loading} className={`w-full py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl shadow-lg active:scale-95 transition-all ${isAdminMode ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
            {loading ? 'جاري التحقق...' : isAdminMode ? 'دخول المدير' : type === 'login' ? 'دخول' : 'إنشاء حساب'}
          </button>
          {isAdminMode && (
             <button type="button" onClick={() => window.location.hash = ''} className="text-slate-400 text-sm font-bold hover:text-white transition-colors mt-4">عودة للموقع</button>
          )}
        </form>
      </div>
    </div>
  );
};

const EditProfile: React.FC<{ user: User, onUpdate: (u: User) => void }> = ({ user, onUpdate }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [skills, setSkills] = useState(user.skills?.join(', ') || '');
  const [portfolio, setPortfolio] = useState<string[]>(user.portfolio || []);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (portfolio.length + files.length > 5) { alert("5 صور كحد أقصى."); return; }
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      const base64 = await new Promise<string>(resolve => { reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(files[i]); });
      newImages.push(base64);
    }
    setPortfolio([...portfolio, ...newImages]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const skillsArr = skills.split(',').map(s => s.trim()).filter(s => s);
      const { error } = await supabase.from('users').update({ bio, skills: skillsArr, portfolio }).eq('id', user.id);
      if (error) throw error;
      onUpdate({ ...user, bio, skills: skillsArr, portfolio });
      alert("تم الحفظ بنجاح!");
    } catch (err) { alert("حدث خطأ أثناء الحفظ"); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto my-8 md:my-12 px-4 md:px-0">
      <div className="p-8 md:p-10 bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl text-right">
        <h2 className="text-2xl font-black mb-8 text-emerald-950">تعديل ملفك الحرفي 🛠️</h2>
        <div className="space-y-6 text-gray-900">
          <div>
            <label className="block text-sm font-black mb-2">نبذة عنك (تجذب الزبائن):</label>
            <textarea rows={4} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-emerald-500 outline-none" value={bio} onChange={e => setBio(e.target.value)} placeholder="مثلاً: خبرة 10 سنوات في صيانة المنازل..." />
          </div>
          <div>
            <label className="block text-sm font-black mb-2">مهاراتك (افصل بينها بفاصلة):</label>
            <input type="text" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-emerald-500 outline-none" value={skills} onChange={e => setSkills(e.target.value)} placeholder="مثلاً: تركيب، تلحيم، صيانة..." />
          </div>
          <div>
             <label className="block text-sm font-black mb-4">معرض أعمالك (صور العمل):</label>
            <div className="portfolio-grid mb-4">
              {portfolio.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-emerald-50 group">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => setPortfolio(portfolio.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center shadow-lg">✕</button>
                </div>
              ))}
              {portfolio.length < 5 && (
                <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-emerald-200 text-emerald-400 hover:bg-emerald-50 transition-colors flex flex-col items-center justify-center">
                   <span className="text-2xl font-black">+</span>
                   <span className="text-[10px] font-bold">إضافة</span>
                </button>
              )}
            </div>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
          <button onClick={handleSave} disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all text-xl">
             {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
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
      const { data } = await supabase.from('users').select('*').eq('is_verified', false).eq('role', UserRole.WORKER);
      if (data) setUnverifiedUsers(data.map(u => ({ ...u, firstName: u.first_name, lastName: u.last_name, location: { wilaya: u.wilaya, daira: u.daira } })));
    } catch (err) { } finally { setLoading(false); }
  };

  useEffect(() => { fetchUnverified(); }, []);

  const handleVerify = async (userId: string, status: boolean) => {
    await supabase.from('users').update({ is_verified: status }).eq('id', userId);
    fetchUnverified();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-12 text-right">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10 flex-row-reverse border-b border-white/10 pb-6">
          <h1 className="text-2xl md:text-4xl font-black">لوحة الإدارة المركزية 🔒</h1>
          <button onClick={onExit} className="bg-white/10 px-6 py-2 rounded-xl font-black hover:bg-white/20 transition-all text-sm border border-white/5">تسجيل خروج</button>
        </div>
        {loading ? <div className="loading-spinner mx-auto mt-20"></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-10">
            {unverifiedUsers.map(u => (
              <div key={u.id} className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 shadow-2xl hover:border-emerald-500/30 transition-all">
                <div className="flex justify-between items-start mb-4 flex-row-reverse">
                  <div>
                    <h3 className="text-xl font-black mb-1">{u.firstName} {u.lastName}</h3>
                    <p className="text-emerald-400 font-bold text-sm">{u.category} | {u.location.wilaya}</p>
                  </div>
                  <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-lg text-xs font-bold">قيد الانتظار</span>
                </div>
                <p className="text-slate-400 mb-6 text-sm">رقم الهاتف: {u.phone}</p>
                <div className="flex gap-3">
                  <button onClick={() => handleVerify(u.id, true)} className="flex-1 bg-emerald-600 py-3 rounded-xl font-black text-sm hover:bg-emerald-500">تفعيل الحساب ✅</button>
                  <button onClick={() => handleVerify(u.id, false)} className="px-6 bg-red-600/10 text-red-500 py-3 rounded-xl font-black text-sm hover:bg-red-500 hover:text-white transition-all">رفض</button>
                </div>
              </div>
            ))}
            {unverifiedUsers.length === 0 && (
              <div className="col-span-full py-32 text-center bg-slate-900/50 rounded-[3rem] border border-dashed border-white/5">
                 <p className="text-slate-500 font-bold text-xl">لا توجد طلبات توثيق جديدة حالياً.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const initialUser = JSON.parse(localStorage.getItem('user')) || null;
  const [state, setState] = useState<AppState>({ currentUser: initialUser, workers: [], view: 'landing' });
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#/admin-portal') {
        setState(prev => ({ ...prev, view: 'admin-login' }));
      } else if (window.location.hash === '') {
        // إذا مسح الهاتش نرجعه للرئيسية إلا إذا كان مسجل دخول إدارة
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
    setState(prev => ({ 
      ...prev, 
      currentUser: user, 
      view: user.role === UserRole.ADMIN ? 'admin' : 'profile' 
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.hash = '';
    setState(prev => ({ ...prev, currentUser: null, view: 'landing' }));
  };

  const isManagementView = state.view === 'admin' || state.view === 'admin-login';

  // منع الدخول للوحة الإدارة بدون تسجيل دخول كأدمن
  if (state.view === 'admin' && state.currentUser?.role !== UserRole.ADMIN) {
     window.location.hash = '#/admin-portal';
     return null;
  }

  return (
    <div className={`min-h-screen flex flex-col overflow-x-hidden arabic-text transition-colors duration-700 ${isManagementView ? 'bg-slate-950' : 'bg-gray-50'}`} dir="rtl">
      <GlobalStyles />
      
      {selectedImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md cursor-zoom-out" onClick={() => setSelectedImg(null)}>
          <img src={selectedImg} className="max-w-[95%] max-h-[90%] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" alt="" />
          <button className="absolute top-8 right-8 text-white text-4xl font-black">✕</button>
        </div>
      )}

      {/* شريط التنقل - يختفي تماماً في لوحة الإدارة لضمان الفصل */}
      {state.view !== 'admin' && (
        <nav className={`sticky top-0 z-50 backdrop-blur-xl shadow-sm border-b h-16 md:h-24 flex items-center px-4 md:px-6 transition-colors duration-500 ${isManagementView ? 'bg-slate-900/95 border-white/5' : 'bg-white/95 border-gray-100'}`}>
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
            <Logo onClick={() => handleNavigate('landing')} inverse={isManagementView} />
            
            {state.view !== 'admin-login' && (
              <div className="hidden lg:flex items-center gap-10">
                <button onClick={() => handleNavigate('landing')} className={`${state.view === 'landing' ? 'text-emerald-600 font-black' : 'text-gray-500'} hover:text-emerald-500 transition font-bold text-lg`}>الرئيسية</button>
                <button onClick={() => handleNavigate('search')} className={`${state.view === 'search' ? 'text-emerald-600 font-black' : 'text-gray-500'} hover:text-emerald-500 transition font-bold text-lg`}>تصفح الحرفيين</button>
              </div>
            )}

            <div className="flex items-center gap-2 md:gap-3">
              {!state.currentUser ? (
                <div className="flex items-center gap-1.5 md:gap-4">
                  {state.view !== 'admin-login' && (
                    <>
                      <button onClick={() => handleNavigate('login')} className="text-gray-600 hover:text-emerald-500 font-bold text-sm md:text-base px-2">دخول</button>
                      <button onClick={() => handleNavigate('register')} className="bg-emerald-600 text-white px-5 md:px-8 py-2 md:py-2.5 rounded-xl font-black shadow-lg hover:bg-emerald-500 text-xs md:text-base transition-all active:scale-95">انضم إلينا</button>
                    </>
                  )}
                </div>
              ) : (
                <div className={`flex items-center gap-2 md:gap-3 p-1 md:p-1.5 pr-3 md:pr-4 rounded-xl md:rounded-2xl border cursor-pointer hover:shadow-md transition-all ${isManagementView ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`} onClick={() => handleNavigate('profile')}>
                  <div className="flex flex-col items-start leading-none">
                    <span className={`text-xs md:text-sm font-black ${isManagementView ? 'text-white' : 'text-gray-800'}`}>{state.currentUser.firstName}</span>
                    <span className="text-[8px] md:text-[10px] text-emerald-600 font-black uppercase tracking-widest">{state.currentUser.role === UserRole.ADMIN ? 'المشرف' : 'حسابي'}</span>
                  </div>
                  <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}&background=random`} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl object-cover border-2 border-white shadow-sm" />
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
          <div className="max-w-4xl mx-auto my-8 md:my-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border overflow-hidden ${isManagementView ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-gray-50 text-gray-900'}`}>
              <div className="p-8 md:p-16 text-center">
                <div className="relative inline-block mb-8">
                  <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}&size=256&background=random`} className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] mx-auto border-4 border-emerald-50 shadow-2xl object-cover" />
                  {state.currentUser.isVerified && state.currentUser.role === UserRole.WORKER && (
                    <span className="absolute -bottom-2 -right-2 bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg border-2 border-white">✔</span>
                  )}
                </div>
                <h2 className="text-3xl md:text-5xl font-black mb-3">{state.currentUser.firstName} {state.currentUser.lastName}</h2>
                <p className="text-emerald-500 font-black text-xl mb-4">{state.currentUser.category || (state.currentUser.role === UserRole.ADMIN ? 'مدير النظام' : 'عضو في سلكني')}</p>
                <p className="text-gray-400 font-bold mb-10 text-lg">📍 {state.currentUser.location.wilaya}، {state.currentUser.location.daira}</p>
                
                {state.currentUser.role === UserRole.WORKER && (
                  <div className="text-right mt-12 mb-12 pt-12 border-t border-gray-50">
                    <h3 className="text-2xl font-black mb-8">نموذج من أعمالي 📸</h3>
                    {state.currentUser.portfolio && state.currentUser.portfolio.length > 0 ? (
                      <div className="portfolio-grid">
                        {state.currentUser.portfolio.map((img, idx) => (
                          <div key={idx} className="aspect-square rounded-[2rem] overflow-hidden border-2 border-emerald-50 cursor-zoom-in hover:scale-105 transition-transform" onClick={() => setSelectedImg(img)}>
                            <img src={img} className="w-full h-full object-cover" alt="Portfolio item" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-16 rounded-[3rem] text-center border-2 border-dashed border-gray-100">
                        <p className="text-gray-400 font-bold text-lg">لم تقم بإضافة صور لأعمالك حتى الآن.</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-gray-50/5 mt-4">
                  {state.currentUser.role === UserRole.ADMIN && (
                     <button onClick={() => handleNavigate('admin')} className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-500 transition-all text-lg">دخول لوحة الإدارة ⚡</button>
                  )}
                  {state.currentUser.role === UserRole.WORKER && (
                    <button onClick={() => handleNavigate('edit-profile')} className="px-10 py-5 bg-emerald-50 text-emerald-600 rounded-2xl font-black hover:bg-emerald-600 hover:text-white transition-all text-lg">تعديل ملفي</button>
                  )}
                  <button onClick={handleLogout} className="px-10 py-5 bg-red-50 text-red-500 rounded-2xl font-black hover:bg-red-500 hover:text-white transition-all text-lg">تسجيل الخروج</button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {state.view === 'edit-profile' && state.currentUser && (
          <EditProfile user={state.currentUser} onUpdate={(u) => setState({...state, currentUser: u, view: 'profile'})} />
        )}
        {state.view === 'admin' && state.currentUser?.role === UserRole.ADMIN && <AdminDashboard onExit={handleLogout} />}
        {(state.view === 'login' || state.view === 'register') && <AuthForm type={state.view} onSuccess={handleLoginSuccess} />}
      </main>

      {!isManagementView && (
        <footer className="bg-slate-900 text-white py-12 md:py-16 px-4 text-center mt-12">
          <div className="max-w-7xl mx-auto">
            <Logo onClick={() => handleNavigate('landing')} inverse />
            <p className="mt-6 text-slate-400 font-medium text-lg max-w-lg mx-auto leading-relaxed">المنصة الأسرع والأكثر أماناً لربط الحرفيين بزبائنهم في جميع أنحاء الوطن 🇩🇿</p>
            <div className="flex justify-center gap-6 mt-10 opacity-50">
               <span className="text-sm font-bold">فيسبوك</span>
               <span className="text-sm font-bold">انستغرام</span>
               <span className="text-sm font-bold">تيك توك</span>
            </div>
            <div className="border-t border-white/5 mt-12 pt-10 text-slate-500 font-bold text-sm">
              حقوق النشر محفوظة © {new Date().getFullYear()} سلكني | الجزائر
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
