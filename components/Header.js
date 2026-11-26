"use client";
import Link from "next/link";
import { useApp } from "../lib/Provider";

export default function Header() {
  const { S, me, login, lang, toggleLang, theme, toggleTheme, t } = useApp();
  const isSi = lang === "si";
  const isLight = theme === "light";

  return (
    <header className="hd centered-hd">
      {/* Left side: Language switcher, Light/Dark mode toggle & AI Tutor link */}
      <div className="hd-side hd-left">
        <button
          className="hd-btn hd-btn-ghost"
          onClick={toggleLang}
          title={isSi ? "Switch to English" : "භාෂාව සිංහලට මාරු කරන්න"}
        >
          🌐 <span>{isSi ? "English" : "සිංහල"}</span>
        </button>
        <button
          className="hd-btn hd-btn-ghost"
          onClick={toggleTheme}
          title={isLight ? (isSi ? "අඳුරු තේමාව (Dark Mode)" : "Switch to Dark Mode") : (isSi ? "ආලෝක තේමාව (Light Mode)" : "Switch to Light Mode")}
        >
          {isLight ? "🌙" : "☀️"} <span>{isLight ? (isSi ? "Dark" : "Dark") : (isSi ? "Light" : "Light")}</span>
        </button>
        <Link
          href="/ai-tutor"
          className="hd-btn hd-btn-ai"
          title={isSi ? "190+ ප්‍රවීණ AI ගුරුතුමා" : "190+ AI Tutor"}
        >
          🤖 <span>{isSi ? "190+ AI සහයක" : "190+ AI Tutor"}</span>
        </Link>
      </div>

      {/* Middle: Centered Brand Logo & Title */}
      <Link href="/" className="brand brand-center">
        <div className="brand-img-wrap">
          <img src={S.set.logo || "/logo.jpg"} alt={S.set.name} />
        </div>
        <div className="brand-text">
          <span className="brand-name">{t("brand")}</span>
          <span className="brand-badge">{t("brandSub")}</span>
        </div>
      </Link>

      {/* Right side: Contact & Login / Dashboard buttons */}
      <div className="hd-side hd-right">
        <a
          href="https://wa.me/94771234567"
          target="_blank"
          rel="noopener noreferrer"
          className="hd-btn hd-btn-whatsapp"
          title="WhatsApp"
        >
          💬 <span>{isSi ? "වට්ස්ඇප්" : "WhatsApp"}</span>
        </a>

        {me ? (
          <>
            <Link
              className="hd-btn hd-btn-primary"
              href={me.admin ? "/admin" : "/dashboard"}
            >
              👤 <span>{me.name?.split(" ")[0]} ({me.admin ? (isSi ? "පාලක" : "Admin") : (isSi ? "පුවරුව" : "Dashboard")})</span>
            </Link>
            <button
              className="hd-btn hd-btn-ghost"
              onClick={() => login(null)}
              title={t("logout")}
            >
              <span>{t("logout")}</span>
            </button>
          </>
        ) : (
          <>
            <Link
              className="hd-btn hd-btn-ghost"
              href="/login"
            >
              <span>{t("login")}</span>
            </Link>
            <Link
              className="hd-btn hd-btn-primary"
              href="/login?mode=reg"
            >
              <span>{t("reg")}</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
