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
  for (const label of ["首页", "归档", "照片墙", "说说", "友链", "关于"]) {
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
    "welcome-to-fantasy.md",
  ]);
  assert.equal(moments.length, 5);
  assert.ok(fs.existsSync(path.join(root, "public", "avatar-placeholder.svg")));
  assert.ok(fs.existsSync(path.join(root, "public", "images", "covers", "default-cover.svg")));
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
    path.join(root, "data", "friends.ts"),
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
    /url:\s*["']\/images\/albums\/travel-silhouettes\/26\.webp["'],\s*caption:\s*["']涩谷sky["']/,
  );
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
