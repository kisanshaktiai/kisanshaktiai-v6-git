
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, Users, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/mobile/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/mobile/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/mobile/community', icon: Users, label: 'Community' },
    { path: '/mobile/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-md mx-auto">
        <div className="flex">
          {navItems.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 py-2 px-1 text-center ${
                location.pathname === path
                  ? 'text-green-600'
                  : 'text-gray-500'
              }`}
            >
              <Icon className="w-6 h-6 mx-auto mb-1" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
