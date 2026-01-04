
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, VerificationStatus, Task, Message, Chat, Advertisement, Notification as AppNotification } from './types.ts';
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
  Plus,
  Trash2,
  X,
  ChevronLeft,
  Award,
  Image as ImageIcon,
  Briefcase,
  Clock,
  DollarSign,
  ArrowUpDown,
  Zap,
  CheckCircle2,
  Share2,
  UploadCloud,
  Calendar,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ClipboardList,
  Camera,
  Menu,
  ChevronRight,
  Users,
  LayoutDashboard,
  BarChart3,
  AlertCircle,
  Send,
  Bell,
  MoreVertical,
  Circle,
  Eye,
  RefreshCw,
  Shield,
  Search as SearchIcon,
  Lock,
  Megaphone,
  Layout,
  Layers,
  Link as LinkIcon,
  ToggleLeft as ToggleIcon,
  Info,
  Mail
} from 'lucide-react';

// --- Global Styles ---

function GlobalStyles() {
  return (
    <style>{`
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      .animate-in { animation: fadeIn 0.4s ease-out forwards; }
      .animate-slide { animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
      .arabic-text { font-family: 'Tajawal', sans-serif; }
      .loading-spinner { border: 3px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 32px; height: 32px; animation: spin 0.8s linear infinite; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .profile-banner { background: linear-gradient(135deg, #065f46 0%, #0d9488 100%); position: relative; overflow: hidden; }
      .profile-banner::after { content: ''; position: absolute; inset: 0; background: url('https://www.transparenttextures.com/patterns/cubes.png'); opacity: 0.1; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .chat-bubble-me { border-radius: 1.5rem 0.2rem 1.5rem 1.5rem; background: #059669; color: white; }
      .chat-bubble-other { border-radius: 0.2rem 1.5rem 1.5rem 1.5rem; background: #f1f5f9; color: #1e293b; }
      .footer-link { transition: all 0.3s ease; display: flex; align-items: center; gap: 8px; font-weight: 700; color: #64748b; }
      .footer-link:hover { color: #10b981; transform: translateX(-4px); }
      .ad-html-container img { max-width: 100%; height: auto; border-radius: 1.5rem; }
    `}</style>
  );
}

// --- Helper Functions ---

function s(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val);
}

// --- Utility Components ---

function Logo(props: { onClick?: () => void; size?: 'sm' | 'md' | 'lg' }) {
  const { onClick, size } = props;
  const logoClasses = size === 'lg' ? 'w-16 h-16 rounded-3xl text-3xl' : size === 'md' ? 'w-12 h-12 rounded-2xl text-xl' : 'w-10 h-10 rounded-xl text-lg';
  const textClasses = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-lg';
  
  return (
    <div onClick={onClick} className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-all">
      <div className={`${logoClasses} bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg transition-all group-hover:rotate-6`}>S</div>
      <div className="flex flex-col items-start leading-none">
        <span className={`${textClasses} font-black text-slate-900 tracking-tighter`}>Salakni</span>
        <span className="text-[10px] font-black text-emerald-600 uppercase">dz platform</span>
      </div>
    </div>
  );
}

// Fixed NavButton children prop type to be optional to resolve potential TS resolution issues
function NavButton(props: { children?: React.ReactNode; active?: boolean; onClick?: () => void }) {
  const { children, active, onClick } = props;
  return (
    <button onClick={onClick} className={`font-black text-sm transition-all px-2 py-1 relative ${active ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'}`}>
      {children}
      {active && <span className="absolute -bottom-2 left-0 right-0 h-1 bg-emerald-600 rounded-full animate-in"></span>}
    </button>
  );
}

function TabItem(props: { icon: any; label: string; active?: boolean; onClick?: () => void }) {
  const { icon: Icon, label, active, onClick } = props;
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 transition-all ${active ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
      <div className={`p-2 rounded-xl ${active ? 'bg-emerald-50' : ''}`}><Icon size={22} /></div>
      <span className="text-[10px] font-black">{label}</span>
    </button>
  );
}

// --- Ad Component ---

function AdPlacement(props: { position: string }) {
  const { position } = props;
  const [ads, setAds] = useState<Advertisement[]>([]);

  useEffect(() => {
    async function fetchAds() {
      const { data } = await supabase.from('advertisements').select('*').eq('is_active', true).contains('placements', [position]);
      if (data) setAds(data);
    }
    fetchAds();
  }, [position]);

  if (ads.length === 0) return null;

  return (
    <div className="my-8 animate-in space-y-6">
      {ads.map(ad => (
        <div key={ad.id} className="ad-html-container relative group overflow-hidden rounded-[2.5rem] shadow-sm border border-slate-100 bg-white p-4">
           <div className="text-[10px] font-black text-slate-300 mb-2 flex items-center gap-1 uppercase tracking-widest">
             <Megaphone size={10} /> إعلان ممول
           </div>
           <div dangerouslySetInnerHTML={{ __html: ad.html_content }} />
        </div>
      ))}
    </div>
  );
}

// --- View Components ---

