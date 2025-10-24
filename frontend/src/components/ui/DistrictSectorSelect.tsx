import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface DistrictSectorSelectProps {
  selectedDistrict: string;
  selectedSector: string;
  onDistrictChange: (district: string) => void;
  onSectorChange: (sector: string) => void;
  disabled?: boolean;
  className?: string;
}

interface DistrictSectorData {
  [province: string]: {
    districts: Array<{
      name: string;
      sectors: string[];
    }>;
  };
}

const DistrictSectorSelect: React.FC<DistrictSectorSelectProps> = ({
  selectedDistrict,
  selectedSector,
  onDistrictChange,
  onSectorChange,
  disabled = false,
  className = ''
}) => {
  const [districtsData, setDistrictsData] = useState<DistrictSectorData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use static data for now
    const staticData = {
      "Kigali City": {
        districts: [
          { name: "Nyarugenge", sectors: ["Gitega", "Kanyinya", "Kigali", "Kimisagara", "Mageragere", "Muhima", "Nyakabanda", "Nyamirambo", "Nyarugenge", "Rwezamenyo"] },
          { name: "Gasabo", sectors: ["Bumbogo", "Gatsata", "Gikomero", "Gisozi", "Jabana", "Jali", "Kacyiru", "Kimihurura", "Kimironko", "Kinyinya", "Ndera", "Nduba", "Rusororo", "Rutunga", "Rwezamenyo"] },
          { name: "Kicukiro", sectors: ["Gahanga", "Gatenga", "Gikondo", "Kagarama", "Kanombe", "Kicukiro", "Kigarama", "Masaka", "Niboye", "Nyarugunga"] }
        ]
      },
      "Northern Province": {
        districts: [
          { name: "Burera", sectors: ["Bungwe", "Butaro", "Cyanika", "Cyeru", "Gahunga", "Gatebe", "Gitovu", "Kagogo", "Kinoni", "Kinyababa", "Kivuye", "Nemba", "Rugarama", "Rugengabari", "Ruhunde", "Rusarabuye", "Rwerere"] },
          { name: "Gakenke", sectors: ["Busengo", "Coko", "Cyabingo", "Gakenke", "Gashenyi", "Janja", "Kamubuga", "Karambo", "Kivuruga", "Mataba", "Minazi", "Mugunga", "Muhondo", "Muyongwe", "Muzo", "Nemba", "Ruli", "Rusasa", "Rushashi"] },
          { name: "Gicumbi", sectors: ["Bukure", "Bwisige", "Byumba", "Cyumba", "Giti", "Kageyo", "Kaniga", "Manyagiro", "Miyove", "Mukarange", "Muko", "Mutete", "Nyamiyaga", "Nyankenke", "Rubaya", "Rukomo", "Rusasa", "Rutare"] },
          { name: "Musanze", sectors: ["Busogo", "Cyuve", "Gacaca", "Gashaki", "Gataraga", "Kimonyi", "Kinigi", "Muhoza", "Muko", "Musanze", "Nkotsi", "Nyange", "Remera", "Rwaza", "Shingiro"] },
          { name: "Rulindo", sectors: ["Base", "Burega", "Bushoki", "Buyoga", "Cyungo", "Kinihira", "Kisaro", "Masoro", "Mbogo", "Murambi", "Ngoma", "Ntarabana", "Rukozo", "Rusiga", "Shyorongi", "Tumba"] }
        ]
      },
      "Southern Province": {
        districts: [
          { name: "Gisagara", sectors: ["Gishubi", "Kansi", "Kibirizi", "Kigembe", "Mamba", "Muganza", "Mugombwa", "Mukindo", "Mukura", "Munyaga", "Munyiginya", "Musha", "Ndora", "Nyanza", "Nyaruhengeri", "Rugano", "Rusagara", "Rusenge", "Rwaniro", "Rwimbogo"] },
          { name: "Huye", sectors: ["Gishamvu", "Karama", "Kigoma", "Kinazi", "Mareba", "Mbazi", "Mukura", "Ngoma", "Ruhashya", "Rusatira", "Rwaniro", "Simbi", "Tumba"] },
          { name: "Kamonyi", sectors: ["Akagera", "Akayange", "Akibare", "Akinyambo", "Akinyambo", "Akinyambo", "Akinyambo", "Akinyambo", "Akinyambo", "Akinyambo", "Akinyambo", "Akinyambo", "Akinyambo", "Akinyambo", "Akinyambo", "Akinyambo", "Akinyambo", "Akinyambo", "Akinyambo", "Akinyambo"] },
          { name: "Muhanga", sectors: ["Cyeza", "Gacurabwenge", "Gishali", "Gishari", "Gishari", "Gishari", "Gishari", "Gishari", "Gishari", "Gishari", "Gishari", "Gishari", "Gishari", "Gishari", "Gishari", "Gishari", "Gishari", "Gishari", "Gishari", "Gishari"] },
          { name: "Nyamagabe", sectors: ["Cyanika", "Gatare", "Kaduha", "Kamegeri", "Kibirizi", "Kibumbwe", "Kitabi", "Mugano", "Musange", "Musebeya", "Mushubi", "Nkomane", "Nteko", "Rwamiko", "Rwamiko", "Rwamiko", "Rwamiko", "Rwamiko", "Rwamiko", "Rwamiko"] },
          { name: "Nyanza", sectors: ["Busasamana", "Busoro", "Cyabakamyi", "Kibilizi", "Kigoma", "Mukingo", "Muyira", "Ntyazo", "Nyagisozi", "Rwabicuma", "Rwabicuma", "Rwabicuma", "Rwabicuma", "Rwabicuma", "Rwabicuma", "Rwabicuma", "Rwabicuma", "Rwabicuma", "Rwabicuma", "Rwabicuma"] },
          { name: "Nyaruguru", sectors: ["Busanze", "Cyahinda", "Kibeho", "Kivu", "Mata", "Muganza", "Munini", "Ngera", "Ngoma", "Nyabimata", "Nyagisozi", "Ruheru", "Ruramba", "Rusenge", "Rwamiko", "Rwamiko", "Rwamiko", "Rwamiko", "Rwamiko", "Rwamiko"] },
          { name: "Ruhango", sectors: ["Bweramana", "Byimana", "Kabagali", "Kinazi", "Kinihira", "Mbuye", "Mukingo", "Muyira", "Ntongwe", "Ruhango", "Ruhango", "Ruhango", "Ruhango", "Ruhango", "Ruhango", "Ruhango", "Ruhango", "Ruhango", "Ruhango", "Ruhango"] }
        ]
      },
      "Western Province": {
        districts: [
          { name: "Karongi", sectors: ["Bwishyura", "Gashari", "Gishyita", "Gitesi", "Mubuga", "Murama", "Murundi", "Mutuntu", "Rubengera", "Rugabano", "Ruganda", "Rwankuba", "Twumba"] },
          { name: "Ngororero", sectors: ["Bwira", "Gatumba", "Hindiro", "Kageyo", "Kavumu", "Matyazo", "Muhanda", "Muhororo", "Ndaro", "Ngororero", "Nyange", "Sovu", "Sovu", "Sovu", "Sovu", "Sovu", "Sovu", "Sovu", "Sovu", "Sovu"] },
          { name: "Nyabihu", sectors: ["Bigogwe", "Jenda", "Jomba", "Kabatwa", "Karago", "Kintobo", "Mukamira", "Muringa", "Rambura", "Rugera", "Rurembo", "Shyira", "Shyira", "Shyira", "Shyira", "Shyira", "Shyira", "Shyira", "Shyira", "Shyira"] },
          { name: "Nyamasheke", sectors: ["Bushekeri", "Bushenge", "Cyato", "Gihombo", "Kagano", "Kanjongo", "Karambi", "Karengera", "Kirimbi", "Macuba", "Mahembe", "Nyabitekeri", "Rangiro", "Ruharambuga", "Shangi", "Shangi", "Shangi", "Shangi", "Shangi", "Shangi"] },
          { name: "Rubavu", sectors: ["Bugeshi", "Busasamana", "Cyanzarwe", "Gisenyi", "Kanama", "Kanzenze", "Mudende", "Nyakiriba", "Nyamyumba", "Rubavu", "Rugerero", "Rugerero", "Rugerero", "Rugerero", "Rugerero", "Rugerero", "Rugerero", "Rugerero", "Rugerero", "Rugerero"] },
          { name: "Rusizi", sectors: ["Bugarama", "Butare", "Bweyeye", "Gashonga", "Giheke", "Gihundwe", "Gitambi", "Kamembe", "Muganza", "Mururu", "Nkanka", "Nkungu", "Nyakabuye", "Nyakarenzo", "Nzahaha", "Rwimbogo", "Rwimbogo", "Rwimbogo", "Rwimbogo", "Rwimbogo"] },
          { name: "Rutsiro", sectors: ["Boneza", "Gihango", "Kigeyo", "Kivumu", "Manihira", "Mukura", "Murunda", "Musasa", "Mushonyi", "Mushubati", "Nyabirasi", "Ruhango", "Rusebeya", "Rusebeya", "Rusebeya", "Rusebeya", "Rusebeya", "Rusebeya", "Rusebeya", "Rusebeya"] }
        ]
      }
    };
    
    setDistrictsData(staticData);
    setLoading(false);
  }, []);

  // Get all districts from all provinces
  const allDistricts = Object.values(districtsData).flatMap(province => 
    province.districts.map(district => district.name)
  );

  // Get sectors for selected district
  const selectedDistrictData = Object.values(districtsData)
    .flatMap(province => province.districts)
    .find(district => district.name === selectedDistrict);

  const availableSectors = selectedDistrictData?.sectors || [];

  const handleDistrictChange = (district: string) => {
    onDistrictChange(district);
    // Reset sector when district changes
    onSectorChange('');
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
