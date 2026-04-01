import { hashSync } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_CONTEXTS = [
  { name: "@home", icon: "🏠", color: "#3B82F6" },
  { name: "@work", icon: "💼", color: "#10B981" },
  { name: "@phone", icon: "📱", color: "#F59E0B" },
  { name: "@computer", icon: "💻", color: "#8B5CF6" },
  { name: "@errands", icon: "🛒", color: "#F97316" },
  { name: "@anywhere", icon: "🌍", color: "#6B7280" },
];

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash: hashSync(password, 10),
      },
    });

    for (let i = 0; i < DEFAULT_CONTEXTS.length; i += 1) {
      const ctx = DEFAULT_CONTEXTS[i];

      await prisma.context.create({
        data: {
          userId: user.id,
          name: ctx.name,
          icon: ctx.icon,
          color: ctx.color,
          sortOrder: i,
        },
      });
    }

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
