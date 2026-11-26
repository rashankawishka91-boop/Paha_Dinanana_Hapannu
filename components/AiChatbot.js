"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useApp, getYoutubeEmbedUrl } from "../lib/Provider";

// Formatter component for cleanly structured teacher responses with Markdown Tables
function FormattedMessage({ content, language = "si" }) {
  if (!content) return null;

  // Check if content has the dual structure sections
  const syllabusMatch = content.match(/##\s*📘\s*1\.\s*විෂය නිර්දේශය[^\n]*\n([\s\S]*?)(?=(##\s*💡|$))/i);
  const extraMatch = content.match(/##\s*💡\s*2\.\s*අමතර දැනුම[^\n]*\n([\s\S]*?)$/i);

  if (syllabusMatch || extraMatch) {
    const introText = content.split(/##\s*📘/)[0].trim();
    const syllabusText = syllabusMatch ? syllabusMatch[1].trim() : "";
    const extraText = extraMatch ? extraMatch[1].trim() : "";

    return (
      <div className="ai-structured-msg">
        {introText && (
          <div style={{ marginBottom: "8px" }}>
            {renderBlocks(introText)}
          </div>
        )}

        {syllabusText && (
          <div className="ai-section-card ai-syllabus-card">
            <div className="ai-syllabus-header">
              <span>📘</span>
              <span>
                {language === "ta"
                  ? "1. பாடத்திட்டம் மற்றும் ஆசிரியர் வழிகாட்டி"
                  : language === "en"
                  ? "1. Official Syllabus & NIE Guide"
                  : "1. විෂය නිර්දේශය හා ගුරු මාර්ගෝපදේශය"}
              </span>
            </div>
            <div>{renderBlocks(syllabusText)}</div>
          </div>
        )}

        {extraText && (
          <div className="ai-section-card ai-extra-card">
            <div className="ai-extra-header">
              <span>💡</span>
              <span style={{ color: "#b5651d" }}>
                {language === "ta"
                  ? "2. மேலதிக அறிவு மற்றும் 190+ தேர்வு ரகசியங்கள்"
                  : language === "en"
                  ? "2. Extra Knowledge & 190+ Exam Secrets"
                  : "2. අමතර දැනුම සහ 190+ විභාග රහස්"}
              </span>
            </div>
            <div>{renderBlocks(extraText)}</div>
          </div>
        )}
      </div>
    );
  }

  // Fallback standard formatted render
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

  // Check if line 1 is a delimiter row like |---|---|
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

    // Check if line looks like a table row:
    // starts with pipe or contains 2 or more pipes
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
      return <div key={idx} style={{ height: "6px" }} />;
    }
    if (block.type === "h2") {
      return (
        <h3 key={idx} className="ai-msg-h2">
          {parseBold(block.text)}
        </h3>
      );
    }
    if (block.type === "h3") {
      return (
        <h4 key={idx} className="ai-msg-h3">
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
          <span className="ai-bullet-num">{block.num}.</span>
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
            background: "rgba(74, 18, 24, 0.08)",
            padding: "1px 5px",
            borderRadius: "4px",
            fontFamily: "monospace",
            fontSize: "0.9em",
            color: "#4a1218",
          }}
        >
          {p.slice(1, -1)}
        </code>
      );
    }
    return p;
  });
}

