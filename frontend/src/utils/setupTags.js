// Predefined tags for setups. Used by the builder Post modal and the
// MySetups Publish modal so users always pick from a curated list instead of
// typing free-text (no more "smrthm" / "smart-home" / "Smart Home" duplicates).
export const SETUP_TAG_GROUPS = [
  {
    label: 'Cameră',
    tags: ['Bucătărie', 'Living', 'Dormitor', 'Baie', 'Birou', 'Hol', 'Curte'],
  },
  {
    label: 'Categorie',
    tags: ['Iluminat', 'Securitate', 'Climat', 'Audio', 'Entertainment', 'Automatizare', 'Energie'],
  },
  {
    label: 'Ecosistem',
    tags: ['Apple HomeKit', 'Google Home', 'Amazon Alexa', 'SmartThings'],
  },
  {
    label: 'Protocol',
    tags: ['WiFi', 'Zigbee', 'Z-Wave', 'Matter', 'Thread', 'Bluetooth'],
  },
  {
    label: 'Buget',
    tags: ['Buget mic', 'Buget mediu', 'Premium'],
  },
  {
    label: 'Nivel',
    tags: ['Începător', 'Intermediar', 'Avansat'],
  },
];

export const ALL_SETUP_TAGS = SETUP_TAG_GROUPS.flatMap(g => g.tags);
