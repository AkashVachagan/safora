import { useCallback, useEffect, useState } from "react";
import Map from "../components/map.jsx";

function PoliceDashboard({ token, onLogout }) {
    const [users, setUsers] = useState([]);
    const [cases, setCases] = useState([]);
    const [selectedCase, setSelectedCase] = useState(null);
    const [details, setDetails] = useState(null);
    const [error, setError] = useState("");

    const refresh = useCallback(async () => {
        try {
            const response = await fetch("/api/police/overview", { headers: { Authorization: `Bearer ${token}` } });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || "Could not load the police overview");
            setUsers(body.users || []);
            setCases(body.cases || []);
            setError("");
        } catch (requestError) { setError(requestError.message); }
    }, [token]);

    useEffect(() => {
        refresh();
        const timer = window.setInterval(refresh, 3000);
        return () => window.clearInterval(timer);
    }, [refresh]);

    useEffect(() => {
        if (!selectedCase) return undefined;
        let cancelled = false;
        const refreshDetails = async () => {
            try {
                const response = await fetch(`/api/police/users/${selectedCase.userId}`, { headers: { Authorization: `Bearer ${token}` } });
                const body = await response.json();
                if (!cancelled && response.ok) setDetails(body);
            } catch { /* keep last loaded details visible while polling */ }
        };
        const timer = window.setInterval(refreshDetails, 3000);
        return () => { cancelled = true; window.clearInterval(timer); };
    }, [selectedCase?.userId, token]);

    async function openCase(incident) {
        setSelectedCase(incident);
        setDetails(null);
        try {
            const response = await fetch(`/api/police/users/${incident.userId}`, { headers: { Authorization: `Bearer ${token}` } });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || "Could not load user details");
            setDetails(body);
        } catch (requestError) { setError(requestError.message); }
    }

    const selectedLocations = details?.trips?.find((trip) => trip.id === selectedCase?.tripId)?.locations || details?.locations || [];
    const mapTracks = users.map((user) => ({ id: user.id, locations: user.locations }));

    return <main className="dashboard police-dashboard">
        <header className="dashboard-header"><div><p className="eyebrow">SAFORA · POLICE PORTAL</p><h1>{selectedCase ? `${selectedCase.name} · case` : "Live user locations"}</h1></div><div className="header-actions">{selectedCase && <button className="back-button" onClick={() => { setSelectedCase(null); setDetails(null); }}>← Overview</button>}<button className="logout-button" onClick={onLogout}>Log out</button></div></header>
        <section className="police-map-section"><div className="section-heading"><div><p className="eyebrow">LIVE MONITORING</p><h2>Current users</h2></div><span className="map-status"><span /> Updates every 3 seconds</span></div><Map tracks={mapTracks} locations={selectedCase ? selectedLocations : undefined} /></section>
        {!selectedCase ? <section className="cases-section"><div className="section-heading"><div><p className="eyebrow">NEEDS ATTENTION</p><h2>Active cases</h2></div><span className="package-count">{cases.length} cases</span></div>{error && <p className="form-error" role="alert">{error}</p>}{cases.map((incident) => <button className="case-card" key={`${incident.userId}-${incident.tripId}`} onClick={() => openCase(incident)}><span className="trip-tag active">CASE OPEN</span><strong>{incident.name}</strong><span>{incident.status || "USER ACTIVE"}</span><span>Off route since {formatTime(incident.since)}</span><span className="arrow">→</span></button>)}</section> : <section className="case-details"><div className="section-heading"><div><p className="eyebrow">CASE DETAILS</p><h2>{details?.user?.name || selectedCase.name}</h2></div></div>{error && <p className="form-error" role="alert">{error}</p>}{!details ? <p>Loading user details…</p> : <div className="case-columns"><article className="trip-information"><h3>Emergency contacts</h3>{details.contacts?.length ? details.contacts.map((contact, index) => <p key={`${contact.name}-${index}`}><strong>{contact.name}</strong> {contact.phone}</p>) : <p>No emergency contacts saved.</p>}</article><article className="trip-information"><h3>Travel history</h3>{details.trips?.length ? details.trips.map((trip) => <div className="police-trip" key={trip.id}><strong>{trip.package_name}</strong><span>{formatTime(trip.startedAt)} · {trip.endedAt ? "DONE" : "ACTIVE"}</span>{trip.comments && <p>{trip.comments}</p>}</div>) : <p>No trips recorded.</p>}</article></div>}</section>}
    </main>;
}

function formatTime(value) {
    return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "time unavailable";
}

export default PoliceDashboard;
