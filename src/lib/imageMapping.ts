// Image mapping utility for CivicTrack
// Maps categories to appropriate images from the public folder

export const PUBLIC_IMAGES = {
  // Road-related issues
  'Pothole on main road.png': 'Road pothole issue',
  'Road marking faded.png': 'Faded road markings',
  
  // Safety and infrastructure
  'missing manhole cover.png': 'Missing manhole cover',
  
  // Traffic and parking
  'illegal parking.png': 'Illegal parking violation',
  'parking.png': 'Parking issues',
  'high traffic.png': 'High traffic congestion',
  'rules break.png': 'Traffic rules violation',
  
  // Environmental and cleanliness
  'hole.png': 'Garbage collection issues',
  'flood.png': 'Water and drainage issues',
  
  // Obstructions and street furniture
  'broken street furniture.png': 'Damaged street furniture',
  'Street vendor obstruction.png': 'Street vendor obstruction',
  
  // Placeholder
  'placeholder.svg': 'Default placeholder image'
} as const;

export type ImageKey = keyof typeof PUBLIC_IMAGES;

// Category to image mapping
export const CATEGORY_IMAGE_MAP: Record<string, ImageKey> = {
  // Road issues
  'road': 'Pothole on main road.png',
  'roads': 'Pothole on main road.png',
  'road marking': 'Road marking faded.png',
  'road markings': 'Road marking faded.png',
  
  // Lighting and infrastructure
  'streetlight': 'missing manhole cover.png',
  'lighting': 'missing manhole cover.png',
  'public safety': 'missing manhole cover.png',
  
  // Traffic and parking
  'traffic signal': 'illegal parking.png',
  'traffic': 'illegal parking.png',
  'parking': 'parking.png',
  'traffic rules': 'rules break.png',
  'rules break': 'rules break.png',
  'high traffic': 'high traffic.png',
  'traffic congestion': 'high traffic.png',
  
  // Environmental
  'garbage collection': 'hole.png',
  'cleanliness': 'hole.png',
  'water supply': 'flood.png',
  'drainage': 'flood.png',
  
  // Obstructions
  'obstructions': 'broken street furniture.png',
  'street vendor': 'Street vendor obstruction.png',
  'vendor obstruction': 'Street vendor obstruction.png',
  
  // Default fallback
  'default': 'missing manhole cover.png'
};

/**
 * Get the appropriate image for a given category
 * @param category - The issue category
 * @returns The image path from public folder
 */
export function getImageForCategory(category: string | any): string {
  if (!category) return `/${CATEGORY_IMAGE_MAP.default}`;
  
  const categoryName = typeof category === 'string' 
    ? category.toLowerCase().trim() 
    : (category as any)?.name?.toLowerCase().trim() || '';
  
  // Try exact match first
  if (CATEGORY_IMAGE_MAP[categoryName]) {
    return `/${CATEGORY_IMAGE_MAP[categoryName]}`;
  }
  
  // Try partial matches
  for (const [key, image] of Object.entries(CATEGORY_IMAGE_MAP)) {
    if (categoryName.includes(key) || key.includes(categoryName)) {
      return `/${image}`;
    }
  }
  
  // Return default
  return `/${CATEGORY_IMAGE_MAP.default}`;
}

/**
 * Get a random image from the available images
 * @returns A random image path
 */
export function getRandomImage(): string {
  const images = Object.values(CATEGORY_IMAGE_MAP);
  const randomIndex = Math.floor(Math.random() * images.length);
  return `/${images[randomIndex]}`;
}

/**
 * Get all available images for a specific category type
 * @param categoryType - The type of category (e.g., 'road', 'traffic', 'environmental')
 * @returns Array of image paths
 */
export function getImagesForCategoryType(categoryType: string): string[] {
  const typeMap: Record<string, ImageKey[]> = {
    road: ['Pothole on main road.png', 'Road marking faded.png'],
    traffic: ['illegal parking.png', 'parking.png', 'high traffic.png', 'rules break.png'],
    safety: ['missing manhole cover.png'],
    environmental: ['hole.png', 'flood.png'],
    obstructions: ['broken street furniture.png', 'Street vendor obstruction.png']
  };
  
  const images = typeMap[categoryType.toLowerCase()] || [];
  return images.map(img => `/${img}`);
}

/**
 * Get image description for accessibility
 * @param imagePath - The image path
 * @returns Description of the image
 */
export function getImageDescription(imagePath: string): string {
  const imageName = imagePath.replace('/', '') as ImageKey;
  return PUBLIC_IMAGES[imageName] || 'Issue image';
} 