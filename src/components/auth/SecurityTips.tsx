
import React, { useState } from 'react';
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecurityTipsProps {
  onClose?: () => void;
}

export const SecurityTips: React.FC<SecurityTipsProps> = ({ onClose }) => {
  const [currentTip, setCurrentTip] = useState(0);

  const securityTips = [
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: 'अपना PIN सुरक्षित रखें',
      description: 'अपना PIN किसी के साथ साझा न करें। यह आपकी व्यक्तिगत जानकारी है।',
      visual: '🔒'
    },
    {
      icon: <Eye className="w-8 h-8 text-blue-600" />,
      title: 'PIN टाइप करते समय सावधान रहें',
      description: 'PIN डालते समय यह सुनिश्चित करें कि कोई देख नहीं रहा है।',
      visual: '👀'
    },
    {
      icon: <AlertTriangle className="w-8 h-8 text-orange-600" />,
      title: 'कमजोर PIN से बचें',
      description: '1234, 1111 जैसे आसान PIN का उपयोग न करें।',
      visual: '⚠️'
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      title: 'नियमित रूप से PIN बदलें',
      description: 'बेहतर सुरक्षा के लिए हर 3 महीने में अपना PIN बदलें।',
      visual: '🔄'
    }
  ];

  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % securityTips.length);
  };

  const prevTip = () => {
    setCurrentTip((prev) => (prev - 1 + securityTips.length) % securityTips.length);
  };

  const tip = securityTips[currentTip];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">{tip.visual}</div>
        <div className="flex justify-center mb-3">{tip.icon}</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{tip.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{tip.description}</p>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={prevTip}
          disabled={currentTip === 0}
        >
          पिछला
        </Button>

        <div className="flex gap-2">
          {securityTips.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentTip ? 'bg-green-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {currentTip < securityTips.length - 1 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={nextTip}
          >
            अगला
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onClose}
            className="bg-green-600 hover:bg-green-700"
          >
            समझ गया
          </Button>
        )}
      </div>
    </div>
  );
};
