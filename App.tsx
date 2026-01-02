
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, Message, Worker, VerificationStatus } from './types.ts';
import { SERVICE_CATEGORIES, WILAYAS } from './constants.tsx';
import { supabase } from './lib/supabase.ts';
import { 
  MapPin, 
  Star, 
  User as UserIcon, 
  LogOut, 
  Settings, 
  Phone, 
  MessageSquare,
  Home,
  Search,
  ClipboardList,
  Camera,
  Image as ImageIcon,
  X,
  ChevronLeft,
  Award,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Eye,
  UserCheck,
  UserX
} from 'lucide-react';

// --- Components ---

const VerificationBadge = ({ status }: { status?: VerificationStatus }) => {
  switch (status) {
    case 'verified':
      return (
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 font-black text-xs animate-in fade-in">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          حساب مفعل
        </div>
      );
    case 'pending':
      return (
        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100 font-black text-xs">
          <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>
          حساب قيد التفعيل
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-1.5 rounded-full border border-red-100 font-black text-xs">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          حساب غير مفعل
        </div>
      );
  }
};

const GlobalStyles = () => (
  <style>{`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: fadeIn 0.4s ease-out forwards; }
    .arabic-text { font-family: 'Tajawal', sans-serif; }
    .loading-spinner { border: 4px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
    .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
  `}</style>
);

