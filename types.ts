
export const UserRole = {
  WORKER: 'WORKER',
  SEEKER: 'SEEKER',
  ADMIN: 'ADMIN'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface Location {
  wilaya: string;
  daira: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  location: Location;
  avatar?: string;
  bio?: string;
  category?: string;
  skills?: string[];
  idFront?: string; // رابط صورة بطاقة التعريف (الوجه)
  idBack?: string;  // رابط صورة بطاقة التعريف (الظهر)
  isVerified?: boolean;
  portfolio?: string[];
  createdAt?: string;
}

export interface Advertisement {
  id: string;
  placement: 'hero_bottom' | 'search_top' | 'search_sidebar' | 'footer_top';
  html_content: string;
  is_active: boolean;
}

export interface AppState {
  currentUser: User | null;
  workers: Worker[];
  view: 'landing' | 'register' | 'login' | 'dashboard' | 'search' | 'profile' | 'admin' | 'edit-profile' | 'admin-login';
}

export interface Worker extends User {
  category: string;
  bio: string;
  skills: string[];
  rating: number;
  completedJobs: number;
}
