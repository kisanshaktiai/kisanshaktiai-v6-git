
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { setProfile } from '@/store/slices/farmerSlice';
import { setOnboardingCompleted } from '@/store/slices/authSlice';
import { 
  User, 
  Home, 
  Sprout, 
  Tractor, 
  IndianRupee, 
  Phone, 
  ChevronLeft, 
  ChevronRight,
  MapPin,
  Calendar,
  Users,
  Wheat,
  Droplets,
  Gauge,
  Award,
  CheckCircle
} from 'lucide-react';

interface FormStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  fields: string[];
}

const formSteps: FormStep[] = [
  {
    id: 'personal',
    title: 'व्यक्तिगत जानकारी',
    subtitle: 'Personal Information',
    icon: User,
    fields: ['fullName', 'age', 'gender', 'education', 'familyMembers']
  },
  {
    id: 'location',
    title: 'स्थान की जानकारी',
    subtitle: 'Location Details',
    icon: MapPin,
    fields: ['village', 'taluka', 'district', 'state', 'pincode']
  },
  {
    id: 'farm',
    title: 'खेत की जानकारी',
    subtitle: 'Farm Information',
    icon: Home,
    fields: ['totalLand', 'ownedLand', 'leasedLand', 'soilType', 'waterSource']
  },
  {
    id: 'crops',
    title: 'फसल की जानकारी',
    subtitle: 'Crop Information',
    icon: Sprout,
    fields: ['primaryCrops', 'secondaryCrops', 'farmingExperience', 'farmingType']
  },
  {
    id: 'resources',
    title: 'संसाधन और उपकरण',
    subtitle: 'Resources & Equipment',
    icon: Tractor,
    fields: ['hasTractor', 'hasIrrigation', 'irrigationType', 'hasStorage', 'equipment']
  },
  {
    id: 'financial',
    title: 'आर्थिक जानकारी',
    subtitle: 'Financial Information',
    icon: IndianRupee,
    fields: ['annualIncome', 'hasLoan', 'loanAmount', 'hasInsurance', 'bankAccount']
  }
];

interface ProfileFormData {
  // Personal Information
  fullName: string;
  age: string;
  gender: string;
  education: string;
  familyMembers: string;
  
  // Location
  village: string;
  taluka: string;
  district: string;
  state: string;
  pincode: string;
  
  // Farm Details
  totalLand: string;
  ownedLand: string;
  leasedLand: string;
  soilType: string;
  waterSource: string;
  
  // Crops
  primaryCrops: string[];
  secondaryCrops: string[];
  farmingExperience: string;
  farmingType: string;
  
  // Resources
  hasTractor: boolean;
  hasIrrigation: boolean;
  irrigationType: string;
  hasStorage: boolean;
  equipment: string[];
  
  // Financial
  annualIncome: string;
  hasLoan: boolean;
  loanAmount: string;
  hasInsurance: boolean;
  bankAccount: boolean;
}

