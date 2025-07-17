import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  MapPin, 
  Truck, 
  CreditCard, 
  Heart,
  ShoppingCart,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string;
  brand: string;
  price_per_unit: number;
  unit_type: string;
  images: string[];
  discount_percentage: number;
  availability_status: string;
  is_featured: boolean;
  tags: string[];
  dealer_locations: any;
  credit_options: any;
}

interface FeaturedProductsProps {
  viewMode: 'grid' | 'list';
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ viewMode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFeaturedProducts();
    fetchSavedItems();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(10);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('marketplace_saved_items')
        .select('item_id')
        .eq('item_type', 'product')
        .eq('user_id', user.id);

      if (error) throw error;
      setSavedItems(new Set(data?.map(item => item.item_id) || []));
    } catch (error) {
      console.error('Error fetching saved items:', error);
    }
  };

  const toggleSavedItem = async (productId: string) => {
    try {
      const isSaved = savedItems.has(productId);
      
      if (isSaved) {
        const { error } = await supabase
          .from('marketplace_saved_items')
          .delete()
          .eq('item_type', 'product')
          .eq('item_id', productId);
        
        if (error) throw error;
        setSavedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get current tenant from user tenants
        const { data: userTenants } = await supabase
          .from('user_tenants')
          .select('tenant_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (!userTenants) return;
        
        const { error } = await supabase
          .from('marketplace_saved_items')
          .insert({
            user_id: user.id,
            item_type: 'product',
            item_id: productId,
            tenant_id: userTenants.tenant_id
          });
        
        if (error) throw error;
        setSavedItems(prev => new Set(prev).add(productId));
      }
    } catch (error) {
      console.error('Error toggling saved item:', error);
    }
  };

  const formatPrice = (price: number, unit: string) => {
    return `₹${price.toLocaleString()}/${unit}`;
  };

  const getDiscountedPrice = (price: number, discount: number) => {
    return price * (1 - discount / 100);
  };

  if (loading) {
    return (
      <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-square bg-muted"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="flex">
              <div className="w-24 h-24 bg-muted flex-shrink-0 flex items-center justify-center">
                {product.images?.[0] ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground text-xs">No Image</span>
                )}
              </div>
              <CardContent className="flex-1 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSavedItem(product.id)}
                    className="p-1 h-auto"
                  >
                    <Heart 
                      className={`w-4 h-4 ${
                        savedItems.has(product.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-muted-foreground'
                      }`} 
                    />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {product.discount_percentage > 0 ? (
                      <>
                        <span className="font-semibold text-primary">
                          {formatPrice(getDiscountedPrice(product.price_per_unit, product.discount_percentage), product.unit_type)}
                        </span>
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.price_per_unit, product.unit_type)}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          {product.discount_percentage}% OFF
                        </Badge>
                      </>
                    ) : (
                      <span className="font-semibold text-primary">
                        {formatPrice(product.price_per_unit, product.unit_type)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button size="sm" variant="outline" className="p-2">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button size="sm" className="p-2">
                      <ShoppingCart className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <div className="relative">
            <div className="aspect-square bg-muted flex items-center justify-center">
              {product.images?.[0] ? (
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-muted-foreground text-xs">No Image</span>
              )}
            </div>
            
            {/* Discount Badge */}
            {product.discount_percentage > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute top-2 left-2 text-xs"
              >
                {product.discount_percentage}% OFF
              </Badge>
            )}
            
            {/* Save Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 p-1 h-auto bg-background/80 hover:bg-background"
              onClick={() => toggleSavedItem(product.id)}
            >
              <Heart 
                className={`w-4 h-4 ${
                  savedItems.has(product.id) 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-muted-foreground'
                }`} 
              />
            </Button>
          </div>
          
          <CardContent className="p-3">
            <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
            <p className="text-xs text-muted-foreground mb-2">{product.brand}</p>
            
            {/* Price */}
            <div className="mb-2">
              {product.discount_percentage > 0 ? (
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-primary text-sm">
                    {formatPrice(getDiscountedPrice(product.price_per_unit, product.discount_percentage), product.unit_type)}
                  </span>
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(product.price_per_unit, product.unit_type)}
                  </span>
                </div>
              ) : (
                <span className="font-semibold text-primary text-sm">
                  {formatPrice(product.price_per_unit, product.unit_type)}
                </span>
              )}
            </div>
            
            {/* Features */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <div className="flex items-center space-x-3">
                {Array.isArray(product.dealer_locations) && product.dealer_locations.length > 0 && (
                  <div className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>Nearby</span>
                  </div>
                )}
                {product.credit_options && typeof product.credit_options === 'object' && Object.keys(product.credit_options).length > 0 && (
                  <div className="flex items-center">
                    <CreditCard className="w-3 h-3 mr-1" />
                    <span>EMI</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs">
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              <Button size="sm" className="flex-1 text-xs">
                <ShoppingCart className="w-3 h-3 mr-1" />
                Buy
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};