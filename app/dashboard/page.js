"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp, uid, readFile, getYoutubeEmbedUrl } from "../../lib/Provider";
import DashboardSidebar from "../../components/DashboardSidebar";
import VideoPlayer from "../../components/VideoPlayer";

export default function Dash() {
  const { S, update, me, login, lang, toggleLang, ready } = useApp();
  const router = useRouter();

  const isSi = lang === "si";

  const [activeTab, setActiveTab] = useState("all_packages"); // all_packages, my_packages, timer, my_slips
  const [selectedGrade, setSelectedGrade] = useState(5);
  const [open, setOpen] = useState(null);
  const [pay, setPay] = useState(null);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [activeSubjectFilter, setActiveSubjectFilter] = useState("all");
  const [theaterVideo, setTheaterVideo] = useState(null);

  // Speed Practice Timer state
  const [timerSeconds, setTimerSeconds] = useState(45 * 60); // 45 mins default
  const [timerRunning, setTimerRunning] = useState(false);

  // Student Verification
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
      setSelectedGrade(activeUser.grade);
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
          ? "රිසිට්පත සාර්ථකව ලැබුණි! ගුරුතුමා අනුමත කළ විගස මෙම ප්‍රශ්න පත්‍ර කට්ටලය විවෘත වේ."
          : "Receipt submitted successfully! This bundle will unlock once approved by the teacher."
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

  // Filter folders by selected grade
  const gradeFolders = S.folders.filter(f => f.grade === selectedGrade);
  // Unlocked folders for this student
  const myUnlockedFolders = S.folders.filter(f => st(f.id) === "approved");
  // Student's submitted payments
  const mySlips = S.pays.filter(p => p.uid === currentMe.id);

  // If a folder is opened (Lesson Viewer)
  if (open) {
    const f = S.folders.find(x => x.id === open);
    const rawItems = S.items.filter(i => i.fid === open);
    const its = activeSubjectFilter === "all"
      ? rawItems
      : rawItems.filter(i => i.subject?.includes(activeSubjectFilter) || i.title?.includes(activeSubjectFilter));

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
          { id: "all", label: "🌟 All subjects" },
          { id: "Environmental", label: "Environment" },
          { id: "Sinhala", label: "Mother tongue" },
          { id: "Mathematics", label: "Mathematics" },
          { id: "Tamil", label: "Tamil" },
          { id: "English", label: "English" },
        ];

    return (
      <div className="app">
        <DashboardSidebar
          role="student"
          activeTab={activeTab}
          onTabChange={(t) => { setOpen(null); setActiveTab(t); }}
          foldersCount={S.folders.length}
        />

        <main>
          <div className="top">
            <span className="sp">{isSi ? "ශිෂ්‍ය පුවරුව" : "Student portal"}</span>
            <button type="button" className="btn" onClick={toggleLang}>
              <svg><use href="#globe" /></svg>
              <span>{isSi ? "English" : "සිංහල"}</span>
            </button>
            <a
              className="btn wa"
              href={`https://wa.me/${(S.set?.hotline || "0771234567").replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg><use href="#chat" /></svg>
              <span>WhatsApp</span>
            </a>
            <span className="btn gold">
              <svg><use href="#user" /></svg>
              <span>{currentMe?.name}</span>
            </span>
          </div>

          <div className="head">
            <div>
              <button
                type="button"
                className="btn"
                onClick={() => setOpen(null)}
                style={{ marginBottom: "10px" }}
              >
                <span>⬅️ {isSi ? "ආපසු පැකේජ ලැයිස්තුවට" : "Back to bundles"}</span>
              </button>
              <h1>{f?.name}</h1>
              <p>
                {isSi
                  ? `${f?.grade} ශ්‍රේණිය · දිනකට පළාත් පේපර් 2 බැගින් සාකච්ඡා කරමින් විෂයන් 5ම ආවරණය`
                  : `Grade ${f?.grade} · 2 Provincial papers daily discussing all 5 subjects`}
              </p>
            </div>

            {/* Subject Filters */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {subjectsList.map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  className={`btn ${activeSubjectFilter === sub.id ? "gold" : ""}`}
                  style={{ padding: "6px 12px", fontSize: "13px" }}
                  onClick={() => setActiveSubjectFilter(sub.id)}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          <section className="card">
            {its.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {its.map(i => (
                  <div
                    key={i.id}
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--line)",
                      borderRadius: "var(--r)",
                      padding: "20px"
                    }}
                  >
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
                      <span className="badge-tag gold">
                        {i.subject || (isSi ? "විෂයය" : "Subject")}
                      </span>
                      <span className="badge-tag" style={{ background: "var(--surface)", color: "var(--muted)" }}>
                        {i.type === "video" ? (isSi ? "🎥 වීඩියෝ විවරණය" : "🎥 Video discussion") : (isSi ? "📄 PDF සටහන" : "📄 PDF notes")}
                      </span>
                    </div>

                    <h2 style={{ fontSize: "19px", marginBottom: "14px" }}>
                      {i.title}
                    </h2>

                    {getYoutubeEmbedUrl(i.url) ? (
                      <div>
                        <VideoPlayer url={i.url} title={i.title} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "10px" }}>
                          <div className="tip" style={{ flex: 1, minWidth: "260px", margin: 0 }}>
                            <b>{isSi ? "උපදෙස:" : "Tip:"}</b>{" "}
                            {isSi
                              ? "වීඩියෝව නැරඹීමට පෙර ඔබ විසින් පේපරය තනිව විසඳා සිටීමෙන් ඔබේ වේගය හා දැනුම දෙගුණ වේ."
                              : "Attempt solving the paper before watching the video discussion to build speed and confidence."}
                          </div>
                          <button
                            type="button"
                            className="btn gold"
                            style={{ padding: "8px 16px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                            onClick={() => setTheaterVideo(i)}
                          >
                            <span>⛶ {isSi ? "විශාල තිරයෙන් නරඹන්න" : "Theater Full View"}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <a
                          className="btn gold"
                          href={i.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg><use href="#doc" /></svg>
                          <span>{isSi ? "PDF ප්‍රශ්න පත්‍රය බාගත කරන්න / බලන්න" : "Download / View PDF paper"}</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
                <p>{isSi ? "මෙම විෂයට අදාළ පාඩම් හෝ පේපර් තවම එක්කර නොමැත." : "No lessons found for this subject yet."}</p>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Royal Burgundy Sidebar */}
      <DashboardSidebar
        role="student"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        foldersCount={S.folders.length}
      />

      {/* Main Student Workspace */}
      <main>
        {/* Top Header Bar */}
        <div className="top">
          <span className="sp">{isSi ? "ශිෂ්‍ය පුවරුව" : "Student portal"}</span>
          <button type="button" className="btn" onClick={toggleLang}>
            <svg><use href="#globe" /></svg>
            <span>{isSi ? "English" : "සිංහල"}</span>
          </button>
          <a
            className="btn wa"
            href={`https://wa.me/${(S.set?.hotline || "0771234567").replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg><use href="#chat" /></svg>
            <span>WhatsApp</span>
          </a>
          <span className="btn gold">
            <svg><use href="#user" /></svg>
            <span>{currentMe?.name}</span>
          </span>
          <button
            type="button"
            className="btn"
            onClick={() => { login(null); router.push("/login"); }}
          >
            <svg><use href="#logout" /></svg>
            <span>{isSi ? "ඉවත් වන්න" : "Log out"}</span>
          </button>
        </div>

        {/* Page Head */}
        <div className="head">
          <div>
            <p>
              {isSi ? "ශිෂ්‍ය පුවරුව" : "Student portal"} / {" "}
              {activeTab === "all_packages" && (isSi ? "සියලු පැකේජ" : "All bundles")}
              {activeTab === "my_packages" && (isSi ? "මගේ පාඩම්" : "My lessons")}
              {activeTab === "timer" && (isSi ? "වේග පාලන කාල ගණකය" : "Speed practice timer")}
              {activeTab === "my_slips" && (isSi ? "ගෙවීම් රිසිට්පත්" : "Payment slips")}
            </p>
            <h1>
              {isSi ? `ආයුබෝවන්, ${currentMe.name}! 👋` : `Welcome, ${currentMe.name}! 👋`}
            </h1>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link className="btn gold" href="/ai-tutor">
              <svg><use href="#spark" /></svg>
              <span>{isSi ? "190+ AI සහයක" : "190+ AI Tutor"}</span>
            </Link>
          </div>
        </div>

        {/* TAB 1: ALL PACKAGES */}
        {activeTab === "all_packages" && (
          <section className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2>{isSi ? "ලබාගත හැකි ප්‍රශ්න පත්‍ර පැකේජ" : "Available paper bundles"}</h2>
                <p style={{ margin: "4px 0 0" }}>
                  {isSi
                    ? "ශ්‍රේණිය තෝරා විෂය නිර්දේශයේ පළාත් පේපර් කට්ටල අධ්‍යයනය කරන්න."
                    : "Select your grade and start practicing complete provincial paper sets."}
                </p>
              </div>

              {/* Grade Selector Pills */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[5, 4, 3, 2, 1].map(g => (
                  <button
                    key={g}
                    type="button"
                    className={`btn ${selectedGrade === g ? "gold" : ""}`}
                    style={{ padding: "6px 14px", fontSize: "13px" }}
                    onClick={() => setSelectedGrade(g)}
                  >
                    {isSi ? `${g} ශ්‍රේණිය ${g === 5 ? "🔥 (190+)" : ""}` : `Grade ${g} ${g === 5 ? "🔥 (190+)" : ""}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Packages Grid */}
            {gradeFolders.length ? (
              <div className="pkg-grid">
                {gradeFolders.map(f => {
                  const s = st(f.id);
                  const isUnlocked = s === "approved";
                  const isPending = s === "pending";

                  return (
                    <div key={f.id} className="pkg-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span className="badge-tag gold">
                          {isSi ? `${f.grade} ශ්‍රේණිය` : `Grade ${f.grade}`}
                        </span>
                        <span className="badge-tag" style={{ background: "var(--bg)", color: "var(--muted)" }}>
                          {f.papersCount || (isSi ? "දිනකට පේපර් 2ක්" : "2 Papers Daily")}
                        </span>
                      </div>

                      <h3>{f.name}</h3>

                      <div style={{ fontSize: "13.5px", color: "var(--ink)" }}>
                        🎯 <b>{isSi ? "විෂයයන්:" : "Subjects:"}</b> {f.subjects || (isSi ? "විෂයයන් 5ම සම්පූර්ණයෙන්ම" : "All 5 Subjects")}
                      </div>

                      {f.desc && (
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: 1.4 }}>
                          {f.desc}
                        </p>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--line)" }}>
                        <span className="price">
                          {isSi ? `රු. ${f.price}` : `Rs. ${f.price}`}
                        </span>
                        {isUnlocked && (
                          <span className="badge-tag ok">{isSi ? "විවෘතයි" : "Unlocked"}</span>
                        )}
                        {isPending && (
                          <span className="badge-tag gold">{isSi ? "පරීක්ෂා වෙමින්" : "Pending"}</span>
                        )}
                      </div>

                      <div style={{ marginTop: "8px" }}>
                        {isUnlocked ? (
                          <button
                            type="button"
                            className="btn wa"
                            style={{ width: "100%", justifyContent: "center", padding: "10px" }}
                            onClick={() => setOpen(f.id)}
                          >
                            <svg style={{ width: 15, height: 15 }}><use href="#eye" /></svg>
                            <span>{isSi ? "ප්‍රශ්න පත්‍ර විවෘත කරන්න" : "Open paper bundle"}</span>
                          </button>
                        ) : isPending ? (
                          <div style={{ textAlign: "center", padding: "8px", background: "var(--bg)", borderRadius: "8px", fontSize: "13px", color: "var(--muted)" }}>
                            ⏳ {isSi ? "රිසිට්පත පරීක්ෂාවෙන් පසුව විවෘත වේ" : "Unlocks after receipt approval"}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn gold"
                            style={{ width: "100%", justifyContent: "center", padding: "10px" }}
                            onClick={() => setPay(f)}
                          >
                            <svg style={{ width: 15, height: 15 }}><use href="#card" /></svg>
                            <span>{isSi ? `ලබාගන්න (රු. ${f.price})` : `Enroll (Rs. ${f.price})`}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
                <p>{isSi ? "මෙම ශ්‍රේණිය සඳහා පේපර් කට්ටල සූදානම් වෙමින් පවතී." : "Paper bundles for this grade will be added shortly."}</p>
              </div>
            )}
          </section>
        )}

        {/* TAB 2: MY UNLOCKED PACKAGES */}
        {activeTab === "my_packages" && (
          <section className="card">
            <h2>{isSi ? `මගේ අනුමත පේපර් කට්ටල (${myUnlockedFolders.length})` : `My unlocked bundles (${myUnlockedFolders.length})`}</h2>
            <p>{isSi ? "ඔබ විසින් ගෙවීම් කර විවෘත කරගත් පේපර්ස් සහ වීඩියෝ සාකච්ඡා" : "Paper bundles and video discussions unlocked for your account"}</p>

            {myUnlockedFolders.length ? (
              <div className="pkg-grid">
                {myUnlockedFolders.map(f => (
                  <div key={f.id} className="pkg-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="badge-tag ok">{isSi ? "සක්‍රියයි" : "Active"}</span>
                      <span className="badge-tag" style={{ background: "var(--bg)", color: "var(--muted)" }}>
                        {f.papersCount || (isSi ? "දිනකට පේපර් 2ක්" : "2 Papers Daily")}
                      </span>
                    </div>

                    <h3>{f.name}</h3>
                    <div style={{ fontSize: "13.5px", color: "var(--ink)" }}>🎯 {f.subjects}</div>

                    <div style={{ marginTop: "auto", paddingTop: "14px" }}>
                      <button
                        type="button"
                        className="btn wa"
                        style={{ width: "100%", justifyContent: "center", padding: "10px" }}
                        onClick={() => setOpen(f.id)}
                      >
                        <svg style={{ width: 15, height: 15 }}><use href="#eye" /></svg>
                        <span>{isSi ? "පේපර්ස් සහ වීඩියෝ බලන්න" : "Watch videos & papers"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)" }}>
                <div style={{ fontSize: "2.4rem", marginBottom: "10px" }}>🔒</div>
                <h3>{isSi ? "තවම අනුමත පේපර් කට්ටල නොමැත" : "No unlocked bundles yet"}</h3>
                <p style={{ maxWidth: "420px", margin: "6px auto 18px", fontSize: "14px" }}>
                  {isSi
                    ? "\"සියලු පැකේජ\" වෙත ගොස් ඔබ කැමති කට්ටලය තෝරා බැංකු රිසිට්පත යොමු කරන්න."
                    : "Go to \"All Bundles\", choose a paper bundle, and submit your bank deposit receipt."}
                </p>
                <button
                  type="button"
                  className="btn gold"
                  onClick={() => setActiveTab("all_packages")}
                >
                  <svg><use href="#folder" /></svg>
                  <span>{isSi ? "ප්‍රශ්න පත්‍ර පැකේජ බලන්න" : "Explore paper bundles"}</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: SPEED TIMER */}
        {activeTab === "timer" && (
          <section className="card">
            <div className="timer-box">
              <span className="badge-tag gold" style={{ fontSize: "13px", padding: "4px 14px", marginBottom: "8px" }}>
                ⏱️ {isSi ? "190+ වේග පුහුණු කාල ගණකය" : "190+ Speed practice timer"}
              </span>
              <h2>{isSi ? "ප්‍රශ්න පත්‍ර කාලයට ලියා පුහුණු වන්න" : "Master exam time management"}</h2>
              <p style={{ color: "var(--muted)", fontSize: "14px", maxWidth: "480px", margin: "0 auto" }}>
                {isSi
                  ? "ශිෂ්‍යත්ව විභාගයේදී එක් ප්‍රශ්නයකට තත්පර 45-50ක් තුළ පිළිතුරු සපයා පුහුණු වීමට මෙය උපකාරී වේ."
                  : "Practice answering questions within 45-50 seconds to complete your exam well ahead of time."}
              </p>

              <div className="timer-display">
                {formatTimer(timerSeconds)}
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "22px" }}>
                <button
                  type="button"
                  className={`btn ${timerRunning ? "btn" : "gold"}`}
                  style={{ padding: "10px 24px", fontSize: "15px" }}
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
                  style={{ padding: "10px 20px", fontSize: "15px" }}
                  onClick={() => { setTimerRunning(false); setTimerSeconds(45 * 60); }}
                >
                  <span>🔄 {isSi ? "නැවත මුල සිට" : "Reset"}</span>
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>{isSi ? "නියමිත කාලයන්:" : "Presets:"}</span>
                <button type="button" className="btn" style={{ padding: "5px 12px", fontSize: "12.5px" }} onClick={() => setTimerPreset(45)}>
                  {isSi ? "විනාඩි 45 (I පත්‍රය)" : "45 mins (Paper I)"}
                </button>
                <button type="button" className="btn" style={{ padding: "5px 12px", fontSize: "12.5px" }} onClick={() => setTimerPreset(75)}>
                  {isSi ? "විනාඩි 75 (II පත්‍රය)" : "75 mins (Paper II)"}
                </button>
                <button type="button" className="btn" style={{ padding: "5px 12px", fontSize: "12.5px" }} onClick={() => setTimerPreset(30)}>
                  {isSi ? "විනාඩි 30 (කෙටි පේපර්)" : "30 mins (Drill Paper)"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: MY SLIPS */}
        {activeTab === "my_slips" && (
          <section className="card">
            <h2>{isSi ? "මා යොමු කළ ගෙවීම් රිසිට්පත්" : "Submitted payment slips"}</h2>
            <p>{isSi ? "ඔබ උඩුගත කළ බැංකු රිසිට්පත්වල අනුමැතිය ලැබීමේ තත්ත්වය" : "Track the status of your submitted bank receipts"}</p>

            {mySlips.length ? (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>{isSi ? "ප්‍රශ්න පත්‍ර පැකේජය" : "Paper bundle"}</th>
                      <th>{isSi ? "මුදල" : "Fee"}</th>
                      <th>{isSi ? "දිනය" : "Date"}</th>
                      <th>{isSi ? "තත්ත්වය" : "Status"}</th>
                      <th>{isSi ? "ක්‍රියාමාර්ගය" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mySlips.map(p => {
                      const f = S.folders.find(x => x.id === p.fid) || {};
                      return (
                        <tr key={p.id}>
                          <td>
                            <strong>{f.name || (isSi ? "ප්‍රශ්න පත්‍ර පැකේජය" : "Paper Bundle")}</strong>
                          </td>
                          <td>
                            <strong style={{ color: "var(--gold-ink)" }}>
                              {isSi ? `රු. ${f.price || 0}` : `Rs. ${f.price || 0}`}
                            </strong>
                          </td>
                          <td style={{ color: "var(--muted)", fontSize: "13px" }}>{p.date}</td>
                          <td>
                            <span className={`badge-tag ${p.status === "approved" ? "ok" : p.status === "pending" ? "gold" : "warn"}`}>
                              {p.status === "approved" && (isSi ? "අනුමතයි" : "Approved")}
                              {p.status === "pending" && (isSi ? "අනුමැතියට" : "Pending")}
                              {p.status === "rejected" && (isSi ? "ප්‍රතික්ෂේපිත" : "Rejected")}
                            </span>
                          </td>
                          <td>
                            {p.status === "approved" ? (
                              <button
                                type="button"
                                className="btn wa"
                                style={{ padding: "5px 12px", fontSize: "12px" }}
                                onClick={() => setOpen(f.id)}
                              >
                                <span>{isSi ? "විවෘත කරන්න ↗" : "Open ↗"}</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: "13px", color: "var(--muted)" }}>
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
              <div style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
                <p>{isSi ? "ඔබ තවම කිසිදු ගෙවීම් රිසිට්පතක් යොමු කර නොමැත." : "You have not submitted any receipts yet."}</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      <Link href="/ai-tutor" className="fab">
        <svg><use href="#spark" /></svg>
        <span>190+ AI Tutor</span>
        <span className="live">Live</span>
      </Link>

      {/* PAYMENT MODAL */}
      {pay && (
        <div className="app-modal-overlay" onClick={() => setPay(null)}>
          <div className="app-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="app-modal-head">
              <div>
                <h3>💳 {pay.name}</h3>
                <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "13px" }}>
                  {isSi ? `${pay.grade} ශ්‍රේණිය • රු. ${pay.price}` : `Grade ${pay.grade} • Rs. ${pay.price}`}
                </p>
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
                💰 {isSi ? `ගෙවිය යුතු මුදල: රු. ${pay.price}` : `Fee to Pay: Rs. ${pay.price}`}
              </strong>
              <span>
                {isSi
                  ? "දිනකට පළාත් පේපර් 2ක් සහ විෂයන් 5ම ආවරණය වන සම්පූර්ණ කට්ටලය"
                  : "Complete bundle discussing 2 provincial papers daily covering all 5 subjects"}
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
                  style={{ marginTop: "10px", padding: "6px 12px", fontSize: "12px" }}
                >
                  <span>
                    {copiedBank
                      ? (isSi ? "✓ පිටපත් විය" : "✓ Copied")
                      : (isSi ? "📋 විස්තර පිටපත් කරන්න" : "📋 Copy details")}
                  </span>
                </button>
              </div>

              <label className="app-label" style={{ marginTop: "10px" }}>
                <span>{isSi ? "බැංකු රිසිට්පත හෝ ඔන්ලයින් ගෙවූ තිර ඡායාරූපය:" : "Bank deposit slip or transfer screenshot:"}</span>
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
                  <span>{isSi ? "රිසිට්පත යොමු කරන්න" : "Submit receipt"}</span>
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
                <h3 style={{ margin: 0, fontSize: "18px", color: "var(--cream, #fff)" }}>
                  {theaterVideo.title}
                </h3>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => setTheaterVideo(null)}
                style={{ padding: "6px 14px", flexShrink: 0 }}
              >
                ✕ {isSi ? "වසන්න" : "Close"}
              </button>
            </div>

            <VideoPlayer url={theaterVideo.url} title={theaterVideo.title} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
              <span style={{ color: "var(--gold)", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>✨</span>
                <span>{isSi ? "190+ පේපර් පන්තියේ සවිස්තර විවරණය වෙබ් අඩවිය තුළම වාදනය වේ." : "190+ Video discussion playing directly on site."}</span>
              </span>
              <a
                href={theaterVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn ghost"
                style={{ fontSize: "12px", padding: "6px 12px" }}
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
