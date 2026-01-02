import { VideoCard } from './VideoCard';
import { Loader2 } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  views_count: number;
  created_at: string;
  is_public: boolean;
  profiles: {
    username: string;
  };
}

interface VideoGridProps {
  videos: Video[];
  loading: boolean;
  showPrivacyBadge?: boolean;
  emptyMessage?: string;
}

export function VideoGrid({
  videos,
  loading,
  showPrivacyBadge = false,
  emptyMessage = "No videos found",
}: VideoGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video, index) => (
        <div
          key={video.id}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <VideoCard
            id={video.id}
            title={video.title}
            thumbnailUrl={video.thumbnail_url}
            viewsCount={video.views_count}
            createdAt={video.created_at}
            isPublic={video.is_public}
            username={video.profiles.username}
            showPrivacyBadge={showPrivacyBadge}
          />
        </div>
      ))}
    </div>
  );
}
