"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp, uid, readFile, getYoutubeEmbedUrl, isYoutubeUrl, MONTH_OPTIONS } from "../../lib/Provider";
import DashboardSidebar from "../../components/DashboardSidebar";
import VideoPlayer from "../../components/VideoPlayer";

export default function Admin() {
  const { S, update, me, login, lang, ready } = useApp();
  const router = useRouter();

  const isSi = lang === "si";

  const [tab, setTab] = useState("overview"); // overview, packages, content, payments, students, settings
  const [filterStatus, setFilterStatus] = useState("all");
  const [adminGradeFilter, setAdminGradeFilter] = useState("all");
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [selectedFolderForContent, setSelectedFolderForContent] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [viewSlip, setViewSlip] = useState(null);
  const [previewVideoItem, setPreviewVideoItem] = useState(null);

  // New / Edit Monthly Class Form State
  const [nf, setNf] = useState({
    grade: 5,
    month: "2026 නොවැම්බර්",
    isCurrentMonth: true,
    name: "",
    category: isSi ? "මාසික ප්‍රශ්න පත්‍ර පන්තිය" : "Monthly Paper Class",
    price: "2000",
    papersCount: isSi ? "දිනකට පේපර් 2ක් + Zoom Live" : "2 Papers Daily + Zoom Live",
    subjects: isSi ? "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි" : "Environmental Studies, Sinhala, Mathematics, Tamil, English",
    zoomUrl: "https://zoom.us/j/94771234567",
    zoomSchedule: isSi ? "සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 - 9.00 (Zoom Live)" : "Every Saturday & Sunday 7:00 PM (Zoom Live)",
    desc: ""
  });

  // New Lesson Item (Zoom / Video / PDF) Form State
  const [ni, setNi] = useState({
    fid: "",
    type: "video", // "zoom" | "video" | "pdf"
    week: "1 වන සතිය",
    subject: isSi ? "විෂයයන් 5ම" : "All 5 Subjects",
    title: "",
    url: "",
    schedule: ""
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

  const handleSetCurrentMonth = (folder) => {
    update(d => {
      d.folders.forEach(x => {
        if (Number(x.grade) === Number(folder.grade)) {
          x.isCurrentMonth = x.id === folder.id;
        }
      });
    });
  };

  const handleOpenCreatePackage = () => {
    setEditingFolderId(null);
    const defaultMonth = "2026 දෙසැම්බර්";
    setNf({
      grade: 5,
      month: defaultMonth,
      isCurrentMonth: true,
      name: `${defaultMonth} මාසයේ පන්තිය (190+ පළාත් පේපර් සහ සජීවී පන්ති)`,
      category: isSi ? "මාසික ප්‍රශ්න පත්‍ර පන්තිය" : "Monthly Paper Class",
      price: "2000",
      papersCount: isSi ? "දිනකට පේපර් 2ක් + Zoom Live" : "2 Papers Daily + Zoom Live",
      subjects: isSi ? "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි" : "Environmental Studies, Sinhala, Mathematics, Tamil, English",
      zoomUrl: "https://zoom.us/j/94771234567",
      zoomSchedule: isSi ? "සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 - 9.00 (Zoom Live)" : "Every Saturday & Sunday 7:00 PM (Zoom Live)",
      desc: isSi
        ? "රු. 2000 මාසික පන්ති ගාස්තුව ගෙවූ පසු මෙම මාසයට අදාළ සියලුම සජීවී Zoom පන්ති, වීඩියෝ විවරණ සහ PDF ප්‍රශ්න පත්‍ර සම්පූර්ණයෙන්ම විවෘත වේ."
        : "Pay Rs. 2000 monthly fee to unlock all Zoom live classes, video discussions, and PDF papers for this month."
    });
    setShowPackageModal(true);
  };

  const handleEditPackage = (f) => {
    setEditingFolderId(f.id);
    setNf({
      grade: f.grade || 5,
      month: f.month || "2026 නොවැම්බර්",
      isCurrentMonth: Boolean(f.isCurrentMonth),
      name: f.name || "",
      category: f.category || (isSi ? "මාසික ප්‍රශ්න පත්‍ර පන්තිය" : "Monthly Paper Class"),
      price: f.price?.toString() || "2000",
      papersCount: f.papersCount || (isSi ? "දිනකට පේපර් 2ක් + Zoom Live" : "2 Papers Daily + Zoom Live"),
      subjects: f.subjects || (isSi ? "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි" : "Environmental Studies, Sinhala, Mathematics, Tamil, English"),
      zoomUrl: f.zoomUrl || "https://zoom.us/j/94771234567",
      zoomSchedule: f.zoomSchedule || (isSi ? "සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 ට" : "Every Saturday & Sunday 7:00 PM"),
      desc: f.desc || ""
    });
    setShowPackageModal(true);
  };

  const handleSavePackage = (e) => {
    e.preventDefault();
    if (!nf.name.trim()) {
      return alert(isSi ? "කරුණාකර මාසික පන්තියේ නම ඇතුළත් කරන්න." : "Please enter the monthly class name.");
    }
    const priceNum = parseInt(nf.price) || 2000;
    const gradeNum = parseInt(nf.grade) || 5;

    update(d => {
      // If marked as current month, unmark other current months in the same grade so only the chosen month is highlighted
      if (nf.isCurrentMonth) {
        d.folders.forEach(x => {
          if (Number(x.grade) === gradeNum) {
            x.isCurrentMonth = false;
          }
        });
      }

      if (editingFolderId) {
        const idx = d.folders.findIndex(f => f.id === editingFolderId);
        if (idx !== -1) {
          d.folders[idx] = {
            ...d.folders[idx],
            grade: gradeNum,
            month: nf.month.trim() || "2026 නොවැම්බර්",
            isCurrentMonth: Boolean(nf.isCurrentMonth),
            name: nf.name.trim(),
            category: nf.category,
            price: priceNum,
            papersCount: nf.papersCount.trim(),
            subjects: nf.subjects.trim(),
            zoomUrl: nf.zoomUrl.trim(),
            zoomSchedule: nf.zoomSchedule.trim(),
            desc: nf.desc.trim()
          };
        }
      } else {
        const newFolderId = uid();
        d.folders.unshift({
          id: newFolderId,
          grade: gradeNum,
          month: nf.month.trim() || "2026 දෙසැම්බර්",
          isCurrentMonth: Boolean(nf.isCurrentMonth),
          name: nf.name.trim(),
          category: nf.category,
          price: priceNum,
          papersCount: nf.papersCount.trim() || (isSi ? "දිනකට පේපර් 2ක් + Zoom Live" : "2 Papers Daily + Zoom Live"),
          subjects: nf.subjects.trim() || (isSi ? "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි" : "All 5 Subjects"),
          zoomUrl: nf.zoomUrl.trim(),
          zoomSchedule: nf.zoomSchedule.trim(),
          desc: nf.desc.trim()
        });
      }
    });

    const isEdit = !!editingFolderId;
    setShowPackageModal(false);
    setEditingFolderId(null);
    alert(
      isEdit
        ? (isSi ? "මාසික පන්තිය සාර්ථකව යාවත්කාලීන විය!" : "Monthly class updated successfully!")
        : (isSi ? "නව මාසික පන්තිය සාර්ථකව එක් කරන ලදී! දැන් එය අදාළ ශ්‍රේණියේ ශිෂ්‍ය පුවරුවේ දිස්වේ." : "New monthly class added! It is now live on the Student Dashboard.")
    );
  };

  const handleDeletePackage = (f) => {
    const confirmMsg = isSi
      ? `"${f.name}" මාසික පන්තිය ඉවත් කිරීමට ඔබට සහතිකද? මෙහි ඇති සියලුම Zoom සබැඳි, වීඩියෝ සහ PDF ලිපිගොනුද ඉවත් වනු ඇත.`
      : `Are you sure you want to delete "${f.name}"? All Zoom links, videos, and PDFs inside it will also be deleted.`;
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
    const finalType = ni.type === "zoom" ? "zoom" : isYt ? "video" : ni.type;

    update(d => {
      d.items.push({
        id: uid(),
        fid,
        type: finalType,
        week: ni.week || "1 වන සතිය",
        subject: ni.subject,
        title: ni.title.trim(),
        url: ni.url.trim(),
        schedule: ni.schedule?.trim() || ""
      });
    });

    setNi(prev => ({
      ...prev,
      title: "",
      url: "",
      schedule: ""
    }));
    alert(
      isSi
        ? "නව ඉගෙනුම් අයිතමය (Zoom / Video / PDF) අදාළ මාසයට සාර්ථකව එක් කරන ලදී!"
        : "New item (Zoom / Video / PDF) added to the selected month!"
    );
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

  const filteredAdminFolders = S.folders.filter(
    f => adminGradeFilter === "all" || Number(f.grade) === Number(adminGradeFilter)
  );

  const activeContentFolder = S.folders.find(
    f => f.id === (selectedFolderForContent || S.folders[0]?.id)
  );

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
              {isSi ? "👑 ගුරු පාලක මැදිරිය (මාසික පන්ති කළමනාකරණය)" : "👑 Admin Portal (Monthly Classes Management)"}
            </span>
          </div>
        </div>

        {/* Page Head */}
        <div className="head">
          <div>
            <p>
              {isSi ? "පාලක පුවරුව" : "Admin portal"} / {" "}
              {tab === "overview" && (isSi ? "දළ විශ්ලේෂණය" : "Dashboard")}
              {tab === "packages" && (isSi ? "මාසික පන්ති කළමනාකරණය" : "Monthly classes")}
              {tab === "content" && (isSi ? "Zoom / Video / PDF එක් කරන්න" : "Add Zoom / Video / PDF")}
              {tab === "payments" && (isSi ? "මාසික ගෙවීම් රිසිට්පත්" : "Monthly fee slips")}
              {tab === "students" && (isSi ? "ශිෂ්‍ය නාමාවලිය" : "Students")}
              {tab === "settings" && (isSi ? "පන්ති සැකසුම්" : "Class settings")}
            </p>
            <h1>
              {tab === "overview" && (isSi ? "දළ විශ්ලේෂණය" : "Dashboard overview")}
              {tab === "packages" && (isSi ? "මාසෙන් මාසෙට පන්ති කළමනාකරණය" : "Month-by-Month Classes")}
              {tab === "content" && (isSi ? "මාසික පන්තියට Zoom / Video / PDF එක් කරන්න" : "Add Zoom / Video / PDF to Month")}
              {tab === "payments" && (isSi ? "රු. 2000 මාසික ගෙවීම් රිසිට්පත්" : "Rs. 2000 Monthly Fee Slips")}
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
              <span>{isSi ? "📅 අලුත් මාසයක් එක් කරන්න" : "📅 Add New Month"}</span>
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setTab("content")}
            >
              <span>🎥 {isSi ? "Zoom / Video / PDF දාන්න" : "Add Zoom / Video / PDF"}</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: OVERVIEW                                                      */}
        {/* ==================================================================== */}
        {tab === "overview" && (
          <>
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
                  <span>{isSi ? "මාසික පන්ති ගණන" : "Monthly classes"}</span>
                  <svg><use href="#folder" /></svg>
                </div>
                <div className="v">{S.folders.length}</div>
                <small>{isSi ? "සියලු ශ්‍රේණිවල ක්‍රියාත්මක මාස" : "Active monthly classes"}</small>
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
                <small>{isSi ? "රු. 2000 මාසික ගාස්තු රිසිට්පත්" : "Waiting for approval"}</small>
              </div>

              <div
                className="stat"
                onClick={() => { setTab("payments"); setFilterStatus("approved"); }}
              >
                <div className="l">
                  <span>{isSi ? "අනුමත මාසික ගෙවීම්" : "Approved payments"}</span>
                  <svg><use href="#check" /></svg>
                </div>
                <div className="v ok">{approvedCount}</div>
                <small>{isSi ? "විවෘත කරදුන් මුළු මාස ගණන" : "Months unlocked"}</small>
              </div>
            </section>

            <div className="cols">
              <section className="card">
                <h2>{isSi ? "ක්ෂණික ක්‍රියාමාර්ග" : "Quick actions"}</h2>
                <p>{isSi ? "මාසික පන්ති සහ ඉගෙනුම් ද්‍රව්‍ය කළමනාකරණය" : "Manage monthly classes and materials"}</p>

                <button
                  type="button"
                  className="act"
                  onClick={handleOpenCreatePackage}
                >
                  <span className="ic"><svg><use href="#folder" /></svg></span>
                  <span>
                    <b>{isSi ? "📅 අලුත් මාසයක් / මාසික පන්තියක් එක් කරන්න" : "📅 Add a New Monthly Class"}</b>
                    <small>{isSi ? "ඕනෑම ශ්‍රේණියකට නව මාසයක් එක්කර මේ මාසය ලෙස Highlight කරන්න" : "Create a new month for any grade and highlight as current month"}</small>
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
                    <b>{isSi ? "🔴 Zoom Live Link, වීඩියෝ සහ PDF එක් කරන්න" : "🔴 Add Zoom Live Link, Video & PDF"}</b>
                    <small>{isSi ? "අදාළ මාසය තුළට සජීවී Zoom සබැඳි, YouTube වීඩියෝ සහ PDF පේපර්ස් දාන්න" : "Add Zoom links, YouTube recordings, and PDF papers inside any month"}</small>
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
                    <b>{isSi ? "💳 රු. 2000 මාසික ගෙවීම් රිසිට්පත් අනුමත කරන්න" : "💳 Approve Rs. 2000 Monthly Fee Slips"}</b>
                    <small>{isSi ? `${pendingCount} ක් අනුමැතිය අපේක්ෂාවෙන් පවතී` : `${pendingCount} slips waiting for approval`}</small>
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
                    <small>{isSi ? "ගිණුම් අංක සහ ක්ෂණික දුරකථන අංකය සංස්කරණය" : "Update account numbers and contact hotline"}</small>
                  </span>
                  <svg className="go"><use href="#arrow" /></svg>
                </button>
              </section>

              <section className="card">
                <h2>{isSi ? "මාසික පන්ති පද්ධතියේ තත්ත්වය" : "Monthly Class System Status"}</h2>
                <p>{isSi ? "ශ්‍රේණි අනුව ක්‍රියාත්මක මාස සහ මාසික ගාස්තු" : "Active months and monthly fee summary"}</p>

                <dl>
                  <div>
                    <dt>{isSi ? "ක්‍රියාත්මක ශ්‍රේණි" : "Active grades"}</dt>
                    <dd>{isSi ? "1, 2, 3, 4 සහ 5 ශ්‍රේණිය (190+ විශේෂ)" : "Grades 1, 2, 3, 4 & Grade 5 (190+)"}</dd>
                  </div>
                  <div>
                    <dt>{isSi ? "සම්මත මාසික පන්ති ගාස්තුව" : "Standard monthly fee"}</dt>
                    <dd style={{ color: "var(--gold-ink)", fontWeight: 700 }}>{isSi ? "රු. 2000 (මසකට)" : "Rs. 2000 / month"}</dd>
                  </div>
                  <div>
                    <dt>{isSi ? "පවතින මුළු මාසික පන්ති" : "Total monthly classes"}</dt>
                    <dd>{S.folders.length} {isSi ? "මාස" : "months"}</dd>
                  </div>
                  <div>
                    <dt>{isSi ? "එකතු කළ Zoom / Video / PDF" : "Total Zoom / Video / PDF items"}</dt>
                    <dd>{S.items.length} {isSi ? "අයිතම" : "items"}</dd>
                  </div>
                  <div>
                    <dt>{isSi ? "ක්ෂණික දුරකථන අංකය" : "WhatsApp hotline"}</dt>
                    <dd>{S.set?.hotline || "077 123 4567"}</dd>
                  </div>
                </dl>

                <div className="tip">
                  <b>{isSi ? "💡 වැදගත්:" : "💡 Note:"}</b>{" "}
                  {isSi
                    ? "ශිෂ්‍යයෙකු ලියාපදිංචි වූ ශ්‍රේණියට අදාළ මාස ලැයිස්තුව ඔවුන් ලොග් වූ සැණින් දිස්වේ. ඔබ \"මේ මාසය\" ලෙස ලකුණු කරන මාසය රන්වන් පැහැයෙන් ඉහළින්ම Highlight වී පෙනේ."
                    : "Students automatically see the months for their grade upon login. The month marked as 'Current Month' is highlighted at the top in gold."}
                </div>
              </section>
            </div>
          </>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: MONTHLY CLASSES MANAGEMENT (ADD/EDIT MONTHS & HIGHLIGHT)      */}
        {/* ==================================================================== */}
        {tab === "packages" && (
          <section className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2>{isSi ? `මාසික පන්ති ලැයිස්තුව (${filteredAdminFolders.length})` : `Monthly Classes (${filteredAdminFolders.length})`}</h2>
                <p style={{ margin: "4px 0 0" }}>
                  {isSi
                    ? "අලුත් මාස එක් කරන්න, මේ මාසයේ පන්තිය Highlight කරන්න, සහ එක් එක් මාසයට Zoom / Video / PDF එක් කරන්න."
                    : "Add new months, highlight the current active month, and manage Zoom / Video / PDF items."}
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {/* Grade Filter Pills */}
                {["all", 5, 4, 3, 2, 1].map(g => (
                  <button
                    key={g}
                    type="button"
                    className={`btn ${adminGradeFilter === g ? "gold" : ""}`}
                    style={{ padding: "6px 12px", fontSize: "12.5px" }}
                    onClick={() => setAdminGradeFilter(g)}
                  >
                    {g === "all"
                      ? (isSi ? "සියලු ශ්‍රේණි" : "All Grades")
                      : (isSi ? `${g} ශ්‍රේණිය` : `Grade ${g}`)}
                  </button>
                ))}

                <button type="button" className="btn gold" onClick={handleOpenCreatePackage}>
                  <svg><use href="#plus" /></svg>
                  <span>{isSi ? "📅 අලුත් මාසයක් එක් කරන්න" : "📅 Add New Month"}</span>
                </button>
              </div>
            </div>

            <div className="pkg-grid">
              {filteredAdminFolders.map(f => {
                const folderItems = S.items.filter(i => i.fid === f.id);
                const vCount = folderItems.filter(i => i.type === "video" || getYoutubeEmbedUrl(i.url)).length;
                const pCount = folderItems.filter(i => i.type === "pdf").length;
                const zCount = folderItems.filter(i => i.type === "zoom").length;

                return (
                  <div
                    key={f.id}
                    className="pkg-card"
                    style={{
                      border: f.isCurrentMonth ? "2px solid var(--gold)" : "1px solid var(--line)",
                      background: f.isCurrentMonth
                        ? "linear-gradient(180deg, rgba(245, 166, 35, 0.1), var(--surface))"
                        : "var(--surface)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span className="badge-tag gold">
                        🎓 {isSi ? `${f.grade} ශ්‍රේණිය` : `Grade ${f.grade}`}
                      </span>
                      <span className="badge-tag" style={{ background: "var(--bg)", fontWeight: 700 }}>
                        📅 {f.month || (isSi ? "මාසික පන්තිය" : "Monthly")}
                      </span>
                      {f.isCurrentMonth ? (
                        <span className="badge-tag ok" style={{ fontWeight: 800 }}>
                          🔥 {isSi ? "මේ මාසය (Highlighted)" : "Current Month"}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: "2px 8px", fontSize: "11px" }}
                          onClick={() => handleSetCurrentMonth(f)}
                          title={isSi ? "මෙම ශ්‍රේණියේ වත්මන් මාසය ලෙස Highlight කරන්න" : "Set as Current Highlighted Month for this grade"}
                        >
                          ⭐ {isSi ? "මේ මාසය ලෙස දාන්න" : "Set as Current"}
                        </button>
                      )}
                    </div>

                    <h3>{f.name}</h3>

                    <div style={{ fontSize: "12.5px", color: "var(--ink)" }}>
                      🎯 <b>{isSi ? "විෂයයන්:" : "Subjects:"}</b> {f.subjects}
                    </div>

                    {f.zoomUrl && (
                      <div style={{ fontSize: "12px", color: "#2563eb", background: "rgba(37, 99, 235, 0.08)", padding: "6px 10px", borderRadius: "8px" }}>
                        🔴 <b>Zoom Live:</b> {f.zoomSchedule || f.zoomUrl}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--line)" }}>
                      <span className="price">
                        {isSi ? `රු. ${f.price || 2000}` : `Rs. ${f.price || 2000}`}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
                        🔴 {zCount + (f.zoomUrl ? 1 : 0)} Zoom · 🎥 {vCount} Video · 📄 {pCount} PDF
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
                        <span>{isSi ? "Zoom / Video / PDF දාන්න" : "Add Zoom / Video / PDF"}</span>
                      </button>

                      <button
                        type="button"
                        className="btn"
                        style={{ padding: "8px 12px" }}
                        onClick={() => handleEditPackage(f)}
                        title={isSi ? "මාසය සංස්කරණය කරන්න" : "Edit Month"}
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

        {/* ==================================================================== */}
        {/* TAB 3: ADD ZOOM LIVE LINK / VIDEO / PDF TO SELECTED MONTH            */}
        {/* ==================================================================== */}
        {tab === "content" && (
          <div className="cols">
            {/* Left Column: Add Zoom Live / Video / PDF Form */}
            <section className="card">
              <h2>{isSi ? "මාසික පන්තියට Zoom / Video / PDF එක් කරන්න" : "Add Zoom / Video / PDF to Month"}</h2>
              <p>{isSi ? "තෝරාගත් මාසය තුළට සජීවී Zoom පන්ති සබැඳි, YouTube වීඩියෝ හෝ PDF ප්‍රශ්න පත්‍ර එක් කරන්න" : "Attach Zoom live links, YouTube video lessons, or PDF papers to any month"}</p>

              <form onSubmit={handleAddItem} className="app-form">
                <label className="app-label">
                  <span>{isSi ? "1. අදාළ මාසික පන්තිය තෝරන්න (ශ්‍රේණිය සහ මාසය)" : "1. Select Target Monthly Class"}</span>
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
                        {isSi
                          ? `${f.grade} ශ්‍රේණිය | ${f.month || ""} ${f.isCurrentMonth ? "🔥 (මේ මාසය)" : ""} - ${f.name}`
                          : `Grade ${f.grade} | ${f.month || ""} ${f.isCurrentMonth ? "🔥 (Current)" : ""} - ${f.name}`}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="app-form-row">
                  <label className="app-label">
                    <span>{isSi ? "2. ඇතුළත් කරන වර්ගය (Zoom / Video / PDF)" : "2. Content Type"}</span>
                    <select
                      className="app-select"
                      value={ni.type}
                      onChange={e => setNi({ ...ni, type: e.target.value })}
                    >
                      <option value="zoom">🔴 {isSi ? "Zoom සජීවී පන්ති සබැඳිය (Zoom Live Link)" : "Zoom Live Class Link"}</option>
                      <option value="video">🎥 {isSi ? "වීඩියෝ විවරණය (YouTube Video)" : "Video Discussion (YouTube)"}</option>
                      <option value="pdf">📄 {isSi ? "ප්‍රශ්න පත්‍රය හෝ සටහන (PDF)" : "Question Paper / Note (PDF)"}</option>
                    </select>
                  </label>

                  <label className="app-label">
                    <span>{isSi ? "3. සතිය / කාණ්ඩය" : "3. Week / Session"}</span>
                    <select
                      className="app-select"
                      value={ni.week}
                      onChange={e => setNi({ ...ni, week: e.target.value })}
                    >
                      <option value="1 වන සතිය">🗓️ {isSi ? "1 වන සතිය" : "Week 01"}</option>
                      <option value="2 වන සතිය">🗓️ {isSi ? "2 වන සතිය" : "Week 02"}</option>
                      <option value="3 වන සතිය">🗓️ {isSi ? "3 වන සතිය" : "Week 03"}</option>
                      <option value="4 වන සතිය">🗓️ {isSi ? "4 වන සතිය" : "Week 04"}</option>
                      <option value="විශේෂ පන්තිය">⭐ {isSi ? "විශේෂ පන්තිය" : "Special Session"}</option>
                    </select>
                  </label>
                </div>

                <label className="app-label">
                  <span>{isSi ? "4. අදාළ විෂය" : "4. Subject"}</span>
                  <select
                    className="app-select"
                    value={ni.subject}
                    onChange={e => setNi({ ...ni, subject: e.target.value })}
                  >
                    <option value={isSi ? "විෂයයන් 5ම" : "All 5 Subjects"}>🌟 {isSi ? "විෂයයන් 5ම ආවරණය" : "All 5 Subjects"}</option>
                    <option value={isSi ? "පරිසරය" : "Environmental Studies"}>🌿 {isSi ? "පරිසරය" : "Environmental Studies"}</option>
                    <option value={isSi ? "මව්බස" : "Sinhala (Mother Tongue)"}>📖 {isSi ? "මව්බස" : "Sinhala (Mother Tongue)"}</option>
                    <option value={isSi ? "ගණිතය" : "Mathematics"}>🔢 {isSi ? "ගණිතය" : "Mathematics"}</option>
                    <option value={isSi ? "දෙමළ" : "Tamil"}>🗣️ {isSi ? "දෙමළ" : "Tamil"}</option>
                    <option value={isSi ? "ඉංග්‍රීසි" : "English"}>🔤 {isSi ? "ඉංග්‍රීසි" : "English"}</option>
                  </select>
                </label>

                <label className="app-label">
                  <span>
                    {ni.type === "zoom"
                      ? (isSi ? "5. සජීවී Zoom පන්තියේ මාතෘකාව" : "5. Zoom Live Class Title")
                      : ni.type === "pdf"
                      ? (isSi ? "5. PDF ප්‍රශ්න පත්‍රයේ හෝ සටහනේ මාතෘකාව" : "5. PDF Paper / Note Title")
                      : (isSi ? "5. වීඩියෝ පාඩමේ මාතෘකාව" : "5. Video Lesson Title")}
                  </span>
                  <input
                    className="app-input"
                    placeholder={
                      ni.type === "zoom"
                        ? (isSi ? "උදා: සෙනසුරාදා රාත්‍රී 7.00 සජීවී Zoom පේපර් සාකච්ඡාව" : "e.g. Saturday 7:00 PM Live Zoom Paper Discussion")
                        : ni.type === "pdf"
                        ? (isSi ? "උදා: බස්නාහිර පළාත් පේපර් 01 - සම්පූර්ණ ප්‍රශ්න පත්‍රය (PDF)" : "e.g. Western Province Paper 01 - Complete PDF")
                        : (isSi ? "උදා: බස්නාහිර පළාත් පේපර් 01 - සම්පූර්ණ වීඩියෝ විවරණය" : "e.g. Western Province Paper 01 - Video Discussion")
                    }
                    value={ni.title}
                    onChange={e => setNi({ ...ni, title: e.target.value })}
                    required
                  />
                </label>

                {ni.type === "zoom" && (
                  <label className="app-label">
                    <span>{isSi ? "පන්තිය පැවැත්වෙන දිනය සහ වේලාව (විකල්ප)" : "Live Class Date & Time (Optional)"}</span>
                    <input
                      className="app-input"
                      placeholder={isSi ? "උදා: සෙනසුරාදා ප.ව. 7.00 - 9.00" : "e.g. Saturday 7:00 PM - 9:00 PM"}
                      value={ni.schedule}
                      onChange={e => setNi({ ...ni, schedule: e.target.value })}
                    />
                  </label>
                )}

                <label className="app-label">
                  <span>
                    {ni.type === "zoom"
                      ? (isSi ? "6. Zoom Meeting Link (සබැඳිය)" : "6. Zoom Meeting URL")
                      : ni.type === "pdf"
                      ? (isSi ? "6. PDF ගොනුවේ සබැඳිය (Google Drive / Direct PDF Link)" : "6. PDF File URL")
                      : (isSi ? "6. YouTube වීඩියෝ සබැඳිය (YouTube URL)" : "6. YouTube Video URL")}
                  </span>
                  <input
                    className="app-input"
                    placeholder={
                      ni.type === "zoom"
                        ? "https://zoom.us/j/..."
                        : ni.type === "pdf"
                        ? "https://drive.google.com/... හෝ PDF URL"
                        : "https://www.youtube.com/watch?v=..."
                    }
                    value={ni.url}
                    onChange={e => {
                      const val = e.target.value;
                      const autoType = val.includes("zoom.us")
                        ? "zoom"
                        : isYoutubeUrl(val)
                        ? "video"
                        : ni.type;
                      setNi({ ...ni, url: val, type: autoType });
                    }}
                    required
                  />
                </label>

                {/* Instant Live YouTube Video Preview */}
                {ni.type !== "zoom" && getYoutubeEmbedUrl(ni.url) && (
                  <div style={{ marginTop: "10px", padding: "14px", background: "var(--surface)", border: "1px solid var(--gold)", borderRadius: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--gold)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>🎥</span>
                        <span>{isSi ? "සජීවී වීඩියෝ පෙරදසුන (Live Video Preview):" : "Live Video Preview:"}</span>
                      </span>
                      <span className="badge-tag gold" style={{ fontSize: "11px" }}>{isSi ? "වෙබ් අඩවිය තුළම වාදනය වේ" : "Plays on site"}</span>
                    </div>
                    <VideoPlayer url={ni.url} title={ni.title || "Video Preview"} />
                  </div>
                )}

                <button type="submit" className="btn gold" style={{ marginTop: "8px" }}>
                  <svg><use href="#plus" /></svg>
                  <span>
                    {ni.type === "zoom"
                      ? (isSi ? "🔴 Zoom සජීවී පන්ති සබැඳිය එක් කරන්න" : "🔴 Add Zoom Live Link")
                      : ni.type === "pdf"
                      ? (isSi ? "📄 PDF ප්‍රශ්න පත්‍රය එක් කරන්න" : "📄 Add PDF Paper")
                      : (isSi ? "🎥 වීඩියෝ පාඩම එක් කරන්න" : "🎥 Add Video Lesson")}
                  </span>
                </button>
              </form>
            </section>

            {/* Right Column: Main Zoom Link Quick Updater & Existing Items in Selected Month */}
            <section className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <h2>{isSi ? "තෝරාගත් මාසයේ පවතින පාඩම්" : "Materials in Selected Month"}</h2>
                  <p style={{ margin: "4px 0 0" }}>
                    <b>{activeContentFolder?.month}</b> — {activeContentFolder?.name}
                  </p>
                </div>
                {activeContentFolder && (
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={() => handleEditPackage(activeContentFolder)}
                  >
                    ✏️ {isSi ? "මාසයේ ප්‍රධාන Zoom Link වෙනස් කරන්න" : "Edit Month's Main Zoom Link"}
                  </button>
                )}
              </div>

              {/* Active Month's Main Zoom Banner Summary */}
              {activeContentFolder && (
                <div
                  style={{
                    margin: "12px 0 16px",
                    padding: "12px 14px",
                    background: "rgba(37, 99, 235, 0.08)",
                    border: "1px solid rgba(59, 130, 246, 0.35)",
                    borderRadius: "10px",
                    fontSize: "12.5px"
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#1d4ed8", marginBottom: "4px" }}>
                    🔴 {isSi ? "මෙම මාසයේ ප්‍රධාන Zoom සජීවී පන්ති සබැඳිය:" : "Main Zoom Live Link for this Month:"}
                  </div>
                  <div style={{ color: "var(--ink)", wordBreak: "break-all" }}>
                    <b>Link:</b> {activeContentFolder.zoomUrl || (isSi ? "ඇතුළත් කර නැත" : "Not set")}
                  </div>
                  <div style={{ color: "var(--muted)", marginTop: "2px" }}>
                    <b>{isSi ? "කාලසටහන:" : "Schedule:"}</b> {activeContentFolder.zoomSchedule || "-"}
                  </div>
                </div>
              )}

              {S.items.filter(i => i.fid === (selectedFolderForContent || S.folders[0]?.id)).length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {S.items
                    .filter(i => i.fid === (selectedFolderForContent || S.folders[0]?.id))
                    .map(i => {
                      const isZoom = i.type === "zoom";
                      const isVid = !isZoom && (i.type === "video" || Boolean(getYoutubeEmbedUrl(i.url)));
                      return (
                        <div
                          key={i.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 14px",
                            background: isZoom ? "rgba(37, 99, 235, 0.06)" : "var(--bg)",
                            border: isZoom ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid var(--line)",
                            borderRadius: "10px",
                            gap: "10px"
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px", flexWrap: "wrap" }}>
                              <span
                                className="badge-tag"
                                style={{
                                  fontSize: "11px",
                                  padding: "1px 8px",
                                  background: isZoom ? "#2563eb" : "rgba(245, 166, 35, 0.2)",
                                  color: isZoom ? "#fff" : "var(--gold-ink)",
                                  fontWeight: 700
                                }}
                              >
                                {isZoom
                                  ? "🔴 Zoom Live"
                                  : isVid
                                  ? (isSi ? "🎥 වීඩියෝ" : "🎥 Video")
                                  : (isSi ? "📄 PDF" : "📄 PDF")}
                              </span>
                              {i.week && (
                                <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--ink)" }}>
                                  [{i.week}]
                                </span>
                              )}
                              <span style={{ fontSize: "12px", color: "var(--muted)" }}>[{i.subject}]</span>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {i.title}
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {!isZoom && getYoutubeEmbedUrl(i.url) ? (
                              <button
                                type="button"
                                className="btn gold"
                                style={{ padding: "6px 12px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                                onClick={() => setPreviewVideoItem(i)}
                              >
                                <svg style={{ width: 13, height: 13 }}><use href="#video" /></svg>
                                <span>{isSi ? "නරඹන්න" : "Watch"}</span>
                              </button>
                            ) : null}
                            <a
                              href={i.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn"
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                            >
                              <svg style={{ width: 13, height: 13 }}><use href="#eye" /></svg>
                              <span>{isZoom ? "Zoom ↗" : (isSi ? "සබැඳිය" : "Link")}</span>
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
                      );
                    })}
                </div>
              ) : (
                <div style={{ padding: "26px", textAlign: "center", color: "var(--muted)" }}>
                  <p>{isSi ? "මෙම මාසයට තවම පාඩම් එක්කර නැත. වම්පස පෝරමයෙන් Zoom / Video / PDF එක් කරන්න." : "No materials in this month yet. Add Zoom / Video / PDF using the form on the left."}</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: MONTHLY PAYMENTS (RS. 2000 SLIPS APPROVAL)                    */}
        {/* ==================================================================== */}
        {tab === "payments" && (
          <section className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2>{isSi ? "රු. 2000 මාසික පන්ති ගාස්තු රිසිට්පත් පරීක්ෂාව" : "Rs. 2000 Monthly Fee Slips"}</h2>
                <p style={{ margin: "4px 0 0" }}>
                  {isSi
                    ? "දරුවන් උඩුගත කළ රු. 2000 මාසික බැංකු රිසිට්පත් අනුමත කළ සැණින් ඔවුන්ට අදාළ මාසයේ සියලුම පන්ති විවෘත වේ."
                    : "Approving a student's Rs. 2000 slip immediately unlocks all Zoom, Video, and PDF lessons for that month."}
                </p>
              </div>

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
                      <th>{isSi ? "මාසය සහ පන්තිය" : "Month & Class"}</th>
                      <th>{isSi ? "මාසික ගාස්තුව" : "Fee"}</th>
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
                            <div style={{ color: "var(--muted)", fontSize: "12px" }}>
                              {u.phone} · {isSi ? `${u.grade || 5} ශ්‍රේණිය` : `Grade ${u.grade || 5}`}
                            </div>
                          </td>
                          <td>
                            {f.month && (
                              <span className="badge-tag gold" style={{ marginRight: "6px", fontSize: "11px" }}>
                                📅 {f.month}
                              </span>
                            )}
                            <span>{f.name || (isSi ? "මාසික පන්තිය" : "Monthly Class")}</span>
                          </td>
                          <td>
                            <strong style={{ color: "var(--gold-ink)" }}>
                              {isSi ? `රු. ${f.price || 2000}` : `Rs. ${f.price || 2000}`}
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

        {/* ==================================================================== */}
        {/* TAB 5: STUDENTS DIRECTORY                                            */}
        {/* ==================================================================== */}
        {tab === "students" && (
          <section className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2>{isSi ? `ශිෂ්‍ය නාමාවලිය (${studentsList.length})` : `Students directory (${studentsList.length})`}</h2>
                <p style={{ margin: "4px 0 0" }}>
                  {isSi ? "ලියාපදිංචි දරුවන්ගේ ශ්‍රේණි, විවෘත කළ මාස සහ සම්බන්ධතා විස්තර" : "List of registered students, grades, and unlocked months"}
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
                      <th>{isSi ? "ගෙවීම් කළ මාස" : "Unlocked months"}</th>
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
                                ? (isSi ? `මාස ${unlocked.length}ක් විවෘතයි` : `${unlocked.length} months active`)
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

        {/* ==================================================================== */}
        {/* TAB 6: SETTINGS                                                      */}
        {/* ==================================================================== */}
        {tab === "settings" && (
          <section className="card" style={{ maxWidth: "700px" }}>
            <h2>{isSi ? "පන්ති සැකසුම් සහ බැංකු විස්තර" : "Class settings & bank details"}</h2>
            <p>{isSi ? "වෙබ් අඩවියේ පෙන්වන නම, දුරකථන අංක සහ රු. 2000 මාසික ගාස්තු බැංකු ගිණුම් විස්තර" : "Class name, hotline contact, and bank deposit details"}</p>

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

      {/* ==================================================================== */}
      {/* CREATE / EDIT MONTHLY CLASS MODAL                                    */}
      {/* ==================================================================== */}
      {showPackageModal && (
        <div className="app-modal-overlay" onClick={() => setShowPackageModal(false)}>
          <div className="app-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div className="app-modal-head">
              <h3>
                {editingFolderId
                  ? (isSi ? "📅 මාසික පන්තිය සංස්කරණය කරන්න" : "📅 Edit Monthly Class")
                  : (isSi ? "📅 නව මාසික පන්තියක් එක් කරන්න" : "📅 Create New Monthly Class")}
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
                  <span>{isSi ? "අදාළ මාසය (තෝරන්න හෝ ටයිප් කරන්න)" : "Month & Year"}</span>
                  <input
                    list="month-options-list"
                    className="app-input"
                    placeholder={isSi ? "උදා: 2026 දෙසැම්බර්" : "e.g. 2026 December"}
                    value={nf.month}
                    onChange={e => {
                      const mVal = e.target.value;
                      setNf(prev => ({
                        ...prev,
                        month: mVal,
                        name: !editingFolderId
                          ? `${mVal} මාසයේ පන්තිය (190+ පළාත් පේපර් සහ සජීවී පන්ති)`
                          : prev.name
                      }));
                    }}
                    required
                  />
                  <datalist id="month-options-list">
                    {MONTH_OPTIONS.map(m => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </label>
              </div>

              {/* Checkbox to Highlight as Current Active Month */}
              <div
                style={{
                  padding: "12px 14px",
                  background: nf.isCurrentMonth ? "rgba(245, 166, 35, 0.14)" : "var(--bg)",
                  border: nf.isCurrentMonth ? "1px solid var(--gold)" : "1px solid var(--line)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                <input
                  type="checkbox"
                  id="isCurrentMonthCheck"
                  checked={Boolean(nf.isCurrentMonth)}
                  onChange={e => setNf({ ...nf, isCurrentMonth: e.target.checked })}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <label htmlFor="isCurrentMonthCheck" style={{ margin: 0, cursor: "pointer", fontSize: "13.5px", color: "var(--ink)", fontWeight: 700 }}>
                  🔥 {isSi ? "මෙය මේ මාසයේ ක්‍රියාත්මක පන්තිය ලෙස Highlight කර ඉහළින්ම පෙන්වන්න" : "Highlight as Current Active Month at the top of Student Dashboard"}
                </label>
              </div>

              <label className="app-label">
                <span>{isSi ? "මාසික පන්තියේ නම" : "Monthly Class Title"}</span>
                <input
                  className="app-input"
                  placeholder={isSi ? "උදා: 2026 දෙසැම්බර් මාසයේ පන්තිය (190+ පළාත් පේපර් සහ සජීවී පන්ති)" : "e.g. December 2026 Monthly Class"}
                  value={nf.name}
                  onChange={e => setNf({ ...nf, name: e.target.value })}
                  required
                />
              </label>

              <div className="app-form-row">
                <label className="app-label">
                  <span>{isSi ? "මාසික පන්ති ගාස්තුව (රු.)" : "Monthly Fee (Rs.)"}</span>
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
                  <span>{isSi ? "පන්ති විස්තර ටැගය" : "Papers / Sessions tag"}</span>
                  <input
                    className="app-input"
                    placeholder={isSi ? "උදා: දිනකට පේපර් 2ක් + Zoom Live" : "e.g. 2 Papers Daily + Zoom Live"}
                    value={nf.papersCount}
                    onChange={e => setNf({ ...nf, papersCount: e.target.value })}
                  />
                </label>
              </div>

              <div className="app-form-row">
                <label className="app-label">
                  <span>🔴 {isSi ? "මෙම මාසයේ Zoom සජීවී පන්ති සබැඳිය (Zoom Live Link)" : "Zoom Live Class URL"}</span>
                  <input
                    className="app-input"
                    placeholder="https://zoom.us/j/..."
                    value={nf.zoomUrl}
                    onChange={e => setNf({ ...nf, zoomUrl: e.target.value })}
                  />
                </label>

                <label className="app-label">
                  <span>⏰ {isSi ? "Zoom සජීවී පන්ති කාලසටහන" : "Zoom Live Class Schedule"}</span>
                  <input
                    className="app-input"
                    placeholder={isSi ? "උදා: සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 ට" : "e.g. Every Sat & Sun at 7:00 PM"}
                    value={nf.zoomSchedule}
                    onChange={e => setNf({ ...nf, zoomSchedule: e.target.value })}
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
                  placeholder={isSi ? "මෙම මාසයේ පන්තිය පිළිබඳ කෙටි හැඳින්වීමක්..." : "Brief overview of what students receive this month..."}
                  value={nf.desc}
                  onChange={e => setNf({ ...nf, desc: e.target.value })}
                />
              </label>

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button type="submit" className="btn gold" style={{ flex: 1, justifyContent: "center" }}>
                  {editingFolderId
                    ? (isSi ? "වෙනස්කම් සුරකින්න" : "Save changes")
                    : (isSi ? "📅 මාසික පන්තිය සාදන්න" : "📅 Create Monthly Class")}
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
              <h3>{isSi ? "රු. 2000 මාසික ගාස්තු බැංකු රිසිට්පත" : "Bank deposit receipt"}</h3>
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
