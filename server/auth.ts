/**
 * EcoMind AI — Authentication & Role-Based Access Control (RBAC)
 * Strictly enforces:
 * - Session token validation with zero bypasses (no default admin fallback)
 * - HTTP 401 on missing/expired/invalid sessions
 * - Role-based permissions (Admin, Sustainability Manager, Auditor, Facility Operator)
 * - Strict multi-tenant isolation
 */

import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import type { SafeUser, UserRole } from './types.ts';

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      sessionToken?: string;
      orgId?: string;
    }
  }
}

/**
 * Strips sensitive fields (password hash, salt) from user object
 */
export function toSafeUser(user: any): SafeUser {
  const { passwordHash, salt, ...safe } = user;
  return safe;
}

/**
 * Strict authentication middleware
 * Rejects unauthenticated requests with HTTP 401. Never assigns default user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check authorization header first, then cookie
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.ecomind_session) {
    token = req.cookies.ecomind_session;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication session required. Please log in.',
    });
  }

  const session = db.getSession(token);
  if (!session) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired session. Please log in again.',
    });
  }

  const user = db.getUserById(session.userId);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User account not found or deactivated.',
    });
  }

  // Check account lockout
  if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
    return res.status(403).json({
      error: 'AccountLocked',
      message: 'Account is temporarily locked due to excessive failed attempts. Please contact administrator.',
    });
  }

  // Attach verified user and tenant context to request
  req.user = toSafeUser(user);
  req.sessionToken = token;
  req.orgId = user.orgId;

  next();
}

/**
 * Server-side Role-Based Access Control (RBAC) middleware
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}

/**
 * Middleware ensuring no cross-tenant IDOR attack
 * If client supplies an orgId in params or body, it MUST match the authenticated user's orgId
 */
export function enforceTenantIsolation(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.orgId) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }

  const requestedOrgId = req.params.orgId || req.query.orgId || req.body?.orgId;

  if (requestedOrgId && requestedOrgId !== req.orgId) {
    return res.status(403).json({
      error: 'TenantMismatch',
      message: 'Access denied: Cannot access or mutate data belonging to a different organization.',
    });
  }

  next();
}
