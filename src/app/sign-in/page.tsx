"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { requestManualPasswordHelp } from "@/app/password-help/actions";
import "./auth.css";

function getSafeReturnTo() {
  const requested = new URLSearchParams(window.location.search).get("returnTo");
  if (!requested || !requested.startsWith("/") || requested.startsWith("//") || requested.includes("\\")) return "/";
  try {
    const target = new URL(requested, window.location.origin);
    return target.origin === window.location.origin ? `${target.pathname}${target.search}${target.hash}` : "/";
  } catch {
    return "/";
  }
}

export default function SignInPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up" | "forgot-password">("sign-in");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error">("success");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setNoticeType("success");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();
    const rawDiscordUsername = String(data.get("discordUsername") ?? "").trim();
    const discordUsername = rawDiscordUsername.startsWith("@") ? rawDiscordUsername : `@${rawDiscordUsername}`;

    try {
      if (mode === "forgot-password") {
        const result = await requestManualPasswordHelp(email);
        if (!result.ok) throw new Error(result.message);
        setNotice(result.message);
      } else if (mode === "sign-up") {
        if (!/^@[A-Za-z0-9._]{2,32}$/.test(discordUsername)) throw new Error("Discord Username ต้องมี 2–32 ตัวอักษร ใช้ตัวอักษร ตัวเลข จุด หรือ _");
        const result = await authClient.signUp.email({ name, email, password, discordUsername });
        if (result.error) throw new Error(result.error.message ?? "สมัครสมาชิกไม่สำเร็จ");
        setNotice(process.env.NODE_ENV === "development"
          ? "สร้างบัญชีแล้ว ตรวจลิงก์ยืนยันในหน้าต่าง Terminal ที่รันเว็บอยู่ แล้วเปิดลิงก์นั้นก่อนเข้าสู่ระบบ"
          : "ส่งอีเมลยืนยันแล้ว กรุณาเปิดอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ");
      } else {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) throw new Error(result.error.message ?? "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบแล้วลองอีกครั้ง");
        window.location.assign(getSafeReturnTo());
      }
    } catch (error) {
      setNoticeType("error");
      setNotice(error instanceof Error ? error.message : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link className="auth-back" href="/">← กลับไปหน้ากระท่อม</Link>
        <div className="auth-mark">✳</div>
        <div className="auth-eyebrow">Northwood Christmas Co.</div>
        <h1>{mode === "sign-in" ? "กลับมาที่กระท่อม" : mode === "sign-up" ? "มาร่วมกิจกรรมกัน" : "ลืมรหัสผ่านหรือเปล่า"}</h1>
        <p className="auth-lead">{mode === "sign-in" ? "ลงชื่อเข้าใช้เพื่อกลับไปยังกิจกรรมของคุณ" : mode === "sign-up" ? "สร้างบัญชีด้วยอีเมลที่คุณเปิดรับได้ เพื่อยืนยันตัวตนก่อนเข้าถึงข้อมูลส่วนตัว" : "กรอกอีเมลที่ใช้สมัคร แล้วแอดมินจะตรวจสอบและติดต่อกลับทาง Discord ที่ผูกกับบัญชี"}</p>
        <form onSubmit={submit} className="auth-form">
          {mode === "sign-up" && <>
            <label>Display Name บนเว็บไซต์ RoleplayTH<input name="name" autoComplete="nickname" required minLength={2} maxLength={60} placeholder="ชื่อที่เพื่อนรู้จักคุณ" /></label>
            <label>Discord Username<input name="discordUsername" autoComplete="username" required minLength={2} maxLength={33} pattern="@?[A-Za-z0-9._]{2,32}" placeholder="@LoveAnaxa1225" /><small>ใส่ @ นำหน้าได้ เช่น @LoveAnaxa1225</small></label>
          </>}
          <label>อีเมล<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
          {mode !== "forgot-password" && <label>รหัสผ่าน<input name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={12} maxLength={128} required /><small>อย่างน้อย 12 ตัวอักษร</small></label>}
          {notice && <div className={`auth-notice ${noticeType === "error" ? "auth-notice-error" : ""}`} role={noticeType === "error" ? "alert" : "status"} aria-live="polite">{notice}</div>}
          <button className="auth-submit" disabled={busy}>{busy ? "กำลังดำเนินการ…" : mode === "sign-in" ? "เข้าสู่ระบบ" : mode === "sign-up" ? "สมัครและส่งอีเมลยืนยัน" : "ส่งคำขอให้แอดมินช่วย"}</button>
        </form>
        {mode === "sign-in" && <button className="auth-switch auth-forgot" type="button" onClick={() => { setNotice(""); setNoticeType("success"); setMode("forgot-password"); }}>ลืมรหัสผ่าน?</button>}
        {mode !== "forgot-password" ? <button className="auth-switch" type="button" onClick={() => { setNotice(""); setNoticeType("success"); setMode(mode === "sign-in" ? "sign-up" : "sign-in"); }}>
          {mode === "sign-in" ? "ยังไม่มีบัญชี? สมัครสมาชิก" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}
        </button> : <button className="auth-switch" type="button" onClick={() => { setNotice(""); setNoticeType("success"); setMode("sign-in"); }}>กลับไปเข้าสู่ระบบ</button>}
        <p className="auth-footnote">ข้อมูลบัญชีและกิจกรรมจะถูกจำกัดตามสิทธิ์ของผู้ใช้</p>
      </div>
    </main>
  );
}
