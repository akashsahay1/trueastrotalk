
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Phone, MessageCircle } from "lucide-react";

interface AstrologerCardProps {
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  price: number;
  image: string;
}

const AstrologerCard = ({ name, specialty, experience, rating, price, image }: AstrologerCardProps) => {
  return (
    <Card className="text-center p-4 hover:shadow-lg transition-shadow bg-card border-border">
      <CardContent className="p-0">
        <div className="relative mb-4">
          <img 
            src={image} 
            alt={name} 
            className="w-20 h-20 rounded-full mx-auto object-cover"
          />
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded">
            Online
          </div>
        </div>
        <h3 className="font-bold text-card-foreground mb-1">{name}</h3>
        <p className="text-sm text-primary mb-1">{specialty}</p>
        <p className="text-xs text-muted-foreground mb-2">{experience}</p>
        <div className="flex items-center justify-center mb-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm ml-1 text-card-foreground">{rating}</span>
        </div>
        <div className="text-lg font-bold text-card-foreground mb-3">₹{price}/min</div>
        <div className="space-y-2">
          <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button size="sm" variant="outline" className="w-full border-border">
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AstrologerCard;
