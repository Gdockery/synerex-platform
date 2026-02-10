#!/usr/local/bin/node

const { basename } = require('path');
const { realpathSync, readFileSync } = require('fs');
const Client = require('ssh2').Client;
const chalk = require('chalk');

const PrivateKey = readFileSync('/home/vagrant/.ssh/xcorp@office');
const KnownHosts = [
  'aguas',
  'tijuana',
  'milpitas',
  'guadalajara',
  'hca-lakeland',
  'gushu',
  'zhuhai',
  'athens-fv',
];

const Config = {
  host: [],
  revision: null,
  db: null,
  restart: [],
  exec: null,
  'vm-exec': null,
  'root-exec': null,
};

const scriptBaseName = basename(__filename),
  usage = `
  Usage:
    ${scriptBaseName} <key> <value> ... <key> <value>
  
      Where key is one of: (in the order of taken actions)
        host      (required, defaults to none) comma separated list of hosts to operate on; use 'all' to affect all known hosts
        db        (optional, defaults to none) sql file to be run on the remote host
        revision  (optional, defaults to none) revision of the code to checkout
        restart   (optional, defaults to none) comma separated list of services to restart on the remote host VM after the whole process is done
        vm-exec   (optional, defaults to none) command to execute in the VM of the remote host
        exec      (optional, defaults to none) command to execute on the remote host
        root-exec (optional, defaults to none) command to execute as root on the remote host
    
      Example:
        ${scriptBaseName} host aguas restart web
`;

(async () => {
  if (!configFromParams()) {
    throw 'Bad input params, nothing to do';
  }

  let usedColors = 0;
  const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  const bgColors = [
    'bgRed',
    'bgGreen',
    'bgYellow',
    'bgBlue',
    'bgMagenta',
    'bgCyan',
    'bgWhite',
  ];

  await Promise.all(
    Config.host.map(async (host) => {
      const color = colors[usedColors],
        bgColor = bgColors[usedColors++];
      const log = (...args) =>
        console.log(
          new Date().toISOString().slice(11, 19),
          chalk[bgColor](` ${host} `),
          ...args.map((item) => chalk[color](item))
        );

      log(`Connecting...`);

      try {
        const server = await connectToHost(host);

        if (Config.db) {
          log(`Executing sql script...`);
          log(await runSql(server, Config.db));
        }

        if (Config.revision || Config.restart.length || Config['vm-exec']) {
          const vm = await connectToVmOn(server);

          if (Config.revision) {
            log(`Updating code...`);
            log(await updateCode(vm, Config.revision));
          }

          if (Config.restart.length) {
            log(`Restarting service(s)...`);
            log(await restartServices(vm, Config.restart));
          }

          if (Config['vm-exec']) {
            log(`Executing command in VM...`);
            log(await exec(vm, Config['vm-exec']));
          }

          vm.end();
        }

        if (Config.exec) {
          log(`Executing command...`);
          log(await exec(server, Config.exec));
        }

        server.end();

        if (Config['root-exec']) {
          const serverRoot = await connectToHost(host, true);
          log(`Executing command as root...`);
          log(await exec(serverRoot, Config['root-exec']));

          serverRoot.end();
        }
      } catch (e) {
        log(e);
      }

      log(`Done`);
    })
  );
})().catch((err) => {
  console.log(err);
});

//
// Functions
//

function configFromParams() {
  const params = process.argv.slice(2);

  for (let i = 0; i < params.length; i += 2) {
    let key = params[i],
      value = params[i + 1];

    switch (key) {
      case 'restart':
        if (value) {
          Config[key] = value.split(',').filter((item) => item);
        }
        break;

      case 'host':
        if (value === 'all') {
          Config[key] = KnownHosts;
        } else {
          Config[key] = value.split(',').filter((item) => item);
        }
        break;

      case 'db':
        Config[key] = realpathSync(value);
        break;

      default:
        Config[key] = value || Config[key];
        break;
    }
  }

  if (!Config.host.length) {
    console.log(usage);
    return false;
  }

  return true;
}

function connectToHost(host, asRoot = false) {
  let remote = new Client();

  return new Promise((resolve, reject) => {
    remote

      .on('ready', () => {
        resolve(remote);
      })

      .on('error', (err) => {
        reject(err);
      })

      .connect({
        host,
        ...(asRoot
          ? {
              username: 'root',
              password: 'XecoEnergy9564',
            }
          : {
              username: 'xcorp',
              privateKey: PrivateKey,
            }),
      });
  });
}

function exec(remote, command) {
  return new Promise((resolve, reject) => {
    remote.exec(command, (err, stream) => {
      if (err) {
        console.log('remote :: exec error: ' + err);
        return reject(err);
      }

      let result = '';

      stream

        .on('end', () => {
          resolve(result);
        })

        .on('error', reject)

        .on('data', (data) => {
          result += data.toString();
        });
    });
  });
}

function upload(remote, localFile, remoteFile) {
  return new Promise((resolve, reject) => {
    remote.sftp((err, sftp) => {
      if (err) {
        return reject(err);
      }

      sftp.fastPut(localFile, remoteFile, (err) => {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  });
}

function connectToVmOn(remote) {
  return new Promise(async (resolve, reject) => {
    const privateKey = await exec(
      remote,
      'cat /home/xcorp/Documents/Xeco-Portal/.vagrant/machines/default/virtualbox/private_key'
    );

    var vm = new Client();

    vm.on('ready', () => {
      resolve(vm);
    });

    remote.forwardOut(process.env.VAGRANT_HOST, 12345, process.env.VAGRANT_HOST, 2222, (err, stream) => {
      if (err) {
        console.log('VM :: forwardOut error: ' + err);
        reject(err);
      }
      vm.connect({
        sock: stream,
        username: 'vagrant',
        privateKey,
      });
    });
  });
}

function runSql(remote, sqlFile) {
  return new Promise(async (resolve, reject) => {
    const random = Math.random().toString(16).slice(2, 8);
    const remoteSqlName = `/tmp/xeco-maitenance-${random}.sql`;

    try {
      await upload(remote, sqlFile, remoteSqlName);

      resolve(
        await exec(
          remote,
          `mysql -uxeco_staging -pxecopass xeco < ${remoteSqlName}; rm ${remoteSqlName}`
        )
      );
    } catch (e) {
      reject(e);
    }
  });
}

function updateCode(remote, revision) {
  return exec(
    remote,
    [
      `cd /vagrant`,
      `git config credential.username rcowart`,
      `git config credential.helper '! f() { test "$1" = get && echo password=13f7b59325ba3cf27b0cd6ded5d621c5eeb7abc9; }; f'`,
      `git checkout master`,
      `git pull`,
      `git config credential.helper ""`,
      `git checkout ${revision}`,
    ].join(' && ')
  );
}

function restartServices(remote, services) {
  return exec(remote, `sudo systemctl restart ${services.join(' ')}`);
}
