"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useApp, getYoutubeEmbedUrl } from "../lib/Provider";
import VideoPlayer from "../components/VideoPlayer";

export default function Home() {
  const { S, t, me, lang, theme, toggleTheme } = useApp();
  const isSi = lang === "si";
  const isLight = theme === "light";

  const isStudent = Boolean(me && !me.admin);
  const studentGrade = isStudent
    ? ([5, 4, 3].includes(Number(me.grade)) ? Number(me.grade) : 5)
    : null;

  const [selectedGrade, setSelectedGrade] = useState("all");
  const [heroSlide, setHeroSlide] = useState(0);
  const [hoveredSide, setHoveredSide] = useState(null);
  const [channelVideos, setChannelVideos] = useState([
    {
      videoId: "BbZdfLXfW9A",
      title: "ශිෂ්‍යත්ව විභාගයට වටිනා පරිසරය ප්‍රශ්න 100ක්",
      url: "https://youtu.be/BbZdfLXfW9A",
      subject: "පරිසරය (ප්‍රශ්න 100 විශේෂ විවරණය)"
    },
    {
      videoId: "murCwFZRlJo",
      title: "අදිති 30 - 1 කොටස සහ 30 - 2 කොටස - 190+ පේපර් පන්තිය",
      url: "https://youtu.be/murCwFZRlJo",
      subject: "190+ පේපර් සාකච්ඡාව (I හා II කොටස්)"
    }
  ]);

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

  const getFolderStatus = (fid) => {
    if (!isStudent) return "none";
    return (
      (S.pays.filter(p => p.uid === me.id && p.fid === fid).pop() || {}).status ||
      "none"
    );
  };

  const GRADE_DETAILS = [
    {
      grade: 5,
      shortTag: isSi ? "🔥 190+ ඉලක්කය" : "🔥 190+ Target",
      title: isSi ? "5 ශ්‍රේණිය - 190+ පේපර් පන්තිය" : "Grade 5 - 190+ Paper Class",
      subtitle: isSi
        ? "දිනකට පළාත් පේපර් 2 බැගින් සාකච්ඡා කරමින් ලකුණු 190+ සීමාව පසුකරවන විශේෂ පන්තිය."
        : "Discussing 2 provincial papers daily to guide students past the 190+ marks milestone.",
      subjects: isSi
        ? "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි"
        : "Environment, Sinhala, Math, Tamil, English",
      scheduleShort: isSi ? "සෙන / ඉරිදා ප.ව. 7.00 - 9.00" : "Sat & Sun · 7:00 PM - 9:00 PM",
      schedule: isSi
        ? "සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 - 9.00 (Zoom Live)"
        : "Every Saturday & Sunday 7:00 PM - 9:00 PM (Zoom Live)",
      fee: 2000,
      features: isSi
        ? [
            "දිනකට පළාත් ප්‍රශ්න පත්‍ර 2ක් සම්පූර්ණ විවරණය",
            "ප්‍රශ්නයකට තත්පර 45කට අඩු වේග පාලන පුහුණුව",
            "සජීවී Zoom පන්ති, වීඩියෝ සහ PDF පේපර්ස්"
          ]
        : [
            "2 Provincial papers fully discussed daily",
            "Under 45-second per question speed training",
            "Live Zoom classes, recorded videos & PDFs"
          ]
    },
    {
      grade: 4,
      shortTag: isSi ? "🌟 පූර්ව අඩිතාලම" : "🌟 Pre-Scholarship",
      title: isSi ? "4 ශ්‍රේණිය - ශිෂ්‍යත්ව පූර්ව පන්තිය" : "Grade 4 - Pre-Scholarship Class",
      subtitle: isSi
        ? "5 ශ්‍රේණියේ විභාගයට කල්තියාම දරුවාගේ වේගය සහ විෂය දැනුම ගොඩනඟන පන්තිය."
        : "Building early exam speed and 5-subject mastery ahead of Grade 5 scholarship.",
      subjects: isSi
        ? "මව්බස, ගණිතය, පරිසරය, දෙමළ, ඉංග්‍රීසි"
        : "Sinhala, Math, Environment, Tamil, English",
      scheduleShort: isSi ? "සෙනසුරාදා ප.ව. 4.00 - 6.00" : "Every Saturday · 4:00 PM - 6:00 PM",
      schedule: isSi
        ? "සෑම සෙනසුරාදාම ප.ව. 4.00 - 6.00 (Zoom Live)"
        : "Every Saturday 4:00 PM - 6:00 PM (Zoom Live)",
      fee: 2000,
      features: isSi
        ? [
            "ගණිත කෙටි ක්‍රම සහ තර්කන ගැටළු පුහුණුව",
            "වියරණ, රචනා සහ පරිසරය මූලික පදනම",
            "මාසික ආදර්ශ ප්‍රශ්න පත්‍ර PDF සහ වීඩියෝ"
          ]
        : [
            "Math shortcuts and logical problem solving",
            "Grammar, essay & environmental foundation",
            "Monthly model paper PDFs & video lessons"
          ]
    },
    {
      grade: 3,
      shortTag: isSi ? "🌱 මූලික පදනම" : "🌱 Core Foundation",
      title: isSi ? "3 ශ්‍රේණිය - මූලික පදනම පන්තිය" : "Grade 3 - Foundation Class",
      subtitle: isSi
        ? "කුඩා කල සිටම ප්‍රශ්න පත්‍රවලට බිය නැතිව නිවැරදිව පිළිතුරු ලිවීමට හුරු කරවන පන්තිය."
        : "Training young learners to read, understand, and answer exam papers confidently.",
      subjects: isSi
        ? "මව්බස, ගණිතය, පරිසරය, ඉංග්‍රීසි"
        : "Sinhala, Math, Environment, English",
      scheduleShort: isSi ? "ඉරිදා ප.ව. 3.00 - 5.00" : "Every Sunday · 3:00 PM - 5:00 PM",
      schedule: isSi
        ? "සෑම ඉරිදාම ප.ව. 3.00 - 5.00 (Zoom Live)"
        : "Every Sunday 3:00 PM - 5:00 PM (Zoom Live)",
      fee: 2000,
      features: isSi
        ? [
            "මනෝමය ගණිතය සහ මූලික ගණිත ක්‍රමවේද",
            "නිවැරදි අක්ෂර වින්‍යාසය සහ වාක්‍ය ගොඩනැගීම",
            "සතිපතා වර්ණවත් PDF වැඩ පත්‍රිකා සහ Zoom"
          ]
        : [
            "Mental math and core arithmetic concepts",
            "Accurate spelling and sentence building",
            "Weekly printable PDF worksheets & Zoom"
          ]
    }
  ];

  const myGradeDetail = isStudent
    ? GRADE_DETAILS.find(g => g.grade === studentGrade) || GRADE_DETAILS[0]
    : null;

  const validFolders = S.folders.filter(f => [5, 4, 3].includes(Number(f.grade)));

  const myActiveClasses = isStudent
    ? validFolders.filter(f => getFolderStatus(f.id) === "approved")
    : [];
  const myPendingClasses = isStudent
    ? validFolders.filter(f => getFolderStatus(f.id) === "pending")
    : [];

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
    <main className={`wrap home-clean ${isLight ? "theme-light" : "theme-dark"}`}>
      <style jsx>{`
        .home-clean {
          --h-panel: ${isLight ? "#ffffff" : "rgba(32, 11, 18, 0.82)"};
          --h-panel2: ${isLight ? "#f6ecdd" : "rgba(255, 255, 255, 0.05)"};
          --h-ink: ${isLight ? "#2a1418" : "#fff7ed"};
          --h-heading: ${isLight ? "#5a1424" : "#ffffff"};
          --h-muted: ${isLight ? "#6b5358" : "#d8bfb8"};
          --h-line: ${isLight ? "#e8d9c4" : "rgba(245, 166, 35, 0.24)"};
          --h-gold: ${isLight ? "#b86e00" : "#ffbe38"};
          --h-gold-bg: ${isLight ? "#ffe3ad" : "rgba(245, 166, 35, 0.18)"};
          --h-green: ${isLight ? "#0f7a4b" : "#34d399"};
          --h-green-bg: ${isLight ? "#d9f3e5" : "rgba(16, 185, 129, 0.2)"};
          --h-maroon: #5a1424;
        }

        .hero-split-stage {
          display: grid;
          grid-template-columns: 420px minmax(340px, 1fr) 420px;
          align-items: center;
          gap: 30px;
          width: min(96vw, 1540px);
          position: relative;
          left: 50%;
          transform: translateX(-50%);
          margin: 8px 0 34px;
        }

        .hero-char-card {
          position: relative;
          border-radius: 30px;
          padding: 10px;
          background: ${isLight
            ? "linear-gradient(145deg, #ffe3ad, #ffffff)"
            : "linear-gradient(145deg, rgba(245, 166, 35, 0.35), rgba(35, 10, 18, 0.94))"};
          border: 3px solid ${isLight ? "#d49b35" : "rgba(245, 166, 35, 0.65)"};
          box-shadow: ${isLight
            ? "0 20px 44px rgba(90, 20, 36, 0.14), 0 0 24px rgba(184, 110, 0, 0.18)"
            : "0 22px 48px rgba(0, 0, 0, 0.65), 0 0 28px rgba(245, 166, 35, 0.22)"};
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .hero-char-card.left-card {
          transform: perspective(1000px) rotateY(7deg) rotateZ(-1.5deg);
        }

        .hero-char-card.right-card {
          transform: perspective(1000px) rotateY(-7deg) rotateZ(1.5deg);
        }

        .hero-char-card.auto-active {
          border-color: #f5a623;
          box-shadow: ${isLight
            ? "0 24px 50px rgba(90, 20, 36, 0.2), 0 0 36px rgba(245, 166, 35, 0.42)"
            : "0 24px 52px rgba(0, 0, 0, 0.72), 0 0 40px rgba(245, 166, 35, 0.5)"};
        }

        .hero-char-card:hover,
        .hero-char-card.hovered {
          transform: perspective(1000px) rotateY(0deg) rotateZ(0deg) translateY(-12px) scale(1.07) !important;
          border-color: #ffbe38 !important;
          background: linear-gradient(145deg, #ffd470, #5a1424) !important;
          box-shadow:
            0 28px 60px rgba(0, 0, 0, 0.45),
            0 0 0 5px rgba(245, 166, 35, 0.38),
            0 0 60px 14px rgba(245, 166, 35, 0.8) !important;
          z-index: 10;
        }

        .hero-char-img-wrap {
          position: relative;
          border-radius: 22px;
          overflow: hidden;
          height: 500px;
          background: #18070c;
        }

        .hero-char-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.55s ease, filter 0.4s ease;
          filter: brightness(0.97) contrast(1.05);
        }

        .hero-char-card:hover .hero-char-img-wrap img {
          transform: scale(1.09);
          filter: brightness(1.12) contrast(1.08);
        }

        .hero-char-overlay {
          position: absolute;
          inset: auto 0 0 0;
          padding: 48px 18px 18px;
          background: linear-gradient(180deg, transparent 0%, rgba(16, 4, 9, 0.86) 45%, rgba(16, 4, 9, 0.98) 100%);
          text-align: center;
          transition: all 0.35s ease;
        }

        .hero-char-badge {
          display: inline-block;
          background: rgba(245, 166, 35, 0.25);
          border: 1.5px solid rgba(245, 166, 35, 0.75);
          color: #ffd875;
          font-size: 0.82rem;
          font-weight: 800;
          padding: 4px 14px;
          border-radius: 999px;
          margin-bottom: 7px;
          transition: all 0.3s ease;
        }

        .hero-char-card:hover .hero-char-badge {
          background: #ffbe38;
          color: #1c0800;
          box-shadow: 0 0 20px rgba(245, 166, 35, 0.9);
        }

        .hero-char-title {
          display: block;
          color: #fff;
          font-size: 1.15rem;
          font-weight: 800;
          line-height: 1.3;
          margin-bottom: 4px;
        }

        .hero-char-sub {
          display: block;
          color: #e2e8f0;
          font-size: 0.84rem;
          line-height: 1.4;
        }

        .clean-sec {
          margin: 52px 0;
        }

        .clean-sec-head {
          text-align: center;
          margin-bottom: 26px;
        }

        .clean-sec-head h2 {
          font-size: clamp(1.75rem, 3vw, 2.2rem);
          color: var(--h-heading);
          margin: 6px 0 8px;
          font-weight: 800;
        }

        .clean-sec-head p {
          color: var(--h-muted);
          max-width: 680px;
          margin: 0 auto;
          font-size: 0.98rem;
        }

        .clean-card {
          background: var(--h-panel);
          border: 1px solid var(--h-line);
          border-radius: 22px;
          padding: 26px;
          box-shadow: var(--card-shadow);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .clean-row {
          display: grid;
          grid-template-columns: 56px 1fr auto;
          gap: 18px;
          align-items: center;
          background: var(--h-panel);
          border: 1px solid var(--h-line);
          border-radius: 18px;
          padding: 18px 22px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .clean-row:hover {
          transform: translateY(-2px);
          box-shadow: var(--card-shadow-hover);
        }

        .clean-row.cur {
          border: 2px solid var(--h-gold);
          background: ${isLight
            ? "linear-gradient(135deg, #fffdf9, #fff7e8)"
            : "linear-gradient(135deg, rgba(245, 166, 35, 0.14), rgba(32, 11, 18, 0.95))"};
        }

        .clean-ic {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-size: 26px;
          background: var(--h-gold-bg);
          color: var(--h-gold);
          flex-shrink: 0;
        }

        .clean-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 3px 12px;
          border-radius: 999px;
        }

        .clean-pill.gold {
          background: var(--h-gold-bg);
          color: var(--h-gold);
        }

        .clean-pill.ok {
          background: var(--h-green-bg);
          color: var(--h-green);
        }

        .clean-pill.sub {
          background: var(--h-panel2);
          color: var(--h-muted);
        }

        @media (max-width: 1420px) {
          .hero-split-stage {
            grid-template-columns: 360px minmax(310px, 1fr) 360px;
            gap: 22px;
          }
          .hero-char-img-wrap {
            height: 450px;
          }
        }

        @media (max-width: 1160px) {
          .hero-split-stage {
            grid-template-columns: 310px minmax(280px, 1fr) 310px;
            gap: 18px;
          }
          .hero-char-img-wrap {
            height: 410px;
          }
        }

        @media (max-width: 960px) {
          .hero-split-stage {
            grid-template-columns: 1fr 1fr;
            width: 100%;
            left: 0;
            transform: none;
          }
          .hero-center-col {
            grid-column: 1 / -1;
            order: -1;
          }
          .hero-char-card.left-card,
          .hero-char-card.right-card {
            transform: none;
            max-width: 440px;
            margin: 0 auto;
            width: 100%;
          }
          .hero-char-img-wrap {
            height: 420px;
          }
        }

        @media (max-width: 720px) {
          .clean-row {
            grid-template-columns: 48px 1fr;
          }
          .clean-row-act {
            grid-column: 1 / -1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding-top: 10px;
            border-top: 1px solid var(--h-line);
          }
        }

        @media (max-width: 620px) {
          .hero-split-stage {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ==================================================================== */}
      {/* HERO SECTION WITH LARGE LEFT & RIGHT BORDERED CHARACTER FRAMES       */}
      {/* ==================================================================== */}
      <section className="hero" style={{ padding: "18px 0 24px" }}>
        {/* Quick Theme Mode Switch Pill Bar at Top of Home */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              background: "var(--h-panel)",
              border: "1px solid var(--h-line)",
              color: "var(--h-ink)",
              padding: "6px 16px",
              borderRadius: "999px",
              fontSize: "0.8rem",
              fontWeight: 700,
              boxShadow: "var(--card-shadow)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span>{isLight ? "🌙" : "☀️"}</span>
            <span>
              {isLight
                ? (isSi ? "අඳුරු තේමාවට මාරු වන්න (Dark Mode)" : "Switch to Dark Mode")
                : (isSi ? "ආලෝක තේමාවට මාරු වන්න (Light Mode)" : "Switch to Light Mode")}
            </span>
          </button>
        </div>

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

            <div className="logo-wrap" style={{ display: "block", margin: "0 auto 18px" }}>
              <img
                className="logo"
                src={S.set.logo || "/logo.jpg"}
                alt={S.set.name}
                style={{ width: "142px", height: "142px" }}
              />
            </div>

            {isStudent ? (
              <>
                <h1>
                  {isSi ? `ආයුබෝවන්, ${me.name}! 👋` : `Welcome back, ${me.name}! 👋`}
                  <br />
                  <span style={{ color: "var(--h-gold)", fontSize: "0.76em" }}>
                    {myGradeDetail?.title}
                  </span>
                </h1>

                <div className="slogan-banner">
                  ✨ {myGradeDetail?.subtitle}
                </div>

                <p className="lead" style={{ color: "var(--h-muted)" }}>
                  {isSi
                    ? `ඔබ ලියාපදිංචි වී සිටින්නේ ${studentGrade} ශ්‍රේණිය සඳහාය. ඔබගේ ශ්‍රේණියට අදාළ සක්‍රිය කළ මාසික පන්ති, සජීවී Zoom සබැඳි, වීඩියෝ සාකච්ඡා සහ PDF ප්‍රශ්න පත්‍ර පහතින් කෙලින්ම විවෘත කරගත හැක.`
                    : `You are enrolled in Grade ${studentGrade}. Access your activated monthly classes, live Zoom links, video discussions, and PDF papers directly below.`}
                </p>
              </>
            ) : (
              <>
                <h1>
                  {t("brand")} <br />
                  <span style={{ color: "var(--h-gold)" }}>{t("brandSub")}</span>
                </h1>

                <div className="slogan-banner">
                  ✨ {t("slogan")}
                </div>

                <p className="lead" style={{ color: "var(--h-muted)" }}>
                  {t("heroDesc")}
                </p>
              </>
            )}

            <div className="cta-row" style={{ marginBottom: "8px" }}>
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
                    📅 {isSi ? `${studentGrade} ශ්‍රේණියේ මාසික පන්ති ↓` : `Grade ${studentGrade} Classes ↓`}
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
      {/* 4 KEY METRICS BAR                                                    */}
      {/* ==================================================================== */}
      <section className="stats-bar" style={{ margin: "18px 0 44px" }}>
        {[
          { val: t("stat1Val"), lbl: t("stat1Lbl") },
          { val: t("stat2Val"), lbl: t("stat2Lbl") },
          { val: t("stat3Val"), lbl: t("stat3Lbl") },
          { val: t("stat4Val"), lbl: t("stat4Lbl") }
        ].map((st, idx) => (
          <div
            key={idx}
            className="clean-card"
            style={{ padding: "18px 16px", textAlign: "center" }}
          >
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--h-gold)", lineHeight: 1.2 }}>
              {st.val}
            </div>
            <div style={{ fontSize: "0.86rem", color: "var(--h-muted)", marginTop: "4px", fontWeight: 600 }}>
              {st.lbl}
            </div>
          </div>
        ))}
      </section>

      {/* ==================================================================== */}
      {/* LOGGED-IN STUDENT SECTION: MY ACTIVE / UNLOCKED CLASSES & GRADE INFO */}
      {/* ==================================================================== */}
      {isStudent && myGradeDetail && (
        <section className="clean-sec">
          <div
            className="clean-card"
            style={{
              border: "2px solid var(--h-gold)",
              padding: "28px"
            }}
          >
            {/* Student's Grade Summary Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "18px",
                paddingBottom: "20px",
                borderBottom: "1px solid var(--h-line)"
              }}
            >
              <div style={{ flex: 1, minWidth: "280px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
                  <span className="clean-pill gold">
                    🎓 {isSi ? `ඔබගේ ශ්‍රේණිය: ${studentGrade} ශ්‍රේණිය` : `Your Grade: Grade ${studentGrade}`}
                  </span>
                  <span className="clean-pill ok">
                    ✓ {isSi ? `සක්‍රිය මාස ${myActiveClasses.length}ක් විවෘතයි` : `${myActiveClasses.length} Active Months Unlocked`}
                  </span>
                  {myPendingClasses.length > 0 && (
                    <span className="clean-pill gold">
                      ⏳ {isSi ? `රිසිට්පත් ${myPendingClasses.length}ක් පරීක්ෂා වෙමින්` : `${myPendingClasses.length} Pending Approval`}
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: "1.55rem", color: "var(--h-heading)", margin: "0 0 6px" }}>
                  {myGradeDetail.title}
                </h2>
                <p style={{ margin: "0 0 8px", color: "var(--h-ink)", fontSize: "0.94rem" }}>
                  🎯 <b>{isSi ? "ආවරණය වන විෂයයන්:" : "Subjects Covered:"}</b> {myGradeDetail.subjects}
                </p>
                <p style={{ margin: 0, color: "var(--h-gold)", fontSize: "0.9rem", fontWeight: 700 }}>
                  ⏰ <b>{isSi ? "සජීවී පන්ති කාලසටහන:" : "Live Class Schedule:"}</b> {myGradeDetail.schedule}
                </p>
              </div>

              <Link
                href="/dashboard"
                className="btn"
                style={{ padding: "11px 20px", fontSize: "0.9rem" }}
              >
                🚪 {isSi ? "ශිෂ්‍ය පුවරුවට යන්න →" : "Go to Dashboard →"}
              </Link>
            </div>

            {/* Student's Active (Unlocked) Monthly Classes List */}
            <div style={{ marginTop: "22px" }}>
              <h3 style={{ fontSize: "1.2rem", color: "var(--h-heading)", margin: "0 0 4px" }}>
                🟢 {isSi
                  ? `ඔබ සක්‍රිය (Active) කරගත් මාසික පන්ති (${myActiveClasses.length})`
                  : `Your Activated Monthly Classes (${myActiveClasses.length})`}
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--h-muted)", margin: "0 0 14px" }}>
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
                      <div key={f.id} className={`clean-row ${f.isCurrentMonth ? "cur" : ""}`}>
                        <div className="clean-ic">{f.isCurrentMonth ? "🔥" : "✓"}</div>

                        <div>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "4px" }}>
                            <span className="clean-pill gold">📅 {f.month}</span>
                            <span className="clean-pill ok">
                              ✓ {isSi ? "සක්‍රිය කර ඇත (Active)" : "Active & Unlocked"}
                            </span>
                          </div>

                          <h4 style={{ fontSize: "1.08rem", color: "var(--h-ink)", margin: "0 0 4px" }}>
                            {f.name}
                          </h4>

                          <div style={{ fontSize: "0.85rem", color: "var(--h-muted)" }}>
                            🔴 {zCount || 2} Zoom Live · 🎥 {vCount || 2} {isSi ? "වීඩියෝ" : "Videos"} · 📄 {pCount || 2} PDFs
                          </div>
                        </div>

                        <div className="clean-row-act" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {f.zoomUrl && (
                            <a
                              href={f.zoomUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn ghost"
                              style={{ fontSize: "0.84rem", padding: "9px 14px" }}
                            >
                              🔴 {isSi ? "Zoom Live ↗" : "Join Zoom ↗"}
                            </a>
                          )}
                          <Link
                            href={`/dashboard?open=${f.id}`}
                            className="btn"
                            style={{ fontSize: "0.85rem", padding: "9px 18px" }}
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
                    padding: "20px",
                    borderRadius: "16px",
                    background: "var(--h-panel2)",
                    border: "1px dashed var(--h-gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "14px"
                  }}
                >
                  <div>
                    <h4 style={{ color: "var(--h-heading)", margin: "0 0 4px", fontSize: "1.02rem" }}>
                      {isSi
                        ? `ඔබ තවම ${studentGrade} ශ්‍රේණියේ මාසික පන්තියක් සක්‍රිය කරගෙන නොමැත`
                        : `You haven't activated a Grade ${studentGrade} monthly class yet`}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--h-muted)" }}>
                      {isSi
                        ? "රු. 2,000 මාසික පන්ති ගාස්තුව ගෙවා මේ මාසයේ සජීවී Zoom පන්ති, වීඩියෝ සහ PDF පේපර්ස් දැන්ම විවෘත කරගන්න."
                        : "Pay the Rs. 2,000 monthly fee to unlock this month's live Zoom classes, videos, and PDF papers."}
                    </p>
                  </div>
                  <Link href="/dashboard" className="btn" style={{ fontSize: "0.85rem", padding: "10px 18px" }}>
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
        <section className="clean-sec">
          <div className="clean-sec-head">
            <span className="clean-pill gold">
              🎓 {isSi ? "3, 4 සහ 5 ශ්‍රේණි සඳහා විශේෂිත මාසික පන්ති" : "Dedicated Monthly Classes for Grades 3, 4 & 5"}
            </span>
            <h2>
              {isSi ? "ශ්‍රේණි අනුව පන්ති විස්තර සහ කාලසටහන්" : "Complete Grade Details & Class Schedules"}
            </h2>
            <p>
              {isSi
                ? "ලියාපදිංචි වීමට පෙර 3, 4 සහ 5 ශ්‍රේණිවල පැවැත්වෙන පන්ති, ආවරණය වන විෂයයන් සහ Zoom සජීවී කාලසටහන් පරීක්ෂා කරන්න."
                : "Explore the curriculum, subjects, and live Zoom schedules for Grades 3, 4, and 5 before registering."}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
              gap: "16px",
              alignItems: "stretch"
            }}
          >
            {GRADE_DETAILS.map(g => {
              const gFolders = validFolders.filter(f => Number(f.grade) === g.grade);
              const curFolder = gFolders.find(f => f.isCurrentMonth) || gFolders[0];
              const isPrimaryGrade = g.grade === 5;

              return (
                <article
                  key={g.grade}
                  className="clean-card"
                  style={{
                    border: isPrimaryGrade ? "2px solid var(--h-gold)" : "1px solid var(--h-line)",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {/* Top Section */}
                  <div>
                    {/* 1. Compact Card Header Row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "10px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "10px",
                            background: isPrimaryGrade
                              ? "linear-gradient(135deg, #f5a623, #d97706)"
                              : "var(--h-gold-bg)",
                            color: isPrimaryGrade ? "#1a0800" : "var(--h-gold)",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 800,
                            fontSize: "1.1rem",
                            flexShrink: 0
                          }}
                        >
                          0{g.grade}
                        </div>
                        <div style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--h-heading)", lineHeight: 1.2 }}>
                          {isSi ? `${g.grade} ශ්‍රේණිය` : `Grade ${g.grade}`}
                        </div>
                      </div>

                      <span className={`clean-pill ${isPrimaryGrade ? "gold" : "sub"}`} style={{ fontSize: "0.72rem" }}>
                        {g.shortTag}
                      </span>
                    </div>

                    {/* 2. Compact Title & Subtitle */}
                    <div style={{ marginBottom: "10px" }}>
                      <h3 style={{ fontSize: "1.05rem", color: "var(--h-heading)", margin: "0 0 3px", lineHeight: 1.3 }}>
                        {g.title}
                      </h3>
                      <p style={{ fontSize: "0.82rem", color: "var(--h-muted)", margin: 0, lineHeight: 1.4 }}>
                        {g.subtitle}
                      </p>
                    </div>

                    {/* 3. Compact Schedule & Month Info Box */}
                    <div
                      style={{
                        background: "var(--h-panel2)",
                        border: "1px solid var(--h-line)",
                        borderRadius: "12px",
                        marginBottom: "12px",
                        overflow: "hidden",
                        fontSize: "0.8rem"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "7px 12px",
                          borderBottom: "1px solid var(--h-line)",
                          gap: "8px"
                        }}
                      >
                        <span style={{ color: "var(--h-muted)", fontWeight: 600 }}>
                          ⏰ {isSi ? "වේලාව" : "Time"}
                        </span>
                        <strong style={{ color: "var(--h-gold)", textAlign: "right" }}>
                          {g.scheduleShort}
                        </strong>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "7px 12px",
                          gap: "8px"
                        }}
                      >
                        <span style={{ color: "var(--h-muted)", fontWeight: 600 }}>
                          📅 {isSi ? "මාසය" : "Month"}
                        </span>
                        <strong style={{ color: "var(--h-green)", textAlign: "right" }}>
                          {curFolder ? curFolder.month : "2026 නොවැම්බර්"}
                        </strong>
                      </div>
                    </div>

                    {/* 4. Compact Feature Rows */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "14px" }}>
                      {g.features.slice(0, 2).map((feat, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "7px",
                            fontSize: "0.81rem",
                            color: "var(--h-ink)",
                            lineHeight: 1.35
                          }}
                        >
                          <span style={{ color: "var(--h-green)", fontWeight: 800 }}>✓</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. Compact Footer Bar: Monthly Fee + Register CTA */}
                  <div
                    style={{
                      paddingTop: "12px",
                      borderTop: "1px solid var(--h-line)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "auto"
                    }}
                  >
                    <div style={{ fontSize: "1.22rem", fontWeight: 800, color: "var(--h-gold)", lineHeight: 1.1 }}>
                      {isSi ? `රු. ${g.fee.toLocaleString()}` : `Rs. ${g.fee.toLocaleString()}`}
                      <span style={{ fontSize: "0.72rem", color: "var(--h-muted)", fontWeight: 600 }}> / මසකට</span>
                    </div>

                    <Link
                      href="/login?mode=reg"
                      className="btn"
                      style={{ fontSize: "0.82rem", padding: "8px 14px", whiteSpace: "nowrap" }}
                    >
                      {isSi ? `${g.grade} ශ්‍රේණියට එක්වන්න →` : `Join Grade ${g.grade} →`}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* AVAILABLE MONTHLY CLASSES LIST (CLEAN VERTICAL LIST)                 */}
      {/* ==================================================================== */}
      <section id="papers" className="clean-sec">
        <div className="clean-sec-head">
          <span className="clean-pill gold">
            📅 {isSi ? "මාසෙන් මාසෙට ක්‍රියාත්මක පන්ති" : "Month-by-Month Classes"}
          </span>
          <h2>
            {isStudent
              ? isSi
                ? `${studentGrade} ශ්‍රේණියේ මාසික පන්ති ලැයිස්තුව`
                : `Grade ${studentGrade} Monthly Classes List`
              : isSi
              ? "3, 4 සහ 5 ශ්‍රේණිවල මාසික පන්ති ලැයිස්තුව"
              : "Monthly Classes for Grades 3, 4 & 5"}
          </h2>
          <p>
            {isStudent
              ? isSi
                ? `ඔබගේ ${studentGrade} ශ්‍රේණියට අදාළව මේ මාසයේ සහ පසුගිය මාසවල පැවැත්වෙන සියලුම පන්ති පහතින් දැක්වේ.`
                : `Showing current and previous monthly classes tailored for Grade ${studentGrade}.`
              : isSi
              ? "රු. 2,000 මාසික ගාස්තුව ගෙවා ඕනෑම මාසයක සජීවී Zoom පන්ති, වීඩියෝ සහ PDF පේපර්ස් විවෘත කරගන්න."
              : "Pay Rs. 2,000 for any month to unlock its Zoom live classes, videos, and PDF papers."}
          </p>
        </div>

        {!isStudent && (
          <div className="chips" style={{ marginBottom: "20px" }}>
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
              gap: "16px",
              alignItems: "stretch"
            }}
          >
            {filteredFolders.map(f => {
              const status = getFolderStatus(f.id);
              const isUnlocked = status === "approved";
              const isPending = status === "pending";
              const mItems = S.items.filter(i => i.fid === f.id);
              const zCount = mItems.filter(i => i.type === "zoom").length + (f.zoomUrl ? 1 : 0);
              const vCount = mItems.filter(i => i.type === "video" || getYoutubeEmbedUrl(i.url)).length;
              const pCount = mItems.filter(i => i.type === "pdf").length;

              return (
                <article
                  key={f.id}
                  className="clean-card"
                  style={{
                    border: f.isCurrentMonth ? "2px solid var(--h-gold)" : "1px solid var(--h-line)",
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "14px",
                    background: f.isCurrentMonth
                      ? isLight
                        ? "linear-gradient(145deg, #fffdf9, #fff7e6)"
                        : "linear-gradient(145deg, rgba(245, 166, 35, 0.14), rgba(32, 11, 18, 0.95))"
                      : "var(--h-panel)"
                  }}
                >
                  <div>
                    {/* Top Row: Grade + Month + Status */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginBottom: "10px"
                      }}
                    >
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        <span className="clean-pill gold" style={{ fontSize: "0.74rem", padding: "3px 10px" }}>
                          🎓 {isSi ? `${f.grade} ශ්‍රේණිය` : `Grade ${f.grade}`}
                        </span>
                        <span className="clean-pill sub" style={{ fontSize: "0.74rem", padding: "3px 10px" }}>
                          📅 {f.month || (isSi ? "මාසික පන්තිය" : "Monthly")}
                        </span>
                      </div>

                      {f.isCurrentMonth ? (
                        <span className="clean-pill ok" style={{ fontSize: "0.72rem", padding: "3px 10px" }}>
                          🔥 {isSi ? "මේ මාසය" : "Current"}
                        </span>
                      ) : isStudent && isUnlocked ? (
                        <span className="clean-pill ok" style={{ fontSize: "0.72rem", padding: "3px 10px" }}>
                          ✓ {isSi ? "සක්‍රියයි" : "Active"}
                        </span>
                      ) : isStudent && isPending ? (
                        <span className="clean-pill gold" style={{ fontSize: "0.72rem", padding: "3px 10px" }}>
                          ⏳ {isSi ? "පරීක්ෂාවට" : "Pending"}
                        </span>
                      ) : null}
                    </div>

                    {/* Class Name */}
                    <h3
                      style={{
                        fontSize: "1.04rem",
                        color: "var(--h-heading)",
                        margin: "0 0 12px",
                        fontWeight: 700,
                        lineHeight: 1.4,
                        minHeight: "44px"
                      }}
                    >
                      {f.name}
                    </h3>

                    {/* Uniform 3-Item Resource Strip */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "6px",
                        background: "var(--h-panel2)",
                        border: "1px solid var(--h-line)",
                        borderRadius: "10px",
                        padding: "8px 10px",
                        textAlign: "center",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "var(--h-ink)"
                      }}
                    >
                      <div>🔴 {zCount || 2} Zoom</div>
                      <div style={{ borderLeft: "1px solid var(--h-line)", borderRight: "1px solid var(--h-line)" }}>
                        🎥 {vCount || 2} {isSi ? "වීඩියෝ" : "Videos"}
                      </div>
                      <div>📄 {pCount || 2} PDFs</div>
                    </div>
                  </div>

                  {/* Pinned Footer: Price + Action Button */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--h-line)"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "1.18rem", fontWeight: 800, color: "var(--h-gold)", lineHeight: 1.1 }}>
                        {isSi ? `රු. ${(f.price || 2000).toLocaleString()}` : `Rs. ${(f.price || 2000).toLocaleString()}`}
                      </div>
                      <small style={{ fontSize: "0.72rem", color: "var(--h-muted)", fontWeight: 600 }}>
                        {isUnlocked ? (isSi ? "✓ ගෙවා ඇත" : "✓ Paid") : (isSi ? "මාසික ගාස්තුව" : "Monthly fee")}
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
                        fontSize: "0.82rem",
                        padding: "8px 15px",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {isUnlocked
                        ? (isSi ? "පන්තියට යන්න →" : "Enter Class →")
                        : me
                        ? (isSi ? "සක්‍රිය කරගන්න →" : "Pay & Unlock →")
                        : (isSi ? "ලියාපදිංචි වන්න →" : "Register →")}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="clean-card" style={{ textAlign: "center", padding: "36px" }}>
            <p style={{ color: "var(--h-muted)" }}>{t("nofold")}</p>
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* 5 SUBJECTS COVERED SECTION                                           */}
      {/* ==================================================================== */}
      <section className="clean-sec">
        <div className="clean-sec-head">
          <h2>{t("subjectsTitle")}</h2>
          <p>{t("subjectsSub")}</p>
        </div>

        <div className="subjects-grid">
          {subjectsList.map(sub => (
            <div className="clean-card" key={sub.id} style={{ padding: "22px" }}>
              <div className="between" style={{ marginBottom: "10px" }}>
                <span style={{ fontSize: "2rem" }}>{sub.icon}</span>
                <span className="clean-pill gold">{sub.badge}</span>
              </div>
              <h3 style={{ color: "var(--h-heading)", fontSize: "1.2rem", marginBottom: "6px" }}>
                {t(sub.titleKey)}
              </h3>
              <p style={{ color: "var(--h-muted)", fontSize: "0.9rem", margin: 0 }}>
                {t(sub.descKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* WHY CHOOSE OUR 190+ CLASS SECTION                                    */}
      {/* ==================================================================== */}
      <section className="clean-sec">
        <div className="clean-sec-head">
          <h2>{t("whyTitle")}</h2>
          <p>{t("whySub")}</p>
        </div>

        <div className="features-grid">
          {highlights.map((h, idx) => (
            <div className="clean-card" key={idx} style={{ padding: "22px" }}>
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "12px",
                  background: "var(--h-gold-bg)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "1.4rem",
                  marginBottom: "12px"
                }}
              >
                {h.icon}
              </div>
              <h3 style={{ color: "var(--h-heading)", fontSize: "1.15rem", marginBottom: "6px" }}>
                {t(h.titleKey)}
              </h3>
              <p style={{ color: "var(--h-muted)", fontSize: "0.88rem", margin: 0 }}>
                {t(h.descKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* DAILY WORKFLOW & FREE SAMPLE VIDEO                                   */}
      {/* ==================================================================== */}
      <section className="clean-card clean-sec">
        <div className="clean-sec-head" style={{ marginBottom: "22px" }}>
          <h2>{t("flowTitle")}</h2>
          <p>{t("flowSub")}</p>
        </div>

        <div className="flow-steps">
          {[1, 2, 3, 4].map(n => (
            <div
              key={n}
              style={{
                background: "var(--h-panel2)",
                border: "1px solid var(--h-line)",
                borderRadius: "16px",
                padding: "18px"
              }}
            >
              <span className="clean-pill gold" style={{ marginBottom: "8px" }}>
                {isSi ? `පියවර 0${n}` : `Step 0${n}`}
              </span>
              <h4 style={{ color: "var(--h-heading)", fontSize: "1.05rem", margin: "4px 0 6px" }}>
                {t(`step${n}`)}
              </h4>
              <p style={{ color: "var(--h-muted)", fontSize: "0.86rem", margin: 0 }}>
                {t(`step${n}Desc`)}
              </p>
            </div>
          ))}
        </div>

        {sampleVideo && (
          <div
            style={{
              marginTop: "28px",
              padding: "24px",
              background: "var(--h-panel2)",
              borderRadius: "18px",
              border: "1px solid var(--h-line)"
            }}
          >
            {/* Official YouTube Channel Header Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                paddingBottom: "14px",
                borderBottom: "1px solid var(--h-line)",
                flexWrap: "wrap",
                gap: "12px"
              }}
            >
              <div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "6px" }}>
                  <span
                    className="clean-pill"
                    style={{ background: "rgba(239, 68, 68, 0.16)", color: "#ef4444", fontWeight: 800 }}
                  >
                    ▶️ නිල YouTube නාලිකාව · පහ දිනන හපන්නු
                  </span>
                  <span className="clean-pill ok">
                    ✓ {isSi ? "වෙබ් අඩවිය තුළම නොමිලේ නරඹන්න" : "Watch Free Directly on Site"}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: "1.3rem", color: "var(--h-heading)" }}>
                  {isSi
                    ? "190+ පේපර් පන්තියේ නිල YouTube වීඩියෝ සාකච්ඡා"
                    : "Official 190+ Paper Class YouTube Video Discussions"}
                </h3>
              </div>

              <a
                href="https://www.youtube.com/channel/UC3jTXU81jF9PfmO_PBi99ug?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff",
                  padding: "9px 18px",
                  fontSize: "0.85rem",
                  boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)"
                }}
              >
                🔔 {isSi ? "YouTube නාලිකාව Subscribe කරන්න ↗" : "Subscribe on YouTube ↗"}
              </a>
            </div>

            {/* Grid of Official YouTube Channel Videos (BbZdfLXfW9A, murCwFZRlJo, and latest channel uploads) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "20px"
              }}
            >
              {channelVideos.map((vid) => (
                <div
                  key={vid.videoId || vid.url}
                  style={{
                    background: "var(--h-panel)",
                    border: "1px solid var(--h-line)",
                    borderRadius: "16px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "12px"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span className="clean-pill gold">
                        🎥 {vid.subject || (isSi ? "190+ පේපර් විවරණය" : "190+ Paper Discussion")}
                      </span>
                      <a
                        href={vid.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "0.78rem", color: "var(--h-gold)", fontWeight: 700 }}
                      >
                        YouTube ↗
                      </a>
                    </div>
                    <h4 style={{ margin: "0 0 10px", fontSize: "1.05rem", color: "var(--h-heading)", lineHeight: 1.4 }}>
                      {vid.title}
                    </h4>
                  </div>

                  <VideoPlayer url={vid.url} title={vid.title} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* PARENT REVIEWS & FEEDBACK                                            */}
      {/* ==================================================================== */}
      <section className="clean-sec">
        <div className="clean-sec-head">
          <h2>{t("parentReviewsTitle")}</h2>
          <p>{isSi ? "දරුවන්ගේ වේගය හා දැනුම වැඩිවූ දෙමාපියන්ගේ සත්‍ය අත්දැකීම්" : "Real feedback from parents of our top-scoring scholarship students"}</p>
        </div>

        <div className="reviews-grid">
          {[1, 2, 3].map(n => (
            <div key={n} className="clean-card" style={{ padding: "22px" }}>
              <p style={{ color: "var(--h-ink)", fontStyle: "italic", margin: "0 0 12px", fontSize: "0.92rem" }}>
                {t(`r${n}`)}
              </p>
              <div style={{ color: "var(--h-gold)", fontWeight: 700, fontSize: "0.86rem" }}>
                {t(`r${n}Author`)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* BOTTOM CTA BANNER                                                    */}
      {/* ==================================================================== */}
      <section
        className="clean-card"
        style={{
          border: "2px solid var(--h-gold)",
          textAlign: "center",
          padding: "36px 24px",
          marginTop: "36px"
        }}
      >
        <h2 style={{ fontSize: "1.75rem", color: "var(--h-heading)", marginBottom: "10px" }}>
          {isStudent
            ? isSi
              ? `${me.name}, අදම ඔබේ ${studentGrade} ශ්‍රේණියේ පේපර් පුහුණුව ආරම්භ කරමු!`
              : `Ready to continue your Grade ${studentGrade} practice, ${me.name}?`
            : isSi
            ? "ඔබේ දරුවාත් ශිෂ්‍යත්වයෙන් 190+ ලකුණු මට්ටමට ගෙන යන්න සූදානම්ද?"
            : "Ready to guide your child to 190+ Scholarship Excellence?"}
        </h2>
        <p style={{ color: "var(--h-muted)", maxWidth: "600px", margin: "0 auto 20px", fontSize: "0.98rem" }}>
          {isSi
            ? "පහ දිනන හපන්නු 190+ පේපර් පන්තිය හා එක්වී දිනකට පළාත් පේපර් 2ක් විසඳීමේ වේගය හා සියලුම විෂයයන්ගේ සවිස්තර දැනුම අදම ලබා දෙන්න!"
            : "Join Paha Dinana Hapannu 190+ Paper Class today for daily provincial paper discussions and live Zoom sessions!"}
        </p>
        <div className="cta-row" style={{ marginBottom: 0 }}>
          {me ? (
            <Link className="btn" href={me.admin ? "/admin" : "/dashboard"}>
              🚀 {isSi ? "ශිෂ්‍ය පුවරුවට පිවිසෙන්න" : "Go to Student Dashboard"}
            </Link>
          ) : (
            <Link className="btn" href="/login?mode=reg">
              ✍️ {isSi ? "දැන්ම ලියාපදිංචි වන්න" : "Register Now"}
            </Link>
          )}
          <a
            className="btn whatsapp-btn"
            href={`https://wa.me/${(S.set?.hotline || "94771234567").replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 {isSi ? "WhatsApp ඔස්සේ සම්බන්ධ වන්න" : "Contact via WhatsApp"}
          </a>
        </div>
      </section>
    </main>
  );
}
