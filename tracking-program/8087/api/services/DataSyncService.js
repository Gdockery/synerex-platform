const async = require('async');
const _ = require('lodash');
const request = require('request');

const Config = sails.config.datasync;

//------------------------------------------------------------------------
//
// const failureProbability = 0.005
//
//------------------------------------------------------------------------

const References = {
  //client: {},
  /*gateway_tests__test_gateways: {
    gateway_tests: 'gateway',
    test_gateways: 'test',
  },*/
  gateway: {
    project: 'project',
  },/*
  gatewaycommand: {
    project: 'project',
    test: 'test',
  },*/
  /*meter_meters_meter__metercsv_meters: {
    meter_meters_meter: 'meter',
    metercsv_meters: 'metercsv',
  },*/
  meter: {
    project: 'project',
  },/*
  meteralert: {
    meter: 'meter',
    group: 'meteralertgroup',
  },
  meteralertevent: {
    meter: 'meter',
    alertGroup: 'meteralertgroup',
    project: 'project',
  },
  meteralertgroup_users__user_meterAlertGroups: {
    meteralertgroup_users: 'meteralertgroup',
    user_meterAlertGroups: 'user',
  },
  meteralertgroup: {
    project: 'project',
  },*/
  /*metercsv_users__user_users_user: {
    metercsv_users: 'metercsv',
    user_users_user: 'user',
  },
  metercsv: {
    project: 'project',
  },*/
  piboard: {},
  /*project_users__user_projects: {
    project_users: 'project',
    user_projects: 'user',
  },*/
  project: {
    client: 'client',
    servicePlan: 'serviceplan',
    xecoManager: 'user',
    selectedTest: 'test',
  },
  repeater: {
    project: 'project',
  },/*
  repeateralert: {
    repeater: 'repeater',
    group: 'repeateralertgroup',
  },
  repeateralertevent: {
    project: 'project',
    repeater: 'repeater',
    alertGroup: 'repeateralertgroup',
  },
  repeateralertgroup_users__user_repeaterAlertGroups: {
    repeateralertgroup_users: 'repeateralertgroup',
    user_repeaterAlertGroups: 'user',
  },
  repeateralertgroup: {
    project: 'project',
  },*//*
  savingsreport: {
    project: 'project',
  },*/
  schedule: {
    project: 'project',
    switches: 'switch',
  },
  serviceplan: {},
  switch_switches_switch__switchcommand_switches: {
    switch_switches_switch: 'switch',
    switchcommand_switches: 'switchcommand',
  },
  switch: {
    project: 'project',
  },/*
  switchalert: {
    switch: 'switch',
    group: 'switchalertgroup',
  },
  switchalertevent: {
    switch: 'switch',
    alertGroup: 'switchalertgroup',
    project: 'project',
  },
  switchalertgroup_users__user_switchAlertGroups: {
    switchalertgroup_users: 'switchalertgroup',
    user_switchAlertGroups: 'user',
  },
  switchalertgroup: {
    project: 'project',
  },*/
  /// removed from the switchcommand bc somtimes its null test: 'test',
  switchcommand: {
    project: 'project',
  },
  test: {
    project: 'project',
  },
/*  user: {
    client: 'client',
    defaultProject: 'project',
  },*/
  meterdata: {
    meter: 'meter',
  },
  meterdataaggregate: {
    project: 'project',
  },
  permeterdataaggregate: {
    project: 'project',
    meter: 'meter',
  },
  xeco: {},
  // ---------------
  // !! IMPORTANT (1) !! - tables referencing variable named tables
  //                       should be last in this dictionary
  // ---------------
  // !! IMPORTANT (2) !! - make sure all possible referenced tables
  //                       are listed after ':' and separated by '|'
  reportdata: {
    project: 'project',
    typeId: '@type:meter|project',
  },
};

const BigTables = [
  // these are big tables, we don't want to use Xuids on them
  'meterdata',
  'meterdataaggregate',
  'permeterdataaggregate',
];

// a key of this object is constructed from ordered table names joined by a dash
// so 'project-user', not 'user-project'
const CircularReferenceSolver = {
  'project-user': 'user',
  'project-test': 'project',
};

function getOrderedTables() {
  let solveCircularReference = (t1, t2) => {
    let solverKey = t1 < t2 ? t1 + '-' + t2 : t2 + '-' + t1,
      solverResult = CircularReferenceSolver[solverKey];

    if (!solverResult) {
      throw 'ERROR could not resolve circular dependency ' + solverKey;
    }

    return solverResult;
  };

  let checked = [],
    checkQueue = [],
    isChecked = (table) => checked.indexOf(table) > -1,
    inQueue = (table) => checkQueue.indexOf(table) > -1,
    processQueue = () => {
      let table = checkQueue[0];

      if (isChecked(table)) {
        checkQueue.shift();
        return;
      }

      let refs = _.values(References[table]);

      for (let ref of refs) {
        if (isChecked(ref)) continue;

        if (inQueue(ref)) {
          let first = solveCircularReference(table, ref);

          if (table == first) continue;

          checkQueue.splice(checkQueue.indexOf(ref), 1);
        }

        checkQueue.unshift(ref);
        return;
      }

      checkQueue.shift();
      checked.push(table);
    };

  let tables = _.keys(References);

  while (tables.length) {
    checkQueue.push(tables.shift());

    while (checkQueue.length) {
      processQueue();
    }
  }

  // skipping variable named refs
  checked = checked.filter((item) => item[0] != '@');

  return checked;
}

function isSyncable(table) {
  return table === 'deleted' || (References[table] && true) || false;
}

