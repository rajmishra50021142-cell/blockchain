"use client";

import React, { Suspense } from "react";
import { AuditView } from "@/components/audit/AuditView";
import { LoadingState } from "@/components/ui/LoadingState";

export default function AuditPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading audit trail module..." />}>
      <AuditView />
    </Suspense>
  );
}
