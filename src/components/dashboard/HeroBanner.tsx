import { Award, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import YDButton from "@/components/ui/YDButton";
import { LanguageContext } from "@/contexts/LanguageContext";

const HeroBanner = () => {
  const { currentLanguage } = useContext(LanguageContext);
  // const { currentlanguage } = useContext(LanguageContext);

  // Translation object structure
  const translations = {
    english: {
      hello: "Hello",
      academyName: "Yellow Diamond Academy",
      mainTitle: "Master FMCG Sales &",
      mainTitleSecond: "Distribution",
      description: "Build your expertise in the fast-moving consumer goods industry with our comprehensive training program for Yellow Diamond's growing sales team.",
      startLearning: "Start Learning",
      viewProgress: "View Progress",
      modules: "15+ Modules",
      comprehensiveCoverage: "Comprehensive Coverage",
      certifications: "Certifications",
      industryRecognized: "Industry Recognized"
    },
    hindi: {
      hello: "नमस्ते",
      academyName: "यलो डायमंड एकेडमी",
      mainTitle: "एफएमसीजी सेल्स और",
      mainTitleSecond: "वितरण में निपुणता",
      description: "यलो डायमंड की बढ़ती सेल्स टीम के लिए हमारे व्यापक प्रशिक्षण कार्यक्रम के साथ तेज़ी से बिकने वाले उपभोक्ता वस्तुओं के उद्योग में अपनी विशेषज्ञता का निर्माण करें।",
      startLearning: "सीखना शुरू करें",
      viewProgress: "प्रगति देखें",
      modules: "15+ मॉड्यूल",
      comprehensiveCoverage: "व्यापक कवरेज",
      certifications: "प्रमाणपत्र",
      industryRecognized: "उद्योग मान्यता प्राप्त"
    },
    kannada: {
      hello: "ನಮಸ್ಕಾರ",
      academyName: "ಯೆಲ್ಲೊ ಡೈಮಂಡ್ ಅಕಾಡೆಮಿ",
      mainTitle: "ಎಫ್‌ಎಮ್‌ಸಿಜಿ ಮಾರಾಟ ಮತ್ತು",
      mainTitleSecond: "ವಿತರಣೆಯಲ್ಲಿ ಪ್ರಾವೀಣ್ಯತೆ",
      description: "ಯೆಲ್ಲೊ ಡೈಮಂಡ್‌ನ ಬೆಳೆಯುತ್ತಿರುವ ಮಾರಾಟ ತಂಡಕ್ಕಾಗಿ ನಮ್ಮ ಸಮಗ್ರ ತರಬೇತಿ ಕಾರ್ಯಕ್ರಮದೊಂದಿಗೆ ವೇಗವಾಗಿ ಚಲಿಸುವ ಗ್ರಾಹಕ ಸರಕುಗಳ ಉದ್ಯಮದಲ್ಲಿ ನಿಮ್ಮ ಪರಿಣತಿಯನ್ನು ನಿರ್ಮಿಸಿ.",
      startLearning: "ಕಲಿಕೆ ಪ್ರಾರಂಭಿಸಿ",
      viewProgress: "ಪ್ರಗತಿಯನ್ನು ವೀಕ್ಷಿಸಿ",
      modules: "15+ ಮಾಡ್ಯೂಲ್‌ಗಳು",
      comprehensiveCoverage: "ಸಮಗ್ರ ಕವರೇಜ್",
      certifications: "ಪ್ರಮಾಣಪತ್ರಗಳು",
      industryRecognized: "ಉದ್ಯಮ ಗುರುತಿಸಲಾಗಿದೆ"
    }
  };

  // Get current language translations
  const t = translations[currentLanguage] || translations.english;

  return (
    <div className="relative w-full overflow-hidden mb-8">
      <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 p-8 md:p-10">
        <div className="flex flex-col md:flex-row items-center">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <BookOpen className="text-white mr-2" size={24} />
              <h2 className="text-white text-lg font-medium">{t.academyName}</h2>
            </div>
            
            {/* Hello greeting */}
            <h1 className="text-3xl md:text-5xl text-white font-bold mb-4 md:mb-6">
              {t.mainTitle}<br />
              {t.mainTitleSecond}
            </h1>
            
            <p className="text-white/90 mb-6 md:max-w-xl">
              {t.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/modules">
                <YDButton className="bg-white text-amber-600 hover:bg-white/90 border-none">
                  <BookOpen size={18} className="mr-2" />
                  {t.startLearning}
                </YDButton>
              </Link>
              <Link to="/progress">
                <YDButton variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                  {t.viewProgress}
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
              <p className="text-white font-semibold">{t.modules}</p>
              <p className="text-white/80 text-sm">{t.comprehensiveCoverage}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              <Award className="text-white" size={20} />
            </div>
            <div>
              <p className="text-white font-semibold">{t.certifications}</p>
              <p className="text-white/80 text-sm">{t.industryRecognized}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;