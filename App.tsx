
import React, { useState, useEffect } from 'react';
import { UserRole, AppState, User, Advertisement, Task, TaskStatus } from './types';
import { SERVICE_CATEGORIES, WILAYAS } from './constants';
import { supabase } from './lib/supabase';
import { 
  User as UserIcon, 
  Settings, 
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
  Users as UsersIcon,
  RefreshCw,
  MapPin,
  Star,
  Zap,
  ShieldCheck,
  ChevronLeft,
  ArrowRight,
  Trophy,
  Clock,
  Banknote,
  Filter,
  LogOut,
  MessageSquare,
  Phone,
  Info,
  Edit,
  Save,
  Check
} from 'lucide-react';

// --- Global Styles ---

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap');
      .arabic-text { font-family: 'Tajawal', sans-serif; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      .custom-scrollbar::-webkit-scrollbar { width: 5px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #10b981; border-radius: 10px; }
      .glass-card { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
      .loading-spinner { border: 3px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 0.8s linear infinite; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .worker-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }
      .task-card:hover { transform: translateY(-5px); border-color: #10b981; }
      .category-chip.active { background-color: #10b981; color: white; border-color: #10b981; }
    `}</style>
  );
}

// --- Utilities ---

const ensureArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    if (val.trim().startsWith('[') && val.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    if (val.includes(',')) return val.split(',').map(s => s.trim());
    return [val.trim()];
  }
  return [];
};

// --- Shared Components ---

function Logo({ onClick, size = 'sm' }: { onClick?: () => void; size?: 'sm' | 'md' | 'lg' }) {
  const logoClasses = size === 'lg' ? 'w-20 h-20 rounded-[2.5rem] text-4xl' : size === 'md' ? 'w-12 h-12 rounded-2xl text-2xl' : 'w-10 h-10 rounded-xl text-lg';
  const textClasses = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg';
  return (
    <div onClick={onClick} className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-all">
      <div className={`${logoClasses} bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-200 transition-all group-hover:rotate-6`}>S</div>
      <div className="flex flex-col items-start leading-none">
        <span className={`${textClasses} font-black text-slate-900 tracking-tighter`}>Salakni</span>
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">DZ Platform</span>
      </div>
    </div>
  );
}

function SectionHeading({ title, subtitle, centered = false }: { title: string; subtitle?: string; centered?: boolean }) {
  return (
    <div className={`mb-10 ${centered ? 'text-center' : 'text-right'}`}>
      <h2 className="text-3xl font-black text-slate-900 mb-2">{title}</h2>
      {subtitle && <p className="text-slate-500 font-medium">{subtitle}</p>}
      <div className={`h-1.5 w-16 bg-emerald-500 rounded-full mt-3 ${centered ? 'mx-auto' : ''}`}></div>
    </div>
  );
}

function NavButton({ children, active, onClick }: { children?: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`font-black text-sm transition-all relative py-2 ${active ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'}`}>
      {children}
      {active && <span className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-full animate-fade-in"></span>}
    </button>
  );
}

function TabItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
      <Icon size={24} />
      <span className="text-[10px] font-black">{label}</span>
    </button>
  );
}

// --- Specific Views ---

function EditProfileView({ user, onSaved, onCancel }: { user: User; onSaved: (u: User) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio || '',
    wilaya: user.location.wilaya,
    categories: ensureArray(user.categories),
    skills: ensureArray(user.skills),
    skillInput: ''
  });
  const [saving, setSaving] = useState(false);

  const toggleCategory = (catName: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(catName) 
        ? prev.categories.filter(c => c !== catName) 
        : [...prev.categories, catName]
    }));
  };

  const addSkill = () => {
    if (formData.skillInput.trim() && !formData.skills.includes(formData.skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, formData.skillInput.trim()],
        skillInput: ''
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
        wilaya: formData.wilaya,
        categories: formData.categories,
        skills: formData.skills
      };

      const { error } = await supabase
        .from('users')
        .update(updatedData)
        .eq('id', user.id);

      if (error) throw error;

      const updatedUser: User = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        location: { ...user.location, wilaya: formData.wilaya },
        categories: formData.categories,
        skills: formData.skills
      };
      
      onSaved(updatedUser);
    } catch (err: any) {
      alert("خطأ أثناء الحفظ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 animate-fade-in text-right">
      <div className="flex items-center justify-between mb-10">
        <SectionHeading title="تحديث الملف الشخصي" subtitle="اجعل ملفك الشخصي يبدو احترافياً لجذب المزيد من الزبائن." />
        <button onClick={onCancel} className="p-3 text-slate-400 hover:bg-slate-100 rounded-full transition-all"><X size={24}/></button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-8 md:p-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2">الاسم الشخصي</label>
            <input 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20" 
              value={formData.firstName} 
              onChange={e => setFormData({...formData, firstName: e.target.value})} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2">اللقب</label>
            <input 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20" 
              value={formData.lastName} 
              onChange={e => setFormData({...formData, lastName: e.target.value})} 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 mr-2">نبذة عنك (Bio)</label>
          <textarea 
            rows={4}
            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20" 
            placeholder="مثلاً: حرفي متخصص في الكهرباء والترصيص الصحي بخبرة 10 سنوات..."
            value={formData.bio} 
            onChange={e => setFormData({...formData, bio: e.target.value})} 
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 mr-2">الولاية</label>
          <select 
            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" 
            value={formData.wilaya} 
            onChange={e => setFormData({...formData, wilaya: e.target.value})}
          >
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black text-slate-400 mr-2">التخصصات والخدمات</label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                onClick={() => toggleCategory(cat.name)}
                className={`category-chip border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all ${formData.categories.includes(cat.name) ? 'active' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                {formData.categories.includes(cat.name) && <Check size={14} className="inline ml-1"/>}
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black text-slate-400 mr-2">المهارات الإضافية</label>
          <div className="flex gap-2">
            <input 
              className="flex-grow p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20" 
              placeholder="مثلاً: إتقان اللغة الفرنسية، رخصة سياقة..."
              value={formData.skillInput}
              onChange={e => setFormData({...formData, skillInput: e.target.value})}
              onKeyPress={e => e.key === 'Enter' && addSkill()}
            />
            <button onClick={addSkill} className="bg-slate-900 text-white px-6 rounded-2xl font-black text-sm">إضافة</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.skills.map(skill => (
              <span key={skill} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                {skill}
                <X size={14} className="cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeSkill(skill)}/>
              </span>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-slate-50 flex flex-col sm:flex-row gap-4">
          <button 
            disabled={saving}
            onClick={handleSave}
            className="flex-grow bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-emerald-200 hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {saving ? <div className="loading-spinner w-6 h-6 border-white"></div> : <Save size={24}/>}
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات الآن'}
          </button>
          <button onClick={onCancel} className="px-10 bg-slate-100 text-slate-500 py-5 rounded-[2rem] font-black text-lg hover:bg-slate-200 transition-all">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function TaskDetailsModal({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in text-right"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-8 md:p-12 relative max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-100">
        <button onClick={onClose} className="absolute top-8 left-8 p-3 text-slate-400 hover:bg-slate-50 hover:text-red-500 rounded-2xl transition-all"><X size={28}/></button>
        
        <div className="flex flex-wrap items-center gap-3 mb-8 mt-4 md:mt-0">
           <span className="bg-emerald-100 text-emerald-700 px-5 py-2 rounded-xl text-[10px] font-black tracking-wide border border-emerald-200 uppercase">{task.category}</span>
           <span className="bg-slate-100 text-slate-600 px-5 py-2 rounded-xl text-[10px] font-black border border-slate-200">
             الحالة: {task.status === 'open' ? 'مفتوحة للاستقبال' : task.status}
           </span>
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">{task.title}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-emerald-50/50 p-7 rounded-[2.5rem] border border-emerald-100">
            <p className="text-[10px] font-black text-emerald-600 mb-2 tracking-widest uppercase">الميزانية التقديرية</p>
            <p className="text-3xl font-black text-emerald-700 flex items-center gap-2">{task.budget.toLocaleString()} <span className="text-xs font-bold text-emerald-500">دج</span></p>
          </div>
          <div className="bg-slate-50/50 p-7 rounded-[2.5rem] border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 mb-2 tracking-widest uppercase">الموقع الجغرافي</p>
            <p className="text-2xl font-black text-slate-700 flex items-center gap-2"><MapPin size={24} className="text-emerald-500"/> {task.wilaya}</p>
          </div>
        </div>

        <div className="space-y-6 mb-12">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">وصف العمل <Info size={20} className="text-emerald-500"/></h4>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
               <Clock size={14}/> {new Date(task.created_at).toLocaleDateString('ar-DZ')}
            </div>
          </div>
          <p className="text-slate-600 font-medium leading-[1.8] text-lg whitespace-pre-wrap bg-slate-50/30 p-6 rounded-3xl border border-dashed border-slate-100">
            {task.description}
          </p>
        </div>

        <div className="bg-emerald-600/5 p-8 rounded-[2.5rem] border border-emerald-100 mb-10">
          <h5 className="font-black text-slate-900 mb-2">هل أنت حرفي مهتم؟</h5>
          <p className="text-sm text-slate-500 font-medium">يمكنك التواصل مباشرة مع صاحب المهمة أو تقديم عرض سعر مفصل.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5">
          <button className="flex-grow bg-emerald-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-200 hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-3">
             <MessageSquare size={24}/> تواصل الآن وقم بتقديم عرضك
          </button>
          <button onClick={onClose} className="px-10 bg-slate-100 text-slate-500 py-6 rounded-[2rem] font-black text-lg hover:bg-slate-200 transition-all">إغلاق</button>
        </div>
      </div>
    </div>
  );
}

function SearchWorkersView({ onNavigate }: { onNavigate: (view: AppState['view']) => void }) {
  const [filters, setFilters] = useState({ query: '', wilaya: '', category: '' });
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      try {
        let query = supabase.from('users').select('*').eq('role', 'WORKER');
        if (filters.wilaya) query = query.eq('wilaya', filters.wilaya);
        if (filters.category) query = query.contains('categories', [filters.category]);
        if (filters.query) query = query.or(`first_name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`);
        
        const { data, error } = await query;
        if (error) throw error;
        
        if (data) {
          setWorkers(data.map(u => ({ 
            ...u, 
            firstName: u.first_name || '', 
            lastName: u.last_name || '', 
            location: { wilaya: u.wilaya || '', daira: '' }, 
            verificationStatus: u.verification_status || 'none',
            categories: ensureArray(u.categories),
            skills: ensureArray(u.skills)
          })));
        }
      } catch (err) {
        console.error("Error fetching workers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 animate-fade-in">
      <SectionHeading title="اكتشف الحرفيين المهرة" subtitle="ابحث عن أفضل المحترفين الموثقين في ولايتك وتواصل معهم مباشرة." />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 sticky top-28">
            <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Filter size={18} className="text-emerald-600" /> فلترة النتائج</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2">بحث نصي</label>
                <input placeholder="ابحث بالاسم أو المهنة..." className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20" value={filters.query} onChange={e => setFilters({...filters, query: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2">الولاية</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none cursor-pointer" value={filters.wilaya} onChange={e => setFilters({...filters, wilaya: e.target.value})}>
                  <option value="">كل الولايات</option>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2">التخصص</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none cursor-pointer" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
                  <option value="">كل التخصصات</option>
                  {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <button onClick={() => setFilters({query:'', wilaya:'', category:''})} className="w-full py-3 text-emerald-600 font-black text-xs hover:bg-emerald-50 rounded-xl transition-all mt-4">إعادة ضبط الفلاتر</button>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="loading-spinner"></div>
              <p className="text-slate-400 font-black text-xs">جاري جلب قائمة المبدعين...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workers.map(w => (
                <div key={w.id} className="worker-card bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 transition-all group flex flex-col cursor-pointer" onClick={() => onNavigate('profile')}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-50 shadow-md" />
                      {w.verificationStatus === 'verified' && (
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-sm" title="حساب موثق">
                          <CheckCircle2 size={14}/>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{w.firstName} {w.lastName}</h3>
                      <div className="flex items-center gap-1 text-yellow-500 mt-1">
                        <Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/>
                        <span className="text-[10px] font-black text-slate-400 mr-1">5.0 (20 تقييم)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {ensureArray(w.categories).map((c, idx) => (
                      <span key={`${w.id}-cat-${idx}`} className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black">{c}</span>
                    ))}
                  </div>
                  <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-6 flex-grow">{w.bio || 'حرفي محترف يسعى لتقديم أفضل جودة عمل لإرضاء الزبائن.'}</p>
                  <div className="flex justify-between items-center border-t border-slate-50 pt-5 mt-auto">
                    <span className="text-[11px] font-black text-slate-400 flex items-center gap-1.5"><MapPin size={14} className="text-emerald-500"/> {w.location.wilaya}</span>
                    <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-[11px] hover:bg-emerald-600 transition-all flex items-center gap-2">
                       تواصل الآن <MessageSquare size={14}/>
                    </button>
                  </div>
                </div>
              ))}
              {workers.length === 0 && (
                <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                  <UsersIcon size={64} className="text-slate-100 mx-auto mb-4" />
                  <h3 className="text-2xl font-black text-slate-300">لم نجد حرفيين يطابقون بحثك</h3>
                  <p className="text-slate-400 font-bold mt-2">حاول تغيير الفلاتر أو البحث في ولاية أخرى.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TasksMarketView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setTasks(data.map(t => ({ ...t, seeker_name: t.seeker_name || 'صاحب المهمة' })));
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <SectionHeading title="سوق المهام المفتوحة" subtitle="تصفح الطلبات الحالية، أو أضف مهمتك ودع الحرفيين يتنافسون على تقديم العروض." />
        <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-emerald-200 active:scale-95 transition-all w-full md:w-auto justify-center">
          <Plus size={20} /> اطلب مهمة جديدة
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="loading-spinner"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className="task-card bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 transition-all group flex flex-col cursor-pointer hover:shadow-2xl hover:border-emerald-200 active:scale-[0.98]"
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex justify-between items-start mb-6">
                <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-xl text-[10px] font-black border border-emerald-100">{task.category}</span>
                <span className="text-emerald-600 font-black text-xl flex items-center gap-1.5 bg-emerald-50/50 px-3 py-1 rounded-lg"><Banknote size={18}/> {task.budget.toLocaleString()} <span className="text-xs">دج</span></span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors leading-relaxed">{task.title}</h3>
              <p className="text-slate-500 text-sm font-medium mb-8 line-clamp-3 leading-relaxed flex-grow">{task.description}</p>
              <div className="flex flex-col gap-4 pt-6 border-t border-slate-50 mt-auto">
                <div className="flex justify-between items-center text-[11px] font-black text-slate-400">
                  <span className="flex items-center gap-1.5"><MapPin size={16} className="text-emerald-500" /> {task.wilaya}</span>
                  <span className="flex items-center gap-1.5"><Clock size={16} className="text-emerald-500" /> {new Date(task.created_at).toLocaleDateString('ar-DZ')}</span>
                </div>
                <button 
                  className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black text-xs group-hover:bg-emerald-600 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <SearchIcon size={14}/> عرض كامل التفاصيل
                </button>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
              <ClipboardList size={64} className="text-slate-100 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-300">لا توجد مهام حالية</h3>
              <p className="text-slate-400 font-bold mt-2">كن أول من يطلب خدمة في منطقتك!</p>
            </div>
          )}
        </div>
      )}
      
      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} onSaved={() => { setShowAddModal(false); fetchTasks(); }} />}
      {selectedTask && <TaskDetailsModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

function AddTaskModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [formData, setFormData] = useState({ title: '', description: '', budget: '', category: '', wilaya: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.wilaya) {
      alert("يرجى ملء كافة الحقول");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('tasks').insert([{
        title: formData.title,
        description: formData.description,
        budget: Number(formData.budget),
        category: formData.category,
        wilaya: formData.wilaya,
        status: 'open'
      }]);
      if (error) throw error;
      onSaved();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in text-right">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button onClick={onClose} className="absolute top-6 left-6 p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X size={24}/></button>
        <h3 className="text-2xl font-black text-slate-900 mb-2">اطلب مهمة جديدة</h3>
        <p className="text-slate-500 font-bold mb-8 text-sm">حدد طلبك وسيقوم الحرفيون بالتواصل معك بأسعار تنافسية.</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2">ماذا تحتاج؟ (العنوان)</label>
            <input required placeholder="مثلاً: صباغة شقة 3 غرف" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2">التفاصيل</label>
            <textarea required rows={4} placeholder="اشرح المهمة بالتفصيل للحرفيين..." className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2">الميزانية (دج)</label>
              <input required type="number" placeholder="مثلاً: 5000" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2">الولاية</label>
              <select required className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                <option value="">اختر الولاية</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 mr-2">التخصص المطلوب</label>
            <select required className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option value="">اختر التخصص</option>
              {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <button disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-500 active:scale-95 mt-4 disabled:opacity-50">
            {loading ? 'جاري نشر طلبك...' : 'انشر المهمة الآن 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Landing Page View ---

function LandingView({ onStart, onRegister }: { onStart: () => void; onRegister: () => void }) {
  return (
    <div className="animate-fade-in">
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-slate-950 bg-[url('https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2000')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
        <div className="relative z-10 max-w-5xl text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full text-xs font-black mb-8 border border-white/10 tracking-widest uppercase">
            <Trophy size={16} className="text-yellow-400"/> المنصة الأولى للخدمات الاحترافية في الجزائر
          </div>
          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tighter">ريح بالك، <span className="text-emerald-400 italic">سَلّكني</span> يسلكها!</h1>
          <p className="text-xl md:text-3xl text-slate-300 mb-12 font-medium max-w-3xl mx-auto leading-relaxed">بوابتك الذكية للوصول إلى أفضل الحرفيين المهرة في ولايتك. جودة، ثقة، وسرعة في تنفيذ كل ما تحتاجه.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
             <button onClick={onStart} className="bg-emerald-600 px-14 py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-emerald-500 transition-all active:scale-95 w-full sm:w-auto">اطلب خدمة الآن 🔍</button>
             <button onClick={onRegister} className="bg-white/10 backdrop-blur-md px-14 py-6 rounded-[2.5rem] font-black text-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-95 w-full sm:w-auto">انضم كحرفي 🛠️</button>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading title="لماذا يثق بنا آلاف الجزائريين؟" subtitle="نحن لا نوفر فقط حرفيين، بل نوفر راحة البال والأمان." centered />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'حرفيون موثقون', desc: 'نقوم بالتحقق من هوية وأعمال كل حرفي لضمان جودة الخدمة وسلامة منزلك.', icon: ShieldCheck },
              { title: 'سهولة مذهلة', desc: 'بلمسة زر واحدة من هاتفك، ستجد المحترفين المتاحين بالقرب منك في ثوانٍ.', icon: Zap },
              { title: 'تقييمات حقيقية', desc: 'نظام تقييم صارم يعتمد على تجارب الزبائن السابقة حصراً، لا مجال للتلاعب.', icon: Star }
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 p-12 rounded-[4rem] border border-slate-100 text-center hover:bg-emerald-50 transition-all group">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-8 group-hover:scale-110 transition-transform shadow-sm"><item.icon size={40}/></div>
                <h4 className="text-2xl font-black text-slate-900 mb-4">{item.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { currentUser: saved ? JSON.parse(saved) : null, workers: [], view: 'landing' };
  });

  const setView = (view: AppState['view']) => { setState(prev => ({ ...prev, view })); window.scrollTo(0, 0); };
  
  const updateCurrentUser = (u: User | null) => { 
    setState(prev => ({ ...prev, currentUser: u })); 
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user'); 
    }
  };

  const handleProfileUpdate = (updatedUser: User) => {
    updateCurrentUser(updatedUser);
    setView('profile');
  };

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-24 md:pb-0 custom-scrollbar" dir="rtl">
      <GlobalStyles />
      
      <nav className="sticky top-0 z-50 h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} size="md" />
          <div className="hidden md:flex items-center gap-12">
            <NavButton active={state.view === 'landing'} onClick={() => setView('landing')}>الرئيسية</NavButton>
            <NavButton active={state.view === 'search'} onClick={() => setView('search')}>البحث عن حرفيين</NavButton>
            <NavButton active={state.view === 'support'} onClick={() => setView('support')}>سوق المهام</NavButton>
          </div>
          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer p-1.5 pr-5 bg-white rounded-full border border-slate-200 hover:border-emerald-200 transition-all shadow-sm">
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-black text-sm text-slate-800">{state.currentUser.firstName}</span>
                  <span className="text-[9px] font-black text-emerald-600 uppercase">حسابي</span>
                </div>
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" />
              </div>
            ) : (
              <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-10 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 active:scale-95 transition-all">دخول</button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {state.view === 'landing' && <LandingView onStart={() => setView('search')} onRegister={() => setView('register')} />}
        {state.view === 'search' && <SearchWorkersView onNavigate={setView} />}
        {state.view === 'support' && <TasksMarketView />}
        {state.view === 'profile' && state.currentUser && (
          <div className="max-w-4xl mx-auto py-24 px-6 animate-fade-in text-right">
             <div className="bg-white rounded-[4rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="h-40 bg-gradient-to-r from-emerald-600 to-teal-500"></div>
                <div className="px-12 pb-12">
                   <div className="relative -mt-20 mb-8">
                     <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-40 h-40 rounded-[3rem] border-8 border-white mx-auto shadow-2xl object-cover" />
                     {state.currentUser.verificationStatus === 'verified' && (
                       <div className="absolute bottom-4 right-1/2 translate-x-12 translate-y-2 bg-blue-500 text-white p-2 rounded-2xl border-4 border-white shadow-lg"><Check size={24}/></div>
                     )}
                   </div>
                   <div className="text-center mb-12">
                     <h2 className="text-4xl font-black mb-2">{state.currentUser.firstName} {state.currentUser.lastName}</h2>
                     <p className="text-emerald-600 font-bold flex items-center justify-center gap-2"><MapPin size={18}/> {state.currentUser.location.wilaya}</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                         <h4 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-2">نبذة شخصية</h4>
                         <p className="text-slate-600 font-medium leading-relaxed">{state.currentUser.bio || 'لا توجد سيرة ذاتية مكتوبة بعد.'}</p>
                         
                         <h4 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-2 pt-4">التخصصات</h4>
                         <div className="flex flex-wrap gap-2">
                           {ensureArray(state.currentUser.categories).map(c => <span key={c} className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-xl font-black text-xs">{c}</span>)}
                           {ensureArray(state.currentUser.categories).length === 0 && <span className="text-slate-400 font-bold">لم يتم اختيار تخصصات.</span>}
                         </div>
                      </div>
                      <div className="space-y-6">
                         <h4 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-2">المهارات</h4>
                         <div className="flex flex-wrap gap-2">
                           {ensureArray(state.currentUser.skills).map(s => <span key={s} className="bg-slate-50 text-slate-600 px-4 py-1.5 rounded-xl font-black text-xs">{s}</span>)}
                           {ensureArray(state.currentUser.skills).length === 0 && <span className="text-slate-400 font-bold">لم يتم إضافة مهارات.</span>}
                         </div>

                         <div className="pt-10 flex flex-col gap-4">
                            <button onClick={() => setView('edit-profile')} className="bg-slate-900 text-white p-5 rounded-3xl font-black flex items-center justify-center gap-3 shadow-lg hover:bg-emerald-600 transition-all active:scale-95"><Edit size={20}/> تعديل بياناتي</button>
                            <button onClick={() => updateCurrentUser(null)} className="bg-red-50 text-red-500 p-5 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-red-100 transition-all active:scale-95"><LogOut size={20}/> تسجيل الخروج</button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
        {state.view === 'edit-profile' && state.currentUser && (
          <EditProfileView 
            user={state.currentUser} 
            onSaved={handleProfileUpdate}
            onCancel={() => setView('profile')}
          />
        )}
        {['login', 'register'].includes(state.view) && (
          <div className="py-40 text-center animate-fade-in">
             <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600"><Plus size={48}/></div>
             <h3 className="text-3xl font-black text-slate-800 mb-4">قريباً جداً...</h3>
             <p className="text-slate-500 font-bold max-w-sm mx-auto">نحن نضع اللمسات الأخيرة لنظام التسجيل والدخول لضمان أعلى مستويات الأمان.</p>
             <button onClick={() => setView('landing')} className="mt-10 text-emerald-600 font-black flex items-center gap-2 mx-auto"><ArrowRight size={20} className="rotate-180" /> العودة للرئيسية</button>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 pt-20 pb-32 md:pb-16 px-6 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="md:col-span-2 space-y-8">
            <Logo size="md" onClick={() => setView('landing')} />
            <p className="text-slate-500 leading-relaxed font-bold text-lg max-w-md">سلكني هي بوابتك الجزائرية الذكية للوصول إلى أمهر الحرفيين في كافة التخصصات. نهدف إلى خلق مجتمع مهني موثوق يدعم الاقتصاد المحلي.</p>
            <div className="flex gap-4">
               {[1,2,3].map(i => <div key={i} className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-all"><Zap size={20}/></div>)}
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="font-black text-slate-900 text-xl">روابط سريعة</h4>
            <ul className="space-y-4">
              <li><button onClick={() => setView('search')} className="text-slate-500 hover:text-emerald-600 font-bold flex items-center gap-2 flex-row-reverse">تصفح الحرفيين <ChevronLeft size={16}/></button></li>
              <li><button onClick={() => setView('support')} className="text-slate-500 hover:text-emerald-600 font-bold flex items-center gap-2 flex-row-reverse">سوق المهام <ChevronLeft size={16}/></button></li>
              <li><button onClick={() => setView('register')} className="text-slate-500 hover:text-emerald-600 font-bold flex items-center gap-2 flex-row-reverse">انضم كحرفي <ChevronLeft size={16}/></button></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-black text-slate-900 text-xl">تواصل معنا</h4>
            <div className="space-y-4 text-slate-500 font-bold text-sm">
              <p className="flex items-center gap-3 flex-row-reverse"><MessageSquare size={18} className="text-emerald-500"/> support@salakni.dz</p>
              <p className="flex items-center gap-3 flex-row-reverse"><Phone size={18} className="text-emerald-500"/> +213 777 11 76 63</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-50 mt-16 pt-8 text-center md:text-right">
           <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">ALL RIGHTS RESERVED &copy; SALAKNI DZ 2025</p>
        </div>
      </footer>

      {/* Mobile Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-around md:hidden z-50 px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={SearchIcon} label="البحث" active={state.view === 'search'} onClick={() => setView('search')} />
        <TabItem icon={ClipboardList} label="المهام" active={state.view === 'support'} onClick={() => setView('support')} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile' || state.view === 'edit-profile'} onClick={() => setView(state.currentUser ? 'profile' : 'login')} />
      </div>
    </div>
  );
}
