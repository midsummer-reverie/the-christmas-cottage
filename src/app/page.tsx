"use client";

import { Suspense, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import LogoutButton from "./account/logout-button";
import ProfileAvatar from "@/components/profile-avatar";

const activities = [
  ["🎁", "Secret Santa"],
  ["🏠", "Maple Rd. No.12"],
  ["🎄", "ต้นคริสต์มาส"],
  ["📋", "12 Days of Christmas"],
];

export default function Home() {
  return <Suspense fallback={<main className="scene" aria-busy="true"/>}><HomeScene/></Suspense>;
}

function HomeScene() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [night, setNight] = useState(false);
  const [inside, setInside] = useState(() => searchParams.get("view") === "activities");
  const { data: session, isPending } = authClient.useSession();
  function openActivities() {
    setInside(true);
    if (searchParams.get("view") !== "activities") router.replace("/?view=activities", { scroll: false });
  }
  function enterByDoorKey(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openActivities();
    }
  }

  return (
    <main className={`scene ${night ? "night" : ""} ${inside ? "inside-mode" : ""}`}>
      <div className="sky-glow" />
      <div className="moon" />
      <div className="stars" aria-hidden="true">{Array.from({ length: 34 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 5) % 100}%`, top: `${(i * 23 + 3) % 48}%`, animationDelay: `${(i % 7) * -.6}s` }} />)}</div>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">✳</span><span>Northwood<br />Christmas Co.</span></div>
        <div className="top-actions">{session?.user ? <><span className="user-chip" title={`${session.user.profileName || session.user.name} · RoleplayTH: ${session.user.name}`}><ProfileAvatar value={session.user.image} className="user-avatar"/><span className="user-name">{session.user.profileName || session.user.name}</span></span><Link className="account-nav" href="/account">บัญชี</Link><LogoutButton /></> : isPending ? <span className="user-chip pending-chip" aria-label="กำลังตรวจสอบสถานะบัญชี">กำลังเช็กบัญชี…</span> : <Link className="login-link" href={`/sign-in?returnTo=${encodeURIComponent(inside ? "/?view=activities" : "/")}`}>เข้าสู่ระบบ</Link>}<button className="mode-toggle" onClick={() => setNight(!night)}><span>{night ? "☾" : "☼"}</span>{night ? "กลางคืน" : "กลางวัน"}</button></div>
      </header>
      <section className="intro">
        <div className="eyebrow">Somewhere in the evergreen woods</div>
        <h1>The Christmas Cottage</h1>
        <p>ท่ามกลางป่าสนสีเขียวชอุ่ม กระท่อมเล็ก ๆ แสนอบอุ่นกำลังรอคุณอยู่</p>
      </section>

      <svg className="landscape" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-label="กระท่อมคริสต์มาสกลางป่าสนและทุ่งหิมะ">
        <defs>
          <linearGradient id="path-glow" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#f9e9c7" stopOpacity=".72"/><stop offset="1" stopColor="#fffaf1" stopOpacity="0"/></linearGradient>
          <radialGradient id="window-light"><stop stopColor="#fff3c7"/><stop offset="1" stopColor="#f6bd68"/></radialGradient>
        </defs>
        <path className="hill-back" d="M0 500Q180 390 365 480T730 452q200-100 380 6t330-30v350H0Z" />
        <path className="hill-back2" d="M0 580q180-120 362-22t382-32q180-110 360 0t336-10v330H0Z" />
        <g className="trees">
          {[[58, 300, .98], [218, 390, .76], [365, 435, .55], [1068, 296, 1.02], [1227, 366, .82], [1000, 425, .62]].map(([x, y, scale], i) => <g key={i} transform={`translate(${x} ${y}) scale(${scale})`} className={i % 2 ? "pine pine-light" : "pine"}><path className="pine-shape" d="M70 0 43 44 57 41 29 83 45 80 7 135 39 130 0 185H140l-39-55 32 5-38-55 16 3-28-42 14 3Z"/><path className="pine-snow" d="M45 43q10 4 25-10 14 13 27 12M31 82q14 5 39-17 23 19 38 19M9 134q22 7 61-23 40 31 61 25"/><path className="pine-trunk" d="M64 183h13v24H64z"/></g>)}
        </g>
        <path className="hill-front" d="M0 655q190-80 380-4t370 0q205-80 385 1t305-22v270H0Z" />
        <path className="walkway" d="M650 704q70 15 140 0 25 80 112 196H538q87-116 112-196Z" fill="url(#path-glow)"/>
        <ellipse className="cabin-shadow" cx="720" cy="703" rx="245" ry="24" />
        <g className="cabin">
          <path className="chimney" d="M825 345h51v103h-51z"/><path className="chimney-cap" d="M817 342h67v13h-67z"/>
          <path className="cabin-wall" d="M545 476h350v196H545z"/>
          <path className="cabin-foundation" d="M535 662h370v22H535z"/>
          <path className="cabin-gable" d="m535 480 185-157 185 157z"/>
          <path className="siding" d="M559 488v172m22-172v172m278-172v172m22-172v172"/>
          <path className="roof-under" d="m492 491 228-195 228 195-21 28-207-171-207 171z"/>
          <path className="roof" d="m512 490 208-177 208 177-20 16-188-155-188 155z"/>
          <path className="roof-snow" d="m489 488 225-190q6-6 12 0l225 190"/>
          <circle className="attic-window" cx="720" cy="395" r="24"/><circle className="attic-glow" cx="720" cy="395" r="20"/><path className="attic-cross" d="M720 373v44m-22-22h44"/>
          <g className="windows"><path d="M575 534h71v74h-71zM794 534h71v74h-71z"/><path className="window-glow" d="M580 539h61v64h-61zM799 539h61v64h-61z"/><path className="window-cross" d="M610.5 534v74m-35.5-37h71m183-37v74m-35.5-37h71"/></g>
          <path className="garland" d="M548 519q44-30 87 0t85 0 85 0 87 0"/><g className="lights">{[561,590,620,650,682,720,752,784,816,850,880].map((x,i)=><circle key={x} cx={x} cy={i%2?520:516} r="5"/>)}</g>
          <g className="door-hit" role="button" tabIndex={0} aria-label="กดที่ประตูเพื่อเข้าไป" onClick={openActivities} onKeyDown={enterByDoorKey}>
            <title>กดที่ประตูเพื่อเข้าไป</title>
            <path className="door" d="M681 548q0-10 10-10h58q10 0 10 10v134h-78Z"/><circle className="doorknob" cx="746" cy="619" r="4"/>
            <g className="wreath"><circle cx="720" cy="568" r="12"/><circle cx="720" cy="568" r="5"/><path d="m714 578-5 7m17-7 5 7"/></g>
            <g className="door-sign"><rect x="655" y="494" width="130" height="28" rx="14"/><text x="720" y="513" textAnchor="middle">กดที่ประตู</text><path d="m714 521 6 7 6-7"/></g>
          </g>
          <path className="porch" d="M665 682h111l18 13H648z"/><path className="porch-step" d="M638 695h164v9H638z"/>
          <g className="snow-shrub" transform="translate(510 660)"><path d="M0 28q10-20 28-13 14-22 34-4 22-7 29 17v16H0Z"/><path className="shrub-snow" d="M4 27q10-16 23-7 13-19 27-3 17-7 29 11"/><circle cx="28" cy="31" r="3"/><circle cx="49" cy="27" r="3"/><circle cx="69" cy="34" r="3"/></g>
          <g className="snow-shrub" transform="translate(930 660) scale(-1 1)"><path d="M0 28q10-20 28-13 14-22 34-4 22-7 29 17v16H0Z"/><path className="shrub-snow" d="M4 27q10-16 23-7 13-19 27-3 17-7 29 11"/><circle cx="28" cy="31" r="3"/><circle cx="49" cy="27" r="3"/><circle cx="69" cy="34" r="3"/></g>
        </g>
      </svg>

      <div className="santa-flyby" aria-hidden="true">
        <svg viewBox="0 0 360 110">
          <path className="sleigh-trail" d="M0 59q40-25 82-4t72 0"/>
          <g className="deer-shadow" transform="translate(200 28)"><path d="M2 34q12-20 42-17 14 1 22 8l13-6 8-15 13-1 8 9-11 7-9-1-8 28-11 2-4-15q-11 18-24 17L30 45l-5 18h-4l1-20-10 18-4-1 5-23z"/><path d="m85 6-4-8m4 6-8-3m9 4 5-7m-4 8 9-4"/><path d="m40 48-1 17m17-20 4 19m16-28 4 19"/><path d="m72 36 10-2 8 3-5 4-12-1z" className="scarf-cutout"/></g>
          <g className="deer-shadow second" transform="translate(257 34) scale(.86)"><path d="M2 34q12-20 42-17 14 1 22 8l13-6 8-15 13-1 8 9-11 7-9-1-8 28-11 2-4-15q-11 18-24 17L30 45l-5 18h-4l1-20-10 18-4-1 5-23z"/><path d="m85 6-4-8m4 6-8-3m9 4 5-7m-4 8 9-4"/><path d="m40 48-1 17m17-20 4 19m16-28 4 19"/><path d="m72 36 10-2 8 3-5 4-12-1z" className="scarf-cutout"/></g>
          <path className="reins" d="M126 48q40-9 75 0m-12 11q38 5 67-1"/>
          <g className="sleigh-shadow" transform="translate(72 17)"><path d="M0 36q40 20 82-5l-8 22q-39 19-70-4z"/><path d="M4 59q37 23 83-2m-84 2q-5 7 5 10h83q11 0 14-8"/><path d="M17 33q4-27 28-20l19 20-7 8H24Z"/><circle cx="34" cy="15" r="10"/><path d="M24 13q8-19 22-6l12 9-21 1Z"/><path d="M24 21q10 4 20-1l-4 7q-10 5-18 0zm-7 14q6 6 12 0"/><circle cx="49" cy="6" r="4"/></g>
        </svg>
      </div>

      <div className="snow" aria-hidden="true">{Array.from({ length: 40 }, (_, i) => <i key={i} style={{ left: `${(i * 41) % 100}%`, animationDelay: `${(i % 13) * -1.2}s`, animationDuration: `${8 + (i % 9)}s` }} />)}</div>
      {!inside ? <><div className="footer-note">❄ &nbsp; MADE FOR THE MOST WONDERFUL TIME OF YEAR</div><div className="hint">BEST EXPERIENCED WITH A LITTLE MAGIC</div></> : <section className="inside">
        <div className="room-lights" aria-hidden="true"><svg viewBox="0 0 1200 130" preserveAspectRatio="none"><path d="M0 8Q190 18 300 68t300 0 300 0 300-60"/><g>{[100,210,320,430,540,650,760,870,980,1090].map((x,i)=><circle key={x} cx={x} cy={i<2?18:i>7?18:68} r="7" className={`bulb bulb-${i%4}`}/>)}</g></svg></div>
        <div className="room-sticker room-tree" aria-hidden="true"><svg viewBox="0 0 120 180"><path className="tree-shape" d="m60 8-21 34h12L30 69h17L18 105h24L12 143h96L78 105h24L73 69h17L69 42h12Z"/><path className="tree-snow" d="M40 43q12 8 21-6 9 13 20 9M31 77q16 9 29-8 13 14 28 11M20 113q18 9 40-11 22 20 41 13"/><path className="tree-trunk" d="M54 143h12v23H54z"/><circle className="tree-star" cx="60" cy="13" r="6"/></svg></div>
        <div className="room-sticker room-mug" aria-hidden="true"><svg viewBox="0 0 130 120"><path className="steam" d="M39 28q-8-10 1-18m20 18q-8-10 1-18m20 18q-8-10 1-18"/><path className="mug-handle" d="M92 52h12q20 0 15 19-3 14-25 14"/><path className="mug-body" d="M20 40h78v49q0 18-18 18H40q-20 0-20-19Z"/><path className="mug-rim" d="M20 43q38 10 78 0"/><path className="mug-heart" d="M58 70q-15-12-15 1 0 9 15 19 15-10 15-19 0-13-15-1Z"/><path className="mug-sleeve" d="M20 78h78v13H20z"/></svg><span>cocoa<br/>for you</span></div>
        <div className="room-sticker room-snowflakes" aria-hidden="true">✦　❄　✧<br/>❅　✦　❄</div>
        <button className="reset" onClick={() => { setInside(false); router.replace("/", { scroll: false }); }}>← กลับไปหน้ากระท่อมด้านนอก</button>
        <div className="cork-board-wrap">
          <div className="cork-board">
            <div className="board-garland" aria-hidden="true"><svg viewBox="0 0 800 70" preserveAspectRatio="none"><path d="M8 8Q100 56 200 22t200 0 200 0 192-14"/><circle cx="70" cy="33" r="7"/><circle cx="160" cy="34" r="7"/><circle cx="250" cy="22" r="7"/><circle cx="340" cy="24" r="7"/><circle cx="430" cy="22" r="7"/><circle cx="520" cy="23" r="7"/><circle cx="610" cy="20" r="7"/><circle cx="700" cy="10" r="7"/></svg></div>
            <div className="board-heading"><span className="board-sprig">✳</span><div className="eyebrow">The Christmas Cottage</div><h2>กระดานกิจกรรม</h2><p>เลือกกระดาษสักใบ แล้วมาแบ่งปันเวลาดี ๆ ด้วยกัน</p></div>
            <Link className="control-room-corner" href="/activity-control" aria-label="ห้องควบคุมสำหรับแอดมิน" title="ห้องควบคุม · สำหรับแอดมิน">🔐</Link>
            <svg className="board-threads" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
              <path d="M500 118 C430 125 340 125 263 150"/><path d="M500 118 C610 140 705 170 785 210"/>
              <path d="M500 118 C430 250 300 340 230 420"/><path d="M500 118 C570 250 700 340 770 420"/>
              <circle cx="500" cy="118" r="8"/><circle cx="263" cy="150" r="6"/><circle cx="785" cy="210" r="6"/><circle cx="230" cy="420" r="6"/><circle cx="770" cy="420" r="6"/>
            </svg>
            <div className="board-activities">{activities.map(([icon, label], index) => {
              const note = <><span className="note-pin"/><span className="note-tape"/><span className="note-number">0{index + 1}</span><b className="note-icon">{icon}</b><span className="note-title">{label}</span><span className="note-caption">แตะเพื่อแวะไปดู <i>↗</i></span><span className="note-doodle">✧　❄</span></>;
              if (label === "Secret Santa") return <Link className={`board-note note-${index + 1}`} key={label} href="/secret-santa">{note}</Link>;
              if (label === "Maple Rd. No.12") return <Link className={`board-note note-${index + 1}`} key={label} href="/maple-road">{note}</Link>;
              if (label === "ต้นคริสต์มาส") return <Link className={`board-note note-${index + 1}`} key={label} href="/christmas-tree">{note}</Link>;
              if (label === "12 Days of Christmas") return <Link className={`board-note note-${index + 1}`} key={label} href="/christmas-checklist">{note}</Link>;
              return <button className={`board-note note-${index + 1}`} key={label} type="button">{note}</button>;
            })}</div>
            <Link className="board-people-note" href="/christmas-people"><span className="side-note-pin">✦</span><span className="side-note-tape"/><b>👥 รายชื่อเพื่อน</b><small>ชาวคอทเทจในวันคริสต์มาส</small><i>เปิดดู ↗</i></Link>
            <div className="board-footer"><span>✦&nbsp; ทำด้วยใจในฤดูหนาวนี้ &nbsp;✦</span><span className="board-stamp">NORTHWOOD · EST. 2026</span></div>
          </div>
        </div>
      </section>}
      <div className="grain" />
    </main>
  );
}
