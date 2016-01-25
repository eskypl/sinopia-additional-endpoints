# sinopia-additional-endpoints

This package contains additional endpoints (URLs) for Sinopia. Some of them are taken
from `lib/index-web.js` which is part of Sinopia GUI. With additional endpoints you
can extend Sinopia's REST interface and build richer REST client in separation from
Sinopia.

## Preconditions

It works only with alternative version of Sinopia which includes
support for custom middleware. You can install it with:

```
npm install github:eskypl/sinopia#feature/additional-middleware
```

## Installation

Actually you can install this package in any place with:

```
npm install github:eskypl/sinopia-additional-endpoints
```

Then in you Sinopia configuration file please add following lines:

```yaml
middleware:
  - path/to/sinopia-additional-endpoints
```

where `path/to` should be relative path to the place where you installed
this package.

## Additional configuration

`sinopia-additional-endpoints` includes one endpoint which allows to connect
with your local Stash repository and read file contents from it. To enable this
functionality you will need to provide 2 environment variables:

* `SINOPIA_AE_STASH_USERNAME` - user which will be used to authenticate in Stash
* `SINOPIA_AE_STASH_PASSWORD` - password for user

Stash host will be read from the package.json `repository.url` field.

This may be used to get additional files like `CHANGELOG` or `LICENSE` directly
from Sinopia.

Make sure that user you are going to use has appropriate access rights to read
repositories.
