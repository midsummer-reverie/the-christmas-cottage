"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteWeekLink, deleteWeekTask, saveWeekTask, submitWeekLink } from "./actions";

export type ChecklistTask = { id: string; parentTaskId: string | null; title: string; description: string; requiredPosts: number; isPublished: boolean };
export type ChecklistProgress = { id: string; taskId: string; memberId: string; postNumber: number; url: string; createdAt: string; name: string; roleplayName: string; avatar: string | null };

function PostLinkField({ task, number, existing, signedIn, busy, save, remove }: { task: ChecklistTask; number: number; existing?: ChecklistProgress; signedIn: boolean; busy: boolean; save: (taskId: string, url: string, number: number) => void; remove: (id: string) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("url") as HTMLInputElement;
    save(task.id, input.value, number);
  }
  return <form className={`week-link-card ${existing ? "has-link" : ""}`} onSubmit={submit}>
    <span className="week-post-number">{existing ? "✓" : number}</span>
    <label><small>โพสต์ที่ {number}</small><input name="url" type="url" defaultValue={existing?.url ?? ""} placeholder="วางลิงก์โพสต์ของคุณที่นี่…" required disabled={!signedIn || !task.isPublished}/></label>
    {signedIn ? <button className="week-link-save" disabled={busy || !task.isPublished} aria-label={existing ? "อัปเดตลิงก์" : "บันทึกลิงก์"}>{existing ? "อัปเดต" : "บันทึก"}</button> : <Link className="week-link-save" href={`/sign-in?returnTo=${encodeURIComponent("/christmas-checklist")}`}>เข้าสู่ระบบ</Link>}
    {existing && <button className="week-link-remove" type="button" disabled={busy} onClick={() => remove(existing.id)} aria-label="ลบลิงก์">×</button>}
  </form>;
}

