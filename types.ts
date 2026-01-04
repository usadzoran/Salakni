
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
  categories: string[]; 
  skills: string[];
  verificationStatus: VerificationStatus;
  idFront?: string;
  idBack?: string;
  portfolio: string[];
  createdAt?: string;
  rating: number;
  ratingCount: number;
  completedJobs: number;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface Chat {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message?: string;
  updated_at: string;
  other_participant?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'message' | 'task' | 'system';
  is_read: boolean;
  created_at: string;
  link?: string;
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
  seeker_phone?: string;
}

export interface Advertisement {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  placements: string[]; // e.g., ['landing_top', 'search_sidebar', 'market_banner']
  is_active: boolean;
  created_at: string;
}

export interface AppState {
  currentUser: User | null;
  workers: User[];
  view: 'landing' | 'register' | 'login' | 'dashboard' | 'search' | 'profile' | 'edit-profile' | 'support' | 'admin-panel' | 'chats';
}
