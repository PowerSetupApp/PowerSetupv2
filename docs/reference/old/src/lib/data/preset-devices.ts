/**
 * Preset Devices Data
 * 
 * Vordefinierte Geräte für das "Weitere Geräte" Modal.
 * Diese Daten werden später über das Admin Dashboard verwaltet.
 */

export interface PresetDevice {
    id: string;
    name: string;
    category: string;
    defaultPower: number;
    defaultVoltage: '12V' | '24V' | '48V' | '230V';
    defaultHours: number;
    icon: string;
    keywords: string[]; // Für Suche
}

export const PRESET_DEVICES: PresetDevice[] = [
    // Küche / Haushalt
    {
        id: 'hairdryer',
        name: 'Haartrockner',
        category: 'comfort',
        defaultPower: 1800,
        defaultVoltage: '230V',
        defaultHours: 0.25,
        icon: '💇',
        keywords: ['haar', 'föhn', 'fön', 'trockner', 'haarpflege'],
    },
    {
        id: 'microwave',
        name: 'Mikrowelle',
        category: 'kitchen',
        defaultPower: 800,
        defaultVoltage: '230V',
        defaultHours: 0.25,
        icon: '📻',
        keywords: ['mikrowelle', 'kochen', 'erwärmen', 'essen'],
    },
    {
        id: 'toaster',
        name: 'Toaster',
        category: 'kitchen',
        defaultPower: 900,
        defaultVoltage: '230V',
        defaultHours: 0.1,
        icon: '🍞',
        keywords: ['toaster', 'toast', 'brot', 'frühstück'],
    },
    {
        id: 'kettle',
        name: 'Wasserkocher',
        category: 'kitchen',
        defaultPower: 2000,
        defaultVoltage: '230V',
        defaultHours: 0.15,
        icon: '🫖',
        keywords: ['wasserkocher', 'wasser', 'kochen', 'tee', 'kaffee'],
    },
    {
        id: 'induction',
        name: 'Induktionskochplatte',
        category: 'kitchen',
        defaultPower: 2000,
        defaultVoltage: '230V',
        defaultHours: 0.5,
        icon: '🍳',
        keywords: ['induktion', 'kochen', 'herd', 'platte', 'kochfeld'],
    },

    // Elektronik
    {
        id: 'tablet',
        name: 'Tablet',
        category: 'entertainment',
        defaultPower: 25,
        defaultVoltage: '12V',
        defaultHours: 2,
        icon: '📱',
        keywords: ['tablet', 'ipad', 'android', 'laden'],
    },
    {
        id: 'camera_charger',
        name: 'Kamera-Ladegerät',
        category: 'entertainment',
        defaultPower: 15,
        defaultVoltage: '230V',
        defaultHours: 2,
        icon: '📷',
        keywords: ['kamera', 'foto', 'laden', 'charger'],
    },
    {
        id: 'drone',
        name: 'Drohnen-Ladegerät',
        category: 'entertainment',
        defaultPower: 100,
        defaultVoltage: '230V',
        defaultHours: 1,
        icon: '🚁',
        keywords: ['drohne', 'drone', 'dji', 'laden', 'akku'],
    },
    {
        id: 'ebike_charger',
        name: 'E-Bike Ladegerät',
        category: 'tools',
        defaultPower: 250,
        defaultVoltage: '230V',
        defaultHours: 4,
        icon: '🚲',
        keywords: ['ebike', 'e-bike', 'fahrrad', 'laden', 'akku', 'pedelec'],
    },
    {
        id: 'projector',
        name: 'Mini-Beamer',
        category: 'entertainment',
        defaultPower: 50,
        defaultVoltage: '230V',
        defaultHours: 2,
        icon: '🎬',
        keywords: ['beamer', 'projektor', 'film', 'kino'],
    },

    // Comfort
    {
        id: 'electric_blanket',
        name: 'Heizdecke',
        category: 'comfort',
        defaultPower: 100,
        defaultVoltage: '230V',
        defaultHours: 6,
        icon: '🛏️',
        keywords: ['heizdecke', 'wärme', 'schlafen', 'winter'],
    },
    {
        id: 'air_purifier',
        name: 'Luftreiniger',
        category: 'comfort',
        defaultPower: 30,
        defaultVoltage: '230V',
        defaultHours: 8,
        icon: '🌬️',
        keywords: ['luft', 'reiniger', 'filter', 'allergie'],
    },
    {
        id: 'mosquito_repeller',
        name: 'Mückenstecker',
        category: 'comfort',
        defaultPower: 5,
        defaultVoltage: '230V',
        defaultHours: 8,
        icon: '🦟',
        keywords: ['mücken', 'insekten', 'stecker'],
    },

    // Werkzeug
    {
        id: 'vacuum_cleaner',
        name: 'Handstaubsauger',
        category: 'tools',
        defaultPower: 100,
        defaultVoltage: '12V',
        defaultHours: 0.25,
        icon: '🧹',
        keywords: ['staubsauger', 'saugen', 'reinigen'],
    },
    {
        id: 'compressor',
        name: 'Kompressor (12V)',
        category: 'tools',
        defaultPower: 150,
        defaultVoltage: '12V',
        defaultHours: 0.25,
        icon: '💨',
        keywords: ['kompressor', 'luft', 'reifen', 'pumpe'],
    },
    {
        id: 'soldering_iron',
        name: 'Lötkolben',
        category: 'tools',
        defaultPower: 60,
        defaultVoltage: '230V',
        defaultHours: 0.5,
        icon: '🔧',
        keywords: ['löten', 'lötkolben', 'elektronik', 'reparatur'],
    },
];

/**
 * Suche in Preset Devices
 */
export function searchPresetDevices(query: string): PresetDevice[] {
    if (!query.trim()) return PRESET_DEVICES;

    const lowerQuery = query.toLowerCase();

    return PRESET_DEVICES.filter(device =>
        device.name.toLowerCase().includes(lowerQuery) ||
        device.keywords.some(kw => kw.includes(lowerQuery))
    );
}
