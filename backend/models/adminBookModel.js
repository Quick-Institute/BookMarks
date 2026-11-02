import pool from "../config/db.js";

const bookSelect = `
  SELECT
    b.book_id AS id,
    b.title,
    b.isbn,
    b.cover_url AS image,
    b.price,
    b.description,
    b.stock_quantity,
    b.is_active,
    b.author_id,
    b.genre_id,
    a.name AS author,
    g.name AS genre
  FROM book b
  JOIN author a ON a.author_id = b.author_id
  JOIN genre g ON g.genre_id = b.genre_id
`;

export async function listAdminBooks() {
  const result = await pool.query(
    `${bookSelect} ORDER BY b.book_id DESC`
  );
  return result.rows;
}

export async function findAdminBook(id) {
  const result = await pool.query(
    `${bookSelect} WHERE b.book_id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getBookOptions() {
  const [authors, genres] = await Promise.all([
    pool.query(`
      SELECT author_id AS id, name
      FROM author
      ORDER BY name
    `),
    pool.query(`
      SELECT genre_id AS id, name
      FROM genre
      ORDER BY name
    `),
  ]);

  return {
    authors: authors.rows,
    genres: genres.rows,
  };
}

export async function saveAdminBook(id, data) {
  const result = await pool.query(
    `
    UPDATE book
    SET
      title = $2,
      isbn = $3,
      cover_url = $4,
      price = $5,
      description = $6,
      stock_quantity = $7,
      is_active = $8,
      author_id = $9,
      genre_id = $10
    WHERE book_id = $1
    RETURNING book_id
    `,
    [
      id,
      data.title,
      data.isbn,
      data.image,
      data.price,
      data.description,
      data.stock_quantity,
      data.is_active,
      data.author_id,
      data.genre_id,
    ]
  );

  return result.rowCount > 0;
}

export async function deactivateAdminBook(id) {
  const result = await pool.query(
    `
    UPDATE book
    SET is_active = false
    WHERE book_id = $1
    RETURNING book_id
    `,
    [id]
  );

  return result.rowCount > 0;
}
