export type VegasTransition =
  | 'blur2'
  | 'blur'
  | 'burn2'
  | 'burn'
  | 'fade2'
  | 'fade'
  | 'flash2'
  | 'flash'
  | 'negative2'
  | 'negative'
  | 'slideDown2'
  | 'slideDown'
  | 'slideLeft2'
  | 'slideLeft'
  | 'slideRight2'
  | 'slideRight'
  | 'slideUp2'
  | 'slideUp'
  | 'swirlLeft2'
  | 'swirlLeft'
  | 'swirlRight2'
  | 'swirlRight'
  | 'zoomIn2'
  | 'zoomIn'
  | 'zoomOut2'
  | 'zoomOut';

export type VegasAnimation =
  | 'kenburns'
  | 'kenburnsDown'
  | 'kenburnsDownLeft'
  | 'kenburnsDownRight'
  | 'kenburnsLeft'
  | 'kenburnsRight'
  | 'kenburnsUp'
  | 'kenburnsUpLeft'
  | 'kenburnsUpRight';

export type VegasTransitionWithRandom = 'random' | VegasTransition;

export type VegasAnimationWithRandom = 'random' | VegasAnimation;

export interface VegasBase {
  align: string;
  alignVertical: string;
  animation: VegasAnimationWithRandom;
  animationDuration: 'auto' | number;
  color: string;
  cover: boolean | string;
  delay: number;
  transition: VegasTransitionWithRandom;
  transitionDuration: 'auto' | number;
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
  firstTransition: null | VegasTransition;
  firstTransitionDuration: 'auto' | number;
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
