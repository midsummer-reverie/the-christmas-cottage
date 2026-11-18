"use client";

import { useState } from "react";
import { closePasswordHelpRequest, issueManualResetLink } from "./actions";

type Request = { id: string; email: string; createdAt: string; issuedAt: string | null; tokenExpiresAt: string | null; tokenUsedAt: string | null; accountDisplayName: string | null; displayName: string | null; discordUsername: string | null };

export default function PasswordHelpAdmin({ requests }: { requests: Request[] }) {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function issue(id: string) {
    setBusy(id); setMessage("");
    const result = await issueManualResetLink(id);
    setBusy(null);
    if (!result.ok) { setMessage(result.message ?? "สร้างลิงก์ไม่สำเร็จ"); return; }
    setLinks((current) => ({ ...current, [id]: result.link! }));
    setMessage(`สร้างลิงก์สำหรับ ${result.email} แล้ว คัดลอกและส่งให้ทาง Discord ส่วนตัว`);
  }

  async function copy(id: string) {
    const value = links[id];
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setMessage("คัดลอกลิงก์แล้ว ส่งให้เจ้าของบัญชีทาง Discord ได้เลย");
  }

  async function close(id: string) {
    setBusy(id); setMessage("");
    await closePasswordHelpRequest(id);
    setBusy(null);
    setMessage("ปิดคำขอแล้ว");
    window.location.reload();
  }

  return <div className="password-help-list">
    {message && <p className="activity-control-feedback" role="status">{message}</p>}
    {!requests.length && <p className="password-help-empty">ตอนนี้ยังไม่มีคำขอค้างอยู่ ☕</p>}
    {requests.map((request) => {
      const expired = request.tokenExpiresAt ? new Date(request.tokenExpiresAt).getTime() < Date.now() : false;
      const status = request.tokenUsedAt ? "ใช้แล้ว" : expired ? "ลิงก์หมดอายุ" : request.issuedAt ? "ส่งลิงก์แล้ว" : "รอตรวจสอบ";
      return <article className="password-help-item" key={request.id}>
        <header><div><span className="password-help-status">{status}</span><h2>{request.accountDisplayName || request.displayName || "บัญชีสมาชิก"}</h2></div><time>{new Date(request.createdAt).toLocaleString("th-TH")}</time></header>
        <p>อีเมล: <b>{request.email}</b></p>
        <p>Discord: <b>{request.discordUsername || "ไม่ได้ระบุ"}</b></p>
        {links[request.id] ? <div className="password-help-link"><input readOnly value={links[request.id]} aria-label="ลิงก์รีเซ็ตรหัสผ่าน"/><button type="button" onClick={() => void copy(request.id)}>คัดลอกลิงก์</button><small>ลิงก์นี้แสดงครั้งเดียว · หมดอายุใน 30 นาที</small></div> : null}
        <footer>
          {!request.tokenUsedAt && <button type="button" disabled={busy !== null} onClick={() => void issue(request.id)}>{busy === request.id ? "กำลังสร้าง…" : request.issuedAt ? "สร้างลิงก์ใหม่" : "ตรวจสอบแล้ว · สร้างลิงก์"}</button>}
          <button type="button" className="password-help-dismiss" disabled={busy !== null} onClick={() => void close(request.id)}>ปิดคำขอ</button>
        </footer>
      </article>;
    })}
  </div>;
}
