import {
  listAdminBooks,
  findAdminBook,
  getBookOptions,
  saveAdminBook,
  deactivateAdminBook,
} from "../models/adminBookModel.js";

const validId = (value) =>
  Number.isSafeInteger(Number(value)) &&
  Number(value) > 0;

function handleError(res, error) {
  console.error("Admin book error:", error);

  if (error.code === "23505") {
    return res.status(409).json({
      message: "A book with this ISBN already exists.",
    });
  }

  if (error.code === "23503") {
    return res.status(400).json({
      message: "The selected author or genre is invalid.",
    });
  }

  return res.status(500).json({
    message: "Unable to complete book operation.",
  });
}

export async function index(req, res) {
  try {
    const books = await listAdminBooks();
    return res.json({ books });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function options(req, res) {
  try {
    const data = await getBookOptions();
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function show(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid book ID.",
    });
  }

  try {
    const book = await findAdminBook(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found.",
      });
    }

    return res.json({ book });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function update(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid book ID.",
    });
  }

  const data = req.body || {};

  const title =
    typeof data.title === "string"
      ? data.title.trim()
      : "";

  const price = Number(data.price);
  const stock = Number(data.stock_quantity);

  if (
    !title ||
    data.price === "" ||
    data.price == null ||
    !Number.isFinite(price) ||
    price < 0 ||
    data.stock_quantity === "" ||
    data.stock_quantity == null ||
    !Number.isSafeInteger(stock) ||
    stock < 0 ||
    !validId(data.author_id) ||
    !validId(data.genre_id) ||
    typeof data.is_active !== "boolean" ||
    (data.isbn != null && typeof data.isbn !== "string") ||
    (data.image != null && typeof data.image !== "string") ||
    (data.description != null &&
      typeof data.description !== "string")
  ) {
    return res.status(400).json({
      message:
        "Please check the title, price, stock, author, genre and status.",
    });
  }

  try {
    const saved = await saveAdminBook(req.params.id, {
      title,
      isbn: data.isbn?.trim() || null,
      image: data.image?.trim() || null,
      price,
      description: data.description || "",
      stock_quantity: stock,
      is_active: data.is_active,
      author_id: Number(data.author_id),
      genre_id: Number(data.genre_id),
    });

    if (!saved) {
      return res.status(404).json({
        message: "Book not found.",
      });
    }

    const book = await findAdminBook(req.params.id);

    return res.json({
      message: "Book updated successfully.",
      book,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function remove(req, res) {
  if (!validId(req.params.id)) {
    return res.status(400).json({
      message: "Invalid book ID.",
    });
  }

  try {
    const removed = await deactivateAdminBook(req.params.id);

    if (!removed) {
      return res.status(404).json({
        message: "Book not found.",
      });
    }

    return res.json({
      message: "Book marked inactive.",
    });
  } catch (error) {
    return handleError(res, error);
  }
}
