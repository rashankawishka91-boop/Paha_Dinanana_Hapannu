"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp, uid } from "../../lib/Provider";

export default function Login() {
  const { S, update, login, lang, t } = useApp();
  const router = useRouter();
  const isSi = lang === "si";

  const [reg, setReg] = useState(false);
  const [roleTab, setRoleTab] = useState("student"); // "student" or "admin"
  const [f, setF] = useState({ name: "", phone: "", pass: "", grade: 5 });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isReg = new URLSearchParams(window.location.search).get("mode") === "reg";
    setReg(isReg);
    if (new URLSearchParams(window.location.search).get("role") === "admin") {
      setRoleTab("admin");
    }
  }, []);

  const go = user => {
    login(user.id);
    setLoading(true);
    setTimeout(() => {
      if (user.admin) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }, 100);
  };

  const quickAdminLogin = () => {
    const adminUser = S.users.find(u => u.admin || u.id === "admin");
    if (adminUser) {
      go(adminUser);
    } else {
      setErr("Admin ගිණුම හමු නොවීය. කරුණාකර නැවත උත්සාහ කරන්න.");
    }
  };

  const quickStudentLogin = () => {
    const studentUser = S.users.find(u => !u.admin && u.phone === "0771122334") || S.users.find(u => !u.admin);
    if (studentUser) {
      go(studentUser);
    } else {
      // create demo student
      const newStudent = {
        id: "demo-student",
        name: "කසුන් මධුෂාන් (ශිෂ්‍ය)",
        phone: "0771122334",
        pass: "1234",
        grade: 5,
        admin: false
      };
      update(s => s.users.push(newStudent));
      go(newStudent);
    }
  };

  const submit = e => {
    e.preventDefault();
    setErr("");
    const phoneInput = f.phone.trim();
    const passInput = f.pass.trim();

    if (reg) {
      if (!f.name.trim() || !phoneInput || !passInput) {
        return setErr("කරුණාකර සියලු විස්තර සම්පූර්ණ කරන්න.");
      }
      if (S.users.some(u => u.phone === phoneInput)) {
        return setErr(t("exists"));
      }
      const u = {
        id: uid(),
        name: f.name.trim(),
        phone: phoneInput,
        pass: passInput,
        grade: +f.grade,
        admin: false
      };
      update(s => {
        s.users.push(u);
      });
      go(u);
    } else {
      // Find matching user (handles admin, Admin, phone, or username)
      const u = S.users.find(
        user =>
          (user.phone?.toLowerCase() === phoneInput.toLowerCase() ||
           user.id?.toLowerCase() === phoneInput.toLowerCase()) &&
          user.pass === passInput
      );

      if (!u) {
        return setErr("දුරකථන අංකය/නම හෝ මුරපදය වැරදියි. Admin සඳහා phone: admin සහ pass: admin123 ඇතුළත් කරන්න.");
      }
      go(u);
    }
  };

  const setField = k => e => setF({ ...f, [k]: e.target.value });

  return (
    <main className="wrap">
      <div className="card auth" style={{ border: "1px solid var(--gold)", position: "relative" }}>
        {/* Top Header Badge */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ display: "inline-block", position: "relative", marginBottom: "8px" }}>
            <img
              src="/logo.jpg"
              alt="Logo"
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                border: "2px solid var(--gold)",
                boxShadow: "0 0 16px rgba(245, 166, 35, 0.4)"
              }}
            />
          </div>
          <h2 style={{ fontSize: "1.7rem", marginBottom: "4px" }}>
            {reg
              ? (isSi ? "🎯 ලියාපදිංචි වීම" : "🎯 Register")
              : roleTab === "admin"
              ? (isSi ? "👑 ගුරු පිවිසුම" : "👑 Teacher Portal")
              : (isSi ? "🎓 ශිෂ්‍ය පිවිසුම" : "🎓 Student Portal")}
          </h2>
          <p className="mut" style={{ fontSize: "0.85rem", margin: 0 }}>
            {t("slogan")}
          </p>
        </div>

        {/* Role Selector Tabs (Only in login mode) */}
        {!reg && (
          <div className="tabs" style={{ justifyContent: "center", marginBottom: "20px" }}>
            <button
              type="button"
              className={roleTab === "student" ? "on" : "ghost"}
              onClick={() => {
                setRoleTab("student");
                setF({ ...f, phone: "", pass: "" });
                setErr("");
              }}
              style={{ fontSize: "0.88rem", padding: "8px 18px" }}
            >
              🎓 {isSi ? "ශිෂ්‍යයා" : "Student"}
            </button>
            <button
              type="button"
              className={roleTab === "admin" ? "on" : "ghost"}
              onClick={() => {
                setRoleTab("admin");
                setF({ ...f, phone: "admin", pass: "admin123" });
                setErr("");
              }}
              style={{ fontSize: "0.88rem", padding: "8px 18px" }}
            >
              👑 {isSi ? "ගුරුතුමා" : "Teacher"}
            </button>
          </div>
        )}

        <form onSubmit={submit}>
          {reg && (
            <label>
              👤 {t("name")}
              <input
                placeholder={isSi ? "දරුවාගේ හෝ මවුපියන්ගේ නම" : "Student or Parent Full Name"}
                value={f.name}
                onChange={setField("name")}
                required
              />
            </label>
          )}

          <label>
            📱 {roleTab === "admin" && !reg ? (isSi ? "පරිශීලක නම හෝ දුරකථන අංකය" : "Username or Phone") : t("phone")}
            <input
              placeholder={roleTab === "admin" && !reg ? "admin" : (isSi ? "උදා: 0771234567" : "e.g. 0771234567")}
              value={f.phone}
              onChange={setField("phone")}
              required
            />
          </label>

          <label>
            🔒 {t("pass")}
            <input
              type="password"
              placeholder={roleTab === "admin" && !reg ? "admin123" : (isSi ? "මුරපදය" : "Password")}
              value={f.pass}
              onChange={setField("pass")}
              required
            />
          </label>

          {reg && (
            <label>
              🎓 {t("grade")}
              <select value={f.grade} onChange={setField("grade")}>
                <option value={5}>{isSi ? "5 ශ්‍රේණිය (🔥 190+ පේපර් පන්තිය)" : "Grade 5 (🔥 190+ Target Class)"}</option>
                <option value={4}>{isSi ? "4 ශ්‍රේණිය (ශිෂ්‍යත්ව පූර්ව අඩිතාලම)" : "Grade 4 (Pre-Foundation)"}</option>
                <option value={3}>{isSi ? "3 ශ්‍රේණිය" : "Grade 3"}</option>
                <option value={2}>{isSi ? "2 ශ්‍රේණිය" : "Grade 2"}</option>
                <option value={1}>{isSi ? "1 ශ්‍රේණිය" : "Grade 1"}</option>
              </select>
            </label>
          )}

          {err && (
            <div
              role="alert"
              style={{
                color: "#ff9999",
                background: "rgba(255, 60, 60, 0.15)",
                border: "1px solid rgba(255, 60, 60, 0.3)",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "0.88rem",
                marginTop: "14px",
                lineHeight: 1.5
              }}
            >
              ⚠️ {err}
            </div>
          )}

          <p style={{ marginTop: "22px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "12px", fontSize: "1rem" }}
            >
              {loading
                ? (isSi ? "පිවිසෙමින් පවතී..." : "Signing in...")
                : reg
                ? (isSi ? "🎯 ලියාපදිංචි වී පුවරුවට පිවිසෙන්න" : "🎯 Register & Enter Dashboard")
                : (isSi ? "🔑 ඇතුල් වන්න" : "🔑 Sign In")}
            </button>
          </p>
        </form>

        {/* Quick One-Click Login Shortcuts */}
        {!reg && (
          <div
            style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px dashed rgba(245, 166, 35, 0.25)"
            }}
          >
            <p className="mut" style={{ textAlign: "center", marginBottom: "10px", fontSize: "0.82rem" }}>
              {isSi ? "⚡ ඉක්මන් පරීක්ෂාව සඳහා:" : "⚡ Fast Demo Logins:"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button
                type="button"
                className="ghost"
                onClick={quickAdminLogin}
                style={{ fontSize: "0.82rem", padding: "8px 10px", borderColor: "var(--gold)" }}
              >
                👑 {isSi ? "ගුරු පිවිසුම" : "Teacher Login"}
              </button>
              <button
                type="button"
                className="ghost"
                onClick={quickStudentLogin}
                style={{ fontSize: "0.82rem", padding: "8px 10px" }}
              >
                🎓 {isSi ? "ශිෂ්‍ය පිවිසුම" : "Student Login"}
              </button>
            </div>
          </div>
        )}

        {/* Toggle between Register and Login */}
        <p className="mut" style={{ textAlign: "center", marginTop: "18px", fontSize: "0.9rem" }}>
          {reg ? t("have") : t("nohave")}{" "}
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              setReg(!reg);
              setErr("");
            }}
            style={{ color: "var(--gold)", fontWeight: 700 }}
          >
            {reg ? t("login") : t("reg")}
          </a>
        </p>
      </div>
    </main>
  );
}
