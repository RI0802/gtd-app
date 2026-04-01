"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード", icon: "📊" },
  { href: "/inbox", label: "インボックス", icon: "📥" },
  { href: "/process", label: "処理する", icon: "⚡" },
  { href: "/next-actions", label: "次のアクション", icon: "▶️" },
  { href: "/projects", label: "プロジェクト", icon: "📁" },
  { href: "/waiting-for", label: "連絡待ち", icon: "⏳" },
  { href: "/someday-maybe", label: "いつか/多分", icon: "💭" },
  { href: "/reference", label: "資料", icon: "📚" },
  { href: "/calendar", label: "カレンダー", icon: "📅" },
  { href: "/review", label: "週次レビュー", icon: "🔄" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">GTD App</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-gray-200 p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <span className="text-lg">⚙️</span>
          設定
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 w-full text-left"
        >
          <span className="text-lg">🚪</span>
          ログアウト
        </button>
      </div>
    </aside>
  );
}
