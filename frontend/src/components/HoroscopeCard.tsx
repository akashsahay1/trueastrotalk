
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
      case "Fire": return "from-primary to-primary/80";
      case "Earth": return "from-secondary to-secondary/80";
      case "Air": return "from-muted-foreground to-muted-foreground/80";
      case "Water": return "from-primary/80 to-secondary";
      default: return "from-primary to-primary/80";
    }
  };

  const getSignPath = (sign: string) => {
    return `/horoscope/${sign.toLowerCase()}`;
  };

  return (
    <Card className={`text-center p-6 bg-gradient-to-br ${getGradient(element)} text-primary-foreground hover:shadow-lg transition-shadow border-0`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-primary-foreground">{sign}</CardTitle>
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
          className="bg-card/20 hover:bg-card/30 text-primary-foreground border-card/30"
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
