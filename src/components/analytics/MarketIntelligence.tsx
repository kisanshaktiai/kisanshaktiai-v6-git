import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Target,
  AlertCircle,
  Bell,
  Users,
  MapPin
} from 'lucide-react';

interface MarketData {
  priceHistory: Array<{
    date: string;
    crop: string;
    price: number;
    location: string;
  }>;
  priceTrends: Array<{
    crop: string;
    currentPrice: number;
    previousPrice: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  demandIndicators: Array<{
    crop: string;
    demand: number;
    supply: number;
    demandGrowth: number;
  }>;
  bestSellingTimes: Array<{
    crop: string;
    bestMonth: string;
    averagePrice: number;
    confidence: number;
  }>;
  marketOpportunities: Array<{
    crop: string;
    opportunity: string;
    potential: number;
    timeframe: string;
    action: string;
  }>;
  competitorAnalysis: Array<{
    location: string;
    averagePrice: number;
    volume: number;
    quality: string;
  }>;
}

export const MarketIntelligence: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useSelector((state: RootState) => state.farmer);
  const [marketData, setMarketData] = useState<MarketData>({
    priceHistory: [],
    priceTrends: [],
    demandIndicators: [],
    bestSellingTimes: [],
    marketOpportunities: [],
    competitorAnalysis: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<string>('all');

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      
      // Fetch market prices data
      const { data: marketPrices } = await supabase
        .from('market_prices')
        .select('*')
        .order('price_date', { ascending: false })
        .limit(100);

      if (marketPrices) {
        // Process price history
        const priceHistory = marketPrices.map(price => ({
          date: price.price_date,
          crop: price.crop_name,
          price: price.price_per_unit,
          location: price.market_location
        }));

        // Calculate price trends
        const cropMap = new Map();
        marketPrices.forEach(price => {
          const crop = price.crop_name;
          if (!cropMap.has(crop)) {
            cropMap.set(crop, []);
          }
          cropMap.get(crop).push(price);
        });

        const priceTrends = Array.from(cropMap.entries()).map(([crop, prices]) => {
          prices.sort((a: any, b: any) => new Date(b.price_date).getTime() - new Date(a.price_date).getTime());
          const currentPrice = prices[0]?.price_per_unit || 0;
          const previousPrice = prices[1]?.price_per_unit || currentPrice;
          const change = currentPrice - previousPrice;
          const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
          
          return {
            crop,
            currentPrice,
            previousPrice,
            change,
            changePercent,
            trend: changePercent > 2 ? 'up' as const : 
                   changePercent < -2 ? 'down' as const : 'stable' as const
          };
        });

        // Mock data for other sections (would be calculated from real market data)
        const demandIndicators = [
          { crop: 'Wheat', demand: 85, supply: 78, demandGrowth: 12 },
          { crop: 'Rice', demand: 92, supply: 88, demandGrowth: 8 },
          { crop: 'Cotton', demand: 76, supply: 82, demandGrowth: -3 },
          { crop: 'Sugarcane', demand: 88, supply: 85, demandGrowth: 15 }
        ];

        const bestSellingTimes = [
          { crop: 'Wheat', bestMonth: 'April', averagePrice: 2150, confidence: 85 },
          { crop: 'Rice', bestMonth: 'October', averagePrice: 1980, confidence: 92 },
          { crop: 'Cotton', bestMonth: 'December', averagePrice: 6200, confidence: 78 }
        ];

        const marketOpportunities = [
          {
            crop: 'Wheat',
            opportunity: 'High demand in nearby markets',
            potential: 25,
            timeframe: 'Next 2 weeks',
            action: 'Increase production for next season'
          },
          {
            crop: 'Organic Vegetables',
            opportunity: 'Growing premium market',
            potential: 40,
            timeframe: 'Next 6 months',
            action: 'Consider organic certification'
          }
        ];

        const competitorAnalysis = [
          { location: 'Local Market', averagePrice: 2100, volume: 500, quality: 'Grade A' },
          { location: 'District Market', averagePrice: 2250, volume: 1200, quality: 'Grade A' },
          { location: 'State Market', averagePrice: 2180, volume: 3000, quality: 'Mixed' }
        ];

        setMarketData({
          priceHistory,
          priceTrends,
          demandIndicators,
          bestSellingTimes,
          marketOpportunities,
          competitorAnalysis
        });
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t('analytics.marketIntelligence', 'Market Intelligence')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('analytics.marketInsights', 'Make informed selling decisions with market insights')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-1" />
            {t('analytics.priceAlerts', 'Price Alerts')}
          </Button>
          <Button size="sm">
            <Target className="w-4 h-4 mr-1" />
            {t('analytics.setTargets', 'Set Price Targets')}
          </Button>
        </div>
      </div>

      {/* Price Trends Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {marketData.priceTrends.slice(0, 3).map((trend, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{trend.crop}</h4>
                {getTrendIcon(trend.trend)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(trend.currentPrice)}
                  <span className="text-sm text-gray-500 font-normal">/quintal</span>
                </p>
                <p className={`text-sm font-medium ${getTrendColor(trend.trend)}`}>
                  {trend.change > 0 ? '+' : ''}{formatCurrency(trend.change)} 
                  ({trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%)
                </p>
                <p className="text-xs text-gray-500">
                  {t('analytics.since', 'Since last update')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Market Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-green-500" />
            <span>{t('analytics.marketOpportunities', 'Market Opportunities')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketData.marketOpportunities.map((opportunity, index) => (
              <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900">{opportunity.crop}</h4>
                    <Badge variant="default">{opportunity.potential}% {t('analytics.potential', 'potential')}</Badge>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{opportunity.timeframe}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{opportunity.opportunity}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-green-700">
                    {t('analytics.recommendedAction', 'Recommended Action')}: {opportunity.action}
                  </p>
                  <Button size="sm" variant="outline">
                    {t('analytics.learnMore', 'Learn More')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price History Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-500" />
            <span>{t('analytics.priceHistory', 'Price History')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={marketData.priceHistory.slice(0, 30)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value) => [formatCurrency(value as number), 'Price']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name={t('analytics.price', 'Price (₹/quintal)')}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Demand vs Supply */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span>{t('analytics.demandSupply', 'Demand vs Supply Analysis')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={marketData.demandIndicators}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="crop" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="demand" fill="#10B981" name={t('analytics.demand', 'Demand')} />
              <Bar dataKey="supply" fill="#3B82F6" name={t('analytics.supply', 'Supply')} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Best Selling Times */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <span>{t('analytics.bestSellingTimes', 'Best Selling Times')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketData.bestSellingTimes.map((time, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{time.crop}</h4>
                  <Badge variant="secondary">{time.confidence}% {t('analytics.confidence', 'confidence')}</Badge>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">{t('analytics.bestMonth', 'Best Month')}</p>
                    <p className="font-semibold text-orange-600">{time.bestMonth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('analytics.averagePrice', 'Average Price')}</p>
                    <p className="font-semibold">{formatCurrency(time.averagePrice)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Competitor Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-red-500" />
            <span>{t('analytics.competitorAnalysis', 'Market Competition Analysis')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketData.competitorAnalysis.map((competitor, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">{t('analytics.location', 'Location')}</p>
                    <p className="font-semibold">{competitor.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('analytics.averagePrice', 'Avg Price')}</p>
                    <p className="font-semibold">{formatCurrency(competitor.averagePrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('analytics.volume', 'Volume')}</p>
                    <p className="font-semibold">{competitor.volume.toLocaleString()} tons</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('analytics.quality', 'Quality')}</p>
                    <Badge variant={competitor.quality === 'Grade A' ? 'default' : 'secondary'}>
                      {competitor.quality}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};