import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Eye, Calendar, Heart, Star, Brain, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const LifePathNumber = () => {
  const { number } = useParams<{ number: string }>();
  const pathNumber = parseInt(number || '1');

  const lifePathData = {
    1: {
      title: "The Leader",
      meaning: "Number 1 represents leadership, independence, and new beginnings. These individuals are natural pioneers who forge their own path with courage and determination. They possess strong willpower and the ability to turn their visions into reality.",
      insights: "One is the number of creation and individuality. It vibrates with innovative energy, ambition, and the power of self-reliance. People with this life path are born leaders who inspire others through their confidence and original thinking. They excel in situations that require independent action and decision-making.",
      karmic: "The karmic challenge for number 1 is to balance their strong ego with compassion for others. They must learn that true leadership comes from serving others, not dominating them. Past life patterns may involve learning to stand alone and trust their own judgment rather than always following others.",
      spiritual: "Spiritually, number 1 teaches that we are all creators of our own reality. It represents the divine spark of consciousness that exists within each soul. The journey involves learning to use personal power responsibly and recognizing that individual success is most meaningful when it contributes to the greater good."
    },
    2: {
      title: "The Peacemaker",
      meaning: "Number 2 represents harmony, cooperation, and balance in relationships. These individuals are natural diplomats who excel at bringing people together and creating peaceful environments. They have a gift for understanding different perspectives.",
      insights: "Two is the number of duality and partnership. It vibrates with sensitivity, intuition, and the power of collaboration. People with this life path are mediators who can see both sides of any situation. They thrive in cooperative environments and excel at building bridges between people.",
      karmic: "The karmic challenge for number 2 is to maintain their own identity while being supportive of others. They must learn to value their own needs and opinions as much as those of others. Past life patterns may involve learning to trust others and work cooperatively rather than trying to do everything alone.",
      spiritual: "Spiritually, number 2 teaches the power of unity and cooperation. It represents the divine feminine principle of receptivity and nurturing. The journey involves learning that strength lies not just in independence, but in the ability to create harmonious relationships and work together for common goals."
    },
    3: {
      title: "The Creative",
      meaning: "Number 3 represents creativity, communication, and joy. These individuals are natural entertainers and artists who bring lightness and inspiration to the world. They have a gift for self-expression and spreading positivity.",
      insights: "Three is the number of the trinity, representing the synthesis of dualities. It vibrates with creative energy, optimism, and the power of manifestation through thought, word, and deed. Jupiter's expansive influence governs this number.",
      karmic: "The karmic challenge for number 3 is to use creative gifts responsibly and avoid scattering energy. Past life patterns may involve misusing talents for selfish purposes. The soul learns to create with love and purpose.",
      spiritual: "Spiritually, number 3 teaches that creativity is a divine gift meant to be shared. It represents the holy trinity and the power of creative visualization in spiritual manifestation. Joy becomes a pathway to enlightenment."
    },
    4: {
      title: "The Builder",
      meaning: "Number 4 represents stability, practicality, and strong foundations. These individuals are hardworking and methodical, excelling at creating lasting structures and systems. They value order, discipline, and tangible results.",
      insights: "Four is the number of the earth element and material manifestation. It vibrates with reliability, organization, and the power to build lasting legacies. People with this life path are the architects of society, creating frameworks that support growth and stability.",
      karmic: "The karmic challenge for number 4 is to balance work with play and avoid becoming too rigid or controlling. They must learn that flexibility is as important as structure. Past life patterns may involve learning the value of hard work and responsibility.",
      spiritual: "Spiritually, number 4 teaches that the physical world is a sacred temple. It represents the four elements and four directions, grounding spiritual energy into material form. The journey involves finding the divine in everyday work and practical service."
    },
    5: {
      title: "The Freedom Seeker",
      meaning: "Number 5 represents change, versatility, and freedom of expression. These individuals are adventurous spirits who thrive on variety and new experiences. They are natural explorers who resist limitation and embrace life's adventures.",
      insights: "Five is the number of transformation and sensory experience. It vibrates with curiosity, adaptability, and the power of freedom. People with this life path are catalysts for change who help others break free from limiting patterns and embrace new possibilities.",
      karmic: "The karmic challenge for number 5 is to find stability without losing freedom and to commit without feeling trapped. They must learn that true freedom comes from self-discipline, not from running away. Past life patterns may involve excess or restriction.",
      spiritual: "Spiritually, number 5 teaches that change is the only constant and that freedom is a state of mind. It represents the five senses as gateways to spiritual experience. The journey involves learning to find the sacred in all of life's experiences."
    },
    6: {
      title: "The Nurturer",
      meaning: "Number 6 represents love, nurturing, and responsibility towards family. These individuals are natural caregivers who create harmony and beauty in their surroundings. They have a strong sense of duty and devotion to loved ones.",
      insights: "Six is the number of Venus, representing love, beauty, and domestic harmony. It vibrates with compassion, service, and the power of unconditional love. People with this life path are healers who create safe, nurturing environments for others to grow.",
      karmic: "The karmic challenge for number 6 is to avoid martyrdom and learn to care for themselves while caring for others. They must learn that enabling is not loving. Past life patterns may involve learning to give love without expecting return.",
      spiritual: "Spiritually, number 6 teaches that love is the highest spiritual principle. It represents the harmony of perfect balance and the beauty of divine creation. The journey involves learning that true service is a form of worship and that caring for others is sacred work."
    },
    7: {
      title: "The Seeker",
      meaning: "Number 7 represents spiritual wisdom, introspection, and inner knowledge. These individuals are natural philosophers and analysts who seek truth and understanding. They value solitude and deep contemplation.",
      insights: "Seven is the number of mysticism and spiritual perfection. It vibrates with intuition, analysis, and the power of inner knowing. People with this life path are truth-seekers who bridge the material and spiritual worlds through their insights and wisdom.",
      karmic: "The karmic challenge for number 7 is to balance spiritual pursuits with practical living and to share wisdom rather than isolating. They must learn to trust their intuition while staying grounded. Past life patterns may involve spiritual isolation or dogmatism.",
      spiritual: "Spiritually, number 7 teaches that truth is found within. It represents the seven chakras and seven days of creation, symbolizing spiritual completion. The journey involves learning that solitude is not loneliness but a path to divine connection."
    },
    8: {
      title: "The Powerhouse",
      meaning: "Number 8 represents material success, authority, and abundance. These individuals are natural leaders in business and finance who understand the material world. They have strong executive abilities and the power to manifest prosperity.",
      insights: "Eight is the number of karma and cosmic balance. It vibrates with power, ambition, and the ability to achieve material success. People with this life path understand the laws of cause and effect and how to work with universal abundance.",
      karmic: "The karmic challenge for number 8 is to use power and wealth responsibly without becoming corrupted by them. They must learn that true success includes spiritual wealth. Past life patterns may involve misuse of power or extreme poverty.",
      spiritual: "Spiritually, number 8 teaches that material and spiritual worlds are interconnected. It represents the infinity symbol and the endless flow of universal abundance. The journey involves learning that power is meant to be used for the highest good of all."
    },
    9: {
      title: "The Humanitarian",
      meaning: "Number 9 represents compassion, completion, and humanitarian service. These individuals are old souls who have a universal perspective and deep empathy for humanity. They are natural teachers and healers who work for the greater good.",
      insights: "Nine is the number of universal love and completion of a cycle. It vibrates with wisdom, tolerance, and the power of unconditional giving. People with this life path are here to serve humanity and leave the world better than they found it.",
      karmic: "The karmic challenge for number 9 is to release the past and avoid holding onto what no longer serves. They must learn healthy boundaries while maintaining compassion. Past life patterns involve learning to let go with grace and forgiveness.",
      spiritual: "Spiritually, number 9 teaches that we are all one and that serving others is serving the divine. It represents the completion of spiritual lessons before beginning a new cycle. The journey involves learning that the highest form of love is selfless service."
    },
    10: {
      title: "The Innovator",
      meaning: "Number 10 represents innovation, leadership, and pioneering spirit. These individuals combine the independence of 1 with the completion energy of 0, creating powerful manifestors. They are meant to start new ventures and inspire others.",
      insights: "Ten combines the creative force of 1 with the infinite potential of 0. It vibrates with originality, courage, and the power to manifest dreams into reality. People with this life path are here to break new ground and show others what's possible.",
      karmic: "The karmic challenge for number 10 is to balance ambition with humility and to lead without ego. They must learn that innovation serves humanity best when shared generously. Past life patterns involve learning self-reliance balanced with cooperation.",
      spiritual: "Spiritually, number 10 teaches that we are co-creators with the divine. It represents new beginnings infused with spiritual wisdom. The journey involves learning that true innovation comes from aligning personal will with divine purpose."
    },
    11: {
      title: "The Inspirer",
      meaning: "Number 11 is a Master Number representing inspiration, intuition, and spiritual enlightenment. These individuals are natural psychics and visionaries who channel higher wisdom. They illuminate the path for others.",
      insights: "Eleven is the first Master Number, vibrating at a higher frequency than other numbers. It represents intuition, inspiration, and the power to enlighten others. People with this life path are spiritual messengers who bring divine light into the world.",
      karmic: "The karmic challenge for number 11 is to ground high vibrations into practical reality and avoid becoming overwhelmed by sensitivity. They must learn to use their gifts without burning out. Past life patterns involve spiritual awakening and teaching.",
      spiritual: "Spiritually, number 11 teaches that we are channels for divine light. It represents the two pillars of spiritual wisdom and the gateway to higher consciousness. The journey involves learning to be a clear conduit for spiritual truth."
    },
    12: {
      title: "The Analyst",
      meaning: "Number 12 represents analysis, harmony, and mediation. These individuals combine creativity (3) with duality (2) to create balance through understanding. They excel at seeing patterns and bringing opposing forces together.",
      insights: "Twelve combines the diplomatic nature of 2 with the creative expression of 3 (1+2=3). It vibrates with wisdom, cooperation, and the power to heal through understanding. People with this life path are peacemakers who use creativity to solve problems.",
      karmic: "The karmic challenge for number 12 is to balance analysis with action and avoid over-thinking. They must learn to trust their creative instincts while honoring their need for harmony. Past life patterns involve learning diplomacy and creative problem-solving.",
      spiritual: "Spiritually, number 12 teaches the power of sacred geometry and divine order. It represents the 12 zodiac signs and 12 disciples, symbolizing completeness. The journey involves learning that harmony comes from understanding the interconnection of all things."
    },
    13: {
      title: "The Visionary",
      meaning: "Number 13 represents transformation, vision, and practical manifestation. These individuals combine independence (1) with creativity (3) and the transformative power of 4 (1+3=4). They are builders of new paradigms.",
      insights: "Thirteen is a misunderstood number that actually represents positive transformation and rebirth. It vibrates with determination, creativity, and the power to manifest visions into reality. People with this life path are change-makers who rebuild after transformation.",
      karmic: "The karmic challenge for number 13 is to embrace change rather than fear it and to use transformative experiences for growth. They must learn that endings are necessary for new beginnings. Past life patterns involve major life changes and rebuilding.",
      spiritual: "Spiritually, number 13 teaches that transformation is a sacred process. It represents death and rebirth cycles that lead to spiritual evolution. The journey involves learning that we must release the old to make space for the new."
    },
    14: {
      title: "The Freedom",
      meaning: "Number 14 represents freedom through experience, adaptability, and constructive change. These individuals combine independence (1) with foundation (4) and freedom (5, 1+4=5). They are adventurous yet grounded.",
      insights: "Fourteen vibrates with versatility, curiosity, and the power to learn through direct experience. It combines the pioneering spirit of 1 with the stability of 4, resulting in the freedom-loving 5. People with this life path seek knowledge through adventure while maintaining practical wisdom.",
      karmic: "The karmic challenge for number 14 is to balance freedom with responsibility and avoid excess or addiction. They must learn that true freedom requires discipline. Past life patterns involve learning moderation and finding freedom within structure.",
      spiritual: "Spiritually, number 14 teaches that freedom is a state of consciousness, not external circumstances. It represents the liberation that comes from spiritual understanding. The journey involves learning that we are free when we transcend limitations of the ego."
    },
    15: {
      title: "The Healer",
      meaning: "Number 15 represents healing, family, and creative love. These individuals combine independence (1) with freedom (5) and nurturing (6, 1+5=6). They are natural healers who help others through creative expression.",
      insights: "Fifteen vibrates with harmony, compassion, and the power to heal through love and creativity. It represents the union of masculine and feminine energies creating healing. People with this life path are teachers and healers who use love as their primary medicine.",
      karmic: "The karmic challenge for number 15 is to avoid becoming overwhelmed by others' problems and maintain healthy boundaries. They must learn to heal themselves first. Past life patterns involve learning the difference between enabling and empowering.",
      spiritual: "Spiritually, number 15 teaches that love is the greatest healer. It represents the heart chakra and the power of unconditional love to transform. The journey involves learning that healing others begins with healing ourselves."
    },
    16: {
      title: "The Awakening",
      meaning: "Number 16 represents spiritual awakening, intuition, and breaking down illusions. These individuals combine independence (1) with nurturing (6) and seeking (7, 1+6=7). They experience profound spiritual transformations.",
      insights: "Sixteen vibrates with deep intuition, spiritual wisdom, and the power to see beyond the material world. It represents the destruction of false beliefs leading to spiritual awakening. People with this life path often experience sudden insights that change their entire worldview.",
      karmic: "The karmic challenge for number 16 is to embrace spiritual lessons even when they come through difficult experiences. They must learn that ego dissolution leads to enlightenment. Past life patterns involve spiritual pride that needed to be broken down.",
      spiritual: "Spiritually, number 16 teaches that sometimes we must lose everything to find our true self. It represents the tower card in tarot - necessary destruction that clears the way for truth. The journey involves learning that spiritual awakening often comes through crisis."
    },
    17: {
      title: "The Star",
      meaning: "Number 17 represents hope, inspiration, and spiritual guidance. These individuals combine independence (1) with seeking (7) and power (8, 1+7=8). They are beacons of light who inspire others through their own journey.",
      insights: "Seventeen vibrates with optimism, faith, and the power to manifest dreams while staying spiritually connected. It combines the pioneering spirit of 1 with the mysticism of 7, resulting in the manifesting power of 8. People with this life path are star seeds who remember their divine origin.",
      karmic: "The karmic challenge for number 17 is to maintain faith even during dark times and to use their gifts to serve rather than for ego. They must learn that true power comes from spiritual alignment. Past life patterns involve spiritual leadership and teaching.",
      spiritual: "Spiritually, number 17 teaches that we are all stars - beings of light temporarily in physical form. It represents hope, inspiration, and the eternal nature of the soul. The journey involves remembering our divine essence and helping others remember theirs."
    },
    18: {
      title: "The Manifester",
      meaning: "Number 18 represents material mastery and powerful manifestation. These individuals combine independence (1) with power (8) and completion (9, 1+8=9). They have the ability to manifest abundance while serving humanity.",
      insights: "Eighteen vibrates with leadership, abundance, and the power to create lasting impact. It combines the innovative force of 1 with the material mastery of 8, resulting in the humanitarian service of 9. People with this life path are meant to achieve great success and use it to help others.",
      karmic: "The karmic challenge for number 18 is to balance personal ambition with service to others and avoid using power selfishly. They must learn that true success includes spiritual wealth. Past life patterns involve learning to use power and resources for the greater good.",
      spiritual: "Spiritually, number 18 teaches that material success and spiritual growth are not separate. It represents the mastery of manifesting abundance for divine purposes. The journey involves learning that wealth is meant to be circulated and shared generously."
    },
    19: {
      title: "The Teacher",
      meaning: "Number 19 represents wisdom, teaching, and humanitarian leadership. These individuals combine independence (1) with completion (9) and new beginnings (10, 1+9=10, 1+0=1). They complete cycles and begin new ones with wisdom.",
      insights: "Nineteen vibrates with experience, understanding, and the power to teach from hard-won wisdom. It represents the end of one cycle and the beginning of another, bringing accumulated knowledge into new ventures. People with this life path are old souls who teach through example.",
      karmic: "The karmic challenge for number 19 is to release the past completely and embrace new beginnings without carrying old baggage. They must learn that completion requires letting go. Past life patterns involve learning to end things gracefully and start fresh.",
      spiritual: "Spiritually, number 19 teaches that every ending is a new beginning and that wisdom comes from integrating all experiences. It represents the sun card in tarot - enlightenment through life experience. The journey involves learning to shine our light after emerging from darkness."
    },
    20: {
      title: "The Awakener",
      meaning: "Number 20 represents partnership, intuition, and spiritual awakening through relationships. These individuals combine cooperation (2) with infinite potential (0) and new beginnings (2). They awaken others through connection.",
      insights: "Twenty vibrates with sensitivity, diplomacy, and the power to awaken consciousness in others. It amplifies the peaceful nature of 2 with the spiritual potential of 0. People with this life path are divine mirrors who help others see their true nature through relationship.",
      karmic: "The karmic challenge for number 20 is to maintain identity within relationships and avoid losing self in others. They must learn that true partnership enhances rather than diminishes individuality. Past life patterns involve learning healthy interdependence.",
      spiritual: "Spiritually, number 20 teaches that we awaken through our relationships with others. It represents the power of divine partnership and sacred union. The journey involves learning that others are mirrors reflecting aspects of ourselves back to us."
    },
    21: {
      title: "The Intuitive",
      meaning: "Number 21 represents intuition, sensitivity, and psychic abilities. These individuals combine cooperation (2) with independence (1) and creativity (3, 2+1=3). They are natural psychics who perceive beyond the physical realm.",
      insights: "Twenty-one vibrates with heightened intuition, diplomatic skill, and the power to create harmony through psychic awareness. It combines the sensitivity of 2 with the independence of 1, resulting in the creative expression of 3. People with this life path are channels who receive and transmit subtle information.",
      karmic: "The karmic challenge for number 21 is to trust their intuition without becoming overwhelmed by sensitivity. They must learn to ground psychic abilities in practical reality. Past life patterns involve developing and learning to trust inner knowing.",
      spiritual: "Spiritually, number 21 teaches that intuition is the language of the soul. It represents the third eye chakra and the power of inner vision. The journey involves learning to trust the subtle guidance that comes from beyond the rational mind."
    },
    22: {
      title: "The Master Builder",
      meaning: "Number 22 is a Master Number representing large-scale manifestation and building lasting legacies. These individuals combine cooperation (2) with itself, amplified, and foundation (4, 2+2=4). They are meant to build projects that serve humanity.",
      insights: "Twenty-two is the Master Builder, vibrating at a frequency that can manifest dreams on a grand scale. It combines the visionary ability to see possibilities with the practical skills to make them real. People with this life path are architects of the new world.",
      karmic: "The karmic challenge for number 22 is to manage the pressure of high expectations and avoid becoming paralyzed by perfectionism. They must learn to take action despite fear. Past life patterns involve learning to ground visions into material reality.",
      spiritual: "Spiritually, number 22 teaches that we are here to build heaven on earth. It represents the manifestation of divine will in physical form. The journey involves learning that spiritual principles can and must be applied to create practical solutions."
    },
    23: {
      title: "The Compassionate",
      meaning: "Number 23 represents compassion, service, and universal love. These individuals combine cooperation (2) with creativity (3) and freedom (5, 2+3=5). They serve others through creative and adaptable means.",
      insights: "Twenty-three vibrates with empathy, communication skills, and the power to serve through creative expression. It combines the diplomatic nature of 2 with the expressive gifts of 3, resulting in the adaptive service of 5. People with this life path are natural counselors and creative healers.",
      karmic: "The karmic challenge for number 23 is to avoid overextending in service and maintain healthy boundaries. They must learn that self-care enables better service. Past life patterns involve learning to give without depleting personal energy.",
      spiritual: "Spiritually, number 23 teaches that compassion in action is the highest form of prayer. It represents the heart chakra expressing through the throat chakra - feeling and communicating love. The journey involves learning to serve from a full cup."
    },
    24: {
      title: "The Warrior",
      meaning: "Number 24 represents courage, determination, and warrior spirit. These individuals combine cooperation (2) with foundation (4) and nurturing (6, 2+4=6). They fight for family, home, and those they love.",
      insights: "Twenty-four vibrates with protective energy, loyalty, and the power to defend what matters. It combines the partnership of 2 with the stability of 4, resulting in the family devotion of 6. People with this life path are fierce protectors who create safe spaces for others.",
      karmic: "The karmic challenge for number 24 is to balance warrior energy with compassion and avoid becoming aggressive or controlling. They must learn that true strength includes gentleness. Past life patterns involve learning to use power to protect rather than dominate.",
      spiritual: "Spiritually, number 24 teaches that we are spiritual warriors fighting for love, truth, and justice. It represents the divine masculine principle of protection and the divine feminine principle of nurturing working together. The journey involves learning that courage is love in action."
    },
    25: {
      title: "The Adventure",
      meaning: "Number 25 represents adventure, curiosity, and life experience. These individuals combine cooperation (2) with freedom (5) and seeking (7, 2+5=7). They learn through exploration and diverse experiences.",
      insights: "Twenty-five vibrates with wanderlust, adaptability, and the power to learn through direct experience. It combines the diplomatic nature of 2 with the adventurous spirit of 5, resulting in the wisdom-seeking of 7. People with this life path are eternal students of life.",
      karmic: "The karmic challenge for number 25 is to find depth without losing breadth and to commit without feeling trapped. They must learn that true freedom includes meaningful connections. Past life patterns involve learning to balance exploration with stability.",
      spiritual: "Spiritually, number 25 teaches that life itself is the greatest teacher. It represents the journey as sacred as the destination. The learning path involves discovering that every experience, whether pleasant or difficult, contains spiritual lessons."
    },
    26: {
      title: "The Diplomat",
      meaning: "Number 26 represents diplomacy, cooperation, and peaceful resolution. These individuals combine cooperation (2) with nurturing (6) and power (8, 2+6=8). They achieve success through harmony and partnership.",
      insights: "Twenty-six vibrates with grace, tact, and the power to create win-win situations. It combines the partnership abilities of 2 with the love energy of 6, resulting in the material success of 8. People with this life path achieve prosperity through cooperation and fair dealing.",
      karmic: "The karmic challenge for number 26 is to maintain authenticity while being diplomatic and avoid people-pleasing. They must learn that honesty and harmony can coexist. Past life patterns involve learning to balance self-interest with consideration for others.",
      spiritual: "Spiritually, number 26 teaches that peace is the highest achievement. It represents the power of love to resolve all conflicts. The journey involves learning that cooperation and mutual respect create more abundance than competition."
    },
    27: {
      title: "The Idealist",
      meaning: "Number 27 represents idealism, vision, and spiritual purpose. These individuals combine cooperation (2) with seeking (7) and completion (9, 2+7=9). They work to manifest high ideals in the material world.",
      insights: "Twenty-seven vibrates with wisdom, compassion, and the power to envision a better world. It combines the peaceful nature of 2 with the mystical qualities of 7, resulting in the humanitarian service of 9. People with this life path are visionaries working to elevate consciousness.",
      karmic: "The karmic challenge for number 27 is to balance idealism with practical action and avoid disappointment when reality falls short. They must learn that progress happens gradually. Past life patterns involve learning to work patiently toward long-term goals.",
      spiritual: "Spiritually, number 27 teaches that holding the vision of a better world helps create it. It represents the power of idealism to inspire change. The journey involves learning that we must be the change we wish to see."
    },
    28: {
      title: "The Abundance",
      meaning: "Number 28 represents material abundance and prosperity. These individuals combine cooperation (2) with power (8) and new beginnings (10, 2+8=10). They manifest wealth through partnerships and fair dealings.",
      insights: "Twenty-eight vibrates with prosperity consciousness, business acumen, and the power to create abundance for all. It combines the partnership skills of 2 with the material mastery of 8, creating opportunities for shared success. People with this life path understand that cooperation creates more wealth than competition.",
      karmic: "The karmic challenge for number 28 is to maintain integrity while pursuing prosperity and avoid becoming materialistic. They must learn that true wealth includes spiritual riches. Past life patterns involve learning to create abundance ethically and share generously.",
      spiritual: "Spiritually, number 28 teaches that prosperity is a spiritual principle and that abundance is our divine birthright. It represents the infinite flow of universal supply. The journey involves learning that giving and receiving are one, and that wealth serves its highest purpose when shared."
    },
    29: {
      title: "The Spiritual",
      meaning: "Number 29 represents spiritual mastery and enlightenment. These individuals combine cooperation (2) with completion (9) and Master Number qualities (11, 2+9=11). They are old souls nearing spiritual completion.",
      insights: "Twenty-nine vibrates with deep wisdom, universal love, and the power to illuminate spiritual truths. It combines the diplomatic nature of 2 with the humanitarian service of 9, carrying the Master Number 11 energy. People with this life path are spiritual teachers who have learned through many lifetimes.",
      karmic: "The karmic challenge for number 29 is to release attachment to past lifetimes and fully embrace the present. They must learn that spiritual wisdom serves no purpose if not applied. Past life patterns involve completing major karmic cycles and preparing for ascension.",
      spiritual: "Spiritually, number 29 teaches that we are approaching completion of our earthly lessons. It represents the final stages of spiritual evolution before ascending to higher consciousness. The journey involves integrating all past learning and preparing to graduate from earth school."
    },
    30: {
      title: "The Expression",
      meaning: "Number 30 represents self-expression, creativity, and communication. These individuals combine creativity (3) with infinite potential (0) and themselves (3). They are meant to express divine creativity through multiple channels.",
      insights: "Thirty vibrates with artistic gifts, communication skills, and the power to inspire through creative expression. It amplifies the creative energy of 3 with the unlimited potential of 0. People with this life path are channels for divine creativity in all its forms.",
      karmic: "The karmic challenge for number 30 is to focus their abundant creative energy and avoid scattering their gifts. They must learn that depth comes from commitment to their craft. Past life patterns involve learning to use creative gifts responsibly and purposefully.",
      spiritual: "Spiritually, number 30 teaches that we are all creative expressions of the divine. It represents the holy trinity manifested in the material world. The journey involves learning that creativity is not just about art, but about how we express our unique soul essence in everything we do."
    },
    31: {
      title: "The Master Teacher",
      meaning: "Number 31 represents master teaching and spiritual leadership. These individuals combine creativity (3) with independence (1) and foundation (4, 3+1=4). They build new spiritual paradigms through creative teaching.",
      insights: "Thirty-one vibrates with innovative teaching methods, spiritual wisdom, and the power to build lasting educational structures. It combines the expressive gifts of 3 with the pioneering spirit of 1, resulting in the foundational building of 4. People with this life path are meant to create new systems of learning and spiritual understanding.",
      karmic: "The karmic challenge for number 31 is to teach from humility rather than ego and to remain a student while being a teacher. They must learn that true mastery involves continuous learning. Past life patterns involve spiritual teaching and the responsibility that comes with influencing others.",
      spiritual: "Spiritually, number 31 teaches that we are all both students and teachers. It represents the continuous cycle of learning and sharing knowledge. The journey involves learning that the highest form of teaching is through example, and that wisdom grows through the act of teaching others."
    }
  };

  const data = lifePathData[pathNumber as keyof typeof lifePathData] || lifePathData[1];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center text-primary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="max-w-4xl mx-auto">
          <Card className="mb-8 overflow-hidden border-2 border-primary/20">
            <CardContent className="p-0">
              {/* Hero Section */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-center">
                <h1 className="text-3xl font-bold text-white mb-4">
                  Life Path Number {pathNumber}: {data.title}
                </h1>
                <div className="w-64 h-40 bg-gradient-to-b from-slate-600 to-slate-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                  <span className="text-8xl font-bold text-white">{pathNumber}</span>
                </div>
                <p className="text-xl text-gray-300 mt-4">{data.title}</p>
              </div>

              {/* Content Sections */}
              <div className="p-8 space-y-8">
                {/* Meaning & Significance */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Meaning & Significance</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {data.meaning}
                  </p>
                </section>

                {/* Numerology Insights */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Numerology Insights</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {data.insights}
                  </p>
                </section>

                {/* Karmic Life Lessons */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Karmic Life Lessons</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {data.karmic}
                  </p>
                </section>

                {/* Spiritual Path */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Spiritual Path</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {data.spiritual}
                  </p>
                </section>

                {/* Stats */}
                <div className="flex items-center justify-around pt-6 border-t border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-1">
                      <Eye className="w-5 h-5" />
                      {Math.floor(Math.random() * 2000) + 1000}
                    </div>
                    <div className="text-sm text-muted-foreground">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-primary font-bold text-2xl mb-1">
                      <Calendar className="w-5 h-5" />
                      {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-sm text-muted-foreground">Published</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Want a Personalized Reading?</h3>
              <p className="text-muted-foreground mb-6">
                Connect with our expert numerologists for a detailed analysis of your complete numerology chart.
              </p>
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Book a Consultation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LifePathNumber;
