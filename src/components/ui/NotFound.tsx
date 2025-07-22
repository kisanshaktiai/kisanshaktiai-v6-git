
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from './button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="max-w-md">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">{t('common.page_not_found')}</h2>
        <p className="text-gray-600 mb-8">{t('common.page_not_found_message')}</p>
        <Button onClick={() => navigate('/')} className="px-6">
          {t('common.back_to_home')}
        </Button>
      </div>
    </div>
  );
};
