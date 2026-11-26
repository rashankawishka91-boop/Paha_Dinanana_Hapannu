"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp, uid, readFile, getYoutubeEmbedUrl } from "../../lib/Provider";
import DashboardSidebar from "../../components/DashboardSidebar";
import VideoPlayer from "../../components/VideoPlayer";

export default function Dash() {
  const { S, update, me, login, lang, ready } = useApp();
  const router = useRouter();

  const isSi = lang === "si";

  // Default landing tab: "all_packages" (Monthly Classes List directly on dashboard!)
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
      setSelectedGrade(Number(activeUser.grade) || 5);
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
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f6f1ec", color: "#2a1a1a", fontFamily: "Figtree, sans-serif" }}>
        <p style={{ fontWeight: 600 }}>{isSi ? "ශිෂ්‍ය පුවරුව සූදානම් වෙමින් පවතී..." : "Loading Student Dashboard..."}</p>
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
    // Also persist the student's chosen grade in their user account
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
        isSi
          ? "ඔබගේ රු. 2000 ගෙවීම් රිසිට්පත ගුරුතුමා විසින් පරීක්ෂා කරමින් පවතී. අනුමත වූ වහාම මෙම මාසයේ සියලුම පන්ති විවෘත වේ."
          : "Your Rs. 2000 payment receipt is being reviewed by the teacher. All classes in this month will unlock once approved."
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
      return alert(isSi ? "කරුණාකර රිසිට්පත් ඡායාරූපය තෝරන්න." : "Please choose your bank receipt image.");
    }
    if (file.size > 1.5e6) {
      return alert(isSi ? "රූපයේ ප්‍රමාණය 1.5MB ට අඩු විය යුතුය." : "Image size must be under 1.5MB.");
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
        isSi
          ? "රු. 2000 මාසික ගෙවීම් රිසිට්පත සාර්ථකව ලැබුණි! ගුරුතුමා අනුමත කළ විගස මෙම මාසයේ සියලුම පන්ති (Zoom, Video, PDF) විවෘත වේ."
          : "Rs. 2000 monthly fee receipt submitted! Once approved by the teacher, all Zoom, Video, and PDF lessons for this month will unlock."
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

  // Unlocked folders for this student's grade (or all grades)
  const myUnlockedFolders = S.folders.filter(f => st(f.id) === "approved");
  // Student's submitted payments
  const mySlips = S.pays.filter(p => p.uid === currentMe.id);

  // ============================================================================
  // INSIDE A MONTHLY CLASSROOM VIEW (ONLY ACCESSIBLE WHEN PAID & APPROVED)
  // ============================================================================
  if (open) {
    const f = S.folders.find(x => x.id === open);
    const isMonthUnlocked = f && st(f.id) === "approved";

    // Safety guard: only paid months can be entered
    if (!f || !isMonthUnlocked) {
      return (
        <div className="app">
          <DashboardSidebar
            role="student"
            activeTab={activeTab}
            onTabChange={(t) => { setOpen(null); setActiveTab(t); }}
            foldersCount={gradeFolders.length}
          />
          <main>
            <section className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🔒</div>
              <h2>{isSi ? "මෙම මාසයේ පන්තිය විවෘත කර නොමැත" : "This Monthly Class is Locked"}</h2>
              <p style={{ maxWidth: "460px", margin: "8px auto 20px", color: "var(--muted)" }}>
                {isSi
                  ? `මෙම මාසයට අදාළ සියලුම Zoom සජීවී පන්ති, වීඩියෝ සාකච්ඡා සහ PDF ප්‍රශ්න පත්‍ර ලබාගැනීමට රු. ${f?.price || 2000} මාසික පන්ති ගාස්තුව ගෙවා විවෘත කරගන්න.`
                  : `Please pay the Rs. ${f?.price || 2000} monthly fee to unlock all Zoom live classes, videos, and PDFs for this month.`}
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                {f && (
                  <button type="button" className="btn gold" onClick={() => { setOpen(null); setPay(f); }}>
                    💳 {isSi ? `රු. ${f.price || 2000} ගෙවා විවෘත කරගන්න` : `Pay Rs. ${f.price || 2000} to Unlock`}
                  </button>
                )}
                <button type="button" className="btn" onClick={() => setOpen(null)}>
                  ⬅️ {isSi ? "ආපසු මාසික පන්ති වෙත" : "Back to Monthly Classes"}
                </button>
              </div>
            </section>
          </main>
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

    const subjectsList = isSi
      ? [
          { id: "all", label: "🌟 සියලු විෂයයන්" },
          { id: "පරිසරය", label: "පරිසරය" },
          { id: "මව්බස", label: "මව්බස" },
          { id: "ගණිතය", label: "ගණිතය" },
          { id: "දෙමළ", label: "දෙමළ" },
          { id: "ඉංග්‍රීසි", label: "ඉංග්‍රීසි" },
        ]
      : [
          { id: "all", label: "🌟 All Subjects" },
          { id: "පරිසරය", label: "Environment" },
          { id: "මව්බස", label: "Mother Tongue" },
          { id: "ගණිතය", label: "Mathematics" },
          { id: "දෙමළ", label: "Tamil" },
          { id: "ඉංග්‍රීසි", label: "English" },
        ];

    return (
      <div className="app">
        <DashboardSidebar
          role="student"
          activeTab={activeTab}
          onTabChange={(t) => { setOpen(null); setActiveTab(t); }}
          foldersCount={gradeFolders.length}
        />

        <main>
          {/* Top Bar */}
          <div className="top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span className="sp" style={{ fontWeight: 700 }}>
                📅 {f.month || (isSi ? "මාසික පන්තිය" : "Monthly Class")}
              </span>
              {f.isCurrentMonth && (
                <span className="badge-tag gold" style={{ fontSize: "11.5px" }}>
                  🔥 {isSi ? "මේ මාසයේ සජීවී පන්තිය" : "Current Active Month"}
                </span>
              )}
              <span className="badge-tag ok" style={{ fontSize: "11.5px" }}>
                ✅ {isSi ? "රු. 2000 ගෙවා විවෘත කර ඇත" : "Paid & Unlocked"}
              </span>
            </div>
            <button
              type="button"
              className="hd-btn hd-btn-ghost"
              onClick={() => setOpen(null)}
            >
              <span>⬅️ {isSi ? "ආපසු මාස ලැයිස්තුවට" : "Back to Months"}</span>
            </button>
          </div>

          {/* Monthly Class Header */}
          <div className="head" style={{ marginTop: "14px" }}>
            <div>
              <h1 style={{ fontSize: "1.5rem", marginBottom: "4px" }}>{f.name}</h1>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
                {isSi
                  ? `${f.grade} ශ්‍රේණිය · ${f.month || ""} මාසයට අදාළ සියලුම Zoom සජීවී පන්ති, වීඩියෝ සාකච්ඡා සහ PDF ප්‍රශ්න පත්‍ර`
                  : `Grade ${f.grade} · All Zoom live classes, video discussions & PDF papers for ${f.month || "this month"}`}
              </p>
            </div>
          </div>

          {/* PROMINENT ZOOM LIVE CLASS BANNER FOR THIS MONTH */}
          <section
            className="card"
            style={{
              marginTop: "14px",
              background: "linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(29, 78, 216, 0.06))",
              border: "2px solid rgba(59, 130, 246, 0.45)",
              borderRadius: "16px",
              padding: "20px 22px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ flex: 1, minWidth: "260px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                  <span
                    className="badge-tag"
                    style={{
                      background: "#2563eb",
                      color: "#fff",
                      fontWeight: 700,
                      padding: "3px 10px",
                      fontSize: "12px"
                    }}
                  >
                    🔴 ZOOM LIVE
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#1d4ed8" }}>
                    {f.month} - {isSi ? `${f.grade} ශ්‍රේණිය සජීවී පන්තිය` : `Grade ${f.grade} Live Class`}
                  </span>
                </div>
                <h2 style={{ fontSize: "1.2rem", margin: "0 0 4px" }}>
                  {isSi ? "මෙම මාසයේ සජීවී Zoom පන්තියට සම්බන්ධ වන්න" : "Join This Month's Zoom Live Class"}
                </h2>
                <p style={{ margin: 0, fontSize: "13.5px", color: "var(--muted)" }}>
                  ⏰ <b>{isSi ? "පන්ති කාලසටහන:" : "Class Schedule:"}</b>{" "}
                  {f.zoomSchedule || (isSi ? "සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 ට" : "Every Saturday & Sunday at 7:00 PM")}
                </p>
              </div>

              {f.zoomUrl ? (
                <a
                  href={f.zoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "#fff",
                    fontWeight: 700,
                    padding: "11px 20px",
                    fontSize: "14px",
                    borderRadius: "12px",
                    boxShadow: "0 6px 18px rgba(37, 99, 235, 0.35)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    textDecoration: "none"
                  }}
                >
                  <span>🎥 {isSi ? "Zoom සජීවී පන්තියට සම්බන්ධ වන්න ↗" : "Join Zoom Live Class ↗"}</span>
                </a>
              ) : (
                <span className="badge-tag" style={{ background: "var(--bg)", color: "var(--muted)" }}>
                  {isSi ? "Zoom සබැඳිය පන්ති වේලාවට පෙර යාවත්කාලීන කෙරේ" : "Zoom link will be updated before class"}
                </span>
              )}
            </div>
          </section>

          {/* Content Type Tabs (All / Zoom Live / Video / PDF) & Subject Filter */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginTop: "18px"
            }}
          >
            {/* Type Filter Pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`btn ${activeTypeFilter === "all" ? "gold" : ""}`}
                style={{ padding: "6px 14px", fontSize: "13px" }}
                onClick={() => setActiveTypeFilter("all")}
              >
                🌟 {isSi ? `සියල්ල (${rawItems.length})` : `All (${rawItems.length})`}
              </button>
              <button
                type="button"
                className={`btn ${activeTypeFilter === "zoom" ? "gold" : ""}`}
                style={{ padding: "6px 14px", fontSize: "13px" }}
                onClick={() => setActiveTypeFilter("zoom")}
              >
                🔴 {isSi ? `Zoom සජීවී පන්ති (${zoomCount})` : `Zoom Live (${zoomCount})`}
              </button>
              <button
                type="button"
                className={`btn ${activeTypeFilter === "video" ? "gold" : ""}`}
                style={{ padding: "6px 14px", fontSize: "13px" }}
                onClick={() => setActiveTypeFilter("video")}
              >
                🎥 {isSi ? `වීඩියෝ සාකච්ඡා (${videoCount})` : `Videos (${videoCount})`}
              </button>
              <button
                type="button"
                className={`btn ${activeTypeFilter === "pdf" ? "gold" : ""}`}
                style={{ padding: "6px 14px", fontSize: "13px" }}
                onClick={() => setActiveTypeFilter("pdf")}
              >
                📄 {isSi ? `PDF ප්‍රශ්න පත්‍ර (${pdfCount})` : `PDF Papers (${pdfCount})`}
              </button>
            </div>

            {/* Subject Filter Pills */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {subjectsList.map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  className={`btn ${activeSubjectFilter === sub.id ? "gold" : ""}`}
                  style={{ padding: "5px 11px", fontSize: "12px" }}
                  onClick={() => setActiveSubjectFilter(sub.id)}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          {/* Classroom Items List (Zoom Sessions, Videos, PDFs) */}
          <section className="card" style={{ marginTop: "14px" }}>
            {its.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {its.map(i => {
                  const isZoom = i.type === "zoom";
                  const isYt = !isZoom && Boolean(getYoutubeEmbedUrl(i.url));

                  return (
                    <div
                      key={i.id}
                      style={{
                        background: isZoom ? "rgba(37, 99, 235, 0.05)" : "var(--bg)",
                        border: isZoom ? "1px solid rgba(59, 130, 246, 0.35)" : "1px solid var(--line)",
                        borderRadius: "14px",
                        padding: "18px"
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px", flexWrap: "wrap" }}>
                        {i.week && (
                          <span className="badge-tag" style={{ background: "var(--surface)", fontWeight: 700 }}>
                            🗓️ {i.week}
                          </span>
                        )}
                        <span className="badge-tag gold">
                          {i.subject || (isSi ? "විෂයයන් 5ම" : "All Subjects")}
                        </span>
                        <span
                          className="badge-tag"
                          style={{
                            background: isZoom ? "#2563eb" : "var(--surface)",
                            color: isZoom ? "#fff" : "var(--muted)"
                          }}
                        >
                          {isZoom
                            ? (isSi ? "🔴 Zoom සජීවී පන්තිය" : "🔴 Zoom Live Class")
                            : isYt || i.type === "video"
                            ? (isSi ? "🎥 වීඩියෝ විවරණය" : "🎥 Video Discussion")
                            : (isSi ? "📄 PDF ප්‍රශ්න පත්‍රය / සටහන" : "📄 PDF Paper / Note")}
                        </span>
                      </div>

                      <h2 style={{ fontSize: "1.15rem", marginBottom: "10px", lineHeight: 1.4 }}>
                        {i.title}
                      </h2>

                      {i.schedule && (
                        <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--muted)" }}>
                          ⏰ <b>{isSi ? "වේලාව:" : "Time:"}</b> {i.schedule}
                        </p>
                      )}

                      {isZoom ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                          <a
                            href={i.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn"
                            style={{
                              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                              color: "#fff",
                              padding: "9px 18px",
                              fontSize: "13.5px",
                              fontWeight: 700
                            }}
                          >
                            <span>🎥 {isSi ? "Zoom පන්තියට සම්බන්ධ වන්න ↗" : "Join Zoom Live Session ↗"}</span>
                          </a>
                        </div>
                      ) : isYt ? (
                        <div>
                          <VideoPlayer url={i.url} title={i.title} />
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "10px" }}>
                            <div className="tip" style={{ flex: 1, minWidth: "260px", margin: 0, padding: "8px 12px", fontSize: "12.5px" }}>
                              <b>{isSi ? "💡 190+ රහස:" : "💡 190+ Secret:"}</b>{" "}
                              {isSi
                                ? "වීඩියෝව නැරඹීමට පෙර PDF ප්‍රශ්න පත්‍රය බාගත කර තනිව පිළිතුරු ලියා සිටීමෙන් ඔබේ වේගය හා දැනුම දෙගුණ වේ."
                                : "Solve the PDF paper first before watching the video discussion to build exam speed."}
                            </div>
                            <button
                              type="button"
                              className="btn gold"
                              style={{ padding: "7px 14px", fontSize: "12.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                              onClick={() => setTheaterVideo(i)}
                            >
                              <span>⛶ {isSi ? "විශාල තිරයෙන් නරඹන්න" : "Theater Full View"}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                          <a
                            className="btn gold"
                            href={i.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ padding: "9px 18px", fontSize: "13px" }}
                          >
                            <svg><use href="#doc" /></svg>
                            <span>
                              {i.type === "video"
                                ? (isSi ? "වීඩියෝව විවෘත කරන්න ↗" : "Open Video Link ↗")
                                : (isSi ? "📄 PDF ප්‍රශ්න පත්‍රය බාගත කරන්න / බලන්න" : "📄 Download / View PDF Paper")}
                            </span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "35px", textAlign: "center", color: "var(--muted)" }}>
                <p>{isSi ? "තෝරාගත් කාණ්ඩය යටතේ තවම පාඩම් එක්කර නොමැත." : "No lessons found for this filter yet."}</p>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // ============================================================================
  // MAIN STUDENT DASHBOARD WORKSPACE (GRADE-PERSONALIZED & MONTHLY LIST)
  // ============================================================================
  const currentMonthFolder = gradeFolders.find(f => f.isCurrentMonth) || gradeFolders[0];

  return (
    <div className="app">
      {/* Royal Burgundy Sidebar */}
      <DashboardSidebar
        role="student"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        foldersCount={gradeFolders.length}
      />

      {/* Main Student Workspace */}
      <main>
        {/* Personalized Grade Top Bar */}
        <div className="top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span className="sp" style={{ fontWeight: 800 }}>
              {isSi ? `🎓 ${selectedGrade} ශ්‍රේණියේ ශිෂ්‍ය පුවරුව` : `🎓 Grade ${selectedGrade} Student Dashboard`}
            </span>
            <span className="badge-tag gold" style={{ fontSize: "11.5px", padding: "3px 10px" }}>
              {selectedGrade === 5
                ? (isSi ? "🔥 190+ ශිෂ්‍යත්ව විශේෂ පන්තිය" : "🔥 190+ Scholarship Target Class")
                : (isSi ? `${selectedGrade} ශ්‍රේණිය මාසික පන්තිය` : `Grade ${selectedGrade} Monthly Class`)}
            </span>
          </div>

          {/* Grade Switcher (Defaults to Student's Registered Grade, allows switching if needed) */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
              {isSi ? "ඔබගේ ශ්‍රේණිය:" : "Your Grade:"}
            </span>
            <select
              value={selectedGrade}
              onChange={(e) => handleGradeChange(e.target.value)}
              style={{
                padding: "4px 10px",
                borderRadius: "8px",
                border: "1px solid var(--gold)",
                background: "var(--surface)",
                color: "var(--ink)",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {[5, 4, 3, 2, 1].map(g => (
                <option key={g} value={g}>
                  {isSi ? `${g} ශ්‍රේණිය ${g === 5 ? "(190+ පන්තිය)" : ""}` : `Grade ${g} ${g === 5 ? "(190+)" : ""}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Page Welcome Head */}
        <div className="head" style={{ marginTop: "12px", marginBottom: "18px" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "12.5px", color: "var(--muted)" }}>
              {isSi ? `${selectedGrade} ශ්‍රේණිය` : `Grade ${selectedGrade}`} / {" "}
              {activeTab === "all_packages" && (isSi ? "මාසික පන්ති ලැයිස්තුව" : "Monthly Classes List")}
              {activeTab === "my_packages" && (isSi ? "මගේ විවෘත මාස" : "My Unlocked Months")}
              {activeTab === "overview" && (isSi ? "190+ ප්‍රගති විශ්ලේෂණය" : "Progress & Analysis")}
              {activeTab === "timer" && (isSi ? "වේග පාලන කාල ගණකය" : "Speed Practice Timer")}
              {activeTab === "my_slips" && (isSi ? "ගෙවීම් රිසිට්පත්" : "Payment Slips")}
            </p>
            <h1 style={{ fontSize: "1.55rem", fontWeight: 800, margin: 0 }}>
              {isSi ? `ආයුබෝවන්, ${currentMe.name}! 👋` : `Welcome, ${currentMe.name}! 👋`}
            </h1>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <Link className="hd-btn hd-btn-ai" href="/ai-tutor" style={{ padding: "6px 14px", height: "32px" }}>
              🤖 <span>{isSi ? "190+ AI සහයක" : "190+ AI Tutor"}</span>
            </Link>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1 (DEFAULT): MONTH-BY-MONTH CLASSES LIST FOR STUDENT'S GRADE     */}
        {/* ==================================================================== */}
        {activeTab === "all_packages" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* HIGHLIGHTED CURRENT MONTH HERO CARD */}
            {currentMonthFolder && (
              <section
                className="card"
                style={{
                  background: "linear-gradient(135deg, rgba(245, 166, 35, 0.16), rgba(255, 251, 235, 0.95))",
                  border: "2px solid var(--gold)",
                  borderRadius: "18px",
                  padding: "22px 24px",
                  boxShadow: "0 12px 32px rgba(245, 166, 35, 0.18)",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                  <div style={{ flex: 1, minWidth: "280px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                      <span
                        className="badge-tag gold"
                        style={{
                          background: "linear-gradient(135deg, #f5a623, #d97706)",
                          color: "#1a0800",
                          fontWeight: 800,
                          fontSize: "12px",
                          padding: "4px 12px"
                        }}
                      >
                        🔥 {isSi ? `මේ මාසයේ ප්‍රධාන පන්තිය (${currentMonthFolder.month || "වත්මන් මාසය"})` : `CURRENT MONTH CLASS (${currentMonthFolder.month || "Active"})`}
                      </span>
                      <span className="badge-tag" style={{ background: "var(--surface)", fontWeight: 700 }}>
                        🎓 {isSi ? `${selectedGrade} ශ්‍රේණිය` : `Grade ${selectedGrade}`}
                      </span>
                      {st(currentMonthFolder.id) === "approved" ? (
                        <span className="badge-tag ok" style={{ fontWeight: 700 }}>
                          ✅ {isSi ? "ගාස්තු ගෙවා ඇත - විවෘතයි" : "Paid & Unlocked"}
                        </span>
                      ) : st(currentMonthFolder.id) === "pending" ? (
                        <span className="badge-tag gold" style={{ fontWeight: 700 }}>
                          ⏳ {isSi ? "රිසිට්පත පරීක්ෂා වෙමින්" : "Receipt Pending"}
                        </span>
                      ) : (
                        <span className="badge-tag warn" style={{ fontWeight: 700 }}>
                          🔒 {isSi ? `මාසික ගාස්තුව රු. ${currentMonthFolder.price || 2000}` : `Monthly Fee Rs. ${currentMonthFolder.price || 2000}`}
                        </span>
                      )}
                    </div>

                    <h2 style={{ fontSize: "1.35rem", margin: "0 0 8px", color: "var(--ink)" }}>
                      {currentMonthFolder.name}
                    </h2>

                    <p style={{ margin: "0 0 12px", fontSize: "13.5px", color: "var(--muted)", lineHeight: 1.5 }}>
                      {currentMonthFolder.desc || (
                        isSi
                          ? `රු. ${currentMonthFolder.price || 2000} මාසික පන්ති ගාස්තුව ගෙවූ පසු මෙම මාසයේ පැවැත්වෙන සියලුම සජීවී Zoom පන්ති, වීඩියෝ සාකච්ඡා සහ PDF ප්‍රශ්න පත්‍ර සියල්ලටම පිවිසිය හැක.`
                          : `Pay the Rs. ${currentMonthFolder.price || 2000} monthly fee to access all Zoom live classes, recorded video discussions, and PDF papers for this month.`
                      )}
                    </p>

                    {/* What's Inside This Month Pills */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", fontSize: "12.5px" }}>
                      <span style={{ background: "var(--surface)", padding: "5px 11px", borderRadius: "8px", border: "1px solid var(--line)", fontWeight: 600 }}>
                        🔴 {isSi ? "සජීවී Zoom පන්ති සබැඳිය" : "Zoom Live Class Link"}
                      </span>
                      <span style={{ background: "var(--surface)", padding: "5px 11px", borderRadius: "8px", border: "1px solid var(--line)", fontWeight: 600 }}>
                        🎥 {isSi ? "පටිගත කළ වීඩියෝ විවරණ" : "Recorded Video Lessons"}
                      </span>
                      <span style={{ background: "var(--surface)", padding: "5px 11px", borderRadius: "8px", border: "1px solid var(--line)", fontWeight: 600 }}>
                        📄 {isSi ? "PDF ප්‍රශ්න පත්‍ර සහ පිළිතුරු" : "PDF Papers & Marking"}
                      </span>
                      <span style={{ background: "var(--surface)", padding: "5px 11px", borderRadius: "8px", border: "1px solid var(--line)", fontWeight: 600 }}>
                        🎯 {currentMonthFolder.subjects}
                      </span>
                    </div>
                  </div>

                  {/* Price & Enter / Pay Action Box */}
                  <div
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: "14px",
                      padding: "16px 20px",
                      minWidth: "240px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      alignSelf: "center"
                    }}
                  >
                    <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
                      {isSi ? "මාසික පන්ති ගාස්තුව" : "Monthly Class Fee"}
                    </div>
                    <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--gold-ink)", lineHeight: 1 }}>
                      {isSi ? `රු. ${currentMonthFolder.price || 2000}` : `Rs. ${currentMonthFolder.price || 2000}`}
                    </div>

                    {st(currentMonthFolder.id) === "approved" ? (
                      <button
                        type="button"
                        className="btn wa"
                        style={{ width: "100%", justifyContent: "center", padding: "11px 16px", fontSize: "13.5px", fontWeight: 700 }}
                        onClick={() => handleEnterMonth(currentMonthFolder)}
                      >
                        <span>🚪 {isSi ? "මේ මාසයේ පන්තිය ඇතුළට යන්න" : "Enter Current Month Class"}</span>
                      </button>
                    ) : st(currentMonthFolder.id) === "pending" ? (
                      <div style={{ padding: "8px", background: "var(--bg)", borderRadius: "8px", fontSize: "12.5px", color: "var(--muted)" }}>
                        ⏳ {isSi ? "රිසිට්පත අනුමත වූ වහාම පන්තිය විවෘත වේ" : "Unlocks once receipt is approved"}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn gold"
                        style={{ width: "100%", justifyContent: "center", padding: "11px 16px", fontSize: "13.5px", fontWeight: 700 }}
                        onClick={() => setPay(currentMonthFolder)}
                      >
                        <span>💳 {isSi ? `රු. ${currentMonthFolder.price || 2000} ගෙවා පන්තියට ඇතුල් වන්න` : `Pay Rs. ${currentMonthFolder.price || 2000} & Enter Class`}</span>
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ALL MONTHS & PREVIOUS MONTHS LIST */}
            <section className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", margin: 0 }}>
                    📅 {isSi ? `${selectedGrade} ශ්‍රේණිය - මාසෙන් මාසෙට පන්ති ලැයිස්තුව` : `Grade ${selectedGrade} - Month-by-Month Classes`}
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: "13.5px", color: "var(--muted)" }}>
                    {isSi
                      ? "අදාළ මාසයේ රු. 2000 ගාස්තුව ගෙවූ පසු එම මාසයේ සියලුම Zoom සජීවී පන්ති, වීඩියෝ සහ PDF ප්‍රශ්න පත්‍රවලට පිවිසිය හැක."
                      : "Pay the Rs. 2000 monthly fee for any month to access all Zoom live classes, videos, and PDF papers inside that month."}
                  </p>
                </div>

                {/* Filter: All Months / Current Month / Previous Months / Unlocked */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={`btn ${monthFilter === "all" ? "gold" : ""}`}
                    style={{ padding: "6px 12px", fontSize: "12.5px" }}
                    onClick={() => setMonthFilter("all")}
                  >
                    🌟 {isSi ? `සියලුම මාස (${gradeFolders.length})` : `All Months (${gradeFolders.length})`}
                  </button>
                  <button
                    type="button"
                    className={`btn ${monthFilter === "current" ? "gold" : ""}`}
                    style={{ padding: "6px 12px", fontSize: "12.5px" }}
                    onClick={() => setMonthFilter("current")}
                  >
                    🔥 {isSi ? "මේ මාසයේ පන්තිය" : "Current Month"}
                  </button>
                  <button
                    type="button"
                    className={`btn ${monthFilter === "previous" ? "gold" : ""}`}
                    style={{ padding: "6px 12px", fontSize: "12.5px" }}
                    onClick={() => setMonthFilter("previous")}
                  >
                    ⏪ {isSi ? "පසුගිය මාසවල පන්ති" : "Previous Months"}
                  </button>
                  <button
                    type="button"
                    className={`btn ${monthFilter === "unlocked" ? "gold" : ""}`}
                    style={{ padding: "6px 12px", fontSize: "12.5px" }}
                    onClick={() => setMonthFilter("unlocked")}
                  >
                    ✅ {isSi ? "ගෙවීම් කළ මාස" : "Unlocked Months"}
                  </button>
                </div>
              </div>

              {/* Monthly Classes Cards Grid */}
              {displayedMonths.length ? (
                <div className="pkg-grid">
                  {displayedMonths.map(f => {
                    const s = st(f.id);
                    const isUnlocked = s === "approved";
                    const isPending = s === "pending";
                    const monthItems = S.items.filter(i => i.fid === f.id);
                    const vCount = monthItems.filter(i => i.type === "video" || getYoutubeEmbedUrl(i.url)).length;
                    const pCount = monthItems.filter(i => i.type === "pdf").length;

                    return (
                      <div
                        key={f.id}
                        className="pkg-card"
                        style={{
                          minHeight: "300px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          border: f.isCurrentMonth ? "2px solid var(--gold)" : "1px solid var(--line)",
                          background: f.isCurrentMonth
                            ? "linear-gradient(180deg, rgba(245, 166, 35, 0.08), var(--surface))"
                            : "var(--surface)",
                          boxShadow: f.isCurrentMonth ? "0 8px 24px rgba(245, 166, 35, 0.14)" : undefined
                        }}
                      >
                        <div>
                          {/* Month & Current/Past Badge */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                            <span
                              className="badge-tag gold"
                              style={{
                                fontWeight: 800,
                                background: f.isCurrentMonth ? "linear-gradient(135deg, #f5a623, #d97706)" : undefined,
                                color: f.isCurrentMonth ? "#1a0800" : undefined
                              }}
                            >
                              📅 {f.month || (isSi ? "මාසික පන්තිය" : "Monthly Class")}
                            </span>

                            {f.isCurrentMonth ? (
                              <span className="badge-tag" style={{ background: "#fef3c7", color: "#b45309", fontWeight: 700 }}>
                                🔥 {isSi ? "මේ මාසය" : "Current Month"}
                              </span>
                            ) : (
                              <span className="badge-tag" style={{ background: "var(--bg)", color: "var(--muted)" }}>
                                ⏪ {isSi ? "පසුගිය මාසය" : "Past Month"}
                              </span>
                            )}
                          </div>

                          <h3
                            style={{
                              fontSize: "1.08rem",
                              lineHeight: 1.35,
                              marginBottom: "8px",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              minHeight: "44px"
                            }}
                          >
                            {f.name}
                          </h3>

                          <div style={{ fontSize: "12.5px", color: "var(--ink)", marginBottom: "10px" }}>
                            🎯 <b>{isSi ? "විෂයයන්:" : "Subjects:"}</b>{" "}
                            {f.subjects || (isSi ? "විෂයයන් 5ම සම්පූර්ණයෙන්ම" : "All 5 Subjects")}
                          </div>

                          {/* Included Resources Summary inside the Month */}
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexWrap: "wrap",
                              padding: "8px 10px",
                              background: "var(--bg)",
                              borderRadius: "10px",
                              fontSize: "11.5px",
                              fontWeight: 600
                            }}
                          >
                            <span style={{ color: "#2563eb" }}>🔴 Zoom Live</span>
                            <span>•</span>
                            <span>🎥 {vCount} {isSi ? "වීඩියෝ" : "Videos"}</span>
                            <span>•</span>
                            <span>📄 {pCount} {isSi ? "PDF පේපර්" : "PDFs"}</span>
                          </div>
                        </div>

                        {/* Card Bottom: Rs. 2000 Fee Status & Enter/Pay Button */}
                        <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--line)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <div>
                              <span className="price" style={{ fontSize: "1.15rem", padding: "2px 10px" }}>
                                {isSi ? `රු. ${f.price || 2000}` : `Rs. ${f.price || 2000}`}
                              </span>
                              <small style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                                {isSi ? "මාසික පන්ති ගාස්තුව" : "Monthly Fee"}
                              </small>
                            </div>
                            {isUnlocked ? (
                              <span className="badge-tag ok">✅ {isSi ? "විවෘතයි" : "Unlocked"}</span>
                            ) : isPending ? (
                              <span className="badge-tag gold">⏳ {isSi ? "පරීක්ෂා වෙමින්" : "Pending"}</span>
                            ) : (
                              <span className="badge-tag" style={{ background: "var(--bg)", color: "var(--muted)" }}>
                                🔒 {isSi ? "ගෙවීමෙන් පසු විවෘත වේ" : "Locked"}
                              </span>
                            )}
                          </div>

                          {isUnlocked ? (
                            <button
                              type="button"
                              className="btn wa"
                              style={{ width: "100%", justifyContent: "center", padding: "9px 12px", fontSize: "13px", fontWeight: 700 }}
                              onClick={() => handleEnterMonth(f)}
                            >
                              <span>🚪 {isSi ? "පන්තිය ඇතුළට යන්න (Zoom / Video / PDF)" : "Enter Class (Zoom / Video / PDF)"}</span>
                            </button>
                          ) : isPending ? (
                            <div style={{ textAlign: "center", padding: "8px", background: "var(--bg)", borderRadius: "8px", fontSize: "12.5px", color: "var(--muted)" }}>
                              ⏳ {isSi ? "රිසිට්පත පරීක්ෂාවෙන් පසුව මෙම මාසය විවෘත වේ" : "Unlocks after receipt approval"}
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn gold"
                              style={{ width: "100%", justifyContent: "center", padding: "9px 12px", fontSize: "13px", fontWeight: 700 }}
                              onClick={() => setPay(f)}
                            >
                              <svg style={{ width: 14, height: 14 }}><use href="#card" /></svg>
                              <span>
                                {isSi
                                  ? `රු. ${f.price || 2000} ගෙවා ${f.month || "මාසයේ"} පන්තියට යන්න`
                                  : `Pay Rs. ${f.price || 2000} to Unlock Month`}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
                  <p>{isSi ? "මෙම කාණ්ඩය යටතේ මාසික පන්ති හමු නොවීය." : "No monthly classes found for this filter."}</p>
                  {monthFilter !== "all" && (
                    <button type="button" className="btn gold" onClick={() => setMonthFilter("all")} style={{ marginTop: "10px" }}>
                      {isSi ? "සියලුම මාස පෙන්වන්න" : "Show All Months"}
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: MY UNLOCKED MONTHS                                            */}
        {/* ==================================================================== */}
        {activeTab === "my_packages" && (
          <section className="card">
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 4px" }}>
              🎓 {isSi ? `මා ගෙවීම් කර විවෘත කරගත් මාස (${myUnlockedFolders.length})` : `My Unlocked Monthly Classes (${myUnlockedFolders.length})`}
            </h2>
            <p style={{ margin: "0 0 18px", fontSize: "13.5px" }}>
              {isSi
                ? "රු. 2000 මාසික ගාස්තුව ගෙවා අනුමත වූ මාසවල සියලුම Zoom සජීවී පන්ති, වීඩියෝ සහ PDF පේපර්ස්"
                : "All Zoom live links, video discussions, and PDF papers for your unlocked months"}
            </p>

            {myUnlockedFolders.length ? (
              <div className="pkg-grid">
                {myUnlockedFolders.map(f => (
                  <div
                    key={f.id}
                    className="pkg-card"
                    style={{
                      minHeight: "230px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      border: f.isCurrentMonth ? "2px solid var(--gold)" : "1px solid var(--line)"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span className="badge-tag gold">📅 {f.month || `${f.grade} ශ්‍රේණිය`}</span>
                        <span className="badge-tag ok">✅ {isSi ? "විවෘතයි" : "Active"}</span>
                      </div>

                      <h3 style={{ fontSize: "1.05rem", lineHeight: 1.35, marginBottom: "8px" }}>{f.name}</h3>
                      <div style={{ fontSize: "13px", color: "var(--ink)" }}>🎯 {f.subjects}</div>
                    </div>

                    <div style={{ marginTop: "auto", paddingTop: "14px" }}>
                      <button
                        type="button"
                        className="btn wa"
                        style={{ width: "100%", justifyContent: "center", padding: "9px 12px", fontSize: "13px", fontWeight: 700 }}
                        onClick={() => handleEnterMonth(f)}
                      >
                        <span>🚪 {isSi ? "පන්තිය ඇතුළට යන්න (Zoom / Video / PDF)" : "Enter Class (Zoom / Video / PDF)"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)" }}>
                <div style={{ fontSize: "2.4rem", marginBottom: "10px" }}>🔒</div>
                <h3 style={{ fontSize: "1.15rem" }}>{isSi ? "තවම විවෘත කළ මාසික පන්ති නොමැත" : "No unlocked monthly classes yet"}</h3>
                <p style={{ maxWidth: "440px", margin: "6px auto 18px", fontSize: "13.5px" }}>
                  {isSi
                    ? "\"මාසික පන්ති ලැයිස්තුව\" වෙත ගොස් අදාළ මාසය තෝරා රු. 2000 බැංකු රිසිට්පත යොමු කරන්න."
                    : "Go to \"Monthly Classes\", select the month you want to join, and upload your Rs. 2000 payment receipt."}
                </p>
                <button
                  type="button"
                  className="btn gold"
                  onClick={() => setActiveTab("all_packages")}
                >
                  <svg><use href="#folder" /></svg>
                  <span>{isSi ? "මාසික පන්ති ලැයිස්තුව බලන්න" : "View Monthly Classes"}</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: 190+ PROGRESS & PERFORMANCE ANALYSIS                          */}
        {/* ==================================================================== */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="stats" style={{ margin: 0 }}>
              <div className="stat" style={{ borderLeft: "4px solid var(--gold)" }}>
                <div className="l">
                  <span>{isSi ? "190+ විභාග සූදානම" : "190+ Exam Readiness"}</span>
                  <span style={{ fontSize: "16px" }}>🎯</span>
                </div>
                <div className="v ok" style={{ color: "var(--gold-ink)", fontSize: "2rem" }}>
                  192 <small style={{ fontSize: "14px", color: "var(--muted)" }}>/ 200</small>
                </div>
                <small style={{ color: "#10b981", fontWeight: 600 }}>
                  🔥 {isSi ? "දිවයිනේ විශිෂ්ටතම සාමාර්ථ මට්ටම" : "Island Top Rank Level"}
                </small>
              </div>

              <div className="stat" style={{ borderLeft: "4px solid #3b82f6" }}>
                <div className="l">
                  <span>{isSi ? "දෛනික පළාත් පේපර්" : "Daily Papers Goal"}</span>
                  <span style={{ fontSize: "16px" }}>📝</span>
                </div>
                <div className="v" style={{ fontSize: "2rem" }}>
                  2 / 2
                </div>
                <small style={{ color: "#3b82f6", fontWeight: 600 }}>
                  ✓ {isSi ? "අද දින ඉලක්කය සම්පූර්ණයි" : "Today's goal completed"}
                </small>
              </div>

              <div className="stat" style={{ borderLeft: "4px solid #10b981" }}>
                <div className="l">
                  <span>{isSi ? "ප්‍රශ්නයක සාමාන්‍ය වේගය" : "Avg Speed per Question"}</span>
                  <span style={{ fontSize: "16px" }}>⚡</span>
                </div>
                <div className="v ok" style={{ fontSize: "2rem" }}>
                  38 <small style={{ fontSize: "13px" }}>{isSi ? "තත්පර" : "sec"}</small>
                </div>
                <small style={{ color: "#10b981", fontWeight: 600 }}>
                  🚀 {isSi ? "ඉලක්කය: තත් 45 ට අඩු (ඉතා වේගවත්)" : "Target: under 45s (Fast)"}
                </small>
              </div>

              <div className="stat" style={{ borderLeft: "4px solid #f97316" }}>
                <div className="l">
                  <span>{isSi ? "අඛණ්ඩ අධ්‍යයන දින" : "Daily Practice Streak"}</span>
                  <span style={{ fontSize: "16px" }}>🔥</span>
                </div>
                <div className="v" style={{ color: "#f97316", fontSize: "2rem" }}>
                  7 <small style={{ fontSize: "13px" }}>{isSi ? "දිනක්" : "days"}</small>
                </div>
                <small style={{ color: "var(--muted)" }}>
                  {isSi ? "විභාගය දක්වා පවත්වා ගන්න" : "Keep it up until exam day"}
                </small>
              </div>
            </div>

            <div className="cols">
              <div className="card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h2 style={{ fontSize: "1.1rem", margin: 0 }}>
                    📊 {isSi ? "විෂයයන් 5ම ප්‍රවීණතා විශ්ලේෂණය" : "5-Subject Mastery Breakdown"}
                  </h2>
                  <span className="badge-tag gold" style={{ fontSize: "11px" }}>
                    {isSi ? "NIE විෂය නිර්දේශය අනුව" : "Based on NIE Guide"}
                  </span>
                </div>
                <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--muted)" }}>
                  {isSi
                    ? "ප්‍රශ්න පත්‍රවලින් මනිනු ලබන ප්‍රධාන විෂය ධාරාවන් 5 හි ඔබේ වත්මන් ලකුණු මට්ටම:"
                    : "Your evaluated performance scores across the 5 scholarship core curriculum subjects:"}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                      <span>🌿 {isSi ? "පරිසරය (තේමා 16 සම්පූර්ණ ආවරණය)" : "Environment (16 Themes)"}</span>
                      <span style={{ color: "var(--gold-ink)" }}>96%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "var(--bg)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "96%", height: "100%", background: "linear-gradient(90deg, #10b981, #f5a623)", borderRadius: "4px" }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                      <span>✍️ {isSi ? "මව්බස සිංහල (වියරණ, අක්ෂර වින්‍යාසය, රචනා)" : "Mother Tongue (Grammar & Essays)"}</span>
                      <span style={{ color: "var(--gold-ink)" }}>94%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "var(--bg)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "94%", height: "100%", background: "linear-gradient(90deg, #3b82f6, #10b981)", borderRadius: "4px" }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                      <span>🔢 {isSi ? "ශිෂ්‍යත්ව ගණිතය (කෙටි ක්‍රම, රටා, ඔරලෝසු)" : "Scholarship Mathematics (Speed Tricks)"}</span>
                      <span style={{ color: "var(--gold-ink)" }}>98%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "var(--bg)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "98%", height: "100%", background: "linear-gradient(90deg, #f5a623, #ff7b00)", borderRadius: "4px" }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                      <span>🗣️ {isSi ? "දෙවන බස දෙමළ (1-19 සංවාද & වචන මාලාව)" : "Second Language Tamil (Dialogues 1-19)"}</span>
                      <span style={{ color: "var(--gold-ink)" }}>90%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "var(--bg)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "90%", height: "100%", background: "linear-gradient(90deg, #8b5cf6, #3b82f6)", borderRadius: "4px" }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                      <span>🔤 {isSi ? "ඉංග්‍රීසි ABOE (පින්තූර විස්තර, Plurals, Opposites)" : "English ABOE (Picture Descriptions)"}</span>
                      <span style={{ color: "var(--gold-ink)" }}>92%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "var(--bg)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "92%", height: "100%", background: "linear-gradient(90deg, #06b6d4, #10b981)", borderRadius: "4px" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
                <h2 style={{ fontSize: "1.1rem", margin: "0 0 10px" }}>
                  ⏱️ {isSi ? "විභාග කාල කළමනාකරණ විශ්ලේෂණය" : "Exam Time Management Analysis"}
                </h2>
                <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--muted)" }}>
                  {isSi
                    ? "ශිෂ්‍යත්ව විභාගයේදී නියමිත වේලාවට පෙර පිළිතුරු ලියා අවසන් කිරීමේ වේග මිනුම්:"
                    : "Pacing metrics to ensure you finish before the exam bell rings:"}
                </p>

                <div style={{ background: "var(--bg)", borderRadius: "10px", padding: "14px", border: "1px solid var(--line)", marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "13.5px" }}>{isSi ? "📄 I වන ප්‍රශ්න පත්‍රය (ප්‍රශ්න 40)" : "📄 Paper I (40 Questions)"}</strong>
                    <span className="badge-tag ok" style={{ fontSize: "11px" }}>{isSi ? "ඉතා හොඳයි" : "Excellent"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "12.5px" }}>
                    <span style={{ color: "var(--muted)" }}>{isSi ? "නියමිත කාලය: විනාඩි 45" : "Official Time: 45 min"}</span>
                    <span style={{ fontWeight: 700, color: "var(--ink)" }}>{isSi ? "සාමාන්‍ය වැයවන කාලය: විනාඩි 36" : "Avg Used: 36 min"}</span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#10b981" }}>
                    ✓ {isSi ? "නැවත පරීක්ෂා කිරීමට විනාඩි 9ක් ඉතිරි වේ!" : "9 minutes saved for final answer review!"}
                  </p>
                </div>

                <div style={{ background: "var(--bg)", borderRadius: "10px", padding: "14px", border: "1px solid var(--line)", marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "13.5px" }}>{isSi ? "📄 II වන ප්‍රශ්න පත්‍රය (ප්‍රශ්න 60)" : "📄 Paper II (60 Questions)"}</strong>
                    <span className="badge-tag ok" style={{ fontSize: "11px" }}>{isSi ? "ඉතා හොඳයි" : "Excellent"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "12.5px" }}>
                    <span style={{ color: "var(--muted)" }}>{isSi ? "නියමිත කාලය: විනාඩි 75" : "Official Time: 75 min"}</span>
                    <span style={{ fontWeight: 700, color: "var(--ink)" }}>{isSi ? "සාමාන්‍ය වැයවන කාලය: විනාඩි 66" : "Avg Used: 66 min"}</span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#10b981" }}>
                    ✓ {isSi ? "පැහැදිලි අත්අකුරු සහ අක්ෂර වින්‍යාසය පරීක්ෂාවට කාලය ප්‍රමාණවත්ය." : "Plenty of buffer for handwriting neatness & spelling check."}
                  </p>
                </div>

                <div style={{ marginTop: "auto" }}>
                  <button
                    type="button"
                    className="btn gold"
                    style={{ width: "100%", justifyContent: "center", padding: "10px", fontSize: "13px" }}
                    onClick={() => setActiveTab("timer")}
                  >
                    <span>⏱️ {isSi ? "වේග පුහුණු කාල ගණකය විවෘත කරන්න" : "Launch Speed Practice Timer"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: SPEED TIMER                                                   */}
        {/* ==================================================================== */}
        {activeTab === "timer" && (
          <section className="card">
            <div className="timer-box" style={{ maxWidth: "560px", margin: "0 auto", padding: "20px 10px" }}>
              <span className="badge-tag gold" style={{ fontSize: "12px", padding: "4px 14px", marginBottom: "8px" }}>
                ⏱️ {isSi ? "190+ වේග පුහුණු කාල ගණකය" : "190+ Speed practice timer"}
              </span>
              <h2 style={{ fontSize: "1.3rem" }}>{isSi ? "ප්‍රශ්න පත්‍ර කාලයට ලියා පුහුණු වන්න" : "Master Exam Time Management"}</h2>
              <p style={{ color: "var(--muted)", fontSize: "13.5px", maxWidth: "480px", margin: "0 auto 16px" }}>
                {isSi
                  ? "ශිෂ්‍යත්ව විභාගයේදී එක් ප්‍රශ්නයකට තත්පර 38-45ක් තුළ පිළිතුරු සපයා පුහුණු වීමට මෙය උපකාරී වේ."
                  : "Practice answering questions within 38-45 seconds to complete your exam well ahead of time."}
              </p>

              <div className="timer-display" style={{ fontSize: "3.5rem", letterSpacing: "2px", margin: "16px 0" }}>
                {formatTimer(timerSeconds)}
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" }}>
                <button
                  type="button"
                  className={`btn ${timerRunning ? "btn" : "gold"}`}
                  style={{ padding: "9px 22px", fontSize: "14px" }}
                  onClick={() => setTimerRunning(!timerRunning)}
                >
                  <span>
                    {timerRunning
                      ? (isSi ? "⏸️ විරාමය" : "⏸️ Pause")
                      : (isSi ? "▶️ ආරම්භ කරන්න" : "▶️ Start")}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ padding: "9px 18px", fontSize: "14px" }}
                  onClick={() => { setTimerRunning(false); setTimerSeconds(45 * 60); }}
                >
                  <span>🔄 {isSi ? "නැවත මුල සිට" : "Reset"}</span>
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>{isSi ? "නියමිත කාලයන්:" : "Presets:"}</span>
                <button type="button" className="btn" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={() => setTimerPreset(45)}>
                  {isSi ? "විනාඩි 45 (I පත්‍රය)" : "45 mins (Paper I)"}
                </button>
                <button type="button" className="btn" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={() => setTimerPreset(75)}>
                  {isSi ? "විනාඩි 75 (II පත්‍රය)" : "75 mins (Paper II)"}
                </button>
                <button type="button" className="btn" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={() => setTimerPreset(30)}>
                  {isSi ? "විනාඩි 30 (කෙටි පේපර්)" : "30 mins (Drill Paper)"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: MY SLIPS                                                      */}
        {/* ==================================================================== */}
        {activeTab === "my_slips" && (
          <section className="card">
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 4px" }}>
              💳 {isSi ? "මා යොමු කළ මාසික ගෙවීම් රිසිට්පත්" : "Submitted Monthly Payment Slips"}
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: "13.5px" }}>
              {isSi ? "ඔබ උඩුගත කළ රු. 2000 මාසික බැංකු රිසිට්පත්වල අනුමැතිය ලැබීමේ තත්ත්වය" : "Track the approval status of your submitted Rs. 2000 monthly bank receipts"}
            </p>

            {mySlips.length ? (
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>{isSi ? "මාසය / පන්තිය" : "Month / Class"}</th>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>{isSi ? "මාසික ගාස්තුව" : "Monthly Fee"}</th>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>{isSi ? "දිනය" : "Date"}</th>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>{isSi ? "තත්ත්වය" : "Status"}</th>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>{isSi ? "ක්‍රියාමාර්ගය" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mySlips.map(p => {
                      const f = S.folders.find(x => x.id === p.fid) || {};
                      return (
                        <tr key={p.id} style={{ borderTop: "1px solid var(--line)" }}>
                          <td style={{ padding: "12px 14px" }}>
                            {f.month && (
                              <span className="badge-tag gold" style={{ marginRight: "6px", fontSize: "11px" }}>
                                {f.month}
                              </span>
                            )}
                            <strong>{f.name || (isSi ? "මාසික පන්තිය" : "Monthly Class")}</strong>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <strong style={{ color: "var(--gold-ink)" }}>
                              {isSi ? `රු. ${f.price || 2000}` : `Rs. ${f.price || 2000}`}
                            </strong>
                          </td>
                          <td style={{ padding: "12px 14px", color: "var(--muted)", fontSize: "13px" }}>{p.date}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <span className={`badge-tag ${p.status === "approved" ? "ok" : p.status === "pending" ? "gold" : "warn"}`}>
                              {p.status === "approved" && (isSi ? "අනුමතයි (විවෘතයි)" : "Approved")}
                              {p.status === "pending" && (isSi ? "අනුමැතියට" : "Pending")}
                              {p.status === "rejected" && (isSi ? "ප්‍රතික්ෂේපිත" : "Rejected")}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            {p.status === "approved" ? (
                              <button
                                type="button"
                                className="btn wa"
                                style={{ padding: "5px 12px", fontSize: "12px" }}
                                onClick={() => handleEnterMonth(f)}
                              >
                                <span>{isSi ? "පන්තියට යන්න ↗" : "Enter Class ↗"}</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>
                                {isSi ? "ගුරුතුමා පරීක්ෂා කරමින් පවතී" : "Teacher is reviewing your slip"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: "35px", textAlign: "center", color: "var(--muted)" }}>
                <p>{isSi ? "ඔබ තවම කිසිදු ගෙවීම් රිසිට්පතක් යොමු කර නොමැත." : "You have not submitted any receipts yet."}</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ==================================================================== */}
      {/* MONTHLY FEE (RS. 2000) PAYMENT MODAL                                 */}
      {/* ==================================================================== */}
      {pay && (
        <div className="app-modal-overlay" onClick={() => setPay(null)}>
          <div className="app-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="app-modal-head">
              <div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                  <span className="badge-tag gold">📅 {pay.month || `${pay.grade} ශ්‍රේණිය`}</span>
                  <span className="badge-tag" style={{ background: "var(--bg)" }}>
                    {isSi ? `${pay.grade} ශ්‍රේණිය` : `Grade ${pay.grade}`}
                  </span>
                </div>
                <h3>💳 {pay.name}</h3>
              </div>
              <button
                type="button"
                className="app-modal-close"
                onClick={() => setPay(null)}
              >
                ✕
              </button>
            </div>

            <div className="tip" style={{ marginBottom: "16px" }}>
              <strong style={{ fontSize: "15px", display: "block", marginBottom: "4px" }}>
                💰 {isSi ? `මාසික පන්ති ගාස්තුව: රු. ${pay.price || 2000}` : `Monthly Class Fee: Rs. ${pay.price || 2000}`}
              </strong>
              <span style={{ fontSize: "12.5px" }}>
                {isSi
                  ? `රු. ${pay.price || 2000} ගෙවා රිසිට්පත උඩුගත කළ පසු ${pay.month || "මෙම මාසයේ"} සියලුම සජීවී Zoom පන්ති, වීඩියෝ සාකච්ඡා සහ PDF ප්‍රශ්න පත්‍ර සියල්ලටම පිවිසිය හැක.`
                  : `Upload your Rs. ${pay.price || 2000} payment slip to unlock all Zoom live classes, video discussions, and PDF papers for ${pay.month || "this month"}.`}
              </span>
            </div>

            <div className="app-form">
              <label className="app-label">
                <span>{isSi ? "පන්තියේ බැංකු ගිණුම් විස්තර:" : "Class bank account details:"}</span>
              </label>
              <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: "10px", padding: "14px", position: "relative" }}>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "13.5px", color: "var(--ink)", lineHeight: 1.5 }}>
                  {S.set.bank}
                </pre>
                <button
                  type="button"
                  onClick={copyBankInfo}
                  className="btn"
                  style={{ marginTop: "10px", padding: "5px 12px", fontSize: "12px" }}
                >
                  <span>
                    {copiedBank
                      ? (isSi ? "✓ පිටපත් විය" : "✓ Copied")
                      : (isSi ? "📋 විස්තර පිටපත් කරන්න" : "📋 Copy details")}
                  </span>
                </button>
              </div>

              <label className="app-label" style={{ marginTop: "10px" }}>
                <span>{isSi ? "රු. 2000 බැංකු රිසිට්පත හෝ ඔන්ලයින් ගෙවූ තිර ඡායාරූපය තෝරන්න:" : "Upload Rs. 2000 bank deposit slip or online transfer screenshot:"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="app-input"
                  onChange={onFileChange}
                />
              </label>

              {filePreview && (
                <div style={{ textAlign: "center", marginTop: "8px" }}>
                  <img
                    src={filePreview}
                    alt="Slip preview"
                    style={{ maxHeight: "150px", maxWidth: "100%", borderRadius: "8px", border: "1px solid var(--line)" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={send}
                  className="btn gold"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={!file}
                >
                  <svg><use href="#check" /></svg>
                  <span>{isSi ? "රිසිට්පත යොමු කර මාසය විවෘත කරගන්න" : "Submit Receipt to Unlock Month"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPay(null)}
                  className="btn"
                >
                  {isSi ? "අවලංගු කරන්න" : "Cancel"}
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
                <span className="badge-tag gold" style={{ marginBottom: "6px", display: "inline-block" }}>
                  🎥 {theaterVideo.subject || (isSi ? "වීඩියෝ විවරණය" : "Video Discussion")}
                </span>
                <h3 style={{ margin: 0, fontSize: "17px", color: "var(--cream, #fff)" }}>
                  {theaterVideo.title}
                </h3>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => setTheaterVideo(null)}
                style={{ padding: "5px 12px", flexShrink: 0, fontSize: "12px" }}
              >
                ✕ {isSi ? "වසන්න" : "Close"}
              </button>
            </div>

            <VideoPlayer url={theaterVideo.url} title={theaterVideo.title} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
              <span style={{ color: "var(--gold)", fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>✨</span>
                <span>{isSi ? "190+ පේපර් පන්තියේ සවිස්තර විවරණය වෙබ් අඩවිය තුළම වාදනය වේ." : "190+ Video discussion playing directly on site."}</span>
              </span>
              <a
                href={theaterVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn ghost"
                style={{ fontSize: "12px", padding: "5px 11px" }}
              >
                <span>YouTube හි විවෘත කරන්න ↗</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
