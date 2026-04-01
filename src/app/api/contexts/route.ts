import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const contexts = await prisma.context.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(contexts);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { name, icon, color } = await req.json();

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const context = await prisma.context.create({
      data: {
        userId: user.id,
        name,
        icon: icon || null,
        color: color || "#6B7280",
      },
    });

    return NextResponse.json(context, { status: 201 });
  } catch (error) {
    console.error("Create context error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
