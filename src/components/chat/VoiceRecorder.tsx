
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onRecording: (isRecording: boolean) => void;
  onTranscript: (audioBlob: Blob, transcript?: string) => void;
  language: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onRecording, 
  onTranscript, 
  language 
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Send for transcription
        try {
          const transcript = await transcribeAudio(audioBlob, language);
          onTranscript(audioBlob, transcript);
        } catch (error) {
          console.error('Transcription failed:', error);
          onTranscript(audioBlob);
          toast({
            title: t('Transcription failed'),
            description: t('Audio recorded but could not be transcribed'),
            variant: 'destructive',
          });
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
      onRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: t('Recording failed'),
        description: t('Could not access microphone'),
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob, language: string): Promise<string> => {
    // Convert blob to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Call Supabase edge function for transcription
    const response = await fetch('/functions/v1/voice-to-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: base64Audio,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error('Transcription failed');
    }

    const result = await response.json();
    return result.text;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2">
      {isRecording ? (
        <div className="flex items-center space-x-2">
          <Button
            size="icon"
            variant="destructive"
            onClick={stopRecording}
            className="h-9 w-9 animate-pulse"
          >
            <Square className="h-4 w-4" />
          </Button>
          
          <Badge variant="destructive" className="text-xs">
            <MicOff className="h-3 w-3 mr-1" />
            {formatTime(recordingTime)}
          </Badge>
        </div>
      ) : (
        <Button
          size="icon"
          variant="ghost"
          onClick={startRecording}
          className="h-9 w-9"
        >
          <Mic className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
