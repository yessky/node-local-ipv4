var execSync = require('child_process').execSync;
var os = require('os');

module.exports = function ipv4(cache, full) {
  if (cache && ipv4.cache) return ipv4.cache;

  ipv4.cache = [];

  var platform = process.platform;
  var rmatch, rtitle, cmd, stdout, titles, matches, devIndex, devName;

  switch (platform) {
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
    default:
      // fresbsd | darwin | linux
      cmd = platform === 'linux' ? 'netstat -r -n -A inet' : 'netstat -r -n -f inet';
      rtitle = /\bDestination\s+.*?(?=\n)/i;
      rmatch = /\bdefault\s*[\d\.]+.+?\n/g;
      stdout = execSync(cmd).toString();
      titles = stdout.match(rtitle);
      if (titles) titles = titles[ 0 ].replace(/^\s+|\s+$/, '').split(/\s+/);
      titles = titles || [];
      matches = stdout.match(rmatch) || [];
      devIndex = titles.length === 5 ? 3 : 5;
      for (var i = 0, line; line = matches[ i ], !devName; ++i) {
        var part = line.replace(/^\s+|\s+$/, '').split(/\s+/);
        devName = part[ devIndex ];
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
