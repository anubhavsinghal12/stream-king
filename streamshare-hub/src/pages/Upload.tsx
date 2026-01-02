import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload as UploadIcon, Video, Image, Loader2, Globe, Lock } from 'lucide-react';

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a video file',
          variant: 'destructive',
        });
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to upload videos',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!videoFile) {
      toast({
        title: 'No video selected',
        description: 'Please select a video to upload',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your video',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload video
      const videoFileName = `${user.id}/${Date.now()}-${videoFile.name}`;
      setUploadProgress(20);
      
      const { data: videoData, error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, videoFile);

      if (videoError) throw videoError;
      setUploadProgress(60);

      const { data: videoUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(videoFileName);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbnailFileName = `${user.id}/${Date.now()}-${thumbnailFile.name}`;
        
        const { error: thumbnailError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailFileName, thumbnailFile);

        if (thumbnailError) throw thumbnailError;
        setUploadProgress(80);

        const { data: thumbnailUrlData } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(thumbnailFileName);

        thumbnailUrl = thumbnailUrlData.publicUrl;
      }

      // Create video record
      const { data: video, error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          video_url: videoUrlData.publicUrl,
          thumbnail_url: thumbnailUrl,
          is_public: isPublic,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      setUploadProgress(100);

      toast({
        title: 'Video uploaded!',
        description: 'Your video has been uploaded successfully.',
      });

      navigate(`/watch/${video.id}`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload video. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">
          Upload <span className="text-gradient">Video</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Video Upload */}
          <div className="glass rounded-2xl p-6">
            <Label className="text-lg font-medium mb-4 block">Video File</Label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="hidden"
            />
            
            {videoPreview ? (
              <div className="space-y-4">
                <video
                  src={videoPreview}
                  controls
                  className="w-full rounded-xl aspect-video bg-card"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                >
                  Change Video
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-4 bg-card/50"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Video className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Click to upload video</p>
                  <p className="text-sm text-muted-foreground">MP4, WebM, MOV up to 100MB</p>
                </div>
              </button>
            )}
          </div>

          {/* Thumbnail Upload */}
          <div className="glass rounded-2xl p-6">
            <Label className="text-lg font-medium mb-4 block">Thumbnail (Optional)</Label>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="hidden"
            />
            
            <div className="grid md:grid-cols-2 gap-4">
              {thumbnailPreview ? (
                <div className="space-y-4">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full rounded-xl aspect-video object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    Change Thumbnail
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 bg-card/50"
                >
                  <Image className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Add thumbnail</p>
                </button>
              )}
            </div>
          </div>

          {/* Video Details */}
          <div className="glass rounded-2xl p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your video"
                rows={4}
                maxLength={1000}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-card">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="w-5 h-5 text-green-500" />
                ) : (
                  <Lock className="w-5 h-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium">{isPublic ? 'Public' : 'Private'}</p>
                  <p className="text-sm text-muted-foreground">
                    {isPublic
                      ? 'Anyone can watch this video'
                      : 'Only you can watch this video'}
                  </p>
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={uploading || !videoFile}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading... {uploadProgress}%
                </>
              ) : (
                <>
                  <UploadIcon className="w-4 h-4" />
                  Upload Video
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
