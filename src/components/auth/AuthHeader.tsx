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
          src="/lovable-uploads/376faf91-3ec7-48e5-a2d3-991f03450149.png" 
          alt="KisanShakti AI"
          className="w-24 h-24 object-contain drop-shadow-lg" 
        />
        <div className="w-14 h-14 bg-card rounded-xl shadow-lg flex items-center justify-center border border-border">
          <img 
            src="/lovable-uploads/4a6817ed-757e-44c3-b5ba-2392870e3c3a.png" 
            alt="AI Assistant" 
            className="w-8 h-8 object-contain"
          />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
        {userCheckComplete && isNewUser ? (
          <>
            <UserPlus className="w-6 h-6 text-primary" />
            Create Account
          </>
        ) : userCheckComplete && !isNewUser ? (
          <>
            <LogIn className="w-6 h-6 text-primary" />
            Welcome Back
          </>
        ) : (
          <>
            <LogIn className="w-6 h-6 text-primary" />
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