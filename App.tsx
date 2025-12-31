
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserRole, AppState, User, Worker } from './types';
import { SERVICE_CATEGORIES, WILAYAS, DAIRAS } from './constants';
import { getAIRecommendation } from './services/gemini';
import { supabase } from './lib/supabase';

// --- Custom Styles for Animations ---
const GlobalStyles = () => (
  <style>{`
    @keyframes float {
      0% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(5deg); }
      100% { transform: translateY(0px) rotate(0deg); }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-float-delayed { animation: float 8s ease-in-out infinite 1s; }
    .shimmer {
      position: relative;
      overflow: hidden;
    }
    .shimmer::after {
      content: '';
      position: absolute;
      top: -50%; left: -50%;
      width: 200%; height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent);
      transform: rotate(45deg);
      animation: shimmer 3s infinite;
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%) rotate(45deg); }
      100% { transform: translateX(100%) rotate(45deg); }
    }
    .logo-glow:hover {
      filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.4));
    }
    .arabic-text {
      font-family: 'Tajawal', sans-serif;
    }
  `}</style>
);

// --- Sub-components ---

const Logo: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'sm' }) => (
  <div className={`flex items-center gap-3 group cursor-pointer logo-glow transition-all duration-500 ${size === 'lg' ? 'scale-110 md:scale-125' : ''}`}>
    {/* Icon Container */}
    <div className={`relative ${size === 'lg' ? 'w-24 h-24' : 'w-12 h-12'} flex-shrink-0`}>
      <div className={`absolute inset-0 bg-gradient-to-tr from-emerald-600 via-teal-500 to-yellow-400 ${size === 'lg' ? 'rounded-[2rem]' : 'rounded-2xl'} rotate-3 group-hover:rotate-12 transition-transform duration-500 shadow-xl shadow-emerald-500/30 overflow-hidden shimmer`}>
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center text-white font-black ${size === 'lg' ? 'text-5xl' : 'text-2xl'} drop-shadow-lg z-10 group-hover:scale-110 transition-transform`}>
        S
      </div>
      {/* Decorative dots for Algerian flag colors subtle hint */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white z-20 shadow-md"></div>
    </div>

    {/* Text Container */}
    <div className="flex flex-col items-start leading-none gap-0.5">
      <div className="flex items-baseline gap-1.5">
        <span className={`${size === 'lg' ? 'text-6xl md:text-8xl' : 'text-3xl'} font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-700`}>
          Salakni
        </span>
        <span className={`${size === 'lg' ? 'text-4xl' : 'text-xl'} arabic-text font-black text-yellow-500 drop-shadow-sm`}>
          سلكني
        </span>
      </div>
      <div className={`flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity ${size === 'lg' ? 'text-lg' : 'text-[9px]'} font-bold uppercase tracking-[0.3em] text-emerald-900`}>
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
        Professional Network
      </div>
    </div>
  </div>
);

const Navbar: React.FC<{ 
  onNavigate: (view: AppState['view']) => void, 
  currentView: AppState['view'], 
  user: User | null, 
  onLogout: () => void 
}> = ({ onNavigate, currentView, user, onLogout }) => (
  <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 hidden md:block">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-24">
        <div onClick={() => onNavigate('landing')}>
          <Logo />
        </div>
        <div className="flex space-x-reverse space-x-10 items-center">
          <button onClick={() => onNavigate('landing')} className={`${currentView === 'landing' ? 'text-emerald-600 font-black' : 'text-gray-600'} hover:text-emerald-500 transition font-bold text-lg relative group`}>
            الرئيسية
            <span className={`absolute -bottom-2 left-0 right-0 h-1 bg-emerald-500 transition-all ${currentView === 'landing' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
          </button>
          <button onClick={() => onNavigate('search')} className={`${currentView === 'search' ? 'text-emerald-600 font-black' : 'text-gray-600'} hover:text-emerald-500 transition font-bold text-lg relative group`}>
            تصفح الحرفيين
            <span className={`absolute -bottom-2 left-0 right-0 h-1 bg-emerald-500 transition-all ${currentView === 'search' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
          </button>
          {!user ? (
            <>
              <button onClick={() => onNavigate('login')} className="text-gray-600 hover:text-emerald-500 transition font-black text-lg">دخول</button>
              <button onClick={() => onNavigate('register')} className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-8 py-3.5 rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-emerald-500/20 transition-all active:scale-95 shimmer">انضم إلينا</button>
            </>
          ) : (
            <div className="flex items-center gap-4 bg-gray-50 p-2 pr-5 rounded-3xl border border-gray-100 hover:bg-gray-100 transition cursor-pointer group shadow-sm" onClick={() => onNavigate('profile')}>
              <div className="flex flex-col items-end">
                <span className="text-base font-black text-gray-800 group-hover:text-emerald-600 transition-colors">{user.firstName}</span>
                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">حسابي الشخصي</span>
              </div>
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`} 
                  className="w-full h-full object-cover" 
                  alt="Profile"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </nav>
);

const BottomNav: React.FC<{
  onNavigate: (view: AppState['view']) => void,
  currentView: AppState['view'],
  user: User | null
}> = ({ onNavigate, currentView, user }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden">
      <div className="flex justify-around items-center h-20 pb-safe mb-1">
        <button onClick={() => onNavigate('landing')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition ${currentView === 'landing' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <span className="text-2xl">{currentView === 'landing' ? '🏠' : '🏠'}</span>
          <span className="text-[11px] font-black uppercase tracking-tighter">الرئيسية</span>
        </button>
        <button onClick={() => onNavigate('search')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition ${currentView === 'search' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <span className="text-2xl">🔍</span>
          <span className="text-[11px] font-black uppercase tracking-tighter">تصفح</span>
        </button>
        {!user ? (
          <button onClick={() => onNavigate('register')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition ${currentView === 'register' || currentView === 'login' ? 'text-emerald-600' : 'text-gray-400'}`}>
            <span className="text-2xl">👤</span>
            <span className="text-[11px] font-black uppercase tracking-tighter">انضم</span>
          </button>
        ) : (
          <button onClick={() => onNavigate('profile')} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition ${currentView === 'profile' ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-xl overflow-hidden border-2 ${currentView === 'profile' ? 'border-emerald-600' : 'border-transparent'}`}>
              <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&background=random`} className="w-full h-full object-cover" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-tighter">حسابي</span>
          </button>
        )}
      </div>
    </div>
  );
};

// --- Profile Page Component ---
const ProfilePage: React.FC<{ user: User, onUpdate: (user: User) => void, onLogout: () => void }> = ({ user, onUpdate, onLogout }) => {
  const [formData, setFormData] = useState({ ...user });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ text: 'حجم الصورة كبير جداً (الأقصى 2MB)', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          wilaya: formData.location.wilaya,
          daira: formData.location.daira,
          avatar: formData.avatar,
          bio: formData.bio,
          category: formData.category
        })
        .eq('id', user.id);

      if (error) throw error;

      onUpdate(formData);
      setMessage({ text: 'تم تحديث ملفك الشخصي بنجاح! 🎉', type: 'success' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: 'حدث خطأ أثناء حفظ البيانات: ' + (err.message || 'حاول مرة أخرى'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-20 mb-28 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-gray-100">
        <div className="relative h-56 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent"></div>
          
          <div className="absolute top-8 left-8 flex gap-3">
             <button 
              onClick={onLogout} 
              className="bg-white/10 backdrop-blur-md text-white px-6 py-2.5 rounded-2xl font-black text-sm hover:bg-red-500 transition-all shadow-xl border border-white/20 active:scale-95"
            >
              تسجيل الخروج 👋
            </button>
          </div>
        </div>

        <div className="px-8 md:px-16 pb-16 -mt-28 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-16">
            <div className="relative group">
              <div 
                className="w-48 h-48 md:w-56 md:h-56 rounded-[3.5rem] border-8 border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden bg-gray-50 cursor-pointer relative"
                onClick={() => fileInputRef.current?.click()}
              >
                <img 
                  src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=random&size=256`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  alt="Profile"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                   <div className="text-white text-center">
                      <span className="text-3xl">📸</span>
                      <p className="font-black text-xs mt-2 uppercase tracking-widest">تحديث الصورة</p>
                   </div>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-4 rounded-3xl shadow-lg border-4 border-white animate-bounce md:animate-none">
                 <span className="text-white text-xl">✨</span>
              </div>
            </div>

            <div className="text-center md:text-right flex-1">
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                {formData.firstName} <span className="text-emerald-600">{formData.lastName}</span>
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                <span className="bg-emerald-50 text-emerald-700 px-5 py-2 rounded-2xl font-black text-xs border border-emerald-100 uppercase tracking-widest">
                  {user.role === UserRole.WORKER ? 'حرفي محترف 🛠️' : 'عضو سلكني 👤'}
                </span>
                <span className="bg-gray-50 text-gray-400 px-5 py-2 rounded-2xl font-black text-xs border border-gray-100 uppercase tracking-widest">
                  {formData.phone}
                </span>
              </div>
            </div>
          </div>

          {message && (
            <div className={`mb-12 p-6 rounded-[2rem] font-black text-center animate-in zoom-in-95 slide-in-from-top-4 duration-300 shadow-xl border-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-12">
            <div className="bg-gray-50/50 p-8 md:p-10 rounded-[3rem] border border-gray-100">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3 mb-8">
                <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                المعلومات الشخصية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-3 uppercase tracking-[0.2em]">الاسم الأول</label>
                  <input 
                    type="text" 
                    value={formData.firstName} 
                    onChange={e => setFormData({...formData, firstName: e.target.value})} 
                    className="w-full p-5 bg-white border-2 border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-lg shadow-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-3 uppercase tracking-[0.2em]">اللقب</label>
                  <input 
                    type="text" 
                    value={formData.lastName} 
                    onChange={e => setFormData({...formData, lastName: e.target.value})} 
                    className="w-full p-5 bg-white border-2 border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-lg shadow-sm" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50/50 p-8 md:p-10 rounded-[3rem] border border-gray-100">
              <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3 mb-8">
                <span className="w-2 h-8 bg-teal-500 rounded-full"></span>
                منطقة التواجد
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-3 uppercase tracking-[0.2em]">الولاية</label>
                  <select 
                    value={formData.location.wilaya} 
                    onChange={e => setFormData({...formData, location: { wilaya: e.target.value, daira: '' }})} 
                    className="w-full p-5 bg-white border-2 border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-lg shadow-sm appearance-none"
                  >
                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-3 uppercase tracking-[0.2em]">الدائرة</label>
                  <select 
                    value={formData.location.daira} 
                    onChange={e => setFormData({...formData, location: { ...formData.location, daira: e.target.value }})} 
                    disabled={!formData.location.wilaya}
                    className="w-full p-5 bg-white border-2 border-gray-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-lg shadow-sm appearance-none disabled:opacity-50"
                  >
                    <option value="">اختر الدائرة</option>
                    {(formData.location.wilaya ? DAIRAS[formData.location.wilaya] : []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {user.role === UserRole.WORKER && (
              <div className="bg-emerald-50/30 p-8 md:p-10 rounded-[3rem] border border-emerald-100">
                <h3 className="text-2xl font-black text-emerald-900 flex items-center gap-3 mb-8">
                  <span className="w-2 h-8 bg-yellow-400 rounded-full shadow-sm"></span>
                  الملف المهني
                </h3>
                <div className="space-y-8">
                  <div>
                    <label className="block text-xs font-black text-emerald-600 mb-3 uppercase tracking-[0.2em]">التخصص المهني الرئيسي</label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})} 
                      className="w-full p-5 bg-white border-2 border-emerald-100 rounded-2xl font-black text-emerald-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-lg shadow-sm appearance-none"
                    >
                      {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-emerald-600 mb-3 uppercase tracking-[0.2em]">نبذة تعريفية (تظهر للزبائن)</label>
                    <textarea 
                      rows={5} 
                      value={formData.bio} 
                      onChange={e => setFormData({...formData, bio: e.target.value})} 
                      className="w-full p-6 bg-white border-2 border-emerald-100 rounded-[2.5rem] font-medium outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-lg shadow-sm resize-none italic" 
                      placeholder="أخبر الزبائن عن خبراتك ومهاراتك..."
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-12">
              <button 
                type="submit" 
                disabled={isSaving}
                className="group relative w-full py-7 bg-gradient-to-r from-emerald-600 to-teal-800 text-white rounded-[2.5rem] font-black shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all active:scale-95 disabled:opacity-50 text-2xl overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-4">
                  {isSaving ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      حفظ التغييرات النهائية ✅
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
              <p className="text-center text-xs text-gray-400 mt-6 font-bold uppercase tracking-[0.3em]">بياناتك محمية ومشفرة وفق معايير سلكني الأمنية 🛡️</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const LandingHero: React.FC<{ onStart: (view: AppState['view']) => void }> = ({ onStart }) => (
  <div className="relative min-h-[95vh] flex items-center justify-center text-white text-center overflow-hidden">
    <GlobalStyles />
    {/* Animated Floating Background Elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-10 text-6xl opacity-10 animate-float">🛠️</div>
      <div className="absolute top-1/2 right-10 text-6xl opacity-10 animate-float-delayed">⚡</div>
      <div className="absolute bottom-1/4 left-20 text-6xl opacity-10 animate-float">🎨</div>
      <div className="absolute top-1/3 left-1/2 text-6xl opacity-10 animate-float-delayed">🏠</div>
    </div>

    <div 
      className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[15s] hover:scale-110"
      style={{ 
        backgroundImage: 'url("https://images.unsplash.com/photo-1504148455328-4972fefebf5b?q=80&w=2070&auto=format&fit=crop")',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 via-emerald-950/80 to-teal-900/90"></div>
    </div>

    <div className="max-w-7xl mx-auto px-6 relative z-10 py-24">
      <div className="flex flex-col items-center mb-16 animate-in fade-in slide-in-from-top-12 duration-1000">
        <div className="bg-white/5 backdrop-blur-3xl p-10 md:p-20 rounded-[6rem] border border-white/10 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] relative group overflow-hidden">
          {/* Enhanced decorative background image with higher blur */}
          <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay scale-110 blur-2xl group-hover:scale-125 transition-transform duration-[4s]">
            <img 
              src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1200&auto=format&fit=crop" 
              className="w-full h-full object-cover" 
              alt="Craftsmanship"
            />
          </div>
          
          <div className="relative z-10">
            <Logo size="lg" />
            
            <div className="mt-12 inline-flex items-center gap-5 bg-white/10 px-12 py-5 rounded-full border border-white/20 text-emerald-50 text-base md:text-3xl font-black tracking-[0.2em] uppercase backdrop-blur-md shadow-inner">
              <span className="w-5 h-5 bg-yellow-400 rounded-full animate-ping"></span>
              خدمتك سلكتها في دقيقة 🇩🇿
            </div>
          </div>
        </div>
      </div>

      <h1 className="text-6xl md:text-9xl font-black mb-12 leading-[1] tracking-tight drop-shadow-2xl">
        ريح بالك، <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-yellow-200 to-emerald-400">سَلّكني</span> يسلكها
      </h1>
      
      <p className="text-2xl md:text-4xl mb-20 text-emerald-50/80 max-w-4xl mx-auto font-medium leading-relaxed">
        المنصة رقم #1 في الجزائر لربط الحرفيين المهرة بأصحاب المشاريع والخدمات المنزلية بكل أمان.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
        <button 
          onClick={() => onStart('search')} 
          className="group w-full sm:w-auto bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 text-white px-20 py-7 rounded-[3rem] font-black text-3xl hover:scale-105 hover:shadow-[0_40px_80px_-15px_rgba(16,185,129,0.5)] transition-all active:scale-95 flex items-center justify-center gap-5 shimmer"
        >
          اطلب خدمة الآن 🔍
          <span className="group-hover:translate-x-4 transition-transform text-4xl">←</span>
        </button>
        <button 
          onClick={() => onStart('register')} 
          className="w-full sm:w-auto bg-white/5 backdrop-blur-2xl text-white px-20 py-7 rounded-[3rem] font-black text-3xl hover:bg-white/10 transition-all border border-white/20 active:scale-95 shadow-2xl"
        >
          سجل كحرفي 🛠️
        </button>
      </div>

      <div className="mt-40 flex flex-col items-center animate-bounce opacity-50">
        <span className="text-sm font-black uppercase tracking-[0.6em] mb-6">اكتشف المزيد</span>
        <div className="w-1.5 h-16 bg-gradient-to-b from-white to-transparent rounded-full"></div>
      </div>
    </div>
  </div>
);

const HowItWorks: React.FC = () => (
  <section className="py-32 bg-white relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-6 relative z-10">
      <div className="text-center mb-24">
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6">كيف يعمل <span className="text-emerald-600">سلكني</span>؟</h2>
        <p className="text-gray-500 text-xl font-medium">3 خطوات بسيطة لتبدأ تجربتك معنا</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-emerald-50 -translate-y-1/2 z-0"></div>
        {[
          { step: '01', title: 'سجل حسابك', desc: 'أنشئ حسابك في ثوانٍ سواء كنت باحثاً عن خدمة أو حرفياً محترفاً.', icon: '📱' },
          { step: '02', title: 'ابحث واختر', desc: 'استخدم محرك البحث الذكي أو مساعدنا الآلي لتجد الحرفي الأقرب إليك.', icon: '🔍' },
          { step: '03', title: 'تواصل مباشرة', desc: 'اتصل بالحرفي مباشرة واتفق على التفاصيل، بدون أي عمولات خفية.', icon: '🤝' }
        ].map((item, idx) => (
          <div key={idx} className="relative z-10 bg-white p-12 rounded-[4rem] border-2 border-gray-50 shadow-xl shadow-gray-100/50 hover:-translate-y-4 transition-all duration-500 text-center group">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center text-5xl mx-auto mb-8 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
              {item.icon}
            </div>
            <span className="text-emerald-200 font-black text-6xl absolute top-8 right-8 opacity-20">{item.step}</span>
            <h3 className="text-2xl font-black text-gray-900 mb-4">{item.title}</h3>
            <p className="text-gray-500 leading-relaxed font-medium">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const WorkerProfileModal: React.FC<{ worker: Worker; onClose: () => void }> = ({ worker, onClose }) => {
  const categoryName = SERVICE_CATEGORIES.find(c => c.id === worker.category || c.name === worker.category)?.name || worker.category;
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-md p-0 md:p-4 transition-all cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-xl rounded-t-[4rem] md:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-48 bg-gradient-to-l from-emerald-600 to-teal-800">
          <button 
            onClick={onClose} 
            className="absolute top-8 right-8 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-all text-xl z-50 active:scale-90"
            title="إغلاق والعودة للائحة"
          >
            ✕
          </button>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
        </div>
        <div className="px-10 pb-12 -mt-20 relative">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <img 
                src={worker.avatar || `https://ui-avatars.com/api/?name=${worker.firstName}+${worker.lastName}&background=random&size=128`} 
                className="w-40 h-40 rounded-[3rem] border-8 border-white shadow-2xl object-cover bg-white group-hover:scale-105 transition-transform duration-500" 
                alt={worker.firstName} 
              />
              <div className="absolute bottom-4 right-4 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white shadow-lg animate-bounce"></div>
            </div>
            <h2 className="mt-6 text-4xl font-black text-gray-900">{worker.firstName} {worker.lastName}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-emerald-700 font-black bg-emerald-50 px-6 py-2 rounded-2xl text-sm border border-emerald-100 uppercase tracking-tight">{categoryName}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-12">
            <div className="text-center p-5 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="text-yellow-500 font-black text-2xl">★ {worker.rating.toFixed(1)}</div>
              <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">التقييم العام</div>
            </div>
            <div className="text-center p-5 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="text-emerald-600 font-black text-2xl">{worker.completedJobs}</div>
              <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">خدمة مكتملة</div>
            </div>
            <div className="text-center p-5 bg-gray-50 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="text-teal-600 font-black text-2xl">📍</div>
              <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">{worker.location.daira}</div>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="font-black text-gray-900 text-xl mb-4 flex items-center gap-3">
              <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
              عن الحرفي
            </h3>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed bg-emerald-50/20 p-6 rounded-[2rem] border border-emerald-100/30 font-medium italic">
              "{worker.bio || "هذا الحرفي لم يضف نبذة شخصية بعد. ولكنه مستعد لخدمتكم بأفضل جودة."}"
            </p>
          </div>

          <div className="mt-12 flex flex-col gap-4">
            <div className="flex gap-4">
              <a 
                href={`tel:${worker.phone}`} 
                className="flex-[2] bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-6 rounded-[2.5rem] font-black text-center shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-4 text-xl"
              >
                <span>📞</span> اتصل الآن
              </a>
              <button className="flex-1 bg-gray-100 text-gray-600 py-6 rounded-[2.5rem] font-bold hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center text-2xl">
                💬
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="w-full py-5 bg-gray-50 text-gray-400 rounded-[2rem] font-black text-sm hover:bg-gray-100 transition-all active:scale-95 border border-gray-100 uppercase tracking-widest"
            >
              الرجوع إلى لائحة الحرفيين ↩️
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-10 font-bold uppercase tracking-widest">🛡️ جميع التعاملات تحت إشراف منصة سلكني الجزائر</p>
        </div>
      </div>
    </div>
  );
};

const WorkerCard: React.FC<{ 
  worker: Worker, 
  user: User | null,
  onRate: (worker: Worker) => void,
  onSelect: (worker: Worker) => void
}> = ({ worker, user, onRate, onSelect }) => {
  const isNear = user && worker.location.wilaya === user.location.wilaya && worker.location.daira === user.location.daira;

  return (
    <div 
      onClick={() => onSelect(worker)}
      className={`bg-white rounded-[3rem] p-6 md:p-8 shadow-sm border ${isNear ? 'border-emerald-200 bg-emerald-50/10' : 'border-gray-100'} hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group relative overflow-hidden active:scale-[0.98]`}
    >
      {isNear && (
        <span className="absolute top-4 left-4 md:top-6 md:left-6 bg-emerald-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full flex items-center gap-1 z-10 shadow-lg animate-pulse">
          📍 قريب منك
        </span>
      )}
      <div className="flex items-start gap-5">
        <div className="relative">
          <img 
            src={worker.avatar || `https://ui-avatars.com/api/?name=${worker.firstName}+${worker.lastName}&background=random`} 
            alt={worker.firstName} 
            className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] object-cover shadow-xl flex-shrink-0 group-hover:rotate-3 transition-transform" 
          />
          <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-md">
             <div className="bg-emerald-500 w-4 h-4 rounded-full border-2 border-white"></div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl md:text-2xl font-black text-gray-900 truncate">{worker.firstName} {worker.lastName}</h3>
          <p className="text-sm md:text-base text-emerald-600 font-black mb-2 truncate">
            {SERVICE_CATEGORIES.find(c => c.id === worker.category || c.name === worker.category)?.name || worker.category}
          </p>
          <div className="flex items-center gap-1 text-xs md:text-sm text-gray-500 font-bold">
            <span>📍 {worker.location.wilaya}، {worker.location.daira}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-2xl text-base font-black border border-yellow-100 flex items-center gap-1 shadow-sm">
            <span className="text-yellow-500 text-xl">★</span> {worker.rating.toFixed(1)}
          </div>
        </div>
      </div>
      <p className="mt-6 text-sm md:text-base text-gray-500 line-clamp-2 leading-relaxed h-12 italic font-medium">
        "{worker.bio}"
      </p>
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-black">✓</span>
          <span className="text-xs font-black text-gray-400 uppercase tracking-wider">{worker.completedJobs} خدمة ناجحة</span>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={(e) => { e.stopPropagation(); onRate(worker); }}
            className="flex-1 sm:flex-none text-emerald-600 px-6 py-3 rounded-2xl text-sm font-black hover:bg-emerald-50 transition border border-emerald-100"
          >
            تقييم
          </button>
          <button className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-8 py-3 rounded-2xl text-sm font-black hover:shadow-lg hover:shadow-emerald-200 transition-all">
            تواصل
          </button>
        </div>
      </div>
    </div>
  );
};

const SearchPage: React.FC<{ user: User | null }> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedDaira, setSelectedDaira] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewingWorker, setViewingWorker] = useState<Worker | null>(null);

  useEffect(() => {
    const fetchWorkers = async () => {
      setIsLoadingWorkers(true);
      try {
        const { data, error } = await supabase.from('users').select('*').eq('role', 'WORKER');
        if (error) throw error;
        if (data) {
          setWorkers(data.map(w => ({
            ...w,
            firstName: w.first_name,
            lastName: w.last_name,
            location: { wilaya: w.wilaya, daira: w.daira },
            completedJobs: w.completed_jobs,
            avatar: w.avatar,
            bio: w.bio,
            category: w.category
          })) as Worker[]);
        }
      } catch (err) {
        console.error("Fetch workers error:", err);
      } finally {
        setIsLoadingWorkers(false);
      }
    };
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (user?.location) {
      setSelectedWilaya(user.location.wilaya);
      setSelectedDaira(user.location.daira);
    }
  }, [user]);

  const filteredWorkers = useMemo(() => {
    return workers.filter(worker => {
      const nameStr = `${worker.firstName} ${worker.lastName}`.toLowerCase();
      const profession = SERVICE_CATEGORIES.find(c => c.id === worker.category || c.name === worker.category);
      const professionName = (profession?.name || worker.category).toLowerCase();
      const term = searchTerm.toLowerCase();
      const matchesSearch = nameStr.includes(term) || professionName.includes(term);
      const matchesWilaya = !selectedWilaya || worker.location.wilaya === selectedWilaya;
      const matchesDaira = !selectedDaira || worker.location.daira === selectedDaira;
      const matchesCategory = !selectedCategory || worker.category === selectedCategory || (profession?.id === selectedCategory);
      return matchesSearch && matchesWilaya && matchesDaira && matchesCategory;
    });
  }, [workers, searchTerm, selectedWilaya, selectedDaira, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 mb-28">
      {viewingWorker && <WorkerProfileModal worker={viewingWorker} onClose={() => setViewingWorker(null)} />}
      
      <div className="mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 leading-tight tracking-tight">ابحث عن <span className="text-emerald-600 underline decoration-yellow-400 decoration-wavy">الاحترافية</span> في منطقتك</h1>
        <div className="max-w-3xl mx-auto relative group">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-6 md:p-8 pr-16 bg-white border-2 border-gray-100 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition text-lg md:text-2xl font-bold"
            placeholder="ابحث عن حرفة (مثلاً: سباك، نجار...) أو اسم..."
          />
          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl group-focus-within:scale-125 transition-transform duration-500">🔍</span>
        </div>
      </div>

      <div className="md:hidden mb-10">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="w-full py-5 bg-white border-2 border-emerald-100 rounded-[2rem] font-black text-emerald-700 flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
        >
          {showFilters ? 'إغلاق خيارات التصفية 🔼' : 'تحديد الموقع والمهنة 🔽'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block lg:col-span-1 bg-white p-10 rounded-[3rem] shadow-2xl shadow-gray-100/50 border border-gray-50 h-fit lg:sticky lg:top-32 z-20`}>
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black">⚙️ فلاتر</h2>
            <button onClick={() => { setSelectedWilaya(''); setSelectedDaira(''); setSelectedCategory(''); setSearchTerm(''); }} className="text-xs font-black text-red-500 uppercase tracking-widest border-b-2 border-red-100 hover:border-red-500 transition-all pb-1">إعادة ضبط</button>
          </div>
          <div className="space-y-8">
            <div>
              <label className="block text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">الولاية</label>
              <select value={selectedWilaya} onChange={(e) => { setSelectedWilaya(e.target.value); setSelectedDaira(''); }} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-base font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all">
                <option value="">كل الجزائر</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">الدائرة</label>
              <select value={selectedDaira} onChange={(e) => setSelectedDaira(e.target.value)} disabled={!selectedWilaya} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-base font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all disabled:opacity-50">
                <option value="">كل الدوائر</option>
                {selectedWilaya && DAIRAS[selectedWilaya]?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">نوع الحرفة</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-base font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all">
                <option value="">جميع التخصصات</option>
                {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-12">
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-8 md:p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-white/20 p-3 rounded-2xl text-3xl shadow-inner shadow-white/10">🤖</div>
                <div>
                  <h3 className="font-black text-xl md:text-3xl">مساعد سلكني الذكي</h3>
                  <p className="text-emerald-200/60 text-xs md:text-sm font-bold uppercase tracking-widest mt-1">تكنولوجيا الذكاء الاصطناعي</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  type="text" 
                  value={aiInput} 
                  onChange={(e) => setAiInput(e.target.value)} 
                  placeholder="مثال: نحتاج نجار شاطر في تيبازة لتركيب أبواب خشبية..." 
                  className="flex-1 p-5 md:p-6 rounded-3xl text-base md:text-lg bg-white/10 border border-white/10 text-white placeholder-white/30 outline-none focus:bg-white/20 transition-all shadow-inner" 
                />
                <button 
                  onClick={async () => {
                    if(!aiInput.trim()) return;
                    setIsAiLoading(true);
                    const suggestion = await getAIRecommendation(aiInput, filteredWorkers);
                    setAiSuggestion(suggestion || '');
                    setIsAiLoading(false);
                  }} 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-emerald-950 px-10 md:px-12 py-4 rounded-3xl font-black text-lg active:scale-95 transition-all shadow-xl shadow-yellow-900/20"
                >
                  {isAiLoading ? 'جاري التحليل...' : 'اسأل سلكني'}
                </button>
              </div>
              {aiSuggestion && (
                <div className="mt-8 p-8 bg-white/10 rounded-[2.5rem] text-sm md:text-lg leading-relaxed border border-white/5 animate-in fade-in zoom-in-95 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3 text-yellow-400 font-black italic">
                    <span className="text-2xl">✨</span> نصيحة سلكني:
                  </div>
                  {aiSuggestion}
                </div>
              )}
            </div>
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none group-hover:scale-150 transition-transform duration-[2s]"></div>
          </div>

          <div className="flex justify-between items-center px-4">
            <h2 className="text-2xl md:text-3xl font-black text-gray-800">النتائج المتاحة ({filteredWorkers.length})</h2>
            <div className="flex items-center gap-2">
               <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
               <span className="text-xs font-black text-gray-400 uppercase tracking-widest">مباشر الآن</span>
            </div>
          </div>

          {isLoadingWorkers ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="w-16 h-16 border-8 border-emerald-600 border-t-transparent rounded-full animate-spin shadow-xl shadow-emerald-100"></div>
              <span className="text-gray-400 text-lg font-black tracking-widest animate-pulse">جاري البحث في القاعدة...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {filteredWorkers.map(worker => (
                <WorkerCard 
                  key={worker.id} 
                  worker={worker} 
                  user={user} 
                  onRate={() => {}} 
                  onSelect={setViewingWorker}
                />
              ))}
              {filteredWorkers.length === 0 && (
                <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-gray-100 shadow-inner">
                  <div className="text-8xl mb-8 grayscale opacity-20">🔎</div>
                  <h3 className="text-3xl font-black text-gray-400">لم نجد أي حرفي حالياً</h3>
                  <p className="text-gray-300 mt-4 text-lg font-bold">جرب توسيع نطاق البحث ليشمل ولايات أخرى أو تخصصات مشابهة</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AuthForm: React.FC<{ type: 'login' | 'register', onSuccess: (user: User) => void }> = ({ type, onSuccess }) => {
  const [role, setRole] = useState<UserRole>(UserRole.SEEKER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    firstName: '', lastName: '', phone: '', 
    password: '', wilaya: '', daira: '', 
    category: '', bio: '' 
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'front') setIdFront(reader.result as string);
        else setIdBack(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'register') {
       if (role === UserRole.WORKER && (!idFront || !idBack)) {
          alert('يجب تحميل صورة بطاقة التعريف من الأمام والخلف لتوثيق الحساب.');
          return;
       }
       if (formData.password.length < 6) {
          alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
          return;
       }
    }

    setIsSubmitting(true);
    try {
      if (type === 'register') {
        const { data, error } = await supabase.from('users').insert([{
          first_name: formData.firstName, last_name: formData.lastName, 
          phone: formData.phone, password: formData.password,
          role: role, wilaya: formData.wilaya, daira: formData.daira, 
          category: formData.category, bio: formData.bio || 'عضو سلكني', 
          rating: 0, completed_jobs: 0, avatar: null,
          id_front: idFront, id_back: idBack, is_verified: false
        }]).select().single();
        
        if (error) throw error;
        if (data) onSuccess({ 
          id: data.id, firstName: data.first_name, lastName: data.last_name, 
          phone: data.phone, role: data.role as UserRole, 
          location: { wilaya: data.wilaya, daira: data.daira }, 
          avatar: data.avatar, bio: data.bio, category: data.category 
        });
      } else {
        // Login Logic
        const { data, error } = await supabase.from('users')
          .select('*')
          .eq('phone', formData.phone)
          .eq('password', formData.password)
          .single();
          
        if (error || !data) {
          alert('رقم الهاتف أو كلمة المرور غير صحيحة.');
          setIsSubmitting(false);
          return;
        }
        
        onSuccess({ 
          id: data.id, firstName: data.first_name, lastName: data.last_name, 
          phone: data.phone, role: data.role as UserRole, 
          location: { wilaya: data.wilaya, daira: data.daira }, 
          avatar: data.avatar, bio: data.bio, category: data.category 
        });
      }
    } catch (err: any) {
      console.error(err);
      alert('خطأ: ' + (err.message || 'حاول مرة أخرى'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-16 md:my-32 p-8 md:p-14 bg-white rounded-[4rem] shadow-2xl shadow-gray-200/50 border border-gray-50 mb-48 mx-4 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full -mr-24 -mt-24"></div>
      <div className="text-center mb-10">
        <Logo size="sm" />
      </div>
      <h2 className="text-4xl font-black mb-10 text-center text-gray-900 leading-tight">
        {type === 'login' ? 'مرحباً بعودتك' : 'سجل الآن في سلكني'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        {type === 'register' && (
          <div className="flex bg-gray-50 p-2 rounded-[2rem] mb-10 border-2 border-gray-100">
            <button type="button" onClick={() => setRole(UserRole.SEEKER)} className={`flex-1 py-4 rounded-3xl text-sm md:text-lg font-black transition-all ${role === UserRole.SEEKER ? 'bg-white shadow-xl text-emerald-600' : 'text-gray-400'}`}>أبحث عن خدمة</button>
            <button type="button" onClick={() => setRole(UserRole.WORKER)} className={`flex-1 py-4 rounded-3xl text-sm md:text-lg font-black transition-all ${role === UserRole.WORKER ? 'bg-white shadow-xl text-emerald-600' : 'text-gray-400'}`}>أنا حرفي</button>
          </div>
        )}
        <div className="space-y-6">
          {type === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-6">
                <input type="text" required placeholder="الاسم" className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none text-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <input type="text" required placeholder="اللقب" className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none text-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              {role === UserRole.WORKER && (
                <>
                  <select required className="w-full p-5 bg-emerald-50 border-2 border-emerald-100 rounded-3xl outline-none text-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black text-emerald-800" onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="">اختر التخصص المهني</option>
                    {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  
                  {/* ID Verification Section */}
                  <div className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                    <h4 className="text-gray-900 font-black mb-4 flex items-center gap-2">
                       <span>🪪</span> توثيق الهوية (إجباري للحرفيين)
                    </h4>
                    <p className="text-xs text-gray-500 mb-6 font-medium">يرجى تصوير بطاقة التعريف الوطنية أو رخصة السياقة من الجهتين.</p>
                    <div className="grid grid-cols-2 gap-4">
                       <label className="relative cursor-pointer group">
                          <div className={`aspect-video rounded-2xl border-2 border-dashed ${idFront ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-white'} flex flex-col items-center justify-center p-4 transition-all overflow-hidden`}>
                             {idFront ? (
                               <img src={idFront} className="absolute inset-0 w-full h-full object-cover" />
                             ) : (
                               <>
                                 <span className="text-2xl mb-1">📸</span>
                                 <span className="text-[10px] font-black text-gray-400">الجهة الأمامية</span>
                               </>
                             )}
                          </div>
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(e, 'front')} />
                       </label>
                       <label className="relative cursor-pointer group">
                          <div className={`aspect-video rounded-2xl border-2 border-dashed ${idBack ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-white'} flex flex-col items-center justify-center p-4 transition-all overflow-hidden`}>
                             {idBack ? (
                               <img src={idBack} className="absolute inset-0 w-full h-full object-cover" />
                             ) : (
                               <>
                                 <span className="text-2xl mb-1">📸</span>
                                 <span className="text-[10px] font-black text-gray-400">الجهة الخلفية</span>
                               </>
                             )}
                          </div>
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(e, 'back')} />
                       </label>
                    </div>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-6">
                <select required className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none text-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value, daira: ''})}>
                  <option value="">الولاية</option>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <select required className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none text-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" disabled={!formData.wilaya} value={formData.daira} onChange={e => setFormData({...formData, daira: e.target.value})}>
                  <option value="">الدائرة</option>
                  {(formData.wilaya ? DAIRAS[formData.wilaya] : []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </>
          )}
          
          <input 
            type="tel" 
            required 
            placeholder="رقم الهاتف (مثال: 0550...)" 
            className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none text-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-mono" 
            onChange={e => setFormData({...formData, phone: e.target.value})} 
          />
          
          <div className="relative group">
            <input 
              type={showPassword ? "text" : "password"} 
              required 
              placeholder="كلمة المرور" 
              className="w-full p-5 pr-14 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none text-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" 
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-gray-400 hover:text-emerald-500 transition-colors"
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>
        
        <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-[2rem] font-black shadow-2xl shadow-emerald-200 active:scale-95 transition-all disabled:opacity-50 text-xl mt-6">
          {isSubmitting ? 'جاري التحقق...' : (type === 'login' ? 'دخول آمن' : 'إنشاء الحساب ✅')}
        </button>
      </form>
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<AppState>({ currentUser: null, workers: [], view: 'landing' });
  const handleNavigate = (view: AppState['view']) => { window.scrollTo({ top: 0, behavior: 'smooth' }); setState(prev => ({ ...prev, view })); };
  const handleLoginSuccess = (user: User) => setState(prev => ({ ...prev, currentUser: user, view: 'search' }));
  const handleUserUpdate = (user: User) => setState(prev => ({ ...prev, currentUser: user }));
  const handleLogout = () => setState(prev => ({ ...prev, currentUser: null, view: 'landing' }));

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-24 md:pb-0 bg-gray-50 overflow-x-hidden">
      <Navbar onNavigate={handleNavigate} currentView={state.view} user={state.currentUser} onLogout={handleLogout} />
      
      <main className="flex-grow">
        {state.view === 'landing' && (
          <div className="animate-in fade-in duration-1000">
            <LandingHero onStart={handleNavigate} />
            
            <div className="bg-emerald-50/30 py-24 border-y border-emerald-100">
               <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                  {[
                    { label: 'حرفي موثوق', val: '+10,000' },
                    { label: 'ولاية مغطاة', val: '58' },
                    { label: 'خدمة ناجحة', val: '+50,000' },
                    { label: 'دعم فني', val: '24/7' }
                  ].map((stat, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <span className="text-4xl md:text-5xl font-black text-emerald-900">{stat.val}</span>
                      <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{stat.label}</span>
                    </div>
                  ))}
               </div>
            </div>

            <HowItWorks />

            <div className="max-w-7xl mx-auto px-6 py-32 text-center">
              <h2 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 tracking-tight leading-tight">تصفح حسب <span className="text-emerald-600">التخصص</span></h2>
              <p className="text-gray-400 text-lg mb-20 font-medium">أكثر من 40 تخصص مهني في انتظارك</p>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-10">
                {SERVICE_CATEGORIES.slice(0, 18).map(cat => (
                  <div key={cat.id} onClick={() => handleNavigate('search')} className="bg-white p-8 md:p-12 rounded-[3.5rem] border-2 border-gray-50 shadow-sm hover:shadow-2xl hover:-translate-y-4 active:scale-95 transition-all duration-500 cursor-pointer group relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                    <div className="text-5xl md:text-6xl mb-6 transition-transform group-hover:scale-125 duration-500">{cat.icon}</div>
                    <h3 className="text-sm md:text-base font-black text-gray-800 tracking-tighter group-hover:text-emerald-600 transition-colors truncate">{cat.name}</h3>
                  </div>
                ))}
              </div>
              <button onClick={() => handleNavigate('search')} className="mt-20 text-emerald-600 font-black border-b-4 border-emerald-200 hover:border-emerald-600 transition-all text-2xl pb-2">شاهد جميع التخصصات ←</button>
            </div>
          </div>
        )}
        {state.view === 'search' && <SearchPage user={state.currentUser} />}
        {state.view === 'profile' && state.currentUser && <ProfilePage user={state.currentUser} onUpdate={handleUserUpdate} onLogout={handleLogout} />}
        {(state.view === 'login' || state.view === 'register') && <AuthForm type={state.view} onSuccess={handleLoginSuccess} />}
      </main>

      <footer className="bg-gray-950 text-gray-500 py-32 px-10 text-center hidden md:block border-t-8 border-emerald-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-20 mb-20 text-right">
          <div>
             <div className="mb-8">
               <Logo size="sm" />
             </div>
             <p className="text-lg leading-relaxed font-medium">المنصة الجزائرية الرائدة التي تهتم بجودة الخدمات الحرفية وتقريب المسافات بين أصحاب الخبرة والزبائن بكل أمان ومصداقية.</p>
          </div>
          <div>
            <h4 className="text-white font-black mb-10 uppercase tracking-widest text-sm border-b-4 border-emerald-800 inline-block pb-2">روابط هامة</h4>
            <ul className="space-y-6 text-base font-black">
              <li><button onClick={() => handleNavigate('landing')} className="hover:text-emerald-400 transition">الرئيسية</button></li>
              <li><button onClick={() => handleNavigate('search')} className="hover:text-emerald-400 transition">تصفح الحرفيين</button></li>
              <li><button onClick={() => handleNavigate('register')} className="hover:text-emerald-400 transition">انضم كحرفي</button></li>
              <li><button className="hover:text-emerald-400 transition">شروط الاستخدام</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black mb-10 uppercase tracking-widest text-sm border-b-4 border-emerald-800 inline-block pb-2">ابقَ على اتصال</h4>
            <div className="space-y-6">
              <p className="text-lg font-black text-emerald-400">support@salakni.dz</p>
              <p className="text-lg font-black text-emerald-400">021-00-00-00</p>
              <div className="flex justify-end gap-6 mt-10">
                <span className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white cursor-pointer hover:bg-emerald-600 transition-colors">FB</span>
                <span className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white cursor-pointer hover:bg-emerald-600 transition-colors">IG</span>
                <span className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white cursor-pointer hover:bg-emerald-600 transition-colors">TW</span>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-16 border-t border-gray-900/50">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-900/50">© {new Date().getFullYear()} سلكني الجزائر. جميع الحقوق محفوظة لوزارة العمل والحرف.</p>
        </div>
      </footer>

      <BottomNav onNavigate={handleNavigate} currentView={state.view} user={state.currentUser} />
    </div>
  );
}
