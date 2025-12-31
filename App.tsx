
import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, AppState, User, Worker, Advertisement } from './types.ts';
import { SERVICE_CATEGORIES, WILAYAS, DAIRAS } from './constants.tsx';
import { getAIRecommendation } from './services/gemini.ts';
import { supabase } from './lib/supabase.ts';

// --- Custom Styles ---
const GlobalStyles = () => (
  <style>{`
    @keyframes float { 0% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } 100% { transform: translateY(0px) rotate(0deg); } }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .shimmer { position: relative; overflow: hidden; }
    .shimmer::after { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent); transform: rotate(45deg); animation: shimmer 3s infinite; }
    @keyframes shimmer { 0% { transform: translateX(-100%) rotate(45deg); } 100% { transform: translateX(100%) rotate(45deg); } }
    .arabic-text { font-family: 'Tajawal', sans-serif; }
    .admin-glass { background: rgba(15, 23, 42, 0.98); backdrop-filter: blur(25px); }
    .loading-spinner { border: 4px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `}</style>
);

// --- Ad Renderer Component ---
const AdRenderer: React.FC<{ location: Advertisement['location'], ads: Advertisement[] }> = ({ location, ads }) => {
  const activeAds = ads.filter(ad => ad.location === location && ad.is_active);
  if (activeAds.length === 0) return null;
  return (
    <div className="flex flex-col gap-4 my-6">
      {activeAds.map(ad => (
        <div key={ad.id} className="w-full overflow-hidden rounded-3xl shadow-sm border border-emerald-100/50 bg-white" dangerouslySetInnerHTML={{ __html: ad.content || '' }} />
      ))}
    </div>
  );
};

// --- Logo Component ---
const Logo: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'sm' }) => (
  <div className={`flex items-center gap-3 group cursor-pointer transition-all duration-500 ${size === 'lg' ? 'scale-110 md:scale-125' : ''}`}>
    <div className={`relative ${size === 'lg' ? 'w-24 h-24' : 'w-12 h-12'} flex-shrink-0`}>
      <div className={`absolute inset-0 bg-gradient-to-tr from-emerald-600 via-teal-500 to-yellow-400 ${size === 'lg' ? 'rounded-[2.5rem]' : 'rounded-2xl'} rotate-3 group-hover:rotate-12 transition-transform duration-500 shadow-xl overflow-hidden`}>
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center text-white font-black ${size === 'lg' ? 'text-5xl' : 'text-2xl'} z-10 group-hover:scale-110 transition-transform`}>S</div>
    </div>
    <div className="flex flex-col items-start leading-none gap-0.5 text-right">
      <div className="flex items-baseline gap-1.5 flex-row-reverse">
        <span className={`${size === 'lg' ? 'text-6xl md:text-8xl' : 'text-3xl'} font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-700`}>Salakni</span>
        <span className={`${size === 'lg' ? 'text-4xl' : 'text-xl'} arabic-text font-black text-yellow-500`}>سلكني</span>
      </div>
    </div>
  </div>
);

// --- Navbar ---
const Navbar: React.FC<{ onNavigate: (view: AppState['view']) => void, currentView: AppState['view'], user: User | null, onLogout: () => void }> = ({ onNavigate, currentView, user, onLogout }) => (
  <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 hidden md:block">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-24 flex-row-reverse">
        <div onClick={() => onNavigate('landing')}><Logo /></div>
        <div className="flex space-x-reverse space-x-10 items-center flex-row-reverse">
          <button onClick={() => onNavigate('landing')} className={`${currentView === 'landing' ? 'text-emerald-600 font-black' : 'text-gray-600'} hover:text-emerald-500 transition font-bold text-lg`}>الرئيسية</button>
          <button onClick={() => onNavigate('search')} className={`${currentView === 'search' ? 'text-emerald-600 font-black' : 'text-gray-600'} hover:text-emerald-500 transition font-bold text-lg`}>تصفح الحرفيين</button>
          {!user ? (
            <div className="flex items-center gap-4 flex-row-reverse">
              <button onClick={() => onNavigate('login')} className="text-gray-600 hover:text-emerald-500 font-black text-lg">دخول</button>
              <button onClick={() => onNavigate('register')} className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg active:scale-95 transition-all">انضم إلينا</button>
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-gray-50 p-2 pr-5 rounded-3xl border border-gray-100 cursor-pointer group" onClick={() => onNavigate('profile')}>
              <div className="flex flex-col items-end">
                <span className="text-base font-black text-gray-800">{user.firstName}</span>
                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{user.role === UserRole.ADMIN ? 'مدير المنصة' : 'حسابي'}</span>
              </div>
              <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}`} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md" />
            </div>
          )}
        </div>
      </div>
    </div>
  </nav>
);

