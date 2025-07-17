import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  TrendingUp, 
  MapPin, 
  Star,
  Filter,
  Search,
  Grid3X3,
  List
} from 'lucide-react';
import { BuyInputsSection } from './BuyInputsSection';
import { SellProduceSection } from './SellProduceSection';
import { CategoryGrid } from './CategoryGrid';
import { FeaturedProducts } from './FeaturedProducts';
import { TrendingArea } from './TrendingArea';
import { PersonalizedRecommendations } from './PersonalizedRecommendations';

export const MarketplaceHome: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('buy');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Marketplace</h1>
            <p className="text-primary-foreground/80 text-sm">
              Buy inputs • Sell produce • Grow together
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <MapPin className="w-4 h-4 mr-1" />
              Location
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search products, crops, seeds..."
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-background text-foreground border-0 focus:ring-2 focus:ring-primary-foreground/20"
          />
          <Button
            size="sm"
            variant="secondary"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-0 bg-background border-b z-10">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50">
            <TabsTrigger 
              value="buy" 
              className="flex items-center space-x-2 data-[state=active]:bg-background"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buy Inputs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sell"
              className="flex items-center space-x-2 data-[state=active]:bg-background"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Sell Produce</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="px-4 py-6 space-y-6">
          <TabsContent value="buy" className="mt-0">
            <div className="space-y-6">
              {/* Category Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Shop by Category</h2>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </div>
                <CategoryGrid type="inputs" />
              </div>

              {/* Featured Products */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Featured Products</h2>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <FeaturedProducts viewMode={viewMode} />
              </div>

              {/* Buy Inputs Section */}
              <BuyInputsSection />

              {/* Personalized Recommendations */}
              <PersonalizedRecommendations />
            </div>
          </TabsContent>

          <TabsContent value="sell" className="mt-0">
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">₹2,150</div>
                    <div className="text-sm text-muted-foreground">Avg Wheat Price</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">↑5.2%</div>
                    <div className="text-sm text-muted-foreground">This Week</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">45</div>
                    <div className="text-sm text-muted-foreground">Active Buyers</div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Grid for Produce */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">What are you selling?</h2>
                </div>
                <CategoryGrid type="produce" />
              </div>

              {/* Trending in Area */}
              <TrendingArea />

              {/* Sell Produce Section */}
              <SellProduceSection />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};