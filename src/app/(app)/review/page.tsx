"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ReviewData {
  inboxCount: number;
  nextActionsCount: number;
  waitingForCount: number;
  stuckProjects: { id: string; name: string }[];
  lastReview: string | null;
}

interface Item {
  id: string;
  title: string;
  type: string;
  notes: string | null;
  createdAt: string;
}

type ReviewStep =
  | "intro"
  | "inbox"
  | "next_actions"
  | "projects"
  | "waiting"
  | "someday"
  | "capture"
  | "complete";

const STEPS: { key: ReviewStep; label: string; icon: string }[] = [
  { key: "intro", label: "はじめに", icon: "🔄" },
  { key: "inbox", label: "インボックス", icon: "📥" },
  { key: "next_actions", label: "次のアクション", icon: "▶️" },
  { key: "projects", label: "プロジェクト", icon: "📁" },
  { key: "waiting", label: "連絡待ち", icon: "⏳" },
  { key: "someday", label: "いつか/多分", icon: "💭" },
  { key: "capture", label: "新しい収集", icon: "💡" },
  { key: "complete", label: "完了", icon: "🎉" },
];

export default function ReviewPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<ReviewStep>("intro");
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [nextActions, setNextActions] = useState<Item[]>([]);
  const [waitingItems, setWaitingItems] = useState<Item[]>([]);
  const [somedayItems, setSomedayItems] = useState<Item[]>([]);
  const [captureText, setCaptureText] = useState("");
  const [capturedItems, setCapturedItems] = useState<string[]>([]);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    void Promise.all([
      fetch("/api/review").then((response) => response.json() as Promise<ReviewData>),
      fetch("/api/items?type=next_action").then((response) => response.json() as Promise<Item[]>),
      fetch("/api/items?type=waiting_for").then((response) => response.json() as Promise<Item[]>),
      fetch("/api/items?type=someday_maybe").then(
        (response) => response.json() as Promise<Item[]>,
      ),
    ]).then(([review, nextActionItems, waitingForItems, somedayMaybeItems]) => {
      setReviewData(review);
      setNextActions(nextActionItems);
      setWaitingItems(waitingForItems);
      setSomedayItems(somedayMaybeItems);
    });
  }, []);

  const stepIndex = STEPS.findIndex((step) => step.key === currentStep);

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].key);
    }
  };

  const goPrev = () => {
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].key);
    }
  };

  const completeItem = async (id: string) => {
    await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "done", completedAt: new Date().toISOString() }),
    });
    setNextActions((prev) => prev.filter((item) => item.id !== id));
    setWaitingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const captureItem = async () => {
    if (!captureText.trim()) return;
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: captureText.trim() }),
    });
    setCapturedItems((prev) => [...prev, captureText.trim()]);
    setCaptureText("");
  };

  const completeReview = async () => {
    await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: reviewNotes || null,
        summary: {
          inboxCleared: reviewData?.inboxCount === 0,
          nextActionsReviewed: nextActions.length,
          stuckProjects: reviewData?.stuckProjects.length || 0,
          newItemsCaptured: capturedItems.length,
        },
      }),
    });
    router.push("/");
  };

  if (!reviewData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">🔄 週次レビュー</h1>

      <div className="flex gap-1">
        {STEPS.map((step, index) => (
          <div
            key={step.key}
            className={`h-2 flex-1 rounded-full transition-colors ${
              index <= stepIndex ? "bg-blue-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <div className="text-center text-sm text-gray-500">
        {STEPS[stepIndex].icon} {STEPS[stepIndex].label}（{stepIndex + 1}/{STEPS.length}）
      </div>

      <div className="card min-h-[300px] p-6">
        {currentStep === "intro" && (
          <div className="space-y-4 text-center">
            <div className="text-5xl">🔄</div>
            <h2 className="text-xl font-semibold">週次レビューを始めましょう</h2>
            <p className="text-gray-500">
              GTDシステムを最新に保つために、すべてのリストを見直します。
              {reviewData.lastReview
                ? ` 前回のレビュー: ${new Date(reviewData.lastReview).toLocaleDateString("ja-JP")}`
                : " まだレビューを行っていません。"}
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="card">
                <div className="text-2xl font-bold text-blue-600">{reviewData.inboxCount}</div>
                <div className="text-xs text-gray-500">インボックス</div>
              </div>
              <div className="card">
                <div className="text-2xl font-bold text-green-600">
                  {reviewData.nextActionsCount}
                </div>
                <div className="text-xs text-gray-500">次のアクション</div>
              </div>
              <div className="card">
                <div className="text-2xl font-bold text-yellow-600">
                  {reviewData.stuckProjects.length}
                </div>
                <div className="text-xs text-gray-500">停滞プロジェクト</div>
              </div>
            </div>
          </div>
        )}

        {currentStep === "inbox" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">📥 インボックスを空にする</h2>
            {reviewData.inboxCount > 0 ? (
              <>
                <p className="text-gray-500">
                  インボックスに{reviewData.inboxCount}件のアイテムがあります。処理しましょう。
                </p>
                <Link href="/process" className="btn-primary inline-block">
                  ⚡ 処理する
                </Link>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="mb-2 text-4xl">✅</div>
                <p className="font-medium text-green-600">インボックスは空です！</p>
              </div>
            )}
          </div>
        )}

        {currentStep === "next_actions" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">▶️ 次のアクションを見直す</h2>
            <p className="text-sm text-gray-500">
              完了したもの、不要になったものがないか確認しましょう
            </p>
            {nextActions.length === 0 ? (
              <p className="py-4 text-center text-gray-400">次のアクションはありません</p>
            ) : (
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {nextActions.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                  >
                    <button
                      onClick={() => void completeItem(item.id)}
                      className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-gray-300 hover:border-green-500"
                    />
                    <span className="text-sm">{item.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === "projects" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">📁 プロジェクトを見直す</h2>
            {reviewData.stuckProjects.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="mb-2 text-sm font-medium text-yellow-700">
                  ⚠️ 次のアクションがないプロジェクト:
                </p>
                <ul className="space-y-1">
                  {reviewData.stuckProjects.map((project) => (
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
            <Link href="/projects" className="text-sm text-blue-600 hover:underline">
              プロジェクト一覧を見る →
            </Link>
          </div>
        )}

        {currentStep === "waiting" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">⏳ 連絡待ちを見直す</h2>
            <p className="text-sm text-gray-500">フォローアップが必要なものはありますか？</p>
            {waitingItems.length === 0 ? (
              <p className="py-4 text-center text-gray-400">連絡待ちはありません</p>
            ) : (
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {waitingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                  >
                    <button
                      onClick={() => void completeItem(item.id)}
                      className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-gray-300 hover:border-green-500"
                    />
                    <span className="text-sm">{item.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === "someday" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">💭 いつか/多分を見直す</h2>
            <p className="text-sm text-gray-500">今やるべきものはありますか？</p>
            {somedayItems.length === 0 ? (
              <p className="py-4 text-center text-gray-400">いつか/多分リストは空です</p>
            ) : (
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {somedayItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                  >
                    <span className="text-sm">{item.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === "capture" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">💡 新しいアイテムを収集</h2>
            <p className="text-sm text-gray-500">レビュー中に思いついたことを記録しましょう</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={captureText}
                onChange={(e) => setCaptureText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void captureItem()}
                placeholder="新しいアイテム..."
                className="input-field flex-1"
              />
              <button onClick={() => void captureItem()} className="btn-primary">
                追加
              </button>
            </div>
            {capturedItems.length > 0 && (
              <ul className="space-y-1">
                {capturedItems.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span> {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {currentStep === "complete" && (
          <div className="space-y-4 text-center">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-semibold">レビュー完了！</h2>
            <p className="text-gray-500">
              お疲れ様でした。GTDシステムが最新の状態になりました。
            </p>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="今週のふりかえりメモ（任意）"
              className="input-field"
              rows={3}
            />
            <button onClick={() => void completeReview()} className="btn-primary w-full py-3 text-lg">
              🔄 レビューを記録する
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={goPrev}
          disabled={stepIndex === 0}
          className="btn-secondary disabled:opacity-30"
        >
          ← 前へ
        </button>
        {currentStep !== "complete" && (
          <button onClick={goNext} className="btn-primary">
            次へ →
          </button>
        )}
      </div>
    </div>
  );
}
