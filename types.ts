
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
  createdAt?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'message' | 'system' | 'verification' | 'support';
  created_at: string;
  is_read: boolean;
}

export interface SupportRequest {
  id: string;
  user_id: string;
  description: string;
  image_data?: string;
  status: 'pending' | 'resolved';
  created_at: string;
  user_name?: string;
  user_phone?: string;
}

export interface Advertisement {
  id: string;
  title?: string;
  placement: 'hero_bottom' | 'search_top' | 'search_sidebar' | 'footer_top';
  html_content: string;
  is_active: boolean;
}

export interface AppState {
  currentUser: User | null;
  workers: Worker[];
  view: 'landing' | 'register' | 'login' | 'dashboard' | 'search' | 'profile' | 'admin' | 'edit-profile' | 'admin-login' | 'messages' | 'notifications' | 'support';
}

export interface Worker extends User {
  category: string;
  bio: string;
  skills: string[];
  rating: number;
  completedJobs: number;
}
