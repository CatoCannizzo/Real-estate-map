//Property interface to define the structure of a property object, currently just used for pins and popups
export interface Property {
  id: string;
  latitude: number;
  longitude: number;
  price?: number;
  address?: string;
  beds?: number;
  baths?: number;
}