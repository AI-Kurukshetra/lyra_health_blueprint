import type { AppRole } from "@/types/domain";
import type { FeatureContentConfig } from "@/components/features/feature-content";

export interface RoleFeatureRoute {
  title: string;
  subtitle: string;
  roleLabel: string;
  content: FeatureContentConfig;
}

export const employeeFeatureRoutes: Record<string, RoleFeatureRoute> = {
  messages: {
    title: "Secure Messaging",
    subtitle: "Send encrypted messages to care providers and support staff.",
    roleLabel: "Employee",
    content: { type: "messages" },
  },
  "crisis-support": {
    title: "Crisis Intervention",
    subtitle: "Use triage support and escalation actions for urgent mental health needs.",
    roleLabel: "Employee",
    content: { type: "triage" },
  },
  "chatbot-triage": {
    title: "AI Chatbot Triage",
    subtitle: "Get 24/7 initial guidance and urgency classification.",
    roleLabel: "Employee",
    content: { type: "triage" },
  },
  "micro-interventions": {
    title: "Micro-Interventions",
    subtitle: "Personalized coping exercises generated from your care context.",
    roleLabel: "Employee",
    content: { type: "micro-interventions" },
  },
  "wellness-challenges": {
    title: "Wellness Challenges",
    subtitle: "Track participation in engagement-focused mental wellness activities.",
    roleLabel: "Employee",
    content: {
      type: "board",
      featureKey: "wellness_challenges",
      heading: "Challenge participation",
      description: "Join or log progress on wellness challenges.",
      scope: "mine",
      fields: [
        { key: "challenge_type", label: "Challenge type", placeholder: "mindfulness, movement, journaling", type: "text" },
        { key: "target_days", label: "Target days", placeholder: "7", type: "text" },
      ],
      statusOptions: ["active", "completed", "paused"],
    },
  },
  "group-therapy": {
    title: "Group Therapy Sessions",
    subtitle: "Discover and enroll in moderated group therapy cohorts.",
    roleLabel: "Employee",
    content: {
      type: "board",
      featureKey: "group_therapy_sessions",
      heading: "Group session enrollment",
      description: "Reserve a seat in an upcoming group support session.",
      scope: "org",
      fields: [
        { key: "topic", label: "Session topic", placeholder: "stress recovery circle", type: "text" },
        { key: "facilitator", label: "Facilitator", placeholder: "provider name", type: "text" },
      ],
      statusOptions: ["planned", "enrolled", "attended"],
    },
  },
  reminders: {
    title: "Automated Reminders",
    subtitle: "Configure smart reminders for appointments, medication, and wellness activities.",
    roleLabel: "Employee",
    content: { type: "reminders" },
  },
  "family-support": {
    title: "Family Support Resources",
    subtitle: "Share-friendly guidance and resources for family mental health support.",
    roleLabel: "Employee",
    content: {
      type: "board",
      featureKey: "family_support_resources",
      heading: "Family support plan",
      description: "Capture resources and support actions for family members.",
      scope: "org",
      fields: [
        { key: "resource_link", label: "Resource link", placeholder: "https://...", type: "text" },
        { key: "audience", label: "Audience", placeholder: "spouse, parent, child", type: "text" },
      ],
    },
  },
  "care-plans": {
    title: "Personalized Care Plans",
    subtitle: "Track therapist-approved care actions and daily routines.",
    roleLabel: "Employee",
    content: {
      type: "board",
      featureKey: "personalized_care_plans",
      heading: "Care plan actions",
      description: "Add and manage your personal care plan activities.",
      scope: "mine",
      fields: [
        { key: "focus_area", label: "Focus area", placeholder: "sleep, anxiety, burnout", type: "text" },
        { key: "daily_action", label: "Daily action", placeholder: "10-minute breathing practice", type: "textarea" },
      ],
      statusOptions: ["active", "in_progress", "completed"],
    },
  },
  "peer-support": {
    title: "Peer Support Network",
    subtitle: "Participate in moderated peer support programs.",
    roleLabel: "Employee",
    content: {
      type: "board",
      featureKey: "peer_support_network",
      heading: "Peer support activity",
      description: "Log your peer-group participation and support goals.",
      scope: "org",
      fields: [
        { key: "group_name", label: "Group name", placeholder: "resilience circle", type: "text" },
        { key: "checkin", label: "Check-in summary", placeholder: "Key takeaway from this week", type: "textarea" },
      ],
    },
  },
  "mobile-access": {
    title: "Mobile App Access",
    subtitle: "Track mobile usage preferences and quick-access workflows.",
    roleLabel: "Employee",
    content: {
      type: "board",
      featureKey: "mobile_app_access",
      heading: "Mobile access preferences",
      description: "Configure mobile routines for on-the-go care.",
      scope: "mine",
      fields: [
        { key: "platform", label: "Platform", placeholder: "ios or android", type: "text" },
        { key: "quick_actions", label: "Quick actions", placeholder: "book, log mood, message", type: "textarea" },
      ],
      statusOptions: ["active", "planned", "disabled"],
    },
  },
  "language-support": {
    title: "Multi-language Support",
    subtitle: "Set language and localization preferences for care experiences.",
    roleLabel: "Employee",
    content: {
      type: "board",
      featureKey: "multi_language_support",
      heading: "Language preferences",
      description: "Capture preferred language and translation needs.",
      scope: "mine",
      fields: [
        { key: "preferred_language", label: "Preferred language", placeholder: "English, Spanish", type: "text" },
        { key: "notes", label: "Localization notes", placeholder: "Regional preference or support needs", type: "textarea" },
      ],
    },
  },
  biometric: {
    title: "Biometric Integration",
    subtitle: "Log wearable trends for sleep, stress, and recovery markers.",
    roleLabel: "Employee",
    content: {
      type: "board",
      featureKey: "biometric_integration",
      heading: "Biometric signal snapshots",
      description: "Capture wearable metrics and wellness interpretation notes.",
      scope: "mine",
      fields: [
        { key: "metric", label: "Metric", placeholder: "HRV, sleep hours", type: "text" },
        { key: "value", label: "Value", placeholder: "52 ms, 7.5 h", type: "text" },
      ],
      statusOptions: ["active", "watch", "resolved"],
    },
  },
  "digital-therapeutics": {
    title: "Digital Therapeutic Modules",
    subtitle: "Track completion of guided evidence-based modules.",
    roleLabel: "Employee",
    content: {
      type: "board",
      featureKey: "digital_therapeutic_modules",
      heading: "Therapeutic module progress",
      description: "Record your module usage and outcomes.",
      scope: "mine",
      fields: [
        { key: "module", label: "Module", placeholder: "CBT anxiety module 1", type: "text" },
        { key: "outcome", label: "Outcome note", placeholder: "Felt calmer after session", type: "textarea" },
      ],
      statusOptions: ["active", "completed", "paused"],
    },
  },
  "vr-therapy": {
    title: "VR Therapy Environments",
    subtitle: "Plan and track immersive therapy practice sessions.",
    roleLabel: "Employee",
    content: {
      type: "board",
      featureKey: "vr_therapy_environments",
      heading: "VR session plan",
      description: "Track exposure and relaxation environment sessions.",
      scope: "mine",
      fields: [
        { key: "environment", label: "Environment", placeholder: "guided beach relaxation", type: "text" },
        { key: "session_notes", label: "Session notes", placeholder: "comfort level and triggers", type: "textarea" },
      ],
      statusOptions: ["planned", "in_progress", "completed"],
    },
  },
};

