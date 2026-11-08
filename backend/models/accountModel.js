import pool from "../config/db.js"

export const findAccountByEmail = async (email) => {
    const result = await pool.query(
        `SELECT account_id, full_name, email, password_hash,
            phone, role, is_active, created_at, updated_at
         FROM account
         WHERE LOWER(email) = $1`,
         [email.toLowerCase()]
    );

    return result.rows[0];
};

export const createAccount = async (fullName, email, passwordHash) => {
    const result = await pool.query(
         `INSERT INTO account (full_name, email, password_hash, role)
          VALUES ($1, $2, $3, 'customer')
          RETURNING account_id, full_name, email, phone,
               role, is_active, created_at, updated_at`,
          [fullName, email, passwordHash]
    );

    return result.rows[0];
};

export const findAccountById = async (accountId) => {
  const result = await pool.query(
    `SELECT account_id, full_name, email, phone,
            role, is_active, created_at, updated_at
     FROM account
     WHERE account_id = $1 AND is_active = TRUE`,
    [accountId]
  );

  return result.rows[0];
};

export const updateAccount = async (accountId, fullName, email, phone) => {
    const result = await pool.query(
        `UPDATE account
         SET full_name = $1,
         email = $2,
         phone = $3,
         updated_at = NOW()
        WHERE account_id = $4 AND is_active = TRUE
        RETURNING account_id, full_name, email, phone,
               role, is_active, created_at, updated_at`,
        [fullName, email, phone, accountId]
    );

  return result.rows[0];
};

// Reset tokens are stored as SHA-256 hashes, never as raw email links.
export const storePasswordResetToken = async (accountId, tokenHash) => {
  await pool.query(`INSERT INTO password_reset_token (account_id, token_hash, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '15 minutes')
    ON CONFLICT (account_id) DO UPDATE SET token_hash = EXCLUDED.token_hash,
      expires_at = EXCLUDED.expires_at`, [accountId, tokenHash]);
};

export const consumePasswordResetToken = async (tokenHash, passwordHash) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(`SELECT account_id FROM password_reset_token
      WHERE token_hash = $1 AND expires_at > NOW() FOR UPDATE`, [tokenHash]);
    if (!result.rows.length) { await client.query('ROLLBACK'); return null; }
    const accountId = result.rows[0].account_id;
    const changed = await client.query(`UPDATE account SET password_hash = $1, updated_at = NOW()
      WHERE account_id = $2 AND is_active = TRUE
      RETURNING email, full_name`, [passwordHash, accountId]);
    if (!changed.rows.length) { await client.query('ROLLBACK'); return null; }
    await client.query('DELETE FROM password_reset_token WHERE account_id = $1', [accountId]);
    await client.query('COMMIT');
    return changed.rows[0];
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
};
