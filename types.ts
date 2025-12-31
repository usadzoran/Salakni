
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
  idFront?: string;
  idBack?: string;
  isVerified?: boolean;
  portfolio?: string[];
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

export interface AppState {
  currentUser: User | null;
  workers: Worker[];
  view: 'landing' | 'register' | 'login' | 'dashboard' | 'search' | 'profile' | 'admin' | 'edit-profile' | 'admin-login';
}
