
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileBarChart, Download, Calendar, PieChart } from 'lucide-react';
import { useStubData } from '@/hooks/useStubData';

export const ReportGeneration: React.FC = () => {
  const { t } = useTranslation();
  const { farmer } = useStubData();

  const reportTypes = [
    {
      title: 'Financial Summary',
      description: 'Income, expenses, and profit analysis',
      icon: PieChart,
      period: 'Last 6 months'
    },
    {
      title: 'Crop Performance',
      description: 'Yield analysis and crop health metrics',
      icon: FileBarChart,
      period: 'Current season'
    },
    {
      title: 'Market Analysis',
      description: 'Price trends and market opportunities',
      icon: Calendar,
      period: 'Last 3 months'
    }
  ];

  const handleGenerateReport = (reportType: string) => {
    console.log(`Generating ${reportType} report for farmer:`, farmer.name);
    // In a real app, this would trigger report generation
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileBarChart className="w-5 h-5 mr-2" />
            Report Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Generate detailed reports for {farmer.name} - {farmer.village}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Icon className="w-5 h-5 mr-2" />
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{report.description}</p>
                <p className="text-xs text-gray-500">Period: {report.period}</p>
                <Button 
                  onClick={() => handleGenerateReport(report.title)}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Q1 Financial Summary</h4>
                <p className="text-sm text-gray-600">Generated on March 31, 2024</p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Crop Performance Report</h4>
                <p className="text-sm text-gray-600">Generated on March 15, 2024</p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
