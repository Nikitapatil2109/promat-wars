/**
 * Frontend Type Definitions for EcoMind AI
 */

export type UserRole = 'admin' | 'sustainability_manager' | 'auditor' | 'facility_operator';

export interface User {
  id: string;
  orgId: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry: string;
  baselineYear: number;
  targetNetZeroYear: number;
  reductionTargetPercent: number;
}

export interface Facility {
  id: string;
  name: string;
  code: string;
  location: string;
  country: string;
  gridRegion: string;
  squareMeters: number;
  facilityType: string;
}

export interface EmissionRecord {
  id: string;
  orgId: string;
  facilityId: string;
  facilityName: string;
  scope: 'scope_1' | 'scope_2' | 'scope_3';
  category: string;
  sourceName: string;
  activityAmount: number;
  activityUnit: string;
  emissionFactor: number;
  factorUnit: string;
  factorSource: string;
  co2eTonnes: number;
  reportingPeriod: string;
  date: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface WasteRecord {
  id: string;
  facilityName: string;
  wasteType: string;
  disposalMethod: string;
  weightTonnes: number;
  reportingPeriod: string;
  date: string;
  diversionRate: number;
}

export interface WaterRecord {
  id: string;
  facilityName: string;
  withdrawalCubicMeters: number;
  dischargeCubicMeters: number;
  consumptionCubicMeters: number;
  recycledPercent: number;
  reportingPeriod: string;
  date: string;
}

export interface ESGTask {
  id: string;
  title: string;
  description: string;
  assignedToUserId: string;
  assignedToName: string;
  scopeCategory: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'under_review' | 'completed';
  targetReductionTonnes: number;
  dueDate: string;
  completedAt?: string;
  aiGenerated: boolean;
}

export interface AuditRecord {
  id: string;
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

export interface ESGSummary {
  reportingPeriod: string;
  totalCo2eTonnes: number;
  scope1Tonnes: number;
  scope2Tonnes: number;
  scope3Tonnes: number;
  scopeBreakdownPercent: {
    scope1: number;
    scope2: number;
    scope3: number;
  };
  byCategory: Record<string, number>;
  byFacility: Record<string, { facilityName: string; tonnes: number; percent: number }>;
  waste: {
    totalWeightTonnes: number;
    recycledTonnes: number;
    hazardousTonnes: number;
    diversionRatePercent: number;
  };
  water: {
    withdrawalCubicMeters: number;
    consumptionCubicMeters: number;
    recycledPercent: number;
  };
  progressVsBaseline: {
    baselineYear: number;
    targetNetZeroYear: number;
    reductionTargetPercent: number;
    currentReductionPercent: number;
    onTrack: boolean;
  };
}

export interface ForecastPoint {
  period: string;
  projectedCo2eTonnes: number;
  lowerConfidenceBound95: number;
  upperConfidenceBound95: number;
  targetNetZeroPathTonnes: number;
}

export interface ESGForecastResult {
  methodology: string;
  assumptions: string[];
  historicalPointsCount: number;
  rSquared: number;
  slopeMonthlyChangeTonnes: number;
  interceptTonnes: number;
  forecast: ForecastPoint[];
  analysis: {
    trajectoryStatus: 'on_track' | 'at_risk' | 'off_track';
    annualizedReductionRatePercent: number;
    gapToNetZeroTargetTonnes: number;
  };
}
