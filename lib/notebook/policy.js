
/*
Default set of rules and behaviors for notebooks.
*/

class Policy
{

    isExecutable($cell, setup)
    {
        let properties = $cell.data();
        let isDocable = properties.docable;
        if( properties.platform )
        {
             return this._getCurrentPlatform(setup) == properties.platform && isDocable;
        }
        return isDocable;
    }

    _getCurrentPlatform(setup)
    {
        if( setup.local )
        {
            return require('os').platform;
        }
        if( setup.docker || setup.ssh )
        {
            return "linux";
        }

        return "unknown";
    }

}

module.exports = new Policy();
