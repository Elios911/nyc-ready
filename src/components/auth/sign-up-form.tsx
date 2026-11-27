"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { applyServerErrors } from "@/components/form/apply-errors";
import { FormError, FormField } from "@/components/form/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/actions/auth";
import { signUpSchema, type SignUpValues } from "@/lib/validation/auth";

export function SignUpForm() {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const form = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema, undefined, { raw: true }), defaultValues: { fullName: "", email: "", password: "" } });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await signUp(values);
      if (!result.ok) {
        setFormError(result.error);
        applyServerErrors(result, form.setError);
      } else if (result.message) {
        setConfirmation(result.message);
      }
    });
  });

  if (confirmation) {
    return (
      <Alert variant="positive">
        <MailCheck />
        <AlertTitle>Almost there</AlertTitle>
        <AlertDescription>{confirmation}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={formError} />
      <FormField id="fullName" label="Your name" optional error={errors.fullName?.message}>
        <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
      </FormField>
      <FormField id="email" label="Email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...form.register("email")} />
      </FormField>
      <FormField id="password" label="Password" hint="At least 8 characters." error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...form.register("password")} />
      </FormField>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
