
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

exports.account = function(req, res) {

}

exports.login = function(req, res) {
    
    let {inputEmail, inputPassword} = req.body;

    console.log( req.body );

    let url = `${ottomatica_services}/api/login`;
    got.post(url, {
        timeout: 10000,
        json: {
            email: inputEmail, password: inputPassword
        }
    })
    .catch( e => console.log(e) )
    .then(function(data)
    {
        console.log( data.body );

        req.session.user = {email: inputEmail, token: data.body.token};
        res.redirect("/");
    });

}