export const providerFeatureRoutes: Record<string, RoleFeatureRoute> = {
  messages: {
    title: "Secure Messaging",
    subtitle: "Coordinate encrypted communication with employees, providers, and admins.",
    roleLabel: "Provider",
    content: { type: "messages", showCrisisQueue: true },
  },
  "network-management": {
    title: "Provider Network Management",
    subtitle: "Manage panel readiness, specialties, and intake capacity.",
    roleLabel: "Provider",
    content: {
      type: "board",
      featureKey: "provider_network_management",
      heading: "Network operations",
      description: "Maintain provider network status and referral pathways.",
      scope: "org",
      fields: [
        { key: "specialty", label: "Specialty", placeholder: "trauma-informed care", type: "text" },
        { key: "capacity", label: "Capacity", placeholder: "accepting 6 new clients", type: "text" },
      ],
      statusOptions: ["active", "limited", "paused"],
    },
  },
  "group-therapy": {
    title: "Group Therapy Management",
    subtitle: "Schedule and manage virtual group therapy cohorts.",
    roleLabel: "Provider",
    content: {
      type: "board",
      featureKey: "group_therapy_sessions",
      heading: "Group therapy operations",
      description: "Create sessions and track attendance and outcomes.",
      scope: "org",
      fields: [
        { key: "topic", label: "Topic", placeholder: "burnout recovery", type: "text" },
        { key: "agenda", label: "Agenda", placeholder: "grounding, reflection, action plan", type: "textarea" },
      ],
      statusOptions: ["planned", "in_progress", "completed"],
    },
  },
  "care-plans": {
    title: "Personalized Care Plans",
    subtitle: "Create and monitor therapist-approved treatment routines.",
    roleLabel: "Provider",
    content: {
      type: "board",
      featureKey: "personalized_care_plans",
      heading: "Care plan management",
      description: "Track patient care actions and adherence updates.",
      scope: "org",
      fields: [
        { key: "focus_area", label: "Focus area", placeholder: "panic management", type: "text" },
        { key: "intervention", label: "Intervention", placeholder: "scheduled CBT worksheet review", type: "textarea" },
      ],
      statusOptions: ["active", "review", "completed"],
    },
  },
  reminders: {
    title: "Automated Reminders",
    subtitle: "Configure smart reminders for appointments, medication, and wellness activities.",
    roleLabel: "Provider",
    content: { type: "reminders" },
  },
  "cultural-matching": {
    title: "Cultural Competency Matching",
    subtitle: "Document culturally aligned matching preferences and improvements.",
    roleLabel: "Provider",
    content: {
      type: "board",
      featureKey: "cultural_competency_matching",
      heading: "Cultural fit tracking",
      description: "Capture cultural context and alignment recommendations.",
      scope: "org",
      fields: [
        { key: "context", label: "Context", placeholder: "language and cultural considerations", type: "textarea" },
        { key: "matching_signal", label: "Matching signal", placeholder: "identity preference alignment", type: "text" },
      ],
    },
  },
  "digital-therapeutics": {
    title: "Digital Therapeutic Modules",
    subtitle: "Manage and assign digital therapeutic care modules.",
    roleLabel: "Provider",
    content: {
      type: "board",
      featureKey: "digital_therapeutic_modules",
      heading: "Module assignment",
      description: "Track module enrollment and completion outcomes.",
      scope: "org",
      fields: [
        { key: "module", label: "Module", placeholder: "depression coping track", type: "text" },
        { key: "assignment_notes", label: "Assignment notes", placeholder: "why this module was selected", type: "textarea" },
      ],
    },
  },
  biometric: {
    title: "Biometric Integration",
    subtitle: "Review wearable-derived trend markers relevant to treatment.",
    roleLabel: "Provider",
    content: {
      type: "board",
      featureKey: "biometric_integration",
      heading: "Biometric trend review",
      description: "Capture observations from patient wearable signals.",
      scope: "org",
      fields: [
        { key: "signal", label: "Signal", placeholder: "sleep debt spike", type: "text" },
        { key: "clinical_note", label: "Clinical note", placeholder: "adjust coping plan", type: "textarea" },
      ],
      statusOptions: ["watch", "stable", "improving"],
    },
  },
  "vr-therapy": {
    title: "VR Therapy Environments",
    subtitle: "Plan and evaluate immersive therapy interventions.",
    roleLabel: "Provider",
    content: {
      type: "board",
      featureKey: "vr_therapy_environments",
      heading: "VR intervention tracker",
      description: "Track clinical use of immersive therapy programs.",
      scope: "org",
      fields: [
        { key: "scenario", label: "Scenario", placeholder: "exposure ladder stage 2", type: "text" },
        { key: "response", label: "Patient response", placeholder: "response and adaptation notes", type: "textarea" },
      ],
    },
  },
  "early-warning": {
    title: "AI Early Warning",
    subtitle: "Identify employee deterioration risks before crisis points.",
    roleLabel: "Provider",
    content: {
      type: "insight",
      kind: "early-warning",
      title: "Early Warning Alerts",
      description: "Signals computed from risk levels, mood trends, and crisis events.",
    },
  },
  "sentiment-insights": {
    title: "Real-time Sentiment Analysis",
    subtitle: "Monitor communication sentiment trends and escalation signals.",
    roleLabel: "Provider",
    content: {
      type: "insight",
      kind: "sentiment",
      title: "Sentiment Monitoring",
      description: "NLP-style scoring over secure communication patterns.",
    },
  },
};