function exportRecords(table, since, limit, refId, done) {
  if (table === 'deleted') {
    return exportDeleted(since, limit, done);
  }

  let records = [],
    replacedFields = [],
    selects = ['mainTable.*'],
    joins = [],
    wheres = [];

  if (refId) {
    wheres.push(
      `(mainTable.updatedAt = ${since} AND mainTable.id >= ${refId} OR mainTable.updatedAt > ${since})`
    );
  } else {
    wheres.push(`mainTable.updatedAt >= ${since}`);
  }

  let hasVarRefs = false;

  for (let referenceField in References[table]) {
    referenceTable = [References[table][referenceField]];
    let varField = null;
    if (referenceTable[0][0] == '@') {
      hasVarRefs = true;
      referenceTable = referenceTable[0].slice(1).split(':');
      varField = referenceTable[0];
      referenceTable = referenceTable[1].split('|');
    }

    for (let refTable of referenceTable) {
      let tablePrefix = varField ? varField + '_' : '';
      let fieldPrefix = varField ? refTable + '___' : '';
      let extraWhere = varField
        ? ` OR mainTable.${varField} <> '${refTable}'`
        : '';

      replacedFields.push(fieldPrefix + referenceField);

      selects.push(
        `${tablePrefix}${refTable}.xuid AS ${fieldPrefix}${referenceField}_xuid`
      );

      joins.push(`
      LEFT JOIN ${refTable} AS ${tablePrefix}${refTable}
      ON mainTable.${referenceField} = ${tablePrefix}${refTable}.id
    `);

      wheres.push(`
      (
        ${tablePrefix}${refTable}.id IS NOT NULL
        OR (
          mainTable.${referenceField} IS NULL
          AND ${tablePrefix}${refTable}.id IS NULL
        )${extraWhere}
      )
    `);
    }
  }

  queryDB(`
    SELECT ${selects.join(', ')}
    FROM ${table} AS mainTable ${joins.join(' ')}
    WHERE ${wheres.join(' AND ')}
    ORDER BY mainTable.updatedAt, mainTable.id
    LIMIT ${limit}
  `)
    .then((queryResult) => {
      records = queryResult.rows;
      for (let row of records) {
        row['_refid'] = row['id'];
        delete row['id'];

        for (let field of replacedFields) {
          if (hasVarRefs && !References[table][field]) {
            // this is a var field
            let [varFieldValue, actualField] = field.split('___');
            let varField = References[table][actualField]
              .slice(1)
              .split(':')[0];
            if (row[varField] == varFieldValue) {
              row[actualField] = row[field + '_xuid'];
            }
            delete row[field + '_xuid'];
          } else {
            row[field] = row[field + '_xuid'];
            delete row[field + '_xuid'];
          }
        }
      }

      if (table == 'switchcommand') {
        prepareSwitchCommandsForExport(records, done);
      } else {
        done(null, records);
      }
    })
    .catch((err) => {
      done(err, records);
    });
}

function prepareSwitchCommandsForExport(records, done) {
  let xuids = {};

  records.forEach((row) => {
    [
      'acceptedBySwitchIds',
      'cancelledBySwitchIds',
      'executedBySwitchIds',
    ].forEach((field) => {
      row[field] = tryParseJson(row[field], []);
      row[field].forEach((id) => {
        xuids[id] = null;
      });
    });
  });

  ids = [0].concat(Object.keys(xuids));

  queryDB(`
    SELECT id, xuid FROM switch WHERE id IN (${ids.join(',')})
  `)
    .then((queryResult) => {
      for (let row of queryResult.rows) {
        xuids[row.id] = row.xuid;
      }

      records.forEach((row) => {
        [
          'acceptedBySwitchIds',
          'cancelledBySwitchIds',
          'executedBySwitchIds',
        ].forEach((field) => {
          row[field] = row[field]
            .map((id, i) => xuids[id] || null)
            .filter((id) => id != null);
        });
      });

      done(null, records);
    })
    .catch((err) => {
      done(err, []);
    });
}

function prepareSwitchCommandsForImport(records, done) {
  let ids = {};

  records.forEach((row) => {
    [
      'acceptedBySwitchIds',
      'cancelledBySwitchIds',
      'executedBySwitchIds',
    ].forEach((field) => {
      row[field].forEach((xuid) => {
        ids[xuid] = null;
      });
    });
  });

  xuids = ['impossible'].concat(Object.keys(ids));

  queryDB(`
    SELECT id, xuid FROM switch WHERE xuid IN ("${xuids.join('","')}")
  `)
    .then((queryResult) => {
      for (let row of queryResult.rows) {
        ids[row.xuid] = row.id;
      }

      records.forEach((row) => {
        [
          'acceptedBySwitchIds',
          'cancelledBySwitchIds',
          'executedBySwitchIds',
        ].forEach((field) => {
          row[field] = JSON.stringify(
            row[field]
              .map((xuid) => ids[xuid] || null)
              .filter((xuid) => xuid != null)
          );
        });
      });

      done(null, records);
    })
    .catch((err) => {
      done(err, []);
    });
}

function tryParseJson(str, defaultsTo) {
  let res = defaultsTo;

  try {
    res = JSON.parse(str);
  } catch (e) {}

  return res;
}

function exportDeleted(since, limit, done) {
  queryDB(
    'SELECT * FROM _deleted_xuids WHERE deletedAt > ' +
      since +
      ' ORDER BY deletedAt LIMIT ' +
      limit
  )
    .then((queryResult) => {
      done(null, queryResult.rows);
    })
    .catch((err) => {
      done(err, []);
    });
}

const SyncSemaphore = (host) => {
  const fs = require('fs');

  const SEMPAHORE = '/tmp/xeco-datasync-semaphore-' + host;
  const INTERVAL = 3000;
  const TIMEOUT = 20000;


  let interval;

  function start() {
    canStart = true;

    if (fs.existsSync(SEMPAHORE)) {
      let stats = fs.statSync(SEMPAHORE);
      if (new Date().getTime() - stats.mtime.getTime() < TIMEOUT) {
        canStart = false;
      }
    } else {
      fs.writeFileSync(SEMPAHORE, '');
    }

    if (canStart) {
      interval = setInterval(updateSemaphore, INTERVAL);
    }

    return canStart;
  }

  function stop() {
    clearInterval(interval);
    fs.unlinkSync(SEMPAHORE);
  }

  function updateSemaphore() {
    fs.utimesSync(SEMPAHORE, new Date(), new Date());
  }

  return {
    start: start,
    stop: stop,
  };
};

