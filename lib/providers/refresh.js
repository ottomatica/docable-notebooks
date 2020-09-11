const os = require('os');

exports.refresh = function refresh(currentEnv)
{
    if( os.platform() === 'win32')
    {
        // Get User environment variables
        let userVars = getRegistryVariablesAsObject(`REG query HKCU\\Environment`);
        // Get System environment variables
        let sysVars = getRegistryVariablesAsObject(`REG query "HKEY_LOCAL_MACHINE\\System\\CurrentControlSet\\Control\\Session Manager\\Environment"`);

        // Path is the combination of SYSTEM + USER Path variables. 
        // We will also add in current Path so that any node specific stuff isn't lost.
        // However, we need to be careful, as expanded variables, such as %SYSTEM_ROOT% will not work in current running path.
        // Instead we will use strategy to patch the existing PATH with new non-expanded entries.
        let path = new Set(currentEnv['Path'].split(';'));
        for( var part of (sysVars['Path'] + userVars['Path']).split(';') )
        {
            if( part != "" && part.indexOf("%") == -1) {
                path.add(part);
            }
        }

        let PATH = Array.from(path).join(';');
        // Update path and remove double quotes
        console.log(PATH);
        currentEnv['Path'] = PATH.replace(/;;/g, ";");
        delete sysVars.Path;
        delete userVars.Path;
        // Update remaining variables
        updateEnv(userVars, currentEnv);
        updateEnv(sysVars, currentEnv);

    }

    console.log(currentEnv);

    return currentEnv;
}

function getRegistryVariablesAsObject(cmd)
{
    let output = require('child_process').execSync(cmd).toString();
    let lines = output.split(/\r?\n/g);
    // Remove header
    lines.splice(0, 2);
    // Clean up output and prepare output
    let obj = {};
    let variables = lines.filter( (line) => line != "" )
        // Split columns into array
        .map( line => line.trim().split(/\s{4,4}/))
        // Skip bad splits and variables requiring expansion
        .filter( entry => entry.length == 3 )
        // Turn into object
        .map( entry => obj[entry[0]] = entry[2] )
    ;

    return obj;
}

function updateEnv(env, currentEnv)
{
    for( let key of Object.keys(env) )
    {
        let value = env[key];
        if( value.indexOf("%") == -1)
            currentEnv[key] = value;
    }    
}

// For easy debugging:
exports.refresh({Path: '/usr/bin;/bin'});