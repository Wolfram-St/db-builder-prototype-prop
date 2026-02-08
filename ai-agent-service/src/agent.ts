// AI Agent Core - Uses Ollama LLM to understand and execute DB builder commands

import { Ollama } from 'ollama';
import type { AgentMessage, WorkspaceState, AgentAction, AgentResponse } from '../types/agent.js';
import { DBBuilderTools } from '../tools/dbBuilderTools.js';

export class AIAgent {
  private ollama: Ollama;
  private modelName: string;

  constructor(ollamaHost: string = 'http://localhost:11434', modelName: string = 'llama3.2') {
    this.ollama = new Ollama({ host: ollamaHost });
    this.modelName = modelName;
  }

  /**
   * System prompt that defines the agent's role and capabilities
   */
  private getSystemPrompt(): string {
    return `You are an expert database architect AI agent integrated with a visual database builder tool.

Your role is to help users design and create database schemas by:
1. Understanding natural language commands about database design
2. Creating tables with appropriate columns and data types
3. Defining relationships between tables (one-to-one, one-to-many, many-to-many)
4. Setting up indexes, constraints, and foreign keys
5. Implementing scalability considerations

IMPORTANT RULES:
- Always respond with a JSON object containing your actions
- Use the provided tools to manipulate the database workspace
- When creating tables, ensure proper primary keys (usually 'id' column)
- When creating foreign keys, name them as '{referenced_table}_id'
- For relationships, specify cardinality, delete rules, and update rules
- Common data types: UUID, TEXT, INTEGER, BOOLEAN, TIMESTAMP, JSON
- Always validate that referenced tables exist before creating relations

Response format:
{
  "message": "Brief description of what you're doing",
  "actions": [
    {
      "type": "create_table" | "add_column" | "create_relation" | "update_table" | "delete_table" | "complex_schema",
      "parameters": { /* action-specific parameters */ }
    }
  ]
}

Available action types and their parameters:

1. create_table:
   {
     "type": "create_table",
     "parameters": {
       "name": "table_name",
       "columns": [
         { "name": "id", "type": "UUID", "isPrimary": true },
         { "name": "column_name", "type": "TEXT", "isNullable": false }
       ]
     }
   }

2. create_relation:
   {
     "type": "create_relation",
     "parameters": {
       "fromTable": "table1",
       "fromColumn": "table2_id",
       "toTable": "table2",
       "toColumn": "id",
       "cardinality": "one-to-many",
       "deleteRule": "cascade"
     }
   }

3. complex_schema (for creating multiple tables and relations at once):
   {
     "type": "complex_schema",
     "parameters": {
       "tables": [
         {
           "name": "users",
           "columns": [...]
         }
       ],
       "relations": [
         {
           "fromTable": "posts",
           "fromColumn": "user_id",
           "toTable": "users",
           "toColumn": "id"
         }
       ]
     }
   }`;
  }

  /**
   * Process a user command and execute actions on the workspace
   */
  async processCommand(
    userMessage: string,
    workspace: WorkspaceState,
    conversationHistory: AgentMessage[] = []
  ): Promise<AgentResponse> {
    try {
      // Build the conversation context
      const messages: AgentMessage[] = [
        { role: 'system', content: this.getSystemPrompt() },
        ...conversationHistory,
        { 
          role: 'user', 
          content: `Current workspace state:\n${JSON.stringify({
            tables: workspace.tables.map(t => ({
              name: t.name,
              columns: t.columns.map(c => ({
                name: c.name,
                type: c.type,
                isPrimary: c.isPrimary,
                isForeign: c.isForeign
              }))
            })),
            relations: workspace.relations.length
          }, null, 2)}\n\nUser command: ${userMessage}\n\nProvide your response as a JSON object.`
        }
      ];

      // Call Ollama
      const response = await this.ollama.chat({
        model: this.modelName,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        format: 'json',
        stream: false
      });

      const content = response.message.content;
      
      // Parse the JSON response
      let agentResponse: { message: string; actions: AgentAction[] };
      try {
        agentResponse = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse agent response:', content);
        return {
          success: false,
          message: 'Failed to parse agent response. Please try again.',
          workspace
        };
      }

      // Execute the actions
      const executedActions = this.executeActions(agentResponse.actions, workspace);

      return {
        success: true,
        message: agentResponse.message,
        actions: executedActions,
        workspace
      };

    } catch (error: any) {
      console.error('Agent error:', error);
      return {
        success: false,
        message: `Error processing command: ${error.message}`,
        workspace
      };
    }
  }

