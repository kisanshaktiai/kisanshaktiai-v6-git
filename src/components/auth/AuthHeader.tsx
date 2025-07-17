
import { UserPlus, LogIn } from 'lucide-react';

interface AuthHeaderProps {
  userCheckComplete: boolean;
  isNewUser: boolean;
}

export const AuthHeader = ({ userCheckComplete, isNewUser }: AuthHeaderProps) => {
  return (
    <div className="text-center pt-6 pb-4">
      <div className="flex justify-center items-center gap-4 mb-6">
        <img 
          src="/lovable-uploads/a4e4d392-b5e2-4f9c-9401-6ff2db3e98d0.png" 
          alt="KisanShakti AI"
          className="w-32 h-32 object-contain drop-shadow-lg" 
        />
        <div className="w-14 h-14 bg-card rounded-xl shadow-lg flex items-center justify-center border border-border">
          <img 
            src="/lovable-uploads/b75563a8-f082-47af-90f0-95838d69b700.png" 
            alt="AI Assistant" 
            className="w-8 h-8 object-contain"
          />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
        {userCheckComplete && isNewUser ? (
          <>
            <UserPlus className="w-6 h-6 text-green-600" />
            Join KisanShakti AI
          </>
        ) : userCheckComplete && !isNewUser ? (
          <>
            <LogIn className="w-6 h-6 text-green-600" />
            Welcome Back
          </>
        ) : (
          <>
            <LogIn className="w-6 h-6 text-green-600" />
            Welcome
          </>
        )}
      </h1>
      <p className="text-muted-foreground mt-2">
        {userCheckComplete && isNewUser 
          ? 'Join thousands of farmers using AI-powered farming guidance'
          : 'Continue your smart farming journey with KisanShakti AI'
        }
      </p>
    </div>
  );
};
