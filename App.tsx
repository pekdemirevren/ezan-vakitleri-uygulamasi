
import React, { useState, useEffect, useCallback } from 'react';
import { PrayerTimes, PrayerName } from './types';
import { calculatePrayerTimes } from './utils/prayerTimeCalculator';
import { PRAYER_NAMES_TR } from './constants';
import PrayerTimeRow from './components/PrayerTimeRow';
import { LocationMarkerIcon, CalendarIcon } from './components/Icons';

const App: React.FC = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [location, setLocation] = useState<string>('Konum alınıyor...');
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string>('');

  const setupNotifications = useCallback((times: PrayerTimes) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      (Object.keys(times) as PrayerName[]).forEach((key) => {
        const prayerDecimalHour = times[key];
        const prayerMinutes = Math.floor(prayerDecimalHour * 60);
        const delay = (prayerMinutes - currentMinutes) * 60 * 1000;

        if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Check if it's in the future today
          setTimeout(() => {
            new Notification('Ezan Vakti', {
              body: `${PRAYER_NAMES_TR[key]} vakti geldi.`,
              icon: 'https://picsum.photos/192', // A placeholder icon
            });
          }, delay);
        }
      });
    }
  }, []);

  const fetchPrayerTimes = useCallback(async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      const { latitude, longitude } = position.coords;
      
      const times = calculatePrayerTimes(latitude, longitude, new Date());
      setPrayerTimes(times);
      
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
      setupNotifications(times);

      // Reverse Geocoding
      try {
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=tr`);
        if (!geoResponse.ok) {
            throw new Error('Reverse geocoding failed');
        }
        const geoData = await geoResponse.json();
        const address = geoData.address;
        const locationParts = [
            address.country,
            address.province || address.state || address.city,
            address.county || address.suburb || address.town || address.village
        ];
        const locationString = locationParts.filter(Boolean).join(', ');
        setLocation(locationString || 'Konum adı bulunamadı.');
      } catch (geoError) {
        console.error("Reverse geocoding error:", geoError);
        setLocation('Konum adı alınamadı.');
      }

    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        setError(`Konum alınamadı: ${err.message}`);
      } else {
        setError('Bir hata oluştu.');
      }
      setLocation(''); // Clear location text on error
      console.error(err);
    }
  }, [setupNotifications]);

  useEffect(() => {
    setDate(new Date().toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));
    
    fetchPrayerTimes();
  }, [fetchPrayerTimes]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-4">
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Ezan Vakitleri
          </h1>
          <div className="text-gray-500 flex items-center justify-center gap-2">
             <CalendarIcon />
            <p id="date">{date}</p>
          </div>
          <div id="location" className="mt-2 text-sm text-gray-400 flex items-center justify-center gap-1 min-h-[20px]">
            {location && <LocationMarkerIcon />}
            {location}
          </div>
        </div>
        
        <div id="times" className="space-y-3">
          {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert"><p>{error}</p></div>}
          
          {!prayerTimes && !error && (
            <div className="text-center text-gray-500 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              Vakitler hesaplanıyor...
            </div>
          )}

          {prayerTimes && (Object.keys(prayerTimes) as PrayerName[]).map(key => (
            <PrayerTimeRow 
              key={key}
              name={PRAYER_NAMES_TR[key]}
              time={prayerTimes[key]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;