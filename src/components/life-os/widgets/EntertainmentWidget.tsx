import WidgetCard from "./WidgetCard";
import { PlayCircle, Music, Film } from "lucide-react";
import Image from "next/image";

const EntertainmentWidget = () => {
  const suggestions = [
    { platform: "Spotify", type: "Playlist", title: "Chill Vibes", imageHint: "abstract music" , imageUrl: "https://placehold.co/100x100.png" },
    { platform: "Netflix", type: "Movie", title: "The Cosmic Adventure", imageHint: "space movie", imageUrl: "https://placehold.co/100x100.png" },
    { platform: "YouTube", type: "Video", title: "Learn Coding in 10 Mins", imageHint: "code tutorial", imageUrl: "https://placehold.co/100x100.png" },
  ];

  return (
    <WidgetCard title="Entertainment Curator" icon={<PlayCircle />}>
      <p className="text-sm text-muted-foreground mb-3">Feeling stressed? Try these suggestions for your 30 min break.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {suggestions.map((item, index) => (
          <div key={index} className="flex flex-col items-center text-center p-2 rounded-md hover:bg-muted/50 transition-colors">
            <Image src={item.imageUrl} alt={item.title} width={64} height={64} className="rounded-md mb-2" data-ai-hint={item.imageHint} />
            <p className="text-xs font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.platform} - {item.type}</p>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
};

export default EntertainmentWidget;
