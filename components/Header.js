"use client";
import Link from "next/link";
import { useApp } from "../lib/Provider";

export default function Header() {
  const { S, me, login, lang, toggleLang, t } = useApp();

  return (
    <header className="hd centered-hd">
      {/* Left side: Language switcher & AI Tutor link */}
      <div className="hd-side hd-left">
        <button
          className="ghost"
          onClick={toggleLang}
          style={{ fontSize: "0.82rem", padding: "7px 14px" }}
          title={lang === "si" ? "Change to English" : "භාෂාව සිංහලට මාරු කරන්න"}
        >
          🌐 {lang === "si" ? "English" : "සිංහල"}
        </button>
        <Link
          href="/ai-tutor"
          className="btn ghost ai-nav-link"
          style={{ fontSize: "0.82rem", padding: "7px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          🤖 <span className="ai-nav-text">{lang === "si" ? "190+ AI සහයක" : "190+ AI Tutor"}</span>
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
          className="btn whatsapp-btn"
          style={{ fontSize: "0.82rem", padding: "7px 14px" }}
        >
          💬 {lang === "si" ? "වට්ස්ඇප්" : "WhatsApp"}
        </a>

        {me ? (
          <>
            <Link
              className="btn"
              href={me.admin ? "/admin" : "/dashboard"}
              style={{ fontSize: "0.82rem", padding: "7px 16px" }}
            >
              👤 {me.name?.split(" ")[0]} ({me.admin ? (lang === "si" ? "පාලක" : "Admin") : (lang === "si" ? "පුවරුව" : "Dashboard")})
            </Link>
            <button
              className="ghost"
              onClick={() => login(null)}
              style={{ fontSize: "0.82rem", padding: "7px 12px" }}
            >
              {t("logout")}
            </button>
          </>
        ) : (
          <>
            <Link
              className="btn ghost"
              href="/login"
              style={{ fontSize: "0.82rem", padding: "7px 14px" }}
            >
              {t("login")}
            </Link>
            <Link
              className="btn"
              href="/login?mode=reg"
              style={{ fontSize: "0.82rem", padding: "7px 16px" }}
            >
              {t("reg")}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
