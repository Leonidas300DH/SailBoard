import { SettingsRoom } from "@/components/settings/SettingsRoom";
import { getMapDisplaySettings } from "@/lib/database";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return <SettingsRoom defaults={await getMapDisplaySettings()} />;
}
