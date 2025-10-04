
import React from 'react';
// Fix: Import `formatTime` which will be correctly exported after refactoring.
import { formatTime } from '../utils/prayerTimeCalculator';

interface PrayerTimeRowProps {
  name: string;
  time: number;
}

const PrayerTimeRow: React.FC<PrayerTimeRowProps> = ({ name, time }) => {
  return (
    <div className="flex justify-between items-center p-4 rounded-lg bg-gray-100">
      <span className="text-2xl text-gray-800">{name}</span>
      <span className="font-sans text-4xl font-bold text-black">{formatTime(time)}</span>
    </div>
  );
};

export default PrayerTimeRow;