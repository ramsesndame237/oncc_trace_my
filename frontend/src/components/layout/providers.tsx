"use client";

import { PollingProvider } from "@/core/infrastructure/providers/PollingProvider";
import { NextAuthProvider, SessionSyncProvider } from "@/features/auth";
import { I18nProvider } from "@/i18n";
import { RegisterPWA } from "@/components/pwa";
import NiceModal from "@ebay/nice-modal-react";
import NextTopLoader from "nextjs-toploader";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <I18nProvider>
        <NuqsAdapter>
          <NextAuthProvider>
            <SessionSyncProvider>
              <PollingProvider>
                <NiceModal.Provider>
                  {children}
                </NiceModal.Provider>
              </PollingProvider>
            </SessionSyncProvider>
          </NextAuthProvider>
          <NextTopLoader
            color="#3a5839"
            initialPosition={0.08}
            crawlSpeed={200}
            height={4}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #3a5839,0 0 5px #3a5839"
          />
        </NuqsAdapter>
      </I18nProvider>
      <RegisterPWA />
    </>
  );
}
