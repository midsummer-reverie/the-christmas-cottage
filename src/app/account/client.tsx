"use client";

import { useState, type FormEvent } from "react";
import { saveAccountProfile } from "./actions";
import ProfileAvatar from "@/components/profile-avatar";

const christmasAvatarChoices = ["🎄", "🎁", "🧸", "🦌", "☃️", "❄️", "🔔", "🍪", "🍭", "🧦", "🌟", "🕯️"];

export default function AccountClient({ displayName: initialDisplayName, accountDisplayName: initialAccountDisplayName, avatarUrl: initialAvatarUrl, discordUsername: initialDiscordUsername }: { displayName: string; accountDisplayName: string; avatarUrl: string | null; discordUsername: string }) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [accountDisplayName, setAccountDisplayName] = useState(initialAccountDisplayName);
  const [avatarMode, setAvatarMode] = useState<"emoji" | "url" | "saved">(initialAvatarUrl?.startsWith("emoji:") ? "emoji" : initialAvatarUrl?.startsWith("data:") ? "saved" : initialAvatarUrl ? "url" : "emoji");
  const [avatarEmoji, setAvatarEmoji] = useState(initialAvatarUrl?.startsWith("emoji:") ? initialAvatarUrl.slice(6) : "🎄");
  const [avatarLink, setAvatarLink] = useState(initialAvatarUrl && !initialAvatarUrl.startsWith("emoji:") && !initialAvatarUrl.startsWith("data:") ? initialAvatarUrl : "");
  const [savedAvatar, setSavedAvatar] = useState(initialAvatarUrl?.startsWith("data:") ? initialAvatarUrl : null);
  const [discordUsername, setDiscordUsername] = useState(initialDiscordUsername);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const avatarValue = avatarMode === "emoji" ? `emoji:${avatarEmoji}` : avatarMode === "saved" ? savedAvatar ?? "" : avatarLink.trim();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const result = await saveAccountProfile(new FormData(event.currentTarget));
    setMessage(result.message);
    if (result.ok) {
      setDisplayName(result.displayName ?? displayName);
      setAccountDisplayName(result.accountDisplayName ?? accountDisplayName);
      const saved = result.avatarUrl ?? null;
      if (saved?.startsWith("emoji:")) {
        setAvatarMode("emoji");
        setAvatarEmoji(saved.slice(6));
      } else if (saved?.startsWith("data:")) {
        setAvatarMode("saved");
        setSavedAvatar(saved);
      } else {
        setAvatarMode("url");
        setAvatarLink(saved ?? "");
      }
      setDiscordUsername(result.discordUsername ?? discordUsername);
    }
    setBusy(false);
  }

  return <section className="account-card">
    <div className="account-icon">🧣</div>
    <div className="account-kicker">Your cottage profile</div>
    <h1>ข้อมูลบัญชี</h1>
      <p className="account-lead">เลือกอิโมจิคริสต์มาสหรือใส่ลิงก์รูปภาพสำหรับโปรไฟล์ได้ โดย Display Name ของ RoleplayTH จะยังแสดงกำกับเพื่อไม่ให้สับสน</p>
    <form className="account-form" onSubmit={submit}>
      <div className="profile-avatar-editor"><ProfileAvatar value={avatarValue} alt="รูปโปรไฟล์ตัวอย่าง" className="profile-avatar-preview"/><div className="avatar-profile-controls"><b>รูปโปรไฟล์</b><p>ใส่ลิงก์ภาพ HTTPS หรือเลือกอิโมจิที่ชอบ</p><div className="avatar-mode-tabs"><button type="button" className={avatarMode === "emoji" ? "selected" : ""} onClick={() => setAvatarMode("emoji")}>อิโมจิคริสต์มาส</button><button type="button" className={avatarMode !== "emoji" ? "selected" : ""} onClick={() => setAvatarMode("url")}>ลิงก์ภาพ</button></div>{avatarMode === "emoji" ? <div className="christmas-avatar-choices" role="group" aria-label="เลือกอิโมจิรูปโปรไฟล์">{christmasAvatarChoices.map((emoji) => <button type="button" key={emoji} className={avatarEmoji === emoji ? "selected" : ""} aria-label={`เลือก ${emoji}`} aria-pressed={avatarEmoji === emoji} onClick={() => setAvatarEmoji(emoji)}>{emoji}</button>)}</div> : <><label className="avatar-url-label"><span>ลิงก์รูปภาพ</span><input type="url" inputMode="url" value={avatarMode === "saved" ? "" : avatarLink} onChange={(event) => { setAvatarLink(event.target.value); if (avatarMode === "saved") setAvatarMode("url"); }} placeholder="https://example.com/avatar.png" maxLength={2048}/></label>{avatarMode === "saved" && <small>กำลังใช้รูปโปรไฟล์ที่บันทึกไว้ก่อนหน้านี้</small>}</>}</div><input type="hidden" name="avatarUrl" value={avatarValue}/></div>
      <label>ชื่อที่แสดงบน The Christmas Cottage<input name="accountDisplayName" value={accountDisplayName} onChange={(event) => setAccountDisplayName(event.target.value)} minLength={2} maxLength={40} autoComplete="nickname" required/><small>ใช้แสดงในโปรไฟล์และสมุด Wishlist</small></label>
      <label>Display Name บนเว็บไซต์ RoleplayTH<input name="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={60} autoComplete="nickname" required/></label>
      <label>Discord Username<input name="discordUsername" value={discordUsername} onChange={(event) => setDiscordUsername(event.target.value)} minLength={2} maxLength={33} pattern="@?[A-Za-z0-9._]{2,32}" placeholder="@LoveAnaxa1225" autoComplete="username" required/><small>ใส่ @ นำหน้าได้ เช่น @LoveAnaxa1225</small></label>
      {message && <div className="account-message" role="status">{message}</div>}
      <button className="account-save" disabled={busy}>{busy ? "กำลังบันทึก…" : "บันทึกข้อมูล"}</button>
    </form>
  </section>;
}
