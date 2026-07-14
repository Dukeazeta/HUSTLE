import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarClock,
  Camera,
  MessageCircle,
  Mail,
} from "lucide-react";
import type { OutreachChannel } from "@/lib/constants";
export function FollowUpQueue({
  reminders,
}: {
  reminders: {
    draftId: string;
    businessId: string;
    businessName: string;
    channel: OutreachChannel;
    dueAt: string | null;
    body: string;
  }[];
}) {
  return (
    <div className="followup-queue">
      {reminders.length ? (
        reminders.map((item) => (
          <article key={item.draftId}>
            <span className="followup-channel">
              {item.channel === "email" ? (
                <Mail size={15} />
              ) : item.channel === "instagram" ? (
                <Camera size={15} />
              ) : item.channel === "linkedin" ? (
                <BriefcaseBusiness size={15} />
              ) : (
                <MessageCircle size={15} />
              )}{" "}
              {item.channel}
            </span>
            <div>
              <strong>{item.businessName}</strong>
              <p>
                {item.body.slice(0, 150)}
                {item.body.length > 150 ? "…" : ""}
              </p>
              <small>
                Due{" "}
                {item.dueAt ? new Date(item.dueAt).toLocaleDateString() : "now"}
              </small>
            </div>
            <Link href={`/leads/${item.businessId}`}>Review and follow up</Link>
          </article>
        ))
      ) : (
        <div className="empty-state">
          <CalendarClock size={28} />
          <h3>No follow-ups due</h3>
          <p>Sent outreach will appear here after five business days.</p>
        </div>
      )}
    </div>
  );
}
