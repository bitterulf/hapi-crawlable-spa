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
            request.setUrl('/cache'+fragment);
        }

        return reply.continue();
    });

    server.route({
        method: 'GET',
        path: '/cache/{fragment*}',
        handler: function (request, reply) {
            const cacheKey = '/'+request.params.fragment
            const cachedHTML = crawlCache['/#!' + cacheKey];
            if (cachedHTML) {
                server.log(['info', 'spa', 'cache', 'success'], cacheKey);
                return reply(cachedHTML);
            } else {
                server.log(['error', 'spa', 'cache', 'failed'], cacheKey);
                return reply.continue();
            }
        }
    });

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
