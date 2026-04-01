"use client";

import { useEffect, useState } from "react";

import Header from "@/components/layout/Header";

interface Item {
  id: string;
  title: string;
  notes: string | null;
  delegatedTo: string | null;
  createdAt: string;
  dueDate: string | null;
}

export default function WaitingForPage() {
  const [items, setItems] = useState<Item[]>([]);

  const fetchItems = async () => {
    const res = await fetch("/api/items?type=waiting_for");
    setItems((await res.json()) as Item[]);
  };

  const resolveItem = async (id: string) => {
    await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "done", completedAt: new Date().toISOString() }),
    });
    await fetchItems();
  };

  const moveToInbox = async (id: string) => {
    await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "inbox", delegatedTo: null }),
    });
    await fetchItems();
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const daysSince = (date: string) =>
    Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">⏳ 連絡待ち</h1>
          <span className="text-sm text-gray-500">{items.length}件</span>
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <div className="mb-4 text-5xl">✨</div>
            <p className="text-lg font-medium">連絡待ちはありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="card group flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{item.title}</div>
                  {item.delegatedTo && (
                    <div className="mt-0.5 text-sm text-blue-600">👤 {item.delegatedTo}</div>
                  )}
                  {item.notes && <p className="mt-0.5 text-sm text-gray-500">{item.notes}</p>}
                  <div className="mt-2 flex gap-2 text-xs text-gray-400">
                    <span>{daysSince(item.createdAt)}日前に追加</span>
                    {item.dueDate && (
                      <span className="text-orange-500">
                        期限: {new Date(item.dueDate).toLocaleDateString("ja-JP")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => void resolveItem(item.id)}
                    className="btn-primary text-xs"
                    title="完了"
                  >
                    ✅ 完了
                  </button>
                  <button
                    onClick={() => void moveToInbox(item.id)}
                    className="btn-secondary text-xs"
                    title="自分でやる"
                  >
                    📥 戻す
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
