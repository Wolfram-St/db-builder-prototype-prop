# AI Agent User Guide

## Getting Started

The AI Database Assistant helps you design database schemas using natural language. Simply describe what you need, and the AI will create tables, relationships, and constraints for you.

## Accessing the AI Assistant

1. Log in to DB Builder
2. Open or create a project in the WorkStation
3. Click the **"AI Assistant"** button (blue button with robot icon) in the bottom-right corner
4. The AI chat panel will open on the right side of your screen

## Basic Usage

### Creating Your First Table

**Example Command**: "Create a users table with id, email, and name fields"

The AI will:
- Create a `users` table
- Add an `id` column (UUID, primary key)
- Add an `email` column (TEXT)
- Add a `name` column (TEXT)

### Creating Related Tables

**Example Command**: "Add a posts table related to users with title and content"

The AI will:
- Create a `posts` table
- Add columns for id, title, content
- Add a `user_id` foreign key column
- Create a relationship from posts to users

### Building Complex Schemas

**Example Command**: "Create an e-commerce database with products, categories, orders, and customers"

The AI will:
- Create all four tables with appropriate columns
- Set up relationships (products-categories, orders-customers, order items-products)
- Configure foreign keys and constraints

## Example Commands

### Simple Tables

```
"Create a products table with name, price, and description"
"Add a categories table with name and slug"
"Make a tags table"
```

### Tables with Specific Data Types

```
"Create a users table with:
- id (UUID, primary key)
- email (unique text)
- created_at (timestamp)
- is_active (boolean)"
```

### Relationships

```
"Create a one-to-many relationship from users to posts"
"Link products to categories with a many-to-many relationship"
"Set up orders to reference customers with cascade delete"
```

### Complete Schemas

```
"Build a blog database with users, posts, comments, and tags"

"Create a social media schema with:
- users (id, username, email, bio)
- posts (id, content, created_at, user_id)
- likes (id, user_id, post_id)
- follows (follower_id, following_id)"
```

## Understanding AI Responses

### Success Messages

When the AI successfully creates schema elements:

```
✓ "Created users table with 3 columns and set up primary key"
✓ "Added posts table and linked it to users with one-to-many relationship"
✓ "Built complete e-commerce schema with 5 tables and 6 relationships"
```

### The Workspace Updates Automatically

After each successful command:
- New tables appear on the canvas
- Relationships are drawn automatically
- You can immediately start using the schema

## Advanced Features

### Cardinality Control

Specify relationship types explicitly:

```
"Create a one-to-one relationship from users to profiles"
"Set up a many-to-many link between students and courses"
```

### Cascade Rules

Control what happens when parent records are deleted:

```
"Link orders to users with cascade delete"
"Connect posts to users with restrict on delete"
```

### Unique Constraints

```
"Make email unique in the users table"
"Add username as a unique field"
```

### Nullable Fields

```
"Add optional bio field to users"
"Make phone number nullable"
```

## Data Types

The AI understands these data types:

| Type | Usage | Example Command |
|------|-------|-----------------|
| UUID | IDs, primary keys | "id as UUID primary key" |
| TEXT | Strings, emails, names | "email as text" |
| INTEGER | Numbers, counts | "age as integer" |
| BOOLEAN | True/false flags | "is_active as boolean" |
| TIMESTAMP | Dates and times | "created_at as timestamp" |
| JSON | Structured data | "metadata as json" |

## Tips for Better Results

### 1. Be Specific

❌ Poor: "Make a table"
✅ Good: "Create a products table with name, price, and stock"

### 2. Use Clear Names

❌ Poor: "Create table1 with some fields"
✅ Good: "Create a customers table with email and name"

### 3. Mention Relationships Explicitly

❌ Poor: "Add orders table"
✅ Good: "Add orders table linked to customers"

### 4. Build Incrementally

Start simple, then add complexity:
```
1. "Create a users table"
2. "Add a posts table related to users"
3. "Now add comments linked to both users and posts"
```

### 5. Review Before SQL Generation

After the AI creates your schema:
- Inspect the tables visually
- Check relationships are correct
- Adjust manually if needed
- Then generate SQL

## Common Use Cases

### Blog/Content Management

```
"Create a blog database with:
- authors table (id, name, email)
- posts table (id, title, content, published_at, author_id)
- categories table (id, name, slug)
- link posts to categories"
```

