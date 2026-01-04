
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, Chat, Message, Notification, Task } from './types';
import { SERVICE_CATEGORIES, WILAYAS } from './constants';
import { supabase } from './lib/supabase';
import { 
  User as UserIcon, 
  Home,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Search as SearchIcon,
  ClipboardList,
  Users as UsersIcon,
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
  Check,
  ExternalLink,
  Camera,
  Image as ImageIcon,
  UploadCloud,
  Bell,
  Send,
  MoreVertical,
  PlusCircle,
  AlertCircle
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
      .loading-spinner { border: 3px solid rgba(16, 185, 129, 0.1); border-left-color: #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 0.8s linear infinite; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .worker-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }
      .chat-bubble-me { background: #10b981; color: white; border-radius: 1.5rem 1.5rem 0.2rem 1.5rem; }
      .chat-bubble-other { background: #f1f5f9; color: #1e293b; border-radius: 1.5rem 1.5rem 1.5rem 0.2rem; }
      .glass-card { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
      .task-status-badge { padding: 4px 12px; border-radius: 8px; font-weight: 900; font-size: 10px; text-transform: uppercase; }
      .status-open { background: #ecfdf5; color: #10b981; border: 1px solid #d1fae5; }
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
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
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
      <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">{title}</h2>
      {subtitle && <p className="text-slate-500 font-bold text-lg md:text-xl">{subtitle}</p>}
      <div className={`h-2 w-20 bg-emerald-500 rounded-full mt-4 ${centered ? 'mx-auto' : ''}`}></div>
    </div>
  );
}

function NavButton({ children, active, onClick, badge }: { children?: React.ReactNode; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className={`font-black text-sm transition-all relative py-2 ${active ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-500'}`}>
      {children}
      {badge ? (
        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-pulse">{badge}</span>
      ) : null}
      {active && <span className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-full animate-fade-in"></span>}
    </button>
  );
}

function TabItem({ icon: Icon, label, active, onClick, badge }: { icon: any; label: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all relative ${active ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}>
      <Icon size={24} />
      {badge ? (
        <span className="absolute top-0 right-1/4 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">{badge}</span>
      ) : null}
      <span className="text-[10px] font-black">{label}</span>
    </button>
  );
}

// --- Tasks Market Components ---

// Fix: Added key to component props to resolve TypeScript error in list mapping
function TaskCard({ task, onClick, onChat }: { task: Task; onClick: () => void; onChat: (id: string) => void; key?: string | number }) {
  return (
    <div 
      className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col cursor-pointer hover:border-emerald-200 hover:shadow-xl transition-all group animate-fade-in"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-2">
           <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-xl font-black text-[10px] border border-emerald-100 uppercase tracking-widest">{task.category}</span>
           <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black">
              <Clock size={12}/> {new Date(task.created_at).toLocaleDateString('ar-DZ')}
           </div>
        </div>
        <div className="bg-emerald-600/5 px-4 py-2 rounded-2xl border border-emerald-100">
           <span className="text-emerald-700 font-black text-xl flex items-center gap-1.5">
              {task.budget.toLocaleString()} <span className="text-xs font-bold">دج</span>
           </span>
        </div>
      </div>
      
      <h3 className="text-xl font-black text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors leading-relaxed line-clamp-2">{task.title}</h3>
      <p className="text-slate-500 font-medium line-clamp-3 mb-8 text-sm leading-relaxed flex-grow">{task.description}</p>
      
      <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
         <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200">
               {task.seeker_avatar ? <img src={task.seeker_avatar} className="w-full h-full object-cover"/> : <UserIcon size={14}/>}
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">بواسطة</span>
               <span>{task.seeker_name || 'صاحب الطلب'}</span>
            </div>
         </div>
         <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
            <MapPin size={14} className="text-emerald-500"/> {task.wilaya}
         </div>
      </div>
      <div className="mt-4 flex gap-2">
         <button 
           onClick={(e) => { e.stopPropagation(); onChat(task.seeker_id); }} 
           className="flex-grow bg-slate-900 text-white py-3 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
         >
           <MessageSquare size={14}/> تواصل الآن
         </button>
      </div>
    </div>
  );
}

function AddTaskModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    category: SERVICE_CATEGORIES[0].name,
    wilaya: WILAYAS[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.budget) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setLoading(true);
    try {
      // Logic for adding task to Supabase
      const { error } = await supabase.from('tasks').insert([{
        title: formData.title,
        description: formData.description,
        budget: parseInt(formData.budget),
        category: formData.category,
        wilaya: formData.wilaya,
        status: 'open'
      }]);
      if (error) throw error;
      onAdded();
    } catch (err: any) {
      alert("خطأ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in text-right">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button onClick={onClose} className="absolute top-6 left-6 p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X size={24}/></button>
        <div className="flex items-center gap-3 mb-8">
           <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600"><PlusCircle size={28}/></div>
           <div className="flex flex-col">
              <h3 className="text-2xl font-black text-slate-900">طلب مهمة جديدة</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">انشر طلبك وسيصل للحرفيين فوراً</p>
           </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase">عنوان الطلب</label>
              <input required placeholder="مثلاً: صباغة شقة 4 غرف بباب الزوار" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
           </div>
           
           <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase">تفاصيل المهمة</label>
              <textarea required rows={4} placeholder="اشرح ما تحتاجه بالتفصيل لجذب العروض المناسبة..." className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase">الميزانية التقديرية (دج)</label>
                <input required type="number" placeholder="مثلاً: 5000" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase">الولاية</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
           </div>
           
           <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 mr-2 uppercase">التخصص المطلوب</label>
              <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
           </div>

           <button disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-[2.5rem] font-black text-xl shadow-xl shadow-emerald-200 hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {loading ? <div className="loading-spinner w-6 h-6 border-white"></div> : <Zap size={24}/>}
              {loading ? 'جاري النشر...' : 'انشر المهمة الآن 🚀'}
           </button>
        </form>
      </div>
    </div>
  );
}

function TasksMarketView({ onStartChat }: { onStartChat: (id: string) => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({ wilaya: '', category: '', query: '' });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let q = supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (filters.wilaya) q = q.eq('wilaya', filters.wilaya);
      if (filters.category) q = q.eq('category', filters.category);
      if (filters.query) q = q.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      
      const { data, error } = await q;
      if (data) setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fade-in text-right">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
         <SectionHeading title="سوق المهام المفتوحة" subtitle="تصفح أحدث طلبات الزبائن، قدم عروضك، وابدأ العمل فوراً." />
         <button 
           onClick={() => setShowAddModal(true)} 
           className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black text-xl flex items-center gap-3 shadow-2xl shadow-emerald-200 hover:bg-emerald-500 active:scale-95 transition-all w-full md:w-auto justify-center"
         >
           <Plus size={24}/> اطلب خدمة جديدة
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
         {/* Filters Sidebar */}
         <aside className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 sticky top-28 space-y-8">
               <h4 className="font-black text-slate-900 text-xl flex items-center gap-2 border-b border-slate-50 pb-4"><Filter size={20} className="text-emerald-500"/> فرز المهام</h4>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-tighter">بحث نصي</label>
                    <div className="relative">
                       <input 
                         placeholder="عن ماذا تبحث؟" 
                         className="w-full p-4 pr-12 bg-slate-50 rounded-2xl border-none font-bold text-sm focus:ring-2 ring-emerald-500/20"
                         value={filters.query}
                         onChange={e => setFilters({...filters, query: e.target.value})}
                       />
                       <SearchIcon className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-300" size={20}/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-tighter">الولاية</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" value={filters.wilaya} onChange={e => setFilters({...filters, wilaya: e.target.value})}>
                      <option value="">كل الولايات</option>
                      {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 mr-2 uppercase tracking-tighter">التخصص</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
                      <option value="">كل التخصصات</option>
                      {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <button onClick={() => setFilters({wilaya:'', category:'', query:''})} className="w-full py-4 text-emerald-600 font-black text-xs hover:bg-emerald-50 rounded-2xl transition-all border border-transparent hover:border-emerald-100 uppercase tracking-widest">إعادة ضبط</button>
               </div>
            </div>
         </aside>

         {/* Tasks Grid */}
         <div className="lg:col-span-3">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                 <div className="loading-spinner"></div>
                 <p className="text-slate-400 font-black text-xs uppercase tracking-widest">جاري جلب أحدث الطلبات...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {tasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onClick={() => setSelectedTask(task)} 
                    onChat={onStartChat}
                  />
                ))}
                {tasks.length === 0 && (
                  <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                     <ClipboardList size={80} className="text-slate-100 mx-auto mb-6"/>
                     <h3 className="text-3xl font-black text-slate-300">لا يوجد مهام مطابقة حالياً</h3>
                     <p className="text-slate-400 font-bold mt-4 max-w-sm mx-auto">جرب تغيير فلاتر البحث أو كن أول من ينشر طلباً في هذه الفئة!</p>
                  </div>
                )}
              </div>
            )}
         </div>
      </div>

      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); fetchTasks(); }} />}
      
      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in text-right">
          <div className="bg-white w-full max-w-3xl rounded-[3.5rem] shadow-2xl p-10 relative max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-100">
             <button onClick={() => setSelectedTask(null)} className="absolute top-10 left-10 p-4 text-slate-400 hover:bg-slate-50 hover:text-red-500 rounded-2xl transition-all"><X size={28}/></button>
             
             <div className="flex flex-wrap items-center gap-3 mb-8">
                <span className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-xl text-[10px] font-black border border-emerald-200 uppercase tracking-widest">{selectedTask.category}</span>
                <span className="task-status-badge status-open">مفتوحة حالياً</span>
             </div>

             <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">{selectedTask.title}</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-emerald-50/50 p-8 rounded-[3rem] border border-emerald-100 shadow-sm">
                   <p className="text-[10px] font-black text-emerald-600 mb-2 uppercase tracking-widest">الميزانية المقترحة</p>
                   <p className="text-4xl font-black text-emerald-800 flex items-center gap-2">
                      {selectedTask.budget.toLocaleString()} <span className="text-sm font-black">دج</span>
                   </p>
                </div>
                <div className="bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">الموقع الجغرافي</p>
                   <p className="text-2xl font-black text-slate-700 flex items-center gap-3">
                      <MapPin size={28} className="text-emerald-500"/> {selectedTask.wilaya}
                   </p>
                </div>
             </div>

             <div className="space-y-6 mb-12">
                <h4 className="text-2xl font-black text-slate-900 flex items-center gap-3">وصف المهمة <Info size={24} className="text-emerald-500"/></h4>
                <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 border-dashed">
                   <p className="text-slate-600 font-medium text-xl leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
             </div>

             <div className="bg-emerald-600/5 p-8 rounded-[3rem] border border-emerald-100 mb-12 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-white rounded-2xl border border-emerald-100 flex items-center justify-center text-emerald-600 font-black shadow-sm overflow-hidden">
                   {selectedTask.seeker_avatar ? <img src={selectedTask.seeker_avatar} className="w-full h-full object-cover"/> : <UserIcon size={32}/>}
                </div>
                <div className="flex-grow text-center md:text-right">
                   <h5 className="font-black text-xl text-slate-900">{selectedTask.seeker_name || 'صاحب المهمة'}</h5>
                   <p className="text-sm text-slate-400 font-bold">تواصل مع صاحب الطلب مباشرة لمناقشة التفاصيل والاتفاق.</p>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-5">
                <button 
                  onClick={() => { onStartChat(selectedTask.seeker_id); setSelectedTask(null); }} 
                  className="flex-grow bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-emerald-200 hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                   <MessageSquare size={32}/> تواصل و قدم عرضك
                </button>
                <button 
                  className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl hover:bg-slate-800 active:scale-95 transition-all"
                  title="اتصال هاتفي"
                >
                   <Phone size={28}/>
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Missing Views Implementation ---

// Added missing ChatView component
function ChatView({ currentUser, activeChat, onBack }: { currentUser: User; activeChat: Chat | null; onBack: () => void }) {
  return (
    <div className="max-w-4xl mx-auto h-[80vh] bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col my-10 animate-fade-in">
       <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <MessageSquare size={24}/>
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900">المحادثات</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">تواصل مع الزبائن والحرفيين</p>
             </div>
          </div>
          <button onClick={onBack} className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X size={24}/></button>
       </div>
       <div className="flex-grow p-8 flex flex-col items-center justify-center text-center">
          <MessageSquare size={80} className="text-slate-100 mb-6"/>
          <h3 className="text-3xl font-black text-slate-300 italic">نظام المحادثات المباشرة قيد الصيانة</h3>
          <p className="text-slate-400 font-bold mt-4 max-w-sm mx-auto">نحن نعمل على ترقية خوادم الدردشة لتوفير تجربة أسرع وأكثر أماناً. شكراً لصبركم.</p>
       </div>
    </div>
  );
}

// Added missing EditProfileView component
function EditProfileView({ user, onSaved, onCancel }: { user: User; onSaved: (u: User) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState<User>({...user});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaved(formData);
  };

  return (
    <div className="max-w-3xl mx-auto py-24 px-6 animate-fade-in text-right">
       <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 p-12">
          <SectionHeading title="تعديل الملف الشخصي" subtitle="حدث معلوماتك لزيادة فرص وصول الزبائن إليك." />
          <form onSubmit={handleSubmit} className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 mr-2 uppercase">الاسم الأول</label>
                   <input className="w-full p-5 bg-slate-50 rounded-[2rem] border-none font-bold text-lg" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 mr-2 uppercase">اللقب</label>
                   <input className="w-full p-5 bg-slate-50 rounded-[2rem] border-none font-bold text-lg" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2 uppercase">النبذة الشخصية</label>
                <textarea rows={4} className="w-full p-8 bg-slate-50 rounded-[3rem] border-none font-bold text-lg" value={formData.bio || ''} onChange={e => setFormData({...formData, bio: e.target.value})} />
             </div>
             <div className="flex gap-4 pt-8">
                <button type="submit" className="flex-grow bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-emerald-200 hover:bg-emerald-500 transition-all flex items-center justify-center gap-3">
                   <Save size={28}/> حفظ التغييرات
                </button>
                <button type="button" onClick={onCancel} className="bg-slate-100 text-slate-500 px-10 rounded-[2.5rem] font-black text-xl hover:bg-slate-200 transition-all">إلغاء</button>
             </div>
          </form>
       </div>
    </div>
  );
}

// --- Main App Logic ---

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('user');
    return { 
      currentUser: saved ? JSON.parse(saved) : null, 
      selectedWorker: null,
      activeChat: null,
      workers: [], 
      notifications: [],
      view: 'landing' 
    };
  });

  const setView = (view: AppState['view']) => { setState(prev => ({ ...prev, view })); window.scrollTo(0, 0); };
  
  const updateCurrentUser = (u: User | null) => { 
    setState(prev => ({ ...prev, currentUser: u })); 
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user'); 
  };

  const handleProfileUpdate = (updatedUser: User) => {
    updateCurrentUser(updatedUser);
    setView('profile');
  };

  const openWorkerDetails = (worker: User) => {
    setState(prev => ({ ...prev, selectedWorker: worker, view: 'worker-details' }));
    window.scrollTo(0, 0);
  };

  const startChat = (participantId: string) => {
    if (!state.currentUser) { setView('login'); return; }
    const mockChat: Chat = {
      id: `chat_${participantId}`,
      participant_1: state.currentUser.id,
      participant_2: participantId,
      updated_at: new Date().toISOString(),
      other_participant: { firstName: 'مستخدم', lastName: 'نشط', avatar: '' } as User
    };
    setState(prev => ({ ...prev, activeChat: mockChat, view: 'chats' }));
  };

  return (
    <div className="min-h-screen flex flex-col arabic-text bg-slate-50 text-slate-900 pb-24 md:pb-0 custom-scrollbar" dir="rtl">
      <GlobalStyles />
      <nav className="sticky top-0 z-50 h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center px-4 md:px-10 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} size="md" />
          <div className="hidden md:flex items-center gap-10">
            <NavButton active={state.view === 'landing'} onClick={() => setView('landing')}>الرئيسية</NavButton>
            <NavButton active={state.view === 'search'} onClick={() => setView('search')}>الحرفيين</NavButton>
            <NavButton active={state.view === 'support'} onClick={() => setView('support')}>سوق المهام</NavButton>
            {state.currentUser && (
              <>
                <NavButton active={state.view === 'chats'} onClick={() => setView('chats')} badge={2}>الرسائل</NavButton>
                <NavButton active={state.view === 'notifications'} onClick={() => setView('notifications')} badge={3}>التنبيهات</NavButton>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {state.currentUser ? (
              <div onClick={() => setView('profile')} className="flex items-center gap-3 cursor-pointer p-1.5 pr-5 bg-white rounded-full border border-slate-200 hover:border-emerald-200 transition-all shadow-sm">
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-black text-sm text-slate-800">{state.currentUser.firstName}</span>
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">حسابي</span>
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
        {state.view === 'search' && <SearchWorkersView onViewWorker={openWorkerDetails} />}
        {state.view === 'worker-details' && state.selectedWorker && <WorkerView worker={state.selectedWorker} onBack={() => setView('search')} onStartChat={() => startChat(state.selectedWorker!.id)} />}
        {state.view === 'chats' && state.currentUser && <ChatView currentUser={state.currentUser} activeChat={state.activeChat || null} onBack={() => setView('landing')} />}
        {state.view === 'support' && <TasksMarketView onStartChat={startChat} />}
        {state.view === 'notifications' && (
          <div className="max-w-3xl mx-auto py-20 px-6 animate-fade-in text-center">
             <Bell size={64} className="text-emerald-200 mx-auto mb-6"/>
             <h3 className="text-3xl font-black text-slate-900">لا يوجد تنبيهات جديدة</h3>
             <p className="text-slate-400 font-bold mt-2">سوف تصلك الإشعارات فور وجود تحديثات على حسابك.</p>
          </div>
        )}
        {state.view === 'profile' && state.currentUser && (
          <div className="max-w-4xl mx-auto py-24 px-6 animate-fade-in text-right">
             <div className="bg-white rounded-[4rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="h-48 bg-gradient-to-r from-emerald-600 to-teal-500"></div>
                <div className="px-12 pb-12">
                   <div className="relative -mt-24 mb-12">
                     <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-48 h-48 rounded-[3.5rem] border-8 border-white mx-auto shadow-2xl object-cover bg-white" />
                     {state.currentUser.verificationStatus === 'verified' && (
                       <div className="absolute bottom-6 right-1/2 translate-x-16 translate-y-2 bg-blue-500 text-white p-2.5 rounded-2xl border-4 border-white shadow-lg"><CheckCircle2 size={24}/></div>
                     )}
                   </div>
                   <div className="text-center mb-16">
                     <h2 className="text-5xl font-black text-slate-900 mb-4">{state.currentUser.firstName} {state.currentUser.lastName}</h2>
                     <div className="flex items-center justify-center gap-4 text-slate-500 font-bold">
                        <span className="flex items-center gap-1.5"><MapPin size={20} className="text-emerald-500"/> {state.currentUser.location.wilaya}</span>
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                        <span className="flex items-center gap-1.5 text-emerald-600 font-black"><Trophy size={20}/> حرفي معتمد</span>
                     </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                      <div className="space-y-10">
                         <section>
                            <h4 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4 mb-4">النبذة الشخصية</h4>
                            <p className="text-slate-600 font-medium leading-relaxed text-lg">{state.currentUser.bio || 'لم يتم إضافة نبذة بعد.'}</p>
                         </section>
                         <section>
                            <h4 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4 mb-4">التخصصات والخدمات</h4>
                            <div className="flex flex-wrap gap-2.5">
                               {ensureArray(state.currentUser.categories).map(c => <span key={c} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-black text-xs border border-emerald-100">{c}</span>)}
                            </div>
                         </section>
                      </div>
                      <div className="space-y-10">
                         <section>
                            <h4 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4 mb-4">المهارات والتقنيات</h4>
                            <div className="flex flex-wrap gap-2.5">
                               {ensureArray(state.currentUser.skills).map(s => <span key={s} className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl font-black text-xs border border-slate-100">{s}</span>)}
                            </div>
                         </section>
                         <div className="pt-10 flex flex-col gap-4">
                            <button onClick={() => setView('edit-profile')} className="bg-slate-900 text-white p-6 rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-600 transition-all active:scale-95"><Edit size={24}/> تعديل ملفي الشخصي</button>
                            <button onClick={() => updateCurrentUser(null)} className="bg-red-50 text-red-500 p-6 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-red-100 transition-all active:scale-95"><LogOut size={24}/> تسجيل الخروج</button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
        {state.view === 'edit-profile' && state.currentUser && <EditProfileView user={state.currentUser} onSaved={(u) => { updateCurrentUser(u); setView('profile'); }} onCancel={() => setView('profile')} />}
        {['login', 'register'].includes(state.view) && (
          <div className="py-40 text-center animate-fade-in"><div className="loading-spinner mx-auto mb-6"></div><h3 className="text-3xl font-black">نظام الدخول قيد التحديث...</h3><button onClick={() => setView('landing')} className="mt-8 text-emerald-600 font-black">العودة للرئيسية</button></div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-around md:hidden z-50 px-6 shadow-2xl">
        <TabItem icon={Home} label="الرئيسية" active={state.view === 'landing'} onClick={() => setView('landing')} />
        <TabItem icon={SearchIcon} label="البحث" active={state.view === 'search'} onClick={() => setView('search')} />
        <TabItem icon={ClipboardList} label="المهام" active={state.view === 'support'} onClick={() => setView('support')} />
        <TabItem icon={MessageSquare} label="الرسائل" active={state.view === 'chats'} onClick={() => setView('chats')} badge={2} />
        <TabItem icon={UserIcon} label="حسابي" active={state.view === 'profile' || state.view === 'edit-profile'} onClick={() => setView(state.currentUser ? 'profile' : 'login')} />
      </div>
    </div>
  );
}

// Sub-views refactoring for brevity
function LandingView({ onStart, onRegister }: { onStart: () => void; onRegister: () => void }) {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 px-6 animate-fade-in">
      <div className="absolute inset-0 bg-slate-950 bg-[url('https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=2000')] bg-cover bg-center opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
      <div className="relative z-10 max-w-5xl text-center text-white">
        <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tighter">ريح بالك، <span className="text-emerald-400 italic">سَلّكني</span> يسلكها!</h1>
        <p className="text-xl md:text-3xl text-slate-300 mb-12 font-medium max-w-3xl mx-auto leading-relaxed">بوابتك الذكية للوصول إلى أفضل الحرفيين المهرة في الجزائر بكل ثقة.</p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
           <button onClick={onStart} className="bg-emerald-600 px-14 py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl hover:bg-emerald-500 active:scale-95 transition-all w-full sm:w-auto">اطلب خدمة الآن 🔍</button>
           <button onClick={onRegister} className="bg-white/10 backdrop-blur-md px-14 py-6 rounded-[2.5rem] font-black text-2xl border border-white/20 hover:bg-white/20 transition-all w-full sm:w-auto">انضم كحرفي 🛠️</button>
        </div>
      </div>
    </div>
  );
}

function SearchWorkersView({ onViewWorker }: { onViewWorker: (w: User) => void }) {
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.from('users').select('*').eq('role', 'WORKER').then(({ data }) => {
      if (data) setWorkers(data.map(u => ({ ...u, firstName: u.first_name, lastName: u.last_name, location: { wilaya: u.wilaya }, categories: ensureArray(u.categories) } as User)));
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fade-in text-right">
       <SectionHeading title="اكتشف الحرفيين المبدعين" subtitle="تواصل مع المبدعين الموثقين بالقرب منك في كافة الولايات." />
       {loading ? (
         <div className="py-20 flex justify-center"><div className="loading-spinner"></div></div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {workers.map(w => (
              <div key={w.id} className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 hover:-translate-y-2 transition-all cursor-pointer group" onClick={() => onViewWorker(w)}>
                 <div className="flex gap-6 items-center mb-8 flex-row-reverse">
                    <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.firstName}`} className="w-20 h-20 rounded-[1.5rem] object-cover border-4 border-slate-50 shadow-md"/>
                    <div className="text-right flex-1">
                       <h3 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{w.firstName} {w.lastName}</h3>
                       <div className="flex flex-wrap gap-1 mt-1">
                          {w.categories.slice(0, 2).map(c => <span key={c} className="text-emerald-600 font-black text-[10px] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{c}</span>)}
                       </div>
                    </div>
                 </div>
                 <p className="text-slate-500 font-medium mb-8 line-clamp-2 leading-relaxed">{w.bio || 'حرفي مبدع متاح لخدمتكم.'}</p>
                 <div className="flex justify-between items-center border-t border-slate-50 pt-6">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5"><MapPin size={16} className="text-emerald-500"/> {w.location.wilaya}</span>
                    <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm group-hover:bg-emerald-600 shadow-md transition-all">عرض الملف</button>
                 </div>
              </div>
            ))}
         </div>
       )}
    </div>
  );
}

function WorkerView({ worker, onBack, onStartChat }: { worker: User; onBack: () => void; onStartChat: () => void }) {
  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-fade-in text-right">
       <button onClick={onBack} className="flex items-center gap-2 text-slate-500 font-black mb-8 hover:text-emerald-600 transition-all"><ArrowRight size={20} className="rotate-180"/> العودة للبحث</button>
       <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-emerald-600 to-teal-500"></div>
          <div className="px-12 pb-12">
             <div className="relative -mt-24 mb-12 flex flex-col md:flex-row items-center md:items-end gap-8">
                <img src={worker.avatar || `https://ui-avatars.com/api/?name=${worker.firstName}`} className="w-48 h-48 rounded-[3.5rem] border-8 border-white shadow-2xl object-cover bg-slate-50" />
                <div className="text-center md:text-right flex-grow">
                   <h2 className="text-5xl font-black text-slate-900 mb-4">{worker.firstName} {worker.lastName}</h2>
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-emerald-600 font-black">
                      <span className="flex items-center gap-2"><MapPin size={22}/> {worker.location.wilaya}</span>
                      <span className="flex items-center gap-2 text-yellow-500"><Star size={22} fill="currentColor"/> 4.9 (24 تقييم)</span>
                   </div>
                </div>
                <div className="flex gap-4">
                   <button onClick={onStartChat} className="bg-emerald-600 text-white p-5 rounded-[2rem] shadow-xl hover:bg-emerald-500 transition-all active:scale-95"><MessageSquare size={28}/></button>
                   <button className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-xl hover:bg-slate-800 transition-all active:scale-95"><Phone size={28}/></button>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
                <div className="md:col-span-2 space-y-12">
                   <section>
                      <h4 className="text-2xl font-black text-slate-900 mb-6">حول الحرفي</h4>
                      <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 shadow-sm"><p className="text-slate-600 font-medium text-xl leading-relaxed whitespace-pre-wrap">{worker.bio || 'مبدع سلكني يسعى لتقديم الأفضل.'}</p></div>
                   </section>
                   <section>
                      <h4 className="text-2xl font-black text-slate-900 mb-6">أعمال سابقة</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        {ensureArray(worker.portfolio).map((img, i) => (
                          <div key={i} className="aspect-square rounded-[2.5rem] bg-slate-100 border border-slate-200 shadow-sm overflow-hidden group">
                             <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110"/>
                          </div>
                        ))}
                        {ensureArray(worker.portfolio).length === 0 && (
                          <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                             <ImageIcon size={48} className="text-slate-100 mx-auto mb-2"/>
                             <p className="text-slate-400 font-bold">لا توجد صور في معرض الأعمال بعد.</p>
                          </div>
                        )}
                      </div>
                   </section>
                </div>
                <div className="space-y-8">
                   <div className="bg-emerald-600 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12 group-hover:scale-110 transition-transform"><Trophy size={160}/></div>
                      <h5 className="font-black text-2xl mb-6 relative z-10">إحصائيات العمل</h5>
                      <div className="space-y-5 relative z-10">
                         <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl"><span>مهام مكتملة</span><span className="font-black text-2xl">{worker.completedJobs || 0}</span></div>
                         <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl"><span>سنوات الخبرة</span><span className="font-black text-2xl">+7</span></div>
                      </div>
                   </div>
                   <button onClick={onStartChat} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl active:scale-95">ابدأ المحادثة الآن</button>
                   <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
                      <h5 className="font-black text-slate-900">التحقق من الهوية</h5>
                      <div className="flex items-center gap-3 text-emerald-600 font-black text-sm">
                         <ShieldCheck size={20}/> حساب موثق رسمياً
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
