export function getToken() {
  return localStorage.getItem("admin_token");
}

export function setToken(token) {
  localStorage.setItem("admin_token", token);
}

export function clearSession() {
  localStorage.removeItem("admin_token");
}

export function decodeToken(token) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function getCurrentUser() {
  const token = getToken();
  const decoded = decodeToken(token);

  if (!token || decoded?.role !== "admin") {
    return null;
  }

  return {
    token,
    id: decoded.id,
    role: decoded.role,
    exp: decoded.exp
  };
}
