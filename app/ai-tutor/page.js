"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useApp, getYoutubeEmbedUrl } from "../../lib/Provider";

// Formatter component for cleanly structured teacher responses with Markdown Tables
function FormattedMessage({ content, isSi = true }) {
  if (!content) return null;

  const syllabusMatch = content.match(/##\s*📘\s*1\.\s*විෂය නිර්දේශය[^\n]*\n([\s\S]*?)(?=(##\s*💡|$))/i);
  const extraMatch = content.match(/##\s*💡\s*2\.\s*අමතර දැනුම[^\n]*\n([\s\S]*?)$/i);

  if (syllabusMatch || extraMatch) {
    const introText = content.split(/##\s*📘/)[0].trim();
    const syllabusText = syllabusMatch ? syllabusMatch[1].trim() : "";
    const extraText = extraMatch ? extraMatch[1].trim() : "";

    return (
      <div className="ai-structured-msg">
        {introText && (
          <div className="ai-intro-block" style={{ marginBottom: 10 }}>
            {renderBlocks(introText)}
          </div>
        )}

        {syllabusText && (
          <div className="ai-section-card ai-syllabus-card">
            <div className="ai-syllabus-header">
              <span>📘</span>
              <span>{isSi ? "1. විෂය නිර්දේශය හා ගුරු මාර්ගෝපදේශය අනුව" : "1. Official Syllabus & NIE Teacher Guide"}</span>
            </div>
            <div className="ai-syllabus-body">
              {renderBlocks(syllabusText)}
            </div>
          </div>
        )}

        {extraText && (
          <div className="ai-section-card ai-extra-card">
            <div className="ai-extra-header">
              <span>💡</span>
              <span>{isSi ? "2. අමතර දැනුම සහ 190+ විභාග රහස්" : "2. Extra Knowledge & 190+ Exam Secrets"}</span>
            </div>
            <div className="ai-extra-body">
              {renderBlocks(extraText)}
            </div>
          </div>
        )}
      </div>
    );
  }

  return <div>{renderBlocks(content)}</div>;
}

function renderTable(tableLines, key) {
  const cleanLines = tableLines.filter((l) => l.trim().length > 0);
  if (cleanLines.length === 0) return null;

  const parseRow = (line) => {
    let cells = line.split("|").map((c) => c.trim());
    if (line.trim().startsWith("|")) cells.shift();
    if (line.trim().endsWith("|")) cells.pop();
    return cells;
  };

  const headerCells = parseRow(cleanLines[0]);
  let bodyRows = [];
  let startIndex = 1;

  if (cleanLines.length > 1 && /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(cleanLines[1].trim())) {
    startIndex = 2;
  }

  for (let r = startIndex; r < cleanLines.length; r++) {
    const row = cleanLines[r].trim();
    if (!row) continue;
    if (/^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(row)) continue;
    bodyRows.push(parseRow(row));
  }

  return (
    <div key={key} className="ai-table-wrap">
      <table className="ai-chat-table">
        <thead>
          <tr>
            {headerCells.map((cell, cIdx) => (
              <th key={cIdx}>{parseBold(cell)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td key={cIdx}>{parseBold(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderBlocks(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const blocks = [];
  let currentTable = null;

  const flushTable = () => {
    if (currentTable) {
      if (currentTable.length >= 2) {
        blocks.push({ type: "table", lines: currentTable });
      } else {
        currentTable.forEach((line) => blocks.push({ type: "p", text: line }));
      }
      currentTable = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    const pipeCount = (trimmed.match(/\|/g) || []).length;
    const isTableRow = trimmed.includes("|") && (trimmed.startsWith("|") || pipeCount >= 2);

    if (isTableRow) {
      if (!currentTable) {
        currentTable = [];
      }
      currentTable.push(trimmed);
      continue;
    } else {
      flushTable();
    }

    if (!trimmed) {
      blocks.push({ type: "spacer" });
      continue;
    }

    // Check if line contains a YouTube URL
    const ytInLine = getYoutubeEmbedUrl(trimmed);
    if (ytInLine) {
      blocks.push({ type: "video", url: ytInLine, text: rawLine });
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: trimmed.slice(4) });
    } else if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3) });
    } else if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h2", text: trimmed.slice(2) });
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      blocks.push({ type: "bullet", text: trimmed.slice(2) });
    } else {
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        blocks.push({ type: "num", num: numMatch[1], text: numMatch[2] });
      } else {
        blocks.push({ type: "p", text: rawLine });
      }
    }
  }

  flushTable();

  return blocks.map((block, idx) => {
    if (block.type === "video") {
      return (
        <div key={idx} style={{ margin: "10px 0" }}>
          {block.text && !block.text.startsWith("http") && (
            <p className="ai-msg-p" style={{ marginBottom: "6px" }}>{parseBold(block.text)}</p>
          )}
          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "10px", background: "#000", border: "1px solid rgba(245, 166, 35, 0.3)" }}>
            <iframe
              src={block.url}
              allowFullScreen
              title="YouTube Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        </div>
      );
    }
    if (block.type === "table") {
      return renderTable(block.lines, idx);
    }
    if (block.type === "spacer") {
      return <div key={idx} style={{ height: 6 }} />;
    }
    if (block.type === "h2") {
      return (
        <h3 key={idx} className="ai-msg-h2" style={{ color: "#1e3a8a" }}>
          {parseBold(block.text)}
        </h3>
      );
    }
    if (block.type === "h3") {
      return (
        <h4 key={idx} className="ai-msg-h3" style={{ color: "#1e3a8a" }}>
          {parseBold(block.text)}
        </h4>
      );
    }
    if (block.type === "bullet") {
      return (
        <div key={idx} className="ai-bullet-item">
          <span className="ai-bullet-dot">•</span>
          <span style={{ flex: 1 }}>{parseBold(block.text)}</span>
        </div>
      );
    }
    if (block.type === "num") {
      return (
        <div key={idx} className="ai-bullet-item">
          <span className="ai-bullet-num" style={{ color: "#0284c7" }}>{block.num}.</span>
          <span style={{ flex: 1 }}>{parseBold(block.text)}</span>
        </div>
      );
    }
    return (
      <p key={idx} className="ai-msg-p">
        {parseBold(block.text)}
      </p>
    );
  });
}

function parseBold(text) {
  if (typeof text !== "string") return text;
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((p, idx) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={idx}>{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code
          key={idx}
          style={{
            background: "rgba(37, 99, 235, 0.08)",
            padding: "1px 5px",
            borderRadius: "4px",
            fontFamily: "monospace",
            fontSize: "0.9em",
            color: "#1d4ed8",
          }}
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    return p;
  });
}

export default function AiTutorPage() {
  const { lang, toggleLang, t } = useApp();
  const isSi = lang === "si";
  const [selectedTheme, setSelectedTheme] = useState(1);
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'curriculum' | 'tamil' | 'aboe'
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatLang, setChatLang] = useState("si");
  const [chatLog, setChatLog] = useState([
    {
      role: "assistant",
      content:
        "👋 ආයුබෝවන්! මම **පහ දිනන හපන්නු 190+ AI ගුරු සහයක**. \n\nශ්‍රී ලංකා ජාතික අධ්‍යාපන ආයතනයේ (NIE) 5 ශ්‍රේණිය **පොදු ගුරු මාර්ගෝපදේශය** (Teacher's Guide) පදනම් කරගත් නිල AI උපදේශකයා මමයි. පරිසරය තේමා 16, ඉංග්‍රීසි (ABOE) සහ දෙමළ 1-19 සංවාද පිළිබඳ ඕනෑම ගැටළුවක් සිංහල, English හෝ தமிழ் බසින් විමසන්න!",
    },
  ]);

  const themes = [
    { id: 1, title: "අපේ යහපැවැත්ම", en: "Our Good Behaviour", ta: "எமது நன்னடத்தை", desc: "යහපත් පුරුදු, සිත පහන් කිරීමේ අභ්‍යාස, අවශ්‍යතා සහ උවමනා, ආචාරශීලී කතාබහ" },
    { id: 2, title: "අපි ලක් වැසියෝ", en: "We Sri Lankans", ta: "நாம் இலங்கையர்", desc: "ජාතික සංකේත (කොඩිය, ගීය, ලාංඡනය), ජාතික වීරයන් (ගොංගාලේගොඩ බණ්ඩා, කැප්පෙටිපොළ), සහජීවනය" },
    { id: 3, title: "පැළෑටි හා ගස්වැල්", en: "Plants & Trees", ta: "தாவரங்களும் மரங்களும்", desc: "ශාක කොටස්, මුල් පද්ධති, පත්‍ර, බීජ හා ඵල ව්‍යාප්ති ක්‍රම, ලංකාවට ආවේණික ශාක" },
    { id: 4, title: "අප අවට සත්තු", en: "Animals Around Us", ta: "எம்மைச் சூழவுள்ள விலங்குகள்", desc: "ශාක භක්ෂක, මාංශ භක්ෂක, සර්ව භක්ෂක, හැඩගැසීම්, ආවේණික සතුන් (වලි කුකුළා, කළු වඳුරා)" },
    { id: 5, title: "අප පරිහරණය කරන දේ", en: "Things We Use", ta: "நாம் பயன்படுத்தும் பொருட்கள்", desc: "උපකරණ භාවිතය, ආරක්ෂාව, පාරිභෝගික අයිතිවාසිකම්, පොදු දේපළ රැකගැනීම" },
    { id: 6, title: "අපේ ආහාර", en: "Our Food", ta: "எமது உணவு", desc: "සමබල ආහාර, විටමින් A, B, C, D, යකඩ, කැල්සියම්, අයඩීන් ඌනතා රෝග, ආහාර සුරක්ෂිතතාව" },
    { id: 7, title: "ආරක්ෂාව හා පරිස්සම", en: "Safety & Care", ta: "பாதுகாப்பும் அவதானமும்", desc: "අකුණු අනතුරු, පිළිස්සුම් හා තුවාල ප්‍රථමාධාර, හදිසි අංක (119, 1929, 1990), ඩෙංගු මර්දනය" },
    { id: 8, title: "ජලය", en: "Water", ta: "நீர்", desc: "ලෝක ජල ව්‍යාප්තිය (1% මිරිදිය), බිත්තර ඝනත්ව පරීක්ෂණය, ජල පීඩනය, ජල පෙරණ, ආගමික සිරිත්" },
    { id: 9, title: "වැඩ පහසු කිරීමේ මං", en: "Ways of Making Work Easy", ta: "வேலையை எளிதாக்கும் வழிகள்", desc: "සරල යන්ත්‍ර (ආනත තලය, කප්පිය, දණ්ඩ හා රෝදය, විද්‍යුත් චුම්බකය, දැති රෝද)" },
    { id: 10, title: "ගෙවත්ත", en: "Home Garden", ta: "வீட்டுத் தோட்டம்", desc: "3R සංකල්පය (Reduce, Reuse, Recycle), එල්ලෙන බෝතල් වගාව, හිතකර හා අහිතකර සතුන්, නවදැලි හේන" },
    { id: 11, title: "ගමනාගමනය", en: "Transport", ta: "போக்குவரத்து", desc: "මාර්ග නීති, මාර්ග සංඥා (රතු, කහ, කොළ), පදික මාරු, වරාය සහ ගුවන් තොටුපළවල්" },
    { id: 12, title: "මිනිස් හැසිරීම්", en: "Human Behaviour", ta: "மனித நடத்தை", desc: "මූලික අවශ්‍යතා සහ උවමනා, සාමකාමී පැවැත්ම, අන්‍යෝන්‍ය ගෞරවය, කණ්ඩායම් හැඟීම" },
    { id: 13, title: "පොළොව හා අහස", en: "Earth & Sky", ta: "பூமியும் வானமும்", desc: "පාංශු ඛාදනය වැළැක්වීම, සූර්යයා, පෘථිවිය, චන්ද්‍රයා, ග්‍රහණ, තාරකා රටා (දඩයක්කාරයා)" },
    { id: 14, title: "අපට කළ හැකි වෙනස්කම්", en: "Changes We Can Do", ta: "நாம் செய்யக்கூடிய மாற்றங்கள்", desc: "කසළ කළමනාකරණය, අසරණයන්ට පිහිට වීම, පරිසරය සුරැකීමේ ධනාත්මක පුරුදු" },
    { id: 15, title: "මිනිසා හා තොරතුරු", en: "Man & Information", ta: "மனிதனும் தகவலும்", desc: "සන්නිවේදන පරිණාමය, අන්තර්ජාතික සම්මත සංකේත (ආබාධිත, ගුවන් තොටුපළ), තිර කාල අවදානම්" },
    { id: 16, title: "අපේ අතීත විත්ති", en: "Our Past", ta: "எமது கடந்த காலம்", desc: "පණ්ඩුකාභය, දේවානම්පියතිස්ස, එළාර, දුටුගැමුණු රජවරුන්, අභය වැව, රුවන්වැලිසෑය, චක්ගුඩු ක්‍රීඩාව" },
  ];

  const handleAskTutor = async (customPrompt = null) => {
    const q = customPrompt || chatInput.trim();
    if (!q || chatLoading) return;

    const userEntry = { role: "user", content: q };
    const updated = [...chatLog, userEntry];
    setChatLog(updated);
    if (!customPrompt) setChatInput("");
    setChatLoading(true);

    try {
      const customApiKey =
        typeof window !== "undefined"
          ? localStorage.getItem("hapannu_api_key") || undefined
          : undefined;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated,
          language: chatLang,
          customApiKey,
        }),
      });
      const data = await res.json();
      setChatLog((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "කරුණාකර නැවත උත්සාහ කරන්න.",
        },
      ]);
    } catch (e) {
      setChatLog((prev) => [
        ...prev,
        { role: "assistant", content: "තාක්ෂණික දෝෂයක්. කරුණාකර නැවත උත්සාහ කරන්න." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const selectedThemeObj = themes.find((t) => t.id === selectedTheme) || themes[0];

  return (
    <main className="ai-page-wrap">
      {/* Page Hero */}
      <section className="ai-page-hero">
        <div className="hero-badge" style={{ margin: "0 auto 14px auto" }}>
          🤖 NIE නිල 5 ශ්‍රේණිය පොදු ගුරු මාර්ගෝපදේශය පාදක කරගත් AI පද්ධතිය
        </div>
        <h1 className="hero-title" style={{ fontSize: "2.5rem" }}>
          190+ AI ගුරු සහයක Learning Hub
        </h1>
        <p className="hero-desc" style={{ maxWidth: 780, margin: "0 auto 20px auto" }}>
          පරිසරය තේමා 16, ඉංග්‍රීසි (ABOE) සහ දෙමළ 1-19 සංවාද ආවරණය වන, ශිෂ්‍යත්ව දරුවන්ගේ වේගය හා දැනුම හදන බුද්ධිමත්
          AI අධ්‍යාපන සහයකයා.
        </p>

        {/* Tab switcher */}
        <div className="ai-tabs-bar">
          <button
            className={`ai-tab-pill ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            💬 AI සමඟ සාකච්ඡා කරන්න
          </button>
          <button
            className={`ai-tab-pill ${activeTab === "curriculum" ? "active" : ""}`}
            onClick={() => setActiveTab("curriculum")}
          >
            📚 පරිසරය තේමා 16 සාරාංශය
          </button>
          <button
            className={`ai-tab-pill ${activeTab === "tamil" ? "active" : ""}`}
            onClick={() => setActiveTab("tamil")}
          >
            🗣️ දෙමළ සංවාද 1-19
          </button>
          <button
            className={`ai-tab-pill ${activeTab === "aboe" ? "active" : ""}`}
            onClick={() => setActiveTab("aboe")}
          >
            🔤 English ABOE
          </button>
        </div>
      </section>

      {/* Main Tab View */}
      <div className="ai-page-body container">
        {activeTab === "chat" && (
          <div className="ai-fullscreen-chat">
            <div className="ai-chat-topbar">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src="/teacher-face.jpg"
                  alt="190+ AI Tutor"
                  style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #e9a23b", flexShrink: 0 }}
                />
                <div>
                  <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.1rem" }}>
                    ශිෂ්‍යත්ව 190+ AI සජීවී ගුරු සහයක
                  </h3>
                  <small style={{ color: "#64748b" }}>
                    භාෂාව තෝරන්න (Select Language):
                  </small>
                </div>
              </div>

              <div className="ai-lang-pills">
                <button
                  type="button"
                  className={`ai-lang-btn ${chatLang === "si" ? "active" : ""}`}
                  onClick={() => setChatLang("si")}
                >
                  🇱🇰 සිංහල
                </button>
                <button
                  type="button"
                  className={`ai-lang-btn ${chatLang === "en" ? "active" : ""}`}
                  onClick={() => setChatLang("en")}
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  className={`ai-lang-btn ${chatLang === "ta" ? "active" : ""}`}
                  onClick={() => setChatLang("ta")}
                >
                  🇮🇳 தமிழ்
                </button>
              </div>
            </div>

            {/* Quick Prompts Bar */}
            <div className="ai-page-quick-prompts">
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b", alignSelf: "center" }}>
                ඉක්මන් ප්‍රශ්න:
              </span>
              <button
                className="ai-chip"
                onClick={() =>
                  handleAskTutor(
                    chatLang === "ta"
                      ? "பண்டுRelease மன்னனின் சாதனைகள் மற்றும் அபய வாவியை விளக்குக."
                      : chatLang === "en"
                      ? "Explain King Pandukabhaya, Abhaya Wewa and Anuradhapura city planning."
                      : "පණ්ඩුකාභය රජතුමා අභය වැව ඉදිකිරීම හා අනුරාධපුර නගර සැලසුම්කරණය ගැන කියා දෙන්න."
                  )
                }
              >
                👑 පණ්ඩුකාභය රජතුමා
              </button>
              <button
                className="ai-chip"
                onClick={() =>
                  handleAskTutor(
                    chatLang === "ta"
                      ? "முட்டை அடர்த்தி பரிசோதனை பற்றி விளக்குக."
                      : chatLang === "en"
                      ? "How does the egg water density experiment work?"
                      : "ජල ඝනත්වය සහ ලුණු දියරයේ බිත්තරය පාවීමේ පරීක්ෂණය පැහැදිලි කරන්න."
                  )
                }
              >
                💧 බිත්තර ඝනත්ව පරීක්ෂණය
              </button>
              <button
                className="ai-chip"
                onClick={() =>
                  handleAskTutor(
                    chatLang === "ta"
                      ? "விற்றமின் A, B, C, D குறைபாட்டினால் ஏற்படும் நோய்கள் எவை?"
                      : chatLang === "en"
                      ? "What diseases are caused by Vitamin A, B, C, and D deficiencies?"
                      : "විටමින් A, B, C, D සහ යකඩ ඌනතාවයෙන් වැළඳෙන රෝග මොනවාද?"
                  )
                }
              >
                🥗 විටමින් ඌනතා රෝග
              </button>
              <button
                className="ai-chip"
                onClick={() =>
                  handleAskTutor(
                    chatLang === "ta"
                      ? "தரம் 5 ஆசிரியர் வழிகாட்டியில் உள்ள எண்கள் 16-20 மற்றும் திசைகளை தமிழில் தருக."
                      : chatLang === "en"
                      ? "Teach me Tamil numbers 16-20 and location words like ಮೇಲೆ, கீழே."
                      : "දෙමළ භාෂාවෙන් 16-20 ඉලක්කම් සහ மேலே, கீழே, உள்ளේ, வெளியே යන ස්ථාන වචන කියා දෙන්න."
                  )
                }
              >
                🗣️ දෙමළ 16-20 & දිශා
              </button>
              <button
                className="ai-chip"
                onClick={() =>
                  handleAskTutor(
                    chatLang === "ta"
                      ? "5ம் ஆண்டு புலமைப்பரிசில் வினாத்தாளிலிருந்து எனக்கு ஒரு மாதிரி வினாவைத் தாருங்கள்!"
                      : chatLang === "en"
                      ? "Ask me a challenging Grade 5 scholarship multiple-choice question from Environmental Studies!"
                      : "පරිසරය විෂයෙන් මට ශිෂ්‍යත්ව ආදර්ශ බහුවරණ ප්‍රශ්නයක් දෙන්න. මම පිළිතුරු දෙන්නම්!"
                  )
                }
              >
                ❓ ආදර්ශ ප්‍රශ්නයක් අහන්න
              </button>
            </div>

            {/* Messages Log */}
            <div className="ai-page-chat-log">
              {chatLog.map((m, i) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={i}
                    className={`ai-msg-row ${isUser ? "ai-msg-user" : "ai-msg-bot"}`}
                  >
                    {!isUser && (
                      <div className="ai-msg-avatar" style={{ overflow: "hidden", padding: 0 }}>
                        <img
                          src="/teacher-face.jpg"
                          alt="Teacher"
                          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                        />
                      </div>
                    )}
                    <div className="ai-msg-bubble">
                      <div className="ai-msg-content">
                        <FormattedMessage content={m.content} isSi={isSi} />
                      </div>
                    </div>
                    {isUser && (
                      <div className="ai-msg-avatar ai-user-avatar">
                        <span>👤</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {chatLoading && (
                <div className="ai-msg-row ai-msg-bot">
                  <div className="ai-msg-avatar" style={{ overflow: "hidden", padding: 0 }}>
                    <img
                      src="/teacher-face.jpg"
                      alt="Teacher"
                      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                    />
                  </div>
                  <div className="ai-msg-bubble ai-loading-bubble">
                    <span className="ai-typing-dot" />
                    <span className="ai-typing-dot" />
                    <span className="ai-typing-dot" />
                    <span style={{ marginLeft: 8, fontSize: "0.85rem", color: "#64748b" }}>
                      ගුරු මාර්ගෝපදේශය කියවමින් පිළිතුර සකසයි...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="ai-page-input-bar">
              <textarea
                className="ai-textarea"
                placeholder={
                  chatLang === "ta"
                    ? "5ம் ஆண்டு புலமைப்பரிசில் வினாவை கேளுங்கள்..."
                    : chatLang === "en"
                    ? "Ask any Grade 5 scholarship question..."
                    : "5 ශ්‍රේණිය ශිෂ්‍යත්ව විෂය කරුණක් අසන්න (සිංහල / English / தமிழ்)..."
                }
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAskTutor();
                  }
                }}
                rows={2}
              />
              <button
                className="btn btn-primary"
                onClick={() => handleAskTutor()}
                disabled={chatLoading || !chatInput.trim()}
                style={{ padding: "0 24px", height: 52 }}
              >
                විමසන්න 🚀
              </button>
            </div>
          </div>
        )}

        {activeTab === "curriculum" && (
          <div className="curriculum-view-grid">
            {/* Sidebar list of 16 themes */}
            <div className="curriculum-sidebar">
              <h3 style={{ fontSize: "1.1rem", marginBottom: 12, color: "#1e293b" }}>
                🌿 පරිසරය තේමා 16
              </h3>
              <div className="curriculum-list">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    className={`curriculum-item-btn ${selectedTheme === t.id ? "active" : ""}`}
                    onClick={() => setSelectedTheme(t.id)}
                  >
                    <span className="curriculum-num">{t.id}</span>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{t.title}</div>
                      <small style={{ color: "#64748b", fontSize: "0.75rem" }}>{t.en}</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed theme viewer */}
            <div className="curriculum-details card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <span className="badge" style={{ background: "#fef3c7", color: "#92400e", fontWeight: 700 }}>
                    තේමාව {selectedThemeObj.id}
                  </span>
                  <h2 style={{ margin: "8px 0 4px 0", color: "#0f172a" }}>{selectedThemeObj.title}</h2>
                  <p style={{ color: "#64748b", margin: 0 }}>
                    {selectedThemeObj.en} | {selectedThemeObj.ta}
                  </p>
                </div>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    setActiveTab("chat");
                    handleAskTutor(
                      `5 ශ්‍රේණිය ගුරු මාර්ගෝපදේශයේ ${selectedThemeObj.id} වන තේමාව: '${selectedThemeObj.title}' පිළිබඳ සියලුම වැදගත් කරුණු සහ ශිෂ්‍යත්ව ප්‍රශ්න කියා දෙන්න.`
                    );
                  }}
                >
                  🤖 මේ ගැන AI ගෙන් අසන්න
                </button>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "16px 0" }} />

              <div style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "#334155" }}>
                <h4 style={{ color: "#0284c7", marginBottom: 6 }}>විෂය අන්තර්ගතය සහ ප්‍රධාන සංකල්ප:</h4>
                <p>{selectedThemeObj.desc}</p>

                <div className="callout-box" style={{ background: "#f8fafc", padding: 16, borderRadius: 12, marginTop: 16, borderLeft: "4px solid #f59e0b" }}>
                  <strong style={{ color: "#b45309" }}>💡 ශිෂ්‍යත්ව 190+ විභාග උපදෙස:</strong>
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.88rem" }}>
                    මෙම තේමාවෙන් නිතරම පළාත් පේපර්වල විවරණ ප්‍රශ්න 2-3ක් විමසනු ලැබේ. දරුවාට ක්‍රියාකාරකම් සහ රූපසටහන් ඇසුරින් මතක තබා ගැනීමට සැලැස්වීම ලකුණු උපරිම කර ගැනීමට මඟපාදයි.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tamil" && (
          <div className="tamil-view-wrap card">
            <h2 style={{ color: "#0f172a" }}>🗣️ දෙවන ජාතික භාෂාව (දෙමළ) - 5 ශ්‍රේණිය නිල විෂය නිර්දේශය</h2>
            <p style={{ color: "#64748b" }}>
              ජාතික අධ්‍යාපන ආයතනයේ (NIE) 5 ශ්‍රේණිය පොදු ගුරු මාර්ගෝපදේශයට අනුව සකසන ලද නිල දෙමළ කොටස්
            </p>

            <div className="tamil-sections-grid">
              <div className="tamil-box">
                <h4>🔢 16-20 සංඛ්‍යා නාම</h4>
                <ul>
                  <li><strong>16:</strong> பதினாறு (පදිනාරු - දහසය)</li>
                  <li><strong>17:</strong> பதினேழு (පදිනේළු - දහහත)</li>
                  <li><strong>18:</strong> பதினெட்டு (පදිනෙට්ටු - දහඅට)</li>
                  <li><strong>19:</strong> பத்தொன்பது (පත්ථොන්බදු - දහනවය)</li>
                  <li><strong>20:</strong> இருபது (ඉරුබදු - විස්ස)</li>
                </ul>
              </div>

              <div className="tamil-box">
                <h4>🔟 10-100 දහයේ ගුණාකාර</h4>
                <ul>
                  <li><strong>10:</strong> பத்து (පත්තු) | <strong>20:</strong> இருபது (ඉරුබදු)</li>
                  <li><strong>30:</strong> முப்பது (මුප්පදු) | <strong>40:</strong> நாற்பது (නාට්පදු)</li>
                  <li><strong>50:</strong> ஐம்பது (අයිම්බදු) | <strong>60:</strong> அறுபது (අරුබදු)</li>
                  <li><strong>70:</strong> எழுபது (එළුබදු) | <strong>80:</strong> எண்பது (එණ්බදු)</li>
                  <li><strong>90:</strong> தொண்ணூறு (තොණ්ණූරු) | <strong>100:</strong> நூறு (නූරු)</li>
                </ul>
              </div>

              <div className="tamil-box">
                <h4>📍 ස්ථාන හා දිශා වචන</h4>
                <ul>
                  <li><strong>மேலே (මේලේ):</strong> උඩ / උඩට / උඩින්</li>
                  <li><strong>கீழே (කීළේ):</strong> යට / යටට / යටින් / බිම</li>
                  <li><strong>உள்ளே (උල්ලේ):</strong> ඇතුළේ / ඇතුළට</li>
                  <li><strong>வெளியே (වෙලියේ):</strong> එළියේ / එළියට</li>
                </ul>
              </div>

              <div className="tamil-box">
                <h4>📅 සතියේ දින 7</h4>
                <ul>
                  <li><strong>திங்கள் (තිංගල්):</strong> සඳුදා</li>
                  <li><strong>செவ்வாய் (සෙව්වායි):</strong> අඟහරුවාදා</li>
                  <li><strong>புதன் (බුදන්):</strong> බදාදා</li>
                  <li><strong>வியாழன் (වියාළන්):</strong> බ්‍රහස්පතින්දා</li>
                  <li><strong>வெள்ளி (වෙල්ලි):</strong> සිකුරාදා</li>
                  <li><strong>சனி (සනි):</strong> සෙනසුරාදා</li>
                  <li><strong>ஞாயிறு (ඤායිරු):</strong> ඉරිදා</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setActiveTab("chat");
                  handleAskTutor("දෙමළ විෂය නිර්දේශයේ 1 සිට 19 දක්වා සංවාද සියල්ල සිංහල තේරුම සමඟ මට කියා දෙන්න.");
                }}
              >
                🤖 දෙමළ සංවාද 1-19 සම්පූර්ණයෙන්ම AI ගෙන් ඉගෙන ගන්න ↗
              </button>
            </div>
          </div>
        )}

        {activeTab === "aboe" && (
          <div className="aboe-view-wrap card">
            <h2 style={{ color: "#0f172a" }}>🔤 Activity Based Oral English (ABOE)</h2>
            <p style={{ color: "#64748b" }}>
              Grade 5 NIE Syllabus songs, classroom language patterns, and "Simon Says" games.
            </p>

            <div className="aboe-songs-grid">
              <div className="aboe-song-card">
                <h4>🎵 Song: We are Sri Lankans (Theme 2)</h4>
                <pre style={{ fontFamily: "inherit", background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: "0.88rem" }}>
{`We are Sri Lankans,
We are sons and daughters of you.
We are Sinhalese, we are Tamils,
We are Muslims or Burgers.
We are Sri Lankans,
Though our food, though our dress,
Though our language is different,
Let's live happily hand in hand!`}
                </pre>
              </div>

              <div className="aboe-song-card">
                <h4>🎵 Song: Animal Friends (Theme 4)</h4>
                <pre style={{ fontFamily: "inherit", background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: "0.88rem" }}>
{`They are animal friends of mine,
Who says meow meow? Cat says meow meow.
Who says bow wow? Dog says bow wow.
Who says quack quack? Duck says quack quack.
Who says moo moo? Cow says moo moo.
They are animal friends of mine!`}
                </pre>
              </div>

              <div className="aboe-song-card">
                <h4>🎵 Song: Road Safety (Theme 9)</h4>
                <pre style={{ fontFamily: "inherit", background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: "0.88rem" }}>
{`Look to the right,
Look to the left,
Look to the right again.
Cross the road, if the road is clear!
No playing, no running on the road,
As vehicles moving on the road.`}
                </pre>
              </div>

              <div className="aboe-song-card">
                <h4>🎯 Game: Simon Says Commands</h4>
                <ul style={{ fontSize: "0.88rem", lineHeight: 1.8 }}>
                  <li>"Simon says stand up!"</li>
                  <li>"Simon says touch your toes!"</li>
                  <li>"Simon says show your pencil!"</li>
                  <li>"Simon says wash your hands!"</li>
                  <li>"Simon says look at the blackboard!"</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setActiveTab("chat");
                  handleAskTutor("Explain Grade 5 English ABOE vocabulary and classroom questions.");
                }}
              >
                🤖 Ask AI Tutor about Grade 5 English ABOE ↗
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

