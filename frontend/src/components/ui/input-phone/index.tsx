"use client";

import { registerLocale } from "i18n-iso-countries";
import enCountries from "i18n-iso-countries/langs/en.json";
import frCountries from "i18n-iso-countries/langs/fr.json";
import {
  type CountryCallingCode,
  CountryCode,
  E164Number,
  getExampleNumber,
  isValidPhoneNumber as matchIsValidPhoneNumber,
  parsePhoneNumberWithError,
} from "libphonenumber-js";
import * as React from "react";

import { cn } from "@/lib/utils";
import examples from "libphonenumber-js/mobile/examples";
import PhoneInput, { type Country } from "react-phone-number-input/input";
import { Input } from "../input";
import { ComboboxCountryInput } from "./combobox";
import {
  getCountriesOptions,
  isoToEmoji,
  replaceNumbersWithZeros,
} from "./helpers";

// Enregistrement de la locale française
registerLocale(frCountries);
registerLocale(enCountries);

type CountryOption = {
  value: Country;
  label: string;
  indicatif: CountryCallingCode;
};

export interface PhoneInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  value?: E164Number | string;
  defaultCountry?: CountryCode;
  onChange?: (value: E164Number | string | undefined) => void;
  onCountryChange?: (country: CountryCode) => void;
  className?: string;
  placeholderSearchCountry?: string;
  emptySearchCountryMessage?: string;
  getIsValidPhoneNumber?: (isValid: boolean) => void;
  lang?: "fr" | "en";
  hasError?: boolean;
}

export default function InputPhone({
  className,
  value,
  onChange,
  defaultCountry = "FR",
  placeholderSearchCountry = "Rechercher un pays ...",
  emptySearchCountryMessage = "Aucun pays trouvé.",
  onCountryChange,
  getIsValidPhoneNumber,
  lang = "fr",
  disabled = false,
  hasError = false,
}: PhoneInputProps) {
  const options = getCountriesOptions(lang);

  // Fonction d'initialisation des valeurs téléphone avec correction automatique
  const initializePhoneData = (
    inputValue: string | undefined,
    fallbackCountry: CountryCode
  ) => {
    if (!inputValue || inputValue.trim() === "") {
      return { country: fallbackCountry, phoneNumber: "" };
    }

    // Nettoyer la valeur d'entrée
    const cleanedValue = inputValue.trim();

    try {
      // Si la valeur commence déjà par '+', tenter de la parser directement
      if (cleanedValue.startsWith("+")) {
        const parsed = parsePhoneNumberWithError(cleanedValue);
        return { country: parsed.country, phoneNumber: cleanedValue };
      }
    } catch {
      // Si le parsing échoue, continuer avec les autres méthodes
    }

    try {
      // Pour les numéros sans '+', essayer de les parser avec le préfixe
      const normalizedPhone = `+${cleanedValue}`;
      const parsed = parsePhoneNumberWithError(normalizedPhone);
      // Retourner le numéro formaté avec le '+'
      return { country: parsed.country, phoneNumber: parsed.number };
    } catch {
      // Si aucune méthode ne fonctionne, essayer avec le pays par défaut
      try {
        // Ajouter le préfixe du pays si nécessaire
        const normalizedWithCountry = cleanedValue.startsWith("+")
          ? cleanedValue
          : `+${cleanedValue}`;
        const parsed = parsePhoneNumberWithError(
          normalizedWithCountry,
          fallbackCountry
        );
        return {
          country: parsed.country || fallbackCountry,
          phoneNumber: parsed.number || normalizedWithCountry,
        };
      } catch {
        // En dernier recours, garder la valeur telle quelle mais essayer de déterminer le pays
        // Pour le Cameroun, si le numéro commence par 237 ou 6/2/3 (sans +)
        if (
          cleanedValue.startsWith("237") ||
          (fallbackCountry === "CM" && /^[623]/.test(cleanedValue))
        ) {
          const phoneWithPlus = cleanedValue.startsWith("+")
            ? cleanedValue
            : `+237${cleanedValue.replace(/^237/, "")}`;
          return { country: "CM" as CountryCode, phoneNumber: phoneWithPlus };
        }

        // Fallback final - garder la valeur originale avec le pays par défaut
        const finalPhone = cleanedValue.startsWith("+")
          ? cleanedValue
          : `+${cleanedValue}`;
        return { country: fallbackCountry, phoneNumber: finalPhone };
      }
    }
  };

  const { country: defaultCountryLib, phoneNumber: initialPhoneNumber } =
    initializePhoneData(value, defaultCountry);

  const defaultCountryOption = options.find(
    (option) => option.value === defaultCountryLib
  );

  const [country, setCountry] = React.useState<CountryOption>(
    defaultCountryOption || options[0]!
  );
  const [phoneNumber, setPhoneNumber] = React.useState<E164Number | string>(
    initialPhoneNumber || ""
  );

  // Synchroniser l'état interne quand la valeur externe change
  React.useEffect(() => {
    const { country: newCountry, phoneNumber: newPhoneNumber } =
      initializePhoneData(value, defaultCountry);

    const newCountryOption = options.find(
      (option) => option.value === newCountry
    );

    if (newCountryOption) {
      setCountry(newCountryOption);
    }

    // Mettre à jour le numéro de téléphone seulement si différent pour éviter les boucles infinies
    if (newPhoneNumber !== phoneNumber && value !== phoneNumber) {
      setPhoneNumber(newPhoneNumber || "");
    }
  }, [value, defaultCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  const placeholder = replaceNumbersWithZeros(
    getExampleNumber(country.value, examples)!.formatInternational()
  );

  const onCountryChangeValue = (value: CountryOption) => {
    setPhoneNumber("");
    setCountry(value);
    if (onCountryChange) {
      onCountryChange(value.value);
    }
  };

  // Utiliser useCallback pour mémoriser la fonction onChange
  const handlePhoneNumberChange = React.useCallback(
    (newPhoneNumber: E164Number | string) => {
      setPhoneNumber(newPhoneNumber);
    },
    []
  );

  // Notifier les changements uniquement quand le numéro change réellement
  React.useEffect(() => {
    // Éviter de notifier si la valeur externe est déjà égale au numéro interne
    if (phoneNumber !== value) {
      if (onChange) {
        onChange(phoneNumber);
      }
    }

    if (getIsValidPhoneNumber) {
      getIsValidPhoneNumber(matchIsValidPhoneNumber(phoneNumber ?? ""));
    }
  }, [phoneNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-stretch space-x-2">
        <ComboboxCountryInput
          value={country}
          onValueChange={onCountryChangeValue}
          options={options}
          placeholder={placeholderSearchCountry}
          renderOption={({ option }) =>
            `${isoToEmoji(option.value)} ${option.label}`
          }
          renderValue={(option) => option.label}
          emptyMessage={emptySearchCountryMessage}
          disabled={disabled}
          hasError={hasError}
        />
        <PhoneInput
          international
          withCountryCallingCode
          country={country.value.toUpperCase() as Country}
          value={phoneNumber}
          inputComponent={Input}
          placeholder={placeholder}
          onChange={(value) => {
            handlePhoneNumberChange(value || "");
          }}
          disabled={disabled}
          aria-invalid={hasError}
        />
      </div>
    </div>
  );
}
