"use server";

export async function triggerServerError() {
  throw new Error("Sentry Example Server Error");
}
