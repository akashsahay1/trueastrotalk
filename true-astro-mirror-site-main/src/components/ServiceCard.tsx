
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
  return (
    <Card className="text-center p-6 hover:shadow-lg transition-shadow bg-card border-border">
      <CardHeader className="pb-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-xl font-bold text-card-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link to={link}>Learn More</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
