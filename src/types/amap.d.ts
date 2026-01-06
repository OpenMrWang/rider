// 高德地图类型声明
declare namespace AMap {
  class Map {
    constructor(container: string | HTMLElement, opts?: any);
    setCenter(center: [number, number]): void;
    setZoom(zoom: number): void;
    destroy(): void;
  }

  class Polyline {
    constructor(opts?: any);
    setPath(path: number[][]): void;
    setMap(map: Map | null): void;
  }

  class Marker {
    constructor(opts?: any);
    setPosition(position: [number, number]): void;
    setMap(map: Map | null): void;
  }
}

