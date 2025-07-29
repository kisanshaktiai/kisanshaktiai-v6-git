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

const getFormSteps = (t: any): FormStep[] => [
  {
    id: 'personal',
    title: t('forms.personalInfo.title'),
    subtitle: t('forms.personalInfo.subtitle'),
    icon: User,
    fields: ['fullName', 'age', 'gender', 'education', 'familyMembers']
  },
  {
    id: 'location',
    title: t('forms.locationInfo.title'),
    subtitle: t('forms.locationInfo.subtitle'),
    icon: MapPin,
    fields: ['village', 'taluka', 'district', 'state', 'pincode']
  },
  {
    id: 'farm',
    title: t('forms.farmInfo.title'),
    subtitle: t('forms.farmInfo.subtitle'),
    icon: Home,
    fields: ['totalLand', 'ownedLand', 'leasedLand', 'soilType', 'waterSource']
  },
  {
    id: 'crops',
    title: t('forms.cropInfo.title'),
    subtitle: t('forms.cropInfo.subtitle'),
    icon: Sprout,
    fields: ['primaryCrops', 'secondaryCrops', 'farmingExperience', 'farmingType']
  },
  {
    id: 'resources',
    title: t('forms.resources.title'),
    subtitle: t('forms.resources.subtitle'),
    icon: Tractor,
    fields: ['hasTractor', 'hasIrrigation', 'irrigationType', 'hasStorage', 'equipment']
  },
  {
    id: 'financial',
    title: t('forms.financial.title'),
    subtitle: t('forms.financial.subtitle'),
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
  
  const formSteps = getFormSteps(t);
  
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
                {t('forms.personalInfo.fullName')} *
              </label>
              <Input
                type="text"
                placeholder={t('forms.personalInfo.fullNamePlaceholder')}
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="text-center"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('forms.personalInfo.age')} *
                </label>
                <Input
                  type="number"
                  placeholder={t('forms.personalInfo.agePlaceholder')}
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('forms.personalInfo.gender')} *
                </label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('forms.personalInfo.genderPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('forms.personalInfo.male')}</SelectItem>
                    <SelectItem value="female">{t('forms.personalInfo.female')}</SelectItem>
                    <SelectItem value="other">{t('forms.personalInfo.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forms.personalInfo.education')} *
              </label>
              <Select value={formData.education} onValueChange={(value) => handleInputChange('education', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('forms.personalInfo.educationPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_formal_education">{t('agriculture.education.noFormalEducation')}</SelectItem>
                  <SelectItem value="primary">{t('agriculture.education.primary')}</SelectItem>
                  <SelectItem value="middle">{t('agriculture.education.middle')}</SelectItem>
                  <SelectItem value="secondary">{t('agriculture.education.secondary')}</SelectItem>
                  <SelectItem value="higher_secondary">{t('agriculture.education.higherSecondary')}</SelectItem>
                  <SelectItem value="graduation">{t('agriculture.education.graduation')}</SelectItem>
                  <SelectItem value="post_graduation">{t('agriculture.education.postGraduation')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forms.personalInfo.familyMembers')} *
              </label>
              <Input
                type="number"
                placeholder={t('forms.personalInfo.familyMembersPlaceholder')}
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
                {t('forms.locationInfo.village')} *
              </label>
              <Input
                type="text"
                placeholder={t('forms.locationInfo.villagePlaceholder')}
                value={formData.village}
                onChange={(e) => handleInputChange('village', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('forms.locationInfo.taluka')} *
                </label>
                <Input
                  type="text"
                  placeholder={t('forms.locationInfo.talukaPlaceholder')}
                  value={formData.taluka}
                  onChange={(e) => handleInputChange('taluka', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('forms.locationInfo.district')} *
                </label>
                <Input
                  type="text"
                  placeholder={t('forms.locationInfo.districtPlaceholder')}
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('forms.locationInfo.state')} *
                </label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('forms.locationInfo.statePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="andhra_pradesh">{t('agriculture.states.andhraPradesh')}</SelectItem>
                    <SelectItem value="bihar">{t('agriculture.states.bihar')}</SelectItem>
                    <SelectItem value="gujarat">{t('agriculture.states.gujarat')}</SelectItem>
                    <SelectItem value="haryana">{t('agriculture.states.haryana')}</SelectItem>
                    <SelectItem value="karnataka">{t('agriculture.states.karnataka')}</SelectItem>
                    <SelectItem value="madhya_pradesh">{t('agriculture.states.madhyaPradesh')}</SelectItem>
                    <SelectItem value="maharashtra">{t('agriculture.states.maharashtra')}</SelectItem>
                    <SelectItem value="punjab">{t('agriculture.states.punjab')}</SelectItem>
                    <SelectItem value="rajasthan">{t('agriculture.states.rajasthan')}</SelectItem>
                    <SelectItem value="tamil_nadu">{t('agriculture.states.tamilNadu')}</SelectItem>
                    <SelectItem value="telangana">{t('agriculture.states.telangana')}</SelectItem>
                    <SelectItem value="uttar_pradesh">{t('agriculture.states.uttarPradesh')}</SelectItem>
                    <SelectItem value="west_bengal">{t('agriculture.states.westBengal')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('forms.locationInfo.pincode')} *
                </label>
                <Input
                  type="text"
                  placeholder={t('forms.locationInfo.pincodePlaceholder')}
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
                {t('forms.farmInfo.totalLand')} *
              </label>
              <Input
                type="number"
                placeholder={t('forms.farmInfo.totalLandPlaceholder')}
                value={formData.totalLand}
                onChange={(e) => handleInputChange('totalLand', e.target.value)}
                step="0.1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('forms.farmInfo.ownedLand')} *
                </label>
                <Input
                  type="number"
                  placeholder={t('forms.farmInfo.ownedLandPlaceholder')}
                  value={formData.ownedLand}
                  onChange={(e) => handleInputChange('ownedLand', e.target.value)}
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('forms.farmInfo.leasedLand')} *
                </label>
                <Input
                  type="number"
                  placeholder={t('forms.farmInfo.leasedLandPlaceholder')}
                  value={formData.leasedLand}
                  onChange={(e) => handleInputChange('leasedLand', e.target.value)}
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forms.farmInfo.soilType')} *
              </label>
              <Select value={formData.soilType} onValueChange={(value) => handleInputChange('soilType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('forms.farmInfo.soilTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alluvial">{t('agriculture.soilTypes.alluvial')}</SelectItem>
                  <SelectItem value="black">{t('agriculture.soilTypes.black')}</SelectItem>
                  <SelectItem value="red">{t('agriculture.soilTypes.red')}</SelectItem>
                  <SelectItem value="laterite">{t('agriculture.soilTypes.laterite')}</SelectItem>
                  <SelectItem value="mountain">{t('agriculture.soilTypes.mountain')}</SelectItem>
                  <SelectItem value="desert">{t('agriculture.soilTypes.desert')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forms.farmInfo.waterSource')} *
              </label>
              <Select value={formData.waterSource} onValueChange={(value) => handleInputChange('waterSource', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('forms.farmInfo.waterSourcePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="borewell">{t('agriculture.waterSources.borewell')}</SelectItem>
                  <SelectItem value="tubewell">{t('agriculture.waterSources.tubewell')}</SelectItem>
                  <SelectItem value="canal">{t('agriculture.waterSources.canal')}</SelectItem>
                  <SelectItem value="river">{t('agriculture.waterSources.river')}</SelectItem>
                  <SelectItem value="pond">{t('agriculture.waterSources.pond')}</SelectItem>
                  <SelectItem value="rainwater">{t('agriculture.waterSources.rainwater')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      // Add more cases for other steps...
      default:
        return <div>{t('forms.validation.required')}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Progress Header */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t('forms.navigation.step', { current: currentStep + 1, total: formSteps.length })}
            </span>
            <Badge variant="outline" className="text-green-600 border-green-200">
              {Math.round(progress)}% {t('forms.navigation.completePercent')}
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
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('forms.navigation.previous')}
          </Button>
          
          {currentStep === formSteps.length - 1 ? (
            <Button 
              onClick={handleComplete}
              disabled={!isStepValid() || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Gauge className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('forms.navigation.complete')}
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1"
            >
              {t('forms.navigation.next')}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};