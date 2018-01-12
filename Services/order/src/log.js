var bunyan = require('bunyan');
var packageJson = require('../package.json');

module.exports = bunyan.createLogger({
  name: packageJson.name,
  streams: [
    {
      level: 'debug',
      stream: process.stdout     // log DEBUG and above to stdout
    },
    {
      level: 'info',
      path: './npm-debug.log'  // log INFO and above to a file
    }
  ],
  serializers: bunyan.stdSerializers
});
