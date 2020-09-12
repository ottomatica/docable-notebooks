
const got = require('got');
const env = require('../env');
let {ottomatica_services } = env.vars();

exports.register = function(req, res) {
    
    // { emailaddress: '', password: '', subscribe: 'on' }
    let {email, name, password, subscribed, subscriberID} = req.body;
    let url = `${ottomatica_services}/api/register`;
    got.post(url, {
        timeout: 10000,
        json: {
            email, name, password, subscribed, subscriberID
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
            res.render("account", {user: user});
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
    .catch( (error) => {
        res.status(401);
        res.send({error});
    })
    .then(function(data)
    {
        let user = JSON.parse(data.body);
        if( user.Status )
        {
            req.session.user = {email: inputEmail, token: user.Token};
            res.send('OK');
        }
    });

}

exports.logout = function(req, res) {
    if(req.session.user) {
        req.session.user = undefined;
    }
    res.redirect('/');
}