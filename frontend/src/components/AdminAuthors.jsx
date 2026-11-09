import {useEffect,useState} from "react";
import {Link,NavLink,useNavigate} from "react-router-dom";
import {Search,UserRound,Menu,X,Plus,Pencil,Trash2} from "lucide-react";
import Footer from "./Footer";
const API=import.meta.env.VITE_API_URL || "http://localhost:5000";
const empty={name:"",biography:"",image_url:""};
const photoSrc=url=>!url?"/images/authors/default-author.png":url.startsWith("/uploads/")?`${API}${url}`:url;
export default function AdminAuthors(){
 const [authors,setAuthors]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [filter,setFilter]=useState(""),[form,setForm]=useState(empty),[editing,setEditing]=useState(null),[file,setFile]=useState(null),[saving,setSaving]=useState(false),[open,setOpen]=useState(false),[search,setSearch]=useState("");
 const navigate=useNavigate();
 const load=async()=>{setLoading(true);try{const r=await fetch(`${API}/api/admin/authors`,{credentials:"include"});const data=await r.json();if(!r.ok)throw Error(data.message||"Could not load authors.");setAuthors(data.authors||[]);setError("");}catch(e){setError(e.message);}finally{setLoading(false);}};
 useEffect(()=>{load();},[]);
 const begin=(author=null)=>{setEditing(author?author.author_id:"new");setForm(author?{name:author.name||"",biography:author.biography||"",image_url:author.image_url||""}:empty);setFile(null);setNotice("");setError("");};
 const save=async e=>{e.preventDefault();setSaving(true);setError("");setNotice("");try{
 const creating=editing==="new";const r=await fetch(`${API}/api/admin/authors${creating?"":`/${editing}`}`,{method:creating?"POST":"PUT",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const data=await r.json();if(!r.ok)throw Error(data.message||"Unable to save author.");
 if(file){const fd=new FormData();fd.append("photo",file);const upload=await fetch(`${API}/api/admin/authors/${data.author.author_id}/photo`,{method:"POST",credentials:"include",body:fd});const result=await upload.json();if(!upload.ok)throw Error(`Author saved, but photo upload failed: ${result.message||"Unknown error"}`);}
 setEditing(null);setFile(null);setNotice(creating?"Author added successfully.":"Author updated successfully.");await load();
 }catch(e){setError(e.message);await load();}finally{setSaving(false);}};
 const remove=async author=>{if(!window.confirm(`Delete ${author.name}? This cannot be undone.`))return;setError("");setNotice("");try{const r=await fetch(`${API}/api/admin/authors/${author.author_id}`,{method:"DELETE",credentials:"include"});const data=await r.json();if(!r.ok)throw Error(data.message||"Could not delete author.");setNotice("Author deleted.");await load();}catch(e){setError(e.message);}};
 const shown=authors.filter(a=>a.name.toLowerCase().includes(filter.toLowerCase()));
 return <div className="admin-dashboard admin-authors-page">
 <header className="site-header admin-site-header"><nav className="navbar">
 <Link to="/admin-dashboard" className="nav-logo">BOOK<span>MARKS</span></Link>
 <div className={`nav-links ${open?"open":""}`}>
 <NavLink to="/admin/books">Books</NavLink><NavLink to="/admin/authors">Authors</NavLink><NavLink to="/admin/customers">Customers</NavLink><NavLink to="/admin/restock">Restock Books</NavLink><NavLink to="/admin/orders">Orders</NavLink>
 </div><form className="nav-search-form" onSubmit={e=>{e.preventDefault();if(search.trim())navigate(`/admin/books?search=${encodeURIComponent(search.trim())}`);}}><input className="nav-search-input" placeholder="Search books..." value={search} onChange={e=>setSearch(e.target.value)}/><button className="nav-search-btn" aria-label="Search books"><Search size={24}/></button></form>
 <div className="nav-icons"><Link to="/admin/profile" className="profile-link"><UserRound size={29}/><span>My Profile</span></Link></div><button type="button" className="hamburger" onClick={()=>setOpen(!open)} aria-label="Toggle navigation menu">{open?<X/>:<Menu/>}</button>
 </nav></header>
 <main className="admin-main"><div className="admin-page-heading"><p>BOOKMARKS ADMINISTRATION</p><h1>Manage Authors</h1><span>Add, edit and organize author profiles.</span></div>
 <section className="ma-panel"><div className="ma-toolbar"><label className="ma-search"><Search size={18}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search authors..."/></label><button className="ma-primary" onClick={()=>begin()}><Plus size={18}/> Add Author</button></div>
 {error&&<p className="ma-error" role="alert">{error}</p>}{notice&&<p className="ma-success" role="status">{notice}</p>}
 {loading?<p>Loading authors...</p>:shown.length===0?<p>No authors found.</p>:<div className="ma-list">{shown.map(author=><div className="ma-item" key={author.author_id}><img src={photoSrc(author.image_url)} alt="" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="/images/authors/default-author.png";}}/><div className="ma-info"><strong>{author.name}</strong><span>{author.book_count} book(s)</span></div><div className="ma-actions"><button onClick={()=>begin(author)}><Pencil size={16}/> Edit</button><button onClick={()=>remove(author)} disabled={Number(author.book_count)>0} title={Number(author.book_count)>0?"Reassign books before deleting":"Delete author"}><Trash2 size={16}/> Delete</button></div></div>)}</div>}
 </section>
 {editing!==null&&<div className="ma-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!saving)setEditing(null);}}><section className="ma-dialog" role="dialog" aria-modal="true" aria-label={editing==="new"?"Add author":"Edit author"}><div className="ma-dialog-head"><h2>{editing==="new"?"Add Author":"Edit Author"}</h2><button type="button" onClick={()=>setEditing(null)} disabled={saving} aria-label="Close"><X/></button></div><form onSubmit={save}><label>Author name<input required maxLength={200} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Biography<textarea rows={7} maxLength={20000} value={form.biography} onChange={e=>setForm({...form,biography:e.target.value})}/></label><label>Photo URL (optional)<input value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="/images/authors/photo.jpg"/></label><label>Or upload a photo (JPG, PNG, WebP; max 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><div className="ma-dialog-actions"><button type="button" onClick={()=>setEditing(null)} disabled={saving}>Cancel</button><button type="submit" className="ma-primary" disabled={saving}>{saving?"Saving...":"Save Author"}</button></div></form></section></div>}
 </main><Footer/></div>;
}
