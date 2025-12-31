
import { supabase } from './supabase.js';
import { WILAYAS, DAIRAS, SERVICE_CATEGORIES } from './constants.js';

// --- التطبيق الأساسي (State) ---
let state = {
  view: 'landing',
  currentUser: JSON.parse(localStorage.getItem('user')) || null,
  workers: [],
  loading: false,
  filters: { query: '', wilaya: '', category: '' }
};

const appElement = document.getElementById('app');

// --- المكونات (Components) ---
const Logo = (size = 'sm') => `
  <div class="flex items-center gap-3 group cursor-pointer transition-all duration-500 ${size === 'lg' ? 'scale-110 md:scale-125' : ''}" onclick="navigateTo('landing')">
    <div class="relative ${size === 'lg' ? 'w-24 h-24' : 'w-12 h-12'} flex-shrink-0">
      <div class="absolute inset-0 bg-gradient-to-tr from-emerald-600 via-teal-500 to-yellow-400 ${size === 'lg' ? 'rounded-[2.5rem]' : 'rounded-2xl'} rotate-3 group-hover:rotate-12 transition-transform duration-500 shadow-xl overflow-hidden">
        <div class="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
      </div>
      <div class="absolute inset-0 flex items-center justify-center text-white font-black ${size === 'lg' ? 'text-5xl' : 'text-2xl'} z-10 group-hover:scale-110 transition-transform">S</div>
    </div>
    <div class="flex flex-col items-start leading-none gap-0.5">
      <div class="flex items-baseline gap-1.5">
        <span class="${size === 'lg' ? 'text-6xl md:text-8xl' : 'text-3xl'} font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-700">Salakni</span>
        <span class="${size === 'lg' ? 'text-4xl' : 'text-xl'} arabic-text font-black text-yellow-500">سلكني</span>
      </div>
    </div>
  </div>
`;

const Navbar = () => `
  <nav class="sticky top-0 z-50 bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100 h-24 flex items-center">
    <div class="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
      <div>${Logo()}</div>
      <div class="hidden md:flex items-center gap-10">
        <button onclick="navigateTo('landing')" class="${state.view === 'landing' ? 'text-emerald-600 font-black' : 'text-gray-600'} hover:text-emerald-500 transition font-bold text-lg">الرئيسية</button>
        <button onclick="navigateTo('search')" class="${state.view === 'search' ? 'text-emerald-600 font-black' : 'text-gray-600'} hover:text-emerald-500 transition font-bold text-lg">تصفح الحرفيين</button>
        ${!state.currentUser ? `
          <div class="flex items-center gap-4">
            <button onclick="navigateTo('login')" class="text-gray-600 hover:text-emerald-500 font-black text-lg">دخول</button>
            <button onclick="navigateTo('register')" class="bg-emerald-600 text-white px-10 py-3.5 rounded-2xl font-black shadow-lg hover:bg-emerald-500 active:scale-95 transition-all">انضم إلينا</button>
          </div>
        ` : `
          <div class="flex items-center gap-4 bg-gray-50 p-2 pr-5 rounded-3xl border border-gray-100 cursor-pointer hover:bg-white transition-all shadow-sm" onclick="navigateTo('profile')">
            <div class="flex flex-col items-start leading-tight">
              <span class="text-base font-black text-gray-800">${state.currentUser.firstName}</span>
              <span class="text-[10px] text-emerald-600 font-black uppercase">حسابي</span>
            </div>
            <img src="${state.currentUser.avatar || `https://ui-avatars.com/api/?name=${state.currentUser.firstName}`}" class="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md" />
          </div>
        `}
      </div>
    </div>
  </nav>
`;

const LandingHero = () => `
  <div class="relative min-h-[95vh] flex items-center justify-center text-white text-center p-6 overflow-hidden">
    <div class="absolute inset-0 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1621905252507-b354bcadcabc?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
    <div class="absolute inset-0 bg-gradient-to-tr from-gray-900 via-emerald-950/70 to-teal-900/80"></div>
    <div class="relative z-10 max-w-5xl">
      <div class="mb-12 animate-float inline-block">${Logo('lg')}</div>
      <h1 class="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-tight">ريح بالك، <span class="text-emerald-400">سَلّكني</span> يسلكها</h1>
      <p class="text-xl md:text-3xl text-slate-300 mb-16 font-medium max-w-3xl mx-auto">المنصة الجزائرية رقم #1 لربط الحرفيين المهرة بالزبائن بكل ثقة وأمان.</p>
      <div class="flex flex-col sm:flex-row gap-8 justify-center items-center">
        <button onclick="navigateTo('search')" class="bg-emerald-600 px-16 py-6 rounded-[2.5rem] font-black text-2xl hover:bg-emerald-500 transition-all shadow-xl active:scale-95">اطلب خدمة الآن 🔍</button>
        <button onclick="navigateTo('register')" class="bg-white/10 backdrop-blur-md px-16 py-6 rounded-[2.5rem] font-black text-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-95">سجل كحرفي 🛠️</button>
      </div>
    </div>
  </div>
`;

