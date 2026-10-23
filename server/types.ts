/**
 * EcoMind AI — Enterprise Sustainability & ESG Platform
 * Type Definitions & Data Contracts
 */

export type UserRole = 'admin' | 'sustainability_manager' | 'auditor' | 'facility_operator';

export type ScopeType = 'scope_1' | 'scope_2' | 'scope_3';

export type EmissionCategory =
  // Scope 1: Direct emissions
  | 'stationary_combustion'
  | 'mobile_combustion'
  | 'process_emissions'
  | 'fugitive_emissions'
  // Scope 2: Indirect emissions (energy)
  | 'purchased_electricity_location'
  | 'purchased_electricity_market'
  | 'steam_heating'
  | 'district_cooling'
  // Scope 3: Value chain
  | 'business_travel'
  | 'employee_commuting'
  | 'upstream_transport'
  | 'waste_generated'
  | 'purchased_goods';

export type WasteType = 'hazardous' | 'non_hazardous' | 'e_waste' | 'compost' | 'recycled';

export type WasteDisposalMethod = 'landfill' | 'incineration' | 'recycled' | 'composted' | 'diverted';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'todo' | 'in_progress' | 'under_review' | 'completed';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry: string;
  baselineYear: number;
  targetNetZeroYear: number;
  reductionTargetPercent: number;
  createdAt: string;
}

export interface User {
  id: string;
  orgId: string;
  email: string;
  fullName: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  failedLoginAttempts: number;
  lockoutUntil: number | null;
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<User, 'passwordHash' | 'salt'>;

export interface Session {
  token: string;
  userId: string;
  orgId: string;
  expiresAt: number;
  createdAt: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface Facility {
  id: string;
  orgId: string;
  name: string;
  code: string;
  location: string;
  country: string;
  gridRegion: string;
  squareMeters: number;
  facilityType: 'headquarters' | 'manufacturing' | 'data_center' | 'warehouse' | 'office';
  createdAt: string;
}

export interface EmissionRecord {
  id: string;
  orgId: string;
  facilityId: string;
  facilityName: string;
  scope: ScopeType;
  category: EmissionCategory;
  sourceName: string;
  activityAmount: number;
  activityUnit: string;
  emissionFactor: number;
  factorUnit: string;
  factorSource: string;
  co2eTonnes: number;
  reportingPeriod: string; // YYYY-MM
  date: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WasteRecord {
  id: string;
  orgId: string;
  facilityId: string;
  facilityName: string;
  wasteType: WasteType;
  disposalMethod: WasteDisposalMethod;
  weightTonnes: number;
  reportingPeriod: string; // YYYY-MM
  date: string;
  diversionRate: number; // percentage (0-100)
  createdAt: string;
}

export interface WaterRecord {
  id: string;
  orgId: string;
  facilityId: string;
  facilityName: string;
  withdrawalCubicMeters: number;
  dischargeCubicMeters: number;
  consumptionCubicMeters: number;
  recycledPercent: number;
  reportingPeriod: string; // YYYY-MM
  date: string;
  createdAt: string;
}

export interface ESGTask {
  id: string;
  orgId: string;
  title: string;
  description: string;
  assignedToUserId: string;
  assignedToName: string;
  scopeCategory: EmissionCategory | 'general_esg';
  priority: TaskPriority;
  status: TaskStatus;
  targetReductionTonnes: number;
  dueDate: string;
  completedAt?: string;
  aiGenerated: boolean;
  evidenceRecordIds?: string[];
  createdAt: string;
}

export interface AuditRecord {
  id: string;
  orgId: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  prevHash: string;
  hash: string;
}

export interface AuditChainVerificationResult {
  valid: boolean;
  totalEvents: number;
  brokenIndex: number | null;
  verifiedAt: string;
  rootHash: string;
  latestHash: string;
  message: string;
}

export interface SystemHealthMetrics {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptimeSeconds: number;
  database: {
    connected: boolean;
    readLatencyMs: number;
    writeLatencyMs: number;
    totalRecords: number;
    auditChainValid: boolean;
  };
  process: {
    memoryRssMb: number;
    memoryHeapMb: number;
    nodeVersion: string;
  };
  security: {
    activeSessions: number;
    rateLimiterActiveKeys: number;
    tamperProofAuditEvents: number;
    multiTenantIsolationEnforced: boolean;
  };
}
