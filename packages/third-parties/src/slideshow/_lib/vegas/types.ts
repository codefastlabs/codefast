export type Transition =
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

export type Animation =
  | 'kenburns'
  | 'kenburnsLeft'
  | 'kenburnsRight'
  | 'kenburnsUp'
  | 'kenburnsUpLeft'
  | 'kenburnsUpRight'
  | 'kenburnsDown'
  | 'kenburnsDownLeft'
  | 'kenburnsDownRight';

export interface VegasBase {
  align?: string;
  alignVertical?: string;
  animation?: 'random' | Animation | Animation[];
  animationDuration?: number | 'auto';
  color?: string;
  cover?: boolean | string;
  delay?: number;
  transition?: 'random' | Transition | Transition[];
  transitionDuration?: 'auto' | number;
}

export interface VegasCallback {
  onEnd?: (index: number, slide: VegasSlide) => void;
  onInit?: (settings: VegasSettings) => void;
  onPause?: (index: number, slide: VegasSlide) => void;
  onPlay?: (index: number, slide: VegasSlide) => void;
  onWalk?: (index: number, slide: VegasSlide) => void;
}

export interface VegasSlide extends VegasBase {
  src?: string;
  video?: {
    src: string[];
    loop?: boolean;
    mute?: boolean;
  };
}

export interface VegasSettings extends VegasBase, VegasCallback {
  animationRegister: string[];
  autoplay: boolean;
  loop: boolean;
  overlay: boolean | string;
  preload: boolean;
  preloadImage: boolean;
  preloadVideo: boolean;
  shuffle: boolean;
  slide: number;
  slides: VegasSlide[];
  slidesToKeep: number;
  timer: boolean;
  transitionRegister: string[];
  firstTransition?: Transition;
  firstTransitionDuration?: number;
}

export interface VegasSupport {
  objectFit: boolean;
  transition: boolean;
  video: boolean;
}
