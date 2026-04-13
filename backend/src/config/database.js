const { Pool } = require('pg');

const schema = process.env.DB_SCHEMA || 'law';

// Production: DigitalOcean injects DATABASE_URL automatically as ${database.<name>.DATABASE_URL}
// Local: set DATABASE_URL in .env to the full connection string
// Strip sslmode from the URL — we set ssl explicitly via the config object below
const connectionString = (process.env.DATABASE_URL || '').replace(/[?&]sslmode=[^&]*/g, '').replace(/[?&]$/, '');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },  // required for DO managed databases (self-signed CA)
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  options: `-c search_path=${schema}`,
});

// Local DB (commented out — replaced by DATABASE_URL)
// const pool = new Pool({
//   host: 'localhost',
//   port: 5432,
//   database: 'grayphite',
//   user: 'postgres',
//   password: 'zaid',
//   options: `-c search_path=${schema}`,
// });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

const initDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('Connected to PostgreSQL database');
    // Create schema if it doesn't exist (needs superuser or schema owner)
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    console.log(`Using schema: ${schema}`);
    await createTables(client);
    console.log('Database tables initialized');
  } finally {
    client.release();
  }
};

const createTables = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'lawyer' CHECK (role IN ('admin', 'lawyer', 'client')),
      hourly_rate DECIMAL(10,2) DEFAULT 0,
      phone VARCHAR(50),
      avatar_url TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      address TEXT,
      company VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500) NOT NULL,
      description TEXT,
      client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
      assigned_lawyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
      status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'active', 'pending', 'closed', 'archived')),
      priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      case_number VARCHAR(100) UNIQUE,
      practice_area VARCHAR(255),
      court VARCHAR(255),
      filing_date DATE,
      due_date DATE,
      closed_date DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS case_timeline (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      event_type VARCHAR(100) NOT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
      uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
      name VARCHAR(500) NOT NULL,
      original_name VARCHAR(500) NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type VARCHAR(100),
      document_type VARCHAR(100) DEFAULT 'general',
      description TEXT,
      ai_summary TEXT,
      ai_key_clauses JSONB,
      is_processed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      category VARCHAR(100),
      variables JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS time_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      hours DECIMAL(10,2) NOT NULL,
      hourly_rate DECIMAL(10,2) NOT NULL,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      is_billed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
      client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
      invoice_number VARCHAR(100) UNIQUE NOT NULL,
      status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
      subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
      tax_rate DECIMAL(5,2) DEFAULT 0,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) NOT NULL DEFAULT 0,
      due_date DATE,
      paid_date DATE,
      notes TEXT,
      line_items JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
      sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
      recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
      document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      messages JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
};

module.exports = { pool, initDatabase };
