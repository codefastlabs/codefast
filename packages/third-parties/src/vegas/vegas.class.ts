export interface Slide {
  align?: string | null;
  animation?: string | null;
  animationDuration?: string | null;
  color?: string | null;
  cover?: boolean | string;
  delay?: number | null;
  src?: string;
  transition?: string | null;
  transitionDuration?: number | null;
  valign?: string | null;
  video?: {
    src: string[];
    loop?: boolean;
    mute?: boolean;
  };
}

export interface VegasSettings {
  align: string;
  animation: string | null;
  animationDuration: string;
  animationRegister: string[];
  autoplay: boolean;
  color: string | null;
  cover: boolean | string;
  delay: number;
  firstTransition: string | null;
  firstTransitionDuration: number | null;
  init: () => void;
  loop: boolean;
  overlay: boolean | string;
  pause: () => void;
  play: () => void;
  preload: boolean;
  preloadImage: boolean;
  preloadVideo: boolean;
  shuffle: boolean;
  slide: number;
  slides: Slide[];
  slidesToKeep: number;
  timer: boolean;
  transition: string;
  transitionDuration: number;
  transitionRegister: string[];
  valign: string;
  walk: () => void;
}

const defaults: VegasSettings = {
  slide: 0,
  delay: 5000,
  loop: true,
  preload: false,
  preloadImage: false,
  preloadVideo: false,
  timer: true,
  overlay: false,
  autoplay: true,
  shuffle: false,
  cover: true,
  color: null,
  align: 'center',
  valign: 'center',
  firstTransition: null,
  firstTransitionDuration: null,
  transition: 'fade',
  transitionDuration: 1000,
  transitionRegister: [],
  animation: null,
  animationDuration: 'auto',
  animationRegister: [],
  slidesToKeep: 1,
  init: () => {
    /* noop */
  },
  play: () => {
    /* noop */
  },
  pause: () => {
    /* noop */
  },
  walk: () => {
    /* noop */
  },
  slides: [],
};

export class Vegas {
  private _elmt: HTMLElement;
  private _options: Partial<VegasSettings> | undefined;

  constructor(elmt: HTMLElement, options?: Partial<VegasSettings>) {
    this._elmt = elmt;
    this._options = options;
  }

  destroy(): void {
    /* noop */
  }
}
