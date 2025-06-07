import WidgetCard from "./WidgetCard";
import { Clapperboard, Music2,Youtube } from "lucide-react"; // Clapperboard for movies/shows
import Image from "next/image";

const EntertainmentWidget = () => {
  const suggestions = [
    { platform: "Holonet Stream", type: "Series", title: "Cyberia Chronicles S3", imageHint: "cyberpunk city series", imageUrl: "https://placehold.co/150x100.png" },
    { platform: "Neural Soundscapes", type: "Ambient Mix", title: "Zero-G Drifting", imageHint: "abstract space music", imageUrl: "https://placehold.co/150x100.png" },
    { platform: "Data Archive", type: "Docu-Series", title: "The Quantum Leap", imageHint: "science documentary space", imageUrl: "https://placehold.co/150x100.png" },
  ];
  
  const platformIcons: {[key: string]: React.ReactNode } = {
    "Holonet Stream": <Clapperboard size={16} className="text-primary/80"/>,
    "Neural Soundscapes": <Music2 size={16} className="text-secondary/80"/>,
    "Data Archive": <Youtube size={16} className="text-red-400/80"/>,
  }

  return (
    <WidgetCard title="Recreation Matrix // Content Feed" icon={<Clapperboard />}>
      <p className="text-sm text-muted-foreground mb-3">Downtime protocol initiated. Curated media:</p>
      <div className="grid grid-cols-1 gap-4">
        {suggestions.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center space-x-3 p-2.5 rounded-lg glassmorphic hover:border-primary/50 transition-all cursor-pointer group"
          >
            <Image src={item.imageUrl} alt={item.title} width={80} height={60} className="rounded-md object-cover border border-primary/10 group-hover:border-primary/30 transition-all" data-ai-hint={item.imageHint} />
            <div className="flex-grow">
              <p className="text-sm font-semibold text-foreground/90 group-hover:text-primary transition-colors">{item.title}</p>
              <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                {platformIcons[item.platform] || <Clapperboard size={14}/>}
                <span className="ml-1.5">{item.platform} - {item.type}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
};

export default EntertainmentWidget;
