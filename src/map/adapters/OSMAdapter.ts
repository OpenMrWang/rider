import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapAdapter } from '../../types/map';
import type { Point } from '../../types';
import type { LineString } from 'geojson';

export class OSMAdapter implements MapAdapter {
  private map: maplibregl.Map | null = null;
  private routeSourceId = 'route';
  private routeLayerId = 'route';
  private pointsSourceId = 'points';
  private pointsLayerId = 'points';

  init(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`容器 ${containerId} 不存在`);
    }

    this.map = new maplibregl.Map({
      container: containerId,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
          },
        ],
      },
      center: [116.3974, 39.9093], // 默认北京
      zoom: 10,
    });

    // 添加路线数据源和图层
    this.map.on('load', () => {
      if (!this.map) return;

      // 路线数据源
      this.map.addSource(this.routeSourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        },
      });

      // 路线图层
      this.map.addLayer({
        id: this.routeLayerId,
        type: 'line',
        source: this.routeSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
        },
      });

      // 点位数据源
      this.map.addSource(this.pointsSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // 点位图层
      this.map.addLayer({
        id: this.pointsLayerId,
        type: 'circle',
        source: this.pointsSourceId,
        paint: {
          'circle-radius': 6,
          'circle-color': '#ef4444',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
    });
  }

  setCenter(lat: number, lon: number, zoom: number): void {
    if (this.map) {
      this.map.setCenter([lon, lat]);
      this.map.setZoom(zoom);
    }
  }

  drawRoute(route: LineString): void {
    if (!this.map) return;

    const source = this.map.getSource(this.routeSourceId) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        geometry: route,
        properties: {},
      });
    }
  }

  drawPoints(points: Point[]): void {
    if (!this.map) return;

    const features = points.map((point) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [point.lon, point.lat],
      },
      properties: {
        name: point.name,
      },
    }));

    const source = this.map.getSource(this.pointsSourceId) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features,
      });
    }
  }

  clearRoute(): void {
    if (!this.map) return;
    const source = this.map.getSource(this.routeSourceId) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [],
        },
      });
    }
  }

  clearPoints(): void {
    if (!this.map) return;
    const source = this.map.getSource(this.pointsSourceId) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: [],
      });
    }
  }

  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