function sync(syncDone, onlyTheseTables) {
  let hosts, thisIsTheMaster;

  if (Config.master) {
    // this is a slave
    hosts = [Config.master];
    thisIsTheMaster = false;
  } else {
    hosts = Config.slaves;
    thisIsTheMaster = true;
  }

  async.parallel(
    hosts.map((host) => syncHostTask(host, thisIsTheMaster, onlyTheseTables)),
    syncDone
  );
}

function syncHostTask(host, thisIsTheMaster, onlyTheseTables) {
  return (hostDoneNoError) => {
    const semaphore = SyncSemaphore(host);

    if (!semaphore.start()) {
      console.log(`------------------------ Host ${host} already in progress`);
      return hostDoneNoError();
    }

    let hostDone = (err) => {
      semaphore.stop();
      if (err) {
        console.log(
          `------------------------ Host ${host} done with error`,
          err
        );
      } else {
        console.log(`------------------------ Host ${host} done`);
      }
      hostDoneNoError();
    };

    let syncStarted = Date.now();

    let retryQueue = {},
      retryMissingRefs = [];
    (retryQueueIsEmpty = true),
      (retry = (table, record, missingRefs) => {
        retryQueueIsEmpty = false;

        if (!retryQueue[table]) {
          retryQueue[table] = [];
        }
        retryQueue[table].push(record);

        retryMissingRefs.push([table + '/' + record.xuid, missingRefs]);
      }),
      (recordsWithSideEffects = []);

    let importRecords = (table, records, importDone, forceReimport) => {
      if (!records.length) {
        return importDone(null, 0, 0, 0, 0);
      }

      console.log(
        host,
        'Checking',
        records.length,
        'record(s) for import into',
        table
      );

      // Get local IDs (convert referenced xuids to ids)

      let xuidMaps = {}; // holds required references for the import of the records
      let referencedTables = [];

      for (let record of records) {
        for (let referenceField in References[table]) {
          let referenceTable = References[table][referenceField];
          if (referenceTable[0] == '@') {
            let varField = referenceTable.slice(1).split(':')[0];
            referenceTable = record[varField];
          }

          if (!xuidMaps[referenceTable]) {
            xuidMaps[referenceTable] = {};
            referencedTables.push(referenceTable);
          }

          if (record[referenceField]) {
            // ignoring empty reference values
            xuidMaps[referenceTable][record[referenceField]] = false;
          }
        }
      }

      async.series(
        referencedTables.map((referenceTable) => (tableDone) => {
          values = Object.keys(xuidMaps[referenceTable]).join('", "');

          queryDB(
            `SELECT id, xuid FROM ${referenceTable} WHERE xuid IN ("${values}")`
          )
            .then((queryResult) => {
              for (let row of queryResult.rows) {
                xuidMaps[referenceTable][row.xuid] = row.id;
              }
              tableDone();
            })
            .catch(tableDone);
        }),
        (err) => {
          if (err) {
            return importDone(err);
          }

          // Convert records to using local IDs
          // Check which records are newer and import them

          let converted = [],
            notFound = {},
            hadNotFound = false;
          let uniqueFields = ['xuid'],
            pseudoKeys = {},
            uniqueFieldsValues = [];

          switch (table) {
            case 'meterdata':
              uniqueFields = ['meter', 'recordedAt', 'day', 'intervalId', 'minute'];
              break;

            case 'meterdataaggregate':
              uniqueFields = ['project', 'day', 'intervalId'];
              break;

            case 'permeterdataaggregate':
              uniqueFields = ['project', 'day', 'meter', 'intervalId'];
              break;
          }

          for (let record of records) {
            record.updatedAt = Math.min(record.updatedAt, Date.now());

            let originalRecord = _.clone(record);

            let failed = false,
              missingRefs = [];

            for (let referenceField in References[table]) {
              if (!record[referenceField]) {
                continue;
              }

              let referenceTable = References[table][referenceField];
              if (referenceTable[0] == '@') {
                let varField = referenceTable.slice(1).split(':')[0];
                referenceTable = record[varField];
              }

              if (xuidMaps[referenceTable][record[referenceField]]) {
                record[referenceField] =
                  xuidMaps[referenceTable][record[referenceField]];
              } else {
                hadNotFound = failed = true;
                notFound[referenceTable + '/' + record[referenceField]] = true;

                missingRefs.push(referenceTable + '/' + record[referenceField]);
              }
            }

            if (!failed) {
              let pseudoKey = [],
                fields = [];

              for (let field of uniqueFields) {
                pseudoKey.push(record[field]);
                fields.push(`${field}="${record[field]}"`);
              }

              pseudoKey = pseudoKey.join('/');
              converted.push(pseudoKey);
              pseudoKeys[pseudoKey] = record;

              uniqueFieldsValues.push(fields.join(' AND '));
            }

            if (failed) {
              retry(table, originalRecord, missingRefs);
            }
          }

          async.series(
            [
              (done) => {
                if (table == 'switchcommand') {
                  prepareSwitchCommandsForImport(
                    converted.map((pseudoKey) => pseudoKeys[pseudoKey]),
                    done
                  );
                } else {
                  done();
                }
              },
            ],
            (err) => {
              let discardedRecords = records.length - converted.length;

              console.log(
                host,
                table,
                'Converted records:',
                converted.length,
                '/',
                records.length
              );
              if (hadNotFound) {
                console.log(
                  host,
                  'Missing references:',
                  JSON.stringify(Object.keys(notFound))
                );
              }

              if (!uniqueFieldsValues.length) {
                uniqueFieldsValues = [false];
              }

              pseudoKeyFields = uniqueFields.join('`, "/", `');

              queryDB(`
              SELECT id, CONCAT(\`${pseudoKeyFields}\`) AS pseudoKey, updatedAt
              FROM ${table}
              WHERE (${uniqueFieldsValues.join(') OR (')})
            `)
                .then((queryResult) => {
                  console.log(
                    host,
                    table,
                    'Recognized',
                    queryResult.rows.length,
                    'records'
                  );

                  let localRecordUpdatedAt = {},
                    localRecordId = {};

                  for (let row of queryResult.rows) {
                    localRecordUpdatedAt[row.pseudoKey] = row.updatedAt;
                    localRecordId[row.pseudoKey] = row.id;
                  }

                  let lastRecordTime = 0,
                    lastRecordRefId = 0,
                    presentRecords = 0,
                    importedRecords = 0;

                  let memLastAnd = (record, callback) => {
                    if (record.updatedAt >= lastRecordTime) {
                      lastRecordTime = record.updatedAt;
                      lastRecordRefId = record._refid;
                      setLastSyncPoint(
                        host,
                        table,
                        record.updatedAt,
                        record._refid,
                        callback
                      );
                    } else {
                      callback();
                    }
                  };

                  async.series(
                    converted.map((pseudoKey) => (recordDone) => {
                      let record = pseudoKeys[pseudoKey];

                      if (
                        !forceReimport &&
                        localRecordUpdatedAt[pseudoKey] >= record.updatedAt
                      ) {
                        presentRecords++;
                        return memLastAnd(record, recordDone);
                      }

                      if (localRecordId[pseudoKey]) {
                        record._localId = localRecordId[pseudoKey];
                      }

                      importRecord(table, record, (err) => {
                        if (
                          err &&
                          !(
                            table == 'meterdata' &&
                            err
                              .toString()
                              .match(/ER_DUP_ENTRY: Duplicate entry/)
                          )
                        ) {
                          return recordDone(err);
                        }

                        if (
                          recordHasSideEffects(
                            table,
                            record,
                            localRecordId[pseudoKey]
                          )
                        ) {
                          recordsWithSideEffects.push([
                            table,
                            record,
                            localRecordId[pseudoKey],
                          ]);
                        }

                        importedRecords++;
                        memLastAnd(record, recordDone);
                      });
                    }),
                    (err) => {
                      if (!err) {
                        return memLastAnd(
                          records[records.length - 1],
                          (err) => {
                            importDone(
                              err,
                              importedRecords,
                              discardedRecords + presentRecords,
                              lastRecordTime,
                              lastRecordRefId
                            );
                          }
                        );
                      }
                      importDone(
                        err,
                        importedRecords,
                        discardedRecords + presentRecords,
                        lastRecordTime,
                        lastRecordRefId
                      );
                    }
                  );
                })
                .catch(importDone);
            }
          );
        }
      );
    };

    let tables = getOrderedTables();

    let tableNeedsSyncing = (table) => {
      if (onlyTheseTables && !onlyTheseTables.includes(table)) {
        return false;
      }

      if (
        !thisIsTheMaster &&
        ![
          'schedule',
          'switch',
          'switch_switches_switch__switchcommand_switches',
          'switchcommand',
          'test',
        ].includes(table)
      ) {
        // only the above are imported by slaves
        return false;
      }

      if (thisIsTheMaster && ['client', 'user'].includes(table)) {
        // master won't request client and user tables from slaves
        return false;
      }

      return true;
    };

    async.series(
      tables.map((table) => (tableDone) => {
        if (!tableNeedsSyncing(table)) {
          return tableDone();
        }

        let lastSyncPoint, lastRefId;

        let processChunk = () => {
          getLastSyncPoint(host, table, (syncPointError, syncPoint, refId) => {
            if (syncPointError) {
              return chunkDone(syncPointError);
            }

            lastSyncPoint = syncPoint;
            lastRefId = refId;

            requestRecords(
              host,
              table,
              syncPoint,
              refId,
              (requestError, records) => {
                if (requestError) {
                  return chunkDone(requestError);
                }

                importRecords(table, records, chunkDone);
              }
            );
          });
        };

        let chunkDone = (
          err,
          importedRecords,
          ignoredRecords,
          lastRecordTime,
          lastRecordRefId
        ) => {
          console.log(
            host,
            table,
            'Imported',
            importedRecords,
            'ignored',
            ignoredRecords
          );

          if (err) {
            return tableDone(err);
          }

          //two cases:
          // - there were records imported, and they were pretty old
          // - not previous case, but there were ignored records and last record time is greater then when chunk started
          if (
            (importedRecords &&
              lastRecordTime < new Date().getTime() - 60000) ||
            (ignoredRecords &&
              (lastRecordTime > lastSyncPoint + 60000 ||
                (lastRecordTime == lastSyncPoint &&
                  lastRecordRefId > lastRefId)))
          ) {
            if (Date.now() - syncStarted < 5 * 60 * 1000) {
              return processChunk();
            }
          }

          return tableDone();
        };

        processChunk();
      }),
      (hostError) => {
        if (hostError) {
          return hostDone(hostError);
        }

        let handleSideEffects = () => {
          if (!recordsWithSideEffects.length) {
            return hostDone();
          }

          console.log(host, 'Handling records with side effects...');

          async.series(
            recordsWithSideEffects.map(([table, record, localId]) => {
              return (done) =>
                handleRecordSideEffects(table, record, localId, done);
            }),
            hostDone
          );
        };

        let deleteRecords = () => {
          console.log(host, 'Checking deleted records...');
          getLastSyncPoint(host, 'deleted', (syncPointError, syncPoint) => {
            if (syncPointError) {
              console.log(host, syncPointError);
              return handleSideEffects();
            }

            requestRecords(
              host,
              'deleted',
              syncPoint,
              0,
              (requestError, recordsToDelete) => {
                if (requestError) {
                  console.log(host, requestError);
                  return handleSideEffects();
                }

                async.series(
                  recordsToDelete.map((record) => (recordDone) => {
                    let doDelete = () => {
                      const storeDeleteSyncPoint = () => {
                        setLastSyncPoint(
                          host,
                          'deleted',
                          record.deletedAt,
                          0,
                          noArgument(recordDone)
                        );
                      };

                      if (tableNeedsSyncing(record.table)) {
                        deleteRecord(
                          record.table,
                          record.xuid,
                          (deleteError) => {
                            if (deleteError) {
                              return recordDone(deleteError);
                            }

                            storeDeleteSyncPoint();
                          }
                        );
                      } else {
                        storeDeleteSyncPoint();
                      }
                    };

                    if (recordHasSideEffects('deleted', record, null)) {
                      handleRecordSideEffects(
                        'deleted',
                        record,
                        null,
                        doDelete
                      );
                    } else {
                      doDelete();
                    }
                  }),
                  noArgument(handleSideEffects)
                );
              }
            );
          });
        };

        if (retryQueueIsEmpty) {
          return deleteRecords();
        }

        console.log(host, 'RETRYING failed records');

        let queue = _.clone(retryQueue),
          missingRefs = _.clone(retryMissingRefs);
        (retryQueue = {}), (retryMissingRefs = []);
        retryQueueIsEmpty = true;

        let resolveWithPartials = (items) => {
          items = items.map(([name, refs]) => ({
            name: name,
            refs: refs,
            resolved: false,
          }));

          let originalItems = items.slice(0);

          let resolved = [];

          let partial = (item) => ({
            name: item.name,
            refs: [],
            parent: item,
            resolved: true,
          });

          let resolve = (item) => {
            item.resolved = true;
            resolved.push(item);
            for (let ritem of resolved) {
              if (
                ritem.parent &&
                ritem.parent.resolved == false &&
                ritem.parent.refs[0] == item.name
              ) {
                resolve(ritem.parent);
              }
            }
          };

          let item;

          while ((item = items.shift())) {
            if (
              !item.refs.length ||
              originalItems.find(
                (oitem) => oitem.name == item.refs[0] && oitem.resolved == true
              )
            ) {
              resolve(item);
            } else {
              resolve(partial(item));
            }
          }

          return resolved
            .filter((item) => !item.parent || item.parent.resolved == true)
            .map((item) => [item.name, item.parent ? item.parent.refs : []]);
        };

        let partials = resolveWithPartials(missingRefs);

        let retryRecords = partials.map(([name, removedRefs]) => {
          let [table, xuid] = name.split('/');

          let partialRecord = _.clone(
            queue[table].find((record) => record.xuid == xuid)
          );

          for (let ref of removedRefs) {
            let [refName, refXuid] = ref.split('/');

            partialRecord[refName] = null;
          }

          return [table, partialRecord];
        });

        let imports = [],
          lastTable,
          lastRecords;

        for (let [table, record] of retryRecords) {
          if (table != lastTable) {
            if (lastTable) imports.push([lastTable, lastRecords]);
            lastTable = table;
            lastRecords = [record];
          } else {
            lastRecords.push(record);
          }
        }

        if (lastTable) imports.push([lastTable, lastRecords]);

        async.series(
          imports.map(([table, records]) => (importDone) => {
            importRecords(table, records, importDone, true);
          }),
          deleteRecords
        );
      }
    );
  };
}