const SearchPage = () => `
  <div class="max-w-7xl mx-auto px-6 py-12 text-right">
    <div class="bg-emerald-900/5 p-12 rounded-[4rem] mb-16 border border-emerald-100 shadow-sm">
      <h2 class="text-4xl font-black mb-8">ابحث عن الحرفي المثالي 🔍</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <input type="text" id="search-query" placeholder="عن ماذا تبحث؟" class="md:col-span-2 p-5 bg-white border-2 border-emerald-50 rounded-3xl outline-none focus:border-emerald-500 font-bold" value="${state.filters.query}">
        <select id="search-wilaya" class="p-5 bg-white border-2 border-emerald-50 rounded-3xl outline-none focus:border-emerald-500 font-bold">
          <option value="">كل الولايات</option>
          ${WILAYAS.map(w => `<option value="${w}" ${state.filters.wilaya === w ? 'selected' : ''}>${w}</option>`).join('')}
        </select>
        <select id="search-category" class="p-5 bg-white border-2 border-emerald-50 rounded-3xl outline-none focus:border-emerald-500 font-bold">
          <option value="">كل التخصصات</option>
          ${SERVICE_CATEGORIES.map(c => `<option value="${c.name}" ${state.filters.category === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <button onclick="handleSearch()" class="mt-8 bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:bg-emerald-700">بحث</button>
    </div>
    <div id="workers-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      ${state.loading ? `<div class="col-span-full py-40 flex justify-center"><div class="loading-spinner"></div></div>` : renderWorkerCards()}
    </div>
  </div>
`;

const renderWorkerCards = () => {
  if (state.workers.length === 0) return `<p class="col-span-full text-center text-gray-400 py-20 text-xl font-bold">لا يوجد نتائج حالياً.</p>`;
  return state.workers.map(w => `
    <div class="bg-white p-10 rounded-[3.5rem] shadow-xl border border-gray-100 group hover:-translate-y-2 transition-all">
      <div class="flex gap-6 items-center mb-8 flex-row-reverse">
        <img src="${w.avatar || `https://ui-avatars.com/api/?name=${w.first_name}`}" class="w-20 h-20 rounded-3xl object-cover shadow-lg border-2 border-emerald-50">
        <div class="text-right flex-1">
          <h3 class="text-xl font-black">${w.first_name} ${w.last_name}</h3>
          <span class="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full">${w.category}</span>
        </div>
      </div>
      <p class="text-gray-600 line-clamp-3 mb-8 font-medium">${w.bio || 'لا يوجد وصف.'}</p>
      <div class="flex justify-between items-center flex-row-reverse">
        <span class="text-gray-500 font-bold">📍 ${w.wilaya}</span>
        <button class="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-sm">تواصل</button>
      </div>
    </div>
  `).join('');
};

// --- الملاحة وإدارة الحالة ---
window.navigateTo = (view) => {
  state.view = view;
  window.scrollTo(0, 0);
  render();
};

window.handleSearch = async () => {
  const queryInput = document.getElementById('search-query');
  const wilayaInput = document.getElementById('search-wilaya');
  const categoryInput = document.getElementById('search-category');
  
  if (!queryInput || !wilayaInput || !categoryInput) return;

  state.filters = { 
    query: queryInput.value, 
    wilaya: wilayaInput.value, 
    category: categoryInput.value 
  };
  
  state.loading = true;
  render();

  try {
    // We remove the explicit is_verified filter from the Supabase query to prevent crashing 
    // if the column doesn't exist. Instead, we filter in JS memory after the fetch.
    let baseQuery = supabase.from('users').select('*').eq('role', 'WORKER');
    
    if (state.filters.wilaya) baseQuery = baseQuery.eq('wilaya', state.filters.wilaya);
    if (state.filters.category) baseQuery = baseQuery.eq('category', state.filters.category);
    if (state.filters.query) baseQuery = baseQuery.or(`first_name.ilike.%${state.filters.query}%,bio.ilike.%${state.filters.query}%`);

    const { data, error } = await baseQuery;
    
    if (error) {
      console.error("Search failed:", error);
      state.workers = [];
    } else {
      // Gracefully handle missing column in client-side filtering
      state.workers = (data || []).filter(w => {
        // If the column is missing from the record, we assume it's true or just show it 
        // to avoid hiding everyone when the column is missing.
        return w.is_verified === undefined || w.is_verified !== false;
      });
    }
  } catch (e) {
    console.error(e);
  } finally {
    state.loading = false;
    render();
  }
};

const render = () => {
  let content = Navbar();
  
  switch(state.view) {
    case 'landing': content += LandingHero(); break;
    case 'search': content += SearchPage(); break;
    case 'login': content += `<div class="max-w-md mx-auto my-20 p-10 bg-white rounded-3xl shadow-xl text-center">دخول قريباً...</div>`; break;
    case 'register': content += `<div class="max-w-md mx-auto my-20 p-10 bg-white rounded-3xl shadow-xl text-center">تسجيل قريباً...</div>`; break;
    default: content += LandingHero();
  }

  appElement.innerHTML = content + `<footer class="bg-slate-900 text-white py-10 text-center mt-20">جميع الحقوق محفوظة &copy; سلكني</footer>`;
};

// تشغيل التطبيق لأول مرة
render();
if (state.view === 'search') handleSearch();