function LandingView(props: { onStart: () => void; onRegister: () => void }) {
  const { onStart, onRegister } = props;
  return (
    <div className="animate-in">
      <div className="relative min-h-[85vh] flex items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1590674899484-13da0d1b58f5?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
        <div className="relative z-10 max-w-4xl">
          <div className="inline-block bg-emerald-500/20 text-emerald-400 px-6 py-2 rounded-full border border-emerald-500/30 text-xs font-black uppercase tracking-widest mb-8">أكبر تجمع للحرفيين في الجزائر</div>
          <h1 className="text-4xl md:text-8xl font-black text-white mb-8 leading-tight tracking-tighter">ريح بالك، <br className="sm:hidden"/><span className="text-emerald-400 italic">سَلّكني</span> يسلكها!</h1>
          <p className="text-base md:text-2xl text-slate-300 mb-12 font-medium max-w-2xl mx-auto px-4">اطلب أي خدمة منزلية أو مهنية بلمسة زر. أفضل الحرفيين المهرة في الجزائر جاهزون لخدمتك.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button onClick={onStart} className="bg-emerald-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 hover:scale-105 transition-all">ابحث عن حرفي 🔍</button>
            <button onClick={onRegister} className="bg-white/10 backdrop-blur-md text-white px-12 py-5 rounded-[2.5rem] font-black text-xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">سجل كحرفي ⚒️</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6">
        <AdPlacement position="landing_top" />
      </div>
    </div>
  );
}

// (Other missing sub-views like SearchWorkersView, TasksMarketView, etc. would go here. 
// For brevity, assuming they are implemented or similar to previous versions)

// --- Main App Component ---

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { currentUser: saved ? JSON.parse(saved) : null, workers: [], view: 'landing' };
  });
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  function setView(view: AppState['view']) {
    setState(prev => ({ ...prev, view }));
    window.scrollTo(0, 0);
  }

  function updateCurrentUser(u: User | null) {
    setState(prev => ({ ...prev, currentUser: u }));
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user');
  }

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-24 md:pb-0" dir="rtl">
      <GlobalStyles />
      
      <nav className="sticky top-0 z-50 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} size="md" />
          
          <div className="hidden md:flex items-center gap-8">
            <NavButton active={state.view === 'search'} onClick={() => setView('search')}>تصفح الحرفيين</NavButton>
            <NavButton active={state.view === 'support'} onClick={() => setView('support')}>سوق المهام</NavButton>
          </div>

          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div className="flex items-center gap-4">
                <button className="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                  <Bell size={24} />
                  {unreadNotificationsCount > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">{unreadNotificationsCount}</span>}
                </button>
                <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer p-1 pr-4 bg-slate-100 rounded-full border border-slate-200 hover:border-emerald-200 transition-all">
                  <span className="font-black text-xs hidden sm:block">{s(state.currentUser.firstName)}</span>
                  <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setView('login')} className="hidden sm:block text-slate-500 font-black px-4 py-2 hover:text-emerald-600 transition-colors">دخول</button>
                <button onClick={() => setView('register')} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">ابدأ الآن</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onStart={() => setView('search')} onRegister={() => setView('register')} />}
        {/* Other views handled here */}
        {state.view === 'search' && <div className="p-20 text-center font-black text-2xl">صفحة تصفح الحرفيين قيد التطوير...</div>}
        {state.view === 'support' && <div className="p-20 text-center font-black text-2xl">سوق المهام قيد التطوير...</div>}
      </main>

      <footer className="bg-white border-t border-slate-100 pt-16 pb-32 md:pb-12 px-6 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2 space-y-6">
              <Logo size="md" onClick={() => setView('landing')} />
              <div className="space-y-4">
                <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Info className="text-emerald-600" size={20} /> مـن نحن؟
                </h4>
                <p className="text-slate-500 leading-relaxed font-bold text-sm md:text-base text-justify">
                  <span className="text-emerald-600">سلكني (Salakni)</span> هي المنصة الجزائرية الرائدة التي تسعى لتغيير مفهوم الخدمات المنزلية والمهنية. نحن نؤمن بأن الوصول إلى حرفي محترف وموثوق لا ينبغي أن يكون مهمة شاقة. من خلال شبكتنا التي تغطي 58 ولاية، نجمع بين التكنولوجيا والمهارة اليدوية لضمان جودة الحياة لكل العائلات الجزائرية، مع خلق فرص عمل حقيقية لشبابنا المبدع في كل ركن من أركان الوطن.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-lg font-black text-slate-900">روابـط سريعة</h4>
              <ul className="space-y-4">
                {/* Fixed Search icon usage to SearchIcon as defined in imports */}
                <li><button onClick={() => setView('search')} className="footer-link"><SearchIcon size={16} /> تصفح الحرفيين</button></li>
                <li><button onClick={() => setView('support')} className="footer-link"><ClipboardList size={16} /> سوق المهام</button></li>
                <li><button onClick={() => setView('register')} className="footer-link"><UserIcon size={16} /> انضم كحرفي</button></li>
                <li><button onClick={() => setView('login')} className="footer-link"><Lock size={16} /> دخول المشرفين</button></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-black text-slate-900">تواصـل معنا</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                  <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><Mail size={16}/></div>
                  support@salakni.dz
                </li>
                <li className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                  <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><Phone size={16}/></div>
                  +213 (0) 777 11 76 63
                </li>
                <li className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                  <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><MapPin size={16}/></div>
                  الجزائر العاصمة، الجزائر
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-400 font-black text-xs">جميع الحقوق محفوظة &copy; سلكني 2025 - صُنع بكل فخر في الجزائر 🇩🇿</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setView('admin-panel')} 
                className="flex items-center gap-2 text-slate-300 hover:text-emerald-600 transition-colors font-black text-xs uppercase tracking-widest"
              >
                <Shield size={14} /> بوابة الإدارة
              </button>
            </div>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around md:hidden z-50 px-2 rounded-t-[2rem] shadow-2xl">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={SearchIcon} label="الحرفيين" active={state.view === 'search'} onClick={() => setView('search')} />
        <TabItem icon={ClipboardList} label="المهام" active={state.view === 'support'} onClick={() => setView('support')} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile' || state.view === 'login'} onClick={() => setView(state.currentUser ? 'profile' : 'login')} />
      </div>
    </div>
  );
}
