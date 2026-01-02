import { Link } from 'react-router-dom';
import { Play, Eye, Lock, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  viewsCount: number;
  createdAt: string;
  isPublic: boolean;
  username: string;
  showPrivacyBadge?: boolean;
}

export function VideoCard({
  id,
  title,
  thumbnailUrl,
  viewsCount,
  createdAt,
  isPublic,
  username,
  showPrivacyBadge = false,
}: VideoCardProps) {
  const formatViews = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Link
      to={`/watch/${id}`}
      className="group block animate-fade-in"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border/50 transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-glow">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-card flex items-center justify-center">
            <Play className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-glow animate-scale-in">
            <Play className="w-8 h-8 text-primary-foreground fill-current ml-1" />
          </div>
        </div>

        {showPrivacyBadge && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
            isPublic ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {isPublic ? 'Public' : 'Private'}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{username}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatViews(viewsCount)} views
          </span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
        </div>
      </div>
    </Link>
  );
}
