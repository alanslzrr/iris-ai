// src/components/home/sections/services-v3/Services.tsx
"use client";

import { Column, Text, Badge, Row } from "@once-ui-system/core";
import { containerStagger, fadeInUp } from "../../motion/variants";
import { motion } from "framer-motion";
import { servicesContent } from "@/constants/services";
import RequirementsFlow from "../../illustrations/RequirementsFlow";
import PhoenixCalibrationAnimation from "../../illustrations/PhoenixCalibrationAnimation";
import CmcPipeline from "../../illustrations/CmcPipeline";


function StepNum({ n }: { n: number }) {
  // Minimal, professional step badge: neutral bg, subtle border, tabular numerals
  return (
    <span
      className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-1 text-[11px] font-medium leading-[22px] text-white/80 tabular-nums"
      aria-label={`Step ${n}`}
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

export default function ServicesV3() {
  return (
    <section className="mx-auto max-w-7xl px-[32px] mt-32 mb-32">
      <motion.div
        variants={containerStagger(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {/* Section header */}
        <Column gap="24" horizontal="center" className="text-center mb-12">
          <Badge
            title="Core Services"
            icon="sparkle"
            paddingX="16"
            paddingY="8"
            background="brand-alpha-weak"
            onBackground="brand-medium"
            radius="l"
          />
          <motion.div variants={fadeInUp}>
            <Text variant="heading-default-xl" onBackground="neutral-strong">
              Comprehensive Validation Services
            </Text>
          </motion.div>
          <motion.div variants={fadeInUp}>
            <Text
              variant="body-default-xl"
              onBackground="neutral-weak"
              className="max-w-3xl"
            >
              The platform delivers three pillars: Requirements verification,
              Tolerance evaluation and CMC assessment—fast, rigorous, and
              auditable.
            </Text>
          </motion.div>
        </Column>

        {/* Services */}
        <Column gap="56">
          {servicesContent.map((service) => {
            // placement: info left except CMC (info right)
            const infoFirst = service.id !== "cmc";

            return (
              <motion.div
                key={service.id}
                variants={fadeInUp}
                className="grid grid-cols-1 lg:grid-cols-2 items-start gap-12"
                aria-labelledby={`${service.id}-title`}
              >
                {/* Info — TEXT ONLY (no backgrounds, borders, or chips) */}
                <div className={`order-1 ${infoFirst ? "lg:order-1" : "lg:order-2"}`}>
                  <div className="space-y-2 max-w-[620px] xl:max-w-[660px]">
                    {/* Title — larger, white text with report-viewer style gradient underline (no icon) */}
                    <h3
                      id={`${service.id}-title`}
                      className="underline-phoenix underline-phoenix--fit underline-phoenix--tightest text-[24px] font-semibold text-white"
                    >
                      {service.title}
                    </h3>

                    {/* Tagline */}
                    <p className="text-sm leading-6 text-white/70 max-w-prose">
                      {service.tagline}
                    </p>

                    {/* Highlights — simple bullets */}
                    <ul className="list-disc pl-5 marker:text-white/50 space-y-1.5 mt-3">
                      {service.bullets.map((b) => (
                        <li key={b} className="text-sm leading-6 text-white/75">
                          {b}
                        </li>
                      ))}
                    </ul>

                    {/* Sections */}
                    <div className="space-y-8 mt-6">
                      {/* Process: How it works / Pipeline → numbered list */}
                      {service.sections
                        .filter((s) => /how it works|pipeline/i.test(s.heading))
                        .map((sec) => (
                          <section key={sec.heading} className="space-y-2">
                            <div className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                              Process
                            </div>
                            <h4 className="text-[15px] font-semibold text-white">
                              {sec.heading}
                            </h4>
                            <ol className="space-y-2">
                              {sec.items.map((it, i) => (
                                <li key={it} className="flex gap-3">
                                  <StepNum n={i + 1} />
                                  <span className="text-sm leading-6 text-white/75">
                                    {it}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </section>
                        ))}

                      {/* Outcomes: Results / Benefits → checkmark list (plain text) */}
                      {service.sections
                        .filter((s) => /results|benefits/i.test(s.heading))
                        .map((sec) => (
                          <section key={sec.heading} className="space-y-2">
                            <div className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                              Outcomes
                            </div>
                            <h4 className="text-[15px] font-semibold text-white">
                              {sec.heading}
                            </h4>
                            <ul className="space-y-2 md:space-y-0 md:flex md:flex-wrap md:gap-x-10 md:gap-y-2">
                              {sec.items.map((it) => (
                                <li key={it} className="flex items-center gap-2">
                                  <span aria-hidden className="text-[#8bc34a]">✓</span>
                                  <span className="text-sm leading-6 text-white/80">
                                    {it}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </section>
                        ))}

                      {/* Any remaining sections → two columns of simple bullets */}
                      {service.sections
                        .filter(
                          (s) =>
                            !/how it works|pipeline|results|benefits/i.test(
                              s.heading
                            )
                        )
                        .map((sec) => (
                          <section key={sec.heading} className="space-y-2">
                            <h4 className="text-[15px] font-semibold text-white">
                              {sec.heading}
                            </h4>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 list-disc pl-5 marker:text-white/50">
                              {sec.items.map((it) => (
                                <li key={it} className="text-sm leading-6 text-white/75">
                                  {it}
                                </li>
                              ))}
                            </ul>
                          </section>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Animation column (unchanged) */}
                <div className={`order-2 ${infoFirst ? "lg:order-2" : "lg:order-1"}`}>
                  {service.id === "requirements" && (
                    <RequirementsFlow className="w-full h-[300px] md:h-[360px]" />
                  )}
                  {service.id === "tolerance" && (
                    <PhoenixCalibrationAnimation className="w-full h-[320px]" cycleSeconds={6} />
                  )}
                  {service.id === "cmc" && (
                    <CmcPipeline className="w-full min-h-[360px]" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </Column>
      </motion.div>
    </section>
  );
}
