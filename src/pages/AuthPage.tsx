// yellow-diamond-learn-main/src/pages/AuthPage.tsx
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react"; // Import Loader2
import YDButton from "@/components/ui/YDButton";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"; // Import dialog components
import { Input } from "@/components/ui/input"; // Import Input component
import { Label } from "@/components/ui/label"; // Import Label component


const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, resetPassword } = useAuth(); // Destructure resetPassword
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false); // New state for forgot password dialog
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState(""); // New state for forgot password email

  // Get the intended destination after login
  const from = location.state?.from?.pathname || "/dashboard";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
        // Navigation is handled by AuthContext now upon successful sign-in
      } else {
        await signUp(formData.email, formData.password);
        // Don't navigate - the user needs to verify their email first.
        // signUp already shows a toast message for verification.
      }
    } catch (error) {
      console.error("Authentication error:", error);
      // Error handling is done inside sign in/up functions via toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await resetPassword(forgotPasswordEmail);
      setShowForgotPasswordDialog(false); // Close dialog on success
      setForgotPasswordEmail(""); // Clear email
    } catch (error) {
      console.error("Forgot password error:", error);
      // Error handling is done inside resetPassword function via toast
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: "", password: "" }); // Clear form on toggle
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Logo and branding section */}
      <div className="bg-yd-navy md:w-1/2 p-8 flex flex-col justify-center items-center">
        <div className="max-w-md text-center">
          <div className="mb-6 inline-flex items-center justify-center p-4 bg-yd-yellow rounded-xl">
            <h1 className="text-2xl md:text-3xl font-bold text-yd-navy">Yellow Diamond Academy</h1>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">Learning Management System</h2>
          <p className="text-yd-lightGray mb-8">Empowering our sales team with knowledge and skills for excellence in FMCG distribution.</p>
          <div className="hidden md:block">
            <img 
              src="icon.jpeg"
              alt="https://img.freepik.com/free-vector/online-learning-isometric-concept_1284-17947.jpg?w=900&t=st=1712754000~exp=1712754600~hmac=9ab0a7a5c2c741994682fd8d34dfd507986e84b927b6f1235eddc4a28ccc2022" 
              className="max-w-xs mx-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Authentication form */}
      <div className="bg-background md:w-1/2 p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-yd-navy">
              {isLogin ? "Welcome Back!" : "Create Account"}
            </h3>
            <p className="text-yd-gray mt-2">
              {isLogin ? "Sign in to access your account" : "Join our learning platform"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-yd-navy">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="john.doe@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-yd-navy">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {isLogin && (
                <div className="text-sm text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordDialog(true)} // Open dialog
                    className="text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <YDButton type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Processing...' : isLogin ? "Sign In" : "Create Account"}
            </YDButton>

            <div className="text-center text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address to receive a password reset link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPasswordSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="forgotPasswordEmail">Email</Label>
              <Input
                id="forgotPasswordEmail"
                type="email"
                placeholder="you@example.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="sm:justify-start">
              <YDButton type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Link
              </YDButton>
              <DialogClose asChild>
                <YDButton type="button" variant="outline">
                  Cancel
                </YDButton>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuthPage;