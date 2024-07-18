export interface Slide {
  align?: string;
  animation?: string;
  animationDuration?: number;
  color?: string;
  cover?: boolean;
  delay?: number;
  src?: string;
  transition?: string;
  transitionDuration?: number;
  valign?: string;
  video?: {
    loop: boolean;
    mute: boolean;
    src: string[];
  };
}

export interface SlideshowSettings {
  align: string;
  animation: string | null;
  animationDuration: number | 'auto';
  animationRegister: string[];
  autoplay: boolean;
  color: string | null;
  cover: boolean;
  delay: number;
  firstTransition: string | null;
  firstTransitionDuration: number | null;
  loop: boolean;
  overlay: boolean;
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
  init?: () => void;
  pause?: () => void;
  play?: () => void;
  walk?: () => void;
}

const defaults: SlideshowSettings = {
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
  slides: [],
};

const videoCache: Record<string, HTMLVideoElement> = {};

export class Slideshow {
  elmt: HTMLElement;
  settings: SlideshowSettings;
  slide: number;
  total: number;
  noshow: boolean;
  paused: boolean;
  ended: boolean;
  $elmt: HTMLElement;
  $timer: HTMLElement | null;
  $overlay: HTMLElement | null;
  $slide: HTMLElement | null;
  timeout: number | null;
  first: boolean;
  transitions: string[];
  animations: string[];
  support: { objectFit: boolean; transition: boolean; video: boolean };

  constructor(elmt: HTMLElement, options?: Partial<SlideshowSettings>) {
    this.elmt = elmt;
    this.settings = { ...defaults, ...options };
    this.slide = this.settings.slide;
    this.total = this.settings.slides.length;
    this.noshow = this.total < 2;
    this.paused = !this.settings.autoplay || this.noshow;
    this.ended = false;
    this.$elmt = elmt;
    this.$timer = null;
    this.$overlay = null;
    this.$slide = null;
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
      video: this.isVideoCompatible(),
    };

    if (this.settings.shuffle) {
      this.shuffle();
    }

