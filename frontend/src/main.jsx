import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, Link, useNavigate, useParams } from 'react-router-dom';
import { Search, PackagePlus, ShieldCheck, LogOut, MessageCircle, Trash2, Bell, ClipboardList, UserPlus } from 'lucide-react';
import { api, setSession, clearSession, getUser, assetUrl } from './api.js';
import './styles.css';

/* ── Notification Bell ── */
function NotificationBell(){
  const [count,setCount]=useState(0);
  const [open,setOpen]=useState(false);
  const [notes,setNotes]=useState([]);
  const [loaded,setLoaded]=useState(false);
  const ref=useRef();

  useEffect(()=>{
    const poll=()=>api.notificationUnreadCount().then(d=>setCount(d.count)).catch(()=>{});
    poll(); const t=setInterval(poll,30000); return ()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    const handler=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};
    document.addEventListener('mousedown',handler);
    return ()=>document.removeEventListener('mousedown',handler);
  },[]);

  async function toggle(){
    if(!open&&!loaded){
      try{const d=await api.notifications();setNotes(d.notifications);setLoaded(true);}catch{}
    }
    setOpen(!open);
  }

  async function markRead(id){
    try{await api.markNotificationRead(id);setNotes(n=>n.map(x=>x.id===id?{...x,is_read:true}:x));setCount(c=>Math.max(0,c-1));}catch{}
  }
  async function markAll(){
    try{await api.markAllNotificationsRead();setNotes(n=>n.map(x=>({...x,is_read:true})));setCount(0);}catch{}
  }

  return <div className="notifWrap" ref={ref}>
    <button className="notifBtn" onClick={toggle}><Bell size={18}/>{count>0&&<span className="notifCount">{count>9?'9+':count}</span>}</button>
    {open&&<div className="notifDrop">
      <div className="notifHeader"><strong>Notifications</strong>{notes.some(n=>!n.is_read)&&<button className="linkBtn small" onClick={markAll}>Mark all read</button>}</div>
      <div className="notifList">
        {notes.length===0&&<p className="hint" style={{padding:'18px',textAlign:'center'}}>No notifications yet.</p>}
        {notes.map(n=><div key={n.id} className={`notifItem ${n.is_read?'':'unread'}`} onClick={()=>!n.is_read&&markRead(n.id)}>
          <p>{n.message}</p>
          <small>{new Date(n.created_at).toLocaleString()}</small>
        </div>)}
      </div>
      <Link className="notifFooter" to="/my-claims" onClick={()=>setOpen(false)}>View My Claims →</Link>
    </div>}
  </div>;
}

/* ── Shell ── */
function Shell({children}){
  const nav=useNavigate();
  const [user,setUser]=useState(getUser());
  const logout=()=>{clearSession();setUser(null);nav('/login')};
  return <>
    <header>
      <Link to="/" className="brand">Lost &amp; Found Smart Portal</Link>
      <nav>
        <Link to="/search">Search</Link>
        <Link to="/report/lost">Report Lost</Link>
        <Link to="/report/found">Report Found</Link>
        {user&&<Link to="/chat">Chat</Link>}
        {user&&<Link to="/my-claims">My Claims</Link>}
        {user?.role==='admin'&&<Link to="/admin">Admin</Link>}
        {user&&<NotificationBell/>}
        {user?<button onClick={logout}><LogOut size={16}/> Logout</button>:<Link to="/login">Login</Link>}
      </nav>
    </header>
    <main>{children}</main>
  </>;
}

