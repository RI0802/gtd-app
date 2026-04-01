"use client";

import { useEffect, useState } from "react";

import Header from "@/components/layout/Header";

interface Item {
  id: string;
  title: string;
  notes: string | null;
  createdAt: string;
}

export default function SomedayMaybePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [newTitle, setNewTitle] = useState("");

  const fetchItems = async () => {
    const res = await fetch("/api/items?type=someday_maybe");
    setItems((await res.json()) as Item[]);
  };

  const addItem = async (title: string) => {
    if (!title.trim()) return;
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), type: "someday_maybe" }),
    });
    setNewTitle("");
    await fetchItems();
  };

  const activateItem = async (id: string) => {
    await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "inbox" }),
    });
    await fetchItems();
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    await fetchItems();
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">💭 いつか/多分</h1>
          <span className="text-sm text-gray-500">{items.length}件</span>
        </div>

        <div className="card">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void addItem(newTitle)}
              placeholder="いつかやりたいこと..."
              className="input-field flex-1"
            />
            <button onClick={() => void addItem(newTitle)} className="btn-primary">
              追加
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <div className="mb-4 text-5xl">💭</div>
            <p className="text-lg font-medium">アイデアを溜めておきましょう</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="card group flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{item.title}</div>
                  {item.notes && <p className="mt-0.5 text-sm text-gray-500">{item.notes}</p>}
                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => void activateItem(item.id)}
                    className="btn-primary text-xs"
                  >
                    📥 やる
                  </button>
                  <button
                    onClick={() => void deleteItem(item.id)}
                    className="btn-danger text-xs"
                  >
                    🗑️
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
