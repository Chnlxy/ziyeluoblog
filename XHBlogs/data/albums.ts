export interface Photo {
  url: string;
  caption?: string;
}

export interface Album {
  id: string;
  title: string;
  description: string;
  cover: string;
  date: string;
  photos: Photo[];
}

export const albums: Album[] = [
  {
    id: "daily-light",
    title: "日常光影",
    description: "把暂时收集到的画面放在这里，之后会慢慢增加。",
    cover: "/images/backgrounds/desktop.webp",
    date: "2026.11",
    photos: [
      {
        url: "/images/backgrounds/mobile.webp",
        caption: "店门前的一杯奶茶",
      },
      {
        url: "/images/backgrounds/desktop.webp",
        caption: "黄昏里的街角",
      },
      {
        url: "/images/covers/leaf-light.svg",
        caption: "等待新的照片",
      },
    ],
  },
  {
    id: "small-moments",
    title: "小事收藏",
    description: "留给以后真正的照片与记忆。",
    cover: "/images/covers/leaf-dark.svg",
    date: "2026.11",
    photos: [
      {
        url: "/images/covers/leaf-dark.svg",
        caption: "一枚叶子",
      },
      {
        url: "/images/covers/leaf-light.svg",
        caption: "一束光",
      },
    ],
  },
  {
    id: "evening-leaves",
    title: "晚风与树影",
    description: "留一块位置给以后拍到的傍晚。",
    cover: "/images/covers/default-cover.svg",
    date: "2026.11",
    photos: [
      {
        url: "/images/backgrounds/desktop.webp",
        caption: "树影与店门",
      },
      {
        url: "/images/backgrounds/mobile.webp",
        caption: "手里的饮料",
      },
    ],
  },
  {
    id: "travel-silhouettes",
    title: "旅游剪影",
    description: "旅途中的风景与片刻，照片会陆续放进来。",
    cover: "/images/covers/default-cover.svg",
    date: "2026.11",
    photos: [],
  },
];
