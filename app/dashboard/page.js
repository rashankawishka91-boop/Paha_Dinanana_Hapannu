"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp, uid, readFile, getYoutubeEmbedUrl } from "../../lib/Provider";
import VideoPlayer from "../../components/VideoPlayer";

export default function Dash() {
  const { S, update, me, login, lang, theme, ready } = useApp();
  const router = useRouter();

  const isSi = lang === "si";
  const isDark = theme === "dark";

  // Default landing tab: "all_packages" (Monthly classes)
  const [activeTab, setActiveTab] = useState("all_packages");
  const [selectedGrade, setSelectedGrade] = useState(5);
  const [monthFilter, setMonthFilter] = useState("all"); // "all", "current", "previous", "unlocked"
  const [open, setOpen] = useState(null);
  const [pay, setPay] = useState(null);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [activeSubjectFilter, setActiveSubjectFilter] = useState("all");
  const [activeTypeFilter, setActiveTypeFilter] = useState("all"); // "all", "zoom", "video", "pdf"
  const [theaterVideo, setTheaterVideo] = useState(null);

  // Speed Practice Timer state
  const [timerSeconds, setTimerSeconds] = useState(45 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Student Verification & Automatic Grade Personalization on Login
  useEffect(() => {
    if (!ready) return;
    const currentId = localStorage.getItem("paha_dinana_me") || localStorage.getItem("cls_me");
    const activeUser = S.users.find(u => u.id === currentId || u.id === me?.id);

    if (!activeUser) {
      router.replace("/login");
    } else if (activeUser.admin) {
      router.replace("/admin");
    } else if (!me && activeUser) {
      login(activeUser.id);
    }
    if (activeUser?.grade) {
      const g = Number(activeUser.grade);
      setSelectedGrade([5, 4, 3].includes(g) ? g : 5);
    }
    if (typeof window !== "undefined") {
      const openParam = new URLSearchParams(window.location.search).get("open");
      if (openParam) {
        setOpen(openParam);
      }
    }
  }, [ready, me, S.users, router, login]);

  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fbf6ee", color: "#2a1418", fontFamily: "Nunito, sans-serif" }}>
        <p style={{ fontWeight: 700 }}>Loading Student Dashboard...</p>
      </div>
    );
  }

  const currentMe = me || S.users.find(u => u.id === (typeof window !== "undefined" ? localStorage.getItem("paha_dinana_me") : null));
  if (!currentMe || currentMe.admin) return null;

  const st = fid =>
    (S.pays.filter(p => p.uid === currentMe.id && p.fid === fid).pop() || {}).status || "none";

  const handleGradeChange = (newGrade) => {
    const gNum = Number(newGrade) || 5;
    setSelectedGrade(gNum);
    update(s => {
      const u = s.users.find(x => x.id === currentMe.id);
      if (u) u.grade = gNum;
    });
  };

  const handleEnterMonth = (folder) => {
    const status = st(folder.id);
    if (status === "approved") {
      setActiveSubjectFilter("all");
      setActiveTypeFilter("all");
      setOpen(folder.id);
    } else if (status === "pending") {
      alert(
        "ඔබගේ රු. 2,000 ගෙවීම් රිසිට්පත ගුරුතුමා විසින් පරීක්ෂා කරමින් පවතී. අනුමත වූ වහාම මෙම මාසයේ සියලුම පන්ති විවෘත වේ."
      );
    } else {
      setPay(folder);
    }
  };

  const onFileChange = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => setFilePreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const send = () => {
    if (!file) {
      return alert("කරුණාකර රිසිට්පත් ඡායාරූපය තෝරන්න.");
    }
    if (file.size > 1.5e6) {
      return alert("රූපයේ ප්‍රමාණය 1.5MB ට අඩු විය යුතුය.");
    }

    readFile(file, d => {
      update(s => {
        s.pays.push({
          id: uid(),
          uid: currentMe.id,
          fid: pay.id,
          slip: d,
          status: "pending",
          date: new Date().toLocaleDateString()
        });
      });
      setPay(null);
      setFile(null);
      setFilePreview(null);
      alert(
        "රු. 2,000 මාසික ගෙවීම් රිසිට්පත සාර්ථකව ලැබුණි! ගුරුතුමා අනුමත කළ විගස මෙම මාසයේ සියලුම පන්ති (Zoom, Video, PDF) විවෘත වේ."
      );
    });
  };

  const copyBankInfo = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(S.set.bank);
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2500);
    }
  };

  // Automatically mark student attendance when they join a Zoom Live Class
  const recordZoomAttendance = (folderId, weekLabel = "1 වන සතිය") => {
    if (!currentMe || !folderId) return;
    update(s => {
      if (!s.attendance) s.attendance = {};
      const key = `${folderId}__${currentMe.id}`;
      const existing = s.attendance[key] || { sessions: {}, lastJoined: "" };
      existing.sessions[weekLabel] = true;
      existing.lastJoined = new Date().toLocaleString();
      s.attendance[key] = existing;
    });
  };

  const formatTimer = secs => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const setTimerPreset = mins => {
    setTimerRunning(false);
    setTimerSeconds(mins * 60);
  };

  // All monthly folders for the student's selected grade (Current month sorted first)
  const gradeFolders = S.folders
    .filter(f => Number(f.grade) === Number(selectedGrade))
    .sort((a, b) => (b.isCurrentMonth ? 1 : 0) - (a.isCurrentMonth ? 1 : 0));

  // Filtered months based on Current / Previous / Unlocked / All filter
  const displayedMonths = gradeFolders.filter(f => {
    if (monthFilter === "current") return Boolean(f.isCurrentMonth);
    if (monthFilter === "previous") return !f.isCurrentMonth;
    if (monthFilter === "unlocked") return st(f.id) === "approved";
    return true;
  });

  const myUnlockedFolders = gradeFolders.filter(f => st(f.id) === "approved");
  const mySlips = S.pays.filter(p => p.uid === currentMe.id);
  const currentMonthFolder = gradeFolders.find(f => f.isCurrentMonth) || gradeFolders[0];
  const avatarLetter = (currentMe.name || "S").trim().charAt(0).toUpperCase();

  const formatRs = (val) => {
    const num = Number(val) || 2000;
    return `Rs. ${num.toLocaleString()}`;
  };

  const getCountsForFolder = (folder) => {
    if (!folder) return { zCount: 2, vCount: 2, pCount: 2 };
    const mItems = S.items.filter(i => i.fid === folder.id);
    const zCount = mItems.filter(i => i.type === "zoom").length + (folder.zoomUrl ? 1 : 0);
    const vCount = mItems.filter(i => i.type === "video" || getYoutubeEmbedUrl(i.url)).length;
    const pCount = mItems.filter(i => i.type === "pdf").length;
    return {
      zCount: zCount || 2,
      vCount: vCount || 2,
      pCount: pCount || 2
    };
  };

  const heroCounts = getCountsForFolder(currentMonthFolder);
  const heroStatus = currentMonthFolder ? st(currentMonthFolder.id) : "none";
  const heroUnlocked = heroStatus === "approved";
  const heroPending = heroStatus === "pending";

  return (
    <div className={`sd-root ${isDark ? "sd-dark" : "sd-light"}`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700&family=Nunito:wght@400;600;800&display=swap');

        .sd-root {
          --bg: #fbf6ee;
          --panel: #fff;
          --panel2: #f6ecdd;
          --ink: #2a1418;
          --muted: #6b5358;
          --line: #e8d9c4;
          --gold: #b86e00;
          --goldbg: #ffe3ad;
          --green: #0f7a4b;
          --greenbg: #d9f3e5;
          --maroon: #5a1424;
          --lockbg: #eee6dc;
          background: var(--bg);
          color: var(--ink);
          font-family: "Nunito", "Noto Sans Sinhala", system-ui, sans-serif;
          line-height: 1.6;
          font-size: 16px;
          min-height: 100vh;
          transition: background 0.25s ease, color 0.25s ease;
        }

        .sd-root.sd-dark {
          --bg: #1a0c10;
          --panel: #2a1519;
          --panel2: #351b20;
          --ink: #fff4e6;
          --muted: #d2b9b4;
          --line: #4a2a30;
          --gold: #ffc65a;
          --goldbg: #4a3411;
          --green: #1fa86a;
          --greenbg: #12402b;
          --maroon: #4a1220;
          --lockbg: #3a2428;
        }

        .sd-root.sd-dark .sd-brand,
        .sd-root.sd-dark .sd-h1 {
          color: #fff4e6;
        }

        .sd-root.sd-dark .sd-btn.alt {
          color: var(--gold) !important;
          border-color: var(--gold);
        }

        .sd-root .si {
          font-family: "Noto Sans Sinhala", "Nunito", sans-serif;
        }

        .sd-app {
          display: grid;
          grid-template-columns: 250px minmax(0, 1fr);
          min-height: calc(100vh - 58px);
          width: 100%;
        }

        .sd-aside {
          background: var(--panel);
          border-right: 1px solid var(--line);
          padding: 20px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sd-brand {
          font-weight: 800;
          font-size: 18px;
          padding: 4px 10px 16px;
          color: var(--maroon);
        }

        .sd-me {
          display: flex;
          gap: 10px;
          align-items: center;
          background: var(--panel2);
          border-radius: 14px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .sd-av {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: var(--gold);
          color: #fff;
          display: grid;
          place-items: center;
          font-weight: 800;
          flex-shrink: 0;
        }

        .sd-me b {
          display: block;
          line-height: 1.2;
          color: var(--ink);
        }

        .sd-me span {
          font-size: 13px;
          color: var(--muted);
        }

        .sd-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sd-nav-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 11px 14px;
          border-radius: 12px;
          color: var(--ink);
          background: transparent;
          border: 0;
          text-decoration: none;
          font-weight: 600;
          font-size: 15.5px;
          cursor: pointer;
          text-align: left;
          width: 100%;
          box-shadow: none;
        }

        .sd-nav-item:hover {
          background: var(--panel2);
          transform: none;
          box-shadow: none;
        }

        .sd-nav-item.on {
          background: var(--maroon);
          color: var(--bg);
        }

        .sd-nav-item em {
          font-style: normal;
          font-size: 13px;
          background: var(--goldbg);
          color: var(--gold);
          padding: 0 9px;
          border-radius: 99px;
          font-weight: 700;
        }

        .sd-main {
          padding: 28px clamp(20px, 3vw, 44px) 100px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .sd-crumb-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .sd-crumb {
          font-size: 14px;
          color: var(--muted);
        }

        .sd-h1 {
          font-size: clamp(26px, 3.2vw, 34px);
          margin: 4px 0 22px;
          color: var(--maroon);
          font-weight: 800;
          line-height: 1.25;
        }

        .sd-hero {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 0;
          background: var(--panel);
          border: 2px solid var(--gold);
          border-radius: 22px;
          overflow: hidden;
          width: 100%;
        }

        .sd-hero .l {
          padding: 26px 30px;
        }

        .sd-tag {
          display: inline-block;
          font-size: 13px;
          font-weight: 700;
          padding: 3px 12px;
          border-radius: 99px;
          margin: 0 6px 10px 0;
        }

        .sd-tag.t-now {
          background: var(--goldbg);
          color: var(--gold);
        }

        .sd-tag.t-ok {
          background: var(--greenbg);
          color: var(--green);
        }

        .sd-tag.t-lock {
          background: var(--lockbg);
          color: var(--muted);
        }

        .sd-hero h2 {
          font-size: clamp(20px, 2.2vw, 25px);
          line-height: 1.4;
          margin: 0 0 8px;
          color: var(--ink);
          font-weight: 800;
        }

        .sd-hero p {
          margin: 0 0 18px;
          color: var(--muted);
          max-width: 100%;
        }

        .sd-perks {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .sd-perk {
          background: var(--panel2);
          border-radius: 14px;
          padding: 12px 14px;
        }

        .sd-perk b {
          font-size: 22px;
          display: block;
          line-height: 1.1;
          color: var(--ink);
        }

        .sd-perk span {
          font-size: 13.5px;
          color: var(--muted);
        }

        .sd-subj {
          margin-top: 14px;
          font-size: 14px;
          color: var(--muted);
        }

        .sd-hero .r {
          background: var(--maroon);
          color: #fff4e6;
          padding: 26px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
          gap: 6px;
        }

        .sd-hero .r small {
          opacity: 0.85;
          font-size: 14px;
        }

        .sd-price {
          font-size: 44px;
          font-weight: 800;
          line-height: 1.1;
          color: #ffd27a;
        }

        .sd-btn {
          display: inline-block;
          background: var(--green);
          color: #fff !important;
          font-weight: 800;
          text-decoration: none;
          padding: 13px 16px;
          border-radius: 14px;
          margin-top: 10px;
          font-size: 16px;
          border: 0;
          cursor: pointer;
          text-align: center;
          box-shadow: none;
        }

        .sd-btn:hover {
          filter: brightness(1.08);
          transform: none;
        }

        .sd-btn.alt {
          background: transparent;
          color: var(--maroon) !important;
          border: 2px solid var(--maroon);
        }

        .sd-sec {
          margin-top: 34px;
        }

        .sd-sec h3 {
          font-size: 22px;
          margin: 0;
          color: var(--ink);
          font-weight: 800;
        }

        .sd-sec > p {
          color: var(--muted);
          margin: 2px 0 14px;
        }

        .sd-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .sd-tabs button {
          font: inherit;
          font-weight: 700;
          background: var(--panel);
          color: var(--ink);
          border: 1px solid var(--line);
          padding: 7px 16px;
          border-radius: 99px;
          cursor: pointer;
          box-shadow: none;
        }

        .sd-tabs button:hover {
          background: var(--panel2);
          transform: none;
        }

        .sd-tabs button[aria-pressed="true"] {
          background: var(--maroon);
          color: var(--bg);
          border-color: var(--maroon);
        }

        .sd-row {
          display: grid;
          grid-template-columns: 56px 1fr auto;
          gap: 16px;
          align-items: center;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 16px 18px;
          margin-bottom: 12px;
        }

        .sd-row.cur {
          border: 2px solid var(--gold);
        }

        .sd-ic {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-size: 26px;
          background: var(--goldbg);
        }

        .sd-row.lock .sd-ic {
          background: var(--lockbg);
        }

        .sd-row h4 {
          margin: 0 0 2px;
          font-size: 17px;
          line-height: 1.4;
          color: var(--ink);
          font-weight: 700;
        }

        .sd-row .m {
          font-size: 14px;
          color: var(--muted);
        }

        .sd-act {
          text-align: right;
          min-width: 150px;
        }

        .sd-act .sd-btn {
          margin: 0;
          padding: 10px 18px;
          display: inline-block;
        }

        .sd-act .fee {
          display: block;
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 4px;
        }

        .sd-tutor {
          position: fixed;
          right: 18px;
          bottom: calc(18px + env(safe-area-inset-bottom, 0px));
          display: flex;
          gap: 10px;
          align-items: center;
          background: var(--maroon);
          color: var(--bg) !important;
          padding: 10px 18px 10px 12px;
          border-radius: 99px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
          text-decoration: none;
          z-index: 90;
        }

        .sd-tutor i {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--gold);
          display: grid;
          place-items: center;
          font-style: normal;
          font-size: 18px;
        }

        .sd-tutor b {
          display: block;
          line-height: 1.2;
          font-size: 15px;
        }

        .sd-tutor span {
          font-size: 13px;
          opacity: 0.9;
        }

        @media (max-width: 820px) {
          .sd-app {
            grid-template-columns: 1fr;
          }
          .sd-aside {
            flex-direction: row;
            overflow-x: auto;
            align-items: center;
            padding: 10px;
          }
          .sd-brand,
          .sd-me {
            display: none;
          }
          .sd-nav {
            display: flex;
            flex-direction: row;
            gap: 4px;
          }
          .sd-nav-item {
            white-space: nowrap;
            width: auto;
          }
          .sd-hero {
            grid-template-columns: 1fr;
          }
          .sd-perks {
            grid-template-columns: 1fr 1fr 1fr;
          }
          .sd-row {
            grid-template-columns: 48px 1fr;
          }
          .sd-act {
            grid-column: 1 / -1;
            text-align: left;
          }
          .sd-ic {
            width: 48px;
            height: 48px;
          }
        }
      `}</style>

      <div className="sd-app">
        {/* Sidebar matching exact HTML template */}
        <aside className="sd-aside">
          <div className="sd-brand si">පහ දිනන හපන්නු · 190+</div>

          <div className="sd-me">
            <div className="sd-av">{avatarLetter}</div>
            <div style={{ minWidth: 0 }}>
              <b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentMe.name}
              </b>
              <span>Grade {selectedGrade} Student</span>
            </div>
          </div>

          <nav className="sd-nav">
            <button
              type="button"
              className={`sd-nav-item ${activeTab === "all_packages" && !open ? "on" : ""}`}
              onClick={() => { setOpen(null); setActiveTab("all_packages"); }}
            >
              <span>Monthly classes</span>
              <em>{gradeFolders.length}</em>
            </button>
            <button
              type="button"
              className={`sd-nav-item ${activeTab === "my_packages" && !open ? "on" : ""}`}
              onClick={() => { setOpen(null); setActiveTab("my_packages"); }}
            >
              <span>My unlocked months</span>
              {myUnlockedFolders.length > 0 && <em>{myUnlockedFolders.length}</em>}
            </button>
            <button
              type="button"
              className={`sd-nav-item ${activeTab === "overview" && !open ? "on" : ""}`}
              onClick={() => { setOpen(null); setActiveTab("overview"); }}
            >
              <span>Progress &amp; analysis</span>
            </button>
            <button
              type="button"
              className={`sd-nav-item ${activeTab === "timer" && !open ? "on" : ""}`}
              onClick={() => { setOpen(null); setActiveTab("timer"); }}
            >
              <span>Speed timer</span>
            </button>
            <button
              type="button"
              className={`sd-nav-item ${activeTab === "my_slips" && !open ? "on" : ""}`}
              onClick={() => { setOpen(null); setActiveTab("my_slips"); }}
            >
              <span>Payment slips</span>
            </button>

            <button
              type="button"
              className="sd-nav-item"
              onClick={() => {
                login(null);
                router.replace("/login");
              }}
              style={{
                marginTop: "auto",
                color: "#dc2626",
                border: "1px solid rgba(220, 38, 38, 0.25)",
                background: "rgba(220, 38, 38, 0.06)"
              }}
            >
              <span>🚪 {isSi ? "පිටවන්න (Logout)" : "Logout"}</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Workspace */}
        <main className="sd-main">
          {/* ================================================================ */}
          {/* VIEW A: INSIDE AN UNLOCKED MONTHLY CLASSROOM                     */}
          {/* ================================================================ */}
          {open ? (
            (() => {
              const f = S.folders.find(x => x.id === open);
              const isMonthUnlocked = f && st(f.id) === "approved";

              if (!f || !isMonthUnlocked) {
                return (
                  <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "22px", padding: "36px", textAlign: "center" }}>
                    <div style={{ fontSize: "40px", marginBottom: "10px" }}>🔒</div>
                    <h2 className="si" style={{ margin: "0 0 8px" }}>මෙම මාසයේ පන්තිය විවෘත කර නොමැත</h2>
                    <p style={{ color: "var(--muted)", maxWidth: "460px", margin: "0 auto 18px" }}>
                      Pay {formatRs(f?.price || 2000)} to unlock all Zoom live classes, recorded videos and PDF papers for this month.
                    </p>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                      {f && (
                        <button type="button" className="sd-btn" onClick={() => { setOpen(null); setPay(f); }}>
                          Pay &amp; unlock ({formatRs(f.price || 2000)})
                        </button>
                      )}
                      <button type="button" className="sd-btn alt" onClick={() => setOpen(null)}>
                        ← Back to monthly classes
                      </button>
                    </div>
                  </div>
                );
              }

              const rawItems = S.items.filter(i => i.fid === open);
              const zoomCount = rawItems.filter(i => i.type === "zoom").length;
              const videoCount = rawItems.filter(i => i.type === "video" || getYoutubeEmbedUrl(i.url)).length;
              const pdfCount = rawItems.filter(i => i.type === "pdf").length;

              const its = rawItems.filter(i => {
                const matchSub =
                  activeSubjectFilter === "all" ||
                  i.subject?.includes(activeSubjectFilter) ||
                  i.title?.includes(activeSubjectFilter);
                const isVid = i.type === "video" || Boolean(getYoutubeEmbedUrl(i.url));
                const matchType =
                  activeTypeFilter === "all" ||
                  (activeTypeFilter === "zoom" && i.type === "zoom") ||
                  (activeTypeFilter === "video" && isVid && i.type !== "zoom") ||
                  (activeTypeFilter === "pdf" && i.type === "pdf");
                return matchSub && matchType;
              });

              return (
                <>
                  <div className="sd-crumb-bar">
                    <div className="sd-crumb">
                      Grade {f.grade} / Monthly classes / <span className="si">{f.month}</span>
                    </div>
                    <button
                      type="button"
                      className="sd-btn alt"
                      style={{ margin: 0, padding: "7px 14px", fontSize: "14px" }}
                      onClick={() => setOpen(null)}
                    >
                      ← Back to monthly classes
                    </button>
                  </div>

                  <h1 className="sd-h1 si">{f.name}</h1>

                  {/* Zoom Live Class Hero Card inside the Month */}
                  <section className="sd-hero" style={{ marginBottom: "28px" }}>
                    <div className="l">
                      <span className="sd-tag t-now">🔴 ZOOM LIVE CLASS</span>
                      <span className="sd-tag t-ok">✓ Paid &amp; unlocked</span>
                      <h2 className="si">{f.month} - සජීවී Zoom පන්ති සම්බන්ධතාවය</h2>
                      <p className="si">
                        කාලසටහන: {f.zoomSchedule || "සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 - 9.00 (Zoom Live)"}
                      </p>
                      <div className="sd-perks">
                        <div className="sd-perk">
                          <b>{zoomCount + (f.zoomUrl ? 1 : 0)}</b>
                          <span>Zoom live links</span>
                        </div>
                        <div className="sd-perk">
                          <b>{videoCount}</b>
                          <span>Recorded videos</span>
                        </div>
                        <div className="sd-perk">
                          <b>{pdfCount}</b>
                          <span>PDF papers &amp; marking</span>
                        </div>
                      </div>
                      <div className="sd-subj si">විෂයන්: {f.subjects}</div>
                    </div>
                    <div className="r">
                      <small>Live Zoom Classroom</small>
                      <div className="sd-price" style={{ fontSize: "30px" }}>Zoom Live</div>
                      <small className="si">{f.month}</small>
                      {f.zoomUrl ? (
                        <a
                          className="sd-btn"
                          href={f.zoomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => recordZoomAttendance(f.id, "1 වන සතිය")}
                        >
                          Join Zoom Live Class ↗
                        </a>
                      ) : (
                        <span style={{ fontSize: "13px", opacity: 0.85 }}>Link activates at class time</span>
                      )}
                    </div>
                  </section>

                  {/* Materials Filter Tabs */}
                  <section className="sd-sec">
                    <h3>Class lessons, videos &amp; PDF papers</h3>
                    <p>All Zoom links, recorded video discussions, and printable PDF papers for this month.</p>

                    <div className="sd-tabs">
                      <button
                        type="button"
                        aria-pressed={activeTypeFilter === "all"}
                        onClick={() => setActiveTypeFilter("all")}
                      >
                        All materials ({rawItems.length})
                      </button>
                      <button
                        type="button"
                        aria-pressed={activeTypeFilter === "zoom"}
                        onClick={() => setActiveTypeFilter("zoom")}
                      >
                        Zoom live ({zoomCount})
                      </button>
                      <button
                        type="button"
                        aria-pressed={activeTypeFilter === "video"}
                        onClick={() => setActiveTypeFilter("video")}
                      >
                        Recorded videos ({videoCount})
                      </button>
                      <button
                        type="button"
                        aria-pressed={activeTypeFilter === "pdf"}
                        onClick={() => setActiveTypeFilter("pdf")}
                      >
                        PDF papers ({pdfCount})
                      </button>
                    </div>

                    {its.length ? (
                      <div>
                        {its.map(i => {
                          const isZoom = i.type === "zoom";
                          const isYt = !isZoom && Boolean(getYoutubeEmbedUrl(i.url));

                          return (
                            <article
                              key={i.id}
                              className={`sd-row ${isZoom ? "cur" : ""}`}
                              style={{
                                gridTemplateColumns: isYt ? "1fr" : "56px 1fr auto"
                              }}
                            >
                              {!isYt && (
                                <div className="sd-ic">
                                  {isZoom ? "🔴" : i.type === "video" ? "🎥" : "📄"}
                                </div>
                              )}

                              <div>
                                {i.week && (
                                  <span className="sd-tag t-now si" style={{ marginBottom: "4px" }}>
                                    {i.week}
                                  </span>
                                )}
                                <span className="sd-tag t-ok si" style={{ marginBottom: "4px" }}>
                                  {i.subject || "සියලු විෂයයන්"}
                                </span>
                                <h4 className="si" style={{ fontSize: isYt ? "19px" : "17px", marginBottom: isYt ? "12px" : "2px" }}>
                                  {i.title}
                                </h4>
                                {!isYt && (
                                  <div className="m">
                                    {isZoom
                                      ? (i.schedule || "Click to join Zoom live session")
                                      : "Printable PDF question paper & marking scheme"}
                                  </div>
                                )}

                                {isYt && (
                                  <div style={{ marginTop: "10px" }}>
                                    <VideoPlayer url={i.url} title={i.title} />
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", flexWrap: "wrap", gap: "8px" }}>
                                      <span className="m si">
                                        💡 වීඩියෝව නැරඹීමට පෙර PDF ප්‍රශ්න පත්‍රය තනිව විසඳා සිටීමෙන් ඔබේ වේගය දෙගුණ වේ.
                                      </span>
                                      <button
                                        type="button"
                                        className="sd-btn alt"
                                        style={{ margin: 0, padding: "7px 14px", fontSize: "13.5px" }}
                                        onClick={() => setTheaterVideo(i)}
                                      >
                                        ⛶ Theater Full View
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {!isYt && (
                                <div className="sd-act">
                                  <span className="fee">
                                    {isZoom ? "Zoom Live" : "PDF Document"}
                                  </span>
                                  <a
                                    className="sd-btn"
                                    href={i.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={i.fileName || undefined}
                                    onClick={() => {
                                      if (isZoom) recordZoomAttendance(f.id, i.week || "1 වන සතිය");
                                    }}
                                  >
                                    {isZoom ? "Join Zoom ↗" : "Open PDF ↗"}
                                  </a>
                                </div>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "18px", padding: "32px", textAlign: "center", color: "var(--muted)" }}>
                        No materials found for this filter yet.
                      </div>
                    )}
                  </section>
                </>
              );
            })()
          ) : (
            <>
              {/* Top Crumb (Automatically Personalized to Student's Grade without Grade Dropdown) */}
              <div className="sd-crumb">
                Grade {selectedGrade} /{" "}
                {activeTab === "all_packages" && "Monthly classes"}
                {activeTab === "my_packages" && "My unlocked months"}
                {activeTab === "overview" && "Progress & analysis"}
                {activeTab === "timer" && "Speed timer"}
                {activeTab === "my_slips" && "Payment slips"}
              </div>

              <h1 className="sd-h1">Welcome, {currentMe.name}! 👋</h1>

              {/* ============================================================ */}
              {/* TAB 1: MONTHLY CLASSES (EXACT REQUESTED DESIGN)              */}
              {/* ============================================================ */}
              {activeTab === "all_packages" && (
                <>
                  {/* CURRENT MONTH HERO SECTION */}
                  {currentMonthFolder && (
                    <section className="sd-hero">
                      <div className="l">
                        <span className="sd-tag t-now si">මෙම මාසයේ පන්තිය</span>
                        {heroUnlocked ? (
                          <span className="sd-tag t-ok">✓ Paid &amp; unlocked</span>
                        ) : heroPending ? (
                          <span className="sd-tag t-now">⏳ Receipt pending review</span>
                        ) : (
                          <span className="sd-tag t-lock">🔒 Locked · Pay to unlock</span>
                        )}

                        <h2 className="si">{currentMonthFolder.name}</h2>
                        <p className="si">
                          {currentMonthFolder.desc ||
                            `${currentMonthFolder.month} මාසයට අදාළ සියලුම සජීවී Zoom පන්ති, PDF ප්‍රශ්න පත්‍ර සහ වීඩියෝ පාඩම් මෙහි ඇතුළත් වේ.`}
                        </p>

                        <div className="sd-perks">
                          <div className="sd-perk">
                            <b>{heroCounts.zCount}</b>
                            <span>Zoom live classes</span>
                          </div>
                          <div className="sd-perk">
                            <b>{heroCounts.vCount}</b>
                            <span>Recorded videos</span>
                          </div>
                          <div className="sd-perk">
                            <b>{heroCounts.pCount}</b>
                            <span>PDF papers &amp; marking</span>
                          </div>
                        </div>

                        <div className="sd-subj si">
                          විෂයන්: {currentMonthFolder.subjects || "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි"}
                        </div>
                      </div>

                      <div className="r">
                        <small>Monthly class fee</small>
                        <div className="sd-price">{formatRs(currentMonthFolder.price || 2000)}</div>
                        <small>
                          {heroUnlocked
                            ? "Already paid ✓"
                            : heroPending
                            ? "Awaiting approval ⏳"
                            : "Unlocks entire month"}
                        </small>
                        {heroUnlocked ? (
                          <button
                            type="button"
                            className="sd-btn"
                            onClick={() => handleEnterMonth(currentMonthFolder)}
                          >
                            Enter this month’s class
                          </button>
                        ) : heroPending ? (
                          <button
                            type="button"
                            className="sd-btn"
                            style={{ opacity: 0.85 }}
                            onClick={() => handleEnterMonth(currentMonthFolder)}
                          >
                            Pending approval...
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="sd-btn"
                            onClick={() => setPay(currentMonthFolder)}
                          >
                            Pay &amp; unlock month
                          </button>
                        )}
                      </div>
                    </section>
                  )}

                  {/* MONTH-BY-MONTH LIST SECTION */}
                  <section className="sd-sec">
                    <h3>Month-by-month classes</h3>
                    <p>Pay Rs. 2,000 for any month to open its Zoom classes, videos and PDF papers.</p>

                    <div className="sd-tabs" id="tabs">
                      <button
                        type="button"
                        aria-pressed={monthFilter === "all"}
                        onClick={() => setMonthFilter("all")}
                      >
                        All months ({gradeFolders.length})
                      </button>
                      <button
                        type="button"
                        aria-pressed={monthFilter === "current"}
                        onClick={() => setMonthFilter("current")}
                      >
                        Current month
                      </button>
                      <button
                        type="button"
                        aria-pressed={monthFilter === "previous"}
                        onClick={() => setMonthFilter("previous")}
                      >
                        Previous months
                      </button>
                      <button
                        type="button"
                        aria-pressed={monthFilter === "unlocked"}
                        onClick={() => setMonthFilter("unlocked")}
                      >
                        Unlocked
                      </button>
                    </div>

                    <div id="list">
                      {displayedMonths.length ? (
                        displayedMonths.map(f => {
                          const s = st(f.id);
                          const isUnlocked = s === "approved";
                          const isPending = s === "pending";
                          const counts = getCountsForFolder(f);

                          return (
                            <article
                              key={f.id}
                              className={`sd-row ${f.isCurrentMonth ? "cur" : ""} ${!isUnlocked ? "lock" : ""}`}
                            >
                              <div className="sd-ic">
                                {f.isCurrentMonth ? "🔥" : isUnlocked ? "✓" : "🔒"}
                              </div>

                              <div>
                                {f.isCurrentMonth ? (
                                  <span className="sd-tag t-now si" style={{ marginBottom: "4px" }}>
                                    {f.month} · Current month
                                  </span>
                                ) : (
                                  <span className="sd-tag t-lock si" style={{ marginBottom: "4px" }}>
                                    {f.month} · Previous month
                                  </span>
                                )}

                                {isUnlocked ? (
                                  <span className="sd-tag t-ok" style={{ marginBottom: "4px" }}>
                                    ✓ Unlocked
                                  </span>
                                ) : isPending ? (
                                  <span className="sd-tag t-now" style={{ marginBottom: "4px" }}>
                                    ⏳ Pending review
                                  </span>
                                ) : (
                                  <span className="sd-tag t-lock" style={{ marginBottom: "4px" }}>
                                    Locked
                                  </span>
                                )}

                                <h4 className="si">{f.name || `${f.month} මාසයේ පන්තිය`}</h4>

                                <div className="m">
                                  {isUnlocked || f.isCurrentMonth
                                    ? `${counts.zCount} Zoom live · ${counts.vCount} videos · ${counts.pCount} PDFs`
                                    : "Pay to unlock all lessons and papers"}
                                </div>
                              </div>

                              <div className="sd-act">
                                {isUnlocked ? (
                                  <>
                                    <span className="fee">{formatRs(f.price || 2000)} · paid</span>
                                    <button
                                      type="button"
                                      className="sd-btn"
                                      onClick={() => handleEnterMonth(f)}
                                    >
                                      Enter class
                                    </button>
                                  </>
                                ) : isPending ? (
                                  <>
                                    <span className="fee">{formatRs(f.price || 2000)} · slip sent</span>
                                    <button
                                      type="button"
                                      className="sd-btn alt"
                                      onClick={() => handleEnterMonth(f)}
                                    >
                                      Pending...
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="fee">{formatRs(f.price || 2000)}</span>
                                    <button
                                      type="button"
                                      className="sd-btn alt"
                                      onClick={() => setPay(f)}
                                    >
                                      Pay &amp; unlock
                                    </button>
                                  </>
                                )}
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "18px", padding: "32px", textAlign: "center", color: "var(--muted)" }}>
                          No months found in this filter.
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}

              {/* ============================================================ */}
              {/* TAB 2: MY UNLOCKED MONTHS                                    */}
              {/* ============================================================ */}
              {activeTab === "my_packages" && (
                <section className="sd-sec" style={{ marginTop: 0 }}>
                  <h3>My unlocked months ({myUnlockedFolders.length})</h3>
                  <p>All monthly classes where your Rs. 2,000 fee has been paid and unlocked.</p>

                  {myUnlockedFolders.length ? (
                    <div>
                      {myUnlockedFolders.map(f => {
                        const counts = getCountsForFolder(f);
                        return (
                          <article key={f.id} className={`sd-row ${f.isCurrentMonth ? "cur" : ""}`}>
                            <div className="sd-ic">{f.isCurrentMonth ? "🔥" : "✓"}</div>
                            <div>
                              <span className="sd-tag t-now si" style={{ marginBottom: "4px" }}>
                                {f.month}
                              </span>
                              <span className="sd-tag t-ok" style={{ marginBottom: "4px" }}>
                                ✓ Unlocked
                              </span>
                              <h4 className="si">{f.name}</h4>
                              <div className="m">
                                {counts.zCount} Zoom live · {counts.vCount} videos · {counts.pCount} PDFs
                              </div>
                            </div>
                            <div className="sd-act">
                              <span className="fee">{formatRs(f.price || 2000)} · paid</span>
                              <button
                                type="button"
                                className="sd-btn"
                                onClick={() => handleEnterMonth(f)}
                              >
                                Enter class
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "18px", padding: "36px", textAlign: "center" }}>
                      <div style={{ fontSize: "34px", marginBottom: "8px" }}>🔒</div>
                      <h4 style={{ margin: "0 0 6px" }}>No unlocked months yet</h4>
                      <p style={{ color: "var(--muted)", margin: "0 auto 16px", maxWidth: "420px" }}>
                        Choose any month from the monthly classes list and upload your Rs. 2,000 bank slip to unlock it.
                      </p>
                      <button
                        type="button"
                        className="sd-btn"
                        onClick={() => setActiveTab("all_packages")}
                      >
                        Browse monthly classes
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* ============================================================ */}
              {/* TAB 3: PROGRESS & ANALYSIS                                   */}
              {/* ============================================================ */}
              {activeTab === "overview" && (
                <section className="sd-sec" style={{ marginTop: 0 }}>
                  <h3>190+ Progress &amp; Exam Analysis</h3>
                  <p>Your scholarship exam readiness, speed metrics, and 5-subject mastery.</p>

                  <div className="sd-perks" style={{ marginBottom: "22px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                    <div className="sd-perk" style={{ background: "var(--panel)", border: "2px solid var(--gold)" }}>
                      <b style={{ fontSize: "28px", color: "var(--gold)" }}>192 / 200</b>
                      <span>190+ Exam Readiness (96%)</span>
                    </div>
                    <div className="sd-perk" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
                      <b style={{ fontSize: "28px", color: "var(--green)" }}>2 / 2</b>
                      <span>Daily Provincial Papers Goal</span>
                    </div>
                    <div className="sd-perk" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
                      <b style={{ fontSize: "28px", color: "var(--maroon)" }}>38 sec</b>
                      <span>Avg Speed per Question (&lt;45s)</span>
                    </div>
                  </div>

                  <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "18px", padding: "22px" }}>
                    <h4 style={{ margin: "0 0 14px", fontSize: "18px" }}>5-Subject Mastery Breakdown (NIE Syllabus)</h4>
                    {[
                      { name: "🌿 පරිසරය (තේමා 16 සම්පූර්ණ ආවරණය)", pct: 96 },
                      { name: "✍️ මව්බස සිංහල (වියරණ, අක්ෂර වින්‍යාසය, රචනා)", pct: 94 },
                      { name: "🔢 ශිෂ්‍යත්ව ගණිතය (කෙටි ක්‍රම, රටා, ඔරලෝසු)", pct: 98 },
                      { name: "🗣️ දෙවන බස දෙමළ (1-19 සංවාද & වචන මාලාව)", pct: 90 },
                      { name: "🔤 ඉංග්‍රීසි ABOE (පින්තූර විස්තර, Plurals, Opposites)", pct: 92 },
                    ].map((s, idx) => (
                      <div key={idx} style={{ marginBottom: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>
                          <span className="si">{s.name}</span>
                          <span style={{ color: "var(--gold)" }}>{s.pct}%</span>
                        </div>
                        <div style={{ height: "10px", background: "var(--panel2)", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ width: `${s.pct}%`, height: "100%", background: "var(--green)", borderRadius: "99px" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ============================================================ */}
              {/* TAB 4: SPEED TIMER                                           */}
              {/* ============================================================ */}
              {activeTab === "timer" && (
                <section className="sd-sec" style={{ marginTop: 0 }}>
                  <h3>190+ Speed Practice Timer</h3>
                  <p>Practice completing each question within 45 seconds to finish ahead of exam time.</p>

                  <div style={{ background: "var(--panel)", border: "2px solid var(--gold)", borderRadius: "22px", padding: "36px 24px", textAlign: "center", maxWidth: "560px" }}>
                    <span className="sd-tag t-now">⏱️ Exam Time Management</span>
                    <div style={{ fontSize: "64px", fontWeight: 800, color: "var(--maroon)", margin: "12px 0", lineHeight: 1 }}>
                      {formatTimer(timerSeconds)}
                    </div>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" }}>
                      <button
                        type="button"
                        className="sd-btn"
                        style={{ margin: 0, padding: "11px 28px" }}
                        onClick={() => setTimerRunning(!timerRunning)}
                      >
                        {timerRunning ? "⏸ Pause" : "▶ Start Timer"}
                      </button>
                      <button
                        type="button"
                        className="sd-btn alt"
                        style={{ margin: 0, padding: "11px 22px" }}
                        onClick={() => { setTimerRunning(false); setTimerSeconds(45 * 60); }}
                      >
                        ↺ Reset
                      </button>
                    </div>
                    <div className="sd-tabs" style={{ justifyContent: "center", marginBottom: 0 }}>
                      <button type="button" onClick={() => setTimerPreset(45)}>45 mins (Paper I)</button>
                      <button type="button" onClick={() => setTimerPreset(75)}>75 mins (Paper II)</button>
                      <button type="button" onClick={() => setTimerPreset(30)}>30 mins (Quick Drill)</button>
                    </div>
                  </div>
                </section>
              )}

              {/* ============================================================ */}
              {/* TAB 5: PAYMENT SLIPS                                         */}
              {/* ============================================================ */}
              {activeTab === "my_slips" && (
                <section className="sd-sec" style={{ marginTop: 0 }}>
                  <h3>Payment slips ({mySlips.length})</h3>
                  <p>Track the status of your Rs. 2,000 monthly bank deposit slips.</p>

                  {mySlips.length ? (
                    <div>
                      {mySlips.map(p => {
                        const f = S.folders.find(x => x.id === p.fid) || {};
                        const isApp = p.status === "approved";
                        const isPen = p.status === "pending";
                        return (
                          <article key={p.id} className={`sd-row ${isApp ? "cur" : "lock"}`}>
                            <div className="sd-ic">{isApp ? "✓" : isPen ? "⏳" : "✕"}</div>
                            <div>
                              <span className="sd-tag t-now si" style={{ marginBottom: "4px" }}>
                                {f.month || "Monthly Class"}
                              </span>
                              <span className={`sd-tag ${isApp ? "t-ok" : "t-lock"}`} style={{ marginBottom: "4px" }}>
                                {isApp ? "✓ Approved" : isPen ? "⏳ Pending approval" : "Rejected"}
                              </span>
                              <h4 className="si">{f.name || "Monthly Class"}</h4>
                              <div className="m">Submitted on {p.date}</div>
                            </div>
                            <div className="sd-act">
                              <span className="fee">{formatRs(f.price || 2000)}</span>
                              {isApp && (
                                <button
                                  type="button"
                                  className="sd-btn"
                                  onClick={() => handleEnterMonth(f)}
                                >
                                  Enter class
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "18px", padding: "32px", textAlign: "center", color: "var(--muted)" }}>
                      You have not submitted any payment slips yet.
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* RS. 2,000 MONTHLY FEE PAYMENT MODAL                                  */}
      {/* ==================================================================== */}
      {pay && (
        <div className="app-modal-overlay" onClick={() => setPay(null)}>
          <div className="app-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "520px", background: "#fff", color: "#2a1418", border: "2px solid #b86e00" }}>
            <div className="app-modal-head">
              <div>
                <span className="sd-tag t-now si" style={{ marginBottom: "4px" }}>
                  {pay.month || `Grade ${pay.grade}`}
                </span>
                <h3 className="si" style={{ margin: 0, color: "#5a1424" }}>💳 {pay.name}</h3>
              </div>
              <button
                type="button"
                className="app-modal-close"
                onClick={() => setPay(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "#f6ecdd", padding: "14px 16px", borderRadius: "14px", marginBottom: "16px" }}>
              <strong style={{ fontSize: "16px", display: "block", color: "#5a1424" }}>
                Monthly class fee: {formatRs(pay.price || 2000)}
              </strong>
              <span className="si" style={{ fontSize: "13.5px", color: "#6b5358" }}>
                රු. {pay.price || 2000} ගෙවා රිසිට්පත උඩුගත කළ පසු මෙම මාසයේ සියලුම සජීවී Zoom පන්ති, වීඩියෝ සහ PDF ප්‍රශ්න පත්‍ර විවෘත වේ.
              </span>
            </div>

            <div className="app-form">
              <label className="app-label" style={{ color: "#2a1418", fontWeight: 700 }}>
                <span>Bank account details (බැංකු ගිණුම් විස්තර):</span>
              </label>
              <div style={{ background: "#fbf6ee", border: "1px solid #e8d9c4", borderRadius: "12px", padding: "14px" }}>
                <pre className="si" style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "13.5px", color: "#2a1418", lineHeight: 1.5 }}>
                  {S.set.bank}
                </pre>
                <button
                  type="button"
                  onClick={copyBankInfo}
                  className="sd-btn alt"
                  style={{ marginTop: "10px", padding: "6px 14px", fontSize: "13px" }}
                >
                  {copiedBank ? "✓ Copied" : "📋 Copy bank details"}
                </button>
              </div>

              <label className="app-label" style={{ marginTop: "12px", color: "#2a1418", fontWeight: 700 }}>
                <span>Upload Rs. 2,000 bank receipt / slip image:</span>
                <input
                  type="file"
                  accept="image/*"
                  className="app-input"
                  style={{ marginTop: "6px", background: "#fbf6ee", color: "#2a1418", borderColor: "#e8d9c4" }}
                  onChange={onFileChange}
                />
              </label>

              {filePreview && (
                <div style={{ textAlign: "center", marginTop: "8px" }}>
                  <img
                    src={filePreview}
                    alt="Slip preview"
                    style={{ maxHeight: "150px", maxWidth: "100%", borderRadius: "8px", border: "1px solid #e8d9c4" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={send}
                  className="sd-btn"
                  style={{ flex: 1, margin: 0 }}
                  disabled={!file}
                >
                  Submit receipt &amp; unlock
                </button>
                <button
                  type="button"
                  onClick={() => setPay(null)}
                  className="sd-btn alt"
                  style={{ margin: 0, padding: "12px 18px" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* THEATER VIDEO OVERLAY MODAL */}
      {theaterVideo && (
        <div
          className="video-theater-overlay"
          onClick={() => setTheaterVideo(null)}
        >
          <div
            className="video-theater-card"
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <div>
                <span className="sd-tag t-now si" style={{ marginBottom: "6px" }}>
                  🎥 {theaterVideo.subject || "Video Discussion"}
                </span>
                <h3 className="si" style={{ margin: 0, fontSize: "18px", color: "#fff" }}>
                  {theaterVideo.title}
                </h3>
              </div>
              <button
                type="button"
                className="sd-btn"
                onClick={() => setTheaterVideo(null)}
                style={{ margin: 0, padding: "6px 14px", fontSize: "13px" }}
              >
                ✕ Close
              </button>
            </div>

            <VideoPlayer url={theaterVideo.url} title={theaterVideo.title} />
          </div>
        </div>
      )}
    </div>
  );
}
