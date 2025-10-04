
import { PRAYER_ANGLES, OFFSETS } from '../constants';
import { PrayerTimes } from '../types';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function julianDate(date: Date): number {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  let day = date.getUTCDate();
  if (month <= 2) {
    year--;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function sunDeclination(jd: number): number {
  const D = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * D) % 360;
  const q = (280.459 + 0.98564736 * D) % 360;
  const L = (q + 1.915 * Math.sin(g * DEG_TO_RAD) + 0.020 * Math.sin(2 * g * DEG_TO_RAD)) % 360;
  const e = 23.439 - 0.00000036 * D;
  return Math.asin(Math.sin(e * DEG_TO_RAD) * Math.sin(L * DEG_TO_RAD));
}

function equationOfTime(jd: number): number {
  const D = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * D) % 360;
  const q = (280.459 + 0.98564736 * D) % 360;
  const L = (q + 1.915 * Math.sin(g * DEG_TO_RAD) + 0.020 * Math.sin(2 * g * DEG_TO_RAD)) % 360;
  const e = 23.439 - 0.00000036 * D;
  const RA = Math.atan2(Math.cos(e * DEG_TO_RAD) * Math.sin(L * DEG_TO_RAD), Math.cos(L * DEG_TO_RAD)) * RAD_TO_DEG;
  return (q / 15.0 - RA / 15.0) * 60;
}

function hourAngle(lat: number, decl: number, angle: number): number {
    const term = (Math.sin(-angle * DEG_TO_RAD) - Math.sin(lat * DEG_TO_RAD) * Math.sin(decl)) /
                 (Math.cos(lat * DEG_TO_RAD) * Math.cos(decl));

    // Clamp the value to the valid range for Math.acos: [-1, 1]
    // This handles cases for high latitudes where the sun may not reach a certain angle,
    // preventing Math.acos from returning NaN.
    const clampedTerm = Math.max(-1, Math.min(1, term));

    return Math.acos(clampedTerm) * RAD_TO_DEG;
}


export function calculatePrayerTimes(lat: number, lon: number, date: Date): PrayerTimes {
  const JD = julianDate(date);
  const decl = sunDeclination(JD);
  const E = equationOfTime(JD);

  // Get the timezone offset in hours from UTC.
  // getTimezoneOffset returns minutes and the sign is inverted (e.g., UTC+3 is -180).
  const timezone = -date.getTimezoneOffset() / 60;

  // Calculate solar noon in local standard time.
  const solarNoon = 12 + timezone - (lon / 15) - (E / 60);

  const sunriseAngle = 0.833;
  const ha_sunrise = hourAngle(lat, decl, sunriseAngle);
  const sunrise = solarNoon - ha_sunrise / 15;
  const sunset = solarNoon + ha_sunrise / 15;

  const ha_fajr = hourAngle(lat, decl, PRAYER_ANGLES.fajr);
  const fajr = solarNoon - ha_fajr / 15;
  
  const ha_isha = hourAngle(lat, decl, PRAYER_ANGLES.isha);
  const isha = solarNoon + ha_isha / 15;
  
  // Asr time is when the shadow of an object is equal to its length plus its shadow length at noon.
  // This is implemented by finding the sun's altitude `alpha` where `cot(alpha) = 1 + tan|lat - decl|`.
  const zenithAtNoon = Math.abs(lat * DEG_TO_RAD - decl);
  const shadowLengthFactor = 1 + Math.tan(zenithAtNoon);
  const asrAltitudeRad = Math.atan(1 / shadowLengthFactor);
  const asrAltitudeDeg = asrAltitudeRad * RAD_TO_DEG;

  // The hourAngle function expects a depression angle (angle below horizon),
  // which is the negative of the altitude angle.
  const ha_asr = hourAngle(lat, decl, -asrAltitudeDeg);
  const asr = solarNoon + ha_asr / 15;

  const normalize = (hour: number) => {
    let h = hour % 24;
    return h < 0 ? h + 24 : h;
  };

  return {
    fajr: normalize(fajr + OFFSETS.fajr / 60),
    sunrise: normalize(sunrise + OFFSETS.sunrise / 60),
    dhuhr: normalize(solarNoon + OFFSETS.dhuhr / 60),
    asr: normalize(asr + OFFSETS.asr / 60),
    maghrib: normalize(sunset + OFFSETS.maghrib / 60),
    isha: normalize(isha + OFFSETS.isha / 60)
  };
}

// Fix: Export formatTime as a standalone function for proper module usage.
export function formatTime(hours: number): string {
    if (isNaN(hours)) {
        return "--:--";
    }
    const totalSeconds = Math.round(hours * 3600);
    const h = Math.floor(totalSeconds / 3600) % 24;
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}