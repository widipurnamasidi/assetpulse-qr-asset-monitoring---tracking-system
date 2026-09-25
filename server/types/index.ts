export type AssetStatus = 'available' | 'checked_out' | 'under_maintenance' | 'in_audit' | 'retired';

export type AssetCondition = 'excellent' | 'good' | 'fair' | 'needs_repair' | 'damaged';

export type AuditAction = 
  | 'created' 
  | 'checkout' 
  | 'checkin' 
  | 'field_audit' 
  | 'maintenance_scheduled' 
  | 'maintenance_completed' 
  | 'status_override'
  | 'retired';

export type UserRole = 'admin' | 'technician' | 'manager' | 'auditor';

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  passwordHash: string;
  isTwoFactorEnabled: boolean;
  twoFactorSecret?: string;
  pendingOtp?: string;
  otpExpiresAt?: number;
  resetToken?: string;
  resetExpiresAt?: number;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface IAssetCustody {
  userId: string;
  name: string;
  email: string;
  department: string;
  checkoutDate: string;
  expectedReturnDate: string;
  purpose: string;
  projectCode?: string;
}

export interface IAsset {
  id: string;
  assetTag: string; // e.g. "AST-84920"
  name: string;
  category: string; // e.g. "Laptops", "Field Sensors", "Power Tools", "Survey Instruments", "Vehicles"
  serialNumber: string;
  modelNumber: string;
  manufacturer: string;
  status: AssetStatus;
  condition: AssetCondition;
  location: string; // e.g. "Warehouse B - Rack 04", "Field Site Alpha", "HQ - Room 302"
  department: string;
  purchaseDate: string;
  purchaseCost: number;
  currentCustody: IAssetCustody | null;
  lastAuditedAt?: string;
  lastAuditedBy?: string;
  qrCodeDataUrl: string;
  specifications: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAuditLog {
  id: string;
  timestamp: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  action: AuditAction;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  details: Record<string, any>;
  previousState?: Partial<IAsset>;
  newState: Partial<IAsset>;
  previousHash: string;
  hash: string; // Cryptographic SHA-256 hash ensuring append-only immutability
  locationCoordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
}

export interface ISmtpDeliveryLog {
  id: string;
  to: string;
  subject: string;
  otpCode: string;
  type: '2FA_VERIFICATION' | 'PASSWORD_RESET';
  sentAt: string;
  status: 'delivered' | 'simulated';
  previewUrl?: string;
  bodySnippet: string;
}
