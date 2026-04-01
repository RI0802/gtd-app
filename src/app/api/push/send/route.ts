import { NextResponse } from "next/server";
import webpush from "web-push";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

if (
  process.env.VAPID_EMAIL &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { title, body, url } = await req.json();

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { pushSubscription: true },
    });

    if (!userData?.pushSubscription) {
      return NextResponse.json({ error: "No push subscription" }, { status: 400 });
    }

    if (
      !process.env.VAPID_EMAIL ||
      !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      !process.env.VAPID_PRIVATE_KEY
    ) {
      return NextResponse.json({ error: "VAPID keys are not configured" }, { status: 500 });
    }

    const subscription = JSON.parse(userData.pushSubscription);
    const payload = JSON.stringify({ title, body, url });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Push notification error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
