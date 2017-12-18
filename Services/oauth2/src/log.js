var bunyan = require('bunyan');
var packageJson = require('../package.json');

module.exports = bunyan.createLogger({
  name: packageJson.name,
  streams: [
  	{
        level: 'debug',
        stream: process.stdout       // log INFO and above to stdout
    },
    {
        level: 'info',
        path: './logs.json'  // log ERROR and above to a file
    }
  ],
  serializers: bunyan.stdSerializers
});
