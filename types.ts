
export const UserRole = {
  WORKER: 'WORKER',
  SEEKER: 'SEEKER',
  ADMIN: 'ADMIN'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

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
  completedJobs?: number;
}

export interface Task {
  id: string;
  seeker_id: string;
  title: string;
  description: string;
  category: string;
  wilaya: string;
  budget: number;
  status: TaskStatus;
  created_at: string;
  seeker_name?: string;
  seeker_avatar?: string;
}

export interface AppState {
  currentUser: User | null;
  workers: User[];
  view: 'landing' | 'register' | 'login' | 'dashboard' | 'search' | 'profile' | 'edit-profile' | 'messages' | 'support' | 'admin-panel';
}
