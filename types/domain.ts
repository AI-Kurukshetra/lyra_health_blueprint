export const APP_ROLES = [
  "employee",
  "provider",
  "employer_admin",
  "system_admin",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const APPOINTMENT_STATUSES = [
  "scheduled",
  "in_progress",
  "completed",
  "missed",
  "cancelled",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const SESSION_KINDS = ["therapy", "coaching"] as const;

export type SessionKind = (typeof SESSION_KINDS)[number];

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];

export interface Profile {
  id: string;
  organization_id: string | null;
  full_name: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
}
