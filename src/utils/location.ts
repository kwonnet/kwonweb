export const checkLocationPermission = async (): Promise<PermissionState> => {
    if (!navigator.permissions) {
      // Fallback for older browsers
      return "prompt";
    }
  
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      return result.state; // 'granted' | 'denied' | 'prompt'
    } catch (e) {
      return "prompt";
    }
  };
  

export const getUserLocation = async(): Promise<GeolocationPosition | null> => {
    const status = await checkLocationPermission()
    if(status === "denied") return null
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return resolve(null);
      }
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(position);
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              break;
            case error.POSITION_UNAVAILABLE:
              break;
            case error.TIMEOUT:
              break;
            default:
          }
          resolve(null);
        }, { enableHighAccuracy: true}
      );
    });
  };
  