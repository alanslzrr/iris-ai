"use client";
import { Card, Column, Row, Text, Button } from '@once-ui-system/core';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../motion/variants';

type Props = {
  icon: React.ReactNode;
  title: string;
  tagline: string;
  bullets: string[];
  onViewDetails: () => void;
};

export default function ServiceCard({ icon, title, tagline, bullets, onViewDetails }: Props) {
  return (
    <motion.div variants={fadeInUp}>
      <Card radius="xl" border="neutral-alpha-medium" padding="24" background="neutral-alpha-weak" style={{ background: 'rgba(0,0,0,0.24)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Column gap="16">
          <Row gap="12" vertical="center">
            {icon}
            <Text variant="label-default-l" onBackground="neutral-strong">{title}</Text>
          </Row>
          <Text variant="label-default-xs" onBackground="neutral-weak">{tagline}</Text>
          <Column gap="8">
            {bullets.map((b) => (
              <Row key={b} gap="8" vertical="center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                <Text variant="label-default-xs" onBackground="neutral-weak">{b}</Text>
              </Row>
            ))}
          </Column>
          <Row>
            <Button size="m" variant="secondary" onClick={onViewDetails}>View details</Button>
          </Row>
        </Column>
      </Card>
    </motion.div>
  );
}


