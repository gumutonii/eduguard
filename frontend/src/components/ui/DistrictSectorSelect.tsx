import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { getDistricts, getSectorsByDistrict } from '@/lib/rwandaDistrictsSectors';

interface DistrictSectorSelectProps {
  selectedDistrict: string;
  selectedSector: string;
  onDistrictChange: (district: string) => void;
  onSectorChange: (sector: string) => void;
  disabled?: boolean;
  className?: string;
}

const DistrictSectorSelect: React.FC<DistrictSectorSelectProps> = ({
  selectedDistrict,
  selectedSector,
  onDistrictChange,
  onSectorChange,
  disabled = false,
  className = ''
}) => {
  // Get all districts from the complete Rwanda data
  const allDistricts = getDistricts();

  // Get sectors for selected district
  const availableSectors = selectedDistrict ? getSectorsByDistrict(selectedDistrict) : [];

  const handleDistrictChange = (district: string) => {
    onDistrictChange(district);
    // Reset sector when district changes
    onSectorChange('');
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* District Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          District *
        </label>
        <div className="relative">
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select District</option>
            {allDistricts.map((district, index) => (
              <option key={`district-${index}-${district}`} value={district}>
                {district}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Sector Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sector *
        </label>
        <div className="relative">
          <select
            value={selectedSector}
            onChange={(e) => onSectorChange(e.target.value)}
            disabled={disabled || !selectedDistrict}
            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select Sector</option>
            {availableSectors.map((sector, index) => (
              <option key={`sector-${index}-${sector}`} value={sector}>
                {sector}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default DistrictSectorSelect;
