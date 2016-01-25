var async = require('async');
var bodyParser = require('body-parser');
var express = require('express');
var stash = require('./lib/stash');
var Content = require('./lib/content');
var markdown = new Content('_.md');

module.exports = function (config, auth, storage, dir) {

    var Search = require(dir + '/search');
    var Middleware = require(dir + '/middleware');
    var Logger = require(dir + '/logger');

    var app = express.Router();
    var can = Middleware.allow(auth);
    var log = Logger.logger.child({
        sub: 'default'
    });

    Search.configureStorage(storage);

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(function (req, res, next) {
        res.setHeader('X-Frame-Options', 'deny');
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
    });

    app.get('/-/packages', function (req, res, next) {
        var base = config.url_prefix
            ? config.url_prefix.replace(/\/$/, '')
            : req.protocol + '://' + req.get('host');

        res.setHeader('Content-Type', 'application/json');

        storage.get_local(function (err, packages) {
            if (err) {
                throw err;
            }
            async.filterSeries(packages, function (pkg, cb) {
                auth.allow_access(pkg.name, req.remote_user, function (err, allowed) {
                    setImmediate(function () {
                        cb(!err && allowed);
                    })
                })
            }, function (packages) {
                next(packages);
            })
        })
    });

    app.get('/-/search/:anything', function (req, res, next) {
        var results = Search.query(req.params.anything);
        var packages = [];

        var getData = function (i) {
            storage.get_package(results[i].ref, function (err, entry) {
                if (!err && entry) {
                    packages.push(entry.versions[entry['dist-tags'].latest])
                }

                if (i >= results.length - 1) {
                    next(packages)
                } else {
                    getData(i + 1)
                }
            })
        };

        if (results.length) {
            getData(0)
        } else {
            next([])
        }
    });

    app.get('/-/readme/:package/:version?', can('access'), function (req, res, next) {
        storage.get_package(req.params.package, {req: req}, function (err, info) {
            if (err) {
                return next(err);
            }
            res.setHeader('Content-Type', 'text/html');
            next(markdown.parse(info.readme || 'ERROR: No README data found!'));
        })
    });

    // '/-/browse-stash/:package/:version/:path*'
    app.get(/^\/-\/browse-stash\/((?:(?:@|%40)[\w\-]+(?:\/|%2F))?[\w\-]+)\/([\.\d]+)\/(.+)?$/, can('access'),
        function (req, res, next) {

        req.params = {
            package: req.params[0],
            version: req.params[1],
            path: req.params[2]
        };

        storage.get_package(req.params.package, {req: req}, function (err, info) {
            if (err) {
                return next(err);
            }

            var version = req.params.version || info['dist-tags'].latest;
            var pkg = info.versions[version];
            var content = new Content(req.params.path);

            log.info(pkg, 'browse stash', '@{stashUrl}');

            stash.package(pkg)
                .then(function (api) {
                    return api.browse(req.params.path, process.env);
                })
                .then(function (text) {
                    res.setHeader('Content-Type', content.type());
                    next(content.parse(text));
                })
                .catch(function (error) {
                    res.setHeader('Content-Type', 'text/plain');
                    next(error);
                });
        })
    });

    return app;

};
