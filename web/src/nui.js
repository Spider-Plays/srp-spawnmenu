export const isBrowser = !window.invokeNative;

const resource = typeof window.GetParentResourceName === 'function' ? window.GetParentResourceName() : 'srp-spawn';

export function fetchNui(name, data = {}) {
    if (isBrowser) {
        console.log('[nui]', name, data);
        if (name === 'editor:edit') mockEditorEdit(data);
        return Promise.resolve();
    }
    return fetch(`https://${resource}/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(data),
    }).catch(() => {});
}

// Mock data for `npm run dev` in a normal browser (same bounds as config.lua)
const b = { minX: -5661, maxX: 6694, minY: -4059, maxY: 8429 };
const pos = (x, y) => ({ x: ((x - b.minX) / (b.maxX - b.minX)) * 100, y: ((b.maxY - y) / (b.maxY - b.minY)) * 100 });

export const mockOpen = {
    action: 'open',
    name: 'John Doe',
    spawns: [
        { id: 'last', zone: 'Pillbox Hill', label: 'Last Location', description: 'Pick up where you left off', icon: 'clock-rotate-left', pos: pos(-47, -1097) },
        { id: 'legion', zone: 'Legion Square', label: 'Legion Square', description: 'Heart of downtown Los Santos', icon: 'building', pos: pos(195, -933) },
        { id: 'airport', zone: 'Los Santos International Airport', label: 'LS International', description: 'Los Santos International Airport', icon: 'plane', pos: pos(-1037, -2737) },
        { id: 'pier', zone: 'Del Perro Beach', label: 'Del Perro Pier', description: 'Beach, boardwalk and ocean views', icon: 'umbrella-beach', pos: pos(-1604, -1034) },
        { id: 'mirror', zone: 'Mirror Park', label: 'Mirror Park', description: 'Quiet east-side neighbourhood', icon: 'tree', pos: pos(1143, -644) },
        { id: 'vinewood', zone: 'Downtown Vinewood', label: 'Vinewood Boulevard', description: 'Stars, studios and nightlife', icon: 'star', pos: pos(302, 177) },
        { id: 'sandy', zone: 'Sandy Shores', label: 'Sandy Shores', description: 'Blaine County desert town', icon: 'sun', pos: pos(1847, 3669) },
        { id: 'paleto', zone: 'Paleto Bay', label: 'Paleto Bay', description: 'Small coastal town up north', icon: 'anchor', pos: pos(-160, 6327) },
    ],
};

// ---- Browser mock for the in-game configurator (open http://localhost:5173/?editor) ----
let mockEditorSpawns = [
    { id: 'legion', label: 'Legion Square', description: 'Heart of downtown Los Santos', icon: 'building', zone: 'Legion Square', coords: { x: 195.17, y: -933.77, z: 30.69, w: 144.5 } },
    { id: 'airport', label: 'LS International', description: 'Los Santos International Airport', icon: 'plane', zone: 'Los Santos International Airport', coords: { x: -1037.84, y: -2737.72, z: 20.17, w: 327 } },
    { id: 'sandy', label: 'Sandy Shores', description: 'Blaine County desert town', icon: 'sun', zone: 'Sandy Shores', coords: { x: 1847.21, y: 3669.89, z: 33.77, w: 210 } },
    { id: 'paleto', label: 'Paleto Bay', description: 'Small coastal town up north', icon: 'anchor', zone: 'Paleto Bay', coords: { x: -160.5, y: 6327.5, z: 31.59, w: 315 } },
];
const withPos = (list) => list.map((s) => ({ ...s, pos: pos(s.coords.x, s.coords.y) }));

export const mockEditorOpen = () => ({ action: 'openEditor', spawns: withPos(mockEditorSpawns) });

export function mockEditorEdit(d) {
    const i = mockEditorSpawns.findIndex((s) => s.id === d.id);
    const here = { x: 25.7 + Math.random() * 400, y: -1347.3 + Math.random() * 400, z: 29.5, w: 90 };
    if (d.op === 'add') mockEditorSpawns.push({ id: `spawn_${Date.now()}`, label: d.label || 'New Spawn', description: d.description || '', icon: d.icon, zone: 'Strawberry', coords: here });
    if (d.op === 'update' && i >= 0) Object.assign(mockEditorSpawns[i], { label: d.label, description: d.description, icon: d.icon });
    if (d.op === 'move' && i >= 0) mockEditorSpawns[i].coords = here;
    if (d.op === 'delete' && i >= 0) mockEditorSpawns.splice(i, 1);
    if (d.op === 'reorder' && i >= 0) {
        const j = i + (d.dir === 'up' ? -1 : 1);
        if (j >= 0 && j < mockEditorSpawns.length) [mockEditorSpawns[i], mockEditorSpawns[j]] = [mockEditorSpawns[j], mockEditorSpawns[i]];
    }
    setTimeout(() => window.postMessage({ action: 'editorSync', spawns: withPos(mockEditorSpawns) }, '*'), 150);
}
