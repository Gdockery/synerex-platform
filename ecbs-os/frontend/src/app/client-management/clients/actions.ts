"use server";

import { redirect } from "next/navigation";

const apiBaseUrl = process.env.ECBS_API_BASE_URL ?? "http://localhost:5090";

export async function createClientAction(formData: FormData) {
  await postCommand("/api/v1/client-management/clients", {
    addressLine1: formValue(formData, "addressLine1"),
    addressLine2: formValue(formData, "addressLine2"),
    city: formValue(formData, "city"),
    clientName: formValue(formData, "clientName"),
    clientType: formValue(formData, "clientType"),
    contactEmail: formValue(formData, "contactEmail"),
    contactMobile: formValue(formData, "contactMobile"),
    contactName: formValue(formData, "contactName"),
    contactPhone: formValue(formData, "contactPhone"),
    contactTitle: formValue(formData, "contactTitle"),
    contractNumber: formValue(formData, "contractNumber"),
    country: formValue(formData, "country"),
    industry: formValue(formData, "industry"),
    legalName: formValue(formData, "legalName"),
    notes: formValue(formData, "notes"),
    postalCode: formValue(formData, "postalCode"),
    state: formValue(formData, "state"),
    status: formValue(formData, "status"),
    taxId: formValue(formData, "taxId"),
    website: formValue(formData, "website"),
  });

  redirect("/client-management/clients");
}

export async function saveProjectDraftAction(formData: FormData) {
  await postCommand("/api/v1/client-management/projects/drafts", {
    description: formValue(formData, "description"),
    facilityName: formValue(formData, "facilityName"),
    location: formValue(formData, "location"),
    projectManager: formValue(formData, "projectManager"),
    projectName: formValue(formData, "projectName"),
    projectType: formValue(formData, "projectType"),
    requiredDocumentStatus: "No uploaded document metadata yet",
    startDate: formValue(formData, "startDate"),
    status: formValue(formData, "status"),
    targetCompletionDate: formValue(formData, "targetCompletionDate"),
  });

  redirect("/client-management/clients?workflow=new-project-generate-reports");
}

export async function createReportRequestAction(formData: FormData) {
  await postCommand("/api/v1/client-management/report-requests", {
    includeDetailedCalculations: formData.get("includeDetailedCalculations") === "on",
    includeEquipmentRecommendations: formData.get("includeEquipmentRecommendations") === "on",
    requestedReportTypes: ["Proposal Report", "Site Assessment Report"],
  });

  redirect("/client-management/clients/1/projects");
}

async function postCommand(path: string, body: object) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    body: JSON.stringify(body),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`ECBS command failed (${response.status}).`);
  }
}

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
