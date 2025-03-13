export class KeyManagerError extends Error {}

export class KeyNotFound extends KeyManagerError {
  constructor(key: string) {
    super(`Key ${key} does not exist in KeyManager`)
  }
}

export class ProviderNotFound extends KeyManagerError {
  constructor(key: string, providerName: string) {
    super(
      `Provider of key ${key} (${providerName}) does not exist in KeyManager`
    )
  }
}

export class SignerNotAvailable extends KeyManagerError {
  constructor(key: string, providerName: string) {
    super(`Signer for key ${key} (${providerName}) is not available`)
  }
}

export class SignerMethodNotAvailable extends KeyManagerError {
  constructor(key: string, providerName: string, methodName: string) {
    super(
      `Signer of of key ${key} (${providerName}) is missing ${methodName} method`
    )
  }
}

export class SignerError extends KeyManagerError {
  constructor(providerName: string, messsage: string) {
    super(`${providerName} signer error: ${messsage}`)
  }
}
