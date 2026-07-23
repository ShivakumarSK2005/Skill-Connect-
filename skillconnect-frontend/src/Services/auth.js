export function getToken() {
  return localStorage.getItem("token");
}

export function clearSession() {
  localStorage.removeItem("token");
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

  if (!token || !decoded?.role) {
    return null;
  }

  return {
    token,
    id: decoded.id,
    role: decoded.role,
    exp: decoded.exp
  };
}

export function getHomeRoute(role) {
  if (role === "provider") {
    return "/provider-dashboard";
  }

  if (role === "admin") {
    return "/admin-dashboard";
  }

  return "/services";
}
