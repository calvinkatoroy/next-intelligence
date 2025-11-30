declare module 'animejs' {
  interface AnimeInstance {
    play(): void;
    pause(): void;
    restart(): void;
    reverse(): void;
    seek(time: number): void;
  }

  interface AnimeParams {
    targets?: any;
    duration?: number;
    delay?: number;
    easing?: string;
    opacity?: number | number[];
    translateY?: number | number[] | string | string[];
    translateX?: number | number[] | string | string[];
    scale?: number | number[];
    [key: string]: any;
  }

  interface AnimeStatic {
    (params: AnimeParams): AnimeInstance;
    stagger(value: number, options?: { start?: number; from?: string }): any;
    timeline(params?: any): any;
    random(min: number, max: number): number;
  }

  const anime: AnimeStatic;
  export default anime;
}
