import React from "react";

interface LoadingScreenProps {
  isLoading: boolean;
}

const LoadingScreen = ({ isLoading }: LoadingScreenProps) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-2xl font-display shadow-elegant">
            सेवा
          </div>
        </div>
        
        {/* Company Name */}
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          Seva
        </h1>
        <p className="text-muted-foreground mb-8">
          Home Services at Your Doorstep
        </p>
        
        {/* Progress Bar */}
        <div className="w-64 mx-auto">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse-slow bg-gradient-to-r from-primary to-pulse-400 loading-progress"></div>
          </div>
        </div>
        
        {/* Loading Text */}
        <p className="text-sm text-muted-foreground mt-4 animate-pulse">
          Loading your services...
        </p>
      </div>
      
      <style>{`
        .loading-progress {
          animation: loading 2s ease-in-out infinite !important;
        }
        
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;