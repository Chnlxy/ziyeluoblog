"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function PageTransition({
  children,
  className = "",
  offsetY = 20,
}: {
  children: ReactNode;
  className?: string;
  offsetY?: number;
}) {
  return (
    <motion.div
      // 刚加载页面时：按页面需要轻微下移，完全透明
      initial={{ y: offsetY, opacity: 0 }}
      // 加载完毕后：回到原位，完全不透明
      animate={{ y: 0, opacity: 1 }}
      // 动画怎么演：用优雅的弹性物理动画，持续 0.8 秒
      transition={{ ease: "easeOut", duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
