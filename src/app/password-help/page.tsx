import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/current-member";
import { getPasswordHelpRequests } from "./actions";
import PasswordHelpAdmin from "./client";

export const dynamic = "force-dynamic";

export default async function PasswordHelpPage() {
  const member = await getCurrentMember();
  if (member?.role !== "admin") redirect("/?view=activities");
  const requests = await getPasswordHelpRequests();
  return <main className="activity-control-page">
    <header className="activity-control-header"><Link href="/activity-control">← กลับห้องควบคุม</Link><span>✳ THE CHRISTMAS COTTAGE</span><b>ADMIN · ACCOUNT HELP</b></header>
    <section className="activity-control-shell password-help-shell">
      <div className="control-room-window" aria-hidden="true">✉　❄　✦</div>
      <span className="activity-control-kicker">A LITTLE HELP DESK</span>
      <h1>คำขอกู้บัญชี</h1>
      <p className="activity-control-intro">ตรวจสอบตัวตนกับเจ้าของบัญชีทาง Discord ก่อน แล้วค่อยสร้างลิงก์ตั้งรหัสใหม่ ลิงก์ใช้ได้ครั้งเดียวและหมดอายุใน 30 นาที</p>
      <PasswordHelpAdmin requests={requests.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), issuedAt: row.issuedAt?.toISOString() ?? null, tokenExpiresAt: row.tokenExpiresAt?.toISOString() ?? null, tokenUsedAt: row.tokenUsedAt?.toISOString() ?? null }))}/>
    </section>
  </main>;
}
