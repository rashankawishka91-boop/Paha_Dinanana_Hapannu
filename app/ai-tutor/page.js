"use client";
import React, { useState, useRef, useEffect } from "react";
import { useApp, getYoutubeEmbedUrl } from "../../lib/Provider";

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
            background: "rgba(217, 119, 6, 0.14)",
            padding: "1px 6px",
            borderRadius: "5px",
            fontFamily: "monospace",
            fontSize: "0.92em",
            fontWeight: 700,
          }}
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    return p;
  });
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
  const bodyRows = [];
  let startIndex = 1;

  if (cleanLines.length > 1 && /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(cleanLines[1].trim())) {
    startIndex = 2;
  }

  for (let r = startIndex; r < cleanLines.length; r++) {
    const row = cleanLines[r].trim();
    if (!row || /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(row)) continue;
    bodyRows.push(parseRow(row));
  }

  return (
    <div key={key} className="ait-table-wrap">
      <table className="ait-table">
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

function FormattedTeacherMessage({ content }) {
  if (!content) return null;
  const lines = content.split("\n");
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
      if (!currentTable) currentTable = [];
      currentTable.push(trimmed);
      continue;
    } else {
      flushTable();
    }

    if (!trimmed) {
      blocks.push({ type: "spacer" });
      continue;
    }

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
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      blocks.push({ type: "bullet", text: trimmed.replace(/^[-*•]\s+/, "") });
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

  return (
    <div className="ait-msg-formatted">
      {blocks.map((block, idx) => {
        if (block.type === "table") return renderTable(block.lines, idx);
        if (block.type === "spacer") return <div key={idx} style={{ height: 6 }} />;
        if (block.type === "h2") {
          return (
            <h4 key={idx} className="ait-h2">
              {parseBold(block.text)}
            </h4>
          );
        }
        if (block.type === "h3") {
          return (
            <h5 key={idx} className="ait-h3">
              {parseBold(block.text)}
            </h5>
          );
        }
        if (block.type === "bullet") {
          return (
            <div key={idx} className="ait-bullet">
              <span className="ait-dot">•</span>
              <span>{parseBold(block.text)}</span>
            </div>
          );
        }
        if (block.type === "num") {
          return (
            <div key={idx} className="ait-bullet">
              <span className="ait-num">{block.num}.</span>
              <span>{parseBold(block.text)}</span>
            </div>
          );
        }
        return (
          <p key={idx} className="ait-p">
            {parseBold(block.text)}
          </p>
        );
      })}
    </div>
  );
}

