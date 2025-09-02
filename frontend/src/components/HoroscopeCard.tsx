
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface HoroscopeCardProps {
  sign: string;
  element: string;
  dates: string;
}

const HoroscopeCard = ({ sign, element, dates }: HoroscopeCardProps) => {
  const getGradient = (element: string) => {
    switch (element) {
      case "Fire": return "from-red-400 to-orange-500";
      case "Earth": return "from-green-400 to-emerald-500";
      case "Air": return "from-blue-400 to-cyan-500";
      case "Water": return "from-purple-400 to-indigo-500";
      default: return "from-primary to-primary/80";
    }
  };

  const getSignPath = (sign: string) => {
    return `/horoscope/${sign.toLowerCase()}`;
  };

  return (
    <Card className={`text-center p-6 bg-gradient-to-br ${getGradient(element)} text-white hover:shadow-lg transition-shadow border-0`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-white">{sign}</CardTitle>
        <p className="text-sm opacity-90">{element} Sign</p>
      </CardHeader>
      <CardContent>
        <p className="text-sm opacity-90 mb-4">{dates}</p>
        <p className="text-sm mb-4 opacity-90">
          Discover what the stars have in store for you today. Get personalized insights and guidance.
        </p>
        <Button 
          asChild 
          variant="secondary" 
          size="sm" 
          className="bg-white/20 hover:bg-white/30 text-white border-white/30"
        >
          <Link to={getSignPath(sign)}>
            Read Full Horoscope
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default HoroscopeCard;
