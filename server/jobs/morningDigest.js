/**
 * jobs/morningDigest.js — "The Morning Digest"
 *
 * Cluster-safe daily job that emails attendees & accepted volunteers
 * about events happening tomorrow.
 *
 * Safety:
 *  - Uses atomic findOneAndUpdate to "claim" each event, preventing
 *    duplicate emails when the server runs in PM2 cluster mode.
 *  - Filters out blocked users (isBlocked === true).
 *
 * Context-aware templates:
 *  - Reads event.attendancePolicy.strictAttendance to add a warning
 *    about mandatory attendance / no-show penalties.
 *  - Reads event.attendancePolicy.requiresQR to tell users whether
 *    they need a QR code or can check in manually.
 */

import Event from "../modules/events/event.model.js";
import RSVP from "../modules/events/rsvp.model.js";
import VolunteerApplication from "../modules/events/volunteer-application.model.js";
import { sendEmail } from "../utils/emailService.js";
import logger from "../middleware/logger.js";

export async function runMorningDigest() {
  const start = Date.now();
  logger.info("[job:morningDigest] starting");

  // ── Build "tomorrow" window in server-local time ──
  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  // ── Phase 1: find candidates (cheap read, no lock) ──
  const candidateEvents = await Event.find(
    {
      date: { $gte: tomorrowStart, $lte: tomorrowEnd },
      remindersSent: { $ne: true },
    },
    "_id title venue date attendancePolicy"
  ).lean();

  let emailsSentCount = 0;

  for (const candidate of candidateEvents) {
    // ── Phase 2: atomic claim — only one PM2 worker wins ──
    const claimedEvent = await Event.findOneAndUpdate(
      { _id: candidate._id, remindersSent: { $ne: true } },
      { $set: { remindersSent: true } },
      { new: true }
    );

    if (!claimedEvent) continue; // another worker already claimed it

    // ── Phase 3: gather recipients ──
    const [rsvps, volunteers] = await Promise.all([
      RSVP.find({ eventId: claimedEvent._id, status: "registered" }).populate(
        "userId",
        "email isBlocked"
      ),
      VolunteerApplication.find({
        eventId: claimedEvent._id,
        status: "accepted",
      }).populate("userId", "email isBlocked"),
    ]);

    // Merge, deduplicate, filter blocked users
    const validRecipients = [
      ...rsvps.map((r) => r.userId),
      ...volunteers.map((v) => v.userId),
    ].filter((user) => user && user.email && !user.isBlocked);

    const uniqueEmails = [...new Set(validRecipients.map((u) => u.email))];

    if (uniqueEmails.length === 0) continue;

    // ── Phase 4: build context-aware email ──
    const policy = claimedEvent.attendancePolicy || {};

    const strictWarning = policy.strictAttendance
      ? `<div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0; color: #991b1b;">
           <strong>⚠️ Mandatory Event:</strong> Failure to attend this event will result in a strike on your account.
           If you cannot make it, please cancel your RSVP on the platform today.
         </div>`
      : "";

    const checkInInstructions = policy.requiresQR
      ? `<p>📱 <strong>Check-in info:</strong> Please have your CampusConnect QR code ready at the door.</p>`
      : `<p>📍 <strong>Check-in info:</strong> Please check in with the event organizers at the venue upon arrival.</p>`;

    const eventTime = new Date(claimedEvent.date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    await sendEmail({
      to: uniqueEmails,
      subject: `📅 Tomorrow: ${claimedEvent.title}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px;">
          <h2 style="color: #0f172a;">See you tomorrow!</h2>
          <p>This is a reminder for your upcoming event on CampusConnect.</p>
          <h3 style="color: #2563eb;">${claimedEvent.title}</h3>
          <p><strong>📍 Venue:</strong> ${claimedEvent.venue || "TBA"}</p>
          <p><strong>⏰ Time:</strong> ${eventTime}</p>
          ${checkInInstructions}
          ${strictWarning}
        </div>
      `,
    });

    emailsSentCount++;
  }

  logger.info(
    `[job:morningDigest] done — processed ${emailsSentCount} events (${Date.now() - start}ms)`
  );
}
