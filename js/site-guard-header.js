/*! site-guard-header.js | unified header + auth */
(function(){
  const AUTH_TOKEN = 'STORYHUB_auth_token';
  const USER_DATA  = 'STORYHUB_user_data';
  const SESSION_START = 'STORYHUB_session_start';
  const SESSION_DURATION = 'STORYHUB_session_duration'; // ms

  // LocalStorage helpers for cross-tab auth
  const Local = {
    get(name){ try{ return localStorage.getItem(name); } catch(e){ return null; } },
    set(name,val){ try{ localStorage.setItem(name,val); } catch(e){} },
    remove(name){ try{ localStorage.removeItem(name); } catch(e){} },
  };

  const SessionUtils = {
    set(name, value){ try{ sessionStorage.setItem(name, value); return true; } catch(e){ return false; } },
    get(name){ try{ return sessionStorage.getItem(name); } catch(e){ return null; } },
    remove(name){ try{ sessionStorage.removeItem(name); return true; } catch(e){ return false; } },
    clear(){ try{ sessionStorage.clear(); return true; } catch(e){ return false; } },
  };

  function validateSessionToken(token){
    if (!token) return false;
    try{
      const data = JSON.parse(atob(token));
      const start = Number(SessionUtils.get(SESSION_START));
      const dur = Number(SessionUtils.get(SESSION_DURATION) || 0);
      if (start && dur) {
        const now = Date.now();
        if (now - start > dur) return false;
      }
      return !!data && !!data.username;
    }catch(e){ return false; }
  }

  function hydrateFromLocal(){
    const lsUser = Local.get(USER_DATA);
    const lsToken = Local.get(AUTH_TOKEN);
    if (lsUser && lsToken) {
      SessionUtils.set(USER_DATA, lsUser);
      SessionUtils.set(AUTH_TOKEN, lsToken);
      if (!SessionUtils.get(SESSION_START)) SessionUtils.set(SESSION_START, String(Date.now()));
      return true;
    }
    return false;
  }

  function getCurrentUser(){
    let token = SessionUtils.get(AUTH_TOKEN);
    let raw = SessionUtils.get(USER_DATA);
    if(!(token && raw && validateSessionToken(token))){
      hydrateFromLocal();
      token = SessionUtils.get(AUTH_TOKEN);
      raw = SessionUtils.get(USER_DATA);
    }
    if(token && raw && validateSessionToken(token)){
      try { return JSON.parse(raw); } catch(e){ return null; }
    }
    return null;
  }

  function clearSession(){
    SessionUtils.remove(AUTH_TOKEN);
    SessionUtils.remove(USER_DATA);
    SessionUtils.remove(SESSION_START);
    SessionUtils.remove(SESSION_DURATION);
    Local.remove(AUTH_TOKEN);
    Local.remove(USER_DATA);
  }

  function logout(){
    clearSession();
    location.href = 'index.html';
  }

  function requireAuth(){
    let ok = validateSessionToken(SessionUtils.get(AUTH_TOKEN)) && !!SessionUtils.get(USER_DATA);
    if(!ok){
      if (hydrateFromLocal()) {
        ok = validateSessionToken(SessionUtils.get(AUTH_TOKEN)) && !!SessionUtils.get(USER_DATA);
      }
    }
    if(!ok){
      clearSession();
      location.href = 'index.html';
      return false;
    }
    return true;
  }

  function ensureHeaderUI(){
    const u = getCurrentUser();
    const nm = document.getElementById('userName');
    if (nm && u) {
      const display = (u.fullName && String(u.fullName).trim()) || (u.name && String(u.name).trim()) || (u.displayName && String(u.displayName).trim()) || u.username || 'Пользователь';
      nm.textContent = display;
      nm.classList.add('ready');
    }
    const adminBtn = document.getElementById('adminPanelBtn');
    if (adminBtn) {
      let href = '';
      if (u && u.role === 'admin') href = 'admin.html';
      else if (u && (u.role === 'teacher' || u.role === 'Учитель')) href = 'teacher.html';
      if (href) {
        adminBtn.setAttribute('href', href);
        adminBtn.style.display = 'inline-flex';
        adminBtn.title = (u.role === 'admin') ? 'Админ-панель' : 'Кабинет учителя';
        adminBtn.textContent = (u.role === 'admin') ? 'Админка' : 'Кабинет учителя';
      } else {
        adminBtn.style.display = 'none';
      }
    }
    const lb = document.getElementById('logoutBtn');
    if (lb) {
      lb.addEventListener('click', function(e){
        e.preventDefault();
        logout();
      });
    }
  }

  function injectStylesOnce(){
    if (document.getElementById('siteGuardHeaderStyles')) return;
    const css = `

/* --- Header unified styles (polished) --- */
:root{
  --brand:#5b4bff;
  --brand2:#7a63ff;
  --text:#111827;
  --muted:#6b7280;
}
.header.sg-header{padding:16px 0;border-bottom:1px solid rgba(0,0,0,.06);background:#fff}
.header.sg-header .header_inner{display:flex;align-items:center;justify-content:space-between;gap:16px}
.header.sg-header .logo{font-weight:800;letter-spacing:.25px;color:var(--text);text-decoration:none}
.header.sg-header .logo span{color:var(--brand)}
.header.sg-header .header-controls{display:flex;align-items:center;gap:14px}

/* username */
.header.sg-header .nameuser{margin:0;font-weight:700;color:var(--text);opacity:0;transition:opacity .2s ease}
.header.sg-header .nameuser.ready{opacity:1}

/* buttons (strong specificity + !important to beat page CSS) */
.header.sg-header .admin-panel-btn,
.header.sg-header #logoutBtn{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:9999px;text-decoration:none;line-height:1;cursor:pointer;font-weight:600;box-shadow:none;transition:transform .12s ease, box-shadow .2s ease width:auto !important; height:auto !important; border-radius:9999px !important; padding:8px 14px !important; 
 font-size:14px !important; 
}
.header.sg-header .admin-panel-btn{background:linear-gradient(135deg,var(--brand),var(--brand2)) !important;border:0 !important;color:#fff !important;box-shadow:0 8px 18px rgba(91,75,255,.18) font-size:14px !important; 
}
.header.sg-header .admin-panel-btn:hover{transform:translateY(-1px);box-shadow:0 12px 24px rgba(91,75,255,.28)}
.header.sg-header #logoutBtn{background:#f3f4f6 !important;border:1px solid rgba(0,0,0,.08) !important;color:var(--text) !important width:auto !important; height:auto !important; border-radius:9999px !important; padding:8px 14px !important; 
 font-size:14px !important; 
}
.header.sg-header #logoutBtn:hover{background:#e5e7eb !important}

/* force override legacy .iconexit circle on some lessons */
.header.sg-header a.iconexit#logoutBtn{ 
  display:inline-flex !important; align-items:center; gap:8px; 
  width:auto !important; height:auto !important; 
  border-radius:9999px !important; padding:8px 14px !important; 
  background:#f3f4f6 !important; border:1px solid rgba(0,0,0,.08) !important; color:#111 !important;
 font-size:14px !important; 
}
.header.sg-header a.iconexit#logoutBtn:hover{ background:#e5e7eb !important; }

`;
    const style = document.createElement('style');
    style.id = 'siteGuardHeaderStyles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Export globals in case pages use them
  window.requireAuth = requireAuth;
  window.getCurrentUser = getCurrentUser;
  window.logout = logout;

  document.addEventListener('DOMContentLoaded', function(){
    if (!requireAuth()) { document.documentElement.style.display='none'; return; }
    injectStylesOnce();
    ensureHeaderUI();
  });
})();