import React from "react";
import AstrologerCard from "./AstrologerCard";

const SlidingAstrologers = () => {
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const astrologers = [
    {
      name: "Pandit Anish Kumar",
      specialty: "Gemology Therapist",
      experience: "4 Years",
      rating: 4.9,
      price: 500,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Dr. Devyani Singh",
      specialty: "Numerology",
      experience: "10 Years", 
      rating: 4.8,
      price: 500,
      image: "https://images.unsplash.com/photo-1494790108755-2616b332c2bb?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Guru Narayan Gupta",
      specialty: "Face Reading",
      experience: "8 Years",
      rating: 4.9,
      price: 2000,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Astra Shastra Sharma",
      specialty: "Tarot Reading",
      experience: "7 Years",
      rating: 4.7,
      price: 1500,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Pandit Shubh Vartu",
      specialty: "Business Astrology",
      experience: "12 Years",
      rating: 4.9,
      price: 1600,
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Guru Ramesh Chandra",
      specialty: "Vedic Astrology",
      experience: "15 Years",
      rating: 4.9,
      price: 1800,
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Astro Priya Sharma",
      specialty: "Love & Relationship",
      experience: "6 Years",
      rating: 4.6,
      price: 1200,
      image: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Pandit Vikash Kumar",
      specialty: "Marriage Matching",
      experience: "9 Years",
      rating: 4.8,
      price: 1400,
      image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Dr. Anjali Verma",
      specialty: "Health Astrology",
      experience: "11 Years",
      rating: 4.7,
      price: 1600,
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Guru Mahesh Joshi",
      specialty: "Career Guidance",
      experience: "13 Years",
      rating: 4.9,
      price: 1700,
      image: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Astro Sunita Devi",
      specialty: "Vastu Consultant",
      experience: "8 Years",
      rating: 4.5,
      price: 1300,
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Pandit Rajesh Gupta",
      specialty: "Financial Astrology",
      experience: "14 Years",
      rating: 4.8,
      price: 1900,
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Dr. Kavita Sharma",
      specialty: "Palm Reading",
      experience: "7 Years",
      rating: 4.6,
      price: 1100,
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Guru Suresh Kumar",
      specialty: "Gemstone Therapy",
      experience: "16 Years",
      rating: 4.9,
      price: 2000,
      image: "https://images.unsplash.com/photo-1542190891-2093d38760f2?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Astro Meera Jain",
      specialty: "Horoscope Reading",
      experience: "5 Years",
      rating: 4.4,
      price: 900,
      image: "https://images.unsplash.com/photo-1580894894513-541e068a3e2b?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Pandit Arun Tripathi",
      specialty: "Spiritual Guidance",
      experience: "18 Years",
      rating: 5.0,
      price: 2200,
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Dr. Rekha Singh",
      specialty: "Child Astrology",
      experience: "9 Years",
      rating: 4.7,
      price: 1300,
      image: "https://images.unsplash.com/photo-1598966739654-5e9a252d8c32?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Guru Deepak Mishra",
      specialty: "Business Solutions",
      experience: "12 Years",
      rating: 4.8,
      price: 1800,
      image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Astro Pooja Agarwal",
      specialty: "Dream Analysis",
      experience: "6 Years",
      rating: 4.5,
      price: 1000,
      image: "https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Pandit Narendra Jha",
      specialty: "Muhurat Selection",
      experience: "20 Years",
      rating: 4.9,
      price: 2400,
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Dr. Swati Pandey",
      specialty: "Past Life Reading",
      experience: "8 Years",
      rating: 4.6,
      price: 1400,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Guru Ramakant Shukla",
      specialty: "Remedy Solutions",
      experience: "17 Years",
      rating: 4.9,
      price: 2100,
      image: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Astro Nisha Gupta",
      specialty: "Crystal Healing",
      experience: "4 Years",
      rating: 4.3,
      price: 800,
      image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Pandit Sanjay Yadav",
      specialty: "Pitra Dosh Solution",
      experience: "14 Years",
      rating: 4.8,
      price: 1900,
      image: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Dr. Ritu Chandra",
      specialty: "Women's Astrology",
      experience: "10 Years",
      rating: 4.7,
      price: 1500,
      image: "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=150&h=150&fit=crop&crop=face"
    }
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 5) % astrologers.length);
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, []);

  const getVisibleAstrologers = () => {
    const visible = [];
    for (let i = 0; i < 5; i++) {
      const index = (currentSlide + i) % astrologers.length;
      visible.push(astrologers[index]);
    }
    return visible;
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-purple-600 mb-4">Our Expert Astrologers</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connect with our verified and experienced astrologers for personalized guidance
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 transition-all duration-1000">
          {getVisibleAstrologers().map((astrologer, index) => (
            <div key={`${currentSlide}-${index}`} className="animate-fade-in">
              <AstrologerCard {...astrologer} />
            </div>
          ))}
        </div>
        
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: Math.ceil(astrologers.length / 5) }).map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                Math.floor(currentSlide / 5) === index ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SlidingAstrologers;
