"use client"

import { Icon } from "@/components/icon"
import PageHeader from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { useNavigationStore } from "@/core/infrastructure/store/navigationStore"
import { useIsMobile } from "@/hooks/use-mobile"
import { useRouter, useSearchParams } from "next/navigation"
import React from "react"
import { useTranslation } from "react-i18next"
import { useStandardAddFormStore } from "../../../../infrastructure/store/standardAddFormStore"

interface StandardFormLayoutProps {
  children: React.ReactNode
  className?: string
  onHandleCancel?: () => void
  title?: string
}

export function StandardFormLayout({
  children,
  className,
  onHandleCancel,
  title,
}: StandardFormLayoutProps) {
  const { t } = useTranslation("productTransfer")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getReturnPath, clearReturnPath } = useNavigationStore()
  const {
    entityId,
    isEditMode,
    hasUnsavedChanges,
    resetForm,
    initializeForm,
  } = useStandardAddFormStore()

  const urlEntityId = searchParams.get("entityId") || undefined
  const editOffline = searchParams.has("editOffline")

  const [isMobile, setIsMobile] = React.useState(false)
  const useMobile = useIsMobile()

  React.useEffect(() => {
    setIsMobile(useMobile)
  }, [useMobile])

  // Initialiser le formulaire au chargement
  React.useEffect(() => {
    if (urlEntityId !== entityId) {
      initializeForm(urlEntityId, editOffline)
    }
  }, [entityId, initializeForm, editOffline, urlEntityId])

  // Déterminer le titre en fonction du mode (création ou édition) ou utiliser le titre fourni
  const pageTitle =
    title ||
    (isEditMode ? t("form.edit.title") : t("form.createStandard"))

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(t("form.messages.unsavedChanges"))
      if (!confirmLeave) return
    }
    resetForm()

    // Si en mode editOffline, retourner à la outbox
    if (editOffline) {
      router.replace("/outbox")
      return
    }

    // Récupérer la page de retour sauvegardée
    const returnPath = getReturnPath()

    // Nettoyer le chemin de retour du store
    clearReturnPath()

    // Naviguer vers la page de retour ou quick-menu par défaut
    router.replace(returnPath || "/quick-menu")
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <PageHeader
        title={pageTitle}
        rightContent={[
          <Button
            variant={isMobile ? "link" : "outline"}
            key="cancel"
            size="sm"
            onClick={onHandleCancel || handleCancel}
          >
            <Icon name="X" />
            <span className="hidden lg:block">{t("form.actions.cancel")}</span>
          </Button>,
        ]}
      />

      {/* Contenu principal */}
      <main className={`container mx-auto max-w-5xl lg:p-6 ${className}`}>
        {children}
      </main>
    </div>
  )
}
