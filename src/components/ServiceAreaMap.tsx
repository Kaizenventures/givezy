"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Circle } from "leaflet";
import { Loader2, MapPin } from "lucide-react";
import type { ServiceArea } from "@/lib/settings";
import "leaflet/dist/leaflet.css";

/**
 * Drag the pin to where pickups start from, and set how far out we'll go.
 * Leaflet is loaded in the browser only — it touches `window` on import.
 */
export default function ServiceAreaMap({
  value,
  onChange,
}: {
  value: ServiceArea;
  onChange: (next: ServiceArea) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const circle = useRef<Circle | null>(null);
  const [ready, setReady] = useState(false);

  // Keep the newest handler without re-running map setup
  const latest = useRef(value);
  latest.current = value;
  const emit = useRef(onChange);
  emit.current = onChange;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !holder.current || map.current) return;

      const start = latest.current;
      const m = L.map(holder.current, { scrollWheelZoom: false }).setView(
        [start.centreLat, start.centreLng],
        11,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(m);

      // A div icon avoids Leaflet's default marker images, which bundlers break
      const pin = L.divIcon({
        className: "",
        html: '<div style="width:18px;height:18px;border-radius:50%;background:#059669;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const mk = L.marker([start.centreLat, start.centreLng], { draggable: true, icon: pin }).addTo(m);
      const ci = L.circle([start.centreLat, start.centreLng], {
        radius: start.radiusKm * 1000,
        color: "#059669",
        weight: 2,
        fillColor: "#059669",
        fillOpacity: 0.1,
      }).addTo(m);

      function moveTo(lat: number, lng: number) {
        mk.setLatLng([lat, lng]);
        ci.setLatLng([lat, lng]);
        emit.current({ ...latest.current, centreLat: lat, centreLng: lng });
      }

      mk.on("dragend", () => {
        const p = mk.getLatLng();
        moveTo(p.lat, p.lng);
      });
      m.on("click", (e) => moveTo(e.latlng.lat, e.latlng.lng));

      map.current = m;
      marker.current = mk;
      circle.current = ci;
      setReady(true);
      // Tiles can lay out wrong inside a tab that was hidden when it mounted
      setTimeout(() => m.invalidateSize(), 150);
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Reflect radius and externally-set coordinates back onto the map
  useEffect(() => {
    circle.current?.setRadius(value.radiusKm * 1000);
  }, [value.radiusKm]);

  useEffect(() => {
    const p = marker.current?.getLatLng();
    if (!p) return;
    if (Math.abs(p.lat - value.centreLat) > 1e-6 || Math.abs(p.lng - value.centreLng) > 1e-6) {
      marker.current?.setLatLng([value.centreLat, value.centreLng]);
      circle.current?.setLatLng([value.centreLat, value.centreLng]);
    }
  }, [value.centreLat, value.centreLng]);

  return (
    <div>
      <label className="flex items-center gap-3 cursor-pointer mb-4">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="text-sm text-gray-700">
          Only accept bookings inside this area
          <span className="block text-xs text-gray-400">
            Leave off to accept every address, wherever it is.
          </span>
        </span>
      </label>

      <div className="relative rounded-xl overflow-hidden border border-gray-200">
        <div ref={holder} className="h-80 w-full bg-gray-100" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-gray-400 bg-gray-50">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading map…
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2 inline-flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5" />
        Drag the pin, or click the map, to move where pickups start from.
      </p>

      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <label htmlFor="radius" className="font-medium text-gray-700">
            How far we&apos;ll collect from
          </label>
          <span className="font-semibold text-gray-900 tabular-nums">{value.radiusKm} km</span>
        </div>
        <input
          id="radius"
          type="range"
          min={1}
          max={100}
          step={1}
          value={value.radiusKm}
          onChange={(e) => onChange({ ...value, radiusKm: Number(e.target.value) })}
          className="w-full accent-emerald-600"
        />
        <div className="flex justify-between text-xs text-gray-400 tabular-nums">
          <span>1 km</span>
          <span>100 km</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3 tabular-nums">
        Centre: {value.centreLat.toFixed(4)}, {value.centreLng.toFixed(4)}
      </p>
    </div>
  );
}
