// yellow-diamond-learn-main/src/pages/ResetPasswordPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import YDButton from '@/components/ui/YDButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { YDCard } from '@/components/ui/YDCard';

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryTokenUsed, setRecoveryTokenUsed] = useState(false); // To prevent re-using token

  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user is already signed in (e.g., if the token was for an existing session)
    // or if the recovery token has been processed.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN' && !recoveryTokenUsed) {
        // If the user gets signed in directly by the recovery link,
        // it means the session is active.
        // We can then direct them to set a new password,
        // but often the link directly updates the session without needing to click "update password".
        // For this specific flow, we will navigate them to the profile page
        // AFTER they successfully reset their password via this form.
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [recoveryTokenUsed]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New passwords do not match.',
      });
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
      });
      setIsLoading(false);
      return;
    }

    try {
      // Supabase automatically uses the session/recovery token from the URL for updateUser
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setRecoveryTokenUsed(true); // Mark that token has been processed

      toast({
        title: 'Success!',
        description: 'Your password has been updated. You are now logged in.',
      });
      navigate('/profile', { replace: true });
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to update password. Please try again or request a new reset link.');
      toast({
        variant: 'destructive',
        title: 'Password Update Failed',
        description: err.message || 'There was an issue updating your password.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <YDCard className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-yd-navy mb-2">Set New Password</h2>
          <p className="text-muted-foreground">Please enter your new password below.</p>
        </div>

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="text-destructive text-sm mt-2">{error}</p>}

          <YDButton type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update Password
          </YDButton>
        </form>
      </YDCard>
    </div>
  );
};

export default ResetPasswordPage;