const Logo = ({ onClick }: { onClick?: () => void }) => (
  <div onClick={onClick} className="flex items-center gap-2 cursor-pointer group">
    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg group-hover:rotate-12 transition-transform">S</div>
    <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Salakni <span className="text-emerald-600">سلكني</span></span>
  </div>
);

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { currentUser: saved ? JSON.parse(saved) : null, workers: [], view: 'landing' };
  });
  const [loading, setLoading] = useState(false);
  const [chatTarget, setChatTarget] = useState<User | null>(null);
  const [searchFilters, setSearchFilters] = useState({ query: '', wilaya: '', category: '' });

  const setView = (view: AppState['view']) => setState(prev => ({ ...prev, view }));

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('users').select('*').eq('role', UserRole.WORKER);
      if (searchFilters.wilaya) query = query.eq('wilaya', searchFilters.wilaya);
      if (searchFilters.category) query = query.contains('categories', [searchFilters.category]);
      
      const { data, error } = await query;
      if (error) throw error;
      setState(prev => ({ ...prev, workers: (data || []).map(d => ({
        ...d, firstName: d.first_name, lastName: d.last_name, location: { wilaya: d.wilaya }, 
        rating: d.rating || 0, ratingCount: d.rating_count || 0, categories: d.categories || [], portfolio: d.portfolio || [],
        verificationStatus: d.verification_status || 'none', idFront: d.id_front, idBack: d.id_back
      }))}));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (state.view === 'search') fetchWorkers();
  }, [state.view, searchFilters]);

  // Auth sync
  const updateCurrentUser = (u: User | null) => {
    setState(prev => ({ ...prev, currentUser: u }));
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user');
  };

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-20 md:pb-0" dir="rtl">
      <GlobalStyles />
      <nav className="h-20 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} />
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => setView('search')} className="font-bold hover:text-emerald-600">تصفح الحرفيين</button>
            <button onClick={() => setView('support')} className="font-bold hover:text-emerald-600">سوق المهام</button>
            {state.currentUser?.role === UserRole.ADMIN && (
              <button onClick={() => setView('admin-panel')} className="font-black text-emerald-600 flex items-center gap-2"><ShieldCheck size={18} /> لوحة الإدارة</button>
            )}
            {state.currentUser ? (
              <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer bg-slate-100 pl-4 pr-1 py-1 rounded-full hover:bg-emerald-50 transition-colors">
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
                <span className="font-black text-sm">{state.currentUser.firstName}</span>
              </div>
            ) : (
              <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold">دخول</button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onSearch={() => setView('search')} />}
        {state.view === 'search' && <SearchWorkersView workers={state.workers} loading={loading} filters={searchFilters} onFilterChange={setSearchFilters} onProfile={(w) => { setChatTarget(w); setView('profile'); }} />}
        
        {state.view === 'profile' && (state.currentUser || chatTarget) && (
          <ProfileView 
            user={chatTarget || state.currentUser!} 
            isOwn={!chatTarget || chatTarget?.id === state.currentUser?.id} 
            onEdit={() => setView('edit-profile')} 
            onLogout={() => updateCurrentUser(null)}
            onBack={() => { setChatTarget(null); setView('search'); }}
          />
        )}

        {state.view === 'edit-profile' && state.currentUser && (
          <EditProfileView 
            user={state.currentUser} 
            onSave={(u) => { updateCurrentUser(u); setView('profile'); }}
            onCancel={() => setView('profile')}
          />
        )}

        {state.view === 'admin-panel' && state.currentUser?.role === UserRole.ADMIN && (
          <AdminPanelView />
        )}

        {state.view === 'login' && <AuthForm onSuccess={(u) => { updateCurrentUser(u); setView('profile'); }} />}
      </main>

      {/* Mobile Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-8 py-4 flex justify-between md:hidden z-50 rounded-t-3xl shadow-2xl">
        <button onClick={() => setView('landing')} className={state.view === 'landing' ? 'text-emerald-600' : 'text-slate-400'}><Home size={22} /></button>
        <button onClick={() => setView('search')} className={state.view === 'search' ? 'text-emerald-600' : 'text-slate-400'}><Search size={22} /></button>
        <button onClick={() => setView('support')} className={state.view === 'support' ? 'text-emerald-600' : 'text-slate-400'}><ClipboardList size={22} /></button>
        <button onClick={() => setView('profile')} className={state.view === 'profile' ? 'text-emerald-600' : 'text-slate-400'}><UserIcon size={22} /></button>
      </div>
    </div>
  );
}

// --- Views ---

const LandingView = ({ onSearch }: any) => (
  <div className="relative min-h-[85vh] flex items-center justify-center text-center px-6">
    <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
    <div className="relative z-10 max-w-4xl">
      <h1 className="text-5xl md:text-7xl font-black text-white mb-8">سَلّكني يسلكها <span className="text-emerald-400">في الحين!</span></h1>
      <p className="text-lg md:text-2xl text-slate-300 mb-12 font-bold leading-relaxed">ابحث عن حرفي موثق بهوية وطنية لضمان حقك وجودة العمل.</p>
      <button onClick={onSearch} className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-2xl hover:bg-emerald-500 transition-all">ابدأ البحث 🔍</button>
    </div>
  </div>
);

const ProfileView = ({ user, isOwn, onEdit, onLogout, onBack }: any) => (
  <div className="max-w-5xl mx-auto py-8 md:py-16 px-6 animate-in">
    {!isOwn && <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-emerald-600"><ChevronLeft size={20} /> العودة</button>}
    
    <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 relative">
      <div className="h-48 bg-gradient-to-r from-emerald-600 to-teal-400"></div>
      <div className="px-6 md:px-12 pb-12 relative -mt-24">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-10">
          <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&background=10b981&color=fff`} className="w-44 h-44 rounded-[2.5rem] border-8 border-white shadow-xl object-cover bg-white" />
          <div className="text-center md:text-right flex-1">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">{user.firstName} {user.lastName}</h2>
              {user.role === UserRole.WORKER && <VerificationBadge status={user.verificationStatus} />}
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
              {user.role === UserRole.WORKER ? (
                user.categories?.map((c: string) => <span key={c} className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-black border border-emerald-100">{c}</span>)
              ) : <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-black border border-blue-100">زبون مميز</span>}
              <span className="text-slate-400 font-bold text-sm bg-slate-50 px-4 py-1.5 rounded-full">📍 {user.location.wilaya}</span>
            </div>
          </div>
          {isOwn && (
            <div className="flex gap-2">
              <button onClick={onEdit} className="p-3 bg-slate-100 rounded-2xl hover:bg-emerald-100 transition-colors"><Settings size={22} /></button>
              <button onClick={onLogout} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-colors"><LogOut size={22} /></button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl text-center">
              <p className="text-slate-400 font-bold mb-1">التقييم العام</p>
              <div className="text-4xl font-black text-yellow-500 flex items-center justify-center gap-2">
                <Star size={36} fill="currentColor" /> {user.rating?.toFixed(1) || '0.0'}
              </div>
              <p className="text-[10px] text-slate-400">من {user.ratingCount || 0} زبون</p>
            </div>
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
              <h4 className="font-black mb-3 flex items-center gap-2"><Phone className="text-emerald-400" /> تواصل مباشر</h4>
              <p className="text-2xl font-mono text-center mb-4 tracking-wider">{user.phone}</p>
              <button className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-black transition-colors">اتصال</button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-10">
            <div className="glass-card p-8 rounded-[2.5rem] border border-slate-100">
              <h4 className="text-xl font-black mb-4 flex items-center gap-3"><Award className="text-emerald-500" /> عن الحرفي</h4>
              <p className="text-slate-600 leading-relaxed font-medium">{user.bio || 'لم يكتب هذا الحرفي نبذة بعد.'}</p>
            </div>

            {user.role === UserRole.WORKER && (
              <div>
                <h4 className="text-xl font-black mb-6 flex items-center gap-3"><ImageIcon className="text-emerald-500" /> معرض الأعمال الاحترافي</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {user.portfolio && user.portfolio.length > 0 ? user.portfolio.map((img: string, idx: number) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden shadow-md group relative border-2 border-white">
                      <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    </div>
                  )) : (
                    <div className="col-span-full py-16 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center text-slate-400 font-bold">لا توجد صور للأعمال</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const EditProfileView = ({ user, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio || '',
    avatar: user.avatar || '',
    categories: user.categories || [],
    wilaya: user.location.wilaya,
    portfolio: user.portfolio || [],
    idFront: user.idFront || '',
    idBack: user.idBack || '',
    verificationStatus: user.verificationStatus || 'none'
  });
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'portfolio' | 'idFront' | 'idBack') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'avatar') setFormData(prev => ({ ...prev, avatar: base64 }));
      else if (type === 'idFront') setFormData(prev => ({ ...prev, idFront: base64 }));
      else if (type === 'idBack') setFormData(prev => ({ ...prev, idBack: base64 }));
      else {
        if (formData.portfolio.length >= 5) { alert('يمكنك إضافة 5 صور كحد أقصى'); return; }
        setFormData(prev => ({ ...prev, portfolio: [...prev.portfolio, base64] }));
      }
    };
    reader.readAsDataURL(files[0]);
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) 
        ? prev.categories.filter(c => c !== cat) 
        : [...prev.categories, cat]
    }));
  };

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Determine status: if sending new IDs, set to pending
      const isSendingNewVerification = 
        (formData.idFront !== user.idFront || formData.idBack !== user.idBack) && 
        formData.idFront && formData.idBack;

      const newStatus = isSendingNewVerification ? 'pending' : formData.verificationStatus;

      const { error } = await supabase.from('users').update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
        avatar: formData.avatar,
        categories: formData.categories,
        wilaya: formData.wilaya,
        portfolio: formData.portfolio,
        id_front: formData.idFront,
        id_back: formData.idBack,
        verification_status: newStatus
      }).eq('id', user.id);
      
      if (error) throw error;
      onSave({ ...user, ...formData, verificationStatus: newStatus });
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in">
      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border">
        <h2 className="text-3xl font-black mb-10 text-slate-900 border-r-8 border-emerald-500 pr-4">تعديل ملفك الاحترافي ⚙️</h2>
        
        <form onSubmit={submit} className="space-y-12">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.firstName}`} className="w-40 h-40 rounded-[2.5rem] object-cover border-4 border-emerald-50 shadow-xl bg-slate-50" />
              <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={32} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400">تغيير الصورة الشخصية</p>
            <input type="file" hidden ref={avatarInputRef} accept="image/*" onChange={e => handleImageUpload(e, 'avatar')} />
          </div>

          {/* Verification Section */}
          {user.role === UserRole.WORKER && (
            <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="text-emerald-600" />
                <h4 className="text-xl font-black text-emerald-900">توثيق الهوية (إلزامي للظهور كحرفي مفعل)</h4>
              </div>
              <p className="text-slate-600 text-sm mb-6 font-bold leading-relaxed">قم برفع صورة واضحة لبطاقة تعريفك الوطنية أو رخصة السياقة (الوجه والأمام). سيتم مراجعة الوثائق من قبل الإدارة لتفعيل حسابك.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div onClick={() => idFrontRef.current?.click()} className="aspect-video bg-white border-2 border-dashed border-emerald-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-100 transition-all overflow-hidden relative group">
                  {formData.idFront ? (
                    <img src={formData.idFront} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="text-emerald-300" size={40} />
                      <span className="text-xs font-black text-emerald-600 mt-2">البطاقة من الأمام</span>
                    </>
                  )}
                  <input type="file" hidden ref={idFrontRef} accept="image/*" onChange={e => handleImageUpload(e, 'idFront')} />
                </div>
                <div onClick={() => idBackRef.current?.click()} className="aspect-video bg-white border-2 border-dashed border-emerald-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-100 transition-all overflow-hidden relative group">
                  {formData.idBack ? (
                    <img src={formData.idBack} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="text-emerald-300" size={40} />
                      <span className="text-xs font-black text-emerald-600 mt-2">البطاقة من الخلف</span>
                    </>
                  )}
                  <input type="file" hidden ref={idBackRef} accept="image/*" onChange={e => handleImageUpload(e, 'idBack')} />
                </div>
              </div>
              
              <div className="mt-6">
                <VerificationBadge status={formData.verificationStatus} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-black text-slate-700">الاسم</label>
              <input required className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="font-black text-slate-700">اللقب</label>
              <input required className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block font-black mb-4 text-slate-700">تخصصاتك (يمكنك اختيار أكثر من حرفة) 🛠️</label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_CATEGORIES.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => toggleCategory(c.name)}
                  className={`tag-chip px-5 py-2.5 rounded-xl font-black text-sm border-2 flex items-center gap-2 ${formData.categories.includes(c.name) ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}
                >
                  {formData.categories.includes(c.name) && <Check size={14} />} {c.name}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-black mb-4 text-slate-700">معرض الأعمال (صور تظهر جودة عملك) 📸</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {formData.portfolio.map((img: string, idx: number) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-slate-100">
                  <img src={img} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormData(prev => ({...prev, portfolio: prev.portfolio.filter((_, i) => i !== idx)}))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                </div>
              ))}
              {formData.portfolio.length < 5 && (
                <div onClick={() => portfolioInputRef.current?.click()} className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-emerald-50 transition-all">
                  <Plus size={32} />
                  <span className="text-[10px] font-black mt-1">إضافة عمل</span>
                </div>
              )}
            </div>
            <input type="file" hidden ref={portfolioInputRef} accept="image/*" onChange={e => handleImageUpload(e, 'portfolio')} />
          </div>

          <div className="space-y-2">
            <label className="font-black text-slate-700">نبذة عنك (Bio)</label>
            <textarea className="w-full p-6 bg-slate-50 rounded-3xl font-bold h-40 border-none" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="اكتب شيئاً يجذب الزبائن..." />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl active:scale-95 disabled:opacity-50 transition-all">
              {loading ? 'جاري الحفظ...' : 'تحديث الملف ✅'}
            </button>
            <button type="button" onClick={onCancel} className="px-10 bg-slate-100 text-slate-600 rounded-2xl font-black">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SearchWorkersView = ({ workers, loading, filters, onFilterChange, onProfile }: any) => (
  <div className="max-w-7xl mx-auto px-6 py-12">
    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border mb-12 flex flex-col md:flex-row gap-4 animate-in">
      <input placeholder="ابحث عن حرفي بالاسم..." className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold border-none text-lg" value={filters.query} onChange={e => onFilterChange({...filters, query: e.target.value})} />
      <div className="flex gap-4 flex-1">
        <select className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold border-none" value={filters.wilaya} onChange={e => onFilterChange({...filters, wilaya: e.target.value})}>
          <option value="">كل الجزائر 🇩🇿</option>
          {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <select className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold border-none" value={filters.category} onChange={e => onFilterChange({...filters, category: e.target.value})}>
          <option value="">كل التخصصات ⚒️</option>
          {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {loading ? <div className="col-span-full py-20 flex justify-center"><div className="loading-spinner"></div></div> : workers.map((w: any) => (
        <div key={w.id} onClick={() => onProfile(w)} className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 cursor-pointer hover:-translate-y-2 transition-all group overflow-hidden">
          <div className="flex items-center gap-4 mb-6">
            <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-20 h-20 rounded-2xl object-cover shadow-sm bg-slate-50" />
            <div className="text-right flex-1">
              <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{w.firstName} {w.lastName}</h3>
              <div className="flex gap-2 flex-wrap mt-2">
                <VerificationBadge status={w.verificationStatus} />
              </div>
            </div>
          </div>
          <p className="text-slate-500 text-sm line-clamp-2 h-10 mb-6 font-medium leading-relaxed">{w.bio || 'حرفي مسجل في سلكني مستعد لخدمتكم.'}</p>
          <div className="flex justify-between items-center pt-5 border-t border-slate-50">
            <span className="text-slate-400 text-xs font-black flex items-center gap-1"><MapPin size={14} /> {w.wilaya}</span>
            <div className="flex items-center gap-1 text-yellow-500 font-black"><Star size={16} fill="currentColor" /> {w.rating?.toFixed(1) || '0.0'}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Admin Panel Component ---

const AdminPanelView = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('users').select('*').eq('verification_status', 'pending');
    if (!error) setPendingUsers(data.map(d => ({
      ...d, firstName: d.first_name, lastName: d.last_name, location: { wilaya: d.wilaya }, 
      idFront: d.id_front, idBack: d.id_back, verificationStatus: d.verification_status
    })));
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (userId: string, status: VerificationStatus) => {
    const { error } = await supabase.from('users').update({ verification_status: status }).eq('id', userId);
    if (!error) {
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      setSelectedUser(null);
      alert(status === 'verified' ? 'تم تفعيل الحساب بنجاح ✅' : 'تم رفض التفعيل ❌');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-in">
      <h2 className="text-4xl font-black mb-8 flex items-center gap-4"><ShieldCheck className="text-emerald-600" /> طلبات التفعيل المعلقة</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 overflow-y-auto max-h-[70vh]">
          <h3 className="font-black text-slate-400 mb-6 uppercase text-xs tracking-widest">قائمة الطلبات ({pendingUsers.length})</h3>
          <div className="space-y-4">
            {pendingUsers.length === 0 ? (
              <p className="text-center py-10 text-slate-400 font-bold">لا توجد طلبات معلقة</p>
            ) : pendingUsers.map(u => (
              <div 
                key={u.id} 
                onClick={() => setSelectedUser(u)}
                className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center gap-4 ${selectedUser?.id === u.id ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 hover:bg-white border-transparent shadow-sm hover:shadow-md border'}`}
              >
                <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.firstName}`} className="w-12 h-12 rounded-xl object-cover" />
                <div className="text-right">
                  <p className="font-black text-slate-900">{u.firstName} {u.lastName}</p>
                  <p className="text-[10px] text-slate-400 font-bold">📍 {u.location.wilaya}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-emerald-100 animate-in">
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-6">
                  <img src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.firstName}`} className="w-24 h-24 rounded-3xl object-cover" />
                  <div className="text-right">
                    <h3 className="text-3xl font-black text-slate-900">{selectedUser.firstName} {selectedUser.lastName}</h3>
                    <p className="text-slate-500 font-bold">{selectedUser.phone}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={32} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="space-y-4">
                  <p className="font-black text-slate-700 flex items-center gap-2"><Eye size={18} /> البطاقة من الأمام</p>
                  <div className="rounded-3xl border-4 border-slate-50 overflow-hidden shadow-lg bg-slate-900 aspect-video flex items-center justify-center">
                    {selectedUser.idFront ? (
                      <img src={selectedUser.idFront} className="w-full h-full object-contain" />
                    ) : <p className="text-white/20">لا توجد صورة</p>}
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="font-black text-slate-700 flex items-center gap-2"><Eye size={18} /> البطاقة من الخلف</p>
                  <div className="rounded-3xl border-4 border-slate-50 overflow-hidden shadow-lg bg-slate-900 aspect-video flex items-center justify-center">
                    {selectedUser.idBack ? (
                      <img src={selectedUser.idBack} className="w-full h-full object-contain" />
                    ) : <p className="text-white/20">لا توجد صورة</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => handleAction(selectedUser.id, 'verified')}
                  className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-3"
                >
                  <UserCheck size={24} /> تفعيل الحساب
                </button>
                <button 
                  onClick={() => handleAction(selectedUser.id, 'rejected')}
                  className="flex-1 bg-red-50 text-red-600 py-5 rounded-2xl font-black text-xl border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3"
                >
                  <UserX size={24} /> رفض التفعيل
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-100 rounded-[3.5rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 p-20 text-center">
              <ShieldQuestion size={100} strokeWidth={1} />
              <p className="mt-6 text-2xl font-black">اختر طلباً من القائمة لمراجعته</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AuthForm = ({ onSuccess }: any) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = async (e: any) => {
    e.preventDefault(); setLoading(true);
    const { data, error } = await supabase.from('users').select('*').eq('phone', phone).eq('password', password).single();
    if (error) alert("خطأ في بيانات الدخول");
    else {
      const u = { 
        ...data, 
        firstName: data.first_name, 
        lastName: data.last_name, 
        location: { wilaya: data.wilaya }, 
        categories: data.categories || [], 
        portfolio: data.portfolio || [],
        verificationStatus: data.verification_status || 'none',
        idFront: data.id_front,
        idBack: data.id_back
      };
      onSuccess(u);
    }
    setLoading(false);
  };
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in">
      <form onSubmit={login} className="bg-white p-12 rounded-[3.5rem] shadow-2xl border w-full max-w-md space-y-6 text-right">
        <h2 className="text-3xl font-black mb-10 border-r-8 border-emerald-500 pr-4">تسجيل الدخول 👋</h2>
        <div className="space-y-2">
          <label className="font-black text-slate-500 mr-2 text-sm">رقم الهاتف</label>
          <input required placeholder="مثال: 0550123456" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black text-lg outline-none focus:ring-4 ring-emerald-50" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="font-black text-slate-500 mr-2 text-sm">كلمة المرور</label>
          <input required type="password" placeholder="••••••••" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black text-lg outline-none focus:ring-4 ring-emerald-50" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-emerald-500 transition-all">
          {loading ? 'جاري التحقق...' : 'دخول'}
        </button>
      </form>
    </div>
  );
};
