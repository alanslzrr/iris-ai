// src/app/layout.tsx

import '@once-ui-system/core/css/styles.css';
import '@once-ui-system/core/css/tokens.css';
import '../styles/scheme.scss';

import { Inter } from 'next/font/google';
import './globals.css';
import '../styles/layout.css';
import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/session-provider';

import classNames from "classnames";
import { getBaseUrl } from "@/lib/utils";
import { 
  Column, 
  ThemeProvider, 
  DataThemeProvider, 
  ToastProvider, 
  IconProvider, 
  LayoutProvider,
  Theme,
  Schemes,
  NeutralColor,
  SolidType,
  SolidStyle,
  BorderStyle,
  SurfaceStyle,
  TransitionStyle,
  ScalingSize,
  ChartVariant,
  ChartMode
} from "@once-ui-system/core";
import { fonts, style, dataStyle } from "../../once-ui.config";

const primary = Inter({
    variable: '--font-primary',
    subsets: ['latin'],
    display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl() || 'http://localhost:3000'),
  title: 'IRIS AI - Inspection and Review Intelligence System',
  description:
    'AI-powered validation system that automatically reviews calibration certificates against manufacturer specifications, ISO/IEC 17025 requirements, and customer-specific policies.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <>
      <Column
        as="html"
        lang="en"
        suppressHydrationWarning
        className={classNames(
          primary.className,
          fonts.primary.variable,
          fonts.secondary.variable,
          fonts.tertiary.variable,
          fonts.code.variable,
          // Apply shadcn examples theme look & scale
          'min-h-full dark theme-default theme-scaled'
        )}
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    const root = document.documentElement;
                    
                    // Set default Once UI theme attributes
                    root.setAttribute('data-theme', 'dark');
                    root.setAttribute('data-neutral', '${style.neutral}');
                    root.setAttribute('data-brand', '${style.brand}');
                    root.setAttribute('data-accent', '${style.accent}');
                    root.setAttribute('data-solid', '${style.solid}');
                    root.setAttribute('data-solid-style', '${style.solidStyle}');
                    root.setAttribute('data-border', '${style.border}');
                    root.setAttribute('data-surface', '${style.surface}');
                    root.setAttribute('data-transition', '${style.transition}');
                    root.setAttribute('data-scaling', '${style.scaling}');
                    root.setAttribute('data-viz-style', '${dataStyle.mode}');
                    
                    // Load saved preferences from localStorage
                    const styleKeys = ['theme', 'neutral', 'brand', 'accent', 'solid', 'solid-style', 'viz-style', 'border', 'surface', 'transition', 'scaling'];
                    styleKeys.forEach(key => {
                      const value = localStorage.getItem('data-' + key);
                      if (value) {
                        root.setAttribute('data-' + key, value);
                      }
                    });
                  } catch (e) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                })();
              `,
            }}
          />
        </head>
        <ThemeProvider
          theme={style.theme as Theme}
          brand={style.brand as Schemes}
          accent={style.accent as Schemes}
          neutral={style.neutral as NeutralColor}
          solid={style.solid as SolidType}
          solidStyle={style.solidStyle as SolidStyle}
          border={style.border as BorderStyle}
          surface={style.surface as SurfaceStyle}
          transition={style.transition as TransitionStyle}
          scaling={style.scaling as ScalingSize}
        >
          <DataThemeProvider
            variant={dataStyle.variant as ChartVariant}
            mode={dataStyle.mode as ChartMode}
            height={dataStyle.height}
            axis={{
              stroke: dataStyle.axis.stroke
            }}
            tick={{
              fill: dataStyle.tick.fill,
              fontSize: dataStyle.tick.fontSize,
              line: dataStyle.tick.line
            }}
          >
            <LayoutProvider>
              <ToastProvider>
                <IconProvider>
                  <Column background="page" as="body" fillWidth margin="0" padding="0" style={{ minHeight: "100vh" }}>
                    <AuthProvider>
                      {children}
                      <Toaster />
                    </AuthProvider>
                  </Column>
                </IconProvider>
              </ToastProvider>
            </LayoutProvider>
          </DataThemeProvider>
        </ThemeProvider>
      </Column>
    </>
  );
}
