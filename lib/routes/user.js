
const got = require('got');
const env = require('../env');
let {ottomatica_services } = env.vars();

exports.register = function(req, res) {
    
    // { emailaddress: '', password: '', subscribe: 'on' }
    let {email, username, password, subscribed, subscriberID} = req.body;

    let url = `${ottomatica_services}/api/register`;
    got.post(url, {
        timeout: 10000,
        json: {
            email, username, password, subscribed, subscriberID, 
            referrerURL: 'docable.cloud'
        }
    })
    .catch( (e) => {
        console.log(e);
        res.status(400).send('Not OK');
    })
    .then(function(data)
    {
        console.log( data.body );
        res.status(200).send('OK');
    });

}

exports.getAccount = function(req, res) { 

    if( !req.session.user ) {res.redirect("/login");}
    else
    {
        let url = `${ottomatica_services}/api/account`;
        got.get(url, {
            timeout: 10000,
            headers: {authorization: req.session.user.token, "Content-Type": "application/json"}
        })
        .catch( e => console.log(e) )
        .then(function(data)
        {
            let user = JSON.parse(data.body);
            res.render("account", { user, verified: req.session.user.verified });
        });

    }
}

exports.updateAccount = function(req, res) {

    if( !req.session.user ) {res.redirect("/login");}
    else
    {
        let url = `${ottomatica_services}/api/account`;
        got.put(url, {
            timeout: 10000,
            headers: {authorization: req.session.user.token},
            json: req.body
        })
        .catch( e => console.log(e) )
        .then(function(data)
        {
            console.log( data.body );
            res.redirect("/account");
        });
    }
}

exports.getLogin = function (req, res) {
    if (!req.session.user)
        res.render("login", {});
    else
        res.redirect('/');
}

exports.login = function(req, res) {
    
    let {inputEmail, inputPassword} = req.body;

    let url = `${ottomatica_services}/api/login`;
    got.post(url, {
        timeout: 10000,
        json: {
            email: inputEmail, password: inputPassword
        }
    })
    .then(function(data)
    {
        let user = JSON.parse(data.body);
        if( user.Status )
        {
            req.session.user = { 
                email: inputEmail, 
                token: user.Token, 
                verified: user.verified, 
                username: user.username,
                roles: user.roles
            };

            res.send('OK');
        }
    })
    .catch( (error) => {
        res.status(401);
        res.send({error});
    });

}

exports.logout = function(req, res) {
    if(req.session.user) {
        req.session.user = undefined;
    }
    res.redirect('/');
}