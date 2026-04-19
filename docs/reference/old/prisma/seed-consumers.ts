process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import 'dotenv/config';
import { prisma } from '../src/lib/db';

async function main() {
    console.log('Start seeding consumers...');

    // 1. Kategorien definieren
    const categories = [
        { key: 'basic', name: 'Grundausstattung', sortOrder: 10, icon: '⚡' },
        { key: 'kitchen', name: 'Küche & Haushalt', sortOrder: 20, icon: '🍳' },
        { key: 'comfort', name: 'Komfort & Klima', sortOrder: 30, icon: '🌡️' },
        { key: 'entertainment', name: 'Multimedia & Arbeit', sortOrder: 40, icon: '💻' },
        { key: 'tools', name: 'Werkzeug & Hobby', sortOrder: 50, icon: '🔧' },
    ];

    for (const cat of categories) {
        const existingCat = await prisma.consumerCategory.findUnique({
            where: { slug: cat.key },
        });

        let categoryId = existingCat?.id;

        if (!existingCat) {
            console.log(`Creating category: ${cat.name}`);
            const newCat = await prisma.consumerCategory.create({
                data: {
                    name: cat.name,
                    slug: cat.key,
                    icon: cat.icon,
                    sortOrder: cat.sortOrder,
                },
            });
            categoryId = newCat.id;
        } else {
            console.log(`Category exists: ${cat.name}`);
        }

        if (!categoryId) continue;

        // 2. Devices pro Kategorie definieren
        const devices = getDevicesForCategory(cat.key);

        for (const dev of devices) {
            // Prüfen ob Device schon existiert (anhand i18nKey oder name)
            // Da i18nKey optional ist, nutzen wir eine Kombination

            // Da wir preset devices migrieren, haben manche keinen i18nKey, sondern nur name
            // Wir suchen einfach nach Namensgleichheit in dieser Kategorie für das Seeding
            const existingDevice = await prisma.consumerDevice.findFirst({
                where: {
                    categoryId: categoryId,
                    name: dev.name
                }
            });

            if (!existingDevice) {
                console.log(`Creating device: ${dev.name}`);
                await prisma.consumerDevice.create({
                    data: {
                        ...dev,
                        categoryId: categoryId!,
                    }
                });
            }
        }
    }

    console.log('Seeding finished.');
}

function getDevicesForCategory(categoryKey: string): any[] {
    // Daten aus step-4-consumers.tsx und preset-devices.ts zusammengeführt
    const devices: any[] = [];

    if (categoryKey === 'basic') {
        devices.push(
            { name: 'LED Beleuchtung', i18nKey: 'led', defaultPower: 20, icon: '💡', defaultVoltage: '12V', defaultHoursPerDay: 4, stepHours: 0.5, showHoursField: true, sortOrder: 10 },
            { name: 'USB Laden', i18nKey: 'usb', defaultPower: 15, icon: '📱', defaultVoltage: '12V', defaultHoursPerDay: 3, stepHours: 0.5, showHoursField: true, sortOrder: 20 },
            { name: '12V Steckdose', i18nKey: 'socket12v', defaultPower: 60, icon: '🔌', defaultVoltage: '12V', defaultHoursPerDay: 2, stepHours: 0.5, showHoursField: true, sortOrder: 30 }
        );
    }

    if (categoryKey === 'kitchen') {
        devices.push(
            { name: 'Kühlbox/-schrank', i18nKey: 'fridge', defaultPower: 50, icon: '❄️', defaultVoltage: '12V', defaultHoursPerDay: 24, stepHours: 1, showHoursField: false, isCooling: true, sortOrder: 10 },
            { name: 'Kaffeemaschine', i18nKey: 'coffee', defaultPower: 1200, icon: '☕', defaultVoltage: '230V', defaultHoursPerDay: 0.25, stepHours: 0.25, showHoursField: true, sortOrder: 20 },
            // Preset Devices
            { name: 'Mikrowelle', id: 'microwave', defaultPower: 800, icon: '📻', defaultVoltage: '230V', defaultHoursPerDay: 0.25, showHoursField: true, keywords: ['mikrowelle', 'kochen', 'erwärmen', 'essen'], sortOrder: 30 },
            { name: 'Toaster', id: 'toaster', defaultPower: 900, icon: '🍞', defaultVoltage: '230V', defaultHoursPerDay: 0.1, showHoursField: true, keywords: ['toaster', 'toast', 'brot', 'frühstück'], sortOrder: 40 },
            { name: 'Wasserkocher', id: 'kettle', defaultPower: 2000, icon: '🫖', defaultVoltage: '230V', defaultHoursPerDay: 0.15, showHoursField: true, keywords: ['wasserkocher', 'wasser', 'kochen', 'tee', 'kaffee'], sortOrder: 50 },
            { name: 'Induktionskochplatte', id: 'induction', defaultPower: 2000, icon: '🍳', defaultVoltage: '230V', defaultHoursPerDay: 0.5, showHoursField: true, keywords: ['induktion', 'kochen', 'herd', 'platte', 'kochfeld'], sortOrder: 60 },
            { name: 'Haartrockner', id: 'hairdryer', defaultPower: 1800, icon: '💇', defaultVoltage: '230V', defaultHoursPerDay: 0.25, showHoursField: true, keywords: ['haar', 'föhn', 'fön', 'trockner', 'haarpflege'], sortOrder: 70 } // War in 'haushalt', passt hier gut
        );
    }

    if (categoryKey === 'comfort') {
        devices.push(
            { name: 'Standheizung', i18nKey: 'heater', defaultPower: 30, icon: '🔥', defaultVoltage: '12V', defaultHoursPerDay: 8, stepHours: 1, showHoursField: false, sortOrder: 10 },
            { name: 'Warmwasserboiler', i18nKey: 'boiler', defaultPower: 200, icon: '🚿', defaultVoltage: '12V', defaultHoursPerDay: 0.5, stepHours: 0.25, showHoursField: true, sortOrder: 20 },
            { name: 'Wasserpumpe', i18nKey: 'pump', defaultPower: 40, icon: '💧', defaultVoltage: '12V', defaultHoursPerDay: 0.5, stepHours: 0.25, showHoursField: false, sortOrder: 30 },
            { name: 'Dachventilator', i18nKey: 'fan', defaultPower: 25, icon: '🌀', defaultVoltage: '12V', defaultHoursPerDay: 4, stepHours: 0.5, showHoursField: true, sortOrder: 40 },
            // Preset Devices
            { name: 'Heizdecke', id: 'electric_blanket', defaultPower: 100, icon: '🛏️', defaultVoltage: '230V', defaultHoursPerDay: 6, showHoursField: true, keywords: ['heizdecke', 'wärme', 'schlafen', 'winter'], sortOrder: 50 },
            { name: 'Luftreiniger', id: 'air_purifier', defaultPower: 30, icon: '🌬️', defaultVoltage: '230V', defaultHoursPerDay: 8, showHoursField: true, keywords: ['luft', 'reiniger', 'filter', 'allergie'], sortOrder: 60 },
            { name: 'Mückenstecker', id: 'mosquito_repeller', defaultPower: 5, icon: '🦟', defaultVoltage: '230V', defaultHoursPerDay: 8, showHoursField: true, keywords: ['mücken', 'insekten', 'stecker'], sortOrder: 70 }
        );
    }

    if (categoryKey === 'entertainment') {
        devices.push(
            { name: 'Laptop', i18nKey: 'laptop', defaultPower: 65, icon: '💻', defaultVoltage: '230V', defaultHoursPerDay: 4, stepHours: 0.5, showHoursField: true, sortOrder: 10 },
            { name: 'TV', i18nKey: 'tv', defaultPower: 50, icon: '📺', defaultVoltage: '230V', defaultHoursPerDay: 3, stepHours: 0.5, showHoursField: true, sortOrder: 20 },
            { name: 'Spielekonsole', i18nKey: 'console', defaultPower: 150, icon: '🎮', defaultVoltage: '230V', defaultHoursPerDay: 2, stepHours: 0.5, showHoursField: true, sortOrder: 30 },
            // Preset Devices
            { name: 'Tablet', id: 'tablet', defaultPower: 25, icon: '📱', defaultVoltage: '12V', defaultHoursPerDay: 2, showHoursField: true, keywords: ['tablet', 'ipad', 'android', 'laden'], sortOrder: 40 },
            { name: 'Kamera-Ladegerät', id: 'camera_charger', defaultPower: 15, icon: '📷', defaultVoltage: '230V', defaultHoursPerDay: 2, showHoursField: true, keywords: ['kamera', 'foto', 'laden', 'charger'], sortOrder: 50 },
            { name: 'Drohnen-Ladegerät', id: 'drone', defaultPower: 100, icon: '🚁', defaultVoltage: '230V', defaultHoursPerDay: 1, showHoursField: true, keywords: ['drohne', 'drone', 'dji', 'laden', 'akku'], sortOrder: 60 },
            { name: 'Mini-Beamer', id: 'projector', defaultPower: 50, icon: '🎬', defaultVoltage: '230V', defaultHoursPerDay: 2, showHoursField: true, keywords: ['beamer', 'projektor', 'film', 'kino'], sortOrder: 70 }
        );
    }

    if (categoryKey === 'tools') {
        devices.push(
            { name: 'Bohrmaschine', i18nKey: 'drill', defaultPower: 500, icon: '🔧', defaultVoltage: '230V', defaultHoursPerDay: 0.5, stepHours: 0.25, showHoursField: true, sortOrder: 10 },
            { name: 'Winkelschleifer', i18nKey: 'grinder', defaultPower: 800, icon: '⚙️', defaultVoltage: '230V', defaultHoursPerDay: 0.25, stepHours: 0.25, showHoursField: true, sortOrder: 20 },
            // Preset Devices
            { name: 'E-Bike Ladegerät', id: 'ebike_charger', defaultPower: 250, icon: '🚲', defaultVoltage: '230V', defaultHoursPerDay: 4, showHoursField: true, keywords: ['ebike', 'e-bike', 'fahrrad', 'laden', 'akku', 'pedelec'], sortOrder: 30 },
            { name: 'Handstaubsauger', id: 'vacuum_cleaner', defaultPower: 100, icon: '🧹', defaultVoltage: '12V', defaultHoursPerDay: 0.25, showHoursField: true, keywords: ['staubsauger', 'saugen', 'reinigen'], sortOrder: 40 },
            { name: 'Kompressor (12V)', id: 'compressor', defaultPower: 150, icon: '💨', defaultVoltage: '12V', defaultHoursPerDay: 0.25, showHoursField: true, keywords: ['kompressor', 'luft', 'reifen', 'pumpe'], sortOrder: 50 },
            { name: 'Lötkolben', id: 'soldering_iron', defaultPower: 60, icon: '🔧', defaultVoltage: '230V', defaultHoursPerDay: 0.5, showHoursField: true, keywords: ['löten', 'lötkolben', 'elektronik', 'reparatur'], sortOrder: 60 }
        );
    }

    return devices;
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
