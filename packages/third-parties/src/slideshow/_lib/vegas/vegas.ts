type Transition =
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

type Animation =
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
  animationRegister: Animation[];
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
  transitionRegister: Transition[];
  firstTransition?: Transition;
  firstTransitionDuration?: number;
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
  align: 'center',
  alignVertical: 'center',
  transition: 'fade',
  transitionDuration: 1000,
  transitionRegister: [],
  animationDuration: 'auto',
  animationRegister: [],
  slidesToKeep: 1,
  slides: [],
};

export class Vegas {
  private static videoCache: Record<string, HTMLVideoElement> = {};
  private readonly element: HTMLElement;
  private readonly settings: VegasSettings;
  private slide: number;
  private readonly total: number;
  private readonly noShow: boolean;
  private paused: boolean;
  private ended: boolean;
  private timerElement: HTMLElement | null;
  private overlayElement: HTMLElement | null;
  private timeout: NodeJS.Timeout | null;
  private first: boolean;
  private readonly transitions: Transition[];
  private readonly animations: Animation[];
  private support: {
    objectFit: boolean;
    transition: boolean;
    video: boolean;
  };

  constructor(element: HTMLElement, options: Partial<VegasSettings>) {
    this.element = element;
    this.settings = {
      ...defaults,
      ...options,
    };
    this.slide = this.settings.slide;
    this.total = this.settings.slides.length;
    this.noShow = this.total < 2;
    this.paused = !this.settings.autoplay || this.noShow;
    this.ended = false;
    this.timerElement = null;
    this.overlayElement = null;
    this.timeout = null;
    this.first = true;

    this.transitions = [
      'fade',
      'fade2',
      'blur',
      'blur2',
      'flash',
      'flash2',
      'negative',
      'negative2',
      'burn',
      'burn2',
      'slideLeft',
      'slideLeft2',
      'slideRight',
      'slideRight2',
      'slideUp',
      'slideUp2',
      'slideDown',
      'slideDown2',
      'zoomIn',
      'zoomIn2',
      'zoomOut',
      'zoomOut2',
      'swirlLeft',
      'swirlLeft2',
      'swirlRight',
      'swirlRight2',
    ];

    this.animations = [
      'kenburns',
      'kenburnsLeft',
      'kenburnsRight',
      'kenburnsUp',
      'kenburnsUpLeft',
      'kenburnsUpRight',
      'kenburnsDown',
      'kenburnsDownLeft',
      'kenburnsDownRight',
    ];

    if (!Array.isArray(this.settings.transitionRegister)) {
      this.settings.transitionRegister = [this.settings.transitionRegister];
    }

    if (!Array.isArray(this.settings.animationRegister)) {
      this.settings.animationRegister = [this.settings.animationRegister];
    }

    this.transitions = this.transitions.concat(this.settings.transitionRegister);
    this.animations = this.animations.concat(this.settings.animationRegister);

    this.support = {
      objectFit: 'objectFit' in document.body.style,
      transition: 'transition' in document.body.style || 'WebkitTransition' in document.body.style,
      video: Vegas.isVideoCompatible(),
    };

    if (this.settings.shuffle) {
      this.shuffle();
    }

    this._init();
  }

  static isVideoCompatible(): boolean {
    return !/(?<userAgent>Android|webOS|Phone|iPad|iPod|BlackBerry|Windows Phone)/i.test(navigator.userAgent);
  }

  public shuffle(): void {
    for (let index = this.total - 1; index > 0; index--) {
      const rand = Math.floor(Math.random() * (index + 1));

      [this.settings.slides[index], this.settings.slides[rand]] = [
        this.settings.slides[rand],
        this.settings.slides[index],
      ] as [VegasSlide, VegasSlide];
    }
  }

  public play(): void {
    if (this.paused) {
      this.paused = false;
      this.next();
      const currentSlide = this.settings.slides[this.slide];

      if (currentSlide) {
        this.settings.onPlay?.(this.slide, currentSlide);
      }
    }
  }

  public pause(): void {
    this._timer(false);
    this.paused = true;
    const currentSlide = this.settings.slides[this.slide];

    if (currentSlide) {
      this.settings.onPause?.(this.slide, currentSlide);
    }
  }

  public toggle(): void {
    this.paused ? this.play() : this.pause();
  }

  public playing(): boolean {
    return !this.paused && !this.noShow;
  }

  public current(advanced = false):
    | number
    | {
        data: VegasSlide | undefined;
        slide: number;
      } {
    return advanced
      ? {
          slide: this.slide,
          data: this.settings.slides[this.slide],
        }
      : this.slide;
  }

  public jump(number: number): void {
    if (number < 0 || number > this.total - 1 || number === this.slide) {
      return;
    }

    this.slide = number;
    this._goto(this.slide);
  }

  public next(): void {
    this.slide++;

    if (this.slide >= this.total) {
      if (!this.settings.loop) {
        this._end();

        return;
      }

      this.slide = 0;
    }

    this._goto(this.slide);
  }

