import type { TravelPlace } from "../lib/travel";

export const travelPlaces: TravelPlace[] = [
  {
    id: "tokyo",
    name: "东京",
    country: "日本",
    coordinates: [139.6917, 35.6895],
    visits: [
      {
        date: "2026-07-13",
        endDate: "2026-07-23",
        note: "涩谷与东京夜色",
        photos: ["/images/albums/travel-silhouettes/26.webp"],
      },
    ],
  },
];
