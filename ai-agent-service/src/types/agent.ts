// Types for AI Agent Service

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
  x: number;
  y: number;
  columns: Column[];
}

export type RelationCardinality = "one-to-one" | "one-to-many" | "many-to-many";

export interface Relation {
  id: string;
  from: { tableId: string; columnId: string };
  to: { tableId: string; columnId: string };
  cardinality?: RelationCardinality;
  deleteRule?: "cascade" | "restrict" | "set-null";
  updateRule?: "cascade" | "restrict" | "set-null";
}

export interface WorkspaceState {
  tables: DBTable[];
  relations: Relation[];
}

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentAction {
  type: "create_table" | "add_column" | "create_relation" | "update_table" | "delete_table" | "complex_schema";
  parameters: any;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  actions?: AgentAction[];
  workspace?: WorkspaceState;
}

export interface ChatRequest {
  message: string;
  workspaceState: WorkspaceState;
  conversationHistory?: AgentMessage[];
}
