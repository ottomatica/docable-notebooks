
/*
Default set of rules and behaviors for notebooks.
*/

class Policy
{

    isExecutable($cell)
    {
        let properties = $cell.data();
        let isDocable = properties.docable;
        if( properties.platform )
        {
             return require('os').platform == properties.platform && isDocable;
        }
        return isDocable;
    }

}

module.exports = new Policy();
