
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, ThumbsUp, Users, Clock } from 'lucide-react';

export const Community: React.FC = () => {
  const { t } = useTranslation();

  const mockPosts = [
    {
      id: 1,
      author: 'Rajesh Kumar',
      authorInitials: 'RK',
      title: 'Best time for wheat sowing in Punjab',
      content: 'Planning to sow wheat next month. What are your experiences with timing in this region?',
      timestamp: '2 hours ago',
      likes: 12,
      comments: 8,
      category: 'Crops',
    },
    {
      id: 2,
      author: 'Priya Sharma',
      authorInitials: 'PS',
      title: 'Organic pest control methods',
      content: 'Looking for natural ways to control aphids on my vegetable crops. Any suggestions?',
      timestamp: '5 hours ago',
      likes: 18,
      comments: 15,
      category: 'Organic Farming',
    },
    {
      id: 3,
      author: 'Suresh Patel',
      authorInitials: 'SP',
      title: 'Water conservation techniques',
      content: 'Sharing my experience with drip irrigation. Reduced water usage by 40% this season.',
      timestamp: '1 day ago',
      likes: 25,
      comments: 12,
      category: 'Water Management',
    },
  ];

  const getCategoryColor = (category: string) => {
    const colors = {
      'Crops': 'bg-green-100 text-green-800',
      'Organic Farming': 'bg-blue-100 text-blue-800',
      'Water Management': 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Users className="w-8 h-8 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            {t('navigation.community')}
          </h1>
        </div>
        <p className="text-gray-600">Connect with fellow farmers</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-green-600">1.2k</div>
            <div className="text-xs text-gray-600">Members</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-blue-600">156</div>
            <div className="text-xs text-gray-600">Posts</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-orange-600">42</div>
            <div className="text-xs text-gray-600">Today</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Discussions</h2>
        {mockPosts.map((post) => (
          <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-green-100 text-green-800">
                    {post.authorInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{post.author}</h3>
                    <Badge variant="outline" className={getCategoryColor(post.category)}>
                      {post.category}
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {post.timestamp}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{post.title}</h4>
                <p className="text-sm text-gray-600">{post.content}</p>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{post.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
