Config = {}

-- Show a "Last Location" pin for returning characters
Config.EnableLastLocation = true

-- World -> map image calibration.
-- Defaults match the standard square GTA V atlas/satellite map (e.g. 8192x8192 renders).
-- If pins look offset on your image, tweak these four numbers.
Config.MapBounds = {
    minX = -5661, maxX = 6694,   -- world X at the left / right edge of the image
    minY = -4059, maxY = 8429,   -- world Y at the bottom / top edge of the image
}

-- Spawn locations. `icon` is any Font Awesome 6 solid icon name.
Config.Spawns = {
    { id = 'legion',   label = 'Legion Square',       description = 'Heart of downtown Los Santos', icon = 'building',       coords = vec4(195.17, -933.77, 30.69, 144.5) },
    { id = 'airport',  label = 'LS International',    description = 'Los Santos International Airport', icon = 'plane',      coords = vec4(-1037.84, -2737.72, 20.17, 327.0) },
    { id = 'pier',     label = 'Del Perro Pier',      description = 'Beach, boardwalk and ocean views', icon = 'umbrella-beach', coords = vec4(-1604.66, -1034.17, 13.02, 50.0) },
    { id = 'mirror',   label = 'Mirror Park',         description = 'Quiet east-side neighbourhood', icon = 'tree',          coords = vec4(1143.89, -644.72, 56.79, 10.0) },
    { id = 'vinewood', label = 'Vinewood Boulevard',  description = 'Stars, studios and nightlife',   icon = 'star',          coords = vec4(302.47, 177.64, 104.06, 160.0) },
    { id = 'sandy',    label = 'Sandy Shores',        description = 'Blaine County desert town',      icon = 'sun',           coords = vec4(1847.21, 3669.89, 33.77, 210.0) },
    { id = 'paleto',   label = 'Paleto Bay',          description = 'Small coastal town up north',    icon = 'anchor',        coords = vec4(-160.5, 6327.5, 31.59, 315.0) },
}

-- In-game configurator: /spawnconfig
-- Spawns edited in-game are saved to data/spawns.json and override Config.Spawns above.
-- Delete that file (or use "Reset to defaults" in the editor) to go back to Config.Spawns.
Config.EditorCommand = 'spawnconfig'
Config.EditorGroup = 'group.admin'   -- ace group allowed to use the editor