function recordHasSideEffects(table, record, localId) {
  if (table == 'switchcommand' && !localId) {
    return true;
  }

  if (table == 'deleted' && record.table == 'switchcommand') {
    return true;
  }

  if (sails.config.influxUrl) {
    if (['meterdata', 'gateway'].includes(table)) {
      return true;
    }
  }

  return false;
}

function handleRecordSideEffects(table, record, localId, done) {
  if (table == 'deleted' && record.table == 'switchcommand') {
    queryDB(`
      SELECT
        sc.id AS id,
        p.slug AS slug
      FROM
        switchcommand sc
        INNER JOIN project AS p
          ON sc.project = p.id
      WHERE sc.xuid = "${record.xuid}"
    `).then((queryResult) => {
      if (!queryResult.rows || !queryResult.rows.length) {
        return done();
      }

      console.log(
        'Cancelling switch command',
        queryResult.rows[0].slug,
        queryResult.rows[0].id
      );

      sails.helpers.devices
        .cancelSwitchSchedule({
          projectSlug: queryResult.rows[0].slug,
          scheduleId: 'x-' + queryResult.rows[0].id,
        })
        .exec(done);
    });

    return;
  }

  if (table == 'switchcommand' && !localId) {
    // this is a new switch command, send it to devices

    // console.log('--------switch command record:', JSON.stringify(record))

    queryDB(`
      SELECT
        p.slug AS slug,
        GROUP_CONCAT(ss.switch_switches_switch SEPARATOR ',') AS switches,
        sc.id AS id
      FROM
        switchcommand sc
        INNER JOIN project AS p
          ON sc.project = p.id
        INNER JOIN switch_switches_switch__switchcommand_switches AS ss
          ON ss.switchcommand_switches = sc.id
      WHERE sc.xuid = "${record.xuid}"
      GROUP BY sc.id    
    `)
      .then((queryResult) => {
        if (!queryResult.rows || !queryResult.rows.length) {
          return done();
        }

        let info = queryResult.rows[0];
        let switches = info.switches.split(',');

        console.log('Sending', switches.length, 'switch command(s)', switches);

        async.eachSeries(
          switches,
          function (switchId, nextSwitch) {
            setTimeout(function () {
              console.log(
                'send switch command:',
                JSON.stringify({
                  projectSlug: info.slug,
                  time: record.startAt,
                  command: record.commandType,
                  switchId: switchId,
                  switchCommandId: info.id,
                  scheduleId: 'x-' + info.id,
                })
              );
              /*return nextSwitch()*/

              sails.helpers.devices
                .sendSwitchCommand({
                  projectSlug: info.slug,
                  time: record.startAt,
                  command: record.commandType,
                  switchId: switchId,
                  switchCommandId: info.id,
                  scheduleId: 'x-' + info.id,
                })
                .exec({
                  error: () => nextSwitch(),
                  success: nextSwitch,
                });
            }, 1000);
          },
          done
        );
      })
      .catch(done);

    return;
  }

  if (table == 'meterdata' && sails.config.influxUrl) {
    queryDB(`
      select p.name project, m.name meter
      from meter m
        join project p on m.project = p.id
      where m.meshId = '${record.meshId}'
    `).then((results) => {
      if (results.rows && results.rows.length) {
        const project = results.rows[0].project.replace(/ /g, '\\ ');
        const meter = results.rows[0].meter.replace(/ /g, '\\ ');
        request({
          url: `${sails.config.influxUrl}/write?db=do`,
          method: 'POST',
          body: `meterdata,meshId=${
            record.meshId
          },project=${project},meter=${meter} value=1 ${
            record.recordedAt * 1000000
          }`,
        });
      }

      done();
    });

    return;
  }

  if (table == 'gateway' && sails.config.influxUrl) {
    queryDB(`
      select name
      from project
      where id = ${record.project}
    `).then((results) => {
      if (results.rows && results.rows.length) {
        const project = results.rows[0].name.replace(/ /g, '\\ ');
        const gateway = record.name.replace(/ /g, '\\ ');

        request({
          url: `${sails.config.influxUrl}/write?db=do`,
          method: 'POST',
          body: `gateway_delay,gateway=${gateway},project=${project} value=${
            record.lastCommunicatedAt
          } ${Date.now() * 1000000}`,
        });
      }

      done();
    });

    return;
  }

  done();
}

