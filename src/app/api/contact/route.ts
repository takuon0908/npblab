import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// スパム対策として、フォームにhoneypot欄(website)を仕込み、埋まっていれば無視する
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 100) : "";
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 200) : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 5000) : "";
  const honeypot = typeof body?.website === "string" ? body.website.trim() : "";

  if (honeypot) {
    // ボット判定。成功したように見せて終了する
    return NextResponse.json({ ok: true });
  }

  if (!name || !email || !message || !email.includes("@")) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !toEmail) {
    console.error("RESEND_API_KEY / CONTACT_TO_EMAIL が設定されていません");
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from: "プロ野球LAB お問い合わせ <onboarding@resend.dev>",
      to: toEmail,
      replyTo: email,
      subject: `[プロ野球LAB問い合わせ] ${name}様より`,
      text: `送信者: ${name} <${email}>\n\n${message}`,
    });
  } catch (err) {
    console.error("contact mail send failed", err);
    return NextResponse.json({ error: "send failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