export default function AiChatbot() {
  const app = useApp();
  const siteLang = app?.lang || "si";

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(Number(app?.me?.grade) || 5);
  const [language, setLanguage] = useState(siteLang); // "si", "en", "ta"
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showChips, setShowChips] = useState(true);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Sync with site-wide language changes
  useEffect(() => {
    if (siteLang && (siteLang === "si" || siteLang === "en") && siteLang !== language) {
      setLanguage(siteLang);
    }
  }, [siteLang]);

  const welcomeMessage =
    language === "ta"
      ? `வணக்கம்! நான் தரம் 3, 4, 5 இலங்கை ஆசிரியர் வழிகாட்டியின்படி கற்பிக்கும் உங்கள் AI ஆசிரியர். உங்கள் கேள்வியை நேராகக் கேளுங்கள்.`
      : language === "en"
      ? `Hello! I am your Sri Lanka NIE Teacher's Guide AI Teacher for Grades 3, 4, and 5. Ask me any question directly.`
      : `ආයුබෝවන් දුවේ / පුතේ! මම 3, 4 සහ 5 ශ්‍රේණි ශ්‍රී ලංකා ගුරු අත්පොතට (NIE Teacher's Guide) අනුව උගන්වන ඔබේ AI ගුරුතුමා. ඔබට දැනගැනීමට අවශ්‍ය ප්‍රශ්නය කෙලින්ම අසන්න.`;

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: welcomeMessage,
      time: "Just now",
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      if (typeof window !== "undefined" && window.innerWidth > 600) {
        setTimeout(() => textareaRef.current?.focus(), 150);
      }
    }
  }, [messages, isOpen]);

  // Adjust textarea height on type
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 110)}px`;
    }
  }, [input]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (messages.length <= 1) {
      const newWelcome =
        newLang === "ta"
          ? "நான் இலங்கை தேசிய கல்வி நிறுவகத்தின் (NIE) தரம் 5 ஆசிரியர் வழிகாட்டியை முழுமையாகக் கொண்டு சுற்றாடல் 16 கருப்பொருட்கள், ஆங்கிலம் மற்றும் கணித ரகசியங்களை கற்பிக்கும் உத்தியோகபூர்வ AI ஆசான் ஆவேன். ஏதேனும் கேள்வியைக் கேட்கவும்."
          : newLang === "en"
          ? "I am built on the official Sri Lanka NIE Grade 5 Teacher's Guide, with extra tips for top marks. Pick a topic below or ask me anything."
          : "මම ශ්‍රී ලංකා ජාතික අධ්‍යාපන ආයතනයේ (NIE) 5 ශ්‍රේණිය නිල පොදු ගුරු මාර්ගෝපදේශය පදනම් කරගත් 190+ AI ගුරුතුමා වෙමි. විෂය කරුණු, අනුමාන ප්‍රශ්න සහ කෙටි රහස් ඕනෑම දෙයක් අසන්න.";
      setMessages([
        {
          role: "assistant",
          content: newWelcome,
          time: "Just now",
        },
      ]);
    }
  };

  const handleSend = async (customPrompt = null) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMessage = {
      role: "user",
      content: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!customPrompt) {
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "44px";
    }
    setLoading(true);

    try {
      const customApiKey =
        typeof window !== "undefined" ? localStorage.getItem("hapannu_api_key") || undefined : undefined;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          grade: selectedGrade,
          language,
          customApiKey,
        }),
      });

      let replyText = "";
      if (res.ok) {
        const data = await res.json();
        replyText = data?.reply || "";
      }

      if (!replyText) {
        replyText =
          language === "ta"
            ? "அன்பு மாணவரே, ஆசிரியர் உங்களுக்காக தயாராக உள்ளார். தயவுசெய்து உங்கள் வினாவை மீண்டும் கேட்கவும்."
            : language === "en"
            ? "Dear student, teacher is ready to help you! Please try asking your question again."
            : "ආදරණීය දරුවා, ගුරුතුමා ඔබ වෙනුවෙන් සූදානම්! කරුණාකර ඔබගේ ප්‍රශ්නය නැවත විමසන්න.";
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: replyText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            language === "ta"
              ? "அன்பு மாணவரே, ஆசிரியர் உங்களுக்காக தயாராக உள்ளார். தயவுசெய்து உங்கள் வினாவை மீண்டும் கேட்கவும்."
              : language === "en"
              ? "Dear student, teacher is ready to help you! Please try asking your question again."
              : "ආදරණීය දරුවා, ගුරුතුමා ඔබ වෙනුවෙන් සූදානම්! කරුණාකර ඔබගේ ප්‍රශ්නය නැවත විමසන්න.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: "assistant",
        content: welcomeMessage,
        time: "Just now",
      },
    ]);
  };

  const handleSpeech = (text, idx) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_~]/g, "").replace(/##/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (language === "ta") utterance.lang = "ta-LK";
    else if (language === "en") utterance.lang = "en-US";
    else utterance.lang = "si-LK";

    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text, idx) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  // Quick Chips
  const quickChips = [
    {
      label: language === "ta" ? "மாதிரி வினா" : language === "en" ? "Practice quiz" : "ආදර්ශ ප්‍රශ්නයක්",
      prompt: "5 ශ්‍රේණිය පරිසරයෙන් මගෙන් ආදර්ශ ශිෂ්‍යත්ව ප්‍රශ්නයක් අහන්න. මම උත්තර දෙන්නම්!",
    },
    {
      label: language === "ta" ? "விதைப் பரம்பல்" : language === "en" ? "Seed dispersal" : "බීජ ව්‍යාප්තිය",
      prompt: "ශාකවල බීජ හා ඵල ව්‍යාප්ත වන ප්‍රධාන ක්‍රම 4 සහ උදාහරණ විස්තර කරන්න.",
    },
    {
      label: language === "ta" ? "பண்டைய மன்னர்கள்" : language === "en" ? "Kings & kingdoms" : "පණ්ඩුකාභය රජතුමා",
      prompt: "පණ්ඩුකාභය රජතුමා අනුරාධපුර නගරය සැලසුම් කළ ආකාරය සහ අභය වැව ගැන කියා දෙන්න.",
    },
    {
      label: language === "ta" ? "கணித ரகசியங்கள்" : language === "en" ? "Math shortcuts" : "ශිෂ්‍යත්ව ගණිත රහස්",
      prompt: "ත්‍රිකෝණ සංඛ්‍යා සූත්‍රය සහ ඔරලෝසු කැඩපත් වේලාව සොයන කෙටි ක්‍රමය කියා දෙන්න.",
    },
    {
      label: language === "ta" ? "எளிய இயந்திரங்கள்" : language === "en" ? "Simple machines" : "සරල යන්ත්‍ර & කප්පිය",
      prompt: "වැඩ පහසු කරන සරල යන්ත්‍ර (ආනත තලය, කප්පිය, ලීවරය) ගැන කියා දෙන්න.",
    },
  ];

  // Topics Grid
  const topics = [
    {
      title: language === "ta" ? "சுற்றாடல் 16 கருப்பொருட்கள்" : language === "en" ? "16 environmental themes" : "පරිසරය තේමා 16",
      sub: language === "ta" ? "விதை, நீர், விலங்குகள், எளிய இயந்திரங்கள்" : language === "en" ? "Seeds, water, animals, simple machines" : "බීජ, ජලය, සතුන්, සරල යන්ත්‍ර",
      prompt: "5 ශ්‍රේණිය පරිසරය විෂය නිර්දේශයේ ශාක වල බීජ ව්‍යාප්ති ක්‍රම 4 සහ උදාහරණ කියා දෙන්න.",
    },
    {
      title: language === "ta" ? "பண்டைய வரலாறு" : language === "en" ? "Ancient kingdoms" : "අපේ අතීත විත්ති",
      sub: language === "ta" ? "பண்டுக்காபய மன்னன், அபய வாவி" : language === "en" ? "Kings, panduwas and key events" : "පණ්ඩුකාභය රජතුමා සහ අභය වැව",
      prompt: "පණ්ඩුකාභය රජතුමා අනුරාධපුර නගරය සැලසුම් කළ ආකාරය සහ අභය වැව ගැන කියා දෙන්න.",
    },
    {
      title: language === "ta" ? "புலமைப்பரிசில் கணிதம்" : language === "en" ? "Scholarship maths" : "ශිෂ්‍යත්ව ගණිත රහස්",
      sub: language === "ta" ? "முக்கோண எண்கள், கடிகார சுருக்கு வழிகள்" : language === "en" ? "Triangular numbers, clock shortcuts" : "ත්‍රිකෝණ සංඛ්‍යා, ඔරලෝසු කෙටි ක්‍රම",
      prompt: "ත්‍රිකෝණ සංඛ්‍යා සූත්‍රය සහ ඔරලෝසු කැඩපත් වේලාව සොයන 190+ කෙටි ක්‍රමය කියා දෙන්න.",
    },
    {
      title: language === "ta" ? "மாதிரி வினாத்தாள்கள்" : language === "en" ? "Practice papers" : "විභාග ආදර්ශ ප්‍රශ්න",
      sub: language === "ta" ? "விடைகளுடன் கூடிய தேர்வு மட்ட வினாக்கள்" : language === "en" ? "Exam-level questions with answers" : "විභාග මට්ටමේ බහුවරණ ප්‍රශ්න පුහුණුව",
      prompt: "5 ශ්‍රේණිය පරිසරයෙන් මගෙන් ආදර්ශ ශිෂ්‍යත්ව ප්‍රශ්නයක් අහන්න. මම උත්තර දෙන්නම්!",
    },
  ];

  return (
    <>
      {/* Floating launcher button when closed */}
      {!isOpen && (
        <button
          type="button"
          className="chat-float-launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Open 190+ AI Tutor"
          title="190+ AI Tutor සමඟ කතා කරන්න"
        >
          <div className="chat-float-av">
            <img src="/teacher-face.jpg" alt="Teacher Avatar" />
            <i />
          </div>
          <div className="chat-float-info">
            <div className="chat-float-title">
              <span>190+ AI Tutor</span>
              <span className="chat-float-badge">LIVE</span>
            </div>
            <span className="chat-float-sub">
              {language === "ta" ? "ஆசிரியரிடம் கேளுங்கள்" : language === "en" ? "Ask the scholarship teacher" : "ඕනෑම විෂය ගැටළුවක් අසන්න"}
            </span>
          </div>
        </button>
      )}

      {/* Main Chatbot Window */}
      {isOpen && (
        <section
          className={`chat-wrap ${isExpanded ? "expanded" : ""}`}
          aria-label="190+ AI Tutor"
        >
          {/* Header */}
          <header>
            <div className="row" style={{ justifyContent: "space-between", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div className="av">
                  <img src="/teacher-face.jpg" alt="Teacher Avatar" />
                  <i />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h1>AI ගුරුතුමා ({selectedGrade} ශ්‍රේණිය)</h1>
                  <small>
                    {language === "ta"
                      ? "தரம் 3, 4, 5 ஆசிரியர் வழிகாட்டி"
                      : language === "en"
                      ? "Grades 3, 4, 5 NIE Teacher's Guide"
                      : "3, 4, 5 ශ්‍රේණි ශ්‍රී ලංකා ගුරු අත්පොත"}
                  </small>
                </div>
              </div>

              {/* Top-Right Always-Visible Controls: Tips, Reset, Resize, Close */}
              <div className="ib" style={{ marginLeft: "auto", flexShrink: 0 }}>
                <button
                  type="button"
                  aria-label="Tips"
                  onClick={() => setShowChips(!showChips)}
                  title={showChips ? "Hide quick tips" : "Show quick tips"}
                >
                  <svg><use href="#bulb" /></svg>
                </button>
                <button
                  type="button"
                  aria-label="New chat"
                  id="reset"
                  onClick={resetChat}
                  title="New chat"
                >
                  <svg><use href="#redo" /></svg>
                </button>
                <button
                  type="button"
                  aria-label="Resize"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "පොඩි කරන්න (Restore)" : "විශාල කරන්න (Resize)"}
                >
                  <svg><use href="#max" /></svg>
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  className="close-btn"
                  onClick={() => setIsOpen(false)}
                  title="වසන්න (Close)"
                >
                  <svg><use href="#x" /></svg>
                </button>
              </div>
            </div>

            {/* Dedicated Second Row: Proper-sized Grade Selector + Language Switch */}
            <div className="tools" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              {/* Grade selector (3, 4, 5) */}
              <div className="seg seg-grade" role="group" aria-label="Grade">
                {[3, 4, 5].map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={selectedGrade === g}
                    onClick={() => setSelectedGrade(g)}
                    title={`${g} ශ්‍රේණිය`}
                  >
                    {language === "en" ? `Grade ${g}` : `${g} ශ්‍රේණිය`}
                  </button>
                ))}
              </div>

              {/* Segmented language switch */}
              <div className="seg" role="group" aria-label="Language">
                <button
                  type="button"
                  aria-pressed={language === "si"}
                  onClick={() => handleLanguageChange("si")}
                >
                  සිං
                </button>
                <button
                  type="button"
                  aria-pressed={language === "en"}
                  onClick={() => handleLanguageChange("en")}
                >
                  EN
                </button>
                <button
                  type="button"
                  aria-pressed={language === "ta"}
                  onClick={() => handleLanguageChange("ta")}
                >
                  த
                </button>
              </div>
            </div>
          </header>

          {/* Quick topics chips bar */}
          {showChips && (
            <div className="chips" aria-label="Quick topics">
              <span>{language === "ta" ? "விரைவு:" : language === "en" ? "Quick topics:" : "ඉක්මන් තේරීම්:"}</span>
              {quickChips.map((chip, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  className="chip"
                  onClick={() => handleSend(chip.prompt)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Messages Stream */}
          <div className="msgs" id="msgs">
            {messages.map((m, mIdx) => {
              const isUser = m.role === "user";
              return (
                <div key={mIdx} className={`m ${isUser ? "u" : ""}`}>
                  {!isUser && (
                    <div className="a">
                      <img src="/teacher-face.jpg" alt="Teacher" />
                    </div>
                  )}

                  <div className="bub">
                    <FormattedMessage content={m.content} language={language} />

                    {/* Bot Actions */}
                    {!isUser && (
                      <div className="acts">
                        <button
                          type="button"
                          className="sm"
                          onClick={() => copyToClipboard(m.content, mIdx)}
                        >
                          <svg><use href="#copy" /></svg>
                          <span>{copiedIdx === mIdx ? (language === "en" ? "Copied" : "පිටපත් විය") : (language === "en" ? "Copy" : "පිටපත්")}</span>
                        </button>

                        <button
                          type="button"
                          className={`sm ${speakingIdx === mIdx ? "hl" : ""}`}
                          onClick={() => handleSpeech(m.content, mIdx)}
                        >
                          <svg><use href="#vol" /></svg>
                          <span>{speakingIdx === mIdx ? (language === "en" ? "Stop" : "නවත්වන්න") : (language === "en" ? "Listen" : "අහන්න")}</span>
                        </button>

                        <button
                          type="button"
                          className="sm hl"
                          onClick={() =>
                            handleSend(
                              language === "en"
                                ? "Ask me a model scholarship question from Grade 5."
                                : language === "ta"
                                ? "தரம் 5 இல் இருந்து என்னிடம் ஒரு மாதிரி வினாவை கேளுங்கள்."
                                : "5 ශ්‍රේණියෙන් මගෙන් ආදර්ශ ශිෂ්‍යත්ව ප්‍රශ්නයක් අහන්න."
                            )
                          }
                        >
                          <svg><use href="#target" /></svg>
                          <span>{language === "ta" ? "வினாடி வினா" : language === "en" ? "Practice quiz" : "ආදර්ශ ප්‍රශ්නයක්"}</span>
                        </button>

                        <Link href="/ai-tutor" className="sm">
                          <svg><use href="#ext" /></svg>
                          <span>{language === "ta" ? "கற்றல் கூடம்" : language === "en" ? "Learning hub" : "අධ්‍යයන මැදිරිය"}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Initial Welcome Topics Grid */}
            {messages.length === 1 && (
              <div className="topics" id="topics">
                <h2>{language === "ta" ? "தலைப்பைத் தேர்ந்தெடுக்கவும்" : language === "en" ? "Choose a topic to begin" : "ආරම්භ කිරීමට මාතෘකාවක් තෝරන්න"}</h2>
                <div className="grid">
                  {topics.map((t, tIdx) => (
                    <button
                      key={tIdx}
                      type="button"
                      className="t"
                      onClick={() => handleSend(t.prompt)}
                    >
                      <b>{t.title}</b>
                      <small>{t.sub}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="m">
                <div className="a">
                  <img src="/teacher-face.jpg" alt="Teacher" />
                </div>
                <div className="bub" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
                  <span>⏳</span>
                  <span>
                    {language === "ta"
                      ? "ஆசிரியர் வழிகாட்டியை ஆராய்கிறது..."
                      : language === "en"
                      ? "Reading NIE Guide & preparing answer..."
                      : "ගුරු මාර්ගෝපදේශය කියවමින් පිළිතුර සකසයි..."}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            id="f"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <button
              type="button"
              className="q"
              onClick={() =>
                handleSend(
                  language === "en"
                    ? "Ask me a challenging Grade 5 scholarship multiple-choice question."
                    : language === "ta"
                    ? "5ம் ஆண்டு புலமைப்பரிசில் மாதிரி வினாவைத் தாருங்கள்."
                    : "5 ශ්‍රේණිය පරිසරයෙන් මගෙන් ආදර්ශ ශිෂ්‍යත්ව ප්‍රශ්නයක් අහන්න. මම උත්තර දෙන්නම්!"
                )
              }
              title="Practice Quiz"
            >
              <svg><use href="#target" /></svg>
              <span>Quiz</span>
            </button>

            <textarea
              id="in"
              ref={textareaRef}
              rows={1}
              placeholder={
                language === "ta"
                  ? "ஆசிரியரிடம் எதையும் கேளுங்கள், எ-டு: விதைப் பரம்பல்"
                  : language === "en"
                  ? "Ask the teacher anything, e.g. seed dispersal"
                  : "ගුරුතුමාගෙන් ඕනෑම ප්‍රශ්නයක් අසන්න, උදා: බීජ ව්‍යාප්තිය"
              }
              aria-label="Your question"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <button
              type="submit"
              className="send"
              id="go"
              aria-label="Send"
              disabled={!input.trim() || loading}
            >
              <svg><use href="#send" /></svg>
            </button>
          </form>

          {/* Footer */}
          <footer>
            {language === "ta"
              ? "இலங்கை NIE தரம் 5 ஆசிரியர் வழிகாட்டியை அடிப்படையாகக் கொண்டது"
              : language === "en"
              ? "Based on the official NIE Grade 5 Teacher Guide"
              : "ශ්‍රී ලංකා NIE 5 ශ්‍රේණිය පොදු ගුරු මාර්ගෝපදේශය පදනම් කරගෙන ඇත"}
          </footer>
        </section>
      )}
    </>
  );
}
