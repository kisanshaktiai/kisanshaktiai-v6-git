
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onUpload: (file: File, description?: string) => void;
  onClose: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, onClose }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: t('File too large'),
          description: t('Please select an image smaller than 10MB'),
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      toast({
        title: t('Camera access denied'),
        description: t('Please allow camera access to take photos'),
        variant: 'destructive',
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            setSelectedFile(file);
            setPreview(canvas.toDataURL());
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile, description);
      onClose();
    }
  };

  const commonQuestions = [
    { 
      key: 'disease',
      text: t('What disease is this?'),
      hi: 'यह कौन सा रोग है?'
    },
    { 
      key: 'pest',
      text: t('What pest is this?'),
      hi: 'यह कौन सा कीट है?'
    },
    { 
      key: 'deficiency',
      text: t('What nutrient deficiency is this?'),
      hi: 'यह कौन सी पोषक तत्व की कमी है?'
    },
    { 
      key: 'stage',
      text: t('What growth stage is this?'),
      hi: 'यह कौन सा बढ़वार का चरण है?'
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">{t('Upload Image')}</CardTitle>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isCapturing ? (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex space-x-2">
                <Button onClick={capturePhoto} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  {t('Capture')}
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  {t('Cancel')}
                </Button>
              </div>
            </div>
          ) : preview ? (
            <div className="space-y-4">
              <img src={preview} alt="Preview" className="w-full rounded-lg" />
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('Description (optional)')}</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('Describe what you want to know about this image')}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('Quick questions')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {commonQuestions.map((q) => (
                    <Button
                      key={q.key}
                      variant="outline"
                      size="sm"
                      onClick={() => setDescription(q.text)}
                      className="text-xs h-8"
                    >
                      {q.text}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleUpload} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  {t('Send')}
                </Button>
                <Button variant="outline" onClick={() => {
                  setSelectedFile(null);
                  setPreview('');
                  setDescription('');
                }}>
                  {t('Change')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-6 w-6 mb-2" />
                  {t('Upload')}
                </Button>
                
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={startCamera}
                >
                  <Camera className="h-6 w-6 mb-2" />
                  {t('Camera')}
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="text-xs text-muted-foreground text-center">
                {t('Supported formats: JPG, PNG, WebP (max 10MB)')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