function requestRecords(host, table, syncPoint, refId, done) {
  if (!refId) refId = 0;

  let url =
    'http://' +
    host +
    '/api/datasync/' +
    table +
    '/' +
    syncPoint +
    '/' +
    100 +
    '/' +
    refId;

  console.log('Request records', url, new Date(syncPoint).toGMTString());

  request(
    {
      url: url,
      timeout: 10 * 60e3,
    },
    (requestError, response, responseBody) => {
      let records,
        error = requestError;

      let shouldTryParse = !requestError && response.statusCode == 200,
        gotRequestError = !requestError && response.statusCode != 200;

      if (shouldTryParse) {
        try {
          records = JSON.parse(responseBody);
        } catch (parseError) {
          error = parseError;
        }
      }

      if (gotRequestError) {
        error = 'Request failure: ' + response.statusMessage;
      }

      done(error, records);
    }
  );
}

function getLastSyncPoint(host, table, done) {
  // if(Math.random() > 1 - failureProbability) return done('random failure test in getLastSyncPoint')

  queryDB(
    'SELECT lastSyncPoint, refId FROM _sync_status WHERE host = "' +
      host +
      '" AND `table` = "' +
      table +
      '"'
  )
    .then((queryResult) => {
      if (queryResult.rows && queryResult.rows.length) {
        done(
          null,
          queryResult.rows[0].lastSyncPoint,
          queryResult.rows[0].refId
        );
      } else {
        done(null, 0);
      }
      //if (host.indexOf("carris") >= 0)
      // 	console.log("queryResult",queryResult,table);
    })
    .catch(done);
}

