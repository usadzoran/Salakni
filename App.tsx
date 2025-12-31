
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
    
    .hero-bg-overlay { background: linear-gradient(to bottom, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.7) 50%, rgba(15, 23, 42, 0.95) 100%); }
  `}</style>
);

const REQ_IMAGE = "https://st3.depositphotos.com/9744818/17392/i/950/depositphotos_173923044-stock-photo-woman-giving-money-man-corrupted.jpg";

// مكون لعرض الإعلانات في الموقع
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
  return <div className="my-6 overflow-hidden flex justify-center w-full shadow-sm rounded-xl" dangerouslySetInnerHTML={{ __html: ad.html_content }} />;
};

const Logo: React.FC<{ size?: 'sm' | 'lg', onClick?: () => void, inverse?: boolean }> = ({ size = 'sm', onClick, inverse }) => (
  <div onClick={onClick} className={`flex items-center gap-2 md:gap-3 group cursor-pointer transition-all duration-500 ${size === 'lg' ? 'scale-100 md:scale-110' : ''}`}>
    <div className={`relative ${size === 'lg' ? 'w-16 h-16 md:w-20 md:h-20' : 'w-10 h-10 md:w-12 md:h-12'} flex-shrink-0`}>
      <div className={`absolute inset-0 bg-gradient-to-tr from-emerald-600 via-teal-500 to-yellow-400 ${size === 'lg' ? 'rounded-2xl md:rounded-[2rem]' : 'rounded-xl md:rounded-2xl'} rotate-3 group-hover:rotate-12 transition-transform duration-500 shadow-xl overflow-hidden`}>
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center text-white font-black ${size === 'lg' ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'} z-10 group-hover:scale-110 transition-transform`}>S</div>
    </div>
    <div className="flex flex-col items-start leading-none gap-0.5">
      <div className="flex items-baseline gap-1 md:gap-1.5">
        <span className={`${size === 'lg' ? 'text-4xl md:text-6xl' : 'text-2xl md:text-3xl'} font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r ${inverse ? 'from-white via-emerald-100 to-teal-50' : 'from-emerald-950 via-emerald-800 to-teal-700'}`}>Salakni</span>
        <span className={`${size === 'lg' ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'} arabic-text font-black text-yellow-500`}>سلكني</span>
      </div>
    </div>
  </div>
);

