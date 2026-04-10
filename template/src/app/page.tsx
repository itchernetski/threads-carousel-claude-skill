"use client";

import dynamic from "next/dynamic";

const CarouselApp = dynamic(() => import("./CarouselApp"), { ssr: false });

export default function Page() {
  return <CarouselApp />;
}
