const fs = require('fs');

if(process.env.SITE){
    let site = process.env.SITE;
    fs.writeFile('site.js', 'module.exports.url = "'+site+'"', function (err) {
        if (err) return console.log(err);
        console.log('write site');
    });
}