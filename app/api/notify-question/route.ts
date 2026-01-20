import { NextResponse } from "next/server";

type NotifyBody = {
  assigned_to: "eben" | "steph";
  title: string;
  description: string;
  submitted_by: "lindy" | "michael";
};

const EMAIL_MAP: Record<"eben" | "steph", string | undefined> = {
  eben: process.env.EBEN_NOTIFICATION_EMAIL,
  steph: process.env.STEPH_NOTIFICATION_EMAIL,
};

// Map submitter ids to their full display names
const SUBMITTER_NAME_MAP: Record<"lindy" | "michael", string> = {
  lindy: "Lindy McKinnon",
  michael: "Michael Berry",
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NotifyBody;

    const recipientEmail = EMAIL_MAP[body.assigned_to];
    if (!recipientEmail) {
      console.error("No notification email configured for", body.assigned_to);
      return NextResponse.json(
        { ok: false, error: "No email configured" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.NOTIFICATION_FROM_EMAIL;

    if (!apiKey || !fromEmail) {
      console.error("Missing email env vars");
      return NextResponse.json(
        { ok: false, error: "Email not configured" },
        { status: 500 }
      );
    }

    // Get nice display name for submitter
    const submitterName =
      SUBMITTER_NAME_MAP[body.submitted_by] ?? body.submitted_by;

    // Minimal subject (email must have *some* subject)
    const subject = "New question";

    // Body text exactly as requested
    const text = `A new question has been submitted to you by ${submitterName}. You may respond in the app.`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
        subject,
        text,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Resend error:", errText);
      return NextResponse.json(
        { ok: false, error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("notify-question error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error" },
      { status: 500 }
    );
  }
}
