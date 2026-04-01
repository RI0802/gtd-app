import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = { userId: user.id };
    if (type) where.type = type;
    if (projectId) where.projectId = projectId;

    const items = await prisma.item.findMany({
      where,
      include: { contexts: { include: { context: true } }, project: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const {
      title,
      notes,
      type,
      energy,
      timeEstimate,
      dueDate,
      scheduledDate,
      delegatedTo,
      projectId,
      contextIds,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const item = await prisma.item.create({
      data: {
        userId: user.id,
        title,
        notes: notes || null,
        type: type || "inbox",
        energy: energy || null,
        timeEstimate: timeEstimate || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        delegatedTo: delegatedTo || null,
        projectId: projectId || null,
        contexts: contextIds?.length
          ? { create: contextIds.map((id: string) => ({ contextId: id })) }
          : undefined,
      },
      include: { contexts: { include: { context: true } }, project: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