/* ── Home ── */
function Home(){return <section className="hero"><div><p className="eyebrow">DevOps · CI/CD · AWS Cloud</p><h1>Because every lost item deserves a way home.</h1><p>Report, search, claim, chat, and verify lost or found belongings through one secure portal.</p><div className="actions"><Link className="primary" to="/report/lost">Report Lost Item</Link><Link className="secondary" to="/search">Search Items</Link></div></div><div className="cards"><Stat icon={<Search/>} title="Smart Search" text="Filter by name, category, date, and location."/><Stat icon={<PackagePlus/>} title="Easy Reporting" text="Submit lost or found items with proof and images."/><Stat icon={<MessageCircle/>} title="In-App Chat" text="Message any user directly inside the portal."/><Stat icon={<ShieldCheck/>} title="Claim Review" text="Admin approval workflow reduces false claims."/></div></section>}
function Stat({icon,title,text}){return <div className="card">{icon}<h3>{title}</h3><p>{text}</p></div>}

/* ── Login ── */
function Login(){
  const nav=useNavigate(); const [mode,setMode]=useState('login'); const [form,setForm]=useState({name:'',email:'',password:''}); const [error,setError]=useState('');
  async function submit(e){e.preventDefault();setError('');try{const data= mode==='login'? await api.login(form): await api.register(form); setSession(data); nav('/search'); window.location.reload();}catch(err){setError(err.message)}}
  return <section className="panel narrow"><h2>{mode==='login'?'Login':'Create Account'}</h2><form onSubmit={submit}>{mode==='register'&&<input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>}<input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>{error&&<p className="error">{error}</p>}<button className="primary">{mode==='login'?'Login':'Register'}</button></form><button className="linkBtn" onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'Need an account? Register':'Already have an account? Login'}</button><p className="hint">Seed admin: admin@example.com / Password123!</p></section>
}

/* ── Report ── */
function Report({type}){
  const [msg,setMsg]=useState('');
  async function submit(e){
    e.preventDefault(); setMsg('');
    const form=e.currentTarget; const fd=new FormData(form);
    try{await api.createItem(type,fd); setMsg(`${type} item submitted successfully.`); form.reset();}
    catch(err){setMsg(err.message)}
  }
  return <section className="panel"><h2>Report {type==='lost'?'Lost':'Found'} Item</h2><form className="gridForm" onSubmit={submit}>
    <input name="title" placeholder="Item title" required minLength="2"/>
    <input name="category" placeholder="Category" required minLength="2"/>
    <input name="location" placeholder="Location" required minLength="2"/>
    <input name="item_date" type="date" required/>
    <textarea name="description" placeholder="Detailed description" required minLength="5"/>
    <textarea name="handover_instructions" placeholder="Handover instructions / notes"/>
    <input name="image" type="file" accept="image/*"/>
    <button className="primary">Submit Report</button>
  </form>{msg&&<p className={msg.toLowerCase().includes('success')?'notice':'error'}>{msg}</p>}</section>
}

/* ── Search ── */
function SearchPage(){
  const [params,setParams]=useState({q:'',category:'',location:''}); const [items,setItems]=useState([]); const [error,setError]=useState('');
  function refresh(){api.search(params).then(d=>setItems(d.items)).catch(e=>setError(e.message))}
  useEffect(()=>{const t=setTimeout(refresh,250); return ()=>clearTimeout(t)},[params.q,params.category,params.location]);
  return <section className="panel"><h2>Smart Search</h2><div className="filters"><input placeholder="Search keyword" value={params.q} onChange={e=>setParams({...params,q:e.target.value})}/><input placeholder="Category" value={params.category} onChange={e=>setParams({...params,category:e.target.value})}/><input placeholder="Location" value={params.location} onChange={e=>setParams({...params,location:e.target.value})}/></div>{error&&<p className="error">{error}</p>}<div className="itemGrid">{items.map(item=><ItemCard key={`${item.item_type}-${item.id}`} item={item} onDelete={refresh}/>)}</div></section>
}

