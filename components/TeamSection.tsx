"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import ImgBox from "@/components/ServiceImageBox";

export default function TeamSection({ title = <>Meet the Groutix <span className="text-accent">Team</span></> }: { title?: ReactNode }) {
  return (
    <AnimatedSection className="bg-white py-16 lg:py-24">
      <div className="max-w-[1460px] mx-auto px-6 lg:px-10 space-y-10">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="text-[13px] font-bold text-accent uppercase tracking-[0.2em]">The People Behind The Work</p>
          <h2 className="text-3xl lg:text-[42px] font-bold text-neutral-900 leading-tight">
            {title}
          </h2>
          <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
            The same small team handles your job from inspection through to the finished work, here&apos;s who you&apos;ll actually deal with.
          </p>
        </div>

        {/* Group photo */}
        <div className="max-w-4xl mx-auto">
          <ImgBox
            label="Group photo of Johnny and the team"
            aspect="aspect-[16/9] md:aspect-[21/9]"
            className="rounded-sm"
          />
        </div>

        {/* Team members */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            { name: "Johnny", role: "Technician", avatar: "" },
            { name: "Max", role: "Technician", avatar: "" },
          ].map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-neutral-50 border border-neutral-200 rounded-sm p-6 flex items-center gap-5"
            >
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-accent shadow-sm bg-neutral-100 flex items-center justify-center">
                {member.avatar ? (
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Users className="w-8 h-8 text-neutral-300" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-xl">{member.name}</h3>
                <p className="text-accent text-[14px] font-bold">Role: {member.role}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/contact"
            className="inline-block bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-sm text-base transition-colors active:scale-95"
          >
            Talk to Our Team
          </Link>
        </div>
      </div>
    </AnimatedSection>
  );
}
