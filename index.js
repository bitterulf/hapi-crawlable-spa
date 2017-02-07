'use strict';

const _ = require('lodash');
const crawlJob = require('simple-spa-crawler').crawlJob;

exports.register = function (server, options, next) {
    var crawlCache = {};
    const uri = options.uri || server.info.uri;
    crawlJob(uri, options.cronTime, options.wait, function (err, result) {
        server.log(['spa', 'crawlJob', 'finished'], {uri: uri, keys: _.keys(result)});
        crawlCache = result;
    });

    server.ext('onRequest', function (request, reply) {
        const fragment = request.query._escaped_fragment_;
        if (fragment) {
            const cachedHTML = crawlCache['/?' + fragment];
            if (cachedHTML) {
                server.log(['spa', 'cache', 'success'], fragment);
                reply(cachedHTML);
            } else {
                server.log(['spa', 'cache', 'failed'], fragment);
                return reply.continue();
            }
        } else {
            return reply.continue();
        }
    });

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
