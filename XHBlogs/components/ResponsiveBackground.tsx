import type { CSSProperties } from "react";
import { siteConfig } from "../siteConfig";

export default function ResponsiveBackground() {
  const background = siteConfig.backgroundConfig;
  const pictureStyle = {
    "--desktop-position": background.desktopPosition,
  } as CSSProperties;

  return (
    <div className="site-background" aria-hidden="true">
      <picture style={pictureStyle}>
        <source media="(min-width: 768px)" srcSet={background.desktop} />
        <img
          src={background.mobile}
          alt=""
          fetchPriority="high"
          style={{ objectPosition: background.mobilePosition }}
        />
      </picture>
      <div className="site-background__wash" />
      <div className="site-background__grain" />
    </div>
  );
}
