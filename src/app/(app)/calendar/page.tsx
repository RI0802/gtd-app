"use client";

import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import jaLocale from "@fullcalendar/core/locales/ja";

import Header from "@/components/layout/Header";

interface Item {
  id: string;
  title: string;
  type: string;
  dueDate: string | null;
  scheduledDate: string | null;
  completedAt: string | null;
}

export default function CalendarPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const fetchItems = async () => {
    const res = await fetch("/api/items");
    const data = (await res.json()) as Item[];
    setItems(data.filter((item) => item.dueDate || item.scheduledDate));
  };

  const addCalendarItem = async () => {
    if (!newTitle.trim() || !newDate) return;

    const scheduledDate = newTime ? `${newDate}T${newTime}` : newDate;

    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        type: "calendar",
        scheduledDate,
      }),
    });

    setNewTitle("");
    setNewDate("");
    setNewTime("");
    setShowModal(false);
    await fetchItems();
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const events = useMemo(
    () =>
      items.map((item) => {
        const date = item.scheduledDate || item.dueDate;
        const isCompleted = item.type === "done";

        return {
          id: item.id,
          title: item.title,
          start: date!,
          backgroundColor: isCompleted
            ? "#9CA3AF"
            : item.type === "calendar"
              ? "#3B82F6"
              : "#F59E0B",
          borderColor: "transparent",
          textColor: "#fff",
          classNames: isCompleted ? ["line-through", "opacity-50"] : [],
        };
      }),
    [items],
  );

  const handleDateClick = (info: { dateStr: string }) => {
    setNewDate(info.dateStr);
    setShowModal(true);
  };

  return (
    <>
      <Header />
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">📅 カレンダー</h1>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
            ＋ 予定を追加
          </button>
        </div>

        <div className="card overflow-x-auto p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            locale={jaLocale}
            events={events}
            dateClick={handleDateClick}
            height="auto"
            buttonText={{
              today: "今日",
              month: "月",
              week: "週",
            }}
          />
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6">
              <h2 className="text-lg font-semibold">📅 予定を追加</h2>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="タイトル"
                className="input-field"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-600">日付</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600">時間（任意）</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary">
                  キャンセル
                </button>
                <button onClick={() => void addCalendarItem()} className="btn-primary">
                  追加
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-blue-500" /> カレンダー
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-yellow-500" /> 期限付きタスク
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-gray-400" /> 完了済み
          </div>
        </div>
      </div>
    </>
  );
}
