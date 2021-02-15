
/*
Default set of rules and behaviors for notebooks.
*/

class Policy {

    isExecutable($cell, environment) {
        let properties = $cell.data();
        let isDocable = properties.docable;
        if (properties.platform) {
            // if multi target
            if (properties.target && environment.type.includes('multi')) {
                return this._getCurrentPlatform(environment.targets.find(t => t.name == properties.target)) == properties.platform && isDocable;
            }
            else if (environment.type.includes('multi')) {
                return this._getCurrentPlatform(environment.targets[0]) == properties.platform && isDocable;
            }

            // if single target
            else {
                return this._getCurrentPlatform(environment) == properties.platform && isDocable;
            }
        }
        return isDocable;
    }

    _getCurrentPlatform(environment) {
        if (environment.type === 'local') {
            return require('os').platform;
        }

        if (environment.type === 'docker' || environment.type === 'ssh') {
            return "linux";
        }

        return "unknown";
    }

}

module.exports = new Policy();
