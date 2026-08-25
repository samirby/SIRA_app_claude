"use client";

import { useEffect, useState } from "react";

function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 11) return "Mirëmëngjes";
  if (hour < 18) return "Mirëdita";
  return "Mirëmbrëma";
}

export function TimeGreeting() {
  const [greeting, setGreeting] = useState("Mirë se vini");

  useEffect(() => {
    setGreeting(getGreeting());
    const timer = window.setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return <h2>{greeting}</h2>;
}
