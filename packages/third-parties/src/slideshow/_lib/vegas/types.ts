export type VegasTransition =
  | 'fade'
  | 'fade2'
  | 'blur'
  | 'blur2'
  | 'flash'
  | 'flash2'
  | 'negative'
  | 'negative2'
  | 'burn'
  | 'burn2'
  | 'slideLeft'
  | 'slideLeft2'
  | 'slideRight'
  | 'slideRight2'
  | 'slideUp'
  | 'slideUp2'
  | 'slideDown'
  | 'slideDown2'
  | 'zoomIn'
  | 'zoomIn2'
  | 'zoomOut'
  | 'zoomOut2'
  | 'swirlLeft'
  | 'swirlLeft2'
  | 'swirlRight'
  | 'swirlRight2';

export type VegasAnimation =
  | 'kenburns'
  | 'kenburnsLeft'
  | 'kenburnsRight'
  | 'kenburnsUp'
  | 'kenburnsUpLeft'
  | 'kenburnsUpRight'
  | 'kenburnsDown'
  | 'kenburnsDownLeft'
  | 'kenburnsDownRight';

export type VegasTransitionWithRandom = 'random' | VegasTransition;

export type VegasAnimationWithRandom = 'random' | VegasAnimation;

export interface VegasBase {
  align: string;
  alignVertical: string;
  animation: VegasAnimationWithRandom;
  animationDuration: number | 'auto';
  color: string;
  cover: boolean | string;
  delay: number;
  transition: VegasTransitionWithRandom;
  transitionDuration: number | 'auto';
}

export interface VegasCallback {
  onEnd?: (index: number, slide: VegasSlide) => void;
  onInit?: (settings: VegasSettings) => void;
  onPause?: (index: number, slide: VegasSlide) => void;
  onPlay?: (index: number, slide: VegasSlide) => void;
  onWalk?: (index: number, slide: VegasSlide) => void;
}

export interface VegasVideo {
  src: string[];
  loop?: boolean;
  mute?: boolean;
}

export interface VegasSlide extends Partial<VegasBase> {
  src?: string;
  video?: VegasVideo;
}

export interface VegasSupport {
  objectFit: boolean;
  transition: boolean;
  video: boolean;
}

export interface VegasSettings extends VegasBase, VegasCallback {
  animationRegister: string[];
  autoplay: boolean;
  firstTransition: VegasTransition | null;
  firstTransitionDuration: number | 'auto';
  loop: boolean;
  overlay: boolean | string;
  preload: boolean;
  preloadImage: boolean;
  preloadVideo: boolean;
  shuffle: boolean;
  slideIndex: number;
  slides: VegasSlide[];
  slidesToKeep: number;
  timer: boolean;
  transitionRegister: string[];
}
