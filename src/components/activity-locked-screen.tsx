import Link from "next/link";

export default function ActivityLockedScreen({ title, note }: { title: string; note: string }) {
  return <main className="activity-locked-page">
    <Link className="activity-locked-back" href="/?view=activities">← กลับไปกระดานกิจกรรม</Link>
    <section className="activity-locked-card" aria-labelledby="activity-locked-title">
      <div className="locked-gift" aria-hidden="true"><span>🎁</span><i>✦</i></div>
      <span className="activity-locked-kicker">A LITTLE CHRISTMAS SECRET</span>
      <h1 id="activity-locked-title">{title}</h1>
      <p className="activity-locked-message">ยังไม่ถึงเวลาเปิดนะ</p>
      <p className="activity-locked-note">{note} ซานต้ากำลังเตรียมเซอร์ไพรส์อยู่ รออีกนิดแล้วแวะมาใหม่นะ</p>
      <div className="activity-locked-lights" aria-hidden="true">✦　🕯️　✧　🎄　✦</div>
    </section>
  </main>;
}
