"use client";

import { ParticleWorld } from "./particle-world";
import { useContext } from "react";
import { HomeReadyContext } from "./HomeMotion";

export function Globe({ enabled }: { enabled?: boolean }) {
  const ready = useContext(HomeReadyContext);
  return <ParticleWorld enabled={enabled ?? ready} />;
}

export default Globe;