/* ── Item Card (no per-item chat) ── */
function ItemCard({item, onDelete}){
  const [claimOpen,setClaimOpen]=useState(false); const [msg,setMsg]=useState(''); const [deleting,setDeleting]=useState(false); const user=getUser();
  const isClaimed = item.status === 'claimed';
  const isAdmin = user?.role === 'admin';
  async function handleDelete(){
    if(!confirm(`Delete "${item.title}"? This will permanently remove this item and its claims.`)) return;
    setDeleting(true);
    try{ await api.deleteItem(item.item_type, item.id); if(onDelete) onDelete(); }
    catch(e){ setMsg(e.message); setDeleting(false); }
  }
  return <article className={`item ${isClaimed?'itemClaimed':''}`}>
    {isAdmin && <button className="deleteBtn" onClick={handleDelete} disabled={deleting} title="Delete item"><Trash2 size={15}/></button>}
    {item.image_url&&<img className="itemImg" src={assetUrl(item.image_url)} alt={item.title}/>}<span className="badge">{item.item_type}</span><h3>{item.title}</h3><p>{item.description}</p><small>{item.category} · {item.location} · {String(item.item_date).slice(0,10)}</small>
    {isClaimed ? <div className="claimedBanner">✓ This item has been claimed</div> : <>
      <div className="row"><button className="secondary" onClick={()=>setClaimOpen(!claimOpen)}>Submit Claim</button></div>
      {msg&&<p className="error">{msg}</p>}{claimOpen&&<ClaimForm item={item}/>}
    </>}
  </article>
}

function ClaimForm({item}){const [msg,setMsg]=useState('');async function submit(e){e.preventDefault(); const form=e.currentTarget; const fd=new FormData(form); fd.append('item_id',item.id); fd.append('item_type',item.item_type); try{await api.createClaim(fd); setMsg('Claim submitted — check My Claims for updates.'); form.reset();}catch(err){setMsg(err.message)}} return <form className="claim" onSubmit={submit}><textarea name="description" placeholder="Ownership proof description" required/><input name="proof" type="file" accept="image/*,.pdf"/><button className="primary">Send Claim</button>{msg&&<p className="notice">{msg}</p>}</form>}

