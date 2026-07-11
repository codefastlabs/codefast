import { HeroAppearanceCard } from "#/features/home/components/hero-appearance-card";
import { HeroNotificationCard } from "#/features/home/components/hero-notification-card";
import { HeroPlayerCard } from "#/features/home/components/hero-player-card";

/**
 * Layered, floating card collage beside the hero headline. Entrance and float
 * animations live on separate wrappers — an element can only run one animation.
 */
export function HeroShowcase() {
  return (
    <div className="relative">
      <div className="hero-enter [--hero-enter-delay:200ms]">
        <HeroPlayerCard />
      </div>

      <div className="hero-enter absolute -end-4 -top-12 z-10 hidden w-60 rotate-2 [--hero-enter-delay:400ms] sm:block">
        <div className="hero-float [--hero-float-delay:1.6s]">
          <HeroNotificationCard />
        </div>
      </div>

      <div className="hero-enter absolute -start-6 -bottom-12 z-10 hidden w-64 -rotate-2 [--hero-enter-delay:600ms] sm:block">
        <div className="hero-float">
          <HeroAppearanceCard />
        </div>
      </div>
    </div>
  );
}
