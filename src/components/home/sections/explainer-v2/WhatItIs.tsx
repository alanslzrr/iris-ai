"use client";
import { motion } from 'framer-motion';
import { containerStagger, fadeInUp, slideInRight } from '../../motion/variants';
import { Card, Column, Row, Text, Badge } from '@once-ui-system/core';
import RealtimeStream from '../../illustrations/RealtimeStream';

export default function WhatItIsV2() {
  return (
    <section className="mx-auto max-w-7xl px-[32px] mt-32 mb-32">
      <motion.div variants={containerStagger()} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Column gap="24">
            <Badge title="AI-Powered Validation" icon="sparkle" paddingX="16" paddingY="8" background="brand-alpha-weak" onBackground="brand-medium" radius="l" />
            <motion.div variants={fadeInUp}>
              <Text variant="heading-default-xl" onBackground="neutral-strong" wrap="balance">
                What is IRIS AI?
              </Text>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <Text variant="body-default-xl" onBackground="neutral-weak" wrap="balance">
                An AI validation system that reviews calibration certificates against ISO/IEC 17025, manufacturer specs, and your policies.
              </Text>
            </motion.div>
            <Row gap="16" className="flex-wrap">
              <motion.div variants={fadeInUp}><Badge title="Automated" icon="sparkle" paddingX="16" paddingY="8" background="brand-alpha-weak" onBackground="brand-medium" radius="m" /></motion.div>
              <motion.div variants={fadeInUp}><Badge title="Real-time" icon="check" paddingX="16" paddingY="8" background="accent-alpha-weak" onBackground="accent-medium" radius="m" /></motion.div>
              <motion.div variants={fadeInUp}><Badge title="Compliant" icon="security" paddingX="16" paddingY="8" background="brand-alpha-weak" onBackground="brand-medium" radius="m" /></motion.div>
            </Row>
          </Column>
          <motion.div variants={slideInRight}>
            <Card fillWidth radius="xl" border="neutral-alpha-medium" padding="24" background="neutral-alpha-weak" style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <RealtimeStream className="w-full h-[280px]" />
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}