/* ── My Claims ── */
function MyClaims(){
  const [claims,setClaims]=useState([]); const [error,setError]=useState(''); const [filter,setFilter]=useState('all');
  useEffect(()=>{api.claims().then(d=>setClaims(d.claims)).catch(e=>setError(e.message))},[]);
  const filtered = filter==='all' ? claims : claims.filter(c=>c.status===filter);
  return <section className="panel"><h2><ClipboardList size={22} style={{verticalAlign:'middle',marginRight:8}}/>My Claims</h2>
    {error&&<p className="error">{error}</p>}
    <div className="filterTabs" style={{marginBottom:16}}>
      {['all','pending','approved','rejected'].map(f=><button key={f} className={`filterTab ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>{f==='all'?'All':f.charAt(0).toUpperCase()+f.slice(1)}{f==='pending'&&<span className="countBadge">{claims.filter(c=>c.status==='pending').length}</span>}</button>)}
    </div>
    {filtered.length===0?<p className="hint">No {filter==='all'?'':filter} claims found.</p>:
    <div className="myClaimsList">{filtered.map(c=><div key={c.id} className="myClaimCard">
      <div className="myClaimTop">
        <span className={`typeBadge ${c.item_type}`}>{c.item_type}</span>
        <span className={`statusBadge ${c.status}`}>{c.status}</span>
      </div>
      <h4>Claim #{c.id} — Item #{c.item_id}</h4>
      <p className="myClaimDesc">{c.description}</p>
      <div className="myClaimMeta">
        <small>Submitted {new Date(c.created_at).toLocaleDateString()}</small>
        {c.resolved_at&&<small>Resolved {new Date(c.resolved_at).toLocaleDateString()}</small>}
      </div>
    </div>)}</div>}
  </section>;
}

/* ── General Chat List ── */
function ChatList(){
  const [conversations,setConversations]=useState([]); const [error,setError]=useState('');
  const [showNew,setShowNew]=useState(false); const [users,setUsers]=useState([]); const [userSearch,setUserSearch]=useState('');
  const nav=useNavigate(); const user=getUser();

  useEffect(()=>{api.conversations().then(d=>setConversations(d.conversations)).catch(e=>setError(e.message))},[]);

  async function openNewChat(){
    if(!showNew){try{const d=await api.chatUsers();setUsers(d.users);}catch(e){setError(e.message)}}
    setShowNew(!showNew);
  }
  async function startWith(uid){
    try{const d=await api.startChat({recipient_id:uid}); nav(`/chat/${d.conversation.id}`);}catch(e){setError(e.message)}
  }

  function otherParticipants(c){
    if(!c.participants) return 'Unknown';
    const others=c.participants.filter(p=>p.id!==user?.id);
    return others.map(p=>p.name).join(', ')||'You';
  }

  const filteredUsers = users.filter(u=>u.name.toLowerCase().includes(userSearch.toLowerCase())||u.email.toLowerCase().includes(userSearch.toLowerCase()));

  return <section className="panel"><h2>Messages</h2>
    <button className="primary" onClick={openNewChat} style={{marginBottom:16}}><UserPlus size={16}/> {showNew?'Cancel':'New Conversation'}</button>
    {error&&<p className="error">{error}</p>}
    {showNew&&<div className="newChatPanel">
      <input placeholder="Search users..." value={userSearch} onChange={e=>setUserSearch(e.target.value)} style={{marginBottom:10}}/>
      <div className="userPickList">{filteredUsers.length===0&&<p className="hint">No users found.</p>}{filteredUsers.map(u=><button key={u.id} className="userPickItem" onClick={()=>startWith(u.id)}><strong>{u.name}</strong><small>{u.email}</small></button>)}</div>
    </div>}
    <div className="chatList">
      {conversations.length===0&&!showNew&&<p className="hint">No conversations yet. Start a new one above!</p>}
      {conversations.map(c=><Link className="chatRow" to={`/chat/${c.id}`} key={c.id}>
        <strong>{otherParticipants(c)}</strong>
        <span>{c.last_message || 'No messages yet'}</span>
        <small>{c.last_message_at?new Date(c.last_message_at).toLocaleString():'—'}</small>
      </Link>)}
    </div>
  </section>
}

/* ── Chat Room ── */
function ChatRoom(){
  const {id}=useParams(); const [messages,setMessages]=useState([]); const [body,setBody]=useState(''); const [error,setError]=useState(''); const user=getUser();
  async function load(){try{const data=await api.messages(id); setMessages(data.messages)}catch(e){setError(e.message)}}
  useEffect(()=>{load(); const t=setInterval(load,4000); return ()=>clearInterval(t)},[id]);
  async function send(e){e.preventDefault(); if(!body.trim())return; try{await api.sendMessage(id,body); setBody(''); load()}catch(e){setError(e.message)}}
  return <section className="panel"><h2>Conversation</h2>{error&&<p className="error">{error}</p>}<div className="messages">{messages.map(m=><div key={m.id} className={`msg ${m.sender_id===user?.id?'mine':''}`}><strong>{m.sender_name}</strong><p>{m.body}</p><small>{new Date(m.created_at).toLocaleString()}</small></div>)}</div><form className="sendBox" onSubmit={send}><input value={body} onChange={e=>setBody(e.target.value)} placeholder="Type your message..."/><button className="primary">Send</button></form></section>
}

/* ── Admin ── */
function Admin(){
  const [data,setData]=useState(null);
  const [claims,setClaims]=useState([]);
  const [error,setError]=useState('');
  const [actionError,setActionError]=useState('');
  const [actionSuccess,setActionSuccess]=useState('');
  const [reviewClaim,setReviewClaim]=useState(null);
  const [reviewItem,setReviewItem]=useState(null);
  const [reviewLoading,setReviewLoading]=useState(false);
  const [actionLoading,setActionLoading]=useState(false);
  const [filter,setFilter]=useState('all');

  async function load(){
    try{
      setData(await api.adminDashboard());
      setClaims((await api.claims()).claims);
    }catch(e){setError(e.message)}
  }
  useEffect(()=>{load()},[]);

  async function openReview(claim){
    setReviewLoading(true); setActionError(''); setActionSuccess('');
    try{
      const detail = await api.claimDetail(claim.id);
      setReviewClaim(detail.claim);
      setReviewItem(detail.item);
    }catch(e){setActionError(e.message)}
    setReviewLoading(false);
  }

  function closeReview(){ setReviewClaim(null); setReviewItem(null); setActionError(''); setActionSuccess(''); }

  async function update(id,status){
    setActionLoading(true); setActionError(''); setActionSuccess('');
    try{
      await api.updateClaim(id,status);
      setActionSuccess(`Claim #${id} has been ${status}.`);
      closeReview();
      load();
    }catch(e){
      setActionError(e.message);
    }
    setActionLoading(false);
  }

  const filteredClaims = filter==='all' ? claims : claims.filter(c=>c.status===filter);

  if(error) return <section className="panel"><p className="error">{error}</p></section>;
  if(!data) return <section className="panel"><div className="loadingSpinner">Loading dashboard…</div></section>;

  return <section className="panel adminPanel">
    <h2>Admin Dashboard</h2>

    <div className="stats">
      {Object.entries(data.stats).map(([k,v])=><div className="stat" key={k}>
        <strong>{v}</strong><span>{k.replaceAll('_',' ')}</span>
      </div>)}
    </div>

    {actionSuccess && <p className="notice">{actionSuccess}</p>}
    {actionError && !reviewClaim && <p className="error">{actionError}</p>}

    <div className="claimsHeader">
      <h3>Claims Management</h3>
      <div className="filterTabs">
        {['all','pending','approved','rejected'].map(f=>
          <button key={f} className={`filterTab ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
            {f==='all'?'All':f.charAt(0).toUpperCase()+f.slice(1)}
            {f==='pending' && <span className="countBadge">{claims.filter(c=>c.status==='pending').length}</span>}
          </button>
        )}
      </div>
    </div>

    {filteredClaims.length===0 ? <p className="hint">No {filter==='all'?'':filter} claims found.</p> :
    <div className="claimsTable">
      <table>
        <thead><tr>
          <th>ID</th><th>Item</th><th>Type</th><th>Claimant</th><th>Status</th><th>Submitted</th><th>Action</th>
        </tr></thead>
        <tbody>{filteredClaims.map(c=><tr key={c.id} className={c.status==='pending'?'pendingRow':''}>
          <td>#{c.id}</td>
          <td>Item #{c.item_id}</td>
          <td><span className={`typeBadge ${c.item_type}`}>{c.item_type}</span></td>
          <td><div className="claimantCell"><strong>{c.claimant_name||'User #'+c.claimant_id}</strong>{c.claimant_email && <small>{c.claimant_email}</small>}</div></td>
          <td><span className={`statusBadge ${c.status}`}>{c.status}</span></td>
          <td><small>{new Date(c.created_at).toLocaleDateString()}</small></td>
          <td>
            <button className="reviewBtn" onClick={()=>openReview(c)}>Review</button>
          </td>
        </tr>)}</tbody>
      </table>
    </div>}

    {(reviewClaim || reviewLoading) && <div className="modalOverlay" onClick={closeReview}>
      <div className="reviewModal" onClick={e=>e.stopPropagation()}>
        {reviewLoading ? <div className="loadingSpinner">Loading claim details…</div> : reviewClaim && <>
          <div className="modalHeader">
            <h3>Review Claim #{reviewClaim.id}</h3>
            <button className="closeBtn" onClick={closeReview}>✕</button>
          </div>

          <div className="reviewGrid">
            <div className="reviewSection">
              <h4>Claim Details</h4>
              <div className="detailRow"><span>Claimant</span><strong>{reviewClaim.claimant_name}</strong></div>
              <div className="detailRow"><span>Email</span><strong>{reviewClaim.claimant_email}</strong></div>
              <div className="detailRow"><span>Item Type</span><span className={`typeBadge ${reviewClaim.item_type}`}>{reviewClaim.item_type}</span></div>
              <div className="detailRow"><span>Status</span><span className={`statusBadge ${reviewClaim.status}`}>{reviewClaim.status}</span></div>
              <div className="detailRow"><span>Submitted</span><strong>{new Date(reviewClaim.created_at).toLocaleString()}</strong></div>
              <div className="proofSection">
                <h4>Claimant's Statement</h4>
                <p className="claimDescription">{reviewClaim.description}</p>
              </div>
              {reviewClaim.proof_url && <div className="proofSection">
                <h4>Proof Attachment</h4>
                <img className="proofImg" src={assetUrl(reviewClaim.proof_url)} alt="Proof"/>
              </div>}
            </div>

            <div className="reviewSection">
              <h4>Item Details</h4>
              {reviewItem ? <>
                <div className="detailRow"><span>Title</span><strong>{reviewItem.title}</strong></div>
                <div className="detailRow"><span>Category</span><strong>{reviewItem.category}</strong></div>
                <div className="detailRow"><span>Location</span><strong>{reviewItem.location}</strong></div>
                <div className="detailRow"><span>Reporter</span><strong>{reviewItem.reporter_name}</strong></div>
                <div className="detailRow"><span>Reporter Email</span><strong>{reviewItem.reporter_email}</strong></div>
                <div className="detailRow"><span>Status</span><span className={`statusBadge ${reviewItem.status}`}>{reviewItem.status}</span></div>
                <div className="proofSection">
                  <h4>Item Description</h4>
                  <p className="claimDescription">{reviewItem.description}</p>
                </div>
                {reviewItem.handover_instructions && <div className="proofSection">
                  <h4>Handover Instructions</h4>
                  <p className="claimDescription">{reviewItem.handover_instructions}</p>
                </div>}
                {reviewItem.image_url && <div className="proofSection">
                  <h4>Item Image</h4>
                  <img className="proofImg" src={assetUrl(reviewItem.image_url)} alt="Item"/>
                </div>}
              </> : <p className="hint">Item details not available.</p>}
            </div>
          </div>

          {actionError && <p className="error">{actionError}</p>}

          {reviewClaim.status==='pending' && <div className="modalActions">
            <button className="approveBtn" disabled={actionLoading} onClick={()=>update(reviewClaim.id,'approved')}>
              {actionLoading ? 'Processing…' : '✓ Approve Claim'}
            </button>
            <button className="rejectBtn" disabled={actionLoading} onClick={()=>update(reviewClaim.id,'rejected')}>
              {actionLoading ? 'Processing…' : '✗ Reject Claim'}
            </button>
          </div>}
          {reviewClaim.status!=='pending' && <div className="modalActions">
            <p className="hint">This claim has already been {reviewClaim.status}.</p>
          </div>}
        </>}
      </div>
    </div>}
  </section>
}

function Protected({children}){return getUser()?children:<Navigate to="/login"/>}
function App(){return <BrowserRouter><Shell><Routes>
  <Route path="/" element={<Home/>}/>
  <Route path="/login" element={<Login/>}/>
  <Route path="/search" element={<SearchPage/>}/>
  <Route path="/report/:type" element={<Protected><ReportWrapper/></Protected>}/>
  <Route path="/my-claims" element={<Protected><MyClaims/></Protected>}/>
  <Route path="/chat" element={<Protected><ChatList/></Protected>}/>
  <Route path="/chat/:id" element={<Protected><ChatRoom/></Protected>}/>
  <Route path="/admin" element={<Protected><Admin/></Protected>}/>
</Routes></Shell></BrowserRouter>}
function ReportWrapper(){const {type}=useParams(); return <Report type={type==='found'?'found':'lost'}/>}
createRoot(document.getElementById('root')).render(<App/>);
