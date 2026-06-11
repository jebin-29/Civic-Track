import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  onLocationChange?: (location: { lat: number; lng: number; address: string }) => void;
  className?: string;
  defaultLocation?: { lat: number; lng: number; address: string };
}

const MapClickHandler = ({ onLocationChange }: { onLocationChange?: (location: { lat: number; lng: number; address: string }) => void }) => {
  const map = useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onLocationChange?.({ lat, lng, address });
      } catch (error) {
        const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onLocationChange?.({ lat, lng, address });
      }
    },
  });
  return null;
};

export const LocationPicker = ({
  onLocationChange,
  className,
  defaultLocation
}: LocationPickerProps) => {
  const [isClient, setIsClient] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(defaultLocation || null);

  const {
    location: gpsLocation,
    loading: gpsLoading,
    error: gpsError,
    getCurrentLocation
  } = useGeolocation();

  const mapRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (gpsLocation && !selectedLocation) {
      const newLocation = {
        lat: gpsLocation.latitude,
        lng: gpsLocation.longitude,
        address: gpsLocation.address || `${gpsLocation.latitude.toFixed(6)}, ${gpsLocation.longitude.toFixed(6)}`
      };
      setSelectedLocation(newLocation);
      onLocationChange?.(newLocation);
    }
  }, [gpsLocation, selectedLocation, onLocationChange]);

  const handleGetCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      const newLocation = {
        lat: location.latitude,
        lng: location.longitude,
        address: location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
      };
      setSelectedLocation(newLocation);
      onLocationChange?.(newLocation);
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const getStatusIcon = () => {
    if (gpsLoading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (gpsError) return <AlertCircle className="w-4 h-4 text-destructive" />;
    if (selectedLocation) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <MapPin className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (gpsLoading) return 'Getting your location...';
    if (gpsError) return 'Location access denied';
    if (selectedLocation) return 'Location selected';
    return 'No location selected';
  };

  if (!isClient) {
    return (
      <div className={cn('space-y-4', className)}>
        <Label>Location</Label>
        <div className="h-48 rounded-lg bg-muted flex items-center justify-center border">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'space-y-4 bg-white p-5 rounded-xl border shadow-sm',
      className
    )}>
      <Label>Location</Label>

      {/* Map Container */}
      <div className="h-56 rounded-xl overflow-hidden border shadow-md relative">
        <MapContainer
          ref={mapRef}
          center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [23.0225, 72.5714]}
          zoom={selectedLocation ? 16 : 13}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {selectedLocation && (
            <Marker
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={new Icon({
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
              })}
            />
          )}
          <MapClickHandler onLocationChange={(location) => {
            setSelectedLocation(location);
            onLocationChange?.(location);
          }} />
        </MapContainer>

        {/* GPS Button */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-3 right-3 z-10 bg-white shadow-lg rounded-full px-3 py-1 hover:bg-blue-50"
          onClick={handleGetCurrentLocation}
          disabled={gpsLoading}
        >
          <Navigation className="w-4 h-4 mr-1 text-blue-600" />
          <span className="text-sm font-medium">Use GPS</span>
        </Button>
      </div>

      {/* Location Status */}
      <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg border">
        {getStatusIcon()}
        <span className={cn(
          'text-sm',
          gpsError ? 'text-destructive' :
            selectedLocation ? 'text-green-600' :
              'text-muted-foreground'
        )}>
          {getStatusText()}
        </span>
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="flex items-start gap-3 text-sm bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="bg-blue-600 text-white p-2 rounded-full">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate">{selectedLocation.address}</p>
            <p className="text-xs text-muted-foreground">
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {gpsError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-4 h-4" />
          <div>
            <p className="font-medium">Location access denied</p>
            <p className="text-xs">Please enable location access in your browser settings or click on the map to select a location manually.</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border space-y-1">
        <p>• Click on the map to select a location manually</p>
        <p>• Use the GPS button to get your current location</p>
        <p>• Location will be auto-detected via GPS or manual pin-drop</p>
      </div>
    </div>
  );
}; 