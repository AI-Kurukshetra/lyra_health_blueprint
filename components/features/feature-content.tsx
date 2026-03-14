import { FeatureBoard, type FeatureField } from "@/components/features/feature-board";
import { InsightDashboard } from "@/components/features/insight-dashboard";
import { ChatbotTriagePanel } from "@/components/features/chatbot-triage-panel";
import { MicroInterventionsPanel } from "@/components/features/micro-interventions-panel";
import { SecureMessagingHub } from "@/components/messaging/secure-messaging-hub";
import { ReminderCenter } from "@/components/notifications/reminder-center";

export type InsightKind =
  | "early-warning"
  | "workplace-stress"
  | "team-insights"
  | "utilization-forecast"
  | "roi"
  | "sentiment";

export type FeatureContentConfig =
  | {
      type: "board";
      featureKey: string;
      heading: string;
      description: string;
      fields?: FeatureField[];
      statusOptions?: string[];
      scope?: "mine" | "org";
    }
  | {
      type: "insight";
      kind: InsightKind;
      title: string;
      description: string;
    }
  | {
      type: "triage";
    }
  | {
      type: "micro-interventions";
    }
  | {
      type: "messages";
      showCrisisQueue?: boolean;
    }
  | {
      type: "reminders";
    };

interface FeatureContentProps {
  content: FeatureContentConfig;
}

export function FeatureContent({ content }: FeatureContentProps) {
  if (content.type === "board") {
    return (
      <FeatureBoard
        featureKey={content.featureKey}
        heading={content.heading}
        description={content.description}
        fields={content.fields}
        statusOptions={content.statusOptions}
        scope={content.scope}
      />
    );
  }

  if (content.type === "insight") {
    return (
      <InsightDashboard
        kind={content.kind}
        title={content.title}
        description={content.description}
      />
    );
  }

  if (content.type === "triage") {
    return <ChatbotTriagePanel />;
  }

  if (content.type === "micro-interventions") {
    return <MicroInterventionsPanel />;
  }

  if (content.type === "reminders") {
    return <ReminderCenter />;
  }

  return <SecureMessagingHub showCrisisQueue={content.showCrisisQueue} />;
}
