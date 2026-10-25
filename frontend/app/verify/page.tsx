"use client";

import React, { Suspense } from "react";
import { VerifyView } from "@/components/verify/VerifyView";
import { LoadingState } from "@/components/ui/LoadingState";

export default function VerifyPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading verification module..." />}>
      <VerifyView />
    </Suspense>
  );
}
