
import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, AppState, User, Worker, Advertisement } from './types.ts';
import { SERVICE_CATEGORIES, WILAYAS } from './constants.tsx';
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
    .admin-tab-active { border-bottom: 3px solid #10b981; color: #10b981; transform: translateY(-2px); }
    .hero-bg-overlay { background: linear-gradient(to bottom, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.7) 50%, rgba(15, 23, 42, 0.95) 100%); }
    .verified-badge { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
  `}</style>
);

const REQ_IMAGE = "https://st3.depositphotos.com/9744818/17392/i/950/depositphotos_173923044-stock-photo-woman-giving-money-man-corrupted.jpg";

// --- مكون عرض الإعلانات ---
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
  return <div className="my-6 flex justify-center w-full" dangerouslySetInnerHTML={{ __html: ad.html_content }} />;
};

const Logo: React.FC<{ size?: 'sm' | 'lg', onClick?: () => void, inverse?: boolean }> = ({ size = 'sm', onClick, inverse }) => (
  <div onClick={onClick} className={`flex items-center gap-2 md:gap-3 group cursor-pointer transition-all ${size === 'lg' ? 'scale-110' : ''}`}>
    <div className={`relative ${size === 'lg' ? 'w-16 h-16' : 'w-10 h-10'} flex-shrink-0`}>
      <div className={`absolute inset-0 bg-gradient-to-tr from-emerald-600 via-teal-500 to-yellow-400 rounded-xl rotate-3 group-hover:rotate-12 transition-transform shadow-xl`}></div>
      <div className="absolute inset-0 flex items-center justify-center text-white font-black z-10">S</div>
    </div>
    <div className="flex flex-col items-start leading-none">
      <div className="flex items-baseline gap-1">
        <span className={`${size === 'lg' ? 'text-4xl' : 'text-2xl'} font-black ${inverse ? 'text-white' : 'text-emerald-950'}`}>Salakni</span>
        <span className="text-yellow-500 font-bold">سلكني</span>
      </div>
    </div>
  </div>
);

// --- لوحة التحكم المتطورة ---
const AdminDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'verification' | 'users' | 'ads'>('stats');
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalWorkers: 0, totalSeekers: 0, pendingVerifications: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);

  // فورم إضافة مستخدم جديد
  const [newUser, setNewUser] = useState({ first_name: '', last_name: '', phone: '', password: '', role: UserRole.WORKER, category: SERVICE_CATEGORIES[0].name, wilaya: WILAYAS[0], is_verified: false });

  const [newAd, setNewAd] = useState({
    title: '',
    placement: 'hero_bottom' as Advertisement['placement'],
    html_content: '',
    is_active: true
  });

  const fetchStats = async () => {
    const { count: workers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', UserRole.WORKER);
    const { count: seekers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', UserRole.SEEKER);
    const { count: pending } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', UserRole.WORKER).eq('is_verified', false);
    setStats({ totalWorkers: workers || 0, totalSeekers: seekers || 0, pendingVerifications: pending || 0 });
  };

  const fetchData = async () => {
    setLoading(true);
    await fetchStats();
    if (activeTab === 'verification') {
      const { data } = await supabase.from('users').select('*').eq('role', UserRole.WORKER).eq('is_verified', false).order('created_at', { ascending: false });
      setItems(data || []);
    } else if (activeTab === 'users') {
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      setItems(data || []);
    } else if (activeTab === 'ads') {
      const { data } = await supabase.from('advertisements').select('*').order('created_at', { ascending: false });
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleUpdateStatus = async (userId: string, isVerified: boolean) => {
    const { error } = await supabase.from('users').update({ is_verified: isVerified }).eq('id', userId);
    if (!error) {
      if (selectedUser?.id === userId) setSelectedUser({...selectedUser, is_verified: isVerified});
      fetchData();
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("سيتم حذف المستخدم وكل بياناته نهائياً من النظام. هل أنت متأكد؟")) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (!error) {
        setSelectedUser(null);
        fetchData();
      } else {
        alert("فشل الحذف: " + error.message);
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('users').insert([newUser]);
    if (error) alert("خطأ في الإضافة: " + error.message);
    else {
      setShowAddUserModal(false);
      setNewUser({ first_name: '', last_name: '', phone: '', password: '', role: UserRole.WORKER, category: SERVICE_CATEGORIES[0].name, wilaya: WILAYAS[0], is_verified: false });
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 text-right">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6 flex-row-reverse">
          <div className="flex items-center gap-4">
            <Logo size="lg" inverse />
            <span className="bg-emerald-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">إدارة النظام</span>
          </div>
          <button onClick={onExit} className="bg-red-600/20 text-red-500 px-6 py-2 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all">خروج</button>
        </header>

        <nav className="flex gap-8 mb-12 border-b border-white/5 flex-row-reverse overflow-x-auto whitespace-nowrap pb-1">
          <button onClick={() => setActiveTab('stats')} className={`pb-4 font-black transition-all ${activeTab === 'stats' ? 'admin-tab-active' : 'text-slate-500'}`}>الإحصائيات</button>
          <button onClick={() => setActiveTab('verification')} className={`pb-4 font-black transition-all ${activeTab === 'verification' ? 'admin-tab-active' : 'text-slate-500'}`}>التوثيق ({stats.pendingVerifications})</button>
          <button onClick={() => setActiveTab('users')} className={`pb-4 font-black transition-all ${activeTab === 'users' ? 'admin-tab-active' : 'text-slate-500'}`}>المستخدمين</button>
          <button onClick={() => setActiveTab('ads')} className={`pb-4 font-black transition-all ${activeTab === 'ads' ? 'admin-tab-active' : 'text-slate-500'}`}>الإعلانات</button>
        </nav>

        {loading ? <div className="flex justify-center py-20"><div className="loading-spinner"></div></div> : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
                  <p className="text-slate-400 font-bold mb-2">الحرفيين</p>
                  <p className="text-6xl font-black text-emerald-500">{stats.totalWorkers}</p>
                </div>
                <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl">
                  <p className="text-slate-400 font-bold mb-2">الزبائن</p>
                  <p className="text-6xl font-black text-blue-500">{stats.totalSeekers}</p>
                </div>
                <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-yellow-500/20 shadow-2xl">
                  <p className="text-slate-400 font-bold mb-2">بانتظار التوثيق</p>
                  <p className="text-6xl font-black text-yellow-500">{stats.pendingVerifications}</p>
                </div>
              </div>
            )}

            {(activeTab === 'users' || activeTab === 'verification') && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button onClick={() => setShowAddUserModal(true)} className="bg-emerald-600 px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-emerald-500 transition-all">+ إضافة حرفي/زبون</button>
                </div>
                <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl overflow-x-auto">
                  <table className="w-full text-right min-w-[600px]">
                    <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                      <tr>
                        <th className="p-6">المستخدم</th>
                        <th className="p-6">الدور</th>
                        <th className="p-6">الحالة</th>
                        <th className="p-6">الموقع</th>
                        <th className="p-6 text-center">خيارات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {items.map(u => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedUser(u)}>
                          <td className="p-6 flex items-center gap-4 flex-row-reverse" onClick={(e) => e.stopPropagation()}>
                            <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.first_name}`} className="w-12 h-12 rounded-2xl border-2 border-slate-800" />
                            <div className="text-right">
                              <p className="font-black text-slate-200">{u.first_name} {u.last_name}</p>
                              <p className="text-xs text-slate-500 font-mono">{u.phone}</p>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${u.role === UserRole.WORKER ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              {u.role === UserRole.WORKER ? 'حرفي' : 'زبون'}
                            </span>
                          </td>
                          <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${u.is_verified ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {u.is_verified ? 'موثق ✅' : 'غير موثق ❌'}
                            </span>
                          </td>
                          <td className="p-6 text-slate-400 text-sm">{u.wilaya}</td>
                          <td className="p-6 text-center" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setSelectedUser(u)} className="text-emerald-500 hover:bg-emerald-500/10 p-2 rounded-xl font-bold ml-2 transition-all">عرض</button>
                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all">🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {items.length === 0 && <div className="p-20 text-center text-slate-500 font-bold italic">لا يوجد مستخدمون حالياً في هذا القسم.</div>}
                </div>
              </div>
            )}

            {activeTab === 'ads' && (
              <div className="space-y-8">
                <div className="flex justify-end">
                   <button onClick={() => setShowAdModal(true)} className="bg-blue-600 px-8 py-3 rounded-2xl font-black shadow-lg">إضافة مساحة إعلانية</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {items.map(ad => (
                    <div key={ad.id} className="bg-slate-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl space-y-4">
                      <div className="flex justify-between items-center flex-row-reverse">
                         <h3 className="font-black">{ad.title || 'إعلان بدون عنوان'}</h3>
                         <span className="text-[10px] text-slate-500 uppercase tracking-widest">{ad.placement}</span>
                      </div>
                      <div className="bg-black/40 p-4 rounded-2xl font-mono text-xs text-blue-400 overflow-x-auto h-32">{ad.html_content}</div>
                      <div className="flex gap-4">
                        <button onClick={async () => { await supabase.from('advertisements').update({ is_active: !ad.is_active }).eq('id', ad.id); fetchData(); }} className={`flex-1 py-3 rounded-xl font-black text-xs ${ad.is_active ? 'bg-yellow-600/20 text-yellow-500' : 'bg-emerald-600/20 text-emerald-500'}`}>
                          {ad.is_active ? 'تعطيل' : 'تفعيل'}
                        </button>
                        <button onClick={async () => { if(confirm("حذف الإعلان؟")) { await supabase.from('advertisements').delete().eq('id', ad.id); fetchData(); } }} className="bg-red-600/20 text-red-500 px-6 py-3 rounded-xl text-xs font-black">حذف</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* مودال تفاصيل المستخدم */}
      {selectedUser && (
        <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-2xl rounded-[3rem] p-8 md:p-12 border border-white/10 text-right shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setSelectedUser(null)} className="absolute top-8 left-8 text-slate-500 hover:text-white text-2xl transition-colors">✕</button>
            
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <img src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.first_name}`} className="w-32 h-32 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl mb-4 object-cover" />
                {selectedUser.is_verified && (
                  <div className="absolute bottom-2 right-2 verified-badge text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-lg text-xl">✓</div>
                )}
              </div>
              <h2 className="text-3xl font-black">{selectedUser.first_name} {selectedUser.last_name}</h2>
              <div className="flex gap-2 mt-2">
                <span className="bg-white/5 px-4 py-1 rounded-full text-xs font-bold text-slate-400">{selectedUser.role === UserRole.WORKER ? 'حرفي' : 'زبون'}</span>
                {selectedUser.category && <span className="bg-emerald-500/10 px-4 py-1 rounded-full text-xs font-black text-emerald-500">{selectedUser.category}</span>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <p className="text-xs text-slate-500 mb-1 font-bold">رقم الهاتف</p>
                <p className="font-mono font-bold text-lg">{selectedUser.phone}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <p className="text-xs text-slate-500 mb-1 font-bold">الولاية</p>
                <p className="font-bold text-lg">{selectedUser.wilaya}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 col-span-1 md:col-span-2">
                <p className="text-xs text-slate-500 mb-1 font-bold">تاريخ الانضمام</p>
                <p className="text-slate-300 font-bold">{new Date(selectedUser.created_at).toLocaleString('ar-DZ')}</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 col-span-1 md:col-span-2">
                <p className="text-xs text-slate-500 mb-1 font-bold">نبذة شخصية</p>
                <p className="text-slate-300 text-sm leading-relaxed">{selectedUser.bio || 'لا يوجد وصف متاح لهذا المستخدم.'}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => handleUpdateStatus(selectedUser.id, !selectedUser.is_verified)} 
                className={`flex-1 py-4 rounded-2xl font-black shadow-lg transition-all active:scale-95 ${selectedUser.is_verified ? 'bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
              >
                {selectedUser.is_verified ? 'إلغاء التوثيق ❌' : 'توثيق الحساب الآن ✅'}
              </button>
              <button onClick={() => handleDeleteUser(selectedUser.id)} className="px-10 bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-red-700 transition-all active:scale-95">حذف الحساب</button>
            </div>
          </div>
        </div>
      )}

      {/* مودال إضافة مستخدم جديد */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-xl rounded-[3rem] p-8 md:p-10 border border-white/10 text-right shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black mb-8 border-b border-white/5 pb-4">إضافة مستخدم جديد 👤</h2>
            <form onSubmit={handleAddUser} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 pr-2">الاسم</label>
                  <input required className="w-full bg-slate-800 border border-white/5 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all" placeholder="محمد" value={newUser.first_name} onChange={e => setNewUser({...newUser, first_name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 pr-2">اللقب</label>
                  <input required className="w-full bg-slate-800 border border-white/5 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all" placeholder="علي" value={newUser.last_name} onChange={e => setNewUser({...newUser, last_name: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 pr-2">رقم الهاتف</label>
                <input required className="w-full bg-slate-800 border border-white/5 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all font-mono" placeholder="0XXXXXXXXX" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 pr-2">كلمة المرور</label>
                <input required type="password" className="w-full bg-slate-800 border border-white/5 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all" placeholder="********" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 pr-2">نوع الحساب</label>
                  <select className="w-full bg-slate-800 border border-white/5 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all font-bold" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                    <option value={UserRole.WORKER}>حرفي محترف</option>
                    <option value={UserRole.SEEKER}>زبون (باحث)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 pr-2">الولاية</label>
                  <select className="w-full bg-slate-800 border border-white/5 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all font-bold" value={newUser.wilaya} onChange={e => setNewUser({...newUser, wilaya: e.target.value})}>
                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              {newUser.role === UserRole.WORKER && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 pr-2">التخصص</label>
                  <select className="w-full bg-slate-800 border border-white/5 p-4 rounded-2xl outline-none focus:border-emerald-500 transition-all font-bold" value={newUser.category} onChange={e => setNewUser({...newUser, category: e.target.value})}>
                    {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-3 pr-2">
                 <input type="checkbox" id="verify-now" className="w-5 h-5 accent-emerald-500" checked={newUser.is_verified} onChange={e => setNewUser({...newUser, is_verified: e.target.checked})} />
                 <label htmlFor="verify-now" className="text-sm font-bold text-slate-400 cursor-pointer">توثيق الحساب فوراً ✅</label>
              </div>
              <div className="flex gap-4 pt-6 border-t border-white/5">
                <button type="submit" className="flex-1 bg-emerald-600 py-4 rounded-2xl font-black shadow-lg hover:bg-emerald-500 transition-all active:scale-95">إضافة المستخدم</button>
                <button type="button" onClick={() => setShowAddUserModal(false)} className="px-10 bg-white/5 py-4 rounded-2xl font-black hover:bg-white/10 transition-all">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال إضافة إعلان */}
      {showAdModal && (
        <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-slate-900 w-full max-w-xl rounded-[3rem] p-8 md:p-10 border border-white/10 text-right shadow-2xl relative">
              <h2 className="text-2xl font-black mb-6">مساحة إعلانية جديدة 📢</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                await supabase.from('advertisements').insert([newAd]);
                setShowAdModal(false);
                setNewAd({ title: '', placement: 'hero_bottom', html_content: '', is_active: true });
                fetchData();
              }} className="space-y-4">
                <input required className="w-full bg-slate-800 border border-white/5 p-4 rounded-2xl outline-none" placeholder="عنوان الإعلان" value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} />
                <select className="w-full bg-slate-800 border border-white/5 p-4 rounded-2xl outline-none" value={newAd.placement} onChange={e => setNewAd({...newAd, placement: e.target.value as Advertisement['placement']})}>
                   <option value="hero_bottom">أسفل الرئيسية</option>
                   <option value="search_top">أعلى البحث</option>
                   <option value="search_sidebar">جانب البحث</option>
                   <option value="footer_top">فوق التذييل</option>
                </select>
                <textarea required className="w-full h-32 bg-slate-800 border border-white/5 p-4 rounded-2xl outline-none font-mono text-xs" placeholder="كود HTML هنا..." value={newAd.html_content} onChange={e => setNewAd({...newAd, html_content: e.target.value})} />
                <div className="flex gap-4 pt-4">
                   <button type="submit" className="flex-1 bg-emerald-600 py-4 rounded-2xl font-black shadow-lg">حفظ</button>
                   <button type="button" onClick={() => setShowAdModal(false)} className="px-10 bg-white/5 py-4 rounded-2xl font-black">إلغاء</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

// --- المكونات الأخرى (Landing, Search, Auth) ---

const LandingHero: React.FC<{ onStart: (v: AppState['view']) => void }> = ({ onStart }) => (
  <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
    <div className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105" style={{ backgroundImage: `url(${REQ_IMAGE})` }}></div>
    <div className="absolute inset-0 hero-bg-overlay"></div>
    <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 w-full text-center">
      <div className="flex flex-col items-center gap-10">
        <Logo size="lg" inverse />
        <h1 className="text-4xl md:text-8xl font-black text-white leading-tight px-4 animate-in fade-in slide-in-from-top-10 duration-1000">ريح بالك، <span className="text-emerald-400">سَلّكني</span> يسلكها</h1>
        <p className="text-lg md:text-3xl text-slate-300 font-medium max-w-3xl mx-auto px-4 animate-in fade-in duration-1000 delay-300">المنصة الجزائرية رقم #1 لربط الحرفيين بالزبائن بضمان وثقة.</p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full px-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
          <button onClick={() => onStart('search')} className="w-full sm:w-auto bg-emerald-600 px-12 md:px-20 py-5 rounded-[2rem] font-black text-xl md:text-2xl text-white shadow-xl hover:bg-emerald-500 transition-all active:scale-95">ابحث عن حرفي 🔍</button>
          <button onClick={() => onStart('register')} className="w-full sm:w-auto bg-white/10 backdrop-blur-md px-12 md:px-20 py-5 rounded-[2rem] font-black text-xl md:text-2xl text-white border border-white/20 hover:bg-white/20 transition-all active:scale-95">سجل كحرفي 🛠️</button>
        </div>
      </div>
      <div className="mt-16"><AdRenderer placement="hero_bottom" /></div>
    </div>
  </div>
);

const AuthForm: React.FC<{ type: 'login' | 'register' | 'admin', onSuccess: (user: User) => void }> = ({ type, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', password: '', role: UserRole.SEEKER as UserRole, wilaya: WILAYAS[0] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (type === 'admin') {
        if (formData.phone === '0777117663' && formData.password === 'vampirewahab31') {
          const adminUser: User = { id: 'admin-id', firstName: 'عبد الوهاب', lastName: 'المدير', phone: formData.phone, role: UserRole.ADMIN, location: { wilaya: 'الجزائر', daira: 'الجزائر' }, isVerified: true };
          onSuccess(adminUser);
        } else { alert("بيانات دخول الإدارة غير صحيحة!"); }
      } else if (type === 'login') {
        const { data, error } = await supabase.from('users').select('*').eq('phone', formData.phone).eq('password', formData.password).single();
        if (data) onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: data.daira }, isVerified: data.is_verified });
        else alert("خطأ في تسجيل الدخول: تأكد من الهاتف وكلمة المرور");
      } else {
        const { data, error } = await supabase.from('users').insert([{ first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone, password: formData.password, role: formData.role, wilaya: formData.wilaya, is_verified: formData.role === UserRole.SEEKER }]).select().single();
        if (data) onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: data.daira }, isVerified: data.is_verified });
        else alert("خطأ في التسجيل: " + error?.message);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-md text-right border border-gray-100 animate-in fade-in slide-in-from-bottom-6 duration-500">
        <h2 className="text-3xl font-black mb-8 text-slate-900">{type === 'admin' ? 'دخول الإدارة 🔒' : type === 'login' ? 'مرحباً بعودتك 👋' : 'انضم إلى سلكني ✨'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="الاسم" required className="p-4 bg-gray-50 border rounded-2xl outline-none focus:border-emerald-500 font-bold" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input placeholder="اللقب" required className="p-4 bg-gray-50 border rounded-2xl outline-none focus:border-emerald-500 font-bold" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          )}
          <input placeholder="رقم الهاتف" required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-emerald-500 font-bold font-mono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input type="password" placeholder="كلمة المرور" required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:border-emerald-500 font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          {type === 'register' && (
            <>
              <select className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                <option value={UserRole.SEEKER}>أبحث عن حرفي (زبون)</option>
                <option value={UserRole.WORKER}>أنا حرفي (أعرض خدماتي)</option>
              </select>
              <select className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-bold" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </>
          )}
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-500 transition-all shadow-lg active:scale-95">
            {loading ? 'جاري التحقق...' : (type === 'login' || type === 'admin' ? 'دخول' : 'إنشاء حساب')}
          </button>
        </form>
      </div>
    </div>
  );
};

const SearchPage: React.FC = () => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ wilaya: '', category: '', query: '' });

  const fetchWorkers = async () => {
    setLoading(true);
    let query = supabase.from('users').select('*').eq('role', UserRole.WORKER).eq('is_verified', true);
    if (filters.wilaya) query = query.eq('wilaya', filters.wilaya);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.query) query = query.or(`first_name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`);
    const { data } = await query.order('created_at', { ascending: false });
    setWorkers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchWorkers(); }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-right">
      <AdRenderer placement="search_top" />
      <div className="bg-emerald-900/5 p-8 md:p-12 rounded-[3rem] mb-12 border border-emerald-100 shadow-sm animate-in fade-in zoom-in duration-700">
        <h2 className="text-3xl font-black mb-8">ابحث عن الحرفي المثالي 🔍</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input placeholder="عن ماذا تبحث؟ (كهربائي، بناء...)" className="md:col-span-2 p-5 bg-white border-2 border-emerald-50 rounded-2xl outline-none focus:border-emerald-500 font-bold" value={filters.query} onChange={e => setFilters({...filters, query: e.target.value})} />
          <select className="p-5 bg-white border-2 border-emerald-50 rounded-2xl outline-none focus:border-emerald-500 font-bold" value={filters.wilaya} onChange={e => setFilters({...filters, wilaya: e.target.value})}>
            <option value="">كل الولايات</option>
            {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select className="p-5 bg-white border-2 border-emerald-50 rounded-2xl outline-none focus:border-emerald-500 font-bold" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
            <option value="">كل التخصصات</option>
            {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-20"><div className="loading-spinner"></div></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
          {workers.map(w => (
            <div key={w.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col group hover:-translate-y-1 transition-all">
              <div className="flex gap-4 items-center mb-6 flex-row-reverse">
                <img src={w.avatar || `https://ui-avatars.com/api/?name=${w.first_name}`} className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-50" />
                <div className="text-right flex-1">
                  <h3 className="text-lg font-black">{w.first_name} {w.last_name}</h3>
                  <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">{w.category}</span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-6 flex-1 leading-relaxed">{w.bio || 'حرفي ماهر مستعد للعمل في منصة سلكني.'}</p>
              <div className="flex justify-between items-center flex-row-reverse pt-4 border-t border-gray-50">
                <span className="text-gray-500 font-bold text-xs">📍 {w.wilaya}</span>
                <button className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-emerald-600 transition-all active:scale-95 shadow-md">تواصل الآن</button>
              </div>
            </div>
          ))}
          {workers.length === 0 && <p className="col-span-full text-center py-20 text-gray-400 font-bold italic">نعتذر، لم نجد أي حرفيين يطابقون خيارات بحثك حالياً.</p>}
        </div>
      )}
      <div className="mt-12"><AdRenderer placement="footer_top" /></div>
    </div>
  );
};

