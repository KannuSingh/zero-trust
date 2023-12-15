interface Key {
  executeOperation(): void;
}

class MainSignerKey implements Key {
  executeOperation(): void {
    // Perform operation using the main signer key
  }
}

class SessionKey implements Key {
  executeOperation(): void {
    // Perform operation using the session key
  }
}

class BundleService {
  executeOperation(key: Key): void {
    // Perform operation using the given key
    key.executeOperation();
  }
}

class Executor {
  private bundleService: BundleService;

  constructor() {
    this.bundleService = new BundleService();
  }

  execute(account: Account, key: Key): void {
    // Perform operation on the account using the specified key
    account.executeOperationWithKey(this.bundleService, key);
  }
}

class Account {
  executeOperationWithKey(bundleService: BundleService, key: Key): void {
    // Perform operation using the given key
    bundleService.executeOperation(key);
  }
}

// Usage:
const executor = new Executor();
const mainSignerKey = new MainSignerKey();
const sessionKey = new SessionKey();
const account = new Account();

executor.execute(account, mainSignerKey);
executor.execute(account, sessionKey);
