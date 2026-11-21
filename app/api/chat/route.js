import { NextResponse } from "next/server";
import dns from "node:dns";

// Ensure IPv4 first on Node.js to prevent connection timeouts on Windows & Sri Lankan ISP routes
if (dns && typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

// Comprehensive knowledge base extracted directly from NIE Grade 5 Teacher's Guide
// "පොදු ගුරු මාර්ගෝපදේශය - 5 ශ්‍රේණිය (2020 සිට ක්‍රියාත්මක වේ)" - National Institute of Education, Sri Lanka.
const SYSTEM_PROMPT = `
You are the official "190+ ප්‍රවීණ AI ගුරුතුමා" (Master Scholarship Teacher) for "පහ දිනන හපන්නු - 190+ පේපර් පන්තිය" (Sri Lanka Grade 5 Scholarship Examination).
You are an exceptionally wise, loving, patient, and highly accomplished primary school educator who has mastered the official National Institute of Education (NIE) Sri Lanka Grade 5 Teacher's Guide ("පොදු ගුරු මාර්ගෝපදේශය - 5 ශ්‍රේණිය - 2020 සිට ක්‍රියාත්මක වේ").

Your Personality & Tone:
1. Warm, caring, encouraging, and paternal/maternal. Always address the student affectionately: "ආදරණීය දරුවා", "පුතා", "දුව" (or in English: "Dear child / student", in Tamil: "அன்பு மாணவரே / குழந்தாய்").
2. Teach with step-by-step clarity, real-world examples, and high pedagogical excellence.
3. Class motto: "කොපි කරන්නත් බෑ.. සම කරන්නත් බෑ... ඒ තමයි පහ දිනන හපන්නු 190+ පේපර් පන්තිය!".
4. Answer ANY question asked - whether about school subjects, scholarship exam preparation, or general life/science questions.

CRITICAL INSTRUCTION 1: QUIZ ANSWER EVALUATION
When the student provides an answer (e.g. "1", "2", "3", or names like "පණ්ඩුකාභය", "රබර් සහ කූඩළු", etc.) to a question previously asked in the conversation:
- Look at the question you previously asked!
- Tell the student clearly if their answer is CORRECT or INCORRECT.
- If CORRECT: Celebrate warmly! E.g.: "🎉 ඉතා විශිෂ්ටයි ආදරණීය පුතා/දුව! ඔබගේ පිළිතුර 100% ක් නිවැරදියි! (190+ විශිෂ්ට ලකුණු මට්ටම)".
- If INCORRECT: Gently explain why affectionately, encourage them, and explain the right answer. E.g.: "ආදරණීය දරුවා, ඔබ තෝරාගත් පිළිතුර වැරදියි. නිවැරදි පිළිතුර... හේතුව... අධෛර්යවත් වෙන්න එපා!".
- Provide both syllabus reasoning (📘) and exam secrets (💡).
- Ask if they want another question: "ඊළඟ ප්‍රශ්නයට යමුද? 'තව ප්‍රශ්නයක්' කියා එවන්න!".

CRITICAL INSTRUCTION 2: DUAL STRUCTURE FOR ALL LESSON QUESTIONS
Whenever a student asks about a subject or lesson topic (ශාක, බීජ, සතුන්, ආහාර, විටමින්, ජලය, යන්ත්‍ර, ඉතිහාසය, රජවරු, පරිසරය, ගණිතය, දෙමළ, ඉංග්‍රීසි, etc.), you MUST structure your answer into TWO distinct sections:

## 📘 1. විෂය නිර්දේශය හා ගුරු මාර්ගෝපදේශය අනුව (NIE Syllabus & Teacher's Guide):
- Direct, 100% accurate textbook facts from the official Sri Lanka NIE Grade 5 Teacher's Guide.
- The exact points needed to score full marks in the Grade 5 Scholarship Examination Paper I and Paper II.

## 💡 2. අමතර දැනුම සහ 190+ විභාග රහස් (Extra Knowledge & Top Marks Secrets):
- Fascinating practical details outside the textbook that broaden the child's mind.
- Memory tricks and mnemonics (මතක තබාගැනීමේ කෙටි ක්‍රම).
- Common traps and mistakes students make in past scholarship papers (විභාගයේදී දරුවන්ට වරදින තැන්).
- Speed tips to answer in under 45 seconds per question.

CRITICAL INSTRUCTION 3: QUIZ GENERATOR
When the student asks for a question or quiz ("ප්‍රශ්නයක් අහන්න", "Quiz me", etc.):
- Ask an authentic Grade 5 scholarship multiple choice question with 3 numbered choices (1, 2, 3).
- Instruct them to reply with 1, 2, or 3.

CRITICAL INSTRUCTION 4: CLEAN FORMATTING & MARKDOWN TABLES
- Whenever explaining topics with classifications, categories, comparisons, nutrients & vitamins, kings & achievements, seed dispersal methods, simple machines, water states, or syllabus facts, ALWAYS present the main facts in a neat, well-structured Markdown Table (| ... | ... |).
- Tables help Grade 5 scholarship children memorize and review easily for the exam without visual clutter!
- Ensure tables have clear column headers and aligned data rows.
- Below or above the table, provide neat bullet points and highlighted notes with emojis.
- Never output disorganized, messy text blocks. Keep every section clean, spaced, and orderly.

Trilingual Expertise:
- If Sinhala: respond in beautiful, natural, encouraging Sinhala.
- If English: respond in lucid, inspiring, grammatically correct English suitable for primary school.
- If Tamil: respond in accurate, polite Tamil (தமிழ்) with clear explanations.
`;

// Helper for comprehensive smart curriculum answers with dual structure:
// [📘 විෂය නිර්දේශය අනුව] + [💡 අමතර දැනුම සහ 190+ විභාග රහස්]
function getSmartCurriculumResponse(query, lang = "si", messages = []) {
  const q = (query || "").trim().toLowerCase();

  // Find previous assistant message to see if user is answering a quiz
  const prevAssistant =
    [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.content && !m.content.includes("ආයුබෝවන් ආදරණීය දරුවනේ"))
      ?.content || "";

  const prevHasSeedQuiz = prevAssistant.includes("බීජ ව්‍යාප්තිය") || prevAssistant.includes("ස්වයං පුපුරා");
  const prevHasHistoryQuiz = prevAssistant.includes("පණ්ඩුකාභය") || prevAssistant.includes("අභය වැව") || prevAssistant.includes("රජවරුන්");
  const prevHasWaterQuiz = prevAssistant.includes("ජලය") || prevAssistant.includes("ඝනත්ව");

  // 1. QUIZ ANSWER EVALUATION (When student responds to a previous question)
  if (prevHasSeedQuiz || q.includes("රබර්") || q.includes("කූඩළු") || q.includes("වරා") || q.includes("මදටිය")) {
    if (q === "2" || q === "අංක 2" || q === "2." || q.includes("රබර්") || q.includes("කූඩළු")) {
      return `👨‍🏫 **ඉතා විශිෂ්ටයි ආදරණීය පුතා/දුව! ඔබගේ පිළිතුර 100% ක් නිවැරදියි! (190+ විශිෂ්ට ලකුණු මට්ටම)** 🌟

📘 **1. විෂය නිර්දේශය අනුව (NIE Teacher's Guide):**
- රබර් සහ කූඩළු ශාකවල ඵල හා කරල් හොඳින් වියළී ගිය පසු හිරු රශ්මියෙන් ඇතිවන පීඩනය නිසා ක්ෂණිකව පිපිරී බීජ ඈතට විසිරී යයි. මෙය ගුරු මාර්ගෝපදේශයේ **"ස්වයං පුපුරා යාම (Explosive mechanism)"** ලෙස හැඳින්වේ.

💡 **2. අමතර දැනුම හා විභාග රහස්:**
- **මතක තබාගැනීමේ කෙටි රහස:** *"තෝර, දඹල, බණ්ඩක්කා - රබර්, කූඩළු පුපුරයි අක්කා!"* (මේ ශාක 5ම ස්වයං පුපුරා යාමෙන් බීජ ව්‍යාප්ත වන බව මතක තබාගන්න).
- රබර් ඇටයක් පිපිරී මීටර් 15-20ක් ඈතට පවා විසිරී යා හැක!

👉 ඊළඟ ප්‍රශ්නයට යමුද? **"තව ප්‍රශ්නයක් අහන්න"** කියා එවන්න!`;
    } else if (q === "1" || q.includes("වරා") || q.includes("කොට්ටපුළුන්")) {
      return `👨‍🏫 **ආදරණීය දරුවා, පිළිතුරු විග්‍රහය:**

📘 **1. විෂය නිර්දේශය අනුව:**
- වරා සහ කොට්ටපුළුන් බීජවල රෝමමය කෙඳි පිහිටා ඇති නිසා ඒවා ව්‍යාප්ත වන්නේ **සුළඟ මඟින්** වේ. එබැවින් මෙම ප්‍රශ්නයට අංක 1 වැරදියි. නිවැරදි පිළිතුර වූයේ **අංක 2 (රබර් සහ කූඩළු)** යි.

💡 **2. අමතර දැනුම හා විභාග රහස්:**
- **විභාගයේදී වරදින තැන:** බොහෝ දරුවන් "වරා" කියන්නේ පිපිරෙන දෙයක් කියා වරදවා හිතනවා. නමුත් වරා කරල පැලුණු පසු ඇතුළේ ඇති බීජ සුළඟේ පාවී යන්නේ කුඩා කුඩයක් (පැරෂුටයක්) වාගේය!
- අධෛර්යවත් වෙන්න එපා පුතේ! හැම අතපසුවීමක්ම විභාගයේදී 190+ ගන්න පාඩමක් කරගනිමු.

👉 තවත් ප්‍රශ්නයක් අවශ්‍ය නම් **"තව ප්‍රශ්නයක් අහන්න"** කියා එවන්න!`;
    } else if (q === "3" || q.includes("පොල්") || q.includes("මදටිය")) {
      return `👨‍🏫 **ආදරණීය දරුවා, පිළිතුරු විග්‍රහය:**

📘 **1. විෂය නිර්දේශය අනුව:**
- පොල් ව්‍යාප්ත වන්නේ **ජලය මඟින්** වන අතර, මදටිය ව්‍යාප්ත වන්නේ **සතුන්/පක්ෂීන් මඟින්** වේ. එබැවින් අංක 3 වැරදියි. නිවැරදි පිළිතුර **අංක 2 (රබර් සහ කූඩළු)** වේ.

💡 **2. අමතර දැනුම හා විභාග රහස්:**
- පොල් ගෙඩියේ තන්තුමය ලෙල්ල නිසා ජලයේ පහසුවෙන් පාවී යා හැක. මදටිය ඇටයේ රතු දීප්තිමත් වර්ණය නිසා කුරුල්ලන් ආකර්ෂණය වේ.
- උත්සාහය අත්හරින්න එපා! නැවත උත්සාහ කිරීමට **"තව ප්‍රශ්නයක් අහන්න"** කියා එවන්න!`;
    }
  }

  if (prevHasHistoryQuiz || q.includes("පණ්ඩුකාභය") || q.includes("දේවානම්පියතිස්ස") || q.includes("දුටුගැමුණු")) {
    if (q === "2" || q === "අංක 2" || q.includes("පණ්ඩුකාභය")) {
      return `👨‍🏫 **ඉතා විශිෂ්ටයි ආදරණීය පුතා/දුව! ඔබගේ පිළිතුර 100% ක් නිවැරදියි!** 🌟

📘 **1. විෂය නිර්දේශය අනුව (NIE Teacher's Guide):**
- අනුරාධපුර නගරය සැලසුම් කළ, අභය වැව (බසවක්කුලම) ඉදිකළ සහ ග්‍රාම සීමා නියම කළ මුල්ම රජතුමා වන්නේ **පණ්ඩුකාභය රජතුමා (අංක 2)** ය.

💡 **2. අමතර දැනුම හා විභාග රහස්:**
- **මතක තබාගැනීමේ කෙටි රහස:** *"නගරය හැදුවේ, සීමා දැම්මේ, අභය වැවේ දිය බැන්දේ - පණ්ඩුකාභය රජුය අපේ!"*
- **විභාගයේදී වරදින තැන:** තිසා වැව හැදුවේ දේවානම්පියතිස්ස රජතුමාය. අභය වැව හැදුවේ පණ්ඩුකාභය රජතුමාය. මේ දෙක පටලවා නොගන්න!

👉 තවත් ප්‍රශ්නයක් අවශ්‍ය නම් **"තව ප්‍රශ්නයක් අහන්න"** කියා එවන්න!`;
    } else if (q === "1" || q.includes("දේවානම්පියතිස්ස")) {
      return `👨‍🏫 **ආදරණීය දරුවා, පිළිතුරු විග්‍රහය:**

📘 **1. විෂය නිර්දේශය අනුව:**
- දේවානම්පියතිස්ස රජතුමා කළේ **තිසා වැව** සහ ඉසුරුමුණිය ඉදිකිරීමයි. අනුරාධපුර නගරය මුලින්ම සැලසුම් කළේ සහ අභය වැව හැදුවේ **පණ්ඩුකාභය රජතුමා (අංක 2)** යි. එබැවින් අංක 1 වැරදියි.

💡 **2. අමතර දැනුම හා විභාග රහස්:**
- මිහිඳු මහරහතන් වහන්සේ ලංකාවට වැඩම කළේ දේවානම්පියතිස්ස රජු දවසය.
- ඊළඟ ප්‍රශ්නයට සූදානම් වෙන්න! **"තව ප්‍රශ්නයක් අහන්න"** කියා ලියන්න!`;
    }
  }

  // 2. QUIZ GENERATOR REQUEST (ප්‍රශ්නයක් අහන්න / Quiz me)
  if (
    q.includes("ප්‍රශ්න") ||
    q.includes("quiz") ||
    q.includes("question") ||
    q.includes("test") ||
    q.includes("විභාග") ||
    q.includes("வினா") ||
    q.includes("கேள்வி")
  ) {
    const quizzes = [
      {
        si: `👨‍🏫 **ආදරණීය දරුවා, මෙන්න 190+ ශිෂ්‍යත්ව ආදර්ශ පුහුණු ප්‍රශ්නයක්!**

🎯 **ප්‍රශ්නය (පරිසරය - බීජ ව්‍යාප්තිය):**
පහත සඳහන් ශාක අතුරින් ස්වයං පුපුරා යාම මගින් බීජ හා ඵල ව්‍යාප්ත වන ශාක යුගලය තෝරන්න:
1. වරා සහ කොට්ටපුළුන්
2. රබර් සහ කූඩළු
3. පොල් සහ මදටිය

👉 **ඔබේ පිළිතුර අංක 1, 2 හෝ 3 ලෙස මෙහි ලියන්න!** මම ගුරු මාර්ගෝපදේශයට අනුව හේතුවත්, අමතර විභාග රහසුත් කියා දෙන්නම්!`,
        en: `👨‍🏫 **Dear student, here is your 190+ Scholarship Model Practice Question!**

🎯 **Question (Environmental Studies - Seed Dispersal):**
Which of the following pairs of plants disperses its seeds by explosive mechanism?
1. Vara and Cotton (Kapok)
2. Rubber and Kudalu (Balsam)
3. Coconut and Madatiya

👉 **Reply with 1, 2, or 3!** I will explain the syllabus rationale and top exam tips!`,
        ta: `👨‍🏫 **அன்பு மாணவரே, இதோ உங்களுக்கான 190+ மாதிரி வினா!**

🎯 **வினா (சுற்றாடல் - விதைப் பரம்பல்):**
பின்வரும் தாவரங்களில் வெடித்துச் சிதறுவதன் மூலம் விதைகளைப் பரப்பும் சோடி எது?
1. எருக்கு மற்றும் பஞ்சு
2. ரப்பர் மற்றும் குடலு
3. தென்னை மற்றும் மஞ்சாடி

👉 **உங்கள் விடையை 1, 2 அல்லது 3 என பதிவிடுங்கள்!**`,
      },
      {
        si: `👨‍🏫 **ආදරණීය දරුවා, මෙන්න අපේ අතීත විත්ති පිළිබඳ වටිනා ප්‍රශ්නයක්!**

🎯 **ප්‍රශ්නය (ඉතිහාසය හා රජවරුන්):**
අනුරාධපුර නගරය සැලසුම් කළ, අභය වැව (බසවක්කුලම) ඉදිකළ සහ ග්‍රාම සීමා නියම කළ මුල්ම රජතුමා කවුද?
1. දේවානම්පියතිස්ස රජතුමා
2. පණ්ඩුකාභය රජතුමා
3. දුටුගැමුණු රජතුමා

👉 **ඔබේ පිළිතුර 1, 2 හෝ 3 ලෙස ලියන්න!**`,
        en: `👨‍🏫 **Dear student, test your knowledge on ancient Sri Lankan kings!**

🎯 **Question (History & Kings):**
Who was the first king who planned Anuradhapura, built the Abhaya Wewa (Basawakkulama), and demarcated village boundaries?
1. King Devanampiyatissa
2. King Pandukabhaya
3. King Dutugemunu

👉 **Type 1, 2, or 3 to answer!**`,
        ta: `👨‍🏫 **அன்பு மாணவரே, வரலாற்று வினா:**
அனுராதபுர நகரைத் திட்டமிட்டு, அபய வாவி (பசவக்குளம்) அமைத்து, கிராம எல்லைகளை வகுத்த மன்னர் யார்?
1. தேவநம்பியதீச மன்னன்
2. பண்டுக்காபய மன்னன்
3. துட்டகைமுனு மன்னன்

👉 **1, 2 அல்லது 3 என விடையளிக்கவும்!**`,
      },
      {
        si: `👨‍🏫 **ආදරණීය දරුවා, මෙන්න ආහාර සහ විටමින් පිළිබඳ ප්‍රශ්නයක්!**

🎯 **ප්‍රශ්නය (ආහාර හා පෝෂණය):**
රාත්‍රී කාලයේදී ඇස් නොපෙනී යාම (රෑ නොපෙනීම) කුමන විටමිනය ශරීරයට ඌන වීම නිසා ඇතිවන රෝගී තත්ත්වයක්ද?
1. විටමින් C
2. විටමින් A
3. විටමින් D

👉 **ඔබේ පිළිතුර 1, 2 හෝ 3 ලෙස ලියන්න!**`,
        en: `👨‍🏫 **Dear student, here is a nutrition question:**

🎯 **Question (Food & Nutrition):**
Night blindness is caused by the deficiency of which vitamin?
1. Vitamin C
2. Vitamin A
3. Vitamin D

👉 **Reply with 1, 2, or 3!**`,
        ta: `👨‍🏫 **அன்பு மாணவரே, ஊட்டச்சத்து வினா:**
மாலைக்கண் நோய் எந்த விற்றமின் குறைபாட்டினால் ஏற்படுகிறது?
1. விற்றமின் C
2. விற்றமின் A
3. விற்றமின் D

👉 **1, 2 அல்லது 3 என பதிவிடுங்கள்!**`,
      },
    ];
    const picked = quizzes[Math.floor(Math.random() * quizzes.length)];
    return lang === "ta" ? picked.ta : lang === "en" ? picked.en : picked.si;
  }

  // 3. VITAMINS & FOOD (Theme 6: අපේ ආහාර)
  if (
    q.includes("විටමින්") ||
    q.includes("ආහාර") ||
    q.includes("පෝෂණ") ||
    q.includes("vitamin") ||
    q.includes("food") ||
    q.includes("nutrition") ||
    q.includes("විற்றமின்") ||
    q.includes("உணவு")
  ) {
    return `👨‍🏫 **ආදරණීය දරුවා, විටමින් සහ පෝෂණය පිළිබඳ ගුරු විග්‍රහය මෙන්න:**

## 📘 1. විෂය නිර්දේශය හා ගුරු මාර්ගෝපදේශය අනුව (NIE Guide):

| විටමිනය / පෝෂකය | බහුලව ලැබෙන ආහාර | ඌනතා රෝගය / ලක්ෂණ |
| :--- | :--- | :--- |
| **විටමින් A** | කැරට්, බතල, පැපොල්, තද කොළ පලා, බිත්තර කහ මදය | **රෑ නොපෙනීම (Night Blindness)**, ඇස් වියළීම |
| **විටමින් B** | නිවුඩු සහල්, ධාන්‍ය, රනිල බෝග, පීකුදු | **බෙරිබෙරි (Beriberi)**, කට කොණ පැලීම |
| **විටමින් C** | නෙල්ලි, දෙහි, දොඩම්, පේර, තක්කාලි | **ස්කර්වි (Scurvy)** - විදුරුමහෙන් ලේ ගැලීම |
| **විටමින් D** | උදෑසන හිරු එළිය, බිත්තර, කිරි, මාළු තෙල් | **රිකට්ස් (Rickets)** - අස්ථි දුර්වල වීම |
| **යකඩ (Iron)** | තද කොළ පලා, තල, පීකුදු, බිත්තර, රතු මස් | **රක්තහීනතාවය** (ලේ අඩුකම - සුදුමැලි වීම) |
| **අයඩීන් (Iodine)** | අයඩීකරණය කළ ලුණු, මුහුදු මාළු | **ගලගණ්ඩය (Goitre)**, මන්දබුද්ධික බව |

## 💡 2. අමතර දැනුම සහ 190+ විභාග රහස් (Extra Knowledge):
- **විභාගයේදී නිතරම අහන රහසක්:** විටමින් C තාපයට (රත් කිරීමට) සංවේදීය! එබැවින් දෙහි, දොඩම් රත් නොකර අමුවෙන්ම ආහාරයට ගත යුතුය.
- ශ්‍රී ලංකාවේ වැඩිම විටමින් C ප්‍රමාණයක් අඩංගු ස්වභාවික පලතුර **නෙල්ලි** වේ.
- විටමින් D ශරීරයේ නිපදවා ගැනීමට උදෑසන ළපටි හිරු එළිය (පෙ.ව. 7.00 - 8.30) ඉතාමත් ගුණදායකය.`;
  }

  // 4. KINGS & HISTORY (Theme 16: අපේ අතීත විත්ති)
  if (
    q.includes("පණ්ඩුකාභය") ||
    q.includes("pandukabhaya") ||
    q.includes("අභය වැව") ||
    q.includes("බසවක්කුලම") ||
    q.includes("රජවරු") ||
    q.includes("රජතුමා")
  ) {
    return `👨‍🏫 **ආදරණීය දරුවා, ලක්දිව ශ්‍රේෂ්ඨ රජවරුන් සහ ඓතිහාසික සේවාවන් පිළිබඳ ගුරු විග්‍රහය මෙන්න:**

## 📘 1. විෂය නිර්දේශය හා ගුරු මාර්ගෝපදේශය අනුව (NIE Guide):

| රජතුමා | කළ ප්‍රධාන සේවාව | වැදගත් නිර්මාණ හා වැව් |
| :--- | :--- | :--- |
| **පණ්ඩුකාභය රජතුමා** | අනුරාධපුර නගරය සැලසුම් කිරීම, ග්‍රාම සීමා නියම කිරීම | අභය වැව (බසවක්කුලම), නගර ශෝධක සේවය |
| **දේවානම්පියතිස්ස රජතුමා** | බුදුදහම ලංකාවට ලැබීම, ශ්‍රී මහා බෝධීන් වහන්සේ රෝපණය | තිසා වැව, ථූපාරාමය, ඉසුරුමුණිය |
| **දුටුගැමුණු රජතුමා** | රට එක්සේසත් කිරීම, සම්බුද්ධ ශාසනය නගාසිටුවීම | රුවන්වැලි මහා සෑය, මිරිසවැටිය, ලෝවාමහාපාය |
| **ධාතුසේන රජතුමා** | මහා වාරි කර්මාන්තය දියුණු කිරීම, යෝධ ඇළ ඉදිකිරීම | කලා වැව, අවුකන බුදුපිළිමය |
| **මහා පරාක්‍රමබාහු රජතුමා** | "අහසින් වැටෙන එක දිය බිඳක්වත් මුහුදට නොයැවිය යුතුය" සංකල්පය | පරාක්‍රම සමුද්‍රය |

## 💡 2. අමතර දැනුම සහ 190+ විභාග රහස් (Extra Knowledge):
- **විභාගයේදී දරුවන්ට පටලැවෙන තැන:** "තිසා වැව" හැදුවේ දේවානම්පියතිස්ස රජතුමාය. "අභය වැව (බසවක්කුලම)" හැදුවේ පණ්ඩුකාභය රජතුමාය. මේ දෙක පටලවා නොගන්න!
- **මතක තබාගැනීමේ කෙටි රහස:** *"නගරය හැදුවේ, සීමා දැම්මේ, අභය වැවේ දිය බැන්දේ - පණ්ඩුකාභය රජුය අපේ!"*
- පණ්ඩුකාභය රජතුමාගේ මව්පියන්: දීඝගාමිණී කුමරු සහ උන්මාද චිත්‍රා කුමරියයි.`;
  }

  // 5. SEED DISPERSAL & PLANTS (Theme 3: පැළෑටි හා ගස්වැල්)
  if (
    q.includes("බීජ") ||
    q.includes("ව්‍යාප්තිය") ||
    q.includes("ශාක") ||
    q.includes("මුල්") ||
    q.includes("seed") ||
    q.includes("dispersal")
  ) {
    return `👨‍🏫 **ආදරණීය දරුවා, ශාක වල බීජ හා ඵල ව්‍යාප්තිය පිළිබඳ සම්පූර්ණ ගුරු පාඩම මෙන්න:**

## 📘 1. විෂය නිර්දේශය හා ගුරු මාර්ගෝපදේශය අනුව (NIE Guide):

| ව්‍යාප්ත වන ක්‍රමය | ශාක සඳහා උදාහරණ | බීජ හා ඵල වල විශේෂ අනුවර්තන |
| :--- | :--- | :--- |
| **සුළඟ මඟින්** | වරා, කොට්ටපුළුන්, මහාගනී, හොර, දඬුමොණර | සැහැල්ලු බව, රෝම හෝ පියාපත් වැනි ව්‍යුහ පිහිටීම |
| **ජලය මඟින්** | පොල්, දියපාර, වල් දෙල්, කඩොලාන, නෙළුම් | තන්තුමය ලෙල්ල, ජලයේ පාවෙන ස්වභාවය, ජලයට ඔරොත්තු දීම |
| **සතුන් මඟින්** | මදටිය, ඇඹිල්ල, නෙල්ලි, බිලිං, පේර, එළබිඩංගු, ඇටතුඩ | මාංසල රසවත් කොටස්, දීප්තිමත් පැහැය, කොකු හෝ කෙඳි |
| **ස්වයං පුපුරා යාම** | රබර්, කූඩළු, තෝර, බණ්ඩක්කා, දඹල, කහ අන්දර | වියළී ගිය පසු හිරු රශ්මියෙන් ක්ෂණිකව පිපිරී විසිරීම |

## 💡 2. අමතර දැනුම සහ 190+ විභාග රහස් (Extra Knowledge):
- **මතක තබාගැනීමේ කෙටි කවිය:**
  *"තෝර, දඹල, බණ්ඩක්කා - රබර්, කූඩළු පුපුරයි අක්කා!"* (ස්වයං පුපුරා යන ශාක 5ම මතක තබාගැනීමට).
- **විභාගයේදී දරුවන්ට නිතරම වරදින තැනක්:** "හොර" සහ "මහාගනී" ගෙඩි බිමට වැටෙද්දී කරකැවෙමින් වැටෙන්නේ පියාපත් පිහිටා ඇති නිසාය (සුළං මඟින්).
- **මුල් පද්ධති 2:** මුදුන් මුල් (අඹ, කොස්) සහ කෙඳි මුල් (පොල්, වී, තණකොළ).`;
  }

  // 6. WATER & EXPERIMENTS (Theme 8: ජලය)
  if (
    q.includes("ජලය") ||
    q.includes("වතුර") ||
    q.includes("water") ||
    q.includes("බිත්තර") ||
    q.includes("ඝනත්ව") ||
    q.includes("density")
  ) {
    return `👨‍🏫 **ආදරණීය දරුවා, ජලය සහ ඝනත්ව පරීක්ෂණ පිළිබඳ ගුරු විග්‍රහය:**

## 📘 1. විෂය නිර්දේශය හා ගුරු මාර්ගෝපදේශය අනුව (NIE Guide):

| ජලයේ අවස්ථාව | ලක්ෂණ | පරිසරයේ දක්නට ලැබෙන උදාහරණ |
| :--- | :--- | :--- |
| **ඝන අවස්ථාව** | නියත හැඩයක් සහ පරිමාවක් ඇත | අයිස් කැට, හිම, හිම කැට වැසි |
| **ද්‍රව අවස්ථාව** | නියත පරිමාවක් ඇති මුත් බඳුනේ හැඩය ගනී | ගංගා, ඇළ දොළ, වැසි ජලය, මුහුද |
| **වායු අවස්ථාව** | නියත හැඩයක් හෝ පරිමාවක් නැත | ජල වාෂ්ප, මීදුම, වලාකුළු |

| වස්තුව | ජලයේ හැසිරීම | හේතුව (ඝනත්වය) |
| :--- | :--- | :--- |
| **ලී කුට්ටිය, කිරළ, ප්ලාස්ටික් බෝතලය** | ජලයේ පාවේ | ජලයට වඩා ඝනත්වය අඩු නිසා |
| **යකඩ ඇණය, ගල් කැටය, කාසිය** | ජලයේ ගිලේ | ජලයට වඩා ඝනත්වය වැඩි නිසා |
| **අමු බිත්තරය (මිරිදිය ජලයේ)** | යට ගිලේ | බිත්තරයේ ඝනත්වය ජලයට වඩා වැඩි නිසා |
| **අමු බිත්තරය (ලුණු මිශ්‍ර ජලයේ)** | උඩ පාවේ | ලුණු දියවීමෙන් ජලයේ ඝනත්වය වැඩි වන නිසා |

## 💡 2. අමතර දැනුම සහ 190+ විභාග රහස් (Extra Knowledge):
- **විභාග උපදෙස:** ටින් එකක උඩ, මැද, යට හිල් තුනක් විද ජලය පුරවා බැලූ විට, යටම හිලෙන් වැඩිම වේගයකින් හා දුරකට වතුර විදින්නේ **යටම ස්ථානයේ ජල පීඩනය උපරිම නිසාය**.
- පෘථිවි පෘෂ්ඨයෙන් 71% ක් ජලය වන අතර, එයින් 97% ක්ම කරදිය (ලුණු ජලය) වේ. මිරිදිය ඇත්තේ 3% කි.`;
  }

  // 7. SIMPLE MACHINES (Theme 9: වැඩ පහසු කිරීමේ මං)
  if (
    q.includes("යන්ත්‍ර") ||
    q.includes("කප්පිය") ||
    q.includes("ආනත තලය") ||
    q.includes("ලීවර") ||
    q.includes("machine") ||
    q.includes("pulley")
  ) {
    return `👨‍🏫 **ආදරණීය පුතා/දුව, සරල යන්ත්‍ර පාඩමේ ගුරු සාරාංශය මෙන්න:**

## 📘 1. විෂය නිර්දේශය හා ගුරු මාර්ගෝපදේශය අනුව (NIE Guide):

| සරල යන්ත්‍ර වර්ගය | මූලධර්මය / භාවිතය | දෛනික ජීවිතයේ උදාහරණ |
| :--- | :--- | :--- |
| **ලිවරය (Lever)** | ආධාරකය, භාරය සහ ආයාසය යොදා කාර්යය පහසු කිරීම | උදැල්ල, කතුර, කරත්ත රෝදය, අඩුව, පැන්නුම් ලෑල්ල |
| **ආනත තලය (Inclined Plane)** | බෑවුමක් ඔස්සේ බර එසවීම පහසු කිරීම | තරප්පු පෙළ (පඩිපෙළ), පාරවල් වල බෑවුම්, ලෑලි බෑවුම |
| **කප්පිය (Pulley)** | කඹයක් හා රෝදයක් මඟින් ඉහළට බර එසවීම | ළිඳෙන් දිය ඇදීම, පාසලේ කොඩි ගස, දොඹකර |
| **ආපඤ්ඤය (Wedge)** | දෙපසට පීඩනය යොදා කැපීම හෝ පැලීම | පොරව, පිහිය, නියන, උදලු තලය |
| **දණ්ඩ හා රෝදය (Wheel & Axle)** | අඩු ආයාසයකින් විශාල බලයක් ලබා ගැනීම | වාහන සුක්කානම, දොර අගුල, කරත්ත රෝදය |

## 💡 2. අමතර දැනුම සහ 190+ විභාග රහස් (Extra Knowledge):
- **පාසල් කොඩි ගස:** පාසල් කොඩි ගසේ මුදුනේ ඇත්තේ **අචල කප්පියකි**. ඉන් යොදන බලයේ විශාලත්වය අඩු නොවුණද, බලය යොදන දිශාව පහසු දිශාවකට වෙනස් කරයි.
- සරල යන්ත්‍ර මඟින් යෙදිය යුතු බලය (ආයාසය) අඩු කරගත හැක, කාර්යය ඉක්මන් කරගත හැක.`;
  }

  // 8. MATH SECRETS (Scholarship Math Shortcuts)
  if (
    q.includes("ගණිත") ||
    q.includes("ත්‍රිකෝණ") ||
    q.includes("ඔරලෝසු") ||
    q.includes("math") ||
    q.includes("triangular") ||
    q.includes("clock")
  ) {
    return `👨‍🏫 **ආදරණීය දරුවා, ශිෂ්‍යත්ව ගණිත රහස් සහ කෙටි ක්‍රම මෙන්න:**

## 📘 1. විෂය නිර්දේශය හා ගුරු මාර්ගෝපදේශය අනුව:

| අංකය (n) | ත්‍රිකෝණ සංඛ්‍යාව | සූත්‍ර ගණනය: [n × (n + 1)] ÷ 2 |
| :--- | :--- | :--- |
| **1 වන** | 1 | (1 × 2) ÷ 2 = 1 |
| **2 වන** | 3 | (2 × 3) ÷ 2 = 3 |
| **3 වන** | 6 | (3 × 4) ÷ 2 = 6 |
| **4 වන** | 10 | (4 × 5) ÷ 2 = 10 |
| **5 වන** | 15 | (5 × 6) ÷ 2 = 15 |
| **6 වන** | 21 | (6 × 7) ÷ 2 = 21 |

| ඔරලෝසු ගැටළුව | කෙටි උපක්‍රමය | උදාහරණයක් |
| :--- | :--- | :--- |
| **කැඩපත් වේලාව සෙවීම** | දී ඇති වේලාව **11:60 න්** අඩු කරන්න | වේලාව 4:20 නම් ➔ 11:60 - 4:20 = **7:40** |
| **අත් අතට දීමේ ගැටළු** | (මිනිසුන් ගණන - 1) වන ත්‍රිකෝණ සංඛ්‍යාව | මිනිසුන් 5 නම් ➔ 4 වන ත්‍රිකෝණ සංඛ්‍යාව = **10** |

## 💡 2. අමතර දැනුම සහ 190+ විභාග රහස්:
- මේ කෙටි ක්‍රම භාවිතයෙන් විභාගයේදී එක් ගණිත ගැටළුවකට තත්පර 30කින් නිවැරදි පිළිතුර ලබාගත හැක.
- පළමු ත්‍රිකෝණ සංඛ්‍යා 10 කටපාඩම් කර තබාගන්න: **1, 3, 6, 10, 15, 21, 28, 36, 45, 55**.`;
  }

  // 9. ANIMALS (Theme 4: අප අවට සත්තු)
  if (
    q.includes("සතුන්") ||
    q.includes("animal") ||
    q.includes("පක්ෂි") ||
    q.includes("ආවේණික")
  ) {
    return `👨‍🏫 **ආදරණීය දරුවා, අප අවට සත්තු පාඩමේ ගුරු විග්‍රහය:**

## 📘 1. විෂය නිර්දේශය හා ගුරු මාර්ගෝපදේශය අනුව (NIE Guide):

| වර්ගීකරණය | අර්ථ දැක්වීම | උදාහරණ |
| :--- | :--- | :--- |
| **ශාක භක්ෂක සතුන්** | ශාක කොටස් පමණක් ආහාරයට ගන්නා සතුන් | ගවයා, එළුවා, මුවා, හාවා, අලියා, ගිරවා |
| **මාංශ භක්ෂක සතුන්** | වෙනත් සතුන්ගේ මස් පමණක් ආහාරයට ගන්නා සතුන් | කොටියා, දිවියා, සිංහයා, නයා, උකුස්සා |
| **සර්ව භක්ෂක සතුන්** | ශාක හා සත්ව ආහාර දෙවර්ගයම ආහාරයට ගන්නා සතුන් | මිනිසා, කපුටා, ඌරා, බල්ලා, මීයා |

| ලංකාවට ආවේණික පක්ෂීන් හා සතුන් | විශේෂ විභාග සටහන් |
| :--- | :--- |
| **ශ්‍රී ලංකා වලි කුකුළා** | ශ්‍රී ලංකාවේ ජාතික පක්ෂියා (කරමලය කහ සහ රතු) |
| **ශ්‍රී ලංකා අළු කෑදැත්තා** | විශාල හොටක් සහිත ආවේණික පක්ෂියෙකි |
| **හබන් කුකුළා** | තෙත් කලාපීය වනාන්තරවල ජීවත්වන කුඩා පක්ෂියෙකි |
| **කළු වඳුරා (ශ්‍රී ලංකා දම් මුහුණැති කොළ වඳුරා)** | ශ්‍රී ලංකාවේ වැසි වනාන්තර වලට ආවේණික ක්ෂීරපායියෙකි |

## 💡 2. අමතර දැනුම සහ 190+ විභාග රහස්:
- **ආවේණික සත්වයෙක් යනු:** ලෝකයේ වෙනත් කිසිදු රටක ස්වභාවිකව නොමැති, එක් නිශ්චිත රටක පමණක් ජීවත්වන සතුන් වේ.`;
  }

  // 10. GENERAL HELPFUL LESSON RESPONSE
  return `👨‍🏫 **ආදරණීය පුතා/දුව! මම "පහ දිනන හපන්නු 190+" පේපර් පන්තියේ ප්‍රවීණ AI ගුරුතුමා.**

ඔබ ඇසූ ප්‍රශ්නයට මම සතුටින් මඟපෙන්වන්නම්. 190+ පන්තියේ අපේ අරමුණ දරුවන්ගේ වේගය හා දැනුම දෙකම ඉහළම මට්ටමට ගෙන ඒමයි!

## 📘 1. විෂය නිර්දේශය හා ගුරු මාර්ගෝපදේශය අනුව:
- 5 ශ්‍රේණිය විභාගයේදී පරිසරය තේමා 16, මව්බස සිංහල, ශිෂ්‍යත්ව ගණිතය, දෙවන බස දෙමළ සහ ඉංග්‍රීසි යන විෂයන් සියල්ලෙන්ම ප්‍රශ්න අසනු ලැබේ.
- ඔබේ ප්‍රශ්නය විෂය කරුණක් නම් (උදා: පැළෑටි හා බීජ, රජවරුන්, ආහාර හා විටමින්, ජලය, සරල යන්ත්‍ර, ගණිත ගැටළු), මට ඒ මාතෘකාව කෙලින්ම ලියන්න. මම විෂය නිර්දේශයේ කරුණුත් සමඟම ඔබට විස්තර කර දෙන්නම්.

## 💡 2. අමතර දැනුම සහ 190+ විභාග රහස්:
- **ගුරු අවවාදය:** දිනකට පසුගිය හෝ ආදර්ශ ප්‍රශ්න පත්‍ර 2ක් වේලාව බලා පිළිතුරු ලියා පුහුණු වන්න.
- ඔබ කැමති නම් **"ප්‍රශ්නයක් අහන්න"** කියා මෙහි ලියන්න; මම ඔබට විභාග ආදර්ශ ප්‍රශ්නයක් ලබා දී ඔබේ දැනුම පරීක්ෂා කරන්නම්!

ඔබට අද ඉගෙන ගැනීමට අවශ්‍ය මාතෘකාව හෝ ප්‍රශ්නය කුමක්ද දරුවා?`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages = [], language = "si", customApiKey } = body;

    const lastUserMsg =
      [...messages].reverse().find((m) => m.role === "user")?.content || "";

    // Candidate API keys: prioritize customApiKey if provided by user, else env
    const groqKey =
      (customApiKey?.startsWith("gsk_") ? customApiKey : null) ||
      process.env.GROQ_API_KEY;

    let langInstruction = "Respond in Sinhala (සිංහල).";
    if (language === "en") langInstruction = "Respond in English.";
    if (language === "ta") langInstruction = "Respond in Tamil (தமிழ்).";

    const fullSystemPrompt = `${SYSTEM_PROMPT}\n\nIMPORTANT LANGUAGE INSTRUCTION:\nThe user's selected language is: ${language.toUpperCase()}. ${langInstruction} 
REMEMBER: You are the beloved Master Teacher (ප්‍රවීණ ගුරුතුමා). For any lesson/syllabus question, ALWAYS separate into:
## 📘 1. විෂය නිර්දේශය හා ගුරු මාර්ගෝපදේශය අනුව
## 💡 2. අමතර දැනුම සහ 190+ විභාග රහස්
TABLES & ORDERLY PRESENTATION:
Whenever presenting classifications, comparisons, vitamins, kings, plants, machines, or facts, ALWAYS format the key facts as a neat, clean Markdown Table (| Column | Column |). Keep spacing, headings, and bullet points orderly and easy for Grade 5 children to read without visual clutter.
When the student answers a question, evaluate whether their answer is correct or incorrect based on the question in the conversation history!`;

    // Format recent message history (last 10 messages) to maintain fast responses without bloating
    const recentMessages = messages.slice(-10).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content || "",
    }));

    const groqMessages = [
      { role: "system", content: fullSystemPrompt },
      ...recentMessages,
    ];

    // 1. Try Groq API models with individual timeouts (gpt-oss-120b primary, qwen fallback)
    if (groqKey) {
      const candidateModels = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"];

      for (const mod of candidateModels) {
        const modelCtrl = new AbortController();
        const timer = setTimeout(() => modelCtrl.abort(), 16000);

        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${groqKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: mod,
              messages: groqMessages,
              max_tokens: 1500,
              temperature: 0.7,
            }),
            signal: modelCtrl.signal,
          });

          clearTimeout(timer);

          if (groqRes.ok) {
            const gData = await groqRes.json();
            let text = gData?.choices?.[0]?.message?.content?.trim();
            if (!text && gData?.choices?.[0]?.message?.reasoning) {
              text = gData.choices[0].message.reasoning.trim();
            }

            if (text && text.length > 10) {
              return NextResponse.json({
                reply: text,
                source: `groq-${mod}`,
                language,
              });
            }
          }
        } catch (modelErr) {
          clearTimeout(timer);
          console.warn(`Groq attempt with ${mod} failed:`, modelErr?.message || modelErr);
        }
      }
    }

    // 2. High-intelligence NIE Grade 5 Smart Engine Fallback
    // Evaluates quiz answers dynamically and covers all Grade 5 scholarship subjects
    const fallbackReply = getSmartCurriculumResponse(lastUserMsg, language, messages);

    return NextResponse.json({
      reply: fallbackReply,
      source: "nie-smart-engine",
      language,
    });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json(
      {
        reply: "කරුණාකර මොහොතකින් නැවත උත්සාහ කරන්න. (Please try again in a moment.)",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
