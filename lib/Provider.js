"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { T } from "./i18n";

const defAdmin = {
  id: "admin",
  name: "ප්‍රධාන ගුරුතුමා (Admin)",
  phone: "admin",
  pass: "admin123",
  admin: true
};

const defStudent = {
  id: "demo-student",
  name: "කසුන් මධුෂාන් (ශිෂ්‍ය)",
  phone: "0771122334",
  pass: "1234",
  grade: 5,
  admin: false
};

const def = {
  users: [defAdmin, defStudent],
  folders: [
    {
      id: "f1",
      grade: 5,
      name: "පළාත් පේපර් කට්ටලය 01 (බස්නාහිර & වයඹ පළාත් - දිනකට පේපර් 2ක්)",
      price: 2000,
      papersCount: "දිනකට පේපර් 2ක්",
      subjects: "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි"
    },
    {
      id: "f2",
      grade: 5,
      name: "පළාත් පේපර් කට්ටලය 02 (දකුණු & මධ්‍යම පළාත් + ගණිත ගැටළු විශේෂ)",
      price: 2000,
      papersCount: "දිනකට පේපර් 2ක්",
      subjects: "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි"
    },
    {
      id: "f3",
      grade: 5,
      name: "පළාත් පේපර් කට්ටලය 03 (සබරගමුව & ඌව පළාත් + දෙමළ/ඉංග්‍රීසි විශේෂ)",
      price: 2000,
      papersCount: "දිනකට පේපර් 2ක්",
      subjects: "දෙමළ, ඉංග්‍රීසි, මව්බස, පරිසරය, ගණිතය"
    },
    {
      id: "f4",
      grade: 5,
      name: "190+ සුපිරි අනුමාන පේපර් 20 + පරිසරය විශේෂ විවරණය",
      price: 2500,
      papersCount: "විශේෂ අනුමාන පේපර්",
      subjects: "විෂයයන් 5ම සම්පූර්ණයෙන්ම"
    },
    {
      id: "f5",
      grade: 4,
      name: "4 ශ්‍රේණිය - ශිෂ්‍යත්ව පූර්ව අඩිතාලම & මූලික පේපර් කට්ටලය",
      price: 1800,
      papersCount: "මූලික පේපර් කට්ටලය",
      subjects: "මව්බස, ගණිතය, පරිසරය"
    }
  ],
  items: [
    {
      id: "i1",
      fid: "f1",
      type: "video",
      subject: "ගණිතය & මව්බස",
      title: "බස්නාහිර පළාත් පේපර් 01 - පළමු අර්ධය (ප්‍රශ්න 1-25) සවිස්තර සාකච්ඡාව & වේග උපක්‍රම",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      id: "i2",
      fid: "f1",
      type: "pdf",
      subject: "සියලු විෂයයන්",
      title: "බස්නාහිර පළාත් පේපර් 01 - සම්පූර්ණ ප්‍රශ්න පත්‍රය (මුද්‍රණය සඳහා PDF)",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: "i3",
      fid: "f1",
      type: "video",
      subject: "පරිසරය, දෙමළ, ඉංග්‍රීසි",
      title: "වයඹ පළාත් පේපර් 01 - පරිසරය, දෙමළ හා ඉංග්‍රීසි ප්‍රශ්න විවරණය (ලකුණු නොකැපෙන රහස්)",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      id: "i4",
      fid: "f1",
      type: "pdf",
      subject: "විෂයයන් 5ම",
      title: "පළාත් පේපර් 01 - ආදර්ශ නිවැරදි පිළිතුරු පත්‍රිකාව & ලකුණු මට්ටම් (PDF)",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    }
  ],
  pays: [],
  set: {
    name: "පහ දිනන හපන්නු - 190+ පේපර් පන්තිය",
    slogan: "කොපි කරන්නත් බෑ.. සම කරන්නත් බෑ... ඒ තමයි පහ දිනන හපන්නු!",
    logo: "/logo.jpg",
    hotline: "077 123 4567",
    bank: "බැංකුව: ලංකා බැංකුව (Bank of Ceylon)\nගිණුම් අංකය: 001234567890\nගිණුමේ නම: පහ දිනන හපන්නු පේපර් පන්තිය\nශාඛාව: කොළඹ ප්‍රධාන ශාඛාව\n(මුදල් තැන්පත් කළ පසු රිසිට්පත මෙහි උඩුගත කරන්න හෝ WhatsApp කරන්න: 077 123 4567)"
  }
};

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
export const uid = () => Math.random().toString(36).slice(2, 10);

