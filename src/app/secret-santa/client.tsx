"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoutButton from "../account/logout-button";
import ProfileAvatar from "@/components/profile-avatar";
import { RichText, RichTextEditor } from "@/components/rich-text";
import { acknowledgeAssignmentUpdate, createEvent, drawEvent, lockEvent, reopenEvent, saveParticipation, saveWishlist, sendAssignmentUpdate, sendWishlistAlert } from "./actions";

type Channel = "online" | "physical";
type WishlistEntry = { channel: Channel; item: string; isAvoid: boolean };
type UpdateKind = "wishlist_request" | "sent" | "delivered_all" | "partially_delivered" | "custom" | "address_changed";
type AssignmentUpdate = { id?: string; kind: UpdateKind; message: string; acknowledgedAt: string | null; createdAt: string };
type Assignment = { id: string; channel: Channel; recipientName: string; recipientAccountName: string; recipientRoleplayName: string; recipientAvatarUrl: string | null; shippingAddress: string | null; wants: string[]; avoids: string[]; updates: AssignmentUpdate[] };
type RosterMember = {
  memberId: string;
  displayName: string;
  accountDisplayName: string;
  avatarUrl: string | null;
  email: string;
  joinsOnline: boolean;
  joinsPhysical: boolean;
  shippingAddress: string | null;
  wishlist: WishlistEntry[];
};

export type SecretSantaPageData = {
  memberName: string;
  memberRoleplayName: string;
  memberAvatarUrl: string | null;
  isAdmin: boolean;
  event: { id: string; name: string; status: "open" | "locked" | "drawn" } | null;
  participation: { joinsOnline: boolean; joinsPhysical: boolean; shippingAddress: string } | null;
  wishlist: WishlistEntry[];
  assignments: Assignment[];
  adminParticipants: RosterMember[];
  alertQueue: { participantName: string; channel: Channel; createdAt: string }[];
  incomingUpdates: { id: string; kind: UpdateKind; message: string; acknowledgedAt: string | null; createdAt: string; channel: Channel }[];
  adminAssignments: { id: string; channel: Channel; giverMemberId: string; recipientMemberId: string; giverName: string; recipientName: string; updates: AssignmentUpdate[] }[];
  addressChangeNotices: { giverName: string; recipientName: string; channel: Channel; createdAt: string }[];
};

const channelText = (channel: Channel) => channel === "online" ? "ของขวัญบนเว็บ" : "ของขวัญจริง";
const linesFor = (entries: WishlistEntry[], channel: Channel, isAvoid: boolean) => entries
  .filter((entry) => entry.channel === channel && entry.isAvoid === isAvoid).map((entry) => entry.item.replace(/<br\s*\/?\s*>/gi, "\n")).join("\n");