const BottomNav: React.FC<{ onNavigate: (view: AppState['view']) => void, currentView: AppState['view'], user: User | null }> = ({ onNavigate, currentView, user }) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden">
    <div className="flex justify-around items-center h-20 pb-safe flex-row-reverse">
      <button onClick={() => onNavigate('landing')} className={`flex flex-col items-center gap-1 ${currentView === 'landing' ? 'text-emerald-600' : 'text-gray-400'}`}>
        <span className="text-2xl">🏠</span>
        <span className="text-[11px] font-black">الرئيسية</span>
      </button>
      <button onClick={() => onNavigate('search')} className={`flex flex-col items-center gap-1 ${currentView === 'search' ? 'text-emerald-600' : 'text-gray-400'}`}>
        <span className="text-2xl">🔍</span>
        <span className="text-[11px] font-black">تصفح</span>
      </button>
      <button onClick={() => user ? onNavigate('profile') : onNavigate('register')} className={`flex flex-col items-center gap-1 ${currentView === 'profile' || currentView === 'register' ? 'text-emerald-600' : 'text-gray-400'}`}>
        <span className="text-2xl">👤</span>
        <span className="text-[11px] font-black">حسابي</span>
      </button>
    </div>
  </div>
);

// --- Sub-components for Views ---

const LandingHero: React.FC<{ onStart: (v: any) => void }> = ({ onStart }) => (
  <div className="relative min-h-[90vh] flex items-center justify-center text-white text-center p-6">
    <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
    <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 via-emerald-950/70 to-teal-900/80"></div>
    <div className="relative z-10 max-w-5xl">
      <Logo size="lg" />
      <h1 className="text-5xl md:text-8xl font-black mt-16 mb-8 tracking-tighter">ريح بالك، <span className="text-emerald-400">سَلّكني</span> يسلكها</h1>
      <p className="text-xl md:text-3xl text-slate-300 mb-16 font-medium">المنصة الجزائرية رقم #1 لربط الحرفيين المهرة بالزبائن بكل ثقة وأمان.</p>
      <div className="flex flex-col sm:flex-row gap-8 justify-center">
        <button onClick={() => onStart('search')} className="bg-emerald-600 px-16 py-6 rounded-[2.5rem] font-black text-2xl hover:bg-emerald-500 transition-all shadow-2xl active:scale-95">اطلب خدمة الآن 🔍</button>
        <button onClick={() => onStart('register')} className="bg-white/10 backdrop-blur-md px-16 py-6 rounded-[2.5rem] font-black text-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">سجل كحرفي 🛠️</button>
      </div>
    </div>
  </div>
);

const SearchPage: React.FC<{ user: User | null, ads: Advertisement[] }> = ({ ads }) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('role', 'WORKER').eq('is_verified', true);
        if (!error && data) {
          setWorkers(data.map(w => ({
            ...w,
            firstName: w.first_name || '',
            lastName: w.last_name || '',
            location: { wilaya: w.wilaya || 'غير محدد', daira: w.daira || '' },
            category: w.category || 'عام'
          })) as Worker[]);
        }
      } catch (e) {
        console.error("Worker Fetch Fail", e);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-right">
      <h2 className="text-4xl font-black mb-12">الحرفيين الموثوقين 🇩🇿</h2>
      {loading ? (
        <div className="flex justify-center py-40"><div className="loading-spinner"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {workers.map(w => (
            <div key={w.id} className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-gray-100 group hover:-translate-y-2 transition-all">
              <div className="flex gap-6 items-center mb-8 flex-row-reverse">
                <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-24 h-24 rounded-3xl object-cover shadow-lg" alt="" />
                <div className="text-right">
                  <h3 className="text-2xl font-black">{w.firstName} {w.lastName}</h3>
                  <p className="text-emerald-600 font-bold">{w.category}</p>
                </div>
              </div>
              <div className="pt-8 border-t border-gray-50 flex justify-between items-center flex-row-reverse">
                <span className="text-gray-400 font-bold">📍 {w.location.wilaya}</span>
                <button className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-emerald-700">تواصل</button>
              </div>
            </div>
          ))}
          {workers.length === 0 && <p className="col-span-full text-center py-20 text-gray-400 font-bold">لا يوجد حرفيون موثقون حالياً.</p>}
        </div>
      )}
    </div>
  );
};

