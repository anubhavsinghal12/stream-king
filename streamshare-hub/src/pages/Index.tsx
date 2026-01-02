import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { VideoGrid } from '@/components/VideoGrid';
import { supabase } from '@/integrations/supabase/client';

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

const Index = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicVideos();
  }, []);

  const fetchPublicVideos = async () => {
    try {
      const { data, error } = await supabase
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
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to handle the profiles relation
      const transformedData = (data || []).map((video: any) => ({
        ...video,
        profiles: video.profiles || { username: 'Unknown' }
      }));
      
      setVideos(transformedData as Video[]);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Trending <span className="text-gradient">Videos</span>
            </h2>
          </div>
          
          <VideoGrid
            videos={videos}
            loading={loading}
            emptyMessage="No videos yet. Be the first to upload!"
          />
        </section>
      </main>

      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; 2024 StreamVibe. Built for CodeClause Internship.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
