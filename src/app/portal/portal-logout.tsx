"use client";
export function PortalLogout() { async function logout() { await fetch("/api/v1/auth/logout", { method: "POST" }); window.location.assign("/login"); } return <button onClick={() => void logout()}>Dil</button>; }
