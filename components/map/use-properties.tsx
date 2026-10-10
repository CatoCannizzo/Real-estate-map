//Hook for mapview and sub components to fetch and manage property data
//currently returns test data
import { useState, useEffect } from 'react';
import type { Property } from './property-type';

const MOCK_PROPERTIES: Property[] = [
  { id: '1', latitude: 47.0379, longitude: -122.9010, price: 650000 },
  { id: '2', latitude: 47.0500, longitude: -122.9000, price: 420000 },
  { id: '3', latitude: 47.0400, longitude: -122.9100, price: 890000 },
];

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch from api here
    async function loadProperties() {
        setIsLoading(true);
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setProperties(MOCK_PROPERTIES);
        setIsLoading(false);
    }
    loadProperties();
  }, []);

  return { properties, isLoading };
}