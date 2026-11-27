// 全站配置入口。第一版只启用主要内容模块。

export const siteConfig = {
  title: "梓叶落の幻想郷",
  faviconUrl: "/avatar-placeholder.svg",
  authorName: "梓叶落",
  bio: "暂时没有喵",

  navTitle: "梓叶落",
  navSuffix: "の",
  navAfter: "幻想郷",

  avatarUrl: "/avatar-placeholder.svg",
  homeAvatarUrl: "/images/avatars/home.webp",
  splashImageUrl: "/images/splash-praying-girl.gif",

  useGradient: false,
  themeColors: ["#d6c160", "#98733b", "#8d9a83", "#2c2a23"],
  backgroundConfig: {
    mobile: "/images/backgrounds/mobile.webp",
    desktop: "/images/backgrounds/desktop.webp",
    mobilePosition: "68% center",
    desktopPosition: "center center",
  },

  // 兼容上游保留模块的旧字段，第一版背景组件优先使用 backgroundConfig。
  bgImages: ["/images/backgrounds/desktop.webp"],
  bgGroups: [
    {
      id: "default",
      name: "默认",
      images: ["/images/backgrounds/desktop.webp"],
    },
  ],
  activeBgGroup: "default",

  navigation: [
    { name: "首页", href: "/" },
    { name: "归档", href: "/timeline" },
    { name: "照片墙", href: "/photowall" },
    { name: "说说", href: "/moments" },
    { name: "友链", href: "/friends" },
    { name: "关于", href: "/about" },
  ],

  defaultPostCover: "/images/covers/default-cover.svg",
  photoWallImage: "/images/backgrounds/desktop.webp",

  cloudMusicIds: [],
  social: {
    github: "https://github.com/Chnlxy",
    bilibili: "https://space.bilibili.com/1283960511",
    gitee: "",
    google: "",
    email: "",
    qq: "",
    wechat: "",
  },

  counts: {
    photos: 5,
  },
  chatterTitle: "叶落杂谈",
  chatterDescription: "暂时留白。",
  danmakuList: [],

  gitalkConfig: {
    clientID: "",
    clientSecret: "",
    repo: "",
    owner: "",
    admin: [""],
  },

  buildDate: "2026-11-27T00:00:00",
  footerBadges: [
    {
      name: "Next.js",
      color: "text-sky-500",
      svg: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>',
    },
    {
      name: "React",
      color: "text-cyan-400",
      svg: '<path d="M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z"/>',
    },
  ],
  icpConfig: {
    name: "",
    link: "",
  },

  geminiConfig: {
    modelId: "",
    systemPrompt: "",
    maxOutputTokens: 150,
    temperature: 0.8,
  },

  friendLinkApplyFormat:
    "名称：梓叶落の幻想郷\n简介：暂时没有喵\n链接：\n头像：",
  enableLevelSystem: false,
};
