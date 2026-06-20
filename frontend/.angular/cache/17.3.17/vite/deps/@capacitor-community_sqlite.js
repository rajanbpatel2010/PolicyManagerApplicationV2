import {
  registerPlugin
} from "./chunk-TG2TFVOY.js";
import {
  __async
} from "./chunk-WDMUDEB6.js";

// node_modules/@capacitor-community/sqlite/dist/esm/definitions.js
var SQLiteConnection = class {
  constructor(sqlite) {
    this.sqlite = sqlite;
    this._connectionDict = /* @__PURE__ */ new Map();
  }
  initWebStore() {
    return __async(this, null, function* () {
      try {
        yield this.sqlite.initWebStore();
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  saveToStore(database) {
    return __async(this, null, function* () {
      try {
        yield this.sqlite.saveToStore({ database });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  saveToLocalDisk(database) {
    return __async(this, null, function* () {
      try {
        yield this.sqlite.saveToLocalDisk({ database });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  getFromLocalDiskToStore(overwrite) {
    return __async(this, null, function* () {
      const mOverwrite = overwrite != null ? overwrite : true;
      try {
        yield this.sqlite.getFromLocalDiskToStore({ overwrite: mOverwrite });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  echo(value) {
    return __async(this, null, function* () {
      try {
        const res = yield this.sqlite.echo({ value });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  isSecretStored() {
    return __async(this, null, function* () {
      try {
        const res = yield this.sqlite.isSecretStored();
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  setEncryptionSecret(passphrase) {
    return __async(this, null, function* () {
      try {
        yield this.sqlite.setEncryptionSecret({ passphrase });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  changeEncryptionSecret(passphrase, oldpassphrase) {
    return __async(this, null, function* () {
      try {
        yield this.sqlite.changeEncryptionSecret({
          passphrase,
          oldpassphrase
        });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  clearEncryptionSecret() {
    return __async(this, null, function* () {
      try {
        yield this.sqlite.clearEncryptionSecret();
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  checkEncryptionSecret(passphrase) {
    return __async(this, null, function* () {
      try {
        const res = yield this.sqlite.checkEncryptionSecret({
          passphrase
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  addUpgradeStatement(database, upgrade) {
    return __async(this, null, function* () {
      try {
        if (database.endsWith(".db"))
          database = database.slice(0, -3);
        yield this.sqlite.addUpgradeStatement({
          database,
          upgrade
        });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  createConnection(database, encrypted, mode, version, readonly) {
    return __async(this, null, function* () {
      try {
        if (database.endsWith(".db"))
          database = database.slice(0, -3);
        yield this.sqlite.createConnection({
          database,
          encrypted,
          mode,
          version,
          readonly
        });
        const conn = new SQLiteDBConnection(database, readonly, this.sqlite);
        const connName = readonly ? `RO_${database}` : `RW_${database}`;
        this._connectionDict.set(connName, conn);
        return Promise.resolve(conn);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  closeConnection(database, readonly) {
    return __async(this, null, function* () {
      try {
        if (database.endsWith(".db"))
          database = database.slice(0, -3);
        yield this.sqlite.closeConnection({ database, readonly });
        const connName = readonly ? `RO_${database}` : `RW_${database}`;
        this._connectionDict.delete(connName);
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  isConnection(database, readonly) {
    return __async(this, null, function* () {
      const res = {};
      if (database.endsWith(".db"))
        database = database.slice(0, -3);
      const connName = readonly ? `RO_${database}` : `RW_${database}`;
      res.result = this._connectionDict.has(connName);
      return Promise.resolve(res);
    });
  }
  retrieveConnection(database, readonly) {
    return __async(this, null, function* () {
      if (database.endsWith(".db"))
        database = database.slice(0, -3);
      const connName = readonly ? `RO_${database}` : `RW_${database}`;
      if (this._connectionDict.has(connName)) {
        const conn = this._connectionDict.get(connName);
        if (typeof conn != "undefined")
          return Promise.resolve(conn);
        else {
          return Promise.reject(`Connection ${database} is undefined`);
        }
      } else {
        return Promise.reject(`Connection ${database} does not exist`);
      }
    });
  }
  getNCDatabasePath(path, database) {
    return __async(this, null, function* () {
      try {
        const databasePath = yield this.sqlite.getNCDatabasePath({
          path,
          database
        });
        return Promise.resolve(databasePath);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  createNCConnection(databasePath, version) {
    return __async(this, null, function* () {
      try {
        yield this.sqlite.createNCConnection({
          databasePath,
          version
        });
        const conn = new SQLiteDBConnection(databasePath, true, this.sqlite);
        const connName = `RO_${databasePath})`;
        this._connectionDict.set(connName, conn);
        return Promise.resolve(conn);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  closeNCConnection(databasePath) {
    return __async(this, null, function* () {
      try {
        yield this.sqlite.closeNCConnection({ databasePath });
        const connName = `RO_${databasePath})`;
        this._connectionDict.delete(connName);
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  isNCConnection(databasePath) {
    return __async(this, null, function* () {
      const res = {};
      const connName = `RO_${databasePath})`;
      res.result = this._connectionDict.has(connName);
      return Promise.resolve(res);
    });
  }
  retrieveNCConnection(databasePath) {
    return __async(this, null, function* () {
      if (this._connectionDict.has(databasePath)) {
        const connName = `RO_${databasePath})`;
        const conn = this._connectionDict.get(connName);
        if (typeof conn != "undefined")
          return Promise.resolve(conn);
        else {
          return Promise.reject(`Connection ${databasePath} is undefined`);
        }
      } else {
        return Promise.reject(`Connection ${databasePath} does not exist`);
      }
    });
  }
  isNCDatabase(databasePath) {
    return __async(this, null, function* () {
      try {
        const res = yield this.sqlite.isNCDatabase({ databasePath });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  retrieveAllConnections() {
    return __async(this, null, function* () {
      return this._connectionDict;
    });
  }
  closeAllConnections() {
    return __async(this, null, function* () {
      const delDict = /* @__PURE__ */ new Map();
      try {
        for (const key of this._connectionDict.keys()) {
          const database = key.substring(3);
          const readonly = key.substring(0, 3) === "RO_" ? true : false;
          yield this.sqlite.closeConnection({ database, readonly });
          delDict.set(key, null);
        }
        for (const key of delDict.keys()) {
          this._connectionDict.delete(key);
        }
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  checkConnectionsConsistency() {
    return __async(this, null, function* () {
      try {
        const keys = [...this._connectionDict.keys()];
        const openModes = [];
        const dbNames = [];
        for (const key of keys) {
          openModes.push(key.substring(0, 2));
          dbNames.push(key.substring(3));
        }
        const res = yield this.sqlite.checkConnectionsConsistency({
          dbNames,
          openModes
        });
        if (!res.result)
          this._connectionDict = /* @__PURE__ */ new Map();
        return Promise.resolve(res);
      } catch (err) {
        this._connectionDict = /* @__PURE__ */ new Map();
        return Promise.reject(err);
      }
    });
  }
  importFromJson(jsonstring) {
    return __async(this, null, function* () {
      try {
        const ret = yield this.sqlite.importFromJson({ jsonstring });
        return Promise.resolve(ret);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  isJsonValid(jsonstring) {
    return __async(this, null, function* () {
      try {
        const ret = yield this.sqlite.isJsonValid({ jsonstring });
        return Promise.resolve(ret);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  copyFromAssets(overwrite) {
    return __async(this, null, function* () {
      const mOverwrite = overwrite != null ? overwrite : true;
      try {
        yield this.sqlite.copyFromAssets({ overwrite: mOverwrite });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  getFromHTTPRequest(url, overwrite) {
    return __async(this, null, function* () {
      const mOverwrite = overwrite != null ? overwrite : true;
      try {
        yield this.sqlite.getFromHTTPRequest({ url, overwrite: mOverwrite });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  isDatabaseEncrypted(database) {
    return __async(this, null, function* () {
      if (database.endsWith(".db"))
        database = database.slice(0, -3);
      try {
        const res = yield this.sqlite.isDatabaseEncrypted({ database });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  isInConfigEncryption() {
    return __async(this, null, function* () {
      try {
        const res = yield this.sqlite.isInConfigEncryption();
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  isInConfigBiometricAuth() {
    return __async(this, null, function* () {
      try {
        const res = yield this.sqlite.isInConfigBiometricAuth();
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  isDatabase(database) {
    return __async(this, null, function* () {
      if (database.endsWith(".db"))
        database = database.slice(0, -3);
      try {
        const res = yield this.sqlite.isDatabase({ database });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  getDatabaseList() {
    return __async(this, null, function* () {
      try {
        const res = yield this.sqlite.getDatabaseList();
        const values = res.values;
        values.sort();
        const ret = { values };
        return Promise.resolve(ret);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  getMigratableDbList(folderPath) {
    return __async(this, null, function* () {
      const path = folderPath ? folderPath : "default";
      try {
        const res = yield this.sqlite.getMigratableDbList({
          folderPath: path
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  addSQLiteSuffix(folderPath, dbNameList) {
    return __async(this, null, function* () {
      const path = folderPath ? folderPath : "default";
      const dbList = dbNameList ? dbNameList : [];
      try {
        const res = yield this.sqlite.addSQLiteSuffix({
          folderPath: path,
          dbNameList: dbList
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  deleteOldDatabases(folderPath, dbNameList) {
    return __async(this, null, function* () {
      const path = folderPath ? folderPath : "default";
      const dbList = dbNameList ? dbNameList : [];
      try {
        const res = yield this.sqlite.deleteOldDatabases({
          folderPath: path,
          dbNameList: dbList
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  moveDatabasesAndAddSuffix(folderPath, dbNameList) {
    return __async(this, null, function* () {
      const path = folderPath ? folderPath : "default";
      const dbList = dbNameList ? dbNameList : [];
      return this.sqlite.moveDatabasesAndAddSuffix({
        folderPath: path,
        dbNameList: dbList
      });
    });
  }
};
var SQLiteDBConnection = class {
  constructor(dbName, readonly, sqlite) {
    this.dbName = dbName;
    this.readonly = readonly;
    this.sqlite = sqlite;
  }
  getConnectionDBName() {
    return this.dbName;
  }
  getConnectionReadOnly() {
    return this.readonly;
  }
  open() {
    return __async(this, null, function* () {
      try {
        yield this.sqlite.open({
          database: this.dbName,
          readonly: this.readonly
        });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  close() {
    return __async(this, null, function* () {
      try {
        yield this.sqlite.close({
          database: this.dbName,
          readonly: this.readonly
        });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  beginTransaction() {
    return __async(this, null, function* () {
      try {
        const changes = yield this.sqlite.beginTransaction({
          database: this.dbName
        });
        return Promise.resolve(changes);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  commitTransaction() {
    return __async(this, null, function* () {
      try {
        const changes = yield this.sqlite.commitTransaction({
          database: this.dbName
        });
        return Promise.resolve(changes);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  rollbackTransaction() {
    return __async(this, null, function* () {
      try {
        const changes = yield this.sqlite.rollbackTransaction({
          database: this.dbName
        });
        return Promise.resolve(changes);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  isTransactionActive() {
    return __async(this, null, function* () {
      try {
        const result = yield this.sqlite.isTransactionActive({
          database: this.dbName
        });
        return Promise.resolve(result);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  loadExtension(path) {
    return __async(this, null, function* () {
      try {
        yield this.sqlite.loadExtension({
          database: this.dbName,
          path,
          readonly: this.readonly
        });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  enableLoadExtension(toggle) {
    return __async(this, null, function* () {
      try {
        yield this.sqlite.enableLoadExtension({
          database: this.dbName,
          toggle,
          readonly: this.readonly
        });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  getUrl() {
    return __async(this, null, function* () {
      try {
        const res = yield this.sqlite.getUrl({
          database: this.dbName,
          readonly: this.readonly
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  getVersion() {
    return __async(this, null, function* () {
      try {
        const version = yield this.sqlite.getVersion({
          database: this.dbName,
          readonly: this.readonly
        });
        return Promise.resolve(version);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  getTableList() {
    return __async(this, null, function* () {
      try {
        const res = yield this.sqlite.getTableList({
          database: this.dbName,
          readonly: this.readonly
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  execute(statements, transaction = true, isSQL92 = true) {
    return __async(this, null, function* () {
      try {
        if (!this.readonly) {
          const res = yield this.sqlite.execute({
            database: this.dbName,
            statements,
            transaction,
            readonly: false,
            isSQL92
          });
          return Promise.resolve(res);
        } else {
          return Promise.reject("not allowed in read-only mode");
        }
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  query(statement, values, isSQL92 = true) {
    return __async(this, null, function* () {
      let res;
      try {
        if (values && values.length > 0) {
          res = yield this.sqlite.query({
            database: this.dbName,
            statement,
            values,
            readonly: this.readonly,
            isSQL92: true
          });
        } else {
          res = yield this.sqlite.query({
            database: this.dbName,
            statement,
            values: [],
            readonly: this.readonly,
            isSQL92
          });
        }
        res = yield this.reorderRows(res);
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  run(statement, values, transaction = true, returnMode = "no", isSQL92 = true) {
    return __async(this, null, function* () {
      let res;
      try {
        if (!this.readonly) {
          if (values && values.length > 0) {
            res = yield this.sqlite.run({
              database: this.dbName,
              statement,
              values,
              transaction,
              readonly: false,
              returnMode,
              isSQL92: true
            });
          } else {
            res = yield this.sqlite.run({
              database: this.dbName,
              statement,
              values: [],
              transaction,
              readonly: false,
              returnMode,
              isSQL92
            });
          }
          res.changes = yield this.reorderRows(res.changes);
          return Promise.resolve(res);
        } else {
          return Promise.reject("not allowed in read-only mode");
        }
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  executeSet(set, transaction = true, returnMode = "no", isSQL92 = true) {
    return __async(this, null, function* () {
      let res;
      try {
        if (!this.readonly) {
          res = yield this.sqlite.executeSet({
            database: this.dbName,
            set,
            transaction,
            readonly: false,
            returnMode,
            isSQL92
          });
          res.changes = yield this.reorderRows(res.changes);
          return Promise.resolve(res);
        } else {
          return Promise.reject("not allowed in read-only mode");
        }
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  isExists() {
    return __async(this, null, function* () {
      try {
        const res = yield this.sqlite.isDBExists({
          database: this.dbName,
          readonly: this.readonly
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  isTable(table) {
    return __async(this, null, function* () {
      try {
        const res = yield this.sqlite.isTableExists({
          database: this.dbName,
          table,
          readonly: this.readonly
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  isDBOpen() {
    return __async(this, null, function* () {
      try {
        const res = yield this.sqlite.isDBOpen({
          database: this.dbName,
          readonly: this.readonly
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  delete() {
    return __async(this, null, function* () {
      try {
        if (!this.readonly) {
          yield this.sqlite.deleteDatabase({
            database: this.dbName,
            readonly: false
          });
          return Promise.resolve();
        } else {
          return Promise.reject("not allowed in read-only mode");
        }
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  createSyncTable() {
    return __async(this, null, function* () {
      try {
        if (!this.readonly) {
          const res = yield this.sqlite.createSyncTable({
            database: this.dbName,
            readonly: false
          });
          return Promise.resolve(res);
        } else {
          return Promise.reject("not allowed in read-only mode");
        }
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  setSyncDate(syncdate) {
    return __async(this, null, function* () {
      try {
        if (!this.readonly) {
          yield this.sqlite.setSyncDate({
            database: this.dbName,
            syncdate,
            readonly: false
          });
          return Promise.resolve();
        } else {
          return Promise.reject("not allowed in read-only mode");
        }
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  getSyncDate() {
    return __async(this, null, function* () {
      try {
        const res = yield this.sqlite.getSyncDate({
          database: this.dbName,
          readonly: this.readonly
        });
        let retDate = "";
        if (res.syncDate > 0)
          retDate = new Date(res.syncDate * 1e3).toISOString();
        return Promise.resolve(retDate);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  exportToJson(mode, encrypted = false) {
    return __async(this, null, function* () {
      try {
        const res = yield this.sqlite.exportToJson({
          database: this.dbName,
          jsonexportmode: mode,
          readonly: this.readonly,
          encrypted
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  deleteExportedRows() {
    return __async(this, null, function* () {
      try {
        if (!this.readonly) {
          yield this.sqlite.deleteExportedRows({
            database: this.dbName,
            readonly: false
          });
          return Promise.resolve();
        } else {
          return Promise.reject("not allowed in read-only mode");
        }
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }
  executeTransaction(txn, isSQL92 = true) {
    return __async(this, null, function* () {
      let changes = 0;
      let isActive = false;
      if (!this.readonly) {
        yield this.sqlite.beginTransaction({
          database: this.dbName
        });
        isActive = yield this.sqlite.isTransactionActive({
          database: this.dbName
        });
        if (!isActive) {
          return Promise.reject("After Begin Transaction, no transaction active");
        }
        try {
          for (const task of txn) {
            if (typeof task !== "object" || !("statement" in task)) {
              throw new Error("Error a task.statement must be provided");
            }
            if ("values" in task && task.values && task.values.length > 0) {
              const retMode = task.statement.toUpperCase().includes("RETURNING") ? "all" : "no";
              const ret = yield this.sqlite.run({
                database: this.dbName,
                statement: task.statement,
                values: task.values,
                transaction: false,
                readonly: false,
                returnMode: retMode,
                isSQL92
              });
              if (ret.changes.changes < 0) {
                throw new Error("Error in transaction method run ");
              }
              changes += ret.changes.changes;
            } else {
              const ret = yield this.sqlite.execute({
                database: this.dbName,
                statements: task.statement,
                transaction: false,
                readonly: false
              });
              if (ret.changes.changes < 0) {
                throw new Error("Error in transaction method execute ");
              }
              changes += ret.changes.changes;
            }
          }
          const retC = yield this.sqlite.commitTransaction({
            database: this.dbName
          });
          changes += retC.changes.changes;
          const retChanges = { changes: { changes } };
          return Promise.resolve(retChanges);
        } catch (err) {
          const msg = err.message ? err.message : err;
          yield this.sqlite.rollbackTransaction({
            database: this.dbName
          });
          return Promise.reject(msg);
        }
      } else {
        return Promise.reject("not allowed in read-only mode");
      }
    });
  }
  reorderRows(res) {
    return __async(this, null, function* () {
      const retRes = res;
      if (res?.values && typeof res.values[0] === "object") {
        if (Object.keys(res.values[0]).includes("ios_columns")) {
          const columnList = res.values[0]["ios_columns"];
          const iosRes = [];
          for (let i = 1; i < res.values.length; i++) {
            const rowJson = res.values[i];
            const resRowJson = {};
            for (const item of columnList) {
              resRowJson[item] = rowJson[item];
            }
            iosRes.push(resRowJson);
          }
          retRes["values"] = iosRes;
        }
      }
      return Promise.resolve(retRes);
    });
  }
};

// node_modules/@capacitor-community/sqlite/dist/esm/index.js
var CapacitorSQLite = registerPlugin("CapacitorSQLite", {
  web: () => import("./web-5UFRRDI3.js").then((m) => new m.CapacitorSQLiteWeb()),
  electron: () => window.CapacitorCustomPlatform.plugins.CapacitorSQLite
});
export {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection
};
//# sourceMappingURL=@capacitor-community_sqlite.js.map
