"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { T } from "./i18n";
import { fetchSupabaseState, syncSupabaseState } from "./supabase";

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

export const MONTH_OPTIONS = [
  "2026 නොවැම්බර්",
  "2026 දෙසැම්බර්",
  "2026 ඔක්තෝබර්",
  "2026 සැප්තැම්බර්",
  "2026 අගෝස්තු",
  "2026 ජූලි",
  "2026 ජූනි",
  "2026 මැයි",
  "2026 අප්‍රේල්",
  "2026 මාර්තු",
  "2026 පෙබරවාරි",
  "2026 ජනවාරි",
  "2027 ජනවාරි",
  "2027 පෙබරවාරි"
];

const def = {
  users: [defAdmin, defStudent],
  folders: [
    // GRADE 5 MONTHLY CLASSES
    {
      id: "f1",
      grade: 5,
      month: "2026 නොවැම්බර්",
      isCurrentMonth: true,
      name: "2026 නොවැම්බර් මාසයේ පන්තිය (190+ පළාත් පේපර් සහ සජීවී පන්ති)",
      category: "මාසික පේපර් පන්තිය",
      price: 1000,
      papersCount: "දිනකට පේපර් 2ක් + Zoom Live",
      subjects: "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි",
      zoomUrl: "https://zoom.us/j/94771234567",
      zoomSchedule: "සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 - 9.00 (Zoom Live)",
      desc: "නොවැම්බර් මාසයට අදාළ සියලුම සජීවී Zoom පන්ති, PDF ප්‍රශ්න පත්‍ර කට්ටල සහ වීඩියෝ විවරණ මෙම මාසික පන්තිය තුළ අන්තර්ගත වේ."
    },
    {
      id: "f2",
      grade: 5,
      month: "2026 ඔක්තෝබර්",
      isCurrentMonth: false,
      name: "2026 ඔක්තෝබර් මාසයේ පන්තිය (දකුණු & මධ්‍යම පළාත් පේපර් සාකච්ඡාව)",
      category: "පසුගිය මාසික පන්තිය",
      price: 1000,
      papersCount: "දිනකට පේපර් 2ක් + වීඩියෝ + PDF",
      subjects: "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි",
      zoomUrl: "https://zoom.us/j/94771234567",
      zoomSchedule: "පසුගිය මාසයේ සජීවී පන්ති පටිගත කිරීම් සහ PDF සියල්ල ලබාගත හැක",
      desc: "ඔක්තෝබර් මාසයේ පැවති සියලුම පන්තිවල පටිගත කළ වීඩියෝ, ප්‍රශ්න පත්‍ර PDF සහ පිළිතුරු පත්‍රිකා සම්පූර්ණයෙන්ම අධ්‍යයනය කළ හැක."
    },
    {
      id: "f3",
      grade: 5,
      month: "2026 සැප්තැම්බර්",
      isCurrentMonth: false,
      name: "2026 සැප්තැම්බර් මාසයේ පන්තිය (සබරගමුව & ඌව පළාත් පේපර් සාකච්ඡාව)",
      category: "පසුගිය මාසික පන්තිය",
      price: 1000,
      papersCount: "දිනකට පේපර් 2ක් + වීඩියෝ + PDF",
      subjects: "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි",
      zoomUrl: "https://zoom.us/j/94771234567",
      zoomSchedule: "පසුගිය මාසයේ සජීවී පන්ති පටිගත කිරීම් සහ PDF සියල්ල ලබාගත හැක",
      desc: "සැප්තැම්බර් මාසයේ සාකච්ඡා කළ සියලුම පළාත් ප්‍රශ්න පත්‍ර PDF සහ සවිස්තරාත්මක වීඩියෝ විවරණ."
    },
    {
      id: "f4",
      grade: 5,
      month: "2026 අගෝස්තු",
      isCurrentMonth: false,
      name: "2026 අගෝස්තු මාසයේ පන්තිය (190+ අනුමාන පේපර් සහ පරිසරය විශේෂ)",
      category: "පසුගිය මාසික පන්තිය",
      price: 1000,
      papersCount: "විශේෂ අනුමාන පේපර් + වීඩියෝ",
      subjects: "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි",
      zoomUrl: "https://zoom.us/j/94771234567",
      zoomSchedule: "පසුගිය මාසයේ සජීවී පන්ති පටිගත කිරීම් සහ PDF සියල්ල ලබාගත හැක",
      desc: "අගෝස්තු මාසයේ පැවති විශේෂ අනුමාන ප්‍රශ්න පත්‍ර සහ පරිසරය තේමා 16 විශේෂ වීඩියෝ සාකච්ඡා."
    },

    // GRADE 4 MONTHLY CLASSES
    {
      id: "f5",
      grade: 4,
      month: "2026 නොවැම්බර්",
      isCurrentMonth: true,
      name: "2026 නොවැම්බර් මාසයේ පන්තිය - 4 ශ්‍රේණිය (ශිෂ්‍යත්ව පූර්ව අඩිතාලම)",
      category: "මාසික පේපර් පන්තිය",
      price: 1000,
      papersCount: "මූලික පේපර් + Zoom Live",
      subjects: "මව්බස, ගණිතය, පරිසරය, දෙමළ, ඉංග්‍රීසි",
      zoomUrl: "https://zoom.us/j/94771234567",
      zoomSchedule: "සෑම සෙනසුරාදාම ප.ව. 4.00 - 6.00 (Zoom Live)",
      desc: "4 ශ්‍රේණියේ දරුවන් සඳහා නොවැම්බර් මාසයේ පැවැත්වෙන සජීවී Zoom පන්ති, PDF ප්‍රශ්න පත්‍ර සහ වීඩියෝ පාඩම්."
    },
    {
      id: "f6",
      grade: 4,
      month: "2026 ඔක්තෝබර්",
      isCurrentMonth: false,
      name: "2026 ඔක්තෝබර් මාසයේ පන්තිය - 4 ශ්‍රේණිය (වියරණ හා ගණිත කෙටි ක්‍රම)",
      category: "පසුගිය මාසික පන්තිය",
      price: 1000,
      papersCount: "පේපර් කට්ටල + වීඩියෝ + PDF",
      subjects: "මව්බස, ගණිතය, පරිසරය, දෙමළ, ඉංග්‍රීසි",
      zoomUrl: "https://zoom.us/j/94771234567",
      zoomSchedule: "පසුගිය මාසයේ පටිගත කළ වීඩියෝ සහ PDF",
      desc: "4 ශ්‍රේණිය ඔක්තෝබර් මාසයේ පැවති සියලුම පාඩම්වල වීඩියෝ සහ PDF සටහන්."
    },

    // GRADE 3 MONTHLY CLASSES
    {
      id: "f7",
      grade: 3,
      month: "2026 නොවැම්බර්",
      isCurrentMonth: true,
      name: "2026 නොවැම්බර් මාසයේ පන්තිය - 3 ශ්‍රේණිය (මූලික පදනම සහ පේපර් පුහුණුව)",
      category: "මාසික පේපර් පන්තිය",
      price: 800,
      papersCount: "සතිපතා පේපර් + Zoom Live",
      subjects: "මව්බස, ගණිතය, පරිසරය, ඉංග්‍රීසි",
      zoomUrl: "https://zoom.us/j/94771234567",
      zoomSchedule: "සෑම ඉරිදාම ප.ව. 3.00 - 5.00 (Zoom Live)",
      desc: "3 ශ්‍රේණිය දරුවන් සඳහා නොවැම්බර් මාසයේ සජීවී Zoom පන්ති, PDF වැඩ පත්‍රිකා සහ වීඩියෝ පාඩම්."
    },
    {
      id: "f8",
      grade: 3,
      month: "2026 ඔක්තෝබර්",
      isCurrentMonth: false,
      name: "2026 ඔක්තෝබර් මාසයේ පන්තිය - 3 ශ්‍රේණිය (පසුගිය මාසයේ පාඩම් එකතුව)",
      category: "පසුගිය මාසික පන්තිය",
      price: 800,
      papersCount: "වීඩියෝ + PDF වැඩ පත්‍රිකා",
      subjects: "මව්බස, ගණිතය, පරිසරය, ඉංග්‍රීසි",
      zoomUrl: "https://zoom.us/j/94771234567",
      zoomSchedule: "පසුගිය මාසයේ පටිගත කළ වීඩියෝ සහ PDF",
      desc: "3 ශ්‍රේණිය ඔක්තෝබර් මාසයේ සියලුම වීඩියෝ පාඩම් සහ PDF ප්‍රශ්න පත්‍ර."
    }
  ],
  items: [
    // November Grade 5 (f1) items: Zoom Live + Official YouTube Videos + PDF
    {
      id: "i_zoom_1",
      fid: "f1",
      type: "zoom",
      week: "1 වන සතිය",
      subject: "විෂයයන් 5ම",
      title: "නොවැම්බර් සජීවී Zoom පන්තිය - පළාත් පේපර් සජීවී විවරණය (Live Class)",
      url: "https://zoom.us/j/94771234567",
      schedule: "සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 ට"
    },
    {
      id: "i1",
      fid: "f1",
      type: "video",
      week: "1 වන සතිය",
      subject: "පරිසරය",
      title: "ශිෂ්‍යත්ව විභාගයට වටිනා පරිසරය ප්‍රශ්න 100ක් - සවිස්තරාත්මක විවරණය",
      url: "https://youtu.be/BbZdfLXfW9A"
    },
    {
      id: "i2",
      fid: "f1",
      type: "pdf",
      week: "1 වන සතිය",
      subject: "සියලු විෂයයන්",
      title: "බස්නාහිර පළාත් පේපර් 01 - සම්පූර්ණ ප්‍රශ්න පත්‍රය (මුද්‍රණය සඳහා PDF)",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: "i3",
      fid: "f1",
      type: "video",
      week: "2 වන සතිය",
      subject: "විෂයයන් 5ම",
      title: "අදිති 30 - 1 කොටස සහ 30 - 2 කොටස - 190+ පේපර් පන්තිය සම්පූර්ණ සාකච්ඡාව",
      url: "https://youtu.be/murCwFZRlJo"
    },
    {
      id: "i4",
      fid: "f1",
      type: "pdf",
      week: "2 වන සතිය",
      subject: "විෂයයන් 5ම",
      title: "අදිති 30 - 1 සහ 30 - 2 ප්‍රශ්න පත්‍රය සහ ආදර්ශ පිළිතුරු පත්‍රිකාව (PDF)",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },

    // October Grade 5 (f2) items
    {
      id: "i5",
      fid: "f2",
      type: "video",
      week: "1 වන සතිය",
      subject: "විෂයයන් 5ම",
      title: "අදිති 30 - 1 කොටස සහ 30 - 2 කොටස - 190+ පේපර් පන්තිය",
      url: "https://youtu.be/murCwFZRlJo"
    },
    {
      id: "i6",
      fid: "f2",
      type: "pdf",
      week: "1 වන සතිය",
      subject: "සියලු විෂයයන්",
      title: "ඔක්තෝබර් මාසය - දකුණු සහ මධ්‍යම පළාත් ප්‍රශ්න පත්‍ර කට්ටලය (PDF)",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },

    // September Grade 5 (f3) items
    {
      id: "i7",
      fid: "f3",
      type: "video",
      week: "1 වන සතිය",
      subject: "පරිසරය",
      title: "ශිෂ්‍යත්ව විභාගයට වටිනා පරිසරය ප්‍රශ්න 100ක්",
      url: "https://youtu.be/BbZdfLXfW9A"
    },
    {
      id: "i8",
      fid: "f3",
      type: "pdf",
      week: "1 වන සතිය",
      subject: "සියලු විෂයයන්",
      title: "සැප්තැම්බර් මාසය - සබරගමුව සහ ඌව පළාත් ප්‍රශ්න පත්‍ර කට්ටලය (PDF)",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },

    // Grade 4 November (f5) items
    {
      id: "i9",
      fid: "f5",
      type: "zoom",
      week: "1 වන සතිය",
      subject: "විෂයයන් 5ම",
      title: "4 ශ්‍රේණිය නොවැම්බර් සජීවී Zoom පන්තිය (Live Class Link)",
      url: "https://zoom.us/j/94771234567",
      schedule: "සෑම සෙනසුරාදාම ප.ව. 4.00 ට"
    },
    {
      id: "i10",
      fid: "f5",
      type: "video",
      week: "1 වන සතිය",
      subject: "පරිසරය",
      title: "ශිෂ්‍යත්ව විභාගයට වටිනා පරිසරය ප්‍රශ්න 100ක්",
      url: "https://youtu.be/BbZdfLXfW9A"
    },
    {
      id: "i11",
      fid: "f5",
      type: "pdf",
      week: "1 වන සතිය",
      subject: "සියලු විෂයයන්",
      title: "4 ශ්‍රේණිය - නොවැම්බර් මාසයේ පූර්ව ශිෂ්‍යත්ව ප්‍රශ්න පත්‍රය (PDF)",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    }
  ],
  pays: [],
  attendance: {},
  set: {
    name: "පහ දිනන හපන්නු - 190+ පේපර් පන්තිය",
    slogan: "කොපි කරන්නත් බෑ.. සම කරන්නත් බෑ... ඒ තමයි පහ දිනන හපන්නු!",
    logo: "/logo.jpg",
    hotline: "0705 771 778",
    youtubeChannelId: "UC3jTXU81jF9PfmO_PBi99ug",
    youtubeChannelUrl: "https://www.youtube.com/channel/UC3jTXU81jF9PfmO_PBi99ug",
    bank: "බැංකුව: ලංකා බැංකුව (Bank of Ceylon)\nගිණුම් අංකය: 001234567890\nගිණුමේ නම: පහ දිනන හපන්නු පේපර් පන්තිය\nශාඛාව: කොළඹ ප්‍රධාන ශාඛාව\n(3 ශ්‍රේණිය: රු. 800 / 4, 5 ශ්‍රේණි: රු. 1,000 මාසික පන්ති ගාස්තුව තැන්පත් කළ පසු රිසිට්පත මෙහි උඩුගත කරන්න හෝ WhatsApp කරන්න: 0705 771 778)"
  },
  gradeDetails: [
    {
      grade: 5,
      shortTag: "🔥 190+ ඉලක්කය",
      title: "5 ශ්‍රේණිය - 190+ පේපර් පන්තිය",
      subtitle: "දිනකට පළාත් පේපර් 2 බැගින් සාකච්ඡා කරමින් ලකුණු 190+ සීමාව පසුකරවන විශේෂ පන්තිය.",
      subjects: "පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි",
      scheduleShort: "සෙන / ඉරිදා ප.ව. 7.00 - 9.00",
      schedule: "සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 - 9.00 (Zoom Live)",
      fee: 1000,
      features: [
        "දිනකට පළාත් ප්‍රශ්න පත්‍ර 2ක් සම්පූර්ණ විවරණය",
        "ප්‍රශ්නයකට තත්පර 45කට අඩු වේග පාලන පුහුණුව",
        "සජීවී Zoom පන්ති, වීඩියෝ සහ PDF පේපර්ස්"
      ]
    },
    {
      grade: 4,
      shortTag: "🌟 පූර්ව අඩිතාලම",
      title: "4 ශ්‍රේණිය - ශිෂ්‍යත්ව පූර්ව පන්තිය",
      subtitle: "5 ශ්‍රේණියේ විභාගයට කල්තියාම දරුවාගේ වේගය සහ විෂය දැනුම ගොඩනඟන පන්තිය.",
      subjects: "මව්බස, ගණිතය, පරිසරය, දෙමළ, ඉංග්‍රීසි",
      scheduleShort: "සෙනසුරාදා ප.ව. 4.00 - 6.00",
      schedule: "සෑම සෙනසුරාදාම ප.ව. 4.00 - 6.00 (Zoom Live)",
      fee: 1000,
      features: [
        "ගණිත කෙටි ක්‍රම සහ තර්කන ගැටළු පුහුණුව",
        "වියරණ, රචනා සහ පරිසරය මූලික පදනම",
        "මාසික ආදර්ශ ප්‍රශ්න පත්‍ර PDF සහ වීඩියෝ"
      ]
    },
    {
      grade: 3,
      shortTag: "🌱 මූලික පදනම",
      title: "3 ශ්‍රේණිය - මූලික පදනම පන්තිය",
      subtitle: "කුඩා කල සිටම ප්‍රශ්න පත්‍රවලට බිය නැතිව නිවැරදිව පිළිතුරු ලිවීමට හුරු කරවන පන්තිය.",
      subjects: "මව්බස, ගණිතය, පරිසරය, ඉංග්‍රීසි",
      scheduleShort: "ඉරිදා ප.ව. 3.00 - 5.00",
      schedule: "සෑම ඉරිදාම ප.ව. 3.00 - 5.00 (Zoom Live)",
      fee: 800,
      features: [
        "මනෝමය ගණිතය සහ මූලික ගණිත ක්‍රමවේද",
        "නිවැරදි අක්ෂර වින්‍යාසය සහ වාක්‍ය ගොඩනැගීම",
        "සතිපතා වර්ණවත් PDF වැඩ පත්‍රිකා සහ Zoom"
      ]
    }
  ]
};

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
export const uid = () => Math.random().toString(36).slice(2, 10);

