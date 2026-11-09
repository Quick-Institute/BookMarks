import pool from "../config/db.js";

export async function listAuthors() {
  const result = await pool.query(`SELECT a.author_id, a.name, a.biography, a.image_url,
    COUNT(b.book_id)::int AS book_count FROM author a LEFT JOIN book b ON b.author_id = a.author_id
    GROUP BY a.author_id, a.name, a.biography, a.image_url ORDER BY a.name`);
  return result.rows;
}
export async function findAuthor(id) {
  const result = await pool.query("SELECT author_id, name, biography, image_url FROM author WHERE author_id=$1", [id]);
  return result.rows[0] || null;
}
export async function createAuthor({name, biography, image_url}) {
  const result = await pool.query("INSERT INTO author (name, biography, image_url) VALUES ($1,$2,$3) RETURNING *", [name, biography, image_url]);
  return result.rows[0];
}
export async function editAuthor(id, {name, biography, image_url}) {
  const result = await pool.query("UPDATE author SET name=$1, biography=$2, image_url=$3 WHERE author_id=$4 RETURNING *", [name, biography, image_url, id]);
  return result.rows[0] || null;
}
export async function deleteAuthor(id) {
  const result = await pool.query(`DELETE FROM author WHERE author_id=$1 AND NOT EXISTS
    (SELECT 1 FROM book WHERE author_id=$1) RETURNING author_id`, [id]);
  return Boolean(result.rowCount);
}
