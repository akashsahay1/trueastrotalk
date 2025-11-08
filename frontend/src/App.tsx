
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AboutAstrology from "./pages/AboutAstrology";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TrueAstrotalk from "./pages/about/TrueAstrotalk";
import Kundali from "./pages/about/Kundali";
import Palmistry from "./pages/about/Palmistry";
import LifeCoach from "./pages/about/LifeCoach";
import Nadi from "./pages/about/Nadi";
import Vedic from "./pages/about/Vedic";
import Tarot from "./pages/about/Tarot";
import LalKitab from "./pages/about/LalKitab";
import Vastu from "./pages/about/Vastu";
import Psychic from "./pages/about/Psychic";
import Numerology from "./pages/about/Numerology";
import KP from "./pages/about/KP";
import Aries from "./pages/horoscope/Aries";
import Taurus from "./pages/horoscope/Taurus";
import Gemini from "./pages/horoscope/Gemini";
import Cancer from "./pages/horoscope/Cancer";
import Leo from "./pages/horoscope/Leo";
import Virgo from "./pages/horoscope/Virgo";
import Libra from "./pages/horoscope/Libra";
import Scorpio from "./pages/horoscope/Scorpio";
import Sagittarius from "./pages/horoscope/Sagittarius";
import Capricorn from "./pages/horoscope/Capricorn";
import Aquarius from "./pages/horoscope/Aquarius";
import Pisces from "./pages/horoscope/Pisces";
import MarriageGuidance from "./pages/services/MarriageGuidance";
import CareerGuidance from "./pages/services/CareerGuidance";
import LoveProblems from "./pages/services/LoveProblems";
import FinancialConsultation from "./pages/services/FinancialConsultation";
import BusinessProblems from "./pages/services/BusinessProblems";
import AuspiciousTime from "./pages/services/AuspiciousTime";
import HoroscopeReading from "./pages/services/HoroscopeReading";
import PanchakCalculator from "./pages/PanchakCalculator";
import LoShuGridCalculator from "./pages/LoShuGridCalculator";
import KundaliMatching from "./pages/KundaliMatching";
import LoveCalculator from "./pages/LoveCalculator";
import NumerologyCalculator from "./pages/NumerologyCalculator";
import VedicPanchang from "./pages/VedicPanchang";
import RashiCalculator from "./pages/RashiCalculator";
import NakshatraCalculator from "./pages/NakshatraCalculator";
import AscendantGemstones from "./pages/AscendantGemstones";
import SignatureCalculator from "./pages/SignatureCalculator";
import LuckyMobileCalculator from "./pages/LuckyMobileCalculator";
import Ashwini from "./pages/about/Ashwini";
import Bharani from "./pages/about/Bharani";
import Krittika from "./pages/about/Krittika";
import Rohini from "./pages/about/Rohini";
import Mrigashira from "./pages/about/Mrigashira";
import Ardra from "./pages/about/Ardra";
import Punarvasu from "./pages/about/Punarvasu";
import Pushya from "./pages/about/Pushya";
import Ashlesha from "./pages/about/Ashlesha";
import Magha from "./pages/about/Magha";
import PurvaPhalguni from "./pages/about/PurvaPhalguni";
import UttaraPhalguni from "./pages/about/UttaraPhalguni";
import Hasta from "./pages/about/Hasta";
import Chitra from "./pages/about/Chitra";
import Swati from "./pages/about/Swati";
import Vishakha from "./pages/about/Vishakha";
import Anuradha from "./pages/about/Anuradha";
import Jyeshtha from "./pages/about/Jyeshtha";
import Mula from "./pages/about/Mula";
import PurvaAshadha from "./pages/about/PurvaAshadha";
import UttaraAshadha from "./pages/about/UttaraAshadha";
import Shravana from "./pages/about/Shravana";
import Dhanishta from "./pages/about/Dhanishta";
import Shatabhisha from "./pages/about/Shatabhisha";
import PurvaBhadrapada from "./pages/about/PurvaBhadrapada";
import UttaraBhadrapada from "./pages/about/UttaraBhadrapada";
import Revati from "./pages/about/Revati";
import NakshatrasGeneral from "./pages/about/NakshatrasGeneral";
import Nakshatras from "./pages/Nakshatras";
import AstrologerRegistration from "./pages/AstrologerRegistration";
import LifePathNumber from "./pages/LifePathNumber";

