import { cookies } from "next/headers";

export const selectedClientCookieName = "ecbs_selected_client_id";

export async function getSelectedClientId(): Promise<number | undefined> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(selectedClientCookieName)?.value;
  const clientId = Number(rawValue);

  return Number.isInteger(clientId) && clientId > 0 ? clientId : undefined;
}
