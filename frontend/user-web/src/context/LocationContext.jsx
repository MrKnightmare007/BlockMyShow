import { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export const CITIES = [
  'Kolkata',
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Ahmedabad'
];

export const LocationProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState(localStorage.getItem('selectedCity') || 'Kolkata');
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  useEffect(() => {
    localStorage.setItem('selectedCity', selectedCity);
  }, [selectedCity]);

  const detectLocation = () => {
    setIsAutoDetecting(true);
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      setIsAutoDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use Nominatim (OpenStreetMap) for free reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );
          const data = await response.json();
          
          const city = data.address.city || data.address.state_district || data.address.town || data.address.village;
          
          if (city) {
            // Find closest match in our supported cities list
            const matchedCity = CITIES.find(c => city.toLowerCase().includes(c.toLowerCase()));
            if (matchedCity) {
              setSelectedCity(matchedCity);
            } else {
              console.log('City detected but not in our list:', city);
              // Fallback or just set the detected city if you want to support all
            }
          }
        } catch (error) {
          console.error('Error fetching location details:', error);
        } finally {
          setIsAutoDetecting(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsAutoDetecting(false);
      }
    );
  };

  // Auto-detect on first load if no city is set
  useEffect(() => {
    if (!localStorage.getItem('selectedCity')) {
      detectLocation();
    }
  }, []);

  return (
    <LocationContext.Provider value={{ selectedCity, setSelectedCity, detectLocation, isAutoDetecting, cities: CITIES }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
