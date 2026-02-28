import CompensationFlow from "@/components/CompensationFlow";
import ExplorerPreview from "@/components/ExplorerPreview";
import FinalCTA from "@/components/FinalCTA";
import HowItWorks from "@/components/HowItWorks";
import LandingHero from "@/components/LandingHero";
import ProofNumbers from "@/components/ProofNumbers";
import WhoUses from "@/components/WhoUses";
import WhyThisMatters from "@/components/WhyThisMatters";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0B1220] text-white">
      <LandingHero />
      <ProofNumbers />
      <HowItWorks />
      <WhyThisMatters />
      <WhoUses />
      <ExplorerPreview />
      <CompensationFlow />
      <FinalCTA />
    </main>
  );
}

