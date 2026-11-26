"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useApp, getYoutubeEmbedUrl } from "../lib/Provider";
import VideoPlayer from "../components/VideoPlayer";

export default function Home() {
  const { S, t, me, lang } = useApp();
  const isSi = lang === "si";

  const isStudent = Boolean(me && !me.admin);
  const studentGrade = isStudent
    ? ([5, 4, 3].includes(Number(me.grade)) ? Number(me.grade) : 5)
    : null;

  // Before login: default to "all" so all grades (3, 4, 5) are visible.
  // After login: automatically lock to the student's registered grade!
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [heroSlide, setHeroSlide] = useState(0);
  const [hoveredSide, setHoveredSide] = useState(null); // "left" | "right" | null

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % 2);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isStudent && studentGrade) {
      setSelectedGrade(studentGrade);
    } else {
      setSelectedGrade("all");
    }
  }, [isStudent, studentGrade]);

  const sampleVideo = S.items.find(
    i => (i.type === "video" || getYoutubeEmbedUrl(i.url)) && i.url
  );

  // Helper to check payment status for logged-in student
  const getFolderStatus = (fid) => {
    if (!isStudent) return "none";
    return (
      (S.pays.filter(p => p.uid === me.id && p.fid === fid).pop() || {}).status ||
      "none"
    );
  };

  // Detailed specifications for Grades 3, 4, and 5
  const GRADE_DETAILS = [
    {
      grade: 5,
      badge: isSi ? "🔥 190+ විශේෂ ශිෂ්‍යත්ව පන්තිය" : "🔥 190+ Scholarship Target Class",
      title: isSi ? "5 ශ්‍රේණිය - 190+ පළාත් පේපර් සහ සජීවී පන්තිය" : "Grade 5 - 190+ Provincial Papers & Live Class",
      subtitle: isSi
        ? "දිනකට පළාත් පේපර් 2 බැගින් සාකච්ඡා කරමින් ලකුණු 190+ ඉලක්කය කරා දරුවා මෙහෙයවන විශේෂ පන්තිය"
        : "Discussing 2 provincial papers daily to guide students past the 190+ marks milestone",
      subjects: isSi
        ? "පරිසරය (තේමා 16), මව්බස (සිංහල), ගණිතය, දෙමළ, ඉංග්‍රීසි"
        : "Environment (16 Themes), Sinhala, Mathematics, Tamil, English",
      schedule: isSi
        ? "සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 - 9.00 (Zoom Live)"
        : "Every Saturday & Sunday 7:00 PM - 9:00 PM (Zoom Live)",
      fee: 2000,
      color: "#f5a623",
      features: isSi
        ? [
            "දිනකට පළාත් ප්‍රශ්න පත්‍ර 2ක් සම්පූර්ණ විවරණය",
            "ප්‍රශ්නයකට තත්පර 45කට අඩු වේග පාලන පුහුණුව",
            "සජීවී Zoom පන්ති, පටිගත කළ වීඩියෝ සහ PDF පේපර්ස්"
          ]
        : [
            "2 Provincial papers fully discussed daily",
            "Under 45-second per question speed training",
            "Live Zoom classes, recorded videos & printable PDFs"
          ]
    },
    {
      grade: 4,
      badge: isSi ? "🌟 ශිෂ්‍යත්ව පූර්ව අඩිතාලම" : "🌟 Pre-Scholarship Foundation",
      title: isSi ? "4 ශ්‍රේණිය - ශිෂ්‍යත්ව පූර්ව සූදානම සහ පේපර් පන්තිය" : "Grade 4 - Pre-Scholarship Foundation & Paper Class",
      subtitle: isSi
        ? "5 ශ්‍රේණියේ ශිෂ්‍යත්ව විභාගයට කල්තියාම දරුවාගේ වේගය සහ විෂය දැනුම ගොඩනඟන පන්තිය"
        : "Building early exam speed and 5-subject mastery ahead of Grade 5 scholarship",
      subjects: isSi
        ? "මව්බස (සිංහල), ගණිතය, පරිසරය, දෙමළ, ඉංග්‍රීසි"
        : "Sinhala, Mathematics, Environment, Tamil, English",
      schedule: isSi
        ? "සෑම සෙනසුරාදාම ප.ව. 4.00 - 6.00 (Zoom Live)"
        : "Every Saturday 4:00 PM - 6:00 PM (Zoom Live)",
      fee: 2000,
      color: "#38bdf8",
      features: isSi
        ? [
            "ගණිත කෙටි ක්‍රම සහ තර්කන ගැටළු පුහුණුව",
            "වියරණ, රචනා සහ පරිසරය මූලික පදනම",
            "මාසික ආදර්ශ ප්‍රශ්න පත්‍ර PDF සහ වීඩියෝ සාකච්ඡා"
          ]
        : [
            "Math shortcuts and logical problem solving",
            "Grammar, essay writing & environmental studies foundation",
            "Monthly model paper PDFs and video discussions"
          ]
    },
    {
      grade: 3,
      badge: isSi ? "🌱 මූලික පදනම සහ පේපර් පුහුණුව" : "🌱 Primary Foundation & Practice",
      title: isSi ? "3 ශ්‍රේණිය - මූලික විෂය පදනම සහ පේපර් හුරුව" : "Grade 3 - Core Curriculum Foundation & Paper Practice",
      subtitle: isSi
        ? "කුඩා කල සිටම ප්‍රශ්න පත්‍රවලට බිය නැතිව නිවැරදිව පිළිතුරු ලිවීමට හුරු කරවන පන්තිය"
        : "Training young learners to read, understand, and answer exam papers confidently",
      subjects: isSi
        ? "මව්බස (සිංහල), ගණිතය, පරිසරය, ඉංග්‍රීසි"
        : "Sinhala, Mathematics, Environment, English",
      schedule: isSi
        ? "සෑම ඉරිදාම ප.ව. 3.00 - 5.00 (Zoom Live)"
        : "Every Sunday 3:00 PM - 5:00 PM (Zoom Live)",
      fee: 2000,
      color: "#34d399",
      features: isSi
        ? [
            "මනෝමය ගණිතය සහ මූලික ගණිත ක්‍රමවේද",
            "නිවැරදි අක්ෂර වින්‍යාසය සහ වාක්‍ය ගොඩනැගීම",
            "සතිපතා වර්ණවත් PDF වැඩ පත්‍රිකා සහ සජීවී පන්ති"
          ]
        : [
            "Mental math and core arithmetic concepts",
            "Accurate spelling and sentence construction",
            "Weekly printable PDF worksheets and live classes"
          ]
    }
  ];

  // Activegrade detail object if student is logged in
  const myGradeDetail = isStudent
    ? GRADE_DETAILS.find(g => g.grade === studentGrade) || GRADE_DETAILS[0]
    : null;

  // All folders for valid grades (3, 4, 5)
  const validFolders = S.folders.filter(f => [5, 4, 3].includes(Number(f.grade)));

  // Active (Approved) and Pending classes for the logged-in student
  const myActiveClasses = isStudent
    ? validFolders.filter(f => getFolderStatus(f.id) === "approved")
    : [];
  const myPendingClasses = isStudent
    ? validFolders.filter(f => getFolderStatus(f.id) === "pending")
    : [];

  // Filtered monthly classes for the Explorer section:
  // - If student is logged in: strictly their grade's monthly classes (current month first)
  // - If guest (not logged in): either "all" (all grades 5, 4, 3) or whichever grade chip they clicked
  const filteredFolders = validFolders
    .filter(f => {
      if (isStudent) return Number(f.grade) === Number(studentGrade);
      if (selectedGrade === "all") return true;
      return Number(f.grade) === Number(selectedGrade);
    })
    .sort((a, b) => {
      if (b.grade !== a.grade) return b.grade - a.grade;
      return (b.isCurrentMonth ? 1 : 0) - (a.isCurrentMonth ? 1 : 0);
    });

  const subjectsList = [
    {
      id: "env",
      icon: "🌿",
      titleKey: "sub1Title",
      descKey: "sub1Desc",
      badge: isSi ? "රූපසටහන් & ප්‍රායෝගික දැනුම" : "Diagrams & Concepts"
    },
    {
      id: "sin",
      icon: "📖",
      titleKey: "sub2Title",
      descKey: "sub2Desc",
      badge: isSi ? "වියරණ & විභාග උපක්‍රම" : "Grammar & Techniques"
    },
    {
      id: "math",
      icon: "🔢",
      titleKey: "sub3Title",
      descKey: "sub3Desc",
      badge: isSi ? "කෙටි ක්‍රම & වේගය" : "Shortcuts & Speed"
    },
    {
      id: "tam",
      icon: "🗣️",
      titleKey: "sub4Title",
      descKey: "sub4Desc",
      badge: isSi ? "නියත ලකුණු රහස්" : "Guaranteed Marks"
    },
    {
      id: "eng",
      icon: "🔤",
      titleKey: "sub5Title",
      descKey: "sub5Desc",
      badge: isSi ? "වචන මාලාව & පින්තූර" : "Vocabulary & Pictures"
    }
  ];

  const highlights = [
    { icon: "⚡", titleKey: "h1Title", descKey: "h1Desc" },
    { icon: "📑", titleKey: "h2Title", descKey: "h2Desc" },
    { icon: "🔍", titleKey: "h3Title", descKey: "h3Desc" },
    { icon: "🏆", titleKey: "h4Title", descKey: "h4Desc" }
  ];

  return (
    <main className="wrap">
      {/* ==================================================================== */}
      {/* HERO SECTION WITH SEPARATE LEFT & RIGHT BORDERED CHARACTER FRAMES    */}
      {/* ==================================================================== */}
      <style jsx>{`
        .hero-split-stage {
          display: grid;
          grid-template-columns: 265px minmax(0, 1fr) 265px;
          align-items: center;
          gap: 24px;
          margin: 12px -60px 24px;
        }

        .hero-char-card {
          position: relative;
          border-radius: 26px;
          padding: 8px;
          background: linear-gradient(145deg, rgba(245, 166, 35, 0.25), rgba(35, 10, 18, 0.92));
          border: 2.5px solid rgba(245, 166, 35, 0.5);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55), 0 0 22px rgba(245, 166, 35, 0.16);
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .hero-char-card.left-card {
          transform: perspective(900px) rotateY(8deg) rotateZ(-1.5deg);
        }

        .hero-char-card.right-card {
          transform: perspective(900px) rotateY(-8deg) rotateZ(1.5deg);
        }

        /* Auto-pulse highlight when not hovered */
        .hero-char-card.auto-active {
          border-color: #ffc65a;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.65), 0 0 32px rgba(245, 166, 35, 0.45);
        }

        /* Intense Highlight when mouse hovers over the character frame */
        .hero-char-card:hover,
        .hero-char-card.hovered {
          transform: perspective(900px) rotateY(0deg) rotateZ(0deg) translateY(-10px) scale(1.06) !important;
          border-color: #ffd97d !important;
          background: linear-gradient(145deg, rgba(255, 200, 75, 0.55), rgba(65, 16, 30, 0.96)) !important;
          box-shadow:
            0 24px 50px rgba(0, 0, 0, 0.75),
            0 0 0 4px rgba(245, 166, 35, 0.32),
            0 0 48px 10px rgba(245, 166, 35, 0.75) !important;
          z-index: 10;
        }

        .hero-char-img-wrap {
          position: relative;
          border-radius: 19px;
          overflow: hidden;
          aspect-ratio: 3 / 3.7;
          background: #18070c;
        }

        .hero-char-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease, filter 0.4s ease;
          filter: brightness(0.95) contrast(1.04);
        }

        .hero-char-card:hover .hero-char-img-wrap img {
          transform: scale(1.08);
          filter: brightness(1.12) contrast(1.08);
        }

        .hero-char-overlay {
          position: absolute;
          inset: auto 0 0 0;
          padding: 36px 14px 14px;
          background: linear-gradient(180deg, transparent 0%, rgba(16, 4, 9, 0.88) 45%, rgba(16, 4, 9, 0.98) 100%);
          text-align: center;
          transition: all 0.35s ease;
        }

        .hero-char-badge {
          display: inline-block;
          background: rgba(245, 166, 35, 0.22);
          border: 1px solid rgba(245, 166, 35, 0.65);
          color: #ffd875;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 999px;
          margin-bottom: 5px;
          transition: all 0.3s ease;
        }

        .hero-char-card:hover .hero-char-badge {
          background: var(--gold);
          color: #1c0800;
          box-shadow: 0 0 16px rgba(245, 166, 35, 0.8);
        }

        .hero-char-title {
          display: block;
          color: #fff;
          font-size: 0.92rem;
          font-weight: 800;
          line-height: 1.3;
          margin-bottom: 3px;
        }

        .hero-char-sub {
          display: block;
          color: #cbd5e1;
          font-size: 0.75rem;
          line-height: 1.35;
        }

        @media (max-width: 1180px) {
          .hero-split-stage {
            margin: 12px 0 24px;
            grid-template-columns: 220px minmax(0, 1fr) 220px;
            gap: 16px;
          }
        }

        @media (max-width: 920px) {
          .hero-split-stage {
            grid-template-columns: 1fr 1fr;
          }
          .hero-center-col {
            grid-column: 1 / -1;
            order: -1;
          }
          .hero-char-card.left-card,
          .hero-char-card.right-card {
            transform: none;
            max-width: 340px;
            margin: 0 auto;
            width: 100%;
          }
        }

        @media (max-width: 560px) {
          .hero-split-stage {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section className="hero" style={{ padding: "24px 0 30px" }}>
        <div className="hero-split-stage">
          {/* LEFT BORDERED CHARACTER / CLASSROOM CARD */}
          <div
            className={`hero-char-card left-card ${
              hoveredSide === "left" ? "hovered" : hoveredSide === null && heroSlide === 0 ? "auto-active" : ""
            }`}
            onMouseEnter={() => setHoveredSide("left")}
            onMouseLeave={() => setHoveredSide(null)}
          >
            <div className="hero-char-img-wrap">
              <img
                src="/hero-bg-1.jpg"
                alt="Smart Board Live Speed Teaching"
                style={{ objectPosition: "62% center" }}
              />
              <div className="hero-char-overlay">
                <span className="hero-char-badge">
                  ⚡ {isSi ? "වේග පාලන පුහුණුව" : "Speed Training"}
                </span>
                <b className="hero-char-title">
                  {isSi ? "Smart Board සජීවී පන්තිය" : "Smart Board Live Class"}
                </b>
                <span className="hero-char-sub">
                  {isSi
                    ? "අඩු කාලයකදී නිවැරදි පිළිතුරු ලිවීමේ කෙටි ක්‍රම"
                    : "Fast & accurate paper-solving techniques"}
                </span>
              </div>
            </div>
          </div>

          {/* CENTER HERO CONTENT */}
          <div className="hero-center-col" style={{ textAlign: "center" }}>
            <div className="hero-pill-badge">
              {isStudent
                ? isSi
                  ? `🎓 ${studentGrade} ශ්‍රේණියේ නිල ශිෂ්‍ය ද්වාරය · ${myGradeDetail?.badge}`
                  : `🎓 Grade ${studentGrade} Student Portal · ${myGradeDetail?.badge}`
                : t("badgeTarget")}
            </div>

            {/* Centered Logo with Glowing Ring */}
            <div className="logo-wrap" style={{ display: "block", margin: "0 auto 18px" }}>
              <img
                className="logo"
                src={S.set.logo || "/logo.jpg"}
                alt={S.set.name}
                style={{ width: "145px", height: "145px" }}
              />
            </div>

            {isStudent ? (
              <>
                <h1>
                  {isSi ? `ආයුබෝවන්, ${me.name}! 👋` : `Welcome back, ${me.name}! 👋`}
                  <br />
                  <span style={{ color: "var(--gold)", fontSize: "0.78em" }}>
                    {myGradeDetail?.title}
                  </span>
                </h1>

                <div className="slogan-banner">
                  ✨ {myGradeDetail?.subtitle}
                </div>

                <p className="lead">
                  {isSi
                    ? `ඔබ ලියාපදිංචි වී සිටින්නේ ${studentGrade} ශ්‍රේණිය සඳහාය. ඔබගේ ශ්‍රේණියට අදාළ සක්‍රිය කළ මාසික පන්ති, සජීවී Zoom සබැඳි, වීඩියෝ සාකච්ඡා සහ PDF ප්‍රශ්න පත්‍ර පහතින් කෙලින්ම විවෘත කරගත හැක.`
                    : `You are enrolled in Grade ${studentGrade}. Access your activated monthly classes, live Zoom links, video discussions, and PDF papers directly below.`}
                </p>
              </>
            ) : (
              <>
                <h1>
                  {t("brand")} <br />
                  <span style={{ color: "var(--gold)" }}>{t("brandSub")}</span>
                </h1>

                <div className="slogan-banner">
                  ✨ {t("slogan")}
                </div>

                <p className="lead">
                  {t("heroDesc")}
                </p>
              </>
            )}

            <div className="cta-row" style={{ marginBottom: "10px" }}>
              {me ? (
                <>
                  <Link className="btn" href={me.admin ? "/admin" : "/dashboard"}>
                    🚀 {isSi
                      ? me.admin
                        ? "ගුරු පාලක පුවරුවට පිවිසෙන්න"
                        : `${studentGrade} ශ්‍රේණියේ ශිෂ්‍ය පුවරුවට පිවිසෙන්න`
                      : me.admin
                      ? "Open Admin Portal"
                      : `Open Grade ${studentGrade} Dashboard`}
                  </Link>
                  <a className="btn ghost" href="#papers">
                    📅 {isSi ? `${studentGrade} ශ්‍රේණියේ මාසික පන්ති බලන්න ↓` : `View Grade ${studentGrade} Classes ↓`}
                  </a>
                </>
              ) : (
                <>
                  <Link className="btn" href="/login?mode=reg">
                    🎯 {t("startNow")}
                  </Link>
                  <Link className="btn ghost" href="/login">
                    🔑 {t("login")}
                  </Link>
                </>
              )}
              <a
                className="btn whatsapp-btn"
                href={`https://wa.me/${(S.set?.hotline || "94771234567").replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                💬 {isSi ? "WhatsApp විමසීම්" : "WhatsApp Support"}
              </a>
            </div>
          </div>

          {/* RIGHT BORDERED CHARACTER / STUDENTS CARD */}
          <div
            className={`hero-char-card right-card ${
              hoveredSide === "right" ? "hovered" : hoveredSide === null && heroSlide === 1 ? "auto-active" : ""
            }`}
            onMouseEnter={() => setHoveredSide("right")}
            onMouseLeave={() => setHoveredSide(null)}
          >
            <div className="hero-char-img-wrap">
              <img
                src="/hero-bg-2.jpg"
                alt="190+ Scholarship Teacher and Students"
                style={{ objectPosition: "center center" }}
              />
              <div className="hero-char-overlay">
                <span className="hero-char-badge">
                  🏆 {isSi ? "190+ ජයග්‍රාහී දරුවන්" : "190+ Top Achievers"}
                </span>
                <b className="hero-char-title">
                  {isSi ? "දරුවන්ගේ ආදරණීය පන්තිය" : "Beloved Scholarship Class"}
                </b>
                <span className="hero-char-sub">
                  {isSi
                    ? "දිනකට පළාත් පේපර් 2ක් සහ සියලු විෂයන් ආවරණය"
                    : "2 Provincial papers daily covering all 5 subjects"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* LOGGED-IN STUDENT SECTION: MY ACTIVE / UNLOCKED CLASSES & GRADE INFO */}
      {/* ==================================================================== */}
      {isStudent && myGradeDetail && (
        <section style={{ margin: "44px 0" }}>
          <div
            className="card"
            style={{
              background: "linear-gradient(135deg, rgba(45, 16, 24, 0.96), rgba(22, 8, 13, 0.98))",
              border: "2px solid var(--gold)",
              borderRadius: "24px",
              padding: "32px 28px",
              boxShadow: "0 18px 45px rgba(0, 0, 0, 0.45)"
            }}
          >
            {/* Student's Grade Summary Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "18px", paddingBottom: "22px", borderBottom: "1px solid rgba(245, 166, 35, 0.25)" }}>
              <div style={{ flex: 1, minWidth: "280px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
                  <span className="badge-tag gold" style={{ fontWeight: 800, fontSize: "12.5px", padding: "4px 12px" }}>
                    🎓 {isSi ? `ඔබගේ ශ්‍රේණිය: ${studentGrade} ශ්‍රේණිය` : `Your Grade: Grade ${studentGrade}`}
                  </span>
                  <span className="tag" style={{ background: "rgba(34, 197, 94, 0.2)", color: "#4ade80", fontWeight: 700, fontSize: "12px" }}>
                    ✓ {isSi ? `සක්‍රිය මාස ${myActiveClasses.length}ක් විවෘතයි` : `${myActiveClasses.length} Active Months Unlocked`}
                  </span>
                  {myPendingClasses.length > 0 && (
                    <span className="tag" style={{ background: "rgba(245, 166, 35, 0.2)", color: "#fbbf24", fontWeight: 700, fontSize: "12px" }}>
                      ⏳ {isSi ? `රිසිට්පත් ${myPendingClasses.length}ක් පරීක්ෂා වෙමින්` : `${myPendingClasses.length} Pending Approval`}
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: "1.65rem", color: "#fff", margin: "0 0 6px" }}>
                  {myGradeDetail.title}
                </h2>
                <p style={{ margin: "0 0 10px", color: "#cbd5e1", fontSize: "0.95rem" }}>
                  🎯 <b>{isSi ? "ආවරණය වන විෂයයන්:" : "Subjects Covered:"}</b> {myGradeDetail.subjects}
                </p>
                <p style={{ margin: 0, color: "var(--gold)", fontSize: "0.9rem", fontWeight: 600 }}>
                  ⏰ <b>{isSi ? "සජීවී පන්ති කාලසටහන:" : "Live Class Schedule:"}</b> {myGradeDetail.schedule}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "210px" }}>
                <Link
                  href="/dashboard"
                  className="btn"
                  style={{ justifyContent: "center", padding: "12px 20px", fontSize: "0.92rem" }}
                >
                  🚪 {isSi ? "ශිෂ්‍ය පුවරුවට යන්න →" : "Go to Dashboard →"}
                </Link>
              </div>
            </div>

            {/* Student's Active (Unlocked) Monthly Classes List */}
            <div style={{ marginTop: "24px" }}>
              <h3 style={{ fontSize: "1.25rem", color: "#fff", margin: "0 0 6px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🟢</span>
                <span>
                  {isSi
                    ? `ඔබ සක්‍රිය (Active) කරගත් මාසික පන්ති (${myActiveClasses.length})`
                    : `Your Activated Monthly Classes (${myActiveClasses.length})`}
                </span>
              </h3>
              <p className="mut" style={{ fontSize: "0.88rem", margin: "0 0 16px" }}>
                {isSi
                  ? "ඔබ රු. 2,000 ගාස්තුව ගෙවා සක්‍රිය කරගත් මාසික පන්තිවලට මෙතැනින් කෙලින්ම ඇතුල් විය හැක."
                  : "Directly enter the monthly classes you have paid for and activated."}
              </p>

              {myActiveClasses.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {myActiveClasses.map(f => {
                    const mItems = S.items.filter(i => i.fid === f.id);
                    const zCount = mItems.filter(i => i.type === "zoom").length + (f.zoomUrl ? 1 : 0);
                    const vCount = mItems.filter(i => i.type === "video" || getYoutubeEmbedUrl(i.url)).length;
                    const pCount = mItems.filter(i => i.type === "pdf").length;

                    return (
                      <div
                        key={f.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "16px",
                          padding: "18px 22px",
                          borderRadius: "16px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: f.isCurrentMonth
                            ? "2px solid var(--gold)"
                            : "1px solid rgba(74, 222, 128, 0.35)"
                        }}
                      >
                        <div style={{ flex: 1, minWidth: "260px" }}>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "6px" }}>
                            <span className="badge-tag gold" style={{ fontWeight: 800 }}>
                              📅 {f.month}
                            </span>
                            <span className="tag" style={{ background: "rgba(34, 197, 94, 0.22)", color: "#4ade80", fontWeight: 700, fontSize: "12px" }}>
                              ✅ {isSi ? "සක්‍රිය කර ඇත (Active)" : "Active & Unlocked"}
                            </span>
                            {f.isCurrentMonth && (
                              <span className="tag" style={{ background: "rgba(245, 166, 35, 0.22)", color: "var(--gold)", fontWeight: 700, fontSize: "12px" }}>
                                🔥 {isSi ? "මේ මාසයේ පන්තිය" : "Current Month"}
                              </span>
                            )}
                          </div>

                          <h4 style={{ fontSize: "1.12rem", color: "#fff", margin: "0 0 6px" }}>
                            {f.name}
                          </h4>

                          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "0.84rem", color: "#cbd5e1" }}>
                            <span style={{ color: "#60a5fa", fontWeight: 700 }}>
                              🔴 {zCount || 2} Zoom Live
                            </span>
                            <span>•</span>
                            <span>🎥 {vCount || 2} {isSi ? "වීඩියෝ" : "Videos"}</span>
                            <span>•</span>
                            <span>📄 {pCount || 2} {isSi ? "PDF පේපර්" : "PDFs"}</span>
                            <span>•</span>
                            <span>🎯 {f.subjects}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {f.zoomUrl && (
                            <a
                              href={f.zoomUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn ghost"
                              style={{
                                borderColor: "#3b82f6",
                                color: "#93c5fd",
                                fontSize: "0.84rem",
                                padding: "9px 15px"
                              }}
                            >
                              🔴 {isSi ? "Zoom Live සම්බන්ධ වන්න ↗" : "Join Zoom Live ↗"}
                            </a>
                          )}
                          <Link
                            href={`/dashboard?open=${f.id}`}
                            className="btn"
                            style={{ fontSize: "0.86rem", padding: "9px 18px" }}
                          >
                            🚪 {isSi ? "පන්තිය ඇතුළට යන්න →" : "Enter Class →"}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: "22px",
                    borderRadius: "16px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px dashed rgba(245, 166, 35, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px"
                  }}
                >
                  <div>
                    <h4 style={{ color: "#fff", margin: "0 0 4px", fontSize: "1.05rem" }}>
                      {isSi
                        ? `ඔබ තවම ${studentGrade} ශ්‍රේණියේ මාසික පන්තියක් සක්‍රිය කරගෙන නොමැත`
                        : `You haven't activated a Grade ${studentGrade} monthly class yet`}
                    </h4>
                    <p className="mut" style={{ margin: 0, fontSize: "0.86rem" }}>
                      {isSi
                        ? "රු. 2,000 මාසික පන්ති ගාස්තුව ගෙවා මේ මාසයේ සජීවී Zoom පන්ති, වීඩියෝ සහ PDF පේපර්ස් දැන්ම විවෘත කරගන්න."
                        : "Pay the Rs. 2,000 monthly fee to unlock this month's live Zoom classes, videos, and PDF papers."}
                    </p>
                  </div>
                  <Link href="/dashboard" className="btn" style={{ fontSize: "0.86rem", padding: "10px 18px" }}>
                    💳 {isSi ? "දැන්ම පන්තිය සක්‍රිය කරගන්න →" : "Activate Class Now →"}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* GUEST VIEW (BEFORE LOGIN): COMPLETE GRADE 3, 4 & 5 DETAILS SHOWCASE  */}
      {/* ==================================================================== */}
      {!isStudent && (
        <section style={{ margin: "50px 0" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <span className="badge-tag gold" style={{ marginBottom: "8px", display: "inline-block" }}>
              🎓 {isSi ? "3, 4 සහ 5 ශ්‍රේණි සඳහා විශේෂිත මාසික පන්ති" : "Dedicated Monthly Classes for Grades 3, 4 & 5"}
            </span>
            <h2 style={{ fontSize: "2rem", margin: "6px 0 8px" }}>
              {isSi ? "ශ්‍රේණි අනුව පන්ති විස්තර සහ කාලසටහන්" : "Complete Grade Details & Class Schedules"}
            </h2>
            <p className="mut" style={{ maxWidth: "700px", margin: "0 auto" }}>
              {isSi
                ? "ලියාපදිංචි වීමට පෙර 3, 4 සහ 5 ශ්‍රේණිවල පැවැත්වෙන පන්ති, ආවරණය වන විෂයයන් සහ Zoom සජීවී කාලසටහන් පරීක්ෂා කරන්න."
                : "Explore the curriculum, subjects, and live Zoom schedules for Grades 3, 4, and 5 before registering."}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
              gap: "22px"
            }}
          >
            {GRADE_DETAILS.map(g => {
              const gFolders = validFolders.filter(f => Number(f.grade) === g.grade);
              const curFolder = gFolders.find(f => f.isCurrentMonth) || gFolders[0];

              return (
                <div
                  key={g.grade}
                  className="card"
                  style={{
                    border: g.grade === 5 ? "2px solid var(--gold)" : "1px solid var(--line)",
                    borderRadius: "20px",
                    padding: "26px 24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background:
                      g.grade === 5
                        ? "linear-gradient(180deg, rgba(245, 166, 35, 0.12), rgba(24, 10, 15, 0.95))"
                        : "var(--glass)"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                      <span
                        className="badge-tag gold"
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 800,
                          padding: "4px 12px"
                        }}
                      >
                        🎓 {isSi ? `${g.grade} ශ්‍රේණිය` : `Grade ${g.grade}`}
                      </span>
                      <span
                        className="tag"
                        style={{
                          fontSize: "0.75rem",
                          background: "rgba(255, 255, 255, 0.08)",
                          color: g.color,
                          fontWeight: 700
                        }}
                      >
                        {g.badge}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.28rem", color: "#fff", margin: "0 0 8px", lineHeight: 1.35 }}>
                      {g.title}
                    </h3>
                    <p className="mut" style={{ fontSize: "0.86rem", margin: "0 0 14px", lineHeight: 1.5 }}>
                      {g.subtitle}
                    </p>

                    <div
                      style={{
                        background: "rgba(0, 0, 0, 0.25)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        marginBottom: "14px",
                        fontSize: "0.83rem"
                      }}
                    >
                      <div style={{ marginBottom: "6px", color: "#e2e8f0" }}>
                        🎯 <b>{isSi ? "විෂයයන්:" : "Subjects:"}</b> {g.subjects}
                      </div>
                      <div style={{ marginBottom: "6px", color: "var(--gold)" }}>
                        ⏰ <b>{isSi ? "Zoom කාලසටහන:" : "Zoom Schedule:"}</b> {g.schedule}
                      </div>
                      {curFolder && (
                        <div style={{ color: "#4ade80", fontWeight: 600 }}>
                          🔥 <b>{isSi ? "මේ මාසයේ පන්තිය:" : "Current Month:"}</b> {curFolder.month}
                        </div>
                      )}
                    </div>

                    <ul style={{ margin: "0 0 18px", paddingLeft: "18px", fontSize: "0.84rem", color: "#cbd5e1", lineHeight: 1.7 }}>
                      {g.features.map((feat, idx) => (
                        <li key={idx}>{feat}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                    <div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--gold)" }}>
                        {isSi ? `රු. ${g.fee}` : `Rs. ${g.fee}`}
                      </div>
                      <small className="mut" style={{ fontSize: "0.75rem" }}>
                        {isSi ? "මාසික පන්ති ගාස්තුව" : "Monthly Class Fee"}
                      </small>
                    </div>

                    <Link
                      href="/login?mode=reg"
                      className="btn"
                      style={{ fontSize: "0.84rem", padding: "9px 16px" }}
                    >
                      {isSi ? `${g.grade} ශ්‍රේණියට එක්වන්න →` : `Join Grade ${g.grade} →`}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* AVAILABLE MONTHLY CLASSES LIST (ADAPTS TO LOGGED-IN STUDENT'S GRADE) */}
      {/* ==================================================================== */}
      <section id="papers" style={{ margin: "50px 0" }}>
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <h2 style={{ fontSize: "2rem", margin: "0 0 6px" }}>
            {isStudent
              ? isSi
                ? `📅 ${studentGrade} ශ්‍රේණියේ මාසික පන්ති ලැයිස්තුව`
                : `📅 Grade ${studentGrade} Monthly Classes List`
              : isSi
              ? "📅 3, 4 සහ 5 ශ්‍රේණිවල මාසික පන්ති ලැයිස්තුව"
              : "📅 Monthly Classes for Grades 3, 4 & 5"}
          </h2>
          <p className="mut">
            {isStudent
              ? isSi
                ? `ඔබගේ ${studentGrade} ශ්‍රේණියට අදාළව මේ මාසයේ සහ පසුගිය මාසවල පැවැත්වෙන සියලුම පන්ති පහතින් දැක්වේ.`
                : `Showing current and previous monthly classes tailored for Grade ${studentGrade}.`
              : isSi
              ? "සියලුම ශ්‍රේණිවල මාසික පන්ති හෝ දරුවාගේ ශ්‍රේණිය තෝරා පරීක්ෂා කරන්න"
              : "View all grades or filter by Grade 5, Grade 4, or Grade 3"}
          </p>
        </div>

        {/* Grade Filter Chips: ONLY shown before login (or for Admin). Hidden for logged-in student! */}
        {!isStudent && (
          <div className="chips" style={{ marginBottom: "22px" }}>
            <button
              type="button"
              className={`chip ${selectedGrade === "all" ? "active" : ""}`}
              onClick={() => setSelectedGrade("all")}
            >
              🌟 {isSi ? "සියලුම ශ්‍රේණි (3, 4, 5)" : "All Grades (3, 4, 5)"}
            </button>
            {[5, 4, 3].map(g => (
              <button
                key={g}
                type="button"
                className={`chip ${selectedGrade === g ? "active" : ""}`}
                onClick={() => setSelectedGrade(g)}
              >
                {isSi
                  ? `${g} ශ්‍රේණිය ${g === 5 ? "🔥 (190+ විශේෂ)" : ""}`
                  : `Grade ${g} ${g === 5 ? "🔥 (190+ Target)" : ""}`}
              </button>
            ))}
          </div>
        )}

        {filteredFolders.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {filteredFolders.map(f => {
              const status = getFolderStatus(f.id);
              const isUnlocked = status === "approved";
              const isPending = status === "pending";
              const mItems = S.items.filter(i => i.fid === f.id);
              const zCount = mItems.filter(i => i.type === "zoom").length + (f.zoomUrl ? 1 : 0);
              const vCount = mItems.filter(i => i.type === "video" || getYoutubeEmbedUrl(i.url)).length;
              const pCount = mItems.filter(i => i.type === "pdf").length;

              return (
                <div
                  key={f.id}
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "18px",
                    padding: "20px 24px",
                    borderRadius: "18px",
                    border: f.isCurrentMonth
                      ? "2px solid var(--gold)"
                      : isUnlocked
                      ? "1px solid rgba(74, 222, 128, 0.45)"
                      : "1px solid var(--line)",
                    background: f.isCurrentMonth
                      ? "linear-gradient(135deg, rgba(245, 166, 35, 0.14), rgba(26, 11, 16, 0.95))"
                      : "var(--glass)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flex: 1, minWidth: "280px" }}>
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "14px",
                        background: f.isCurrentMonth
                          ? "linear-gradient(135deg, #f5a623, #d97706)"
                          : isUnlocked
                          ? "rgba(34, 197, 94, 0.2)"
                          : "rgba(255, 255, 255, 0.06)",
                        color: f.isCurrentMonth ? "#1a0800" : "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "1.45rem",
                        fontWeight: 800,
                        flexShrink: 0
                      }}
                    >
                      {f.isCurrentMonth ? "🔥" : isUnlocked ? "✅" : "📅"}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "6px" }}>
                        <span className="badge-tag gold" style={{ fontWeight: 800 }}>
                          🎓 {isSi ? `${f.grade} ශ්‍රේණිය` : `Grade ${f.grade}`}
                        </span>
                        <span className="tag" style={{ background: "rgba(255, 255, 255, 0.1)", color: "#fff", fontWeight: 700, fontSize: "0.78rem" }}>
                          📅 {f.month || (isSi ? "මාසික පන්තිය" : "Monthly Class")}
                        </span>
                        {f.isCurrentMonth ? (
                          <span className="tag" style={{ background: "rgba(245, 166, 35, 0.25)", color: "var(--gold)", fontWeight: 800, fontSize: "0.78rem" }}>
                            🔥 {isSi ? "මේ මාසයේ ක්‍රියාත්මක පන්තිය" : "Current Active Month"}
                          </span>
                        ) : (
                          <span className="tag" style={{ background: "rgba(255, 255, 255, 0.06)", color: "#cbd5e1", fontSize: "0.76rem" }}>
                            ⏪ {isSi ? "පසුගිය මාසය" : "Previous Month"}
                          </span>
                        )}

                        {isStudent && (
                          isUnlocked ? (
                            <span className="tag" style={{ background: "rgba(34, 197, 94, 0.22)", color: "#4ade80", fontWeight: 800, fontSize: "0.78rem" }}>
                              ✓ {isSi ? "ඔබ සක්‍රිය කර ඇත (Active)" : "Activated & Unlocked"}
                            </span>
                          ) : isPending ? (
                            <span className="tag" style={{ background: "rgba(245, 166, 35, 0.22)", color: "#fbbf24", fontWeight: 700, fontSize: "0.78rem" }}>
                              ⏳ {isSi ? "රිසිට්පත පරීක්ෂා වෙමින්" : "Pending Approval"}
                            </span>
                          ) : (
                            <span className="tag" style={{ background: "rgba(255, 255, 255, 0.06)", color: "#94a3b8", fontSize: "0.76rem" }}>
                              🔒 {isSi ? "සක්‍රිය කර නොමැත" : "Locked"}
                            </span>
                          )
                        )}
                      </div>

                      <h3 style={{ fontSize: "1.18rem", color: "#fff", margin: "0 0 6px" }}>
                        {f.name}
                      </h3>

                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "0.85rem", color: "#cbd5e1" }}>
                        <span>🎯 <b>{isSi ? "විෂයයන්:" : "Subjects:"}</b> {f.subjects}</span>
                        <span>•</span>
                        <span style={{ color: "#60a5fa", fontWeight: 700 }}>🔴 {zCount || 2} Zoom Live</span>
                        <span>•</span>
                        <span>🎥 {vCount || 2} {isSi ? "වීඩියෝ" : "Videos"}</span>
                        <span>•</span>
                        <span>📄 {pCount || 2} {isSi ? "PDF පේපර්" : "PDFs"}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginLeft: "auto" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gold)" }}>
                        {isSi ? `රු. ${f.price || 2000}` : `Rs. ${f.price || 2000}`}
                      </div>
                      <small className="mut" style={{ fontSize: "0.75rem" }}>
                        {isUnlocked
                          ? (isSi ? "ගාස්තු ගෙවා ඇත ✓" : "Already Paid ✓")
                          : (isSi ? "මාසික පන්ති ගාස්තුව" : "Monthly Fee")}
                      </small>
                    </div>

                    <Link
                      href={
                        me
                          ? me.admin
                            ? "/admin"
                            : isUnlocked
                            ? `/dashboard?open=${f.id}`
                            : "/dashboard"
                          : "/login?mode=reg"
                      }
                      className="btn"
                      style={{
                        fontSize: "0.86rem",
                        padding: "10px 18px",
                        background: isUnlocked
                          ? "linear-gradient(135deg, #10b981, #059669)"
                          : undefined,
                        color: isUnlocked ? "#fff" : undefined
                      }}
                    >
                      {isUnlocked
                        ? (isSi ? "🚪 පන්තිය ඇතුළට යන්න →" : "🚪 Enter Class →")
                        : me
                        ? (isSi ? "💳 රු. 2,000 ගෙවා සක්‍රිය කරන්න →" : "💳 Pay Rs. 2,000 & Activate →")
                        : (isSi ? "🎯 ලියාපදිංචි වී එක්වන්න →" : "🎯 Register to Join →")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: "40px" }}>
            <p className="mut">{t("nofold")}</p>
          </div>
        )}
      </section>

      {/* Quick Stats Bar */}
      <section className="stats-bar">
        <div className="stat-card">
          <div className="val">{t("stat1Val")}</div>
          <div className="lbl">{t("stat1Lbl")}</div>
        </div>
        <div className="stat-card">
          <div className="val">{t("stat2Val")}</div>
          <div className="lbl">{t("stat2Lbl")}</div>
        </div>
        <div className="stat-card">
          <div className="val">{t("stat3Val")}</div>
          <div className="lbl">{t("stat3Lbl")}</div>
        </div>
        <div className="stat-card">
          <div className="val">{t("stat4Val")}</div>
          <div className="lbl">{t("stat4Lbl")}</div>
        </div>
      </section>

      {/* 5 Subjects Covered Section */}
      <section style={{ margin: "40px 0" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "2rem" }}>{t("subjectsTitle")}</h2>
          <p className="mut" style={{ maxWidth: "700px", margin: "0 auto" }}>
            {t("subjectsSub")}
          </p>
        </div>

        <div className="subjects-grid">
          {subjectsList.map(sub => (
            <div className="subject-card" key={sub.id}>
              <div className="between">
                <span className="sub-icon">{sub.icon}</span>
                <span className="tag">{sub.badge}</span>
              </div>
              <h3>{t(sub.titleKey)}</h3>
              <p>{t(sub.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Our 190+ Class Section */}
      <section style={{ margin: "50px 0" }}>
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <h2 style={{ fontSize: "2rem" }}>{t("whyTitle")}</h2>
          <p className="mut">{t("whySub")}</p>
        </div>

        <div className="features-grid">
          {highlights.map((h, idx) => (
            <div className="feature-box" key={idx}>
              <div className="feat-icon-badge">{h.icon}</div>
              <h3>{t(h.titleKey)}</h3>
              <p>{t(h.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Success Workflow Roadmap */}
      <section className="card" style={{ padding: "30px", margin: "50px 0" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.9rem" }}>{t("flowTitle")}</h2>
          <p className="mut">{t("flowSub")}</p>
        </div>

        <div className="flow-steps">
          <div className="flow-step-card">
            <span className="flow-step-num">1</span>
            <h4>{t("step1")}</h4>
            <p>{t("step1Desc")}</p>
          </div>
          <div className="flow-step-card">
            <span className="flow-step-num">2</span>
            <h4>{t("step2")}</h4>
            <p>{t("step2Desc")}</p>
          </div>
          <div className="flow-step-card">
            <span className="flow-step-num">3</span>
            <h4>{t("step3")}</h4>
            <p>{t("step3Desc")}</p>
          </div>
          <div className="flow-step-card">
            <span className="flow-step-num">4</span>
            <h4>{t("step4")}</h4>
            <p>{t("step4Desc")}</p>
          </div>
        </div>

        {/* Free Sample Video Lesson Preview right on site */}
        {sampleVideo && (
          <div style={{ marginTop: "32px", padding: "24px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "16px", border: "1px solid rgba(245, 166, 35, 0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span className="badge-tag gold" style={{ marginBottom: "6px", display: "inline-block" }}>
                  🎥 {isSi ? "නොමිලේ ආදර්ශ වීඩියෝ විවරණය" : "Free Sample Video Lesson"}
                </span>
                <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#fff" }}>
                  {sampleVideo.title}
                </h3>
              </div>
              <span className="tag" style={{ background: "rgba(34, 197, 94, 0.2)", color: "#4ade80" }}>
                ▶ {isSi ? "වෙබ් අඩවිය තුළම නරඹන්න" : "Watch directly on site"}
              </span>
            </div>
            <VideoPlayer url={sampleVideo.url} title={sampleVideo.title} />
          </div>
        )}
      </section>

      {/* 190+ AI Tutor Interactive Feature Banner */}
      <section style={{ margin: "50px 0" }}>
        <div className="card" style={{
          background: "linear-gradient(135deg, rgba(26, 44, 91, 0.95), rgba(15, 23, 42, 0.98))",
          border: "2px solid rgba(245, 166, 35, 0.4)",
          borderRadius: "20px",
          padding: "36px 30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "24px"
        }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
              <span className="target-badge" style={{ fontSize: "0.8rem", padding: "4px 12px" }}>
                🚀 {isSi ? "ලංකාවේ ප්‍රථම ශිෂ්‍යත්ව AI සහයක" : "Sri Lanka's First Scholarship AI Tutor"}
              </span>
              <span className="tag" style={{ background: "rgba(42, 157, 143, 0.3)", color: "#2dd4bf" }}>
                {isSi ? "ජාතික අධ්‍යාපන ආයතනය (NIE) පාදක" : "NIE Master Guide Powered"}
              </span>
            </div>
            <h2 style={{ fontSize: "2rem", color: "#fff", margin: "0 0 10px 0" }}>
              🤖 {isSi ? "190+ AI සහයක" : "190+ AI Tutor"}
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: 1.7, margin: "0 0 16px 0" }}>
              {isSi
                ? "5 ශ්‍රේණිය පොදු ගුරු මාර්ගෝපදේශයේ සියලුම විෂය කරුණු කියවා සකස් කළ අපගේ AI සහයකයාගෙන් පරිසරය තේමා 16, දෙමළ සංවාද 1-19, සහ ඉංග්‍රීසි ඕනෑම ප්‍රශ්නයක් විමසන්න!"
                : "Mastering the official NIE Grade 5 Teacher Guide. Ask any question on Environmental Themes 1-16, Tamil Dialogues, English, and Math speed secrets!"}
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href="/ai-tutor" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: "0.95rem" }}>
                {isSi ? "AI අධ්‍යයන මැදිරියට 🚀" : "Visit AI Learning Hub 🚀"}
              </Link>
              <a
                href="#papers"
                className="btn ghost"
                style={{ padding: "12px 20px", fontSize: "0.95rem" }}
              >
                {isSi ? "මාසික පන්ති බලන්න ↓" : "Explore Monthly Classes ↓"}
              </a>
            </div>
          </div>

          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            padding: "20px",
            maxWidth: "360px",
            width: "100%"
          }}>
            <h4 style={{ color: "var(--gold)", margin: "0 0 12px 0", fontSize: "1rem" }}>
              ✨ {isSi ? "AI සහයකයාගේ සුවිශේෂතා:" : "AI Tutor Highlights:"}
            </h4>
            <ul style={{ color: "#e2e8f0", fontSize: "0.85rem", lineHeight: 1.8, paddingLeft: "18px", margin: 0 }}>
              <li>🌿 {isSi ? "පරිසරය තේමා 16ම පූර්ණ සවිස්තරාත්මක දැනුම" : "All 16 Environmental Studies themes"}</li>
              <li>🗣️ {isSi ? "දෙමළ 16-20, දහයේ ගුණාකාර සහ සංවාද 1-19" : "Tamil numbers, vocabulary & dialogues 1-19"}</li>
              <li>🔤 {isSi ? "ඉංග්‍රීසි ABOE ගීත, ක්‍රීඩා සහ වචන මාලාව" : "Activity-Based English songs & vocabulary"}</li>
              <li>👑 {isSi ? "පණ්ඩුකාභය, දුටුගැමුණු ඓතිහාසික විත්ති" : "Kings Pandukabhaya & Dutugemunu history"}</li>
              <li>🌐 {isSi ? "භාෂා 3න්ම (සිංහල, English, தமிழ்) ක්‍රියාකාරීයි" : "Multilingual: Sinhala, English & Tamil"}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Parent Reviews & Feedback */}
      <section style={{ margin: "50px 0" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.9rem" }}>{t("parentReviewsTitle")}</h2>
          <p className="mut">දරුවන්ගේ වේගය හා දැනුම වැඩිවූ දෙමාපියන්ගේ සත්‍ය අත්දැකීම්</p>
        </div>

        <div className="reviews-grid">
          <div className="review-card">
            <p>{t("r1")}</p>
            <div className="author">{t("r1Author")}</div>
          </div>
          <div className="review-card">
            <p>{t("r2")}</p>
            <div className="author">{t("r2Author")}</div>
          </div>
          <div className="review-card">
            <p>{t("r3")}</p>
            <div className="author">{t("r3Author")}</div>
          </div>
        </div>
      </section>

      {/* Bottom CTA / WhatsApp Box */}
      <section
        className="card"
        style={{
          background: "linear-gradient(135deg, rgba(99, 20, 36, 0.7), rgba(45, 10, 20, 0.9))",
          border: "2px solid var(--gold)",
          textAlign: "center",
          padding: "36px 20px",
          marginTop: "40px"
        }}
      >
        <h2 style={{ fontSize: "1.8rem", color: "#fff", marginBottom: "10px" }}>
          {isStudent
            ? isSi
              ? `${me.name}, අදම ඔබේ ${studentGrade} ශ්‍රේණියේ පේපර් පුහුණුව ආරම්භ කරමු!`
              : `Ready to continue your Grade ${studentGrade} practice, ${me.name}?`
            : "ඔබේ දරුවාත් ශිෂ්‍යත්වයෙන් 190+ ලකුණු මට්ටමට ගෙන යන්න සූදානම්ද?"}
        </h2>
        <p className="mut" style={{ maxWidth: "600px", margin: "0 auto 20px", fontSize: "1rem" }}>
          පහ දිනන හපන්නු 190+ පේපර් පන්තිය හා එක්වී දිනකට පළාත් පේපර් 2ක් විසඳීමේ වේගය හා සියලුම විෂයයන්ගේ සවිස්තර දැනුම අදම ලබා දෙන්න!
        </p>
        <div className="cta-row" style={{ marginBottom: 0 }}>
          {me ? (
            <Link className="btn" href={me.admin ? "/admin" : "/dashboard"}>
              🚀 {isSi ? "ශිෂ්‍ය පුවරුවට පිවිසෙන්න" : "Go to Student Dashboard"}
            </Link>
          ) : (
            <Link className="btn" href="/login?mode=reg">
              ✍️ දැන්ම ලියාපදිංචි වන්න
            </Link>
          )}
          <a
            className="btn whatsapp-btn"
            href={`https://wa.me/${(S.set?.hotline || "94771234567").replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 WhatsApp ඔස්සේ සම්බන්ධ වන්න
          </a>
        </div>
      </section>
    </main>
  );
}
