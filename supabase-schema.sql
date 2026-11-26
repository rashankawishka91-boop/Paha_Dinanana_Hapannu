-- ============================================================================
-- පහ දිනන හපන්නු - 190+ පේපර් පන්තිය (SUPABASE DATABASE SQL SCHEMA)
-- Run this entire script in your Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================================

-- 1. USERS TABLE (සිසුන් සහ ගුරු පරිපාලක ගිණුම්)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  pass TEXT NOT NULL,
  grade INTEGER DEFAULT 5 CHECK (grade IN (3, 4, 5)),
  admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FOLDERS / MONTHLY CLASSES TABLE (3, 4, 5 ශ්‍රේණිවල මාසික පන්ති)
CREATE TABLE IF NOT EXISTS public.folders (
  id TEXT PRIMARY KEY,
  grade INTEGER NOT NULL DEFAULT 5 CHECK (grade IN (3, 4, 5)),
  month TEXT NOT NULL,
  is_current_month BOOLEAN DEFAULT FALSE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'මාසික ප්‍රශ්න පත්‍ර පන්තිය',
  price INTEGER NOT NULL DEFAULT 2000,
  papers_count TEXT DEFAULT 'දිනකට පේපර් 2ක් + Zoom Live',
  subjects TEXT DEFAULT 'පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි',
  zoom_url TEXT DEFAULT 'https://zoom.us/j/94771234567',
  zoom_schedule TEXT DEFAULT 'සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 - 9.00 (Zoom Live)',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ITEMS TABLE (මාසික පන්තියට අදාළ Zoom Live Links, YouTube Videos සහ PDF Papers)
CREATE TABLE IF NOT EXISTS public.items (
  id TEXT PRIMARY KEY,
  fid TEXT NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'video' CHECK (type IN ('zoom', 'video', 'pdf')),
  week TEXT DEFAULT '1 වන සතිය',
  subject TEXT DEFAULT 'විෂයයන් 5ම',
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  schedule TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYMENTS / SLIPS TABLE (රු. 2000 මාසික පන්ති ගාස්තු බැංකු රිසිට්පත්)
CREATE TABLE IF NOT EXISTS public.pays (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  fid TEXT NOT NULL,
  slip TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CLASS SETTINGS TABLE (පන්ති සැකසුම් සහ බැංකු ගිණුම් විස්තර)
CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT NOT NULL DEFAULT 'පහ දිනන හපන්නු - 190+ පේපර් පන්තිය',
  slogan TEXT NOT NULL DEFAULT 'කොපි කරන්නත් බෑ.. සම කරන්නත් බෑ... ඒ තමයි පහ දිනන හපන්නු!',
  logo TEXT DEFAULT '/logo.jpg',
  hotline TEXT DEFAULT '077 123 4567',
  bank TEXT DEFAULT 'බැංකුව: ලංකා බැංකුව (Bank of Ceylon)
ගිණුම් අංකය: 001234567890
ගිණුමේ නම: පහ දිනන හපන්නු පේපර් පන්තිය
ශාඛාව: කොළඹ ප්‍රධාන ශාඛාව',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. REAL-TIME APP STATE SYNC TABLE (සියලු උපාංග අතර ක්ෂණික දත්ත සමමුහුර්තකරණය)
CREATE TABLE IF NOT EXISTS public.paha_dinana_state (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (Anon Key මඟින් කියවීමට සහ ලිවීමට අවසර දීම)
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paha_dinana_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to users" ON public.users;
CREATE POLICY "Allow public access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to folders" ON public.folders;
CREATE POLICY "Allow public access to folders" ON public.folders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to items" ON public.items;
CREATE POLICY "Allow public access to items" ON public.items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to pays" ON public.pays;
CREATE POLICY "Allow public access to pays" ON public.pays FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to settings" ON public.settings;
CREATE POLICY "Allow public access to settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to paha_dinana_state" ON public.paha_dinana_state;
CREATE POLICY "Allow public access to paha_dinana_state" ON public.paha_dinana_state FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- INITIAL SEED DATA (ආරම්භක ගිණුම් සහ 3, 4, 5 ශ්‍රේණිවල මාසික පන්ති දත්ත)
-- ============================================================================
INSERT INTO public.users (id, name, phone, pass, grade, admin)
VALUES
  ('admin', 'ප්‍රධාන ගුරුතුමා (Admin)', 'admin', 'admin123', 5, true),
  ('demo-student', 'කසුන් මධුෂාන් (ශිෂ්‍ය)', '0771122334', '1234', 5, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.folders (id, grade, month, is_current_month, name, category, price, papers_count, subjects, zoom_url, zoom_schedule, description)
VALUES
  ('f1', 5, '2026 නොවැම්බර්', true, '2026 නොවැම්බර් මාසයේ පන්තිය (190+ පළාත් පේපර් සහ සජීවී පන්ති)', 'මාසික ප්‍රශ්න පත්‍ර පන්තිය', 2000, 'දිනකට පේපර් 2ක් + Zoom Live', 'පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි', 'https://zoom.us/j/94771234567', 'සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 - 9.00 (Zoom Live)', 'නොවැම්බර් මාසයට අදාළ සියලුම සජීවී Zoom පන්ති, PDF ප්‍රශ්න පත්‍ර කට්ටල සහ වීඩියෝ විවරණ මෙම මාසික පන්තිය තුළ අන්තර්ගත වේ.'),
  ('f2', 5, '2026 ඔක්තෝබර්', false, '2026 ඔක්තෝබර් මාසයේ පන්තිය (දකුණු & මධ්‍යම පළාත් පේපර් සාකච්ඡාව)', 'පසුගිය මාසික පන්තිය', 2000, 'දිනකට පේපර් 2ක් + වීඩියෝ + PDF', 'පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි', 'https://zoom.us/j/94771234567', 'පසුගිය මාසයේ සජීවී පන්ති පටිගත කිරීම් සහ PDF සියල්ල ලබාගත හැක', 'ඔක්තෝබර් මාසයේ පැවති සියලුම පන්තිවල පටිගත කළ වීඩියෝ, ප්‍රශ්න පත්‍ර PDF සහ පිළිතුරු පත්‍රිකා.'),
  ('f3', 5, '2026 සැප්තැම්බර්', false, '2026 සැප්තැම්බර් මාසයේ පන්තිය (සබරගමුව & ඌව පළාත් පේපර් සාකච්ඡාව)', 'පසුගිය මාසික පන්තිය', 2000, 'දිනකට පේපර් 2ක් + වීඩියෝ + PDF', 'පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි', 'https://zoom.us/j/94771234567', 'පසුගිය මාසයේ සජීවී පන්ති පටිගත කිරීම් සහ PDF සියල්ල ලබාගත හැක', 'සැප්තැම්බර් මාසයේ සාකච්ඡා කළ සියලුම පළාත් ප්‍රශ්න පත්‍ර PDF සහ සවිස්තරාත්මක වීඩියෝ විවරණ.'),
  ('f4', 5, '2026 අගෝස්තු', false, '2026 අගෝස්තු මාසයේ පන්තිය (190+ අනුමාන පේපර් සහ පරිසරය විශේෂ)', 'පසුගිය මාසික පන්තිය', 2000, 'විශේෂ අනුමාන පේපර් + වීඩියෝ', 'පරිසරය, මව්බස, ගණිතය, දෙමළ, ඉංග්‍රීසි', 'https://zoom.us/j/94771234567', 'පසුගිය මාසයේ සජීවී පන්ති පටිගත කිරීම් සහ PDF සියල්ල ලබාගත හැක', 'අගෝස්තු මාසයේ පැවති විශේෂ අනුමාන ප්‍රශ්න පත්‍ර සහ පරිසරය තේමා 16 විශේෂ වීඩියෝ සාකච්ඡා.'),
  ('f5', 4, '2026 නොවැම්බර්', true, '2026 නොවැම්බර් මාසයේ පන්තිය - 4 ශ්‍රේණිය (ශිෂ්‍යත්ව පූර්ව අඩිතාලම)', 'මාසික ප්‍රශ්න පත්‍ර පන්තිය', 2000, 'මූලික පේපර් + Zoom Live', 'මව්බස, ගණිතය, පරිසරය, දෙමළ, ඉංග්‍රීසි', 'https://zoom.us/j/94771234567', 'සෑම සෙනසුරාදාම ප.ව. 4.00 - 6.00 (Zoom Live)', '4 ශ්‍රේණියේ දරුවන් සඳහා නොවැම්බර් මාසයේ පැවැත්වෙන සජීවී Zoom පන්ති, PDF ප්‍රශ්න පත්‍ර සහ වීඩියෝ පාඩම්.'),
  ('f6', 4, '2026 ඔක්තෝබර්', false, '2026 ඔක්තෝබර් මාසයේ පන්තිය - 4 ශ්‍රේණිය (වියරණ හා ගණිත කෙටි ක්‍රම)', 'පසුගිය මාසික පන්තිය', 2000, 'පේපර් කට්ටල + වීඩියෝ + PDF', 'මව්බස, ගණිතය, පරිසරය, දෙමළ, ඉංග්‍රීසි', 'https://zoom.us/j/94771234567', 'පසුගිය මාසයේ පටිගත කළ වීඩියෝ සහ PDF', '4 ශ්‍රේණිය ඔක්තෝබර් මාසයේ පැවති සියලුම පාඩම්වල වීඩියෝ සහ PDF සටහන්.'),
  ('f7', 3, '2026 නොවැම්බර්', true, '2026 නොවැම්බර් මාසයේ පන්තිය - 3 ශ්‍රේණිය (මූලික පදනම සහ පේපර් පුහුණුව)', 'මාසික ප්‍රශ්න පත්‍ර පන්තිය', 2000, 'සතිපතා පේපර් + Zoom Live', 'මව්බස, ගණිතය, පරිසරය, ඉංග්‍රීසි', 'https://zoom.us/j/94771234567', 'සෑම ඉරිදාම ප.ව. 3.00 - 5.00 (Zoom Live)', '3 ශ්‍රේණිය දරුවන් සඳහා නොවැම්බර් මාසයේ සජීවී Zoom පන්ති, PDF වැඩ පත්‍රිකා සහ වීඩියෝ පාඩම්.'),
  ('f8', 3, '2026 ඔක්තෝබර්', false, '2026 ඔක්තෝබර් මාසයේ පන්තිය - 3 ශ්‍රේණිය (පසුගිය මාසයේ පාඩම් එකතුව)', 'පසුගිය මාසික පන්තිය', 2000, 'වීඩියෝ + PDF වැඩ පත්‍රිකා', 'මව්බස, ගණිතය, පරිසරය, ඉංග්‍රීසි', 'https://zoom.us/j/94771234567', 'පසුගිය මාසයේ පටිගත කළ වීඩියෝ සහ PDF', '3 ශ්‍රේණිය ඔක්තෝබර් මාසයේ සියලුම වීඩියෝ පාඩම් සහ PDF ප්‍රශ්න පත්‍ර.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.items (id, fid, type, week, subject, title, url, schedule)
VALUES
  ('i_zoom_1', 'f1', 'zoom', '1 වන සතිය', 'විෂයයන් 5ම', 'නොවැම්බර් සජීවී Zoom පන්තිය - පළාත් පේපර් සජීවී විවරණය (Live Class)', 'https://zoom.us/j/94771234567', 'සෑම සෙනසුරාදා සහ ඉරිදාම ප.ව. 7.00 ට'),
  ('i1', 'f1', 'video', '1 වන සතිය', 'ගණිතය & මව්බස', 'බස්නාහිර පළාත් පේපර් 01 - පළමු අර්ධය (ප්‍රශ්න 1-25) සවිස්තර සාකච්ඡාව & වේග උපක්‍රම', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', ''),
  ('i2', 'f1', 'pdf', '1 වන සතිය', 'සියලු විෂයයන්', 'බස්නාහිර පළාත් පේපර් 01 - සම්පූර්ණ ප්‍රශ්න පත්‍රය (මුද්‍රණය සඳහා PDF)', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', ''),
  ('i3', 'f1', 'video', '2 වන සතිය', 'පරිසරය, දෙමළ, ඉංග්‍රීසි', 'වයඹ පළාත් පේපර් 02 - පරිසරය, දෙමළ හා ඉංග්‍රීසි ප්‍රශ්න විවරණය (ලකුණු නොකැපෙන රහස්)', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', ''),
  ('i4', 'f1', 'pdf', '2 වන සතිය', 'විෂයයන් 5ම', 'වයඹ පළාත් පේපර් 02 - ප්‍රශ්න පත්‍රය සහ ආදර්ශ පිළිතුරු පත්‍රිකාව (PDF)', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.settings (id, name, slogan, logo, hotline)
VALUES (1, 'පහ දිනන හපන්නු - 190+ පේපර් පන්තිය', 'කොපි කරන්නත් බෑ.. සම කරන්නත් බෑ... ඒ තමයි පහ දිනන හපන්නු!', '/logo.jpg', '077 123 4567')
ON CONFLICT (id) DO NOTHING;