export default function App() {
  // استعادة حالة الجلسة من LocalStorage
  const getInitialUser = () => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  };

  // استعادة الوجهة من الـ Hash
  const getInitialView = (user: User | null): AppState['view'] => {
    const hash = window.location.hash.replace('#/', '');
    if (hash === 'admin-portal') return 'admin-login';
    if (hash === 'admin' && user?.role === UserRole.ADMIN) return 'admin';
    if (hash === 'search') return 'search';
    if (hash === 'login') return 'login';
    if (hash === 'register') return 'register';
    if (hash === 'profile' && user) return 'profile';
    return user?.role === UserRole.ADMIN ? 'admin' : 'landing';
  };

  const [state, setState] = useState<AppState>(() => {
    const user = getInitialUser();
    return {
      currentUser: user,
      workers: [],
      view: getInitialView(user)
    };
  });

  // مزامنة الـ Hash مع الحالة بشكل مستمر
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '');
      const user = getInitialUser();
      
      if (hash === 'admin-portal') setState(prev => ({ ...prev, view: 'admin-login', currentUser: user }));
      else if (hash === 'search') setState(prev => ({ ...prev, view: 'search', currentUser: user }));
      else if (hash === 'login') setState(prev => ({ ...prev, view: 'login', currentUser: user }));
      else if (hash === 'register') setState(prev => ({ ...prev, view: 'register', currentUser: user }));
      else if (hash === 'profile' && user) setState(prev => ({ ...prev, view: 'profile', currentUser: user }));
      else if (hash === 'admin' && user?.role === UserRole.ADMIN) setState(prev => ({ ...prev, view: 'admin', currentUser: user }));
      else if (hash === '') setState(prev => ({ ...prev, view: user?.role === UserRole.ADMIN ? 'admin' : 'landing', currentUser: user }));
    };
    
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const setView = (view: AppState['view']) => {
    if (view === 'landing') window.location.hash = '';
    else window.location.hash = `#/${view}`;
    setState(prev => ({ ...prev, view }));
  };

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setState(prev => ({ ...prev, currentUser: user }));
    if (user.role === UserRole.ADMIN) setView('admin');
    else setView('profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.hash = '';
    setState({ currentUser: null, workers: [], view: 'landing' });
  };

  const isManagementView = state.view === 'admin' || state.view === 'admin-login';

  return (
    <div className={`min-h-screen flex flex-col arabic-text transition-colors duration-700 ${isManagementView ? 'bg-slate-950' : 'bg-gray-50'}`} dir="rtl">
      <GlobalStyles />
      <nav className={`h-24 flex items-center px-6 sticky top-0 z-50 backdrop-blur-xl border-b transition-all ${isManagementView ? 'bg-slate-900/90 border-white/5' : 'bg-white/90 border-gray-100 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Logo onClick={() => setView('landing')} inverse={isManagementView} />
          {state.view !== 'admin' && (
            <div className="flex items-center gap-4 md:gap-8">
              <button onClick={() => setView('landing')} className={`${state.view === 'landing' ? 'text-emerald-600 font-black' : (isManagementView ? 'text-slate-400' : 'text-slate-500')} font-bold text-sm md:text-base hover:text-emerald-500 transition-all`}>الرئيسية</button>
              <button onClick={() => setView('search')} className={`${state.view === 'search' ? 'text-emerald-600 font-black' : (isManagementView ? 'text-slate-400' : 'text-slate-500')} font-bold text-sm md:text-base hover:text-emerald-500 transition-all`}>تصفح الحرفيين</button>
              {!state.currentUser ? (
                <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-sm md:text-base shadow-lg hover:bg-emerald-500 transition-all active:scale-95">دخول</button>
              ) : (
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('profile')}>
                  <div className="text-right hidden sm:block">
                    <p className={`text-xs font-black ${isManagementView ? 'text-white' : 'text-slate-900'}`}>{state.currentUser.firstName}</p>
                    <p className="text-[10px] text-emerald-500 font-bold">ملفي الشخصي</p>
                  </div>
                  <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-10 h-10 rounded-xl border-2 border-emerald-500/20 group-hover:scale-105 transition-all shadow-sm" />
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
      <main className="flex-grow">
        {state.view === 'landing' && <LandingHero onStart={setView} />}
        {state.view === 'search' && <SearchPage />}
        {state.view === 'login' && <AuthForm type="login" onSuccess={handleLoginSuccess} />}
        {state.view === 'register' && <AuthForm type="register" onSuccess={handleLoginSuccess} />}
        {state.view === 'admin-login' && <AuthForm type="admin" onSuccess={handleLoginSuccess} />}
        {state.view === 'admin' && state.currentUser?.role === UserRole.ADMIN && <AdminDashboard onExit={handleLogout} />}
        {state.view === 'profile' && state.currentUser && (
          <div className="max-w-4xl mx-auto my-12 md:my-20 px-6">
            <div className="bg-white p-8 md:p-16 rounded-[3rem] shadow-2xl text-center border border-gray-100 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="relative inline-block mb-8">
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-32 h-32 md:w-40 md:h-40 rounded-[3rem] border-4 border-emerald-50 shadow-xl" />
                {state.currentUser.isVerified && <span className="absolute bottom-2 right-2 verified-badge text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-xl">✓</span>}
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-4 text-slate-900">أهلاً بك، {state.currentUser.firstName} ✨</h2>
              <p className="text-slate-500 text-lg md:text-xl mb-12 font-medium">أنت مسجل كـ <span className="text-emerald-600 font-black">{state.currentUser.role === UserRole.WORKER ? 'حرفي محترف' : 'زبون'}</span> في ولاية {state.currentUser.location.wilaya}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-gray-50 p-6 rounded-3xl text-right border border-gray-100 shadow-sm">
                   <p className="text-xs text-slate-400 font-bold mb-2">إحصائيات الحساب</p>
                   <p className="text-slate-700 font-black text-lg">0 طلبات مكتملة حالياً</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl text-right border border-gray-100 shadow-sm">
                   <p className="text-xs text-slate-400 font-bold mb-2">حالة التوثيق</p>
                   <p className={`${state.currentUser.isVerified ? 'text-emerald-600' : 'text-red-500'} font-black text-lg`}>{state.currentUser.isVerified ? 'حساب موثق ومفعل ✅' : 'بانتظار مراجعة الإدارة ⏳'}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-600 transition-all active:scale-95">تعديل الملف ⚙️</button>
                <button onClick={handleLogout} className="bg-red-50 text-red-500 px-12 py-4 rounded-2xl font-black text-lg border border-red-100 hover:bg-red-500 hover:text-white transition-all active:scale-95">تسجيل الخروج</button>
              </div>
            </div>
          </div>
        )}
      </main>
      {!isManagementView && (
        <footer className="bg-slate-900 text-white py-16 px-6 text-center mt-auto border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <Logo size="lg" inverse />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 text-right">
              <div>
                <h4 className="font-black text-xl mb-6 text-emerald-400">عن سلكني</h4>
                <p className="text-slate-400 leading-relaxed font-medium">المنصة الأولى في الجزائر التي تجمع خيرة الحرفيين تحت سقف واحد لتسهيل حياتكم اليومية وجعل الخدمات أقرب إليكم.</p>
              </div>
              <div>
                <h4 className="font-black text-xl mb-6 text-emerald-400">روابط سريعة</h4>
                <ul className="space-y-4 text-slate-400 font-bold">
                  <li className="hover:text-white cursor-pointer transition-colors" onClick={() => setView('search')}>تصفح الحرفيين</li>
                  <li className="hover:text-white cursor-pointer transition-colors" onClick={() => setView('register')}>سجل كحرفي</li>
                  <li className="hover:text-white cursor-pointer transition-colors">اتفاقية الاستخدام</li>
                </ul>
              </div>
              <div>
                <h4 className="font-black text-xl mb-6 text-emerald-400">تواصل معنا</h4>
                <p className="text-slate-400 font-bold mb-4">info@salakni.dz</p>
                <p className="text-slate-400 font-bold">الجزائر العاصمة، الجمهورية الجزائرية</p>
              </div>
            </div>
            <div className="border-t border-white/5 mt-16 pt-10 text-slate-500 text-sm font-bold tracking-wide">جميع الحقوق محفوظة &copy; {new Date().getFullYear()} سلكني - صُنع بكل إتقان في الجزائر 🇩🇿</div>
          </div>
        </footer>
      )}
    </div>
  );
}
