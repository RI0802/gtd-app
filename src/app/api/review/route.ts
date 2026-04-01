import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  try {
    const user = await requireAuth();

    const [
      inboxCount,
      nextActionsCount,
      waitingForCount,
      projectsWithoutActions,
      lastReview,
    ] = await Promise.all([
      prisma.item.count({ where: { userId: user.id, type: "inbox" } }),
      prisma.item.count({ where: { userId: user.id, type: "next_action" } }),
      prisma.item.count({ where: { userId: user.id, type: "waiting_for" } }),
      prisma.project.findMany({
        where: {
          userId: user.id,
          status: "active",
          items: { none: { type: "next_action" } },
        },
        select: { id: true, name: true },
      }),
      prisma.review.findFirst({
        where: { userId: user.id },
        orderBy: { completedAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      inboxCount,
      nextActionsCount,
      waitingForCount,
      stuckProjects: projectsWithoutActions,
      lastReview: lastReview?.completedAt || null,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { notes, summary } = await req.json();

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        notes: notes || null,
        summary: summary ? JSON.stringify(summary) : null,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
