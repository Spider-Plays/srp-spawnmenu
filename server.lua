local RESOURCE = GetCurrentResourceName()
local SAVE_FILE = 'data/spawns.json'

local spawns = {}

local function round(n) return math.floor(n * 100 + 0.5) / 100 end

local function fromConfig()
    local list = {}
    for i, s in ipairs(Config.Spawns) do
        list[i] = {
            id = s.id, label = s.label, description = s.description, icon = s.icon,
            coords = { x = s.coords.x, y = s.coords.y, z = s.coords.z, w = s.coords.w },
        }
    end
    return list
end

local function load()
    local raw = LoadResourceFile(RESOURCE, SAVE_FILE)
    local saved = raw and json.decode(raw)
    spawns = type(saved) == 'table' and saved or fromConfig()
end

local function save()
    SaveResourceFile(RESOURCE, SAVE_FILE, json.encode(spawns, { indent = true }), -1)
    TriggerClientEvent('srp-spawn:client:syncSpawns', -1, spawns)
end

local function isAdmin(src)
    return IsPlayerAceAllowed(src, 'command.' .. Config.EditorCommand)
end

local function findIndex(id)
    for i = 1, #spawns do
        if spawns[i].id == id then return i end
    end
end

-- Coords always come from the admin's ped on the server, never from the client
local function pedCoords(src)
    local ped = GetPlayerPed(src)
    local c = GetEntityCoords(ped)
    return { x = round(c.x), y = round(c.y), z = round(c.z), w = round(GetEntityHeading(ped)) }
end

local function cleanText(v, max, fallback)
    if type(v) ~= 'string' then return fallback end
    v = v:gsub('[%c<>]', ''):match('^%s*(.-)%s*$')
    if v == '' then return fallback end
    return v:sub(1, max)
end

local function cleanIcon(v)
    if type(v) == 'string' and v:match('^[%w%-]+$') and #v <= 40 then return v end
    return 'location-dot'
end

local function newId()
    local id
    repeat id = ('spawn_%06x'):format(math.random(0, 0xFFFFFF)) until not findIndex(id)
    return id
end

lib.callback.register('srp-spawn:server:getSpawns', function()
    return spawns
end)

lib.addCommand(Config.EditorCommand, {
    help = 'Open the spawn location editor',
    restricted = Config.EditorGroup,
}, function(source)
    TriggerClientEvent('srp-spawn:client:openEditor', source, spawns)
end)

RegisterNetEvent('srp-spawn:server:edit', function(data)
    local src = source
    if not isAdmin(src) or type(data) ~= 'table' then return end

    local op = data.op
    local i = data.id and findIndex(data.id)

    if op == 'add' then
        spawns[#spawns + 1] = {
            id = newId(),
            label = cleanText(data.label, 40, 'New Spawn'),
            description = cleanText(data.description, 80, ''),
            icon = cleanIcon(data.icon),
            coords = pedCoords(src),
        }
    elseif op == 'update' and i then
        local s = spawns[i]
        s.label = cleanText(data.label, 40, s.label)
        s.description = cleanText(data.description, 80, '')
        s.icon = cleanIcon(data.icon)
    elseif op == 'move' and i then
        spawns[i].coords = pedCoords(src)
    elseif op == 'delete' and i then
        table.remove(spawns, i)
    elseif op == 'reorder' and i then
        local j = i + (data.dir == 'up' and -1 or 1)
        if j < 1 or j > #spawns then return end
        spawns[i], spawns[j] = spawns[j], spawns[i]
    elseif op == 'reset' then
        spawns = fromConfig()
    else
        return
    end

    save()
    lib.print.info(('%s edited spawns (%s%s)'):format(GetPlayerName(src), op, data.id and (' ' .. data.id) or ''))
end)

load()
