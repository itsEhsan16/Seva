import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Phone, Mail, User, ArrowRight, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useAuth } from "@/contexts/AuthContext";

interface AuthPageProps {
  onClose: () => void;
}

const AuthPage = ({ onClose }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user is already logged in and handle email verification
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check if email is verified
        if (!session.user.email_confirmed_at) {
          setShowEmailVerification(true);
          setFormData(prev => ({ ...prev, email: session.user.email || "" }));
        } else {
          onClose();
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        if (!session.user.email_confirmed_at) {
          setShowEmailVerification(true);
          setFormData(prev => ({ ...prev, email: session.user.email || "" }));
          toast({
            title: "Email verification required",
            description: "Please check your email and click the verification link to continue.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome!",
            description: "You have successfully signed in.",
          });
          onClose();
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Check if email was verified during token refresh
        if (session.user.email_confirmed_at && showEmailVerification) {
          setShowEmailVerification(false);
          toast({
            title: "Email verified!",
            description: "Your email has been successfully verified.",
          });
          onClose();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [onClose, toast, showEmailVerification]);

  // Resend cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`
        }
      });

      if (error) throw error;

      toast({
        title: "Verification email sent!",
        description: "Please check your email for the verification link.",
      });
      
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (showForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/`,
        });

        if (error) throw error;

        toast({
          title: "Password reset sent!",
          description: "Check your email for the password reset link.",
        });
        setShowForgotPassword(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify`,
            data: {
              full_name: formData.name,
              role: 'customer'
            }
          }
        });

        if (error) throw error;

        if (data.user && !data.user.email_confirmed_at) {
          setShowEmailVerification(true);
          toast({
            title: "Account created!",
            description: "Please check your email to confirm your account.",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md mx-4 p-6 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
            सेवा
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            {showEmailVerification 
              ? "Email Verification" 
              : showForgotPassword 
                ? "Reset Password" 
                : (isLogin ? "Welcome Back" : "Join Seva")
            }
          </h2>
          {!showEmailVerification && (
            <p className="text-muted-foreground">
              {showForgotPassword 
                ? "Enter your email to receive a password reset link"
                : (isLogin 
                  ? "Sign in to book your favorite services" 
                  : "Create an account to get started"
                )
              }
            </p>
          )}
        </div>

        {/* Social Login */}
        {!showEmailVerification && (
          <>
            <div className="space-y-3 mb-6">
              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-input rounded-xl hover:bg-accent transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">or</span>
              </div>
            </div>
          </>
        )}

        {/* Email Verification Screen */}
        {showEmailVerification ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Verify Your Email
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                We've sent a verification link to:
              </p>
              <p className="font-medium text-foreground mb-6">
                {formData.email}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Check your email</p>
                    <p>Click the verification link in your email to activate your account. The link will expire in 24 hours.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={resendLoading || resendCooldown > 0}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-input rounded-xl hover:bg-accent transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0 
                    ? `Resend in ${resendCooldown}s` 
                    : resendLoading 
                      ? "Sending..." 
                      : "Resend Verification Email"
                  }
                </span>
              </button>

              <button
                onClick={() => {
                  setShowEmailVerification(false);
                  setIsLogin(true);
                }}
                className="w-full py-3 px-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* Regular Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !showForgotPassword && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-input bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                  required={!isLogin && !showForgotPassword}
                />
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-input bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            
            {!showForgotPassword && (
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-input bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                  required={!showForgotPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}

            {isLogin && !showForgotPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {showForgotPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="button-primary w-full group disabled:opacity-50"
            >
              {loading ? "Loading..." : (showForgotPassword ? "Send Reset Link" : (isLogin ? "Sign In" : "Create Account"))}
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </form>
        )}

        {/* Toggle */}
        {!showForgotPassword && !showEmailVerification && (
          <div className="text-center mt-6">
            <p className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-primary hover:underline font-medium"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AuthPage;