  /**
   * Execute a list of actions on the workspace
   */
  private executeActions(actions: AgentAction[], workspace: WorkspaceState): AgentAction[] {
    const executedActions: AgentAction[] = [];

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'create_table':
            this.executeCreateTable(action, workspace);
            executedActions.push(action);
            break;

          case 'add_column':
            this.executeAddColumn(action, workspace);
            executedActions.push(action);
            break;

          case 'create_relation':
            this.executeCreateRelation(action, workspace);
            executedActions.push(action);
            break;

          case 'update_table':
            this.executeUpdateTable(action, workspace);
            executedActions.push(action);
            break;

          case 'delete_table':
            this.executeDeleteTable(action, workspace);
            executedActions.push(action);
            break;

          case 'complex_schema':
            this.executeComplexSchema(action, workspace);
            executedActions.push(action);
            break;

          default:
            console.warn('Unknown action type:', action.type);
        }
      } catch (error: any) {
        console.error(`Error executing action ${action.type}:`, error);
      }
    }

    return executedActions;
  }

  private executeCreateTable(action: AgentAction, workspace: WorkspaceState): void {
    const { name, columns, position } = action.parameters;
    DBBuilderTools.createTable(workspace, name, columns, position);
  }

  private executeAddColumn(action: AgentAction, workspace: WorkspaceState): void {
    const { tableId, column } = action.parameters;
    DBBuilderTools.addColumn(workspace, tableId, column);
  }

  private executeCreateRelation(action: AgentAction, workspace: WorkspaceState): void {
    const { fromTable, fromColumn, toTable, toColumn, cardinality, deleteRule, updateRule } = action.parameters;
    
    const fromTableObj = DBBuilderTools.getTableByName(workspace, fromTable);
    const toTableObj = DBBuilderTools.getTableByName(workspace, toTable);

    if (fromTableObj && toTableObj) {
      const fromCol = DBBuilderTools.getColumnByName(fromTableObj, fromColumn);
      const toCol = DBBuilderTools.getColumnByName(toTableObj, toColumn);

      if (fromCol && toCol) {
        DBBuilderTools.createRelation(
          workspace,
          fromTableObj.id,
          fromCol.id,
          toTableObj.id,
          toCol.id,
          cardinality,
          deleteRule,
          updateRule
        );
      }
    }
  }

  private executeUpdateTable(action: AgentAction, workspace: WorkspaceState): void {
    const { tableId, newName } = action.parameters;
    DBBuilderTools.updateTableName(workspace, tableId, newName);
  }

  private executeDeleteTable(action: AgentAction, workspace: WorkspaceState): void {
    const { tableId } = action.parameters;
    DBBuilderTools.deleteTable(workspace, tableId);
  }

  private executeComplexSchema(action: AgentAction, workspace: WorkspaceState): void {
    const { tables, relations } = action.parameters;
    DBBuilderTools.createComplexSchema(workspace, { tables, relations });
  }

  /**
   * Check if Ollama is running and the model is available
   */
  async healthCheck(): Promise<{ healthy: boolean; model: string; error?: string }> {
    try {
      const models = await this.ollama.list();
      const modelExists = models.models.some(m => m.name.includes(this.modelName));
      
      if (!modelExists) {
        return {
          healthy: false,
          model: this.modelName,
          error: `Model ${this.modelName} not found. Please pull it first: ollama pull ${this.modelName}`
        };
      }

      return {
        healthy: true,
        model: this.modelName
      };
    } catch (error: any) {
      return {
        healthy: false,
        model: this.modelName,
        error: `Ollama not reachable: ${error.message}`
      };
    }
  }
}
