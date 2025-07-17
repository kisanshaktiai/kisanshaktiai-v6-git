import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileBarChart, 
  Download, 
  Share2, 
  Calendar,
  FileText,
  PieChart,
  BarChart3,
  DollarSign,
  Send,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  sections: string[];
  format: 'pdf' | 'excel' | 'summary';
  frequency?: 'monthly' | 'seasonal' | 'yearly';
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  status: 'generating' | 'completed' | 'failed';
  size: string;
  downloadUrl?: string;
}

export const ReportGeneration: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useSelector((state: RootState) => state.farmer);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState<GeneratedReport[]>([
    {
      id: '1',
      name: 'Financial Summary - Q4 2024',
      type: 'Financial Report',
      generatedAt: '2024-01-15',
      status: 'completed',
      size: '2.3 MB',
      downloadUrl: '#'
    },
    {
      id: '2', 
      name: 'Crop Performance Analysis',
      type: 'Performance Report',
      generatedAt: '2024-01-10',
      status: 'completed',
      size: '1.8 MB',
      downloadUrl: '#'
    },
    {
      id: '3',
      name: 'Seasonal Report - Rabi 2023',
      type: 'Seasonal Report',
      generatedAt: '2024-01-05',
      status: 'generating',
      size: '-'
    }
  ]);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'financial',
      name: t('reports.financialReport', 'Financial Report'),
      description: t('reports.financialDesc', 'Income, expenses, and profitability analysis'),
      icon: DollarSign,
      sections: ['income_analysis', 'expense_breakdown', 'profit_trends', 'roi_calculation'],
      format: 'pdf',
      frequency: 'monthly'
    },
    {
      id: 'crop_performance',
      name: t('reports.cropPerformance', 'Crop Performance Report'),
      description: t('reports.cropPerformanceDesc', 'Yield analysis and crop productivity metrics'),
      icon: BarChart3,
      sections: ['yield_analysis', 'growth_tracking', 'seasonal_comparison', 'predictions'],
      format: 'pdf',
      frequency: 'seasonal'
    },
    {
      id: 'resource_utilization',
      name: t('reports.resourceReport', 'Resource Utilization Report'),
      description: t('reports.resourceDesc', 'Water, fertilizer, and labor efficiency analysis'),
      icon: PieChart,
      sections: ['water_usage', 'fertilizer_efficiency', 'labor_analysis', 'wastage_report'],
      format: 'excel'
    },
    {
      id: 'tax_ready',
      name: t('reports.taxReport', 'Tax-Ready Financial Statement'),
      description: t('reports.taxDesc', 'Government compliant financial documentation'),
      icon: FileText,
      sections: ['income_statement', 'expense_categories', 'depreciation', 'tax_deductions'],
      format: 'pdf'
    },
    {
      id: 'bank_loan',
      name: t('reports.loanReport', 'Bank Loan Application Report'),
      description: t('reports.loanDesc', 'Financial stability and business viability documentation'),
      icon: FileBarChart,
      sections: ['financial_summary', 'asset_valuation', 'cash_flow', 'business_plan'],
      format: 'pdf'
    },
    {
      id: 'scheme_compliance',
      name: t('reports.schemeReport', 'Government Scheme Compliance'),
      description: t('reports.schemeDesc', 'Documentation for government subsidies and schemes'),
      icon: CheckCircle,
      sections: ['land_records', 'crop_details', 'input_usage', 'compliance_checklist'],
      format: 'pdf'
    }
  ];

  const reportSections = {
    income_analysis: t('reports.incomeAnalysis', 'Income Analysis'),
    expense_breakdown: t('reports.expenseBreakdown', 'Expense Breakdown'),
    profit_trends: t('reports.profitTrends', 'Profit Trends'),
    roi_calculation: t('reports.roiCalculation', 'ROI Calculation'),
    yield_analysis: t('reports.yieldAnalysis', 'Yield Analysis'),
    growth_tracking: t('reports.growthTracking', 'Growth Tracking'),
    seasonal_comparison: t('reports.seasonalComparison', 'Seasonal Comparison'),
    predictions: t('reports.predictions', 'Yield Predictions'),
    water_usage: t('reports.waterUsage', 'Water Usage'),
    fertilizer_efficiency: t('reports.fertilizerEfficiency', 'Fertilizer Efficiency'),
    labor_analysis: t('reports.laborAnalysis', 'Labor Analysis'),
    wastage_report: t('reports.wastageReport', 'Wastage Report'),
    income_statement: t('reports.incomeStatement', 'Income Statement'),
    expense_categories: t('reports.expenseCategories', 'Expense Categories'),
    depreciation: t('reports.depreciation', 'Depreciation'),
    tax_deductions: t('reports.taxDeductions', 'Tax Deductions'),
    financial_summary: t('reports.financialSummary', 'Financial Summary'),
    asset_valuation: t('reports.assetValuation', 'Asset Valuation'),
    cash_flow: t('reports.cashFlow', 'Cash Flow'),
    business_plan: t('reports.businessPlan', 'Business Plan'),
    land_records: t('reports.landRecords', 'Land Records'),
    crop_details: t('reports.cropDetails', 'Crop Details'),
    input_usage: t('reports.inputUsage', 'Input Usage'),
    compliance_checklist: t('reports.complianceChecklist', 'Compliance Checklist')
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate || !selectedPeriod) return;
    
    setGenerating(true);
    
    try {
      // Create report generation request
      const { data, error } = await supabase
        .from('analytics_reports')
        .insert({
          farmer_id: profile?.id,
          tenant_id: profile?.tenant_id || '',
          report_type: selectedTemplate,
          report_period: selectedPeriod,
          start_date: getStartDate(selectedPeriod),
          end_date: new Date().toISOString().split('T')[0],
          report_data: {
            sections: selectedSections,
            template: selectedTemplate,
            generated_by: 'user_request'
          },
          status: 'generating'
        });

      if (error) throw error;

      // Add to local reports list
      const newReport: GeneratedReport = {
        id: (data && data[0]?.id) || Date.now().toString(),
        name: `${reportTemplates.find(t => t.id === selectedTemplate)?.name} - ${selectedPeriod}`,
        type: reportTemplates.find(t => t.id === selectedTemplate)?.name || 'Report',
        generatedAt: new Date().toISOString().split('T')[0],
        status: 'generating',
        size: '-'
      };

      setReports(prev => [newReport, ...prev]);

      // Simulate report generation
      setTimeout(() => {
        setReports(prev => prev.map(report => 
          report.id === newReport.id 
            ? { ...report, status: 'completed' as const, size: '2.1 MB', downloadUrl: '#' }
            : report
        ));
      }, 3000);

    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
      setSelectedTemplate('');
      setSelectedPeriod('');
      setSelectedSections([]);
    }
  };

  const getStartDate = (period: string): string => {
    const now = new Date();
    switch (period) {
      case 'last_month':
        return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      case 'last_quarter':
        return new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];
      case 'last_year':
        return new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
      default:
        return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'generating':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedTemplateData = reportTemplates.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('analytics.reportGeneration', 'Report Generation')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('analytics.generateCustomReports', 'Generate custom reports for various purposes')}
          </p>
        </div>
        <Button variant="outline">
          <Calendar className="w-4 h-4 mr-2" />
          {t('analytics.scheduleReports', 'Schedule Reports')}
        </Button>
      </div>

      {/* Report Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.createNewReport', 'Create New Report')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              {t('analytics.selectTemplate', 'Select Report Template')}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setSelectedSections(template.sections);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className="w-6 h-6 text-blue-500 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="secondary">{template.format.toUpperCase()}</Badge>
                          {template.frequency && (
                            <Badge variant="outline">{template.frequency}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Period Selection */}
          {selectedTemplate && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                {t('analytics.selectPeriod', 'Select Time Period')}
              </label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('analytics.choosePeriod', 'Choose time period')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_month">{t('analytics.lastMonth', 'Last Month')}</SelectItem>
                  <SelectItem value="last_quarter">{t('analytics.lastQuarter', 'Last Quarter')}</SelectItem>
                  <SelectItem value="last_year">{t('analytics.lastYear', 'Last Year')}</SelectItem>
                  <SelectItem value="custom">{t('analytics.customRange', 'Custom Range')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Section Selection */}
          {selectedTemplateData && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                {t('analytics.includeSections', 'Include Sections')}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedTemplateData.sections.map((sectionId) => (
                  <div key={sectionId} className="flex items-center space-x-2">
                    <Checkbox
                      id={sectionId}
                      checked={selectedSections.includes(sectionId)}
                      onCheckedChange={() => handleSectionToggle(sectionId)}
                    />
                    <label htmlFor={sectionId} className="text-sm text-gray-700 cursor-pointer">
                      {reportSections[sectionId as keyof typeof reportSections]}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedSections.length > 0 && (
                <span>{selectedSections.length} {t('analytics.sectionsSelected', 'sections selected')}</span>
              )}
            </div>
            <Button
              onClick={handleGenerateReport}
              disabled={!selectedTemplate || !selectedPeriod || generating}
              className="px-6"
            >
              {generating ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  {t('analytics.generating', 'Generating...')}
                </>
              ) : (
                <>
                  <FileBarChart className="w-4 h-4 mr-2" />
                  {t('analytics.generateReport', 'Generate Report')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Reports */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.generatedReports', 'Generated Reports')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">{report.name}</h4>
                      <p className="text-sm text-gray-600">{report.type}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(report.generatedAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">{report.size}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(report.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(report.status)}
                        <span className="capitalize">{report.status}</span>
                      </div>
                    </Badge>

                    {report.status === 'completed' && (
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          {t('analytics.download', 'Download')}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="w-4 h-4 mr-1" />
                          {t('analytics.share', 'Share')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {reports.length === 0 && (
            <div className="text-center py-8">
              <FileBarChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('analytics.noReports', 'No reports generated yet')}</p>
              <p className="text-sm text-gray-400">
                {t('analytics.createFirstReport', 'Create your first report using the form above')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Share Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5 text-green-500" />
            <span>{t('analytics.quickShare', 'Quick Share Options')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16 flex flex-col">
              <Share2 className="w-5 h-5 mb-1" />
              <span className="text-sm">{t('analytics.whatsappSummary', 'WhatsApp Summary')}</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col">
              <Send className="w-5 h-5 mb-1" />
              <span className="text-sm">{t('analytics.emailReport', 'Email Report')}</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col">
              <Download className="w-5 h-5 mb-1" />
              <span className="text-sm">{t('analytics.saveLocal', 'Save to Device')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};