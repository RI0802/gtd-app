import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "active";

    const projects = await prisma.project.findMany({
      where: { userId: user.id, status },
      include: {
        items: {
          where: { type: { not: "done" } },
          select: { id: true, type: true, title: true },
        },
        _count: { select: { items: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(projects);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { name, description, dueDate } = await req.json();

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