  public previous(): void {
    this.slide--;

    if (this.slide < 0) {
      if (!this.settings.loop) {
        this.slide++;

        return;
      }

      this.slide = this.total - 1;
    }

    this._goto(this.slide);
  }

  public destroy(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.element.querySelectorAll('.vegas-slide').forEach((slide) => {
      slide.remove();
    });

    if (this.settings.timer && this.timerElement) {
      this.timerElement.remove();
    }

    if (this.settings.overlay && this.overlayElement) {
      this.overlayElement.remove();
    }
  }

  private _init(): void {
    const { timer, overlay } = this.settings;

    // Preloading
    this._preload();

    // Timer
    if (timer && this.support.transition) {
      const $timer = document.createElement('div');

      $timer.className = 'vegas-timer';
      const $progress = document.createElement('div');

      $progress.className = 'vegas-timer-progress';
      $timer.appendChild($progress);
      this.timerElement = $timer;
      this.element.prepend($timer);
    }

    // Overlay
    if (overlay) {
      const $overlay = document.createElement('div');

      $overlay.className = 'vegas-overlay';

      if (typeof overlay === 'string') {
        $overlay.style.backgroundImage = `url(${overlay})`;
      }

      this.overlayElement = $overlay;
      this.element.prepend($overlay);
    }

    // Container
    this.element.classList.add('vegas-container');

    requestAnimationFrame(() => {
      this.settings.onInit?.(this.settings);
      this._goto(this.slide);

      if (this.settings.autoplay) {
        const currentSlide = this.settings.slides[this.slide];

        if (currentSlide) {
          this.settings.onPlay?.(this.slide, currentSlide);
        }
      }
    });
  }

  private _preload(): void {
    for (const slide of this.settings.slides) {
      if (this.settings.preload || this.settings.preloadImage) {
        if (slide.src) {
          const img = new Image();

          img.src = slide.src;
        }
      }

      if (this.settings.preload || this.settings.preloadVideo) {
        if (this.support.video && slide.video) {
          if (Array.isArray(slide.video)) {
            this._video(slide.video);
          } else {
            this._video(slide.video.src);
          }
        }
      }
    }
  }

