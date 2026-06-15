import { cn } from "@codefast/ui/lib/utils";
import { useLocation } from "@tanstack/react-router";

import { GalleryCtaSection } from "#/components/showcase/gallery-cta-section";
import { GroupSection } from "#/components/showcase/group-section";
import { ALPHABET_GROUPS, ALPHABET_NAV_IDS } from "#/components/showcase/groups";
import { MobileNav } from "#/components/showcase/mobile-nav";
import { SidebarNav } from "#/components/showcase/sidebar-nav";
import { useActiveSection } from "#/components/showcase/use-active-section";
import { useHashScroll } from "#/hooks/use-hash-scroll";
import { ENTER_ANIMATION_CLASS } from "#/lib/motion";

export function GalleryLayout() {
  const activeSection = useActiveSection(ALPHABET_NAV_IDS);
  const hash = useLocation({ select: (location) => location.hash });

  useHashScroll(hash);

  return (
    <div className="container mx-auto px-4 py-10 pb-32">
      <MobileNav groups={ALPHABET_GROUPS} activeSection={activeSection} />

      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[220px_minmax(0,1fr)]">
        <SidebarNav groups={ALPHABET_GROUPS} activeSection={activeSection} />

        <div className={cn("min-w-0", ENTER_ANIMATION_CLASS)}>
          {ALPHABET_GROUPS.map((group) => (
            <GroupSection key={group.id} group={group} />
          ))}
        </div>
      </div>

      <GalleryCtaSection />
    </div>
  );
}