export default function WeekChecklistClient({ tasks, progress, memberId, isAdmin }: { tasks: ChecklistTask[]; progress: ChecklistProgress[]; memberId: string | null; isAdmin: boolean }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newParentId, setNewParentId] = useState("");
  const mine = useMemo(() => progress.filter((entry) => entry.memberId === memberId), [progress, memberId]);
  const roots = tasks.filter((task) => !task.parentTaskId);
  const childrenOf = (id: string) => tasks.filter((task) => task.parentTaskId === id);
  const entriesOf = (id: string) => mine.filter((entry) => entry.taskId === id);
  const run = (promise: Promise<{ ok: boolean; message: string }>) => startTransition(async () => { const result = await promise; setFeedback(result.message); router.refresh(); });
  const saveLink = (taskId: string, url: string, number: number) => run(submitWeekLink(taskId, url, number));
  const removeLink = (id: string) => run(deleteWeekLink(id).then(() => ({ ok: true, message: "ลบลิงก์แล้ว" })));
  const rootDone = roots.filter((root) => {
    const children = childrenOf(root.id);
    const assigned = children.length ? children.flatMap((child) => entriesOf(child.id)) : entriesOf(root.id);
    const target = children.length ? children.reduce((total, child) => total + child.requiredPosts, 0) : root.requiredPosts;
    return assigned.length >= target;
  }).length;
  const percent = roots.length ? Math.round(rootDone / roots.length * 100) : 0;

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const renderLinks = (task: ChecklistTask) => <div className="week-link-fields">{Array.from({ length: task.requiredPosts }, (_, index) => <PostLinkField key={`${task.id}-${index + 1}`} task={task} number={index + 1} existing={entriesOf(task.id).find((entry) => entry.postNumber === index + 1)} signedIn={Boolean(memberId)} busy={busy} save={saveLink} remove={removeLink}/>)}</div>;

  const renderEditor = (task: ChecklistTask) => { const taskChildren = childrenOf(task.id); const postCount = taskChildren.length ? taskChildren.reduce((sum, child) => sum + child.requiredPosts, 0) : task.requiredPosts; return <details className="week-admin-edit" key={`edit-${task.id}`}><summary>✎ ปรับบันทึกภารกิจ</summary><form action={async (data) => { const result = await saveWeekTask(data); setFeedback(result.message); router.refresh(); }}>
    <input type="hidden" name="id" value={task.id}/><label>ชื่อภารกิจ<input name="title" defaultValue={task.title} required maxLength={100}/></label><label>รายละเอียด<textarea name="description" defaultValue={task.description} maxLength={1000}/></label>
    <label>อยู่ใต้ภารกิจหลัก<select name="parentTaskId" defaultValue={task.parentTaskId ?? ""}><option value="">เป็นภารกิจหลัก</option>{roots.filter((root) => root.id !== task.id).map((root) => <option value={root.id} key={root.id}>{root.title}</option>)}</select></label>
    <div className="week-admin-row"><label>{taskChildren.length ? "จำนวนโพสต์รวมจากข้อย่อย" : "จำนวนโพสต์"}<input name="requiredPosts" type="number" min={1} max={10} defaultValue={postCount} readOnly={Boolean(taskChildren.length)}/></label><label className="week-publish-check"><input name="isPublished" type="checkbox" defaultChecked={task.isPublished}/> แสดงให้สมาชิก</label><button disabled={busy}>บันทึก</button><button type="button" className="week-delete-task" disabled={busy} onClick={() => { if (confirm(`ลบ “${task.title}” และลิงก์ความคืบหน้าที่เกี่ยวข้องหรือไม่?`)) run(deleteWeekTask(task.id)); }}>ลบภารกิจ</button></div>
  </form></details>; };

  return <div className="week-content">
    <section className="week-hero"><div className="week-garland" aria-hidden="true">✦　🎄　✧　❄　✦　🎁　✧</div><span>A LITTLE PLAN FOR A LOT OF CHRISTMAS</span><h1>12 Days Before Christmas</h1><p>12 วันก่อนคริสต์มาส มาช่วยกันเก็บช่วงเวลาดี ๆ ทีละภารกิจนะ</p><div className="week-hero-stats"><b>🎁 {roots.length} ภารกิจหลัก</b><i/><b>🔗 {progress.length} โพสต์ที่แบ่งปัน</b><i/><b>🧣 {new Set(progress.map((entry) => entry.memberId)).size} คนร่วมกิจกรรม</b></div><Link className="week-progress-link" href="/christmas-checklist/progress">🚂 ดูรถไฟความคืบหน้าของทุกคน ↗</Link></section>
    <div className="week-layout">
      <section className="week-task-list"><div className="week-section-title"><span>01</span><div><h2>ภารกิจในสมุดบันทึก</h2><p>แปะลิงก์ไว้ตรงภารกิจที่ทำแล้วได้เลย</p></div></div>
        {!roots.length && <div className="week-empty">ภารกิจกำลังเตรียมตัวมา 🎄</div>}
        {roots.map((task, index) => { const children = childrenOf(task.id); const ownSubmitted = children.length ? children.reduce((sum, child) => sum + entriesOf(child.id).length, 0) : entriesOf(task.id).length; const targetPosts = children.length ? children.reduce((sum, child) => sum + child.requiredPosts, 0) : task.requiredPosts; const complete = ownSubmitted >= targetPosts; return <article className={`week-task-card week-task-${index % 5}`} key={task.id}>
          <div className="week-task-heading"><span className="week-task-number">{String(index + 1).padStart(2, "0")}</span><div><h3>{task.title}{!task.isPublished && <small className="week-draft-tag">ฉบับร่าง</small>}</h3><p>{task.description}</p></div><div className="week-task-status">{complete ? <span className="week-completion-stamp"><i>✦</i><b>DONE</b></span> : <span className="week-task-progress">{ownSubmitted}/{targetPosts} ลิงก์</span>}</div></div>
          {children.length ? <div className="week-subtasks">{children.map((child, childIndex) => { const childComplete = entriesOf(child.id).length >= child.requiredPosts; return <section className="week-subtask" key={child.id}><header><span>{index + 1}.{childIndex + 1}</span><div><h4>{child.title}</h4>{child.description && <p>{child.description}</p>}</div>{childComplete ? <span className="week-completion-stamp"><i>✦</i><b>DONE</b></span> : <small>{entriesOf(child.id).length}/{child.requiredPosts}</small>}</header>{renderLinks(child)}{isAdmin && renderEditor(child)}</section>})}</div> : renderLinks(task)}
          {isAdmin && renderEditor(task)}
        </article>})}
      </section>
      <aside className="week-side-column"><section className="week-your-progress"><span>YOUR CHRISTMAS EXPRESS</span><strong>{rootDone}<small>/{roots.length}</small></strong><p>สถานีที่คุณแวะมาแล้ว</p><div className="week-train-progress"><i style={{ width: `${percent}%` }}/><span style={{ left: `${percent}%` }}>🚂</span></div><div className="week-side-stations">{roots.map((task, index) => <span className={index < rootDone ? "is-reached" : ""} key={task.id}>✦</span>)}</div><small>ทุกลิงก์ที่เติม คืออีกหนึ่งสถานีแห่งความทรงจำ</small></section>
        {isAdmin && <button className="week-add-task" type="button" onClick={() => setShowNew(true)}>＋ เขียนภารกิจใหม่ลงสมุด</button>}
        <div className="week-side-note"><span>✉ A NOTE FOR YOU</span><p>ทำทีละนิดก็ได้ ทุกโมเมนต์เล็ก ๆ ล้วนทำให้เทศกาลพิเศษขึ้น</p><b>ด้วยรักและโกโก้ร้อน ☕</b></div>
      </aside>
    </div>
    {isAdmin && showNew && <div className="week-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowNew(false); }}><section className="week-new-modal" role="dialog" aria-modal="true" aria-labelledby="week-new-title"><button className="week-modal-close" type="button" aria-label="ปิด" onClick={() => setShowNew(false)}>×</button><span className="week-modal-stamp">✦ A NEW MEMORY ✦</span><h2 id="week-new-title">เขียนภารกิจใหม่</h2><p>เพิ่มหน้าหรือหัวข้อย่อยในสมุดกิจกรรม</p><form action={async (data) => { const result = await saveWeekTask(data); setFeedback(result.message); setShowNew(false); router.refresh(); }}>
      <label>ชื่อภารกิจ<input name="title" required maxLength={100}/></label><label>รายละเอียด<textarea name="description" maxLength={1000}/></label><label>ประเภทภารกิจ<select name="parentTaskId" value={newParentId} onChange={(event) => setNewParentId(event.target.value)}><option value="">ภารกิจหลัก</option>{roots.map((root) => <option key={root.id} value={root.id}>ภารกิจย่อยของ: {root.title}</option>)}</select></label><div className="week-admin-row"><label>จำนวนโพสต์<input name="requiredPosts" type="number" min={1} max={10} defaultValue={1}/></label><label className="week-publish-check"><input name="isPublished" type="checkbox" defaultChecked/> แสดงให้สมาชิก</label></div><button className="week-modal-save" disabled={busy}>บันทึกลงสมุด ✨</button>
    </form></section></div>}
    {feedback && <div className="week-feedback" role="status" aria-live="polite">{feedback}</div>}
    <footer className="week-footer">ขอให้สัปดาห์ก่อนคริสต์มาส เต็มไปด้วยเรื่องเล็ก ๆ ที่ทำให้ใจอุ่น ❄</footer>
  </div>;
}
