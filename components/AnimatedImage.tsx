"use client";
import React from "react";
import { motion } from "framer-motion";

interface AnimatedImageProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function AnimatedImage({
  children,
  className = "",
  delay = 0,
}: AnimatedImageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
