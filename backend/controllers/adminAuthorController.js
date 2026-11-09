import { listAuthors, findAuthor, createAuthor, editAuthor, deleteAuthor } from "../models/adminAuthorModel.js";
const validId = (id) => /^[1-9]\d*$/.test(String(id));
const errorResponse = (res, err) => {
  console.error("Admin author error:", err);
  if (err.code === "23505") return res.status(409).json({message:"An author with this name already exists."});
  if (err.code === "23503") return res.status(409).json({message:"This author is linked to books and cannot be deleted."});
  return res.status(500).json({message:"Unable to complete author operation."});
};
const clean = (body) => ({name:String(body.name || "").trim(), biography:String(body.biography || "").trim(), image_url:String(body.image_url || "").trim() || null});
const validate = (data) => data.name.length > 0 && data.name.length <= 200 && data.biography.length <= 20000 && (!data.image_url || data.image_url.length <= 2048);
export async function index(req,res) {try {res.json({authors:await listAuthors()});} catch(err){errorResponse(res,err);}}
export async function show(req,res) {if(!validId(req.params.id)) return res.status(400).json({message:"Invalid author ID."}); try {const author=await findAuthor(req.params.id); return author ? res.json({author}) : res.status(404).json({message:"Author not found."});}catch(err){errorResponse(res,err);}}
export async function create(req,res) {const data=clean(req.body); if(!validate(data)) return res.status(400).json({message:"Enter a valid author name (up to 200 characters), biography and photo URL."}); try {res.status(201).json({author:await createAuthor(data)});}catch(err){errorResponse(res,err);}}
export async function update(req,res) {if(!validId(req.params.id)) return res.status(400).json({message:"Invalid author ID."}); const data=clean(req.body); if(!validate(data)) return res.status(400).json({message:"Enter a valid author name, biography and photo URL."}); try {const author=await editAuthor(req.params.id,data); return author ? res.json({author}) : res.status(404).json({message:"Author not found."});}catch(err){errorResponse(res,err);}}
export async function remove(req,res) {if(!validId(req.params.id)) return res.status(400).json({message:"Invalid author ID."}); try {if(await deleteAuthor(req.params.id)) return res.json({message:"Author deleted."}); const author=await findAuthor(req.params.id); return res.status(author?409:404).json({message:author?"Cannot delete an author who has books. Reassign their books first.":"Author not found."});}catch(err){errorResponse(res,err);}}
export async function uploadPhoto(req,res) {if(!validId(req.params.id)) return res.status(400).json({message:"Invalid author ID."}); if(!req.file) return res.status(400).json({message:"Choose a JPG, PNG or WebP image."}); try {const author=await findAuthor(req.params.id); if(!author) return res.status(404).json({message:"Author not found."}); const image_url=`/uploads/author-photos/${req.file.filename}`; const updated=await editAuthor(req.params.id,{...author,image_url}); return res.json({author:updated,image_url});}catch(err){errorResponse(res,err);}}
