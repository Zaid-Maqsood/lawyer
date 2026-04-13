const { pool } = require('../config/database');

const getDashboardStats = async (req, res, next) => {
  try {
    const isLawyer = req.user.role === 'lawyer';
    const uid = req.user.id;

    if (isLawyer) {
      const [cases, clients, timeLogs, recentCases, casesByStatus, hoursByMonth] = await Promise.all([
        pool.query(`
          SELECT
            COUNT(*) AS total,
            COUNT(CASE WHEN status = 'active' THEN 1 END) AS active,
            COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed,
            COUNT(CASE WHEN status = 'open' THEN 1 END) AS open,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending
          FROM cases WHERE assigned_lawyer_id = $1
        `, [uid]),

        pool.query(`
          SELECT COUNT(DISTINCT client_id) AS total
          FROM cases WHERE assigned_lawyer_id = $1 AND client_id IS NOT NULL
        `, [uid]),

        pool.query(`
          SELECT
            COALESCE(SUM(hours), 0) AS total_hours,
            COALESCE(SUM(hours * hourly_rate), 0) AS total_billable,
            COALESCE(SUM(CASE WHEN is_billed = false THEN hours * hourly_rate END), 0) AS unbilled,
            COALESCE(SUM(CASE WHEN date >= DATE_TRUNC('month', NOW()) THEN hours END), 0) AS hours_this_month
          FROM time_logs WHERE user_id = $1
        `, [uid]),

        pool.query(`
          SELECT c.id, c.title, c.status, c.priority, c.created_at, cl.name AS client_name
          FROM cases c LEFT JOIN clients cl ON c.client_id = cl.id
          WHERE c.assigned_lawyer_id = $1
          ORDER BY c.created_at DESC LIMIT 5
        `, [uid]),

        pool.query(`
          SELECT status, COUNT(*) AS count FROM cases
          WHERE assigned_lawyer_id = $1 GROUP BY status
        `, [uid]),

        pool.query(`
          SELECT
            TO_CHAR(DATE_TRUNC('month', date), 'Mon YY') AS month,
            DATE_TRUNC('month', date) AS month_date,
            COALESCE(SUM(hours), 0) AS hours
          FROM time_logs
          WHERE user_id = $1 AND date >= NOW() - INTERVAL '6 months'
          GROUP BY month, month_date ORDER BY month_date ASC
        `, [uid]),
      ]);

      return res.json({
        role: 'lawyer',
        cases: cases.rows[0],
        clients: clients.rows[0],
        timeLogs: timeLogs.rows[0],
        recentCases: recentCases.rows,
        casesByStatus: casesByStatus.rows,
        hoursByMonth: hoursByMonth.rows,
      });
    }

    // Admin dashboard
    const [cases, clients, billing, docs, recentCases, casesByStatus, revenueByMonth] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) AS active,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed,
          COUNT(CASE WHEN status = 'open' THEN 1 END) AS open,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending
        FROM cases
      `),
      pool.query('SELECT COUNT(*) AS total FROM clients'),
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN status = 'paid' THEN total END), 0) AS total_paid,
          COALESCE(SUM(CASE WHEN status IN ('sent','overdue') THEN total END), 0) AS outstanding,
          COUNT(CASE WHEN status = 'overdue' THEN 1 END) AS overdue_count,
          (SELECT COALESCE(SUM(hours * hourly_rate), 0) FROM time_logs WHERE is_billed = false) AS unbilled_amount
        FROM invoices
      `),
      pool.query('SELECT COUNT(*) AS total FROM documents'),
      pool.query(`
        SELECT c.id, c.title, c.status, c.priority, c.created_at, cl.name AS client_name
        FROM cases c LEFT JOIN clients cl ON c.client_id = cl.id
        ORDER BY c.created_at DESC LIMIT 5
      `),
      pool.query('SELECT status, COUNT(*) AS count FROM cases GROUP BY status'),
      pool.query(`
        SELECT
          TO_CHAR(created_at, 'Mon YY') AS month,
          DATE_TRUNC('month', created_at) AS month_date,
          COALESCE(SUM(total), 0) AS revenue
        FROM invoices
        WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month, month_date ORDER BY month_date ASC
      `)
    ]);

    res.json({
      role: 'admin',
      cases: cases.rows[0],
      clients: clients.rows[0],
      billing: billing.rows[0],
      documents: docs.rows[0],
      recentCases: recentCases.rows,
      casesByStatus: casesByStatus.rows,
      revenueByMonth: revenueByMonth.rows,
    });
  } catch (err) {
    next(err);
  }
};

const getCaseAnalytics = async (req, res, next) => {
  try {
    const [byStatus, byPriority, byPracticeArea, timeline] = await Promise.all([
      pool.query('SELECT status, COUNT(*) AS count FROM cases GROUP BY status'),
      pool.query('SELECT priority, COUNT(*) AS count FROM cases GROUP BY priority'),
      pool.query('SELECT practice_area, COUNT(*) AS count FROM cases WHERE practice_area IS NOT NULL GROUP BY practice_area ORDER BY count DESC LIMIT 10'),
      pool.query(`
        SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS new_cases
        FROM cases
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY month ORDER BY month ASC
      `)
    ]);

    res.json({ byStatus: byStatus.rows, byPriority: byPriority.rows, byPracticeArea: byPracticeArea.rows, timeline: timeline.rows });
  } catch (err) {
    next(err);
  }
};

const getBillingAnalytics = async (req, res, next) => {
  try {
    const [invoiceStats, lawyerRevenue, topClients] = await Promise.all([
      pool.query(`
        SELECT
          status,
          COUNT(*) AS count,
          COALESCE(SUM(total), 0) AS total
        FROM invoices GROUP BY status
      `),
      pool.query(`
        SELECT u.name AS lawyer_name, COALESCE(SUM(tl.hours * tl.hourly_rate), 0) AS revenue, COALESCE(SUM(tl.hours), 0) AS total_hours
        FROM users u
        LEFT JOIN time_logs tl ON tl.user_id = u.id
        WHERE u.role IN ('lawyer', 'admin')
        GROUP BY u.id, u.name
        ORDER BY revenue DESC LIMIT 10
      `),
      pool.query(`
        SELECT cl.name AS client_name, COALESCE(SUM(i.total), 0) AS total_billed
        FROM clients cl
        LEFT JOIN invoices i ON i.client_id = cl.id AND i.status = 'paid'
        GROUP BY cl.id, cl.name
        ORDER BY total_billed DESC LIMIT 10
      `)
    ]);

    res.json({ invoiceStats: invoiceStats.rows, lawyerRevenue: lawyerRevenue.rows, topClients: topClients.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardStats, getCaseAnalytics, getBillingAnalytics };
