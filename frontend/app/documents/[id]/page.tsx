"use client";

import React from "react";
import { DocumentDetailView } from "@/components/documents/DocumentDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentDetailPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  return <DocumentDetailView documentId={unwrappedParams.id} />;
}
