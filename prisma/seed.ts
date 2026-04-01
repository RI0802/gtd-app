import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const connectionUrl = process.env.DATABASE_URL;

if (!connectionUrl) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: connectionUrl,
  }),
});

const DEFAULT_CONTEXTS = [
  { name: "@home", icon: "🏠", color: "#3B82F6" },
  { name: "@work", icon: "💼", color: "#10B981" },
  { name: "@phone", icon: "📱", color: "#F59E0B" },
  { name: "@computer", icon: "💻", color: "#8B5CF6" },
  { name: "@errands", icon: "🛒", color: "#F97316" },
  { name: "@anywhere", icon: "🌍", color: "#6B7280" },
];

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@gtd.app" },
    update: {},
    create: {
      email: "demo@gtd.app",
      name: "Demo User",
      passwordHash: hashSync("demo1234", 10),
    },
  });

  for (let i = 0; i < DEFAULT_CONTEXTS.length; i++) {
    const ctx = DEFAULT_CONTEXTS[i];
    await prisma.context.upsert({
      where: { userId_name: { userId: user.id, name: ctx.name } },
      update: {},
      create: {
        userId: user.id,
        name: ctx.name,
        icon: ctx.icon,
        color: ctx.color,
        sortOrder: i,
      },
    });
  }

  console.log("Seed completed: demo user + default contexts created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
