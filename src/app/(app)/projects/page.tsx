"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Header from "@/components/layout/Header";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  items: { id: string; type: string; title: string }[];
  _count: { items: number };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDue, setNewDue] = useState("");

  const fetchProjects = async () => {
    const res = await fetch("/api/projects?status=active");
    setProjects((await res.json()) as Project[]);
  };

  const addProject = async () => {
    if (!newName.trim()) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        description: newDesc.trim() || null,
        dueDate: newDue || null,
      }),
    });
    setNewName("");
    setNewDesc("");
    setNewDue("");
    setShowForm(false);
    await fetchProjects();
  };

  useEffect(() => {
    void fetchProjects();
  }, []);

  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">📁 プロジェクト</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
            ＋ 新規プロジェクト
          </button>
        </div>

        {showForm && (
          <div className="card space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="プロジェクト名（望む結果を具体的に）"
              className="input-field"
              autoFocus
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="説明（任意）"
              className="input-field"
              rows={2}
            />
            <input
              type="date"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
              className="input-field"
            />
            <div className="flex gap-2">
              <button onClick={() => void addProject()} className="btn-primary">
                作成
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">
                キャンセル
              </button>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <div className="mb-4 text-5xl">📁</div>
            <p className="text-lg font-medium">プロジェクトはまだありません</p>
            <p className="mt-1 text-sm">複数のステップが必要な成果物を登録しましょう</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const nextActions = project.items.filter((item) => item.type === "next_action");
              const hasNoNextAction = nextActions.length === 0;

              return (
                <Link key={project.id} href={`/projects/${project.id}`} className="block">
                  <div
                    className={`card transition-shadow hover:shadow-md ${
                      hasNoNextAction ? "border-yellow-300 bg-yellow-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{project.name}</h3>
                          {hasNoNextAction && (
                            <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-xs text-yellow-800">
                              ⚠️ 次のアクションなし
                            </span>
                          )}
                        </div>
                        {project.description && (
                          <p className="mt-1 text-sm text-gray-500">{project.description}</p>
                        )}
                        <div className="mt-2 flex gap-3 text-xs text-gray-400">
                          <span>📋 {project._count.items}件のアイテム</span>
                          <span>▶️ {nextActions.length}件のアクション</span>
                          {project.dueDate && (
                            <span className="text-orange-500">
                              📅 {new Date(project.dueDate).toLocaleDateString("ja-JP")}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-400">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
