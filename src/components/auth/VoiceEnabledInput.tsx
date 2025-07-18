
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff } from 'lucide-react';

interface VoiceEnabledInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: 'text' | 'tel' | 'password';
  className?: string;
  autoFocus?: boolean;
}

export const VoiceEnabledInput: React.FC<VoiceEnabledInputProps> = ({
  value,
  onChange,
  placeholder,
  maxLength,
  type = 'text',
  className,
  autoFocus
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'hi-IN'; // Default to Hindi, can be made configurable
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Convert spoken numbers to digits for PIN input
        if (type === 'password' || type === 'tel') {
          const digitMap: { [key: string]: string } = {
            'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
            'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
            'शून्य': '0', 'एक': '1', 'दो': '2', 'तीन': '3', 'चार': '4',
            'पांच': '5', 'छह': '6', 'सात': '7', 'आठ': '8', 'नौ': '9'
          };
          
          let processedValue = transcript.toLowerCase();
          Object.keys(digitMap).forEach(word => {
            processedValue = processedValue.replace(new RegExp(word, 'g'), digitMap[word]);
          });
          
          // Extract only digits
          const digits = processedValue.replace(/\D/g, '');
          onChange(digits.substring(0, maxLength || 10));
        } else {
          onChange(transcript);
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [maxLength, onChange, type]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="relative">
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`${className} ${isSupported ? 'pr-12' : ''}`}
        autoFocus={autoFocus}
      />
      {isSupported && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 ${
            isListening ? 'text-red-500 animate-pulse' : 'text-gray-400'
          }`}
          onClick={toggleListening}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
      )}
    </div>
  );
};
