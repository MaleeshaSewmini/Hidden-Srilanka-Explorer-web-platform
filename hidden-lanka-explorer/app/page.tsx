import Hero from "@/components/Home/hero";
import StatsBar from "@/components/Home/stats-bar";
import CategoryExplorer from "@/components/Home/category-explorer";
import PlacesExplorer from "@/components/Home/places-explorer";
import SeasonalGuide from "@/components/Home/seasonal-guide";
import ReviewsSection from "@/components/Home/review-section";
import Contributors from "@/components/Home/contributors";
import Gallery from "@/components/Home/gallery";
import JoinCommunity from "@/components/Home/join-community";
import TripPlanner from "@/components/Home/trip-planner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <CategoryExplorer />
      <PlacesExplorer />
      <SeasonalGuide />
      <ReviewsSection />
      <Contributors />
      <Gallery />
      <JoinCommunity />
      <TripPlanner />
    </>
  );
}