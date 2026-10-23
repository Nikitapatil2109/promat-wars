/**
 * EcoMind AI — Database & Storage Engine
 * Features:
 * - Atomic persistence with fs.rename
 * - Strict multi-tenant isolation
 * - Cryptographic append-only audit chain with SHA-256 tamper verification
 * - Automated backup and restore with checksums
 * - Safe concurrency locks
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  Organization,
  User,
  Session,
  Facility,
  EmissionRecord,
  WasteRecord,
  WaterRecord,
  ESGTask,
  AuditRecord,
  AuditChainVerificationResult,
} from './types.ts';
import { hashPassword, sha256 } from './security.ts';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const BACKUP_DIR = path.resolve(process.cwd(), 'backups');

export interface DatabaseSchema {
  version: number;
  organizations: Organization[];
  users: User[];
  sessions: Session[];
  facilities: Facility[];
  emissions: EmissionRecord[];
  waste: WasteRecord[];
  water: WaterRecord[];
  tasks: ESGTask[];
  auditLogs: AuditRecord[];
}

export class Database {
  private data: DatabaseSchema;
  private isSaving = false;
  private saveQueued = false;

  constructor() {
    this.ensureDirectories();
    this.data = this.loadOrSeed();
  }

  private ensureDirectories() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
  }

  private loadOrSeed(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        if (parsed.version && Array.isArray(parsed.organizations)) {
          return parsed;
        }
      } catch (err) {
        console.error('[DB] Corrupt db.json encountered, falling back to seed data:', err);
      }
    }
    const seeded = this.generateSeedData();
    this.data = seeded;
    this.persistSync();
    return seeded;
  }

  private persistSync() {
    const tempFile = path.join(DATA_DIR, `db.tmp.${crypto.randomUUID()}.json`);
    const payload = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(tempFile, payload, 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public async persist(): Promise<void> {
    if (this.isSaving) {
      this.saveQueued = true;
      return;
    }
    this.isSaving = true;
    try {
      this.persistSync();
    } finally {
      this.isSaving = false;
      if (this.saveQueued) {
        this.saveQueued = false;
        await this.persist();
      }
    }
  }

  // ----------------------------------------------------
  // Seed Data Generator
  // ----------------------------------------------------
  private generateSeedData(): DatabaseSchema {
    const now = new Date().toISOString();
    const defaultPassword = 'EcoMind#2026!Secured';
    const pwdHash = hashPassword(defaultPassword);

    // Organization 1: Meridian Tech Enterprises
    const org1: Organization = {
      id: 'org_meridian_tech',
      name: 'Meridian Tech Enterprises',
      slug: 'meridian-tech',
      industry: 'Technology & Cloud Services',
      baselineYear: 2022,
      targetNetZeroYear: 2030,
      reductionTargetPercent: 55,
      createdAt: '2024-01-15T08:00:00.000Z',
    };

    // Organization 2: Apex Manufacturing Global
    const org2: Organization = {
      id: 'org_apex_global',
      name: 'Apex Manufacturing Global',
      slug: 'apex-global',
      industry: 'Automotive & Precision Components',
      baselineYear: 2021,
      targetNetZeroYear: 2040,
      reductionTargetPercent: 40,
      createdAt: '2024-02-01T09:00:00.000Z',
    };

    // Users for Org 1
    const usersOrg1: User[] = [
      {
        id: 'usr_meridian_admin',
        orgId: org1.id,
        email: 'admin@meridian.eco',
        fullName: 'Dr. Elena Vance (Chief Sustainability Officer)',
        role: 'admin',
        passwordHash: pwdHash.hash,
        salt: pwdHash.salt,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: '2024-01-15T08:30:00.000Z',
        updatedAt: now,
      },
      {
        id: 'usr_meridian_mgr',
        orgId: org1.id,
        email: 'sustainability@meridian.eco',
        fullName: 'Marcus Thorne (ESG Compliance Lead)',
        role: 'sustainability_manager',
        passwordHash: pwdHash.hash,
        salt: pwdHash.salt,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: '2024-01-16T09:00:00.000Z',
        updatedAt: now,
      },
      {
        id: 'usr_meridian_auditor',
        orgId: org1.id,
        email: 'auditor@meridian.eco',
        fullName: 'Sarah Chen, CPA (Lead ESG Assurance Auditor)',
        role: 'auditor',
        passwordHash: pwdHash.hash,
        salt: pwdHash.salt,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: '2024-01-17T10:00:00.000Z',
        updatedAt: now,
      },
      {
        id: 'usr_meridian_op',
        orgId: org1.id,
        email: 'operator@meridian.eco',
        fullName: 'Jordan Miller (Facility Operations Lead)',
        role: 'facility_operator',
        passwordHash: pwdHash.hash,
        salt: pwdHash.salt,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: '2024-01-18T11:00:00.000Z',
        updatedAt: now,
      },
    ];

    // Users for Org 2
    const usersOrg2: User[] = [
      {
        id: 'usr_apex_admin',
        orgId: org2.id,
        email: 'admin@apexglobal.eco',
        fullName: 'Robert Sterling (VP Operations & Sustainability)',
        role: 'admin',
        passwordHash: pwdHash.hash,
        salt: pwdHash.salt,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: '2024-02-01T09:30:00.000Z',
        updatedAt: now,
      },
      {
        id: 'usr_apex_mgr',
        orgId: org2.id,
        email: 'manager@apexglobal.eco',
        fullName: 'Diana Reyes (Plant ESG Director)',
        role: 'sustainability_manager',
        passwordHash: pwdHash.hash,
        salt: pwdHash.salt,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: '2024-02-02T10:00:00.000Z',
        updatedAt: now,
      },
    ];

    // Facilities
    const facilities: Facility[] = [
      {
        id: 'fac_sj_dc',
        orgId: org1.id,
        name: 'San Jose Cloud Data Center',
        code: 'DC-SJC-01',
        location: 'San Jose, CA',
        country: 'United States',
        gridRegion: 'CAMX (WECC California)',
        squareMeters: 45000,
        facilityType: 'data_center',
        createdAt: '2024-01-15T09:00:00.000Z',
      },
      {
        id: 'fac_fra_hub',
        orgId: org1.id,
        name: 'Frankfurt Technology Hub',
        code: 'HUB-FRA-02',
        location: 'Frankfurt, Hesse',
        country: 'Germany',
        gridRegion: 'EU-DE-TRANS',
        squareMeters: 28000,
        facilityType: 'data_center',
        createdAt: '2024-01-15T09:30:00.000Z',
      },
      {
        id: 'fac_austin_hq',
        orgId: org1.id,
        name: 'Austin Innovation Campus',
        code: 'HQ-ATX-03',
        location: 'Austin, TX',
        country: 'United States',
        gridRegion: 'ERCT (ERCOT All)',
        squareMeters: 32000,
        facilityType: 'headquarters',
        createdAt: '2024-01-15T10:00:00.000Z',
      },
      {
        id: 'fac_apex_detroit',
        orgId: org2.id,
        name: 'Detroit Precision Stamping Plant',
        code: 'APEX-DTW-01',
        location: 'Detroit, MI',
        country: 'United States',
        gridRegion: 'RFCW',
        squareMeters: 85000,
        facilityType: 'manufacturing',
        createdAt: '2024-02-01T10:00:00.000Z',
      },
    ];

    // Emission Records (Monthly historical records with real GHG Protocol factors)
    const emissions: EmissionRecord[] = [
      // 2025 Q3 - Q4 & 2026 Q1 Records for Meridian Tech
      {
        id: 'em_sj_dc_2025_09',
        orgId: org1.id,
        facilityId: 'fac_sj_dc',
        facilityName: 'San Jose Cloud Data Center',
        scope: 'scope_2',
        category: 'purchased_electricity_location',
        sourceName: 'Server Hall Grid Power',
        activityAmount: 1850,
        activityUnit: 'MWh',
        emissionFactor: 0.218,
        factorUnit: 'tCO2e/MWh',
        factorSource: 'EPA eGRID 2024 (CAMX)',
        co2eTonnes: 403.3,
        reportingPeriod: '2025-09',
        date: '2025-09-30',
        verified: true,
        verifiedBy: 'Sarah Chen (Lead Auditor)',
        verifiedAt: '2025-10-15T14:00:00.000Z',
        createdAt: '2025-10-02T08:00:00.000Z',
        updatedAt: '2025-10-15T14:00:00.000Z',
      },
      {
        id: 'em_sj_dc_2025_10',
        orgId: org1.id,
        facilityId: 'fac_sj_dc',
        facilityName: 'San Jose Cloud Data Center',
        scope: 'scope_2',
        category: 'purchased_electricity_location',
        sourceName: 'Server Hall Grid Power',
        activityAmount: 1820,
        activityUnit: 'MWh',
        emissionFactor: 0.218,
        factorUnit: 'tCO2e/MWh',
        factorSource: 'EPA eGRID 2024 (CAMX)',
        co2eTonnes: 396.76,
        reportingPeriod: '2025-10',
        date: '2025-10-31',
        verified: true,
        verifiedBy: 'Sarah Chen (Lead Auditor)',
        verifiedAt: '2025-11-12T11:00:00.000Z',
        createdAt: '2025-11-03T09:00:00.000Z',
        updatedAt: '2025-11-12T11:00:00.000Z',
      },
      {
        id: 'em_sj_dc_2025_11',
        orgId: org1.id,
        facilityId: 'fac_sj_dc',
        facilityName: 'San Jose Cloud Data Center',
        scope: 'scope_2',
        category: 'purchased_electricity_location',
        sourceName: 'Server Hall Grid Power',
        activityAmount: 1790,
        activityUnit: 'MWh',
        emissionFactor: 0.218,
        factorUnit: 'tCO2e/MWh',
        factorSource: 'EPA eGRID 2024 (CAMX)',
        co2eTonnes: 390.22,
        reportingPeriod: '2025-11',
        date: '2025-11-30',
        verified: true,
        verifiedBy: 'Sarah Chen (Lead Auditor)',
        verifiedAt: '2025-12-10T16:00:00.000Z',
        createdAt: '2025-12-02T09:00:00.000Z',
        updatedAt: '2025-12-10T16:00:00.000Z',
      },
      {
        id: 'em_sj_dc_2025_12',
        orgId: org1.id,
        facilityId: 'fac_sj_dc',
        facilityName: 'San Jose Cloud Data Center',
        scope: 'scope_2',
        category: 'purchased_electricity_location',
        sourceName: 'Server Hall Grid Power',
        activityAmount: 1740,
        activityUnit: 'MWh',
        emissionFactor: 0.218,
        factorUnit: 'tCO2e/MWh',
        factorSource: 'EPA eGRID 2024 (CAMX)',
        co2eTonnes: 379.32,
        reportingPeriod: '2025-12',
        date: '2025-12-31',
        verified: true,
        verifiedBy: 'Sarah Chen (Lead Auditor)',
        verifiedAt: '2026-01-14T10:00:00.000Z',
        createdAt: '2026-01-04T08:00:00.000Z',
        updatedAt: '2026-01-14T10:00:00.000Z',
      },
      {
        id: 'em_sj_gen_2025_12',
        orgId: org1.id,
        facilityId: 'fac_sj_dc',
        facilityName: 'San Jose Cloud Data Center',
        scope: 'scope_1',
        category: 'stationary_combustion',
        sourceName: 'Emergency Diesel Backup Generators',
        activityAmount: 1200,
        activityUnit: 'Gallons',
        emissionFactor: 0.01021,
        factorUnit: 'tCO2e/Gallon',
        factorSource: 'EPA GHG Emission Factors 2024',
        co2eTonnes: 12.25,
        reportingPeriod: '2025-12',
        date: '2025-12-28',
        verified: true,
        verifiedBy: 'Sarah Chen (Lead Auditor)',
        verifiedAt: '2026-01-14T10:00:00.000Z',
        createdAt: '2026-01-04T08:30:00.000Z',
        updatedAt: '2026-01-14T10:00:00.000Z',
      },
      {
        id: 'em_atx_ng_2025_12',
        orgId: org1.id,
        facilityId: 'fac_austin_hq',
        facilityName: 'Austin Innovation Campus',
        scope: 'scope_1',
        category: 'stationary_combustion',
        sourceName: 'Building Central Heating Boiler',
        activityAmount: 1450,
        activityUnit: 'MMBtu',
        emissionFactor: 0.0531,
        factorUnit: 'tCO2e/MMBtu',
        factorSource: 'EPA GHG Inventory Guidance',
        co2eTonnes: 77.0,
        reportingPeriod: '2025-12',
        date: '2025-12-31',
        verified: true,
        verifiedBy: 'Sarah Chen (Lead Auditor)',
        verifiedAt: '2026-01-14T10:00:00.000Z',
        createdAt: '2026-01-05T09:00:00.000Z',
        updatedAt: '2026-01-14T10:00:00.000Z',
      },
      {
        id: 'em_atx_elec_2025_12',
        orgId: org1.id,
        facilityId: 'fac_austin_hq',
        facilityName: 'Austin Innovation Campus',
        scope: 'scope_2',
        category: 'purchased_electricity_location',
        sourceName: 'ERCOT Grid Electricity',
        activityAmount: 890,
        activityUnit: 'MWh',
        emissionFactor: 0.385,
        factorUnit: 'tCO2e/MWh',
        factorSource: 'EPA eGRID 2024 (ERCT)',
        co2eTonnes: 342.65,
        reportingPeriod: '2025-12',
        date: '2025-12-31',
        verified: true,
        verifiedBy: 'Sarah Chen (Lead Auditor)',
        verifiedAt: '2026-01-14T10:00:00.000Z',
        createdAt: '2026-01-05T09:30:00.000Z',
        updatedAt: '2026-01-14T10:00:00.000Z',
      },
      {
        id: 'em_fra_elec_2025_12',
        orgId: org1.id,
        facilityId: 'fac_fra_hub',
        facilityName: 'Frankfurt Technology Hub',
        scope: 'scope_2',
        category: 'purchased_electricity_location',
        sourceName: 'European Grid Interconnect',
        activityAmount: 1120,
        activityUnit: 'MWh',
        emissionFactor: 0.235,
        factorUnit: 'tCO2e/MWh',
        factorSource: 'EEA European Environment Agency 2024',
        co2eTonnes: 263.2,
        reportingPeriod: '2025-12',
        date: '2025-12-31',
        verified: true,
        verifiedBy: 'Sarah Chen (Lead Auditor)',
        verifiedAt: '2026-01-14T10:00:00.000Z',
        createdAt: '2026-01-05T10:00:00.000Z',
        updatedAt: '2026-01-14T10:00:00.000Z',
      },
      {
        id: 'em_travel_2025_q4',
        orgId: org1.id,
        facilityId: 'fac_austin_hq',
        facilityName: 'Austin Innovation Campus',
        scope: 'scope_3',
        category: 'business_travel',
        sourceName: 'Global Executive Commercial Flights',
        activityAmount: 485000,
        activityUnit: 'passenger-km',
        emissionFactor: 0.000158,
        factorUnit: 'tCO2e/passenger-km',
        factorSource: 'UK DEFRA / BEIS 2024 Aviation Factors',
        co2eTonnes: 76.63,
        reportingPeriod: '2025-12',
        date: '2025-12-31',
        verified: true,
        verifiedBy: 'Sarah Chen (Lead Auditor)',
        verifiedAt: '2026-01-14T10:00:00.000Z',
        createdAt: '2026-01-06T11:00:00.000Z',
        updatedAt: '2026-01-14T10:00:00.000Z',
      },
      // 2026 Q1 Recent Verified Records
      {
        id: 'em_sj_dc_2026_01',
        orgId: org1.id,
        facilityId: 'fac_sj_dc',
        facilityName: 'San Jose Cloud Data Center',
        scope: 'scope_2',
        category: 'purchased_electricity_location',
        sourceName: 'Server Hall Grid Power',
        activityAmount: 1710,
        activityUnit: 'MWh',
        emissionFactor: 0.218,
        factorUnit: 'tCO2e/MWh',
        factorSource: 'EPA eGRID 2024 (CAMX)',
        co2eTonnes: 372.78,
        reportingPeriod: '2026-01',
        date: '2026-01-31',
        verified: true,
        verifiedBy: 'Sarah Chen (Lead Auditor)',
        verifiedAt: '2026-02-12T14:00:00.000Z',
        createdAt: '2026-02-02T08:00:00.000Z',
        updatedAt: '2026-02-12T14:00:00.000Z',
      },
      {
        id: 'em_sj_dc_2026_02',
        orgId: org1.id,
        facilityId: 'fac_sj_dc',
        facilityName: 'San Jose Cloud Data Center',
        scope: 'scope_2',
        category: 'purchased_electricity_location',
        sourceName: 'Server Hall Grid Power',
        activityAmount: 1680,
        activityUnit: 'MWh',
        emissionFactor: 0.218,
        factorUnit: 'tCO2e/MWh',
        factorSource: 'EPA eGRID 2024 (CAMX)',
        co2eTonnes: 366.24,
        reportingPeriod: '2026-02',
        date: '2026-02-28',
        verified: true,
        verifiedBy: 'Sarah Chen (Lead Auditor)',
        verifiedAt: '2026-03-10T11:00:00.000Z',
        createdAt: '2026-03-02T09:00:00.000Z',
        updatedAt: '2026-03-10T11:00:00.000Z',
      },
      // Distinct Apex Global Record (Org 2)
      {
        id: 'em_apex_dtw_2026_01',
        orgId: org2.id,
        facilityId: 'fac_apex_detroit',
        facilityName: 'Detroit Precision Stamping Plant',
        scope: 'scope_1',
        category: 'process_emissions',
        sourceName: 'Metal Thermal Treating Furnaces',
        activityAmount: 4800,
        activityUnit: 'MMBtu Natural Gas',
        emissionFactor: 0.0531,
        factorUnit: 'tCO2e/MMBtu',
        factorSource: 'EPA Mandatory GHG Reporting Rule',
        co2eTonnes: 254.88,
        reportingPeriod: '2026-01',
        date: '2026-01-31',
        verified: true,
        verifiedBy: 'Diana Reyes',
        verifiedAt: '2026-02-15T10:00:00.000Z',
        createdAt: '2026-02-02T10:00:00.000Z',
        updatedAt: '2026-02-15T10:00:00.000Z',
      },
    ];

    // Waste Records
    const waste: WasteRecord[] = [
      {
        id: 'wst_sj_ewaste_01',
        orgId: org1.id,
        facilityId: 'fac_sj_dc',
        facilityName: 'San Jose Cloud Data Center',
        wasteType: 'e_waste',
        disposalMethod: 'recycled',
        weightTonnes: 14.8,
        reportingPeriod: '2026-01',
        date: '2026-01-25',
        diversionRate: 100,
        createdAt: '2026-02-01T08:00:00.000Z',
      },
      {
        id: 'wst_atx_gen_01',
        orgId: org1.id,
        facilityId: 'fac_austin_hq',
        facilityName: 'Austin Innovation Campus',
        wasteType: 'non_hazardous',
        disposalMethod: 'diverted',
        weightTonnes: 8.2,
        reportingPeriod: '2026-01',
        date: '2026-01-30',
        diversionRate: 78.5,
        createdAt: '2026-02-01T08:30:00.000Z',
      },
      {
        id: 'wst_atx_haz_01',
        orgId: org1.id,
        facilityId: 'fac_austin_hq',
        facilityName: 'Austin Innovation Campus',
        wasteType: 'hazardous',
        disposalMethod: 'incineration',
        weightTonnes: 0.85,
        reportingPeriod: '2026-01',
        date: '2026-01-20',
        diversionRate: 0,
        createdAt: '2026-02-01T09:00:00.000Z',
      },
    ];

    // Water Records
    const water: WaterRecord[] = [
      {
        id: 'wtr_sj_cooling_01',
        orgId: org1.id,
        facilityId: 'fac_sj_dc',
        facilityName: 'San Jose Cloud Data Center',
        withdrawalCubicMeters: 42000,
        dischargeCubicMeters: 8400,
        consumptionCubicMeters: 33600,
        recycledPercent: 42.0,
        reportingPeriod: '2026-01',
        date: '2026-01-31',
        createdAt: '2026-02-01T10:00:00.000Z',
      },
      {
        id: 'wtr_atx_campus_01',
        orgId: org1.id,
        facilityId: 'fac_austin_hq',
        facilityName: 'Austin Innovation Campus',
        withdrawalCubicMeters: 18500,
        dischargeCubicMeters: 12000,
        consumptionCubicMeters: 6500,
        recycledPercent: 35.0,
        reportingPeriod: '2026-01',
        date: '2026-01-31',
        createdAt: '2026-02-01T10:30:00.000Z',
      },
    ];

    // ESG Tasks (Assigned to real authorized personnel in the organization)
    const tasks: ESGTask[] = [
      {
        id: 'tsk_sj_ppa_01',
        orgId: org1.id,
        title: 'Virtual Power Purchase Agreement (VPPA) On-Site Solar Phase 2',
        description:
          'Procure 45 GWh high-additionality solar PPA for San Jose facility to transition from location-based to zero-carbon market-based Scope 2 accounting.',
        assignedToUserId: 'usr_meridian_mgr',
        assignedToName: 'Marcus Thorne',
        scopeCategory: 'purchased_electricity_market',
        priority: 'critical',
        status: 'in_progress',
        targetReductionTonnes: 320.0,
        dueDate: '2026-11-30',
        aiGenerated: false,
        evidenceRecordIds: ['em_sj_dc_2026_01', 'em_sj_dc_2026_02'],
        createdAt: '2026-02-15T09:00:00.000Z',
      },
      {
        id: 'tsk_dc_cooling_opt',
        orgId: org1.id,
        title: 'AI HVAC Airflow & Free-Cooling Optimization',
        description:
          'Calibrate server room delta-T and enable economizer free-cooling to reduce baseline chiller energy by 14%.',
        assignedToUserId: 'usr_meridian_op',
        assignedToName: 'Jordan Miller',
        scopeCategory: 'purchased_electricity_location',
        priority: 'high',
        status: 'todo',
        targetReductionTonnes: 95.0,
        dueDate: '2026-12-15',
        aiGenerated: true,
        evidenceRecordIds: ['em_sj_dc_2025_12'],
        createdAt: '2026-03-01T11:00:00.000Z',
      },
      {
        id: 'tsk_corp_travel_policy',
        orgId: org1.id,
        title: 'Mandatory Rail & Sustainable Aviation Fuel (SAF) Policy',
        description:
          'Restrict short-haul flights under 500km to electric rail and partner with commercial airlines for book-and-claim SAF credits.',
        assignedToUserId: 'usr_meridian_admin',
        assignedToName: 'Dr. Elena Vance',
        scopeCategory: 'business_travel',
        priority: 'medium',
        status: 'in_progress',
        targetReductionTonnes: 35.0,
        dueDate: '2026-10-31',
        aiGenerated: false,
        evidenceRecordIds: ['em_travel_2025_q4'],
        createdAt: '2026-01-20T14:00:00.000Z',
      },
    ];

    // Cryptographically chained Genesis & Initial Audit Records
    const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
    const auditLogs: AuditRecord[] = [];

    const seedAuditEvents = [
      {
        id: 'aud_genesis_001',
        orgId: org1.id,
        timestamp: '2024-01-15T08:00:00.000Z',
        userId: 'system_root',
        userEmail: 'system@ecomind.security',
        action: 'ORGANIZATION_PROVISIONED',
        resource: 'organizations',
        resourceId: org1.id,
        details: { orgName: org1.name, industry: org1.industry, baselineYear: org1.baselineYear },
      },
      {
        id: 'aud_usr_provision_002',
        orgId: org1.id,
        timestamp: '2024-01-15T08:30:00.000Z',
        userId: 'system_root',
        userEmail: 'system@ecomind.security',
        action: 'ADMIN_ACCOUNT_INITIALIZED',
        resource: 'users',
        resourceId: 'usr_meridian_admin',
        details: { email: 'admin@meridian.eco', role: 'admin' },
      },
      {
        id: 'aud_assurance_signoff_003',
        orgId: org1.id,
        timestamp: '2026-01-14T10:00:00.000Z',
        userId: 'usr_meridian_auditor',
        userEmail: 'auditor@meridian.eco',
        action: 'EMISSION_VERIFICATION_CERTIFIED',
        resource: 'emissions',
        resourceId: 'em_sj_dc_2025_12',
        details: {
          period: '2025-12',
          verifiedTonnes: 379.32,
          standard: 'GHG Protocol Corporate Accounting Standard',
          assuranceLevel: 'Limited Assurance ISO 14064-3',
        },
      },
    ];

    let currentPrev = GENESIS_PREV_HASH;
    for (const item of seedAuditEvents) {
      const payload = currentPrev + item.timestamp + item.orgId + item.userId + item.action + item.resource + (item.resourceId || '') + JSON.stringify(item.details);
      const computedHash = sha256(payload);
      auditLogs.push({
        ...item,
        prevHash: currentPrev,
        hash: computedHash,
      });
      currentPrev = computedHash;
    }

    return {
      version: 1,
      organizations: [org1, org2],
      users: [...usersOrg1, ...usersOrg2],
      sessions: [],
      facilities,
      emissions,
      waste,
      water,
      tasks,
      auditLogs,
    };
  }

  // ----------------------------------------------------
  // Tenant Isolation Helper
  // ----------------------------------------------------
  private assertOrg(orgId: string) {
    if (!orgId || typeof orgId !== 'string') {
      throw new Error('Tenant context (orgId) is required for database operations');
    }
  }

  // ----------------------------------------------------
  // Organizations
  // ----------------------------------------------------
  public getOrganization(orgId: string): Organization | undefined {
    this.assertOrg(orgId);
    return this.data.organizations.find((o) => o.id === orgId);
  }

  public getAllOrganizations(): Organization[] {
    return [...this.data.organizations];
  }

  // ----------------------------------------------------
  // Users & Auth
  // ----------------------------------------------------
  public getUserByEmail(email: string): User | undefined {
    const normalized = email.toLowerCase().trim();
    return this.data.users.find((u) => u.email.toLowerCase() === normalized);
  }

  public getUserById(userId: string): User | undefined {
    return this.data.users.find((u) => u.id === userId);
  }

  public getUsersByOrg(orgId: string): User[] {
    this.assertOrg(orgId);
    return this.data.users.filter((u) => u.orgId === orgId);
  }

  public async updateUser(user: User): Promise<void> {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      this.data.users[idx] = { ...user, updatedAt: new Date().toISOString() };
      await this.persist();
    }
  }

  // ----------------------------------------------------
  // Sessions
  // ----------------------------------------------------
  public async createSession(session: Session): Promise<void> {
    this.assertOrg(session.orgId);
    // Remove expired sessions first
    const now = Date.now();
    this.data.sessions = this.data.sessions.filter((s) => s.expiresAt > now);
    this.data.sessions.push(session);
    await this.persist();
  }

  public getSession(token: string): Session | undefined {
    if (!token) return undefined;
    const now = Date.now();
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session || session.expiresAt <= now) {
      return undefined;
    }
    return session;
  }

  public async deleteSession(token: string): Promise<void> {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    await this.persist();
  }

  public async deleteUserSessions(userId: string): Promise<void> {
    this.data.sessions = this.data.sessions.filter((s) => s.userId !== userId);
    await this.persist();
  }

  // ----------------------------------------------------
  // Facilities (Tenant Scoped)
  // ----------------------------------------------------
  public getFacilities(orgId: string): Facility[] {
    this.assertOrg(orgId);
    return this.data.facilities.filter((f) => f.orgId === orgId);
  }

  public getFacilityById(orgId: string, facilityId: string): Facility | undefined {
    this.assertOrg(orgId);
    return this.data.facilities.find((f) => f.orgId === orgId && f.id === facilityId);
  }

  // ----------------------------------------------------
  // Emissions (Tenant Scoped)
  // ----------------------------------------------------
  public getEmissions(orgId: string): EmissionRecord[] {
    this.assertOrg(orgId);
    return this.data.emissions.filter((e) => e.orgId === orgId);
  }

  public getEmissionById(orgId: string, id: string): EmissionRecord | undefined {
    this.assertOrg(orgId);
    return this.data.emissions.find((e) => e.orgId === orgId && e.id === id);
  }

  public async addEmission(orgId: string, record: Omit<EmissionRecord, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>): Promise<EmissionRecord> {
    this.assertOrg(orgId);
    const now = new Date().toISOString();
    const newRecord: EmissionRecord = {
      ...record,
      id: `em_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      orgId,
      createdAt: now,
      updatedAt: now,
    };
    this.data.emissions.push(newRecord);
    await this.persist();
    return newRecord;
  }

  public async updateEmission(orgId: string, id: string, updates: Partial<EmissionRecord>): Promise<EmissionRecord | null> {
    this.assertOrg(orgId);
    const idx = this.data.emissions.findIndex((e) => e.orgId === orgId && e.id === id);
    if (idx === -1) return null;

    const existing = this.data.emissions[idx];
    const updated: EmissionRecord = {
      ...existing,
      ...updates,
      id: existing.id,
      orgId: existing.orgId,
      updatedAt: new Date().toISOString(),
    };
    this.data.emissions[idx] = updated;
    await this.persist();
    return updated;
  }

  public async deleteEmission(orgId: string, id: string): Promise<boolean> {
    this.assertOrg(orgId);
    const initialLen = this.data.emissions.length;
    this.data.emissions = this.data.emissions.filter((e) => !(e.orgId === orgId && e.id === id));
    if (this.data.emissions.length < initialLen) {
      await this.persist();
      return true;
    }
    return false;
  }

  // ----------------------------------------------------
  // Waste (Tenant Scoped)
  // ----------------------------------------------------
  public getWaste(orgId: string): WasteRecord[] {
    this.assertOrg(orgId);
    return this.data.waste.filter((w) => w.orgId === orgId);
  }

  public async addWaste(orgId: string, record: Omit<WasteRecord, 'id' | 'orgId' | 'createdAt'>): Promise<WasteRecord> {
    this.assertOrg(orgId);
    const newRecord: WasteRecord = {
      ...record,
      id: `wst_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      orgId,
      createdAt: new Date().toISOString(),
    };
    this.data.waste.push(newRecord);
    await this.persist();
    return newRecord;
  }

  // ----------------------------------------------------
  // Water (Tenant Scoped)
  // ----------------------------------------------------
  public getWater(orgId: string): WaterRecord[] {
    this.assertOrg(orgId);
    return this.data.water.filter((w) => w.orgId === orgId);
  }

  public async addWater(orgId: string, record: Omit<WaterRecord, 'id' | 'orgId' | 'createdAt'>): Promise<WaterRecord> {
    this.assertOrg(orgId);
    const newRecord: WaterRecord = {
      ...record,
      id: `wtr_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      orgId,
      createdAt: new Date().toISOString(),
    };
    this.data.water.push(newRecord);
    await this.persist();
    return newRecord;
  }

  // ----------------------------------------------------
  // Tasks (Tenant Scoped)
  // ----------------------------------------------------
  public getTasks(orgId: string): ESGTask[] {
    this.assertOrg(orgId);
    return this.data.tasks.filter((t) => t.orgId === orgId);
  }

  public async addTask(orgId: string, task: Omit<ESGTask, 'id' | 'orgId' | 'createdAt'>): Promise<ESGTask> {
    this.assertOrg(orgId);
    const newTask: ESGTask = {
      ...task,
      id: `tsk_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      orgId,
      createdAt: new Date().toISOString(),
    };
    this.data.tasks.push(newTask);
    await this.persist();
    return newTask;
  }

  public async updateTask(orgId: string, taskId: string, updates: Partial<ESGTask>): Promise<ESGTask | null> {
    this.assertOrg(orgId);
    const idx = this.data.tasks.findIndex((t) => t.orgId === orgId && t.id === taskId);
    if (idx === -1) return null;

    const existing = this.data.tasks[idx];
    const updated: ESGTask = {
      ...existing,
      ...updates,
      id: existing.id,
      orgId: existing.orgId,
    };
    this.data.tasks[idx] = updated;
    await this.persist();
    return updated;
  }

  // ----------------------------------------------------
  // Cryptographic Append-Only Audit Trail
  // ----------------------------------------------------
  public async appendAudit(entry: {
    orgId: string;
    userId: string;
    userEmail: string;
    action: string;
    resource: string;
    resourceId?: string;
    details: Record<string, any>;
  }): Promise<AuditRecord> {
    this.assertOrg(entry.orgId);
    const timestamp = new Date().toISOString();
    const id = `aud_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`;

    // Find the latest audit record in the global chain (or genesis)
    const lastRecord = this.data.auditLogs[this.data.auditLogs.length - 1];
    const prevHash = lastRecord ? lastRecord.hash : '0000000000000000000000000000000000000000000000000000000000000000';

    const payload = prevHash + timestamp + entry.orgId + entry.userId + entry.action + entry.resource + (entry.resourceId || '') + JSON.stringify(entry.details);
    const hash = sha256(payload);

    const record: AuditRecord = {
      id,
      orgId: entry.orgId,
      timestamp,
      userId: entry.userId,
      userEmail: entry.userEmail,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details,
      prevHash,
      hash,
    };

    this.data.auditLogs.push(record);
    await this.persist();
    return record;
  }

  public getAuditLogs(orgId: string, limit = 50, offset = 0): { records: AuditRecord[]; total: number } {
    this.assertOrg(orgId);
    const tenantLogs = this.data.auditLogs.filter((a) => a.orgId === orgId);
    const sorted = [...tenantLogs].reverse();
    return {
      records: sorted.slice(offset, offset + limit),
      total: tenantLogs.length,
    };
  }

  /**
   * Verifies the entire cryptographic audit chain from Genesis to Tip.
   * Ensures that no event was deleted, modified, or reordered.
   */
  public verifyAuditChain(): AuditChainVerificationResult {
    const logs = this.data.auditLogs;
    if (logs.length === 0) {
      return {
        valid: true,
        totalEvents: 0,
        brokenIndex: null,
        verifiedAt: new Date().toISOString(),
        rootHash: 'GENESIS_EMPTY',
        latestHash: 'GENESIS_EMPTY',
        message: 'Audit chain is empty and valid.',
      };
    }

    const GENESIS_PREV = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < logs.length; i++) {
      const record = logs[i];
      const expectedPrev = i === 0 ? GENESIS_PREV : logs[i - 1].hash;

      if (record.prevHash !== expectedPrev) {
        return {
          valid: false,
          totalEvents: logs.length,
          brokenIndex: i,
          verifiedAt: new Date().toISOString(),
          rootHash: logs[0].hash,
          latestHash: logs[logs.length - 1].hash,
          message: `Chain integrity failure at index ${i}: prevHash mismatch. Expected ${expectedPrev.slice(0, 12)}..., found ${record.prevHash.slice(0, 12)}...`,
        };
      }

      // Re-hash block payload
      const payload = record.prevHash + record.timestamp + record.orgId + record.userId + record.action + record.resource + (record.resourceId || '') + JSON.stringify(record.details);
      const computed = sha256(payload);

      if (computed !== record.hash) {
        return {
          valid: false,
          totalEvents: logs.length,
          brokenIndex: i,
          verifiedAt: new Date().toISOString(),
          rootHash: logs[0].hash,
          latestHash: logs[logs.length - 1].hash,
          message: `Tampering detected at event ${record.id} (index ${i}): content hash mismatch.`,
        };
      }
    }

    return {
      valid: true,
      totalEvents: logs.length,
      brokenIndex: null,
      verifiedAt: new Date().toISOString(),
      rootHash: logs[0].hash,
      latestHash: logs[logs.length - 1].hash,
      message: `Audit chain cryptographically verified. All ${logs.length} events are tamper-proof and valid.`,
    };
  }

  // ----------------------------------------------------
  // Backup & Recovery
  // ----------------------------------------------------
  public async createBackup(): Promise<{ backupFile: string; checksum: string; recordCounts: Record<string, number> }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);
    const payload = JSON.stringify(this.data, null, 2);
    const checksum = sha256(payload);

    const backupObject = {
      metadata: {
        createdAt: new Date().toISOString(),
        checksum,
        version: this.data.version,
        recordCounts: {
          organizations: this.data.organizations.length,
          users: this.data.users.length,
          emissions: this.data.emissions.length,
          waste: this.data.waste.length,
          water: this.data.water.length,
          tasks: this.data.tasks.length,
          auditLogs: this.data.auditLogs.length,
        },
      },
      data: this.data,
    };

    fs.writeFileSync(backupFile, JSON.stringify(backupObject, null, 2), 'utf8');

    return {
      backupFile: path.basename(backupFile),
      checksum,
      recordCounts: backupObject.metadata.recordCounts,
    };
  }

  public listBackups(): Array<{ filename: string; sizeBytes: number; createdAt: string }> {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    return fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((filename) => {
        const fullPath = path.join(BACKUP_DIR, filename);
        const stat = fs.statSync(fullPath);
        return {
          filename,
          sizeBytes: stat.size,
          createdAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public async restoreFromBackup(filename: string): Promise<boolean> {
    const fullPath = path.join(BACKUP_DIR, path.basename(filename));
    if (!fs.existsSync(fullPath)) {
      throw new Error('Backup file not found');
    }
    const raw = fs.readFileSync(fullPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.data || !parsed.metadata) {
      throw new Error('Invalid backup file schema');
    }

    // Verify checksum
    const rawData = JSON.stringify(parsed.data, null, 2);
    const computedCheck = sha256(rawData);
    if (computedCheck !== parsed.metadata.checksum) {
      throw new Error('Backup file checksum verification failed! Possible file corruption.');
    }

    // Make an emergency backup of current state first
    await this.createBackup();

    this.data = parsed.data;
    await this.persist();
    return true;
  }

  public getRawDataForTesting(): DatabaseSchema {
    return this.data;
  }
}

// Global Singleton Database Instance
export const db = new Database();
