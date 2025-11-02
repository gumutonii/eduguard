// Rwanda Districts and Sectors Data
// Simplified structure with only 30 districts and 416 sectors
// Cells and villages can be added later in student individual pages

export interface RwandaSimpleStructure {
  [district: string]: string[]; // Array of sector names
}

export const RWANDA_DISTRICTS_SECTORS: RwandaSimpleStructure = {
  "Nyarugenge": [
    "Gitega", "Kanyinya", "Kigali", "Kimisagara", "Mageragere", 
    "Muhima", "Nyakabanda", "Nyamirambo", "Nyarugenge", "Rwezamenyo"
  ],
  "Gasabo": [
    "Bumbogo", "Gatsata", "Gikomero", "Gisozi", "Jabana", 
    "Jali", "Kacyiru", "Kimihurura", "Kimironko", "Kinyinya", 
    "Ndera", "Nduba", "Rusororo", "Rutunga", "Rwezamenyo"
  ],
  "Kicukiro": [
    "Gahanga", "Gatenga", "Gikondo", "Kagarama", "Kanombe", 
    "Kicukiro", "Kigarama", "Masaka", "Niboye", "Nyarugunga"
  ],
  "Burera": [
    "Bungwe", "Butaro", "Cyanika", "Cyeru", "Gahunga", 
    "Gatebe", "Gitovu", "Kagohe", "Kinoni", "Kinyababa", 
    "Kivuye", "Nemba", "Rugarama", "Rugendabari", "Ruhunde", 
    "Rusarabuye", "Rwerere"
  ],
  "Gakenke": [
    "Busengo", "Coko", "Cyabingo", "Gakenke", "Gashenyi", 
    "Janja", "Kamubuga", "Karambo", "Kivuruga", "Mataba", 
    "Minazi", "Mugunga", "Muhondo", "Muyongwe", "Muzo", 
    "Nemba", "Ruli", "Rusasa", "Rushashi"
  ],
  "Gicumbi": [
    "Bukure", "Bwisige", "Byumba", "Cyumba", "Giti", 
    "Kageyo", "Kaniga", "Manyagiro", "Miyove", "Mukarange", 
    "Muko", "Mutete", "Namiyaga", "Nyankenke", "Rubaya", 
    "Rukomo", "Rusasa", "Rutare"
  ],
  "Musanze": [
    "Busogo", "Cyuve", "Gacaca", "Gashaki", "Gataraga", 
    "Kimonyi", "Kinigi", "Muhoza", "Muko", "Musanze", 
    "Nkotsi", "Nyange", "Remera", "Rwaza", "Shingiro"
  ],
  "Rulindo": [
    "Base", "Burega", "Bushoki", "Buyoga", "Cyinzuzi", 
    "Cyungo", "Kinihira", "Kisaro", "Masoro", "Mbogo", 
    "Muhanda", "Muhororo", "Ndaro", "Ngeruka", "Ntoma", 
    "Rugese", "Rutonde", "Rwamiko", "Shangasha", "Tumba"
  ],
  "Bugesera": [
    "Gashora", "Juru", "Kamabuye", "Nemba", "Nyanza", 
    "Nyarugenge", "Rilima", "Ruhuha", "Rweru", "Shyara"
  ],
  "Gatsibo": [
    "Gitoki", "Kabarore", "Kageyo", "Kiramuruzi", "Kiziguro", 
    "Muhura", "Murambi", "Ngarama", "Nyagihanga", "Remera", 
    "Rugarama", "Rwimbogo"
  ],
  "Kayonza": [
    "Gahini", "Kabare", "Kabarondo", "Mukarange", "Murama", 
    "Murundi", "Mwiri", "Ndego", "Nyamirama", "Rukara", 
    "Ruramira", "Rwinkwavu"
  ],
  "Kirehe": [
    "Gahara", "Gatore", "Kigarama", "Kigina", "Kirehe", 
    "Mahama", "Mpanga", "Musaza", "Mushikiri", "Nasho", 
    "Nyamugari", "Nyarubuye", "Rwaniro"
  ],
  "Ngoma": [
    "Gashanda", "Jarama", "Karembo", "Kazo", "Kibungo", 
    "Mugesera", "Murama", "Mutenderi", "Remera", "Rukira", 
    "Rukumberi", "Rurenge", "Sake", "Zaza"
  ],
  "Nyagatare": [
    "Bugesera", "Cyimba", "Gashora", "Karama", "Kazo", 
    "Kiyombe", "Matimba", "Mimuri", "Mukama", "Musheri", 
    "Nyagatare", "Rukomo", "Rwempasha", "Rwimiyaga", "Tabagwe"
  ],
  "Rwamagana": [
    "Fumbwe", "Gahengeri", "Gishali", "Karenge", "Kigabiro", 
    "Muhazi", "Munyaga", "Munyiginya", "Musha", "Muyumbu", 
    "Mwulire", "Nyakaliro", "Nzige", "Rubona", "Rukoma"
  ],
  "Gisagara": [
    "Gikundamvura", "Musha", "Ndora", "Nyanza", "Nyegezi", 
    "Save", "Tumba"
  ],
  "Huye": [
    "Gishamvu", "Huye", "Karama", "Kigoma", "Kinazi", 
    "Maraba", "Mbazi", "Mukura", "Ngoma", "Ruhashya", 
    "Rusatira", "Rwaniro", "Simbi"
  ],
  "Kamonyi": [
    "Gacurabwenge", "Karama", "Kayenzi", "Kigusa", "Mpinga", 
    "Musambira", "Mwendo", "Ntongwe", "Nyamiyaga", "Rugalika", 
    "Rukoma", "Runda"
  ],
  "Muhanga": [
    "Cyeza", "Kabacuzi", "Kibangu", "Kiyumba", "Muhanga", 
    "Mushishiro", "Nyabinoni", "Nyamabuye", "Nyarusange", 
    "Rongi", "Rubona", "Shyogwe"
  ],
  "Nyamagabe": [
    "Gasaka", "Gisagara", "Kabaghe", "Kaduha", "Kamegeri", 
    "Kibirizi", "Kibumbwe", "Kitabi", "Mbazi", "Mugano", 
    "Musange", "Musebeya", "Mushubi", "Nkomane", "Gasasa", 
    "Tare", "Uwinkingi"
  ],
  "Nyanza": [
    "Busasamana", "Busoro", "Cyabakamyi", "Kibirizi", "Kigoma", 
    "Mukingo", "Muyira", "Ntyazo", "Nyagisozi", "Rwabicuma", 
    "Rwamiko"
  ],
  "Nyaruguru": [
    "Cyahinda", "Kibeho", "Kivu", "Mata", "Muganza", 
    "Munini", "Ngera", "Ngoma", "Nyabimata", "Nyagisozi", 
    "Nyamagabe", "Nzega", "Save"
  ],
  "Ruhango": [
    "Bweramana", "Byimana", "Kabagali", "Kinazi", "Kinihira", 
    "Mbuye", "Muyira", "Ntongwe", "Ruhango", "Rutobwe"
  ],
  "Karongi": [
    "Bwishyura", "Gashari", "Gishyita", "Gitesi", "Mubuga", 
    "Murambi", "Murundi", "Mutuntu", "Rubengera", "Rugabano", 
    "Ruganda", "Rwankuba", "Twumba"
  ],
  "Ngororero": [
    "Bwira", "Gatumba", "Hindiro", "Kabaya", "Kageyo", 
    "Kavumu", "Matyazo", "Muhanda", "Muhororo", "Ndaro", 
    "Ngororero", "Nyange", "Sovu"
  ],
  "Nyabihu": [
    "Bigogwe", "Jenda", "Muhira", "Mukamira", "Muringa", 
    "Rambura", "Rugera", "Rurembo", "Shyira"
  ],
  "Nyamasheke": [
    "Bushekeri", "Bushoki", "Cyato", "Gihombo", "Kagano", 
    "Kanjongo", "Karambi", "Karengera", "Kirimbi", "Macuba", 
    "Mahembe", "Nyabiteke", "Rangiro", "Ruharambuga", "Shangi"
  ],
  "Rubavu": [
    "Bugeshi", "Busasamana", "Cyanzarwe", "Gisenyi", "Kanama", 
    "Kanzenze", "Mudende", "Nyakiriba", "Nyamyumba", "Rubavu", 
    "Rugerero"
  ],
  "Rusizi": [
    "Bugarama", "Butare", "Bweyeye", "Gihundwe", "Gihunya", 
    "Gitambi", "Kamembe", "Macuba", "Muganza", "Mururu", 
    "Nkanka", "Nkombo", "Ntendezi"
  ],
  "Rutsiro": [
    "Boneza", "Gihango", "Kigeyo", "Kivumu", "Manihira", 
    "Mukura", "Murunda", "Musasa", "Mushonyi", "Mushubati", 
    "Nyabirasi", "Ruhango", "Rusebeya"
  ]
};

// Helper functions
export function getDistricts(): string[] {
  return Object.keys(RWANDA_DISTRICTS_SECTORS).sort();
}

export function getSectorsByDistrict(district: string): string[] {
  if (!district || !RWANDA_DISTRICTS_SECTORS[district]) return [];
  return RWANDA_DISTRICTS_SECTORS[district].sort();
}

// Validation function
export interface RwandaSimpleLocation {
  district: string;
  sector: string;
}

export function validateLocation(location: RwandaSimpleLocation): boolean {
  const { district, sector } = location;
  return !!(
    RWANDA_DISTRICTS_SECTORS[district] &&
    RWANDA_DISTRICTS_SECTORS[district].includes(sector)
  );
}

