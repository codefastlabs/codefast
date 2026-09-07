import { useLocation } from "@tanstack/react-router";

import { GalleryCtaSection } from "#/features/components-catalog/components/gallery/gallery-cta-section";
import { GroupSection } from "#/features/components-catalog/components/gallery/group-section";
import { MobileNav } from "#/features/components-catalog/components/gallery/mobile-nav";
import { SidebarNav } from "#/features/components-catalog/components/gallery/sidebar-nav";
import { ALPHABET_GROUPS, ALPHABET_NAV_IDS } from "#/features/components-catalog/data";
import { useActiveSection } from "#/features/components-catalog/hooks/use-active-section";
import { useHashScroll } from "#/features/components-catalog/hooks/use-hash-scroll";

export function GalleryLayout() {
  const activeSection = useActiveSection(ALPHABET_NAV_IDS);
  const hash = useLocation({ select: (location) => location.hash });

  useHashScroll(hash);

  return (
    <div className="container mx-auto px-4 py-10 pb-32">
      <MobileNav groups={ALPHABET_GROUPS} activeSection={activeSection} />

      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[220px_minmax(0,1fr)]">
        <SidebarNav groups={ALPHABET_GROUPS} activeSection={activeSection} />

        <div className="min-w-0">
          {ALPHABET_GROUPS.map((group) => (
            <GroupSection key={group.id} group={group} />
          ))}
        </div>
      </div>

      <GalleryCtaSection />
    </div>
  );
}
