"use client";
import { motion } from 'framer-motion';
import { containerStagger, fadeInUp, pulseGlow } from '../../motion/variants';
import { Card, Column, Row, Text, Button, Badge } from '@once-ui-system/core';
import { ArrowRight } from 'lucide-react';

export default function CtaV2() {
  return (
    <section className="mx-auto max-w-7xl px-[32px] mt-32 mb-32">
      <motion.div variants={containerStagger()} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <Card fillWidth radius="xl" border="neutral-alpha-medium" padding="48" background="neutral-alpha-weak" style={{ position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,0.24)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Column gap="24" horizontal="center" className="relative z-10 text-center items-center max-w-3xl mx-auto">
            <Badge title="Ready to get started" icon="sparkle" paddingX="16" paddingY="8" background="brand-alpha-weak" onBackground="brand-medium" radius="l" />
            <motion.div variants={fadeInUp}><Text variant="heading-default-xl" onBackground="neutral-strong">Access dashboards, results, and batch orchestration</Text></motion.div>
            <motion.div variants={fadeInUp}><Text variant="body-default-l" onBackground="neutral-weak" className="mx-auto" style={{ maxWidth: '700px' }}>Experience automated calibration certificate validation with real-time results and comprehensive dashboards.</Text></motion.div>
            <motion.div variants={fadeInUp}>
              <Row gap="16" className="flex-wrap justify-center">
                <Button href="/login" size="l" variant="primary" radius="top-left">
                  <Row gap="12" vertical="center">
                    <Text variant="label-default-l">Log in</Text>
                    <ArrowRight className="w-6 h-6" />
                  </Row>
                </Button>
              </Row>
            </motion.div>
          </Column>
        </Card>
      </motion.div>
    </section>
  );
}


