import { useEffect, useRef, useState } from 'react';

// The map images are rotated 90° anticlockwise (north points left), so rotate pin positions to match
const rotate = (p) => ({ x: p.y, y: 100 - p.x });

function Pin({ spawn, active, onSelect }) {
    const pos = rotate(spawn.pos);
    return (
        <div
            className={`pin${active ? ' active' : ''}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, '--inv': 1 }}
            onClick={(e) => { e.stopPropagation(); onSelect(spawn.id); }}
        >
            <div className="pin-body">
                <div className="pin-label">{spawn.label}</div>
                <div className="pin-head"><i className={`fa-solid fa-${spawn.icon || 'location-dot'}`} /></div>
                <div className="pin-needle" />
                <div className="pin-shadow" />
            </div>
        </div>
    );
}

export default function MapView({ spawns, selectedId, onSelect, style, children }) {
    const viewRef = useRef(null);
    const [box, setBox] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const el = viewRef.current;
        const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Square map image; the rotated island spans ~70% of its height, so size it to let the island fill the frame
    const size = Math.min(box.w, box.h / 0.72);
    const x = (box.w - size) / 2;
    const y = (box.h - size) / 2;

    return (
        <div ref={viewRef} className={`map map-${style}${selectedId ? ' has-active' : ''}`} onClick={() => onSelect(null)}>
            <div className="map-inner" style={{ width: size, height: size, transform: `translate(${x}px, ${y}px)` }}>
                <img className={style === 'satellite' ? 'on' : ''} src="map-satellite.webp" alt="" draggable="false" />
                <img className={style === 'atlas' ? 'on' : ''} src="map-atlas.webp" alt="" draggable="false" />
                <div className="pins">
                    {spawns.map((s) => (
                        <Pin key={s.id} spawn={s} active={s.id === selectedId} onSelect={onSelect} />
                    ))}
                </div>
            </div>

            <div className="compass"><span>N</span></div>
            {children}
        </div>
    );
}