const GRADE_CURRICULUM = {
  3: {
    label: "3 ශ්‍රේණිය",
    badge: "Grade 3 · NIE ගුරු අත්පොත",
    desc: "3 ශ්‍රේණිය නිල ගුරු අත්පොතට අනුව පරිසරය, මව්බස, ගණිතය, දෙමළ සහ ඉංග්‍රීසි පාඩම් සරලව",
    quickQuestions: [
      { label: "🌱 මුදුන් මුල් හා කෙඳි මුල්", q: "3 ශ්‍රේණිය පරිසරය පාඩමට අනුව මුදුන් මුල් සහ කෙඳි මුල් ඇති ශාක උදාහරණ සහිතව කියා දෙන්න." },
      { label: "🔢 ස්ථානීය අගය (ගණිතය)", q: "3 ශ්‍රේණිය ගණිතයට අනුව ඉලක්කම් තුනක සංඛ්‍යාවක එකස්ථානය, දසස්ථානය සහ සියස්ථානය සොයන හැටි කියා දෙන්න." },
      { label: "🐾 සතුන්ගේ ආහාර පුරුදු", q: "ශාක භක්ෂක, මාංශ භක්ෂක සහ සර්ව භක්ෂක සතුන් උදාහරණ සහිතව සරලව කියා දෙන්න." },
      { label: "📖 උක්ත ආඛ්‍යාත (සිංහල)", q: "3 ශ්‍රේණිය සිංහල පාඩමට අනුව ඒකවචන හා බහුවචන වාක්‍ය නිවැරදිව ලියන හැටි කියා දෙන්න." },
      { label: "❓ 3 ශ්‍රේණිය ප්‍රශ්නයක් අහන්න", q: "3 ශ්‍රේණිය ගුරු අත්පොතෙන් මගෙන් ප්‍රශ්නයක් අහන්න." },
    ],
  },
  4: {
    label: "4 ශ්‍රේණිය",
    badge: "Grade 4 · NIE ගුරු අත්පොත",
    desc: "4 ශ්‍රේණිය නිල ගුරු අත්පොතට අනුව පරිසරය තේමා 16, ගණිත ගැටළු, සිංහල ව්‍යාකරණ සහ දෙමළ",
    quickQuestions: [
      { label: "🥗 විටමින් හා පෝෂණය", q: "4 ශ්‍රේණිය ගුරු අත්පොතට අනුව විටමින් A, B, C, D සහ යකඩ අඩු වීමෙන් වැළඳෙන රෝග මොනවාද?" },
      { label: "⌚ රෝම සංඛ්‍යා හා කාලය", q: "4 ශ්‍රේණිය ගණිතයට අනුව 1 සිට 12 දක්වා රෝම සංඛ්‍යා සහ පැය 24 ඔරලෝසු වේලාව ලියන හැටි කියා දෙන්න." },
      { label: "💧 ජලයේ ගුණ හා පරීක්ෂණ", q: "ජලයේ දියවන ද්‍රව්‍ය, දිය නොවන ද්‍රව්‍ය සහ ලුණු වතුරේ බිත්තරය පාවීමේ පරීක්ෂණය පැහැදිලි කරන්න." },
      { label: "🇱🇰 ජාතික සංකේත හා වීරයන්", q: "අපේ ජාතික සංකේත සහ ජාතික වීරයන් ගැන 4 ශ්‍රේණිය ගුරු අත්පොතට අනුව කියා දෙන්න." },
      { label: "❓ 4 ශ්‍රේණිය ප්‍රශ්නයක් අහන්න", q: "4 ශ්‍රේණිය ගුරු අත්පොතෙන් මගෙන් ප්‍රශ්නයක් අහන්න." },
    ],
  },
  5: {
    label: "5 ශ්‍රේණිය (ශිෂ්‍යත්වය)",
    badge: "Grade 5 · ශිෂ්‍යත්ව ගුරු අත්පොත",
    desc: "5 ශ්‍රේණිය නිල ගුරු මාර්ගෝපදේශයට අනුව පරිසරය තේමා 16, ගණිත කෙටි ක්‍රම, සිංහල, දෙමළ සහ ඉංග්‍රීසි",
    quickQuestions: [
      { label: "🌿 බීජ ව්‍යාප්ත වන ක්‍රම 4", q: "5 ශ්‍රේණිය ගුරු අත්පොතට අනුව බීජ හා ඵල ව්‍යාප්ත වන ක්‍රම 4 උදාහරණ සහිතව කියා දෙන්න." },
      { label: "👑 රජවරුන් සහ වැව් / දාගැබ්", q: "5 ශ්‍රේණිය ගුරු අත්පොතට අනුව පණ්ඩුකාභය, දේවානම්පියතිස්ස, දුටුගැමුණු, මහසෙන් සහ ධාතුසේන රජවරුන් කළ සේවාවන් මොනවාද?" },
      { label: "⚙️ සරල යන්ත්‍ර (ලීවර, කප්පි)", q: "වැඩ පහසු කරන සරල යන්ත්‍ර (ලීවර, ආනත තලය, කප්පිය, ආපඤ්ඤය) උදාහරණ සහිතව පැහැදිලි කරන්න." },
      { label: "📐 ත්‍රිකෝණ සංඛ්‍යා හා ඔරලෝසු ගැටළු", q: "5 ශ්‍රේණිය ශිෂ්‍යත්ව ගණිතයේ ත්‍රිකෝණ සංඛ්‍යා සූත්‍රය සහ කැඩපත් ඔරලෝසු වේලාව සොයන කෙටි ක්‍රමය කියා දෙන්න." },
      { label: "❓ 5 ශ්‍රේණිය ප්‍රශ්නයක් අහන්න", q: "5 ශ්‍රේණිය ගුරු අත්පොතෙන් මගෙන් ශිෂ්‍යත්ව බහුවරණ ප්‍රශ්නයක් අහන්න." },
    ],
  },
};

