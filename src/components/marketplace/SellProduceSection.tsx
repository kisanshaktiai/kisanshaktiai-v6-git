import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Camera, 
  Mic, 
  MapPin, 
  TrendingUp,
  Eye,
  MessageCircle,
  Star,
  Clock
} from 'lucide-react';

export const SellProduceSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('my-listings');

  const myListings = [
    {
      id: 1,
      crop: 'Wheat',
      variety: 'HD 2967',
      quantity: 25,
      unit: 'quintal',
      pricePerUnit: 2150,
      quality: 'Grade A',
      harvestDate: '2024-03-15',
      status: 'active',
      views: 45,
      inquiries: 8,
      images: ['/placeholder.svg']
    },
    {
      id: 2,
      crop: 'Tomatoes',
      variety: 'Hybrid',
      quantity: 5,
      unit: 'quintal',
      pricePerUnit: 3200,
      quality: 'Premium',
      harvestDate: '2024-03-20',
      status: 'sold',
      views: 23,
      inquiries: 5,
      images: ['/placeholder.svg']
    }
  ];

  const nearbyBuyers = [
    {
      id: 1,
      name: 'Ramesh Vegetables',
      type: 'Wholesaler',
      location: 'Mandi, 5km away',
      rating: 4.5,
      activelyBuying: ['Tomatoes', 'Onions', 'Potatoes'],
      lastActive: '2 hours ago'
    },
    {
      id: 2,
      name: 'Fresh Mart Chain',
      type: 'Retailer',
      location: 'City Market, 12km away',
      rating: 4.2,
      activelyBuying: ['Wheat', 'Rice', 'Pulses'],
      lastActive: '1 day ago'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-green-800">Ready to sell your produce?</h3>
              <p className="text-sm text-green-700">Create a listing in under 2 minutes</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Listing
            </Button>
          </div>
          
          <div className="flex space-x-2 overflow-x-auto">
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <Camera className="w-4 h-4 mr-2" />
              Photo Listing
            </Button>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <Mic className="w-4 h-4 mr-2" />
              Voice Listing
            </Button>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <MapPin className="w-4 h-4 mr-2" />
              Bulk Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'my-listings' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => setActiveTab('my-listings')}
        >
          My Listings ({myListings.length})
        </Button>
        <Button
          variant={activeTab === 'buyers' ? 'default' : 'ghost'}
          size="sm"
          className="flex-1"
          onClick={() => setActiveTab('buyers')}
        >
          Nearby Buyers
        </Button>
      </div>

      {/* My Listings Tab */}
      {activeTab === 'my-listings' && (
        <div className="space-y-4">
          {myListings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              <div className="flex">
                <div className="w-20 h-20 bg-muted flex-shrink-0 flex items-center justify-center">
                  <img 
                    src={listing.images[0]} 
                    alt={listing.crop}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{listing.crop}</h4>
                      <p className="text-xs text-muted-foreground">
                        {listing.variety} • {listing.quality}
                      </p>
                    </div>
                    <Badge 
                      variant={listing.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {listing.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm">
                      <span className="font-semibold text-primary">
                        ₹{listing.pricePerUnit.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        /{listing.unit}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {listing.quantity} {listing.unit} available
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {listing.views} views
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {listing.inquiries} inquiries
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Harvested {new Date(listing.harvestDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs">
                      Edit Listing
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      View Details
                    </Button>
                    {listing.status === 'active' && (
                      <Button size="sm" className="flex-1 text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Promote
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Nearby Buyers Tab */}
      {activeTab === 'buyers' && (
        <div className="space-y-4">
          {nearbyBuyers.map((buyer) => (
            <Card key={buyer.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-sm">{buyer.name}</h4>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {buyer.type}
                      </Badge>
                      <span>•</span>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {buyer.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs ml-1">{buyer.rating}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">Currently buying:</p>
                  <div className="flex flex-wrap gap-1">
                    {buyer.activelyBuying.map((crop, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {crop}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Last active: {buyer.lastActive}
                  </span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      View Profile
                    </Button>
                    <Button size="sm" className="text-xs">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Contact
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};