"use client";

import { useEffect, useRef, useState } from "react";

import Header from "@/components/layout/Header";

interface Item {
  id: string;
  title: string;
  notes: string | null;
  createdAt: string;
}

export default function InboxPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    const res = await fetch("/api/items?type=inbox");
    const data = (await res.json()) as Item[];
    setItems(data);
  };

  const addItem = async (title: string) => {
    if (!title.trim()) return;
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    setNewTitle("");
    inputRef.current?.focus();
    await fetchItems();
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    await fetchItems();
  };

  const updateNotes = async (id: string, notes: string) => {
    await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setEditingId(null);
    await fetchItems();
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  return (
    <>
      <Header onQuickCapture={addItem} />
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">📥 インボックス</h1>
          <span className="text-sm text-gray-500">{items.length}件</span>
        </div>

        <div className="card">
          <p className="mb-3 text-sm text-gray-500">
            頭の中にあることをすべて書き出しましょう
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void addItem(newTitle)}
              placeholder="気になること、やるべきこと、アイデア..."
              className="input-field flex-1"
              autoFocus
            />
            <button onClick={() => void addItem(newTitle)} className="btn-primary whitespace-nowrap">
              追加
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <div className="mb-4 text-5xl">🎉</div>
            <p className="text-lg font-medium">インボックスは空です！</p>
            <p className="mt-1 text-sm">素晴らしい。頭がスッキリしていますね。</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="card group flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{item.title}</div>
                  {editingId === item.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="input-field text-sm"
                        rows={2}
                        placeholder="メモを追加..."
                        autoFocus
                      />
                      <div className="mt-1 flex gap-2">
                        <button
                          onClick={() => void updateNotes(item.id, editNotes)}
                          className="btn-primary text-xs"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn-secondary text-xs"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {item.notes && <p className="mt-1 text-sm text-gray-500">{item.notes}</p>}
                      <div className="mt-1 text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleString("ja-JP")}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setEditNotes(item.notes || "");
                    }}
                    className="p-1 text-sm text-gray-400 hover:text-gray-600"
                    title="メモを編集"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => void deleteItem(item.id)}
                    className="p-1 text-sm text-gray-400 hover:text-red-500"
                    title="削除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-4 text-center">
              <a href="/process" className="btn-primary inline-block">
                ⚡ インボックスを処理する
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
