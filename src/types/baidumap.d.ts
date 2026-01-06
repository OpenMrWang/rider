// 百度地图类型声明
declare namespace BMap {
  class Map {
    constructor(container: string | HTMLElement, opts?: any);
    centerAndZoom(point: Point, zoom: number): void;
    destroy(): void;
  }

  class Point {
    constructor(lng: number, lat: number);
    lng: number;
    lat: number;
  }

  class Polyline {
    constructor(points: Point[], opts?: any);
    setPath(points: Point[]): void;
    setMap(map: Map | null): void;
  }

  class Marker {
    constructor(point: Point, opts?: any);
    setPosition(point: Point): void;
    setMap(map: Map | null): void;
  }
}

