
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { useStubData } from '@/hooks/useStubData';

export const FinancialAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const { farmer } = useStubData();

  const financialData = {
    totalIncome: '₹1,25,000',
    totalExpenses: '₹85,000',
    netProfit: '₹40,000',
    profitMargin: '32%'
  };

  const expenseBreakdown = [
    { category: 'Seeds', amount: '₹25,000', percentage: '29%' },
    { category: 'Fertilizers', amount: '₹30,000', percentage: '35%' },
    { category: 'Labor', amount: '₹20,000', percentage: '24%' },
    { category: 'Equipment', amount: '₹10,000', percentage: '12%' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Financial Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Financial overview for {farmer.name} - {farmer.village}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{financialData.totalIncome}</div>
            <p className="text-xs text-green-600">+15% from last season</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{financialData.totalExpenses}</div>
            <p className="text-xs text-red-600">+8% from last season</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{financialData.netProfit}</div>
            <p className="text-xs text-blue-600">+25% from last season</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <PieChart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{financialData.profitMargin}</div>
            <p className="text-xs text-purple-600">Above average</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenseBreakdown.map((expense, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{expense.category}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{expense.amount}</span>
                  <span className="text-xs text-gray-500">({expense.percentage})</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
