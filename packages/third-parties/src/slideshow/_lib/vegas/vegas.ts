export interface VegasSlide {
  align?: string | null;
  animation?: string | null;
  animationDuration?: number | null;
  color?: string | null;
  cover?: boolean;
  delay?: number | null;
  src?: string | null;
  transition?: string | null;
  transitionDuration?: number | null;
  valign?: string | null;
  video?: {
    loop: boolean;
    mute: boolean;
    src: string[];
  };
}

export interface VegasSettings {
  align: string;
  animation: string | null;
  animationDuration: string | number;
  animationRegister: string[];
  autoplay: boolean;
  color: string | null;
  cover: boolean | string;
  delay: number;
  firstTransition: string | null;
  firstTransitionDuration: number | null;
  init: () => void;
  loop: boolean;
  overlay: boolean;
  pause: () => void;
  play: () => void;
  preload: boolean;
  preloadImage: boolean;
  preloadVideo: boolean;
  shuffle: boolean;
  slide: number;
  slides: VegasSlide[];
  slidesToKeep: number;
  timer: boolean;
  transition: string;
  transitionDuration: number;
  transitionRegister: string[];
  valign: string;
  walk: () => void;
}

export class Vegas {
  private static videoCache: Record<string, HTMLVideoElement> = {};
  private elmt: HTMLElement;
  private settings: VegasSettings;
  private slide: number;
  private total: number;
  private noshow: boolean;
  private paused: boolean;
  private ended: boolean;
  private $timer: HTMLElement | null;
  private $overlay: HTMLElement | null;
  private timeout: any;
  private first: boolean;
  private transitions: string[];
  private animations: string[];
  private support: { objectFit: boolean; transition: boolean; video: boolean };

