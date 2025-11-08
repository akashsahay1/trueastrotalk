import React from 'react';
import { Gem, Star, Wand2, ClipboardCheck, Fingerprint, AlertTriangle, Crown } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AscendantGemstones = () => {
  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fadeIn');
        }
      });
    }, { threshold: 0.1 });

    const sections = document.querySelectorAll('section');
    const cards = document.querySelectorAll('.gem-card');
    const benefits = document.querySelectorAll('.benefit-card');

    sections.forEach(section => observer.observe(section));
    cards.forEach(card => observer.observe(card));
    benefits.forEach(benefit => observer.observe(benefit));

    return () => observer.disconnect();
  }, []);

  const gemstoneData = [
    {
      sign: 'Aries Ascendant',
      planet: 'Mars',
      primary: 'Red Coral',
      alternative: 'Carnelian',
      benefits: ['Boosts courage, leadership, and physical vitality', 'Protects against accidents and injuries', 'Enhances initiative and drive']
    },
    {
      sign: 'Taurus Ascendant',
      planet: 'Venus',
      primary: 'Diamond',
      alternative: 'White Sapphire',
      benefits: ['Attracts wealth and material comforts', 'Enhances artistic talents and relationships', 'Promotes stability and security']
    },
    {
      sign: 'Gemini Ascendant',
      planet: 'Mercury',
      primary: 'Emerald',
      alternative: 'Peridot',
      benefits: ['Improves communication and intellectual abilities', 'Enhances learning and business skills', 'Reduces anxiety and nervousness']
    },
    {
      sign: 'Cancer Ascendant',
      planet: 'Moon',
      primary: 'Pearl',
      alternative: 'Moonstone',
      benefits: ['Stabilizes emotions and enhances intuition', 'Improves relationships with family', 'Boosts maternal instincts and nurturing abilities']
    },
    {
      sign: 'Leo Ascendant',
      planet: 'Sun',
      primary: 'Ruby',
      alternative: 'Red Garnet',
      benefits: ['Enhances leadership and authority', 'Boosts confidence and vitality', 'Attracts recognition and success']
    },
    {
      sign: 'Virgo Ascendant',
      planet: 'Mercury',
      primary: 'Emerald',
      alternative: 'Peridot',
      benefits: ['Improves analytical and organizational skills', 'Enhances health and digestive system', 'Promotes attention to detail']
    },
    {
      sign: 'Libra Ascendant',
      planet: 'Venus',
      primary: 'Diamond',
      alternative: 'Opal',
      benefits: ['Enhances relationships and harmony', 'Improves artistic abilities and sense of beauty', 'Attracts partnership opportunities']
    },
    {
      sign: 'Scorpio Ascendant',
      planet: 'Mars',
      primary: 'Red Coral',
      alternative: 'Bloodstone',
      benefits: ['Boosts courage and resilience', 'Enhances transformation and regeneration', 'Protects against hidden enemies']
    },
    {
      sign: 'Sagittarius Ascendant',
      planet: 'Jupiter',
      primary: 'Yellow Sapphire',
      alternative: 'Citrine',
      benefits: ['Attracts wisdom and spiritual growth', 'Enhances luck and prosperity', 'Promotes higher education and travel']
    },
    {
      sign: 'Capricorn Ascendant',
      planet: 'Saturn',
      primary: 'Blue Sapphire',
      alternative: 'Amethyst',
      benefits: ['Enhances discipline and career success', 'Attracts authority and leadership positions', 'Reduces delays and obstacles']
    },
    {
      sign: 'Aquarius Ascendant',
      planet: 'Saturn',
      primary: 'Blue Sapphire',
      alternative: 'Lapis Lazuli',
      benefits: ['Enhances innovation and humanitarian efforts', 'Improves social connections and networking', 'Boosts intellectual pursuits']
    },
    {
      sign: 'Pisces Ascendant',
      planet: 'Jupiter',
      primary: 'Yellow Sapphire',
      alternative: 'Amber',
      benefits: ['Enhances intuition and spiritual connection', 'Promotes compassion and artistic expression', 'Reduces confusion and indecisiveness']
    }
  ];

  const planetaryData = [
    { planet: 'Sun', gemstone: 'Ruby', finger: 'Ring', metal: 'Gold', day: 'Sunday' },
    { planet: 'Moon', gemstone: 'Pearl', finger: 'Little', metal: 'Silver', day: 'Monday' },
    { planet: 'Mars', gemstone: 'Red Coral', finger: 'Ring', metal: 'Copper', day: 'Tuesday' },
    { planet: 'Mercury', gemstone: 'Emerald', finger: 'Little', metal: 'Gold', day: 'Wednesday' },
    { planet: 'Jupiter', gemstone: 'Yellow Sapphire', finger: 'Index', metal: 'Gold', day: 'Thursday' },
    { planet: 'Venus', gemstone: 'Diamond', finger: 'Middle', metal: 'Platinum', day: 'Friday' },
    { planet: 'Saturn', gemstone: 'Blue Sapphire', finger: 'Middle', metal: 'Iron', day: 'Saturday' },
    { planet: 'Rahu', gemstone: 'Hessonite', finger: 'Middle', metal: 'Silver', day: 'Saturday' },
    { planet: 'Ketu', gemstone: "Cat's Eye", finger: 'Ring', metal: 'Gold', day: 'Tuesday' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-gray-100 relative overflow-x-hidden">
      <Header />
      
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: `radial-gradient(white, rgba(255,255,255,.2) 1px, transparent 2px), radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 1px)`,
            backgroundSize: '50px 50px, 30px 30px',
            backgroundPosition: '0 0, 25px 25px'
          }}
        />
      </div>

      {/* Header Section */}
      <div className="relative z-10 text-center py-16 px-8 bg-gradient-to-r from-slate-900/80 via-blue-900/80 to-slate-900/80 border-b-4 border-yellow-400 mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-yellow-400 drop-shadow-lg">
          Ascendant Sign Gemstones
        </h1>
        <p className="text-xl text-blue-300 max-w-4xl mx-auto mb-4 font-medium">
          Unlock Your Cosmic Potential with Vedic Astrology
        </p>
        <p className="text-lg text-gray-300">
          Harness the Power of Gemstones Based on Your Ascendant Sign
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-16">
        {/* Understanding Section */}
        <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-blue-500/30 shadow-2xl">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center gap-4">
            <Gem className="w-8 h-8 text-blue-400" />
            Understanding Ascendant Gemstones
          </h2>
          
          <p className="text-lg mb-6 leading-relaxed">
            In Vedic astrology, your <span className="bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded font-medium">Ascendant sign</span> (or Lagna) represents the zodiac sign that was rising on the eastern horizon at the exact moment of your birth. This sign is considered the most important placement in your birth chart as it influences your personality, physical appearance, and life path.
          </p>

          <p className="text-lg mb-6">Each ascendant sign has specific gemstones associated with it that can:</p>
          <ul className="space-y-3 mb-8 pl-6">
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">✦</span>
              <span>Amplify positive planetary energies</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">✦</span>
              <span>Neutralize negative planetary influences</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">✦</span>
              <span>Enhance your natural strengths and talents</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">✦</span>
              <span>Protect against misfortune and health issues</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">✦</span>
              <span>Attract prosperity and success</span>
            </li>
          </ul>

          <h3 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-3">
            <Wand2 className="w-6 h-6" />
            How Gemstones Work
          </h3>
          <p className="text-lg mb-4">Gemstones work by resonating with specific planetary vibrations. When worn according to your ascendant sign, they:</p>
          <ul className="space-y-3 pl-6">
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">✦</span>
              <span>Harmonize your energy field with cosmic energies</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">✦</span>
              <span>Balance the elements within your body</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">✦</span>
              <span>Strengthen weak planets in your birth chart</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">✦</span>
              <span>Channel positive energy to overcome life's challenges</span>
            </li>
          </ul>
        </section>

        {/* Gemstones Grid */}
        <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-blue-500/30 shadow-2xl">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center gap-4">
            <Star className="w-8 h-8 text-blue-400" />
            Gemstones for Each Ascendant Sign
          </h2>
          <p className="text-lg mb-8">Select the gemstone that aligns with your ascendant sign to harness its unique benefits:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {gemstoneData.map((gem, index) => (
              <div 
                key={index}
                className="gem-card bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 text-center transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-xl hover:border-yellow-400 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-blue-400"></div>
                <div className="text-4xl text-yellow-400 mb-4">
                  <Gem className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-yellow-400 mb-3">{gem.sign}</h3>
                <p className="mb-2"><strong>Ruling Planet:</strong> {gem.planet}</p>
                <p className="mb-2"><strong>Primary Gemstone:</strong> {gem.primary}</p>
                <p className="mb-4"><strong>Alternative:</strong> {gem.alternative}</p>
                
                <div className="border-t border-yellow-400/30 pt-4 mt-4">
                  <h4 className="text-blue-400 font-semibold mb-2">Benefits:</h4>
                  {gem.benefits.map((benefit, i) => (
                    <p key={i} className="text-sm mb-2">{benefit}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Guidelines Section */}
        <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-blue-500/30 shadow-2xl">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center gap-4">
            <Star className="w-8 h-8 text-blue-400" />
            Choosing & Wearing Gemstones
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="benefit-card bg-blue-500/15 p-6 rounded-2xl border border-blue-500/30">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-3">
                <ClipboardCheck className="w-6 h-6" />
                Selection Guidelines
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Always consult with a qualified Vedic astrologer</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Gemstones should be natural, untreated, and eye-clean</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Weight should be at least 2 carats for optimal effect</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Choose the metal based on planetary associations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Gemstones should be properly energized before wearing</span>
                </li>
              </ul>
            </div>

            <div className="benefit-card bg-blue-500/15 p-6 rounded-2xl border border-blue-500/30">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-3">
                <Fingerprint className="w-6 h-6" />
                Wearing Guidelines
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Wear on the correct finger for maximum benefit</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Best worn during the planetary hour of the ruling planet</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Should be set in metals like gold, silver, or copper</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Regularly cleanse your gemstones energetically</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Remove during inauspicious periods like eclipses</span>
                </li>
              </ul>
            </div>

            <div className="benefit-card bg-blue-500/15 p-6 rounded-2xl border border-blue-500/30">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                Precautions
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Never wear gemstones without astrological consultation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Some gemstones require a trial period before permanent use</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Be aware of potential negative effects if incorrectly prescribed</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Gemstones should complement your birth chart, not contradict it</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">✦</span>
                  <span>Regularly check for cracks or damage to your gemstones</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Planetary Reference Table */}
        <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-blue-500/30 shadow-2xl">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center gap-4">
            <Star className="w-8 h-8 text-blue-400" />
            Planetary Gemstone Reference
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-black/20 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-blue-600">
                  <th className="text-white p-4 text-left font-semibold">Planet</th>
                  <th className="text-white p-4 text-left font-semibold">Gemstone</th>
                  <th className="text-white p-4 text-left font-semibold">Finger</th>
                  <th className="text-white p-4 text-left font-semibold">Metal</th>
                  <th className="text-white p-4 text-left font-semibold">Day to Wear</th>
                </tr>
              </thead>
              <tbody>
                {planetaryData.map((row, index) => (
                  <tr key={index} className="hover:bg-blue-500/10 border-b border-blue-500/20 last:border-b-0">
                    <td className="p-4">{row.planet}</td>
                    <td className="p-4">{row.gemstone}</td>
                    <td className="p-4">{row.finger}</td>
                    <td className="p-4">{row.metal}</td>
                    <td className="p-4">{row.day}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Epilogue */}
        <section className="text-center p-12 bg-gradient-to-r from-slate-900/80 via-blue-900/80 to-slate-900/80 border border-yellow-400 rounded-2xl">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6 flex items-center justify-center gap-4">
            <Crown className="w-8 h-8" />
            Cosmic Harmony Through Gemstones
          </h2>
          <p className="text-xl max-w-4xl mx-auto mb-6 leading-relaxed">
            Gemstones serve as powerful conduits between celestial energies and human experience. When properly selected based on your ascendant sign, they can create profound harmony between your inner world and the cosmic forces that shape your destiny.
          </p>
          <p className="text-xl italic text-blue-300 max-w-3xl mx-auto">
            "The right gemstone worn at the right time can transform obstacles into opportunities and challenges into triumphs."
          </p>
        </section>

        {/* Footer Text */}
        <div className="text-center mt-12 text-gray-400">
          <p className="text-lg mb-2">Vedic Astrology Gemstone Guide | Created with Cosmic Wisdom</p>
          <p>© 2023 Ascendant Gemstones | Always consult a qualified astrologer before wearing gemstones</p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AscendantGemstones;
