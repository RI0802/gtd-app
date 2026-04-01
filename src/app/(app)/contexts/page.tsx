"use client";

import { useEffect, useState } from "react";

import Header from "@/components/layout/Header";

interface Context {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  sortOrder: number;
}

export default function ContextsPage() {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#6B7280");

  const fetchContexts = async () => {
    const res = await fetch("/api/contexts");
    setContexts((await res.json()) as Context[]);
  };

  const addContext = async () => {
    if (!name.trim()) return;

    await fetch("/api/contexts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), icon: icon || null, color }),
    });

    resetForm();
    await fetchContexts();
  };

  const updateContext = async () => {
    if (!editingId || !name.trim()) return;

    await fetch(`/api/contexts/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), icon: icon || null, color }),
    });

    resetForm();
    await fetchContexts();
  };

  const deleteContext = async (id: string) => {
    if (!window.confirm("このコンテキストを削除しますか？")) return;

    await fetch(`/api/contexts/${id}`, { method: "DELETE" });
    await fetchContexts();
  };

  const startEdit = (ctx: Context) => {
    setEditingId(ctx.id);
    setName(ctx.name);
    setIcon(ctx.icon || "");
    setColor(ctx.color);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setIcon("");
    setColor("#6B7280");
  };

  useEffect(() => {
    void fetchContexts();
  }, []);

  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🏷️ コンテキスト</h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="btn-primary text-sm"
          >
            ＋ 追加
          </button>
        </div>

        <p className="text-sm text-gray-500">
          コンテキストは「どこで」「何を使って」タスクを実行するかを表します。
          次のアクションをコンテキストでフィルタリングできます。
        </p>

        {showForm && (
          <div className="card space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">名前</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="@office"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  アイコン
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="🏢"
                  className="input-field"
                  maxLength={2}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border"
                />
                <span className="text-sm text-gray-500">{color}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void (editingId ? updateContext() : addContext())}
                className="btn-primary"
              >
                {editingId ? "更新" : "作成"}
              </button>
              <button onClick={resetForm} className="btn-secondary">
                キャンセル
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {contexts.map((ctx) => (
            <div key={ctx.id} className="card group flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm text-white"
                  style={{ backgroundColor: ctx.color }}
                >
                  {ctx.icon || ctx.name[0]}
                </span>
                <span className="font-medium">{ctx.name}</span>
              </div>
              <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => startEdit(ctx)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ✏️ 編集
                </button>
                <button
                  onClick={() => void deleteContext(ctx.id)}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  🗑️ 削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
