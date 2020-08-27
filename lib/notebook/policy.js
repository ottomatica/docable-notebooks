
/*
Default set of rules and behaviors for notebooks.
*/

class Policy
{

    isExecutable($cell)
    {
        let isDocable = $cell.is("[data-docable=true]");
        // if( $cell.has(`[data-platform]`) )
        // {
        //     let platformMatch = $cell.is(`[data-platform=${require('os').platform}]`);
        //     return platformMatch && isDocable;
        // }
        return isDocable;
    }

}

module.exports = new Policy();
