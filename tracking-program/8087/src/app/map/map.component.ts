import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { CurrentUserService } from '../shared/user/currentUser.service';

declare var Cesium: any;

const CESIUM_VERSION   = '1.122';
const CESIUM_CDN       = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;
const CESIUM_ION_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkNWU5MzJlNC1hZDBmLTQ2MjAtYWE3Yi0xYjJjNmIyYTdhYWEiLCJpZCI6NDA5NTM5LCJpYXQiOjE3NzQ1MzY5OTV9.L5BllZ2t0FT4ubs9PFawOWTSs0GvyLuP3zzgWDj3b9c';

@Component({
  templateUrl: './map.component.html'
})
export class MapComponent implements AfterViewInit, OnDestroy {

  private viewer: any;

  directionsUrl: string  = '';
  projectName: string    = '';
  projectAddress: string = '';

  constructor(private userService: CurrentUserService) {}

  ngAfterViewInit() {
    this.loadCesiumScript()
      .then(() => this.initGlobe())
      .catch(err => console.error('Failed to load CesiumJS:', err));
  }

  ngOnDestroy() {
    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.destroy();
      this.viewer = null;
    }
  }

  private loadCesiumScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Cesium) { resolve(); return; }

      if (!document.getElementById('cesium-widgets-css')) {
        const link = document.createElement('link');
        link.id   = 'cesium-widgets-css';
        link.rel  = 'stylesheet';
        link.href = `${CESIUM_CDN}/Widgets/widgets.css`;
        document.head.appendChild(link);
      }

      (window as any).CESIUM_BASE_URL = `${CESIUM_CDN}/`;

      const script   = document.createElement('script');
      script.id      = 'cesium-js';
      script.src     = `${CESIUM_CDN}/Cesium.js`;
      script.onload  = () => resolve();
      script.onerror = () => reject(new Error('Cesium script failed to load'));
      document.head.appendChild(script);
    });
  }

  private async initGlobe() {
    // Pre-flight WebGL check — logs renderer info to help diagnose failures
    try {
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 1; testCanvas.height = 1;
      const gl: any = testCanvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false })
                   || testCanvas.getContext('webgl',  { failIfMajorPerformanceCaveat: false });
      if (gl) {
        console.info('WebGL renderer:', gl.getParameter(gl.RENDERER));
        console.info('WebGL vendor:',   gl.getParameter(gl.VENDOR));
        console.info('WebGL version:',  gl.getParameter(gl.VERSION));
      } else {
        console.warn('WebGL pre-flight: getContext returned null');
      }
    } catch (e) { console.warn('WebGL pre-flight failed:', e); }

    Cesium.Ion.defaultAccessToken = CESIUM_ION_TOKEN;

    // Esri World Imagery — free satellite tiles, no API key required
    // NOTE: Cesium 1.107+ removed `imageryProvider` from Viewer constructor.
    //       Use `baseLayer: new Cesium.ImageryLayer(provider)` instead.
    const baseLayer = new Cesium.ImageryLayer(
      new Cesium.UrlTemplateImageryProvider({
        url:    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        credit: 'Esri, Maxar, Earthstar Geographics, USDA FSA, USGS, Aerogrid, IGN, IGP, and the GIS User Community',
      })
    );

    // Cesium World Terrain via ion, flat ellipsoid fallback
    // NOTE: Cesium 1.107+ also uses `terrain` option instead of `terrainProvider`
    let terrain: any;
    try {
      terrain = await Cesium.Terrain.fromWorldTerrain();
    } catch (e) {
      console.warn('Cesium World Terrain unavailable, using flat ellipsoid:', e);
      terrain = new Cesium.Terrain(new Cesium.EllipsoidTerrainProvider());
    }

    this.viewer = new Cesium.Viewer('map-container', {
      baseLayer,
      terrain,
      baseLayerPicker:       false,
      geocoder:              false,
      homeButton:            true,
      sceneModePicker:       true,
      navigationHelpButton:  false,
      animation:             false,
      timeline:              false,
      fullscreenButton:      true,
      creditContainer:       document.createElement('div'),
      contextOptions: {
        requestWebgl2: true,
        webgl: { alpha: false, antialias: true, failIfMajorPerformanceCaveat: false },
      },
    });

    this.viewer.scene.globe.enableLighting = false;

    const project: any     = this.userService.user && this.userService.user.selectedProject;
    const location: string  = project && project.location;
    const label: string     = project && project.name;

    this.projectName = label || '';

    if (location) { this.geocodeAndFly(location, label); }
  }

  /**
   * Try Nominatim with progressively shorter address fragments.
   * Raw utility addresses like "4321 OAK ST LLC 4321 OAK ST DALLAS, TX" often
   * fail in full but succeed once the messy prefix is stripped.
   */
  private async tryGeocode(address: string): Promise<{ lat: number; lon: number } | null> {
    // Build candidate list: full string, then drop leading comma-segments one by one
    const parts  = address.split(',').map(s => s.trim()).filter(Boolean);
    const candidates: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      candidates.push(parts.slice(i).join(', '));
    }
    // Also add a word-stripping fallback on the first segment (handles "LLC 4321 OAK ST DALLAS")
    const firstWords = parts[0] ? parts[0].split(/\s+/) : [];
    for (let i = 1; i < firstWords.length; i++) {
      candidates.push([firstWords.slice(i).join(' '), ...parts.slice(1)].join(', '));
    }

    for (const candidate of candidates) {
      if (!candidate || candidate.length < 3) { continue; }
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(candidate)}`;
        const r   = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const res = await r.json();
        if (res && res.length) {
          const lat = parseFloat(res[0].lat);
          const lon = parseFloat(res[0].lon);
          if (!isNaN(lat) && !isNaN(lon)) {
            console.info(`Geocoded "${candidate}" (from "${address}") → ${lat}, ${lon}`);
            return { lat, lon };
          }
        }
      } catch (e) { console.warn('Geocode attempt failed for:', candidate, e); }
    }
    console.warn('Geocoding exhausted all candidates for:', address);
    return null;
  }

  private geocodeAndFly(address: string, label: string) {
    this.tryGeocode(address)
      .then(coords => {
        if (!coords) { return; }
        const { lat, lon } = coords;

        this.directionsUrl    = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
        this.projectAddress   = address;

        this.viewer.camera.flyTo({
          destination:  Cesium.Cartesian3.fromDegrees(lon, lat, 250),
          orientation:  { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-85), roll: 0 },
          duration:     4,
        });

        // PointGraphics avoids the texSubImage2D WebGL crash caused by
        // canvas-generated PinBuilder images in certain browser/GPU combos.
        this.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
          point: {
            pixelSize:                20,
            color:                    Cesium.Color.RED,
            outlineColor:             Cesium.Color.WHITE,
            outlineWidth:             3,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: label ? {
            text:                     label,
            font:                     'bold 14pt sans-serif',
            fillColor:                Cesium.Color.WHITE,
            style:                    Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor:             Cesium.Color.BLACK,
            outlineWidth:             3,
            verticalOrigin:           Cesium.VerticalOrigin.BOTTOM,
            pixelOffset:              new Cesium.Cartesian2(0, -20),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          } : undefined,
        });
      })
      .catch(e => console.error('Geocoding error:', e));
  }
}
