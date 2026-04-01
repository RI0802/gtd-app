"use client";

import { useEffect, useState } from "react";

import Header from "@/components/layout/Header";

interface Context {
  id: string;
  name: string;
  icon: string | null;
  color: string;
}

interface ItemContext {
  context: Context;
}

interface Item {
  id: string;
  title: string;
  notes: string | null;
  energy: string | null;
  timeEstimate: number | null;
  dueDate: string | null;
  project: { id: string; name: string } | null;
  contexts: ItemContext[];
  createdAt: string;
}

export default function NextActionsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchData = async () => {
    const [itemsRes, ctxRes] = await Promise.all([
      fetch("/api/items?type=next_action"),
      fetch("/api/contexts"),
    ]);
    setItems((await itemsRes.json()) as Item[]);
    setContexts((await ctxRes.json()) as Context[]);
  };

  const handleQuickCapture = async (title: string) => {
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, type: "next_action" }),
    });
    await fetchData();
  };

  const completeItem = async (id: string) => {
    await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "done", completedAt: new Date().toISOString() }),
    });
    await fetchData();
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    await fetchData();
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const filteredItems =
    activeFilter === "all"
      ? items
      : items.filter((item) => item.contexts.some((ic) => ic.context.id === activeFilter));

  const energyLabel = (energy: string | null) => {
    if (energy === "low") return "🔋";
    if (energy === "medium") return "🔋🔋";
    if (energy === "high") return "🔋🔋🔋";
    return "";
  };

  return (
    <>
      <Header onQuickCapture={handleQuickCapture} />
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">▶️ 次のアクション</h1>
          <span className="text-sm text-gray-500">{filteredItems.length}件</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === "all"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 text-gray-600 hover:border-gray-400"
            }`}
          >
            すべて
          </button>
          {contexts.map((ctx) => (
            <button
              key={ctx.id}
              onClick={() => setActiveFilter(ctx.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === ctx.id
                  ? "border-transparent text-white"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              }`}
              style={activeFilter === ctx.id ? { backgroundColor: ctx.color } : undefined}
            >
              {ctx.icon} {ctx.name}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <div className="mb-4 text-5xl">🎯</div>
            <p className="text-lg font-medium">次のアクションはありません</p>
            <p className="mt-1 text-sm">インボックスを処理して追加しましょう</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div key={item.id} className="card group flex items-start gap-3">
                <button
                  onClick={() => void completeItem(item.id)}
                  className="mt-1 h-5 w-5 flex-shrink-0 rounded-full border-2 border-gray-300 transition-colors hover:border-green-500 hover:bg-green-50"
                  title="完了にする"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{item.title}</div>
                  {item.notes && (
                    <p className="mt-0.5 truncate text-sm text-gray-500">{item.notes}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.contexts.map((ic) => (
                      <span
                        key={ic.context.id}
                        className="rounded-full px-2 py-0.5 text-xs text-white"
                        style={{ backgroundColor: ic.context.color }}
                      >
                        {ic.context.icon} {ic.context.name}
                      </span>
                    ))}
                    {item.project && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        📁 {item.project.name}
                      </span>
                    )}
                    {item.energy && (
                      <span className="text-xs text-gray-400">{energyLabel(item.energy)}</span>
                    )}
                    {item.timeEstimate && (
                      <span className="text-xs text-gray-400">⏱️{item.timeEstimate}分</span>
                    )}
                    {item.dueDate && (
                      <span className="text-xs text-orange-500">
                        📅 {new Date(item.dueDate).toLocaleDateString("ja-JP")}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => void deleteItem(item.id)}
                  className="p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                  title="削除"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
