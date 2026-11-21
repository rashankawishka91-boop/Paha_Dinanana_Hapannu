"use client";
import Link from "next/link";
import { useState } from "react";
import { useApp, getYoutubeEmbedUrl } from "../lib/Provider";
import VideoPlayer from "../components/VideoPlayer";

export default function Home() {
  const { S, t, me, lang } = useApp();
  const [selectedGrade, setSelectedGrade] = useState(5);
  const isSi = lang === "si";

  const sampleVideo = S.items.find(i => (i.type === "video" || getYoutubeEmbedUrl(i.url)) && i.url);

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
    {
      icon: "⚡",
      titleKey: "h1Title",
      descKey: "h1Desc"
    },
    {
      icon: "📑",
      titleKey: "h2Title",
      descKey: "h2Desc"
    },
    {
      icon: "🔍",
      titleKey: "h3Title",
      descKey: "h3Desc"
    },
    {
      icon: "🏆",
      titleKey: "h4Title",
      descKey: "h4Desc"
    }
  ];

  const filteredFolders = S.folders.filter(f => f.grade === selectedGrade);

  return (
    <main className="wrap">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-pill-badge">{t("badgeTarget")}</div>

        {/* Centered Logo with Glowing Ring */}
        <div className="logo-wrap" style={{ display: "block", margin: "0 auto 24px" }}>
          <img
            className="logo"
            src={S.set.logo || "/logo.jpg"}
            alt={S.set.name}
          />
        </div>

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

        <div className="cta-row">
          {me ? (
            <Link className="btn" href={me.admin ? "/admin" : "/dashboard"}>
              🚀 {t(me.admin ? "adminPanel" : "dashboard")} වෙත පිවිසෙන්න
            </Link>
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
            href="https://wa.me/94771234567"
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 WhatsApp විමසීම්
          </a>
        </div>

        {/* Hero Visual Imagery Showcase */}
        <div className="hero-visual-showcase">
          <div className="visual-image-card">
            <img src="/trophy-190.svg" alt="190+ Trophy" />
            <h4 style={{ color: "var(--gold)", margin: "6px 0 2px" }}>190+ ඉලක්කගත විශේෂ පුහුණුව</h4>
            <p className="mut" style={{ fontSize: "0.85rem", margin: 0 }}>
              දිස්ත්‍රික් ප්‍රථමයින් හා විශිෂ්ට සාමාර්ථ දහස් ගණනක් බිහි කළ ක්‍රමවේදය
            </p>
          </div>
          <div className="visual-image-card">
            <img src="/exam-paper.svg" alt="Provincial Exam Paper" />
            <h4 style={{ color: "var(--gold)", margin: "6px 0 2px" }}>දිනකට පළාත් පේපර් 2ක්</h4>
            <p className="mut" style={{ fontSize: "0.85rem", margin: 0 }}>
              සෑම ප්‍රශ්නයකටම සවිස්තරාත්මක විවරණ සහිත පූර්ණ සාකච්ඡාව
            </p>
          </div>
        </div>
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
                {isSi ? "ප්‍රශ්න පත්‍ර බලන්න ↓" : "Explore Papers ↓"}
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

      {/* Available Paper Bundles Explorer */}
      <section id="papers" style={{ margin: "50px 0" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "2rem" }}>{t("papers")}</h2>
          <p className="mut">{isSi ? "දරුවාගේ ශ්‍රේණිය තෝරා පේපර් කට්ටල පරීක්ෂා කරන්න" : "Choose your grade to explore paper bundles"}</p>
        </div>

        <div className="chips">
          {[5, 4, 3, 2, 1].map(g => (
            <button
              key={g}
              type="button"
              className={`chip ${selectedGrade === g ? "active" : ""}`}
              onClick={() => setSelectedGrade(g)}
            >
              {isSi ? `${g} ශ්‍රේණිය ${g === 5 ? "🔥 (190+ විශේෂ)" : ""}` : `Grade ${g} ${g === 5 ? "🔥 (190+ Target)" : ""}`}
            </button>
          ))}
        </div>

        {filteredFolders.length ? (
          <div className="folder-grid">
            {filteredFolders.map(f => (
              <div className="folder-card" key={f.id}>
                <div>
                  <div className="folder-card-top">
                    <span className="icon-box">📚</span>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                      {f.category && (
                        <span className="tag" style={{ background: "rgba(245, 166, 35, 0.2)", color: "var(--gold)", fontSize: "0.72rem", padding: "3px 8px" }}>
                          {f.category}
                        </span>
                      )}
                      <span className="paper-count-pill">
                        {f.papersCount || (isSi ? "දිනකට පේපර් 2ක්" : "2 Papers Daily")}
                      </span>
                    </div>
                  </div>
                  <h3>{f.name}</h3>
                  <p className="sub-tags">
                    🎯 {isSi ? "ආවරණය:" : "Subjects:"} {f.subjects || (isSi ? "විෂයයන් 5ම සම්පූර්ණයෙන්ම" : "All 5 Subjects")}
                  </p>
                  {f.desc && (
                    <p style={{ fontSize: "0.82rem", color: "#cbd5e1", margin: "4px 0 10px 0", lineHeight: 1.5 }}>
                      {f.desc}
                    </p>
                  )}
                </div>
                <div className="folder-card-bottom">
                  <div className="folder-price">
                    {isSi ? `රු. ${f.price}` : `Rs. ${f.price}`}
                  </div>
                  <Link
                    href={me ? (me.admin ? "/admin" : "/dashboard") : "/login?mode=reg"}
                    className="btn"
                    style={{ fontSize: "0.85rem", padding: "8px 16px" }}
                  >
                    {me ? t("open") : t("pay")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: "40px" }}>
            <p className="mut">{t("nofold")}</p>
          </div>
        )}
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
          ඔබේ දරුවාත් ශිෂ්‍යත්වයෙන් 190+ ලකුණු මට්ටමට ගෙන යන්න සූදානම්ද?
        </h2>
        <p className="mut" style={{ maxWidth: "600px", margin: "0 auto 20px", fontSize: "1rem" }}>
          පහ දිනන හපන්නු 190+ පේපර් පන්තිය හා එක්වී දිනකට පළාත් පේපර් 2ක් විසඳීමේ වේගය හා සියලුම විෂයයන්ගේ සවිස්තර දැනුම අදම ලබා දෙන්න!
        </p>
        <div className="cta-row" style={{ marginBottom: 0 }}>
          <Link className="btn" href="/login?mode=reg">
            ✍️ දැන්ම ලියාපදිංචි වන්න
          </Link>
          <a
            className="btn whatsapp-btn"
            href="https://wa.me/94771234567"
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
