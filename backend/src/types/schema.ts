export interface Column {
  id: string;
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  isUnique?: boolean;
  isNullable?: boolean;
  references?: { tableId: string; columnId: string } | null;
}

export interface DBTable {
  id: string;
  name: string;
  columns: Column[];
}

export type RelationCardinality =
  | "one-to-one"
  | "one-to-many"
  | "many-to-many";

export interface Relation {
  id: string;
  from: { tableId: string; columnId: string };
  to: { tableId: string; columnId: string };
  cardinality?: RelationCardinality;
  deleteRule?: "cascade" | "restrict" | "set-null";
  updateRule?: "cascade" | "restrict" | "set-null";
  isOneToManyReversed?: boolean;
}
