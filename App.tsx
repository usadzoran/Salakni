
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, Message, Notification, Advertisement, SupportRequest } from './types.ts';
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
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
    .admin-tab-active { border-bottom: 3px solid #10b981; color: #10b981; transform: translateY(-2px); }
    .hero-bg-overlay { background: linear-gradient(to bottom, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.7) 50%, rgba(15, 23, 42, 0.95) 100%); }
    .chat-bubble-me { background: #10b981; color: white; border-radius: 1.2rem 1.2rem 0 1.2rem; }
    .chat-bubble-them { background: #f3f4f6; color: #1f2937; border-radius: 1.2rem 1.2rem 1.2rem 0; }
    .table-container { -webkit-overflow-scrolling: touch; }
    @media (max-width: 640px) {
      .hero-title { font-size: 2.25rem !important; line-height: 1.2 !important; }
      .card-p { padding: 1.5rem !important; border-radius: 1.5rem !important; }
      .section-p { padding: 1.5rem !important; border-radius: 2rem !important; }
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

// --- مكون اختيار نوع التسجيل ---
const RegistrationChoice: React.FC<{ onChoice: (role: UserRole) => void }> = ({ onChoice }) => (
  <div className="max-w-4xl mx-auto my-12 md:my-20 px-4 animate-in fade-in zoom-in duration-500">
    <h2 className="text-3xl md:text-5xl font-black text-center mb-12 text-slate-900">كيف تريد الانضمام إلينا؟ ✨</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div 
        onClick={() => onChoice(UserRole.WORKER)}
        className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-transparent hover:border-emerald-500 cursor-pointer transition-all group text-center"
      >
        <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">🛠️</div>
        <h3 className="text-2xl font-black mb-4">أنا حرفي محترف</h3>
        <p className="text-slate-500 font-medium">أريد عرض خدماتي، بناء سمعتي، والوصول لمئات الزبائن في ولايتي.</p>
        <button className="mt-8 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black w-full shadow-lg group-hover:bg-emerald-500 transition-colors">سجل كحرفي</button>
      </div>
      <div 
        onClick={() => onChoice(UserRole.SEEKER)}
        className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-transparent hover:border-blue-500 cursor-pointer transition-all group text-center"
      >
        <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">🔍</div>
        <h3 className="text-2xl font-black mb-4">أنا أبحث عن حرفي</h3>
        <p className="text-slate-500 font-medium">أبحث عن أفضل المهنيين الموثوقين في منطقتي لإنجاز أعمالي بكل سهولة.</p>
        <button className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black w-full shadow-lg group-hover:bg-blue-500 transition-colors">سجل كزبون</button>
      </div>
    </div>
  </div>
);

export default function App() {
  const getInitialUser = () => JSON.parse(localStorage.getItem('user') || 'null');
  const [state, setState] = useState<AppState>(() => ({ currentUser: getInitialUser(), workers: [], view: 'landing' }));
  const [chatTarget, setChatTarget] = useState<User | null>(null);
  const [registerRole, setRegisterRole] = useState<UserRole | null>(null);

  const setView = (view: AppState['view']) => setState(prev => ({ ...prev, view }));

  const startChat = (user: any) => {
    if (!state.currentUser) return setView('login');
    setChatTarget(user);
    setView('messages');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setState({ currentUser: null, workers: [], view: 'landing' });
  };

  const isManagementView = state.view === 'admin' || state.view === 'admin-login';

  return (
    <div className={`min-h-screen flex flex-col arabic-text transition-colors duration-700 ${isManagementView ? 'bg-slate-950' : 'bg-gray-50'}`} dir="rtl">
      <GlobalStyles />
      <nav className="h-20 md:h-24 flex items-center px-4 md:px-6 sticky top-0 z-50 backdrop-blur-xl border-b bg-white/90 border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} />
          <div className="flex items-center gap-4">
            <button onClick={() => setView('search')} className="font-bold text-slate-500 hover:text-emerald-600 transition-colors">تصفح الحرفيين</button>
            {state.currentUser ? (
              <div className="flex items-center gap-4">
                <button onClick={() => setView('messages')} className="text-2xl hover:scale-110 transition-transform">💬</button>
                <div onClick={() => setView('profile')} className="w-10 h-10 rounded-xl bg-emerald-100 cursor-pointer overflow-hidden border-2 border-white shadow-sm hover:border-emerald-500 transition-all">
                   <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                 <button onClick={() => setView('login')} className="text-gray-500 font-bold px-4 py-2 hover:text-emerald-600 transition-colors">دخول</button>
                 <button onClick={() => { setRegisterRole(null); setView('register'); }} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black shadow-lg hover:bg-emerald-500 transition-all active:scale-95">سجل الآن</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && (
          <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-950">
            <div className="absolute inset-0 bg-cover bg-center opacity-30 animate-pulse duration-[10s]" style={{ backgroundImage: `url(${REQ_IMAGE})` }}></div>
            <div className="absolute inset-0 hero-bg-overlay"></div>
            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <h1 className="hero-title text-4xl md:text-8xl font-black text-white leading-tight tracking-tighter">ريح بالك، <span className="text-emerald-400">سَلّكني</span> يسلكها</h1>
              <p className="text-lg md:text-3xl text-slate-300 mt-6 font-medium max-w-3xl mx-auto">المنصة الأولى والوحيدة في الجزائر لربط أفضل الحرفيين بالزبائن بضمان واحترافية.</p>
              <div className="flex flex-col sm:flex-row gap-6 mt-12 justify-center">
                <button onClick={() => setView('search')} className="bg-emerald-600 px-12 py-5 rounded-3xl font-black text-white text-xl shadow-2xl hover:bg-emerald-500 hover:-translate-y-1 transition-all active:scale-95">اطلب حرفي الآن 🔍</button>
                <button onClick={() => { setRegisterRole(null); setView('register'); }} className="bg-white/10 backdrop-blur-md px-12 py-5 rounded-3xl font-black text-white text-xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">أنا حرفي، سجلني 🛠️</button>
              </div>
            </div>
          </div>
        )}

        {state.view === 'register' && !registerRole && <RegistrationChoice onChoice={(role) => setRegisterRole(role)} />}
        
        {state.view === 'register' && registerRole === UserRole.WORKER && (
          <WorkerRegistrationForm onSuccess={(user) => { 
            localStorage.setItem('user', JSON.stringify(user)); 
            setState(prev => ({ ...prev, currentUser: user, view: 'profile' })); 
          }} onBack={() => setRegisterRole(null)} />
        )}

        {state.view === 'register' && registerRole === UserRole.SEEKER && (
          <SeekerRegistrationForm onSuccess={(user) => { 
            localStorage.setItem('user', JSON.stringify(user)); 
            setState(prev => ({ ...prev, currentUser: user, view: 'profile' })); 
          }} onBack={() => setRegisterRole(null)} />
        )}

        {state.view === 'login' && <AuthForm type="login" onSuccess={(u) => { 
          localStorage.setItem('user', JSON.stringify(u)); 
          setState(prev => ({ ...prev, currentUser: u, view: u.role === UserRole.ADMIN ? 'admin' : 'profile' })); 
        }} />}

        {state.view === 'profile' && state.currentUser && <ProfileView user={state.currentUser} onLogout={handleLogout} />}
        
        {state.view === 'search' && (
          <div className="max-w-7xl mx-auto px-4 py-12 text-right">
             <h2 className="text-3xl font-black mb-8 border-r-4 border-emerald-500 pr-4">ابحث عن الحرفي المثالي في ولايتك 🇩🇿</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 hover:shadow-2xl transition-all cursor-pointer group">
                    <div className="flex gap-4 items-center mb-6 flex-row-reverse">
                       <img src={`https://ui-avatars.com/api/?name=W${i}&background=random`} className="w-20 h-20 rounded-3xl shadow-lg group-hover:rotate-3 transition-transform" />
                       <div className="text-right flex-1">
                          <h3 className="font-black text-xl">حرفي متميز {i}</h3>
                          <span className="text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1 rounded-full">ترصيص صحي</span>
                       </div>
                    </div>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">خبرة سنوات في تقديم خدمات الترصيص والصيانة المنزلية بجودة عالية وأسعار مدروسة.</p>
                    <button onClick={() => startChat({ id: i })} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black group-hover:bg-emerald-600 transition-colors shadow-lg">تواصل الآن</button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {state.view === 'messages' && state.currentUser && <ChatView currentUser={state.currentUser} targetUser={chatTarget} />}
      </main>

      <footer className="bg-slate-900 text-white py-12 text-center mt-auto border-t border-white/5">
        <Logo size="sm" inverse />
        <p className="mt-4 text-slate-500 font-bold">سلكني - منصتكم الموثوقة للحرف والمهن في الجزائر 🇩🇿</p>
        <div className="mt-8 flex justify-center gap-6 text-slate-600 font-bold text-sm">
           <a href="#" className="hover:text-emerald-400 transition-colors">سياسة الخصوصية</a>
           <a href="#" className="hover:text-emerald-400 transition-colors">شروط الاستخدام</a>
           <a href="#" className="hover:text-emerald-400 transition-colors">اتصل بنا</a>
        </div>
      </footer>
    </div>
  );
}

// --- لوحة تسجيل الحرفي المتصلة بقاعدة البيانات ---
const WorkerRegistrationForm: React.FC<{ onSuccess: (u: User) => void, onBack: () => void }> = ({ onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    firstName: '', lastName: '', phone: '', password: '', 
    wilaya: WILAYAS[0], daira: '', category: SERVICE_CATEGORIES[0].name, bio: '' 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.daira) return alert("يرجى اختيار الدائرة");
    
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').insert([{
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        password: formData.password, // في تطبيق حقيقي يجب تشفيرها
        role: UserRole.WORKER,
        wilaya: formData.wilaya,
        daira: formData.daira,
        category: formData.category,
        bio: formData.bio,
        is_verified: false
      }]).select().single();

      if (error) {
        if (error.code === '23505') alert("رقم الهاتف مسجل مسبقاً!");
        else throw error;
      } else if (data) {
        onSuccess({ 
          id: data.id, 
          firstName: data.first_name, 
          lastName: data.last_name, 
          phone: data.phone,
          role: UserRole.WORKER,
          location: { wilaya: data.wilaya, daira: data.daira },
          category: data.category,
          bio: data.bio,
          isVerified: data.is_verified
        });
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الاتصال بقاعدة البيانات. حاول مجدداً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-12 px-6 animate-in slide-in-from-left duration-500">
      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-emerald-100 text-right">
        <button onClick={onBack} className="text-emerald-600 font-bold mb-6 hover:underline flex items-center gap-2"><span>←</span> الرجوع لاختيار نوع الحساب</button>
        <h2 className="text-3xl font-black mb-2 text-slate-900">انضم كحرفي محترف ⚒️</h2>
        <p className="text-slate-500 mb-10 font-medium">أنشئ ملفك المهني الآن وابدأ في استقبال عروض العمل في منطقتك.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-black text-slate-700 pr-2">الاسم الشخصي</label>
              <input required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 transition-all font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="font-black text-slate-700 pr-2">اللقب (العائلة)</label>
              <input required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 transition-all font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="font-black text-slate-700 pr-2">رقم الهاتف الجوال</label>
            <input required type="tel" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 transition-all font-mono font-bold" placeholder="05 / 06 / 07" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-black text-slate-700 pr-2">الولاية</label>
              <select className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 font-bold" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value, daira: ''})}>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-black text-slate-700 pr-2">الدائرة</label>
              <select required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 font-bold" value={formData.daira} onChange={e => setFormData({...formData, daira: e.target.value})}>
                <option value="">اختر الدائرة القريبة منك</option>
                {DAIRAS[formData.wilaya]?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-black text-slate-700 pr-2">مجال تخصصك الرئيسي</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SERVICE_CATEGORIES.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setFormData({...formData, category: c.name})}
                  className={`p-4 border-2 rounded-2xl text-center cursor-pointer transition-all ${formData.category === c.name ? 'border-emerald-600 bg-emerald-50' : 'border-gray-100 hover:border-emerald-200'}`}
                >
                  <div className="text-2xl mb-1">{c.icon}</div>
                  <div className="text-[9px] font-black leading-tight text-slate-800">{c.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-black text-slate-700 pr-2">نبذة مهنية عنك</label>
            <textarea className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 h-32 font-medium" placeholder="اذكر مهاراتك، سنوات خبرتك، والخدمات التي تقدمها لتميز نفسك..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="font-black text-slate-700 pr-2">كلمة المرور</label>
            <input type="password" required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-emerald-500 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50">
            {loading ? 'جاري ربط حسابك بقاعدة البيانات...' : 'تأكيد إنشاء حساب حرفي ✅'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- لوحة تسجيل الزبون المتصلة بقاعدة البيانات ---
const SeekerRegistrationForm: React.FC<{ onSuccess: (u: User) => void, onBack: () => void }> = ({ onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', password: '', wilaya: WILAYAS[0] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').insert([{
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        password: formData.password,
        role: UserRole.SEEKER,
        wilaya: formData.wilaya,
        is_verified: true // الزبائن موثقون تلقائياً
      }]).select().single();

      if (error) {
        if (error.code === '23505') alert("هذا الرقم مسجل بالفعل!");
        else throw error;
      } else if (data) {
        onSuccess({ 
          id: data.id, 
          firstName: data.first_name, 
          lastName: data.last_name, 
          phone: data.phone,
          role: UserRole.SEEKER,
          location: { wilaya: data.wilaya, daira: '' },
          isVerified: true
        });
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ ما، يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-12 px-4 animate-in slide-in-from-right duration-500">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-blue-100 text-right">
        <button onClick={onBack} className="text-blue-600 font-bold mb-6 hover:underline flex items-center gap-2"><span>←</span> الرجوع</button>
        <h2 className="text-3xl font-black mb-2 text-blue-900">سجل كزبون جديد 👤</h2>
        <p className="text-slate-500 mb-10 font-medium">ابدأ الآن في التواصل مع الحرفيين الموثوقين في مدينتك.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <input placeholder="الاسم" required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
             <input placeholder="اللقب" required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <input placeholder="رقم الهاتف" required type="tel" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold font-mono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <div className="space-y-2">
            <label className="font-black text-slate-700 pr-2">الولاية الحالية</label>
            <select className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <input type="password" placeholder="كلمة المرور" required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50">
            {loading ? 'جاري الحفظ...' : 'تأكيد إنشاء الحساب 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- نموذج تسجيل الدخول المتصل بقاعدة البيانات ---
const AuthForm: React.FC<{ type: 'login', onSuccess: (u: User) => void }> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ phone: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').eq('phone', formData.phone).eq('password', formData.password).single();
      
      if (error) {
        alert("رقم الهاتف أو كلمة المرور غير صحيحة ❌");
      } else if (data) {
        onSuccess({ 
          id: data.id, 
          firstName: data.first_name, 
          lastName: data.last_name, 
          phone: data.phone,
          role: data.role as UserRole,
          location: { wilaya: data.wilaya, daira: data.daira },
          avatar: data.avatar,
          isVerified: data.is_verified,
          category: data.category
        });
      }
    } catch (err) {
      alert("حدث خطأ أثناء تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-md text-right border border-emerald-50">
        <h2 className="text-3xl font-black mb-8 text-slate-900 border-r-4 border-emerald-500 pr-4">مرحباً بك مجدداً 👋</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="font-black text-slate-700 pr-2 text-sm">رقم الهاتف</label>
            <input required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 font-bold font-mono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="font-black text-slate-700 pr-2 text-sm">كلمة المرور</label>
            <input type="password" required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-emerald-500 font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-500 transition-all shadow-lg active:scale-95 disabled:opacity-50">
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
};

const ProfileView: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => (
  <div className="max-w-4xl mx-auto my-12 md:my-20 px-4 animate-in fade-in duration-700">
    <div className="bg-white p-12 rounded-[4rem] shadow-2xl text-center border border-emerald-50 relative overflow-hidden">
       <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full opacity-50"></div>
       <div className="relative inline-block mb-6">
          <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&size=200`} className="w-40 h-40 rounded-[3rem] border-4 border-white shadow-2xl object-cover" />
          {user.isVerified && <span className="absolute bottom-2 right-2 bg-emerald-500 text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-white text-xl shadow-lg">✓</span>}
       </div>
       <h2 className="text-4xl font-black mb-2 text-slate-900">{user.firstName} {user.lastName}</h2>
       <p className="text-emerald-600 font-black mb-8 text-xl">
         {user.role === UserRole.WORKER ? `حرفي متميز (${user.category})` : 'زبون وفيّ لـ سلكني'}
       </p>
       <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-10">
          <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
             <p className="text-[10px] text-gray-400 font-bold">الولاية</p>
             <p className="font-black text-slate-700">{user.location.wilaya}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
             <p className="text-[10px] text-gray-400 font-bold">رقم الهاتف</p>
             <p className="font-black text-slate-700 font-mono">{user.phone}</p>
          </div>
       </div>
       <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black hover:bg-emerald-600 transition-colors shadow-lg">تعديل الملف الشخصي</button>
          <button onClick={onLogout} className="bg-red-50 text-red-500 px-12 py-4 rounded-2xl font-black border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm">تسجيل الخروج</button>
       </div>
    </div>
  </div>
);

// --- نظام الرسائل المتجاوب ---
const ChatView: React.FC<{ currentUser: User, targetUser?: User | null }> = ({ currentUser, targetUser }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<User | null>(targetUser || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showConvList, setShowConvList] = useState(!targetUser);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    const { data } = await supabase.rpc('get_conversations', { user_uuid: currentUser.id });
    setConversations(data || []);
  };

  const fetchMessages = async (partnerId: string) => {
    const { data } = await supabase.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  useEffect(() => {
    fetchConversations();
    const subscription = supabase.channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new as Message;
        if ((msg.sender_id === activeChat?.id || msg.receiver_id === activeChat?.id)) {
          setMessages(prev => [...prev, msg]);
        }
        fetchConversations();
      })
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, [activeChat]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      if (window.innerWidth < 768) setShowConvList(false);
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    const msg = { sender_id: currentUser.id, receiver_id: activeChat.id, content: newMessage.trim() };
    await supabase.from('messages').insert([msg]);
    setNewMessage('');
  };

  return (
    <div className="max-w-6xl mx-auto my-4 md:my-10 h-[85vh] md:h-[80vh] bg-white rounded-3xl md:rounded-[3rem] shadow-2xl overflow-hidden border flex flex-col md:flex-row-reverse">
      <div className={`${showConvList ? 'flex' : 'hidden md:flex'} w-full md:w-1/3 border-l bg-gray-50 flex-col h-full`}>
        <div className="p-4 md:p-6 border-b bg-white flex justify-between items-center flex-row-reverse">
          <h2 className="text-lg md:text-xl font-black">المحادثات</h2>
          {activeChat && <button className="md:hidden text-emerald-600 font-bold" onClick={() => setShowConvList(false)}>رجوع للدردشة</button>}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.map((conv: any) => (
            <div key={conv.id} onClick={() => setActiveChat(conv)} className={`p-4 flex items-center gap-4 flex-row-reverse cursor-pointer hover:bg-emerald-50 transition-all ${activeChat?.id === conv.id ? 'bg-emerald-100' : ''}`}>
              <img src={conv.avatar || `https://ui-avatars.com/api/?name=${conv.first_name}`} className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover" />
              <div className="text-right flex-1">
                <p className="font-black text-sm">{conv.first_name} {conv.last_name}</p>
                <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
              </div>
            </div>
          ))}
          {conversations.length === 0 && <p className="text-center py-10 text-gray-400 font-bold">لا توجد محادثات نشطة.</p>}
        </div>
      </div>
      <div className={`${!showConvList ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white h-full`}>
        {activeChat ? (
          <>
            <div className="p-4 md:p-6 border-b flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-3 md:gap-4 flex-row-reverse">
                <img src={activeChat.avatar || `https://ui-avatars.com/api/?name=${activeChat.firstName}`} className="w-8 h-8 md:w-10 md:h-10 rounded-xl" />
                <div className="text-right">
                  <p className="font-black text-sm md:text-base">{activeChat.firstName} {activeChat.lastName}</p>
                  <p className="text-[10px] text-emerald-500 font-bold">نشط الآن</p>
                </div>
              </div>
              <button className="md:hidden text-gray-500 font-bold text-xs" onClick={() => setShowConvList(true)}>قائمة المحادثات</button>
            </div>
            <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_id === currentUser.id ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] p-3 md:p-4 text-sm font-medium shadow-sm ${m.sender_id === currentUser.id ? 'chat-bubble-me' : 'chat-bubble-them'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-4 md:p-6 border-t bg-gray-50 flex gap-2 md:gap-4">
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="اكتب رسالة..." className="flex-1 p-3 md:p-4 bg-white border-2 rounded-xl md:rounded-2xl outline-none focus:border-emerald-500 transition-all" />
              <button type="submit" className="bg-emerald-600 text-white px-6 md:px-10 rounded-xl md:rounded-2xl font-black shadow-lg">إرسال</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 font-bold px-10 text-center">اختر محادثة لبدء التواصل مع الحرفي أو الزبون.</div>
        )}
      </div>
    </div>
  );
};
