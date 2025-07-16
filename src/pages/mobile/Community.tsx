
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
      title: t('community.bestTimeWheatSowing'),
      content: t('community.bestTimeWheatSowingDesc'),
      timestamp: `2 ${t('community.hoursAgo')}`,
      likes: 12,
      comments: 8,
      category: t('community.categories.crops'),
    },
    {
      id: 2,
      author: 'Priya Sharma',
      authorInitials: 'PS',
      title: t('community.organicPestControl'),
      content: t('community.organicPestControlDesc'),
      timestamp: `5 ${t('community.hoursAgo')}`,
      likes: 18,
      comments: 15,
      category: t('community.categories.organicFarming'),
    },
    {
      id: 3,
      author: 'Suresh Patel',
      authorInitials: 'SP',
      title: t('community.waterConservation'),
      content: t('community.waterConservationDesc'),
      timestamp: `1 ${t('community.dayAgo')}`,
      likes: 25,
      comments: 12,
      category: t('community.categories.waterManagement'),
    },
  ];

  const getCategoryColor = (category: string) => {
    const colors = {
      [t('community.categories.crops')]: 'bg-green-100 text-green-800',
      [t('community.categories.organicFarming')]: 'bg-blue-100 text-blue-800',
      [t('community.categories.waterManagement')]: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Users className="w-8 h-8 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            {t('community.title')}
          </h1>
        </div>
        <p className="text-gray-600">{t('community.subtitle')}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-green-600">1.2k</div>
            <div className="text-xs text-gray-600">{t('community.members')}</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-blue-600">156</div>
            <div className="text-xs text-gray-600">{t('community.posts')}</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-xl font-bold text-orange-600">42</div>
            <div className="text-xs text-gray-600">{t('community.today')}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">{t('community.recentDiscussions')}</h2>
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
