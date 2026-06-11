import { useState, useEffect, useCallback } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

interface UseGeolocationReturn {
  location: Location | null;
  loading: boolean;
  error: GeolocationError | null;
  getCurrentLocation: () => Promise<Location>;
  reverseGeocode: (lat: number, lng: number) => Promise<string>;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeolocationError | null>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        return data.display_name;
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<Location> => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error: GeolocationError = {
          code: 0,
          message: 'Geolocation is not supported by this browser.'
        };
        setError(error);
        setLoading(false);
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          try {
            const address = await reverseGeocode(latitude, longitude);
            const locationData: Location = {
              latitude,
              longitude,
              address,
              accuracy
            };
            
            setLocation(locationData);
            setLoading(false);
            resolve(locationData);
          } catch (err) {
            const locationData: Location = {
              latitude,
              longitude,
              accuracy
            };
            setLocation(locationData);
            setLoading(false);
            resolve(locationData);
          }
        },
        (err) => {
          const error: GeolocationError = {
            code: err.code,
            message: err.message
          };
          setError(error);
          setLoading(false);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }, [reverseGeocode]);

  useEffect(() => {
    // Auto-get location on mount if permission is granted
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          getCurrentLocation().catch(() => {
            // Silently fail on auto-load
          });
        }
      });
    }
  }, [getCurrentLocation]);

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    reverseGeocode
  };
}; 