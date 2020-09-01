
const got = require('got');
const env = require('../env');
let {ottomatica_services } = env.vars();

exports.register = function(req, res) {
    
    // { emailaddress: '', password: '', subscribe: 'on' }
    let {emailaddress, name, password, subscribe} = req.body;
    console.log( req.body );
    let url = `${ottomatica_services}/api/register`;
    got.post(url, {
        timeout: 10000,
        json: {
            email: emailaddress, name, password
        }
    })
    .catch( e => console.log(e) )
    .then(function(data)
    {
        console.log( data.body );
        res.redirect("/");
    });

}