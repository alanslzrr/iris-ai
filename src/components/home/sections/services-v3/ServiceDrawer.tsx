// ServiceDrawer.tsx

"use client";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Column, Row, Text } from '@once-ui-system/core';
import RequirementsFlow from '../../illustrations/RequirementsFlow';
import PhoenixCalibrationAnimation from '../../illustrations/PhoenixCalibrationAnimation';
import CmcPipeline from '../../illustrations/CmcPipeline';
import { ServiceContent } from '@/constants/services';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  service: ServiceContent;
};

export default function ServiceDrawer({ open, onOpenChange, service }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogTitle>{service.title}</DialogTitle>
        <Column gap="16">
          <Text variant="body-default-m" onBackground="neutral-weak">{service.tagline}</Text>
          {service.id === 'requirements' && (
            <RequirementsFlow className="w-full h-[240px]" />
          )}
          {service.id === 'tolerance' && (
            <PhoenixCalibrationAnimation className="w-full" />
          )}
          {service.id === 'cmc' && (
            <CmcPipeline className="w-full min-h-[320px] md:min-h-[380px] lg:min-h-[440px]" />
          )}
          {service.sections.map((s) => (
            <Column key={s.heading} gap="8">
              <Text variant="label-default-l" onBackground="neutral-strong">{s.heading}</Text>
              <Column gap="8">
                {s.items.map((it) => (
                  <Text key={it} variant="label-default-xs" onBackground="neutral-weak">{it}</Text>
                ))}
              </Column>
            </Column>
          ))}
        </Column>
      </DialogContent>
    </Dialog>
  );
}