export default function SecretSantaClient({ data }: { data: SecretSantaPageData }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageLeaving, setMessageLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [physicalChecked, setPhysicalChecked] = useState(data.participation?.joinsPhysical ?? false);
  const [onlineChecked, setOnlineChecked] = useState(data.participation?.joinsOnline ?? false);
  const [participationFormOpen, setParticipationFormOpen] = useState(!data.participation);
  const [wishlistFormOpen, setWishlistFormOpen] = useState(data.wishlist.length === 0);
  const [sentEnvelope, setSentEnvelope] = useState<"participation" | "wishlist" | null>(null);
  const [requestText, setRequestText] = useState<Record<string, string>>({});
  const [activePokeMenu, setActivePokeMenu] = useState<string | null>(null);
  const [menuForm, setMenuForm] = useState<{ assignmentId: string; kind: "wishlist_request" | "custom" } | null>(null);
  const [selectedWishlist, setSelectedWishlist] = useState<Assignment | null>(null);

  useEffect(() => {
    if (!message) return;
    setMessageLeaving(false);
    const fadeTimer = window.setTimeout(() => setMessageLeaving(true), 2200);
    const clearTimer = window.setTimeout(() => setMessage(""), 2700);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [message]);

  useEffect(() => {
    const refreshUpdates = () => {
      const focused = document.activeElement;
      const editing = focused instanceof HTMLElement && (focused.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName));
      if (document.visibilityState === "visible" && !editing) router.refresh();
    };
    const interval = window.setInterval(refreshUpdates, 15000);
    return () => window.clearInterval(interval);
  }, [router]);

  const sendEnvelopeAway = (kind: "participation" | "wishlist") => {
    setSentEnvelope(kind);
    window.setTimeout(() => setSentEnvelope((current) => current === kind ? null : current), 1050);
  };

  const submit = (action: (formData: FormData) => Promise<{ ok: boolean; message: string }>, onSuccess?: () => void) => async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (submitter instanceof HTMLButtonElement && submitter.name) formData.set(submitter.name, submitter.value);
    const result = await action(formData);
    setMessage(result.message);
    if (result.ok) onSuccess?.();
    setBusy(false);
  };

  const run = async (action: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(true);
    setMessage("");
    const result = await action();
    setMessage(result.message);
    setBusy(false);
  };

  return <main className="santa-page">
    <div className="santa-page-decor" aria-hidden="true"><span className="santa-decor-santa">🎅🏻</span><span className="santa-decor-gifts">🎁 ✨ 🎁</span></div>
    <header className="santa-header">
      <Link href="/?view=activities" className="santa-back">← กลับไปรายการกิจกรรม</Link>
      <div className="santa-brand"><span>✳</span> THE CHRISTMAS COTTAGE</div>
      <div className="santa-header-actions"><ProfileAvatar value={data.memberAvatarUrl} className="santa-header-avatar"/><span className="santa-account">สวัสดี {data.memberName}<small>RoleplayTH: {data.memberRoleplayName}</small></span><Link className="santa-account-link" href="/account">บัญชี</Link><LogoutButton /></div>
    </header>

    <div className="santa-content">
      <div className="santa-title-block"><div className="santa-kicker">A little gift, a lot of joy</div><h1>Secret Santa</h1><p>ฝากความปรารถนาดีไว้ในกล่องของขวัญ แล้วให้ความมหัศจรรย์ช่วยจับคู่</p></div>
      {message && <div className={`santa-message${messageLeaving ? " is-leaving" : ""}`} role="status">{message}</div>}

      {!data.event ? <section className="santa-card empty-event">
        <span className="santa-card-icon">🎄</span><h2>ยังไม่มีกิจกรรมที่เปิดอยู่</h2><p>รอแอดมินตั้งค่ากิจกรรม Secret Santa ก่อนนะ</p>
        {data.isAdmin && <form className="santa-inline-form" onSubmit={submit(createEvent)}><label htmlFor="new-event-name">ชื่อกิจกรรม</label><input id="new-event-name" name="name" placeholder="เช่น Secret Santa 2026" minLength={3} maxLength={80} required/><button className="santa-button" disabled={busy}>สร้างกิจกรรม</button></form>}
      </section> : <>
        <section className="santa-card event-card">
          <div><div className="santa-kicker">กิจกรรมรอบนี้</div><h2>{data.event.name}</h2></div>
          <div className="event-card-actions"><Link className="wishlist-book-link" href="/secret-santa/wishlist-book">📖 สมุดรวม Wishlist</Link><span className={`event-status status-${data.event.status}`}>{data.event.status === "open" ? "เปิดรับสมัคร" : data.event.status === "locked" ? "ปิดรับสมัครแล้ว" : "จับคู่เรียบร้อย"}</span></div>
        </section>

        {data.event.status === "open" && <section className="santa-card participation-card">
          <div className="section-heading"><span>01</span><div><h2>เลือกวิธีเข้าร่วม</h2><p>จะเล่นแบบบนเว็บ แบบส่งของจริง หรือทั้งสองแบบก็ได้</p></div></div>
          {participationFormOpen ? <form className="santa-form" onSubmit={submit(saveParticipation, () => { setParticipationFormOpen(false); sendEnvelopeAway("participation"); })}>
            <input type="hidden" name="eventId" value={data.event.id}/>
            <div className="join-options">
              <label className="join-option"><input type="checkbox" name="joinsOnline" checked={onlineChecked} onChange={(event) => setOnlineChecked(event.target.checked)}/><span className="join-icon">💌</span><span><b>ของขวัญบนเว็บ</b><small>ส่งของขวัญหรือประสบการณ์ผ่านเว็บ</small></span></label>
              <label className="join-option"><input type="checkbox" name="joinsPhysical" checked={physicalChecked} onChange={(event) => setPhysicalChecked(event.target.checked)}/><span className="join-icon">📦</span><span><b>ของขวัญจริง</b><small>แลกของขวัญและจัดส่งถึงบ้าน</small></span></label>
            </div>
            {physicalChecked && <label className="santa-field"><span>ที่อยู่จัดส่ง <em>เห็นได้เฉพาะผู้ที่จับคู่ให้คุณและแอดมิน</em></span><RichTextEditor name="shippingAddress" defaultValue={data.participation?.shippingAddress ?? ""} placeholder="ชื่อผู้รับ บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์ และเบอร์โทร" minLength={8} maxLength={600} required rows={3}/></label>}
            <button className="santa-button" disabled={busy || (!physicalChecked && !onlineChecked)}>{busy ? "กำลังบันทึก…" : data.participation ? "อัปเดตการเข้าร่วม" : "เข้าร่วมกิจกรรม"}</button>
          </form> : <div className="saved-submit-state">
            {sentEnvelope === "participation" ? <SentEnvelope label="ส่งข้อมูลเข้าร่วมแล้ว"/> : <><span className="saved-check">✓</span><span>บันทึกข้อมูลเข้าร่วมแล้ว</span><button type="button" className="edit-saved-button" onClick={() => { setParticipationFormOpen(true); setSentEnvelope(null); }}>แก้ไขข้อมูล</button></>}
          </div>}
        </section>}

        {data.event.status !== "open" && <section className="santa-card participation-card compact-card">
          <div className="section-heading"><span>01</span><div><h2>การเข้าร่วมของคุณ</h2><p>{data.participation ? [data.participation.joinsOnline && "ของขวัญบนเว็บ", data.participation.joinsPhysical && "ของขวัญจริง"].filter(Boolean).join(" · ") : "คุณไม่ได้ลงทะเบียนในรอบนี้"}</p></div></div>
          {data.participation?.joinsPhysical ? participationFormOpen ? <form className="santa-form late-address-form" onSubmit={submit(saveParticipation, () => setParticipationFormOpen(false))}>
            <input type="hidden" name="eventId" value={data.event.id}/>
            <label className="santa-field"><span>ที่อยู่จัดส่ง <em>แก้ไขได้หลังปิดรับสมัคร · ผู้ให้ของจริงและแอดมินเห็นที่อยู่ล่าสุด</em></span><RichTextEditor name="shippingAddress" defaultValue={data.participation.shippingAddress} placeholder="ชื่อผู้รับ บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์ และเบอร์โทร" minLength={8} maxLength={600} required rows={3}/></label>
            <div className="santa-form-actions"><button className="santa-button" disabled={busy}>{busy ? "กำลังบันทึก…" : "บันทึกที่อยู่ใหม่"}</button>{data.event.status === "drawn" && <button className="santa-button secondary-button" name="notifyGiver" value="on" disabled={busy}>{busy ? "กำลังแจ้งเตือน…" : "📣 บันทึกและแจ้งซานต้ากับแอดมิน"}</button>}<button type="button" className="santa-button secondary-button" disabled={busy} onClick={() => setParticipationFormOpen(false)}>ยกเลิก</button></div>
          </form> : <div className="late-address-saved"><div><b>ที่อยู่จัดส่งปัจจุบัน</b><p><RichText value={data.participation.shippingAddress}/></p></div><button type="button" className="edit-saved-button" onClick={() => setParticipationFormOpen(true)}>แก้ไขที่อยู่</button></div> : data.participation ? <p className="participation-locked-note">การเข้าร่วมของคุณถูกบันทึกแล้ว หากต้องการแก้ชื่อ Display Name ให้อัปเดตที่หน้า <Link href="/account">บัญชี</Link></p> : <p className="participation-locked-note">รอบนี้ปิดรับสมัครแล้ว จึงไม่สามารถเข้าร่วมเพิ่มเติมได้</p>}
        </section>}

        {data.participation && <>
          <section className="santa-card wishlist-card">
            <div className="section-heading"><span>02</span><div><h2>Wishlist ของฉัน</h2><p>แก้ไขหรือเพิ่มรายการได้ตลอด แม้หลังจับคู่แล้ว</p></div></div>
            {wishlistFormOpen ? <form className="santa-form" onSubmit={submit(saveWishlist, () => { setWishlistFormOpen(false); sendEnvelopeAway("wishlist"); })}>
              <input type="hidden" name="eventId" value={data.event.id}/>
              <div className="wishlist-grid">
                <label className="santa-field"><span>อยากได้ · บนเว็บ</span><RichTextEditor name="onlineWants" defaultValue={linesFor(data.wishlist,"online",false)} placeholder="หนึ่งรายการต่อหนึ่งบรรทัด" maxLength={4000}/></label>
                <label className="santa-field"><span>ไม่อยากได้ · บนเว็บ</span><RichTextEditor name="onlineAvoids" defaultValue={linesFor(data.wishlist,"online",true)} placeholder="หนึ่งรายการต่อหนึ่งบรรทัด" maxLength={4000}/></label>
                <label className="santa-field"><span>อยากได้ · ของจริง</span><RichTextEditor name="physicalWants" defaultValue={linesFor(data.wishlist,"physical",false)} placeholder="หนึ่งรายการต่อหนึ่งบรรทัด" maxLength={4000}/></label>
                <label className="santa-field"><span>ไม่อยากได้ · ของจริง</span><RichTextEditor name="physicalAvoids" defaultValue={linesFor(data.wishlist,"physical",true)} placeholder="หนึ่งรายการต่อหนึ่งบรรทัด" maxLength={4000}/></label>
              </div>
              <div className="santa-form-actions"><button className="santa-button" disabled={busy}>{busy ? "กำลังบันทึก…" : "บันทึก wishlist"}</button>{data.assignments.length > 0 && <button type="button" className="santa-button secondary-button" disabled={busy} onClick={() => run(() => sendWishlistAlert(data.event!.id))}>🔔 แจ้งผู้ให้ของแบบไม่ระบุชื่อ</button>}</div>
            </form> : <div className="saved-submit-state">
              {sentEnvelope === "wishlist" ? <SentEnvelope label="ส่ง Wishlist แล้ว"/> : <><span className="saved-check">✓</span><span>Wishlist บันทึกแล้ว พร้อมแก้ไขได้ทุกเมื่อ</span><button type="button" className="edit-saved-button" onClick={() => { setWishlistFormOpen(true); setSentEnvelope(null); }}>แก้ไข Wishlist</button></>}
            </div>}
          </section>

          {data.incomingUpdates.length > 0 && <section className="santa-card incoming-updates-card">
            <div className="section-heading"><span>✉</span><div><h2>มีข้อความถึงคุณ</h2><p>ผู้ส่งจะไม่แสดงชื่อ เพื่อเก็บความลับของซานต้า</p></div></div>
            <div className="incoming-update-list">{data.incomingUpdates.map((update) => <article className="incoming-update" key={update.id}>
              <div><b>{update.kind === "wishlist_request" ? "ขอรายละเอียด Wishlist เพิ่มเติม" : update.kind === "sent" ? "ส่งของแล้ว" : update.kind === "delivered_all" ? "ของส่งถึงครบทั้งหมดแล้ว" : update.kind === "partially_delivered" ? "ของมาถึงแล้วบางส่วน ยังมีอีกชิ้นกำลังส่ง" : update.kind === "address_changed" ? "ที่อยู่จัดส่งของผู้รับมีการเปลี่ยนแปลง" : "มีข้อความจากซานต้าของคุณ"}</b><span>{channelText(update.channel)} · {new Date(update.createdAt).toLocaleString("th-TH")}</span>{update.message && <p>{update.message}</p>}</div>
              <div className="incoming-update-actions">{update.kind === "wishlist_request" && <button className="santa-button secondary-button" type="button" onClick={() => { setWishlistFormOpen(true); void run(() => acknowledgeAssignmentUpdate(update.id)); document.querySelector(".wishlist-card")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>เพิ่ม Wishlist</button>}{update.acknowledgedAt ? <span className="acknowledged-label">✓ รับทราบแล้ว</span> : <button className="santa-button" type="button" disabled={busy} onClick={() => run(() => acknowledgeAssignmentUpdate(update.id))}>รับทราบแล้ว</button>}</div>
            </article>)}</div>
          </section>}

          {data.assignments.length > 0 && <section className="santa-card assignments-card">
            <div className="section-heading"><span>03</span><div><h2>คนที่คุณได้รับมอบหมาย</h2><p>ข้อมูลส่วนตัวนี้มีให้คุณเห็นเพียงคนเดียว · ส่งข้อความและอัปเดตการจัดส่งได้ที่นี่</p></div></div>
            <div className="assignment-grid">{data.assignments.map((assignment) => <article className="assignment-note" key={assignment.channel}>
              <div className="assignment-label">{assignment.channel === "online" ? "💌 ของขวัญบนเว็บ" : "📦 ของขวัญจริง"}</div><div className="assignment-recipient-heading"><ProfileAvatar value={assignment.recipientAvatarUrl} alt=""/><div><h3>{assignment.recipientAccountName}</h3><small>RoleplayTH: {assignment.recipientRoleplayName}</small></div></div>
              {assignment.shippingAddress && <div className="recipient-address"><b>ที่อยู่จัดส่ง</b><p><RichText value={assignment.shippingAddress}/></p></div>}
              {assignment.channel === "online" && <div className="recipient-digital-note"><span aria-hidden="true">✉️</span><div><b>ซองของขวัญบนเว็บ</b><p>หากต้องการนำภาพขึ้นสมบัติล้ำค่าเป็นของขวัญ อย่าลืมเผื่อเวลาให้ทีมงานอนุมัติ 2-3 วัน</p></div><i aria-hidden="true">✦</i></div>}
              <div className="assignment-card-actions">
                <button className="santa-button wishlist-open-button" type="button" onClick={() => setSelectedWishlist(assignment)}>🎀 ดู Wishlist</button>
                <div className="poke-menu-wrap">
                  <button className="santa-button secondary-button poke-trigger" type="button" aria-label="เปิดเมนูสะกิดและอัปเดต" title="สะกิดหรือส่งสถานะ" aria-expanded={activePokeMenu === assignment.id} onClick={() => { setActivePokeMenu((current) => current === assignment.id ? null : assignment.id); setMenuForm(null); }}>🔔</button>
                  {activePokeMenu === assignment.id && <div className="poke-menu"><b>ส่งข้อความหรืออัปเดต</b>
                    <button type="button" onClick={() => setMenuForm({ assignmentId: assignment.id, kind: "wishlist_request" })}>📝 ขอข้อมูล Wishlist เพิ่ม</button>
                    <button type="button" onClick={() => run(() => sendAssignmentUpdate(assignment.id, "sent"))}>📦 ส่งของเรียบร้อยแล้ว</button>
                    <button type="button" onClick={() => run(() => sendAssignmentUpdate(assignment.id, "delivered_all"))}>🎁 ของส่งถึงครบทั้งหมดแล้ว</button>
                    <button type="button" onClick={() => run(() => sendAssignmentUpdate(assignment.id, "partially_delivered"))}>🚚 มีบางส่วนถึงแล้ว และยังมีที่กำลังส่ง</button>
                    <button type="button" onClick={() => setMenuForm({ assignmentId: assignment.id, kind: "custom" })}>✍️ กำหนดข้อความเอง</button>
                    {menuForm?.assignmentId === assignment.id && <div className="poke-compose"><label>{menuForm.kind === "wishlist_request" ? "อยากทราบรายละเอียดอะไรเพิ่ม?" : "ข้อความถึงผู้รับ"}<textarea value={requestText[assignment.id] ?? ""} onChange={(event) => setRequestText((current) => ({ ...current, [assignment.id]: event.target.value }))} maxLength={300} placeholder={menuForm.kind === "wishlist_request" ? "เช่น สีหรือขนาดที่ชอบ" : "เขียนข้อความสั้น ๆ ได้เลย"}/></label><div><button type="button" className="santa-button secondary-button" onClick={() => setMenuForm(null)}>ยกเลิก</button><button type="button" className="santa-button" disabled={busy || (requestText[assignment.id] ?? "").trim().length < (menuForm.kind === "wishlist_request" ? 4 : 2)} onClick={() => run(async () => { const result = await sendAssignmentUpdate(assignment.id, menuForm.kind, requestText[assignment.id] ?? ""); if (result.ok) { setRequestText((current) => ({ ...current, [assignment.id]: "" })); setMenuForm(null); setActivePokeMenu(null); } return result; })}>ส่งแบบไม่ระบุชื่อ</button></div></div>}
                    {assignment.updates.filter((update) => update.kind !== "wishlist_request").slice(0, 1).map((update, index) => <small className="shipping-latest" key={`${update.kind}-${index}`}>สถานะล่าสุด: {update.kind === "sent" ? "ส่งของเรียบร้อยแล้ว" : update.kind === "delivered_all" ? "ของส่งถึงครบทั้งหมดแล้ว" : update.kind === "partially_delivered" ? "ถึงบางส่วน" : update.message}{update.acknowledgedAt ? " · รับทราบแล้ว" : " · รอรับทราบ"}</small>)}
                  </div>}
                </div>
              </div>
            </article>)}</div>
          </section>}
        </>}

        {data.isAdmin && <section className="santa-card admin-card">
          <div className="section-heading"><span>✦</span><div><h2>แผงควบคุมแอดมิน</h2><p>รายชื่อและข้อมูลทั้งหมดจะแสดงเฉพาะแอดมิน</p></div></div>
          <div className="admin-controls">
            <div className="admin-counts"><b>ผู้เข้าร่วม {data.adminParticipants.length} คน</b><span>บนเว็บ {data.adminParticipants.filter((person) => person.joinsOnline).length}</span><span>ของจริง {data.adminParticipants.filter((person) => person.joinsPhysical).length}</span></div>
            {data.event.status === "open" && <button className="santa-button secondary-button" disabled={busy} onClick={() => run(() => lockEvent(data.event!.id))}>ปิดรับสมัคร</button>}
            {data.event.status === "locked" && <div className="admin-event-actions"><button className="santa-button secondary-button" disabled={busy} onClick={() => run(() => reopenEvent(data.event!.id))}>เปิดรับสมัครอีกครั้ง</button><button className="santa-button" disabled={busy} onClick={() => run(() => drawEvent(data.event!.id))}>🎲 สุ่มจับคู่</button></div>}
          </div>
          {data.addressChangeNotices.length > 0 && <div className="address-change-notices"><b>📣 มีการแจ้งเปลี่ยนที่อยู่จัดส่ง</b><p>{data.addressChangeNotices.length} รายการ · ตรวจที่อยู่ล่าสุดได้จากรายละเอียดผู้เข้าร่วมด้านล่าง</p>{data.addressChangeNotices.map((notice,index)=><span key={`${notice.createdAt}-${index}`}>{notice.recipientName} · {channelText(notice.channel)} · {new Date(notice.createdAt).toLocaleString("th-TH")}</span>)}</div>}
          {data.alertQueue.length > 0 && <div className="alert-queue"><b>แจ้งเตือน wishlist ที่รอส่งต่อ</b><p>{data.alertQueue.length} รายการ รอแอดมินแจ้งผู้ให้ของโดยไม่เปิดเผยชื่อ</p>{data.alertQueue.map((alert,index)=><span key={`${alert.createdAt}-${index}`}>{channelText(alert.channel)} · {new Date(alert.createdAt).toLocaleString("th-TH")}</span>)}</div>}
          <div className="roster-list">{data.adminParticipants.map((person) => <details className="roster-person" key={person.memberId}>
            <summary><ProfileAvatar value={person.avatarUrl} className="roster-avatar"/><span className="roster-name">{person.accountDisplayName || person.displayName}<small>RoleplayTH: {person.displayName} · {person.email}</small></span><span className="roster-channels">{[person.joinsOnline && "บนเว็บ", person.joinsPhysical && "ของจริง"].filter(Boolean).join(" · ")}</span></summary>
            <div className="roster-detail">{person.shippingAddress && <p><b>ที่อยู่:</b> <RichText value={person.shippingAddress}/></p>}{person.wishlist.map((item,index)=><p key={`${item.channel}-${item.isAvoid}-${index}`}><b>{channelText(item.channel)} · {item.isAvoid ? "ไม่อยากได้" : "อยากได้"}:</b> <RichText value={item.item}/></p>)}{!person.wishlist.length && <p>ยังไม่มี wishlist</p>}</div>
          </details>)}</div>
          {data.adminAssignments.length > 0 && <div className="admin-pairings"><h3>คู่จับและสถานะการจัดส่ง · แอดมินเห็นได้เท่านั้น</h3>{data.adminAssignments.map((assignment) => <article className="admin-pairing" key={assignment.id}><div><b>{assignment.giverName}</b><span> → </span><b>{assignment.recipientName}</b></div><span>{channelText(assignment.channel)}</span><div className="admin-pairing-updates">{assignment.updates.length ? assignment.updates.map((update,index)=><p key={`${assignment.id}-${index}`}>{update.kind === "wishlist_request" ? `ขอ Wishlist เพิ่ม: ${update.message}` : update.kind === "sent" ? "ส่งของเรียบร้อยแล้ว" : update.kind === "delivered_all" ? "ของส่งถึงครบทั้งหมดแล้ว" : update.kind === "partially_delivered" ? "ของถึงแล้วบางส่วน ยังมีอีกชิ้นกำลังส่ง" : update.kind === "address_changed" ? "ผู้รับเปลี่ยนที่อยู่จัดส่งแล้ว" : `ข้อความ: ${update.message}`}{update.acknowledgedAt ? " · รับทราบแล้ว" : " · รอรับทราบ"} <small>{new Date(update.createdAt).toLocaleString("th-TH")}</small></p>) : <p>ยังไม่มีอัปเดต</p>}</div></article>)}</div>}
        </section>}
      </>}

      <footer className="santa-footer">THE CHRISMAS COTTAGE ✦</footer>
    </div>
    {selectedWishlist && <div className="wishlist-modal-backdrop" role="presentation" onClick={() => setSelectedWishlist(null)}><section className="wishlist-modal" role="dialog" aria-modal="true" aria-labelledby="wishlist-modal-title" onClick={(event) => event.stopPropagation()}><button className="wishlist-modal-close" type="button" onClick={() => setSelectedWishlist(null)} aria-label="ปิด Wishlist">×</button><div className="wishlist-modal-kicker">A LITTLE GIFT GUIDE</div><h2 id="wishlist-modal-title">Wishlist ของ {selectedWishlist.recipientAccountName}</h2><p className="wishlist-modal-channel">RoleplayTH: {selectedWishlist.recipientRoleplayName} · {selectedWishlist.channel === "online" ? "💌 ของขวัญบนเว็บ" : "📦 ของขวัญจริง"}</p>{selectedWishlist.shippingAddress && <div className="wishlist-modal-address"><b>ที่อยู่จัดส่ง</b><p><RichText value={selectedWishlist.shippingAddress}/></p></div>}<div className="wishlist-modal-lists"><WishlistList title="♡ อยากได้" items={selectedWishlist.wants} empty="ยังไม่ได้เพิ่มรายการ"/><WishlistList title="✧ ไม่อยากได้" items={selectedWishlist.avoids} empty="ไม่ได้ระบุ" avoid/></div><div className="wishlist-modal-footer">ขอให้เลือกของขวัญได้อย่างมีความสุข ✦</div></section></div>}
  </main>;
}

function WishlistList({ title, items, empty, avoid = false }: { title: string; items: string[]; empty: string; avoid?: boolean }) {
  return <div className={`recipient-list ${avoid ? "avoid-list" : ""}`}><b>{title}</b>{items.length ? <ul>{items.map((item,index)=><li key={`${item}-${index}`}><RichText value={item}/></li>)}</ul> : <p>{empty}</p>}</div>;
}

function SentEnvelope({ label }: { label: string }) {
  return <div className="sent-envelope" role="status"><span aria-hidden="true">💌</span><b>{label}</b><i>✦</i></div>;
}
