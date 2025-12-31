
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AppState, User, Message, Notification, Advertisement, SupportRequest } from './types.ts';
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
    .chat-bubble-me { background: #10b981; color: white; border-radius: 1.5rem 1.5rem 0 1.5rem; }
    .chat-bubble-them { background: #f3f4f6; color: #1f2937; border-radius: 1.5rem 1.5rem 1.5rem 0; }
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

// --- قسم الدعم الفني للمستخدم ---
const SupportView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('support_requests').insert([{
        user_id: currentUser.id,
        user_name: `${currentUser.firstName} ${currentUser.lastName}`,
        user_phone: currentUser.phone,
        description,
        image_data: image,
        status: 'pending'
      }]);
      if (error) throw error;
      
      // إرسال إشعار للآدمن (في الأنظمة الحقيقية يرسل لجدول إشعارات الآدمن)
      setSuccess(true);
      setDescription('');
      setImage(null);
    } catch (err) {
      alert("حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-12 px-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-gray-100 text-right">
        <h2 className="text-3xl font-black mb-4 text-slate-900">الدعم الفني والشكاوي 🛠️</h2>
        <p className="text-slate-500 mb-8 font-medium">واجهت مشكلة؟ نحن هنا لمساعدتك. يرجى شرح المشكلة بوضوح وإرفاق صورة إذا لزم الأمر.</p>
        
        {success ? (
          <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-black text-emerald-800 mb-2">تم إرسال طلبك بنجاح</h3>
            <p className="text-emerald-600 font-medium">سيقوم فريق الدعم بمراجعة مشكلتك والرد عليك في أقرب وقت ممكن.</p>
            <button onClick={() => setSuccess(false)} className="mt-6 text-emerald-700 font-bold underline">إرسال طلب آخر</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block font-black text-slate-700 pr-2">وصف المشكلة</label>
              <textarea 
                required
                className="w-full h-48 p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-emerald-500 transition-all font-medium"
                placeholder="اشرح المشكلة بالتفصيل هنا..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block font-black text-slate-700 pr-2">إرفاق صورة (اختياري)</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="hidden" 
                  id="support-image" 
                />
                <label 
                  htmlFor="support-image" 
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:bg-gray-50 hover:border-emerald-300 transition-all"
                >
                  {image ? (
                    <img src={image} className="h-full w-full object-contain p-2 rounded-3xl" />
                  ) : (
                    <>
                      <div className="text-3xl mb-2">📸</div>
                      <span className="text-sm font-bold text-gray-500">انقر لرفع صورة عن المشكلة</span>
                    </>
                  )}
                </label>
                {image && (
                  <button 
                    type="button" 
                    onClick={() => setImage(null)}
                    className="absolute top-2 left-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                  >✕</button>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black text-xl text-white shadow-xl transition-all active:scale-95 ${loading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'}`}
            >
              {loading ? 'جاري الإرسال...' : 'إرسال الطلب للآدمن'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// --- نظام الرسائل (Chat) ---
const ChatView: React.FC<{ currentUser: User, targetUser?: User | null }> = ({ currentUser, targetUser }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<User | null>(targetUser || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
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
    if (activeChat) fetchMessages(activeChat.id);
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
    <div className="max-w-6xl mx-auto my-6 md:my-10 h-[80vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden border flex flex-row-reverse">
      <div className="w-1/3 border-l bg-gray-50 flex flex-col">
        <div className="p-6 border-b bg-white"><h2 className="text-xl font-black">المحادثات</h2></div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.map((conv: any) => (
            <div key={conv.id} onClick={() => setActiveChat(conv)} className={`p-4 flex items-center gap-4 flex-row-reverse cursor-pointer hover:bg-emerald-50 transition-all ${activeChat?.id === conv.id ? 'bg-emerald-100' : ''}`}>
              <img src={conv.avatar || `https://ui-avatars.com/api/?name=${conv.first_name}`} className="w-12 h-12 rounded-xl object-cover" />
              <div className="text-right flex-1">
                <p className="font-black text-sm">{conv.first_name} {conv.last_name}</p>
                <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
              </div>
              {conv.unread_count > 0 && <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">{conv.unread_count}</span>}
            </div>
          ))}
          {conversations.length === 0 && <p className="text-center py-10 text-gray-400 font-bold">لا توجد محادثات.</p>}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-white">
        {activeChat ? (
          <>
            <div className="p-6 border-b flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-4 flex-row-reverse">
                <img src={activeChat.avatar || `https://ui-avatars.com/api/?name=${activeChat.firstName}`} className="w-10 h-10 rounded-xl" />
                <div className="text-right">
                  <p className="font-black">{activeChat.firstName} {activeChat.lastName}</p>
                  <p className="text-[10px] text-emerald-500 font-bold">متصل الآن</p>
                </div>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_id === currentUser.id ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] p-4 text-sm font-medium ${m.sender_id === currentUser.id ? 'chat-bubble-me' : 'chat-bubble-them'}`}>
                    {m.content}
                    <p className="text-[8px] mt-1 opacity-70 text-left">{new Date(m.created_at).toLocaleTimeString('ar-DZ')}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-6 border-t bg-gray-50 flex gap-4">
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="اكتب رسالتك هنا..." className="flex-1 p-4 bg-white border rounded-2xl outline-none focus:border-emerald-500 font-medium" />
              <button type="submit" className="bg-emerald-600 text-white px-8 rounded-2xl font-black hover:bg-emerald-500 transition-all">إرسال</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 font-bold">اختر محادثة لبدء الدردشة.</div>
        )}
      </div>
    </div>
  );
};

// --- لوحة الآدمن المحدثة ---
const AdminDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'verification' | 'users' | 'ads' | 'support'>('stats');
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalWorkers: 0, totalSeekers: 0, pendingVerifications: 0, openSupport: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedSupport, setSelectedSupport] = useState<SupportRequest | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { count: workers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', UserRole.WORKER);
    const { count: seekers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', UserRole.SEEKER);
    const { count: pending } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', UserRole.WORKER).eq('is_verified', false);
    const { count: support } = await supabase.from('support_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    
    setStats({ totalWorkers: workers || 0, totalSeekers: seekers || 0, pendingVerifications: pending || 0, openSupport: support || 0 });

    if (activeTab === 'users') {
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      setItems(data || []);
    } else if (activeTab === 'verification') {
      const { data } = await supabase.from('users').select('*').eq('role', UserRole.WORKER).eq('is_verified', false);
      setItems(data || []);
    } else if (activeTab === 'ads') {
      const { data } = await supabase.from('advertisements').select('*').order('created_at', { ascending: false });
      setItems(data || []);
    } else if (activeTab === 'support') {
      const { data } = await supabase.from('support_requests').select('*').order('created_at', { ascending: false });
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 text-right">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6 flex-row-reverse">
          <div className="flex items-center gap-4"><Logo size="lg" inverse /><span className="bg-emerald-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">إدارة النظام</span></div>
          <button onClick={onExit} className="bg-red-600/20 text-red-500 px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition-all">خروج</button>
        </header>
        <nav className="flex gap-8 mb-12 border-b border-white/5 flex-row-reverse overflow-x-auto whitespace-nowrap pb-1">
          <button onClick={() => setActiveTab('stats')} className={`pb-4 font-black transition-all ${activeTab === 'stats' ? 'admin-tab-active' : 'text-slate-500'}`}>الإحصائيات</button>
          <button onClick={() => setActiveTab('verification')} className={`pb-4 font-black transition-all ${activeTab === 'verification' ? 'admin-tab-active' : 'text-slate-500'}`}>التوثيق</button>
          <button onClick={() => setActiveTab('support')} className={`pb-4 font-black transition-all ${activeTab === 'support' ? 'admin-tab-active' : 'text-slate-500'}`}>الدعم الفني ({stats.openSupport})</button>
          <button onClick={() => setActiveTab('users')} className={`pb-4 font-black transition-all ${activeTab === 'users' ? 'admin-tab-active' : 'text-slate-500'}`}>المستخدمين</button>
          <button onClick={() => setActiveTab('ads')} className={`pb-4 font-black transition-all ${activeTab === 'ads' ? 'admin-tab-active' : 'text-slate-500'}`}>الإعلانات</button>
        </nav>
        
        {loading ? <div className="flex justify-center py-20"><div className="loading-spinner"></div></div> : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                  <p className="text-slate-400 font-bold mb-2">الحرفيين</p><p className="text-4xl font-black text-emerald-500">{stats.totalWorkers}</p>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                  <p className="text-slate-400 font-bold mb-2">الزبائن</p><p className="text-4xl font-black text-blue-500">{stats.totalSeekers}</p>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2rem] border border-yellow-500/10 shadow-2xl">
                  <p className="text-slate-400 font-bold mb-2">بانتظار التوثيق</p><p className="text-4xl font-black text-yellow-500">{stats.pendingVerifications}</p>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2rem] border border-red-500/10 shadow-2xl">
                  <p className="text-slate-400 font-bold mb-2">شكاوي مفتوحة</p><p className="text-4xl font-black text-red-500">{stats.openSupport}</p>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-right">
                  <thead className="bg-white/5 text-slate-400 text-xs">
                    <tr><th className="p-6">المستخدم</th><th className="p-6">الوصف</th><th className="p-6">الحالة</th><th className="p-6">التاريخ</th><th className="p-6 text-center">الإجراء</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map(s => (
                      <tr key={s.id} className={`hover:bg-white/5 transition-colors ${s.status === 'pending' ? 'bg-red-500/5' : ''}`}>
                        <td className="p-6">
                           <p className="font-black text-slate-200">{s.user_name}</p>
                           <p className="text-xs text-slate-500">{s.user_phone}</p>
                        </td>
                        <td className="p-6 max-w-xs"><p className="text-sm truncate">{s.description}</p></td>
                        <td className="p-6"><span className={`px-3 py-1 rounded-full text-[10px] font-black ${s.status === 'pending' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{s.status === 'pending' ? 'بانتظار المعالجة' : 'تم الحل'}</span></td>
                        <td className="p-6 text-slate-400 text-xs">{new Date(s.created_at).toLocaleDateString('ar-DZ')}</td>
                        <td className="p-6 text-center"><button onClick={() => setSelectedSupport(s)} className="text-emerald-500 font-bold">عرض المشكلة</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(activeTab === 'users' || activeTab === 'verification') && (
              <div className="bg-slate-900 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl overflow-x-auto">
                <table className="w-full text-right min-w-[600px]">
                  <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                    <tr><th className="p-6">المستخدم</th><th className="p-6">الدور</th><th className="p-6">الحالة</th><th className="p-6">الموقع</th><th className="p-6 text-center">خيارات</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {items.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedUser(u)}>
                        <td className="p-6 flex items-center gap-4 flex-row-reverse" onClick={(e) => e.stopPropagation()}>
                          <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.first_name}`} className="w-12 h-12 rounded-2xl border-2 border-slate-800" />
                          <div className="text-right"><p className="font-black text-slate-200">{u.first_name} {u.last_name}</p><p className="text-xs text-slate-500 font-mono">{u.phone}</p></div>
                        </td>
                        <td className="p-6"><span className={`px-3 py-1 rounded-full text-[10px] font-black ${u.role === UserRole.WORKER ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>{u.role === UserRole.WORKER ? 'حرفي' : 'زبون'}</span></td>
                        <td className="p-6"><span className={`px-3 py-1 rounded-full text-[10px] font-black ${u.is_verified ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{u.is_verified ? 'موثق ✅' : 'غير موثق ❌'}</span></td>
                        <td className="p-6 text-slate-400 text-sm">{u.wilaya}</td>
                        <td className="p-6 text-center"><button onClick={() => setSelectedUser(u)} className="text-emerald-500 font-bold ml-2">تفاصيل</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* مودال تفاصيل طلب الدعم */}
      {selectedSupport && (
        <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-slate-900 w-full max-w-2xl rounded-[3rem] p-8 md:p-12 border border-white/10 text-right shadow-2xl relative max-h-[90vh] overflow-y-auto">
             <button onClick={() => setSelectedSupport(null)} className="absolute top-8 left-8 text-slate-500 hover:text-white text-2xl">✕</button>
             <h2 className="text-2xl font-black mb-6">تفاصيل الشكوى ⚠️</h2>
             <div className="bg-white/5 p-6 rounded-3xl mb-6">
                <p className="text-slate-400 text-xs mb-2">من المستخدم:</p>
                <p className="font-black text-lg text-emerald-400">{selectedSupport.user_name} ({selectedSupport.user_phone})</p>
             </div>
             <div className="bg-white/5 p-6 rounded-3xl mb-6">
                <p className="text-slate-400 text-xs mb-2">وصف المشكلة:</p>
                <p className="text-slate-200 leading-relaxed font-medium">{selectedSupport.description}</p>
             </div>
             {selectedSupport.image_data && (
               <div className="mb-8">
                 <p className="text-slate-400 text-xs mb-2">الصورة المرفقة:</p>
                 <img src={selectedSupport.image_data} className="w-full rounded-3xl border border-white/10 shadow-2xl" />
               </div>
             )}
             <div className="flex gap-4">
                <button 
                  onClick={async () => {
                    await supabase.from('support_requests').update({ status: 'resolved' }).eq('id', selectedSupport.id);
                    setSelectedSupport(null);
                    fetchData();
                  }}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-emerald-500 transition-all"
                >تمت معالجة المشكلة ✅</button>
                <button 
                   onClick={async () => {
                     if(confirm("حذف الطلب؟")) {
                       await supabase.from('support_requests').delete().eq('id', selectedSupport.id);
                       setSelectedSupport(null);
                       fetchData();
                     }
                   }}
                   className="px-8 bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg"
                >حذف</button>
             </div>
           </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl">
          <div className="bg-slate-900 w-full max-w-2xl rounded-[3rem] p-8 md:p-12 border border-white/10 text-right shadow-2xl relative">
            <button onClick={() => setSelectedUser(null)} className="absolute top-8 left-8 text-slate-500 hover:text-white text-2xl transition-colors">✕</button>
            <div className="flex flex-col items-center mb-8">
              <img src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.first_name}`} className="w-32 h-32 rounded-[2.5rem] mb-4" />
              <h2 className="text-3xl font-black">{selectedUser.first_name} {selectedUser.last_name}</h2>
              <p className="text-emerald-500 font-bold">{selectedUser.category || 'مستخدم'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button onClick={async () => { await supabase.from('users').update({ is_verified: !selectedUser.is_verified }).eq('id', selectedUser.id); fetchData(); setSelectedUser(null); }} className={`py-4 rounded-2xl font-black ${selectedUser.is_verified ? 'bg-red-600/20 text-red-500' : 'bg-emerald-600 text-white'}`}>
                {selectedUser.is_verified ? 'إلغاء التوثيق' : 'توثيق الحساب الآن'}
              </button>
              <button onClick={async () => { if(confirm("حذف الحساب نهائياً؟")) { await supabase.from('users').delete().eq('id', selectedUser.id); fetchData(); setSelectedUser(null); } }} className="bg-red-600 py-4 rounded-2xl font-black text-white">حذف الحساب</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const getInitialUser = () => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  };

  const getInitialView = (user: User | null): AppState['view'] => {
    const hash = window.location.hash.replace('#/', '');
    if (hash === 'admin-portal') return 'admin-login';
    if (hash === 'support' && user) return 'support';
    if (hash === 'messages' && user) return 'messages';
    if (hash === 'search') return 'search';
    if (hash === 'login') return 'login';
    if (hash === 'register') return 'register';
    if (hash === 'profile' && user) return 'profile';
    if (hash === 'admin' && user?.role === UserRole.ADMIN) return 'admin';
    return user?.role === UserRole.ADMIN ? 'admin' : 'landing';
  };

  const [state, setState] = useState<AppState>(() => {
    const user = getInitialUser();
    return { currentUser: user, workers: [], view: getInitialView(user) };
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifList, setShowNotifList] = useState(false);
  const [chatTarget, setChatTarget] = useState<User | null>(null);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '');
      const user = getInitialUser();
      if (hash === 'support' && user) setState(prev => ({ ...prev, view: 'support', currentUser: user }));
      else if (hash === 'messages' && user) setState(prev => ({ ...prev, view: 'messages', currentUser: user }));
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

  const fetchNotifications = async () => {
    if (!state.currentUser) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', state.currentUser.id).order('created_at', { ascending: false });
    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.is_read).length || 0);
  };

  useEffect(() => {
    if (state.currentUser) {
      fetchNotifications();
      const sub = supabase.channel('notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${state.currentUser.id}` }, fetchNotifications)
        .subscribe();
      return () => { sub.unsubscribe(); };
    }
  }, [state.currentUser]);

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

  const startChat = (user: any) => {
    if (!state.currentUser) return setView('login');
    setChatTarget({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      location: { wilaya: user.wilaya, daira: user.daira },
      avatar: user.avatar
    });
    setView('messages');
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
              <button onClick={() => setView('landing')} className={`${state.view === 'landing' ? 'text-emerald-600 font-black' : (isManagementView ? 'text-slate-400' : 'text-slate-500')} font-bold`}>الرئيسية</button>
              <button onClick={() => setView('search')} className={`${state.view === 'search' ? 'text-emerald-600 font-black' : (isManagementView ? 'text-slate-400' : 'text-slate-500')} font-bold`}>الحرفيين</button>
              {state.currentUser && (
                <div className="flex items-center gap-4 relative">
                  <button onClick={() => setView('messages')} className={`${state.view === 'messages' ? 'text-emerald-600' : 'text-slate-500'} font-bold`}>الرسائل</button>
                  <button onClick={() => setView('support')} className={`${state.view === 'support' ? 'text-emerald-600 font-black' : 'text-slate-500'} font-bold`}>اتصل بنا</button>
                  <button onClick={() => setShowNotifList(!showNotifList)} className="relative text-slate-500 hover:text-emerald-600 transition-all">
                    🔔 {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">{unreadCount}</span>}
                  </button>
                  {showNotifList && (
                    <div className="absolute top-12 left-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <span className="font-black text-sm">الإشعارات</span>
                        <button onClick={async () => { await supabase.from('notifications').update({ is_read: true }).eq('user_id', state.currentUser!.id); fetchNotifications(); }} className="text-[10px] text-emerald-600 font-bold">تحديد كقروء</button>
                      </div>
                      <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.map(n => (
                          <div key={n.id} className={`p-4 border-b text-right hover:bg-gray-50 transition-all ${!n.is_read ? 'bg-emerald-50' : ''}`}>
                            <p className="font-black text-xs">{n.title}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{n.content}</p>
                            <p className="text-[8px] text-gray-400 mt-2">{new Date(n.created_at).toLocaleDateString('ar-DZ')}</p>
                          </div>
                        ))}
                        {notifications.length === 0 && <div className="p-10 text-center text-gray-400 font-bold">لا توجد إشعارات.</div>}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {!state.currentUser ? (
                <button onClick={() => setView('login')} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">دخول</button>
              ) : (
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('profile')}>
                  <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-10 h-10 rounded-xl border-2 border-emerald-500/20 shadow-sm" />
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
      <main className="flex-grow">
        {state.view === 'landing' && (
          <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
            <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${REQ_IMAGE})` }}></div>
            <div className="absolute inset-0 hero-bg-overlay"></div>
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 w-full text-center">
              <Logo size="lg" inverse />
              <h1 className="text-4xl md:text-8xl font-black text-white mt-10">ريح بالك، <span className="text-emerald-400">سَلّكني</span> يسلكها</h1>
              <p className="text-xl md:text-3xl text-slate-300 mt-6 font-medium">المنصة الجزائرية رقم #1 لربط الحرفيين بالزبائن.</p>
              <div className="flex gap-6 mt-16 justify-center">
                <button onClick={() => setView('search')} className="bg-emerald-600 px-16 py-5 rounded-[2.5rem] font-black text-xl text-white shadow-xl">ابحث عن حرفي 🔍</button>
                <button onClick={() => setView('register')} className="bg-white/10 backdrop-blur-md px-16 py-5 rounded-[2.5rem] font-black text-xl text-white border border-white/20">سجل كحرفي 🛠️</button>
              </div>
            </div>
          </div>
        )}
        {state.view === 'search' && (
          <div className="max-w-7xl mx-auto px-6 py-12 text-right">
            <div className="bg-emerald-900/5 p-12 rounded-[3rem] mb-12 border border-emerald-100 shadow-sm">
              <h2 className="text-3xl font-black mb-8">ابحث عن الحرفي المثالي 🔍</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder="عن ماذا تبحث؟" className="md:col-span-2 p-5 bg-white border-2 border-emerald-50 rounded-2xl outline-none" />
                <select className="p-5 bg-white border-2 border-emerald-50 rounded-2xl outline-none">
                  <option value="">كل الولايات</option>
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <select className="p-5 bg-white border-2 border-emerald-50 rounded-2xl outline-none">
                  <option value="">كل التخصصات</option>
                  {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 group hover:-translate-y-1 transition-all">
                  <div className="flex gap-4 items-center mb-6 flex-row-reverse">
                    <img src={`https://ui-avatars.com/api/?name=Worker${i}`} className="w-16 h-16 rounded-xl border-2 border-emerald-50" />
                    <div className="text-right flex-1">
                      <h3 className="text-lg font-black">حرفي متخصص {i}</h3>
                      <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">كهرباء</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-6 flex-1">خبرة تزيد عن 10 سنوات في تقديم أفضل الخدمات وبجودة عالية.</p>
                  <div className="flex justify-between items-center flex-row-reverse pt-4 border-t border-gray-50">
                    <span className="text-gray-500 font-bold text-xs">📍 الجزائر العاصمة</span>
                    <button onClick={() => startChat({ id: `worker-${i}`, first_name: 'حرفي', last_name: i.toString() })} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-emerald-600 transition-all">تواصل الآن</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {state.view === 'messages' && state.currentUser && <ChatView currentUser={state.currentUser} targetUser={chatTarget} />}
        {state.view === 'support' && state.currentUser && <SupportView currentUser={state.currentUser} />}
        {state.view === 'login' && <AuthForm type="login" onSuccess={handleLoginSuccess} />}
        {state.view === 'register' && <AuthForm type="register" onSuccess={handleLoginSuccess} />}
        {state.view === 'admin-login' && <AuthForm type="admin" onSuccess={handleLoginSuccess} />}
        {state.view === 'admin' && state.currentUser?.role === UserRole.ADMIN && <AdminDashboard onExit={handleLogout} />}
        {state.view === 'profile' && state.currentUser && (
          <div className="max-w-4xl mx-auto my-12 md:my-20 px-6">
            <div className="bg-white p-8 md:p-16 rounded-[3rem] shadow-2xl text-center border border-gray-100">
              <div className="relative inline-block mb-8">
                <img src={state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`} className="w-32 h-32 md:w-40 md:h-40 rounded-[3rem] border-4 border-emerald-50 shadow-xl" />
                {state.currentUser.isVerified && <span className="absolute bottom-2 right-2 bg-emerald-500 text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-xl">✓</span>}
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-4">أهلاً بك، {state.currentUser.firstName} ✨</h2>
              <p className="text-slate-500 text-lg md:text-xl mb-12 font-medium">أنت مسجل كـ <span className="text-emerald-600 font-black">{state.currentUser.role === UserRole.WORKER ? 'حرفي محترف' : 'زبون'}</span> في ولاية {state.currentUser.location.wilaya}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-600 transition-all">تعديل الملف ⚙️</button>
                <button onClick={handleLogout} className="bg-red-50 text-red-500 px-12 py-4 rounded-2xl font-black text-lg border border-red-100 hover:bg-red-500 hover:text-white transition-all">تسجيل الخروج</button>
              </div>
            </div>
          </div>
        )}
      </main>
      {!isManagementView && (
        <footer className="bg-slate-900 text-white py-16 px-6 text-center mt-auto border-t border-white/5">
          <Logo size="lg" inverse />
          <p className="mt-4 text-slate-500 font-bold">سلكني - منصتكم الموثوقة للحرف والمهن 🇩🇿</p>
          <div className="border-t border-white/5 mt-16 pt-10 text-slate-500 text-sm font-bold tracking-wide">جميع الحقوق محفوظة &copy; {new Date().getFullYear()} سلكني</div>
        </footer>
      )}
    </div>
  );
}

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
        const { data } = await supabase.from('users').select('*').eq('phone', formData.phone).eq('password', formData.password).single();
        if (data) onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: data.daira }, isVerified: data.is_verified });
        else alert("خطأ في تسجيل الدخول");
      } else {
        const { data } = await supabase.from('users').insert([{ first_name: formData.firstName, last_name: formData.lastName, phone: formData.phone, password: formData.password, role: formData.role, wilaya: formData.wilaya, is_verified: formData.role === UserRole.SEEKER }]).select().single();
        if (data) onSuccess({ ...data, firstName: data.first_name, lastName: data.last_name, location: { wilaya: data.wilaya, daira: data.daira }, isVerified: data.is_verified });
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl w-full max-w-md text-right border border-gray-100">
        <h2 className="text-3xl font-black mb-8 text-slate-900">{type === 'admin' ? 'دخول الإدارة 🔒' : type === 'login' ? 'مرحباً بعودتك 👋' : 'انضم إلى سلكني ✨'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="الاسم" required className="p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              <input placeholder="اللقب" required className="p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          )}
          <input placeholder="رقم الهاتف" required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-mono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input type="password" placeholder="كلمة المرور" required className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          {type === 'register' && (
            <>
              <select className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                <option value={UserRole.SEEKER}>أبحث عن حرفي</option>
                <option value={UserRole.WORKER}>أنا حرفي</option>
              </select>
              <select className="w-full p-4 bg-gray-50 border rounded-2xl outline-none" value={formData.wilaya} onChange={e => setFormData({...formData, wilaya: e.target.value})}>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </>
          )}
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-500 transition-all shadow-lg">{loading ? 'جاري التحقق...' : 'دخول'}</button>
        </form>
      </div>
    </div>
  );
};
