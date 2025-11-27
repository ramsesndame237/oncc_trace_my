"use client";

import { FormRadioGroup } from "@/components/forms";
import { BaseCard } from "@/components/modules/base-card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

type RecoveryFormData = {
  type: "username" | "password" | "";
};

export function RecoveryForm() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const form = useForm<RecoveryFormData>({
    defaultValues: {
      type: "",
    },
  });

  const onSubmit = async (data: RecoveryFormData) => {
    if (data.type === "") {
      form.setError("type", {
        type: "required",
        message: t("form.selectOption"),
      });
      return;
    }
    router.push(`/auth/ask-recovery/${data.type}`);
  };

  const radioOptions = [
    { value: "username", label: t("recovery.usernameOption") },
    { value: "password", label: t("recovery.passwordOption") },
  ];

  return (
    <BaseCard
      title={t("recovery.whatForgot")}
      footer={
        <Button type="submit" form="forgot-password-form" className="w-fit">
          {t("recovery.continue")}
        </Button>
      }
    >
      <Form {...form}>
        <form
          id="forgot-password-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <FormRadioGroup name="type" options={radioOptions} form={form} />
        </form>
      </Form>
    </BaseCard>
  );
}
