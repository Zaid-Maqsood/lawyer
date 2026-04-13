require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');

// Dotenv must be loaded before requiring database.js so env vars are available
const { pool, initDatabase } = require('../src/config/database');

async function seed() {
  try {
    console.log('Initializing schema and tables...');
    // Creates schema "law" + all tables (idempotent)
    await initDatabase();

    const client = await pool.connect();
    try {
      console.log('Seeding data...');

      const adminPassword = await bcrypt.hash('admin123', 12);
      const lawyerPassword = await bcrypt.hash('lawyer123', 12);
      const clientPassword = await bcrypt.hash('client123', 12);

      // Users
      await client.query(`
        INSERT INTO users (name, email, password, role, hourly_rate, phone) VALUES
        ('Sarah Mitchell', 'admin@lexai.com', $1, 'admin', 350, '+1-555-0101'),
        ('James Harrison', 'james@lexai.com', $2, 'lawyer', 280, '+1-555-0102'),
        ('Elena Rodriguez', 'elena@lexai.com', $2, 'lawyer', 300, '+1-555-0103'),
        ('Michael Chen', 'client1@lexai.com', $3, 'client', 0, '+1-555-0201')
        ON CONFLICT (email) DO NOTHING
      `, [adminPassword, lawyerPassword, clientPassword]);

      // Get user IDs
      const users = await client.query('SELECT id, email, role FROM users');
      const admin = users.rows.find(u => u.email === 'admin@lexai.com');
      const lawyer1 = users.rows.find(u => u.email === 'james@lexai.com');
      const clientUser = users.rows.find(u => u.email === 'client1@lexai.com');

      // Clients
      await client.query(`
        INSERT INTO clients (user_id, name, email, phone, company, address) VALUES
        ($1, 'Michael Chen', 'michael.chen@techcorp.com', '+1-555-0201', 'TechCorp Industries', '123 Business Ave, New York, NY 10001'),
        (NULL, 'Sarah Johnson', 'sarah.j@email.com', '+1-555-0202', NULL, '456 Oak Street, Los Angeles, CA 90001'),
        (NULL, 'Robert Williams', 'rwilliams@bigfirm.com', '+1-555-0203', 'Williams & Associates', '789 Corporate Blvd, Chicago, IL 60601'),
        (NULL, 'Amanda Foster', 'amanda.f@startup.io', '+1-555-0204', 'FosterTech Startup', '321 Innovation Dr, Austin, TX 78701')
        ON CONFLICT (email) DO NOTHING
      `, [clientUser?.id]);

      const clients = await client.query('SELECT id, name, email FROM clients ORDER BY created_at ASC');
      const client1 = clients.rows.find(c => c.email === 'michael.chen@techcorp.com');
      const client2 = clients.rows.find(c => c.email === 'sarah.j@email.com');
      const client3 = clients.rows.find(c => c.email === 'rwilliams@bigfirm.com');
      const client4 = clients.rows.find(c => c.email === 'amanda.f@startup.io');

      // Cases — assigned to James (lawyer1), created by admin
      const casesResult = await client.query(`
        INSERT INTO cases (title, description, client_id, assigned_lawyer_id, status, priority, case_number, practice_area, court, filing_date, due_date) VALUES
        ('TechCorp Patent Infringement', 'Defense against patent infringement claims related to AI software algorithms. The plaintiff alleges unauthorized use of three patents in our client''s core product.', $1, $2, 'active', 'high', 'CASE-2024-10001', 'Intellectual Property', 'Federal District Court SDNY', '2024-01-15', '2025-06-30'),
        ('Johnson Estate Settlement', 'Probate and estate administration following the passing of Thomas Johnson. Complex multi-state assets including real estate and investment portfolios.', $3, $2, 'pending', 'medium', 'CASE-2024-10002', 'Estate Planning', NULL, '2024-02-20', '2025-03-31'),
        ('Williams Corp Merger', 'Corporate merger between Williams & Associates and Pacific Holdings. Regulatory compliance and due diligence for a $50M transaction.', $4, $2, 'active', 'urgent', 'CASE-2024-10003', 'Corporate Law', NULL, '2024-03-10', '2025-02-28'),
        ('Foster Employment Dispute', 'Wrongful termination claim by former executive. Settlement negotiations with opposing counsel ongoing.', $5, $2, 'open', 'low', 'CASE-2024-10004', 'Employment Law', 'State Superior Court', '2024-04-05', '2025-05-15')
        ON CONFLICT (case_number) DO UPDATE SET assigned_lawyer_id = EXCLUDED.assigned_lawyer_id
        RETURNING id
      `, [client1?.id, lawyer1?.id, client2?.id, client3?.id, client4?.id]);

      // Timeline events — delete first to avoid duplicates on re-seed
      for (const caseRow of casesResult.rows) {
        await client.query(`DELETE FROM case_timeline WHERE case_id = $1`, [caseRow.id]);
        await client.query(`
          INSERT INTO case_timeline (case_id, user_id, event_type, title, description) VALUES
          ($1, $2, 'created', 'Case Opened', 'Case file created and assigned to legal team'),
          ($1, $2, 'note', 'Initial Review Complete', 'Completed initial review of all case materials and documents')
        `, [caseRow.id, admin?.id]);
      }

      // Templates
      await client.query(`
        INSERT INTO templates (created_by, name, description, content, category, variables) VALUES
        ($1, 'Client Engagement Letter', 'Standard client engagement and retainer agreement', 'ENGAGEMENT LETTER\n\nDate: {{date}}\n\nDear {{client_name}},\n\nWe are pleased to confirm our engagement to represent you in connection with {{matter_description}}.\n\nOur firm will provide legal services at a rate of {{hourly_rate}} per hour. A retainer of {{retainer_amount}} is required to commence work.\n\nPlease sign below to confirm your agreement.\n\nSincerely,\n{{lawyer_name}}\n{{firm_name}}', 'agreements', '[{"name":"date","label":"Date"},{"name":"client_name","label":"Client Name"},{"name":"matter_description","label":"Matter Description"},{"name":"hourly_rate","label":"Hourly Rate"},{"name":"retainer_amount","label":"Retainer Amount"},{"name":"lawyer_name","label":"Lawyer Name"},{"name":"firm_name","label":"Firm Name"}]'),
        ($1, 'Non-Disclosure Agreement', 'Standard mutual NDA template', 'NON-DISCLOSURE AGREEMENT\n\nThis Agreement is entered into as of {{date}} between {{party_a}} (''Disclosing Party'') and {{party_b}} (''Receiving Party'').\n\n1. CONFIDENTIAL INFORMATION\nThe Disclosing Party may disclose certain confidential information to the Receiving Party for the purpose of {{purpose}}.\n\n2. OBLIGATIONS\nThe Receiving Party agrees to maintain strict confidentiality and not disclose any Confidential Information to third parties.\n\n3. TERM\nThis Agreement shall remain in effect for {{term}} from the date first written above.\n\nIN WITNESS WHEREOF, the parties have executed this Agreement.\n\n{{party_a}}\nBy: _______________\n\n{{party_b}}\nBy: _______________', 'contracts', '[{"name":"date","label":"Date"},{"name":"party_a","label":"Party A Name"},{"name":"party_b","label":"Party B Name"},{"name":"purpose","label":"Purpose of Disclosure"},{"name":"term","label":"Term Duration"}]'),
        ($1, 'Demand Letter', 'Standard demand letter template', 'DEMAND LETTER\n\nDate: {{date}}\nVia {{delivery_method}}\n\n{{recipient_name}}\n{{recipient_address}}\n\nRe: Demand for {{demand_subject}}\n\nDear {{recipient_name}},\n\nThis firm represents {{client_name}} in connection with the above-referenced matter. We write to formally demand {{demand_details}}.\n\nFAILURE TO RESPOND\nIf we do not receive a satisfactory response by {{deadline}}, we will have no alternative but to pursue all available legal remedies.\n\nVery truly yours,\n{{lawyer_name}}', 'correspondence', '[{"name":"date","label":"Date"},{"name":"delivery_method","label":"Delivery Method"},{"name":"recipient_name","label":"Recipient Name"},{"name":"recipient_address","label":"Recipient Address"},{"name":"demand_subject","label":"Subject"},{"name":"client_name","label":"Client Name"},{"name":"demand_details","label":"Demand Details"},{"name":"deadline","label":"Response Deadline"},{"name":"lawyer_name","label":"Lawyer Name"}]')
        ON CONFLICT DO NOTHING
      `, [admin?.id]);

      // Time Logs — delete first to avoid duplicates on re-seed
      const caseIds = casesResult.rows.map(r => r.id);
      if (caseIds.length > 0) {
        await client.query(`DELETE FROM time_logs WHERE case_id = ANY($1)`, [caseIds]);
        await client.query(`
          INSERT INTO time_logs (case_id, user_id, description, hours, hourly_rate, date, is_billed) VALUES
          ($1, $2, 'Initial case review and document analysis', 3.5, 280, NOW() - INTERVAL '5 days', true),
          ($1, $2, 'Client consultation and strategy planning', 2.0, 280, NOW() - INTERVAL '3 days', true),
          ($1, $2, 'Research on patent precedents', 4.0, 280, NOW() - INTERVAL '1 day', false),
          ($3, $2, 'Estate document review', 2.5, 280, NOW() - INTERVAL '4 days', false),
          ($3, $2, 'Beneficiary interviews', 1.5, 280, NOW() - INTERVAL '2 days', false)
        `, [caseIds[0], lawyer1?.id, caseIds[1]]);

        // Invoices
        await client.query(`
          INSERT INTO invoices (case_id, client_id, invoice_number, status, subtotal, tax_rate, tax_amount, total, due_date, line_items) VALUES
          ($1, $2, 'INV-2024-0001', 'paid', 1925.00, 0, 0, 1925.00, NOW() + INTERVAL '30 days', '[{"description":"Initial case review (3.5h @ $350/hr)","amount":1225},{"description":"Client consultation (2h @ $350/hr)","amount":700}]'),
          ($3, $4, 'INV-2024-0002', 'sent', 875.00, 0, 0, 875.00, NOW() + INTERVAL '14 days', '[{"description":"Estate document review (2.5h @ $350/hr)","amount":875}]')
          ON CONFLICT (invoice_number) DO NOTHING
        `, [caseIds[0], client1?.id, caseIds[1], client2?.id]);
      }

      console.log('✅ Database seeded successfully!');
      console.log('\nDemo credentials:');
      console.log('  Admin:  admin@lexai.com  / admin123');
      console.log('  Lawyer: james@lexai.com  / lawyer123');
      console.log('  Client: client1@lexai.com / client123');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