function setLastSyncPoint(host, table, syncPoint, refId, done) {
  // if(Math.random() > 1 - failureProbability) return done('random failure test in setLastSyncPoint')

  if (!refId) refId = 0;
  queryDB(
    'INSERT INTO _sync_status (host, `table`, lastSyncPoint, refId)' +
      ' VALUES ("' +
      host +
      '", "' +
      table +
      '", ' +
      syncPoint +
      ', ' +
      refId +
      ')' +
      ' ON DUPLICATE KEY UPDATE host = "' +
      host +
      '", `table` = "' +
      table +
      '", lastSyncPoint = ' +
      syncPoint +
      ', refId = ' +
      refId
  )
    .then(noArgument(done))
    .catch(done);
}

function dbHasMoreRecentRecord(table, record, done) {
  // if(Math.random() > 1 - failureProbability) return done('random failure test in dbHasMoreRecentRecord')

  let uniqueFields = ['xuid'],
    conditions = [];

  switch (table) {
    case 'meterdata':
      uniqueFields = ['meter', 'recordedAt'];
      break;

    case 'meterdataaggregate':
      uniqueFields = ['project', 'day', 'intervalId'];
      break;

    case 'permeterdataaggregate':
      uniqueFields = ['project', 'day', 'meter', 'intervalId'];
      break;
  }

  for (let field of uniqueFields) {
    conditions.push('`' + field + '` = ' + JSON.stringify(record[field]));
  }

  queryDB(
    'SELECT updatedAt FROM ' + table + ' WHERE ' + conditions.join(' AND ')
  )
    .then((queryResult) => {
      if (queryResult.rows && queryResult.rows.length) {
        done(null, queryResult.rows[0].updatedAt >= record.updatedAt);
      } else {
        done(null, false);
      }
    })
    .catch(done);
}

function importRecord(table, record, done) {
  // if(Math.random() > 1 - failureProbability) return done('random failure test in importRecord')

  let updateFields = [],
    keys = [],
    values = [],
    justUpdate = false,
    id;

  for (let key in record) {
    if (key == 'id') {
      // ignore 'id' field
      continue;
    }

    if (key == '_refid') {
      // ignore '_refid' field
      continue;
    }

    if (key == '_localId') {
      // use '_localId' field for strict updating
      justUpdate = true;
      id = record._localId;
      delete record._localId;
      continue;
    }

    let value = JSON.stringify(record[key]);

    key = '`' + key + '`';

    keys.push(key);
    values.push(value);

    updateFields.push(key + ' = ' + value);
  }

  // console.log('DB IMPORT', table, record.xuid)
  // return done()

  if (justUpdate) {
    return queryDB(
      'UPDATE ' +
        table +
        ' SET ' +
        updateFields.join(', ') +
        ' WHERE id = ' +
        id
    )
      .then(noArgument(done))
      .catch(done);
  }

  queryDB(
    'INSERT INTO ' +
      table +
      ' (' +
      keys.join(', ') +
      ') VALUES (' +
      values.join(', ') +
      ') ON DUPLICATE KEY UPDATE ' +
      updateFields.join(', ')
  )
    .then(noArgument(done))
    .catch(done);
}

