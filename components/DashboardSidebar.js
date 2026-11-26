"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "../lib/Provider";

export default function DashboardSidebar({
  role = "admin", // "admin" | "student"
  activeTab,
  onTabChange,
  pendingCount = 0,
  foldersCount = 0,
  studentsCount = 0,
}) {
  const { me, login, lang } = useApp();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = role === "admin";
  const isSi = lang === "si";

  const adminNav = isSi
    ? [
        { id: "overview", label: "දළ විශ්ලේෂණය", icon: "#grid" },
        { id: "packages", label: "මාසික පන්ති කළමනාකරණය", icon: "#folder", badge: foldersCount },
        { id: "content", label: "Zoom / Video / PDF එක් කරන්න", icon: "#doc" },
        { id: "payments", label: "මාසික ගෙවීම් රිසිට්පත්", icon: "#card", badge: pendingCount, isAlert: pendingCount > 0 },
        { id: "students", label: "ශිෂ්‍ය නාමාවලිය", icon: "#users", badge: studentsCount },
        { id: "settings", label: "පන්ති සැකසුම්", icon: "#cog" },
      ]
    : [
        { id: "overview", label: "Dashboard overview", icon: "#grid" },
        { id: "packages", label: "Monthly classes", icon: "#folder", badge: foldersCount },
        { id: "content", label: "Add Zoom / Video / PDF", icon: "#doc" },
        { id: "payments", label: "Monthly fee slips", icon: "#card", badge: pendingCount, isAlert: pendingCount > 0 },
        { id: "students", label: "Students", icon: "#users", badge: studentsCount },
        { id: "settings", label: "Class settings", icon: "#cog" },
      ];

  const studentNav = isSi
    ? [
        { id: "all_packages", label: "මාසික පන්ති ලැයිස්තුව", icon: "#folder", badge: foldersCount },
        { id: "my_packages", label: "මගේ විවෘත මාස", icon: "#doc" },
        { id: "overview", label: "190+ ප්‍රගති විශ්ලේෂණය", icon: "#grid" },
        { id: "timer", label: "වේග පාලන කාල ගණකය", icon: "#clock" },
        { id: "my_slips", label: "ගෙවීම් රිසිට්පත්", icon: "#card" },
      ]
    : [
        { id: "all_packages", label: "Monthly classes", icon: "#folder", badge: foldersCount },
        { id: "my_packages", label: "My unlocked months", icon: "#doc" },
        { id: "overview", label: "Progress & Analysis", icon: "#grid" },
        { id: "timer", label: "Speed timer", icon: "#clock" },
        { id: "my_slips", label: "Payment slips", icon: "#card" },
      ];

  const navItems = isAdmin ? adminNav : studentNav;

  const handleNavClick = (id) => {
    onTabChange(id);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    login(null);
    router.push("/login");
  };

  return (
    <aside>
      {/* Brand */}
      <Link href="/" className="brand" title={isSi ? "මුල් පිටුව වෙත" : "Go to Home"}>
        <div className="crest">P</div>
        <div>
          <b>Paha Dinana Hapannu</b>
          <small>190+ Paper Class</small>
        </div>
      </Link>

      {/* User profile */}
      <div className="me">
        <div className="av">
          <svg><use href="#user" /></svg>
        </div>
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <b style={{ whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
            {me?.name || (isAdmin ? (isSi ? "ප්‍රධාන ගුරුතුමා" : "Lead Teacher") : (isSi ? "ශිෂ්‍ය සාමාජිකයා" : "Student"))}
          </b>
          <small>
            {isAdmin
              ? (isSi ? "ප්‍රධාන පරිපාලක" : "Administrator")
              : (isSi ? `${me?.grade || 5} ශ්‍රේණියේ ශිෂ්‍ය` : `Grade ${me?.grade || 5} Student`)}
          </small>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="dash-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-link ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => handleNavClick(item.id)}
            >
              <svg><use href={item.icon} /></svg>
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="n">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Tutor Card */}
      <Link href="/ai-tutor" className="tutor-s">
        <svg><use href="#spark" /></svg>
        <span>190+ AI Tutor</span>
        <span className="live">Live</span>
      </Link>

      {/* Bottom utilities */}
      <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
        <Link
          href="/"
          className="btn"
          style={{
            flex: 1,
            padding: "8px 10px",
            fontSize: "12.5px",
            justifyContent: "center",
            background: "rgba(255,255,255,0.06)",
            color: "var(--side-ink)",
            borderColor: "rgba(255,255,255,0.12)",
          }}
          title={isSi ? "මුල් පිටුවට යන්න" : "Go to Home"}
        >
          <svg style={{ width: 14, height: 14 }}><use href="#home" /></svg>
          <span>{isSi ? "මුල් පිටුව" : "Home"}</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="btn"
          style={{
            flex: 1,
            padding: "8px 10px",
            fontSize: "12.5px",
            justifyContent: "center",
            background: "rgba(255,255,255,0.06)",
            color: "#fca5a5",
            borderColor: "rgba(252,165,165,0.2)",
          }}
          title={isSi ? "ගිණුමෙන් ඉවත් වන්න" : "Log out"}
        >
          <svg style={{ width: 14, height: 14 }}><use href="#logout" /></svg>
          <span>{isSi ? "ඉවත් වන්න" : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}