  private _random<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)] as T;
  }

  private _slideShow(): void {
    if (this.total > 1 && !this.ended && !this.paused && !this.noShow) {
      this.timeout = setTimeout(() => {
        this.next();
      }, this._options('delay'));
    }
  }

  private _timer(state: boolean): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    if (!this.timerElement) {
      return;
    }

    this.timerElement.classList.remove('vegas-timer-running');
    const divElement = this.timerElement.querySelector('div');

    if (divElement) {
      divElement.style.transitionDuration = '0ms';
    }

    if (this.ended || this.paused || this.noShow) {
      return;
    }

    if (state) {
      const timeout = 100;

      setTimeout(() => {
        if (this.timerElement) {
          this.timerElement.classList.add('vegas-timer-running');
          const timerElement = this.timerElement.querySelector('div');

          if (timerElement) {
            const delay = this._options('delay');

            if (delay) {
              timerElement.style.transitionDuration = `${delay - timeout}ms`;
            }
          }
        }
      }, timeout);
    }
  }

  private _video(vSources: string | string[]): HTMLVideoElement {
    let videoSources = vSources;

    const cacheKey = videoSources.toString();

    if (Vegas.videoCache[cacheKey]) {
      return Vegas.videoCache[cacheKey];
    }

    if (!Array.isArray(videoSources)) {
      videoSources = [videoSources];
    }

    const video = document.createElement('video');

    video.preload = 'auto';

    for (const src of videoSources) {
      const source = document.createElement('source');

      source.src = src;
      video.appendChild(source);
    }

    Vegas.videoCache[cacheKey] = video;

    return video;
  }

  private _fadeOutSound(video: HTMLVideoElement, duration: number): void {
    const delay = duration / 10;
    const volume = video.volume - 0.09;

    if (volume > 0) {
      video.volume = volume;

      setTimeout(() => {
        this._fadeOutSound(video, duration);
      }, delay);
    } else {
      video.pause();
    }
  }

  private _fadeInSound(video: HTMLVideoElement, duration: number): void {
    const delay = duration / 10;
    const volume = video.volume + 0.09;

    if (volume < 1) {
      video.volume = volume;

      setTimeout(() => {
        this._fadeInSound(video, duration);
      }, delay);
    }
  }

  private _options<K extends keyof VegasSettings>(key: K): VegasSettings[K] {
    return this.settings[key];
  }

  private _goto(number: number): void {
    let nb = number;

    if (typeof this.settings.slides[nb] === 'undefined') {
      nb = 0;
    }

    this.slide = nb;

    const src = this.settings.slides[nb]?.src;
    const videoSettings = this.settings.slides[nb]?.video;
    const delay = this._options('delay');
    const align = this._options('align');
    const alignVertical = this._options('alignVertical');
    let cover = this._options('cover');
    const color = this._options('color') ?? getComputedStyle(this.element).backgroundColor;
    let video: HTMLVideoElement | null = null;

    let transition = this._options('transition');
    let transitionDuration = this._options('transitionDuration');
    let animation = this._options('animation');
    let animationDuration = this._options('animationDuration');

    if (this.settings.firstTransition && this.first) {
      transition = this.settings.firstTransition ?? transition;
    }

    if (this.settings.firstTransitionDuration && this.first) {
      transitionDuration = this.settings.firstTransitionDuration || transitionDuration;
    }

    if (this.first) {
      this.first = false;
    }

    if (cover !== 'repeat') {
      cover = cover === true ? 'cover' : 'contain';
    }

    if (transition === 'random' || Array.isArray(transition)) {
      transition = Array.isArray(transition) ? this._random(transition) : this._random(this.transitions);
    }

    if (animation === 'random' || Array.isArray(animation)) {
      animation = Array.isArray(animation) ? this._random(animation) : this._random(this.animations);
    }

    if (transitionDuration === 'auto' || (transitionDuration && delay && transitionDuration > delay)) {
      transitionDuration = delay;
    }

    if (animationDuration === 'auto') {
      animationDuration = delay;
    }

    const $slide = document.createElement('div');

    $slide.className = `vegas-slide`;

    if (this.support.transition && transition) {
      $slide.classList.add(`vegas-transition-${transition}`);
    }

    // Video
    if (this.support.video && videoSettings) {
      video = Array.isArray(videoSettings) ? this._video(videoSettings) : this._video(videoSettings.src);
      video.loop = videoSettings.loop ?? true;
      video.muted = videoSettings.mute ?? true;

      if (!video.muted) {
        video.volume = 0;

        if (transitionDuration) {
          this._fadeInSound(video, transitionDuration);
        }
      } else {
        video.pause();
      }

      $slide.classList.add('vegas-video');

      $slide.style.backgroundColor = color;

      if (this.support.objectFit) {
        $slide.style.objectPosition = `${align} ${alignVertical}`;
        $slide.style.objectFit = cover;
        $slide.style.width = '100%';
        $slide.style.height = '100%';
      } else if (cover === 'contain') {
        $slide.style.width = '100%';
        $slide.style.height = '100%';
      }

      $slide.appendChild(video);
    } else {
      // Image
      if (src) {
        const img = new Image();

        img.src = src;
      }

      const innerElement = document.createElement('div');

      innerElement.className = `vegas-slide-inner vegas-animation-${animation}`;
      innerElement.style.backgroundImage = `url("${src}")`;
      innerElement.style.backgroundColor = color;
      innerElement.style.backgroundPosition = `${align} ${alignVertical}`;
      innerElement.style.animationDuration = `${animationDuration}ms`;

      if (cover === 'repeat') {
        innerElement.style.backgroundRepeat = 'repeat';
      } else {
        innerElement.style.backgroundSize = cover;
      }

      $slide.appendChild(innerElement);
    }

    if (!this.support.transition) {
      $slide.style.display = 'none';
    }

    const $slides = this.element.querySelectorAll<HTMLElement>('.vegas-slide');

    if ($slides.length) {
      const lastSlideElement = $slides[$slides.length - 1];

      if (lastSlideElement) {
        this.element.insertBefore($slide, lastSlideElement.nextSibling);
      }
    } else {
      this.element.prepend($slide);
    }

    $slides.forEach((slide) => {
      slide.className = 'vegas-slide';

      if (slide.tagName === 'VIDEO') {
        slide.classList.add('vegas-video');
      }

      if (transition) {
        slide.classList.add(`vegas-transition-${transition}`);
        slide.classList.add(`vegas-transition-${transition}-in`);
      }
    });

    this._timer(false);

    const go = (): void => {
      this._timer(true);
      const timeout = 100;

      setTimeout(() => {
        if (transition) {
          if (this.support.transition) {
            $slides.forEach((slide) => {
              slide.style.transition = `all ${transitionDuration}ms`;
              slide.classList.add(`vegas-transition-${transition}-out`);
              const videoElement = slide.querySelector('video');

              if (videoElement) {
                if (transitionDuration) {
                  videoElement.volume > 0 && this._fadeOutSound(videoElement, transitionDuration);
                }
              }
            });

            $slide.style.transition = `all ${transitionDuration}ms`;
            $slide.classList.add(`vegas-transition-${transition}-in`);
          } else {
            $slide.style.display = 'block';
          }
        }

        Array.from($slides)
          .slice(0, $slides.length - this.settings.slidesToKeep)
          .forEach((slide) => {
            slide.remove();
          });

        const currentSlide = this.settings.slides[this.slide];

        if (currentSlide) {
          this.settings.onWalk?.(this.slide, currentSlide);
        }

        this._slideShow();
      }, timeout);
    };

    if (video) {
      if (video.readyState === 4) {
        video.currentTime = 0;
      }

      void video.play();
      go();
    } else if (src) {
      const img = new Image();

      img.src = src;
      img.complete ? go() : (img.onload = go);
    }
  }

  private _end(): void {
    this.ended = !this.settings.autoplay;
    this._timer(false);
    const currentSlide = this.settings.slides[this.slide];

    if (currentSlide) {
      this.settings.onEnd?.(this.slide, currentSlide);
    }
  }
}
