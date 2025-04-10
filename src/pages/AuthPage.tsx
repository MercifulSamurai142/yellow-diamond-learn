
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import YDButton from "@/components/ui/YDButton";

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // This is just for demo - we would connect to Supabase in the actual implementation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, we would authenticate with Supabase here
    navigate("/dashboard");
  };
  
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Logo and branding section */}
      <div className="bg-yd-navy md:w-1/2 p-8 flex flex-col justify-center items-center">
        <div className="max-w-md text-center">
          <div className="mb-6 inline-flex items-center justify-center p-4 bg-yd-yellow rounded-xl">
            <h1 className="text-2xl md:text-3xl font-bold text-yd-navy">Yellow Diamond</h1>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">Learning Management System</h2>
          <p className="text-yd-lightGray mb-8">Empowering our sales team with knowledge and skills for excellence in FMCG distribution.</p>
          <div className="hidden md:block">
            <img 
              src="https://img.freepik.com/free-vector/online-learning-isometric-concept_1284-17947.jpg?w=900&t=st=1712754000~exp=1712754600~hmac=9ab0a7a5c2c741994682fd8d34dfd507986e84b927b6f1235eddc4a28ccc2022" 
              alt="E-learning illustration" 
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
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-yd-navy">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={!isLogin}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-yd-navy">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
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
                  <a href="#" className="text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
              )}
            </div>
            
            <YDButton type="submit" className="w-full">
              {isLogin ? "Sign In" : "Create Account"}
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
    </div>
  );
};

export default AuthPage;