function deleteRecord(table, xuid, done) {
  // if(Math.random() > 1 - failureProbability) return done('random failure test' in Math)

  // console.log('DB DELETE', table, xuid)
  // return done()

  queryDB('DELETE FROM ' + table + ' WHERE xuid = "' + xuid + '"')
    .then(noArgument(done))
    .catch(done);
}

//------------------------------------------------------------------------
//
// XUID MIGRATION
//
//------------------------------------------------------------------------

function migrationStatus(done) {
  let info = {},
    tasks = [];

  for (let table in References) {
    if (BigTables.indexOf(table) === -1) {
      tasks.push(table);
    }
  }

  async.series(
    tasks.map((table) => (tableDone) => {
      info[table] = {
        hasXuid: false,
        hasUpdatedAt: false,
      };

      queryDB('SHOW COLUMNS FROM ' + table)
        .then((queryResult) => {
          if (queryResult.rows && queryResult.rows.length) {
            info[table].hasXuid =
              (queryResult.rows.find(itemHas('Field', 'xuid')) && true) ||
              false;
            info[table].hasUpdatedAt =
              (queryResult.rows.find(itemHas('Field', 'updatedAt')) && true) ||
              false;
          }

          tableDone();
        })
        .catch((err) => {
          console.log(err);

          tableDone();
        });
    }),
    (err) => {
      done({
        err: err,
        info: info,
      });
    }
  );
}

function createSyncStatusTable(done) {
  queryDB(
    'CREATE TABLE `_sync_status` (\
      `host` VARCHAR(200) NOT NULL,\
      `table` VARCHAR(100) NOT NULL,\
      `lastSyncPoint` BIGINT(20) NOT NULL DEFAULT 0,\
      `refId` BIGINT(20) NOT NULL DEFAULT 0,\
      UNIQUE INDEX `PK` (`host` ASC, `table` ASC))'
  )
    .then(noArgument(done))
    .catch(done);
}

function createDeletedXuidsTable(done) {
  queryDB(
    'CREATE TABLE `_deleted_xuids` (\
      `table` VARCHAR(100) NOT NULL,\
      `xuid` VARCHAR(36) NOT NULL,\
      `deletedAt` BIGINT(20) NOT NULL,\
      PRIMARY KEY (`xuid`),\
      INDEX `timestamp` (`deletedAt` ASC),\
      INDEX `table` (`table` ASC))'
  )
    .then(noArgument(done))
    .catch(done);
}

function createXuidColumns(done) {
  migrationStatus((status) => {
    async.series(
      tasksFromKeys(status.info, (table, info, tableDone) => {
        if (info.hasXuid) {
          return tableDone();
        }

        let afterId = isRelational(table) ? '' : ' AFTER id';

        queryDB(
          'ALTER TABLE ' +
            table +
            ' ADD COLUMN xuid VARCHAR(36) NULL' +
            afterId +
            ', ADD UNIQUE INDEX xuid (xuid ASC)'
        )
          .then(noArgument(tableDone))
          .catch((err) => {
            console.log(err);
            tableDone();
          });
      }),
      done
    );
  });
}

function createUpdatedAtColumns(done) {
  migrationStatus((status) => {
    async.series(
      tasksFromKeys(status.info, (table, info, tableDone) => {
        if (!isRelational(table) || info.hasUpdatedAt) {
          return tableDone();
        }

        queryDB(
          'ALTER TABLE ' + table + ' ADD COLUMN updatedAt BIGINT(20) NULL'
        )
          .then(noArgument(tableDone))
          .catch((err) => {
            console.log(err);
            tableDone();
          });
      }),
      done
    );
  });
}

function populateUpdatedAtColumns(done) {
  migrationStatus((status) => {
    async.series(
      tasksFromKeys(status.info, (table, info, tableDone) => {
        if (!isRelational(table) || !info.hasUpdatedAt) {
          return tableDone();
        }

        queryDB('UPDATE ' + table + ' SET updatedAt = id')
          .then(noArgument(tableDone))
          .catch((err) => {
            console.log(err);
            tableDone();
          });
      }),
      done
    );
  });
}

function createUpdatedAtIndex(done) {
  migrationStatus((status) => {
    async.series(
      tasksFromKeys(status.info, (table, info, tableDone) => {
        queryDB('ALTER TABLE ' + table + ' ADD INDEX updatedAt (updatedAt ASC)')
          .then(noArgument(tableDone))
          .catch((err) => {
            console.log(err);
            tableDone();
          });
      }),
      done
    );
  });
}

function createXuidTriggers(done) {
  migrationStatus((status) => {
    async.series(
      tasksFromKeys(status.info, (table, info, tableDone) => {
        queryDB(
          [
            'CREATE DEFINER = CURRENT_USER trigger xuid_' + table,
            'BEFORE INSERT ON ' + table,
            'FOR EACH ROW',
            "  SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid)",
          ].join('\n')
        )
          .then(noArgument(tableDone))
          .catch((err) => {
            console.log(err);
            tableDone();
          });
      }),
      done
    );
  });
}

function createUpdatedAtTriggers(done) {
  migrationStatus((status) => {
    async.series(
      tasksFromKeys(status.info, (table, info, tableDone) => {
        if (!isRelational(table)) {
          return tableDone();
        }

        queryDB(
          [
            'CREATE DEFINER = CURRENT_USER trigger updatedAt_' + table,
            'BEFORE INSERT ON ' + table,
            'FOR EACH ROW',
            '  SET NEW.updatedAt = IF(NEW.updatedAt IS NULL, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000), NEW.updatedAt)',
          ].join('\n')
        )
          .then(noArgument(tableDone))
          .catch((err) => {
            console.log(err);
            tableDone();
          });
      }),
      done
    );
  });
}

