import type { TravelPlace } from "../lib/travel";

export const travelPlaces: TravelPlace[] = [
  {
    id: "bali",
    name: "巴厘岛",
    country: "印度尼西亚",
    coordinates: [115.1889, -8.4095],
    labelPriority: 40,
    visits: [
      {
        date: "2016-09-01",
        datePrecision: "month",
        photos: [],
      },
    ],
  },
  {
    id: "brunei",
    name: "文莱",
    country: "文莱",
    coordinates: [114.9398, 4.9031],
    labelPriority: 40,
    visits: [
      {
        date: "2016-09-01",
        datePrecision: "month",
        photos: [],
      },
    ],
  },
  {
    id: "osaka",
    name: "大阪",
    country: "日本",
    coordinates: [135.5023, 34.6937],
    labelPriority: 60,
    visits: [
      {
        date: "2026-07-01",
        datePrecision: "month",
        photos: [],
      },
    ],
  },
  {
    id: "tokyo",
    name: "东京",
    country: "日本",
    coordinates: [139.6917, 35.6895],
    labelPriority: 80,
    visits: [
      {
        date: "2026-07-13",
        endDate: "2026-07-23",
        note: "涩谷与东京夜色",
        photos: ["/images/albums/travel-silhouettes/26.webp"],
      },
    ],
  },
  {
    id: "shanghai",
    name: "上海",
    country: "中国",
    coordinates: [121.4737, 31.2304],
    labelPriority: 60,
    visits: [
      {
        date: "2026-11-21",
        datePrecision: "day",
        photos: [],
      },
    ],
  },
];
