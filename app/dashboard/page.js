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

  // Navigation tab: "overview", "all_packages", "my_packages", "timer", "my_slips"
  const [activeTab, setActiveTab] = useState("overview");
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

  // Lesson Viewer when a folder is opened
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
          foldersCount={S.folders.length}
        />

        <main>
          {/* Top Bar */}
          <div className="top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="sp" style={{ fontWeight: 700 }}>
              {isSi ? "📖 පාඩම් සහ ප්‍රශ්න පත්‍ර විවරණය" : "📖 Lessons & Paper Discussion"}
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button type="button" className="hd-btn hd-btn-ghost" onClick={toggleLang}>
                🌐 <span>{isSi ? "English" : "සිංහල"}</span>
              </button>
              <button
                type="button"
                className="hd-btn hd-btn-ghost"
                onClick={() => setOpen(null)}
              >
                <span>⬅️ {isSi ? "ආපසු" : "Back"}</span>
              </button>
            </div>
          </div>

          <div className="head" style={{ marginTop: "14px" }}>
            <div>
              <h1 style={{ fontSize: "1.5rem", marginBottom: "4px" }}>{f?.name}</h1>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
                {isSi
                  ? `${f?.grade} ශ්‍රේණිය · දිනකට පළාත් පේපර් 2 බැගින් සාකච්ඡා කරමින් විෂයන් 5ම ආවරණය`
                  : `Grade ${f?.grade} · 2 Provincial papers daily discussing all 5 subjects`}
              </p>
            </div>

            {/* Subject Filters */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
              {subjectsList.map(sub => (
                <button
                  key={sub.id}
                  type="button"
                  className={`btn ${activeSubjectFilter === sub.id ? "gold" : ""}`}
                  style={{ padding: "5px 12px", fontSize: "12.5px" }}
                  onClick={() => setActiveSubjectFilter(sub.id)}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          <section className="card" style={{ marginTop: "16px" }}>
            {its.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {its.map(i => (
                  <div
                    key={i.id}
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--line)",
                      borderRadius: "14px",
                      padding: "18px"
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

                    <h2 style={{ fontSize: "1.15rem", marginBottom: "12px", lineHeight: 1.4 }}>
                      {i.title}
                    </h2>

                    {getYoutubeEmbedUrl(i.url) ? (
                      <div>
                        <VideoPlayer url={i.url} title={i.title} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "10px" }}>
                          <div className="tip" style={{ flex: 1, minWidth: "260px", margin: 0, padding: "8px 12px", fontSize: "12.5px" }}>
                            <b>{isSi ? "💡 190+ රහස:" : "💡 190+ Secret:"}</b>{" "}
                            {isSi
                              ? "වීඩියෝව නැරඹීමට පෙර ඔබ විසින් පේපරය තනිව විසඳා සිටීමෙන් ඔබේ වේගය හා දැනුම දෙගුණ වේ."
                              : "Attempt solving the paper before watching the video discussion to build speed and confidence."}
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
                      <div>
                        <a
                          className="btn gold"
                          href={i.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ padding: "8px 16px", fontSize: "13px" }}
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
              <div style={{ padding: "35px", textAlign: "center", color: "var(--muted)" }}>
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
        {/* Streamlined Top Header Bar (No redundant duplicates) */}
        <div className="top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="sp" style={{ fontWeight: 800 }}>
              {isSi ? "🎓 ශිෂ්‍ය අධ්‍යයන පුවරුව" : "🎓 Student Portal"}
            </span>
            <span className="badge-tag gold" style={{ fontSize: "11.5px", padding: "2px 8px" }}>
              {selectedGrade} {isSi ? "ශ්‍රේණිය (190+ පන්තිය)" : "Grade (190+)"}
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="hd-btn hd-btn-ghost"
              onClick={toggleLang}
              title={isSi ? "Switch to English" : "සිංහල භාෂාවට මාරු වන්න"}
            >
              🌐 <span>{isSi ? "English" : "සිංහල"}</span>
            </button>
            <a
              className="hd-btn hd-btn-whatsapp"
              href={`https://wa.me/${(S.set?.hotline || "0771234567").replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp"
            >
              💬 <span>{isSi ? "වට්ස්ඇප්" : "WhatsApp"}</span>
            </a>
            <button
              type="button"
              className="hd-btn hd-btn-ghost"
              onClick={() => { login(null); router.push("/login"); }}
              title={isSi ? "ඉවත් වන්න" : "Log out"}
            >
              <span>{isSi ? "ඉවත් වන්න" : "Log out"}</span>
            </button>
          </div>
        </div>

        {/* Page Head */}
        <div className="head" style={{ marginTop: "12px", marginBottom: "18px" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "12.5px", color: "var(--muted)" }}>
              {isSi ? "ශිෂ්‍ය පුවරුව" : "Student Portal"} / {" "}
              {activeTab === "overview" && (isSi ? "190+ ප්‍රගති විශ්ලේෂණය" : "Progress & Analysis")}
              {activeTab === "all_packages" && (isSi ? "සියලු පේපර් පැකේජ" : "All Bundles")}
              {activeTab === "my_packages" && (isSi ? "මගේ පාඩම්" : "My Lessons")}
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

        {/* TAB 1: 190+ PROGRESS & PERFORMANCE ANALYSIS (NEW DEDICATED ANALYSIS PART) */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Top 4 KPI Metric Cards */}
            <div className="stats" style={{ margin: 0 }}>
              {/* Card 1: 190+ Readiness */}
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

              {/* Card 2: Daily Paper Target */}
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

              {/* Card 3: Speed Analysis */}
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

              {/* Card 4: Study Streak */}
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

            {/* Middle Section: 5-Subject Mastery & Timing Analysis Grid */}
            <div className="cols">
              {/* Left Column: 5 Subjects Proficiency Breakdown */}
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
                  {/* Subject 1: පරිසරය */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                      <span>🌿 {isSi ? "පරිසරය (තේමා 16 සම්පූර්ණ ආවරණය)" : "Environment (16 Themes)"}</span>
                      <span style={{ color: "var(--gold-ink)" }}>96%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "var(--bg)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "96%", height: "100%", background: "linear-gradient(90deg, #10b981, #f5a623)", borderRadius: "4px" }}></div>
                    </div>
                  </div>

                  {/* Subject 2: මව්බස */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                      <span>✍️ {isSi ? "මව්බස සිංහල (වියරණ, අක්ෂර වින්‍යාසය, රචනා)" : "Mother Tongue (Grammar & Essays)"}</span>
                      <span style={{ color: "var(--gold-ink)" }}>94%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "var(--bg)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "94%", height: "100%", background: "linear-gradient(90deg, #3b82f6, #10b981)", borderRadius: "4px" }}></div>
                    </div>
                  </div>

                  {/* Subject 3: ගණිතය */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                      <span>🔢 {isSi ? "ශිෂ්‍යත්ව ගණිතය (කෙටි ක්‍රම, රටා, ඔරලෝසු)" : "Scholarship Mathematics (Speed Tricks)"}</span>
                      <span style={{ color: "var(--gold-ink)" }}>98%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "var(--bg)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "98%", height: "100%", background: "linear-gradient(90deg, #f5a623, #ff7b00)", borderRadius: "4px" }}></div>
                    </div>
                  </div>

                  {/* Subject 4: දෙමළ */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                      <span>🗣️ {isSi ? "දෙවන බස දෙමළ (1-19 සංවාද & වචන මාලාව)" : "Second Language Tamil (Dialogues 1-19)"}</span>
                      <span style={{ color: "var(--gold-ink)" }}>90%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "var(--bg)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: "90%", height: "100%", background: "linear-gradient(90deg, #8b5cf6, #3b82f6)", borderRadius: "4px" }}></div>
                    </div>
                  </div>

                  {/* Subject 5: ඉංග්‍රීසි */}
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

              {/* Right Column: Time Management & Speed Analysis */}
              <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
                <h2 style={{ fontSize: "1.1rem", margin: "0 0 10px" }}>
                  ⏱️ {isSi ? "විභාග කාල කළමනාකරණ විශ්ලේෂණය" : "Exam Time Management Analysis"}
                </h2>
                <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--muted)" }}>
                  {isSi
                    ? "ශිෂ්‍යත්ව විභාගයේදී නියමිත වේලාවට පෙර පිළිතුරු ලියා අවසන් කිරීමේ වේග මිනුම්:"
                    : "Pacing metrics to ensure you finish before the exam bell rings:"}
                </p>

                {/* Paper I Benchmark */}
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

                {/* Paper II Benchmark */}
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

                {/* Quick Action Button to Speed Practice Timer */}
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

            {/* Bottom 190+ Secrets & Quick Study Actions */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(245, 166, 35, 0.12), rgba(22, 5, 10, 0.85))",
                border: "1px solid rgba(245, 166, 35, 0.35)",
                borderRadius: "16px",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div style={{ flex: 1, minWidth: "280px" }}>
                <span className="badge-tag gold" style={{ marginBottom: "6px", fontSize: "11px" }}>
                  💡 190+ ගුරු උපදෙස
                </span>
                <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem" }}>
                  {isSi
                    ? "දිනපතා පළාත් පේපර් 2 බැගින් කර විවරණ වීඩියෝව නරඹන්න!"
                    : "Solve 2 provincial papers daily & review the master teacher videos!"}
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: 1.45 }}>
                  {isSi
                    ? "කොපි කරන්නත් බෑ.. සම කරන්නත් බෑ... 190+ පන්තියේ සාර්ථකත්වයේ එකම රහස දිනපතා අඛණ්ඩ පුහුණුවයි."
                    : "The secret to 190+ marks is disciplined daily provincial paper practice with detailed reviews."}
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn gold"
                  style={{ padding: "10px 18px", fontSize: "13px" }}
                  onClick={() => setActiveTab("all_packages")}
                >
                  <span>📚 {isSi ? "ප්‍රශ්න පත්‍ර වෙත යන්න" : "Explore Paper Bundles"}</span>
                </button>
                {myUnlockedFolders.length > 0 && (
                  <button
                    type="button"
                    className="btn wa"
                    style={{ padding: "10px 18px", fontSize: "13px" }}
                    onClick={() => setActiveTab("my_packages")}
                  >
                    <span>🎓 {isSi ? "මගේ පාඩම්" : "My Lessons"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ALL PACKAGES (UNIFIED, NON-SHIFTING GRID) */}
        {activeTab === "all_packages" && (
          <section className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", margin: 0 }}>
                  📚 {isSi ? "ලබාගත හැකි ප්‍රශ්න පත්‍ර පැකේජ" : "Available Paper Bundles"}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "13.5px" }}>
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
                    style={{ padding: "5px 12px", fontSize: "12px" }}
                    onClick={() => setSelectedGrade(g)}
                  >
                    {isSi ? `${g} ශ්‍රේණිය ${g === 5 ? "🔥 (190+)" : ""}` : `Grade ${g} ${g === 5 ? "🔥 (190+)" : ""}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Packages Grid: Fixed Height, Stable & Never Jump Around */}
            {gradeFolders.length ? (
              <div className="pkg-grid">
                {gradeFolders.map(f => {
                  const s = st(f.id);
                  const isUnlocked = s === "approved";
                  const isPending = s === "pending";

                  return (
                    <div
                      key={f.id}
                      className="pkg-card"
                      style={{
                        minHeight: "270px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                          <span className="badge-tag gold">
                            {isSi ? `${f.grade} ශ්‍රේණිය` : `Grade ${f.grade}`}
                          </span>
                          <span className="badge-tag" style={{ background: "var(--bg)", color: "var(--muted)" }}>
                            {f.papersCount || (isSi ? "දිනකට පේපර් 2ක්" : "2 Papers Daily")}
                          </span>
                        </div>

                        <h3 style={{
                          fontSize: "1.05rem",
                          lineHeight: 1.35,
                          marginBottom: "8px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          minHeight: "42px"
                        }}>
                          {f.name}
                        </h3>

                        <div style={{ fontSize: "13px", color: "var(--ink)", marginBottom: "8px" }}>
                          🎯 <b>{isSi ? "විෂයයන්:" : "Subjects:"}</b> {f.subjects || (isSi ? "විෂයයන් 5ම සම්පූර්ණයෙන්ම" : "All 5 Subjects")}
                        </div>
                      </div>

                      {/* Card Bottom Area (Pinned evenly) */}
                      <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--line)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <span className="price" style={{ fontSize: "1.15rem", padding: "2px 10px" }}>
                            {isSi ? `රු. ${f.price}` : `Rs. ${f.price}`}
                          </span>
                          {isUnlocked && (
                            <span className="badge-tag ok">{isSi ? "විවෘතයි" : "Unlocked"}</span>
                          )}
                          {isPending && (
                            <span className="badge-tag gold">{isSi ? "පරීක්ෂා වෙමින්" : "Pending"}</span>
                          )}
                        </div>

                        {isUnlocked ? (
                          <button
                            type="button"
                            className="btn wa"
                            style={{ width: "100%", justifyContent: "center", padding: "8px 12px", fontSize: "13px" }}
                            onClick={() => setOpen(f.id)}
                          >
                            <svg style={{ width: 14, height: 14 }}><use href="#eye" /></svg>
                            <span>{isSi ? "ප්‍රශ්න පත්‍ර විවෘත කරන්න" : "Open Paper Bundle"}</span>
                          </button>
                        ) : isPending ? (
                          <div style={{ textAlign: "center", padding: "8px", background: "var(--bg)", borderRadius: "8px", fontSize: "12.5px", color: "var(--muted)" }}>
                            ⏳ {isSi ? "රිසිට්පත පරීක්ෂාවෙන් පසුව විවෘත වේ" : "Unlocks after receipt review"}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn gold"
                            style={{ width: "100%", justifyContent: "center", padding: "8px 12px", fontSize: "13px" }}
                            onClick={() => setPay(f)}
                          >
                            <svg style={{ width: 14, height: 14 }}><use href="#card" /></svg>
                            <span>{isSi ? `ලබාගන්න (රු. ${f.price})` : `Enroll (Rs. ${f.price})`}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
                <p>{isSi ? "මෙම ශ්‍රේණිය සඳහා පේපර් කට්ටල සූදානම් වෙමින් පවතී." : "Paper bundles for this grade will be added shortly."}</p>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: MY UNLOCKED LESSONS */}
        {activeTab === "my_packages" && (
          <section className="card">
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 4px" }}>
              🎓 {isSi ? `මගේ අනුමත පේපර් කට්ටල (${myUnlockedFolders.length})` : `My Unlocked Lessons (${myUnlockedFolders.length})`}
            </h2>
            <p style={{ margin: "0 0 18px", fontSize: "13.5px" }}>
              {isSi ? "ඔබ විසින් ගෙවීම් කර විවෘත කරගත් පේපර්ස් සහ වීඩියෝ සාකච්ඡා" : "Paper bundles and video discussions unlocked for your account"}
            </p>

            {myUnlockedFolders.length ? (
              <div className="pkg-grid">
                {myUnlockedFolders.map(f => (
                  <div
                    key={f.id}
                    className="pkg-card"
                    style={{
                      minHeight: "220px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span className="badge-tag ok">{isSi ? "සක්‍රියයි" : "Active"}</span>
                        <span className="badge-tag" style={{ background: "var(--bg)", color: "var(--muted)" }}>
                          {f.papersCount || (isSi ? "දිනකට පේපර් 2ක්" : "2 Papers Daily")}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "1.05rem", lineHeight: 1.35, marginBottom: "8px" }}>{f.name}</h3>
                      <div style={{ fontSize: "13px", color: "var(--ink)" }}>🎯 {f.subjects}</div>
                    </div>

                    <div style={{ marginTop: "auto", paddingTop: "14px" }}>
                      <button
                        type="button"
                        className="btn wa"
                        style={{ width: "100%", justifyContent: "center", padding: "9px 12px", fontSize: "13px" }}
                        onClick={() => setOpen(f.id)}
                      >
                        <svg style={{ width: 14, height: 14 }}><use href="#eye" /></svg>
                        <span>{isSi ? "පේපර්ස් සහ වීඩියෝ බලන්න" : "Watch Videos & Papers"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)" }}>
                <div style={{ fontSize: "2.4rem", marginBottom: "10px" }}>🔒</div>
                <h3 style={{ fontSize: "1.15rem" }}>{isSi ? "තවම අනුමත පේපර් කට්ටල නොමැත" : "No unlocked bundles yet"}</h3>
                <p style={{ maxWidth: "420px", margin: "6px auto 18px", fontSize: "13.5px" }}>
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
                  <span>{isSi ? "ප්‍රශ්න පත්‍ර පැකේජ බලන්න" : "Explore Paper Bundles"}</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* TAB 4: SPEED TIMER */}
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

        {/* TAB 5: MY SLIPS */}
        {activeTab === "my_slips" && (
          <section className="card">
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 4px" }}>
              💳 {isSi ? "මා යොමු කළ ගෙවීම් රිසිට්පත්" : "Submitted Payment Slips"}
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: "13.5px" }}>
              {isSi ? "ඔබ උඩුගත කළ බැංකු රිසිට්පත්වල අනුමැතිය ලැබීමේ තත්ත්වය" : "Track the status of your submitted bank receipts"}
            </p>

            {mySlips.length ? (
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>{isSi ? "ප්‍රශ්න පත්‍ර පැකේජය" : "Paper bundle"}</th>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>{isSi ? "මුදල" : "Fee"}</th>
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
                            <strong>{f.name || (isSi ? "ප්‍රශ්න පත්‍ර පැකේජය" : "Paper Bundle")}</strong>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <strong style={{ color: "var(--gold-ink)" }}>
                              {isSi ? `රු. ${f.price || 0}` : `Rs. ${f.price || 0}`}
                            </strong>
                          </td>
                          <td style={{ padding: "12px 14px", color: "var(--muted)", fontSize: "13px" }}>{p.date}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <span className={`badge-tag ${p.status === "approved" ? "ok" : p.status === "pending" ? "gold" : "warn"}`}>
                              {p.status === "approved" && (isSi ? "අනුමතයි" : "Approved")}
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
                                onClick={() => setOpen(f.id)}
                              >
                                <span>{isSi ? "විවෘත කරන්න ↗" : "Open ↗"}</span>
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
              <strong style={{ fontSize: "14.5px", display: "block", marginBottom: "4px" }}>
                💰 {isSi ? `ගෙවිය යුතු මුදල: රු. ${pay.price}` : `Fee to Pay: Rs. ${pay.price}`}
              </strong>
              <span style={{ fontSize: "12.5px" }}>
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
