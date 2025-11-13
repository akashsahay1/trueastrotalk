
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const AboutAstrology = () => {
  const categories = [
    {
      title: "true Astrotalk About",
      description: "true Astrotalk is a leading platform for authentic astrological consultations and predictions.",
      content: "true Astrotalk provides genuine astrological guidance with experienced astrologers who have years of practice in Vedic astrology, numerology, and other occult sciences. Our platform connects you with verified astrologers who can help you understand your life path, career prospects, relationship compatibility, and spiritual growth.",
      link: "/about/trueastrotalk"
    },
    {
      title: "Kundali About",
      description: "Your birth chart or Kundali reveals the cosmic blueprint of your life journey.",
      content: "Kundali, also known as birth chart or horoscope, is a detailed map of planetary positions at the time of your birth. It reveals insights about your personality, strengths, weaknesses, career prospects, relationships, and life events.",
      link: "/about/kundali"
    },
    {
      title: "Palmistry About",
      description: "The ancient art of reading palms to understand personality and predict future events.",
      content: "Palmistry is the practice of fortune-telling through the study of the palm. It reveals personality traits, life events, health conditions, and future prospects through the lines, mounts, and shape of hands.",
      link: "/about/palmistry"
    },
    {
      title: "Life Coach About",
      description: "Spiritual life coaching combined with astrological guidance for personal growth.",
      content: "Our life coaches combine astrological insights with practical guidance to help you overcome challenges, achieve goals, and find your true purpose in life through spiritual and psychological support.",
      link: "/about/lifecoach"
    },
    {
      title: "Nadi About",
      description: "Ancient palm leaf manuscripts that contain detailed predictions about your life.",
      content: "Nadi astrology is based on ancient palm leaf manuscripts written by great sages thousands of years ago. These leaves contain detailed information about individuals' past, present, and future lives.",
      link: "/about/nadi"
    },
    {
      title: "Vedic About",
      description: "The ancient science of Vedic astrology based on sacred Hindu scriptures.",
      content: "Vedic astrology, also known as Jyotish, is the traditional Hindu system of astrology. It's based on the sidereal zodiac and provides deep insights into karma, dharma, and life purpose.",
      link: "/about/vedic"
    },
    {
      title: "Tarot About",
      description: "Mystical tarot card readings that provide guidance and insights into your future.",
      content: "Tarot reading is a form of divination using a deck of 78 cards to gain insight into the past, present, and future. Each card has symbolic meanings that help understand life situations and make decisions.",
      link: "/about/tarot"
    },
    {
      title: "Lal Kitab About",
      description: "The revolutionary system of astrology with simple and effective remedies.",
      content: "Lal Kitab is a unique system of Vedic astrology that provides simple and effective remedies for planetary problems. It combines astrology with palmistry and offers practical solutions for life problems.",
      link: "/about/lalkitab"
    },
    {
      title: "Vastu About",
      description: "The ancient science of architecture that harmonizes living spaces with natural forces.",
      content: "Vastu Shastra is the traditional Indian system of architecture that describes principles of design, layout, measurements, ground preparation, space arrangement, and spatial geometry.",
      link: "/about/vastu"
    },
    {
      title: "Psychic About",
      description: "Intuitive psychic readings that tap into spiritual energies and cosmic consciousness.",
      content: "Psychic reading involves using extrasensory perception to gain insights into various aspects of life. Our psychic readers use their intuitive abilities to provide guidance and predictions.",
      link: "/about/psychic"
    },
    {
      title: "Numerology About",
      description: "The mystical relationship between numbers and life events, personality traits.",
      content: "Numerology is the belief in the mystical relationship between numbers and life events. It studies the numerical value of names, birth dates, and other significant numbers to understand personality and predict future.",
      link: "/about/numerology"
    },
    {
      title: "KP About",
      description: "Krishnamurti Paddhati - A precise and scientific method of astrological prediction.",
      content: "KP Astrology or Krishnamurti Paddhati is a system of astrology developed by late Prof. K.S. Krishnamurti. It's known for its accuracy in predictions and uses a unique system of sub-divisions of zodiac signs.",
      link: "/about/kp"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-purple-600 mb-4">About Astrology</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore different aspects of astrology and spiritual sciences. Click on any category to learn more.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Link key={index} to={category.link}>
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-6 text-black hover:shadow-lg transition-all duration-300 transform hover:scale-105 min-h-[200px] flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-3">{category.title}</h3>
                    <p className="text-sm opacity-90">{category.description}</p>
                  </div>
                  <div className="flex justify-end mt-4">
                    <div className="bg-black/20 rounded-full p-2">
                      <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">➤</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-8 text-center text-black">
            <h3 className="text-2xl font-bold mb-4">Connect with an Astrologer on Call or Chat for more personalised detailed predictions.</h3>
            <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-full font-semibold">
              📞 Talk to Astrologer
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default AboutAstrology;
