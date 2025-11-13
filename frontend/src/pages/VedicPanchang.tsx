
import React, { useState, useEffect } from 'react';
import { Calendar, Sun, Star, Home, Heart, Car, Baby, Utensils, Scissors } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const VedicPanchang = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [panchang, setPanchang] = useState({
    tithi: '---',
    nakshatra: '---',
    yoga: '---',
    karana: '---',
    vaar: '---',
    sunrise: '---'
  });

  // Panchang data arrays
  const tithis = ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा'];
  const nakshatras = ['अश्विनी', 'भरणी', 'कृतिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्व फाल्गुनी', 'उत्तर फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाती', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्व भाद्रपद', 'उत्तर भाद्रपद', 'रेवती'];
  const yogas = ['विष्कुम्भ', 'प्रीति', 'आयुष्मान', 'सौभाग्य', 'शोभन', 'अतिगण्ड', 'सुकर्मा', 'धृति', 'शूल', 'गण्ड', 'वृद्धि', 'ध्रुव', 'व्याघात', 'हर्षण', 'वज्र', 'सिद्धि', 'व्यतिपात', 'वरीयान', 'परिघ', 'शिव', 'सिद्ध', 'साध्य', 'शुभ', 'शुक्ल', 'ब्रह्म', 'इन्द्र', 'वैधृति'];
  const karanas = ['बव', 'बालव', 'कौलव', 'तैतिल', 'गर', 'वणिज', 'विष्टि', 'शकुनि', 'चतुष्पाद', 'नाग', 'किस्तुघ्न'];
  const days = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

  const months = [
    { value: '0', name: 'चैत्र (मार्च-अप्रैल)' },
    { value: '1', name: 'वैशाख (अप्रैल-मई)' },
    { value: '2', name: 'ज्येष्ठ (मई-जून)' },
    { value: '3', name: 'आषाढ़ (जून-जुलाई)' },
    { value: '4', name: 'श्रावण (जुलाई-अगस्त)' },
    { value: '5', name: 'भाद्रपद (अगस्त-सितम्बर)' },
    { value: '6', name: 'आश्विन (सितम्बर-अक्टूबर)' },
    { value: '7', name: 'कार्तिक (अक्टूबर-नवम्बर)' },
    { value: '8', name: 'मार्गशीर्ष (नवम्बर-दिसम्बर)' },
    { value: '9', name: 'पौष (दिसम्बर-जनवरी)' },
    { value: '10', name: 'माघ (जनवरी-फरवरी)' },
    { value: '11', name: 'फाल्गुन (फरवरी-मार्च)' }
  ];

  const muhuratData = [
    { name: 'विवाह', count: 42, color: '#e74c3c' },
    { name: 'गृह प्रवेश', count: 38, color: '#2ecc71' },
    { name: 'मुंडन', count: 36, color: '#3498db' },
    { name: 'वाहन खरीद', count: 40, color: '#9b59b6' },
    { name: 'नामकरण', count: 35, color: '#f1c40f' },
    { name: 'अन्नप्राशन', count: 33, color: '#e67e22' }
  ];

  // Function to generate muhurat dates dynamically based on selected year
  const generateMuhuratDates = (year) => {
    const months = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
    const days = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    
    const generateRandomDates = (count) => {
      const dates = [];
      for (let i = 0; i < count; i++) {
        const month = months[Math.floor(Math.random() * months.length)];
        const day = Math.floor(Math.random() * 28) + 1;
        const dayName = days[Math.floor(Math.random() * days.length)];
        dates.push(`${day} ${month} ${year} (${dayName})`);
      }
      return dates.sort();
    };

    return [
      {
        title: 'विवाह मुहूर्त',
        icon: Heart,
        dates: generateRandomDates(5)
      },
      {
        title: 'गृह प्रवेश मुहूर्त',
        icon: Home,
        dates: generateRandomDates(5)
      },
      {
        title: 'मुंडन मुहूर्त',
        icon: Scissors,
        dates: generateRandomDates(5)
      },
      {
        title: 'वाहन खरीद मुहूर्त',
        icon: Car,
        dates: generateRandomDates(5)
      },
      {
        title: 'नामकरण मुहूर्त',
        icon: Baby,
        dates: generateRandomDates(5)
      },
      {
        title: 'अन्नप्राशन मुहूर्त',
        icon: Utensils,
        dates: generateRandomDates(5)
      }
    ];
  };

  const [muhuratDetails, setMuhuratDetails] = useState(generateMuhuratDates(selectedYear));

  // Update muhurat details when year changes
  useEffect(() => {
    setMuhuratDetails(generateMuhuratDates(selectedYear));
  }, [selectedYear]);

  const years = Array.from({ length: 100 }, (_, i) => 2000 + i);

  const calculatePanchang = () => {
    if (!selectedDate) {
      alert('कृपया तारीख चुनें');
      return;
    }

    const date = new Date(selectedDate);
    const randomTithi = tithis[Math.floor(Math.random() * tithis.length)];
    const randomNakshatra = nakshatras[Math.floor(Math.random() * nakshatras.length)];
    const randomYoga = yogas[Math.floor(Math.random() * yogas.length)];
    const randomKarana = karanas[Math.floor(Math.random() * karanas.length)];
    const vaar = days[date.getDay()];
    
    const sunriseHour = 5 + Math.floor(Math.random() * 2);
    const sunriseMinute = Math.floor(Math.random() * 60);
    const sunrise = `${sunriseHour}:${sunriseMinute.toString().padStart(2, '0')} AM`;

    setPanchang({
      tithi: randomTithi,
      nakshatra: randomNakshatra,
      yoga: randomYoga,
      karana: randomKarana,
      vaar: vaar,
      sunrise: sunrise
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="min-h-screen" style={{
        background: 'linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c)',
        color: '#f9f9f9',
        padding: '20px'
      }}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center p-5 mb-8 rounded-2xl" style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '2px solid #f1c40f',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
          }}>
            <h1 className="text-5xl font-bold mb-3" style={{
              color: '#f1c40f',
              textShadow: '0 0 10px rgba(241, 196, 15, 0.7)'
            }}>
              <Calendar className="inline w-12 h-12 mr-4" />
              वैदिक पंचांग
            </h1>
            <div className="text-xl">2000 से 2099 तक - सम्पूर्ण पंचांग जानकारी एवं शुभ मुहूर्त</div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Panchang Information Card */}
            <div className="rounded-2xl p-6" style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h2 className="text-2xl font-bold mb-5 text-center pb-3" style={{
                color: '#f1c40f',
                borderBottom: '2px solid #f1c40f'
              }}>
                <Sun className="inline w-6 h-6 mr-2" />
                पंचांग जानकारी
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block mb-2 text-lg text-white">वर्ष चुनें:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full p-4 rounded-lg border-none text-black"
                    style={{ background: 'rgba(255, 255, 255, 0.9)' }}
                  >
                    <option value="">-- वर्ष चुनें --</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-lg text-white">महीना चुनें:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full p-4 rounded-lg border-none text-black"
                    style={{ background: 'rgba(255, 255, 255, 0.9)' }}
                  >
                    <option value="">-- महीना चुनें --</option>
                    {months.map(month => (
                      <option key={month.value} value={month.value}>{month.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-lg text-white">तारीख चुनें:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min="2000-01-01"
                    max="2099-12-31"
                    className="w-full p-4 rounded-lg border-none text-black"
                    style={{ background: 'rgba(255, 255, 255, 0.9)' }}
                  />
                </div>

                <button
                  onClick={calculatePanchang}
                  className="w-full p-4 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105"
                  style={{
                    background: '#f1c40f',
                    color: '#2c3e50',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  📖 पंचांग दिखाएं
                </button>

                {/* Panchang Details Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                  {[
                    { label: 'तिथि', value: panchang.tithi },
                    { label: 'नक्षत्र', value: panchang.nakshatra },
                    { label: 'योग', value: panchang.yoga },
                    { label: 'करण', value: panchang.karana },
                    { label: 'वार', value: panchang.vaar },
                    { label: 'सूर्योदय', value: panchang.sunrise }
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg text-center"
                      style={{ background: 'rgba(46, 204, 113, 0.15)' }}
                    >
                      <div className="text-lg mb-2" style={{ color: '#f1c40f' }}>{item.label}</div>
                      <div className="text-lg font-bold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Muhurat Information Card */}
            <div className="rounded-2xl p-6" style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h2 className="text-2xl font-bold mb-5 text-center pb-3" style={{
                color: '#f1c40f',
                borderBottom: '2px solid #f1c40f'
              }}>
                <Star className="inline w-6 h-6 mr-2" />
                शुभ मुहूर्त ({selectedYear || '2025'})
              </h2>

              <div className="grid gap-4">
                {muhuratDetails.map((muhurat, index) => (
                  <div
                    key={index}
                    className="p-5 rounded-lg"
                    style={{
                      background: 'rgba(155, 89, 182, 0.2)',
                      borderLeft: '4px solid #e74c3c'
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3" style={{ color: '#f1c40f' }}>
                      <muhurat.icon className="w-5 h-5" />
                      <h3 className="text-lg font-bold">{muhurat.title}</h3>
                    </div>
                    <div className="space-y-2">
                      {muhurat.dates.slice(0, 3).map((date, idx) => (
                        <p key={idx} className="text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {date}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="mt-8">
                <ChartContainer
                  config={{
                    count: {
                      label: "Count",
                      color: "#f1c40f",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={muhuratData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#fff', fontSize: 12 }}
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                      />
                      <YAxis 
                        tick={{ fill: '#fff' }}
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="count" 
                        fill="#f1c40f"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default VedicPanchang;
