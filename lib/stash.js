var url = require('url');
var request = require('request');

/**
 * Create connection with stash API using package repository URL.
 * Returns promise with simple API as a resolved value.
 * @param pkg Package repository url in GIT format
 * @returns {Promise} Simple Stash API
 */
exports.package = function stashPackage(pkg) {

    return new Promise(function (resolve, reject) {
        if (!pkg.repository || !pkg.repository.url) {
            return reject(new Error('Missing Stash repository URL. Please correct "package.json" file.'));
        }

        var repository = url.parse(pkg.repository.url);
        var project = repository.path.replace(/\.git$/, '').split('/');
        var stashOptions = '?at=' + pkg.gitHead + '&type=false';
        var stashUrl = {
            method: 'GET',
            protocol: 'https',
            hostname: repository.hostname,
            pathname: '/rest/api/1.0/projects/' + project[1] + '/repos/' + project[2]
        };

        /**
         * Build URL to specific Stash API endpoint
         * @param endpointPath
         * @returns {string}
         */
        function createUrl(endpointPath) {
            return decodeURIComponent(url.format(stashUrl) + endpointPath + stashOptions);
        }

        resolve({
            /**
             * Call to Stash browse API endpoint
             * @param searchPath Path to file to fetch
             * @param credentials Stash credentials
             * @returns {Promise}
             */
            browse: function stashBrowse(searchPath, credentials) {
                return exports.fetch(createUrl('/browse/' + searchPath), credentials);
            }
        });
    });
};

/**
 * Makes request to Stash API
 * @param url
 * @param credentials
 * @returns {Promise}
 */
exports.fetch = function stashFetch(url, credentials) {

    return new Promise(function(resolve, reject) {

        if (!credentials) {
            return reject(new Error('Missing Stash credentials.'));
        }
        if (!credentials.SINOPIA_AE_STASH_USERNAME) {
            return reject(new Error('Missing Stash credentials. Please set up SINOPIA_AE_STASH_USERNAME environment variable.'));
        }
        if (!credentials.SINOPIA_AE_STASH_PASSWORD) {
            return reject(new Error('Missing Stash credentials. Please set up SINOPIA_AE_STASH_PASSWORD environment variable.'));
        }

        request(url, {
            auth: {
                user: credentials.SINOPIA_AE_STASH_USERNAME,
                pass: credentials.SINOPIA_AE_STASH_PASSWORD
            }
        }, function (error, response, body) {
            if (error) {
                return reject(error);
            }

            var json = '';
            try {
                json = JSON.parse(body);
            } catch (error) {
                return reject(error);
            }

            // TODO: Content building should be moved higher in stack
            switch (response.statusCode) {
                case 404:
                    var er = 'HTTP 404: ' + url;
                    for (var error in json.errors) {
                        er += "\n" + json.errors[error].message;
                    }

                    return reject(er);
                default:
                    var txt = '';
                    for (var line in json.lines) {
                        txt += json.lines[line].text + "\n";
                    }

                    return resolve(txt);
            }
        })
    });
}