    this._init();
  }

  shuffle(): void {
    for (let i = this.total - 1; i > 0; i--) {
      const rand = Math.floor(Math.random() * (i + 1));

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- temporary
      // @ts-expect-error
      [this.settings.slides[i], this.settings.slides[rand]] = [this.settings.slides[rand], this.settings.slides[i]];
    }
  }

  play(): void {
    if (this.paused) {
      this.paused = false;
      this.next();
      this.trigger('play');
    }
  }

  pause(): void {
    this._timer(false);
    this.paused = true;
    this.trigger('pause');
  }

  toggle(): void {
    if (this.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  playing(): boolean {
    return !this.paused && !this.noshow;
  }

  current(advanced?: boolean) {
    if (advanced) {
      return {
        slide: this.slide,
        data: this.settings.slides[this.slide],
      };
    }

    return this.slide;
  }

  jump(nb: number): void {
    if (nb < 0 || nb > this.total - 1 || nb === this.slide) {
      return;
    }

    this.slide = nb;
    this._goto(this.slide);
  }

  next(): void {
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

  previous(): void {
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

  trigger(fn: string): void {
    const params = fn === 'init' ? [this.settings] : [this.slide, this.settings.slides[this.slide]];
    const event = new CustomEvent(`slideshow${fn}`, { detail: params });

    this.$elmt.dispatchEvent(event);

    const callback = this.settings[fn as keyof SlideshowSettings] as Function;

    if (typeof callback === 'function') {
      callback.apply(this.$elmt, params);
    }
  }

  options(key: string | Partial<SlideshowSettings>, value?: any): any {
    const oldSlides = [...this.settings.slides];

    if (typeof key === 'object') {
      this.settings = { ...defaults, ...key };
    } else if (typeof key === 'string') {
      if (value === undefined) {
        return this.settings[key as keyof SlideshowSettings];
      }

      this.settings[key as keyof SlideshowSettings] = value;
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

  destroy(): void {
    clearTimeout(this.timeout!);

    this.$elmt.classList.remove('slideshow-container');
    const slides = this.$elmt.querySelectorAll('.slideshow-slide');

    slides.forEach((slide) => {
      slide.remove();
    });

    const wrapper = this.$elmt.querySelector('.slideshow-wrapper')!;

    if (wrapper) {
      Array.from(wrapper.children).forEach((child) => this.$elmt.appendChild(child.cloneNode(true)));
      wrapper.remove();
    }

    if (this.settings.timer && this.$timer) {
      this.$timer.remove();
    }

    if (this.settings.overlay && this.$overlay) {
      this.$overlay.remove();
    }

    (this.elmt as any)._slideshow = null;
  }

  isVideoCompatible(): boolean {
    return !/(Android|webOS|Phone|iPad|iPod|BlackBerry|Windows Phone)/i.test(navigator.userAgent);
  }

  private _init() {
    // Preloading
    this._preload();

    // Timer
    if (this.settings.timer && this.support.transition) {
      this.$timer = document.createElement('div');
      this.$timer.className = 'slideshow-timer';
      const progress = document.createElement('div');

      progress.className = 'slideshow-timer-progress';
      this.$timer.appendChild(progress);
      this.$elmt.prepend(this.$timer);
    }

    // Overlay
    if (this.settings.overlay) {
      this.$overlay = document.createElement('div');
      this.$overlay.className = 'slideshow-overlay';

      if (typeof this.settings.overlay === 'string') {
        this.$overlay.style.backgroundImage = `url(${this.settings.overlay})`;
      }

      this.$elmt.prepend(this.$overlay);
    }

    // Container
    this.$elmt.classList.add('slideshow-container');

    setTimeout(() => {
      this.trigger('init');
      this._goto(this.slide);

      if (this.settings.autoplay) {
        this.trigger('play');
      }
    }, 1);
  }

  private _preload() {
    this.settings.slides.forEach((slide) => {
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
    });
  }

  private _random<T>(array: T[]): T {
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
    clearTimeout(this.timeout!);

    if (!this.$timer) {
      return;
    }

    this.$timer.classList.remove('slideshow-timer-running');
    const progress = this.$timer.querySelector('div') as HTMLElement;

    progress.style.transitionDuration = '0ms';

    if (this.ended || this.paused || this.noshow) {
      return;
    }

    if (state) {
      setTimeout(() => {
        this.$timer!.classList.add('slideshow-timer-running');
        progress.style.transitionDuration = `${this._options('delay') - 100}ms`;
      }, 100);
    }
  }

  private _video(srcs: string[]): HTMLVideoElement {
    const cacheKey = srcs.toString();

    if (videoCache[cacheKey]) {
      return videoCache[cacheKey];
    }

    const video = document.createElement('video');

    video.preload = 'true';

    srcs.forEach((src) => {
      const source = document.createElement('source');

      source.src = src;
      video.appendChild(source);
    });

    videoCache[cacheKey] = video;

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

  private _options(key: keyof SlideshowSettings, i = this.slide): any {
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

    const $slides = Array.from(this.$elmt.children).filter((child) =>
      child.classList.contains('slideshow-slide'),
    ) as HTMLElement[];
    const src = this.settings.slides[nb].src;
    const videoSettings = this.settings.slides[nb].video;
    const delay = this._options('delay');
    const align = this._options('align');
    const valign = this._options('valign');
    let cover = this._options('cover');
    const color = this._options('color') || getComputedStyle(this.$elmt).backgroundColor;
    let transition = this._options('transition');
    let transitionDuration = this._options('transitionDuration');
    let animation = this._options('animation');
    let animationDuration = this._options('animationDuration');

    let $slide: HTMLElement;
    let $inner: HTMLElement | undefined;
    let $video: HTMLElement | undefined;
    let video: HTMLVideoElement | undefined;
    let img: HTMLImageElement | undefined;

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
      if (cover === true) {
        cover = 'cover';
      } else if (cover === false) {
        cover = 'contain';
      }
    }

    if (transition === 'random' || Array.isArray(transition)) {
      if (Array.isArray(transition)) {
        transition = this._random(transition);
      } else {
        transition = this._random(this.transitions);
      }
    }

    if (animation === 'random' || Array.isArray(animation)) {
      if (Array.isArray(animation)) {
        animation = this._random(animation);
      } else {
        animation = this._random(this.animations);
      }
    }

    if (transitionDuration === 'auto' || transitionDuration > delay) {
      transitionDuration = delay;
    }

    if (animationDuration === 'auto') {
      animationDuration = delay;
    }

    $slide = document.createElement('div');
    $slide.className = 'slideshow-slide';

    if (this.support.transition && transition) {
      $slide.classList.add(`slideshow-transition-${transition}`);
    }

    // Video
    if (this.support.video && videoSettings) {
      if (Array.isArray(videoSettings)) {
        video = this._video(videoSettings);
      } else {
        video = this._video(videoSettings.src);
      }

      video.loop = videoSettings.loop !== undefined ? videoSettings.loop : true;
      video.muted = videoSettings.mute !== undefined ? videoSettings.mute : true;

      if (!video.muted) {
        video.volume = 0;
        this._fadeInSound(video, transitionDuration);
      } else {
        video.pause();
      }

      $video = video as HTMLElement;
      $video.classList.add('slideshow-video');
      $video.style.backgroundColor = color;

      if (this.support.objectFit) {
        $video.style.objectPosition = `${align} ${valign}`;
        $video.style.objectFit = cover;
        $video.style.width = '100%';
        $video.style.height = '100%';
      } else if (cover === 'contain') {
        $video.style.width = '100%';
        $video.style.height = '100%';
      }

      $slide.appendChild($video);

      // Image
    } else if (src) {
      img = new Image();

      $inner = document.createElement('div');
      $inner.className = 'slideshow-slide-inner';
      $inner.style.backgroundImage = `url("${src}")`;
      $inner.style.backgroundColor = color;
      $inner.style.backgroundPosition = `${align} ${valign}`;

      if (cover === 'repeat') {
        $inner.style.backgroundRepeat = 'repeat';
      } else {
        $inner.style.backgroundSize = cover;
      }

      if (this.support.transition && animation) {
        $inner.classList.add(`slideshow-animation-${animation}`);
        $inner.style.animationDuration = `${animationDuration}ms`;
      }

      $slide.appendChild($inner);
    }

    if (!this.support.transition) {
      $slide.style.display = 'none';
    }

    if ($slides.length) {
      this.$elmt.insertBefore($slide, $slides[$slides.length - 1].nextSibling);
    } else {
      this.$elmt.prepend($slide);
    }

    $slides.forEach((slide) => {
      slide.className = 'slideshow-slide';

      if (slide.tagName === 'VIDEO') {
        slide.className += ' slideshow-video';
      }

      if (transition) {
        slide.className += ` slideshow-transition-${transition} slideshow-transition-${transition}-in`;
      }
    });

    this._timer(false);

    const go = () => {
      this._timer(true);

      setTimeout(() => {
        if (transition) {
          if (this.support.transition) {
            $slides.forEach((slide) => {
              slide.style.transition = `all ${transitionDuration}ms`;
              slide.classList.add(`slideshow-transition-${transition}-out`);

              const videoElement = slide.querySelector('video')!;

              if (videoElement) {
                videoElement.volume = 1;
                this._fadeOutSound(videoElement, transitionDuration);
              }
            });

            $slide.style.transition = `all ${transitionDuration}ms`;
            $slide.classList.add(`slideshow-transition-${transition}-in`);
          } else {
            $slide.style.display = 'block';
          }
        }

        $slides.forEach((slide, index) => {
          if (index < $slides.length - this.settings.slidesToKeep) {
            slide.remove();
          }
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
    } else if (img) {
      img.src = src;

      if (img.complete) {
        go();
      } else {
        img.onload = go;
      }
    }
  }

  private _end(): void {
    this.ended = !this.settings.autoplay;
    this._timer(false);
    this.trigger('end');
  }
}
