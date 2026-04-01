"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Header from "@/components/layout/Header";

interface DashboardItem {
  id: string;
  title: string;
  type: string;
  dueDate: string | null;
  scheduledDate: string | null;
}

interface OverdueItem {
  id: string;
  title: string;
  dueDate: string;
}

interface DashboardData {
  inboxCount: number;
  nextActionsCount: number;
  waitingForCount: number;
  stuckProjects: { id: string; name: string }[];
  lastReview: string | null;
  todayItems: DashboardItem[];
  overdueItems: OverdueItem[];
}

interface ApiItem {
  id: string;
  title: string;
  type: string;
  dueDate: string | null;
  scheduledDate: string | null;
}

interface ReviewData {
  inboxCount: number;
  nextActionsCount: number;
  waitingForCount: number;
  stuckProjects: { id: string; name: string }[];
  lastReview: string | null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboard = async () => {
    const [reviewRes, itemsRes] = await Promise.all([
      fetch("/api/review"),
      fetch("/api/items"),
    ]);
    const reviewData = (await reviewRes.json()) as ReviewData;
    const allItems = (await itemsRes.json()) as ApiItem[];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayItems = allItems.filter((item) => {
      if (item.type === "done" || item.type === "trash") return false;
      const due = item.dueDate ? new Date(item.dueDate) : null;
      const sched = item.scheduledDate ? new Date(item.scheduledDate) : null;
      return Boolean(
        (due && due >= today && due < tomorrow) ||
          (sched && sched >= today && sched < tomorrow),
      );
    });

    const overdueItems = allItems
      .filter((item): item is ApiItem & { dueDate: string } => {
        if (item.type === "done" || item.type === "trash") return false;
        const due = item.dueDate ? new Date(item.dueDate) : null;
        return Boolean(due && due < today && item.dueDate);
      })
      .map((item) => ({
        id: item.id,
        title: item.title,
        dueDate: item.dueDate,
      }));

    setData({
      ...reviewData,
      todayItems,
      overdueItems,
    });
  };

  const handleQuickCapture = async (title: string) => {
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    await fetchDashboard();
  };

  useEffect(() => {
    void fetchDashboard();
  }, []);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const daysSinceReview = data.lastReview
    ? Math.floor(
        (Date.now() - new Date(data.lastReview).getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <>
      <Header onQuickCapture={handleQuickCapture} />
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link href="/inbox" className="card transition-shadow hover:shadow-md">
            <div className="text-3xl font-bold text-blue-600">{data.inboxCount}</div>
            <div className="mt-1 text-sm text-gray-500">📥 インボックス</div>
            {data.inboxCount > 0 && (
              <div className="mt-1 text-xs text-orange-500">処理が必要です</div>
            )}
          </Link>
          <Link href="/next-actions" className="card transition-shadow hover:shadow-md">
            <div className="text-3xl font-bold text-green-600">{data.nextActionsCount}</div>
            <div className="mt-1 text-sm text-gray-500">▶️ 次のアクション</div>
          </Link>
          <Link href="/waiting-for" className="card transition-shadow hover:shadow-md">
            <div className="text-3xl font-bold text-yellow-600">{data.waitingForCount}</div>
            <div className="mt-1 text-sm text-gray-500">⏳ 連絡待ち</div>
          </Link>
          <Link href="/review" className="card transition-shadow hover:shadow-md">
            <div className="text-3xl font-bold text-purple-600">
              {daysSinceReview !== null ? `${daysSinceReview}日` : "—"}
            </div>
            <div className="mt-1 text-sm text-gray-500">🔄 前回レビュー</div>
            {daysSinceReview !== null && daysSinceReview > 7 && (
              <div className="mt-1 text-xs text-red-500">レビューが必要です</div>
            )}
          </Link>
        </div>

        {data.overdueItems.length > 0 && (
          <div className="card border-red-200 bg-red-50">
            <h2 className="mb-3 font-semibold text-red-700">
              ⚠️ 期限切れ ({data.overdueItems.length}件)
            </h2>
            <ul className="space-y-2">
              {data.overdueItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.title}</span>
                  <span className="text-xs text-red-500">
                    {new Date(item.dueDate).toLocaleDateString("ja-JP")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card">
          <h2 className="mb-3 font-semibold">📌 今日のタスク</h2>
          {data.todayItems.length === 0 ? (
            <p className="text-sm text-gray-400">今日の予定はありません</p>
          ) : (
            <ul className="space-y-2">
              {data.todayItems.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-sm">
                  <span className="text-blue-500">•</span>
                  <span>{item.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {data.stuckProjects.length > 0 && (
          <div className="card border-yellow-200 bg-yellow-50">
            <h2 className="mb-3 font-semibold text-yellow-700">
              🚧 次のアクションがないプロジェクト ({data.stuckProjects.length}件)
            </h2>
            <ul className="space-y-2">
              {data.stuckProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {project.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
