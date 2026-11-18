"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import "../sign-in/auth.css";

export default function ResetPasswordPage() {
  const [notice, setNotice] = useState("");
  const [isError, setIsError] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setIsError(false);
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token || params.has("error")) {
      setIsError(true);
      setNotice("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่อีกครั้ง");
      return;
    }
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setBusy(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) throw new Error(result.error.message ?? "ตั้งรหัสผ่านใหม่ไม่สำเร็จ");
      setDone(true);
      setNotice("ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว ตอนนี้เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย");
    } catch (error) {
      setIsError(true);
      setNotice(error instanceof Error ? error.message : "ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาขอลิงก์ใหม่");
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page"><div className="auth-card">
    <Link className="auth-back" href="/sign-in">← กลับไปเข้าสู่ระบบ</Link>
    <div className="auth-mark">✳</div><div className="auth-eyebrow">Northwood Christmas Co.</div>
    <h1>ตั้งรหัสผ่านใหม่</h1>
    <p className="auth-lead">ตั้งรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษรเพื่อกลับเข้าบัญชีของคุณ</p>
    {done ? <><div className="auth-notice" role="status">{notice}</div><Link className="reset-login-link" href="/sign-in">ไปหน้าเข้าสู่ระบบ</Link></> : <form onSubmit={submit} className="auth-form">
      <label>รหัสผ่านใหม่<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /><small>อย่างน้อย 8 ตัวอักษร</small></label>
      {notice && <div className={`auth-notice ${isError ? "auth-notice-error" : ""}`} role={isError ? "alert" : "status"} aria-live="polite">{notice}</div>}
      <button className="auth-submit" disabled={busy}>{busy ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}</button>
    </form>}
    {!done && <Link className="reset-request-link" href="/sign-in">ขอลิงก์รีเซ็ตใหม่</Link>}
  </div></main>;
}
