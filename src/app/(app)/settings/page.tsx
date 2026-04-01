"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";

import Header from "@/components/layout/Header";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

type InstallPromptWindow = Window & {
  __pwaInstallPrompt?: BeforeInstallPromptEvent;
};

function decodeBase64Url(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);

  for (const [index, char] of Array.from(raw).entries()) {
    output[index] = char.charCodeAt(0);
  }

  return output;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      alert("このブラウザは通知をサポートしていません");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      setNotificationsEnabled(true);

      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

          if (vapidKey) {
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: decodeBase64Url(vapidKey),
            });

            await fetch("/api/push/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(subscription),
            });
          }
        } catch (err) {
          console.error("Push subscription error:", err);
        }
      }

      new Notification("GTD App", {
        body: "通知が有効になりました！",
        icon: "/icons/icon-192.png",
      });
    }
  };

  const installPWA = () => {
    const deferredPrompt = (window as InstallPromptWindow).__pwaInstallPrompt;

    if (deferredPrompt) {
      void deferredPrompt.prompt();
      return;
    }

    alert(
      "ホーム画面に追加するには:\n\n" +
        "iOS: Safariで「共有」→「ホーム画面に追加」\n" +
        "Android: Chromeのメニュー →「ホーム画面に追加」",
    );
  };

  return (
    <>
      <Header />
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-bold">⚙️ 設定</h1>

        <div className="card space-y-3">
          <h2 className="font-semibold">👤 プロフィール</h2>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-500">名前:</span> {session?.user?.name || "未設定"}
            </p>
            <p>
              <span className="text-gray-500">メール:</span> {session?.user?.email}
            </p>
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">🔔 通知</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">プッシュ通知</p>
              <p className="text-xs text-gray-500">
                期限のリマインダーやレビュー通知を受け取れます
              </p>
            </div>
            {notificationsEnabled ? (
              <span className="text-sm font-medium text-green-600">✅ 有効</span>
            ) : (
              <button onClick={() => void enableNotifications()} className="btn-primary text-sm">
                有効にする
              </button>
            )}
          </div>
          {notificationPermission === "denied" && (
            <p className="text-xs text-red-500">
              通知がブロックされています。ブラウザの設定から許可してください。
            </p>
          )}
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">📅 Googleカレンダー連携</h2>
          <p className="text-sm text-gray-500">
            Googleカレンダーと連携すると、予定を自動的に同期できます。
          </p>
          <button className="btn-secondary text-sm" disabled>
            🔗 Googleアカウントと連携（近日公開）
          </button>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">📱 モバイルアプリ</h2>
          <p className="text-sm text-gray-500">
            ホーム画面に追加すると、ネイティブアプリのように使えます。
          </p>
          <button onClick={installPWA} className="btn-secondary text-sm">
            📲 ホーム画面に追加
          </button>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">⌨️ キーボードショートカット</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">クイック収集</span>
              <kbd className="rounded bg-gray-100 px-2 py-0.5 text-xs">N</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">インボックス</span>
              <kbd className="rounded bg-gray-100 px-2 py-0.5 text-xs">G I</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">処理</span>
              <kbd className="rounded bg-gray-100 px-2 py-0.5 text-xs">G P</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">次のアクション</span>
              <kbd className="rounded bg-gray-100 px-2 py-0.5 text-xs">G A</kbd>
            </div>
          </div>
        </div>

        <div className="card">
          <button
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="btn-danger w-full"
          >
            🚪 ログアウト
          </button>
        </div>
      </div>
    </>
  );
}