const THEMES_16 = [
  { id: 1, title: "අපේ යහපැවැත්ම", desc: "පෞද්ගලික පිරිසිදුකම, යහපත් පුරුදු, සිත පහන් කිරීමේ අභ්‍යාස, අවශ්‍යතා සහ උවමනා" },
  { id: 2, title: "අපි ලක් වැසියෝ", desc: "ජාතික කොඩිය, ජාතික ගීය, රාජ්‍ය ලාංඡනය, ජාතික වීරයන් සහ සහජීවනය" },
  { id: 3, title: "පැළෑටි හා ගස්වැල්", desc: "මුදුන් මුල් හා කෙඳි මුල්, විශේෂ මුල්, භූගත කඳන්, බීජ හා ඵල ව්‍යාප්තිය" },
  { id: 4, title: "අප අවට සත්තු", desc: "සතුන්ගේ ආහාර පුරුදු, රූපාන්තරණය (සමනලයා, මදුරුවා, ගෙම්බා), ආවේණික සතුන්" },
  { id: 5, title: "අප පරිහරණය කරන දේ", desc: "උපකරණ ආරක්ෂිත භාවිතය, ප්‍රමිති ලාංඡන (SLS), පාරිභෝගික තොරතුරු" },
  { id: 6, title: "අපේ ආහාර", desc: "සමබල ආහාර වේල, විටමින් A, B, C, D, යකඩ හා අයඩීන් ඌනතා රෝග" },
  { id: 7, title: "ආරක්ෂාව හා පරිස්සම", desc: "ප්‍රථමාධාර, අකුණු අනතුරු, හදිසි ඇමතුම් අංක (119, 1990, 1929, 110, 117)" },
  { id: 8, title: "ජලය", desc: "ජලයේ අවස්ථා 3, දියවන හා දිය නොවන ද්‍රව්‍ය, ලුණු ජලයේ බිත්තර පරීක්ෂණය, ජල පීඩනය" },
  { id: 9, title: "වැඩ පහසු කිරීමේ මං", desc: "සරල යන්ත්‍ර: ලීවරය, ආනත තලය, කප්පිය, දණ්ඩ හා රෝදය, ආපඤ්ඤය" },
  { id: 10, title: "ගෙවත්ත", desc: "3R සංකල්පය (Reduce, Reuse, Recycle), කොම්පෝස්ට් පොහොර, වගාවට හිතකර සතුන්" },
  { id: 11, title: "ගමනාගමනය", desc: "මාර්ග නීති, ආලෝක සංඥා, පදික මාරුව, දුම්රිය හා මහාමාර්ග" },
  { id: 12, title: "මිනිස් හැසිරීම්", desc: "මූලික අවශ්‍යතා සහ උවමනා, සාමකාමී පැවැත්ම, කණ්ඩායම් හැඟීම" },
  { id: 13, title: "පොළොව හා අහස", desc: "පාංශු ඛාදනය වැළැක්වීම, සූර්යග්‍රහණ හා චන්ද්‍රග්‍රහණ, තාරකා රටා (දඩයක්කාරයා, මහ වලසා)" },
  { id: 14, title: "අපට කළ හැකි වෙනස්කම්", desc: "කසළ වර්ගීකරණ බඳුන් වර්ණ (කොළ, නිල්, තැඹිලි, රතු), පරිසර සංරක්ෂණය" },
  { id: 15, title: "මිනිසා හා තොරතුරු", desc: "පැරණි හා නවීන සන්නිවේදන ක්‍රම, අන්තර්ජාතික සම්මත සංකේත" },
  { id: 16, title: "අපේ අතීත විත්ති", desc: "පණ්ඩුකාභය, දේවානම්පියතිස්ස, දුටුගැමුණු, මහසෙන්, ධාතුසේන, පරාක්‍රමබාහු රජවරුන්" },
];