  constructor(elmt: HTMLElement, options: Partial<VegasSettings>) {
    this.elmt = elmt;
    this.settings = { ...defaults, ...options };
    this.slide = this.settings.slide;
    this.total = this.settings.slides.length;
    this.noshow = this.total < 2;
    this.paused = !this.settings.autoplay || this.noshow;
    this.ended = false;
    this.$timer = null;
    this.$overlay = null;
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

    if (!(this.settings.transitionRegister instanceof Array)) {
      this.settings.transitionRegister = [this.settings.transitionRegister];
    }

    if (!(this.settings.animationRegister instanceof Array)) {
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

  static isVideoCompatible() {
    return !/(Android|webOS|Phone|iPad|iPod|BlackBerry|Windows Phone)/i.test(navigator.userAgent);
  }

  public shuffle() {
    for (let i = this.total - 1; i > 0; i--) {
      const rand = Math.floor(Math.random() * (i + 1));

      [this.settings.slides[i], this.settings.slides[rand]] = [this.settings.slides[rand], this.settings.slides[i]];
    }
  }

  public play() {
    if (this.paused) {
      this.paused = false;
      this.next();
      this.trigger('play');
    }
  }

  public pause() {
    this._timer(false);
    this.paused = true;
    this.trigger('pause');
  }

  public toggle() {
    this.paused ? this.play() : this.pause();
  }

  public playing() {
    return !this.paused && !this.noshow;
  }

  public current(advanced = false) {
    return advanced ? { slide: this.slide, data: this.settings.slides[this.slide] } : this.slide;
  }

  public jump(nb: number) {
    if (nb < 0 || nb > this.total - 1 || nb === this.slide) {
      return;
    }

    this.slide = nb;
    this._goto(this.slide);
  }

  public next() {
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

  public previous() {
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

  public trigger(fn: string) {
    const params = fn === 'init' ? [this.settings] : [this.slide, this.settings.slides[this.slide]];
    const event = new CustomEvent(`vegas${fn}`, { detail: params });

    this.elmt.dispatchEvent(event);

    const handler = (this.settings as any)[fn];

    if (typeof handler === 'function') {
      handler.apply(this.elmt, params);
    }
  }

  public options(key: string | Partial<VegasSettings>, value?: any): any {
    const oldSlides = this.settings.slides.slice();

    if (typeof key === 'object') {
      this.settings = { ...defaults, ...key };
    } else if (typeof key === 'string') {
      if (value === undefined) {
        return this.settings[key];
      }

      this.settings[key] = value;
    } else {
      return this.settings;
    }

    // In case slides have changed
    if (this.settings.slides !== oldSlides) {
      this.total = this.settings.slides.length;
      this.noshow = this.total < 2;
      this._preload();
    }
  }

  public destroy() {
    clearTimeout(this.timeout);

    this.elmt.classList.remove('vegas-container');

    Array.from(this.elmt.querySelectorAll('* > .vegas-slide')).forEach((slide) => {
      slide.remove();
    });
    Array.from(this.elmt.querySelectorAll('* > .vegas-wrapper')).forEach((wrapper) => {
      const children = Array.from(wrapper.children);

      wrapper.replaceWith(...children);
    });

    if (this.settings.timer) {
      this.$timer!.remove();
    }

    if (this.settings.overlay) {
      this.$overlay!.remove();
    }

    (this.elmt as any)._vegas = null;
  }

  private _init() {
    const isBody = this.elmt.tagName === 'BODY';
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
      this.$timer = $timer;
      this.elmt.prepend($timer);
    }

    // Overlay
    if (overlay) {
      const $overlay = document.createElement('div');

      $overlay.className = 'vegas-overlay';

      if (typeof overlay === 'string') {
        $overlay.style.backgroundImage = `url(${overlay})`;
      }

      this.$overlay = $overlay;
      this.elmt.prepend($overlay);
    }

    // Container
    this.elmt.classList.add('vegas-container');

    setTimeout(() => {
      this.trigger('init');
      this._goto(this.slide);

      if (this.settings.autoplay) {
        this.trigger('play');
      }
    }, 1);
  }

  private _preload() {
    for (const slide of this.settings.slides) {
      if (this.settings.preload || this.settings.preloadImage) {
        if (slide.src) {
          const img = new Image();

          img.src = slide.src;
        }
      }

      if (this.settings.preload || this.settings.preloadVideo) {
        if (this.support.video && slide.video) {
          if (slide.video instanceof Array) {
            this._video(slide.video);
          } else {
            this._video(slide.video.src);
          }
        }
      }
    }
  }

  private _random(array: string[]): string {
    return array[Math.floor(Math.random() * array.length)];
  }

  private _slideShow() {
    if (this.total > 1 && !this.ended && !this.paused && !this.noshow) {
      this.timeout = setTimeout(() => {
        this.next();
      }, this._options('delay'));
    }
  }

  private _timer(state: boolean) {
    clearTimeout(this.timeout);

    if (!this.$timer) {
      return;
    }

    this.$timer.classList.remove('vegas-timer-running');
    this.$timer.querySelector('div')!.style.transitionDuration = '0ms';

    if (this.ended || this.paused || this.noshow) {
      return;
    }

    if (state) {
      setTimeout(() => {
        this.$timer!.classList.add('vegas-timer-running');
        this.$timer!.querySelector('div')!.style.transitionDuration = `${this._options('delay') - 100}ms`;
      }, 100);
    }
  }

  private _video(srcs: string | string[]) {
    const cacheKey = srcs.toString();

    if (Vegas.videoCache[cacheKey]) {
      return Vegas.videoCache[cacheKey];
    }

    if (!(srcs instanceof Array)) {
      srcs = [srcs];
    }

    const video = document.createElement('video');

    video.preload = 'auto';

    for (const src of srcs) {
      const source = document.createElement('source');

      source.src = src;
      video.appendChild(source);
    }

    Vegas.videoCache[cacheKey] = video;

    return video;
  }

  private _fadeOutSound(video: HTMLVideoElement, duration: number) {
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

  private _fadeInSound(video: HTMLVideoElement, duration: number) {
    const delay = duration / 10;
    const volume = video.volume + 0.09;

    if (volume < 1) {
      video.volume = volume;

      setTimeout(() => {
        this._fadeInSound(video, duration);
      }, delay);
    }
  }

  private _options(key: string, i: number = this.slide): any {
    if (this.settings.slides[i][key] !== undefined) {
      return this.settings.slides[i][key];
    }

    return this.settings[key];
  }

  private _goto(nb: number) {
    if (typeof this.settings.slides[nb] === 'undefined') {
      nb = 0;
    }

    this.slide = nb;

    const src = this.settings.slides[nb].src;
    const videoSettings = this.settings.slides[nb].video;
    const delay = this._options('delay');
    const align = this._options('align');
    const valign = this._options('valign');
    let cover: string | boolean = this._options('cover');
    const color = this._options('color') || getComputedStyle(this.elmt).backgroundColor;
    let video: HTMLVideoElement | null = null;

    let transition = this._options('transition');
    let transitionDuration = this._options('transitionDuration');
    let animation = this._options('animation');
    let animationDuration = this._options('animationDuration');

    if (this.settings.firstTransition && this.first) {
      transition = this.settings.firstTransition || transition;
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

    if (transition === 'random' || transition instanceof Array) {
      transition = transition instanceof Array ? this._random(transition) : this._random(this.transitions);
    }

    if (animation === 'random' || animation instanceof Array) {
      animation = animation instanceof Array ? this._random(animation) : this._random(this.animations);
    }

    if (transitionDuration === 'auto' || transitionDuration > delay) {
      transitionDuration = delay;
    }

    if (animationDuration === 'auto') {
      animationDuration = delay;
    }

    const $slide = document.createElement('div');

    $slide.className = `vegas-slide vegas-transition-${transition}`;

    if (this.support.video && videoSettings) {
      video = videoSettings instanceof Array ? this._video(videoSettings) : this._video(videoSettings.src);
      video.loop = videoSettings.loop !== undefined ? videoSettings.loop : true;
      video.muted = videoSettings.mute !== undefined ? videoSettings.mute : true;

      if (!video.muted) {
        video.volume = 0;
        this._fadeInSound(video, transitionDuration);
      } else {
        video.pause();
      }

      $slide.classList.add('vegas-video');
      $slide.style.backgroundColor = color;

      if (this.support.objectFit) {
        $slide.style.objectPosition = `${align} ${valign}`;
        $slide.style.objectFit = cover;
        $slide.style.width = '100%';
        $slide.style.height = '100%';
      } else if (cover === 'contain') {
        $slide.style.width = '100%';
        $slide.style.height = '100%';
      }

      $slide.appendChild(video);
    } else {
      const img = new Image();

      img.src = src!;

      const $inner = document.createElement('div');

      $inner.className = `vegas-slide-inner vegas-animation-${animation}`;
      $inner.style.backgroundImage = `url("${src}")`;
      $inner.style.backgroundColor = color;
      $inner.style.backgroundPosition = `${align} ${valign}`;
      $inner.style.animationDuration = `${animationDuration}ms`;

      if (cover === 'repeat') {
        $inner.style.backgroundRepeat = 'repeat';
      } else {
        $inner.style.backgroundSize = cover;
      }

      $slide.appendChild($inner);
    }

    if (!this.support.transition) {
      $slide.style.display = 'none';
    }

    const $slides = Array.from(this.elmt.children).filter((child) => child.classList.contains('vegas-slide'));

    if ($slides.length) {
      this.elmt.insertBefore($slide, $slides[$slides.length - 1].nextSibling);
    } else {
      this.elmt.prepend($slide);
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

    const go = () => {
      this._timer(true);

      setTimeout(() => {
        if (transition) {
          if (this.support.transition) {
            $slides.forEach((slide) => {
              slide.classList.add(`vegas-transition-${transition}-out`);
              slide.querySelector('video')?.volume > 0 &&
                this._fadeOutSound(slide.querySelector('video')!, transitionDuration);
            });

            $slide.classList.add(`vegas-transition-${transition}-in`);
          } else {
            ($slide as HTMLElement).style.display = 'block';
          }
        }

        $slides.slice(0, $slides.length - this.settings.slidesToKeep).forEach((slide) => {
          slide.remove();
        });

        this.trigger('walk');
        this._slideShow();
      }, 100);
    };

    if (video) {
      if (video.readyState === 4) {
        video.currentTime = 0;
      }

      video.play();
      go();
    } else {
      const img = new Image();

      img.src = src!;
      img.complete ? go() : (img.onload = go);
    }
  }

  private _end() {
    this.ended = !this.settings.autoplay;
    this._timer(false);
    this.trigger('end');
  }
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
  init: () => {},
  play: () => {},
  pause: () => {},
  walk: () => {},
  slides: [],
};
