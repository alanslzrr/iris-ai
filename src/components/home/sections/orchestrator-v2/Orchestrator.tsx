"use client";
import { motion } from 'framer-motion';
import { containerStagger, fadeInUp, slideInLeft } from '../../motion/variants';
import { Card, Column, Row, Text, Badge } from '@once-ui-system/core';
import { Workflow, DatabaseBackup, Activity } from 'lucide-react';
import BatchOrchestrator from '../../illustrations/BatchOrchestrator';

export default function OrchestratorV2() {
  return (
    <section className="mx-auto max-w-7xl px-[32px] mt-32 mb-32">
      <motion.div variants={containerStagger()} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={slideInLeft}>
            <Card
              fillWidth
              radius="xl"
              padding="24"
              background="neutral-alpha-weak"
              border="neutral-alpha-medium"
              style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <BatchOrchestrator className="w-full h-[280px]" />
            </Card>
          </motion.div>
          <Column gap="24">
            <Badge title="Batch Processing" icon="sparkle" paddingX="16" paddingY="8" background="accent-alpha-weak" onBackground="accent-medium" radius="l" />
            <motion.div variants={fadeInUp}>
              <Text variant="heading-default-xl" onBackground="neutral-strong" wrap="balance">Orchestrate Your Validation Workflow</Text>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <Text variant="body-default-xl" onBackground="neutral-weak" wrap="balance">Parallel processing, intelligent queuing, and real-time progress tracking.</Text>
            </motion.div>
            <Column gap="16">
              <Row gap="12" vertical="center">
                <Workflow className="w-5 h-5 text-neutral-400" aria-hidden="true" />
                <Text variant="label-default-m" onBackground="neutral-strong">Parallel Processing</Text>
              </Row>
              <Row gap="12" vertical="center">
                <DatabaseBackup className="w-5 h-5 text-neutral-400" aria-hidden="true" />
                <Text variant="label-default-m" onBackground="neutral-strong">Intelligent Queuing</Text>
              </Row>
              <Row gap="12" vertical="center">
                <Activity className="w-5 h-5 text-neutral-400" aria-hidden="true" />
                <Text variant="label-default-m" onBackground="neutral-strong">Progress Tracking</Text>
              </Row>
            </Column>
          </Column>
        </div>
      </motion.div>
    </section>
  );
}