export const employerFeatureRoutes: Record<string, RoleFeatureRoute> = {
  messages: {
    title: "Secure Messaging",
    subtitle: "Coordinate care operations through secure cross-role communication.",
    roleLabel: "Employer Admin",
    content: { type: "messages", showCrisisQueue: true },
  },
  "workplace-stress": {
    title: "Workplace Stress Analytics",
    subtitle: "Track organization-level stress indicators and trends.",
    roleLabel: "Employer Admin",
    content: {
      type: "insight",
      kind: "workplace-stress",
      title: "Workplace Stress Index",
      description: "Aggregated stress indicators across moods and risk levels.",
    },
  },
  "team-insights": {
    title: "Team Mental Health Insights",
    subtitle: "Review anonymized team-level wellness and completion metrics.",
    roleLabel: "Employer Admin",
    content: {
      type: "insight",
      kind: "team-insights",
      title: "Team Health Snapshot",
      description: "Anonymous workforce engagement and session completion trends.",
    },
  },
  "utilization-forecast": {
    title: "Predictive Utilization Modeling",
    subtitle: "Forecast mental health demand and capacity gaps.",
    roleLabel: "Employer Admin",
    content: {
      type: "insight",
      kind: "utilization-forecast",
      title: "Demand Forecast",
      description: "Projected demand vs current provider slot capacity.",
    },
  },
  "roi-calculator": {
    title: "Workplace Mental Health ROI",
    subtitle: "Estimate productivity return from care engagement.",
    roleLabel: "Employer Admin",
    content: {
      type: "insight",
      kind: "roi",
      title: "ROI Calculator",
      description: "Estimated business impact based on utilization and wellbeing trends.",
    },
  },
  "sentiment-insights": {
    title: "Real-time Sentiment Analysis",
    subtitle: "Observe anonymized sentiment risk trends from communication signals.",
    roleLabel: "Employer Admin",
    content: {
      type: "insight",
      kind: "sentiment",
      title: "Sentiment Trend",
      description: "Organization-level sentiment scoring and watch status.",
    },
  },
  "manager-training": {
    title: "Manager Training Platform",
    subtitle: "Build manager readiness for recognizing and supporting mental health needs.",
    roleLabel: "Employer Admin",
    content: {
      type: "board",
      featureKey: "manager_training_platform",
      heading: "Manager enablement tracker",
      description: "Track manager mental health training plans and completion.",
      scope: "org",
      fields: [
        { key: "module", label: "Training module", placeholder: "recognizing burnout", type: "text" },
        { key: "cohort", label: "Manager cohort", placeholder: "engineering leads", type: "text" },
      ],
      statusOptions: ["planned", "in_progress", "completed"],
    },
  },
  "provider-network": {
    title: "Provider Network Management",
    subtitle: "Coordinate provider coverage, specialties, and availability at org level.",
    roleLabel: "Employer Admin",
    content: {
      type: "board",
      featureKey: "provider_network_management",
      heading: "Provider network operations",
      description: "Track network supply and specialization coverage.",
      scope: "org",
      fields: [
        { key: "focus", label: "Coverage focus", placeholder: "Spanish-speaking therapists", type: "text" },
        { key: "gap", label: "Coverage gap", placeholder: "night shift support", type: "textarea" },
      ],
      statusOptions: ["active", "watch", "critical"],
    },
  },
  "insurance-integration": {
    title: "Insurance Integration",
    subtitle: "Track payer integrations, coverage policies, and implementation tasks.",
    roleLabel: "Employer Admin",
    content: {
      type: "board",
      featureKey: "insurance_integration",
      heading: "Insurance integration tracker",
      description: "Manage insurance and benefit alignment tasks.",
      scope: "org",
      fields: [
        { key: "payer", label: "Payer", placeholder: "BlueCross", type: "text" },
        { key: "coverage_scope", label: "Coverage scope", placeholder: "therapy + coaching", type: "text" },
      ],
      statusOptions: ["planned", "in_progress", "active"],
    },
  },
  reminders: {
    title: "Automated Reminders",
    subtitle: "Configure smart reminders for appointments, medication, and wellness activities.",
    roleLabel: "Employer Admin",
    content: { type: "reminders" },
  },
};

