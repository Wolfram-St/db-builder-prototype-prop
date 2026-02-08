// DB Builder Tools - Interface for AI agent to manipulate database schema

import { v4 as uuid } from 'uuid';
import type { DBTable, Column, Relation, WorkspaceState, RelationCardinality } from '../types/agent.js';

export class DBBuilderTools {
  /**
   * Creates a new table in the workspace
   */
  static createTable(
    workspace: WorkspaceState,
    name: string,
    columns: Omit<Column, 'id'>[],
    position?: { x: number; y: number }
  ): DBTable {
    const tableId = uuid();
    const newTable: DBTable = {
      id: tableId,
      name,
      x: position?.x ?? Math.random() * 500,
      y: position?.y ?? Math.random() * 500,
      columns: columns.map(col => ({
        ...col,
        id: uuid()
      }))
    };
    
    workspace.tables.push(newTable);
    return newTable;
  }

  /**
   * Adds a column to an existing table
   */
  static addColumn(
    workspace: WorkspaceState,
    tableId: string,
    column: Omit<Column, 'id'>
  ): Column | null {
    const table = workspace.tables.find(t => t.id === tableId);
    if (!table) return null;

    const newColumn: Column = {
      ...column,
      id: uuid()
    };
    
    table.columns.push(newColumn);
    return newColumn;
  }

  /**
   * Creates a relation between two tables
   */
  static createRelation(
    workspace: WorkspaceState,
    fromTableId: string,
    fromColumnId: string,
    toTableId: string,
    toColumnId: string,
    cardinality?: RelationCardinality,
    deleteRule?: "cascade" | "restrict" | "set-null",
    updateRule?: "cascade" | "restrict" | "set-null"
  ): Relation | null {
    const fromTable = workspace.tables.find(t => t.id === fromTableId);
    const toTable = workspace.tables.find(t => t.id === toTableId);
    
    if (!fromTable || !toTable) return null;

    const relation: Relation = {
      id: uuid(),
      from: { tableId: fromTableId, columnId: fromColumnId },
      to: { tableId: toTableId, columnId: toColumnId },
      cardinality: cardinality ?? "one-to-many",
      deleteRule: deleteRule ?? "cascade",
      updateRule: updateRule ?? "cascade"
    };

    workspace.relations.push(relation);
    return relation;
  }

  /**
   * Updates a table name
   */
  static updateTableName(
    workspace: WorkspaceState,
    tableId: string,
    newName: string
  ): boolean {
    const table = workspace.tables.find(t => t.id === tableId);
    if (!table) return false;
    
    table.name = newName;
    return true;
  }

  /**
   * Deletes a table and all related relations
   */
  static deleteTable(workspace: WorkspaceState, tableId: string): boolean {
    const tableIndex = workspace.tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return false;

    // Remove the table
    workspace.tables.splice(tableIndex, 1);

    // Remove all relations involving this table
    workspace.relations = workspace.relations.filter(
      r => r.from.tableId !== tableId && r.to.tableId !== tableId
    );

    return true;
  }

  /**
   * Creates a complex schema with multiple tables and relations
   */
  static createComplexSchema(
    workspace: WorkspaceState,
    schema: {
      tables: Array<{
        name: string;
        columns: Omit<Column, 'id'>[];
        position?: { x: number; y: number };
      }>;
      relations?: Array<{
        fromTable: string;
        fromColumn: string;
        toTable: string;
        toColumn: string;
        cardinality?: RelationCardinality;
        deleteRule?: "cascade" | "restrict" | "set-null";
        updateRule?: "cascade" | "restrict" | "set-null";
      }>;
    }
  ): { tables: DBTable[]; relations: Relation[] } {
    const createdTables: DBTable[] = [];
    const createdRelations: Relation[] = [];

    // Create all tables first
    schema.tables.forEach((tableSpec, index) => {
      const position = tableSpec.position ?? {
        x: 100 + (index % 3) * 300,
        y: 100 + Math.floor(index / 3) * 250
      };
      const table = this.createTable(workspace, tableSpec.name, tableSpec.columns, position);
      createdTables.push(table);
    });

    // Create relations
    if (schema.relations) {
      schema.relations.forEach(relSpec => {
        const fromTable = createdTables.find(t => t.name === relSpec.fromTable);
        const toTable = createdTables.find(t => t.name === relSpec.toTable);

        if (fromTable && toTable) {
          const fromColumn = fromTable.columns.find(c => c.name === relSpec.fromColumn);
          const toColumn = toTable.columns.find(c => c.name === relSpec.toColumn);

          if (fromColumn && toColumn) {
            const relation = this.createRelation(
              workspace,
              fromTable.id,
              fromColumn.id,
              toTable.id,
              toColumn.id,
              relSpec.cardinality,
              relSpec.deleteRule,
              relSpec.updateRule
            );
            if (relation) createdRelations.push(relation);
          }
        }
      });
    }

    return { tables: createdTables, relations: createdRelations };
  }

  /**
   * Gets table by name
   */
  static getTableByName(workspace: WorkspaceState, name: string): DBTable | null {
    return workspace.tables.find(t => t.name.toLowerCase() === name.toLowerCase()) ?? null;
  }

  /**
   * Gets column by name from a table
   */
  static getColumnByName(table: DBTable, columnName: string): Column | null {
    return table.columns.find(c => c.name.toLowerCase() === columnName.toLowerCase()) ?? null;
  }
}
