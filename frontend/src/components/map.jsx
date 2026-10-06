import { Fragment, useEffect, useRef } from "react";
import { divIcon } from "leaflet";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const userLocationIcon = divIcon({
    className: "",
    html: '<span class="user-location-pin"></span>',
    iconSize: [24, 32],
    iconAnchor: [12, 30],
    popupAnchor: [0, -28],
});

function RouteViewport({ route, locations, tracks, routes, startPoint, endPoint }) {
    const map = useMap();
    const signature = JSON.stringify({ route, locations: locations?.map(({ lat, lon }) => [lat, lon]), tracks: tracks?.map((track) => [track.id, ...(track.locations?.map(({ lat, lon }) => `${lat},${lon}`) || [])]), routes: routes?.map((item) => [item.id, item.route.length]), startPoint, endPoint });
    useEffect(() => {
        const points = route?.length ? route : locations?.map(({ lat, lon }) => [lat, lon]);
        const allPoints = [...(points || []), ...(tracks || []).flatMap((track) => track.locations?.map(({ lat, lon }) => [lat, lon]) || []), ...(routes || []).flatMap((item) => item.route), ...(startPoint ? [startPoint] : []), ...(endPoint ? [endPoint] : [])];
        if (allPoints.length) map.fitBounds(allPoints, { padding: [35, 35] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, signature]);
    return null;
}

function LocationController({ locateRequest, onLocation, onLocationError }) {
    const map = useMapEvents({
        locationfound(event) {
            onLocation([event.latlng.lat, event.latlng.lng]);
        },
        locationerror(event) {
            onLocationError?.(event.message || "Could not get your location.");
        },
    });
    const lastLocateRequest = useRef(locateRequest);

    useEffect(() => {
        if (locateRequest !== lastLocateRequest.current) {
            lastLocateRequest.current = locateRequest;
            map.locate({ setView: true, maxZoom: 9, enableHighAccuracy: true });
        }
    }, [locateRequest, map]);

    return null;
}

function Map({ route, userLocation, locateRequest, onLocation, onLocationError, locations, tracks = [], routes = [], startPoint, endPoint }){
    const pos = locations?.length ? [locations[0].lat, locations[0].lon] : [13.0827, 80.2707];
    const track = locations?.map(({ lat, lon }) => [lat, lon]) || [];

    return (
        <div className="map-frame">
        <MapContainer center={pos} zoom={routes.length ? 5 : 10} className="map-container">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            {routes.length > 0 && <RouteViewport routes={routes} />}
            {routes.map((item) => {
                const destination = item.route[item.route.length - 1];
                return <Fragment key={item.id}>
                    <Polyline positions={item.route} pathOptions={{ color: "#111111", weight: 3, opacity: 0.85 }} />
                    {destination && <CircleMarker center={destination} radius={6} pathOptions={{ color: "#fff", weight: 2, fillColor: "#111111", fillOpacity: 1 }}>
                        <Tooltip direction="top" permanent className="package-name-tooltip">{item.name}</Tooltip>
                    </CircleMarker>}
                </Fragment>;
            })}
            {route?.length > 0 && <><Polyline positions={route} pathOptions={{ color: "#111111", weight: 5, opacity: 0.85 }} /><RouteViewport route={route} startPoint={startPoint} endPoint={endPoint} /></>}
            {startPoint && <CircleMarker center={startPoint} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: "#111111", fillOpacity: 1 }}><Tooltip direction="top" permanent className="endpoint-tooltip">Start</Tooltip></CircleMarker>}
            {endPoint && <CircleMarker center={endPoint} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: "#111111", fillOpacity: 1 }}><Tooltip direction="top" permanent className="endpoint-tooltip">Destination</Tooltip></CircleMarker>}
            {track.length > 0 && <><Polyline positions={track} pathOptions={{ color: "#2169b0", weight: 5, opacity: 0.9 }} /><RouteViewport locations={locations} /><CircleMarker center={track[track.length - 1]} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: "#2169b0", fillOpacity: 1 }} /></>}
            {tracks.length > 0 && <RouteViewport tracks={tracks} />}
            {tracks.map((item, index) => { const points = item.locations?.map(({ lat, lon }) => [lat, lon]) || []; const color = ["#2169b0", "#bd5a39", "#7654a3", "#31846b"][index % 4]; return points.length ? <Fragment key={item.id}><Polyline positions={points} pathOptions={{ color, weight: 4, opacity: 0.85 }} /><CircleMarker center={points[points.length - 1]} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: color, fillOpacity: 1 }} /></Fragment> : null; })}
            {onLocation && <LocationController locateRequest={locateRequest} onLocation={onLocation} onLocationError={onLocationError} />}
            {userLocation && <Marker position={userLocation} icon={userLocationIcon}>
                <Tooltip direction="top" permanent className="user-location-tooltip">You're here</Tooltip>
                <Popup>You're here</Popup>
            </Marker>}
        </MapContainer>
        </div>
    );
}

export default Map;
