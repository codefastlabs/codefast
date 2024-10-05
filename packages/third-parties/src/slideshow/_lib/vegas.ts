import {
  type VegasAnimation,
  type VegasAnimationWithRandom,
  type VegasCallback,
  type VegasSettings,
  type VegasSlide,
  type VegasSupport,
  type VegasTransition,
  type VegasTransitionWithRandom,
  type VegasVideo,
} from '@/slideshow/_lib/types';
import { isVideoCompatible, random } from '@/slideshow/_lib/utils';
import {
  DEFAULT_ANIMATIONS,
  DEFAULT_SETTINGS,
  DEFAULT_TRANSITIONS,
} from '@/slideshow/_lib/constants';

/**
 * Vegas class to handle slideshow functionality.
 */
export class Vegas {
  private static videoCache: Record<string, HTMLVideoElement> = {};
  private readonly element: HTMLElement;
  private readonly settings: VegasSettings;
  private slideIndex: number;
  private readonly total: number;
  private readonly noShow: boolean;
  private paused: boolean;
  private ended: boolean;
  private timerElement: HTMLElement | null;
  private overlayElement: HTMLElement | null;
  private timeout: number | null;
  private first: boolean;
  private readonly transitions: VegasTransition[];
  private readonly animations: VegasAnimation[];
  private support: VegasSupport;

  /**
   * Constructs a new instance of the slider.
   *
   * @param element - The HTML element that the slider will be attached to.
   * @param options - Partial settings to customize the slider behavior.
   * @returns An instance of the slider.
   */
  constructor(element: HTMLElement, options: Partial<VegasSettings>) {
    this.element = element;
    this.settings = { ...DEFAULT_SETTINGS, ...options };
    this.slideIndex = this.settings.slideIndex;
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
      this.shuffleSlides();
    }