function createDeleteTriggers(done) {
  migrationStatus((status) => {
    async.series(
      tasksFromKeys(status.info, (table, info, tableDone) => {
        queryDB(
          [
            'CREATE DEFINER = CURRENT_USER trigger deleteXuid_' + table,
            'AFTER DELETE ON ' + table,
            'FOR EACH ROW',
            '    INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) ',
            '        VALUES ("' +
              table +
              '", OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000))',
            '    ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000)',
          ].join('\n')
        )
          .then(noArgument(tableDone))
          .catch((err) => {
            console.log(err);
            tableDone();
          });
      }),
      done
    );
  });
}

function destroySyncStatusTable(done) {
  queryDB('DROP TABLE IF EXISTS `_sync_status`')
    .then(noArgument(done))
    .catch(done);
}

function destroyDeletedXuidsTable(done) {
  queryDB('DROP TABLE IF EXISTS `_deleted_xuids`')
    .then(noArgument(done))
    .catch(done);
}

function destroyXuidColumns(done) {
  migrationStatus((status) => {
    async.series(
      tasksFromKeys(status.info, (table, info, tableDone) => {
        if (!info.hasXuid) {
          return tableDone();
        }

        queryDB('ALTER TABLE ' + table + ' DROP COLUMN xuid, DROP INDEX xuid')
          .then(noArgument(tableDone))
          .catch((err) => {
            console.log(err);
            tableDone();
          });
      }),
      done
    );
  });
}

function destroyUpdatedAtColumns(done) {
  migrationStatus((status) => {
    async.series(
      tasksFromKeys(status.info, (table, info, tableDone) => {
        if (!isRelational(table) || !info.hasUpdatedAt) {
          return tableDone();
        }

        queryDB('ALTER TABLE ' + table + ' DROP COLUMN updatedAt')
          .then(noArgument(tableDone))
          .catch((err) => {
            console.log(err);
            tableDone();
          });
      }),
      done
    );
  });
}

function destroyUpdatedAtIndex(done) {
  migrationStatus((status) => {
    async.series(
      tasksFromKeys(status.info, (table, info, tableDone) => {
        queryDB('ALTER TABLE ' + table + ' DROP INDEX updatedAt')
          .then(noArgument(tableDone))
          .catch((err) => {
            console.log(err);
            tableDone();
          });
      }),
      done
    );
  });
}

function destroyXuidTriggers(done) {
  migrationStatus((status) => {
    async.series(
      tasksFromKeys(status.info, (table, info, tableDone) => {
        queryDB('DROP TRIGGER IF EXISTS xuid_' + table)
          .then(noArgument(tableDone))
          .catch((err) => {
            console.log(err);
            tableDone();
          });
      }),
      done
    );
  });
}

function destroyUpdatedAtTriggers(done) {
  migrationStatus((status) => {
    async.series(
      tasksFromKeys(status.info, (table, info, tableDone) => {
        if (!isRelational(table)) {
          return tableDone();
        }

        queryDB('DROP TRIGGER IF EXISTS updatedAt_' + table)
          .then(noArgument(tableDone))
          .catch((err) => {
            console.log(err);
            tableDone();
          });
      }),
      done
    );
  });
}

function destroyDeleteTriggers(done) {
  migrationStatus((status) => {
    async.series(
      tasksFromKeys(status.info, (table, info, tableDone) => {
        queryDB('DROP TRIGGER IF EXISTS deleteXuid_' + table)
          .then(noArgument(tableDone))
          .catch((err) => {
            console.log(err);
            tableDone();
          });
      }),
      done
    );
  });
}

function populateXuidColumns(done) {
  migrationStatus((status) => {
    async.series(
      tasksFromKeys(status.info, (table, info, tableDone) => {
        if (!info.hasXuid) {
          return tableDone();
        }

        queryDB('UPDATE ' + table + ' SET xuid = UUID() WHERE xuid IS NULL')
          .then(noArgument(tableDone))
          .catch((err) => {
            console.log(err);
            tableDone();
          });
      }),
      done
    );
  });
}

function doMigrate(done) {
  async.series(
    [
      createSyncStatusTable,
      createDeletedXuidsTable,
      createXuidColumns,
      populateXuidColumns,
      createXuidTriggers,
      createUpdatedAtColumns,
      populateUpdatedAtColumns,
      createUpdatedAtTriggers,
      createUpdatedAtIndex,
      createDeleteTriggers,
    ],
    done
  );
}

function undoMigrate(done) {
  async.series(
    [
      destroySyncStatusTable,
      destroyDeletedXuidsTable,
      destroyXuidColumns,
      destroyXuidTriggers,
      destroyUpdatedAtIndex,
      destroyUpdatedAtColumns,
      destroyUpdatedAtTriggers,
      destroyDeleteTriggers,
    ],
    done
  );
}

function recreateDeleteTriggers(done) {
  async.series([destroyDeleteTriggers, createDeleteTriggers], done);
}

//------------------------------------------------------------------------
//
// UTIL
//
//------------------------------------------------------------------------

function isRelational(table) {
  return table.match('__');
}

function queryDB(query) {
  // console.log(query)
  return sails.getDatastore('default').sendNativeQuery(query);
}

function itemHas(key, value) {
  return (item) => item[key] == value;
}

function tasksFromKeys(object, taskFunction) {
  let tasks = [];

  for (let key in object) {
    ((key, value) => {
      tasks.push((done) => {
        taskFunction(key, value, done);
      });
    })(key, object[key]);
  }

  return tasks;
}

function noArgument(callback) {
  return () => {
    callback();
  };
}

module.exports = {
  doMigrate: doMigrate,
  undoMigrate: undoMigrate,
  exportRecords: exportRecords,
  sync: sync,
  isSyncable: isSyncable,
  recreateDeleteTriggers: recreateDeleteTriggers,
};