export function Provider({ children }) {
  const [S, setS] = useState(def);
  const [meId, setMe] = useState(null);
  const [lang, setLang] = useState("si");
  const [theme, setTheme] = useState("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("paha_dinana_theme") || "dark";
      setTheme(savedTheme);
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", savedTheme);
      }
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

      // Upgrade / Migrate legacy folders to Monthly Class structure if needed
      if (!Array.isArray(activeState.folders) || activeState.folders.length === 0) {
        activeState.folders = def.folders;
      } else {
        const hasMonthlyStructure = activeState.folders.some(f => f.month && typeof f.isCurrentMonth === "boolean");
        if (!hasMonthlyStructure) {
          // Migrate existing f1..f5 to monthly structure and add missing grade defaults
          activeState.folders = def.folders;
          activeState.items = def.items;
        } else {
          // Ensure every folder is in grades 3, 4, 5 and migrate legacy 2000 fee to Grade 3: 800, Grade 4/5: 1000
          activeState.folders = activeState.folders
            .filter(f => [3, 4, 5].includes(Number(f.grade)))
            .map((f, idx) => {
              const defaultFee = Number(f.grade) === 3 ? 800 : 1000;
              const resolvedPrice = !f.price || Number(f.price) === 2000 ? defaultFee : Number(f.price);
              return {
                month: f.month || "2026 නොවැම්බර්",
                isCurrentMonth: typeof f.isCurrentMonth === "boolean" ? f.isCurrentMonth : idx === 0,
                zoomUrl: f.zoomUrl || "https://zoom.us/j/94771234567",
                zoomSchedule: f.zoomSchedule || "සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 ට (Zoom Live)",
                ...f,
                price: resolvedPrice
              };
            });
        }
      }

      if (!Array.isArray(activeState.items) || activeState.items.length === 0) {
        activeState.items = def.items;
      } else {
        // Automatically upgrade any old placeholder video links (dQw4w9WgXcQ) to the official teacher videos
        activeState.items = activeState.items.map((it, idx) => {
          if (it.url && it.url.includes("dQw4w9WgXcQ")) {
            return idx % 2 === 0
              ? {
                  ...it,
                  subject: "පරිසරය",
                  title: "ශිෂ්‍යත්ව විභාගයට වටිනා පරිසරය ප්‍රශ්න 100ක් - සවිස්තරාත්මක විවරණය",
                  url: "https://youtu.be/BbZdfLXfW9A"
                }
              : {
                  ...it,
                  subject: "විෂයයන් 5ම",
                  title: "අදිති 30 - 1 කොටස සහ 30 - 2 කොටස - 190+ පේපර් පන්තිය සම්පූර්ණ සාකච්ඡාව",
                  url: "https://youtu.be/murCwFZRlJo"
                };
          }
          return it;
        });
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

      // Connect & Sync with Supabase Cloud Database
      fetchSupabaseState().then(cloudState => {
        if (cloudState && typeof cloudState === "object") {
          setS(prev => {
            // Merge local and cloud users by phone/id so newly registered users are never overwritten
            const mergedUsersMap = new Map();
            (Array.isArray(cloudState.users) ? cloudState.users : []).forEach(u => {
              if (u && u.id) mergedUsersMap.set(String(u.id), u);
            });
            (Array.isArray(prev.users) ? prev.users : []).forEach(u => {
              if (u && u.id && !mergedUsersMap.has(String(u.id))) {
                mergedUsersMap.set(String(u.id), u);
              }
            });
            const mergedUsers = Array.from(mergedUsersMap.values());

            const merged = {
              ...prev,
              ...cloudState,
              users: mergedUsers.length > 0 ? mergedUsers : prev.users,
              folders: Array.isArray(cloudState.folders) && cloudState.folders.length > 0
                ? cloudState.folders.filter(f => [3, 4, 5].includes(Number(f.grade)))
                : prev.folders,
              items: (Array.isArray(cloudState.items) && cloudState.items.length > 0 ? cloudState.items : prev.items).map((it, idx) => {
                if (it.url && it.url.includes("dQw4w9WgXcQ")) {
                  return idx % 2 === 0
                    ? {
                        ...it,
                        subject: "පරිසරය",
                        title: "ශිෂ්‍යත්ව විභාගයට වටිනා පරිසරය ප්‍රශ්න 100ක් - සවිස්තරාත්මක විවරණය",
                        url: "https://youtu.be/BbZdfLXfW9A"
                      }
                    : {
                        ...it,
                        subject: "විෂයයන් 5ම",
                        title: "අදිති 30 - 1 කොටස සහ 30 - 2 කොටස - 190+ පේපර් පන්තිය සම්පූර්ණ සාකච්ඡාව",
                        url: "https://youtu.be/murCwFZRlJo"
                      };
                }
                return it;
              }),
              pays: Array.isArray(cloudState.pays) && cloudState.pays.length >= prev.pays.length ? cloudState.pays : prev.pays,
              attendance: { ...(prev.attendance || {}), ...(cloudState.attendance || {}) },
              gradeDetails: Array.isArray(cloudState.gradeDetails) && cloudState.gradeDetails.length > 0 ? cloudState.gradeDetails : (prev.gradeDetails || def.gradeDetails),
              set: { ...prev.set, ...(cloudState.set || {}) }
            };
            if (!merged.users.some(u => u.admin)) {
              merged.users.unshift(defAdmin);
            }
            try {
              localStorage.setItem("paha_dinana_cls", JSON.stringify(merged));
            } catch (e) {}
            // Push any local users that weren't in cloud yet back to Supabase
            syncSupabaseState(merged);
            return merged;
          });
        } else {
          // Seed initial local state to Supabase if cloud is empty
          syncSupabaseState(activeState);
        }
      });
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
      // Push changes live to Supabase Cloud Database
      syncSupabaseState(next);
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

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("paha_dinana_theme", nextTheme);
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", nextTheme);
      }
    } catch (e) {}
  };

  const me = S.users.find(u => u.id === meId) || null;
  const t = k => T[lang]?.[k] || T["si"]?.[k] || k;

  return (
    <Ctx.Provider value={{ S, update, me, meId, login, lang, toggleLang, theme, toggleTheme, t, ready }}>
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
