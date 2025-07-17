import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_url: string;
}

interface CategoryGridProps {
  type: 'inputs' | 'produce';
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ type }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, [type]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Filter categories based on type
      const filteredCategories = data?.filter(category => {
        if (type === 'inputs') {
          return ['seeds', 'fertilizers', 'pesticides', 'tools-equipment', 'irrigation'].includes(category.slug);
        } else {
          return ['grains', 'vegetables', 'fruits', 'spices', 'dairy'].includes(category.slug);
        }
      }) || [];

      setCategories(filteredCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-2"></div>
              <div className="h-4 bg-muted rounded mb-1"></div>
              <div className="h-3 bg-muted rounded w-2/3 mx-auto"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {categories.map((category) => (
        <Card 
          key={category.id} 
          className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
        >
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">{category.icon_url}</div>
            <h3 className="font-medium text-sm mb-1">{category.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {category.description}
            </p>
            {type === 'inputs' && (
              <Badge variant="secondary" className="mt-2 text-xs">
                View Products
              </Badge>
            )}
            {type === 'produce' && (
              <Badge variant="outline" className="mt-2 text-xs">
                Create Listing
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};