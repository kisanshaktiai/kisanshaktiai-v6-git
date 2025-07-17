import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calculator,
  PieChart as PieChartIcon,
  BarChart3,
  Plus
} from 'lucide-react';

interface FinancialData {
  monthlyData: Array<{
    month: string;
    income: number;
    expenses: number;
    profit: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  cropProfitability: Array<{
    crop: string;
    revenue: number;
    cost: number;
    profit: number;
    roi: number;
  }>;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const FinancialAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useSelector((state: RootState) => state.farmer);
  const [financialData, setFinancialData] = useState<FinancialData>({
    monthlyData: [],
    categoryBreakdown: [],
    cropProfitability: [],
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  useEffect(() => {
    if (profile?.id) {
      fetchFinancialData();
    }
  }, [profile?.id, selectedPeriod]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 6);
      }

      // Fetch financial transactions
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('farmer_id', profile?.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: true });

      if (transactions) {
        // Process monthly data
        const monthlyMap = new Map();
        const categoryMap = new Map();
        const cropMap = new Map();
        
        let totalIncome = 0;
        let totalExpenses = 0;

        transactions.forEach(transaction => {
          const date = new Date(transaction.transaction_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, {
              month: monthName,
              income: 0,
              expenses: 0,
              profit: 0
            });
          }
          
          const monthData = monthlyMap.get(monthKey);
          
          if (transaction.transaction_type === 'income') {
            monthData.income += transaction.amount;
            totalIncome += transaction.amount;
            
            // Track crop revenue
            if (transaction.crop_name) {
              if (!cropMap.has(transaction.crop_name)) {
                cropMap.set(transaction.crop_name, { revenue: 0, cost: 0, profit: 0, roi: 0 });
              }
              cropMap.get(transaction.crop_name).revenue += transaction.amount;
            }
          } else {
            monthData.expenses += transaction.amount;
            totalExpenses += transaction.amount;
            
            // Track expenses by category
            const category = transaction.category || 'Other';
            categoryMap.set(category, (categoryMap.get(category) || 0) + transaction.amount);
            
            // Track crop costs
            if (transaction.crop_name) {
              if (!cropMap.has(transaction.crop_name)) {
                cropMap.set(transaction.crop_name, { revenue: 0, cost: 0, profit: 0, roi: 0 });
              }
              cropMap.get(transaction.crop_name).cost += transaction.amount;
            }
          }
          
          monthData.profit = monthData.income - monthData.expenses;
        });

        // Convert to arrays
        const monthlyData = Array.from(monthlyMap.values());
        
        const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
          category,
          amount,
          percentage: (amount / totalExpenses) * 100
        })).sort((a, b) => b.amount - a.amount);

        const cropProfitability = Array.from(cropMap.entries()).map(([crop, data]) => ({
          crop,
          revenue: data.revenue,
          cost: data.cost,
          profit: data.revenue - data.cost,
          roi: data.cost > 0 ? ((data.revenue - data.cost) / data.cost) * 100 : 0
        })).sort((a, b) => b.profit - a.profit);

        const netProfit = totalIncome - totalExpenses;
        const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

        setFinancialData({
          monthlyData,
          categoryBreakdown,
          cropProfitability,
          totalIncome,
          totalExpenses,
          netProfit,
          profitMargin
        });
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-40 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('analytics.financialOverview', 'Financial Overview')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('analytics.trackIncomeExpenses', 'Track your income and expenses')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="3months">{t('analytics.last3Months', 'Last 3 Months')}</option>
            <option value="6months">{t('analytics.last6Months', 'Last 6 Months')}</option>
            <option value="1year">{t('analytics.lastYear', 'Last Year')}</option>
          </select>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {t('analytics.addTransaction', 'Add')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('analytics.totalIncome', 'Total Income')}
                </p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(financialData.totalIncome)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('analytics.totalExpenses', 'Total Expenses')}
                </p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(financialData.totalExpenses)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('analytics.netProfit', 'Net Profit')}
                </p>
                <p className={`text-2xl font-bold mt-1 ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(financialData.netProfit)}
                </p>
                <p className="text-xs text-gray-500">
                  {financialData.profitMargin.toFixed(1)}% {t('analytics.margin', 'margin')}
                </p>
              </div>
              <Calculator className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">{t('analytics.monthlyTrend', 'Monthly Trend')}</TabsTrigger>
          <TabsTrigger value="categories">{t('analytics.expenseCategories', 'Expense Categories')}</TabsTrigger>
          <TabsTrigger value="crops">{t('analytics.cropProfitability', 'Crop Profitability')}</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>{t('analytics.incomeVsExpenses', 'Income vs Expenses')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financialData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="income" fill="#10B981" name={t('analytics.income', 'Income')} />
                  <Bar dataKey="expenses" fill="#EF4444" name={t('analytics.expenses', 'Expenses')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChartIcon className="w-5 h-5" />
                <span>{t('analytics.expenseBreakdown', 'Expense Breakdown')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={financialData.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                    >
                      {financialData.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-3">
                  {financialData.categoryBreakdown.slice(0, 6).map((item, index) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(item.amount)}</p>
                        <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crops">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.cropwiseProfitability', 'Crop-wise Profitability')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialData.cropProfitability.map((crop, index) => (
                  <div key={crop.crop} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{crop.crop}</h4>
                      <Badge variant={crop.roi > 20 ? 'default' : crop.roi > 0 ? 'secondary' : 'destructive'}>
                        {crop.roi.toFixed(1)}% ROI
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">{t('analytics.revenue', 'Revenue')}</p>
                        <p className="font-semibold text-green-600">{formatCurrency(crop.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('analytics.cost', 'Cost')}</p>
                        <p className="font-semibold text-red-600">{formatCurrency(crop.cost)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">{t('analytics.profit', 'Profit')}</p>
                        <p className={`font-semibold ${crop.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(crop.profit)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};