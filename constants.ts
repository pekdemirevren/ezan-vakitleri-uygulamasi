
import { PrayerName } from './types';

// Türkiye Diyanet standard angles
export const PRAYER_ANGLES = {
  fajr: 18,
  isha: 17
};

// Diyanet offset values (in minutes)
export const OFFSETS = {
  fajr: -2,
  sunrise: -6,
  dhuhr: 7,
  asr: 4,
  maghrib: 7,
  isha: 1
};

export const PRAYER_NAMES_TR: Record<PrayerName, string> = {
  fajr: 'İmsak',
  sunrise: 'Güneş',
  dhuhr: 'Öğle',
  asr: 'İkindi',
  maghrib: 'Akşam',
  isha: 'Yatsı'
};
