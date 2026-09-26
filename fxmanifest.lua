fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'srp-spawn'
description 'Photo-frame map spawn selector for Qbox'
version '1.0.0'

-- Lets qbx_core treat this resource as the spawn selector
provide 'qbx_spawn'

shared_scripts {
    '@ox_lib/init.lua',
    'config.lua',
}

server_scripts {
    'server.lua',
}

client_scripts {
    '@qbx_core/modules/playerdata.lua',
    'client.lua',
}

ui_page 'web/build/index.html'

files {
    'web/build/index.html',
    'web/build/**/*',
}

dependencies {
    'qbx_core',
    'ox_lib',
}
