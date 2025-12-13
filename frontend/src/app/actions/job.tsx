"use server";
import { fetchWithAuth } from "app/actions/fetch";
import { FetchPayload } from "schema/schema";

export async function applyToJob(jobId: string) {
  try {
    const payload: FetchPayload = {
      url: `${process.env.NEXT_PUBLIC_API_URL}/applicant/job/${jobId}/apply`,
      options: {
        method: "POST",
      },
    };
    await fetchWithAuth(payload);
    return { success: true, message: "Application submitted successfully" };
  } catch (error) {
    console.error("Failed to apply to job:", error);
    return { success: false, error: error as string };
  }
}

export async function withdrawApplication(jobId: string) {
  try {
    const payload: FetchPayload = {
      url: `${process.env.NEXT_PUBLIC_API_URL}/applicant/job/${jobId}/apply`,
      options: {
        method: "DELETE",
      },
    };
    await fetchWithAuth(payload);
    return { success: true, message: "Application withdrawn successfully" };
  } catch (error) {
    console.error("Failed to withdraw application:", error);
    return { success: false, error: error as string };
  }
}

export async function acceptOffer(jobId: string) {
  try {
    const payload: FetchPayload = {
      url: `${process.env.NEXT_PUBLIC_API_URL}/applicant/job/${jobId}/offer/accept`,
      options: {
        method: "POST",
      },
    };
    await fetchWithAuth(payload);
    return { success: true, message: "Offer accepted successfully" };
  } catch (error) {
    console.error("Failed to accept offer:", error);
    return { success: false, error: error as string };
  }
}

export async function rejectOffer(jobId: string) {
  try {
    const payload: FetchPayload = {
      url: `${process.env.NEXT_PUBLIC_API_URL}/applicant/job/${jobId}/offer/reject`,
      options: {
        method: "POST",
      },
    };
    await fetchWithAuth(payload);
    return { success: true, message: "Offer rejected successfully" };
  } catch (error) {
    console.error("Failed to reject offer:", error);
    return { success: false, error: error as string };
  }
}

export async function rescindAcceptance(jobId: string) {
  try {
    const payload: FetchPayload = {
      url: `${process.env.NEXT_PUBLIC_API_URL}/applicant/job/${jobId}/offer/accept`,
      options: {
        method: "DELETE",
      },
    };
    await fetchWithAuth(payload);
    return { success: true, message: "Acceptance rescinded successfully" };
  } catch (error) {
    console.error("Failed to rescind acceptance:", error);
    return { success: false, error: error as string };
  }
}

export async function rescindRejection(jobId: string) {
  try {
    const payload: FetchPayload = {
      url: `${process.env.NEXT_PUBLIC_API_URL}/applicant/job/${jobId}/offer/reject`,
      options: {
        method: "DELETE",
      },
    };
    await fetchWithAuth(payload);
    return { success: true, message: "Rejection rescinded successfully" };
  } catch (error) {
    console.error("Failed to rescind rejection:", error);
    return { success: false, error: error as string };
  }
}
