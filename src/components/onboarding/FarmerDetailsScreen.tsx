
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User } from 'lucide-react';

interface FarmerDetailsScreenProps {
  onNext: (details: any) => void;
  onBack: () => void;
  language: string;
}

const FarmerDetailsScreen: React.FC<FarmerDetailsScreenProps> = ({ onNext, onBack, language }) => {
  const [details, setDetails] = useState({
    full_name: '',
    village: '',
    district: '',
    state: '',
    pincode: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(details);
  };

  const handleChange = (field: string, value: string) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Your Details
          </h1>
          <p className="text-gray-600">
            Tell us about yourself and your farm
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <Input
              type="text"
              value={details.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Village
            </label>
            <Input
              type="text"
              value={details.village}
              onChange={(e) => handleChange('village', e.target.value)}
              placeholder="Enter your village name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              District
            </label>
            <Input
              type="text"
              value={details.district}
              onChange={(e) => handleChange('district', e.target.value)}
              placeholder="Enter your district"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <Input
              type="text"
              value={details.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="Enter your state"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pincode
            </label>
            <Input
              type="text"
              value={details.pincode}
              onChange={(e) => handleChange('pincode', e.target.value)}
              placeholder="Enter pincode"
              maxLength={6}
              required
            />
          </div>

          <div className="space-y-3 pt-4">
            <Button type="submit" className="w-full">
              Continue
            </Button>
            <Button type="button" variant="ghost" onClick={onBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FarmerDetailsScreen;
