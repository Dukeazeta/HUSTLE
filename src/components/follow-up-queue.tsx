import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  Camera,
  Mail,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import type { OutreachChannel } from "@/lib/constants";
import styles from "./follow-up-queue.module.css";

type FollowUpReminder = {
  draftId: string;
  businessId: string;
  businessName: string;
  channel: OutreachChannel;
  dueAt: string | null;
  body: string;
};

type FollowUpQueueProps = {
  reminders: FollowUpReminder[];
  compact?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
};

const channelDetails: Record<
  OutreachChannel,
  { label: string; icon: LucideIcon }
> = {
  email: { label: "Email", icon: Mail },
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  instagram: { label: "Instagram", icon: Camera },
  linkedin: { label: "LinkedIn", icon: BriefcaseBusiness },
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDueDate(dueAt: string | null) {
  if (!dueAt) return "Now";

  const dueDate = new Date(dueAt);
  return Number.isNaN(dueDate.getTime())
    ? "Date unavailable"
    : dateFormatter.format(dueDate);
}

export function FollowUpQueue({
  reminders,
  compact = false,
  emptyTitle = "No follow-ups due",
  emptyBody = "Sent outreach will appear here after five business days.",
}: FollowUpQueueProps) {
  const queueClassName = compact
    ? `${styles.queue} ${styles.compact}`
    : styles.queue;

  return (
    <section className={queueClassName} aria-label="Follow-up reminders">
      {reminders.length ? (
        reminders.map((item) => {
          const channel = channelDetails[item.channel];
          const ChannelIcon = channel.icon;

          return (
            <article className={styles.row} key={item.draftId}>
              <span className={styles.iconPlate} aria-hidden="true">
                <ChannelIcon />
              </span>

              <div className={styles.identity}>
                <div className={styles.titleLine}>
                  <strong>{item.businessName}</strong>
                  <span>{channel.label}</span>
                </div>
                <p>{item.body}</p>
              </div>

              <div className={styles.due}>
                <span>Due</span>
                <time dateTime={item.dueAt ?? undefined}>
                  {formatDueDate(item.dueAt)}
                </time>
              </div>

              <Link
                className={styles.action}
                href={`/leads/${item.businessId}`}
                aria-label={`Review follow-up for ${item.businessName}`}
              >
                Review
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </article>
          );
        })
      ) : (
        <div className={styles.empty} role="status">
          <span className={styles.iconPlate} aria-hidden="true">
            <CalendarClock />
          </span>
          <div>
            <h3>{emptyTitle}</h3>
            <p>{emptyBody}</p>
          </div>
        </div>
      )}
    </section>
  );
}
