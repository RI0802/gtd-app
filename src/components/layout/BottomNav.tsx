"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/inbox", label: "収集", icon: "📥" },
  { href: "/next-actions", label: "実行", icon: "▶️" },
  { href: "/projects", label: "計画", icon: "📁" },
  { href: "/calendar", label: "予定", icon: "📅" },
  { href: "/review", label: "振返", icon: "🔄" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <ul className="flex justify-around items-center h-16">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                  isActive ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
