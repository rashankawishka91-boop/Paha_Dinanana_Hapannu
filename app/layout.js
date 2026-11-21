import "./globals.css";
import { Provider } from "../lib/Provider";
import Header from "../components/Header";
import AiChatbot from "../components/AiChatbot";
import SvgSymbols from "../components/SvgSymbols";

export const metadata = {
  title: "පහ දිනන හපන්නු | 190+ පේපර් පන්තිය",
  description: "ලංකාවේ අංක 1 ශිෂ්‍යත්ව 190+ පේපර් පන්තිය - දිනකට පළාත් පේපර් 2ක් සාකච්ඡා කරමින් විෂයන් 5ම ආවරණය කරන, දරුවන්ගේ වේගය හා දැනුම හදන විශිෂ්ටතම පන්තිය. කොපි කරන්නත් බෑ.. සම කරන්නත් බෑ!",
  icons: { icon: "/logo.jpg" }
};

export default function RootLayout({ children }) {
  return (
    <html lang="si">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Figtree:wght@400;500;600;700&family=Noto+Sans+Sinhala:wght@400;600;700&display=swap"
        />
      </head>
      <body>
        <SvgSymbols />
        <Provider>
          <Header />
          {children}
          <AiChatbot />
        </Provider>
      </body>
    </html>
  );
}
