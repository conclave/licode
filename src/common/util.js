/* global module, require */
'use strict';
(function () {
    function getPrivateIP (interface_name) {
        var interfaces = require('os').networkInterfaces();
        var address;
        for (var k in interfaces) {
            if (interfaces.hasOwnProperty(k)) {
                for (var j in interfaces[k]) {
                    if (interfaces[k].hasOwnProperty(j)) {
                        address = interfaces[k][j];
                        if (address.family === 'IPv4' && !address.internal) {
                            if (k === interface_name || !interface_name) {
                                return (address.address);
                            }
                        }
                    }
                }
            }
        }
    }

    module.exports = {
        getPrivateIP: getPrivateIP
    };
}());
