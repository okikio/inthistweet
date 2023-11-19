import type { ImageColorValue, MediaDetails } from "./media";

export interface TwitterCard {
  card_platform?: CardPlatform;
  name: string;
  url: string;
  binding_values: BindingValues;
}

export interface CardPlatform {
  platform: {
    audience: { name: string };
    device: { name: string; version: string };
  };
}

export interface BindingValues {
  unified_card?: UnifiedCard;
  [key: string]: BindingValue | undefined;
}

export interface BindingValue {
  string_value?: string;
  image_value?: ImageValue;
  image_color_value?: ImageColorValue;
  type: "IMAGE" | "STRING" | (string & {});
  scribe_key?: string;
  user_value?: UserValue;
}

export interface UnifiedCard extends BindingValue {
  string_value?: string;
  type: "STRING"
}

export interface ImageValue {
  height: number;
  width: number;
  url: string;
}

export interface UserValue {
  id_str: string;
  path: any[];
}

// Represents the main structure of the unified_card data
export interface UnifiedCardData {
  layout?: LayoutData;
  type?: string; // Example: "mixed_media_multi_dest_carousel_website"
  component_objects?: ComponentObjects;
  destination_objects: DestinationObjects;
  media_entities?: MediaEntities;
}

// Layout data structure
export interface LayoutData {
  type: string; // Example: "swipeable"
  data: LayoutDataDetails;
}

// Specific details within the layout data
export interface LayoutDataDetails {
  slides: Array<Array<string>>; // Array of arrays containing component keys
}

// Component objects within the unified_card
export interface ComponentObjects {
  [key: string]: ComponentObject;
}

// Individual component object (e.g., media, details)
export interface ComponentObject {
  type: string; // Example: "media" or "details"
  data: ComponentData;
}

// Data for each component object
export interface ComponentData {
  // This structure will vary based on the type of the component
  // For media: { id: string, destination: string }
  // For details: { title: { content: string, is_rtl: boolean }, ... }
  [key: string]: any;
}

// Destination objects referenced in components
export interface DestinationObjects {
  [key: string]: DestinationObject;
}

// Individual destination object
export interface DestinationObject {
  type: string; // Example: "browser"
  data: DestinationData;
}

// Data for each destination object
export interface DestinationData {
  url_data: {
    url: string;
    vanity: string;
  };
  media_id?: string; // Present in case of browser_with_docked_media type
}

// Media entities mapping media IDs to media details
export interface MediaEntities {
  [key: string]: MediaEntity;
}

// Represents a media entity
export interface MediaEntity {
  id: number;
  id_str: string;
  media_url_https: string;
  type: "photo" | "video" | (string & {}); // Example: "photo" or "video"
  original_info: {
    width: number;
    height: number;
    focus_rects: Array<FocusRect>;
  };
  sizes: MediaSizes;
}

// Focus rectangles for media
export interface FocusRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Different size variants of media
export interface MediaSizes {
  small: MediaSize;
  medium: MediaSize;
  large: MediaSize;
  thumb: MediaSize;
}

// Represents a single media size
export interface MediaSize {
  w: number;
  h: number;
  resize: string; // Example: "fit" or "crop"
}
