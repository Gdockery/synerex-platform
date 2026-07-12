type PortfolioMapSite = {
  annualSavings: string;
  lat?: number;
  lng?: number;
  location: string;
  site: string;
  status: "Healthy" | "Warning";
};

const defaultCenter = {
  lat: 30.1979023,
  lng: -92.07755,
};

const tileSize = 256;
const zoom = 15;
const mapWidth = 1024;
const mapHeight = 768;

export function LeafletPortfolioMap({ sites }: { sites: PortfolioMapSite[] }) {
  const markers = sites.map(withCoordinates).filter((site): site is PortfolioMapSite & { lat: number; lng: number } => site.lat != null && site.lng != null);
  const center = markers.length > 0 ? centerOf(markers) : defaultCenter;
  const centerPixel = latLngToPixel(center.lat, center.lng);
  const centerTile = {
    x: Math.floor(centerPixel.x / tileSize),
    y: Math.floor(centerPixel.y / tileSize),
  };
  const tiles = mapTiles(centerTile);

  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-md bg-[#03111d] shadow-[inset_0_0_32px_rgba(0,0,0,0.35)]">
      <div className="absolute left-1/2 top-1/2 h-[768px] w-[1024px] -translate-x-1/2 -translate-y-1/2">
        {tiles.map((tile) => {
          const left = (tile.x - centerTile.x) * tileSize - (centerPixel.x % tileSize) + mapWidth / 2;
          const top = (tile.y - centerTile.y) * tileSize - (centerPixel.y % tileSize) + mapHeight / 2;

          return (
            <img
              alt=""
              className="absolute size-[256px] select-none"
              draggable={false}
              key={`${tile.x}-${tile.y}`}
              referrerPolicy="no-referrer"
              src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`}
              style={{ left, top }}
            />
          );
        })}
        {markers.map((site) => {
          const position = markerPosition(site, centerPixel);
          const color = site.status === "Healthy" ? "#05ff5e" : "#ffd740";

          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-full"
              key={site.site}
              style={{ left: position.x, top: position.y }}
              title={`${site.site}: ${site.annualSavings}`}
            >
              <div className="relative">
                <div className="grid size-7 place-items-center rounded-full border-2 border-white bg-[#03111d] shadow-[0_0_18px_currentColor]" style={{ color }}>
                  <span className="size-3 rounded-full" style={{ background: color }} />
                </div>
                <div className="absolute left-1/2 top-[25px] h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-white bg-[#03111d]" />
              </div>
              <div className="mt-1 -translate-x-[42%] whitespace-nowrap rounded border border-cyan-300/20 bg-[#061421]/95 px-2 py-1 text-[9px] text-white shadow-lg">
                {site.site}
              </div>
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,17,29,.18),rgba(3,17,29,.32)),radial-gradient(circle_at_50%_50%,rgba(20,125,255,0.12),transparent_58%)]" />
      <div className="absolute left-2 top-2 grid gap-1">
        <button className="grid size-6 place-items-center rounded border border-cyan-300/20 bg-[#061421] text-xs text-slate-300">+</button>
        <button className="grid size-6 place-items-center rounded border border-cyan-300/20 bg-[#061421] text-xs text-slate-300">−</button>
        <button className="grid size-6 place-items-center rounded border border-cyan-300/20 bg-[#061421] text-[10px] text-slate-300">⌖</button>
      </div>
      <div className="absolute right-2 top-2 rounded border border-cyan-300/20 bg-[#061421]/90 px-2 py-1 text-[8px] text-slate-300">
        OpenStreetMap
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#03111d] to-transparent" />
    </div>
  );
}

function withCoordinates(site: PortfolioMapSite): PortfolioMapSite {
  if (site.lat != null && site.lng != null) {
    return site;
  }

  if (`${site.site} ${site.location}`.toLowerCase().includes("ochsner")) {
    return { ...site, ...defaultCenter };
  }

  return site;
}

function centerOf(sites: Array<PortfolioMapSite & { lat: number; lng: number }>) {
  return {
    lat: sites.reduce((sum, site) => sum + site.lat, 0) / sites.length,
    lng: sites.reduce((sum, site) => sum + site.lng, 0) / sites.length,
  };
}

function latLngToPixel(lat: number, lng: number) {
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const scale = tileSize * 2 ** zoom;

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function markerPosition(site: PortfolioMapSite & { lat: number; lng: number }, centerPixel: { x: number; y: number }) {
  const pixel = latLngToPixel(site.lat, site.lng);

  return {
    x: pixel.x - centerPixel.x + mapWidth / 2,
    y: pixel.y - centerPixel.y + mapHeight / 2,
  };
}

function mapTiles(centerTile: { x: number; y: number }) {
  const tiles: { x: number; y: number }[] = [];

  for (let y = centerTile.y - 2; y <= centerTile.y + 2; y += 1) {
    for (let x = centerTile.x - 3; x <= centerTile.x + 3; x += 1) {
      tiles.push({ x, y });
    }
  }

  return tiles;
}
