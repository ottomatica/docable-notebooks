
exports.refresh = function refresh(currentEnv)
{
    if( os.platform() === 'win32')
    {
        // Update User environment variables
        let userVars = getRegistryVariablesAsObject(`REG query HKCU\\Environment`);
        updateEnv(userVars, currentEnv);
        // Update System environment variables
        let sysVars = getRegistryVariablesAsObject(`REG "HKEY_LOCAL_MACHINE\\System\\CurrentControlSet\\Control\\Session Manager\\Environment"`);
        updateEnv(sysVars, currentEnv);
        // Path is the combination of SYSTEM + USER Path variables. 
        let PATH = sysVars['path'] + userVars['path'];
        // Update path and remove double quotes
        currentEnv['path'] = PATH.replace(/;;/g, ";");
        console.log( `Updated Path=${PATH}`);
    }

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
        .filter( entry => entry.length != 3 || entry[1] == "REG_EXPAND_SZ" )
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
        console.log( key, value );
        currentEnv[key] = value;
    }    
}