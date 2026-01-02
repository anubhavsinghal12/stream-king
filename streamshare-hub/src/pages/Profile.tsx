import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { VideoGrid } from '@/components/VideoGrid';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Loader2, Video, Upload } from 'lucide-react';

interface ProfileData {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

interface VideoType {
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

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;
  const isOwnProfile = user?.id === targetUserId;

  useEffect(() => {
    if (targetUserId) {
      fetchProfileAndVideos();
    } else if (!userId) {
      navigate('/auth');
    }
  }, [targetUserId, userId]);

  const fetchProfileAndVideos = async () => {
    if (!targetUserId) return;

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch videos
      let query = supabase
        .from('videos')
        .select(`
          id,
          title,
          thumbnail_url,
          views_count,
          created_at,
          is_public,
          profiles (
            username
          )
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      // If not own profile, only show public videos
      if (!isOwnProfile) {
        query = query.eq('is_public', true);
      }

      const { data: videosData, error: videosError } = await query;

      if (videosError) throw videosError;
      
      // Transform the data to handle the profiles relation
      const transformedData = (videosData || []).map((video: any) => ({
        ...video,
        profiles: video.profiles || { username: 'Unknown' }
      }));
      
      setVideos(transformedData as VideoType[]);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
          <p className="text-muted-foreground mb-6">
            This user doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-[hsl(20,90%,60%)] flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-primary-foreground">
                {profile.username.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <p className="text-muted-foreground">
                {videos.length} video{videos.length !== 1 ? 's' : ''}
              </p>
            </div>

            {isOwnProfile && (
              <Button variant="gradient" onClick={() => navigate('/upload')}>
                <Upload className="w-4 h-4" />
                Upload Video
              </Button>
            )}
          </div>
        </div>

        {/* Videos Section */}
        <div>
          <h2 className="text-xl font-bold mb-6">
            {isOwnProfile ? 'My Videos' : `${profile.username}'s Videos`}
          </h2>

          <VideoGrid
            videos={videos}
            loading={false}
            showPrivacyBadge={isOwnProfile}
            emptyMessage={
              isOwnProfile
                ? "You haven't uploaded any videos yet"
                : 'No public videos'
            }
          />

          {isOwnProfile && videos.length === 0 && (
            <div className="text-center mt-8">
              <Button variant="gradient" size="lg" onClick={() => navigate('/upload')}>
                <Video className="w-5 h-5" />
                Upload Your First Video
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
