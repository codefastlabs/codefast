import type { LoaderConfig } from '@/types';

import { cloudflareLoader } from '@/loaders/cloudflare';
import { cloudfrontLoader } from '@/loaders/cloudfront';
import { cloudinaryLoader } from '@/loaders/cloudinary';
import { contentfulLoader } from '@/loaders/contentful';
import { fastlyLoader } from '@/loaders/fastly';
import { gumletLoader } from '@/loaders/gumlet';
import { imageengineLoader } from '@/loaders/imageengine';
import { imagekitLoader } from '@/loaders/imagekit';
import { imgixLoader } from '@/loaders/imgix';
import { pixelbinLoader } from '@/loaders/pixelbin';
import { sanityLoader } from '@/loaders/sanity';
import { sirvLoader } from '@/loaders/sirv';
import { supabaseLoader } from '@/loaders/supabase';
import { thumborLoader } from '@/loaders/thumbor';
import { unsplashLoader } from '@/loaders/unsplash';
import { isDomainMatch, isPathMatch } from '@/utils/url-matcher';

export const builtInLoaderConfigs: LoaderConfig[] = [
  {
    loader: cloudinaryLoader,
    matcher: (src) => isDomainMatch(src, 'cloudinary.com'),
  },
  {
    loader: imgixLoader,
    matcher: (src) => isDomainMatch(src, 'imgix.net'),
  },
  {
    loader: unsplashLoader,
    matcher: (src) => isDomainMatch(src, 'images.unsplash.com'),
  },
  {
    loader: cloudfrontLoader,
    matcher: (src) => isDomainMatch(src, 'cloudfront.net'),
  },
  {
    loader: supabaseLoader,
    matcher: (src) => isDomainMatch(src, 'supabase.co'),
  },
  {
    loader: contentfulLoader,
    matcher: (src) => isDomainMatch(src, 'ctfassets.net'),
  },
  {
    loader: imagekitLoader,
    matcher: (src) => isDomainMatch(src, 'imagekit.io'),
  },
  {
    loader: sanityLoader,
    matcher: (src) => isDomainMatch(src, 'cdn.sanity.io'),
  },
  {
    loader: pixelbinLoader,
    matcher: (src) => isDomainMatch(src, 'pixelbin.io'),
  },

  {
    loader: cloudflareLoader,
    matcher: (src) => isDomainMatch(src, 'cloudflare.com') || isPathMatch(src, '/cdn-cgi/image/'),
  },
  {
    loader: fastlyLoader,
    matcher: (src) => isDomainMatch(src, 'fastly.com') || isDomainMatch(src, 'fastlylb.net'),
  },
  {
    loader: gumletLoader,
    matcher: (src) => isDomainMatch(src, 'gumlet.io'),
  },
  {
    loader: imageengineLoader,
    matcher: (src) => isDomainMatch(src, 'imageengine.io') || isPathMatch(src, 'imgeng'),
  },
  {
    loader: sirvLoader,
    matcher: (src) => isDomainMatch(src, 'sirv.com'),
  },
  {
    loader: thumborLoader,
    matcher: (src) => isPathMatch(src, 'thumbor'),
  },
];
