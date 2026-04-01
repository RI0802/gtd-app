"use client";

import { useState } from "react";

interface HeaderProps {
  onQuickCapture?: (title: string) => void;
}

export default function Header({ onQuickCapture }: HeaderProps) {
  const [showCapture, setShowCapture] = useState(false);
  const [captureText, setCaptureText] = useState("");

  const handleCapture = () => {
    if (captureText.trim() && onQuickCapture) {
      onQuickCapture(captureText.trim());
      setCaptureText("");
      setShowCapture(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-4">
        <h2 className="text-lg font-semibold md:hidden text-blue-600">GTD</h2>
        <button
          onClick={() => setShowCapture(!showCapture)}
          className="btn-primary text-sm flex items-center gap-1"
        >
          <span>＋</span> 収集
        </button>
      </div>
      {showCapture && (
        <div className="px-4 pb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={captureText}
              onChange={(e) => setCaptureText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCapture()}
              placeholder="気になることを入力..."
              className="input-field flex-1"
              autoFocus
            />
            <button onClick={handleCapture} className="btn-primary">
              追加
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
