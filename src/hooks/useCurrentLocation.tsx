import { useEffect, useState } from "react";

const useCurrentLocation = () => {
  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    error?: string;
  }>({ latitude: null, longitude: null });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({ ...prev, error: "Geolocation is not supported." }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("location ", position)
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        console.log("✅ Location permission granted");
        console.log("📍 Latitude:", latitude, "Longitude:", longitude);
      },
      (error) => {
        console.warn("❌ Error getting location:", error.message);
        setLocation((prev) => ({ ...prev, error: error.message }));
      },
      { enableHighAccuracy: true }
    );
  }, []);

  return location;
};

export default useCurrentLocation