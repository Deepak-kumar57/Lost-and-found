export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export function getToken(){ return localStorage.getItem('token'); }
export function setSession(data){ localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); }
export function clearSession(){ localStorage.removeItem('token'); localStorage.removeItem('user'); }
export function getUser(){ try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } }
export function assetUrl(path){
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('s3://')) return path;
  return `${API_URL}${path}`;
}
async function request(path, options={}){
  const headers = options.body instanceof FormData ? {} : {'Content-Type':'application/json'};
  const token=getToken(); if(token) headers.Authorization=`Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {...options, headers:{...headers,...options.headers}});
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
export const api = {
  register: (payload)=>request('/api/auth/register',{method:'POST',body:JSON.stringify(payload)}),
  login: (payload)=>request('/api/auth/login',{method:'POST',body:JSON.stringify(payload)}),
  search: (params)=>request(`/api/items/search?${new URLSearchParams(params)}`),
  list: (type)=>request(`/api/items/${type}`),
  createItem: (type, formData)=>request(`/api/items/${type}`,{method:'POST',body:formData}),
  createClaim: (formData)=>request('/api/claims',{method:'POST',body:formData}),
  claims: ()=>request('/api/claims'),
  claimDetail: (id)=>request(`/api/claims/${id}`),
  adminDashboard: ()=>request('/api/admin/dashboard'),
  updateClaim: (id,status)=>request(`/api/claims/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}),
  updateItemStatus: (type,id,status)=>request(`/api/items/${type}/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}),
  deleteItem: (type,id)=>request(`/api/items/${type}/${id}`,{method:'DELETE'}),
  notifications: ()=>request('/api/notifications'),
  notificationUnreadCount: ()=>request('/api/notifications/unread-count'),
  markNotificationRead: (id)=>request(`/api/notifications/${id}/read`,{method:'PATCH'}),
  markAllNotificationsRead: ()=>request('/api/notifications/read-all',{method:'PATCH'}),
  startChat: (payload)=>request('/api/chat',{method:'POST',body:JSON.stringify(payload)}),
  conversations: ()=>request('/api/chat'),
  messages: (id)=>request(`/api/chat/${id}/messages`),
  sendMessage: (id, body)=>request(`/api/chat/${id}/messages`,{method:'POST',body:JSON.stringify({body})}),
  chatUsers: ()=>request('/api/chat/users'),
};
