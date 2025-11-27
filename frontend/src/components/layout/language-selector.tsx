"use client";

import { useLocale } from "@/hooks/useLocale";
import { localeNames, locales, type Locale } from "@/i18n/config";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function LanguageSelector() {
  const { currentLocale, changeLocale, isChanging } = useLocale();

  const handleLanguageChange = (locale: Locale) => {
    changeLocale(locale);
  };

  // Nom de la langue actuelle avec fallback
  const currentLocaleName =
    localeNames[currentLocale] || currentLocale.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-primary text-white hover:bg-primary hover:text-white border-none h-9 px-4 font-medium rounded"
          disabled={isChanging}
        >
          {/* Afficher le code court sur mobile, le nom complet sur desktop */}
          <span className="hidden sm:inline">{currentLocaleName}</span>
          <span className="sm:hidden">{currentLocale.toUpperCase()}</span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            className="cursor-pointer flex items-center justify-between"
            onClick={(e) => {
              e.preventDefault();
              handleLanguageChange(locale);
            }}
          >
            <span>{localeNames[locale]}</span>
            {currentLocale === locale && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