const AuthForm: React.FC<{ type: 'login' | 'register', onSuccess: (user: User) => void }> = ({ type, onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (phone === '0777117663' && password === 'vampirewahab31') {
      onSuccess({
        id: 'admin-wahab',
        firstName: 'عبد الوهاب',
        lastName: 'المدير',
        phone,
        role: UserRole.ADMIN,
        location: { wilaya: 'الجزائر', daira: 'الجزائر' },
        isVerified: true
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('users').select('*').eq('phone', phone).eq('password', password).single();
      if (error || !data) throw new Error("بيانات غير صحيحة");
      onSuccess({
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone,
        role: data.role as UserRole,
        location: { wilaya: data.wilaya, daira: data.daira },
        isVerified: data.is_verified
      });
    } catch (err) {
      alert("خطأ في تسجيل الدخول. يرجى التأكد من البيانات.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-32 p-14 bg-white rounded-[4rem] shadow-2xl text-center border border-gray-100">
      <Logo />
      <h2 className="text-3xl font-black my-10">{type === 'login' ? 'مرحباً بعودتك' : 'انضم إلينا'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="رقم الهاتف" className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-emerald-500 font-bold text-right" />
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-emerald-500 font-bold text-right" />
        <button type="submit" disabled={loading} className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black text-xl shadow-xl hover:bg-emerald-700 transition-all">
          {loading ? 'جاري التحقق...' : 'دخول'}
        </button>
      </form>
    </div>
  );
};

const ProfilePage: React.FC<any> = ({ user, onLogout }) => (
  <div className="max-w-4xl mx-auto my-32 p-16 bg-white rounded-[5rem] shadow-2xl text-center">
    <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&size=200`} className="w-48 h-48 rounded-[3.5rem] mx-auto mb-10 border-8 border-gray-50 shadow-xl object-cover" alt="" />
    <h2 className="text-5xl font-black mb-4">{user.firstName} {user.lastName}</h2>
    <p className="text-emerald-600 font-black text-2xl mb-12 uppercase tracking-widest">{user.role}</p>
    <button onClick={onLogout} className="px-16 py-5 bg-red-50 text-red-500 rounded-[2rem] font-black text-xl hover:bg-red-500 hover:text-white transition-all shadow-lg">تسجيل الخروج 👋</button>
  </div>
);

const AdminDashboard: React.FC<{ ads: Advertisement[], setAds: React.Dispatch<React.SetStateAction<Advertisement[]>>, onExit: () => void }> = ({ ads, setAds, onExit }) => {
  const [unverifiedUsers, setUnverifiedUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'ads'>('users');
  const [newAd, setNewAd] = useState({ location: 'search_top' as Advertisement['location'], content: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchUnverified(); }, []);

  const fetchUnverified = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').eq('is_verified', false).eq('role', 'WORKER');
      if (error) throw error;
      if (data) {
        setUnverifiedUsers(data.map(u => ({
          ...u,
          firstName: u.first_name || '',
          lastName: u.last_name || '',
          location: { wilaya: u.wilaya || 'غير محدد', daira: u.daira || 'غير محدد' },
          idFront: u.id_front,
          idBack: u.id_back
        })));
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: string, status: boolean) => {
    try {
      const { error } = await supabase.from('users').update({ is_verified: status }).eq('id', userId);
      if (error) throw error;
      fetchUnverified();
    } catch (err) {
      alert("فشل تحديث الحالة");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans text-right">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8 border-b border-white/10 pb-12 flex-row-reverse">
          <div className="text-center md:text-right">
            <h1 className="text-5xl font-black mb-4">لوحة التحكم <span className="text-emerald-400">السرية</span> 🤫</h1>
          </div>
          <div className="flex bg-slate-900 p-2 rounded-3xl border border-white/5 shadow-2xl flex-row-reverse">
            <button onClick={() => setActiveTab('users')} className={`px-10 py-4 rounded-2xl font-black transition-all ${activeTab === 'users' ? 'bg-emerald-600 shadow-xl' : 'text-slate-400 hover:text-white'}`}>طلبات التوثيق</button>
            <button onClick={() => setActiveTab('ads')} className={`px-10 py-4 rounded-2xl font-black transition-all ${activeTab === 'ads' ? 'bg-emerald-600 shadow-xl' : 'text-slate-400 hover:text-white'}`}>إدارة الإعلانات</button>
            <button onClick={onExit} className="px-6 py-4 text-red-400 hover:text-white transition-all">خروج ✕</button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-40"><div className="loading-spinner"></div></div>
        ) : activeTab === 'users' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {unverifiedUsers.map(u => (
              <div key={u.id} className="bg-slate-900 rounded-[3.5rem] p-10 border border-white/10 shadow-2xl">
                <h3 className="text-3xl font-black mb-2">{u.firstName} {u.lastName}</h3>
                <p className="text-emerald-400 font-bold mb-8">📍 {u.location.wilaya}، {u.location.daira}</p>
                <div className="grid grid-cols-2 gap-6 mb-10">
                  <img src={u.idFront} className="rounded-2xl border border-white/10 aspect-video object-cover" alt="ID Front" />
                  <img src={u.idBack} className="rounded-2xl border border-white/10 aspect-video object-cover" alt="ID Back" />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleVerify(u.id, true)} className="flex-1 bg-emerald-600 py-5 rounded-3xl font-black">تفعيل ✅</button>
                  <button onClick={() => handleVerify(u.id, false)} className="px-8 bg-red-600/10 text-red-500 py-5 rounded-3xl font-black">حذف</button>
                </div>
              </div>
            ))}
            {unverifiedUsers.length === 0 && <p className="col-span-full text-center py-20 text-slate-500">لا توجد طلبات معلقة.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-1 bg-slate-900 p-10 rounded-[3.5rem] border border-white/10">
              <h2 className="text-2xl font-black mb-10">إضافة إعلان 🏷️</h2>
              <textarea rows={8} value={newAd.content} onChange={e => setNewAd({...newAd, content: e.target.value})} className="w-full p-6 bg-black/50 border border-white/10 rounded-3xl mb-8 outline-none text-emerald-400 font-mono text-left" dir="ltr" placeholder="<div...>...</div>" />
              <button onClick={() => { if(newAd.content) { setAds([...ads, {id: Date.now().toString(), ...newAd, is_active: true}]); setNewAd({...newAd, content: ''}); } }} className="w-full bg-emerald-600 py-6 rounded-3xl font-black">نشر الإعلان</button>
            </div>
            <div className="lg:col-span-2 space-y-6">
              {ads.map(ad => (
                <div key={ad.id} className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 flex justify-between items-center flex-row-reverse">
                  <code className="text-slate-400 text-xs truncate max-w-lg" dir="ltr">{ad.content}</code>
                  <button onClick={() => setAds(ads.filter(a => a.id !== ad.id))} className="text-red-500 p-2">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [state, setState] = useState<AppState>({ currentUser: null, workers: [], view: 'landing' });
  const [ads, setAds] = useState<Advertisement[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'admin' && state.currentUser?.role === UserRole.ADMIN) {
      setState(prev => ({ ...prev, view: 'admin' }));
    }
  }, [state.currentUser]);

  const handleNavigate = (view: AppState['view']) => setState(prev => ({ ...prev, view }));
  const handleLoginSuccess = (user: User) => setState(prev => ({ ...prev, currentUser: user, view: user.role === UserRole.ADMIN ? 'admin' : 'search' }));
  const handleLogout = () => setState(prev => ({ ...prev, currentUser: null, view: 'landing' }));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
      <GlobalStyles />
      {state.view !== 'admin' && (
        <Navbar onNavigate={handleNavigate} currentView={state.view} user={state.currentUser} onLogout={handleLogout} />
      )}
      
      <main className="flex-grow">
        {state.view === 'landing' && <LandingHero onStart={handleNavigate} />}
        {state.view === 'search' && <SearchPage user={state.currentUser} ads={ads} />}
        {state.view === 'profile' && state.currentUser && <ProfilePage user={state.currentUser} onLogout={handleLogout} />}
        {state.view === 'admin' && state.currentUser?.role === UserRole.ADMIN && <AdminDashboard ads={ads} setAds={setAds} onExit={() => handleNavigate('landing')} />}
        {(state.view === 'login' || state.view === 'register') && <AuthForm type={state.view} onSuccess={handleLoginSuccess} />}
      </main>

      {state.view !== 'admin' && <BottomNav onNavigate={handleNavigate} currentView={state.view} user={state.currentUser} />}
    </div>
  );
}
