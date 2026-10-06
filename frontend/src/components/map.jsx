import { Fragment, useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function RouteViewport({ route, locations, tracks }) {
    const map = useMap();
    const signature = JSON.stringify({ route, locations: locations?.map(({ lat, lon }) => [lat, lon]), tracks: tracks?.map((track) => [track.id, ...(track.locations?.map(({ lat, lon }) => `${lat},${lon}`) || [])]) });
    useEffect(() => {
        const points = route?.length ? route : locations?.map(({ lat, lon }) => [lat, lon]);
        const allPoints = [...(points || []), ...(tracks || []).flatMap((track) => track.locations?.map(({ lat, lon }) => [lat, lon]) || [])];
        if (allPoints.length) map.fitBounds(allPoints, { padding: [35, 35] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, signature]);
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

function Map({ route, userLocation, locateRequest, onLocation, locations, tracks = [] }){
    const pos = locations?.length ? [locations[0].lat, locations[0].lon] : [13.0827, 80.2707];
    const track = locations?.map(({ lat, lon }) => [lat, lon]) || [];

    return (
        <div className="map-frame">
        <MapContainer center={pos} zoom={10} className="map-container">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            {route?.length > 0 && <><Polyline positions={route} pathOptions={{ color: "#24734b", weight: 5, opacity: 0.85 }} /><RouteViewport route={route} /></>}
            {track.length > 0 && <><Polyline positions={track} pathOptions={{ color: "#2169b0", weight: 5, opacity: 0.9 }} /><RouteViewport locations={locations} /><CircleMarker center={track[track.length - 1]} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: "#2169b0", fillOpacity: 1 }} /></>}
            {tracks.length > 0 && <RouteViewport tracks={tracks} />}
            {tracks.map((item, index) => { const points = item.locations?.map(({ lat, lon }) => [lat, lon]) || []; const color = ["#2169b0", "#bd5a39", "#7654a3", "#31846b"][index % 4]; return points.length ? <Fragment key={item.id}><Polyline positions={points} pathOptions={{ color, weight: 4, opacity: 0.85 }} /><CircleMarker center={points[points.length - 1]} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: color, fillOpacity: 1 }} /></Fragment> : null; })}
            {onLocation && <LocationController locateRequest={locateRequest} onLocation={onLocation} />}
            {userLocation && <CircleMarker center={userLocation} radius={8} pathOptions={{ color: "#fff", weight: 3, fillColor: "#2169b0", fillOpacity: 1 }} />}
        </MapContainer>
        </div>
    );
}

export default Map;
