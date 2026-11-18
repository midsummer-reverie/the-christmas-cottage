import Link from "next/link";
import { requireCurrentMember } from "@/lib/current-member";
import AccountClient from "./client";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const member = await requireCurrentMember("/account");
  return <main className="account-page">
    <header className="account-header"><Link href="/?view=activities">← กลับไปรายการกิจกรรม</Link><span>✳ THE CHRISTMAS COTTAGE</span><LogoutButton /></header>
    <AccountClient displayName={member.displayName} accountDisplayName={member.accountDisplayName || member.displayName} avatarUrl={member.avatarUrl} discordUsername={member.discordUsername}/>
  </main>;
}
