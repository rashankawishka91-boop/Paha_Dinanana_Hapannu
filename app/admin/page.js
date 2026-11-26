"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp, uid, readFile, getYoutubeEmbedUrl, isYoutubeUrl, MONTH_OPTIONS } from "../../lib/Provider";
import VideoPlayer from "../../components/VideoPlayer";

const WEEKS_LIST = ["1 වන සතිය", "2 වන සතිය", "3 වන සතිය", "4 වන සතිය"];

export default function Admin() {
  const { S, update, me, login, lang, theme, ready } = useApp();
  const router = useRouter();

  const isSi = lang === "si";
  const isLight = theme === "light";

  const [tab, setTab] = useState("overview"); // overview, packages, content, payments, students, settings
  const [filterStatus, setFilterStatus] = useState("all");
  const [adminGradeFilter, setAdminGradeFilter] = useState("all");
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [selectedFolderForContent, setSelectedFolderForContent] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [viewSlip, setViewSlip] = useState(null);
  const [previewVideoItem, setPreviewVideoItem] = useState(null);

  // Students Roster, Monthly Class Filter & Attendance state
  const [selectedRosterFolderId, setSelectedRosterFolderId] = useState("all");
  const [rosterGradeFilter, setRosterGradeFilter] = useState("all");
  const [rosterPayFilter, setRosterPayFilter] = useState("paid"); // "paid", "pending", "all"
  const [attendanceWeek, setAttendanceWeek] = useState("1 වන සතිය");
  const [copiedPhones, setCopiedPhones] = useState(false);

  // Content Input Mode: "link" | "upload"
  const [inputMode, setInputMode] = useState("link");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [channelVideos, setChannelVideos] = useState([
    {
      videoId: "BbZdfLXfW9A",
      title: "ශිෂ්‍යත්ව විභාගයට වටිනා පරිසරය ප්‍රශ්න 100ක්",
      url: "https://youtu.be/BbZdfLXfW9A",
      subject: "පරිසරය"
    },
    {
      videoId: "murCwFZRlJo",
      title: "අදිති 30 - 1 කොටස සහ 30 - 2 කොටස - 190+ පේපර් පන්තිය",
      url: "https://youtu.be/murCwFZRlJo",
      subject: "විෂයයන් 5ම"
    }
  ]);

  // New / Edit Monthly Class Form State
  const [nf, setNf] = useState({
    grade: 5,
    month: "2026 දෙසැම්බර්",
    isCurrentMonth: true,
    name: "",
    category: "මාසික ප්‍රශ්න පත්‍ර පන්තිය",
    price: "2000",
    papersCount: "දිනකට පේපර් 2ක් + Zoom Live",
    subjects: "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි",
    zoomUrl: "https://zoom.us/j/94771234567",
    zoomSchedule: "සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 - 9.00 (Zoom Live)",
    desc: ""
  });

  // New Lesson Item (Zoom / Video / PDF) Form State
  const [ni, setNi] = useState({
    fid: "",
    type: "video", // "zoom" | "video" | "pdf"
    week: "1 වන සතිය",
    subject: "විෂයයන් 5ම",
    title: "",
    url: "",
    fileName: "",
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
    fetch("/api/youtube")
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data && Array.isArray(data.videos) && data.videos.length > 0) {
          setChannelVideos(data.videos);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (ready && S.set) {
      setSet({
        name: S.set.name || "පහ දිනන හපන්නු - 190+ පේපර් පන්තිය",
        slogan: S.set.slogan || "කොපි කරන්නත් බෑ.. සම කරන්නත් බෑ... ඒ තමයි පහ දිනන හපන්නු!",
        bank: S.set.bank || "",
        hotline: S.set.hotline || "0705 771 778"
      });
    }
  }, [ready, S.set]);

  useEffect(() => {
    if (S.folders.length && !selectedFolderForContent) {
      setSelectedFolderForContent(S.folders[0].id);
      setNi(prev => ({ ...prev, fid: S.folders[0].id }));
    }
    if (S.folders.length && selectedRosterFolderId === "all") {
      const cur = S.folders.find(f => f.isCurrentMonth) || S.folders[0];
      if (cur) setSelectedRosterFolderId(cur.id);
    }
  }, [S.folders, selectedFolderForContent, selectedRosterFolderId]);

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#1b0b08", color: "#fff1dc", fontFamily: "Nunito, sans-serif" }}>
        <p style={{ fontWeight: 700 }}>Loading Admin Portal...</p>
      </div>
    );
  }

  const decide = (id, s) => {
    update(d => {
      const p = d.pays.find(x => x.id === id);
      if (p) p.status = s;
    });
  };

  // Manually enroll/unlock a student into a specific monthly class
  const handleManualEnrollStudent = (studentId, folderId) => {
    if (!studentId || !folderId || folderId === "all") return;
    update(d => {
      const existing = d.pays.find(p => p.uid === studentId && p.fid === folderId);
      if (existing) {
        existing.status = existing.status === "approved" ? "pending" : "approved";
      } else {
        d.pays.push({
          id: uid(),
          uid: studentId,
          fid: folderId,
          slip: "",
          status: "approved",
          date: new Date().toLocaleDateString()
        });
      }
    });
  };

  // Toggle attendance for a student on a specific week in a monthly class
  const toggleStudentAttendance = (folderId, studentId, weekLabel) => {
    const targetFolderId = folderId === "all" ? (S.folders[0]?.id || "f1") : folderId;
    update(d => {
      if (!d.attendance) d.attendance = {};
      const key = `${targetFolderId}__${studentId}`;
      const rec = d.attendance[key] || { sessions: {}, lastJoined: "" };
      rec.sessions[weekLabel] = !rec.sessions[weekLabel];
      if (rec.sessions[weekLabel]) {
        rec.lastJoined = new Date().toLocaleDateString();
      }
      d.attendance[key] = rec;
    });
  };

  // Mark all displayed students present for the selected week
  const markAllPresentForWeek = (studentsArray, folderId, weekLabel) => {
    const targetFolderId = folderId === "all" ? (S.folders[0]?.id || "f1") : folderId;
    update(d => {
      if (!d.attendance) d.attendance = {};
      studentsArray.forEach(stu => {
        const key = `${targetFolderId}__${stu.id}`;
        const rec = d.attendance[key] || { sessions: {}, lastJoined: "" };
        rec.sessions[weekLabel] = true;
        rec.lastJoined = new Date().toLocaleDateString();
        d.attendance[key] = rec;
      });
    });
  };

  const getStudentAttendanceInfo = (folderId, studentId) => {
    const targetFolderId = folderId === "all" ? (S.folders[0]?.id || "f1") : folderId;
    const key = `${targetFolderId}__${studentId}`;
    const rec = S.attendance?.[key] || { sessions: {}, lastJoined: "" };
    const sessions = rec.sessions || {};
    const attendedCount = WEEKS_LIST.filter(w => Boolean(sessions[w])).length;
    const pct = Math.round((attendedCount / WEEKS_LIST.length) * 100);
    return { sessions, attendedCount, pct, lastJoined: rec.lastJoined };
  };

  const formatWhatsAppHref = (phone) => {
    const cleanPhone = String(phone || "").replace(/\D/g, "").replace(/^0/, "94");
    const finalPhone = cleanPhone.startsWith("94") ? cleanPhone : `94${cleanPhone}`;
    return `https://wa.me/${finalPhone}`;
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
      category: "මාසික ප්‍රශ්න පත්‍ර පන්තිය",
      price: "2000",
      papersCount: "දිනකට පේපර් 2ක් + Zoom Live",
      subjects: "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි",
      zoomUrl: "https://zoom.us/j/94771234567",
      zoomSchedule: "සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 - 9.00 (Zoom Live)",
      desc: "රු. 2000 මාසික පන්ති ගාස්තුව ගෙවූ පසු මෙම මාසයට අදාළ සියලුම සජීවී Zoom පන්ති, වීඩියෝ විවරණ සහ PDF ප්‍රශ්න පත්‍ර සම්පූර්ණයෙන්ම විවෘත වේ."
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
      category: f.category || "මාසික ප්‍රශ්න පත්‍ර පන්තිය",
      price: f.price?.toString() || "2000",
      papersCount: f.papersCount || "දිනකට පේපර් 2ක් + Zoom Live",
      subjects: f.subjects || "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි",
      zoomUrl: f.zoomUrl || "https://zoom.us/j/94771234567",
      zoomSchedule: f.zoomSchedule || "සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 ට",
      desc: f.desc || ""
    });
    setShowPackageModal(true);
  };

  const handleSavePackage = (e) => {
    e.preventDefault();
    if (!nf.name.trim()) {
      return alert("කරුණාකර මාසික පන්තියේ නම ඇතුළත් කරන්න.");
    }
    const priceNum = parseInt(nf.price) || 2000;
    const gradeNum = parseInt(nf.grade) || 5;

    update(d => {
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
          papersCount: nf.papersCount.trim() || "දිනකට පේපර් 2ක් + Zoom Live",
          subjects: nf.subjects.trim() || "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි",
          zoomUrl: nf.zoomUrl.trim(),
          zoomSchedule: nf.zoomSchedule.trim(),
          desc: nf.desc.trim()
        });
      }
    });

    setShowPackageModal(false);
    setEditingFolderId(null);
  };

  const handleDeletePackage = (f) => {
    if (confirm(`"${f.name}" මාසික පන්තිය ඉවත් කිරීමට ඔබට සහතිකද?`)) {
      update(d => {
        d.folders = d.folders.filter(x => x.id !== f.id);
        d.items = d.items.filter(i => i.fid !== f.id);
      });
    }
  };

  // Handle direct file upload for PDF / Document / Image / Video in Content Form
  const handleContentFileUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4.5 * 1024 * 1024) {
      return alert("ගොනුවේ ප්‍රමාණය 4.5MB ට අඩු විය යුතුය. විශාල වීඩියෝ සඳහා YouTube හෝ Google Drive Link භාවිතා කරන්න.");
    }
    setUploadingFile(true);
    setUploadedFileName(f.name);
    readFile(f, (dataUrl) => {
      setNi(prev => ({
        ...prev,
        url: dataUrl,
        fileName: f.name,
        title: prev.title || f.name.replace(/\.[^/.]+$/, ""),
        type: f.type.includes("video") ? "video" : "pdf"
      }));
      setUploadingFile(false);
    });
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const fid = ni.fid || selectedFolderForContent || S.folders[0]?.id;
    if (!fid || !ni.title.trim() || !ni.url.trim()) {
      return alert("කරුණාකර මාතෘකාව සහ සබැඳිය (හෝ Upload කළ ගොනුව) ඇතුළත් කරන්න.");
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
        fileName: ni.fileName || "",
        schedule: ni.schedule?.trim() || ""
      });
    });

    setNi(prev => ({
      ...prev,
      title: "",
      url: "",
      fileName: "",
      schedule: ""
    }));
    setUploadedFileName("");
    alert("නව ඉගෙනුම් අයිතමය (Zoom / Video / PDF) අදාළ මාසයට සාර්ථකව එක් කරන ලදී!");
  };

  const onLogoUpload = f => {
    if (!f) return;
    if (f.size > 1.5e6) {
      return alert("රූපයේ ප්‍රමාණය 1.5MB ට අඩු විය යුතුය.");
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
    alert("පන්ති සැකසුම් සාර්ථකව සුරකින ලදී!");
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

  const selectedRosterFolder = S.folders.find(f => f.id === selectedRosterFolderId);

  // Filter students for the Roster & Attendance tab
  const rosterStudents = studentsList.filter(stu => {
    const q = studentSearch.toLowerCase();
    const matchesSearch =
      !q ||
      stu.name?.toLowerCase().includes(q) ||
      stu.phone?.toLowerCase().includes(q) ||
      stu.id?.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    const stuGrade = Number(stu.grade) || 5;
    if (rosterGradeFilter !== "all" && stuGrade !== Number(rosterGradeFilter)) {
      return false;
    }

    if (selectedRosterFolderId !== "all" && selectedRosterFolder) {
      const payStatus =
        (S.pays.filter(p => p.uid === stu.id && p.fid === selectedRosterFolderId).pop() || {}).status || "none";
      if (rosterPayFilter === "paid") return payStatus === "approved";
      if (rosterPayFilter === "pending") return payStatus === "pending";
      // If "all", show all students in that folder's grade
      return stuGrade === Number(selectedRosterFolder.grade);
    }

    return true;
  });

  const copyAllRosterPhones = () => {
    const phones = rosterStudents.map(s => `${s.name} (${s.grade} ශ්‍රේණිය): ${s.phone}`).join("\n");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phones || "No students");
      setCopiedPhones(true);
      setTimeout(() => setCopiedPhones(false), 2500);
    }
  };

  return (
    <div className={`adm-root ${isLight ? "adm-light" : "adm-dark"}`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700&family=Nunito:wght@400;600;700;800&display=swap');

        .adm-root {
          --bg: #1b0b08;
          --card: #2a1510;
          --card2: #351a11;
          --ink: #fff1dc;
          --muted: #dcc3a8;
          --line: #6b4a1f;
          --soft: #4a2c18;
          --gold: #ffc84a;
          --gold2: #f0a020;
          --dk: #2a1208;
          --green: #4ee0a0;
          color: var(--ink);
          font-family: "Nunito", "Noto Sans Sinhala", system-ui, sans-serif;
          line-height: 1.55;
          font-size: 16px;
          min-height: 100vh;
          background: radial-gradient(1000px 500px at 60% -10%, #5a2410, rgba(90, 36, 16, 0) 60%), var(--bg);
          position: relative;
        }

        .adm-root.adm-light {
          --bg: #fbf6ee;
          --card: #ffffff;
          --card2: #f6ecdd;
          --ink: #2a1418;
          --muted: #6b5358;
          --line: #e2cfa9;
          --soft: #e8d9c4;
          --gold: #b86e00;
          --gold2: #d98200;
          --dk: #2a1208;
          --green: #0f7a4b;
          background: radial-gradient(1000px 500px at 60% -10%, rgba(245, 166, 35, 0.14), transparent 60%), var(--bg);
        }

        .adm-root::before {
          content: "";
          position: fixed;
          inset: 0;
          background-image: radial-gradient(rgba(255, 200, 74, 0.07) 1.2px, transparent 1.2px);
          background-size: 30px 30px;
          pointer-events: none;
          z-index: 0;
        }

        .adm-root .si {
          font-family: "Noto Sans Sinhala", "Nunito", sans-serif;
        }

        .adm-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 15px;
          border-radius: 99px;
          border: 1px solid var(--line);
          background: var(--card);
          font: inherit;
          font-weight: 700;
          font-size: 14px;
          color: var(--ink);
          cursor: pointer;
          text-decoration: none;
          box-shadow: none;
          transition: all 0.18s ease;
        }

        .adm-chip:hover {
          background: var(--card2);
          border-color: var(--gold);
          transform: translateY(-1px);
        }

        .adm-chip.gold {
          background: linear-gradient(135deg, #ffd45e, var(--gold2));
          color: #2a1208 !important;
          border-color: transparent;
          font-weight: 800;
        }

        .adm-chip.wa {
          background: rgba(16, 185, 129, 0.16);
          border-color: rgba(78, 224, 160, 0.45);
          color: var(--green) !important;
        }

        .adm-chip.danger {
          background: rgba(239, 68, 68, 0.14);
          border-color: rgba(239, 68, 68, 0.4);
          color: #f87171 !important;
        }

        .adm-app {
          display: grid;
          grid-template-columns: 270px minmax(0, 1fr);
          min-height: calc(100vh - 58px);
          position: relative;
          z-index: 1;
        }

        .adm-aside {
          background: ${isLight ? "#ffffff" : "rgba(36, 17, 12, 0.92)"};
          border-right: 1px solid var(--soft);
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: sticky;
          top: 58px;
          align-self: start;
          height: calc(100vh - 58px);
          overflow: auto;
        }

        .adm-me {
          display: flex;
          gap: 12px;
          align-items: center;
          background: var(--card2);
          border: 1px solid var(--soft);
          border-radius: 16px;
          padding: 12px;
          margin-bottom: 10px;
        }

        .adm-av {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffd45e, var(--gold2));
          color: #2a1208;
          display: grid;
          place-items: center;
          font-weight: 800;
          flex: none;
          font-size: 16px;
        }

        .adm-me b {
          display: block;
          line-height: 1.25;
          color: var(--ink);
        }

        .adm-me span {
          font-size: 13px;
          color: var(--muted);
        }

        .adm-lbl {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a98a6c;
          padding: 14px 12px 4px;
        }

        .adm-nav {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 15px;
          color: var(--ink);
          background: transparent;
          border: 1px solid transparent;
          width: 100%;
          text-align: left;
          cursor: pointer;
          box-shadow: none;
        }

        .adm-nav svg {
          width: 20px;
          height: 20px;
          flex: none;
          stroke: currentColor;
          fill: none;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
          opacity: 0.9;
        }

        .adm-nav:hover {
          background: var(--card2);
          border-color: var(--soft);
          transform: none;
          box-shadow: none;
        }

        .adm-nav.on {
          background: linear-gradient(135deg, #ffd45e, var(--gold2));
          color: #2a1208;
          box-shadow: 0 6px 18px rgba(240, 160, 32, 0.25);
        }

        .adm-nav em {
          margin-left: auto;
          font-style: normal;
          font-size: 13px;
          min-width: 26px;
          text-align: center;
          padding: 1px 8px;
          border-radius: 99px;
          background: #4d3510;
          color: #ffd45e;
          font-weight: 800;
        }

        .adm-nav.on em {
          background: #2a1208;
          color: #ffd45e;
        }

        .adm-live {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 12px 14px;
          font-weight: 700;
          background: var(--card);
          color: var(--ink);
          text-decoration: none;
        }

        .adm-live span {
          margin-left: auto;
          background: #12402b;
          color: #6df0ae;
          font-size: 12px;
          padding: 1px 10px;
          border-radius: 99px;
        }

        .adm-main {
          padding: 28px clamp(16px, 3vw, 40px) 110px;
          min-width: 0;
          width: 100%;
        }

        .adm-eyebrow {
          display: flex;
          gap: 8px;
          align-items: center;
          color: var(--gold);
          font-weight: 800;
        }

        .adm-crumb {
          color: var(--muted);
          font-size: 14px;
          margin-top: 10px;
        }

        .adm-head {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin: 2px 0 22px;
        }

        .adm-head h1 {
          margin: 0;
          font-size: clamp(26px, 3.6vw, 38px);
          line-height: 1.2;
          color: var(--ink);
          font-weight: 800;
        }

        .adm-grp {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .adm-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .adm-stat {
          background: linear-gradient(160deg, var(--card2), var(--card));
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 20px;
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease;
        }

        .adm-stat:hover {
          transform: translateY(-2px);
          border-color: var(--gold);
        }

        .adm-stat .t {
          display: flex;
          justify-content: space-between;
          color: var(--muted);
          font-weight: 600;
          font-size: 15px;
        }

        .adm-stat .t i {
          font-style: normal;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #4d3510;
          color: #ffd45e;
        }

        .adm-stat b {
          display: block;
          font-size: 42px;
          line-height: 1.15;
          margin: 8px 0 2px;
          color: var(--gold);
          font-weight: 800;
        }

        .adm-stat.ok b {
          color: var(--green);
        }

        .adm-stat span {
          font-size: 14px;
          color: var(--muted);
        }

        .adm-cols {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }

        /* Equal 50/50 balanced grid for Add Zoom / Video / PDF */
        .adm-cols-equal {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
          align-items: stretch;
        }

        .adm-panel {
          background: linear-gradient(160deg, var(--card2), var(--card));
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .adm-panel h2 {
          margin: 0;
          font-size: 21px;
          color: var(--ink);
          font-weight: 800;
        }

        .adm-panel > p {
          margin: 2px 0 16px;
          color: var(--muted);
          font-size: 14.5px;
        }

        .adm-act {
          display: grid;
          grid-template-columns: 48px 1fr 20px;
          gap: 14px;
          align-items: center;
          padding: 14px 16px;
          border-radius: 16px;
          background: var(--card);
          border: 1px solid var(--soft);
          margin-bottom: 10px;
          width: 100%;
          text-align: left;
          color: var(--ink);
          cursor: pointer;
          box-shadow: none;
          transition: all 0.18s ease;
        }

        .adm-act:hover {
          border-color: var(--gold);
          transform: translateX(3px);
          background: var(--card2);
        }

        .adm-act .ic {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #4d3510;
          font-size: 22px;
        }

        .adm-act b {
          display: block;
          line-height: 1.3;
          font-size: 15.5px;
          color: var(--ink);
        }

        .adm-act small {
          color: var(--muted);
          font-size: 13.5px;
          line-height: 1.4;
          display: block;
        }

        .adm-act .go {
          color: var(--gold);
          font-size: 22px;
        }

        .adm-kv {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 13px 0;
          border-bottom: 1px solid var(--soft);
        }

        .adm-kv:last-of-type {
          border: 0;
        }

        .adm-kv span {
          color: var(--muted);
        }

        .adm-kv b {
          text-align: right;
          color: var(--ink);
        }

        .adm-kv .fee {
          color: var(--gold);
        }

        .adm-hot {
          margin-top: auto;
          padding-top: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          background: #12402b;
          border: 1px solid #1f7a52;
          border-radius: 14px;
          padding: 12px 16px;
          color: #fff;
        }

        .adm-input,
        .adm-select,
        .adm-textarea {
          width: 100%;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: var(--bg);
          color: var(--ink);
          font: inherit;
          font-size: 14.5px;
          outline: none;
          margin-top: 5px;
        }

        .adm-input:focus,
        .adm-select:focus,
        .adm-textarea:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 2px rgba(255, 200, 74, 0.2);
        }

        .adm-label {
          display: block;
          font-size: 13.5px;
          font-weight: 700;
          color: var(--muted);
          margin-bottom: 12px;
        }

        .adm-row-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          padding: 15px 18px;
          border-radius: 16px;
          background: var(--card);
          border: 1px solid var(--soft);
          margin-bottom: 10px;
        }

        .adm-row-item.cur {
          border: 2px solid var(--gold);
        }

        /* Clean Structured Roster Table for Students & Attendance */
        .adm-roster-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .adm-roster-stat {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .adm-roster-stat small {
          display: block;
          font-size: 12.5px;
          color: var(--muted);
          font-weight: 700;
        }

        .adm-roster-stat b {
          font-size: 26px;
          font-weight: 800;
          color: var(--gold);
          line-height: 1.2;
        }

        .adm-roster-stat.ok b {
          color: var(--green);
        }

        .adm-table-wrap {
          width: 100%;
          overflow-x: auto;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: var(--card);
        }

        .adm-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 920px;
          text-align: left;
        }

        .adm-table th {
          background: var(--card2);
          color: var(--gold);
          font-size: 12.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 13px 16px;
          border-bottom: 1px solid var(--line);
          white-space: nowrap;
        }

        .adm-table td {
          padding: 13px 16px;
          border-bottom: 1px solid var(--soft);
          vertical-align: middle;
          font-size: 14.5px;
        }

        .adm-table tbody tr:last-child td {
          border-bottom: none;
        }

        .adm-table tbody tr:hover {
          background: rgba(255, 200, 74, 0.05);
        }

        .adm-wk-btn {
          width: 36px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid var(--soft);
          background: var(--bg);
          color: var(--muted);
          font-weight: 800;
          font-size: 12.5px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .adm-wk-btn:hover {
          border-color: var(--gold);
          transform: translateY(-1px);
        }

        .adm-wk-btn.on {
          background: rgba(16, 185, 129, 0.22);
          border-color: #10b981;
          color: var(--green);
        }

        @media (max-width: 1020px) {
          .adm-stats,
          .adm-roster-stats {
            grid-template-columns: 1fr 1fr;
          }
          .adm-cols,
          .adm-cols-equal {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 820px) {
          .adm-app {
            grid-template-columns: 1fr;
          }
          .adm-aside {
            position: static;
            height: auto;
            flex-direction: row;
            overflow-x: auto;
            padding: 10px;
            gap: 6px;
          }
          .adm-me,
          .adm-lbl,
          .adm-live {
            display: none;
          }
          .adm-nav {
            white-space: nowrap;
            width: auto;
            padding: 9px 14px;
          }
          .adm-nav em {
            margin-left: 6px;
          }
        }
      `}</style>

      <div className="adm-app">
        {/* ================================================================== */}
        {/* LEFT SIDEBAR MATCHING EXACT HTML TEMPLATE                          */}
        {/* ================================================================== */}
        <aside className="adm-aside" aria-label="Admin menu">
          <div className="adm-me">
            <div className="adm-av">ප්‍</div>
            <div>
              <b className="si">ප්‍රධාන ගුරුතුමා</b>
              <span>Administrator</span>
            </div>
          </div>

          <div className="adm-lbl">Overview</div>
          <button
            type="button"
            className={`adm-nav ${tab === "overview" ? "on" : ""}`}
            onClick={() => setTab("overview")}
          >
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>Dashboard overview</span>
          </button>

          <div className="adm-lbl">Manage</div>
          <button
            type="button"
            className={`adm-nav ${tab === "packages" ? "on" : ""}`}
            onClick={() => setTab("packages")}
          >
            <svg viewBox="0 0 24 24">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span>Monthly classes</span>
            <em>{S.folders.length}</em>
          </button>

          <button
            type="button"
            className={`adm-nav ${tab === "content" ? "on" : ""}`}
            onClick={() => setTab("content")}
          >
            <svg viewBox="0 0 24 24">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              <path d="M14 3v5h5M12 11v6M9 14h6" />
            </svg>
            <span>Add Zoom / Video / PDF</span>
          </button>

          <button
            type="button"
            className={`adm-nav ${tab === "payments" ? "on" : ""}`}
            onClick={() => setTab("payments")}
          >
            <svg viewBox="0 0 24 24">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 10h18M7 15h4" />
            </svg>
            <span>Monthly fee slips</span>
            <em>{pendingCount}</em>
          </button>

          <button
            type="button"
            className={`adm-nav ${tab === "students" ? "on" : ""}`}
            onClick={() => setTab("students")}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
            </svg>
            <span>Students &amp; Attendance</span>
            <em>{studentsList.length}</em>
          </button>

          <div className="adm-lbl">System</div>
          <button
            type="button"
            className={`adm-nav ${tab === "settings" ? "on" : ""}`}
            onClick={() => setTab("settings")}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
            </svg>
            <span>Class settings</span>
          </button>

          <Link href="/ai-tutor" className="adm-live">
            ✦ 190+ AI Tutor <span>Live</span>
          </Link>

          <button
            type="button"
            className="adm-nav"
            onClick={() => {
              login(null);
              router.replace("/login");
            }}
            style={{
              marginTop: "8px",
              color: "#f87171",
              borderColor: "rgba(248, 113, 113, 0.35)"
            }}
          >
            <span>🚪 පිටවන්න (Logout)</span>
          </button>
        </aside>

        {/* ================================================================== */}
        {/* MAIN WORKSPACE                                                     */}
        {/* ================================================================== */}
        <main className="adm-main">
          <div className="adm-eyebrow">
            👑 Admin Portal{" "}
            <span style={{ color: "var(--muted)", fontWeight: 600 }}>
              · Monthly Classes Management
            </span>
          </div>

          <div className="adm-crumb">
            Admin portal /{" "}
            {tab === "overview" && "Dashboard"}
            {tab === "packages" && "Monthly classes"}
            {tab === "content" && "Add Zoom / Video / PDF"}
            {tab === "payments" && "Monthly fee slips"}
            {tab === "students" && "Students, Class Roster & Attendance"}
            {tab === "settings" && "Class settings"}
          </div>

          <div className="adm-head">
            <h1>
              {tab === "overview" && "Dashboard overview"}
              {tab === "packages" && "Monthly classes"}
              {tab === "content" && "Add Zoom / Video / PDF"}
              {tab === "payments" && "Monthly fee slips (Rs. 2,000)"}
              {tab === "students" && "Students, Class Roster & Attendance"}
              {tab === "settings" && "Class settings"}
            </h1>

            <div className="adm-grp">
              <button
                type="button"
                className="adm-chip gold"
                onClick={handleOpenCreatePackage}
              >
                ＋ Add New Month
              </button>
              <button
                type="button"
                className="adm-chip"
                onClick={() => setTab("content")}
              >
                🎬 Add Zoom / Video / PDF
              </button>
              <button
                type="button"
                className="adm-chip"
                onClick={() => setTab("students")}
              >
                📋 Class Roster &amp; Attendance
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* TAB 1: DASHBOARD OVERVIEW (EXACT TEMPLATE LAYOUT)                */}
          {/* ================================================================ */}
          {tab === "overview" && (
            <>
              <div className="adm-stats">
                <div className="adm-stat" onClick={() => setTab("students")}>
                  <div className="t">
                    Registered students<i>👥</i>
                  </div>
                  <b>{studentsList.length}</b>
                  <span>Enrolled in total</span>
                </div>

                <div className="adm-stat" onClick={() => setTab("packages")}>
                  <div className="t">
                    Monthly classes<i>📁</i>
                  </div>
                  <b>{S.folders.length}</b>
                  <span>Active monthly classes</span>
                </div>

                <div
                  className="adm-stat"
                  onClick={() => {
                    setTab("payments");
                    setFilterStatus("pending");
                  }}
                >
                  <div className="t">
                    Pending receipts<i>⏳</i>
                  </div>
                  <b>{pendingCount}</b>
                  <span>Waiting for approval</span>
                </div>

                <div
                  className="adm-stat ok"
                  onClick={() => {
                    setTab("payments");
                    setFilterStatus("approved");
                  }}
                >
                  <div className="t">
                    Approved payments<i>✔</i>
                  </div>
                  <b>{approvedCount}</b>
                  <span>Months unlocked</span>
                </div>
              </div>

              <div className="adm-cols">
                <section className="adm-panel">
                  <h2>Quick actions</h2>
                  <p>Manage monthly classes, student rosters, and materials</p>

                  <button
                    type="button"
                    className="adm-act"
                    onClick={handleOpenCreatePackage}
                  >
                    <span className="ic">📅</span>
                    <span>
                      <b>Add a New Monthly Class</b>
                      <small>
                        Create a new month (e.g. December) for Grade 3, 4 or 5 and highlight as current month
                      </small>
                    </span>
                    <span className="go">›</span>
                  </button>

                  <button
                    type="button"
                    className="adm-act"
                    onClick={() => setTab("content")}
                  >
                    <span className="ic">🔴</span>
                    <span>
                      <b>Add Zoom Live Link, Video &amp; PDF (Link or Upload)</b>
                      <small>
                        Paste links or directly upload PDF papers &amp; notes inside any monthly class
                      </small>
                    </span>
                    <span className="go">›</span>
                  </button>

                  <button
                    type="button"
                    className="adm-act"
                    onClick={() => setTab("students")}
                  >
                    <span className="ic">📋</span>
                    <span>
                      <b>View Month-Wise Paid Students, Attendance &amp; WhatsApp</b>
                      <small>
                        See who paid for December/November, mark attendance, and send WhatsApp messages
                      </small>
                    </span>
                    <span className="go">›</span>
                  </button>

                  <button
                    type="button"
                    className="adm-act"
                    onClick={() => {
                      setTab("payments");
                      setFilterStatus("pending");
                    }}
                  >
                    <span className="ic">💳</span>
                    <span>
                      <b>Approve Rs. 2000 Monthly Fee Slips</b>
                      <small>{pendingCount} slips waiting for approval</small>
                    </span>
                    <span className="go">›</span>
                  </button>
                </section>

                <section className="adm-panel">
                  <h2>Monthly Class System Status</h2>
                  <p>Active months and monthly fee summary</p>

                  <div className="adm-kv">
                    <span>Active grades</span>
                    <b>Grades 3, 4 &amp; Grade 5 (190+)</b>
                  </div>
                  <div className="adm-kv">
                    <span>Standard monthly fee</span>
                    <b className="fee">Rs. 2000 / month</b>
                  </div>
                  <div className="adm-kv">
                    <span>Total monthly classes</span>
                    <b>{S.folders.length} months</b>
                  </div>
                  <div className="adm-kv">
                    <span>Total Zoom / Video / PDF items</span>
                    <b>{S.items.length} items</b>
                  </div>
                  <div className="adm-kv">
                    <span>WhatsApp hotline</span>
                    <b>{S.set?.hotline || "0705 771 778"}</b>
                  </div>

                  <div className="adm-hot">
                    <b>All systems running · Supabase Synced</b>
                    <span style={{ color: "var(--green)", fontWeight: 800 }}>
                      ● Online
                    </span>
                  </div>
                </section>
              </div>
            </>
          )}

          {/* ================================================================ */}
          {/* TAB 2: MONTHLY CLASSES MANAGEMENT                                */}
          {/* ================================================================ */}
          {tab === "packages" && (
            <section className="adm-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
                <div>
                  <h2>Monthly Classes ({filteredAdminFolders.length})</h2>
                  <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "14px" }}>
                    Click &ldquo;👥 Paid Students Roster&rdquo; on any month to see everyone enrolled in that month, mark attendance, and send WhatsApp messages.
                  </p>
                </div>

                <div className="adm-grp">
                  {["all", 5, 4, 3].map(g => (
                    <button
                      key={g}
                      type="button"
                      className={`adm-chip ${adminGradeFilter === g ? "gold" : ""}`}
                      onClick={() => setAdminGradeFilter(g)}
                    >
                      {g === "all" ? "All Grades (3, 4, 5)" : `Grade ${g} (${g} ශ්‍රේණිය)`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                {filteredAdminFolders.map((f, idx) => {
                  const folderItems = S.items.filter(i => i.fid === f.id);
                  const vCount = folderItems.filter(i => i.type === "video" || getYoutubeEmbedUrl(i.url)).length;
                  const pCount = folderItems.filter(i => i.type === "pdf").length;
                  const zCount = folderItems.filter(i => i.type === "zoom").length + (f.zoomUrl ? 1 : 0);
                  const paidStudentsForMonth = S.pays.filter(p => p.fid === f.id && p.status === "approved").length;

                  return (
                    <div key={f.id} className={`adm-row-item ${f.isCurrentMonth ? "cur" : ""}`}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: 1, minWidth: "280px" }}>
                        <div
                          style={{
                            width: "46px",
                            height: "46px",
                            borderRadius: "14px",
                            background: f.isCurrentMonth ? "linear-gradient(135deg, #ffd45e, var(--gold2))" : "#4d3510",
                            color: f.isCurrentMonth ? "#2a1208" : "#ffd45e",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 800,
                            fontSize: "18px",
                            flexShrink: 0
                          }}
                        >
                          {f.isCurrentMonth ? "🔥" : String(idx + 1).padStart(2, "0")}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "5px" }}>
                            <span className="adm-chip gold" style={{ padding: "2px 10px", fontSize: "12px" }}>
                              🎓 Grade {f.grade} ({f.grade} ශ්‍රේණිය)
                            </span>
                            <span className="adm-chip" style={{ padding: "2px 10px", fontSize: "12px" }}>
                              📅 {f.month}
                            </span>
                            <span className="adm-chip wa" style={{ padding: "2px 10px", fontSize: "12px" }}>
                              👥 {paidStudentsForMonth} Paid Students
                            </span>
                            {f.isCurrentMonth ? (
                              <span className="adm-chip wa" style={{ padding: "2px 10px", fontSize: "12px" }}>
                                🔥 Current Highlighted Month
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="adm-chip"
                                style={{ padding: "2px 10px", fontSize: "11.5px" }}
                                onClick={() => handleSetCurrentMonth(f)}
                              >
                                ⭐ Set as Current Month
                              </button>
                            )}
                          </div>

                          <h3 className="si" style={{ margin: "0 0 4px", fontSize: "17.5px", color: "var(--ink)" }}>
                            {f.name}
                          </h3>

                          <div style={{ fontSize: "13.5px", color: "var(--muted)" }}>
                            🔴 {zCount} Zoom · 🎥 {vCount} Videos · 📄 {pCount} PDFs · 💰 Rs. {f.price || 2000}
                          </div>
                        </div>
                      </div>

                      <div className="adm-grp" style={{ marginLeft: "auto" }}>
                        {/* 1-Click Button to view Paid Students Roster & Attendance for this specific Month */}
                        <button
                          type="button"
                          className="adm-chip wa"
                          onClick={() => {
                            setSelectedRosterFolderId(f.id);
                            setRosterGradeFilter(f.grade);
                            setRosterPayFilter("paid");
                            setTab("students");
                          }}
                        >
                          👥 Paid Students ({paidStudentsForMonth})
                        </button>

                        <button
                          type="button"
                          className="adm-chip gold"
                          onClick={() => {
                            setSelectedFolderForContent(f.id);
                            setNi(prev => ({ ...prev, fid: f.id }));
                            setTab("content");
                          }}
                        >
                          ＋ Zoom / Video / PDF
                        </button>

                        <button
                          type="button"
                          className="adm-chip"
                          onClick={() => handleEditPackage(f)}
                          title="Edit Month"
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          className="adm-chip danger"
                          onClick={() => handleDeletePackage(f)}
                          title="Delete Month"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* TAB 3: ADD ZOOM / VIDEO / PDF (BALANCED EQUAL 50/50 + UPLOAD)    */}
          {/* ================================================================ */}
          {tab === "content" && (
            <div className="adm-cols-equal">
              {/* LEFT PANEL: EASY STREAMLINED FORM WITH LINK OR DIRECT FILE UPLOAD */}
              <section className="adm-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "6px" }}>
                  <h2>1. Add Zoom / Video / PDF</h2>
                  <span className="adm-chip gold" style={{ padding: "3px 10px", fontSize: "12px" }}>
                    Link හෝ File Upload
                  </span>
                </div>
                <p>Select the month, choose Zoom / Video / PDF, and paste a link or upload a file directly from your device.</p>

                <form onSubmit={handleAddItem} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <label className="adm-label">
                    <span>Target Monthly Class (මාසික පන්තිය තෝරන්න)</span>
                    <select
                      className="adm-select si"
                      value={ni.fid || selectedFolderForContent || S.folders[0]?.id}
                      onChange={e => {
                        setNi({ ...ni, fid: e.target.value });
                        setSelectedFolderForContent(e.target.value);
                      }}
                    >
                      {S.folders.map(f => (
                        <option key={f.id} value={f.id}>
                          Grade {f.grade} | {f.month} {f.isCurrentMonth ? "🔥 (Current)" : ""} — {f.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* 3 Big Easy Content Type Selector Buttons */}
                  <div className="adm-label">
                    <span>Content Type (වර්ගය තෝරන්න)</span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "6px" }}>
                      {[
                        { id: "zoom", label: "🔴 Zoom Live", mode: "link" },
                        { id: "video", label: "🎥 Video Lesson", mode: "link" },
                        { id: "pdf", label: "📄 PDF / Note", mode: inputMode }
                      ].map(tItem => (
                        <button
                          key={tItem.id}
                          type="button"
                          className={`adm-chip ${ni.type === tItem.id ? "gold" : ""}`}
                          style={{ justifyContent: "center", padding: "10px 8px" }}
                          onClick={() => {
                            setNi({ ...ni, type: tItem.id });
                            if (tItem.id === "zoom") setInputMode("link");
                          }}
                        >
                          {tItem.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Week & Subject in a clean 2-column row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <label className="adm-label">
                      <span>Week / Session (සතිය)</span>
                      <select
                        className="adm-select si"
                        value={ni.week}
                        onChange={e => setNi({ ...ni, week: e.target.value })}
                      >
                        {WEEKS_LIST.map(w => (
                          <option key={w} value={w}>🗓️ {w}</option>
                        ))}
                        <option value="විශේෂ පන්තිය">⭐ විශේෂ පන්තිය</option>
                      </select>
                    </label>

                    <label className="adm-label">
                      <span>Subject (විෂය)</span>
                      <select
                        className="adm-select si"
                        value={ni.subject}
                        onChange={e => setNi({ ...ni, subject: e.target.value })}
                      >
                        <option value="විෂයයන් 5ම">🌟 විෂයයන් 5ම ආවරණය</option>
                        <option value="පරිසරය">🌿 පරිසරය</option>
                        <option value="මව්බස">📖 මව්බස (සිංහල)</option>
                        <option value="ගණිතය">🔢 ගණිතය</option>
                        <option value="දෙමළ">🗣️ දෙමළ</option>
                        <option value="ඉංග්‍රීසි">🔤 ඉංග්‍රීසි</option>
                      </select>
                    </label>
                  </div>

                  <label className="adm-label">
                    <span>Lesson / Paper Title (මාතෘකාව)</span>
                    <input
                      className="adm-input si"
                      placeholder={
                        ni.type === "zoom"
                          ? "උදා: සෙනසුරාදා රාත්‍රී 7.00 සජීවී Zoom පේපර් සාකච්ඡාව"
                          : ni.type === "pdf"
                          ? "උදා: දෙසැම්බර් පළමු සතිය - බස්නාහිර පළාත් පේපර් 01 (PDF)"
                          : "උදා: බස්නාහිර පළාත් පේපර් 01 - සම්පූර්ණ වීඩියෝ විවරණය"
                      }
                      value={ni.title}
                      onChange={e => setNi({ ...ni, title: e.target.value })}
                      required
                    />
                  </label>

                  {ni.type === "zoom" && (
                    <label className="adm-label">
                      <span>Zoom Live Schedule (දිනය සහ වේලාව)</span>
                      <input
                        className="adm-input si"
                        placeholder="උදා: සෙනසුරාදා සහ ඉරිදා ප.ව. 7.00 - 9.00"
                        value={ni.schedule}
                        onChange={e => setNi({ ...ni, schedule: e.target.value })}
                      />
                    </label>
                  )}

                  {/* Toggle between Paste Link vs Direct File Upload */}
                  <div className="adm-label" style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
                      <span>
                        {inputMode === "upload"
                          ? "Upload File from Computer/Phone (ගොනුවක් Upload කරන්න)"
                          : "Paste URL / Link (සබැඳිය ඇතුළත් කරන්න)"}
                      </span>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className={`adm-chip ${inputMode === "link" ? "gold" : ""}`}
                          style={{ padding: "4px 11px", fontSize: "12px" }}
                          onClick={() => setInputMode("link")}
                        >
                          🔗 Paste Link
                        </button>
                        <button
                          type="button"
                          className={`adm-chip ${inputMode === "upload" ? "gold" : ""}`}
                          style={{ padding: "4px 11px", fontSize: "12px" }}
                          onClick={() => {
                            setInputMode("upload");
                            if (ni.type === "zoom") setNi({ ...ni, type: "pdf" });
                          }}
                        >
                          📤 Upload File (PDF / Image)
                        </button>
                      </div>
                    </div>

                    {inputMode === "link" ? (
                      <>
                        <input
                          className="adm-input"
                          placeholder={
                            ni.type === "zoom"
                              ? "https://zoom.us/j/..."
                              : ni.type === "pdf"
                              ? "https://drive.google.com/... හෝ PDF Link එක"
                              : "https://youtu.be/... හෝ YouTube Video Link එක"
                          }
                          value={ni.url.startsWith("data:") ? "" : ni.url}
                          onChange={e => {
                            const val = e.target.value;
                            const autoType = val.includes("zoom.us")
                              ? "zoom"
                              : isYoutubeUrl(val)
                              ? "video"
                              : ni.type;
                            setNi({ ...ni, url: val, fileName: "", type: autoType });
                          }}
                          required={inputMode === "link"}
                        />

                        {/* Quick 1-Click Picker from Official YouTube Channel Videos */}
                        {ni.type === "video" && channelVideos.length > 0 && (
                          <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                            <small style={{ color: "var(--muted)", fontSize: "12px" }}>
                              ▶️ ඔබගේ YouTube නාලිකාවෙන් තෝරන්න:
                            </small>
                            {channelVideos.map(v => (
                              <button
                                key={v.videoId}
                                type="button"
                                className="adm-chip"
                                style={{ padding: "3px 10px", fontSize: "11.5px" }}
                                onClick={() =>
                                  setNi({
                                    ...ni,
                                    type: "video",
                                    title: v.title,
                                    url: v.url,
                                    subject: v.subject || ni.subject
                                  })
                                }
                              >
                                🎬 {v.title.slice(0, 28)}...
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div
                        style={{
                          marginTop: "6px",
                          padding: "18px",
                          borderRadius: "14px",
                          border: "2px dashed var(--gold)",
                          background: "var(--bg)",
                          textAlign: "center"
                        }}
                      >
                        <input
                          type="file"
                          accept=".pdf,image/*,video/*,.doc,.docx"
                          onChange={handleContentFileUpload}
                          style={{ maxWidth: "100%", color: "var(--ink)" }}
                        />
                        <div style={{ fontSize: "12.5px", color: "var(--muted)", marginTop: "8px" }}>
                          {uploadingFile
                            ? "⏳ ගොනුව සූදානම් වෙමින් පවතී..."
                            : uploadedFileName
                            ? `✅ තෝරාගත් ගොනුව: ${uploadedFileName}`
                            : "PDF ප්‍රශ්න පත්‍රයක්, සටහන් පින්තූරයක් හෝ ලේඛනයක් ඔබගේ පරිගණකයෙන් හෝ දුරකථනයෙන් කෙලින්ම තෝරන්න."}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: "auto", paddingTop: "10px" }}>
                    <button
                      type="submit"
                      className="adm-chip gold"
                      style={{ width: "100%", justifyContent: "center", padding: "12px 18px", fontSize: "15px" }}
                    >
                      ＋ {ni.type === "zoom"
                        ? "Add Zoom Live Link to Month"
                        : ni.type === "pdf"
                        ? "Add PDF Paper / Note to Month"
                        : "Add Video Lesson to Month"}
                    </button>
                  </div>
                </form>
              </section>

              {/* RIGHT PANEL: MATCHING EQUAL-HEIGHT MATERIALS LIST & MAIN ZOOM UPDATER */}
              <section className="adm-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "6px" }}>
                  <h2>2. Materials in Selected Month</h2>
                  {activeContentFolder && (
                    <button
                      type="button"
                      className="adm-chip"
                      style={{ padding: "4px 12px", fontSize: "12.5px" }}
                      onClick={() => handleEditPackage(activeContentFolder)}
                    >
                      ✏️ Edit Month &amp; Main Zoom Link
                    </button>
                  )}
                </div>
                <p className="si">
                  <b>{activeContentFolder?.month} (Grade {activeContentFolder?.grade})</b> — {activeContentFolder?.name}
                </p>

                {/* Active Month Main Zoom Link Summary Box */}
                {activeContentFolder && (
                  <div
                    style={{
                      padding: "13px 16px",
                      borderRadius: "14px",
                      background: "var(--bg)",
                      border: "1px solid var(--line)",
                      marginBottom: "14px",
                      fontSize: "13.5px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <strong style={{ color: "var(--gold)" }}>
                        🔴 Main Monthly Zoom Live Link:
                      </strong>
                      <span style={{ fontSize: "12px", color: "var(--green)", fontWeight: 700 }}>
                        {activeContentFolder.zoomSchedule || "Every Sat & Sun 7:00 PM"}
                      </span>
                    </div>
                    <div style={{ color: "var(--muted)", wordBreak: "break-all", marginTop: "4px", fontSize: "13px" }}>
                      {activeContentFolder.zoomUrl || "No main Zoom link set"}
                    </div>
                  </div>
                )}

                {/* Items List inside Selected Month (Scrollable so both panels stay balanced!) */}
                <div style={{ flex: 1, maxHeight: "430px", overflowY: "auto", paddingRight: "4px" }}>
                  {S.items.filter(i => i.fid === (selectedFolderForContent || S.folders[0]?.id)).length ? (
                    S.items
                      .filter(i => i.fid === (selectedFolderForContent || S.folders[0]?.id))
                      .map(i => {
                        const isZoom = i.type === "zoom";
                        const isVid = !isZoom && (i.type === "video" || Boolean(getYoutubeEmbedUrl(i.url)));
                        const isUploadedFile = i.url?.startsWith("data:");

                        return (
                          <div key={i.id} className="adm-row-item" style={{ padding: "12px 14px" }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginBottom: "4px" }}>
                                <span
                                  className={`adm-chip ${isZoom ? "danger" : isVid ? "gold" : "wa"}`}
                                  style={{ padding: "1px 9px", fontSize: "11.5px" }}
                                >
                                  {isZoom ? "🔴 Zoom Live" : isVid ? "🎥 Video" : isUploadedFile ? "📤 Uploaded File" : "📄 PDF"}
                                </span>
                                {i.week && (
                                  <span style={{ fontSize: "12px", color: "var(--gold)", fontWeight: 700 }}>
                                    [{i.week}]
                                  </span>
                                )}
                                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                                  [{i.subject}]
                                </span>
                              </div>
                              <div className="si" style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--ink)" }}>
                                {i.title}
                              </div>
                            </div>

                            <div className="adm-grp">
                              {!isZoom && getYoutubeEmbedUrl(i.url) && (
                                <button
                                  type="button"
                                  className="adm-chip gold"
                                  style={{ padding: "5px 11px", fontSize: "12px" }}
                                  onClick={() => setPreviewVideoItem(i)}
                                >
                                  ▶ Watch
                                </button>
                              )}
                              <a
                                href={i.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={i.fileName || undefined}
                                className="adm-chip"
                                style={{ padding: "5px 11px", fontSize: "12px" }}
                              >
                                {isUploadedFile ? "⬇ Download" : "Open ↗"}
                              </a>
                              <button
                                type="button"
                                className="adm-chip danger"
                                style={{ padding: "5px 10px", fontSize: "12px" }}
                                onClick={() => {
                                  if (confirm("මෙම අයිතමය ඉවත් කිරීමට අවශ්‍යද?")) {
                                    update(d => {
                                      d.items = d.items.filter(x => x.id !== i.id);
                                    });
                                  }
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div style={{ padding: "36px 20px", textAlign: "center", color: "var(--muted)", border: "1px dashed var(--line)", borderRadius: "16px" }}>
                      මෙම මාසයට තවම පාඩම් එක්කර නැත. වම්පස පෝරමයෙන් Link එකක් හෝ File එකක් Upload කරන්න.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 4: MONTHLY FEE SLIPS (RS. 2,000)                             */}
          {/* ================================================================ */}
          {tab === "payments" && (
            <section className="adm-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2>Rs. 2,000 Monthly Fee Slips</h2>
                  <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "14px" }}>
                    Approving a student&apos;s Rs. 2,000 receipt immediately unlocks that month and adds them to that month&apos;s Paid Students Roster.
                  </p>
                </div>

                <div className="adm-grp">
                  {["all", "pending", "approved", "rejected"].map(st => (
                    <button
                      key={st}
                      type="button"
                      className={`adm-chip ${filterStatus === st ? "gold" : ""}`}
                      onClick={() => setFilterStatus(st)}
                    >
                      {st === "all" && "All Slips"}
                      {st === "pending" && `Pending (${pendingCount})`}
                      {st === "approved" && `Approved (${approvedCount})`}
                      {st === "rejected" && "Rejected"}
                    </button>
                  ))}
                </div>
              </div>

              {filteredPays.length ? (
                <div>
                  {[...filteredPays].reverse().map(p => {
                    const u = S.users.find(x => x.id === p.uid) || {};
                    const f = S.folders.find(x => x.id === p.fid) || {};
                    return (
                      <div key={p.id} className="adm-row-item">
                        <div style={{ flex: 1, minWidth: "240px" }}>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "4px" }}>
                            <span className="adm-chip gold" style={{ padding: "2px 10px", fontSize: "12px" }}>
                              📅 {f.month || "Monthly Class"} · Grade {f.grade || u.grade || 5}
                            </span>
                            <span
                              className={`adm-chip ${
                                p.status === "approved" ? "wa" : p.status === "pending" ? "gold" : "danger"
                              }`}
                              style={{ padding: "2px 10px", fontSize: "12px" }}
                            >
                              {p.status === "approved" ? "✔ Approved" : p.status === "pending" ? "⏳ Pending" : "✕ Rejected"}
                            </span>
                            <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>
                              Submitted: {p.date}
                            </span>
                          </div>

                          <h4 className="si" style={{ margin: "0 0 2px", fontSize: "16.5px" }}>
                            👤 {u.name || "Student"} ({u.phone})
                          </h4>
                          <div className="si" style={{ fontSize: "13.5px", color: "var(--muted)" }}>
                            Class: {f.name} · <b style={{ color: "var(--gold)" }}>Rs. {f.price || 2000}</b>
                          </div>
                        </div>

                        <div className="adm-grp">
                          {p.slip && (
                            <button
                              type="button"
                              className="adm-chip"
                              onClick={() => setViewSlip(p.slip)}
                            >
                              👁️ View Slip
                            </button>
                          )}

                          {u.phone && (
                            <a
                              href={formatWhatsAppHref(u.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="adm-chip wa"
                            >
                              💬 WhatsApp
                            </a>
                          )}

                          {p.status !== "approved" && (
                            <button
                              type="button"
                              className="adm-chip gold"
                              onClick={() => decide(p.id, "approved")}
                            >
                              ✔ Approve &amp; Unlock
                            </button>
                          )}

                          {p.status !== "rejected" && (
                            <button
                              type="button"
                              className="adm-chip danger"
                              onClick={() => decide(p.id, "rejected")}
                            >
                              ✕ Reject
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "36px", textAlign: "center", color: "var(--muted)" }}>
                  No payment slips found in this category.
                </div>
              )}
            </section>
          )}

          {/* ================================================================ */}
          {/* TAB 5: CLEAN STUDENTS ROSTER & ATTENDANCE TABLE                  */}
          {/* ================================================================ */}
          {tab === "students" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* KPI SUMMARY STRIP FOR SELECTED CLASS */}
              <div className="adm-roster-stats">
                <div className="adm-roster-stat">
                  <div>
                    <small>තෝරාගත් පන්තියේ සිසුන්</small>
                    <b>{rosterStudents.length}</b>
                  </div>
                  <span style={{ fontSize: "24px" }}>👥</span>
                </div>

                <div className="adm-roster-stat ok">
                  <div>
                    <small>මෙම මාසයට මුදල් ගෙවූ සිසුන්</small>
                    <b>
                      {selectedRosterFolderId === "all"
                        ? approvedCount
                        : S.pays.filter(p => p.fid === selectedRosterFolderId && p.status === "approved").length}
                    </b>
                  </div>
                  <span style={{ fontSize: "24px" }}>✅</span>
                </div>

                <div className="adm-roster-stat">
                  <div>
                    <small>රිසිට්පත් පරීක්ෂාවට (Pending)</small>
                    <b>
                      {selectedRosterFolderId === "all"
                        ? pendingCount
                        : S.pays.filter(p => p.fid === selectedRosterFolderId && p.status === "pending").length}
                    </b>
                  </div>
                  <span style={{ fontSize: "24px" }}>⏳</span>
                </div>

                <div className="adm-roster-stat ok">
                  <div>
                    <small>{attendanceWeek} පැමිණි සිසුන්</small>
                    <b>
                      {
                        rosterStudents.filter(stu => {
                          const stuGrade = Number(stu.grade) || 5;
                          const targetFid =
                            selectedRosterFolderId === "all"
                              ? S.folders.find(f => Number(f.grade) === stuGrade)?.id || "f1"
                              : selectedRosterFolderId;
                          return getStudentAttendanceInfo(targetFid, stu.id).sessions[attendanceWeek];
                        }).length
                      }
                    </b>
                  </div>
                  <span style={{ fontSize: "24px" }}>📊</span>
                </div>
              </div>

              {/* MAIN UNIFIED ROSTER & ATTENDANCE PANEL */}
              <section className="adm-panel">
                {/* Header + Quick Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    paddingBottom: "16px",
                    marginBottom: "16px",
                    borderBottom: "1px solid var(--soft)"
                  }}
                >
                  <div>
                    <h2 className="si">
                      {selectedRosterFolder
                        ? `📋 ${selectedRosterFolder.month} (${selectedRosterFolder.grade} ශ්‍රේණිය) — සිසුන්ගේ නාමලේඛනය සහ පැමිණීම`
                        : "📋 සියලුම සිසුන්ගේ නාමලේඛනය සහ පැමිණීම"}
                    </h2>
                    <p style={{ margin: "3px 0 0", color: "var(--muted)", fontSize: "13.5px" }}>
                      මාසික පන්තිය තෝරා එම මාසයට මුදල් ගෙවා සම්බන්ධ වූ සිසුන් වෙනම බලාගන්න, සති 4 පැමිණීම සලකුණු කරන්න.
                    </p>
                  </div>

                  <div className="adm-grp">
                    <button
                      type="button"
                      className="adm-chip gold"
                      onClick={() => markAllPresentForWeek(rosterStudents, selectedRosterFolderId, attendanceWeek)}
                    >
                      ✓ සියලු දෙනා පැමිණි බව ලකුණු කරන්න ({attendanceWeek})
                    </button>
                    <button
                      type="button"
                      className="adm-chip wa"
                      onClick={copyAllRosterPhones}
                    >
                      {copiedPhones ? "✔ අංක Copy විය!" : "📋 දුරකථන අංක Copy කරන්න"}
                    </button>
                  </div>
                </div>

                {/* Clean 4-Column Filter Bar */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: "12px",
                    marginBottom: "16px"
                  }}
                >
                  <label className="adm-label" style={{ margin: 0 }}>
                    <span>1. මාසික පන්තිය (Monthly Class)</span>
                    <select
                      className="adm-select si"
                      value={selectedRosterFolderId}
                      onChange={e => {
                        const val = e.target.value;
                        setSelectedRosterFolderId(val);
                        const fObj = S.folders.find(x => x.id === val);
                        if (fObj) setRosterGradeFilter(fObj.grade);
                      }}
                    >
                      <option value="all">🌟 සියලුම මාසික පන්ති (All Months)</option>
                      {S.folders.map(f => {
                        const paidCnt = S.pays.filter(p => p.fid === f.id && p.status === "approved").length;
                        return (
                          <option key={f.id} value={f.id}>
                            Grade {f.grade} | {f.month} ({paidCnt} Paid)
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <label className="adm-label" style={{ margin: 0 }}>
                    <span>2. ශ්‍රේණිය (Grade)</span>
                    <select
                      className="adm-select si"
                      value={rosterGradeFilter}
                      onChange={e => setRosterGradeFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                    >
                      <option value="all">සියලුම ශ්‍රේණි (Grades 3, 4, 5)</option>
                      <option value={5}>5 ශ්‍රේණිය (Grade 5)</option>
                      <option value={4}>4 ශ්‍රේණිය (Grade 4)</option>
                      <option value={3}>3 ශ්‍රේණිය (Grade 3)</option>
                    </select>
                  </label>

                  <label className="adm-label" style={{ margin: 0 }}>
                    <span>3. ගෙවීම් තත්ත්වය (Payment Status)</span>
                    <select
                      className="adm-select si"
                      value={rosterPayFilter}
                      onChange={e => setRosterPayFilter(e.target.value)}
                    >
                      <option value="paid">✅ මුදල් ගෙවා සම්බන්ධ වූ සිසුන් (Paid Only)</option>
                      <option value="pending">⏳ රිසිට්පත් පරීක්ෂාවට (Pending)</option>
                      <option value="all">👥 ශ්‍රේණියේ සියලුම සිසුන් (All Students)</option>
                    </select>
                  </label>

                  <label className="adm-label" style={{ margin: 0 }}>
                    <span>4. සිසුවා සොයන්න (Search Name / Phone)</span>
                    <input
                      type="text"
                      className="adm-input si"
                      placeholder="නම හෝ දුරකථන අංකය..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                    />
                  </label>
                </div>

                {/* Quick Filter Pills + Active Attendance Week Selector */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "16px"
                  }}
                >
                  <div className="adm-grp">
                    {[
                      { id: "paid", label: "✅ මුදල් ගෙවූ සිසුන් (Paid)" },
                      { id: "pending", label: "⏳ Pending Slips" },
                      { id: "all", label: "👥 සියලුම සිසුන් (All)" }
                    ].map(pTab => (
                      <button
                        key={pTab.id}
                        type="button"
                        className={`adm-chip ${rosterPayFilter === pTab.id ? "gold" : ""}`}
                        style={{ padding: "5px 13px", fontSize: "13px" }}
                        onClick={() => setRosterPayFilter(pTab.id)}
                      >
                        {pTab.label}
                      </button>
                    ))}
                  </div>

                  <div className="adm-grp">
                    <span style={{ fontSize: "12.5px", color: "var(--muted)", fontWeight: 700 }}>
                      සතිය තෝරන්න:
                    </span>
                    {WEEKS_LIST.map(w => (
                      <button
                        key={w}
                        type="button"
                        className={`adm-chip ${attendanceWeek === w ? "gold" : ""}`}
                        style={{ padding: "4px 11px", fontSize: "12px" }}
                        onClick={() => setAttendanceWeek(w)}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* STRUCTURED CLEAN DATA TABLE FOR STUDENTS & ATTENDANCE */}
                {rosterStudents.length ? (
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th style={{ width: "90px" }}>ශිෂ්‍ය අංකය</th>
                          <th>සිසුවාගේ නම</th>
                          <th>ශ්‍රේණිය</th>
                          <th>දුරකථන අංකය</th>
                          <th>මාසික ගෙවීම</th>
                          <th style={{ textAlign: "center" }}>පැමිණීම (සති 1 - 4)</th>
                          <th style={{ textAlign: "center" }}>ප්‍රතිශතය</th>
                          <th style={{ textAlign: "right" }}>ක්‍රියාමාර්ග (Actions)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rosterStudents.map((stu, sIdx) => {
                          const stuGrade = Number(stu.grade) || 5;
                          const studentCode = `G${stuGrade}-${String(sIdx + 1).padStart(3, "0")}`;
                          const targetFid =
                            selectedRosterFolderId === "all"
                              ? S.folders.find(f => Number(f.grade) === stuGrade)?.id || "f1"
                              : selectedRosterFolderId;
                          const payRecord = S.pays.filter(p => p.uid === stu.id && p.fid === targetFid).pop();
                          const isPaidForSelectedMonth = payRecord?.status === "approved";
                          const isPendingForSelectedMonth = payRecord?.status === "pending";
                          const att = getStudentAttendanceInfo(targetFid, stu.id);

                          return (
                            <tr key={stu.id || sIdx}>
                              {/* 1. Student ID Badge */}
                              <td>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "4px 10px",
                                    borderRadius: "8px",
                                    fontWeight: 800,
                                    fontSize: "12.5px",
                                    background:
                                      stuGrade === 5
                                        ? "linear-gradient(135deg, #ffd45e, var(--gold2))"
                                        : stuGrade === 4
                                        ? "#1e3a8a"
                                        : "#065f46",
                                    color: stuGrade === 5 ? "#2a1208" : "#fff"
                                  }}
                                >
                                  {studentCode}
                                </span>
                              </td>

                              {/* 2. Student Name */}
                              <td>
                                <strong className="si" style={{ fontSize: "15.5px", color: "var(--ink)", display: "block" }}>
                                  {stu.name}
                                </strong>
                                {att.lastJoined && (
                                  <small style={{ fontSize: "11.5px", color: "var(--muted)" }}>
                                    අවසන් පැමිණීම: {att.lastJoined}
                                  </small>
                                )}
                              </td>

                              {/* 3. Grade */}
                              <td>
                                <span className="adm-chip" style={{ padding: "3px 10px", fontSize: "12px" }}>
                                  🎓 {stuGrade} ශ්‍රේණිය
                                </span>
                              </td>

                              {/* 4. Phone Number */}
                              <td style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "14px" }}>
                                {stu.phone}
                              </td>

                              {/* 5. Payment Status for Selected Month */}
                              <td>
                                {isPaidForSelectedMonth ? (
                                  <span className="adm-chip wa" style={{ padding: "3px 10px", fontSize: "12px" }}>
                                    ✅ ගෙවා ඇත
                                  </span>
                                ) : isPendingForSelectedMonth ? (
                                  <span className="adm-chip gold" style={{ padding: "3px 10px", fontSize: "12px" }}>
                                    ⏳ Pending
                                  </span>
                                ) : (
                                  <span className="adm-chip" style={{ padding: "3px 10px", fontSize: "12px", opacity: 0.75 }}>
                                    🔒 ගෙවා නැත
                                  </span>
                                )}
                              </td>

                              {/* 6. 4-Week Attendance Toggle Buttons (W1, W2, W3, W4) */}
                              <td style={{ textAlign: "center" }}>
                                <div style={{ display: "inline-flex", gap: "6px" }}>
                                  {WEEKS_LIST.map((w, wIdx) => {
                                    const isPresent = Boolean(att.sessions[w]);
                                    return (
                                      <button
                                        key={w}
                                        type="button"
                                        onClick={() => toggleStudentAttendance(targetFid, stu.id, w)}
                                        className={`adm-wk-btn ${isPresent ? "on" : ""}`}
                                        title={`${w} - ${isPresent ? "පැමිණ ඇත (Present)" : "පැමිණ නැත (Absent)"}`}
                                      >
                                        {isPresent ? "✓" : `W${wIdx + 1}`}
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>

                              {/* 7. Attendance Percentage */}
                              <td style={{ textAlign: "center" }}>
                                <span
                                  className={`adm-chip ${att.pct >= 75 ? "wa" : att.pct > 0 ? "gold" : ""}`}
                                  style={{ padding: "3px 10px", fontSize: "12px", minWidth: "74px", justifyContent: "center" }}
                                >
                                  {att.attendedCount}/4 ({att.pct}%)
                                </span>
                              </td>

                              {/* 8. Direct WhatsApp Chat (No pre-filled message) + Unlock/Lock */}
                              <td style={{ textAlign: "right" }}>
                                <div className="adm-grp" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                                  <a
                                    href={formatWhatsAppHref(stu.phone)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="adm-chip wa"
                                    style={{ padding: "5px 11px", fontSize: "12.5px" }}
                                    title="Open WhatsApp Chat"
                                  >
                                    💬 WhatsApp
                                  </a>

                                  {selectedRosterFolderId !== "all" && (
                                    <button
                                      type="button"
                                      className={`adm-chip ${isPaidForSelectedMonth ? "" : "gold"}`}
                                      style={{ padding: "5px 11px", fontSize: "12.5px" }}
                                      onClick={() => handleManualEnrollStudent(stu.id, selectedRosterFolderId)}
                                    >
                                      {isPaidForSelectedMonth ? "🔒 Lock" : "🔓 Unlock"}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "var(--muted)",
                      border: "1px dashed var(--line)",
                      borderRadius: "16px"
                    }}
                  >
                    <p style={{ margin: "0 0 12px", fontSize: "15px" }}>
                      තෝරාගත් මාසයට හෝ පෙරහනට (Filter) අදාළ සිසුන් තවම නොමැත.
                    </p>
                    {rosterPayFilter !== "all" && (
                      <button
                        type="button"
                        className="adm-chip gold"
                        onClick={() => setRosterPayFilter("all")}
                      >
                        👥 මෙම ශ්‍රේණියේ සියලුම සිසුන් පෙන්වන්න (Show All Students)
                      </button>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 6: SETTINGS                                                  */}
          {/* ================================================================ */}
          {tab === "settings" && (
            <section className="adm-panel" style={{ maxWidth: "720px" }}>
              <h2>Class settings &amp; bank details</h2>
              <p>Update class name, hotline contact, and Rs. 2,000 monthly fee bank account details</p>

              <form onSubmit={handleSaveSettings}>
                <label className="adm-label">
                  <span>Class Name (පන්තියේ නම)</span>
                  <input
                    className="adm-input si"
                    value={set.name}
                    onChange={e => setSet({ ...set, name: e.target.value })}
                  />
                </label>

                <label className="adm-label">
                  <span>Class Slogan (පන්ති තේමා පාඨය)</span>
                  <input
                    className="adm-input si"
                    value={set.slogan}
                    onChange={e => setSet({ ...set, slogan: e.target.value })}
                  />
                </label>

                <label className="adm-label">
                  <span>WhatsApp Hotline (ක්ෂණික දුරකථන අංකය)</span>
                  <input
                    className="adm-input"
                    value={set.hotline}
                    onChange={e => setSet({ ...set, hotline: e.target.value })}
                  />
                </label>

                <label className="adm-label">
                  <span>Bank Account Details (සිසුන්ට පෙනෙන බැංකු ගිණුම් විස්තර)</span>
                  <textarea
                    rows={5}
                    className="adm-textarea si"
                    value={set.bank}
                    onChange={e => setSet({ ...set, bank: e.target.value })}
                  />
                </label>

                <label className="adm-label">
                  <span>Class Official Logo (නිල ලාංඡනය)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="adm-input"
                    onChange={e => onLogoUpload(e.target.files[0])}
                  />
                </label>

                <button type="submit" className="adm-chip gold" style={{ padding: "11px 22px", fontSize: "15px" }}>
                  💾 Save Class Settings
                </button>
              </form>
            </section>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* CREATE / EDIT MONTHLY CLASS MODAL                                    */}
      {/* ==================================================================== */}
      {showPackageModal && (
        <div className="app-modal-overlay" onClick={() => setShowPackageModal(false)}>
          <div
            className="app-modal-card"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: "600px",
              background: "var(--card)",
              color: "var(--ink)",
              border: "2px solid var(--gold)"
            }}
          >
            <div className="app-modal-head">
              <h3>
                {editingFolderId ? "📅 Edit Monthly Class" : "📅 Add New Monthly Class"}
              </h3>
              <button
                type="button"
                className="app-modal-close"
                onClick={() => setShowPackageModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePackage}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className="adm-label">
                  <span>Grade (ශ්‍රේණිය)</span>
                  <select
                    className="adm-select si"
                    value={nf.grade}
                    onChange={e => setNf({ ...nf, grade: e.target.value })}
                  >
                    {[5, 4, 3].map(g => (
                      <option key={g} value={g}>
                        {g} ශ්‍රේණිය {g === 5 ? "🔥 (190+ විශේෂ)" : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="adm-label">
                  <span>Month &amp; Year (අදාළ මාසය)</span>
                  <input
                    list="month-options-list"
                    className="adm-input si"
                    placeholder="උදා: 2026 දෙසැම්බර්"
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

              <div
                style={{
                  padding: "12px 14px",
                  marginBottom: "12px",
                  background: nf.isCurrentMonth ? "rgba(255, 200, 74, 0.14)" : "var(--bg)",
                  border: nf.isCurrentMonth ? "1px solid var(--gold)" : "1px solid var(--line)",
                  borderRadius: "12px",
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
                <label htmlFor="isCurrentMonthCheck" style={{ margin: 0, cursor: "pointer", fontSize: "13.5px", fontWeight: 700 }}>
                  🔥 මෙය මේ මාසයේ ක්‍රියාත්මක පන්තිය ලෙස Highlight කර පෙන්වන්න
                </label>
              </div>

              <label className="adm-label">
                <span>Monthly Class Title (මාසික පන්තියේ නම)</span>
                <input
                  className="adm-input si"
                  value={nf.name}
                  onChange={e => setNf({ ...nf, name: e.target.value })}
                  required
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className="adm-label">
                  <span>Monthly Fee (මාසික ගාස්තුව රු.)</span>
                  <input
                    type="number"
                    className="adm-input"
                    value={nf.price}
                    onChange={e => setNf({ ...nf, price: e.target.value })}
                    required
                  />
                </label>

                <label className="adm-label">
                  <span>Sessions Tag</span>
                  <input
                    className="adm-input si"
                    value={nf.papersCount}
                    onChange={e => setNf({ ...nf, papersCount: e.target.value })}
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className="adm-label">
                  <span>🔴 Main Zoom Live Link</span>
                  <input
                    className="adm-input"
                    placeholder="https://zoom.us/j/..."
                    value={nf.zoomUrl}
                    onChange={e => setNf({ ...nf, zoomUrl: e.target.value })}
                  />
                </label>

                <label className="adm-label">
                  <span>⏰ Zoom Live Schedule</span>
                  <input
                    className="adm-input si"
                    value={nf.zoomSchedule}
                    onChange={e => setNf({ ...nf, zoomSchedule: e.target.value })}
                  />
                </label>
              </div>

              <label className="adm-label">
                <span>Covered Subjects (විෂයයන්)</span>
                <input
                  className="adm-input si"
                  value={nf.subjects}
                  onChange={e => setNf({ ...nf, subjects: e.target.value })}
                />
              </label>

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button
                  type="submit"
                  className="adm-chip gold"
                  style={{ flex: 1, justifyContent: "center", padding: "12px" }}
                >
                  {editingFolderId ? "Save Changes" : "📅 Create Monthly Class"}
                </button>
                <button
                  type="button"
                  className="adm-chip"
                  onClick={() => setShowPackageModal(false)}
                >
                  Cancel
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
              <h3>රු. 2000 මාසික ගාස්තු බැංකු රිසිට්පත</h3>
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
                <span className="adm-chip gold" style={{ marginBottom: "6px" }}>
                  🎥 {previewVideoItem.subject}
                </span>
                <h3 className="si" style={{ margin: 0, fontSize: "18px", color: "#fff" }}>
                  {previewVideoItem.title}
                </h3>
              </div>
              <button
                type="button"
                className="adm-chip"
                onClick={() => setPreviewVideoItem(null)}
              >
                ✕ Close
              </button>
            </div>

            <VideoPlayer url={previewVideoItem.url} title={previewVideoItem.title} />
          </div>
        </div>
      )}
    </div>
  );
}
