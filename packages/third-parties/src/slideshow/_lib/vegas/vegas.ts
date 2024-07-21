import {
  type Animation,
  type Transition,
  type VegasCallback,
  type VegasSettings,
  type VegasSlide,
  type VegasSupport,
} from '@/slideshow/_lib/vegas/types';

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
  private support: VegasSupport;

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
    this.transitions = this.setupTransitions();
    this.animations = this.setupAnimations();
    this.support = this.setupSupport();

    if (this.settings.shuffle) {
      this.shuffle();
    }

    this.init();
  }

  static isVideoCompatible(): boolean {
    return !/(?<userAgent>Android|webOS|Phone|iPad|iPod|BlackBerry|Windows Phone)/i.test(navigator.userAgent);
  }

  static random<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)] as T;
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
      this.callCallback('onPlay');
    }
  }

  public pause(): void {
    this.timer(false);
    this.paused = true;
    this.callCallback('onPause');
  }

  public toggle(): void {
    this.paused ? this.play() : this.pause();
  }

  public playing(): boolean {
    return !this.paused && !this.noShow;
  }

  public jump(number: number): void {
    if (number < 0 || number > this.total - 1 || number === this.slide) {
      return;
    }

    this.slide = number;
    this.goto(this.slide);
  }

  public next(): void {
    this.slide++;

    if (this.slide >= this.total) {
      if (!this.settings.loop) {
        this.end();

        return;
      }

      this.slide = 0;
    }

    this.goto(this.slide);
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

    this.goto(this.slide);
  }

  public destroy(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  private callCallback(callback: keyof VegasCallback): void {
    const currentSlide = this.settings.slides[this.slide];

    if (currentSlide) {
      if (callback === 'onInit') {
        this.settings[callback]?.(this.settings);
      } else {
        this.settings[callback]?.(this.slide, currentSlide);
      }
    }
  }

  private setupTransitions(): Transition[] {
    const defaultTransitions: Transition[] = [
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

    return defaultTransitions.concat(this.settings.transitionRegister as Transition[]);
  }

  private setupAnimations(): Animation[] {
    const defaultAnimations: Animation[] = [
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

    return defaultAnimations.concat(this.settings.animationRegister as Animation[]);
  }

  private setupSupport(): VegasSupport {
    return {
      objectFit: 'objectFit' in document.body.style,
      transition: 'transition' in document.body.style || 'WebkitTransition' in document.body.style,
      video: Vegas.isVideoCompatible(),
    };
  }

  private init(): void {
    // Preloading
    this.preloadSlides();

    // Timer
    this.setupTimer();

    // Overlay
    this.setupOverlay();

    // Container
    this.element.classList.add('vegas-container');

    // Slides
    requestAnimationFrame(() => {
      this.callCallback('onInit');
      this.goto(this.slide);

      if (this.settings.autoplay) {
        this.callCallback('onPlay');
      }
    });
  }

  private setupTimer(): void {
    if (this.settings.timer && this.support.transition) {
      this.timerElement = this.createElement('div', 'vegas-timer', this.element);
      this.createElement('div', 'vegas-timer-progress', this.timerElement);
    }
  }

  private setupOverlay(): void {
    if (this.settings.overlay) {
      this.overlayElement = this.createElement('div', 'vegas-overlay', this.element);

      if (typeof this.settings.overlay === 'string') {
        this.overlayElement.style.backgroundImage = `url(${this.settings.overlay})`;
      }
    }
  }

  private createElement(tag: string, className: string, parent: HTMLElement): HTMLElement {
    const element = document.createElement(tag);

    element.className = className;
    parent.appendChild(element);

    return element;
  }

  private preloadSlides(): void {
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
            this.preloadVideo(slide.video);
          } else {
            this.preloadVideo(slide.video.src);
          }
        }
      }
    }
  }

  private slideShow(): void {
    if (this.total > 1 && !this.ended && !this.paused && !this.noShow) {
      this.timeout = setTimeout(() => {
        this.next();
      }, this.settings.delay);
    }
  }

  private timer(state: boolean): void {
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
            const delay = this.settings.delay;

            if (delay) {
              timerElement.style.transitionDuration = `${delay - timeout}ms`;
            }
          }
        }
      }, timeout);
    }
  }

  private preloadVideo(vSources: string | string[]): HTMLVideoElement {
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

  private fadeOutSound(video: HTMLVideoElement, duration: number): void {
    this.adjustVolume(video, duration, 0.09, 'decrease');
  }

  private fadeInSound(video: HTMLVideoElement, duration: number): void {
    this.adjustVolume(video, duration, 0.09, 'increase');
  }

  private adjustVolume(
    video: HTMLVideoElement,
    duration: number,
    step: number,
    direction: 'increase' | 'decrease',
  ): void {
    const delay = duration / 10;
    const volume = direction === 'increase' ? video.volume + step : video.volume - step;

    if ((direction === 'increase' && volume < 1) || (direction === 'decrease' && volume > 0)) {
      video.volume = volume;
      setTimeout(() => {
        this.adjustVolume(video, duration, step, direction);
      }, delay);
    } else if (direction === 'decrease') {
      video.pause();
    }
  }

  private goto(number: number): void {
    let nb = number;

    if (typeof this.settings.slides[nb] === 'undefined') {
      nb = 0;
    }

    this.slide = nb;

    const src = this.settings.slides[nb]?.src;
    const videoSettings = this.settings.slides[nb]?.video;
    const delay = this.settings.delay;
    const align = this.settings.align;
    const alignVertical = this.settings.alignVertical;
    let cover = this.settings.cover;
    const color = this.settings.color ?? getComputedStyle(this.element).backgroundColor;
    let video: HTMLVideoElement | null = null;

    let transition = this.settings.transition;
    let transitionDuration = this.settings.transitionDuration;
    let animation = this.settings.animation;
    let animationDuration = this.settings.animationDuration;

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
      transition = Array.isArray(transition) ? Vegas.random(transition) : Vegas.random(this.transitions);
    }

    if (animation === 'random' || Array.isArray(animation)) {
      animation = Array.isArray(animation) ? Vegas.random(animation) : Vegas.random(this.animations);
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
      video = Array.isArray(videoSettings) ? this.preloadVideo(videoSettings) : this.preloadVideo(videoSettings.src);
      video.loop = videoSettings.loop ?? true;
      video.muted = videoSettings.mute ?? true;

      if (!video.muted) {
        video.volume = 0;

        if (transitionDuration) {
          this.fadeInSound(video, transitionDuration);
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

    this.timer(false);

    const go = (): void => {
      this.timer(true);
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
                  videoElement.volume > 0 && this.fadeOutSound(videoElement, transitionDuration);
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

        this.callCallback('onWalk');

        this.slideShow();
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

  private end(): void {
    this.ended = !this.settings.autoplay;
    this.timer(false);
    this.callCallback('onEnd');
  }
}
