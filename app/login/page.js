"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp, uid } from "../../lib/Provider";

export default function LoginPage() {
  const { S, update, login, lang, toggleLang } = useApp();
  const router = useRouter();
  const isSi = lang === "si";

  const [reg, setReg] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", pass: "", grade: 5 });
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "reg") {
      setReg(true);
    }
  }, []);

  const setField = (k) => (e) => {
    setF((prev) => ({ ...prev, [k]: e.target.value }));
    if (err) setErr("");
  };

  const submit = (e) => {
    e.preventDefault();
    setErr("");
    const phoneInput = f.phone.trim();
    const passInput = f.pass.trim();

    if (reg) {
      // Registration Flow (Students only)
      if (!f.name.trim() || !phoneInput || !passInput) {
        return setErr(
          isSi
            ? "කරුණාකර සියලු විස්තර සම්පූර්ණ කරන්න."
            : "Please fill in all the required fields."
        );
      }

      if (S.users.some((u) => u.phone === phoneInput)) {
        return setErr(
          isSi
            ? "මෙම දුරකථන අංකය දැනටමත් ලියාපදිංචි කර ඇත."
            : "This phone number is already registered."
        );
      }

      const newUser = {
        id: uid(),
        name: f.name.trim(),
        phone: phoneInput,
        pass: passInput,
        grade: Number(f.grade) || 5,
        admin: false,
      };

      update((s) => {
        s.users.push(newUser);
      });

      login(newUser.id);
      setLoading(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 100);
    } else {
      // Unified Login Flow
      if (!phoneInput || !passInput) {
        return setErr(
          isSi
            ? "කරුණාකර දුරකථන අංකය සහ මුරපදය ඇතුළත් කරන්න."
            : "Please enter your phone number and password."
        );
      }

      // Check if credentials match Admin (either admin/admin123 or registered admin account)
      const isAdminLogin =
        (phoneInput.toLowerCase() === "admin" && passInput === "admin123") ||
        S.users.some(
          (u) =>
            u.admin &&
            (u.phone?.toLowerCase() === phoneInput.toLowerCase() ||
              u.id?.toLowerCase() === phoneInput.toLowerCase()) &&
            u.pass === passInput
        );

      if (isAdminLogin) {
        const adminAccount = S.users.find((u) => u.admin) || {
          id: "admin",
          name: isSi ? "ප්‍රධාන ගුරුතුමා" : "Principal Teacher",
          phone: "admin",
          pass: "admin123",
          admin: true,
        };

        login(adminAccount.id);
        setLoading(true);
        setTimeout(() => {
          router.push("/admin");
        }, 100);
        return;
      }

      // Check if credentials match any Student
      const studentAccount = S.users.find(
        (u) =>
          (u.phone?.toLowerCase() === phoneInput.toLowerCase() ||
            u.id?.toLowerCase() === phoneInput.toLowerCase()) &&
          u.pass === passInput
      );

      if (studentAccount) {
        login(studentAccount.id);
        setLoading(true);
        setTimeout(() => {
          router.push(studentAccount.admin ? "/admin" : "/dashboard");
        }, 100);
        return;
      }

      // Credentials did not match
      setErr(
        isSi
          ? "ඇතුළත් කළ දුරකථන අංකය හෝ මුරපදය වැරදියි. කරුණාකර නැවත උත්සාහ කරන්න."
          : "Invalid phone number or password. Please try again."
      );
    }
  };

  return (
    <main
      className="wrap"
      style={{
        minHeight: "82vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 16px",
      }}
    >
      <div
        className="card auth"
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "linear-gradient(180deg, rgba(28, 16, 22, 0.96) 0%, rgba(18, 10, 15, 0.98) 100%)",
          border: "1px solid rgba(245, 166, 35, 0.35)",
          borderRadius: "20px",
          padding: "32px 28px",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.55), 0 0 30px rgba(245, 166, 35, 0.12)",
          position: "relative",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Language Switcher Pill */}
        <div style={{ position: "absolute", top: "18px", right: "20px" }}>
          <button
            type="button"
            onClick={toggleLang}
            title={isSi ? "Switch to English" : "සිංහල භාෂාවට මාරු වන්න"}
            style={{
              background: "rgba(245, 166, 35, 0.12)",
              border: "1px solid rgba(245, 166, 35, 0.4)",
              color: "var(--gold)",
              padding: "5px 12px",
              borderRadius: "20px",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            🌐 {isSi ? "English" : "සිංහල"}
          </button>
        </div>

        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "26px", marginTop: "4px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "74px",
              height: "74px",
              borderRadius: "50%",
              padding: "3px",
              background: "linear-gradient(135deg, #f5a623, #ff7b00)",
              boxShadow: "0 0 24px rgba(245, 166, 35, 0.45)",
              marginBottom: "14px",
            }}
          >
            <img
              src="/logo.jpg"
              alt="Logo"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>

          <h1
            style={{
              fontSize: "1.65rem",
              fontWeight: 800,
              color: "#fff",
              marginBottom: "6px",
              letterSpacing: "-0.01em",
            }}
          >
            {reg
              ? isSi
                ? "නව ශිෂ්‍ය ලියාපදිංචිය"
                : "Student Registration"
              : isSi
              ? "ශිෂ්‍ය පිවිසුම"
              : "Student Login"}
          </h1>

          <p
            style={{
              color: "var(--gold)",
              fontSize: "0.86rem",
              fontWeight: 600,
              margin: 0,
            }}
          >
            {isSi
              ? "පහ දිනන හපන්නු 190+ පේපර් පන්තිය"
              : "Paha Dinana Hapannu 190+ Paper Class"}
          </p>

          <p
            className="mut"
            style={{
              fontSize: "0.78rem",
              marginTop: "4px",
              marginBottom: 0,
              opacity: 0.85,
            }}
          >
            {isSi
              ? "කොපි කරන්නත් බෑ.. සම කරන්නත් බෑ..."
              : "Cannot be copied.. Cannot be matched..."}
          </p>
        </div>

        {/* Error Alert Box */}
        {err && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fca5a5",
              padding: "12px 14px",
              borderRadius: "12px",
              fontSize: "0.85rem",
              marginBottom: "18px",
              lineHeight: 1.45,
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
            <span>{err}</span>
          </div>
        )}

        {/* Unified Form */}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Full Name Field (Registration Only) */}
          {reg && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.86rem",
                  fontWeight: 600,
                  color: "#e2e8f0",
                  marginBottom: "6px",
                }}
              >
                👤 {isSi ? "දරුවාගේ හෝ මවුපියන්ගේ සම්පූර්ණ නම" : "Student or Parent Full Name"}
              </label>
              <input
                type="text"
                placeholder={isSi ? "නම ඇතුළත් කරන්න" : "Enter full name"}
                value={f.name}
                onChange={setField("name")}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(15, 10, 14, 0.75)",
                  color: "#fff",
                  fontSize: "0.92rem",
                  outline: "none",
                }}
              />
            </div>
          )}

          {/* Phone / User Field */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.86rem",
                fontWeight: 600,
                color: "#e2e8f0",
                marginBottom: "6px",
              }}
            >
              📱 {isSi ? "දුරකථන අංකය" : "Phone Number"}
            </label>
            <input
              type="text"
              placeholder={isSi ? "උදා: 0771234567" : "e.g. 0771234567"}
              value={f.phone}
              onChange={setField("phone")}
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(15, 10, 14, 0.75)",
                color: "#fff",
                fontSize: "0.92rem",
                outline: "none",
              }}
            />
          </div>

          {/* Password Field with Show/Hide toggle */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.86rem",
                fontWeight: 600,
                color: "#e2e8f0",
                marginBottom: "6px",
              }}
            >
              🔒 {isSi ? "මුරපදය" : "Password"}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder={isSi ? "මුරපදය ඇතුළත් කරන්න" : "Enter your password"}
                value={f.pass}
                onChange={setField("pass")}
                required
                style={{
                  width: "100%",
                  padding: "12px 42px 12px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(15, 10, 14, 0.75)",
                  color: "#fff",
                  fontSize: "0.92rem",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  padding: "4px 6px",
                }}
                title={showPass ? (isSi ? "මුරපදය සඟවන්න" : "Hide password") : (isSi ? "මුරපදය පෙන්වන්න" : "Show password")}
              >
                {showPass ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          {/* Grade Selector (Registration Only) */}
          {reg && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.86rem",
                  fontWeight: 600,
                  color: "#e2e8f0",
                  marginBottom: "6px",
                }}
              >
                🎓 {isSi ? "ශ්‍රේණිය" : "Grade"}
              </label>
              <select
                value={f.grade}
                onChange={setField("grade")}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(15, 10, 14, 0.9)",
                  color: "#fff",
                  fontSize: "0.92rem",
                  outline: "none",
                }}
              >
                <option value={5}>
                  {isSi
                    ? "5 ශ්‍රේණිය (190+ පේපර් පන්තිය)"
                    : "Grade 5 (190+ Target Class)"}
                </option>
                <option value={4}>
                  {isSi
                    ? "4 ශ්‍රේණිය (ශිෂ්‍යත්ව පූර්ව අඩිතාලම)"
                    : "Grade 4 (Pre-Scholarship Foundation)"}
                </option>
                <option value={3}>
                  {isSi
                    ? "3 ශ්‍රේණිය (මූලික පදනම සහ පේපර් පුහුණුව)"
                    : "Grade 3 (Foundation & Paper Practice)"}
                </option>
              </select>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "10px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #f5a623 0%, #e07d08 100%)",
              color: "#180a0f",
              fontWeight: 800,
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 8px 24px rgba(245, 166, 35, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            {loading ? (
              <span>{isSi ? "පිවිසෙමින් පවතී..." : "Signing in..."}</span>
            ) : reg ? (
              <span>{isSi ? "🎯 ලියාපදිංචි වී පුවරුවට පිවිසෙන්න" : "🎯 Register & Enter Dashboard"}</span>
            ) : (
              <span>{isSi ? "🔑 පුවරුවට ඇතුල් වන්න" : "🔑 Sign In to Dashboard"}</span>
            )}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "18px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            textAlign: "center",
          }}
        >
          <p
            className="mut"
            style={{
              fontSize: "0.88rem",
              margin: 0,
              color: "#cbd5e1",
            }}
          >
            {reg
              ? isSi
                ? "දැනටමත් ගිණුමක් තිබේද?"
                : "Already have an account?"
              : isSi
              ? "නව ශිෂ්‍යයෙක්ද?"
              : "New student?"}{" "}
            <button
              type="button"
              onClick={() => {
                setReg(!reg);
                setErr("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--gold)",
                fontWeight: 700,
                cursor: "pointer",
                padding: "2px 4px",
                fontSize: "0.88rem",
                textDecoration: "underline",
              }}
            >
              {reg
                ? isSi
                  ? "ඇතුල් වන්න"
                  : "Sign In"
                : isSi
                ? "මෙහි ලියාපදිංචි වන්න"
                : "Register here"}
            </button>
          </p>

          {/* Back to Home Link */}
          <div style={{ marginTop: "14px" }}>
            <Link
              href="/"
              style={{
                color: "#94a3b8",
                fontSize: "0.82rem",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
            >
              {isSi ? "← මුල් පිටුවට ආපසු යන්න" : "← Back to Home"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