    this.init();
  }

  public shuffleSlides(): void {
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
      this.nextSlide();
      this.callCallback('onPlay');
    }
  }

  public pause(): void {
    this.timer(false);
    this.paused = true;
    this.callCallback('onPause');
  }

  public togglePlayPause(): void {
    this.paused ? this.play() : this.pause();
  }

  public isPlaying(): boolean {
    return !this.paused && !this.noShow;
  }

  public jumpToSlide(number: number): void {
    if (number < 0 || number > this.total - 1 || number === this.slideIndex) {
      return;
    }

    this.slideIndex = number;
    this.goto(this.slideIndex);
  }

  public nextSlide(): void {
    this.slideIndex++;

    if (this.slideIndex >= this.total) {
      if (!this.settings.loop) {
        this.end();

        return;
      }

      this.slideIndex = 0;
    }

    this.goto(this.slideIndex);
  }

  public previousSlide(): void {
    this.slideIndex--;

    if (this.slideIndex < 0) {
      if (!this.settings.loop) {
        this.slideIndex++;

        return;
      }

      this.slideIndex = this.total - 1;
    }

    this.goto(this.slideIndex);
  }

  public destroy(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  public init(): void {
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
      this.goto(this.slideIndex);

      if (this.settings.autoplay) {
        this.callCallback('onPlay');
      }
    });
  }

  private callCallback(callback: keyof VegasCallback): void {
    const currentSlide = this.settings.slides[this.slideIndex];

    if (currentSlide) {
      if (callback === 'onInit') {
        this.settings[callback]?.(this.settings);
      } else {
        this.settings[callback]?.(this.slideIndex, currentSlide);
      }
    }
  }

  private setupTransitions(): VegasTransition[] {
    return [
      ...DEFAULT_TRANSITIONS,
      ...(this.settings.transitionRegister as VegasTransition[]),
    ];
  }

  private setupAnimations(): VegasAnimation[] {
    return [
      ...DEFAULT_ANIMATIONS,
      ...(this.settings.animationRegister as VegasAnimation[]),
    ];
  }

  private setupSupport(): VegasSupport {
    return {
      objectFit: 'objectFit' in document.body.style,
      transition:
        'transition' in document.body.style ||
        'WebkitTransition' in document.body.style,
      video: isVideoCompatible(),
    };
  }

  private setupTimer(): void {
    if (this.settings.timer && this.support.transition) {
      this.timerElement = this.createElement(
        'div',
        'vegas-timer',
        this.element,
      );
      this.createElement('div', 'vegas-timer-progress', this.timerElement);
    }
  }

  private setupOverlay(): void {
    if (this.settings.overlay) {
      this.overlayElement = this.createElement(
        'div',
        'vegas-overlay',
        this.element,
      );

      if (typeof this.settings.overlay === 'string') {
        this.overlayElement.style.backgroundImage = `url(${this.settings.overlay})`;
      }
    }
  }

  private createElement(
    tag: string,
    className: string,
    parent: HTMLElement,
  ): HTMLElement {
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

  private scheduleNextSlide(): void {
    if (this.total > 1 && !this.ended && !this.paused && !this.noShow) {
      this.timeout = setTimeout(() => {
        this.nextSlide();
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
      requestAnimationFrame(() => {
        if (this.timerElement) {
          this.timerElement.classList.add('vegas-timer-running');
          const timerElement = this.timerElement.querySelector('div');

          if (timerElement) {
            const delay = this.settings.delay;

            if (delay) {
              timerElement.style.transitionDuration = `${delay}ms`;
            }
          }
        }
      });
    }
  }

  private preloadVideo(vSources: string | string[]): HTMLVideoElement {
    const cacheKey = Array.isArray(vSources) ? vSources.toString() : vSources;

    if (Vegas.videoCache[cacheKey]) {
      return Vegas.videoCache[cacheKey];
    }

    const videoSources = Array.isArray(vSources) ? vSources : [vSources];
    const videoElement = document.createElement('video');

    videoElement.preload = 'auto';

    for (const src of videoSources) {
      const source = document.createElement('source');

      source.src = src;
      videoElement.appendChild(source);
    }

    Vegas.videoCache[cacheKey] = videoElement;

    return videoElement;
  }

  private fadeOutSound(videoElement: HTMLVideoElement, duration: number): void {
    this.adjustVolume(videoElement, duration, 0.09, 'decrease');
  }

  private fadeInSound(videoElement: HTMLVideoElement, duration: number): void {
    this.adjustVolume(videoElement, duration, 0.09, 'increase');
  }

  private adjustVolume(
    videoElement: HTMLVideoElement,
    duration: number,
    step: number,
    direction: 'increase' | 'decrease',
  ): void {
    const delay = duration / 10;
    const volume =
      direction === 'increase'
        ? videoElement.volume + step
        : videoElement.volume - step;

    if (
      (direction === 'increase' && volume < 1) ||
      (direction === 'decrease' && volume > 0)
    ) {
      videoElement.volume = volume;
      setTimeout(() => {
        this.adjustVolume(videoElement, duration, step, direction);
      }, delay);
    } else if (direction === 'decrease') {
      videoElement.pause();
    }
  }

  private getValidSlideIndex(index: number): number {
    return typeof this.settings.slides[index] !== 'undefined' ? index : 0;
  }

  private goto(index: number): void {
    const slideIndex = this.getValidSlideIndex(index);
    const currentSlide = this.settings.slides[slideIndex];

    if (!currentSlide) {
      return;
    }

    this.slideIndex = slideIndex;
    const { src, video } = currentSlide;

    const {
      delay,
      align,
      alignVertical,
      color = getComputedStyle(this.element).backgroundColor,
      firstTransition,
      firstTransitionDuration,
      transition: defaultTransition,
      transitionDuration: defaultTransitionDuration,
      animation: defaultAnimation,
      animationDuration: defaultAnimationDuration,
      cover: defaultCover,
    } = this.settings;

    const cover = this.getCoverSetting(defaultCover);
    const transition = this.getTransition(firstTransition, defaultTransition);
    const transitionDuration = this.getTransitionDuration(
      firstTransitionDuration,
      defaultTransitionDuration,
      delay,
    );
    const animation = this.getAnimation(defaultAnimation);
    const animationDuration = this.getAnimationDuration(
      defaultAnimationDuration,
      delay,
    );

    const slideElement = this.createSlideElement({
      color,
      align,
      alignVertical,
      cover,
      transition,
    });
    const videoElement = this.setupSlideContent({
      slideElement,
      src,
      video,
      color,
      align,
      alignVertical,
      cover,
      animation,
      animationDuration,
      transitionDuration,
    });

    this.handleSlideTransition({
      slideElement,
      transition,
      transitionDuration,
      videoElement,
      src,
    });
  }

  private getCoverSetting(cover: string | boolean): string {
    if (cover !== 'repeat') {
      return cover === true ? 'cover' : 'contain';
    }

    return cover;
  }

  private getTransition(
    firstTransition: VegasTransition | null,
    defaultTransition: VegasTransitionWithRandom,
  ): VegasTransition {
    if (this.first) {
      this.first = false;

      return this.getRandomTransition(firstTransition ?? defaultTransition);
    }

    return this.getRandomTransition(defaultTransition);
  }

  private getTransitionDuration(
    firstTransitionDuration: number | 'auto',
    defaultTransitionDuration: number | 'auto',
    delay: number,
  ): number {
    if (this.first) {
      if (firstTransitionDuration && firstTransitionDuration !== 'auto') {
        return firstTransitionDuration;
      }

      return delay;
    }

    if (
      defaultTransitionDuration === 'auto' ||
      (defaultTransitionDuration && delay && defaultTransitionDuration > delay)
    ) {
      return delay;
    }

    return defaultTransitionDuration;
  }

  private getAnimation(
    defaultAnimation: VegasAnimationWithRandom,
  ): VegasAnimation {
    return this.getRandomAnimation(defaultAnimation);
  }

  private getAnimationDuration(
    defaultAnimationDuration: number | 'auto',
    delay: number,
  ): number {
    if (defaultAnimationDuration === 'auto') {
      return delay;
    }

    return defaultAnimationDuration;
  }

  private getRandomTransition(
    transition: VegasTransitionWithRandom,
  ): VegasTransition {
    if (transition === 'random') {
      return random(this.transitions);
    }

    return transition;
  }

  private getRandomAnimation(
    animation: VegasAnimationWithRandom,
  ): VegasAnimation {
    if (animation === 'random') {
      return random(this.animations);
    }

    return animation;
  }

  private createSlideElement({
    align,
    alignVertical,
    color,
    cover,
    transition,
  }: {
    align: string;
    alignVertical: string;
    color: string;
    cover: string;
    transition: VegasTransition | null;
  }): HTMLElement {
    const slideElement = document.createElement('div');

    slideElement.className = `vegas-slide`;

    if (this.support.transition && transition) {
      slideElement.classList.add(`vegas-transition-${transition}`);
    }

    slideElement.style.backgroundColor = color;
    slideElement.style.backgroundPosition = `${align} ${alignVertical}`;
    slideElement.style.backgroundSize = cover === 'repeat' ? 'auto' : cover;

    return slideElement;
  }

  private setupSlideContent({
    align,
    alignVertical,
    animation,
    animationDuration,
    color,
    cover,
    slideElement,
    src,
    transitionDuration,
    video,
  }: {
    align: string;
    alignVertical: string;
    animation: VegasAnimationWithRandom;
    animationDuration: number;
    color: string;
    cover: string;
    slideElement: HTMLElement;
    transitionDuration: number;
    src?: string | undefined;
    video?: VegasVideo | undefined;
  }): HTMLVideoElement | null {
    let videoElement: HTMLVideoElement | null = null;

    if (this.support.video && video) {
      videoElement = this.setupVideoElement({
        slideElement,
        video,
        color,
        align,
        alignVertical,
        cover,
        transitionDuration,
      });
    } else if (src) {
      this.setupImageElement(
        slideElement,
        src,
        color,
        align,
        alignVertical,
        cover,
        animation,
        animationDuration,
      );
    }

    return videoElement;
  }

  private setupVideoElement({
    slideElement,
    video,
    color,
    align,
    alignVertical,
    cover,
    transitionDuration,
  }: {
    align: string;
    alignVertical: string;
    color: string;
    cover: string;
    slideElement: HTMLElement;
    transitionDuration: number;
    video: VegasVideo;
  }): HTMLVideoElement {
    const videoElement = Array.isArray(video.src)
      ? this.preloadVideo(video.src)
      : this.preloadVideo(video.src);

    videoElement.loop = video.loop ?? true;
    videoElement.muted = video.mute ?? true;

    if (!videoElement.muted) {
      videoElement.volume = 0;

      if (transitionDuration) {
        this.fadeInSound(videoElement, transitionDuration);
      }
    } else {
      videoElement.pause();
    }

    slideElement.classList.add('vegas-video');
    slideElement.style.backgroundColor = color;

    if (this.support.objectFit) {
      slideElement.style.objectPosition = `${align} ${alignVertical}`;
      slideElement.style.objectFit = cover;
      slideElement.style.width = '100%';
      slideElement.style.height = '100%';
    } else if (cover === 'contain') {
      slideElement.style.width = '100%';
      slideElement.style.height = '100%';
    }

    slideElement.appendChild(videoElement);

    return videoElement;
  }

  private setupImageElement(
    slideElement: HTMLElement,
    src: string,
    color: string,
    align: string,
    alignVertical: string,
    cover: string,
    animation: VegasAnimationWithRandom,
    animationDuration: number,
  ): void {
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

    slideElement.appendChild(innerElement);
  }

  private handleSlideTransition({
    slideElement,
    transition,
    transitionDuration,
    videoElement,
    src,
  }: {
    slideElement: HTMLElement;
    transition: VegasTransition | null;
    transitionDuration: number;
    videoElement: HTMLVideoElement | null;
    src?: string | undefined;
  }): void {
    if (!this.support.transition) {
      slideElement.style.display = 'none';
    }

    const slideElements =
      this.element.querySelectorAll<HTMLElement>('.vegas-slide');

    if (slideElements.length) {
      const lastSlideElement = slideElements[slideElements.length - 1];

      if (lastSlideElement) {
        this.element.insertBefore(slideElement, lastSlideElement.nextSibling);
      }
    } else {
      this.element.prepend(slideElement);
    }

    slideElements.forEach((slide) => {
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

      requestAnimationFrame(() => {
        this.performTransition(
          transition,
          slideElements,
          transitionDuration,
          slideElement,
        );
        this.removeOldSlides(slideElements, this.settings.slidesToKeep);
        this.callCallback('onWalk');
        this.scheduleNextSlide();
      });
    };

    if (videoElement) {
      this.handleVideoElement(videoElement, go);
    } else if (src) {
      this.handleImageElement(src, go);
    }
  }

  private performTransition(
    transition: VegasTransition | null,
    slideElements: NodeListOf<HTMLElement>,
    transitionDuration: number,
    slideElement: HTMLElement,
  ): void {
    if (transition) {
      if (this.support.transition) {
        slideElements.forEach((slide) => {
          slide.style.transition = `all ${transitionDuration}ms`;
          slide.classList.add(`vegas-transition-${transition}-out`);
          const activeVideo = slide.querySelector('video');

          if (activeVideo && transitionDuration) {
            activeVideo.volume > 0 &&
              this.fadeOutSound(activeVideo, transitionDuration);
          }
        });
        slideElement.style.transition = `all ${transitionDuration}ms`;
        slideElement.classList.add(`vegas-transition-${transition}-in`);
      } else {
        slideElement.style.display = 'block';
      }
    }
  }

  private handleVideoElement(
    videoElement: HTMLVideoElement,
    callback: () => void,
  ): void {
    if (videoElement.readyState === 4) {
      videoElement.currentTime = 0;
    }

    void videoElement.play();
    callback();
  }

  private handleImageElement(src: string, callback: () => void): void {
    const img = new Image();

    img.src = src;

    if (img.complete) {
      callback();
    } else {
      img.onload = callback;
    }
  }

  private removeOldSlides(
    slideElements: NodeListOf<HTMLElement>,
    slidesToKeep: number,
  ): void {
    Array.from(slideElements)
      .slice(0, slideElements.length - slidesToKeep)
      .forEach((slide) => {
        slide.remove();
      });
  }

  private end(): void {
    this.ended = !this.settings.autoplay;
    this.timer(false);
    this.callCallback('onEnd');
  }
}
