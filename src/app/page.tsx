import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ContentPreview } from "@/components/landing/content-preview";
import { SocialProof } from "@/components/landing/social-proof";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ContentPreview />
        <SocialProof />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
