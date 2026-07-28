import React from "react";
import Image from "next/image";

export function HeaderLogo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center select-none py-1">
      <img
        src="/logo.png"
        alt="FUJIFILM | Partner On Official Site"
        className={`h-9 sm:h-10 w-auto object-contain transition-opacity ${
          light ? "brightness-0 invert opacity-90 hover:opacity-100" : "hover:opacity-90"
        }`}
      />
    </div>
  );
}
