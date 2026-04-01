import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const item = await prisma.item.findFirst({
      where: { id, userId: user.id },
      include: { contexts: { include: { context: true } }, project: true },
    });

    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.item.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const {
      title,
      notes,
      type,
      energy,
      timeEstimate,
      dueDate,
      scheduledDate,
      completedAt,
      delegatedTo,
      projectId,
      contextIds,
      sortOrder,
    } = body;

    if (contextIds !== undefined) {
      await prisma.itemContext.deleteMany({ where: { itemId: id } });
      if (contextIds.length > 0) {
        await prisma.itemContext.createMany({
          data: contextIds.map((cid: string) => ({ itemId: id, contextId: cid })),
        });
      }
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(notes !== undefined && { notes }),
        ...(type !== undefined && { type }),
        ...(energy !== undefined && { energy }),
        ...(timeEstimate !== undefined && { timeEstimate }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(scheduledDate !== undefined && {
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        }),
        ...(completedAt !== undefined && {
          completedAt: completedAt ? new Date(completedAt) : null,
        }),
        ...(delegatedTo !== undefined && { delegatedTo }),
        ...(projectId !== undefined && { projectId }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      include: { contexts: { include: { context: true } }, project: true },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Update item error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await prisma.item.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
