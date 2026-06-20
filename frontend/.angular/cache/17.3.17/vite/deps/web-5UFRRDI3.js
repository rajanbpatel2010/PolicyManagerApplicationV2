import {
  WebPlugin
} from "./chunk-TG2TFVOY.js";
import {
  __async
} from "./chunk-WDMUDEB6.js";

// node_modules/@capacitor-community/sqlite/dist/esm/web.js
var CapacitorSQLiteWeb = class extends WebPlugin {
  constructor() {
    super(...arguments);
    this.jeepSqliteElement = null;
    this.isWebStoreOpen = false;
  }
  initWebStore() {
    return __async(this, null, function* () {
      yield customElements.whenDefined("jeep-sqlite");
      this.jeepSqliteElement = document.querySelector("jeep-sqlite");
      this.ensureJeepSqliteIsAvailable();
      this.jeepSqliteElement.addEventListener("jeepSqliteImportProgress", (event) => {
        this.notifyListeners("sqliteImportProgressEvent", event.detail);
      });
      this.jeepSqliteElement.addEventListener("jeepSqliteExportProgress", (event) => {
        this.notifyListeners("sqliteExportProgressEvent", event.detail);
      });
      this.jeepSqliteElement.addEventListener("jeepSqliteHTTPRequestEnded", (event) => {
        this.notifyListeners("sqliteHTTPRequestEndedEvent", event.detail);
      });
      this.jeepSqliteElement.addEventListener("jeepSqlitePickDatabaseEnded", (event) => {
        this.notifyListeners("sqlitePickDatabaseEndedEvent", event.detail);
      });
      this.jeepSqliteElement.addEventListener("jeepSqliteSaveDatabaseToDisk", (event) => {
        this.notifyListeners("sqliteSaveDatabaseToDiskEvent", event.detail);
      });
      if (!this.isWebStoreOpen) {
        this.isWebStoreOpen = yield this.jeepSqliteElement.isStoreOpen();
      }
      return;
    });
  }
  saveToStore(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        yield this.jeepSqliteElement.saveToStore(options);
        return;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  getFromLocalDiskToStore(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        yield this.jeepSqliteElement.getFromLocalDiskToStore(options);
        return;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  saveToLocalDisk(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        yield this.jeepSqliteElement.saveToLocalDisk(options);
        return;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  echo(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      const echoResult = yield this.jeepSqliteElement.echo(options);
      return echoResult;
    });
  }
  createConnection(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        yield this.jeepSqliteElement.createConnection(options);
        return;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  open(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        yield this.jeepSqliteElement.open(options);
        return;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  closeConnection(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        yield this.jeepSqliteElement.closeConnection(options);
        return;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  getVersion(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const versionResult = yield this.jeepSqliteElement.getVersion(options);
        return versionResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  checkConnectionsConsistency(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      try {
        const consistencyResult = yield this.jeepSqliteElement.checkConnectionsConsistency(options);
        return consistencyResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  close(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        yield this.jeepSqliteElement.close(options);
        return;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  beginTransaction(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const changes = yield this.jeepSqliteElement.beginTransaction(options);
        return changes;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  commitTransaction(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const changes = yield this.jeepSqliteElement.commitTransaction(options);
        return changes;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  rollbackTransaction(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const changes = yield this.jeepSqliteElement.rollbackTransaction(options);
        return changes;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  isTransactionActive(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const result = yield this.jeepSqliteElement.isTransactionActive(options);
        return result;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  getTableList(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const tableListResult = yield this.jeepSqliteElement.getTableList(options);
        return tableListResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  execute(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const executeResult = yield this.jeepSqliteElement.execute(options);
        return executeResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  executeSet(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const executeResult = yield this.jeepSqliteElement.executeSet(options);
        return executeResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  run(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const runResult = yield this.jeepSqliteElement.run(options);
        return runResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  query(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const queryResult = yield this.jeepSqliteElement.query(options);
        return queryResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  isDBExists(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const dbExistsResult = yield this.jeepSqliteElement.isDBExists(options);
        return dbExistsResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  isDBOpen(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const isDBOpenResult = yield this.jeepSqliteElement.isDBOpen(options);
        return isDBOpenResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  isDatabase(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const isDatabaseResult = yield this.jeepSqliteElement.isDatabase(options);
        return isDatabaseResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  isTableExists(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const tableExistsResult = yield this.jeepSqliteElement.isTableExists(options);
        return tableExistsResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  deleteDatabase(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        yield this.jeepSqliteElement.deleteDatabase(options);
        return;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  isJsonValid(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const isJsonValidResult = yield this.jeepSqliteElement.isJsonValid(options);
        return isJsonValidResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  importFromJson(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const importFromJsonResult = yield this.jeepSqliteElement.importFromJson(options);
        return importFromJsonResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  exportToJson(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const exportToJsonResult = yield this.jeepSqliteElement.exportToJson(options);
        return exportToJsonResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  createSyncTable(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const createSyncTableResult = yield this.jeepSqliteElement.createSyncTable(options);
        return createSyncTableResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  setSyncDate(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        yield this.jeepSqliteElement.setSyncDate(options);
        return;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  getSyncDate(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const getSyncDateResult = yield this.jeepSqliteElement.getSyncDate(options);
        return getSyncDateResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  deleteExportedRows(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        yield this.jeepSqliteElement.deleteExportedRows(options);
        return;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  addUpgradeStatement(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        yield this.jeepSqliteElement.addUpgradeStatement(options);
        return;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  copyFromAssets(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        yield this.jeepSqliteElement.copyFromAssets(options);
        return;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  getFromHTTPRequest(options) {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        yield this.jeepSqliteElement.getFromHTTPRequest(options);
        return;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  getDatabaseList() {
    return __async(this, null, function* () {
      this.ensureJeepSqliteIsAvailable();
      this.ensureWebstoreIsOpen();
      try {
        const databaseListResult = yield this.jeepSqliteElement.getDatabaseList();
        return databaseListResult;
      } catch (err) {
        throw new Error(`${err}`);
      }
    });
  }
  /**
   * Checks if the `jeep-sqlite` element is present in the DOM.
   * If it's not in the DOM, this method throws an Error.
   *
   * Attention: This will always fail, if the `intWebStore()` method wasn't called before.
   */
  ensureJeepSqliteIsAvailable() {
    if (this.jeepSqliteElement === null) {
      throw new Error(`The jeep-sqlite element is not present in the DOM! Please check the @capacitor-community/sqlite documentation for instructions regarding the web platform.`);
    }
  }
  ensureWebstoreIsOpen() {
    if (!this.isWebStoreOpen) {
      throw new Error('WebStore is not open yet. You have to call "initWebStore()" first.');
    }
  }
  ////////////////////////////////////
  ////// UNIMPLEMENTED METHODS
  ////////////////////////////////////
  getUrl() {
    return __async(this, null, function* () {
      throw this.unimplemented("Not implemented on web.");
    });
  }
  getMigratableDbList(options) {
    return __async(this, null, function* () {
      console.log("getMigratableDbList", options);
      throw this.unimplemented("Not implemented on web.");
    });
  }
  addSQLiteSuffix(options) {
    return __async(this, null, function* () {
      console.log("addSQLiteSuffix", options);
      throw this.unimplemented("Not implemented on web.");
    });
  }
  deleteOldDatabases(options) {
    return __async(this, null, function* () {
      console.log("deleteOldDatabases", options);
      throw this.unimplemented("Not implemented on web.");
    });
  }
  moveDatabasesAndAddSuffix(options) {
    return __async(this, null, function* () {
      console.log("moveDatabasesAndAddSuffix", options);
      throw this.unimplemented("Not implemented on web.");
    });
  }
  isSecretStored() {
    return __async(this, null, function* () {
      throw this.unimplemented("Not implemented on web.");
    });
  }
  setEncryptionSecret(options) {
    return __async(this, null, function* () {
      console.log("setEncryptionSecret", options);
      throw this.unimplemented("Not implemented on web.");
    });
  }
  changeEncryptionSecret(options) {
    return __async(this, null, function* () {
      console.log("changeEncryptionSecret", options);
      throw this.unimplemented("Not implemented on web.");
    });
  }
  clearEncryptionSecret() {
    return __async(this, null, function* () {
      console.log("clearEncryptionSecret");
      throw this.unimplemented("Not implemented on web.");
    });
  }
  checkEncryptionSecret(options) {
    return __async(this, null, function* () {
      console.log("checkEncryptionPassPhrase", options);
      throw this.unimplemented("Not implemented on web.");
    });
  }
  getNCDatabasePath(options) {
    return __async(this, null, function* () {
      console.log("getNCDatabasePath", options);
      throw this.unimplemented("Not implemented on web.");
    });
  }
  createNCConnection(options) {
    return __async(this, null, function* () {
      console.log("createNCConnection", options);
      throw this.unimplemented("Not implemented on web.");
    });
  }
  closeNCConnection(options) {
    return __async(this, null, function* () {
      console.log("closeNCConnection", options);
      throw this.unimplemented("Not implemented on web.");
    });
  }
  isNCDatabase(options) {
    return __async(this, null, function* () {
      console.log("isNCDatabase", options);
      throw this.unimplemented("Not implemented on web.");
    });
  }
  isDatabaseEncrypted(options) {
    return __async(this, null, function* () {
      console.log("isDatabaseEncrypted", options);
      throw this.unimplemented("Not implemented on web.");
    });
  }
  isInConfigEncryption() {
    return __async(this, null, function* () {
      throw this.unimplemented("Not implemented on web.");
    });
  }
  isInConfigBiometricAuth() {
    return __async(this, null, function* () {
      throw this.unimplemented("Not implemented on web.");
    });
  }
  loadExtension(options) {
    return __async(this, null, function* () {
      console.log("loadExtension", options);
      throw this.unimplemented("Not implemented on web.");
    });
  }
  enableLoadExtension(options) {
    return __async(this, null, function* () {
      console.log("enableLoadExtension", options);
      throw this.unimplemented("Not implemented on web.");
    });
  }
};
export {
  CapacitorSQLiteWeb
};
//# sourceMappingURL=web-5UFRRDI3.js.map