export default function AiTutorPage() {
  const { me, theme } = useApp();
  const isLight = theme === "light";

  const [selectedGrade, setSelectedGrade] = useState(Number(me?.grade) || 5);
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'themes' | 'tamil'
  const [chatLang, setChatLang] = useState("si");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const chatEndRef = useRef(null);

  const getInitialGreeting = (g) =>
    `ආයුබෝවන් දුවේ / පුතේ! මම **${g} ශ්‍රේණිය** ශ්‍රී ලංකා ගුරු අත්පොතට (NIE Teacher's Guide) අනුව උගන්වන ඔබේ AI ගුරුතුමා.\n\nඔබට **පරිසරය, ගණිතය, සිංහල, දෙමළ හෝ ඉංග්‍රීසි** විෂයයන්වලින් දැනගැනීමට අවශ්‍ය ඕනෑම ප්‍රශ්නයක් පහතින් අසන්න. අසන ප්‍රශ්නයට පමණක් ඉතා පැහැදිලිව සහ නිවැරදිව මම පිළිතුරු ලබා දෙන්නම්.`;

  const [chatLog, setChatLog] = useState([
    {
      role: "assistant",
      content: getInitialGreeting(Number(me?.grade) || 5),
    },
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, chatLoading]);

  const handleSelectGrade = (g) => {
    setSelectedGrade(g);
    setChatLog([
      {
        role: "assistant",
        content: getInitialGreeting(g),
      },
    ]);
  };

  const handleClearChat = () => {
    setChatLog([
      {
        role: "assistant",
        content: getInitialGreeting(selectedGrade),
      },
    ]);
  };

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
          grade: selectedGrade,
          language: chatLang,
          customApiKey,
        }),
      });

      let replyText = "";
      if (res.ok) {
        const data = await res.json();
        replyText = data?.reply || "";
      }

      if (!replyText) {
        replyText = "පුතේ, කරුණාකර ඔබගේ ප්‍රශ්නය නැවත වරක් විමසන්න.";
      }

      setChatLog((prev) => [...prev, { role: "assistant", content: replyText }]);
    } catch (e) {
      setChatLog((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "පුතේ, සම්බන්ධතාවයේ සුළු දෝෂයක් ඇති වුණා. කරුණාකර නැවත උත්සාහ කරන්න.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const gradeInfo = GRADE_CURRICULUM[selectedGrade] || GRADE_CURRICULUM[5];

  return (
    <main className={`ait-root ${isLight ? "ait-light" : "ait-dark"}`}>
      <style jsx global>{`
        .ait-root {
          --bg: #16090b;
          --surface: #241114;
          --surface-2: #2f161a;
          --chat-bg: #1c0c0f;
          --ink: #fff6ec;
          --muted: #d4b9a9;
          --line: #543225;
          --gold: #f5b027;
          --gold-ink: #241002;
          --bot-bub: #2b1518;
          --bot-border: #5a3728;
          --user-bub: #7a1c28;
          --user-ink: #ffffff;
          --green: #10b981;
          min-height: calc(100vh - 58px);
          background: var(--bg);
          color: var(--ink);
          padding: 24px 16px 64px;
          font-family: "Noto Sans Sinhala", "Figtree", system-ui, sans-serif;
        }

        .ait-root.ait-light {
          --bg: #f8f3eb;
          --surface: #ffffff;
          --surface-2: #f4eadc;
          --chat-bg: #fcf9f4;
          --ink: #231215;
          --muted: #665155;
          --line: #decbb2;
          --gold: #d98200;
          --gold-ink: #ffffff;
          --bot-bub: #ffffff;
          --bot-border: #e2d2bc;
          --user-bub: #5a1420;
          --user-ink: #ffffff;
          --green: #0f7a4b;
        }

        .ait-container {
          max-width: 1080px;
          margin: 0 auto;
        }

        /* Header Banner */
        .ait-top-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 20px 24px;
          margin-bottom: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.14);
        }

        .ait-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
        }

        .ait-teacher-profile {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ait-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
          border: 2.5px solid var(--gold);
          flex-shrink: 0;
        }

        .ait-title-row h1 {
          margin: 0;
          font-size: clamp(1.35rem, 2.5vw, 1.75rem);
          font-weight: 800;
          color: var(--ink);
        }

        .ait-title-row p {
          margin: 3px 0 0;
          font-size: 0.92rem;
          color: var(--muted);
        }

        /* Grade Selector Bar (Grades 3, 4, 5) */
        .ait-controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 14px;
          border-top: 1px solid var(--line);
        }

        .ait-grade-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ait-grade-btn {
          padding: 9px 18px;
          border-radius: 12px;
          border: 1.5px solid var(--line);
          background: var(--surface-2);
          color: var(--ink);
          font-weight: 700;
          font-size: 0.92rem;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: none;
        }

        .ait-grade-btn:hover {
          border-color: var(--gold);
          transform: translateY(-1px);
        }

        .ait-grade-btn.active {
          background: linear-gradient(135deg, #ffd25a, #e59400);
          color: #241002;
          border-color: transparent;
          font-weight: 800;
          box-shadow: 0 4px 14px rgba(229, 148, 0, 0.28);
        }

        .ait-view-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ait-tab-btn {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid var(--line);
          background: transparent;
          color: var(--muted);
          font-weight: 700;
          font-size: 0.86rem;
          cursor: pointer;
          box-shadow: none;
        }

        .ait-tab-btn.active {
          background: var(--surface-2);
          color: var(--ink);
          border-color: var(--gold);
        }

        /* Main Chat Workspace */
        .ait-chat-box {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 22px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
        }

        .ait-chat-subbar {
          background: var(--surface-2);
          padding: 12px 20px;
          border-bottom: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .ait-quick-row {
          padding: 12px 20px;
          background: var(--surface);
          border-bottom: 1px solid var(--line);
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
        }

        .ait-q-chip {
          padding: 7px 14px;
          border-radius: 99px;
          border: 1px solid var(--line);
          background: var(--surface-2);
          color: var(--ink);
          font-size: 0.84rem;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
          box-shadow: none;
          transition: all 0.15s ease;
        }

        .ait-q-chip:hover {
          border-color: var(--gold);
          background: rgba(245, 176, 39, 0.15);
        }

        /* Messages Stream */
        .ait-messages {
          height: 500px;
          overflow-y: auto;
          padding: 22px 20px;
          background: var(--chat-bg);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ait-msg-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          max-width: 86%;
        }

        .ait-msg-row.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .ait-msg-av {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--gold);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .ait-bubble {
          background: var(--bot-bub);
          border: 1px solid var(--bot-border);
          color: var(--ink);
          padding: 14px 18px;
          border-radius: 6px 18px 18px 18px;
          font-size: 0.98rem;
          line-height: 1.68;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
        }

        .ait-msg-row.user .ait-bubble {
          background: var(--user-bub);
          border-color: transparent;
          color: var(--user-ink);
          border-radius: 18px 6px 18px 18px;
          font-weight: 600;
        }

        .ait-msg-formatted .ait-p {
          margin: 4px 0;
        }

        .ait-msg-formatted .ait-h2 {
          margin: 10px 0 6px;
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--gold);
        }

        .ait-msg-formatted .ait-h3 {
          margin: 8px 0 4px;
          font-size: 0.96rem;
          font-weight: 700;
        }

        .ait-bullet {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 5px 0;
        }

        .ait-dot {
          color: var(--gold);
          font-weight: 900;
        }

        .ait-num {
          color: var(--gold);
          font-weight: 800;
          min-width: 20px;
        }

        .ait-table-wrap {
          width: 100%;
          overflow-x: auto;
          margin: 10px 0;
          border-radius: 12px;
          border: 1px solid var(--line);
        }

        .ait-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
          text-align: left;
        }

        .ait-table th {
          background: var(--surface-2);
          color: var(--gold);
          padding: 10px 14px;
          font-weight: 800;
          border-bottom: 1px solid var(--line);
        }

        .ait-table td {
          padding: 9px 14px;
          border-bottom: 1px solid var(--line);
        }

        .ait-table tr:last-child td {
          border-bottom: none;
        }

        /* Input Composer */
        .ait-input-area {
          padding: 16px 20px;
          background: var(--surface);
          border-top: 1px solid var(--line);
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .ait-input {
          flex: 1;
          background: var(--chat-bg);
          border: 1.5px solid var(--line);
          border-radius: 14px;
          padding: 13px 16px;
          color: var(--ink);
          font: inherit;
          font-size: 0.98rem;
          outline: none;
          resize: none;
        }

        .ait-input:focus {
          border-color: var(--gold);
        }

        .ait-send-btn {
          padding: 0 24px;
          height: 50px;
          border-radius: 14px;
          background: linear-gradient(135deg, #ffd25a, #e59400);
          color: #241002;
          font-weight: 800;
          font-size: 0.96rem;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
        }

        .ait-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* 16 Themes Reference Grid */
        .ait-themes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 14px;
        }

        .ait-theme-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
        }

        @media (max-width: 720px) {
          .ait-msg-row {
            max-width: 96%;
          }
          .ait-messages {
            height: 440px;
            padding: 16px 12px;
          }
        }
      `}</style>

      <div className="ait-container">
        {/* TOP HEADER & GRADE SELECTOR (GRADES 3, 4, 5) */}
        <section className="ait-top-card">
          <div className="ait-title-row">
            <div className="ait-teacher-profile">
              <img src="/teacher-face.jpg" alt="AI Teacher" className="ait-avatar" />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <h1>ශ්‍රී ලංකා ගුරු අත්පොත AI ගුරුතුමා</h1>
                  <span
                    style={{
                      background: "rgba(16, 185, 129, 0.16)",
                      border: "1px solid rgba(16, 185, 129, 0.45)",
                      color: "var(--green)",
                      padding: "2px 10px",
                      borderRadius: "99px",
                      fontSize: "0.76rem",
                      fontWeight: 800,
                    }}
                  >
                    ● NIE Teacher&apos;s Guide (3, 4, 5 ශ්‍රේණි)
                  </span>
                </div>
                <p>{gradeInfo.desc}</p>
              </div>
            </div>

            {/* Language Selector */}
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { id: "si", label: "🇱🇰 සිංහල" },
                { id: "en", label: "🇬🇧 English" },
                { id: "ta", label: "🇮🇳 தமிழ்" },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={`ait-tab-btn ${chatLang === l.id ? "active" : ""}`}
                  onClick={() => setChatLang(l.id)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grade Buttons (3, 4, 5) & Mode Switcher */}
          <div className="ait-controls-bar">
            <div className="ait-grade-pills">
              <span style={{ fontSize: "0.86rem", fontWeight: 800, color: "var(--muted)" }}>
                ශ්‍රේණිය තෝරන්න:
              </span>
              {[3, 4, 5].map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`ait-grade-btn ${selectedGrade === g ? "active" : ""}`}
                  onClick={() => handleSelectGrade(g)}
                >
                  🎓 {g} ශ්‍රේණිය {g === 5 ? "(ශිෂ්‍යත්වය)" : ""}
                </button>
              ))}
            </div>

            <div className="ait-view-tabs">
              <button
                type="button"
                className={`ait-tab-btn ${activeTab === "chat" ? "active" : ""}`}
                onClick={() => setActiveTab("chat")}
              >
                💬 ගුරුතුමාගෙන් අසන්න
              </button>
              <button
                type="button"
                className={`ait-tab-btn ${activeTab === "themes" ? "active" : ""}`}
                onClick={() => setActiveTab("themes")}
              >
                📚 පරිසරය තේමා 16
              </button>
              <button
                type="button"
                className={`ait-tab-btn ${activeTab === "tamil" ? "active" : ""}`}
                onClick={() => setActiveTab("tamil")}
              >
                🗣️ දෙමළ හා ඉංග්‍රීසි
              </button>
            </div>
          </div>
        </section>

        {/* TAB 1: CLEAN TEACHER CHAT INTERFACE */}
        {activeTab === "chat" && (
          <section className="ait-chat-box">
            <div className="ait-chat-subbar">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <strong style={{ color: "var(--gold)", fontSize: "0.95rem" }}>
                  📘 සක්‍රීය විෂය නිර්දේශය: {gradeInfo.label} (ශ්‍රී ලංකා ගුරු අත්පොත)
                </strong>
              </div>

              <button
                type="button"
                className="ait-tab-btn"
                onClick={handleClearChat}
                style={{ padding: "5px 12px", fontSize: "0.8rem" }}
              >
                🔄 අලුත් සංවාදයක් (Clear Chat)
              </button>
            </div>

            {/* Grade-Specific Quick Questions */}
            <div className="ait-quick-row">
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--muted)", whiteSpace: "nowrap" }}>
                ඉක්මන් ප්‍රශ්න ({selectedGrade} ශ්‍රේණිය):
              </span>
              {gradeInfo.quickQuestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="ait-q-chip"
                  onClick={() => handleAskTutor(item.q)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="ait-messages">
              {chatLog.map((m, i) => {
                const isUser = m.role === "user";
                return (
                  <div key={i} className={`ait-msg-row ${isUser ? "user" : "bot"}`}>
                    {!isUser && (
                      <img src="/teacher-face.jpg" alt="Teacher" className="ait-msg-av" />
                    )}
                    <div className="ait-bubble">
                      {!isUser && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            color: "var(--gold)",
                            marginBottom: "6px",
                          }}
                        >
                          👨‍🏫 {selectedGrade} ශ්‍රේණිය ගුරුතුමා (NIE ගුරු අත්පොත)
                        </div>
                      )}
                      <FormattedTeacherMessage content={m.content} />
                    </div>
                  </div>
                );
              })}

              {chatLoading && (
                <div className="ait-msg-row bot">
                  <img src="/teacher-face.jpg" alt="Teacher" className="ait-msg-av" />
                  <div className="ait-bubble" style={{ color: "var(--muted)", fontWeight: 700 }}>
                    ⏳ {selectedGrade} ශ්‍රේණිය ගුරු අත්පොතට අනුව පිළිතුර සකසමින් පවතී...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form
              className="ait-input-area"
              onSubmit={(e) => {
                e.preventDefault();
                handleAskTutor();
              }}
            >
              <input
                type="text"
                className="ait-input"
                placeholder={`${selectedGrade} ශ්‍රේණියේ ඕනෑම විෂය ප්‍රශ්නයක් මෙහි ලියා අසන්න...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button
                type="submit"
                className="ait-send-btn"
                disabled={chatLoading || !chatInput.trim()}
              >
                අසන්න ➔
              </button>
            </form>
          </section>
        )}

        {/* TAB 2: 16 ENVIRONMENTAL STUDIES THEMES */}
        {activeTab === "themes" && (
          <section>
            <div style={{ marginBottom: "14px" }}>
              <h2 style={{ margin: "0 0 4px", fontSize: "1.3rem" }}>
                🌿 3, 4 සහ 5 ශ්‍රේණි පරිසරය ආශ්‍රිත ක්‍රියාකාරකම් — තේමා 16
              </h2>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.92rem" }}>
                ඕනෑම තේමාවක් මත ක්ලික් කර {selectedGrade} ශ්‍රේණිය ගුරු අත්පොතට අනුව එම පාඩමේ කරුණු ගුරුතුමාගෙන් විමසන්න.
              </p>
            </div>

            <div className="ait-themes-grid">
              {THEMES_16.map((t) => (
                <div key={t.id} className="ait-theme-card">
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: "99px",
                        background: "rgba(245, 176, 39, 0.16)",
                        color: "var(--gold)",
                        fontSize: "0.76rem",
                        fontWeight: 800,
                        marginBottom: "8px",
                      }}
                    >
                      තේමාව {t.id}
                    </span>
                    <h3 style={{ margin: "0 0 6px", fontSize: "1.08rem" }}>{t.title}</h3>
                    <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--muted)", lineHeight: 1.55 }}>
                      {t.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="ait-q-chip"
                    style={{ width: "100%", textAlign: "center", justifyContent: "center" }}
                    onClick={() => {
                      setActiveTab("chat");
                      handleAskTutor(
                        `${selectedGrade} ශ්‍රේණිය ගුරු අත්පොතට අනුව පරිසරය '${t.title}' පාඩමේ ප්‍රධාන කරුණු පැහැදිලිව කියා දෙන්න.`
                      );
                    }}
                  >
                    📘 {selectedGrade} ශ්‍රේණිය පාඩම අසන්න ➔
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: TAMIL & ENGLISH (ABOE) */}
        {activeTab === "tamil" && (
          <section className="ait-top-card">
            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
              🗣️ දෙවන බස දෙමළ සහ ඉංග්‍රීසි (ABOE) — 3, 4, 5 ශ්‍රේණි ගුරු අත්පොත
            </h2>
            <div className="ait-themes-grid">
              <div className="ait-theme-card">
                <div>
                  <h3 style={{ margin: "0 0 8px", color: "var(--gold)" }}>🔢 දෙමළ සංඛ්‍යා (1 - 20)</h3>
                  <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.7 }}>
                    1 - ඔන්රු | 2 - ඉරණ්ඩු | 3 - මූන්රු | 4 - නාන්ගු | 5 - අයින්දු
                    <br />
                    16 - පදිනාරු | 17 - පදිනේළු | 18 - පදිනෙට්ටු | 19 - පත්තොන්බදු | 20 - ඉරුබදු
                  </p>
                </div>
                <button
                  type="button"
                  className="ait-q-chip"
                  onClick={() => {
                    setActiveTab("chat");
                    handleAskTutor(`${selectedGrade} ශ්‍රේණිය ගුරු අත්පොතට අනුව දෙමළ සංඛ්‍යා සහ දිශා වචන සිංහල උච්චාරණය සමඟ කියා දෙන්න.`);
                  }}
                >
                  ගුරුතුමාගෙන් විමසන්න ➔
                </button>
              </div>

              <div className="ait-theme-card">
                <div>
                  <h3 style={{ margin: "0 0 8px", color: "var(--gold)" }}>📍 දෙමළ ස්ථාන හා ආචාර</h3>
                  <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.7 }}>
                    • වනක්කම් (ආයුබෝවන්) | නන්රි (ස්තූතියි)
                    <br />• මේලේ (උඩ) | කීළේ (යට) | උල්ලේ (ඇතුළේ) | වෙලියේ (එළියේ)
                  </p>
                </div>
                <button
                  type="button"
                  className="ait-q-chip"
                  onClick={() => {
                    setActiveTab("chat");
                    handleAskTutor(`${selectedGrade} ශ්‍රේණිය දෙමළ එදිනෙදා දෙබස් සහ පවුලේ සාමාජිකයන් හඳුන්වන වචන කියා දෙන්න.`);
                  }}
                >
                  ගුරුතුමාගෙන් විමසන්න ➔
                </button>
              </div>

              <div className="ait-theme-card">
                <div>
                  <h3 style={{ margin: "0 0 8px", color: "var(--gold)" }}>🔤 ඉංග්‍රීසි (ABOE Vocabulary)</h3>
                  <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.7 }}>
                    • Opposites (විරුද්ධ පද): Big/Small, Clean/Dirty, Fast/Slow
                    <br />• Plurals (බහුවචන): Child/Children, Tooth/Teeth, Leaf/Leaves
                  </p>
                </div>
                <button
                  type="button"
                  className="ait-q-chip"
                  onClick={() => {
                    setActiveTab("chat");
                    handleAskTutor(`${selectedGrade} ශ්‍රේණිය ඉංග්‍රීසි (ABOE) විෂය නිර්දේශයේ වැදගත් වචන, විරුද්ධ පද සහ බහුවචන කියා දෙන්න.`);
                  }}
                >
                  ගුරුතුමාගෙන් විමසන්න ➔
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
