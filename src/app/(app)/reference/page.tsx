"use client";

import { useEffect, useState } from "react";

import Header from "@/components/layout/Header";

interface Item {
  id: string;
  title: string;
  notes: string | null;
  createdAt: string;
}

export default function ReferencePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const fetchItems = async () => {
    const res = await fetch("/api/items?type=reference");
    setItems((await res.json()) as Item[]);
  };

  const addItem = async () => {
    if (!newTitle.trim()) return;
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        notes: newNotes.trim() || null,
        type: "reference",
      }),
    });
    setNewTitle("");
    setNewNotes("");
    setShowForm(false);
    await fetchItems();
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    await fetchItems();
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const filteredItems = search
    ? items.filter(
        (item) =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.notes?.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">📚 資料</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
            ＋ 追加
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 検索..."
          className="input-field"
        />

        {showForm && (
          <div className="card space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="タイトル"
              className="input-field"
              autoFocus
            />
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="メモ・内容..."
              className="input-field"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={() => void addItem()} className="btn-primary">
                保存
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">
                キャンセル
              </button>
            </div>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <div className="mb-4 text-5xl">📚</div>
            <p className="text-lg font-medium">資料はまだありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div key={item.id} className="card group">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{item.title}</div>
                    {item.notes && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">
                        {item.notes}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                  <button
                    onClick={() => void deleteItem(item.id)}
                    className="p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
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
