export class QueryError extends Error {}

export class EntityNotFoundError extends QueryError {
  constructor(entityType: string, id: string) {
    super(`${entityType} not found by id '${id}'`)
  }
}

export class UnexpectedEmptyResult extends QueryError {
  constructor(
    query: string,
    public readonly result?: unknown
  ) {
    super(`${query} query returned empty result`)
  }
}
