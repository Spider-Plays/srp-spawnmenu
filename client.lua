local isOpen = false
local editorOpen = false
local cam = nil
local serverSpawns = nil

local function worldToMap(x, y)
    local b = Config.MapBounds
    return {
        x = (x - b.minX) / (b.maxX - b.minX) * 100.0,
        y = (b.maxY - y) / (b.maxY - b.minY) * 100.0,
    }
end

local function getSpawns()
    if not serverSpawns then
        serverSpawns = lib.callback.await('srp-spawn:server:getSpawns', false) or {}
    end
    return serverSpawns
end

local function buildSpawnList(includeLast)
    local list = {}

    if includeLast and Config.EnableLastLocation then
        local pos = QBX.PlayerData and QBX.PlayerData.position
        if pos then
            list[#list + 1] = {
                id = 'last', label = 'Last Location', description = 'Pick up where you left off',
                icon = 'clock-rotate-left', coords = vec4(pos.x, pos.y, pos.z, pos.w or 0.0),
            }
        end
    end

    local spawns = getSpawns()
    for i = 1, #spawns do
        list[#list + 1] = spawns[i]
    end

    return list
end

local function zoneName(c)
    return GetLabelText(GetNameOfZone(c.x, c.y, c.z))
end

local function toNui(list)
    local out = {}
    for i = 1, #list do
        local s = list[i]
        out[i] = {
            id = s.id, label = s.label, description = s.description, icon = s.icon,
            zone = zoneName(s.coords),
            pos = worldToMap(s.coords.x, s.coords.y),
        }
    end
    return out
end

-- Editor gets raw coords as well, so admins can see exactly where a spawn is
local function toEditor(list)
    local out = {}
    for i = 1, #list do
        local s = list[i]
        out[i] = {
            id = s.id, label = s.label, description = s.description, icon = s.icon,
            zone = zoneName(s.coords), coords = s.coords,
            pos = worldToMap(s.coords.x, s.coords.y),
        }
    end
    return out
end

local currentSpawns = {}

local function setupCamera()
    local ped = PlayerPedId()
    SetEntityCoords(ped, 0.0, 0.0, 800.0, false, false, false, false)
    FreezeEntityPosition(ped, true)
    SetEntityVisible(ped, false, false)

    cam = CreateCamWithParams('DEFAULT_SCRIPTED_CAMERA', 0.0, 0.0, 1200.0, -90.0, 0.0, 0.0, 60.0, false, 0)
    SetCamActive(cam, true)
    RenderScriptCams(true, false, 0, true, true)
end

local function destroyCamera()
    if cam then
        RenderScriptCams(false, false, 0, true, true)
        DestroyCam(cam, false)
        cam = nil
    end
end

local function openUI(includeLast)
    if isOpen then return end
    isOpen = true
    currentSpawns = buildSpawnList(includeLast)

    DoScreenFadeOut(0)
    setupCamera()
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'open', spawns = toNui(currentSpawns) })
    DoScreenFadeIn(500)
end

local function closeUI()
    isOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
end

local function spawnAt(coords)
    local ped = PlayerPedId()

    DoScreenFadeOut(500)
    while not IsScreenFadedOut() do Wait(0) end

    destroyCamera()

    RequestCollisionAtCoord(coords.x, coords.y, coords.z)
    SetEntityCoords(ped, coords.x, coords.y, coords.z, false, false, false, false)
    SetEntityHeading(ped, coords.w)

    local timeout = GetGameTimer() + 5000
    while not HasCollisionLoadedAroundEntity(ped) and GetGameTimer() < timeout do Wait(0) end

    FreezeEntityPosition(ped, false)
    SetEntityVisible(ped, true, false)

    TriggerServerEvent('QBCore:Server:OnPlayerLoaded')
    TriggerEvent('QBCore:Client:OnPlayerLoaded')

    Wait(500)
    DoScreenFadeIn(1000)
end

RegisterNUICallback('spawn', function(data, cb)
    cb('ok')
    for i = 1, #currentSpawns do
        if currentSpawns[i].id == data.id then
            closeUI()
            spawnAt(currentSpawns[i].coords)
            return
        end
    end
end)

-- qbx_core hooks (this resource `provide`s qbx_spawn)
RegisterNetEvent('qb-spawn:client:setupSpawns', function() end)
RegisterNetEvent('qb-spawn:client:openUI', function(value)
    if value == false then return closeUI() end
    openUI(true)
end)

-- New character without starting apartments
RegisterNetEvent('qbx_core:client:spawnNoApartments', function()
    openUI(false)
end)

-- Manual export: exports['srp-spawn']:OpenSpawnMenu(includeLastLocation)
exports('OpenSpawnMenu', openUI)

---------------------------------------------------------------------
-- In-game configurator
---------------------------------------------------------------------

RegisterNetEvent('srp-spawn:client:syncSpawns', function(list)
    serverSpawns = list
    if editorOpen then
        SendNUIMessage({ action = 'editorSync', spawns = toEditor(list) })
    end
end)

RegisterNetEvent('srp-spawn:client:openEditor', function(list)
    if isOpen then return end
    serverSpawns = list
    editorOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'openEditor', spawns = toEditor(list) })
end)

local function closeEditor()
    editorOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'closeEditor' })
end

RegisterNUICallback('editor:close', function(_, cb)
    cb('ok')
    closeEditor()
end)

-- add / update / move / delete / reorder / reset are validated and applied by the server
RegisterNUICallback('editor:edit', function(data, cb)
    cb('ok')
    TriggerServerEvent('srp-spawn:server:edit', data)
end)

RegisterNUICallback('editor:teleport', function(data, cb)
    cb('ok')
    for _, s in ipairs(serverSpawns or {}) do
        if s.id == data.id then
            local ped = PlayerPedId()
            DoScreenFadeOut(250)
            while not IsScreenFadedOut() do Wait(0) end
            RequestCollisionAtCoord(s.coords.x, s.coords.y, s.coords.z)
            SetEntityCoords(ped, s.coords.x, s.coords.y, s.coords.z, false, false, false, false)
            SetEntityHeading(ped, s.coords.w)
            local timeout = GetGameTimer() + 3000
            while not HasCollisionLoadedAroundEntity(ped) and GetGameTimer() < timeout do Wait(0) end
            DoScreenFadeIn(400)
            return
        end
    end
end)

-- Toggle mouse so the admin can walk to a spot without closing the editor
RegisterNUICallback('editor:release', function(_, cb)
    cb('ok')
    SetNuiFocus(false, false)
    CreateThread(function()
        while editorOpen do
            if IsControlJustReleased(0, 38) then -- E
                SetNuiFocus(true, true)
                SendNUIMessage({ action = 'editorFocus' })
                return
            end
            Wait(0)
        end
    end)
end)

AddEventHandler('onResourceStop', function(res)
    if res ~= GetCurrentResourceName() then return end
    if isOpen or editorOpen then SetNuiFocus(false, false) end
    destroyCamera()
end)
