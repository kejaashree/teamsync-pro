const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://teamsync-backend-mq0h.onrender.com";
function getToken() { if (typeof window === "undefined") return null; return localStorage.getItem("teamsync_token"); }
async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.message || "Something went wrong"); e.status = res.status; throw e; }
  return data;
}
export const api = {
  signup: p => request("/auth/signup", { method:"POST", body:JSON.stringify(p) }),
  login: p => request("/auth/login", { method:"POST", body:JSON.stringify(p) }),
  me: () => request("/auth/me"),
  getBoards: () => request("/boards"),
  createBoard: name => request("/boards", { method:"POST", body:JSON.stringify({name}) }),
  getBoard: id => request(`/boards/${id}`),
  getStats: id => request(`/boards/${id}/stats`),
  updateBoard: (id,p) => request(`/boards/${id}`, {method:"PATCH",body:JSON.stringify(p)}),
  deleteBoard: id => request(`/boards/${id}`, {method:"DELETE"}),
  inviteMember: (id,email) => request(`/boards/${id}/invite`, {method:"POST",body:JSON.stringify({email})}),
  removeMember: (id,memberId) => request(`/boards/${id}/members/${memberId}`, {method:"DELETE"}),
  leaveBoard: id => request(`/boards/${id}/leave`, {method:"POST"}),
  addColumn: (id,name) => request(`/boards/${id}/columns`, {method:"POST",body:JSON.stringify({name})}),
  renameColumn: (id,c,name) => request(`/boards/${id}/columns/${c}`, {method:"PATCH",body:JSON.stringify({name})}),
  deleteColumn: (id,c) => request(`/boards/${id}/columns/${c}`, {method:"DELETE"}),
  addCard: (id,c,p) => request(`/boards/${id}/columns/${c}/cards`, {method:"POST",body:JSON.stringify(p)}),
  updateCard: (id,c,p) => request(`/boards/${id}/cards/${c}`, {method:"PATCH",body:JSON.stringify(p)}),
  moveCard: (id,c,p) => request(`/boards/${id}/cards/${c}/move`, {method:"PATCH",body:JSON.stringify(p)}),
  deleteCard: (id,c) => request(`/boards/${id}/cards/${c}`, {method:"DELETE"})
};
export function saveSession(token,user){localStorage.setItem("teamsync_token",token);localStorage.setItem("teamsync_user",JSON.stringify(user));}
export function getSessionUser(){if(typeof window==="undefined")return null;const raw=localStorage.getItem("teamsync_user");return raw?JSON.parse(raw):null;}
export function clearSession(){localStorage.removeItem("teamsync_token");localStorage.removeItem("teamsync_user");}
export function isLoggedIn(){return !!getToken();}
