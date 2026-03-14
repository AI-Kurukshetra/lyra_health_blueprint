import { z } from "zod";

export const assessmentSchema = z.object({
  concerns: z.array(z.string().min(1)).min(1),
  preferredLanguages: z.array(z.string().min(1)).default([]),
  preferredTimezone: z.string().min(1),
  severityScore: z.number().int().min(0).max(27),
  careFormatPreference: z.enum(["video", "in_person", "hybrid"]).default("video"),
  coachingInterest: z.boolean().default(false),
  providerStyle: z.enum(["structured", "supportive", "directive", "no_preference"]).default("no_preference"),
  identityPreferences: z.array(z.string().min(1)).default([]),
  culturalPreferences: z.array(z.string().min(1)).default([]),
  urgencyLevel: z.enum(["routine", "priority", "urgent"]).default("routine"),
  notes: z.string().max(1200).optional(),
});

export const availabilitySchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  sessionKind: z.enum(["therapy", "coaching"]).default("therapy"),
}).refine((payload) => payload.endTime > payload.startTime, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

export const appointmentCreateSchema = z.object({
  providerId: z.string().uuid(),
  availabilityId: z.string().uuid(),
  sessionKind: z.enum(["therapy", "coaching"]).default("therapy"),
});

export const coachingPlanSchema = z.object({
  focusAreas: z.array(z.string().min(1)).min(1),
  goals: z.string().min(8).max(1200),
  preferredFrequency: z.enum(["weekly", "biweekly", "monthly"]).default("weekly"),
});

export const appointmentStatusUpdateSchema = z.object({
  status: z.enum(["scheduled", "in_progress", "completed", "missed", "cancelled"]),
});

export const moodEntrySchema = z.object({
  moodScore: z.number().int().min(1).max(10),
  notes: z.string().max(500).optional(),
});

export const sessionNoteSchema = z.object({
  appointmentId: z.string().uuid(),
  employeeId: z.string().uuid(),
  note: z.string().min(1).max(5000),
});

export const messageSchema = z.object({
  recipientId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  flaggedCrisis: z.boolean().default(false),
});

export const reminderCreateSchema = z.object({
  reminderType: z.enum(["appointment", "medication", "wellness"]),
  title: z.string().min(2).max(120),
  details: z.string().max(1200).optional(),
  remindAt: z.coerce.date(),
  timezone: z.string().min(2).max(80).optional(),
  repeatIntervalMinutes: z.number().int().min(1).max(10080).optional(),
});
