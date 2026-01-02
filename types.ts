
export const UserRole = {
  WORKER: 'WORKER',
  SEEKER: 'SEEKER',
  ADMIN: 'ADMIN'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

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
  categories?: string[]; 
  skills?: string[];
  verificationStatus?: VerificationStatus;
  idFront?: string;
  idBack?: string;
  portfolio?: string[];
  createdAt?: string;
  rating?: number;
  ratingCount?: number;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface AppState {
  currentUser: User | null;
  workers: Worker[];
  view: 'landing' | 'register' | 'login' | 'dashboard' | 'search' | 'profile' | 'edit-profile' | 'messages' | 'support' | 'admin-panel';
}

export interface Worker extends User {
  categories: string[];
  bio: string;
  skills: string[];
  rating: number;
  ratingCount: number;
  completedJobs: number;
  portfolio: string[];
}
