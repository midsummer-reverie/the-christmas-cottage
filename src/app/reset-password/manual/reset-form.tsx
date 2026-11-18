"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { consumeManualResetLink } from "@/app/password-help/actions";
import "../../sign-in/auth.css";

export default function ManualResetForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setError(false);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) { setError(true); setMessage("รหัสผ่านทั้งสองช่องไม่ตรงกัน"); setBusy(false); return; }
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    const result = await consumeManualResetLink(token, password);
    setBusy(false);
    if (!result.ok) { setError(true); setMessage(result.message); return; }
    setDone(true); setMessage(result.message);
  }

  return <main className="auth-page"><div className="auth-card">
    <Link className="auth-back" href="/sign-in">← กลับไปเข้าสู่ระบบ</Link>
    <div className="auth-mark">✳</div><div className="auth-eyebrow">Northwood Christmas Co.</div>
    <h1>ตั้งรหัสผ่านใหม่</h1>
    <p className="auth-lead">ลิงก์นี้ใช้ได้ครั้งเดียวและหมดอายุใน 30 นาที ตั้งรหัสผ่านใหม่อย่างน้อย 12 ตัวอักษร</p>
    {done ? <><div className="auth-notice" role="status">{message}</div><Link className="reset-login-link" href="/sign-in">ไปหน้าเข้าสู่ระบบ</Link></> : <form onSubmit={submit} className="auth-form">
      <label>รหัสผ่านใหม่<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
      <label>ยืนยันรหัสผ่านใหม่<input name="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
      {message && <div className={`auth-notice ${error ? "auth-notice-error" : ""}`} role={error ? "alert" : "status"}>{message}</div>}
      <button className="auth-submit" disabled={busy}>{busy ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}</button>
    </form>}
  </div></main>;
}
