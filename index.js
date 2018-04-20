var execSync = require('child_process').execSync;
var os = require('os');

module.exports = function ipv4(cache, full) {
  if (cache && ipv4.cache) return ipv4.cache;

  ipv4.cache = [];

  var rskip = /^(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i;
  var rmatch, cmd, stdout, matches, devName;

  switch (process.platform) {
    case 'win32':
    case 'win64':
      cmd = 'route print 0.0.0.0';
      rmatch = /\r\n\s+\b0\.0\.0\.0.+?(?=\r\n)/g;
      stdout = execSync(cmd);
      matches = String(stdout).match(rmatch) || [];
      matches.forEach(function (line) {
        var ip = line.replace(/^\s+|\s+$/, '').split(/\s+/)[ 3 ];
        ip && ipv4.cache.push(ip);
      });
      break;
    case 'freebsd':
    case 'darwin':
    default:
      cmd = 'netstat -r -n -f inet';
      rmatch = /\n\s*\bdefault\s*[\d\.]+.+?\n/g;
      stdout = execSync(cmd);
      matches = String(stdout).match(rmatch) || [];
      for (var i = 0, line; line = matches[ i ]; ++i) {
        devName = line.replace(/^\s+|\s+$/, '').split(/\s+/)[ 5 ];
      }
      if (devName) {
        var aliasx = os.networkInterfaces()[ devName ];
        for (var i = 0, alias; alias = aliasx[ i ]; ++i) {
          if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
            ipv4.cache.push(alias.address);
          }
        }
      }
      break;
  }

  if (!ipv4.cache.length) ipv4.cache.push('127.0.0.1');

  return full ? ipv4.cache : ipv4.cache[ 0 ];
};