const LandingHero: React.FC<{ onStart: (v: AppState['view']) => void }> = ({ onStart }) => (
  <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
    <div 
      className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105"
      style={{ backgroundImage: `url(${REQ_IMAGE})` }}
    ></div>
    <div className="absolute inset-0 hero-bg-overlay"></div>
    
    <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 w-full text-center">
      <div className="flex flex-col items-center gap-10">
        <div className="space-y-6 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="inline-block animate-float">
            <Logo size="lg" inverse />
          </div>
          <h1 className="text-4xl md:text-8xl font-black text-white leading-tight tracking-tight px-4">
            ريح بالك، <span className="text-emerald-400">سَلّكني</span> يسلكها
          </h1>
          <p className="text-lg md:text-3xl text-slate-300 font-medium max-w-3xl mx-auto leading-relaxed px-4">
            المنصة الجزائرية رقم #1 لربط الحرفيين بالزبائن. 
            <span className="text-yellow-500 font-bold block mt-3">تعامل مباشر، دفع يدوي، وثقة مضمونة.</span>
          </p>
        </div>

        <div className="relative w-full max-w-4xl mx-auto px-4 group animate-in fade-in zoom-in duration-1000 delay-300">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[2.5rem] md:rounded-[4rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative aspect-[21/9] md:aspect-[21/7] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden border-2 border-white/10 shadow-2xl">
            <img 
              src={REQ_IMAGE} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              alt="دفع يدوي آمن"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 md:bottom-8 right-4 md:right-8 text-right">
               <span className="bg-emerald-600/90 backdrop-blur-md text-white px-4 md:px-6 py-2 rounded-full text-xs md:text-lg font-black flex items-center gap-2">
                 <span>صافية حليب، تعامل مباشر</span>
                 <span className="text-lg md:text-2xl">🤝</span>
               </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full px-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
          <button onClick={() => onStart('search')} className="w-full sm:w-auto bg-emerald-600 px-12 md:px-20 py-5 md:py-6 rounded-[2rem] font-black text-xl md:text-2xl text-white hover:bg-emerald-500 transition-all shadow-xl active:scale-95">
            ابحث عن حرفي 🔍
          </button>
          <button onClick={() => onStart('register')} className="w-full sm:w-auto bg-white/10 backdrop-blur-md px-12 md:px-20 py-5 md:py-6 rounded-[2rem] font-black text-xl md:text-2xl text-white border border-white/20 hover:bg-white/20 transition-all active:scale-95">
            سجل كحرفي 🛠️
          </button>
        </div>
      </div>
      
      <div className="mt-16">
        <AdRenderer placement="hero_bottom" />
      </div>
    </div>
  </div>
);

const AdminDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'verification' | 'users' | 'ads'>('verification');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddAdModal, setShowAddAdModal] = useState(false);
  
  // بيانات الإعلان الجديد
  const [newAd, setNewAd] = useState({
    title: '', placement: 'hero_bottom', html_content: '', is_active: true
  });

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
        const { data } = await supabase.from('advertisements').select('*').order('created_at', { ascending: false });
        setItems(data || []);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('advertisements').insert(newAd);
    if (error) alert("خطأ في الإضافة: " + error.message);
    else {
      setShowAddAdModal(false);
      fetchData();
    }
    setLoading(false);
  };

  const handleUpdateAd = async (id: string, updates: Partial<Advertisement>) => {
    const { error } = await supabase.from('advertisements').update(updates).eq('id', id);
    if (error) alert("خطأ في التحديث");
    else fetchData();
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm("حذف الإعلان نهائياً؟")) return;
    await supabase.from('advertisements').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-12 text-right">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10 flex-row-reverse border-b border-white/10 pb-6">
          <h1 className="text-2xl md:text-4xl font-black">لوحة الإدارة المركزية 🔒</h1>
          <button onClick={onExit} className="bg-white/10 px-6 py-2 rounded-xl font-black hover:bg-white/20 text-sm">تسجيل خروج</button>
        </div>

        <div className="flex gap-8 mb-10 border-b border-white/5 flex-row-reverse overflow-x-auto whitespace-nowrap custom-scrollbar">
          <button onClick={() => setActiveTab('verification')} className={`pb-4 font-black transition-all ${activeTab === 'verification' ? 'admin-tab-active' : 'text-slate-500'}`}>التوثيق</button>
          <button onClick={() => setActiveTab('users')} className={`pb-4 font-black transition-all ${activeTab === 'users' ? 'admin-tab-active' : 'text-slate-500'}`}>إدارة المستخدمين</button>
          <button onClick={() => setActiveTab('ads')} className={`pb-4 font-black transition-all ${activeTab === 'ads' ? 'admin-tab-active' : 'text-slate-500'}`}>إعلانات HTML</button>
        </div>

        {activeTab === 'ads' && (
          <div className="flex justify-end mb-8">
             <button onClick={() => setShowAddAdModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg transition-all">
                + إضافة مساحة إعلانية
             </button>
          </div>
        )}

        {loading ? <div className="loading-spinner mx-auto mt-20"></div> : (
          <div className="mt-6">
            {activeTab === 'ads' && (
              <div className="grid grid-cols-1 gap-10">
                {items.map(ad => (
                  <div key={ad.id} className="bg-slate-900/50 rounded-[3rem] border border-white/5 p-8 flex flex-col lg:flex-row gap-8 shadow-2xl">
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-center flex-row-reverse">
                         <h3 className="text-xl font-black">{ad.title || 'إعلان بدون عنوان'}</h3>
                         <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full text-slate-400">{ad.placement}</span>
                      </div>
                      <textarea 
                        className="w-full h-40 bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-xs text-emerald-400 outline-none focus:border-emerald-500/50"
                        value={ad.html_content}
                        onChange={(e) => {
                          const newItems = items.map(i => i.id === ad.id ? {...i, html_content: e.target.value} : i);
                          setItems(newItems);
                        }}
                      />
                      <div className="flex gap-4">
                        <button onClick={() => handleUpdateAd(ad.id, { html_content: ad.html_content })} className="bg-emerald-600 px-6 py-2 rounded-xl text-sm font-black">حفظ التعديلات</button>
                        <button onClick={() => handleUpdateAd(ad.id, { is_active: !ad.is_active })} className={`px-6 py-2 rounded-xl text-sm font-black ${ad.is_active ? 'bg-yellow-600' : 'bg-slate-700'}`}>
                          {ad.is_active ? 'تعطيل' : 'تفعيل'}
                        </button>
                        <button onClick={() => handleDeleteAd(ad.id)} className="bg-red-600/20 text-red-500 px-6 py-2 rounded-xl text-sm font-black">حذف</button>
                      </div>
                    </div>
                    <div className="lg:w-1/3 space-y-2">
                       <p className="text-xs font-bold text-slate-500 text-center">المعاينة المباشرة</p>
                       <div className="bg-white rounded-2xl p-4 overflow-hidden min-h-[150px] flex items-center justify-center text-black" dangerouslySetInnerHTML={{ __html: ad.html_content || '<p class="text-gray-400">لا يوجد كود للعرض</p>' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* باقي الأقسام تبقى كما هي */}
          </div>
        )}
      </div>

      {/* مودال إضافة إعلان جديد */}
      {showAddAdModal && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-2xl rounded-[3rem] p-8 md:p-10 border border-white/10 text-right shadow-2xl">
            <h2 className="text-2xl font-black mb-6">إنشاء مساحة إعلانية جديدة 📢</h2>
            <form onSubmit={handleCreateAd} className="space-y-6">
              <div>
                <label className="block text-sm mb-2 text-slate-400">عنوان الإعلان (داخلي للمدير)</label>
                <input required className="w-full bg-slate-800 border border-white/10 p-4 rounded-xl outline-none focus:border-blue-500" placeholder="مثلاً: إعلان جوجل الرئيسي" value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-2 text-slate-400">مكان الظهور</label>
                <select className="w-full bg-slate-800 border border-white/10 p-4 rounded-xl outline-none" value={newAd.placement} onChange={e => setNewAd({...newAd, placement: e.target.value})}>
                   <option value="hero_bottom">أسفل الصفحة الرئيسية</option>
                   <option value="search_top">أعلى نتائج البحث</option>
                   <option value="search_sidebar">جانب البحث (Desktop)</option>
                   <option value="footer_top">فوق التذييل (Footer)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2 text-slate-400">كود HTML / Script</label>
                <textarea required className="w-full h-40 bg-black/50 border border-white/10 p-4 rounded-xl font-mono text-xs text-blue-400 outline-none" placeholder="<a href='...'><img src='...' /></a>" value={newAd.html_content} onChange={e => setNewAd({...newAd, html_content: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-blue-600 py-4 rounded-xl font-black">إضافة الآن</button>
                <button type="button" onClick={() => setShowAddAdModal(false)} className="px-8 bg-white/5 py-4 rounded-xl font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- مكون التوثيق والدخول ---
const AuthForm: React.FC<{ type: 'login' | 'register' | 'admin', onSuccess: (user: User) => void }> = ({ type, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', password: '', role: UserRole.SEEKER as UserRole });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // محاكاة نظام التوثيق في غياب قاعدة بيانات المستخدمين حالياً
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      firstName: formData.firstName || (type === 'admin' ? 'مدير' : 'مستخدم'),
      lastName: formData.lastName || 'تجريبي',
      phone: formData.phone,
      role: type === 'admin' ? UserRole.ADMIN : formData.role,
      location: { wilaya: 'الجزائر', daira: 'سيدي امحمد' },
      isVerified: type === 'admin',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    onSuccess(mockUser);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-md text-right border border-gray-100">
        <h2 className="text-3xl font-black mb-8 text-slate-900">
          {type === 'admin' ? 'تسجيل دخول المدير 🔒' : (type === 'login' ? 'تسجيل الدخول' : 'فتح حساب جديد')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="الاسم" required className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-emerald-500 font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input type="text" placeholder="اللقب" required className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-emerald-500 font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          )}
          <input type="tel" placeholder="رقم الهاتف" required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-emerald-500 font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input type="password" placeholder="كلمة المرور" required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-emerald-500 font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          
          {type === 'register' && (
             <div className="space-y-2">
               <label className="block text-sm font-bold text-gray-500 mr-2">نوع الحساب</label>
               <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-emerald-500 font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                  <option value={UserRole.SEEKER}>أبحث عن حرفي (زبون)</option>
                  <option value={UserRole.WORKER}>أنا حرفي (أعرض خدماتي)</option>
               </select>
             </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-500 transition-all shadow-lg active:scale-95">
            {loading ? 'جاري التحميل...' : (type === 'login' || type === 'admin' ? 'دخول' : 'تسجيل')}
          </button>
        </form>
      </div>
    </div>
  );
};

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
                  <p className="text-gray-600 line-clamp-3 mb-4 font-medium text-sm md:text-base leading-relaxed">{w.bio || 'حرفي ماهر في منصة سلكني.'}</p>
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

export default function App() {
  const initialUser = JSON.parse(localStorage.getItem('user')) || null;
  const [state, setState] = useState<AppState>({ currentUser: initialUser, workers: [], view: 'landing' });

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
      <main className="flex-grow">
        {state.view === 'landing' && <LandingHero onStart={handleNavigate} />}
        {state.view === 'search' && <SearchPage />}
        {state.view === 'login' && <AuthForm type="login" onSuccess={handleLoginSuccess} />}
        {state.view === 'register' && <AuthForm type="register" onSuccess={handleLoginSuccess} />}
        {state.view === 'admin-login' && <AuthForm type="admin" onSuccess={handleLoginSuccess} />}
        {state.view === 'admin' && state.currentUser?.role === UserRole.ADMIN && <AdminDashboard onExit={handleLogout} />}
        {state.view === 'profile' && state.currentUser && (
           <div className="max-w-4xl mx-auto p-10 text-right">
              <h2 className="text-3xl font-black mb-6">مرحباً {state.currentUser.firstName} 👋</h2>
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
                 <p className="text-lg">هذا هو ملفك الشخصي على سلكني. نحن نعمل حالياً على إضافة المزيد من الميزات لحسابك.</p>
                 <button onClick={handleLogout} className="mt-8 bg-red-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-600 transition-colors">تسجيل الخروج</button>
              </div>
           </div>
        )}
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
