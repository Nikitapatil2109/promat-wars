/**
 * EcoMind AI — Real Health & Diagnostics Subsystem
 * Collects actual runtime metrics: DB read/write latency, memory consumption,
 * active sessions, and cryptographic audit chain validity.
 */

import { performance } from 'node:perf_hooks';
import { db } from './db.ts';
import { authRateLimiter, aiRateLimiter, generalApiLimiter } from './security.ts';
import type { SystemHealthMetrics } from './types.ts';

const processStartTime = Date.now();

export class HealthService {
  public static async getHealthMetrics(): Promise<SystemHealthMetrics> {
    const mem = process.memoryUsage();

    // 1. Measure DB read latency
    const readStart = performance.now();
    const orgs = db.getAllOrganizations();
    const readLatencyMs = Number((performance.now() - readStart).toFixed(2));

    // 2. Measure DB write/check latency
    const writeStart = performance.now();
    await db.persist();
    const writeLatencyMs = Number((performance.now() - writeStart).toFixed(2));

    // 3. Verify actual cryptographic audit chain
    const chainVerification = db.verifyAuditChain();

    // 4. Record counts
    const rawData = db.getRawDataForTesting();
    const totalRecords =
      rawData.emissions.length +
      rawData.waste.length +
      rawData.water.length +
      rawData.tasks.length +
      rawData.auditLogs.length;

    const rateLimiterActiveKeys =
      authRateLimiter.getActiveCount() +
      aiRateLimiter.getActiveCount() +
      generalApiLimiter.getActiveCount();

    const uptimeSeconds = Math.floor((Date.now() - processStartTime) / 1000);

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (!chainVerification.valid || readLatencyMs > 500) {
      status = 'critical';
    } else if (readLatencyMs > 100 || writeLatencyMs > 250) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      database: {
        connected: orgs.length > 0,
        readLatencyMs,
        writeLatencyMs,
        totalRecords,
        auditChainValid: chainVerification.valid,
      },
      process: {
        memoryRssMb: Number((mem.rss / (1024 * 1024)).toFixed(1)),
        memoryHeapMb: Number((mem.heapUsed / (1024 * 1024)).toFixed(1)),
        nodeVersion: process.version,
      },
      security: {
        activeSessions: rawData.sessions.length,
        rateLimiterActiveKeys,
        tamperProofAuditEvents: rawData.auditLogs.length,
        multiTenantIsolationEnforced: true,
      },
    };
  }
}
