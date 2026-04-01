export interface User {
  _id: string;
  name: string;
  studentId: string;
  department: 'DIS' | 'DCS';
  yearLevel: 1 | 2 | 3 | 4;
  email: string;
  role: 'admin' | 'voter';
  hasVoted: boolean;
  createdAt?: string;
  updatedAt?: string;
  votedElections: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  studentId: string;
  password?: string;
}

export interface Election {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}


export interface Voter {
  _id: string;
  studentId: string;
  name: string;
  department: "DIS" | "DCS" | "ALL";
  yearLevel: number;
  email: string;
  hasVoted: boolean;
}

export interface Election {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Candidate {
  _id: string;
  name: string;
  partylist: string;
  department: "DIS" | "DCS" | "ALL";
  yearLevel: number | null;
  position: { _id: string; name: string };
  election: { _id: string; title: string };
  profilePicture?: string;
}