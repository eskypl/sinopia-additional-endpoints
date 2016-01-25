var test = require('tape');
var stash = require('../lib/stash');
var Content = require('../lib/content');

test('content should support markdown', function (t) {
    t.plan(2);

    var content = new Content('README.md');
    t.equal(content.type(), 'text/html');
    t.equal(content.parse('# Head'), '<h1 id="head">Head</h1>\n');
});

test('content should support JSON', function (t) {
    t.plan(2);

    var content = new Content('package.json');
    t.equal(content.type(), 'application/json');
    t.looseEqual(content.parse('{"version":"1.0.0"}'), { version: "1.0.0" });
});

test('content should support HTML', function (t) {
    t.plan(2);

    var content = new Content('index.html');
    t.equal(content.type(), 'text/html');
    t.equal(content.parse('<h1>Head</h1>'), '<h1>Head</h1>');
});

test('content should fall back unknown type to plain text', function (t) {
    t.plan(2);

    var content = new Content('index.js');
    t.equal(content.type(), 'text/plain');
    t.equal(content.parse('var value = 1;'), 'var value = 1;');
});

test('stash.package should translate git URL to API url and try to fetch resource', function (t) {
    t.plan(2);

    var packageJson = {
        name: 'repository',
        version: '1.0.0',
        repository: {
            url: 'ssh://git@stash.mydomain.com:8080/project/repository.git'
        },
        gitHead: '2802c501916901c0df4ac8f3c129f2ed0e18fb34'
    };

    var stashCredentials = {
        SINOPIA_AE_STASH_USERNAME: 'sinopia_user',
        SINOPIA_AE_STASH_PASSWORD: 'sinopia_pass'
    };

    var fetch = stash.fetch;
    stash.fetch = function (url, credentials) {
        stash.fetch = fetch; // restore original function
        t.equal(url, 'https://stash.mydomain.com/rest/api/1.0/projects/project/repos/repository/browse/README.md?at=2802c501916901c0df4ac8f3c129f2ed0e18fb34&type=false');
        t.equal(credentials, stashCredentials);
    };

    stash.package(packageJson).then(function (api) {
        api.browse('README.md', stashCredentials);
    });

});
