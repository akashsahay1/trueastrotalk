import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

interface NameResult {
  total: number;
  reduced: number;
  breakdown: string;
}

interface MobileResult {
  total: number;
  reduced: number;
  breakdown: string;
  original: string;
  modified: string;
  modifiedDigits: number[];
}

interface DateResult {
  day: number;
  month: number;
  year: number;
  lifePathTotal: number;
  lifePathNumber: number;
  birthDayNumber: number;
  destinyNumber: number;
  breakdown: string;
}

interface PositionAnalysis {
  digit: number;
  meaning: string;
  title: string;
}

const LuckyMobileCalculator = () => {
  const [name, setName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [dob, setDob] = React.useState('');
  const [nameResult, setNameResult] = React.useState<NameResult | null>(null);
  const [mobileResult, setMobileResult] = React.useState<MobileResult | null>(null);
  const [dobResult, setDobResult] = React.useState<DateResult | null>(null);
  const [positionAnalysis, setPositionAnalysis] = React.useState<Record<number, PositionAnalysis> | null>(null);
  const [showResults, setShowResults] = React.useState(false);
  const { toast } = useToast();

  // Letter to number mapping (A=1 to Z=26)
  const letterToNumber: Record<string, number> = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
    'J': 10, 'K': 11, 'L': 12, 'M': 13, 'N': 14, 'O': 15, 'P': 16, 'Q': 17, 'R': 18,
    'S': 19, 'T': 20, 'U': 21, 'V': 22, 'W': 23, 'X': 24, 'Y': 25, 'Z': 26
  };

  const positionMeanings = {
    7: {
      title: "7वां स्थान - आपका संचार स्वभाव और बात करने का तरीका",
      meanings: {
        1: "🎯 नेतृत्वकारी संचार: आप सीधी और स्पष्ट बात करते हैं। अपनी बात को मजबूती से रखते हैं और दूसरों को guide करना पसंद करते हैं।",
        2: "🤝 कूटनीतिक संचार: आप बहुत मधुर और सहयोगी तरीके से बात करते हैं। Conflicts को avoid करते हैं और हमेशा diplomatic approach अपनाते हैं।",
        3: "🎨 रचनात्मक संचार: आप बहुत interesting और entertaining तरीके से बात करते हैं। Jokes, stories और examples का बहुत अच्छा उपयोग करते हैं।",
        4: "📋 व्यावहारिक संचार: आप facts और logic के साथ बात करते हैं। हर बात के लिए proper evidence और reasoning देते हैं।",
        5: "✈️ विविधतापूर्ण संचार: आप different topics पर बात करना पसंद करते हैं। Travel experiences, new trends और adventures के बारे में enthusiastically बात करते हैं।",
        6: "❤️ देखभाल भरा संचार: आप बहुत प्रेम और care के साथ बात करते हैं। Family के बारे में, relationships के बारे में और emotional support देने में expert हैं।",
        7: "🧘 गहन संचार: आप deep और meaningful conversations करना पसंद करते हैं। Philosophy, spirituality और life के bigger questions पर discuss करते हैं।",
        8: "💼 व्यावसायिक संचार: आप business-minded approach से बात करते हैं। Money, career, success और practical benefits पर focus करते हैं।",
        9: "🌍 मानवतावादी संचार: आप बड़े picture की बात करते हैं। Society की भलाई, helping others और making a difference की बातें करते हैं।"
      }
    },
    8: {
      title: "8वां स्थान - आप किस प्रकार के विषयों में रुचि रखते हैं",
      meanings: {
        1: "👑 उपलब्धि और लक्ष्य: आप अपनी achievements, career goals, leadership experiences और personal success stories के बारे में बात करना पसंद करते हैं।",
        2: "💕 रिश्ते और साझेदारी: आप relationships, partnerships, teamwork और collaboration के बारे में बात करना पसंद करते हैं।",
        3: "🎭 कला और मनोरंजन: आप movies, music, art, entertainment industry और creative projects के बारे में बात करना पसंद करते हैं।",
        4: "🏗️ कार्य और व्यवस्था: आप work processes, home organization, systematic planning और practical solutions के बारे में बात करना पसंद करते हैं।",
        5: "🌟 यात्रा और अनुभव: आप travel stories, adventure sports, new places, different cultures और exciting experiences के बारे में बात करना पसंद करते हैं।",
        6: "👨‍👩‍👧‍👦 परिवार और समुदाय: आप family matters, children की growth, community events और social responsibilities के बारे में बात करना पसंद करते हैं।",
        7: "📚 ज्ञान और आध्यात्म: आप philosophy, religion, meditation, astrology, psychology और deep life questions के बारे में बात करना पसंद करते हैं।",
        8: "💰 व्यवसाय और धन: आप business strategies, investment opportunities, real estate, financial planning और wealth creation के बारे में बात करना पसंद करते हैं।",
        9: "🤲 सेवा और समाज: आप social issues, charity work, helping underprivileged, environmental causes और humanitarian efforts के बारे में बात करना पसंद करते हैं।"
      }
    },
    9: {
      title: "9वां स्थान - कॉल करने वाले की बातचीत की प्राथमिकताएं",
      meanings: {
        1: "🎯 सफलता और प्रेरणा: आपसे अपनी achievements, future plans, career advancement और personal victories के बारे में बात करना चाहता है।",
        2: "💝 भावनाएं और रिश्ते: आपसे अपनी personal feelings, relationship issues, family matters और emotional concerns के बारे में बात करना चाहता है।",
        3: "🎪 मनोरंजन और खुशी: आपसे fun activities, entertainment plans, creative ideas और joyful experiences के बारे में बात करना चाहता है।",
        4: "📊 व्यावहारिक समस्याएं: आपसे practical problems, work-related issues, systematic solutions और organized planning के बारे में बात करना चाहता है।",
        5: "🗺️ नए अनुभव और स्वतंत्रता: आपसे adventures, travel plans, new experiences और freedom के बारे में बात करना चाहता है।",
        6: "🏠 पारिवारिक और देखभाल: आपसे family problems, children के issues, home matters और caring relationships के बारे में बात करना चाहता है।",
        7: "🔍 गहरे विषय और ज्ञान: आपसे spiritual topics, philosophical questions, research subjects और deep meaningful discussions करना चाहता है।",
        8: "💼 व्यावसायिक अवसर: आपसे business opportunities, financial matters, investment ideas और material success के बारे में बात करना चाहता है।",
        9: "🌎 सामाजिक कल्याण: आपसे social causes, helping others, community service और humanitarian work के बारे में बात करना चाहता है।"
      }
    },
    10: {
      title: "10वां स्थान - कॉल करने वाले की मानसिकता और गुप्त इरादे",
      meanings: {
        1: "🚀 नेतृत्व की मानसिकता: उनका दिमाग बहुत confident और ambitious है। वे कुछ नया शुरू करने का plan बना रहे हैं।",
        2: "🤗 सहयोग की मानसिकता: उनका दिमाग peaceful और cooperative है। वे किसी conflict को resolve करना चाहते हैं।",
        3: "🌈 आनंद की मानसिकता: उनका दिमाग creative और optimistic है। वे life को enjoy करना चाहते हैं।",
        4: "⚒️ व्यवस्थित मानसिकता: उनका दिमाग very organized और practical है। वे कोई specific problem solve करना चाहते हैं।",
        5: "🎢 स्वतंत्रता की मानसिकता: उनका दिमाग restless और change-seeking है। वे अपनी current situation से बाहर निकलना चाहते हैं।",
        6: "💖 देखभाल की मानसिकता: उनका दिमाग caring और responsible है। वे किसी को help करना चाहते हैं।",
        7: "🧠 खोजी मानसिकता: उनका दिमाग very analytical और truth-seeking है। वे life के deeper meanings समझना चाहते हैं।",
        8: "💎 महत्वाकांक्षी मानसिकता: उनका दिमाग very ambitious और material-focused है। वे financial growth चाहते हैं।",
        9: "🕊️ सेवाभावी मानसिकता: उनका दिमाग humanitarian और selfless है। वे दूसरों की service करना चाहते हैं।"
      }
    }
  };

  // Comprehensive advice system
  const getPersonalizedAdvice = (nameNum?: number, mobileNum?: number, lifePathNum?: number) => {
    if (!nameNum && !mobileNum && !lifePathNum) return null;
    
    const advice = {
      career: getCareerAdvice(nameNum, mobileNum, lifePathNum),
      relationships: getRelationshipAdvice(nameNum, mobileNum, lifePathNum),
      health: getHealthAdvice(nameNum, mobileNum, lifePathNum),
      wealth: getWealthAdvice(nameNum, mobileNum, lifePathNum),
      spiritual: getSpiritualAdvice(nameNum, mobileNum, lifePathNum),
      daily: getDailyAdvice(nameNum, mobileNum, lifePathNum),
      lucky: getLuckyAdvice(nameNum, mobileNum, lifePathNum),
      challenges: getChallengeAdvice(nameNum, mobileNum, lifePathNum)
    };
    
    return advice;
  };

  const getCareerAdvice = (nameNum?: number, mobileNum?: number, lifePathNum?: number) => {
    const dominantNumber = getDominantNumber(nameNum, mobileNum, lifePathNum);
    const careerAdviceMap: Record<number, string> = {
      1: "🚀 **करियर सुझाव:** आप leadership roles के लिए बने हैं। Own business शुरू करें या management positions target करें। CEO, Director, Entrepreneur, Team Leader जैसे roles perfect हैं। Independent projects को प्राथमिकता दें और decision-making roles में excel करेंगे।",
      2: "🤝 **करियर सुझाव:** आप teamwork और collaboration में excellent हैं। HR, Customer Service, Counseling, Diplomacy, Partnership business में success मिलेगी। Support roles, Mediation, Training और team coordination आपकी strength है।",
      3: "🎨 **करियर सुझाव:** Creative fields आपके लिए perfect हैं। Advertising, Marketing, Writing, Entertainment, Art, Music, Photography, Social Media में career बनाएं। Communication skills का भरपूर उपयोग करें।",
      4: "🏗️ **करियर सुझाव:** Systematic और organized work आपकी specialty है। Engineering, Architecture, Finance, Administration, Project Management में excel करेंगे। Structure और planning वाले roles choose करें।",
      5: "✈️ **करियर सुझाव:** Variety और travel वाले careers perfect हैं। Sales, Travel Industry, Journalism, Event Management, Consulting में success मिलेगी। Freedom और flexibility वाले jobs prefer करें।",
      6: "❤️ **करियर सुझाव:** Service और caring professions आपकी calling है। Healthcare, Teaching, Social Work, Childcare, Hospitality में natural talent है। Family business भी good option है।",
      7: "🧘 **करियर सुझाव:** Research, Analysis और spiritual fields में excel करेंगे। Academic, Research, IT, Psychology, Astrology, Writing, Consulting में career बनाएं। Deep knowledge वाले fields choose करें।",
      8: "💼 **करियर सुझाव:** Business और financial success आपका forte है। Banking, Real Estate, Investment, Manufacturing, Corporate Leadership में excel करेंगे। Money-making ventures start करें।",
      9: "🌍 **करियर सुझाव:** Humanitarian और service fields आपकी destiny है। NGO, Social Work, Teaching, Healthcare, Law, Politics में impact create करेंगे। Society की भलाई वाले careers choose करें।"
    };
    return careerAdviceMap[dominantNumber] || careerAdviceMap[1];
  };

  const getRelationshipAdvice = (nameNum?: number, mobileNum?: number, lifePathNum?: number) => {
    const dominantNumber = getDominantNumber(nameNum, mobileNum, lifePathNum);
    const relationshipAdviceMap: Record<number, string> = {
      1: "💑 **रिश्ते में सुझाव:** आप naturally dominant हैं, partner को space दें। Ego को control करें और compromise सीखें। Leadership qualities को relationship में भी balance के साथ use करें। Partner के decisions को भी respect करें।",
      2: "💕 **रिश्ते में सुझाव:** आप ideal partner हैं! Caring, understanding और supportive nature से relationships में success मिलती है। Emotional support देना आपकी strength है। Over-adjustment से बचें।",
      3: "😊 **रिश्ते में सुझाव:** Fun, romance और communication आपकी specialty है। Partner को entertain करना और happy रखना आता है। Serious conversations को भी equally important दें। Commitment में consistent रहें।",
      4: "🏠 **रिश्ते में सुझाव:** Stable और loyal partner हैं आप। Traditional values और family को priority देते हैं। Spontaneity add करें relationship में। Emotional expression को improve करें।",
      5: "🌟 **रिश्ते में सुझाव:** Freedom और space आपकी जरूरत है। Partner को भी independence दें। Commitment से डरने की जरूरत नहीं। Adventure together करें relationship में।",
      6: "👨‍👩‍👧‍👦 **रिश्ते में सुझाव:** Family और relationships आपकी priority हैं। Caring nature amazing है, लेकिन over-protective न बनें। Partner की individual growth को भी support करें।",
      7: "🔮 **रिश्ते में सुझाव:** Deep emotional connection चाहिए आपको। Surface level relationships avoid करें। Spiritual compatibility important है। More open communication practice करें।",
      8: "💎 **रिश्ते में सुझाव:** Success और material security important है आपके लिए। Partner के साथ financial goals share करें। Work-life balance maintain करें। Emotional needs को भी priority दें।",
      9: "🤗 **रिश्ते में सुझाव:** Compassionate और understanding partner हैं आप। Universal love आपकी nature है। Personal relationships को भी equal importance दें social causes के साथ।"
    };
    return relationshipAdviceMap[dominantNumber] || relationshipAdviceMap[2];
  };

  const getHealthAdvice = (nameNum?: number, mobileNum?: number, lifePathNum?: number) => {
    const dominantNumber = getDominantNumber(nameNum, mobileNum, lifePathNum);
    const healthAdviceMap: Record<number, string> = {
      1: "🏃 **स्वास्थ्य सुझाव:** Heart और blood pressure पर ध्यान दें। Stress management करें। Regular cardio exercise जरूरी है। Leadership pressure से head-related issues हो सकते हैं। Meditation practice करें।",
      2: "🧘 **स्वास्थ्य सुझाव:** Emotional eating से बचें। Digestive system care करें। Anxiety और depression prone हैं। Yoga, meditation और peaceful environment maintain करें। Partnership में stress avoid करें।",
      3: "🎭 **स्वास्थ्य सुझाव:** Throat, voice और respiratory system पर focus करें। Over-excitement से energy waste न करें। Creative outlets से mental health improve होगी। Social gatherings में moderation रखें।",
      4: "⚖️ **स्वास्थ्य सुझाव:** Bones, joints और back problems prone हैं। Regular exercise routine maintain करें। Over-working से बचें। Structured diet plan follow करें। Adequate rest important है।",
      5: "🌪️ **स्वास्थ्य सुझाव:** Nervous system और accidents prone हैं। Adventure sports में precaution लें। Consistent diet और exercise routine develop करें। Mental restlessness को control करें।",
      6: "🫶 **स्वास्थ्य सुझाव:** Heart conditions और emotional eating watch करें। Family stress health पर affect करता है। Nurturing others के साथ self-care भी करें। Comfort food addiction से बचें।",
      7: "🧠 **स्वास्थ्य सुझाव:** Mental health और nervous disorders prone हैं। Over-thinking से headaches हो सकते हैं। Meditation, spirituality और alone time जरूरी है। Eye strain से बचें।",
      8: "💪 **स्वास्थ्य सुझाव:** Work stress से health issues हो सकते हैं। Regular health checkups करवाएं। Liver और digestive system care करें। Work-life balance maintain करें।",
      9: "🌱 **स्वास्थ्य सुझाव:** Service में खुद को exhaust न करें। Immune system weak हो सकती है। Charitable work के साथ self-care भी जरूरी है। Universal healing practices try करें।"
    };
    return healthAdviceMap[dominantNumber] || healthAdviceMap[5];
  };

  const getWealthAdvice = (nameNum?: number, mobileNum?: number, lifePathNum?: number) => {
    const dominantNumber = getDominantNumber(nameNum, mobileNum, lifePathNum);
    const wealthAdviceMap: Record<number, string> = {
      1: "💰 **धन सुझाव:** Leadership ventures में invest करें। Own business start करें। Risk taking ability use करें। Stock market में individual stocks prefer करें। Real estate में good returns मिलेंगे।",
      2: "🤝 **धन सुझाव:** Partnership business में success होगी। Mutual funds और joint investments करें। Conservative approach maintain करें। Collaboration से wealth बढ़ेगी। Avoid solo risky investments।",
      3: "🎨 **धन सुझाव:** Creative industries में invest करें। Entertainment, art और communication sectors profitable हैं। Multiple income sources develop करें। Social networks से opportunities मिलेंगी।",
      4: "🏗️ **धन सुझाव:** Long-term systematic investments करें। Real estate, infrastructure में invest करें। SIP और recurring deposits ideal हैं। Stable growth prefer करें speculative investments से।",
      5: "✈️ **धन सुझाव:** Diverse portfolio maintain करें। Travel, technology और international markets में opportunities हैं। Quick profits possible लेकिन risky भी। Emergency fund जरूर रखें।",
      6: "🏠 **धन सुझाव:** Family welfare और home improvement में invest करें। Healthcare, education sectors profitable हैं। Conservative mutual funds choose करें। Children की education के लिए early planning करें।",
      7: "📚 **धन सुझाव:** Research-based investments करें। Technology, pharmaceuticals में good opportunities हैं। Spiritual and wellness industry growing है। Knowledge-based income sources develop करें।",
      8: "💼 **धन सुझाव:** Business expansion और real estate में major investments करें। Corporate bonds, large cap stocks ideal हैं। Material wealth naturally attract होती है। Tax planning important है।",
      9: "🌍 **धन सुझाव:** Social impact investments करें। ESG funds और sustainable ventures में invest करें। Charitable giving tax benefits देती है। Service se wealth naturally बढ़ती है।"
    };
    return wealthAdviceMap[dominantNumber] || wealthAdviceMap[4];
  };

  const getSpiritualAdvice = (nameNum?: number, mobileNum?: number, lifePathNum?: number) => {
    const dominantNumber = getDominantNumber(nameNum, mobileNum, lifePathNum);
    const spiritualAdviceMap: Record<number, string> = {
      1: "🔥 **आध्यात्मिक सुझाव:** Sun worship और Hanuman ji की उपासना करें। Leadership qualities को divine service में use करें। Red coral gemstone beneficial है। Tuesday को fast रखें।",
      2: "🌙 **आध्यात्मिक सुझाव:** Moon worship और Mother Divine की उपासना करें। Peaceful meditation practice करें। Pearl gemstone wear करें। Monday को व्रत रखें। Water bodies के पास जाएं।",
      3: "⚡ **आध्यात्मिक सुझाव:** Jupiter worship और Lord Krishna की उपासना करें। Creative spiritual practices like kirtan, bhajan करें। Yellow sapphire beneficial है। Thursday को व्रत रखें।",
      4: "🌍 **आध्यात्मिक सुझाव:** Earth elements worship करें। Lord Ganesha और Rahu की उपासना करें। Systematic spiritual practice maintain करें। Hessonite garnet wear करें।",
      5: "💨 **आध्यात्मिक सुझाव:** Mercury worship और Lord Vishnu की उपासना करें। Travel to spiritual places। Emerald gemstone beneficial है। Wednesday को व्रत रखें। Mantra chanting करें।",
      6: "💖 **आध्यात्मिक सुझाव:** Venus worship और Goddess Lakshmi की उपासना करें। Love और compassion based practices करें। Diamond या white sapphire wear करें। Friday को व्रत रखें।",
      7: "🔮 **आध्यात्मिक सुझाव:** Ketu worship और Lord Shiva की उपासना करें। Deep meditation और solitude practice करें। Cat's eye gemstone beneficial है। Introspection और self-inquiry करें।",
      8: "💎 **आध्यात्मिक सुझाव:** Saturn worship और Lord Hanuman की उपासना करें। Discipline और patience develop करें। Blue sapphire (सावधानी से) wear करें। Saturday को व्रत रखें।",
      9: "🕉️ **आध्यात्मिक सुझाव:** Mars worship और Lord Hanuman की उपासना करें। Humanitarian service spiritual growth के लिए करें। Red coral beneficial है। Tuesday को व्रत रखें।"
    };
    return spiritualAdviceMap[dominantNumber] || spiritualAdviceMap[7];
  };

  const getDailyAdvice = (nameNum?: number, mobileNum?: number, lifePathNum?: number) => {
    const dominantNumber = getDominantNumber(nameNum, mobileNum, lifePathNum);
    const dailyAdviceMap: Record<number, string> = {
      1: "🌅 **दैनिक सुझाव:** Morning में early उठें और leadership activities करें। Red color wear करें luck के लिए। Decision making morning में करें। Confidence building exercises daily करें।",
      2: "🌸 **दैनिक सुझाव:** Peaceful morning routine maintain करें। White या light colors wear करें। Family time daily dedicate करें। Meditation और gratitude practice करें।",
      3: "🎨 **दैनिक सुझाव:** Creative activities daily करें। Yellow या bright colors wear करें। Social interactions encourage करें। Positive communication practice करें।",
      4: "📅 **दैनिक सुझाव:** Structured daily routine follow करें। Green या earthy colors prefer करें। Planning और organizing daily करें। Patience practice करें।",
      5: "🌟 **दैनिक सुझाव:** Variety और new experiences daily include करें। Multi-colored या bright clothes wear करें। Communication skills daily practice करें। Adventure spirit maintain करें।",
      6: "🏠 **दैनिक सुझाव:** Family care daily priority बनाएं। Pink या pastel colors wear करें। Home environment peaceful रखें। Service activities daily include करें।",
      7: "📖 **दैनिक सुझाव:** Daily reading और learning करें। Purple या violet colors wear करें। Quiet time daily रखें। Spiritual practices daily करें।",
      8: "💼 **दैनिक सुझाव:** Business activities daily focus करें। Black या dark colors professional look के लिए wear करें। Goal-oriented tasks daily complete करें।",
      9: "🤲 **दैनिक सुझाव:** Daily कोई न कोई service act करें। Orange या saffron colors wear करें। Universal love practice करें। Compassionate activities daily करें।"
    };
    return dailyAdviceMap[dominantNumber] || dailyAdviceMap[3];
  };

  const getLuckyAdvice = (nameNum?: number, mobileNum?: number, lifePathNum?: number) => {
    const dominantNumber = getDominantNumber(nameNum, mobileNum, lifePathNum);
    const luckyAdviceMap: Record<number, string> = {
      1: "🍀 **भाग्य सुझाव:** Lucky numbers: 1, 10, 19, 28। Sunday आपका lucky day है। Leadership roles accept करें। Risk लेने से डरें नहीं। Initiative लेने पर success मिलती है।",
      2: "🤞 **भाग्य सुझाव:** Lucky numbers: 2, 11, 20, 29। Monday आपका lucky day है। Partnership opportunities grab करें। Cooperation से luck बढ़ती है। Diplomatic approach use करें।",
      3: "✨ **भाग्य सुझाव:** Lucky numbers: 3, 12, 21, 30। Thursday आपका lucky day है। Creative projects start करें। Social connections से opportunities मिलती हैं। Optimism maintain करें।",
      4: "🔢 **भाग्य सुझाव:** Lucky numbers: 4, 13, 22, 31। Saturday और Sunday lucky हैं। Systematic approach से success मिलती है। Patience रखें, results देर से मिलते हैं।",
      5: "🎯 **भाग्य सुझाव:** Lucky numbers: 5, 14, 23। Wednesday आपका lucky day है। New ventures में luck है। Travel करने से opportunities मिलती हैं। Change embrace करें।",
      6: "💫 **भाग्य सुझाव:** Lucky numbers: 6, 15, 24। Friday आपका lucky day है। Family business में luck है। Artistic ventures successful होते हैं। Love और care से luck बढ़ती है।",
      7: "🔮 **भाग्य सुझाव:** Lucky numbers: 7, 16, 25। Monday आपका lucky day है। Research और analysis में luck है। Spiritual activities से fortune मिलता है। Intuition follow करें।",
      8: "💎 **भाग्य सुझाव:** Lucky numbers: 8, 17, 26। Saturday आपका lucky day है। Business ventures में major luck है। Material success natural है। Hard work से fortune बढ़ता है।",
      9: "🌈 **भाग्य सुझाव:** Lucky numbers: 9, 18, 27। Tuesday आपका lucky day है। Service activities से luck बढ़ती है। Global opportunities आती हैं। Helping others luck लाता है।"
    };
    return luckyAdviceMap[dominantNumber] || luckyAdviceMap[1];
  };

  const getChallengeAdvice = (nameNum?: number, mobileNum?: number, lifePathNum?: number) => {
    const dominantNumber = getDominantNumber(nameNum, mobileNum, lifePathNum);
    const challengeAdviceMap: Record<number, string> = {
      1: "⚠️ **चुनौती सुझाव:** Ego और arrogance से बचें। Others की opinions को भी value दें। Impatience control करें। Dictatorship tendency avoid करें। Team player बनना सीखें।",
      2: "⚖️ **चुनौती सुझाव:** Over-sensitivity को control करें। Indecisiveness से बचें। Self-confidence build करें। Others को please करने की habit छोड़ें। Assertiveness develop करें।",
      3: "🎭 **चुनौती सुझाव:** Scattered energy focus करें। Superficiality से बचें। Commitment issues को address करें। Over-talking control करें। Serious matters को भी importance दें।",
      4: "🔒 **चुनौती सुझาव:** Rigid thinking को flexible बनाएं। Change resistance छोड़ें। Perfectionism को balance करें। Boring routine break करें। Creative side develop करें।",
      5: "🌪️ **चुनौती सुझाव:** Restlessness control करें। Commitment phobia overcome करें। Discipline develop करें। Reckless behavior avoid करें। Stability भी important है।",
      6: "🔗 **चुनौती सुझाव:** Over-protective nature control करें। Martyr complex avoid करें। Personal boundaries set करें। Self-sacrifice की limit रखें। Independence को भी value दें।",
      7: "🌫️ **चुनौती सुझाव:** Isolation tendency balance करें। Over-analysis paralysis से बचें। Practical world से connection रखें। Pessimism को positivity से replace करें। Social skills develop करें।",
      8: "⚡ **चुनौती सुझाव:** Materialism को spirituality से balance करें। Power hunger control करें। Work-life balance maintain करें। Others की emotions को भी consider करें। Greed avoid करें।",
      9: "🌊 **चुनौती सुझाव:** Emotional overwhelm control करें। Personal needs को भी priority दें। Practical approach develop करें। Idealism को reality से balance करें। Self-care important है।"
    };
    return challengeAdviceMap[dominantNumber] || challengeAdviceMap[5];
  };

  const getDominantNumber = (nameNum?: number, mobileNum?: number, lifePathNum?: number): number => {
    const numbers = [nameNum, mobileNum, lifePathNum].filter(n => n) as number[];
    if (numbers.length === 0) return 1;
    
    // Find most frequent number
    const frequency: Record<number, number> = {};
    numbers.forEach(num => {
      frequency[num] = (frequency[num] || 0) + 1;
    });
    
    const mostFrequent = Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)[0];
    
    return parseInt(mostFrequent[0]);
  };

  const numberMeanings: Record<number, string> = {
    1: '🌟 नेतृत्व, स्वतंत्रता, नवाचार - आप एक प्राकृतिक नेता हैं और नई शुरुआत करना पसंद करते हैं',
    2: '🤝 सहयोग, संतुलन, कूटनीति - आप शांति और सामंजस्य लाते हैं, टीमवर्क में excellent हैं',
    3: '🎨 रचनात्मकता, संचार, खुशी - आप कलात्मक और अभिव्यंजक हैं, लोगों को inspire करते हैं',
    4: '🏗️ स्थिरता, कड़ी मेहनत, व्यावहारिकता - आप विश्वसनीय और मेहनती हैं, strong foundation बनाते हैं',
    5: '✈️ स्वतंत्रता, साहसिक कार्य, परिवर्तन - आप यात्रा और नए अनुभव पसंद करते हैं, change से डरते नहीं',
    6: '❤️ प्रेम, देखभाल, जिम्मेदारी - आप पारिवारिक और सामुदायिक हैं, दूसरों की care करते हैं',
    7: '🧘 आध्यात्मिकता, बुद्धि, अनुसंधान - आप गहरे विचारक और आध्यात्मिक हैं, mystery को solve करना पसंद करते हैं',
    8: '💼 व्यवसाय, शक्ति, भौतिक सफलता - आप धन और सफलता के लिए बने हैं, business minded हैं',
    9: '🌍 मानवतावाद, करुणा, सेवा - आप दूसरों की सेवा के लिए बने हैं, समाज की भलाई चाहते हैं'
  };

  const birthNumberMeanings = {
    lifePath: {
      1: '🌟 जीवन पथ 1: आप एक प्राकृतिक नेता हैं। आपका जीवन नई शुरुआत, innovation और independence के बारे में है।',
      2: '🤝 जीवन पथ 2: आप cooperation और partnership के लिए बने हैं। आपका जीवन relationships और harmony के बारे में है।',
      3: '🎨 जीवन पथ 3: आप creativity और communication के लिए बने हैं। आपका जीवन art और expression के बारे में है।',
      4: '🏗️ जीवन पथ 4: आप hard work और stability के लिए बने हैं। आपका जीवन strong foundations बनाने के बारे में है।',
      5: '✈️ जीवन पथ 5: आप freedom और adventure के लिए बने हैं। आपका जीवन variety और experiences के बारे में है।',
      6: '❤️ जीवन पथ 6: आप service और nurturing के लिए बने हैं। आपका जीवन family और community के बारे में है।',
      7: '🧘 जीवन पथ 7: आप wisdom और spirituality के लिए बने हैं। आपका जीवन inner growth के बारे में है।',
      8: '💼 जीवन पथ 8: आप material success के लिए बने हैं। आपका जीवन business और wealth के बारे में है।',
      9: '🌍 जीवन पथ 9: आप humanitarian service के लिए बने हैं। आपका जीवन helping others के बारे में है।'
    }
  };

  const reduceToSingleDigit = (num: number): number => {
    while (num > 9) {
      num = num.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    return num;
  };

  const calculateNameNumber = (name: string): NameResult => {
    const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '');
    let total = 0;
    const breakdown: string[] = [];
    
    for (const char of cleanName) {
      const value = letterToNumber[char] || 0;
      total += value;
      breakdown.push(`${char}=${value}`);
    }
    
    return {
      total,
      reduced: reduceToSingleDigit(total),
      breakdown: breakdown.join(' + ')
    };
  };

  const calculateMobileNumber = (mobile: string): MobileResult => {
    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    const modifiedDigits: number[] = [];
    let lastDigit: number | null = null;
    
    // Convert 0 to previous digit
    for (let i = 0; i < cleanMobile.length; i++) {
      let digit = parseInt(cleanMobile[i]);
      
      if (digit === 0 && lastDigit !== null) {
        digit = lastDigit; // Replace 0 with previous digit
      }
      
      modifiedDigits.push(digit);
      lastDigit = digit;
    }
    
    const total = modifiedDigits.reduce((sum, digit) => sum + digit, 0);
    
    return {
      total,
      reduced: reduceToSingleDigit(total),
      breakdown: modifiedDigits.join(' + '),
      original: cleanMobile,
      modified: modifiedDigits.join(''),
      modifiedDigits
    };
  };

  const calculateDateOfBirth = (dob: string): DateResult => {
    const date = new Date(dob);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    // Calculate Life Path Number (complete date)
    const allDigits = (day.toString() + month.toString() + year.toString()).split('').map(d => parseInt(d));
    const lifePathTotal = allDigits.reduce((sum, digit) => sum + digit, 0);
    const lifePathNumber = reduceToSingleDigit(lifePathTotal);
    
    // Calculate Birth Day Number (only day)
    const birthDayNumber = reduceToSingleDigit(day);
    
    // Calculate Destiny Number (day + month)
    const destinyTotal = day + month;
    const destinyNumber = reduceToSingleDigit(destinyTotal);
    
    return {
      day,
      month,
      year,
      lifePathTotal,
      lifePathNumber,
      birthDayNumber,
      destinyNumber,
      breakdown: `${day} + ${month} + ${year} = ${allDigits.join(' + ')} = ${lifePathTotal} → ${lifePathNumber}`
    };
  };

  const getPositionAnalysis = (digits: number[]): Record<number, PositionAnalysis> => {
    if (digits.length < 10) return {};
    
    const analysis: Record<number, PositionAnalysis> = {};
    const positions = [7, 8, 9, 10]; // Last 4 positions
    
    positions.forEach(pos => {
      const digitIndex = pos - 1; // Convert to 0-based index
      const digit = digits[digitIndex];
      if (positionMeanings[pos] && positionMeanings[pos].meanings[digit]) {
        analysis[pos] = {
          digit: digit,
          meaning: positionMeanings[pos].meanings[digit],
          title: positionMeanings[pos].title
        };
      }
    });
    
    return analysis;
  };

  const getCompatibilityAnalysis = (nameNum?: number, mobileNum?: number, lifePathNum?: number) => {
    if (!nameNum || !mobileNum || !lifePathNum) return null;

    const compatibilityMatrix: Record<string, string> = {
      '1-1': '🔥 EXCELLENT! दोनों leadership numbers हैं। आप में strong willpower और determination है।',
      '1-2': '⚖️ BALANCED! Leadership और cooperation का perfect mix। आप diplomatic leader हैं।',
      '1-3': '✨ GREAT! Creativity के साथ leadership। आप inspiring और motivational हैं।',
      '2-2': '🕊️ HARMONIOUS! Pure cooperation energy। आप perfect team player और mediator हैं।',
      '3-3': '🎪 SUPER CREATIVE! Double creativity power। आप entertainment industry में star बन सकते हैं।'
    };

    const key1 = `${nameNum}-${mobileNum}`;
    const key2 = `${mobileNum}-${nameNum}`;
    
    return compatibilityMatrix[key1] || compatibilityMatrix[key2] || 
           `🔄 NEUTRAL COMBINATION! ${nameNum} और ${mobileNum} एक balanced energy create करते हैं।`;
  };

  const calculateNumerology = () => {
    if (!name && !mobile && !dob) {
      alert("कृपया नाम, मोबाइल नंबर या जन्म तिथि डालें");
      return;
    }

    let newNameResult: NameResult | null = null;
    let newMobileResult: MobileResult | null = null;
    let newDobResult: DateResult | null = null;
    let newPositionAnalysis: Record<number, PositionAnalysis> | null = null;

    if (name) {
      newNameResult = calculateNameNumber(name);
      setNameResult(newNameResult);
    }

    if (mobile) {
      newMobileResult = calculateMobileNumber(mobile);
      setMobileResult(newMobileResult);
      
      if (newMobileResult.modifiedDigits.length >= 10) {
        newPositionAnalysis = getPositionAnalysis(newMobileResult.modifiedDigits);
        setPositionAnalysis(newPositionAnalysis);
      }
    }

    if (dob) {
      newDobResult = calculateDateOfBirth(dob);
      setDobResult(newDobResult);
    }

    setShowResults(true);
  };

  const loadExample = () => {
    const examples = ['राम कुमार', 'सीता देवी', 'अमित शर्मा', 'प्रिया गुप्ता'];
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    setName(randomExample);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight py-2">
              🔢 अंक ज्योतिष कैलकुलेटर
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              नाम और मोबाइल नंबर का संपूर्ण अंकीय विश्लेषण करें और अपने व्यक्तित्व की गहराइयों को समझें
            </p>
          </div>

          {/* Input Card */}
          <Card className="mb-8 shadow-lg border-0 bg-gradient-to-br from-card via-card to-card/50">
            <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
              <CardTitle className="text-2xl">अपनी जानकारी दर्ज करें</CardTitle>
              <CardDescription className="text-lg">
                संपूर्ण अंकीय विश्लेषण के लिए अपना विवरण भरें
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-lg font-semibold flex items-center gap-2">
                    👤 नाम दर्ज करें:
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="अपना नाम हिंदी या अंग्रेजी में लिखें"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 text-lg border-2 focus:border-primary transition-colors"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="mobile" className="text-lg font-semibold flex items-center gap-2">
                    📱 मोबाइल नंबर:
                  </Label>
                  <Input
                    id="mobile"
                    type="text"
                    placeholder="1234567890"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    maxLength={10}
                    className="h-12 text-lg border-2 focus:border-primary transition-colors"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="dob" className="text-lg font-semibold flex items-center gap-2">
                    🎂 जन्म तिथि:
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="h-12 text-lg border-2 focus:border-primary transition-colors"
                  />
                </div>
              </div>
              
              <Button 
                onClick={calculateNumerology} 
                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all shadow-lg hover:shadow-xl"
                size="lg"
              >
                🧮 संपूर्ण गणना करें
              </Button>
            </CardContent>
          </Card>

          {showResults && (
            <div className="space-y-8">
              {/* Compatibility Analysis */}
              {nameResult && mobileResult && dobResult && (
                <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
                  <CardHeader className="text-center bg-gradient-to-r from-primary/20 to-secondary/20 rounded-t-lg">
                    <CardTitle className="text-2xl flex items-center justify-center gap-3">
                      🔮 संपूर्ण व्यक्तित्व विश्लेषण और संगतता
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border">
                        <h3 className="font-bold text-xl mb-6 text-center">🎯 आपकी संख्याओं का संपूर्ण विश्लेषण</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          <div className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-200/20">
                            <p className="font-semibold text-blue-700 dark:text-blue-300 mb-2">नाम अंक</p>
                            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{nameResult.reduced}</p>
                          </div>
                          <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-200/20">
                            <p className="font-semibold text-green-700 dark:text-green-300 mb-2">मोबाइल अंक</p>
                            <p className="text-4xl font-bold text-green-600 dark:text-green-400">{mobileResult.reduced}</p>
                          </div>
                          <div className="text-center p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-200/20">
                            <p className="font-semibold text-purple-700 dark:text-purple-300 mb-2">जीवन पथ अंक</p>
                            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{dobResult.lifePathNumber}</p>
                          </div>
                        </div>
                        <div className="p-6 bg-card/60 rounded-xl border">
                          <p className="font-medium text-lg">
                            📱 नाम और मोबाइल की संगतता: {getCompatibilityAnalysis(nameResult.reduced, mobileResult.reduced, dobResult.lifePathNumber)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Name Result */}
                {nameResult && (
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                    <CardHeader className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-t-lg">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        👤 नाम का अंकीय विश्लेषण
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="text-center py-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border">
                          <p className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">{nameResult.reduced}</p>
                        </div>
                        <div className="p-4 bg-card/60 rounded-lg border">
                          <p className="leading-relaxed">{numberMeanings[nameResult.reduced]}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Date of Birth Result */}
                {dobResult && (
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <CardHeader className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-t-lg">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        🎂 जन्म तिथि का अंकीय विश्लेषण
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="text-center py-8 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg border">
                          <p className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">{dobResult.lifePathNumber}</p>
                        </div>
                        <div className="p-4 bg-card/60 rounded-lg border">
                          <p className="leading-relaxed">{birthNumberMeanings.lifePath[dobResult.lifePathNumber as keyof typeof birthNumberMeanings.lifePath]}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Mobile Result */}
              {mobileResult && (
                <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
                  <CardHeader className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      📱 मोबाइल नंबर का संपूर्ण अंकीय विश्लेषण
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="text-center py-8 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border">
                        <p className="text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">{mobileResult.reduced}</p>
                      </div>
                      <div className="p-4 bg-card/60 rounded-lg border">
                        <p className="leading-relaxed">{numberMeanings[mobileResult.reduced]}</p>
                      </div>

                      {/* Position Analysis */}
                      {positionAnalysis && Object.keys(positionAnalysis).length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-bold text-xl flex items-center gap-2">📍 स्थिति-वार विश्लेषण</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(positionAnalysis).map(([position, analysis]) => (
                              <div key={position} className="p-4 bg-card/80 backdrop-blur-sm rounded-lg border">
                                <h4 className="font-semibold text-orange-700 dark:text-orange-300 mb-3">{analysis.title}</h4>
                                <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border">
                                  <p className="font-bold text-center text-2xl text-orange-600 dark:text-orange-400 mb-3">
                                    अंक: {analysis.digit}
                                  </p>
                                  <p className="text-sm leading-relaxed">{analysis.meaning}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comprehensive Advice Section */}
              {showResults && (nameResult || mobileResult || dobResult) && (
                <Card className="border-0 shadow-xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20">
                  <CardHeader className="bg-gradient-to-r from-violet-500/20 to-indigo-500/20 rounded-t-lg">
                    <CardTitle className="text-2xl flex items-center justify-center gap-3">
                      🎯 व्यक्तिगत सुझाव और मार्गदर्शन
                    </CardTitle>
                    <CardDescription className="text-center text-lg">
                      आपके अंकों के आधार पर विशेष सलाह और जीवन में सफलता के लिए दिशा-निर्देश
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    {(() => {
                      const advice = getPersonalizedAdvice(
                        nameResult?.reduced,
                        mobileResult?.reduced,
                        dobResult?.lifePathNumber
                      );
                      
                      if (!advice) return null;
                      
                      return (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Career Advice */}
                            <div className="p-6 bg-card/80 backdrop-blur-sm rounded-xl border border-blue-200/20">
                              <h3 className="font-bold text-lg text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
                                🚀 करियर और व्यवसाय
                              </h3>
                              <p className="leading-relaxed text-sm">{advice.career}</p>
                            </div>
                            
                            {/* Relationship Advice */}
                            <div className="p-6 bg-card/80 backdrop-blur-sm rounded-xl border border-pink-200/20">
                              <h3 className="font-bold text-lg text-pink-700 dark:text-pink-300 mb-4 flex items-center gap-2">
                                💕 रिश्ते और प्रेम
                              </h3>
                              <p className="leading-relaxed text-sm">{advice.relationships}</p>
                            </div>
                            
                            {/* Health Advice */}
                            <div className="p-6 bg-card/80 backdrop-blur-sm rounded-xl border border-green-200/20">
                              <h3 className="font-bold text-lg text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
                                🌿 स्वास्थ्य और कल्याण
                              </h3>
                              <p className="leading-relaxed text-sm">{advice.health}</p>
                            </div>
                            
                            {/* Wealth Advice */}
                            <div className="p-6 bg-card/80 backdrop-blur-sm rounded-xl border border-yellow-200/20">
                              <h3 className="font-bold text-lg text-yellow-700 dark:text-yellow-300 mb-4 flex items-center gap-2">
                                💰 धन और निवेश
                              </h3>
                              <p className="leading-relaxed text-sm">{advice.wealth}</p>
                            </div>
                            
                            {/* Spiritual Advice */}
                            <div className="p-6 bg-card/80 backdrop-blur-sm rounded-xl border border-purple-200/20">
                              <h3 className="font-bold text-lg text-purple-700 dark:text-purple-300 mb-4 flex items-center gap-2">
                                🕉️ आध्यात्मिक विकास
                              </h3>
                              <p className="leading-relaxed text-sm">{advice.spiritual}</p>
                            </div>
                            
                            {/* Daily Advice */}
                            <div className="p-6 bg-card/80 backdrop-blur-sm rounded-xl border border-orange-200/20">
                              <h3 className="font-bold text-lg text-orange-700 dark:text-orange-300 mb-4 flex items-center gap-2">
                                ☀️ दैनिक जीवन
                              </h3>
                              <p className="leading-relaxed text-sm">{advice.daily}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            {/* Lucky Advice */}
                            <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-200/20">
                              <h3 className="font-bold text-lg text-emerald-700 dark:text-emerald-300 mb-4 flex items-center gap-2">
                                🍀 भाग्य और समय
                              </h3>
                              <p className="leading-relaxed text-sm">{advice.lucky}</p>
                            </div>
                            
                            {/* Challenge Advice */}
                            <div className="p-6 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-xl border border-red-200/20">
                              <h3 className="font-bold text-lg text-red-700 dark:text-red-300 mb-4 flex items-center gap-2">
                                ⚠️ चुनौतियां और सावधानी
                              </h3>
                              <p className="leading-relaxed text-sm">{advice.challenges}</p>
                            </div>
                          </div>
                          
                          {/* Special Note */}
                          <div className="mt-8 p-6 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 rounded-xl border-2 border-violet-200/30">
                            <h3 className="font-bold text-xl text-center text-violet-700 dark:text-violet-300 mb-4">
                              ✨ विशेष संदेश ✨
                            </h3>
                            <p className="text-center leading-relaxed text-lg">
                              अंक ज्योतिष एक मार्गदर्शन का साधन है। आपकी मेहनत, सकारात्मक सोच और निरंतर प्रयास 
                              आपकी किस्मत को और भी बेहतर बना सकते हैं। इन सुझावों को अपने जीवन में शामिल करें 
                              और देखें कि कैसे आपका जीवन खुशियों से भर जाता है! 🌟
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LuckyMobileCalculator;