export const ProfessionalFarmerProfileForm: React.FC<{
  onComplete: () => void;
  onBack: () => void;
}> = ({ onComplete, onBack }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    age: '',
    gender: '',
    education: '',
    familyMembers: '',
    village: '',
    taluka: '',
    district: '',
    state: '',
    pincode: '',
    totalLand: '',
    ownedLand: '',
    leasedLand: '',
    soilType: '',
    waterSource: '',
    primaryCrops: [],
    secondaryCrops: [],
    farmingExperience: '',
    farmingType: '',
    hasTractor: false,
    hasIrrigation: false,
    irrigationType: '',
    hasStorage: false,
    equipment: [],
    annualIncome: '',
    hasLoan: false,
    loanAmount: '',
    hasInsurance: false,
    bankAccount: false
  });

  const currentStepData = formSteps[currentStep];
  const progress = ((currentStep + 1) / formSteps.length) * 100;

  const handleInputChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: keyof ProfileFormData, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[];
      if (checked) {
        return {
          ...prev,
          [field]: [...currentArray, value]
        };
      } else {
        return {
          ...prev,
          [field]: currentArray.filter(item => item !== value)
        };
      }
    });
  };

  const isStepValid = () => {
    const requiredFields = currentStepData.fields;
    return requiredFields.every(field => {
      const value = formData[field as keyof ProfileFormData];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== '' && value !== undefined && value !== null;
    });
  };

  const handleNext = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const profile = {
        id: `farmer_${Date.now()}`,
        name: formData.fullName,
        age: parseInt(formData.age) || null,
        gender: formData.gender,
        education_level: formData.education,
        family_members: parseInt(formData.familyMembers) || null,
        village: formData.village,
        taluka: formData.taluka,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        total_land_acres: parseFloat(formData.totalLand) || null,
        owned_land_acres: parseFloat(formData.ownedLand) || null,
        leased_land_acres: parseFloat(formData.leasedLand) || null,
        soil_type: formData.soilType,
        water_source: formData.waterSource,
        primary_crops: formData.primaryCrops,
        secondary_crops: formData.secondaryCrops,
        farming_experience_years: parseInt(formData.farmingExperience) || null,
        farming_type: formData.farmingType,
        has_tractor: formData.hasTractor,
        has_irrigation: formData.hasIrrigation,
        irrigation_type: formData.irrigationType,
        has_storage: formData.hasStorage,
        equipment: formData.equipment,
        annual_income_range: formData.annualIncome,
        has_loan: formData.hasLoan,
        loan_amount: parseFloat(formData.loanAmount) || null,
        has_insurance: formData.hasInsurance,
        has_bank_account: formData.bankAccount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      dispatch(setProfile(profile as any));
      dispatch(setOnboardingCompleted());
      onComplete();
    } catch (error) {
      console.error('Profile completion error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const StepIcon = currentStepData.icon;
    
    switch (currentStepData.id) {
      case 'personal':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <StepIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{currentStepData.title}</h2>
              <p className="text-sm text-gray-600">{currentStepData.subtitle}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                पूरा नाम / Full Name *
              </label>
              <Input
                type="text"
                placeholder="अपना पूरा नाम दर्ज करें"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="text-center"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  उम्र / Age *
                </label>
                <Input
                  type="number"
                  placeholder="उम्र"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  लिंग / Gender *
                </label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="चुनें" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">पुरुष / Male</SelectItem>
                    <SelectItem value="female">महिला / Female</SelectItem>
                    <SelectItem value="other">अन्य / Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                शिक्षा / Education Level *
              </label>
              <Select value={formData.education} onValueChange={(value) => handleInputChange('education', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="शिक्षा का स्तर चुनें" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_formal_education">औपचारिक शिक्षा नहीं</SelectItem>
                  <SelectItem value="primary">प्राथमिक (1-5)</SelectItem>
                  <SelectItem value="middle">मध्यम (6-8)</SelectItem>
                  <SelectItem value="secondary">माध्यमिक (9-10)</SelectItem>
                  <SelectItem value="higher_secondary">उच्च माध्यमिक (11-12)</SelectItem>
                  <SelectItem value="graduation">स्नातक</SelectItem>
                  <SelectItem value="post_graduation">स्नातकोत्तर</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                परिवार के सदस्य / Family Members *
              </label>
              <Input
                type="number"
                placeholder="परिवार में कितने सदस्य हैं?"
                value={formData.familyMembers}
                onChange={(e) => handleInputChange('familyMembers', e.target.value)}
                className="text-center"
              />
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <StepIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{currentStepData.title}</h2>
              <p className="text-sm text-gray-600">{currentStepData.subtitle}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                गाँव / Village *
              </label>
              <Input
                type="text"
                placeholder="अपना गाँव का नाम दर्ज करें"
                value={formData.village}
                onChange={(e) => handleInputChange('village', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  तालुका / Taluka *
                </label>
                <Input
                  type="text"
                  placeholder="तालुका"
                  value={formData.taluka}
                  onChange={(e) => handleInputChange('taluka', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  जिला / District *
                </label>
                <Input
                  type="text"
                  placeholder="जिला"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  राज्य / State *
                </label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="राज्य चुनें" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="andhra_pradesh">आंध्र प्रदेश</SelectItem>
                    <SelectItem value="bihar">बिहार</SelectItem>
                    <SelectItem value="gujarat">गुजरात</SelectItem>
                    <SelectItem value="haryana">हरियाणा</SelectItem>
                    <SelectItem value="karnataka">कर्नाटक</SelectItem>
                    <SelectItem value="madhya_pradesh">मध्य प्रदेश</SelectItem>
                    <SelectItem value="maharashtra">महाराष्ट्र</SelectItem>
                    <SelectItem value="punjab">पंजाब</SelectItem>
                    <SelectItem value="rajasthan">राजस्थान</SelectItem>
                    <SelectItem value="tamil_nadu">तमिल नाडु</SelectItem>
                    <SelectItem value="telangana">तेलंगाना</SelectItem>
                    <SelectItem value="uttar_pradesh">उत्तर प्रदेश</SelectItem>
                    <SelectItem value="west_bengal">पश्चिम बंगाल</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  पिन कोड / PIN Code *
                </label>
                <Input
                  type="text"
                  placeholder="123456"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>
          </div>
        );

      case 'farm':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <StepIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{currentStepData.title}</h2>
              <p className="text-sm text-gray-600">{currentStepData.subtitle}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                कुल जमीन (एकड़ में) / Total Land (in Acres) *
              </label>
              <Input
                type="number"
                placeholder="0.0"
                value={formData.totalLand}
                onChange={(e) => handleInputChange('totalLand', e.target.value)}
                step="0.1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  अपनी जमीन (एकड़) *
                </label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={formData.ownedLand}
                  onChange={(e) => handleInputChange('ownedLand', e.target.value)}
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  किराए की जमीन (एकड़) *
                </label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={formData.leasedLand}
                  onChange={(e) => handleInputChange('leasedLand', e.target.value)}
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                मिट्टी का प्रकार / Soil Type *
              </label>
              <Select value={formData.soilType} onValueChange={(value) => handleInputChange('soilType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="मिट्टी का प्रकार चुनें" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clay">चिकनी मिट्टी / Clay</SelectItem>
                  <SelectItem value="sandy">रेतीली मिट्टी / Sandy</SelectItem>
                  <SelectItem value="loamy">दोमट मिट्टी / Loamy</SelectItem>
                  <SelectItem value="black_cotton">काली कपासी मिट्टी / Black Cotton</SelectItem>
                  <SelectItem value="red_laterite">लाल लेटराइट मिट्टी / Red Laterite</SelectItem>
                  <SelectItem value="alluvial">जलोढ़ मिट्टी / Alluvial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                पानी का स्रोत / Water Source *
              </label>
              <Select value={formData.waterSource} onValueChange={(value) => handleInputChange('waterSource', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="पानी का स्रोत चुनें" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="borewell">बोरवेल / Borewell</SelectItem>
                  <SelectItem value="well">कुआं / Well</SelectItem>
                  <SelectItem value="canal">नहर / Canal</SelectItem>
                  <SelectItem value="river">नदी / River</SelectItem>
                  <SelectItem value="pond">तालाब / Pond</SelectItem>
                  <SelectItem value="rainwater">बारिश का पानी / Rainwater</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      // Add more cases for other steps...
      default:
        return <div>Step content for {currentStepData.id}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Progress Header */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              चरण {currentStep + 1} का {formSteps.length}
            </span>
            <Badge variant="outline" className="text-green-600 border-green-200">
              {Math.round(progress)}% पूर्ण
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="mb-4 shadow-lg">
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? onBack : handlePrev}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            वापस
          </Button>

          {currentStep < formSteps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1"
            >
              आगे
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!isStepValid() || loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  पूर्ण कर रहे हैं...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  प्रोफाइल पूर्ण करें
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
