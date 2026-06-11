import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, MapPin, Clock, User, Filter, Grid, Map, Edit, LayoutGrid, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { Header } from "@/components/Header";
import { IssueCard, Issue } from "@/components/IssueCard";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useToast } from "@/hooks/use-toast";
import { issuesAPI, categoriesAPI, Issue as APIIssue, Category } from "@/lib/api";
import { getImageForCategory } from "@/lib/imageMapping";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const ALLOWED_CATEGORIES = [
  "Drainage",
  "Garbage Collection",
  "Road",
  "Streetlight"
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [distanceFilter, setDistanceFilter] = useState('all');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [locationReady, setLocationReady] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  const { location: gpsLocation, getCurrentLocation } = useGeolocation();

  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'CivicTrack/1.0' } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) return data.display_name;
      }
    } catch (error) { console.error('Geocoding error:', error); }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const convertAPIIssue = (apiIssue: APIIssue): Issue => {
    let distance = 'Unknown';
    if (userLocation && apiIssue.latitude != null && apiIssue.longitude != null) {
      const lat = Number(apiIssue.latitude);
      const lng = Number(apiIssue.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        if (apiIssue.distance_km) {
          distance = `${apiIssue.distance_km} km`;
        } else {
          const calculatedDistance = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
          distance = calculatedDistance < 0.1 ? "Nearby" : `${calculatedDistance.toFixed(1)} km`;
        }
      }
    }
    return {
      id: apiIssue.id,
      title: apiIssue.title,
      description: apiIssue.description,
      category: typeof apiIssue.category === 'string' ? apiIssue.category : (apiIssue.category as any)?.name,
      status: apiIssue.status,
      location: apiIssue.location,
      flags: apiIssue.flags,
      reportedBy: apiIssue.reporter_name || apiIssue.reported_by || 'Anonymous',
      reportedAt: new Date(apiIssue.reported_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      image: apiIssue.primary_photo ? `http://127.0.0.1:8000${apiIssue.primary_photo}` : getImageForCategory(apiIssue.category),
      distance: distance,
      coordinates: apiIssue.latitude && apiIssue.longitude ? { lat: Number(apiIssue.latitude), lng: Number(apiIssue.longitude) } : undefined,
      ai_issue_type: apiIssue.ai_issue_type,
      ai_priority: apiIssue.ai_priority ? apiIssue.ai_priority.toLowerCase() : null,
      ai_severity: apiIssue.ai_severity,
      ai_workers: apiIssue.ai_workers,
      ai_time_required: apiIssue.ai_time_required,
      ai_cost: apiIssue.ai_cost,
    };
  };

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: currentPage.toString(), page_size: '6' });
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (distanceFilter && distanceFilter !== 'all' && userLocation) {
        const distance = distanceFilter.replace('km', '');
        params.append('lat', userLocation.lat.toString());
        params.append('lng', userLocation.lng.toString());
        params.append('radius', distance);
      }
      const response = await fetch(`${API_BASE_URL}/issues/?${params}`);
      if (response.ok) {
        const data = await response.json();
        let convertedIssues = data.results.map(convertAPIIssue);
        if (priorityFilter !== 'all') {
          convertedIssues = convertedIssues.filter(
            (issue) => issue.ai_priority && issue.ai_priority.toLowerCase() === priorityFilter.toLowerCase()
          );
        }
        const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 };
        convertedIssues.sort((a, b) => {
          const aPriority = priorityOrder[a.ai_priority as keyof typeof priorityOrder] || 5;
          const bPriority = priorityOrder[b.ai_priority as keyof typeof priorityOrder] || 5;
          return aPriority - bPriority;
        });
        setIssues(prev => {
          const same = JSON.stringify(prev) === JSON.stringify(convertedIssues);
          return same ? prev : convertedIssues;
        });
        setTotalPages(Math.ceil(data.count / 6));
      } else {
        console.error('Failed to fetch issues');
        setIssues([]);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const apiCategories = await categoriesAPI.getCategories();
      const filtered = apiCategories.filter((cat) => ALLOWED_CATEGORIES.includes(cat.name));
      setCategories(filtered);
      console.log("API Categories:", apiCategories);
      console.log("Filtered Categories:", filtered);
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      setCategories([
        { id: 1, name: 'Road' },
        { id: 2, name: 'Streetlight' },
        { id: 3, name: 'Garbage Collection' },
        { id: 4, name: 'Drainage' },
      ]);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('civictrack_user');
    if (!userData) { navigate("/login"); return; }
    const userObj = JSON.parse(userData);
    setUser(userObj);
    setIsAdmin(userObj.isAdmin || false);
    const loadData = async () => {
      try { await Promise.all([fetchIssues(), fetchCategories()]); }
      catch (error) { console.error('Error loading data:', error); }
    };
    loadData();
  }, [location.state]);

  useEffect(() => { getCurrentLocation(); }, []);

  useEffect(() => {
    if (gpsLocation) setUserLocation({ lat: gpsLocation.latitude, lng: gpsLocation.longitude });
  }, [gpsLocation]);

  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(() => { if (!userLocation) fetchIssues(); }, 1500);
    return () => clearTimeout(timeout);
  }, [currentPage, searchTerm, categoryFilter, statusFilter, distanceFilter, priorityFilter, userLocation, user]);

  const handleIssueClick = (issue: Issue) => { navigate(`/issue/${issue.id}`, { state: { issue } }); };

  const handleGetLocation = async () => {
    try {
      setLocationLoading(true);
      const locationData = await getCurrentLocation();
      if (locationData) {
        const address = await getAddressFromCoordinates(locationData.latitude, locationData.longitude);
        setLocationAddress(address);
        const newLocation = { lat: locationData.latitude, lng: locationData.longitude };
        setUserLocation(newLocation);
        setLocationReady(true);
        setMapCenter(newLocation);
        toast({ title: "Location obtained", description: `Your real GPS location detected: ${address}`, duration: 5000 });
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      toast({ title: "Location error", description: "Could not get your real GPS location. Please check permissions or enter manually.", variant: "destructive", duration: 5000 });
      setShowLocationInput(true);
    } finally { setLocationLoading(false); }
  };

  const handleManualLocationSubmit = async () => {
    const lat = parseFloat(manualLatitude);
    const lng = parseFloat(manualLongitude);
    if (isNaN(lat) || isNaN(lng)) {
      toast({ title: "Invalid coordinates", description: "Please enter valid latitude and longitude values", variant: "destructive", duration: 5000 });
      return;
    }
    try {
      setLocationLoading(true);
      const address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setLocationAddress(address);
      const newLocation = { lat, lng };
      setUserLocation(newLocation);
      setMapCenter(newLocation);
      setShowLocationInput(false);
      setManualLatitude('');
      setManualLongitude('');
      toast({ title: "Location set", description: `Manual location set: ${address}`, duration: 5000 });
    } catch (error) {
      toast({ title: "Geocoding error", description: "Could not get address for coordinates", variant: "destructive", duration: 5000 });
    } finally { setLocationLoading(false); }
  };

  const handlePageChange = (page: number) => { setCurrentPage(page); };
  const handleSearch = () => { setCurrentPage(1); fetchIssues(); };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handleClearLocation = () => {
    setUserLocation(null);
    setLocationAddress('');
    setMapCenter(null);
    toast({ title: "Location cleared", description: "Your location has been cleared. Map will show default view.", duration: 3000 });
  };

  // ── Map View Component — 100% original ──
  const MapView = ({ issues, userLocation }: { issues: Issue[], userLocation: { lat: number; lng: number } | null }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<L.Map | null>(null);
    const [userMarker, setUserMarker] = useState<L.Marker | null>(null);
    const [issueMarkers, setIssueMarkers] = useState<L.Marker[]>([]);

    useEffect(() => {
      if (mapRef.current && !map) {
        const newMap = L.map(mapRef.current, {
          center: userLocation || mapCenter || { lat: 22.7196, lng: 75.8577 },
          zoom: 13, zoomControl: true, attributionControl: false,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(newMap);
        setMap(newMap);
      }
      return () => { if (map) map.remove(); };
    }, [mapRef, map]);

    useEffect(() => { if (map && userLocation) map.setView(userLocation, 15); }, [map, userLocation]);

    useEffect(() => {
      if (map) {
        if (userMarker) map.removeLayer(userMarker);
        if (userLocation) {
          const marker = L.marker(userLocation, {
            icon: L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41],
            }),
          });
          const userPopupContent = `
            <div style="min-width: 250px; font-family: Arial, sans-serif;">
              <div style="background: #e3f2fd; padding: 12px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #bbdefb;">
                <h3 style="margin: 0 0 8px 0; color: #1565c0; font-size: 16px; font-weight: 600;">📍 Your Location</h3>
                <p style="margin: 0; color: #1976d2; font-size: 14px; line-height: 1.4;">${locationAddress || 'Address not available'}</p>
              </div>
              <div style="padding: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #495057; font-weight: 500;">Latitude:</span>
                  <span style="color: #212529; font-size: 14px;">${userLocation.lat.toFixed(6)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #495057; font-weight: 500;">Longitude:</span>
                  <span style="color: #212529; font-size: 14px;">${userLocation.lng.toFixed(6)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #495057; font-weight: 500;">Nearby Issues:</span>
                  <span style="color: #212529; font-size: 14px;">${issues.length} found</span>
                </div>
              </div>
              <div style="background: #e3f2fd; padding: 8px 12px; border-radius: 0 0 8px 8px; border-top: 1px solid #bbdefb;">
                <button style="background: #1976d2; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">Location Details</button>
              </div>
            </div>
          `;
          marker.addTo(map).bindPopup(userPopupContent, { maxWidth: 300, className: 'user-location-popup' });
          setUserMarker(marker);
        }
      }
    }, [map, userLocation, locationAddress, issues.length]);

    useEffect(() => {
      if (map) {
        issueMarkers.forEach(marker => map.removeLayer(marker));
        const newMarkers: L.Marker[] = [];
        if (issues.length > 0) {
          issues.forEach((issue, index) => {
            const coordinates = issue.coordinates || { lat: 22.7196, lng: 75.8577 };
            const getMarkerColor = (category: string | any) => {
              const categoryName = typeof category === 'string' ? category.toLowerCase() : (category as any)?.name?.toLowerCase() || 'default';
              switch (categoryName) {
                case 'garbage collection': return '#28a745';
                case 'road':              return '#ffc107';
                case 'streetlight':       return '#17a2b8';
                case 'water supply':      return '#007bff';
                case 'public safety':     return '#dc3545';
                case 'obstructions':      return '#6f42c1';
                case 'traffic signal':    return '#fd7e14';
                case 'drainage':          return '#20c997';
                default:                  return '#6c757d';
              }
            };
            const markerColor = getMarkerColor(issue.category);
            const customIcon = L.divIcon({
              html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">${index + 1}</div>`,
              className: 'custom-marker', iconSize: [20, 20], iconAnchor: [10, 10]
            });
            const marker = L.marker(coordinates, { icon: customIcon });
            const popupContent = `
              <div style="min-width: 250px; font-family: Arial, sans-serif;">
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #dee2e6;">
                  <h3 style="margin: 0 0 8px 0; color: #495057; font-size: 16px; font-weight: 600;">${issue.title}</h3>
                  <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.4;">${issue.description}</p>
                </div>
                <div style="padding: 12px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #495057; font-weight: 500;">Category:</span>
                    <span style="color: #212529; font-size: 14px;">${issue.category}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #495057; font-weight: 500;">Status:</span>
                    <span style="color: #212529; font-size: 14px;">${issue.status}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #495057; font-weight: 500;">Location:</span>
                    <span style="color: #212529; font-size: 14px;">${issue.location}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #495057; font-weight: 500;">Distance:</span>
                    <span style="color: #212529; font-size: 14px;">${issue.distance}</span>
                  </div>
                </div>
                <div style="background: #f8f9fa; padding: 8px 12px; border-radius: 0 0 8px 8px; border-top: 1px solid #dee2e6;">
                  <a href="/issue/${issue.id}" style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%; display: block; text-align: center; text-decoration: none;">View Full Details</a>
                </div>
              </div>
            `;
            marker.addTo(map).bindPopup(popupContent, { maxWidth: 300, className: 'custom-popup' });
            newMarkers.push(marker);
          });
        }
        setIssueMarkers(newMarkers);
      }
    }, [map, issues]);

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-full">
        <div ref={mapRef} className="w-full h-full" />
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white rounded-lg shadow-lg p-2">
            <button onClick={() => map?.zoomIn()} className="block w-8 h-8 bg-white border border-gray-300 rounded-t-md hover:bg-gray-50 flex items-center justify-center" title="Zoom In">
              <span className="text-lg font-bold">+</span>
            </button>
            <button onClick={() => map?.zoomOut()} className="block w-8 h-8 bg-white border border-gray-300 rounded-b-md hover:bg-gray-50 flex items-center justify-center" title="Zoom Out">
              <span className="text-lg font-bold">−</span>
            </button>
          </div>
        </div>
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => {
              if (map) {
                const mapContainer = map.getContainer();
                if (document.fullscreenElement) document.exitFullscreen();
                else mapContainer.requestFullscreen();
              }
            }}
            className="bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50" title="Toggle Fullscreen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // Derived counts
  const inProgressCount = issues.filter(i => i.status === 'progress').length;
  const resolvedCount   = issues.filter(i => i.status === 'resolved').length;
  const urgentCount     = issues.filter(i => i.ai_priority === 'urgent').length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .idx-page { font-family: 'DM Sans', sans-serif !important; background: #f6f7f9 !important; }
        .idx-body { max-width: 1200px; margin: 0 auto; padding: 36px 24px 80px; }

        .idx-title { font-family: 'Sora', sans-serif !important; font-size: 26px !important; font-weight: 700 !important; color: #0f172a !important; margin-bottom: 4px !important; }
        .idx-sub   { font-size: 14px !important; color: #94a3b8 !important; }

        /* Stat cards */
        .idx-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin:24px 0 28px; }
        @media(max-width:768px){ .idx-stat-grid{ grid-template-columns:1fr 1fr; } }
        @media(max-width:480px){ .idx-stat-grid{ grid-template-columns:1fr; } }
        .idx-stat {
          background:#fff; border:1px solid #e8edf4; border-radius:18px;
          padding:22px 24px; box-shadow:0 1px 3px rgba(0,0,0,.04);
          transition:transform .22s,box-shadow .22s;
          opacity:0; transform:translateY(12px); animation:idxFadeUp .45s forwards;
        }
        .idx-stat:nth-child(1){ animation-delay:.05s }
        .idx-stat:nth-child(2){ animation-delay:.10s }
        .idx-stat:nth-child(3){ animation-delay:.15s }
        .idx-stat:nth-child(4){ animation-delay:.20s }
        .idx-stat:hover{ transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.08); }
        .idx-stat-icon  { width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
        .idx-stat-label { font-size:12px; color:#94a3b8; font-weight:500; letter-spacing:.04em; text-transform:uppercase; margin-bottom:6px; }
        .idx-stat-val   { font-family:'Sora',sans-serif; font-size:28px; font-weight:700; color:#0f172a; line-height:1; }

        /* Filter card */
        .idx-filter-card { background:#fff; border:1px solid #e8edf4; border-radius:20px; padding:22px 24px; margin-bottom:24px; box-shadow:0 1px 3px rgba(0,0,0,.04); }

        /* Search input */
        .idx-search {
          height:40px !important; border-radius:12px !important; border:1px solid #e2e8f0 !important;
          background:#f8fafc !important; font-size:13px !important; font-family:'DM Sans',sans-serif !important;
          transition:border-color .2s,box-shadow .2s,background .2s !important;
        }
        .idx-search:focus { border-color:#6366f1 !important; box-shadow:0 0 0 3px rgba(99,102,241,.1) !important; background:#fff !important; outline:none !important; }
        .idx-search::placeholder { color:#cbd5e1 !important; }

        /* View toggle */
        .idx-view-wrap { display:inline-flex; gap:4px; background:#f1f5f9; border-radius:12px; padding:4px; }
        .idx-view-btn  { display:inline-flex; align-items:center; gap:6px; padding:7px 16px; border-radius:9px; font-size:13px; font-weight:500; cursor:pointer; border:none; background:transparent; color:#64748b; font-family:'DM Sans',sans-serif; transition:all .2s; }
        .idx-view-btn:hover { background:rgba(255,255,255,.7); color:#334155; }
        .idx-view-btn.active { background:#fff; color:#0f172a; font-weight:600; box-shadow:0 1px 4px rgba(0,0,0,.1); }

        /* Location banner */
        .idx-loc-banner { display:flex; align-items:center; gap:12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:14px; padding:12px 16px; }
        .idx-loc-icon   { width:32px; height:32px; border-radius:50%; background:#dcfce7; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* Manual location */
        .idx-manual { background:#f8fafc; border:1px solid #e8edf4; border-radius:16px; padding:20px 22px; }
        .idx-manual-title { font-family:'Sora',sans-serif; font-size:13px; font-weight:600; color:#0f172a; margin-bottom:14px; }

        /* Table card */
        .idx-table-card  { background:#fff; border:1px solid #e8edf4; border-radius:20px; box-shadow:0 1px 3px rgba(0,0,0,.04); overflow:hidden; }
        .idx-table-head  { padding:20px 24px 16px; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; justify-content:space-between; }
        .idx-table-title { font-family:'Sora',sans-serif; font-size:15px; font-weight:600; color:#0f172a; }
        .idx-table-count { font-size:12px; color:#94a3b8; background:#f8fafc; border:1px solid #e8edf4; border-radius:20px; padding:3px 10px; }

        .idx-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; padding:20px; }
        @media(max-width:1000px){ .idx-grid{ grid-template-columns:repeat(2,1fr); } }
        @media(max-width:600px) { .idx-grid{ grid-template-columns:1fr; } }

        /* Skeleton */
        .idx-skel-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; padding:20px; }
        @media(max-width:1000px){ .idx-skel-grid{ grid-template-columns:1fr 1fr; } }
        @media(max-width:600px) { .idx-skel-grid{ grid-template-columns:1fr; } }
        .idx-skel      { border-radius:16px; overflow:hidden; border:1px solid #e8edf4; }
        .idx-skel-img  { height:160px; background:linear-gradient(90deg,#f1f5f9 25%,#e8edf4 50%,#f1f5f9 75%); background-size:200% 100%; animation:idxShimmer 1.4s infinite; }
        .idx-skel-body { background:#fff; padding:16px; }
        .idx-skel-line { height:12px; background:linear-gradient(90deg,#f1f5f9 25%,#e8edf4 50%,#f1f5f9 75%); background-size:200% 100%; animation:idxShimmer 1.4s infinite; border-radius:6px; margin-bottom:10px; }

        /* Map legend */
        .idx-map-legend { position:absolute; top:16px; left:16px; z-index:500; background:#fff; border:1px solid #e8edf4; border-radius:16px; padding:16px; box-shadow:0 4px 16px rgba(0,0,0,.08); }
        .idx-map-legend h4 { font-family:'Sora',sans-serif; font-size:12px; font-weight:600; color:#0f172a; margin:0 0 10px; }
        .idx-legend-row { display:flex; align-items:center; gap:8px; font-size:12px; color:#64748b; margin-bottom:7px; }
        .idx-legend-row:last-child{ margin-bottom:0; }
        .idx-legend-dot { width:11px; height:11px; border-radius:50%; flex-shrink:0; border:2px solid #fff; box-shadow:0 1px 3px rgba(0,0,0,.2); }

        /* Pagination */
        .idx-pg { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:28px; }
        .idx-pg-btn { min-width:36px; height:36px; padding:0 8px; border-radius:10px; font-size:13px; font-weight:500; cursor:pointer; border:1.5px solid #e2e8f0; background:#fff; color:#64748b; font-family:'Sora',sans-serif; display:inline-flex; align-items:center; justify-content:center; transition:all .18s; }
        .idx-pg-btn:hover:not(:disabled){ background:#f8fafc; border-color:#cbd5e1; }
        .idx-pg-btn:disabled{ opacity:.4; cursor:not-allowed; }
        .idx-pg-btn.active{ background:#0f172a; color:#fff; border-color:#0f172a; box-shadow:0 2px 8px rgba(15,23,42,.2); }

        /* Report CTA */
        .idx-cta { display:inline-flex; align-items:center; gap:8px; padding:10px 22px; border-radius:13px; font-size:13px; font-weight:600; cursor:pointer; border:none; font-family:'Sora',sans-serif; background:#0f172a; color:#fff; box-shadow:0 2px 10px rgba(15,23,42,.2); transition:all .2s; }
        .idx-cta:hover{ background:#1e293b; box-shadow:0 5px 16px rgba(15,23,42,.28); transform:translateY(-2px); }

        @keyframes idxFadeUp  { to{ opacity:1; transform:translateY(0); } }
        @keyframes idxShimmer { to{ background-position:-200% 0; } }
      `}</style>

      <div className="idx-page min-h-screen">
        <Header isLoggedIn={!!user} userName={user?.username} isAdmin={isAdmin} />

        <div className="idx-body">

          {/* Page header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:4 }}>
            <div>
              <h1 className="idx-title">Community Issues</h1>
              <p className="idx-sub">Browse and track civic issues reported in your area</p>
            </div>
            {/* {user && <button className="idx-cta" onClick={() => navigate('/report')}>+ Report Issue</button>} */}
          </div>

          {/* Stat cards */}
          <div className="idx-stat-grid">
            <div className="idx-stat">
              <div className="idx-stat-icon" style={{ background:'#eff6ff' }}><LayoutGrid size={18} color="#2563eb" /></div>
              <p className="idx-stat-label">Total Issues</p>
              <p className="idx-stat-val">{issues.length}</p>
            </div>
            <div className="idx-stat">
              <div className="idx-stat-icon" style={{ background:'#fef2f2' }}><AlertTriangle size={18} color="#dc2626" /></div>
              <p className="idx-stat-label">Urgent</p>
              <p className="idx-stat-val" style={{ color:'#dc2626' }}>{urgentCount}</p>
            </div>
            <div className="idx-stat">
              <div className="idx-stat-icon" style={{ background:'#fefce8' }}><TrendingUp size={18} color="#ca8a04" /></div>
              <p className="idx-stat-label">In Progress</p>
              <p className="idx-stat-val" style={{ color:'#ca8a04' }}>{inProgressCount}</p>
            </div>
            <div className="idx-stat">
              <div className="idx-stat-icon" style={{ background:'#f0fdf4' }}><CheckCircle size={18} color="#16a34a" /></div>
              <p className="idx-stat-label">Resolved</p>
              <p className="idx-stat-val" style={{ color:'#16a34a' }}>{resolvedCount}</p>
            </div>
          </div>

          {/* Filter card — wraps the ORIGINAL filter JSX with zero changes to logic */}
          <div className="idx-filter-card">
            <div className="mb-4 space-y-4">

              {/* ── ORIGINAL row 1: selects + search + button ── */}
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="reported">Reported</SelectItem>
                    <SelectItem value="progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                  <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Distance" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Distances</SelectItem>
                    <SelectItem value="1km">Within 1 km</SelectItem>
                    <SelectItem value="3km">Within 3 km</SelectItem>
                    <SelectItem value="5km">Within 5 km</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search issues..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="idx-search w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <Button onClick={handleSearch} className="w-full md:w-auto">
                  <Search className="w-4 h-4 mr-2" />
                  Search Issues
                </Button>
              </div>

              {/* ── ORIGINAL row 2: view toggle + location ── */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* View toggle — same onClick handlers, styled wrapper only */}
                <div className="idx-view-wrap">
                  <button className={`idx-view-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')}>
                    <Grid size={14} /> Grid
                  </button>
                  <button className={`idx-view-btn${viewMode === 'map' ? ' active' : ''}`} onClick={() => setViewMode('map')}>
                    <Map size={14} /> Map
                  </button>
                </div>

                {/* ORIGINAL location buttons */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleGetLocation} disabled={locationLoading}>
                    {locationLoading ? (
                      <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <MapPin className="w-4 h-4 mr-1" />
                    )}
                    {locationLoading ? 'Getting Location...' : 'Get My Location'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowLocationInput(!showLocationInput)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Manual Location
                  </Button>
                </div>
              </div>

              {/* ORIGINAL manual location input */}
              {showLocationInput && (
                <div className="idx-manual">
                  <h3 className="idx-manual-title">Enter Manual Location</h3>
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Latitude</label>
                      <input type="number" step="any" placeholder="e.g., 23.0225" value={manualLatitude} onChange={(e) => setManualLatitude(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Longitude</label>
                      <input type="number" step="any" placeholder="e.g., 72.5714" value={manualLongitude} onChange={(e) => setManualLongitude(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleManualLocationSubmit} size="sm" className="w-full md:w-auto" disabled={locationLoading}>
                        {locationLoading ? (
                          <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : 'Set Location'}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Example: Ahmedabad coordinates are approximately 23.0225, 72.5714</p>
                </div>
              )}

              {/* ORIGINAL location status */}
              {userLocation && (
                <div className="idx-loc-banner">
                  <div className="idx-loc-icon"><MapPin size={15} color="#16a34a" /></div>
                  <div className="flex-1">
                    <div style={{ fontSize:12, fontWeight:600, color:'#16a34a', fontFamily:"'Sora',sans-serif" }}>Location active</div>
                    <div style={{ fontSize:11, color:'#4ade80', marginTop:2 }}>
                      {locationAddress || `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleClearLocation} className="text-red-600 hover:text-red-700">Clear</Button>
                </div>
              )}
            </div>
          </div>

          {/* Issues display — wrapped in table card */}
          <div className="idx-table-card">
            <div className="idx-table-head">
              <span className="idx-table-title">{viewMode === 'grid' ? 'Issues' : 'Map View'}</span>
              <span className="idx-table-count">{issues.length} results</span>
            </div>

            {/* ORIGINAL loading/issues/empty conditional — only wrapper classNames changed */}
            {loading ? (
              <div className="idx-skel-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="idx-skel">
                    <div className="idx-skel-img" />
                    <div className="idx-skel-body">
                      <div className="idx-skel-line" />
                      <div className="idx-skel-line" style={{ width:'65%' }} />
                      <div className="idx-skel-line" style={{ width:'80%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : issues.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <div className="idx-grid">
                    {issues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} onClick={() => handleIssueClick(issue)} />
                    ))}
                  </div>
                ) : (
                  <div className="relative" style={{ height: '600px' }}>
                    <div className="idx-map-legend">
                      <h4>Issue Categories</h4>
                      {[
                        { label:'Garbage Collection', color:'#28a745' },
                        { label:'Road Issues',        color:'#ffc107' },
                        { label:'Streetlight',        color:'#17a2b8' },
                        { label:'Drainage',           color:'#20c997' },
                      ].map(item => (
                        <div key={item.label} className="idx-legend-row">
                          <div className="idx-legend-dot" style={{ background:item.color }} />
                          {item.label}
                        </div>
                      ))}
                    </div>
                    <MapView issues={issues} userLocation={userLocation} />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:16, fontWeight:600, color:'#475569', marginBottom:8 }}>No issues found</h3>
                <p style={{ fontSize:14, color:'#94a3b8', marginBottom:20 }}>Try adjusting your search or filters</p>
                {user && <button className="idx-cta" onClick={() => navigate('/report')}>+ Report First Issue</button>}
              </div>
            )}
          </div>

          {/* ORIGINAL pagination — only wrapper + button classNames changed */}
          {totalPages > 0 && (
            <div className="idx-pg">
              <button className="idx-pg-btn" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                <ChevronLeft size={16} />
              </button>
              {generatePageNumbers().map((page, index) => (
                <button
                  key={index}
                  className={`idx-pg-btn${page === currentPage ? ' active' : ''}`}
                  disabled={page === '...'}
                  style={page === '...' ? { border:'none', background:'transparent', cursor:'default' } : {}}
                  onClick={() => typeof page === 'number' && handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              <button className="idx-pg-btn" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Index;