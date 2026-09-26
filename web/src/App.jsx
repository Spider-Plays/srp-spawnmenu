import { useEffect, useState } from 'react';
import MapView from './MapView';
import { fetchNui, isBrowser, mockOpen } from './nui';

function readStyle() {
    try { return localStorage.getItem('srp-spawn:style') || 'satellite'; } catch { return 'satellite'; }
}

export default function App() {
    const [visible, setVisible] = useState(false);
    const [spawns, setSpawns] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [busy, setBusy] = useState(false);
    const [style, setStyle] = useState(readStyle);

    const selected = spawns.find((s) => s.id === selectedId) || null;

    const select = (id) => {
        setSelectedId(id);
    };

    const changeStyle = (s) => {
        setStyle(s);
        try { localStorage.setItem('srp-spawn:style', s); } catch { /* ignore */ }
    };

    const spawn = () => {
        if (!selected || busy) return;
        setBusy(true);
        setTimeout(() => {
            fetchNui('spawn', { id: selected.id });
            if (isBrowser) setTimeout(() => { setBusy(false); select(selected.id); }, 1200);
        }, 700);
    };

    useEffect(() => {
        const onMessage = ({ data }) => {
            if (data.action === 'open') {
                setSpawns(data.spawns || []);
                setSelectedId(null);
                setBusy(false);
                setVisible(true);
            } else if (data.action === 'close') {
                setVisible(false);
                setSelectedId(null);
            }
        };
        window.addEventListener('message', onMessage);
        if (isBrowser && !location.search.includes('editor')) window.postMessage(mockOpen, '*');
        return () => window.removeEventListener('message', onMessage);
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if (!visible || busy) return;
            if (e.key === 'Enter') spawn();
            else if (e.key === 'Escape') select(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    return (
        <div id="app" className={`${visible ? '' : 'hidden'}${busy ? ' spawning' : ''}`}>
            <div className="wall">
                <div className="spotlight" />

                {/* Pinned index card with the list of locations */}
                <aside className="index-card">{/* display only; pick via map pins */}
                    <div className="tape" />
                    <h2>Destinations</h2>
                    <ul>
                        {spawns.map((s, i) => (
                            <li key={s.id} className={s.id === selectedId ? 'active' : ''}>
                                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                                <i className={`fa-solid fa-${s.icon || 'location-dot'}`} />
                                <span className="name">{s.label}</span>
                            </li>
                        ))}
                    </ul>
                </aside>

                <div className="frame-wrap">

                    <div className="frame">
                        <div className="mat">
                            <MapView spawns={spawns} selectedId={selectedId} onSelect={select} style={style}>
                                <div className="style-switch" onClick={(e) => e.stopPropagation()}>
                                    <button className={style === 'satellite' ? 'on' : ''} onClick={() => changeStyle('satellite')}>
                                        <i className="fa-solid fa-earth-americas" /> Satellite
                                    </button>
                                    <button className={style === 'atlas' ? 'on' : ''} onClick={() => changeStyle('atlas')}>
                                        <i className="fa-solid fa-map" /> Atlas
                                    </button>
                                </div>
                            </MapView>
                            <div className="glass" />
                        </div>
                    </div>
                </div>
            </div>

            <div className={`spawn-card${selected ? ' show' : ''}`}>
                <div className="card-top">
                    <div className="card-icon"><i className={`fa-solid fa-${selected?.icon || 'location-dot'}`} /></div>
                    <div className="card-text">
                        {selected?.zone && <div className="card-zone"><i className="fa-solid fa-location-dot" /> {selected.zone}</div>}
                        <div className="card-label">{selected?.label}</div>
                        <div className="card-desc">{selected?.description}</div>
                    </div>
                </div>
                <button className="spawn-btn" onClick={spawn} disabled={busy}>
                    {busy ? <><i className="fa-solid fa-circle-notch fa-spin" /><span>Travelling…</span></>
                          : <><span>Spawn here</span><i className="fa-solid fa-arrow-right" /></>}
                </button>
            </div>

            <div className="fade" />
        </div>
    );
}
