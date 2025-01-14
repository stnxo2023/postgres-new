'use client'

import 'chart.js/auto'
import 'chartjs-adapter-date-fns'

import { LazyMotion, m } from 'framer-motion'
import { Loader } from 'lucide-react'
import { PropsWithChildren } from 'react'
import { TooltipProvider } from '~/components/ui/tooltip'
import { useDatabasesQuery } from '~/data/databases/databases-query'
import {
  currentDomainHostname,
  currentDomainUrl,
  legacyDomainHostname,
  legacyDomainUrl,
} from '~/lib/util'
import { useApp } from './app-provider'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Header } from './layout/header/header'
import { SetModelProviderDialog } from '~/components/model-provider/set-model-provider-dialog'
import Link from 'next/link'
import { SupabaseIcon } from './supabase-icon'

const loadFramerFeatures = () => import('./framer-features').then((res) => res.default)

export type LayoutProps = PropsWithChildren

export default function Layout({ children }: LayoutProps) {
  const {
    user,
    modelProvider,
    isLegacyDomain,
    isLegacyDomainRedirect,
    isModelProviderDialogOpen,
    setIsModelProviderDialogOpen,
  } = useApp()

  const { data: databases, isLoading: isLoadingDatabases } = useDatabasesQuery()
  const isAuthRequired = user === undefined && modelProvider.state?.enabled !== true

  return (
    <LazyMotion features={loadFramerFeatures}>
      <TooltipProvider delayDuration={0}>
        <div className="w-full h-full flex flex-col overflow-hidden">
          <div className="hidden lg:flex flex-col">
            {(isLegacyDomain || isLegacyDomainRedirect) && <RenameBanner />}
          </div>
          {!isAuthRequired || (!!databases?.length && databases.length > 0) ? (
            <Header />
          ) : (
            <div className="fixed top-8 left-8 w-[419px] max-w-full hidden lg:flex justify-between z-20">
              <span className="text-sm text-muted-foreground font-mono">database.build</span>
              <Link
                href="https://supabase.com"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground font-mono cursor-pointer hover:text-foreground"
              >
                <SupabaseIcon className="w-4 h-4" />
                <span className="border-b">a Supabase experiment</span>
              </Link>
            </div>
          )}
          <main className="flex-1 flex flex-col lg:flex-row min-h-0">
            <m.div layout="position" className="w-full h-full min-w-0 min-h-0">
              {children}
            </m.div>
          </main>
        </div>
        <RenameDialog />
        <SetModelProviderDialog
          open={isModelProviderDialogOpen}
          onOpenChange={setIsModelProviderDialogOpen}
        />
      </TooltipProvider>
    </LazyMotion>
  )
}

function RenameBanner() {
  const { setIsRenameDialogOpen } = useApp()

  return (
    <div className="px-3 py-3 flex justify-center text-sm text-center bg-neutral-800 text-white">
      <span>
        Heads up - <strong>{legacyDomainHostname}</strong> is renaming to{' '}
        <strong>{currentDomainHostname}</strong>.{' '}
        <a className="cursor-pointer underline" onClick={() => setIsRenameDialogOpen(true)}>
          Why?
        </a>
      </span>
    </div>
  )
}

function RenameDialog() {
  const { isRenameDialogOpen, setIsRenameDialogOpen, dbManager, isLegacyDomain } = useApp()
  const { data: databases, isLoading: isLoadingDatabases } = useDatabasesQuery()

  return (
    <Dialog open={isRenameDialogOpen} onOpenChange={(open) => setIsRenameDialogOpen(open)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Heads up - {legacyDomainHostname} is renaming to {currentDomainHostname}
          </DialogTitle>
          <div className="py-2 border-b" />
        </DialogHeader>

        <h3 className="font-bold">Why rename?</h3>

        <p>
          This project is not an official Postgres project and we don&apos;t want to mislead anyone!
          We&apos;re renaming to{' '}
          <Link href={currentDomainUrl} className="underline">
            {currentDomainHostname}
          </Link>{' '}
          because, well, that&apos;s what this does. This will still be 100% Postgres-focused, just
          with a different URL.
        </p>

        <div className="my-2 border-b" />

        {isLegacyDomain && isLoadingDatabases ? (
          <div className="self-stretch flex justify-center items-center">
            <Loader className="animate-spin" size={36} strokeWidth={0.75} />
          </div>
        ) : (
          <m.div
            className="flex flex-col gap-4"
            variants={{
              hidden: { opacity: 0, y: -10 },
              show: { opacity: 1, y: 0 },
            }}
            initial="hidden"
            animate="show"
          >
            {isLegacyDomain && databases && databases.length === 0 ? (
              <>
                <h3 className="font-bold">No action required</h3>

                <p>
                  Looks like you don&apos;t have any existing databases that you need to transfer.
                </p>

                <p>
                  {' '}
                  Head on over to{' '}
                  <a href={currentDomainUrl} className="underline">
                    {currentDomainHostname}
                  </a>{' '}
                  to get started.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-bold">Action required</h3>

                <div className="prose">
                  {isLegacyDomain && databases ? (
                    <>
                      You have {databases.length} existing{' '}
                      {databases.length === 1 ? 'database' : 'databases'} on {legacyDomainHostname}.
                      If you wish to continue using {databases.length === 1 ? 'it' : 'them'}, you
                      will need to{' '}
                      <Link
                        className="underline"
                        href={`${legacyDomainUrl}/export`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        export
                      </Link>{' '}
                      {databases.length === 1 ? 'it' : 'them'}, then{' '}
                      <Link
                        className="underline"
                        href={`${currentDomainUrl}/import`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        import
                      </Link>{' '}
                      {databases.length === 1 ? 'it' : 'them'} at {currentDomainHostname}.
                    </>
                  ) : (
                    <>
                      If you have existing database on {legacyDomainHostname} and wish continue
                      using them, you will need to{' '}
                      <Link
                        className="underline"
                        href={`${legacyDomainUrl}/export`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        export
                      </Link>{' '}
                      them, then{' '}
                      <Link
                        className="underline"
                        href={`${currentDomainUrl}/import`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        import
                      </Link>{' '}
                      them at {currentDomainHostname}.
                    </>
                  )}
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1" className="border rounded-md">
                    <AccordionTrigger className="p-0 gap-2 px-3 py-2">
                      <div className="flex gap-2 items-center font-normal text-lighter text-sm">
                        <span>Why do I need to export my databases?</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-3 prose prose-sm">
                      <p>
                        Since PGlite databases are stored in your browser&apos;s IndexedDB storage,
                        other domains like{' '}
                        <a href={currentDomainUrl} className="underline">
                          {currentDomainHostname}
                        </a>{' '}
                        cannot access them directly (this is a security restriction built into every
                        browser).
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <p className="prose">
                  To transfer your databases:
                  <ol>
                    <li>
                      Navigate to{' '}
                      <Link className="underline" href={`${legacyDomainUrl}/export`}>
                        {legacyDomainHostname}/export
                      </Link>{' '}
                      and click <strong>Export</strong>
                    </li>
                    <li>
                      Navigate to{' '}
                      <Link className="underline" href={`${currentDomainUrl}/import`}>
                        {currentDomainHostname}/import
                      </Link>{' '}
                      and click <strong>Import</strong>
                    </li>
                  </ol>
                </p>
              </>
            )}
          </m.div>
        )}
      </DialogContent>
    </Dialog>
  )
}
