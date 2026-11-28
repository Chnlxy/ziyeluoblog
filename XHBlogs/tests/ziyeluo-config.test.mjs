import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const config = fs.readFileSync(path.join(root, "siteConfig.ts"), "utf8");

test("uses the confirmed site identity", () => {
  assert.match(config, /title:\s*"梓叶落の幻想郷"/);
  assert.match(config, /authorName:\s*"梓叶落"/);
  assert.match(config, /bio:\s*"暂时没有喵"/);
});

test("enables only the first-version navigation", () => {
  for (const label of ["首页", "归档", "照片墙", "说说", "留言", "关于"]) {
    assert.match(config, new RegExp(`name:\\s*"${label}"`));
  }

  for (const deferred of ["音乐", "灵境", "每日选刊", "天气"]) {
    assert.doesNotMatch(config, new RegExp(`name:\\s*"${deferred}"`));
  }
});

test("ships optimized responsive background assets", () => {
  for (const name of ["mobile.webp", "desktop.webp"]) {
    const file = path.join(root, "public", "images", "backgrounds", name);
    assert.ok(fs.existsSync(file), `${name} should exist`);
    assert.ok(fs.statSync(file).size <= 600 * 1024, `${name} should be <= 600 KiB`);
  }
});

test("chooses the desktop background at the desktop breakpoint", () => {
  const component = fs.readFileSync(
    path.join(root, "components", "ResponsiveBackground.tsx"),
    "utf8",
  );
  assert.match(component, /media="\(min-width: 768px\),/);
  assert.match(component, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(component, /siteConfig\.backgroundConfig/);
  assert.match(component, /background\.mobile/);
  assert.match(component, /background\.desktop/);
});

test("mounts the focused site shell without deferred services", () => {
  const layout = fs.readFileSync(path.join(root, "app", "layout.tsx"), "utf8");
  assert.match(layout, /ResponsiveBackground/);

  for (const deferred of [
    "MusicProvider",
    "FloatingPlayer",
    "DailyBriefing",
    "CyberCat",
    "BigFishPet",
    "DanmakuBackground",
  ]) {
    assert.doesNotMatch(layout, new RegExp(`import[^;]+${deferred}`));
  }
});

test("derives the navbar from the first-version navigation config", () => {
  const navbar = fs.readFileSync(
    path.join(root, "components", "Navbar.tsx"),
    "utf8",
  );
  assert.match(navbar, /siteConfig\.navigation/);
  assert.doesNotMatch(navbar, /href:\s*["']\/(?:music|tree|projects|chatter)["']/);
});

test("ships the first-version placeholder content", () => {
  const posts = fs
    .readdirSync(path.join(root, "posts"))
    .filter((file) => file.endsWith(".md"))
    .sort();
  const moments = fs
    .readdirSync(path.join(root, "moments"))
    .filter((file) => file.endsWith(".md"))
    .sort();

  assert.deepEqual(posts, [
    "a-quiet-place.md",
    "reading-and-writing.md",
    "the-beginning.md",
    "welcome-to-fantasy.md",
  ]);
  assert.equal(moments.length, 5);
  assert.ok(fs.existsSync(path.join(root, "public", "avatar-placeholder.svg")));
  assert.ok(fs.existsSync(path.join(root, "public", "images", "covers", "default-cover.svg")));
  assert.ok(
    fs.existsSync(
      path.join(root, "public", "images", "covers", "the-beginning.webp"),
    ),
  );
  const firstPost = fs.readFileSync(
    path.join(root, "posts", "the-beginning.md"),
    "utf8",
  );
  assert.match(firstPost, /title:\s*["']故事的开始["']/);
  assert.match(firstPost, /cover:\s*["']\/images\/covers\/the-beginning\.webp["']/);
});

test("removes upstream private profile copy from active content", () => {
  const contentFiles = [
    ...fs
      .readdirSync(path.join(root, "posts"))
      .filter((file) => file.endsWith(".md"))
      .map((file) => path.join(root, "posts", file)),
    ...fs
      .readdirSync(path.join(root, "moments"))
      .filter((file) => file.endsWith(".md"))
      .map((file) => path.join(root, "moments", file)),
    path.join(root, "app", "about", "about.md"),
    path.join(root, "data", "albums.ts"),
  ];
  const text = contentFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");

  assert.doesNotMatch(
    text,
    /XingHuiSama|泰拉大陆|GROMACS|bilibiliwuwuwu@gmail\.com/,
  );
});

test("does not show a back button on the homepage", () => {
  const source = fs.readFileSync(
    path.join(root, "components", "MobileBackButton.tsx"),
    "utf8",
  );
  assert.match(source, /usePathname/);
  assert.match(source, /pathname\s*===\s*["']\/["']/);
  assert.match(source, /pathname\.startsWith\(["']\/posts\/["']\)/);
  assert.match(source, /pathname\s*===\s*["']\/about["']/);
  assert.match(source, /pathname\s*===\s*["']\/friends["']/);
});

test("production build validates types and ships no upstream domain", () => {
  const nextConfig = fs.readFileSync(
    path.join(root, "next.config.ts"),
    "utf8",
  );
  assert.doesNotMatch(nextConfig, /ignoreBuildErrors\s*:\s*true/);
  assert.equal(fs.existsSync(path.join(root, "public", "pets")), false);
});

test("profile card is keyboard accessible", () => {
  const source = fs.readFileSync(
    path.join(root, "components", "ProfileCard.tsx"),
    "utf8",
  );
  assert.match(source, /role=["']link["']/);
  assert.match(source, /tabIndex=\{0\}/);
  assert.match(source, /onKeyDown=/);
});

test("builds a GitHub Pages static export", () => {
  const nextConfig = fs.readFileSync(
    path.join(root, "next.config.ts"),
    "utf8",
  );
  assert.match(nextConfig, /output:\s*["']export["']/);
  assert.match(nextConfig, /trailingSlash:\s*true/);
  assert.equal(
    fs.readFileSync(path.join(root, "public", "CNAME"), "utf8").trim(),
    "wakaba.cc",
  );

  const workflow = fs.readFileSync(
    path.join(root, "..", ".github", "workflows", "deploy-pages.yml"),
    "utf8",
  );
  assert.match(workflow, /actions\/upload-pages-artifact/);
  assert.match(workflow, /actions\/deploy-pages/);
});

test("adds the travel silhouettes album with an empty state", () => {
  const albums = fs.readFileSync(
    path.join(root, "data", "albums.ts"),
    "utf8",
  );
  const photoWall = fs.readFileSync(
    path.join(root, "app", "photowall", "PhotoWallClient.tsx"),
    "utf8",
  );

  assert.match(albums, /title:\s*["']旅游剪影["']/);
  assert.match(photoWall, /currentAlbum\.photos\.length\s*===\s*0/);
  assert.match(photoWall, /这个相册还没有照片/);
});

test("publishes all selected travel photos", () => {
  const albums = fs.readFileSync(
    path.join(root, "data", "albums.ts"),
    "utf8",
  );
  const start = albums.indexOf('id: "travel-silhouettes"');
  assert.notEqual(start, -1);
  const block = albums.slice(start, albums.indexOf("\n  },", start) + 5);
  const photoUrls = [...block.matchAll(/url:\s*["'](\/images\/albums\/travel-silhouettes\/[^"']+)["']/g)]
    .map((match) => match[1]);

  assert.equal(photoUrls.length, 27);
  for (const url of photoUrls) {
    assert.ok(
      fs.existsSync(path.join(root, "public", url)),
      `${url} should exist`,
    );
  }
});

test("adds the Shibuya Sky note to the matching travel photo", () => {
  const albums = fs.readFileSync(
    path.join(root, "data", "albums.ts"),
    "utf8",
  );
  assert.match(
    albums,
    /url:\s*["']\/images\/albums\/travel-silhouettes\/26\.webp["'],\s*caption:\s*["']涩谷sky["'],\s*location:\s*\{[\s\S]*?name:\s*["']SHIBUYA SKY["'][\s\S]*?latitude:\s*35\.6581[\s\S]*?longitude:\s*139\.7016/,
  );
});

test("opens a tagged footprints photo in Google Maps", () => {
  const photoWall = fs.readFileSync(
    path.join(root, "app", "photowall", "PhotoWallClient.tsx"),
    "utf8",
  );
  const panel = fs.readFileSync(
    path.join(root, "components", "TravelDetailPanel.tsx"),
    "utf8",
  );
  const lightbox = fs.readFileSync(
    path.join(root, "components", "MomentImageLightbox.tsx"),
    "utf8",
  );

  assert.doesNotMatch(photoWall, /到这儿去/);
  assert.match(panel, /albumPhotosByUrl|photoLocation/);
  assert.match(panel, /https:\/\/www\.google\.com\/maps\/search\//);
  assert.match(panel, /到这儿去/);
  assert.match(panel, /target="_blank"/);
  assert.match(panel, /rel="noopener noreferrer"/);
  assert.match(panel, /px-5 py-3 text-base/);
  assert.doesNotMatch(lightbox, /metadata|到这儿去|google\.com\/maps/);
});

test("shows photo notes below the lightbox image", () => {
  const photoWall = fs.readFileSync(
    path.join(root, "app", "photowall", "PhotoWallClient.tsx"),
    "utf8",
  );
  assert.match(photoWall, /className="mt-\[2dvh\][^"]*max-h-\[18dvh\]/);
  assert.match(photoWall, /w-fit[^"]*max-w-\[calc\(100vw-2rem\)\]/);
  assert.doesNotMatch(photoWall, /absolute bottom-10[^`]*selectedImage\.caption/);
});

test("does not depend on remote Google fonts during deployment", () => {
  const layout = fs.readFileSync(
    path.join(root, "app", "layout.tsx"),
    "utf8",
  );
  assert.doesNotMatch(layout, /next\/font\/google|Noto_Serif_SC|Geist\(/);
});

test("keeps the photo lightbox usable when the page is zoomed", () => {
  const photoWall = fs.readFileSync(
    path.join(root, "app", "photowall", "PhotoWallClient.tsx"),
    "utf8",
  );
  assert.match(photoWall, /fixed inset-0 z-\[100\][^"]*h-dvh/);
  assert.match(photoWall, /fixed inset-0 z-\[100\][^"]*items-center/);
  assert.match(photoWall, /flex min-h-0[^"]*flex-1/);
  assert.match(photoWall, /max-h-full max-w-full/);
  assert.match(photoWall, /max-h-\[18dvh\]/);
  assert.match(photoWall, /clamp\(1\.75rem,6vw,3rem\)/);

  const mobileBack = fs.readFileSync(
    path.join(root, "components", "MobileBackButton.tsx"),
    "utf8",
  );
  assert.match(mobileBack, /pathname\.startsWith\(["']\/photowall["']\)/);
});

test("desktop navigation retracts while scrolling down", () => {
  const navbar = fs.readFileSync(
    path.join(root, "components", "Navbar.tsx"),
    "utf8",
  );
  assert.match(navbar, /addEventListener\(["']scroll["']/);
  assert.match(navbar, /bg-\[#171812\]\/65/);
  assert.match(navbar, /backdrop-blur-2xl/);
  assert.match(navbar, /-translate-y-full/);
});

test("keeps the closed search below the desktop navigation", () => {
  const searchBar = fs.readFileSync(
    path.join(root, "components", "SearchBar.tsx"),
    "utf8",
  );

  assert.doesNotMatch(
    searchBar,
    /className="relative w-full max-w-2xl mx-auto mb-10 z-\[100\]"/,
  );
  assert.match(
    searchBar,
    /isOpen\s*\?\s*["']z-\[100\]["']\s*:\s*["']z-40["']/,
  );
});

test("keeps desktop navigation and layout on fine-pointer devices", () => {
  const styles = fs.readFileSync(
    path.join(root, "app", "globals.css"),
    "utf8",
  );
  const navbar = fs.readFileSync(
    path.join(root, "components", "Navbar.tsx"),
    "utf8",
  );
  const layout = fs.readFileSync(path.join(root, "app", "layout.tsx"), "utf8");
  const home = fs.readFileSync(path.join(root, "app", "page.tsx"), "utf8");

  assert.match(
    styles,
    /@custom-variant desktop \(@media \(min-width: 768px\), @media \(hover: hover\) and \(pointer: fine\)\);/,
  );
  assert.match(
    styles,
    /@custom-variant desktop-wide \(@media \(min-width: 1024px\), @media \(hover: hover\) and \(pointer: fine\)\);/,
  );
  assert.match(navbar, /hidden .*desktop:block/);
  assert.match(navbar, /desktop:hidden/);
  assert.match(layout, /desktop:hidden/);
  assert.equal((home.match(/desktop-wide:grid-cols-12/g) ?? []).length, 3);
  assert.doesNotMatch(home, /\b(?:md|lg):/);
});

test("provides a safe single-moment lookup and shared image lightbox", () => {
  const content = fs.readFileSync(
    path.join(root, "lib", "content.ts"),
    "utf8",
  );
  const lightboxPath = path.join(
    root,
    "components",
    "MomentImageLightbox.tsx",
  );

  assert.match(content, /export function getMoment\(id: string\)/);
  assert.match(
    content,
    /getMoments\(\)\.find\(\(moment\) => moment\.id === id\)/,
  );
  assert.ok(fs.existsSync(lightboxPath));
});

test("generates a static detail page for every moment", () => {
  const routePath = path.join(root, "app", "moments", "[id]", "page.tsx");
  const list = fs.readFileSync(
    path.join(root, "app", "moments", "MomentList.tsx"),
    "utf8",
  );

  assert.ok(fs.existsSync(routePath));
  const route = fs.readFileSync(routePath, "utf8");
  assert.match(route, /generateStaticParams/);
  assert.match(route, /getMoment\(resolvedParams\.id\)/);
  assert.match(list, /href=\{`\/moments\/\$\{moment\.id\}\/`\}/);
  assert.match(list, /absolute inset-0 z-10/);
  assert.match(list, /relative z-20/);
});

test("reserves scrollbar space so the fixed background never shifts", () => {
  const styles = fs.readFileSync(
    path.join(root, "app", "globals.css"),
    "utf8",
  );

  assert.match(styles, /html\s*\{[^}]*scrollbar-gutter:\s*stable;/s);
});

test("publishes Bilibili and GitHub on the homepage", () => {
  const config = fs.readFileSync(path.join(root, "siteConfig.ts"), "utf8");
  const profile = fs.readFileSync(
    path.join(root, "components", "ProfileCard.tsx"),
    "utf8",
  );

  assert.match(
    config,
    /bilibili:\s*"https:\/\/space\.bilibili\.com\/1283960511"/,
  );
  assert.match(config, /github:\s*"https:\/\/github\.com\/Chnlxy"/);
  assert.match(profile, /type="bilibili"/);
  assert.match(profile, /siteConfig\.social\?\.bilibili/);
});

test("uses the praying maiden loading label in the splash screen", () => {
  const splash = fs.readFileSync(
    path.join(root, "components", "SplashScreen.tsx"),
    "utf8",
  );
  const styles = fs.readFileSync(
    path.join(root, "app", "globals.css"),
    "utf8",
  );

  assert.match(splash, /少女祈祷中/);
  assert.equal((splash.match(/className="splash-dot"/g) ?? []).length, 3);
  assert.match(styles, /\.splash-dot\s*\{/);
  assert.match(styles, /@keyframes splash-dot/);
});

test("uses the animated praying-girl GIF on the splash screen", () => {
  const config = fs.readFileSync(path.join(root, "siteConfig.ts"), "utf8");
  const splash = fs.readFileSync(
    path.join(root, "components", "SplashScreen.tsx"),
    "utf8",
  );
  const asset = path.join(
    root,
    "public",
    "images",
    "splash-praying-girl.gif",
  );

  assert.match(
    config,
    /splashImageUrl:\s*"\/images\/splash-praying-girl\.gif"/,
  );
  assert.ok(fs.existsSync(asset));
  assert.match(splash, /siteConfig\.splashImageUrl/);
  assert.match(splash, /object-contain/);
  assert.match(splash, /pixelated/);
});

test("does not render a glowing ring around the splash artwork", () => {
  const splash = fs.readFileSync(
    path.join(root, "components", "SplashScreen.tsx"),
    "utf8",
  );
  const styles = fs.readFileSync(
    path.join(root, "app", "globals.css"),
    "utf8",
  );

  assert.doesNotMatch(splash, /splash-ring/);
  assert.doesNotMatch(styles, /\.splash-ring/);
  assert.doesNotMatch(styles, /@keyframes splash-spin/);
});

test("shows the splash background behind the GIF", () => {
  const splash = fs.readFileSync(
    path.join(root, "components", "SplashScreen.tsx"),
    "utf8",
  );

  assert.doesNotMatch(splash, /bg-white\/95/);
  assert.doesNotMatch(splash, /dark:bg-slate-900/);
  assert.doesNotMatch(splash, /shadow-xl/);
  assert.match(splash, /bg-transparent/);
});

test("uses the homepage illustration as the shared site avatar", () => {
  const config = fs.readFileSync(path.join(root, "siteConfig.ts"), "utf8");
  const profile = fs.readFileSync(
    path.join(root, "components", "ProfileCard.tsx"),
    "utf8",
  );

  assert.match(config, /avatarUrl:\s*"\/images\/avatars\/home\.webp"/);
  assert.doesNotMatch(config, /homeAvatarUrl/);
  assert.match(profile, /siteConfig\.avatarUrl/);
  assert.doesNotMatch(profile, /siteConfig\.homeAvatarUrl/);
});

test("replaces friend links with the anonymous guestbook", () => {
  const config = fs.readFileSync(path.join(root, "siteConfig.ts"), "utf8");
  const guestbookPath = path.join(root, "app", "guestbook", "page.tsx");
  const clientPath = path.join(
    root,
    "app",
    "guestbook",
    "GuestbookClient.tsx",
  );
  const redirectsPath = path.join(root, "public", "_redirects");

  assert.match(config, /name:\s*"留言"/);
  assert.match(config, /href:\s*"\/guestbook"/);
  assert.ok(fs.existsSync(guestbookPath));
  assert.ok(fs.existsSync(clientPath));
  assert.ok(fs.existsSync(redirectsPath));
  assert.equal(
    fs.existsSync(path.join(root, "app", "friends", "page.tsx")),
    false,
  );
});

test("ships a moderated public guestbook API", () => {
  const apiPath = path.join(root, "functions", "api", "guestbook.ts");
  const schemaPath = path.join(root, "functions", "schema.sql");

  assert.ok(fs.existsSync(apiPath));
  assert.ok(fs.existsSync(schemaPath));
  const api = fs.readFileSync(apiPath, "utf8");
  const schema = fs.readFileSync(schemaPath, "utf8");

  assert.match(api, /status\s*=\s*'approved'/);
  assert.match(api, /"pending"/);
  assert.match(api, /TURNSTILE_SECRET_KEY/);
  assert.match(api, /RATE_LIMIT_SECRET/);
  assert.match(schema, /CHECK \(status IN \('pending', 'approved', 'hidden'\)\)/);
});

test("protects guestbook moderation with a password session", () => {
  const authPath = path.join(root, "functions", "_lib", "admin-auth.mjs");
  const loginPath = path.join(root, "functions", "api", "admin", "login.ts");
  const sessionPath = path.join(
    root,
    "functions",
    "api",
    "admin",
    "session.ts",
  );
  const logoutPath = path.join(root, "functions", "api", "admin", "logout.ts");
  const adminApiPath = path.join(
    root,
    "functions",
    "api",
    "admin",
    "guestbook.ts",
  );
  const adminItemPath = path.join(
    root,
    "functions",
    "api",
    "admin",
    "guestbook",
    "[id].ts",
  );

  assert.ok(fs.existsSync(authPath));
  assert.ok(fs.existsSync(loginPath));
  assert.ok(fs.existsSync(sessionPath));
  assert.ok(fs.existsSync(logoutPath));
  assert.ok(fs.existsSync(adminApiPath));
  assert.ok(fs.existsSync(adminItemPath));
  const auth = fs.readFileSync(authPath, "utf8");
  const adminApi = fs.readFileSync(adminApiPath, "utf8");
  const adminItem = fs.readFileSync(adminItemPath, "utf8");

  assert.match(auth, /ADMIN_SESSION_SECRET/);
  assert.match(auth, /HttpOnly/);
  assert.match(adminApi, /requireAdminSession/);
  assert.match(adminItem, /requireAdminSession/);
  assert.match(adminItem, /validateModerationStatus/);
  assert.doesNotMatch(adminApi, /ACCESS_TEAM_DOMAIN|ACCESS_AUD/);
  assert.equal(
    fs.existsSync(path.join(root, "functions", "_lib", "access.mjs")),
    false,
  );
});

test("ships guestbook moderation controls", () => {
  const pagePath = path.join(
    root,
    "app",
    "admin",
    "guestbook",
    "page.tsx",
  );
  const clientPath = path.join(
    root,
    "app",
    "admin",
    "guestbook",
    "AdminGuestbookClient.tsx",
  );

  assert.ok(fs.existsSync(pagePath));
  assert.ok(fs.existsSync(clientPath));
  const client = fs.readFileSync(clientPath, "utf8");
  for (const status of ["pending", "approved", "hidden"]) {
    assert.match(client, new RegExp(status));
  }
  assert.match(client, /onRequest|PATCH|method:\s*["']PATCH["']/);
  assert.match(client, /method:\s*["']DELETE["']/);
});

test("protects guestbook moderation with an in-site password login", () => {
  const adminRoot = path.join(root, "app", "admin", "guestbook");
  const loginPath = path.join(adminRoot, "AdminLogin.tsx");
  const pagePath = path.join(adminRoot, "page.tsx");
  const clientPath = path.join(adminRoot, "AdminGuestbookClient.tsx");
  const helperPath = path.join(root, "scripts", "hash-admin-password.mjs");
  const packagePath = path.join(root, "package.json");

  assert.ok(fs.existsSync(loginPath));
  assert.ok(fs.existsSync(helperPath));

  const login = fs.readFileSync(loginPath, "utf8");
  const page = fs.readFileSync(pagePath, "utf8");
  const client = fs.readFileSync(clientPath, "utf8");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  assert.match(login, /type="password"/);
  assert.match(login, /NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
  assert.match(login, /\/api\/admin\/login/);
  assert.doesNotMatch(page, /Cloudflare Access/);
  assert.match(client, /\/api\/admin\/session/);
  assert.match(client, /\/api\/admin\/logout/);
  assert.match(packageJson.scripts["admin:hash"], /hash-admin-password/);
});

test("ships a real 3D travel globe with local earth textures", () => {
  const globePath = path.join(root, "components", "TravelGlobe.tsx");
  const dayTexture = path.join(
    root,
    "public",
    "images",
    "globe",
    "earth-day.jpg",
  );
  const nightTexture = path.join(
    root,
    "public",
    "images",
    "globe",
    "earth-night.jpg",
  );
  const mobileDayTexture = path.join(
    root,
    "public",
    "images",
    "globe",
    "earth-day-mobile.jpg",
  );
  const mobileNightTexture = path.join(
    root,
    "public",
    "images",
    "globe",
    "earth-night-mobile.jpg",
  );
  const mediumDayTexture = path.join(
    root,
    "public",
    "images",
    "globe",
    "earth-day-medium.jpg",
  );
  const mediumNightTexture = path.join(
    root,
    "public",
    "images",
    "globe",
    "earth-night-medium.jpg",
  );

  assert.ok(fs.existsSync(globePath));
  assert.ok(fs.existsSync(dayTexture));
  assert.ok(fs.existsSync(nightTexture));
  assert.ok(fs.existsSync(mobileDayTexture));
  assert.ok(fs.existsSync(mobileNightTexture));
  assert.ok(fs.existsSync(mediumDayTexture));
  assert.ok(fs.existsSync(mediumNightTexture));
  assert.ok(fs.statSync(dayTexture).size < 3 * 1024 * 1024);
  assert.ok(fs.statSync(nightTexture).size < 3 * 1024 * 1024);
  assert.ok(fs.statSync(mediumDayTexture).size > 400 * 1024);
  assert.ok(fs.statSync(mediumDayTexture).size < 800 * 1024);
  assert.ok(fs.statSync(mediumNightTexture).size > 180 * 1024);
  assert.ok(fs.statSync(mediumNightTexture).size < 500 * 1024);
  assert.ok(
    fs.statSync(mediumDayTexture).size +
      fs.statSync(mediumNightTexture).size <
      1100 * 1024,
  );

  const globe = fs.readFileSync(globePath, "utf8");
  assert.match(globe, /@react-three\/fiber/);
  assert.match(globe, /solarDirection/);
  assert.match(globe, /earth-day\.jpg/);
  assert.match(globe, /earth-night\.jpg/);
  assert.match(globe, /earth-day-medium\.jpg/);
  assert.match(globe, /earth-night-medium\.jpg/);
  assert.match(globe, /aria-label="旅行足迹地球"/);
  assert.doesNotMatch(globe, /\bHtml\b/);
  assert.match(globe, /CanvasTexture/);
  assert.match(globe, /markerHorizonVisibility/);
  assert.match(globe, /cylinderGeometry/);
  assert.match(globe, /MARKER_BEAM_HEIGHT/);
  assert.match(globe, /const MARKER_BEAM_HEIGHT = 0\.07;/);
  assert.match(globe, /const MARKER_BEAM_TOP_RADIUS = 0\.0012;/);
  assert.match(globe, /const MARKER_BEAM_BASE_RADIUS = 0\.0026;/);
  assert.match(globe, /const MARKER_CAP_RADIUS = 0\.005;/);
  assert.match(globe, /const MARKER_SURFACE_DOT_RADIUS = 0\.006;/);
  assert.match(globe, /const MARKER_HIT_RADIUS = 0\.018;/);
  assert.match(globe, /const MARKER_LABEL_STAGGER = 0\.09;/);
  assert.match(
    globe,
    /args=\{\[\s*MARKER_BEAM_TOP_RADIUS,\s*MARKER_BEAM_BASE_RADIUS,\s*MARKER_BEAM_HEIGHT,/,
  );
  assert.match(
    globe,
    /assignMarkerLabelTiers\(\[\s*hangzhouHome\.coordinates,\s*\.\.\.places\.map/,
  );
  assert.match(globe, /labelTier=\{labelTiers\[index \+ 1\]\}/);
  assert.match(globe, /labelTier \* MARKER_LABEL_STAGGER/);
  const labelHeight = Number(
    globe.match(/const MARKER_LABEL_HEIGHT = ([\d.]+);/)?.[1],
  );
  const labelStagger = Number(
    globe.match(/const MARKER_LABEL_STAGGER = ([\d.]+);/)?.[1],
  );
  assert.ok(labelStagger >= labelHeight);
  assert.equal(
    (globe.match(/blending=\{THREE\.AdditiveBlending\}/g) ?? []).length,
    3,
  );
  assert.equal((globe.match(/toneMapped=\{false\}/g) ?? []).length, 3);
  assert.equal((globe.match(/colorWrite=\{false\}/g) ?? []).length, 1);
  assert.match(globe, /resolveMarkerLabelVisibility/);
  assert.match(globe, /advanceLabelLayoutOpacity/);
  assert.match(globe, /labelLayoutRef/);
  assert.match(globe, /travelPlaceLabelPriority/);
  assert.match(
    globe,
    /selected\s*\?\s*SELECTED_LABEL_PRIORITY\s*:\s*labelPriority/,
  );
  assert.equal(
    (
      globe.match(
        /isLabelInteractive\(\s*layoutVisible\.current,\s*layoutOpacity\.current,/g,
      ) ?? []
    ).length,
    2,
  );
  assert.match(globe, /const MARKER_SURFACE_RADIUS = 1\.003;/);
  assert.equal(
    (globe.match(/radius=\{MARKER_SURFACE_RADIUS\}/g) ?? []).length,
    2,
  );
  assert.match(globe, /labelMaterial/);
  assert.doesNotMatch(
    globe,
    /group\.current\.visible\s*=\s*nextFrontFacing/,
  );
  assert.match(globe, /aria-label="地点列表"/);
  assert.match(globe, /#include <tonemapping_fragment>/);
  assert.match(globe, /#include <colorspace_fragment>/);
  assert.doesNotMatch(globe, /https:\/\/unpkg\.com/);
});

test("adds the footprints route and travel detail panel", () => {
  const config = fs.readFileSync(path.join(root, "siteConfig.ts"), "utf8");
  const pagePath = path.join(root, "app", "footprints", "page.tsx");
  const clientPath = path.join(
    root,
    "app",
    "footprints",
    "FootprintsClient.tsx",
  );
  const panelPath = path.join(root, "components", "TravelDetailPanel.tsx");

  assert.match(config, /name:\s*"足迹"/);
  assert.match(config, /href:\s*"\/footprints"/);
  assert.ok(fs.existsSync(pagePath));
  assert.ok(fs.existsSync(clientPath));
  assert.ok(fs.existsSync(panelPath));

  const client = fs.readFileSync(clientPath, "utf8");
  const panel = fs.readFileSync(panelPath, "utf8");
  assert.match(client, /TravelGlobe/);
  assert.match(client, /TravelDetailPanel/);
  assert.match(client, /selectedId/);
  assert.match(panel, /role="dialog"/);
  assert.match(panel, /event\.key === "Escape"/);
  assert.match(panel, /MomentImageLightbox/);
  assert.doesNotMatch(panel, /aria-modal="true"/);
  assert.doesNotMatch(panel, /fixed inset-0 z-\[70\]/);
});

test("detects WebGL once outside render and manages modal focus", () => {
  const client = fs.readFileSync(
    path.join(root, "app", "footprints", "FootprintsClient.tsx"),
    "utf8",
  );
  const panel = fs.readFileSync(
    path.join(root, "components", "TravelDetailPanel.tsx"),
    "utf8",
  );
  const globe = fs.readFileSync(
    path.join(root, "components", "TravelGlobe.tsx"),
    "utf8",
  );
  const webgl = fs.readFileSync(
    path.join(root, "lib", "webgl.ts"),
    "utf8",
  );

  assert.doesNotMatch(client, /useSyncExternalStore/);
  assert.match(client, /useEffect/);
  assert.match(client, /detectWebglSupport/);
  assert.match(client, /cachedWebglSupport/);
  assert.match(webgl, /WEBGL_lose_context/);
  assert.match(webgl, /loseContext/);

  assert.match(panel, /panelRef/);
  assert.match(panel, /lightboxIndexRef/);
  assert.doesNotMatch(panel, /event\.key\s*!==\s*"Tab"/);
  assert.match(panel, /\.focus\(\)/);
  assert.match(globe, /data-place-id/);
  assert.match(client, /data-place-id/);
  assert.match(client, /data-place-id=/);
  assert.match(client, /\.focus\(\)/);
  assert.match(client, /requestAnimationFrame/);
  assert.match(globe, /focusedPlaceId/);
  assert.match(globe, /onFocus/);
  assert.match(globe, /IntersectionObserver/);
  assert.match(globe, /正在加载地球纹理/);
  assert.doesNotMatch(globe, /setFrontFacing/);
});

test("fades the globe in after its textures load", () => {
  const globe = fs.readFileSync(
    path.join(root, "components", "TravelGlobe.tsx"),
    "utf8",
  );
  const styles = fs.readFileSync(
    path.join(root, "app", "globals.css"),
    "utf8",
  );

  assert.match(
    globe,
    /texturesReady\s*\?\s*"globe-canvas--ready"\s*:\s*"opacity-0"/,
  );
  assert.match(styles, /@keyframes globe-canvas-fade-in/);
  assert.match(styles, /\.globe-canvas--ready/);
  assert.match(styles, /animation:\s*globe-canvas-fade-in\s+700ms/);
  assert.match(globe, /aria-hidden=\{!globeLoading\}/);
});

test("resolves the texture tier before loading Earth images", () => {
  const globe = fs.readFileSync(
    path.join(root, "components", "TravelGlobe.tsx"),
    "utf8",
  );

  assert.match(globe, /useState<boolean \| null>\(null\)/);
  assert.match(
    globe,
    /const globeLoading =\s*desktopTextures === null \|\| !texturesReady/,
  );
  assert.match(
    globe,
    /desktopTextures !== null && \(\s*<Canvas/,
  );
  assert.match(globe, /aria-hidden=\{!globeLoading\}/);
  assert.match(
    globe,
    /globeLoading \? "opacity-100" : "opacity-0"/,
  );
});

test("animates the globe loading dots like the splash screen", () => {
  const globe = fs.readFileSync(
    path.join(root, "components", "TravelGlobe.tsx"),
    "utf8",
  );

  assert.match(globe, /正在加载地球纹理/);
  assert.equal((globe.match(/className="splash-dot"/g) ?? []).length, 3);
  assert.match(globe, /className="splash-dots"/);
  assert.doesNotMatch(globe, /正在加载地球纹理……/);
});

test("keeps a fading route during destination switches", () => {
  const globe = fs.readFileSync(
    path.join(root, "components", "TravelGlobe.tsx"),
    "utf8",
  );

  assert.match(globe, /outgoingRoute/);
  assert.match(globe, /fading/);
  assert.match(globe, /routeFadeOpacity/);
  assert.match(globe, /setOutgoingRoute/);
  assert.match(globe, /useLayoutEffect/);
});

test("lays out footprint details without covering page text", () => {
  const client = fs.readFileSync(
    path.join(root, "app", "footprints", "FootprintsClient.tsx"),
    "utf8",
  );
  const panel = fs.readFileSync(
    path.join(root, "components", "TravelDetailPanel.tsx"),
    "utf8",
  );
  const styles = fs.readFileSync(
    path.join(root, "app", "globals.css"),
    "utf8",
  );

  assert.match(client, /footprints-layout/);
  assert.match(client, /footprints-layout--panel-open/);
  assert.match(
    styles,
    /\.footprints-layout--panel-open\s+\.footprints-globe-stage\s*\{/,
  );
  assert.match(
    styles,
    /@media \(min-width: 1280px\)[\s\S]*?\.travel-detail-motion\s*\{[\s\S]*?position:\s*absolute;/,
  );
  assert.match(panel, /className="travel-detail-panel/);
  assert.doesNotMatch(panel, /fixed inset-x-3 bottom-3/);
  assert.doesNotMatch(panel, /document\.body\.style\.overflow = "hidden"/);
});

test("keeps the closing detail panel in its overlay position", () => {
  const styles = fs.readFileSync(
    path.join(root, "app", "globals.css"),
    "utf8",
  );

  assert.match(
    styles,
    /@media \(min-width: 1280px\)[\s\S]*?\.travel-detail-motion\s*\{[\s\S]*?position:\s*absolute;/,
  );
  assert.doesNotMatch(
    styles,
    /\.footprints-layout--panel-open\s+\.travel-detail-motion/,
  );
});

test("keeps footprints content vertically fixed during entry", () => {
  const transition = fs.readFileSync(
    path.join(root, "components", "PageTransition.tsx"),
    "utf8",
  );
  const footprints = fs.readFileSync(
    path.join(root, "app", "footprints", "page.tsx"),
    "utf8",
  );
  const client = fs.readFileSync(
    path.join(root, "app", "footprints", "FootprintsClient.tsx"),
    "utf8",
  );

  assert.match(transition, /offsetY\?:\s*number/);
  assert.match(transition, /initial=\{\{\s*y:\s*offsetY/);
  assert.match(footprints, /<PageTransition[^>]*offsetY=\{0\}/);
  assert.equal(
    (client.match(/min-h-\[520px\]/g) ?? []).length,
    3,
  );
});

test("animates footprint layout transitions smoothly", () => {
  const client = fs.readFileSync(
    path.join(root, "app", "footprints", "FootprintsClient.tsx"),
    "utf8",
  );
  const styles = fs.readFileSync(
    path.join(root, "app", "globals.css"),
    "utf8",
  );

  assert.match(client, /AnimatePresence/);
  assert.match(client, /motion\.div/);
  assert.match(client, /footprints-globe-backdrop/);
  assert.match(client, /footprints-globe-content/);
  assert.match(client, /travel-detail-motion/);
  assert.match(client, /height:\s*"auto"/);
  assert.match(client, /duration:\s*0\.3/);
  assert.doesNotMatch(
    styles,
    /transition:\s*grid-template-columns/,
  );
  assert.match(
    styles,
    /grid-template-columns:\s*minmax\(0,\s*1fr\);/,
  );
  assert.match(
    styles,
    /transition:\s*transform 300ms cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\);/,
  );
  assert.match(
    styles,
    /\.footprints-layout--panel-open\s+\.footprints-globe-stage\s*\{[\s\S]*transform:\s*translateX\(-205px\);/,
  );
  assert.doesNotMatch(
    styles,
    /\.footprints-layout--panel-open\s+\.footprints-globe-stage\s*\{[^}]*scale\(/,
  );
  assert.match(
    styles,
    /\.footprints-globe-backdrop\s*\{[^}]*width:\s*100%;[^}]*transition:\s*width 300ms cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\);/,
  );
  assert.match(
    styles,
    /\.footprints-layout--panel-open\s+\.footprints-globe-backdrop\s*\{[\s\S]*width:\s*calc\(100%\s*-\s*205px\);/,
  );
  assert.match(
    styles,
    /\.footprints-globe-content\s*\{[^}]*transition:[\s\S]*?transform 300ms cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\),[\s\S]*?clip-path 300ms/,
  );
  assert.match(
    styles,
    /\.footprints-layout--panel-open\s+\.footprints-globe-content\s*\{[\s\S]*transform:\s*translateX\(-102\.5px\);/,
  );
  assert.match(
    styles,
    /\.footprints-layout--panel-open\s+\.footprints-globe-content\s*\{[\s\S]*clip-path:\s*inset\(0\s+102\.5px\s+0\s+102\.5px\s+round\s+2rem\);/,
  );
});
