const got = require('got');
const env = require('../env');
let {ottomatica_services } = env.vars();

exports.getHosted = function(req, res) {
    

    res.render("hosted", {});
}

exports.publish = function(req,res) {

}

exports.updateHosted = function(req, res) {
    

}
