
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
}

const ServiceCard = ({ title, description, icon: Icon, link }: ServiceCardProps) => {
  const getServiceColors = (title: string) => {
    const colorVariations = [
      { bg: "bg-gradient-to-br from-background to-muted border-border", iconBg: "bg-primary/10", iconColor: "text-primary", button: "bg-primary hover:bg-primary/90" },
      { bg: "bg-gradient-to-br from-muted to-background border-muted-foreground/20", iconBg: "bg-secondary/10", iconColor: "text-secondary", button: "bg-secondary hover:bg-secondary/90" },
      { bg: "bg-gradient-to-br from-card to-muted border-border", iconBg: "bg-muted-foreground/10", iconColor: "text-muted-foreground", button: "bg-muted-foreground hover:bg-muted-foreground/90" },
    ];
    
    const index = title.length % colorVariations.length;
    return colorVariations[index];
  };

  const colors = getServiceColors(title);
  
  return (
    <Card className={`text-center p-6 hover:shadow-lg transition-shadow ${colors.bg}`}>
      <CardHeader className="pb-4">
        <div className={`w-16 h-16 ${colors.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-8 h-8 ${colors.iconColor}`} />
        </div>
        <CardTitle className="text-xl font-bold text-card-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <Button asChild className={`${colors.button} text-white`}>
          <Link to={link}>Learn More</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
