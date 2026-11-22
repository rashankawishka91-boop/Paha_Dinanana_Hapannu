"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp, uid, readFile, getYoutubeEmbedUrl, isYoutubeUrl } from "../../lib/Provider";
import DashboardSidebar from "../../components/DashboardSidebar";
import VideoPlayer from "../../components/VideoPlayer";

export default function Admin() {
  const { S, update, me, login, lang, toggleLang, ready } = useApp();
  const router = useRouter();

  const isSi = lang === "si";

  const [tab, setTab] = useState("overview"); // overview, packages, content, payments, students, settings
  const [filterStatus, setFilterStatus] = useState("all");
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [selectedFolderForContent, setSelectedFolderForContent] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [viewSlip, setViewSlip] = useState(null);
  const [previewVideoItem, setPreviewVideoItem] = useState(null);

  // Form states
  const [nf, setNf] = useState({
    grade: 5,
    name: "",
    category: isSi ? "පළාත් ප්‍රශ්න පත්‍ර" : "Provincial Papers",
    price: "2000",
    papersCount: isSi ? "දිනකට පේපර් 2ක්" : "2 Papers Daily",
    subjects: isSi ? "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි" : "Environmental Studies, Sinhala, Mathematics, Tamil, English",
    desc: ""
  });

  const [ni, setNi] = useState({
    fid: "",
    type: "video",
    subject: isSi ? "පරිසරය" : "Environmental Studies",
    title: "",
    url: ""
  });

  const [set, setSet] = useState({
    name: "",
    slogan: "",
    bank: "",
    hotline: ""
  });

  // Admin Verification
  useEffect(() => {
    if (!ready) return;
    const currentId = localStorage.getItem("paha_dinana_me") || localStorage.getItem("cls_me");
    const activeUser = S.users.find(u => u.id === currentId || u.id === me?.id || u.phone === "admin");

    if (!activeUser || !activeUser.admin) {
      router.replace("/login?role=admin");
    } else if (!me && activeUser) {
      login(activeUser.id);
    }
  }, [ready, me, S.users, router, login]);

  useEffect(() => {
    if (ready && S.set) {
      setSet({
        name: S.set.name || "පහ දිනන හපන්නු - 190+ පේපර් පන්තිය",
        slogan: S.set.slogan || "කොපි කරන්නත් බෑ.. සම කරන්නත් බෑ... ඒ තමයි පහ දිනන හපන්නු!",
        bank: S.set.bank || "",
        hotline: S.set.hotline || "077 123 4567"
      });
    }
  }, [ready, S.set]);

  useEffect(() => {
    if (S.folders.length && !selectedFolderForContent) {
      setSelectedFolderForContent(S.folders[0].id);
      setNi(prev => ({ ...prev, fid: S.folders[0].id }));
    }
  }, [S.folders, selectedFolderForContent]);

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f6f1ec", color: "#2a1a1a", fontFamily: "Figtree, sans-serif" }}>
        <p style={{ fontWeight: 600 }}>{isSi ? "පාලක මැදිරිය සූදානම් වෙමින් පවතී..." : "Loading Admin Portal..."}</p>
      </div>
    );
  }

  const decide = (id, s) => {
    update(d => {
      const p = d.pays.find(x => x.id === id);
      if (p) p.status = s;
    });
  };

  const handleOpenCreatePackage = () => {
    setEditingFolderId(null);
    setNf({
      grade: 5,
      name: "",
      category: isSi ? "පළාත් ප්‍රශ්න පත්‍ර කට්ටල" : "Provincial Paper Bundles",
      price: "2000",
      papersCount: isSi ? "දිනකට පේපර් 2ක්" : "2 Papers Daily",
      subjects: isSi ? "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි" : "Environmental Studies, Sinhala, Mathematics, Tamil, English",
      desc: ""
    });
    setShowPackageModal(true);
  };

  const handleEditPackage = (f) => {
    setEditingFolderId(f.id);
    setNf({
      grade: f.grade || 5,
      name: f.name || "",
      category: f.category || (isSi ? "පළාත් ප්‍රශ්න පත්‍ර කට්ටල" : "Provincial Paper Bundles"),
      price: f.price?.toString() || "2000",
      papersCount: f.papersCount || (isSi ? "දිනකට පේපර් 2ක්" : "2 Papers Daily"),
      subjects: f.subjects || (isSi ? "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි" : "Environmental Studies, Sinhala, Mathematics, Tamil, English"),
      desc: f.desc || ""
    });
    setShowPackageModal(true);
  };

  const handleSavePackage = (e) => {
    e.preventDefault();
    if (!nf.name.trim()) {
      return alert(isSi ? "කරුණාකර පැකේජයේ නම ඇතුළත් කරන්න." : "Please enter the package name.");
    }
    const priceNum = parseInt(nf.price) || 0;
    if (priceNum <= 0) {
      return alert(isSi ? "කරුණාකර වලංගු මිලක් ඇතුළත් කරන්න." : "Please enter a valid price.");
    }

    update(d => {
      if (editingFolderId) {
        const idx = d.folders.findIndex(f => f.id === editingFolderId);
        if (idx !== -1) {
          d.folders[idx] = {
            ...d.folders[idx],
            grade: parseInt(nf.grade) || 5,
            name: nf.name.trim(),
            category: nf.category,
            price: priceNum,
            papersCount: nf.papersCount.trim(),
            subjects: nf.subjects.trim(),
            desc: nf.desc.trim()
          };
        }
      } else {
        const newFolderId = uid();
        d.folders.push({
          id: newFolderId,
          grade: parseInt(nf.grade) || 5,
          name: nf.name.trim(),
          category: nf.category,
          price: priceNum,
          papersCount: nf.papersCount.trim() || (isSi ? "දිනකට පේපර් 2ක්" : "2 Papers Daily"),
          subjects: nf.subjects.trim() || (isSi ? "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි" : "All 5 Subjects"),
          desc: nf.desc.trim()
        });
      }
    });

    const isEdit = !!editingFolderId;
    setShowPackageModal(false);
    setEditingFolderId(null);
    alert(
      isEdit
        ? (isSi ? "පැකේජය සාර්ථකව යාවත්කාලීන විය!" : "Package updated successfully!")
        : (isSi ? "නව පැකේජය සාර්ථකව නිර්මාණය විය! දැන් මෙය මුල් පිටුවේ සහ ශිෂ්‍ය පුවරුවේ දිස්වේ." : "New package created successfully! It is now live on Home and Student Dashboard.")
    );
  };

  const handleDeletePackage = (f) => {
    const confirmMsg = isSi
      ? `"${f.name}" පැකේජය ඉවත් කිරීමට ඔබට සහතිකද? මෙහි ඇති සියලුම පාඩම් සහ ලිපිගොනුද ඉවත් වනු ඇත.`
      : `Are you sure you want to delete "${f.name}"? All lessons and PDFs inside it will also be deleted.`;
    if (confirm(confirmMsg)) {
      update(d => {
        d.folders = d.folders.filter(x => x.id !== f.id);
        d.items = d.items.filter(i => i.fid !== f.id);
      });
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const fid = ni.fid || selectedFolderForContent || S.folders[0]?.id;
    if (!fid || !ni.title.trim() || !ni.url.trim()) {
      return alert(isSi ? "කරුණාකර මාතෘකාව සහ සබැඳිය ඇතුළත් කරන්න." : "Please enter title and link.");
    }

    const isYt = isYoutubeUrl(ni.url);
    const finalType = isYt ? "video" : ni.type;

    update(d => {
      d.items.push({
        id: uid(),
        fid,
        type: finalType,
        subject: ni.subject,
        title: ni.title.trim(),
        url: ni.url.trim()
      });
    });

    setNi(prev => ({
      ...prev,
      title: "",
      url: ""
    }));
    alert(isSi ? "නව පාඩම හෝ සටහන සාර්ථකව එක් කරන ලදී!" : "New lesson or note added successfully!");
  };

  const onLogoUpload = f => {
    if (!f) return;
    if (f.size > 1.5e6) {
      return alert(isSi ? "රූපයේ ප්‍රමාණය 1.5MB ට අඩු විය යුතුය." : "Image size must be under 1.5MB.");
    }
    readFile(f, d => update(s => { s.set.logo = d; }));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    update(d => {
      d.set.name = set.name;
      d.set.slogan = set.slogan;
      d.set.bank = set.bank;
      d.set.hotline = set.hotline;
    });
    alert(isSi ? "පන්ති සැකසුම් සාර්ථකව සුරකින ලදී!" : "Class settings saved successfully!");
  };

  const studentsList = S.users.filter(u => !u.admin);
  const pendingCount = S.pays.filter(p => p.status === "pending").length;
  const approvedCount = S.pays.filter(p => p.status === "approved").length;
  const filteredPays = S.pays.filter(p => filterStatus === "all" || p.status === filterStatus);

  const searchedStudents = studentsList.filter(stu => {
    const q = studentSearch.toLowerCase();
    return (
      stu.name?.toLowerCase().includes(q) ||
      stu.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="app">
      {/* Royal Burgundy Sidebar */}
      <DashboardSidebar
        role="admin"
        activeTab={tab}
        onTabChange={setTab}
        pendingCount={pendingCount}
        foldersCount={S.folders.length}
        studentsCount={studentsList.length}
      />

      {/* Main Workspace */}
      <main>
        {/* Top Header Bar */}
        <div className="top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="sp" style={{ fontWeight: 800 }}>
              {isSi ? "👑 ගුරු පාලක මැදිරිය" : "👑 Admin Portal"}
            </span>
          </div>
        </div>

        {/* Page Head */}
        <div className="head">
          <div>
            <p>
              {isSi ? "පාලක පුවරුව" : "Admin portal"} / {" "}
              {tab === "overview" && (isSi ? "දළ විශ්ලේෂණය" : "Dashboard")}
              {tab === "packages" && (isSi ? "ප්‍රශ්න පත්‍ර පැකේජ" : "Paper bundles")}
              {tab === "content" && (isSi ? "පාඩම් සහ සටහන්" : "Lessons & notes")}
              {tab === "payments" && (isSi ? "ගෙවීම් රිසිට්පත්" : "Payment slips")}
              {tab === "students" && (isSi ? "ශිෂ්‍ය නාමාවලිය" : "Students")}
              {tab === "settings" && (isSi ? "පන්ති සැකසුම්" : "Class settings")}
            </p>
            <h1>
              {tab === "overview" && (isSi ? "දළ විශ්ලේෂණය" : "Dashboard overview")}
              {tab === "packages" && (isSi ? "ප්‍රශ්න පත්‍ර පැකේජ" : "Paper bundles")}
              {tab === "content" && (isSi ? "පාඩම් සහ සටහන්" : "Lessons & notes")}
              {tab === "payments" && (isSi ? "ගෙවීම් රිසිට්පත්" : "Payment slips")}
              {tab === "students" && (isSi ? "ශිෂ්‍ය නාමාවලිය" : "Students directory")}
              {tab === "settings" && (isSi ? "පන්ති සැකසුම්" : "Class settings")}
            </h1>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn gold"
              onClick={handleOpenCreatePackage}
            >
              <svg><use href="#plus" /></svg>
              <span>{isSi ? "නව පැකේජයක් සාදන්න" : "Create new bundle"}</span>
            </button>
            <Link className="btn" href="/dashboard">
              <svg><use href="#eye" /></svg>
              <span>{isSi ? "ශිෂ්‍ය පෙනුම" : "Student view"}</span>
            </Link>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {tab === "overview" && (
          <>
            {/* 4 Stats Cards */}
            <section className="stats" aria-label="Summary">
              <div className="stat" onClick={() => setTab("students")}>
                <div className="l">
                  <span>{isSi ? "ලියාපදිංචි සිසුන්" : "Registered students"}</span>
                  <svg><use href="#users" /></svg>
                </div>
                <div className="v">{studentsList.length}</div>
                <small>{isSi ? "සම්බන්ධ වූ මුළු සිසුන් ගණන" : "Enrolled in total"}</small>
              </div>

              <div className="stat" onClick={() => setTab("packages")}>
                <div className="l">
                  <span>{isSi ? "ප්‍රශ්න පත්‍ර පැකේජ" : "Paper bundles"}</span>
                  <svg><use href="#folder" /></svg>
                </div>
                <div className="v">{S.folders.length}</div>
                <small>{isSi ? "ක්‍රියාත්මක සියලු කට්ටල" : "Active bundles"}</small>
              </div>

              <div
                className={`stat ${pendingCount > 0 ? "alert" : ""}`}
                onClick={() => { setTab("payments"); setFilterStatus("pending"); }}
              >
                <div className="l">
                  <span>{isSi ? "අනුමැතියට ඇති රිසිට්පත්" : "Pending receipts"}</span>
                  <svg><use href="#clock" /></svg>
                </div>
                <div className={`v ${pendingCount > 0 ? "warn" : ""}`}>{pendingCount}</div>
                <small>{isSi ? "තහවුරු කිරීමට ඉතිරි ගෙවීම්" : "Waiting for approval"}</small>
              </div>

              <div
                className="stat"
                onClick={() => { setTab("payments"); setFilterStatus("approved"); }}
              >
                <div className="l">
                  <span>{isSi ? "අනුමත ගෙවීම්" : "Approved payments"}</span>
                  <svg><use href="#check" /></svg>
                </div>
                <div className="v ok">{approvedCount}</div>
                <small>{isSi ? "විවෘත කරදුන් මුළු පැකේජ" : "Bundles unlocked"}</small>
              </div>
            </section>

            {/* 2 Column Layout: Quick Actions & Class Progress */}
            <div className="cols">
              <section className="card">
                <h2>{isSi ? "ක්ෂණික ක්‍රියාමාර්ග" : "Quick actions"}</h2>
                <p>{isSi ? "දෛනික පරිපාලන කෙටිමං" : "Shortcuts for daily work"}</p>

                <button
                  type="button"
                  className="act"
                  onClick={handleOpenCreatePackage}
                >
                  <span className="ic"><svg><use href="#folder" /></svg></span>
                  <span>
                    <b>{isSi ? "නව ප්‍රශ්න පත්‍ර පැකේජයක් සාදන්න" : "Create new paper bundle"}</b>
                    <small>{isSi ? "මුල් පිටුවේ සහ ශිෂ්‍ය පුවරුවේ ක්ෂණිකව පළවේ" : "Appears on the home page and student dashboard straight away"}</small>
                  </span>
                  <svg className="go"><use href="#arrow" /></svg>
                </button>

                <button
                  type="button"
                  className="act"
                  onClick={() => setTab("content")}
                >
                  <span className="ic"><svg><use href="#video" /></svg></span>
                  <span>
                    <b>{isSi ? "වීඩියෝ සහ සටහන් එක් කරන්න" : "Add video or PDF lessons"}</b>
                    <small>{isSi ? "පවතින ඕනෑම පැකේජයකට පාඩම් එක්කරන්න" : "Attach content to any paper bundle"}</small>
                  </span>
                  <svg className="go"><use href="#arrow" /></svg>
                </button>

                <button
                  type="button"
                  className="act"
                  onClick={() => { setTab("payments"); setFilterStatus("pending"); }}
                >
                  <span className="ic"><svg><use href="#card" /></svg></span>
                  <span>
                    <b>{isSi ? "ගෙවීම් රිසිට්පත් පරීක්ෂාව" : "Review payment slips"}</b>
                    <small>{isSi ? `${pendingCount} ක් අනුමැතිය අපේක්ෂාවෙන්` : `${pendingCount} slips waiting for approval`}</small>
                  </span>
                  <svg className="go"><use href="#arrow" /></svg>
                </button>

                <button
                  type="button"
                  className="act"
                  onClick={() => setTab("settings")}
                >
                  <span className="ic"><svg><use href="#cog" /></svg></span>
                  <span>
                    <b>{isSi ? "බැංකු විස්තර සහ පන්ති සැකසුම්" : "Bank details & settings"}</b>
                    <small>{isSi ? "ගිණුම් අංක සහ ක්ෂණික දුරකථන අංකය සංස්කරණය" : "Update account numbers and the contact hotline"}</small>
                  </span>
                  <svg className="go"><use href="#arrow" /></svg>
                </button>
              </section>

              <section className="card">
                <h2>{isSi ? "190+ පන්තියේ තත්ත්වය" : "Class progress"}</h2>
                <p>{isSi ? "විෂයයන් 5ම ආවරණය සහ පේපර් සැලැස්ම" : "Coverage across all scholarship subjects"}</p>

                <dl>
                  <div>
                    <dt>{isSi ? "ක්‍රියාත්මක ශ්‍රේණි" : "Active grades"}</dt>
                    <dd>{isSi ? "5 ශ්‍රේණිය (ප්‍රමුඛ), 4 ශ්‍රේණිය" : "Grade 5 (Primary), Grade 4"}</dd>
                  </div>
                  <div>
                    <dt>{isSi ? "පවතින පැකේජ" : "Available bundles"}</dt>
                    <dd>{S.folders.length} {isSi ? "කට්ටල" : "bundles"}</dd>
                  </div>
                  <div>
                    <dt>{isSi ? "එකතු කළ පාඩම් සහ සටහන්" : "Lessons & PDFs"}</dt>
                    <dd>{S.items.length} {isSi ? "අයිතම" : "items"}</dd>
                  </div>
                  <div>
                    <dt>{isSi ? "AI සහයක" : "AI tutor"}</dt>
                    <dd className="ok">{isSi ? "සක්‍රියයි" : "Active"}</dd>
                  </div>
                  <div>
                    <dt>{isSi ? "ක්ෂණික දුරකථන අංකය" : "WhatsApp hotline"}</dt>
                    <dd>{S.set?.hotline || "077 123 4567"}</dd>
                  </div>
                </dl>

                <div className="tip">
                  <b>{isSi ? "උපදෙස:" : "Tip:"}</b>{" "}
                  {isSi
                    ? "ඔබ නව පේපර් කට්ටලයක් සාදන විට එය එකවරම වෙබ් අඩවියේ මුල් පිටුවේ සහ ශිෂ්‍ය පුවරුවේ දිස්වන බැවින් දරුවන්ට ක්ෂණිකව ලියාපදිංචි වී ගෙවීම් කළ හැක."
                    : "A new bundle shows up instantly on the home page and student dashboard, so students can enrol right away."}
                </div>
              </section>
            </div>
          </>
        )}

        {/* TAB 2: PACKAGES */}
        {tab === "packages" && (
          <section className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2>{isSi ? `ප්‍රශ්න පත්‍ර පැකේජ (${S.folders.length})` : `Paper bundles (${S.folders.length})`}</h2>
                <p style={{ margin: "4px 0 0" }}>
                  {isSi
                    ? "මෙහි සාදන ඕනෑම පැකේජයක් මුල් පිටුවේ සහ ශිෂ්‍ය පුවරුවේ ක්ෂණිකව දිස්වේ."
                    : "Any bundle created here is instantly visible on the home page and student dashboard."}
                </p>
              </div>
              <button type="button" className="btn gold" onClick={handleOpenCreatePackage}>
                <svg><use href="#plus" /></svg>
                <span>{isSi ? "නව පැකේජයක් සාදන්න" : "Create new bundle"}</span>
              </button>
            </div>

            <div className="pkg-grid">
              {S.folders.map(f => {
                const count = S.items.filter(i => i.fid === f.id).length;
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
                      🎯 <b>{isSi ? "විෂයයන්:" : "Subjects:"}</b> {f.subjects || (isSi ? "විෂයයන් 5ම ආවරණය" : "All 5 Subjects")}
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
                      <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                        📄 {count} {isSi ? "පාඩම්" : "lessons"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button
                        type="button"
                        className="btn gold"
                        style={{ flex: 1, justifyContent: "center", padding: "8px" }}
                        onClick={() => {
                          setSelectedFolderForContent(f.id);
                          setNi(prev => ({ ...prev, fid: f.id }));
                          setTab("content");
                        }}
                      >
                        <svg style={{ width: 15, height: 15 }}><use href="#plus" /></svg>
                        <span>{isSi ? "පාඩම්" : "Lessons"}</span>
                      </button>

                      <button
                        type="button"
                        className="btn"
                        style={{ padding: "8px 12px" }}
                        onClick={() => handleEditPackage(f)}
                        title={isSi ? "සංස්කරණය" : "Edit"}
                      >
                        <svg style={{ width: 15, height: 15 }}><use href="#edit" /></svg>
                      </button>

                      <button
                        type="button"
                        className="btn"
                        style={{ padding: "8px 12px", color: "var(--warn)" }}
                        onClick={() => handleDeletePackage(f)}
                        title={isSi ? "ඉවත් කරන්න" : "Delete"}
                      >
                        <svg style={{ width: 15, height: 15 }}><use href="#trash" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 3: CONTENT / LESSONS */}
        {tab === "content" && (
          <div className="cols">
            {/* Add Lesson Form */}
            <section className="card">
              <h2>{isSi ? "නව පාඩමක් හෝ සටහනක් එක් කරන්න" : "Add video or PDF lesson"}</h2>
              <p>{isSi ? "වීඩියෝ විවරණ හෝ ප්‍රශ්න පත්‍ර ලිපිගොනු" : "Attach content to any paper bundle"}</p>

              <form onSubmit={handleAddItem} className="app-form">
                <label className="app-label">
                  <span>{isSi ? "අදාළ ප්‍රශ්න පත්‍ර පැකේජය" : "Target paper bundle"}</span>
                  <select
                    className="app-select"
                    value={ni.fid || selectedFolderForContent || S.folders[0]?.id}
                    onChange={e => {
                      setNi({ ...ni, fid: e.target.value });
                      setSelectedFolderForContent(e.target.value);
                    }}
                  >
                    {S.folders.map(f => (
                      <option key={f.id} value={f.id}>
                        {isSi ? `${f.grade} ශ්‍රේණිය - ${f.name} (රු. ${f.price})` : `Grade ${f.grade} - ${f.name} (Rs. ${f.price})`}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="app-form-row">
                  <label className="app-label">
                    <span>{isSi ? "අදාළ විෂය" : "Subject"}</span>
                    <select
                      className="app-select"
                      value={ni.subject}
                      onChange={e => setNi({ ...ni, subject: e.target.value })}
                    >
                      <option value={isSi ? "පරිසරය" : "Environmental Studies"}>🌿 {isSi ? "පරිසරය" : "Environmental Studies"}</option>
                      <option value={isSi ? "මව්බස" : "Sinhala (Mother Tongue)"}>📖 {isSi ? "මව්බස" : "Sinhala (Mother Tongue)"}</option>
                      <option value={isSi ? "ගණිතය" : "Mathematics"}>🔢 {isSi ? "ගණිතය" : "Mathematics"}</option>
                      <option value={isSi ? "දෙමළ" : "Tamil"}>🗣️ {isSi ? "දෙමළ" : "Tamil"}</option>
                      <option value={isSi ? "ඉංග්‍රීසි" : "English"}>🔤 {isSi ? "ඉංග්‍රීසි" : "English"}</option>
                      <option value={isSi ? "විෂයයන් 5ම" : "All 5 Subjects"}>🌟 {isSi ? "විෂයයන් 5ම ආවරණය" : "All 5 Subjects"}</option>
                    </select>
                  </label>

                  <label className="app-label">
                    <span>{isSi ? "අන්තර්ගත වර්ගය" : "Content type"}</span>
                    <select
                      className="app-select"
                      value={ni.type}
                      onChange={e => setNi({ ...ni, type: e.target.value })}
                    >
                      <option value="video">🎥 {isSi ? "වීඩියෝ විවරණය" : "Video Discussion"}</option>
                      <option value="pdf">📄 {isSi ? "ප්‍රශ්න පත්‍රය හෝ සටහන (PDF)" : "Paper / PDF"}</option>
                    </select>
                  </label>
                </div>

                <label className="app-label">
                  <span>{isSi ? "පාඩමේ හෝ සටහනේ මාතෘකාව" : "Lesson / note title"}</span>
                  <input
                    className="app-input"
                    placeholder={isSi ? "උදා: බස්නාහිර පළාත් පේපර් 01 - පරිසරය විවරණය" : "e.g. Western Province Paper 01 - Science Breakdown"}
                    value={ni.title}
                    onChange={e => setNi({ ...ni, title: e.target.value })}
                    required
                  />
                </label>

                <label className="app-label">
                  <span>{isSi ? "සබැඳිය (YouTube හෝ PDF URL)" : "Link (YouTube or PDF URL)"}</span>
                  <input
                    className="app-input"
                    placeholder={isSi ? "https://www.youtube.com/watch?v=... හෝ PDF සබැඳිය" : "https://www.youtube.com/watch?v=... or PDF URL"}
                    value={ni.url}
                    onChange={e => {
                      const val = e.target.value;
                      setNi({ ...ni, url: val, type: isYoutubeUrl(val) ? "video" : ni.type });
                    }}
                    required
                  />
                </label>

                {/* Instant Live YouTube Video Preview */}
                {getYoutubeEmbedUrl(ni.url) && (
                  <div style={{ marginTop: "10px", padding: "14px", background: "var(--surface)", border: "1px solid var(--gold)", borderRadius: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--gold)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>🎥</span>
                        <span>{isSi ? "සජීවී වීඩියෝ පෙරදසුන (Live Video Preview):" : "Live Video Preview:"}</span>
                      </span>
                      <span className="badge-tag gold" style={{ fontSize: "11px" }}>{isSi ? "වෙබ් අඩවිය තුළම වාදනය වේ" : "Plays on site"}</span>
                    </div>
                    <VideoPlayer url={ni.url} title={ni.title || "Video Preview"} />
                    <small style={{ color: "var(--muted)", display: "block", marginTop: "8px", fontSize: "12px" }}>
                      {isSi ? "✅ මෙම වීඩියෝව වෙබ් අඩවිය තුළම සිසුන්ට සුමටව නැරඹිය හැක." : "✅ This video will play smoothly right inside the website for students."}
                    </small>
                  </div>
                )}

                <button type="submit" className="btn gold" style={{ marginTop: "8px" }}>
                  <svg><use href="#plus" /></svg>
                  <span>{isSi ? "අයිතමය එක් කරන්න" : "Add item"}</span>
                </button>
              </form>
            </section>

            {/* Existing Lessons in Selected Bundle */}
            <section className="card">
              <h2>{isSi ? "පැකේජයේ පවතින පාඩම්" : "Lessons in selected bundle"}</h2>
              <p>
                {isSi ? "තෝරාගත් පැකේජය:" : "Selected bundle:"} {" "}
                <b>{S.folders.find(f => f.id === (selectedFolderForContent || S.folders[0]?.id))?.name}</b>
              </p>

              {S.items.filter(i => i.fid === (selectedFolderForContent || S.folders[0]?.id)).length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {S.items
                    .filter(i => i.fid === (selectedFolderForContent || S.folders[0]?.id))
                    .map(i => (
                      <div
                        key={i.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          background: "var(--bg)",
                          border: "1px solid var(--line)",
                          borderRadius: "10px",
                          gap: "10px"
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                            <span className="badge-tag gold" style={{ fontSize: "11px", padding: "1px 8px" }}>
                              {i.type === "video" || getYoutubeEmbedUrl(i.url) ? (isSi ? "🎥 වීඩියෝ" : "🎥 Video") : (isSi ? "📄 PDF" : "📄 PDF")}
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--muted)" }}>[{i.subject}]</span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {i.title}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {getYoutubeEmbedUrl(i.url) ? (
                            <button
                              type="button"
                              className="btn gold"
                              style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                              onClick={() => setPreviewVideoItem(i)}
                            >
                              <svg style={{ width: 13, height: 13 }}><use href="#video" /></svg>
                              <span>{isSi ? "වෙබ් අඩවියෙන් නරඹන්න" : "Watch on Site"}</span>
                            </button>
                          ) : null}
                          <a
                            href={i.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            title={isSi ? "බාහිර සබැඳිය" : "External link"}
                          >
                            <svg style={{ width: 13, height: 13 }}><use href="#eye" /></svg>
                            <span>{isSi ? "සබැඳිය" : "Link"}</span>
                          </a>
                          <button
                            type="button"
                            className="btn"
                            style={{ padding: "6px 10px", color: "var(--warn)" }}
                            onClick={() => {
                              const confirmMsg = isSi ? "මෙම අයිතමය ඉවත් කිරීමට අවශ්‍යද?" : "Delete this item?";
                              if (confirm(confirmMsg)) {
                                update(d => {
                                  d.items = d.items.filter(x => x.id !== i.id);
                                });
                              }
                            }}
                            title={isSi ? "ඉවත් කරන්න" : "Delete"}
                          >
                            <svg style={{ width: 13, height: 13 }}><use href="#trash" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div style={{ padding: "26px", textAlign: "center", color: "var(--muted)" }}>
                  <p>{isSi ? "මෙම පැකේජයට තවම පාඩම් එක්කර නැත. වම්පස පෝරමයෙන් එක් කරන්න." : "No lessons in this bundle yet. Add one using the form on the left."}</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 4: PAYMENTS */}
        {tab === "payments" && (
          <section className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2>{isSi ? "ගෙවීම් රිසිට්පත් පරීක්ෂාව" : "Payment slips"}</h2>
                <p style={{ margin: "4px 0 0" }}>
                  {isSi
                    ? "දරුවන් උඩුගත කළ බැංකු රිසිට්පත් පරීක්ෂා කර අනුමත කරන්න."
                    : "Review and approve bank deposit slips uploaded by students."}
                </p>
              </div>

              {/* Status Filters */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["all", "pending", "approved", "rejected"].map(st => (
                  <button
                    key={st}
                    type="button"
                    className={`btn ${filterStatus === st ? "gold" : ""}`}
                    style={{ padding: "6px 14px", fontSize: "13px" }}
                    onClick={() => setFilterStatus(st)}
                  >
                    {st === "all" && (isSi ? "සියල්ල" : "All")}
                    {st === "pending" && (isSi ? `අනුමැතියට ඇති (${pendingCount})` : `Pending (${pendingCount})`)}
                    {st === "approved" && (isSi ? "අනුමත" : "Approved")}
                    {st === "rejected" && (isSi ? "ප්‍රතික්ෂේපිත" : "Rejected")}
                  </button>
                ))}
              </div>
            </div>

            {filteredPays.length ? (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>{isSi ? "ශිෂ්‍යයා" : "Student"}</th>
                      <th>{isSi ? "ප්‍රශ්න පත්‍ර පැකේජය" : "Paper bundle"}</th>
                      <th>{isSi ? "මුදල" : "Fee"}</th>
                      <th>{isSi ? "දිනය" : "Date"}</th>
                      <th>{isSi ? "රිසිට්පත" : "Receipt"}</th>
                      <th>{isSi ? "තත්ත්වය" : "Status"}</th>
                      <th>{isSi ? "ක්‍රියාමාර්ග" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredPays].reverse().map(p => {
                      const u = S.users.find(x => x.id === p.uid) || {};
                      const f = S.folders.find(x => x.id === p.fid) || {};
                      return (
                        <tr key={p.id}>
                          <td>
                            <strong>{u.name || (isSi ? "ශිෂ්‍ය නම" : "Student Name")}</strong>
                            <div style={{ color: "var(--muted)", fontSize: "12px" }}>{u.phone}</div>
                          </td>
                          <td>
                            <span>{f.name || (isSi ? "පැකේජය" : "Bundle")}</span>
                          </td>
                          <td>
                            <strong style={{ color: "var(--gold-ink)" }}>
                              {isSi ? `රු. ${f.price || 0}` : `Rs. ${f.price || 0}`}
                            </strong>
                          </td>
                          <td style={{ color: "var(--muted)", fontSize: "13px" }}>{p.date}</td>
                          <td>
                            {p.slip ? (
                              <button
                                type="button"
                                className="btn"
                                style={{ padding: "4px 8px", fontSize: "12px" }}
                                onClick={() => setViewSlip(p.slip)}
                              >
                                <svg style={{ width: 13, height: 13 }}><use href="#eye" /></svg>
                                <span>{isSi ? "බලන්න" : "View"}</span>
                              </button>
                            ) : (
                              <span style={{ color: "var(--muted)" }}>{isSi ? "නැත" : "None"}</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge-tag ${p.status === "approved" ? "ok" : p.status === "pending" ? "gold" : "warn"}`}>
                              {p.status === "approved" && (isSi ? "අනුමතයි" : "Approved")}
                              {p.status === "pending" && (isSi ? "අනුමැතියට" : "Pending")}
                              {p.status === "rejected" && (isSi ? "ප්‍රතික්ෂේපිත" : "Rejected")}
                            </span>
                          </td>
                          <td>
                            {p.status === "pending" ? (
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  type="button"
                                  className="btn wa"
                                  style={{ padding: "5px 12px", fontSize: "12px" }}
                                  onClick={() => decide(p.id, "approved")}
                                >
                                  {isSi ? "අනුමත කරන්න" : "Approve"}
                                </button>
                                <button
                                  type="button"
                                  className="btn"
                                  style={{ padding: "5px 12px", fontSize: "12px", color: "var(--warn)" }}
                                  onClick={() => decide(p.id, "rejected")}
                                >
                                  {isSi ? "ප්‍රතික්ෂේප කරන්න" : "Reject"}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="btn"
                                style={{ padding: "5px 10px", fontSize: "12px" }}
                                onClick={() => decide(p.id, p.status === "approved" ? "pending" : "approved")}
                              >
                                {isSi ? "මාරු කරන්න" : "Toggle"}
                              </button>
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
                <p>{isSi ? "මෙම කාණ්ඩයේ ගෙවීම් රිසිට්පත් නොමැත." : "No payment slips found in this category."}</p>
              </div>
            )}
          </section>
        )}

        {/* TAB 5: STUDENTS DIRECTORY */}
        {tab === "students" && (
          <section className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2>{isSi ? `ශිෂ්‍ය නාමාවලිය (${studentsList.length})` : `Students directory (${studentsList.length})`}</h2>
                <p style={{ margin: "4px 0 0" }}>
                  {isSi ? "ලියාපදිංචි දරුවන්ගේ නාමාවලිය සහ සම්බන්ධතා විස්තර" : "List of registered students and contact details"}
                </p>
              </div>

              <div>
                <input
                  type="text"
                  placeholder={isSi ? "නම හෝ දුරකථන අංකයෙන් සොයන්න..." : "Search by student name or phone..."}
                  className="app-input"
                  style={{ width: "260px" }}
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
              </div>
            </div>

            {searchedStudents.length ? (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>{isSi ? "ශිෂ්‍ය නම" : "Student name"}</th>
                      <th>{isSi ? "දුරකථන අංකය" : "Phone number"}</th>
                      <th>{isSi ? "ශ්‍රේණිය" : "Grade"}</th>
                      <th>{isSi ? "අනුමත පැකේජ" : "Unlocked bundles"}</th>
                      <th>{isSi ? "සම්බන්ධතාවය" : "Contact"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchedStudents.map((stu, sIdx) => {
                      const unlocked = S.pays.filter(p => p.uid === stu.id && p.status === "approved");
                      return (
                        <tr key={stu.id || sIdx}>
                          <td>
                            <strong>{stu.name}</strong>
                          </td>
                          <td style={{ color: "var(--muted)" }}>{stu.phone}</td>
                          <td>
                            <span className="badge-tag" style={{ background: "var(--bg)" }}>
                              {isSi ? `${stu.grade || 5} ශ්‍රේණිය` : `Grade ${stu.grade || 5}`}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-tag ${unlocked.length > 0 ? "ok" : ""}`}>
                              {unlocked.length > 0
                                ? (isSi ? `පැකේජ ${unlocked.length}ක් විවෘතයි` : `${unlocked.length} bundles active`)
                                : (isSi ? "තවම ගෙවා නැත" : "None unlocked")}
                            </span>
                          </td>
                          <td>
                            <a
                              href={`https://wa.me/94${stu.phone.replace(/^0/, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn wa"
                              style={{ padding: "5px 12px", fontSize: "12px" }}
                            >
                              <svg style={{ width: 13, height: 13 }}><use href="#chat" /></svg>
                              <span>{isSi ? "වට්ස්ඇප්" : "WhatsApp"}</span>
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
                <p>{isSi ? "සොයන ලද විස්තර වලට අදාළ සිසුන් හමු නොවීය." : "No students match your search."}</p>
              </div>
            )}
          </section>
        )}

        {/* TAB 6: SETTINGS */}
        {tab === "settings" && (
          <section className="card" style={{ maxWidth: "700px" }}>
            <h2>{isSi ? "පන්ති සැකසුම් සහ බැංකු විස්තර" : "Class settings & bank details"}</h2>
            <p>{isSi ? "වෙබ් අඩවියේ පෙන්වන නම, දුරකථන අංක සහ ගිණුම් විස්තර" : "Class name, hotline contact, and bank deposit details"}</p>

            <form onSubmit={handleSaveSettings} className="app-form">
              <label className="app-label">
                <span>{isSi ? "පන්තියේ නම" : "Class name"}</span>
                <input
                  className="app-input"
                  value={set.name}
                  onChange={e => setSet({ ...set, name: e.target.value })}
                />
              </label>

              <label className="app-label">
                <span>{isSi ? "පන්ති සටන් පාඨය" : "Class slogan"}</span>
                <input
                  className="app-input"
                  value={set.slogan}
                  onChange={e => setSet({ ...set, slogan: e.target.value })}
                />
              </label>

              <label className="app-label">
                <span>{isSi ? "ක්ෂණික දුරකථන අංකය (WhatsApp)" : "Hotline / WhatsApp"}</span>
                <input
                  className="app-input"
                  value={set.hotline}
                  onChange={e => setSet({ ...set, hotline: e.target.value })}
                />
              </label>

              <label className="app-label">
                <span>{isSi ? "බැංකු ගිණුම් විස්තර (සිසුන්ට පෙනෙන විස්තර)" : "Bank account details (Visible to students)"}</span>
                <textarea
                  rows={5}
                  className="app-textarea"
                  value={set.bank}
                  onChange={e => setSet({ ...set, bank: e.target.value })}
                />
              </label>

              <label className="app-label">
                <span>{isSi ? "පන්ති නිල ලාංඡනය" : "Class logo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="app-input"
                  onChange={e => onLogoUpload(e.target.files[0])}
                />
              </label>

              <button type="submit" className="btn gold" style={{ marginTop: "10px", alignSelf: "flex-start" }}>
                <span>💾 {isSi ? "පන්ති සැකසුම් සුරකින්න" : "Save class settings"}</span>
              </button>
            </form>
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      <Link href="/ai-tutor" className="fab">
        <svg><use href="#spark" /></svg>
        <span>190+ AI Tutor</span>
        <span className="live">Live</span>
      </Link>

      {/* CREATE / EDIT PACKAGE MODAL */}
      {showPackageModal && (
        <div className="app-modal-overlay" onClick={() => setShowPackageModal(false)}>
          <div className="app-modal-card" onClick={e => e.stopPropagation()}>
            <div className="app-modal-head">
              <h3>
                {editingFolderId
                  ? (isSi ? "පැකේජය සංස්කරණය කරන්න" : "Edit paper bundle")
                  : (isSi ? "නව ප්‍රශ්න පත්‍ර පැකේජයක් සාදන්න" : "Create new paper bundle")}
              </h3>
              <button
                type="button"
                className="app-modal-close"
                onClick={() => setShowPackageModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="app-form">
              <div className="app-form-row">
                <label className="app-label">
                  <span>{isSi ? "ශ්‍රේණිය" : "Grade"}</span>
                  <select
                    className="app-select"
                    value={nf.grade}
                    onChange={e => setNf({ ...nf, grade: e.target.value })}
                  >
                    {[5, 4, 3, 2, 1].map(g => (
                      <option key={g} value={g}>
                        {isSi ? `${g} ශ්‍රේණිය ${g === 5 ? "🔥 (190+ විශේෂ)" : ""}` : `Grade ${g} ${g === 5 ? "🔥 (190+ Special)" : ""}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="app-label">
                  <span>{isSi ? "පැකේජ වර්ගය" : "Category"}</span>
                  <select
                    className="app-select"
                    value={nf.category}
                    onChange={e => setNf({ ...nf, category: e.target.value })}
                  >
                    <option value={isSi ? "පළාත් ප්‍රශ්න පත්‍ර කට්ටල" : "Provincial Paper Bundles"}>
                      🏛️ {isSi ? "පළාත් ප්‍රශ්න පත්‍ර කට්ටල" : "Provincial Paper Bundles"}
                    </option>
                    <option value={isSi ? "190+ සුපිරි අනුමාන පේපර්" : "190+ Target Model Papers"}>
                      ⭐ {isSi ? "190+ සුපිරි අනුමාන පේපර්" : "190+ Target Model Papers"}
                    </option>
                    <option value={isSi ? "ශිෂ්‍යත්ව පූර්ව අඩිතාලම" : "Scholarship Pre-Foundation"}>
                      🌱 {isSi ? "ශිෂ්‍යත්ව පූර්ව අඩිතාලම" : "Scholarship Pre-Foundation"}
                    </option>
                    <option value={isSi ? "විෂය විශේෂ පුහුණුව" : "Subject Mastery Drills"}>
                      🎯 {isSi ? "විෂය විශේෂ පුහුණුව" : "Subject Mastery Drills"}
                    </option>
                    <option value={isSi ? "කෙටි සටහන් සහ විභාග රහස්" : "Short Notes & Exam Secrets"}>
                      💡 {isSi ? "කෙටි සටහන් සහ විභාග රහස්" : "Short Notes & Exam Secrets"}
                    </option>
                  </select>
                </label>
              </div>

              <label className="app-label">
                <span>{isSi ? "පැකේජයේ නම" : "Bundle name"}</span>
                <input
                  className="app-input"
                  placeholder={isSi ? "උදා: පළාත් ප්‍රශ්න පත්‍ර කට්ටලය 04 (බස්නාහිර සහ මධ්‍යම)" : "e.g. Provincial Paper Bundle 04 (Western & Central)"}
                  value={nf.name}
                  onChange={e => setNf({ ...nf, name: e.target.value })}
                  required
                />
              </label>

              <div className="app-form-row">
                <label className="app-label">
                  <span>{isSi ? "ගාස්තුව (රු.)" : "Fee (Rs.)"}</span>
                  <input
                    type="number"
                    className="app-input"
                    placeholder="2000"
                    value={nf.price}
                    onChange={e => setNf({ ...nf, price: e.target.value })}
                    required
                  />
                </label>

                <label className="app-label">
                  <span>{isSi ? "ප්‍රශ්න පත්‍ර ගණන" : "Papers count tag"}</span>
                  <input
                    className="app-input"
                    placeholder={isSi ? "උදා: දිනකට පේපර් 2ක් හෝ පේපර් 15ක්" : "e.g. 2 Papers Daily or 15 Papers"}
                    value={nf.papersCount}
                    onChange={e => setNf({ ...nf, papersCount: e.target.value })}
                  />
                </label>
              </div>

              <label className="app-label">
                <span>{isSi ? "ආවරණය වන විෂයයන්" : "Covered subjects"}</span>
                <input
                  className="app-input"
                  placeholder={isSi ? "උදා: පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි" : "e.g. Environmental Studies, Sinhala, Mathematics, Tamil, English"}
                  value={nf.subjects}
                  onChange={e => setNf({ ...nf, subjects: e.target.value })}
                />
              </label>

              <label className="app-label">
                <span>{isSi ? "විස්තරය" : "Description"}</span>
                <textarea
                  rows={2}
                  className="app-textarea"
                  placeholder={isSi ? "පැකේජය පිළිබඳ කෙටි හැඳින්වීමක්..." : "Brief overview of what students receive..."}
                  value={nf.desc}
                  onChange={e => setNf({ ...nf, desc: e.target.value })}
                />
              </label>

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button type="submit" className="btn gold" style={{ flex: 1, justifyContent: "center" }}>
                  {editingFolderId
                    ? (isSi ? "වෙනස්කම් සුරකින්න" : "Save changes")
                    : (isSi ? "පැකේජය සාදන්න" : "Create bundle")}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowPackageModal(false)}
                >
                  {isSi ? "අවලංගු කරන්න" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW SLIP PREVIEW MODAL */}
      {viewSlip && (
        <div className="app-modal-overlay" onClick={() => setViewSlip(null)}>
          <div className="app-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "560px" }}>
            <div className="app-modal-head">
              <h3>{isSi ? "බැංකු රිසිට්පත" : "Bank deposit receipt"}</h3>
              <button
                type="button"
                className="app-modal-close"
                onClick={() => setViewSlip(null)}
              >
                ✕
              </button>
            </div>
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <img
                src={viewSlip}
                alt="Bank Slip"
                style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* WATCH VIDEO ON-SITE MODAL */}
      {previewVideoItem && (
        <div
          className="video-theater-overlay"
          onClick={() => setPreviewVideoItem(null)}
        >
          <div
            className="video-theater-card"
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
              <div>
                <span className="badge-tag gold" style={{ marginBottom: "6px", display: "inline-block" }}>
                  🎥 {previewVideoItem.subject}
                </span>
                <h3 style={{ margin: 0, fontSize: "18px", color: "var(--cream, #fff)" }}>
                  {previewVideoItem.title}
                </h3>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => setPreviewVideoItem(null)}
                style={{ padding: "6px 14px", flexShrink: 0 }}
              >
                ✕ {isSi ? "වසන්න" : "Close"}
              </button>
            </div>

            <VideoPlayer url={previewVideoItem.url} title={previewVideoItem.title} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
              <span style={{ color: "var(--gold)", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>✨</span>
                <span>{isSi ? "මෙම වීඩියෝව වෙබ් අඩවිය තුළම වාදනය වේ." : "Playing directly inside the website."}</span>
              </span>
              <a
                href={previewVideoItem.url}
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
