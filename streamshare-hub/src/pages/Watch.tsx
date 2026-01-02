import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';
import {
  Eye,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Loader2,
  ArrowLeft,
  Lock,
  Trash2,
  Globe,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VideoData {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  views_count: number;
  is_public: boolean;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export default function Watch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (id) {
      fetchVideo();
    }
  }, [id]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const fetchVideo = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('videos')
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Video not found');
        return;
      }

      // Check if video is private and user is not the owner
      if (!data.is_public && data.user_id !== user?.id) {
        setError('This video is private');
        return;
      }

      // Transform data to ensure profiles exists
      const transformedVideo: VideoData = {
        ...data,
        profiles: data.profiles || { username: 'Unknown', avatar_url: null }
      };

      setVideo(transformedVideo);

      // Track view (only once per session)
      const viewKey = `viewed_${id}`;
      if (!sessionStorage.getItem(viewKey)) {
        await supabase.from('video_views').insert({
          video_id: id,
          viewer_id: user?.id || null,
        });
        sessionStorage.setItem(viewKey, 'true');
      }
    } catch (err: any) {
      console.error('Error fetching video:', err);
      setError('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDelete = async () => {
    if (!video || !user) return;

    try {
      const { error: deleteError } = await supabase.from('videos').delete().eq('id', video.id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Video deleted',
        description: 'Your video has been deleted successfully.',
      });

      navigate('/profile');
    } catch (err: any) {
      toast({
        title: 'Delete failed',
        description: err.message || 'Failed to delete video.',
        variant: 'destructive',
      });
    }
  };

  const togglePrivacy = async () => {
    if (!video || !user) return;

    try {
      const { error: updateError } = await supabase
        .from('videos')
        .update({ is_public: !video.is_public })
        .eq('id', video.id);

      if (updateError) throw updateError;

      setVideo({ ...video, is_public: !video.is_public });

      toast({
        title: 'Privacy updated',
        description: `Video is now ${!video.is_public ? 'public' : 'private'}.`,
      });
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message || 'Failed to update privacy.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{error || 'Video not found'}</h2>
          <p className="text-muted-foreground mb-6">
            This video may be private or no longer exists.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === video.user_id;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-4">
            <div
              className="relative aspect-video rounded-xl overflow-hidden bg-card group"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => isPlaying && setShowControls(false)}
            >
              <video
                ref={videoRef}
                src={video.video_url}
                poster={video.thumbnail_url || undefined}
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration);
                  }
                }}
                onClick={handlePlayPause}
              />

              {/* Play/Pause Overlay */}
              {!isPlaying && (
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-background/40"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                    <Play className="w-10 h-10 text-primary-foreground fill-current ml-1" />
                  </div>
                </button>
              )}

              {/* Controls */}
              <div
                className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent transition-opacity duration-300 ${
                  showControls ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Progress Bar */}
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 mb-3 appearance-none bg-muted rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handlePlayPause}
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={handleMuteToggle}
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                    </button>
                    <span className="text-sm text-foreground">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  <button
                    onClick={handleFullscreen}
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    <Maximize className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{video.title}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {video.views_count} views
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                    </span>
                    {!video.is_public && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-yellow-500">
                          <Lock className="w-3 h-3" />
                          Private
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={togglePrivacy}>
                      {video.is_public ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Video</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this video? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>

              <div className="glass rounded-xl p-4">
                <Link
                  to={`/profile/${video.user_id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-bold text-primary">
                      {video.profiles.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{video.profiles.username}</span>
                </Link>

                {video.description && (
                  <p className="mt-4 text-muted-foreground whitespace-pre-wrap">
                    {video.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Related Videos (placeholder) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">More Videos</h3>
            <p className="text-muted-foreground text-sm">
              Explore more content from the community.
            </p>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Browse All Videos
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
