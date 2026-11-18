"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    await authClient.signOut();
    window.location.assign("/");
  }
  return <button className="logout-button" type="button" onClick={signOut} disabled={busy}>{busy ? "กำลังออก…" : "ออกจากระบบ"}</button>;
}
