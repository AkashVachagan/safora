import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function RouteViewport({ route }) {
    const map = useMap();
    useEffect(() => {
        if (route?.length) map.fitBounds(route, { padding: [35, 35] });
    }, [map, route]);
    return null;
}

function LocationController({ locateRequest, onLocation }) {
    const map = useMapEvents({
        locationfound(event) {
            onLocation([event.latlng.lat, event.latlng.lng]);
        },
    });

    useEffect(() => {
        if (locateRequest) map.locate({ setView: true, maxZoom: 9, enableHighAccuracy: true });
    }, [locateRequest, map]);

    return null;
}

function Map({ route, userLocation, locateRequest, onLocation }){
    const pos = [13.0827, 80.2707];

    return (
        <div className="map-frame">
        <MapContainer center={pos} zoom={10} className="map-container">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            {route?.length > 0 && <><Polyline positions={route} pathOptions={{ color: "#24734b", weight: 5, opacity: 0.85 }} /><RouteViewport route={route} /></>}
            {onLocation && <LocationController locateRequest={locateRequest} onLocation={onLocation} />}
            {userLocation && <CircleMarker center={userLocation} radius={8} pathOptions={{ color: "#fff", weight: 3, fillColor: "#2169b0", fillOpacity: 1 }} />}
        </MapContainer>
        </div>
    );
}

export default Map;
