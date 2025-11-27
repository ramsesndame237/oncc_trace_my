import { cn } from "@/lib/utils";
import {
  InputOTPGroup,
  InputOTP as InputOTPPrimitive,
  InputOTPSlot,
} from "./primitive";

type InputOtpProps = {
  length?: number;
  autoFocus: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name: string;
  ref?: React.RefObject<HTMLInputElement>;
  disabled: boolean;
  position: "center" | "start";
  inputMode: "text" | "numeric";
  error?: boolean;
  className?: string;
  onComplete?: (value: string) => void;
};

export function InputOTP({
  length = 6,
  autoFocus,
  value,
  onChange,
  onBlur,
  name,
  ref,
  disabled,
  position,
  inputMode,
  error,
  className,
  onComplete,
}: InputOtpProps) {
  // Générer les slots pour le nombre de caractères requis
  const renderSlots = () => {
    const slots = [];
    for (let i = 0; i < length; i++) {
      slots.push(
        <InputOTPSlot
          key={i}
          index={i}
          inputMode={inputMode}
          className="h-10 w-10"
        />
      );
    }
    return slots;
  };
  return (
    <InputOTPPrimitive
      maxLength={length}
      autoFocus={autoFocus}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      onBlur={onBlur}
      name={name}
      ref={ref}
      disabled={disabled}
      className={className}
      containerClassName={cn(
        position === "center" ? "gap-2 justify-center" : "gap-2",
        error && "has-[.input-otp-slot]:border-red-500"
      )}
    >
      <InputOTPGroup>{renderSlots()}</InputOTPGroup>
    </InputOTPPrimitive>
  );
}
