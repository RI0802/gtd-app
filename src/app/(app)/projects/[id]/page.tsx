"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Header from "@/components/layout/Header";

interface Item {
  id: string;
  title: string;
  type: string;
  notes: string | null;
  contexts: { context: { id: string; name: string; icon: string | null; color: string } }[];
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  items: Item[];
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const fetchProject = async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) {
      router.push("/projects");
      return;
    }

    const data = (await res.json()) as Project;
    setProject(data);
    setEditName(data.name);
    setEditDesc(data.description || "");
  };

  const addItem = async () => {
    if (!newItemTitle.trim()) return;
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newItemTitle.trim(), type: "next_action", projectId: id }),
    });
    setNewItemTitle("");
    await fetchProject();
  };

  const completeItem = async (itemId: string) => {
    await fetch(`/api/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "done", completedAt: new Date().toISOString() }),
    });
    await fetchProject();
  };

  const updateProject = async () => {
    await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, description: editDesc || null }),
    });
    setEditing(false);
    await fetchProject();
  };

  const completeProject = async () => {
    await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    router.push("/projects");
  };

  const deleteProject = async () => {
    if (!confirm("このプロジェクトを削除しますか？")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.push("/projects");
  };

  useEffect(() => {
    void fetchProject();
  }, [id]);

  if (!project) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const groupedItems = {
    next_action: project.items.filter((item) => item.type === "next_action"),
    waiting_for: project.items.filter((item) => item.type === "waiting_for"),
    inbox: project.items.filter((item) => item.type === "inbox"),
    done: project.items.filter((item) => item.type === "done"),
  };

  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <button
          onClick={() => router.push("/projects")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← プロジェクト一覧
        </button>

        {editing ? (
          <div className="card space-y-3">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input-field text-xl font-bold"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="input-field"
              rows={2}
              placeholder="説明"
            />
            <div className="flex gap-2">
              <button onClick={() => void updateProject()} className="btn-primary">
                保存
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary">
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                {project.description && <p className="mt-1 text-gray-500">{project.description}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ✏️ 編集
                </button>
                <button
                  onClick={() => void completeProject()}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  ✅ 完了
                </button>
                <button
                  onClick={() => void deleteProject()}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void addItem()}
              placeholder="次のアクションを追加..."
              className="input-field flex-1"
            />
            <button onClick={() => void addItem()} className="btn-primary">
              追加
            </button>
          </div>
        </div>

        {groupedItems.next_action.length > 0 && (
          <div>
            <h2 className="mb-2 font-semibold text-gray-700">
              ▶️ 次のアクション ({groupedItems.next_action.length})
            </h2>
            <div className="space-y-2">
              {groupedItems.next_action.map((item) => (
                <div key={item.id} className="card flex items-center gap-3">
                  <button
                    onClick={() => void completeItem(item.id)}
                    className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-gray-300 hover:border-green-500"
                  />
                  <span className="font-medium">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupedItems.waiting_for.length > 0 && (
          <div>
            <h2 className="mb-2 font-semibold text-gray-700">
              ⏳ 連絡待ち ({groupedItems.waiting_for.length})
            </h2>
            <div className="space-y-2">
              {groupedItems.waiting_for.map((item) => (
                <div key={item.id} className="card flex items-center gap-3">
                  <span className="text-yellow-500">⏳</span>
                  <span>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupedItems.done.length > 0 && (
          <div>
            <h2 className="mb-2 font-semibold text-gray-700">✅ 完了 ({groupedItems.done.length})</h2>
            <div className="space-y-2">
              {groupedItems.done.map((item) => (
                <div key={item.id} className="card flex items-center gap-3 opacity-50">
                  <span className="text-green-500">✅</span>
                  <span className="line-through">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupedItems.next_action.length === 0 && groupedItems.waiting_for.length === 0 && (
          <div className="card border-yellow-300 bg-yellow-50 py-6 text-center">
            <p className="font-medium text-yellow-700">
              ⚠️ このプロジェクトには次のアクションがありません
            </p>
            <p className="mt-1 text-sm text-yellow-600">
              GTDの原則: すべてのアクティブなプロジェクトには次のアクションが必要です
            </p>
          </div>
        )}
      </div>
    </>
  );
}
