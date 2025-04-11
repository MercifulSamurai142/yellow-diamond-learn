
import { Award, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import YDButton from "@/components/ui/YDButton";

const HeroBanner = () => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-8">
      <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 p-8 md:p-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <BookOpen className="text-white mr-2" size={24} />
              <h2 className="text-white text-lg font-medium">Yellow Diamond Academy</h2>
            </div>
            
            <h1 className="text-3xl md:text-5xl text-white font-bold mb-4 md:mb-6">
              Master FMCG Sales &<br />
              Distribution
            </h1>
            
            <p className="text-white/90 mb-6 md:max-w-xl">
              Build your expertise in the fast-moving consumer goods industry 
              with our comprehensive training program for Yellow Diamond's 
              growing sales team.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/modules">
                <YDButton className="bg-white text-amber-600 hover:bg-white/90 border-none">
                  <BookOpen size={18} className="mr-2" />
                  Start Learning
                </YDButton>
              </Link>
              <Link to="/progress">
                <YDButton variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                  View Progress
                </YDButton>
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block relative">
            <div className="bg-white/20 w-52 h-52 rounded-full flex items-center justify-center mt-6 md:mt-0">
              <div className="bg-white/30 w-40 h-40 rounded-full flex items-center justify-center">
                <Award className="text-white" size={80} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row mt-10 gap-6">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <BookOpen className="text-white" size={20} />
            </div>
            <div>
              <p className="text-white font-semibold">15+ Modules</p>
              <p className="text-white/80 text-sm">Comprehensive Coverage</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <Award className="text-white" size={20} />
            </div>
            <div>
              <p className="text-white font-semibold">Certifications</p>
              <p className="text-white/80 text-sm">Industry Recognized</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
