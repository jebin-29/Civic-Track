import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Issue } from './IssueCard';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  issues: Issue[];
  onIssueClick?: (issue: Issue) => void;
  center?: [number, number];
  zoom?: number;
  userLocation?: { lat: number; lng: number } | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'reported': return '#ef4444'; // red
    case 'progress': return '#f59e0b'; // amber
    case 'resolved': return '#10b981'; // green
    default: return '#6b7280'; // gray
  }
};

const getCategoryIcon = (category: string) => {
  const getCategorySymbol = () => {
    switch (category) {
      case 'Roads': return 'R';
      case 'Lighting': return 'L';
      case 'Water Supply': return 'W';
      case 'Cleanliness': return 'C';
      case 'Public Safety': return 'S';
      case 'Obstructions': return 'O';
      default: return 'I';
    }
  };

  const symbol = getCategorySymbol();
  const color = getStatusColor('reported');

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${symbol}</text>
      </svg>
    `)))}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const MapMarkers = ({ issues, onIssueClick }: { issues: Issue[]; onIssueClick?: (issue: Issue) => void }) => {
  return (
    <>
      {issues.map((issue) => {
        // Use coordinates if available, otherwise generate mock coordinates
        const coordinates: [number, number] = issue.coordinates 
          ? [issue.coordinates.lat, issue.coordinates.lng]
          : [
              23.0225 + (Math.random() - 0.5) * 0.01, // Ahmedabad lat with some variation
              72.5714 + (Math.random() - 0.5) * 0.01, // Ahmedabad lng with some variation
            ];

        return (
          <Marker
            key={issue.id}
            position={coordinates}
            icon={getCategoryIcon(issue.category)}
            eventHandlers={{
              click: () => onIssueClick?.(issue),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-sm">{issue.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">{issue.category}</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full`} 
                        style={{ backgroundColor: getStatusColor(issue.status) }}></span>
                  <span className="text-xs capitalize">{issue.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{issue.distance}</p>
                <p className="text-xs text-muted-foreground">{issue.location}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

const UserLocationMarker = ({ userLocation }: { userLocation: { lat: number; lng: number } | null }) => {
  if (!userLocation) return null;

  return (
    <>
      {/* User location marker */}
      <Marker
        position={[userLocation.lat, userLocation.lng]}
        icon={new Icon({
          iconUrl: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `)))}`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-semibold text-sm">Your Location</h3>
            <p className="text-xs text-muted-foreground">
              {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
            </p>
          </div>
        </Popup>
      </Marker>
      
      {/* Location accuracy circle */}
      <Circle
        center={[userLocation.lat, userLocation.lng]}
        radius={100} // 100 meters radius
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 2
        }}
      />
    </>
  );
};

const MapController = ({ userLocation }: { userLocation: { lat: number; lng: number } | null }) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 15);
    }
  }, [userLocation, map]);

  return null;
};

export const MapView = ({ 
  issues, 
  onIssueClick, 
  center = [23.0225, 72.5714], 
  zoom = 13,
  userLocation 
}: MapViewProps) => {
  const [isClient, setIsClient] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-96 bg-muted rounded-lg flex items-center justify-center border">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="h-96 bg-muted rounded-lg flex items-center justify-center border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Map could not be loaded</p>
          <p className="text-xs text-muted-foreground mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : center;
  const mapZoom = userLocation ? 15 : zoom;

  return (
    <div className="h-96 rounded-lg overflow-hidden border">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        onError={() => setMapError(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapMarkers issues={issues} onIssueClick={onIssueClick} />
        <UserLocationMarker userLocation={userLocation} />
        <MapController userLocation={userLocation} />
      </MapContainer>
    </div>
  );
}; 