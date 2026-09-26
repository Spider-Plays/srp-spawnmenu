import { useEffect, useState } from 'react';
import { fetchNui, isBrowser, mockEditorOpen } from './nui';
import './Editor.css';

const ICONS = [
    'location-dot', 'building', 'house', 'hotel', 'plane', 'anchor', 'umbrella-beach', 'tree',
    'star', 'sun', 'mountain', 'car', 'gas-pump', 'hospital', 'shield-halved', 'briefcase',
    'store', 'utensils', 'martini-glass', 'dumbbell', 'train', 'water', 'fire', 'city',
];

// Same rotation as the spawn map (north points left)
const rotate = (p) => ({ x: p.y, y: 100 - p.x });

const edit = (op, data = {}) => fetchNui('editor:edit', { op, ...data });

function IconPicker({ value, onChange }) {
    return (
        <div className="ed-icons">
            {ICONS.map((ic) => (
                <button key={ic} type="button" className={ic === value ? 'on' : ''} onClick={() => onChange(ic)} title={ic}>
                    <i className={`fa-solid fa-${ic}`} />
                </button>
            ))}
            <input
                className="ed-icon-custom"
                value={value}
                onChange={(e) => onChange(e.target.value.trim())}
                placeholder="custom icon"
                title="Any Font Awesome 6 solid icon name"
            />
        </div>
    );
}

function SpawnForm({ initial, submitLabel, submitIcon, onSubmit, onCancel }) {
    const [label, setLabel] = useState(initial.label || '');
    const [description, setDescription] = useState(initial.description || '');
    const [icon, setIcon] = useState(initial.icon || 'location-dot');

    const submit = (e) => {
        e.preventDefault();
        if (!label.trim()) return;
        onSubmit({ label: label.trim(), description: description.trim(), icon: icon || 'location-dot' });
    };

    return (
        <form className="ed-form" onSubmit={submit}>
            <div className="ed-row">
                <div className="ed-preview"><i className={`fa-solid fa-${icon || 'location-dot'}`} /></div>
                <div className="ed-fields">
                    <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} placeholder="Name, e.g. Legion Square" autoFocus />
                    <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={80} placeholder="Short description (optional)" />
                </div>
            </div>
            <IconPicker value={icon} onChange={setIcon} />
            <div className="ed-form-actions">
                {onCancel && <button type="button" className="ed-btn ghost" onClick={onCancel}>Cancel</button>}
                <button type="submit" className="ed-btn primary" disabled={!label.trim()}>
                    <i className={`fa-solid fa-${submitIcon}`} /> {submitLabel}
                </button>
            </div>
        </form>
    );
}

function ConfirmButton({ className, icon, label, title, confirmText, onConfirm }) {
    const [armed, setArmed] = useState(false);
    useEffect(() => {
        if (!armed) return;
        const t = setTimeout(() => setArmed(false), 2500);
        return () => clearTimeout(t);
    }, [armed]);
    return (
        <button
            type="button"
            className={`${className}${armed ? ' armed' : ''}`}
            title={title}
            onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}
        >
            <i className={`fa-solid fa-${icon}`} />{(armed ? confirmText : label) && <span>{armed ? confirmText : label}</span>}
        </button>
    );
}

