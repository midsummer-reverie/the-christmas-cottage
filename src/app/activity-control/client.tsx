"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setActivityLock } from "./actions";
import type { ControlledActivityId } from "@/lib/activity-catalog";

type ActivityRow = { id: ControlledActivityId; title: string; href: string; icon: string; note: string; isLocked: boolean };

export default function ActivityControlClient({ activities }: { activities: ActivityRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  async function toggle(activity: ActivityRow) {
    setBusyId(activity.id);
    setMessage("");
    const result = await setActivityLock(activity.id, !activity.isLocked);
    setBusyId(null);
    setMessage(result.message);
    if (result.ok) router.refresh();
  }

  return <main className="activity-control-page">
    <header className="activity-control-header"><Link href="/?view=activities">← กลับไปกระดาน</Link><span>✳ THE CHRISTMAS COTTAGE</span><b>ADMIN · CONTROL ROOM</b></header>
    <section className="activity-control-shell">
      <div className="control-room-window" aria-hidden="true">❄　✦　❄</div>
      <span className="activity-control-kicker">THE LITTLE ROOM BEHIND THE BOARD</span>
      <h1>ห้องควบคุมกิจกรรม</h1>
      <p className="activity-control-intro">ล็อกกิจกรรมไว้ก่อนถึงเวลาเปิดเผย เมื่อพร้อมแล้วค่อยปลดกลอนให้ทุกคนเข้ามาได้</p>
      {message && <p className="activity-control-feedback" role="status">{message}</p>}
      <div className="activity-control-list">{activities.map((activity) => <article className={`activity-control-card ${activity.isLocked ? "is-locked" : "is-open"}`} key={activity.id}>
        <span className="activity-control-icon" aria-hidden="true">{activity.isLocked ? "🔒" : activity.icon}</span>
        <div className="activity-control-copy"><h2>{activity.title}</h2><p>{activity.isLocked ? "ซ่อนอยู่หลังม่านหิมะ · ผู้เข้าชมจะเห็นหน้ารอเปิด" : "เปิดให้ทุกคนเข้าชมได้แล้ว"}</p><small>{activity.note}</small></div>
        <button className={`activity-lock-toggle ${activity.isLocked ? "locked" : "unlocked"}`} type="button" aria-pressed={activity.isLocked} disabled={busyId !== null} onClick={() => void toggle(activity)}>
          <span aria-hidden="true">{activity.isLocked ? "🔒" : "🔓"}</span>{busyId === activity.id ? "กำลังเปลี่ยน…" : activity.isLocked ? "เปิดเผยกิจกรรม" : "ล็อกไว้ก่อน"}
        </button>
      </article>)}</div>
      <div className="activity-control-footer">ของขวัญที่ดีที่สุด บางทีก็ต้องรอเวลาที่เหมาะสม ✨</div>
    </section>
  </main>;
}
