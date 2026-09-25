import { IAsset, IAuditLog, IUser, ISmtpDeliveryLog } from '../types/index.js';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('assetpulse_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Auth endpoints
  auth: {
    async login(email: string, password: string) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return res.json();
    },

    async verify2FA(userId: string, otp: string) {
      const res = await fetch(`${API_BASE}/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
      });
      return res.json();
    },

    async resendOtp(userId: string) {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      return res.json();
    },

    async forgotPassword(email: string) {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return res.json();
    },

    async resetPassword(userId: string, otp: string, newPassword: string) {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp, newPassword }),
      });
      return res.json();
    },

    async getMe() {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      return res.json();
    },

    async getSmtpLogs() {
      const res = await fetch(`${API_BASE}/auth/smtp-logs`);
      return res.json();
    },

    async getTechnicians() {
      const res = await fetch(`${API_BASE}/auth/technicians`);
      return res.json();
    },
  },

  // Asset endpoints
  assets: {
    async list(params: {
      status?: string;
      category?: string;
      condition?: string;
      search?: string;
      location?: string;
    } = {}) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v && v !== 'all') query.append(k, v);
      });

      const res = await fetch(`${API_BASE}/assets?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      return res.json();
    },

    async get(assetId: string) {
      const res = await fetch(`${API_BASE}/assets/${assetId}`, {
        headers: getAuthHeaders(),
      });
      return res.json();
    },

    async scanTag(assetTag: string) {
      const res = await fetch(`${API_BASE}/assets/tag/${encodeURIComponent(assetTag)}`, {
        headers: getAuthHeaders(),
      });
      return res.json();
    },

    async create(assetData: any) {
      const res = await fetch(`${API_BASE}/assets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assetData),
      });
      return res.json();
    },

    async checkout(assetId: string, checkoutData: {
      borrowerId?: string;
      borrowerName: string;
      borrowerEmail?: string;
      borrowerDepartment?: string;
      expectedReturnDate: string;
      purpose?: string;
      projectCode?: string;
      destinationLocation?: string;
    }) {
      const res = await fetch(`${API_BASE}/assets/${assetId}/checkout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(checkoutData),
      });
      return res.json();
    },

    async checkin(assetId: string, checkinData: {
      returnLocation?: string;
      condition: string;
      inspectionNotes?: string;
      requiresMaintenance?: boolean;
    }) {
      const res = await fetch(`${API_BASE}/assets/${assetId}/checkin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(checkinData),
      });
      return res.json();
    },

    async fieldAudit(assetId: string, auditData: {
      verifiedLocation: string;
      condition: string;
      auditNotes: string;
      latitude?: number;
      longitude?: number;
      accuracy?: number;
    }) {
      const res = await fetch(`${API_BASE}/assets/${assetId}/field-audit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(auditData),
      });
      return res.json();
    },
  },

  // Audit endpoints
  audit: {
    async list(params: {
      assetTag?: string;
      action?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    } = {}) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v && v !== 'all') query.append(k, v);
      });

      const res = await fetch(`${API_BASE}/audit?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      return res.json();
    },

    async verify() {
      const res = await fetch(`${API_BASE}/audit/verify`, {
        headers: getAuthHeaders(),
      });
      return res.json();
    },

    async get(logId: string) {
      const res = await fetch(`${API_BASE}/audit/${logId}`, {
        headers: getAuthHeaders(),
      });
      return res.json();
    },
  },

  // Exports
  export: {
    getAuditExcelUrl(params: Record<string, string> = {}) {
      const query = new URLSearchParams(params);
      return `${API_BASE}/export/audit/excel?${query.toString()}`;
    },
    getAssetsExcelUrl() {
      return `${API_BASE}/export/assets/excel`;
    },
  },
};
