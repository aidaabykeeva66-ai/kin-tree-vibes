import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import CollaborationSection from "@/components/CollaborationSection";
import HeritageSection from "@/components/HeritageSection";
import DetailsSection from "@/components/DetailsSection";
import ViewsSection from "@/components/ViewsSection";
import PresentSection from "@/components/PresentSection";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <HowItWorks />
      <CollaborationSection />
      <HeritageSection />
      <DetailsSection />
      <ViewsSection />
      <PresentSection />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Index;
