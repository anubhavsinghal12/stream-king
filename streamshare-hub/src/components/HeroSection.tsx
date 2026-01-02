import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Upload } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-surface" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-30">
        <div className="absolute inset-0 rounded-full bg-gradient-radial from-primary/20 via-primary/5 to-transparent blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-slide-up">
            Share Your Story with{' '}
            <span className="text-gradient">StreamVibe</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Upload, share, and discover amazing videos from creators around the world.
            Your platform for creativity and connection.
          </p>

          <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {user ? (
              <Button
                variant="gradient"
                size="lg"
                onClick={() => navigate('/upload')}
                className="shadow-glow"
              >
                <Upload className="w-5 h-5" />
                Upload Video
              </Button>
            ) : (
              <>
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={() => navigate('/auth?mode=signup')}
                  className="shadow-glow"
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/auth')}
                >
                  <Play className="w-5 h-5" />
                  Sign In
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gradient">10K+</div>
              <div className="text-sm text-muted-foreground">Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gradient">50K+</div>
              <div className="text-sm text-muted-foreground">Creators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gradient">1M+</div>
              <div className="text-sm text-muted-foreground">Views</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