// Create a stable QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  console.log('App component rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen w-full">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signature-calculator" element={<SignatureCalculator />} />
            <Route path="/lucky-mobile-calculator" element={<LuckyMobileCalculator />} />
            <Route path="/about-astrology" element={<AboutAstrology />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/about/trueastrotalk" element={<TrueAstrotalk />} />
            <Route path="/about/kundali" element={<Kundali />} />
            <Route path="/about/palmistry" element={<Palmistry />} />
            <Route path="/about/lifecoach" element={<LifeCoach />} />
            <Route path="/about/nadi" element={<Nadi />} />
            <Route path="/about/vedic" element={<Vedic />} />
            <Route path="/about/tarot" element={<Tarot />} />
            <Route path="/about/lalkitab" element={<LalKitab />} />
            <Route path="/about/vastu" element={<Vastu />} />
            <Route path="/about/psychic" element={<Psychic />} />
            <Route path="/about/numerology" element={<Numerology />} />
            <Route path="/about/kp" element={<KP />} />
            <Route path="/services/marriage-guidance" element={<MarriageGuidance />} />
            <Route path="/services/career-guidance" element={<CareerGuidance />} />
            <Route path="/services/love-problems" element={<LoveProblems />} />
            <Route path="/services/financial-consultation" element={<FinancialConsultation />} />
            <Route path="/services/business-problems" element={<BusinessProblems />} />
            <Route path="/services/auspicious-time" element={<AuspiciousTime />} />
            <Route path="/services/horoscope-reading" element={<HoroscopeReading />} />
            <Route path="/horoscope/aries" element={<Aries />} />
            <Route path="/horoscope/taurus" element={<Taurus />} />
            <Route path="/horoscope/gemini" element={<Gemini />} />
            <Route path="/horoscope/cancer" element={<Cancer />} />
            <Route path="/horoscope/leo" element={<Leo />} />
            <Route path="/horoscope/virgo" element={<Virgo />} />
            <Route path="/horoscope/libra" element={<Libra />} />
            <Route path="/horoscope/scorpio" element={<Scorpio />} />
            <Route path="/horoscope/sagittarius" element={<Sagittarius />} />
            <Route path="/horoscope/capricorn" element={<Capricorn />} />
            <Route path="/horoscope/aquarius" element={<Aquarius />} />
            <Route path="/horoscope/pisces" element={<Pisces />} />
            <Route path="/panchak-calculator" element={<PanchakCalculator />} />
            <Route path="/loshu-grid-calculator" element={<LoShuGridCalculator />} />
            <Route path="/kundali-matching" element={<KundaliMatching />} />
            <Route path="/love-calculator" element={<LoveCalculator />} />
            <Route path="/numerology-calculator" element={<NumerologyCalculator />} />
            <Route path="/vedic-panchang" element={<VedicPanchang />} />
            <Route path="/rashi-calculator" element={<RashiCalculator />} />
            <Route path="/nakshatra-calculator" element={<NakshatraCalculator />} />
            <Route path="/ascendant-gemstones" element={<AscendantGemstones />} />
            
            {/* Nakshatra About Pages */}
          <Route path="/about/ashwini" element={<Ashwini />} />
          <Route path="/about/bharani" element={<Bharani />} />
          <Route path="/about/krittika" element={<Krittika />} />
          <Route path="/about/rohini" element={<Rohini />} />
          <Route path="/about/mrigashira" element={<Mrigashira />} />
          <Route path="/about/ardra" element={<Ardra />} />
          <Route path="/about/punarvasu" element={<Punarvasu />} />
          <Route path="/about/pushya" element={<Pushya />} />
          <Route path="/about/ashlesha" element={<Ashlesha />} />
          <Route path="/about/magha" element={<Magha />} />
          <Route path="/about/purva-phalguni" element={<PurvaPhalguni />} />
          <Route path="/about/uttara-phalguni" element={<UttaraPhalguni />} />
          <Route path="/about/hasta" element={<Hasta />} />
            <Route path="/about/chitra" element={<Chitra />} />
            <Route path="/about/swati" element={<Swati />} />
            <Route path="/about/vishakha" element={<Vishakha />} />
            <Route path="/about/anuradha" element={<Anuradha />} />
            <Route path="/about/jyeshtha" element={<Jyeshtha />} />
            <Route path="/about/mula" element={<Mula />} />
            <Route path="/about/purva-ashadha" element={<PurvaAshadha />} />
            <Route path="/about/uttara-ashadha" element={<UttaraAshadha />} />
            <Route path="/about/shravana" element={<Shravana />} />
            <Route path="/about/dhanishta" element={<Dhanishta />} />
            <Route path="/about/shatabhisha" element={<Shatabhisha />} />
            <Route path="/about/purva-bhadrapada" element={<PurvaBhadrapada />} />
            <Route path="/about/uttara-bhadrapada" element={<UttaraBhadrapada />} />
            <Route path="/about/revati" element={<Revati />} />
            
            <Route path="/about/nakshatras" element={<NakshatrasGeneral />} />
            <Route path="/nakshatras" element={<Nakshatras />} />
            <Route path="/astrologer-registration" element={<AstrologerRegistration />} />
            <Route path="/life-path-number/:number" element={<LifePathNumber />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
