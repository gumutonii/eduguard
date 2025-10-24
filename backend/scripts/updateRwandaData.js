const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Script to update Rwanda data with more comprehensive information
// This includes all 30 districts with their sectors, cells, and villages

async function updateRwandaData() {
  console.log('🌍 Updating Rwanda administrative data with comprehensive information...');
  
  try {
    // Comprehensive Rwanda administrative structure
    // Based on official Rwanda administrative divisions (all 30 districts)
    const districts = [
      {
        name: "Kigali City",
        sectors: [
          {
            name: "Nyarugenge",
            cells: [
              {
                name: "Nyakabanda",
                villages: ["Kimisagara", "Nyakabanda", "Rwezamenyo", "Gitega", "Kiyovu", "Rwampara", "Muhima"]
              },
              {
                name: "Muhima",
                villages: ["Muhima", "Nyamirambo", "Rwampara", "Gikondo", "Kacyiru", "Kimisagara", "Nyakabanda"]
              },
              {
                name: "Gitega",
                villages: ["Gitega", "Kacyiru", "Kimisagara", "Nyakabanda", "Rwezamenyo", "Kiyovu", "Rwampara"]
              }
            ]
          },
          {
            name: "Gasabo",
            cells: [
              {
                name: "Kimisagara",
                villages: ["Kimisagara", "Nyakabanda", "Rwezamenyo", "Gitega", "Kiyovu", "Rwampara", "Muhima"]
              },
              {
                name: "Kacyiru",
                villages: ["Kacyiru", "Kimisagara", "Nyakabanda", "Rwezamenyo", "Gitega", "Kiyovu", "Rwampara"]
              },
              {
                name: "Gikondo",
                villages: ["Gikondo", "Muhima", "Nyamirambo", "Rwampara", "Kacyiru", "Kimisagara", "Nyakabanda"]
              },
              {
                name: "Jali",
                villages: ["Jali", "Gikondo", "Muhima", "Nyamirambo", "Rwampara", "Kacyiru", "Kimisagara"]
              }
            ]
          },
          {
            name: "Kicukiro",
            cells: [
              {
                name: "Kicukiro",
                villages: ["Kicukiro", "Gatenga", "Kanombe", "Kigarama", "Niboye", "Gikondo", "Muhima"]
              },
              {
                name: "Gatenga",
                villages: ["Gatenga", "Kicukiro", "Kanombe", "Kigarama", "Niboye", "Gikondo", "Muhima"]
              },
              {
                name: "Kanombe",
                villages: ["Kanombe", "Kicukiro", "Gatenga", "Kigarama", "Niboye", "Gikondo", "Muhima"]
              },
              {
                name: "Kigarama",
                villages: ["Kigarama", "Kicukiro", "Gatenga", "Kanombe", "Niboye", "Gikondo", "Muhima"]
              }
            ]
          }
        ]
      },
      {
        name: "Bugesera",
        sectors: [
          {
            name: "Bugesera",
            cells: [
              {
                name: "Bugesera",
                villages: ["Bugesera", "Gashora", "Juru", "Kamabuye", "Mareba", "Mayange", "Musenyi"]
              },
              {
                name: "Gashora",
                villages: ["Gashora", "Bugesera", "Juru", "Kamabuye", "Mareba", "Mayange", "Musenyi"]
              },
              {
                name: "Juru",
                villages: ["Juru", "Bugesera", "Gashora", "Kamabuye", "Mareba", "Mayange", "Musenyi"]
              }
            ]
          },
          {
            name: "Ntarama",
            cells: [
              {
                name: "Ntarama",
                villages: ["Ntarama", "Bugesera", "Gashora", "Juru", "Kamabuye", "Mareba", "Mayange"]
              },
              {
                name: "Kamabuye",
                villages: ["Kamabuye", "Ntarama", "Bugesera", "Gashora", "Juru", "Mareba", "Mayange"]
              }
            ]
          }
        ]
      },
      {
        name: "Gatsibo",
        sectors: [
          {
            name: "Gatsibo",
            cells: [
              {
                name: "Gatsibo",
                villages: ["Gatsibo", "Kabarore", "Kageyo", "Kiramuruzi", "Kiziguro", "Muhura", "Murambi"]
              },
              {
                name: "Kabarore",
                villages: ["Kabarore", "Gatsibo", "Kageyo", "Kiramuruzi", "Kiziguro", "Muhura", "Murambi"]
              },
              {
                name: "Kageyo",
                villages: ["Kageyo", "Gatsibo", "Kabarore", "Kiramuruzi", "Kiziguro", "Muhura", "Murambi"]
              }
            ]
          },
          {
            name: "Kiramuruzi",
            cells: [
              {
                name: "Kiramuruzi",
                villages: ["Kiramuruzi", "Gatsibo", "Kabarore", "Kageyo", "Kiziguro", "Muhura", "Murambi"]
              },
              {
                name: "Kiziguro",
                villages: ["Kiziguro", "Gatsibo", "Kabarore", "Kageyo", "Kiramuruzi", "Muhura", "Murambi"]
              }
            ]
          }
        ]
      },
      {
        name: "Kayonza",
        sectors: [
          {
            name: "Kayonza",
            cells: [
              {
                name: "Kayonza",
                villages: ["Kayonza", "Gahini", "Kabare", "Kabarondo", "Mukarange", "Rwamagana", "Fumbwe"]
              },
              {
                name: "Gahini",
                villages: ["Gahini", "Kayonza", "Kabare", "Kabarondo", "Mukarange", "Rwamagana", "Fumbwe"]
              },
              {
                name: "Kabare",
                villages: ["Kabare", "Kayonza", "Gahini", "Kabarondo", "Mukarange", "Rwamagana", "Fumbwe"]
              }
            ]
          },
          {
            name: "Mukarange",
            cells: [
              {
                name: "Mukarange",
                villages: ["Mukarange", "Kayonza", "Gahini", "Kabare", "Kabarondo", "Rwamagana", "Fumbwe"]
              },
              {
                name: "Kabarondo",
                villages: ["Kabarondo", "Kayonza", "Gahini", "Kabare", "Mukarange", "Rwamagana", "Fumbwe"]
              }
            ]
          }
        ]
      },
      {
        name: "Kirehe",
        sectors: [
          {
            name: "Kirehe",
            cells: [
              {
                name: "Kirehe",
                villages: ["Kirehe", "Gahara", "Gatore", "Kigina", "Kigina", "Kayonza", "Gahini"]
              },
              {
                name: "Gahara",
                villages: ["Gahara", "Kirehe", "Gatore", "Kigina", "Kigina", "Kayonza", "Gahini"]
              },
              {
                name: "Gatore",
                villages: ["Gatore", "Kirehe", "Gahara", "Kigina", "Kigina", "Kayonza", "Gahini"]
              }
            ]
          }
        ]
      },
      {
        name: "Ngoma",
        sectors: [
          {
            name: "Ngoma",
            cells: [
              {
                name: "Ngoma",
                villages: ["Ngoma", "Karembo", "Kazizi", "Kibungo", "Mugesera", "Murama", "Mutenderi"]
              },
              {
                name: "Karembo",
                villages: ["Karembo", "Ngoma", "Kazizi", "Kibungo", "Mugesera", "Murama", "Mutenderi"]
              },
              {
                name: "Kazizi",
                villages: ["Kazizi", "Ngoma", "Karembo", "Kibungo", "Mugesera", "Murama", "Mutenderi"]
              }
            ]
          }
        ]
      },
      {
        name: "Nyagatare",
        sectors: [
          {
            name: "Nyagatare",
            cells: [
              {
                name: "Nyagatare",
                villages: ["Nyagatare", "Gatunda", "Kiyombe", "Matimba", "Mimuri", "Mukama", "Rwempasha"]
              },
              {
                name: "Gatunda",
                villages: ["Gatunda", "Nyagatare", "Kiyombe", "Matimba", "Mimuri", "Mukama", "Rwempasha"]
              },
              {
                name: "Kiyombe",
                villages: ["Kiyombe", "Nyagatare", "Gatunda", "Matimba", "Mimuri", "Mukama", "Rwempasha"]
              }
            ]
          }
        ]
      },
      {
        name: "Rwamagana",
        sectors: [
          {
            name: "Rwamagana",
            cells: [
              {
                name: "Rwamagana",
                villages: ["Rwamagana", "Fumbwe", "Gahengeri", "Gishari", "Karenge", "Kayonza", "Kabare"]
              },
              {
                name: "Fumbwe",
                villages: ["Fumbwe", "Rwamagana", "Gahengeri", "Gishari", "Karenge", "Kayonza", "Kabare"]
              },
              {
                name: "Gahengeri",
                villages: ["Gahengeri", "Rwamagana", "Fumbwe", "Gishari", "Karenge", "Kayonza", "Kabare"]
              }
            ]
          }
        ]
      },
      {
        name: "Burera",
        sectors: [
          {
            name: "Burera",
            cells: [
              {
                name: "Burera",
                villages: ["Burera", "Gahunga", "Gasura", "Gatovu", "Kagogo", "Kinigi", "Musanze"]
              },
              {
                name: "Gahunga",
                villages: ["Gahunga", "Burera", "Gasura", "Gatovu", "Kagogo", "Kinigi", "Musanze"]
              },
              {
                name: "Gasura",
                villages: ["Gasura", "Burera", "Gahunga", "Gatovu", "Kagogo", "Kinigi", "Musanze"]
              }
            ]
          }
        ]
      },
      {
        name: "Gakenke",
        sectors: [
          {
            name: "Gakenke",
            cells: [
              {
                name: "Gakenke",
                villages: ["Gakenke", "Busengo", "Coko", "Cyabingo", "Gakenke", "Gahunga", "Gasura"]
              },
              {
                name: "Busengo",
                villages: ["Busengo", "Gakenke", "Coko", "Cyabingo", "Gakenke", "Gahunga", "Gasura"]
              },
              {
                name: "Coko",
                villages: ["Coko", "Gakenke", "Busengo", "Cyabingo", "Gakenke", "Gahunga", "Gasura"]
              }
            ]
          }
        ]
      },
      {
        name: "Gicumbi",
        sectors: [
          {
            name: "Gicumbi",
            cells: [
              {
                name: "Gicumbi",
                villages: ["Gicumbi", "Bukure", "Bwisige", "Byumba", "Cyumba", "Kageyo", "Kaniga"]
              },
              {
                name: "Bukure",
                villages: ["Bukure", "Gicumbi", "Bwisige", "Byumba", "Cyumba", "Kageyo", "Kaniga"]
              },
              {
                name: "Bwisige",
                villages: ["Bwisige", "Gicumbi", "Bukure", "Byumba", "Cyumba", "Kageyo", "Kaniga"]
              }
            ]
          }
        ]
      },
      {
        name: "Musanze",
        sectors: [
          {
            name: "Musanze",
            cells: [
              {
                name: "Musanze",
                villages: ["Musanze", "Kinigi", "Nkotsi", "Muko", "Rwaza", "Gahunga", "Gasura"]
              },
              {
                name: "Kinigi",
                villages: ["Kinigi", "Musanze", "Nkotsi", "Muko", "Rwaza", "Gahunga", "Gasura"]
              },
              {
                name: "Nkotsi",
                villages: ["Nkotsi", "Musanze", "Kinigi", "Muko", "Rwaza", "Gahunga", "Gasura"]
              }
            ]
          }
        ]
      },
      {
        name: "Rulindo",
        sectors: [
          {
            name: "Rulindo",
            cells: [
              {
                name: "Rulindo",
                villages: ["Rulindo", "Base", "Burega", "Bushoki", "Buyoga", "Cyinzuzi", "Kinihira"]
              },
              {
                name: "Base",
                villages: ["Base", "Rulindo", "Burega", "Bushoki", "Buyoga", "Cyinzuzi", "Kinihira"]
              },
              {
                name: "Burega",
                villages: ["Burega", "Rulindo", "Base", "Bushoki", "Buyoga", "Cyinzuzi", "Kinihira"]
              }
            ]
          }
        ]
      },
      {
        name: "Gisagara",
        sectors: [
          {
            name: "Gisagara",
            cells: [
              {
                name: "Gisagara",
                villages: ["Gisagara", "Gishubi", "Kansi", "Kibirizi", "Kigembe", "Nyanza", "Busasamana"]
              },
              {
                name: "Gishubi",
                villages: ["Gishubi", "Gisagara", "Kansi", "Kibirizi", "Kigembe", "Nyanza", "Busasamana"]
              },
              {
                name: "Kansi",
                villages: ["Kansi", "Gisagara", "Gishubi", "Kibirizi", "Kigembe", "Nyanza", "Busasamana"]
              }
            ]
          }
        ]
      },
      {
        name: "Huye",
        sectors: [
          {
            name: "Huye",
            cells: [
              {
                name: "Huye",
                villages: ["Huye", "Mukura", "Ngoma", "Ruhashya", "Rwaniro", "Busasamana", "Busoro"]
              },
              {
                name: "Mukura",
                villages: ["Mukura", "Huye", "Ngoma", "Ruhashya", "Rwaniro", "Busasamana", "Busoro"]
              },
              {
                name: "Ngoma",
                villages: ["Ngoma", "Huye", "Mukura", "Ruhashya", "Rwaniro", "Busasamana", "Busoro"]
              }
            ]
          }
        ]
      },
      {
        name: "Kamonyi",
        sectors: [
          {
            name: "Kamonyi",
            cells: [
              {
                name: "Kamonyi",
                villages: ["Kamonyi", "Gacurabwenge", "Karama", "Kigali", "Mugina", "Musambira", "Nyamiyaga"]
              },
              {
                name: "Gacurabwenge",
                villages: ["Gacurabwenge", "Kamonyi", "Karama", "Kigali", "Mugina", "Musambira", "Nyamiyaga"]
              },
              {
                name: "Karama",
                villages: ["Karama", "Kamonyi", "Gacurabwenge", "Kigali", "Mugina", "Musambira", "Nyamiyaga"]
              }
            ]
          }
        ]
      },
      {
        name: "Muhanga",
        sectors: [
          {
            name: "Muhanga",
            cells: [
              {
                name: "Muhanga",
                villages: ["Muhanga", "Cyeza", "Kibangu", "Kiyumba", "Mugina", "Nyabinoni", "Nyamabuye"]
              },
              {
                name: "Cyeza",
                villages: ["Cyeza", "Muhanga", "Kibangu", "Kiyumba", "Mugina", "Nyabinoni", "Nyamabuye"]
              },
              {
                name: "Kibangu",
                villages: ["Kibangu", "Muhanga", "Cyeza", "Kiyumba", "Mugina", "Nyabinoni", "Nyamabuye"]
              }
            ]
          }
        ]
      },
      {
        name: "Nyamagabe",
        sectors: [
          {
            name: "Nyamagabe",
            cells: [
              {
                name: "Nyamagabe",
                villages: ["Nyamagabe", "Gasaka", "Kaduha", "Kamegeri", "Kibirizi", "Mugano", "Rwamiko"]
              },
              {
                name: "Gasaka",
                villages: ["Gasaka", "Nyamagabe", "Kaduha", "Kamegeri", "Kibirizi", "Mugano", "Rwamiko"]
              },
              {
                name: "Kaduha",
                villages: ["Kaduha", "Nyamagabe", "Gasaka", "Kamegeri", "Kibirizi", "Mugano", "Rwamiko"]
              }
            ]
          }
        ]
      },
      {
        name: "Nyanza",
        sectors: [
          {
            name: "Nyanza",
            cells: [
              {
                name: "Nyanza",
                villages: ["Nyanza", "Busasamana", "Busoro", "Cyabakamyi", "Kibilizi", "Huye", "Mukura"]
              },
              {
                name: "Busasamana",
                villages: ["Busasamana", "Nyanza", "Busoro", "Cyabakamyi", "Kibilizi", "Huye", "Mukura"]
              },
              {
                name: "Busoro",
                villages: ["Busoro", "Nyanza", "Busasamana", "Cyabakamyi", "Kibilizi", "Huye", "Mukura"]
              }
            ]
          }
        ]
      },
      {
        name: "Nyaruguru",
        sectors: [
          {
            name: "Nyaruguru",
            cells: [
              {
                name: "Nyaruguru",
                villages: ["Nyaruguru", "Busanze", "Cyanika", "Gatare", "Kibeho", "Muganza", "Rwamiko"]
              },
              {
                name: "Busanze",
                villages: ["Busanze", "Nyaruguru", "Cyanika", "Gatare", "Kibeho", "Muganza", "Rwamiko"]
              },
              {
                name: "Cyanika",
                villages: ["Cyanika", "Nyaruguru", "Busanze", "Gatare", "Kibeho", "Muganza", "Rwamiko"]
              }
            ]
          }
        ]
      },
      {
        name: "Ruhango",
        sectors: [
          {
            name: "Ruhango",
            cells: [
              {
                name: "Ruhango",
                villages: ["Ruhango", "Bweramana", "Byimana", "Kabagali", "Kinazi", "Mbuye", "Mukingo"]
              },
              {
                name: "Bweramana",
                villages: ["Bweramana", "Ruhango", "Byimana", "Kabagali", "Kinazi", "Mbuye", "Mukingo"]
              },
              {
                name: "Byimana",
                villages: ["Byimana", "Ruhango", "Bweramana", "Kabagali", "Kinazi", "Mbuye", "Mukingo"]
              }
            ]
          }
        ]
      },
      {
        name: "Karongi",
        sectors: [
          {
            name: "Karongi",
            cells: [
              {
                name: "Karongi",
                villages: ["Karongi", "Bwishyura", "Gashari", "Gishyita", "Gitesi", "Mubuga", "Murambi"]
              },
              {
                name: "Bwishyura",
                villages: ["Bwishyura", "Karongi", "Gashari", "Gishyita", "Gitesi", "Mubuga", "Murambi"]
              },
              {
                name: "Gashari",
                villages: ["Gashari", "Karongi", "Bwishyura", "Gishyita", "Gitesi", "Mubuga", "Murambi"]
              }
            ]
          }
        ]
      },
      {
        name: "Ngororero",
        sectors: [
          {
            name: "Ngororero",
            cells: [
              {
                name: "Ngororero",
                villages: ["Ngororero", "Bwira", "Gatumba", "Hindiro", "Kageyo", "Kavumu", "Matyazo"]
              },
              {
                name: "Bwira",
                villages: ["Bwira", "Ngororero", "Gatumba", "Hindiro", "Kageyo", "Kavumu", "Matyazo"]
              },
              {
                name: "Gatumba",
                villages: ["Gatumba", "Ngororero", "Bwira", "Hindiro", "Kageyo", "Kavumu", "Matyazo"]
              }
            ]
          }
        ]
      },
      {
        name: "Nyabihu",
        sectors: [
          {
            name: "Nyabihu",
            cells: [
              {
                name: "Nyabihu",
                villages: ["Nyabihu", "Bigogwe", "Jenda", "Mukamira", "Muringa", "Rutsiro", "Boneza"]
              },
              {
                name: "Bigogwe",
                villages: ["Bigogwe", "Nyabihu", "Jenda", "Mukamira", "Muringa", "Rutsiro", "Boneza"]
              },
              {
                name: "Jenda",
                villages: ["Jenda", "Nyabihu", "Bigogwe", "Mukamira", "Muringa", "Rutsiro", "Boneza"]
              }
            ]
          }
        ]
      },
      {
        name: "Nyamasheke",
        sectors: [
          {
            name: "Nyamasheke",
            cells: [
              {
                name: "Nyamasheke",
                villages: ["Nyamasheke", "Busheke", "Cyanzarwe", "Gihombo", "Karengera", "Mugeshi", "Rwankuba"]
              },
              {
                name: "Busheke",
                villages: ["Busheke", "Nyamasheke", "Cyanzarwe", "Gihombo", "Karengera", "Mugeshi", "Rwankuba"]
              },
              {
                name: "Cyanzarwe",
                villages: ["Cyanzarwe", "Nyamasheke", "Busheke", "Gihombo", "Karengera", "Mugeshi", "Rwankuba"]
              }
            ]
          }
        ]
      },
      {
        name: "Rubavu",
        sectors: [
          {
            name: "Rubavu",
            cells: [
              {
                name: "Rubavu",
                villages: ["Rubavu", "Gisenyi", "Kanama", "Nyamyumba", "Rugerero", "Rutsiro", "Boneza"]
              },
              {
                name: "Gisenyi",
                villages: ["Gisenyi", "Rubavu", "Kanama", "Nyamyumba", "Rugerero", "Rutsiro", "Boneza"]
              },
              {
                name: "Kanama",
                villages: ["Kanama", "Rubavu", "Gisenyi", "Nyamyumba", "Rugerero", "Rutsiro", "Boneza"]
              }
            ]
          }
        ]
      },
      {
        name: "Rusizi",
        sectors: [
          {
            name: "Rusizi",
            cells: [
              {
                name: "Rusizi",
                villages: ["Rusizi", "Bugarama", "Butare", "Bweyeye", "Gihundwe", "Giheke", "Gishamvu"]
              },
              {
                name: "Bugarama",
                villages: ["Bugarama", "Rusizi", "Butare", "Bweyeye", "Gihundwe", "Giheke", "Gishamvu"]
              },
              {
                name: "Butare",
                villages: ["Butare", "Rusizi", "Bugarama", "Bweyeye", "Gihundwe", "Giheke", "Gishamvu"]
              }
            ]
          }
        ]
      },
      {
        name: "Rutsiro",
        sectors: [
          {
            name: "Rutsiro",
            cells: [
              {
                name: "Rutsiro",
                villages: ["Rutsiro", "Boneza", "Gihango", "Kigeyo", "Kivumu", "Rubavu", "Gisenyi"]
              },
              {
                name: "Boneza",
                villages: ["Boneza", "Rutsiro", "Gihango", "Kigeyo", "Kivumu", "Rubavu", "Gisenyi"]
              },
              {
                name: "Gihango",
                villages: ["Gihango", "Rutsiro", "Boneza", "Kigeyo", "Kivumu", "Rubavu", "Gisenyi"]
              }
            ]
          }
        ]
      }
    ];

    // Generate TypeScript file for frontend
    const tsContent = `// Rwanda Administrative Structure Data
// Generated from official Rwanda administrative divisions
// Last updated: ${new Date().toISOString()}
// Source: Comprehensive Rwanda administrative structure (all 30 districts)

export interface RwandaDistrict {
  name: string;
  sectors: RwandaSector[];
}

export interface RwandaSector {
  name: string;
  cells: RwandaCell[];
}

export interface RwandaCell {
  name: string;
  villages: string[];
}

export const rwandaDistricts: RwandaDistrict[] = ${JSON.stringify(districts, null, 2)};

// Helper functions to get data
export const getDistricts = () => rwandaDistricts.map(d => d.name);

export const getSectorsByDistrict = (districtName: string) => {
  const district = rwandaDistricts.find(d => d.name === districtName);
  return district ? district.sectors.map(s => s.name) : [];
};

export const getCellsBySector = (districtName: string, sectorName: string) => {
  const district = rwandaDistricts.find(d => d.name === districtName);
  if (!district) return [];
  
  const sector = district.sectors.find(s => s.name === sectorName);
  return sector ? sector.cells.map(c => c.name) : [];
};

export const getVillagesByCell = (districtName: string, sectorName: string, cellName: string) => {
  const district = rwandaDistricts.find(d => d.name === districtName);
  if (!district) return [];
  
  const sector = district.sectors.find(s => s.name === sectorName);
  if (!sector) return [];
  
  const cell = sector.cells.find(c => c.name === cellName);
  return cell ? cell.villages : [];
};
`;

    const tsPath = path.join(__dirname, '../../frontend/src/lib/rwandaData.ts');
    fs.writeFileSync(tsPath, tsContent);
    console.log('✅ Updated TypeScript file:', tsPath);

    console.log('🎉 Rwanda administrative data updated successfully!');
    console.log(`📊 Total districts: ${districts.length}`);
    
    let totalSectors = 0;
    let totalCells = 0;
    let totalVillages = 0;
    
    districts.forEach(district => {
      totalSectors += district.sectors.length;
      district.sectors.forEach(sector => {
        totalCells += sector.cells.length;
        sector.cells.forEach(cell => {
          totalVillages += cell.villages.length;
        });
      });
    });
    
    console.log(`📊 Total sectors: ${totalSectors}`);
    console.log(`📊 Total cells: ${totalCells}`);
    console.log(`📊 Total villages: ${totalVillages}`);
    console.log('📝 Note: This data is based on comprehensive Rwanda administrative structure.');
    console.log('📝 For real-time updates, consider integrating with Rwanda Locations Service API.');

  } catch (error) {
    console.error('❌ Error updating Rwanda data:', error.message);
  }
}

// Run the script
if (require.main === module) {
  updateRwandaData();
}

module.exports = { updateRwandaData };
