import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  MapPin, 
  Star, 
  Calculator, 
  CreditCard,
  Phone,
  SlidersHorizontal,
  Truck
} from 'lucide-react';

export const BuyInputsSection: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All Products', count: 245 },
    { id: 'seeds', label: 'Seeds', count: 89 },
    { id: 'fertilizers', label: 'Fertilizers', count: 67 },
    { id: 'pesticides', label: 'Pesticides', count: 34 },
    { id: 'tools', label: 'Tools', count: 55 }
  ];

  const mockProducts = [
    {
      id: 1,
      name: 'Premium Wheat Seeds - HD 2967',
      brand: 'Punjab Seeds Co.',
      price: 85,
      originalPrice: 95,
      unit: 'kg',
      rating: 4.5,
      reviews: 234,
      features: ['High Yield', 'Disease Resistant', 'Fast Growing'],
      bulkDiscount: '10% off on 50kg+',
      creditAvailable: true,
      dealerNearby: true,
      image: '/placeholder.svg'
    },
    {
      id: 2,
      name: 'NPK Complex Fertilizer',
      brand: 'FertiGrow',
      price: 1250,
      unit: '50kg bag',
      rating: 4.2,
      reviews: 156,
      features: ['Balanced Formula', 'Slow Release', 'Organic'],
      bulkDiscount: '15% off on 10 bags+',
      creditAvailable: true,
      dealerNearby: false,
      image: '/placeholder.svg'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Browse Products</h3>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
              <Badge variant="secondary" className="ml-2 text-xs">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-4">
        {mockProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="flex">
              <div className="w-20 h-20 bg-muted flex-shrink-0 flex items-center justify-center">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold text-primary">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">per {product.unit}</div>
                  </div>
                </div>

                {/* Rating and Features */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs ml-1">{product.rating}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({product.reviews})
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    {product.features.slice(0, 2).map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Special Offers */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3 text-xs">
                    {product.bulkDiscount && (
                      <div className="flex items-center text-green-600">
                        <Calculator className="w-3 h-3 mr-1" />
                        {product.bulkDiscount}
                      </div>
                    )}
                    {product.creditAvailable && (
                      <div className="flex items-center text-blue-600">
                        <CreditCard className="w-3 h-3 mr-1" />
                        EMI Available
                      </div>
                    )}
                    {product.dealerNearby && (
                      <div className="flex items-center text-orange-600">
                        <MapPin className="w-3 h-3 mr-1" />
                        Nearby Dealer
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    Compare
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Phone className="w-3 h-3 mr-1" />
                    Call Dealer
                  </Button>
                  <Button size="sm" className="flex-1 text-xs">
                    <Truck className="w-3 h-3 mr-1" />
                    Order Now
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline">
          Load More Products
        </Button>
      </div>
    </div>
  );
};