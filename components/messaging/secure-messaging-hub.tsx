"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, MessagesSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatInSystemTimeZone, getSystemTimeZone } from "@/lib/time/client";

interface Contact {
  id: string;
  full_name: string | null;
  role: string;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  flagged_crisis: boolean;
  created_at: string;
}

interface CrisisEvent {
  id: string;
  employee_id: string;
  source: string;
  severity: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
}

interface SecureMessagingHubProps {
  showCrisisQueue?: boolean;
}

export function SecureMessagingHub({ showCrisisQueue = false }: SecureMessagingHubProps) {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const systemTimeZone = useMemo(() => getSystemTimeZone(), []);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [flaggedCrisis, setFlaggedCrisis] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [updatingCrisisId, setUpdatingCrisisId] = useState<string | null>(null);

  const contactsQuery = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const response = await fetch("/api/contacts");
      const payload = (await response.json().catch(() => null)) as {
        data?: Contact[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load contacts.");
      }
      return payload.data ?? [];
    },
  });

  const contacts = contactsQuery.data;
  const activeContactId = selectedContactId || contacts?.[0]?.id || "";

  const messagesQuery = useQuery({
    queryKey: ["messages", activeContactId],
    queryFn: async () => {
      const query = activeContactId
        ? `/api/messages?partnerId=${activeContactId}`
        : "/api/messages";
      const response = await fetch(query);
      const payload = (await response.json().catch(() => null)) as {
        data?: Message[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load messages.");
      }
      return payload.data ?? [];
    },
  });

  const crisisQuery = useQuery({
    queryKey: ["crisis-events"],
    enabled: showCrisisQueue,
    queryFn: async () => {
      const response = await fetch("/api/crisis-events");
      const payload = (await response.json().catch(() => null)) as {
        data?: CrisisEvent[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load crisis queue.");
      }
      return payload.data ?? [];
    },
  });

  const messages = useMemo(
    () => [...(messagesQuery.data ?? [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messagesQuery.data],
  );
  const selectedContact = (contacts ?? []).find((contact) => contact.id === activeContactId);

  useEffect(() => {
    let active = true;

    function upsertThreadMessage(partnerId: string, message: Message) {
      queryClient.setQueryData<Message[]>(["messages", partnerId], (current) => {
        const existing = current ?? [];
        if (existing.some((entry) => entry.id === message.id)) {
          return existing;
        }
        return [message, ...existing];
      });
    }

    async function connectRealtime() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || !user) {
        return;
      }

      const channel = supabase
        .channel(`secure-messages-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            const message = payload.new as Message;
            const partnerId = message.sender_id;
            upsertThreadMessage(partnerId, message);
            if (partnerId !== activeContactId) {
              const contactName = (contacts ?? []).find((entry) => entry.id === partnerId)?.full_name ?? "a contact";
              toast.info(`New message from ${contactName}`);
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `sender_id=eq.${user.id}`,
          },
          (payload) => {
            const message = payload.new as Message;
            const partnerId = message.recipient_id;
            upsertThreadMessage(partnerId, message);
          },
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    }

    let cleanup: (() => void) | undefined;
    void connectRealtime().then((teardown) => {
      cleanup = teardown;
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, [activeContactId, contacts, queryClient, supabase]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeContactId) {
      setStatusMessage("Choose a contact first.");
      toast.error("Choose a contact before sending.");
      return;
    }

    setIsSending(true);
    setStatusMessage("Sending message...");
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId: activeContactId,
        body: draftMessage,
        flaggedCrisis,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string };

    if (!response.ok) {
      const message = payload?.error ?? "Failed to send message.";
      setStatusMessage(message);
      toast.error(message);
      setIsSending(false);
      return;
    }

    setDraftMessage("");
    setFlaggedCrisis(false);
    setStatusMessage("Message sent.");
    toast.success("Message sent successfully.");
    setIsSending(false);
    await Promise.all([
      messagesQuery.refetch(),
      showCrisisQueue ? crisisQuery.refetch() : Promise.resolve(),
    ]);
  }

  async function updateCrisisStatus(id: string, status: CrisisEvent["status"]) {
    setUpdatingCrisisId(id);
    const response = await fetch("/api/crisis-events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string };

    if (!response.ok) {
      const message = payload?.error ?? "Failed to update crisis status.";
      setStatusMessage(message);
      toast.error(message);
      setUpdatingCrisisId(null);
      return;
    }

    setStatusMessage("Crisis status updated.");
    toast.success(`Crisis event marked as ${status.replace("_", " ")}.`);
    setUpdatingCrisisId(null);
    await crisisQuery.refetch();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
          <MessagesSquare className="h-3.5 w-3.5 text-teal-700" />
          Contacts
        </p>
        <div className="mt-3 space-y-2">
          {(contacts ?? []).map((contact) => {
            const active = activeContactId === contact.id;
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => setSelectedContactId(contact.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition-all ${
                  active
                    ? "border-teal-300 bg-teal-50"
                    : "border-gray-200 bg-white hover:border-teal-200"
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">
                  {contact.full_name ?? `User ${contact.id.slice(0, 6)}`}
                </p>
                <p className="text-xs uppercase tracking-[0.12em] text-gray-500">{contact.role}</p>
              </button>
            );
          })}
          {!contactsQuery.isLoading && (contacts ?? []).length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-600">
              No contacts available.
            </p>
          )}
        </div>
      </section>

      <div className="space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Secure messaging</h2>
              <p className="text-sm text-gray-600">
                {selectedContact
                  ? `Conversation with ${selectedContact.full_name ?? selectedContact.id}`
                  : "Select a contact to begin."}
              </p>
              <p className="mt-1 text-xs font-medium text-teal-700">All timestamps shown in {systemTimeZone}</p>
            </div>
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">
              Encrypted channel
            </span>
          </div>

          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
            {messages.map((message) => {
              const outbound = message.recipient_id === activeContactId;
              return (
                <article
                  key={message.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    outbound
                      ? "ml-auto border border-teal-200 bg-teal-50 text-teal-900"
                      : "border border-gray-200 bg-white text-gray-800"
                  }`}
                >
                  <p>{message.body}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{formatInSystemTimeZone(message.created_at)}</p>
                  {message.flagged_crisis && (
                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                      <AlertCircle className="h-3 w-3" />
                      Crisis flagged
                    </p>
                  )}
                </article>
              );
            })}
            {!messagesQuery.isLoading && messages.length === 0 && (
              <p className="text-sm text-gray-600">No messages in this thread yet.</p>
            )}
          </div>

          <form onSubmit={sendMessage} className="mt-4 space-y-3">
            <textarea
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              required
              className="min-h-24 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              placeholder="Write a secure message..."
            />
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={flaggedCrisis}
                onChange={(event) => setFlaggedCrisis(event.target.checked)}
                disabled={isSending}
              />
              Flag as crisis escalation
            </label>
            <button
              type="submit"
              disabled={isSending}
              className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 ${isSending ? "is-loading opacity-80" : ""}`}
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isSending ? "Sending..." : "Send message"}
            </button>
          </form>
        </section>

        {showCrisisQueue && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Crisis intervention queue</h3>
            <p className="mt-1 text-sm text-gray-600">Track and resolve escalations with status controls.</p>
            <div className="mt-3 space-y-2">
              {(crisisQuery.data ?? []).map((event) => (
                <article key={event.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {event.source} | {event.severity}
                  </p>
                  <p className="text-xs text-gray-600">
                    Employee: {event.employee_id} | {formatInSystemTimeZone(event.created_at)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["open", "in_progress", "resolved"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={updatingCrisisId === event.id}
                        onClick={() => updateCrisisStatus(event.id, status)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                          event.status === status
                            ? "border-teal-300 bg-teal-50 text-teal-800"
                            : "border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        {updatingCrisisId === event.id ? (
                          <span className="inline-flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Updating
                          </span>
                        ) : (
                          status
                        )}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <p className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          {statusMessage ??
            (contactsQuery.isLoading || messagesQuery.isLoading || crisisQuery.isLoading
              ? "Loading secure messaging..."
              : contactsQuery.error
                ? (contactsQuery.error as Error).message
                : messagesQuery.error
                  ? (messagesQuery.error as Error).message
                  : crisisQuery.error
                    ? (crisisQuery.error as Error).message
                    : "Secure messaging ready.")}
        </p>
      </div>
    </div>
  );
}
