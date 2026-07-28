import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FUJIFILM Partner On - 파트너 포털",
    short_name: "Partner On",
    description: "복합기 장비부터 계약 정보까지 통합 관리하는 파트너 포털",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAFA",
    theme_color: "#01916D",
    icons: [
      {
        src: "/fujifilm-logo1.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/fujifilm-logo1.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
