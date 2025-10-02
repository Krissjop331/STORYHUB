
// Demo sign-in helper: call signIn(login, password) on submit
async function signIn(login, password) {
  // load users
  let users = JSON.parse(localStorage.getItem('users') || 'null');
  if (!users) {
    try {
      const res = await fetch('assets/data/users.json');
      const data = await res.json();
      users = data.users || [];
      localStorage.setItem('users', JSON.stringify(users));
    } catch(e) {
      alert('Не удалось загрузить пользователей'); return;
    }
  }
  const user = users.find(u => u.login === login && u.password === password);
  if (!user) return alert('Неверный логин или пароль');
  localStorage.setItem('currentUser', JSON.stringify(user));
  if (user.role === 'admin')   location.href = 'admin.html';
  else if (user.role === 'teacher') location.href = 'teacher.html';
  else location.href = 'lesson0.html'; // или страница ученика
}