### E-commerce

```
"Build an online store database with:
- customers (id, email, name, address)
- products (id, name, price, stock)
- orders (id, customer_id, total, status)
- order_items (id, order_id, product_id, quantity)"
```

### Social Network

```
"Design a social network schema with:
- users (id, username, email, avatar)
- posts (id, user_id, content, likes_count)
- comments (id, post_id, user_id, text)
- friendships (user_id, friend_id)"
```

### Project Management

```
"Create a project management database:
- teams (id, name)
- users (id, name, email, team_id)
- projects (id, name, team_id)
- tasks (id, title, status, project_id, assigned_to)"
```

## Troubleshooting

### "AI Agent service is not connected"

**Problem**: Red dot indicator, cannot send messages

**Solution**:
1. Ensure AI Agent Service is running on port 3001
2. Check your `.env` file has correct `VITE_AGENT_API_URL`
3. Verify Ollama is running on port 11434

### AI Creates Wrong Tables

**Problem**: AI misunderstands your command

**Solution**:
1. Rephrase your request more clearly
2. Break complex requests into smaller steps
3. Manually edit the tables after creation

### Slow Responses

**Problem**: AI takes >5 seconds to respond

**Solution**:
1. First request is always slower (model loading)
2. Use a smaller model like `llama3.2:3b`
3. Keep Ollama service running (don't restart)

### Relationships Not Created

**Problem**: Tables created but no relationships

**Solution**:
1. Explicitly mention relationships in your command
2. Use clear language: "linked to", "related to", "references"
3. Create relationships separately if needed

## Keyboard Shortcuts

- **ESC**: Close AI Assistant panel
- **Enter**: Send message
- **Shift+Enter**: New line in message (without sending)

## Best Practices

### 1. Start Fresh or Build On

You can:
- Use AI on a blank workspace (start from scratch)
- Use AI with existing tables (add to current schema)

### 2. Verify Generated Schema

Always review:
- Column data types are appropriate
- Foreign keys point to correct tables
- Relationship cardinality is correct

### 3. Combine AI with Manual Editing

- Use AI for bulk schema creation
- Manually fine-tune specific constraints
- Add indexes and advanced features manually

### 4. Conversation Context

The AI remembers your conversation:
```
You: "Create a users table"
AI: ✓ "Created users table"
You: "Now add posts for those users"
AI: ✓ "Added posts table linked to users"
```

### 5. Save Your Work

After using the AI:
- Save your project (cloud or local)
- Generate SQL to review
- Deploy to your database when ready

## Privacy & Security

### What the AI Knows

- Your current workspace schema
- Your conversation history in this session
- Nothing else (no access to your database, other projects, or personal data)

### What Happens to Your Data

- Commands are processed locally by Ollama (if self-hosted)
- No data sent to external services
- Workspace state stays in your browser
- Conversation history is not persisted

## Getting Help

If you encounter issues:

1. Check the connection status (green/red dot)
2. Try rephrasing your command
3. Review the AI Agent Architecture documentation
4. Check service logs: `docker-compose logs ai-agent`

## Examples Library

### Minimal User System

```
"Create a simple user system with users, sessions, and roles"
```

Result:
- users (id, email, password_hash, role_id)
- sessions (id, user_id, token, expires_at)
- roles (id, name, permissions)

### Advanced Blog

```
"Build a blog with users, posts, comments, tags, and likes. 
Posts can have multiple tags. Users can like posts and comments."
```

Result:
- users, posts, comments, tags
- post_tags (many-to-many)
- likes (polymorphic to posts/comments)

### Multi-tenant SaaS

```
"Design a multi-tenant SaaS database with:
- organizations (id, name, plan)
- users (id, org_id, email, role)
- projects (id, org_id, name)
- tasks (id, project_id, title, status)"
```

Result:
- Organizations as top-level tenant
- Users scoped to organizations
- Projects and tasks with proper hierarchy

---

**Pro Tip**: The AI learns from your conversation. If the first result isn't perfect, tell it what to change:

```
You: "Create a users table"
AI: Creates table
You: "Make the email field unique"
AI: Updates the column constraint
You: "Add a created_at timestamp"
AI: Adds the new column
```

Happy database designing! 🤖
