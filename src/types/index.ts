export interface Voter {
  id: string;
  fullName: string;
  username: string;
  password: string;
  mobile: string;
  voterId: string;
  isOtpVerified: boolean;
  profilePhotoUrl: string; // Base64 or image URL
  hasVoted: boolean;
  votedPartyId?: string;
  votedAt?: string;
  ballotReceiptId?: string;
  registeredAt: string;
}

export interface Party {
  id: string;
  name: string;
  shortCode: string;
  candidateName: string;
  candidatePhoto: string;
  symbolIcon: string; // Icon name or SVG/emoji
  symbolDescription: string;
  color: string;
  manifesto: string;
  voteCount: number;
}

export type LivenessTaskType = 'center' | 'blink' | 'turn_left' | 'turn_right' | 'smile' | 'nod';

export interface LivenessTask {
  id: LivenessTaskType;
  title: string;
  instruction: string;
  hint: string;
  completed: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  actor: string;
  status: 'success' | 'warning' | 'info' | 'error';
}

export interface ElectionSettings {
  electionName: string;
  electionYear: string;
  isActive: boolean;
  allowRevoting: boolean;
}
