var exec = require('child_process').exec;
var semver = require('semver');
var fs = require('fs');
var packageJson = require('../package.json');

var newVersion = semver.inc(packageJson.version, 'prerelease');

packageJson.version = newVersion;

exec('npm version --no-git-tag-version ' + newVersion, function(err, stdout, stderr) {
  if (err) {
    console.error(stderr);
    return process.exit(1);
  }
  exec('git commit -am "' + newVersion + ' (deploy to ' + process.env.sails_environment + ')"', function(err, stdout, stderr) {
    if (err) {
      console.error(stderr);
      return process.exit(1);
    }
    exec('git tag v' + newVersion, function(err, stdout, stderr) {
      if (err) {
        console.error(stderr);
        return process.exit(1);
      }
      process.exit(0);
    });
  });
});
