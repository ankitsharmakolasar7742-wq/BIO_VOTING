import { Party, Voter, AuditLog, ElectionSettings } from '../types';

export const ELECTION_SEAL_URL = '/src/assets/images/election_commission_seal_1791695957499.jpg';

export const INITIAL_PARTIES: Party[] = [
  {
    id: 'party-1',
    name: 'Progressive Tech Alliance',
    shortCode: 'PTA',
    candidateName: 'Dr. Elena Vance',
    candidatePhoto: '/src/assets/images/candidate_elena_vance_1791695969106.jpg',
    symbolIcon: 'Cpu',
    symbolDescription: 'Neural Circuit Torch',
    color: '#3b82f6', // Blue
    manifesto: 'Digital transparency in governance, sovereign clean energy grid, and AI democratization.',
    voteCount: 142,
  },
  {
    id: 'party-2',
    name: 'National Civic Coalition',
    shortCode: 'NCC',
    candidateName: 'Marcus Sterling',
    candidatePhoto: '/src/assets/images/candidate_marcus_sterling_1791695982112.jpg',
    symbolIcon: 'ShieldCheck',
    symbolDescription: 'Civic Liberty Shield',
    color: '#6366f1', // Indigo
    manifesto: 'Strengthening judicial independence, community infrastructure bonds, and universal healthcare.',
    voteCount: 189,
  },
  {
    id: 'party-3',
    name: 'Future Green Initiative',
    shortCode: 'FGI',
    candidateName: 'Maya Patel',
    candidatePhoto: '/src/assets/images/candidate_maya_patel_1791695994333.jpg',
    symbolIcon: 'Leaf',
    symbolDescription: 'Banyan Sprout of Renewal',
    color: '#10b981', // Emerald Green
    manifesto: 'Zero-carbon municipal transit by 2030, sustainable agriculture subsidies, and conservation.',
    voteCount: 115,
  },
  {
    id: 'party-4',
    name: 'United Workers Front',
    shortCode: 'UWF',
    candidateName: 'David K. O’Connor',
    candidatePhoto: '',
    symbolIcon: 'Flame',
    symbolDescription: 'Torch of Labor Unity',
    color: '#f59e0b', // Amber
    manifesto: 'Fair wages indexation, workplace safety reforms, and accessible vocational education.',
    voteCount: 94,
  },
];

export const INITIAL_VOTERS: Voter[] = [
  {
    id: 'voter-demo-1',
    fullName: 'Rahul S. Verma',
    username: 'rahulverma',
    password: 'password123',
    mobile: '+91 98765 43210',
    voterId: 'VOT-882941-X',
    isOtpVerified: true,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    hasVoted: false,
    registeredAt: '2026-10-01T10:14:00Z',
  },
  {
    id: 'voter-demo-2',
    fullName: 'Ananya Deshmukh',
    username: 'ananya_d',
    password: 'password123',
    mobile: '+91 98123 45678',
    voterId: 'VOT-773192-A',
    isOtpVerified: true,
    profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    hasVoted: true,
    votedPartyId: 'party-2',
    votedAt: '2026-10-10T14:22:00Z',
    ballotReceiptId: 'REC-NCC-7731-92A',
    registeredAt: '2026-09-28T09:00:00Z',
  },
];

const STORAGE_KEYS = {
  PARTIES: 'bio_voting_parties',
  VOTERS: 'bio_voting_voters',
  CURRENT_USER: 'bio_voting_current_user',
  ADMIN_SESSION: 'bio_voting_admin_logged_in',
  AUDIT_LOGS: 'bio_voting_audit_logs',
  SETTINGS: 'bio_voting_settings',
};

export const getStoredParties = (): Party[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(INITIAL_PARTIES));
      return INITIAL_PARTIES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_PARTIES;
  }
};

export const saveParties = (parties: Party[]): void => {
  localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(parties));
};

export const getStoredVoters = (): Voter[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOTERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(INITIAL_VOTERS));
      return INITIAL_VOTERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_VOTERS;
  }
};

export const saveVoters = (voters: Voter[]): void => {
  localStorage.setItem(STORAGE_KEYS.VOTERS, JSON.stringify(voters));
};

export const getCurrentVoter = (): Voter | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const setCurrentVoter = (voter: Voter | null): void => {
  if (!voter) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } else {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(voter));
  }
};

export const getAdminSession = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
};

export const setAdminSession = (loggedIn: boolean): void => {
  if (loggedIn) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  }
};

export const getAuditLogs = (): AuditLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      const initialLogs: AuditLog[] = [
        {
          id: 'log-1',
          timestamp: new Date().toISOString(),
          action: 'ELECTION_SYSTEM_INITIALIZED',
          details: 'Biometric verification engine calibrated and ready.',
          actor: 'System Overseer',
          status: 'info',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
      return initialLogs;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

export const logAuditEvent = (event: Omit<AuditLog, 'id' | 'timestamp'>): void => {
  const current = getAuditLogs();
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([newLog, ...current].slice(0, 100)));
};

export const getElectionSettings = (): ElectionSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      const defaultSettings: ElectionSettings = {
        electionName: '2026 National Parliamentary General Election',
        electionYear: '2026',
        isActive: true,
        allowRevoting: false,
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
      return defaultSettings;
    }
    return JSON.parse(raw);
  } catch {
    return {
      electionName: '2026 National Parliamentary General Election',
      electionYear: '2026',
      isActive: true,
      allowRevoting: false,
    };
  }
};

export const saveElectionSettings = (settings: ElectionSettings): void => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};