export default function Editor() {
    const [open, setOpen] = useState(false);
    const [walking, setWalking] = useState(false);
    const [spawns, setSpawns] = useState([]);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [hoverId, setHoverId] = useState(null);
    const [toast, setToast] = useState(null);

    const notify = (msg) => {
        setToast(msg);
        clearTimeout(notify.t);
        notify.t = setTimeout(() => setToast(null), 2200);
    };

    useEffect(() => {
        const onMessage = ({ data }) => {
            if (data.action === 'openEditor') {
                setSpawns(data.spawns || []);
                setAdding(false);
                setEditingId(null);
                setWalking(false);
                setOpen(true);
            } else if (data.action === 'editorSync') {
                setSpawns(data.spawns || []);
            } else if (data.action === 'closeEditor') {
                setOpen(false);
            } else if (data.action === 'editorFocus') {
                setWalking(false);
            }
        };
        window.addEventListener('message', onMessage);
        if (isBrowser && location.search.includes('editor')) window.postMessage(mockEditorOpen(), '*');
        return () => window.removeEventListener('message', onMessage);
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if (!open || walking || e.key !== 'Escape') return;
            if (adding || editingId) { setAdding(false); setEditingId(null); }
            else fetchNui('editor:close');
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (!open) return null;

    const walk = () => {
        setWalking(true);
        fetchNui('editor:release');
        if (isBrowser) setTimeout(() => setWalking(false), 1500);
    };

    return (
        <div className={`editor${walking ? ' walking' : ''}`}>
            <div className="ed-walk-hint">
                <i className="fa-solid fa-person-walking" /> Walk to a spot, then press <kbd>E</kbd> to return to the editor
            </div>

            <aside className="ed-panel">
                <header className="ed-head">
                    <div>
                        <div className="ed-kicker">SRP Spawn</div>
                        <h1>Spawn Configurator</h1>
                    </div>
                    <button className="ed-icon-btn" onClick={() => fetchNui('editor:close')} title="Close (Esc)">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </header>

                <div className="ed-map">
                    <div className="ed-map-inner">
                        <img src="map-atlas.webp" alt="" draggable="false" />
                        {spawns.map((s) => {
                            const p = rotate(s.pos);
                            const hot = s.id === hoverId || s.id === editingId;
                            return (
                                <span key={s.id} className={`ed-dot${hot ? ' hot' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                                    <i className={`fa-solid fa-${s.icon || 'location-dot'}`} />
                                </span>
                            );
                        })}
                    </div>
                    <span className="ed-count">{spawns.length} spawn{spawns.length === 1 ? '' : 's'}</span>
                </div>

                <div className="ed-body">
                    {adding ? (
                        <div className="ed-card ed-adding">
                            <div className="ed-card-title"><i className="fa-solid fa-crosshairs" /> New spawn at your current position</div>
                            <SpawnForm
                                initial={{}}
                                submitLabel="Add spawn"
                                submitIcon="plus"
                                onCancel={() => setAdding(false)}
                                onSubmit={(d) => { edit('add', d); setAdding(false); notify(`Added "${d.label}"`); }}
                            />
                        </div>
                    ) : (
                        <button className="ed-add" onClick={() => { setAdding(true); setEditingId(null); }}>
                            <i className="fa-solid fa-plus" /> Add spawn at my position
                        </button>
                    )}

                    <ul className="ed-list">
                        {spawns.map((s, i) => (
                            <li
                                key={s.id}
                                className={`ed-item${editingId === s.id ? ' editing' : ''}`}
                                onMouseEnter={() => setHoverId(s.id)}
                                onMouseLeave={() => setHoverId(null)}
                            >
                                {editingId === s.id ? (
                                    <SpawnForm
                                        initial={s}
                                        submitLabel="Save"
                                        submitIcon="check"
                                        onCancel={() => setEditingId(null)}
                                        onSubmit={(d) => { edit('update', { id: s.id, ...d }); setEditingId(null); notify('Saved'); }}
                                    />
                                ) : (
                                    <>
                                        <div className="ed-item-main">
                                            <div className="ed-item-icon"><i className={`fa-solid fa-${s.icon || 'location-dot'}`} /></div>
                                            <div className="ed-item-text">
                                                <div className="ed-item-label">{s.label}</div>
                                                <div className="ed-item-meta">
                                                    {s.zone && <span>{s.zone}</span>}
                                                    <span className="mono">
                                                        {s.coords.x.toFixed(1)}, {s.coords.y.toFixed(1)}, {s.coords.z.toFixed(1)} · {Math.round(s.coords.w)}°
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ed-order">
                                                <button disabled={i === 0} onClick={() => edit('reorder', { id: s.id, dir: 'up' })} title="Move up"><i className="fa-solid fa-chevron-up" /></button>
                                                <button disabled={i === spawns.length - 1} onClick={() => edit('reorder', { id: s.id, dir: 'down' })} title="Move down"><i className="fa-solid fa-chevron-down" /></button>
                                            </div>
                                        </div>
                                        <div className="ed-item-actions">
                                            <button className="ed-chip" onClick={() => { setEditingId(s.id); setAdding(false); }}><i className="fa-solid fa-pen" /> Edit</button>
                                            <button className="ed-chip" onClick={() => { fetchNui('editor:teleport', { id: s.id }); notify(`Teleported to ${s.label}`); }}><i className="fa-solid fa-location-arrow" /> Go to</button>
                                            <ConfirmButton className="ed-chip" icon="crosshairs" label="Move here" title="Set this spawn to your current position and heading" confirmText="Move here?"
                                                onConfirm={() => { edit('move', { id: s.id }); notify(`Moved "${s.label}" to your position`); }} />
                                            <ConfirmButton className="ed-chip danger" icon="trash" label="Delete" title="Delete" confirmText="Delete?"
                                                onConfirm={() => { edit('delete', { id: s.id }); notify(`Deleted "${s.label}"`); }} />
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                        {spawns.length === 0 && <li className="ed-empty">No spawns yet. Stand where players should appear and add one.</li>}
                    </ul>
                </div>

                <footer className="ed-foot">
                    <button className="ed-btn ghost" onClick={walk}><i className="fa-solid fa-person-walking" /> Walk mode</button>
                    <ConfirmButton className="ed-btn ghost danger" icon="rotate-left" label="Reset" title="Replace all spawns with Config.Spawns from config.lua" confirmText="Reset all?"
                        onConfirm={() => { edit('reset'); notify('Reset to config defaults'); }} />
                </footer>
            </aside>

            {toast && <div className="ed-toast"><i className="fa-solid fa-circle-check" /> {toast}</div>}
        </div>
    );
}
