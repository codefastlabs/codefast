import { tv, type VariantProps } from 'tailwind-variants';

const avatarVariants = tv({
  slots: {
    root: 'relative flex size-10 shrink-0 overflow-hidden rounded-full',
    image: 'aspect-square size-full',
    fallback: 'bg-muted flex size-full items-center justify-center rounded-full',
  },
});

type AvatarVariantsProps = VariantProps<typeof avatarVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { avatarVariants, type AvatarVariantsProps };
