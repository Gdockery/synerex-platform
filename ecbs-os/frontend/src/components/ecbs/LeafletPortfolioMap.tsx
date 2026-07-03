"use client";

import { useEffect, useRef } from "react";

type PortfolioMapSite = {
  annualSavings: string;
  lat?: number;
  lng?: number;
  location: string;
  site: string;
  status: "Healthy" | "Warning";
};

type LeafletBounds = {
  extend: (coordinate: [number, number]) => void;
  isValid: () => boolean;
};

type LeafletMap = {
  fitBounds: (
    bounds: LeafletBounds,
    options: { maxZoom: number; padding: [number, number] },
  ) => void;
  invalidateSize: () => void;
  remove: () => void;
  setView: (coordinate: [number, number], zoom: number) => LeafletMap;
};

type LeafletApi = {
  divIcon: (options: {
    className: string;
    html: string;
    iconAnchor: [number, number];
    iconSize: [number, number];
  }) => unknown;
  latLngBounds: (coordinates: [number, number][]) => LeafletBounds;
  map: (
    element: HTMLElement,
    options: {
      attributionControl: boolean;
      scrollWheelZoom: boolean;
      zoomControl: boolean;
    },
  ) => LeafletMap;
  marker: (
    coordinate: [number, number],
    options: { icon: unknown },
  ) => {
    addTo: (map: LeafletMap) => {
      bindPopup: (html: string) => void;
    };
  };
  tileLayer: (
    urlTemplate: string,
    options: { maxZoom: number },
  ) => {
    addTo: (map: LeafletMap) => void;
  };
};

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

const leafletCssHref = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const leafletScriptSrc = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function ensureLeaflet(): Promise<LeafletApi | undefined> {
  if (window.L) {
    return Promise.resolve(window.L);
  }

  if (!document.querySelector(`link[href="${leafletCssHref}"]`)) {
    const link = document.createElement("link");
    link.href = leafletCssHref;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${leafletScriptSrc}"]`,
  );

  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener("load", () => resolve(window.L), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = leafletScriptSrc;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function LeafletPortfolioMap({ sites }: { sites: PortfolioMapSite[] }) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    ensureLeaflet().then((L) => {
      if (cancelled || !L || !mapEl.current || mapRef.current) {
        return;
      }

      const map = L.map(mapEl.current, {
        attributionControl: false,
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView([24, -55], 2);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 },
      ).addTo(map);

      const bounds = L.latLngBounds([]);

      sites.filter((site) => site.lat != null && site.lng != null).forEach((site) => {
        const color = site.status === "Healthy" ? "#00e676" : "#ffd740";
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.85);box-shadow:0 0 12px ${color};"></div>`,
          iconAnchor: [7, 7],
          iconSize: [14, 14],
        });

        L.marker([site.lat as number, site.lng as number], { icon })
          .addTo(map)
          .bindPopup(
            `<b>${site.site}</b><br>${site.location}<br>Savings: ${site.annualSavings}<br>Status: ${site.status}`,
          );

        bounds.extend([site.lat as number, site.lng as number]);
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { maxZoom: 5, padding: [24, 24] });
      }

      setTimeout(() => map.invalidateSize(), 0);
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [sites]);

  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-md bg-[#0d1829] shadow-[inset_0_0_32px_rgba(0,0,0,0.35)]">
      <div className="h-full w-full" ref={mapEl} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#03111d] to-transparent" />
    </div>
  );
}