export const adminFeatureRoutes: Record<string, RoleFeatureRoute> = {
  messages: {
    title: "Secure Messaging",
    subtitle: "Access cross-role secure messaging with escalation visibility.",
    roleLabel: "System Admin",
    content: { type: "messages", showCrisisQueue: true },
  },
  "integration-apis": {
    title: "Integration APIs",
    subtitle: "Manage enterprise API integrations with HRIS and external systems.",
    roleLabel: "System Admin",
    content: {
      type: "board",
      featureKey: "integration_apis",
      heading: "Integration API registry",
      description: "Track API endpoints, credentials status, and integration health.",
      scope: "org",
      fields: [
        { key: "integration", label: "Integration", placeholder: "Workday sync", type: "text" },
        { key: "owner", label: "Owner", placeholder: "platform operations", type: "text" },
      ],
      statusOptions: ["planned", "active", "degraded"],
    },
  },
  "insurance-integration": {
    title: "Insurance Integration",
    subtitle: "Global operational visibility into payer connectivity and issues.",
    roleLabel: "System Admin",
    content: {
      type: "board",
      featureKey: "insurance_integration",
      heading: "Payer integration operations",
      description: "Track connectivity and incident statuses for payer integrations.",
      scope: "org",
      fields: [
        { key: "payer", label: "Payer", placeholder: "UnitedHealth", type: "text" },
        { key: "issue", label: "Issue summary", placeholder: "eligibility sync delays", type: "textarea" },
      ],
    },
  },
  "provider-network": {
    title: "Provider Network Management",
    subtitle: "Oversee provider coverage quality across tenant organizations.",
    roleLabel: "System Admin",
    content: {
      type: "board",
      featureKey: "provider_network_management",
      heading: "Global provider network",
      description: "Monitor provider capacity and specialization across orgs.",
      scope: "org",
      fields: [
        { key: "org_focus", label: "Org focus", placeholder: "org + specialty gap", type: "text" },
        { key: "ops_action", label: "Ops action", placeholder: "recruit additional providers", type: "textarea" },
      ],
    },
  },
  "manager-training": {
    title: "Manager Training Platform",
    subtitle: "Track manager enablement performance across organizations.",
    roleLabel: "System Admin",
    content: {
      type: "board",
      featureKey: "manager_training_platform",
      heading: "Manager training rollout",
      description: "Track manager training initiatives and progress across orgs.",
      scope: "org",
      fields: [
        { key: "org", label: "Organization", placeholder: "Acme Corp", type: "text" },
        { key: "adoption", label: "Adoption note", placeholder: "completion above 80%", type: "textarea" },
      ],
    },
  },
  "early-warning": {
    title: "AI Early Warning",
    subtitle: "Cross-functional risk signal monitoring at platform level.",
    roleLabel: "System Admin",
    content: {
      type: "insight",
      kind: "early-warning",
      title: "Platform Early Warning",
      description: "Organization risk signals to support proactive intervention.",
    },
  },
  "workplace-stress": {
    title: "Workplace Stress Analytics",
    subtitle: "Platform-wide stress signal overview.",
    roleLabel: "System Admin",
    content: {
      type: "insight",
      kind: "workplace-stress",
      title: "Workplace Stress Monitoring",
      description: "Aggregated stress indicators from recent employee trends.",
    },
  },
  "team-insights": {
    title: "Team Mental Health Insights",
    subtitle: "Anonymized team-level trend visibility across organizations.",
    roleLabel: "System Admin",
    content: {
      type: "insight",
      kind: "team-insights",
      title: "Team Insight Monitoring",
      description: "Engagement and completion signals at team level.",
    },
  },
  "utilization-forecast": {
    title: "Predictive Utilization Modeling",
    subtitle: "Track anticipated demand and service capacity gaps.",
    roleLabel: "System Admin",
    content: {
      type: "insight",
      kind: "utilization-forecast",
      title: "Utilization Forecast",
      description: "Capacity and demand forecasts from appointment and slot data.",
    },
  },
  "roi-calculator": {
    title: "Workplace Mental Health ROI",
    subtitle: "Monitor estimated ROI metrics across deployments.",
    roleLabel: "System Admin",
    content: {
      type: "insight",
      kind: "roi",
      title: "ROI Signals",
      description: "Estimated return trends from engagement and wellbeing data.",
    },
  },
  "sentiment-insights": {
    title: "Real-time Sentiment Analysis",
    subtitle: "Live communication sentiment and risk trend monitoring.",
    roleLabel: "System Admin",
    content: {
      type: "insight",
      kind: "sentiment",
      title: "Sentiment Monitoring",
      description: "Sentiment score and trend status across secure messaging.",
    },
  },
};

export function getRoleFeatureRoute(role: AppRole, slug: string): RoleFeatureRoute | null {
  if (role === "employee") return employeeFeatureRoutes[slug] ?? null;
  if (role === "provider") return providerFeatureRoutes[slug] ?? null;
  if (role === "employer_admin") return employerFeatureRoutes[slug] ?? null;
  if (role === "system_admin") return adminFeatureRoutes[slug] ?? null;
  return null;
}
