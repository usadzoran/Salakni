import React, { useState, useEffect } from 'react';
import { UserRole, AppState, User, Advertisement, Task } from './types';
import { SERVICE_CATEGORIES, WILAYAS } from './constants';
import { supabase } from './lib/supabase';
import { 
  User as UserIcon, 
  LogOut, 
  Settings, 
  Phone, 
  Home,
  Plus,
  Trash2,
  X,
  Briefcase,
  CheckCircle2,
  Shield,
  Search as SearchIcon,
  ClipboardList,
  Megaphone,
  BarChart3,
  Users as UsersIcon,
  RefreshCw,
  Circle,
  ToggleLeft as ToggleIcon,
  Info,
  Mail,
  Code2,
  Eye,
  MapPin,
  Award,
  Star,
  Zap,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
  Target,
  Trophy
} from 'lucide-react';

// --- Global Styles & Animations ---

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap');
      
      :root {
        --emerald-primary: #10b981;
        --slate-dark: #0f172a;
      }

      .arabic-text { font-family: 'Tajawal', sans-serif; }
      
      @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
      @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

      .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .animate-float { animation: float 4s ease-in-out infinite; }
      
      .glass-card {
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      .gradient-text {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .hero-gradient {
        background: radial-gradient(circle at top right, rgba(16, 185, 129, 0.1) 0%, transparent 40%),
                    radial-gradient(circle at bottom left, rgba(5, 150, 105, 0.05) 0%, transparent 40%);
      }

      .category-card:hover .icon-box { transform: scale(1.1) rotate(5deg); }
      
      .custom-scrollbar::-webkit-scrollbar { width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
    `}</style>
  );
}

// --- Shared Components ---

function Logo({ onClick, size = 'sm' }: { onClick?: () => void; size?: 'sm' | 'md' | 'lg' }) {
  const logoClasses = size === 'lg' ? 'w-20 h-20 rounded-[2.5rem] text-4xl' : size === 'md' ? 'w-14 h-14 rounded-2xl text-2xl' : 'w-10 h-10 rounded-xl text-lg';
  const textClasses = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg';
  
  return (
    <div onClick={onClick} className="flex items-center gap-4 cursor-pointer group active:scale-95 transition-all">
      <div className={`${logoClasses} bg-emerald-600 flex items-center justify-center text-white font-black shadow-xl shadow-emerald-200 transition-all group-hover:rotate-6 group-hover:bg-emerald-500`}>S</div>
      <div className="flex flex-col items-start leading-none">
        <span className={`${textClasses} font-black text-slate-900 tracking-tighter`}>Salakni</span>
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">DZ Platform</span>
      </div>
    </div>
  );
}

function SectionHeading({ title, subtitle, centered = false }: { title: string; subtitle?: string; centered?: boolean }) {
  return (
    <div className={`mb-12 ${centered ? 'text-center' : 'text-right'}`}>
      <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">{title}</h2>
      {subtitle && <p className="text-slate-500 text-lg font-medium max-w-2xl">{subtitle}</p>}
      <div className={`h-1.5 w-20 bg-emerald-500 rounded-full mt-4 ${centered ? 'mx-auto' : ''}`}></div>
    </div>
  );
}

// Fix: Added missing AdPlacement component for advertisement sections
function AdPlacement({ position }: { position: string }) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-[2.5rem] border border-emerald-100/50 text-center">
      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
        <Megaphone size={20} />
      </div>
      <h4 className="font-black text-slate-900 text-sm mb-2">مساحة إعلانية</h4>
      <p className="text-[10px] text-slate-500 font-bold mb-4">هنا يمكنك وضع إعلانك للوصول إلى آلاف المستخدمين.</p>
      <button className="text-[10px] font-black text-emerald-600 underline">أعلن هنا</button>
    </div>
  );
}

// Fix: Added missing NavButton component for desktop navigation
function NavButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`font-black text-lg transition-colors ${active ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'}`}
    >
      {children}
    </button>
  );
}

// Fix: Added missing TabItem component for mobile navigation bottom bar
function TabItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 transition-all ${active ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
      <Icon size={24} strokeWidth={active ? 3 : 2} />
      <span className="text-[10px] font-black">{label}</span>
    </button>
  );
}

// --- Views ---

function LandingView({ onStart, onRegister }: { onStart: () => void; onRegister: () => void }) {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 px-6 hero-gradient">
        <div className="absolute top-20 right-[-10%] w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-20 left-[-10%] w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-right z-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-black mb-8 border border-emerald-100">
              <Trophy size={16} /> المنصة الأولى في الجزائر
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tighter">
              ريح بالك، <br/>
              <span className="gradient-text italic">سَلّكني</span> يسلكها!
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-12 font-medium leading-relaxed max-w-xl">
              اطلب أي خدمة منزلية أو مهنية في ثوانٍ. نجمع لك أفضل الحرفيين المعتمدين في ولايتك بضغطة زر.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-start">
              <button onClick={onStart} className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-emerald-200 hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-3">
                <SearchIcon /> ابحث عن حرفي
              </button>
              <button onClick={onRegister} className="bg-white text-slate-900 border border-slate-200 px-10 py-5 rounded-2xl font-black text-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3">
                سجل كحرفي <Briefcase />
              </button>
            </div>
            
            <div className="mt-12 flex items-center gap-8">
              <div className="flex -space-x-4 flex-row-reverse">
                {[1,2,3,4].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/150?u=${i}`} className="w-12 h-12 rounded-full border-4 border-white shadow-sm" />
                ))}
              </div>
              <p className="text-slate-500 font-bold text-sm">+5000 مستخدم يثقون بنا</p>
            </div>
          </div>
          
          <div className="hidden lg:block relative">
            <div className="animate-float relative z-10">
              <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000" className="rounded-[4rem] shadow-2xl border-8 border-white" alt="Handyman" />
              <div className="absolute -bottom-10 -right-10 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 animate-fade-in delay-300">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 font-black">⭐</div>
                  <div>
                    <h4 className="font-black text-slate-900">حرفي ممتاز</h4>
                    <p className="text-xs text-slate-400 font-bold">تم التحقق من الهوية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'حرفي مسجل', val: '2,500+', icon: Briefcase, color: 'text-emerald-500' },
              { label: 'ولاية مغطاة', val: '58', icon: MapPin, color: 'text-blue-500' },
              { label: 'مهمة منجزة', val: '15,000+', icon: CheckCircle2, color: 'text-orange-500' },
              { label: 'تقييم إيجابي', val: '4.9/5', icon: Star, color: 'text-yellow-500' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-8 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:shadow-lg group">
                <stat.icon size={32} className={`${stat.color} mx-auto mb-4 group-hover:scale-110 transition-transform`} />
                <h3 className="text-3xl font-black text-slate-900 mb-2">{stat.val}</h3>
                <p className="text-slate-500 font-black text-xs uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading 
            title="خدماتنا المتنوعة" 
            subtitle="كل ما تحتاجه لمنزلك أو مشروعك في مكان واحد، بأيدي أمهر الحرفيين في الجزائر."
            centered
          />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {SERVICE_CATEGORIES.slice(0, 14).map((cat) => (
              <div key={cat.id} className="category-card bg-white p-6 rounded-[2.5rem] text-center shadow-sm border border-white hover:border-emerald-200 hover:shadow-xl transition-all cursor-pointer group">
                <div className="icon-box w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto transition-all">
                  {cat.icon}
                </div>
                <h4 className="font-black text-slate-800 text-sm leading-tight">{cat.name.split(' ')[0]}</h4>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button onClick={onStart} className="text-emerald-600 font-black flex items-center gap-2 mx-auto hover:gap-4 transition-all">
               تصفح كافة الخدمات <ArrowRight size={20}/>
            </button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading title="كيف يعمل سلكني؟" centered />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -z-10"></div>
            {[
              { step: '01', title: 'ابحث عن الخدمة', desc: 'حدد نوع الحرفي أو الخدمة التي تحتاجها وموقعك الجغرافي.', icon: SearchIcon },
              { step: '02', title: 'اختر الحرفي', desc: 'قارن بين الحرفيين بناءً على تقييماتهم، خبراتهم ومعرض أعمالهم.', icon: UsersIcon },
              { step: '03', title: 'تمت المهمة!', desc: 'تواصل مباشرة مع الحرفي، اتفق على السعر، وقيم خدمته بعد الإنجاز.', icon: CheckCircle2 },
            ].map((item, i) => (
              <div key={i} className="text-center relative bg-white p-8 rounded-3xl">
                <div className="w-20 h-20 bg-emerald-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200 text-2xl animate-float" style={{ animationDelay: `${i * 0.5}s` }}>
                  <item.icon size={32} />
                </div>
                <span className="text-emerald-500 font-black text-4xl opacity-20 block mb-4">{item.step}</span>
                <h4 className="text-2xl font-black text-slate-900 mb-4">{item.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/10 skew-x-12 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <SectionHeading title="لماذا يفضلنا الجزائريون؟" />
              <div className="space-y-8">
                {[
                  { title: 'أمان وتوثيق', desc: 'نقوم بالتحقق من وثائق الهوية لكل حرفي قبل تفعيل حسابه في المنصة.', icon: ShieldCheck },
                  { title: 'دعم فني مستمر', desc: 'فريق سلكني متواجد لمساعدتك في أي وقت لحل أي مشكلة تقنية.', icon: Zap },
                  { title: 'تقييمات حقيقية', desc: 'نظام تقييم صارم يعتمد فقط على الزبائن الذين تعاملوا فعلياً مع الحرفي.', icon: Star },
                ].map((b, i) => (
                  <div key={i} className="flex gap-6 text-right flex-row-reverse">
                    <div className="flex-shrink-0 w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                      <b.icon size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black mb-2">{b.title}</h4>
                      <p className="text-slate-400 font-medium">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[4rem] border border-white/10">
              <h3 className="text-3xl font-black mb-8 text-center italic">تطبيق سلكني <span className="text-emerald-500">DZ</span></h3>
              <div className="aspect-video bg-slate-900 rounded-3xl flex items-center justify-center border border-white/5 group cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bbbda536ad79?q=80&w=1000')] bg-cover bg-center opacity-30 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10 w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-125 transition-transform">
                  <ArrowRight size={32} className="rotate-180" />
                </div>
              </div>
              <p className="mt-8 text-center text-slate-400 font-bold">شاهد كيف يساهم سلكني في توفير فرص عمل لآلاف الشباب الجزائريين</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SearchWorkersView() {
  const [filters, setFilters] = useState({ query: '', wilaya: '', category: '' });
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase.from('users').select('*').eq('role', 'WORKER');
      if (filters.wilaya) query = query.eq('wilaya', filters.wilaya);
      if (filters.category) query = query.contains('categories', [filters.category]);
      if (filters.query) query = query.or(`first_name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`);
      const { data } = await query;
      if (data) setWorkers(data.map(u => ({ ...u, firstName: u.first_name, lastName: u.last_name, location: { wilaya: u.wilaya, daira: '' }, verificationStatus: u.verification_status })));
      setLoading(false);
    };
    fetch();
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fade-in">
      <SectionHeading title="البحث عن حرفيين مهرة" subtitle="تصفح قائمة الحرفيين الموثوقين وتواصل معهم مباشرة." />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 sticky top-28">
            <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2"><Settings size={18} className="text-emerald-600"/> تصفية النتائج</h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 block mb-2 mr-2">الاسم أو الخدمة</label>
                <input placeholder="مثلاً: مرصص، كهربائي..." className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:bg-emerald-50 transition-all" value={filters.query} onChange={e => setFilters({...filters, query: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 block mb-2 mr-2">الولاية</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" value={filters.wilaya} onChange={e => setFilters({...filters, wilaya: e.target.value})}>
                  <option value="">كل الولايات (58)</option>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 block mb-2 mr-2">التخصص</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
                  <option value="">كل التخصصات</option>
                  {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <button onClick={() => setFilters({ query: '', wilaya: '', category: '' })} className="w-full py-4 text-emerald-600 font-black text-sm hover:bg-emerald-50 rounded-2xl transition-all">إعادة ضبط</button>
            </div>
          </div>
          <AdPlacement position="search_sidebar" />
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {loading ? (
              <div className="col-span-full py-20 flex justify-center"><div className="loading-spinner"></div></div>
            ) : workers.map(w => (
              <div key={w.id} className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col">
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative">
                    <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-20 h-20 rounded-3xl object-cover border-4 border-slate-50 shadow-md" />
                    {w.verificationStatus === 'verified' && (
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-sm" title="حساب موثق">
                        <CheckCircle2 size={16}/>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{w.firstName} {w.lastName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex text-yellow-400"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/></div>
                      <span className="text-[10px] font-black text-slate-400">(24 تقييم)</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {w.categories.map(c => <span key={c} className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black">{c}</span>)}
                  <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1"><MapPin size={10}/> {w.location.wilaya}</span>
                </div>
                <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-8 flex-grow">{w.bio || 'لا توجد نبذة تعريفية.'}</p>
                <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                  <div className="text-emerald-600 font-black text-lg">5.0 <span className="text-xs text-slate-300">/ 5</span></div>
                  <button className="bg-slate-950 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all shadow-lg active:scale-95">عرض الملف الشخصي</button>
                </div>
              </div>
            ))}
            {workers.length === 0 && !loading && (
              <div className="col-span-full py-32 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <SearchIcon size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-300">عذراً، لم نجد أي حرفيين يطابقون بحثك</h3>
                <p className="text-slate-400 font-bold mt-2">حاول تغيير الفلاتر أو البحث في ولاية أخرى.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main App Component ---

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { currentUser: saved ? JSON.parse(saved) : null, workers: [], view: 'landing' };
  });

  const setView = (view: AppState['view']) => { setState(prev => ({ ...prev, view })); window.scrollTo(0, 0); };
  const updateCurrentUser = (u: User | null) => { setState(prev => ({ ...prev, currentUser: u })); if (u) localStorage.setItem('user', JSON.stringify(u)); else localStorage.removeItem('user'); };

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-24 md:pb-0 custom-scrollbar" dir="rtl">
      <GlobalStyles />
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} size="md" />
          
          <div className="hidden md:flex items-center gap-10">
            <NavButton active={state.view === 'landing'} onClick={() => setView('landing')}>الرئيسية</NavButton>
            <NavButton active={state.view === 'search'} onClick={() => setView('search')}>تصفح الحرفيين</NavButton>
            <NavButton active={state.view === 'support'} onClick={() => setView('support')}>سوق المهام</NavButton>
            {state.currentUser?.role === UserRole.ADMIN && (
              <button onClick={() => setView('admin-panel')} className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${state.view === 'admin-panel' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-50 text-emerald-600'}`}>
                <Shield size={16}/> الإدارة
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer p-1 pr-4 bg-white rounded-full border border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all">
                <span className="font-black text-xs hidden sm:block">{state.currentUser.firstName}</span>
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setView('login')} className="hidden sm:block text-slate-500 font-black px-4 py-2 hover:text-emerald-600 transition-colors">دخول</button>
                <button onClick={() => setView('register')} className="bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 active:scale-95 transition-all">ابدأ الآن</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onStart={() => setView('search')} onRegister={() => setView('register')} />}
        {state.view === 'search' && <SearchWorkersView />}
        {state.view === 'support' && (
          <div className="max-w-4xl mx-auto py-32 text-center animate-fade-in">
             <SectionHeading title="سوق المهام" subtitle="قريباً: اطلب مهمتك ودع الحرفيين يتنافسون على تقديم أفضل العروض." centered />
             <div className="relative inline-block mt-8">
                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
                <ClipboardList size={120} className="text-emerald-100 relative" />
             </div>
          </div>
        )}
        {state.view === 'profile' && state.currentUser && (
          <div className="max-w-4xl mx-auto py-20 px-6 animate-fade-in text-center">
            <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-32 h-32 rounded-[2.5rem] border-4 border-emerald-500 mx-auto mb-6 shadow-xl" />
            <h2 className="text-3xl font-black">{state.currentUser.firstName} {state.currentUser.lastName}</h2>
            <p className="text-slate-400 font-bold mb-10">{state.currentUser.role === UserRole.ADMIN ? 'مدير المنصة' : 'مستخدم سلكني'}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
               <button className="bg-emerald-600 text-white p-5 rounded-3xl font-black flex items-center justify-center gap-3 shadow-lg"><Settings/> تعديل الملف الشخصي</button>
               <button onClick={() => updateCurrentUser(null)} className="bg-red-50 text-red-500 p-5 rounded-3xl font-black flex items-center justify-center gap-3"><LogOut/> تسجيل الخروج</button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-32 md:pb-16 px-6 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="md:col-span-2 space-y-8">
              <Logo size="md" onClick={() => setView('landing')} />
              <p className="text-slate-500 leading-relaxed font-bold text-lg max-w-xl">
                <span className="text-emerald-600">سلكني</span> هي بوابتك الجزائرية الذكية للوصول إلى أمهر الحرفيين في كافة التخصصات. نهدف إلى خلق بيئة عمل موثوقة وعصرية تدعم الحرفي الجزائري وتلبي احتياجات المواطن.
              </p>
              <div className="flex gap-4">
                 <button className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all"><Settings/></button>
                 <button className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all"><UsersIcon/></button>
                 <button className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all"><Zap/></button>
              </div>
            </div>
            <div className="space-y-6 text-right">
              <h4 className="text-xl font-black text-slate-900">روابط سريعة</h4>
              <ul className="space-y-4">
                <li><button onClick={() => setView('search')} className="text-slate-500 font-black hover:text-emerald-600 transition-all flex items-center gap-2 flex-row-reverse">تصفح الحرفيين <ChevronLeft size={16}/></button></li>
                <li><button onClick={() => setView('support')} className="text-slate-500 font-black hover:text-emerald-600 transition-all flex items-center gap-2 flex-row-reverse">سوق المهام <ChevronLeft size={16}/></button></li>
                <li><button onClick={() => setView('register')} className="text-slate-500 font-black hover:text-emerald-600 transition-all flex items-center gap-2 flex-row-reverse">سجل كحرفي <ChevronLeft size={16}/></button></li>
              </ul>
            </div>
            <div className="space-y-6 text-right">
              <h4 className="text-xl font-black text-slate-900">تواصل معنا</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 flex-row-reverse text-slate-500 font-bold"><Mail className="text-emerald-500" size={18}/> support@salakni.dz</li>
                <li className="flex items-center gap-3 flex-row-reverse text-slate-500 font-bold"><Phone className="text-emerald-500" size={18}/> +213 777 11 76 63</li>
                <li className="flex items-center gap-3 flex-row-reverse text-slate-500 font-bold"><MapPin className="text-emerald-500" size={18}/> الجزائر العاصمة، الجزائر</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">ALL RIGHTS RESERVED &copy; SALAKNI DZ 2025</p>
            <div className="flex gap-6 text-[10px] font-black text-slate-300">
               <button className="hover:text-emerald-500 uppercase">Privacy Policy</button>
               <button className="hover:text-emerald-500 uppercase">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-around md:hidden z-50 px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={SearchIcon} label="الحرفيين" active={state.view === 'search'} onClick={() => setView('search')} />
        <TabItem icon={ClipboardList} label="المهام" active={state.view === 'support'} onClick={() => setView('support')} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile' || state.view === 'admin-panel'} onClick={() => {
          if (state.currentUser) setView(state.currentUser.role === UserRole.ADMIN ? 'admin-panel' : 'profile');
          else setView('login');
        }} />
      </div>
    </div>
  );
}