
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
  idFront?: string;
  idBack?: string;
  isVerified?: boolean;
}

export interface Review {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Worker extends User {
  category: string;
  bio: string;
  skills: string[];
  rating: number;
  completedJobs: number;
  reviews?: Review[];
}

export interface Advertisement {
  id: string;
  location: 'hero_bottom' | 'search_sidebar' | 'search_top' | 'footer_top';
  content: string;
  is_active: boolean;
}

export interface AppState {
  currentUser: User | null;
  workers: Worker[];
  view: 'landing' | 'register' | 'login' | 'dashboard' | 'search' | 'profile' | 'admin';
}
