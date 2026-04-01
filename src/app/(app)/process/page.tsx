"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Context {
  id: string;
  name: string;
  icon: string | null;
  color: string;
}

interface Project {
  id: string;
  name: string;
}

interface Item {
  id: string;
  title: string;
  notes: string | null;
}

type Step = "review" | "two_min" | "delegate" | "schedule" | "assign";

export default function ProcessPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<Step>("review");
  const [contexts, setContexts] = useState<Context[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [delegatedTo, setDelegatedTo] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [energy, setEnergy] = useState("");
  const [timeEstimate, setTimeEstimate] = useState("");

  useEffect(() => {
    void Promise.all([
      fetch("/api/items?type=inbox").then((response) => response.json() as Promise<Item[]>),
      fetch("/api/contexts").then((response) => response.json() as Promise<Context[]>),
      fetch("/api/projects?status=active").then(
        (response) => response.json() as Promise<Project[]>,
      ),
    ]).then(([itemsData, contextsData, projectsData]) => {
      setItems(itemsData);
      setContexts(contextsData);
      setProjects(projectsData);
    });
  }, []);

  const current = items[currentIndex];

  const resetForm = () => {
    setStep("review");
    setSelectedContexts([]);
    setSelectedProject("");
    setDelegatedTo("");
    setScheduledDate("");
    setDueDate("");
    setEnergy("");
    setTimeEstimate("");
  };

  const nextItem = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((index) => index + 1);
      resetForm();
      return;
    }

    router.push("/");
  };

  const updateItem = async (data: Record<string, unknown>) => {
    if (!current) return;

    await fetch(`/api/items/${current.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    nextItem();
  };

  const handleNotActionable = (type: "reference" | "someday_maybe" | "trash") => {
    if (!current) return;

    if (type === "trash") {
      void fetch(`/api/items/${current.id}`, { method: "DELETE" }).then(() => nextItem());
      return;
    }

    void updateItem({ type });
  };

  const handleDoneNow = () => {
    void updateItem({ type: "done", completedAt: new Date().toISOString() });
  };

  const handleDelegate = () => {
    void updateItem({ type: "waiting_for", delegatedTo });
  };

  const handleSchedule = () => {
    void updateItem({ type: "calendar", scheduledDate, dueDate: dueDate || undefined });
  };

  const handleNextAction = () => {
    void updateItem({
      type: "next_action",
      contextIds: selectedContexts,
      projectId: selectedProject || null,
      energy: energy || null,
      timeEstimate: timeEstimate ? Number.parseInt(timeEstimate, 10) : null,
      dueDate: dueDate || null,
    });
  };

  const toggleContext = (id: string) => {
    setSelectedContexts((previous) =>
      previous.includes(id)
        ? previous.filter((contextId) => contextId !== id)
        : [...previous, id],
    );
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-6">
        <div className="py-16 text-center text-gray-400">
          <div className="mb-4 text-5xl">✅</div>
          <p className="text-lg font-medium">処理するアイテムはありません</p>
          <p className="mt-2 text-sm">インボックスは空です。素晴らしい！</p>
          <button onClick={() => router.push("/inbox")} className="btn-primary mt-4">
            インボックスへ
          </button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-2xl p-4 py-16 text-center md:p-6">
        <div className="mb-4 text-5xl">🎉</div>
        <p className="text-lg font-medium">すべて処理完了！</p>
        <button onClick={() => router.push("/")} className="btn-primary mt-4">
          ダッシュボードへ
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">⚡ 処理する</h1>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {items.length}
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-blue-500 transition-all"
          style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
        />
      </div>

      <div className="card p-6">
        <h2 className="mb-2 text-xl font-semibold">{current.title}</h2>
        {current.notes && <p className="text-gray-500">{current.notes}</p>}
      </div>

      {step === "review" && (
        <div className="card space-y-4 p-6">
          <h3 className="text-lg font-semibold">これはアクションが必要ですか？</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setStep("two_min")} className="btn-primary py-4 text-center">
              ✅ はい、アクションが必要
            </button>
            <div className="space-y-2">
              <button
                onClick={() => handleNotActionable("reference")}
                className="btn-secondary w-full"
              >
                📚 資料として保存
              </button>
              <button
                onClick={() => handleNotActionable("someday_maybe")}
                className="btn-secondary w-full"
              >
                💭 いつか/多分
              </button>
              <button
                onClick={() => handleNotActionable("trash")}
                className="btn-danger w-full"
              >
                🗑️ 不要（削除）
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "two_min" && (
        <div className="card space-y-4 p-6">
          <h3 className="text-lg font-semibold">2分以内にできますか？</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleDoneNow} className="btn-primary py-4">
              ⚡ はい → 今すぐやる！
            </button>
            <button onClick={() => setStep("delegate")} className="btn-secondary py-4">
              ⏱️ いいえ → 2分以上かかる
            </button>
          </div>
        </div>
      )}

      {step === "delegate" && (
        <div className="card space-y-4 p-6">
          <h3 className="text-lg font-semibold">自分がやるべきですか？</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setStep("schedule")} className="btn-primary py-4">
              👤 自分でやる
            </button>
            <div className="space-y-2">
              <input
                type="text"
                value={delegatedTo}
                onChange={(e) => setDelegatedTo(e.target.value)}
                placeholder="委任先の名前"
                className="input-field"
              />
              <button
                onClick={handleDelegate}
                disabled={!delegatedTo}
                className="btn-secondary w-full disabled:opacity-50"
              >
                📤 委任する（連絡待ちへ）
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "schedule" && (
        <div className="card space-y-4 p-6">
          <h3 className="text-lg font-semibold">いつやりますか？</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setStep("assign")} className="btn-primary py-4">
              📋 できるだけ早く
            </button>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">日時を指定:</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="input-field"
              />
              <button
                onClick={handleSchedule}
                disabled={!scheduledDate}
                className="btn-secondary w-full disabled:opacity-50"
              >
                📅 カレンダーへ
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "assign" && (
        <div className="card space-y-4 p-6">
          <h3 className="text-lg font-semibold">コンテキスト・詳細を設定</h3>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">コンテキスト</label>
            <div className="flex flex-wrap gap-2">
              {contexts.map((context) => (
                <button
                  key={context.id}
                  onClick={() => toggleContext(context.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedContexts.includes(context.id)
                      ? "border-transparent text-white"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                  style={
                    selectedContexts.includes(context.id)
                      ? { backgroundColor: context.color }
                      : undefined
                  }
                >
                  {context.icon} {context.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">プロジェクト</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="input-field"
            >
              <option value="">なし</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">エネルギー</label>
              <select
                value={energy}
                onChange={(e) => setEnergy(e.target.value)}
                className="input-field"
              >
                <option value="">未設定</option>
                <option value="low">🔋 低い</option>
                <option value="medium">🔋🔋 普通</option>
                <option value="high">🔋🔋🔋 高い</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                所要時間（分）
              </label>
              <input
                type="number"
                value={timeEstimate}
                onChange={(e) => setTimeEstimate(e.target.value)}
                placeholder="15"
                className="input-field"
                min={1}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">期限（任意）</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input-field"
            />
          </div>

          <button onClick={handleNextAction} className="btn-primary w-full py-3 text-lg">
            ▶️ 次のアクションに追加
          </button>
        </div>
      )}

      <div className="text-center">
        <button onClick={nextItem} className="text-sm text-gray-400 hover:text-gray-600">
          スキップ →
        </button>
      </div>
    </div>
  );
}
