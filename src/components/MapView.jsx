import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const pin = (color) => L.divIcon({
  className: '',
  html: `<div style="background:${color};width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  iconSize: [26, 26], iconAnchor: [13, 24],
})

export default function MapView({ listings, center, now }) {
  const ref = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const map = L.map(ref.current).setView([center.lat, center.lng], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map)
    L.marker([center.lat, center.lng], { icon: pin('#2563eb') }).addTo(map).bindPopup('You are here')
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const layer = L.layerGroup().addTo(map)
    listings.forEach((l) => {
      const left = l.expiresAt - now
      const color = left < 30 * 60 * 1000 ? '#ef4444' : left < 2 * 3600 * 1000 ? '#f59e0b' : '#22c55e'
      L.marker([l.lat, l.lng], { icon: pin(color) }).addTo(layer)
        .bindPopup(`<b>${l.foodName}</b><br/>Serves ${l.servings} · ${l.donorName}`)
    })
    return () => { map.removeLayer(layer) }
  }, [listings, now])

  return <div ref={ref} className="w-full h-[62vh] rounded-2xl overflow-hidden ring-1 ring-gray-200 dark:ring-slate-700 z-0" />
}
