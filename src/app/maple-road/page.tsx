import Link from "next/link";
import ActivityLockedScreen from "@/components/activity-locked-screen";
import { getActivityAccess } from "@/lib/activity-locks";

export const dynamic = "force-dynamic";

export default async function MapleRoadPage() {
  const access = await getActivityAccess("maple-road");
  if (access.isLocked && !access.isAdmin) return <ActivityLockedScreen title="Maple Rd. No.12" note="บ้านหลังเล็กยังเก็บเรื่องราวไว้หลังม่าน"/>;
  return <main className="maple-road-page">
    <Link className="maple-road-back" href="/?view=activities">← กลับไปกระดานกิจกรรม</Link>
    <div className="maple-road-snow" aria-hidden="true">✦　❄　✧　❄　✦</div>
    <section className="maple-road-scene" aria-labelledby="maple-road-title">
      <span className="maple-road-kicker">A LITTLE PLACE TO FEEL AT HOME</span>
      <h1 id="maple-road-title">Maple Rd. No.12</h1>
      <p>แวะพักในห้องนั่งเล่นแสนอบอุ่น ท่ามกลางคืนหิมะโปรย</p>
      <figure className="maple-road-picture">
        <img src="/images/maple-road-living-room.webp" alt="ห้องนั่งเล่นไม้แสนอบอุ่น มีเตาผิง ต้นคริสต์มาส และหิมะตกนอกหน้าต่าง"/>
        <figcaption>Come in, get warm, and stay awhile ☕</figcaption>
      </figure>
      <span className="maple-road-flourish" aria-hidden="true">❧　✦　❧</span>
    </section>
  </main>;
}