export function Provider({ children }) {
  const [S, setS] = useState(def);
  const [meId, setMe] = useState(null);
  const [lang, setLang] = useState("si");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("paha_dinana_cls") || localStorage.getItem("cls");
      let activeState = structuredClone(def);

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            activeState = { ...activeState, ...parsed };
          }
        } catch (err) {
          console.error("Failed to parse stored state", err);
        }
      }

      // GUARANTEE: Admin user must always exist in users array
      if (!Array.isArray(activeState.users)) {
        activeState.users = [defAdmin, defStudent];
      } else {
        const adminIdx = activeState.users.findIndex(
          u => u.id === "admin" || u.phone?.toLowerCase() === "admin" || u.admin === true
        );
        if (adminIdx === -1) {
          activeState.users.unshift(defAdmin);
        } else {
          activeState.users[adminIdx] = {
            ...defAdmin,
            ...activeState.users[adminIdx],
            admin: true,
            phone: "admin",
            pass: activeState.users[adminIdx].pass || "admin123"
          };
        }

        // Also ensure demo student exists
        if (!activeState.users.some(u => u.phone === "0771122334")) {
          activeState.users.push(defStudent);
        }
      }

      // Ensure folders and items exist
      if (!Array.isArray(activeState.folders) || activeState.folders.length === 0) {
        activeState.folders = def.folders;
      }
      if (!Array.isArray(activeState.items) || activeState.items.length === 0) {
        activeState.items = def.items;
      }

      // Branding verification
      activeState.set = { ...def.set, ...activeState.set };
      if (!activeState.set.name || !activeState.set.name.includes("පහ දිනන")) {
        activeState.set.name = def.set.name;
        activeState.set.slogan = def.set.slogan;
      }

      setS(activeState);
      localStorage.setItem("paha_dinana_cls", JSON.stringify(activeState));

      // Load logged-in user ID
      const savedMeId = localStorage.getItem("paha_dinana_me") || localStorage.getItem("cls_me");
      if (savedMeId) {
        setMe(savedMeId);
      }

      setLang(localStorage.getItem("paha_dinana_lang") || localStorage.getItem("cls_lang") || "si");
    } catch (e) {
      console.error(e);
    }
    setReady(true);
  }, []);

  const update = fn =>
    setS(prev => {
      const next = structuredClone(prev);
      fn(next);
      // Guarantee admin stays in users
      if (!next.users.some(u => u.admin)) {
        next.users.unshift(defAdmin);
      }
      try {
        localStorage.setItem("paha_dinana_cls", JSON.stringify(next));
      } catch (e) {
        alert("Storage is full!");
      }
      return next;
    });

  const login = idOrObj => {
    const id = typeof idOrObj === "object" ? idOrObj?.id : idOrObj;
    setMe(id || null);
    try {
      if (id) {
        localStorage.setItem("paha_dinana_me", id);
        localStorage.setItem("cls_me", id);
      } else {
        localStorage.removeItem("paha_dinana_me");
        localStorage.removeItem("cls_me");
      }
    } catch (e) {}
  };

  const toggleLang = () => {
    const nextLang = lang === "si" ? "en" : "si";
    setLang(nextLang);
    try {
      localStorage.setItem("paha_dinana_lang", nextLang);
    } catch (e) {}
  };

  const me = S.users.find(u => u.id === meId) || null;
  const t = k => T[lang]?.[k] || T["si"]?.[k] || k;

  return (
    <Ctx.Provider value={{ S, update, me, meId, login, lang, toggleLang, t, ready }}>
      {children}
    </Ctx.Provider>
  );
}

export const readFile = (f, cb) => {
  const r = new FileReader();
  r.onload = () => cb(r.result);
  r.readAsDataURL(f);
};

// Robust YouTube Embed URL extractor supporting watch, youtu.be, shorts, live, embed and mobile URLs
export const getYoutubeEmbedUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  const regExp = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(regExp);
  return match && match[1] ? `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1` : "";
};

export const isYoutubeUrl = (url) => {
  return Boolean(getYoutubeEmbedUrl(url));
};
