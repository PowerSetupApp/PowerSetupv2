"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search } from "lucide-react";

interface EmojiPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (emoji: string) => void;
}

interface EmojiItem {
    emoji: string;
    keywords: string[];
}

interface EmojiCategory {
    name: string;
    emojis: EmojiItem[];
}

// Curated emoji set for Camping/Outdoor niche with German keywords
const EMOJI_CATEGORIES: EmojiCategory[] = [
    {
        name: "Camping, Outdoor & Natur",
        emojis: [
            { emoji: "⛺", keywords: ["zelt", "camping", "outdoor", "schlafen"] },
            { emoji: "🏕️", keywords: ["campingplatz", "natur", "outdoor", "zelt"] },
            { emoji: "🚐", keywords: ["wohnmobil", "camper", "van", "bus", "reisen"] },
            { emoji: "🚙", keywords: ["auto", "suv", "fahrzeug", "offroad"] },
            { emoji: "🛻", keywords: ["pickup", "truck", "transporter", "ladung"] },
            { emoji: "🚎", keywords: ["wohnbus", "reisebus", "bus", "transport"] },
            { emoji: "🚗", keywords: ["auto", "pkw", "fahren"] },
            { emoji: "🏍️", keywords: ["motorrad", "zweirad", "fahren"] },
            { emoji: "🚲", keywords: ["fahrrad", "bike", "sport", "tour"] },
            { emoji: "🛶", keywords: ["kanu", "boot", "wasser", "paddeln"] },
            { emoji: "🎣", keywords: ["angeln", "fisch", "rute", "hobby"] },
            { emoji: "🌲", keywords: ["baum", "wald", "natur", "tannenbaum", "grün"] },
            { emoji: "🌳", keywords: ["baum", "laubbaum", "natur", "schatten"] },
            { emoji: "🔥", keywords: ["feuer", "lagerfeuer", "wärme", "grillen", "heiß"] },
            { emoji: "🪵", keywords: ["holz", "scheit", "lagerfeuer", "brennholz"] },
            { emoji: "🪓", keywords: ["axt", "beil", "holz", "hacken"] },
            { emoji: "🔪", keywords: ["messer", "taschenmesser", "schneiden", "klinge"] },
            { emoji: "🎒", keywords: ["rucksack", "wandern", "trekking", "gepäck"] },
            { emoji: "🥾", keywords: ["wanderschuhe", "stiefel", "schuhe", "wandern"] },
            { emoji: "🧭", keywords: ["kompass", "navigation", "orientierung", "nord"] },
            { emoji: "🗺️", keywords: ["karte", "landkarte", "navigation", "weg"] },
            { emoji: "🔦", keywords: ["taschenlampe", "licht", "lampe", "leuchten"] },
            { emoji: "🕯️", keywords: ["kerze", "licht", "romantik", "wachs"] },
            { emoji: "🕶️", keywords: ["sonnenbrille", "sommer", "schutz", "augen"] },
            { emoji: "🧴", keywords: ["sonnencreme", "schutz", "sommer", "creme"] },
            { emoji: "⛱️", keywords: ["sonnenschirm", "strand", "schatten", "schutz"] },
            { emoji: "🛌", keywords: ["schlafen", "bett", "ausruhen", "müde"] },
            { emoji: "🛖", keywords: ["hütte", "shelter", "unterstand", "haus"] },
        ],
    },
    {
        name: "Elektrik & Energie",
        emojis: [
            { emoji: "⚡", keywords: ["strom", "elektrik", "blitz", "spannung", "volt", "power"] },
            { emoji: "🔋", keywords: ["batterie", "akku", "energie", "laden", "12v", "24v"] },
            { emoji: "🔌", keywords: ["stecker", "anschluss", "kabel", "strom", "230v", "ladegerät"] },
            { emoji: "💡", keywords: ["lampe", "licht", "beleuchtung", "led", "idee", "hell"] },
            { emoji: "☀️", keywords: ["sonne", "solar", "photovoltaik", "pv", "panel"] },
            { emoji: "🌞", keywords: ["sonnenschein", "solar", "energie", "warm"] },
            { emoji: "🌤️", keywords: ["sonne", "wolken", "wetter", "solar"] },
            { emoji: "🌥️", keywords: ["bewölkt", "solar", "wetter"] },
            { emoji: "⚙️", keywords: ["einstellungen", "technik", "zahnrad", "mechanik", "konfiguration"] },
            { emoji: "🔧", keywords: ["werkzeug", "schraubenschlüssel", "reparatur", "montage", "einstellen"] },
            { emoji: "🛠️", keywords: ["werkzeug", "reparatur", "wartung", "hammer", "schraubendreher"] },
            { emoji: "🔩", keywords: ["schraube", "mutter", "befestigung", "metall", "teil"] },
            { emoji: "🧲", keywords: ["magnet", "anziehung", "metall", "physik"] },
            { emoji: "📡", keywords: ["antenne", "signal", "funk", "empfang", "wlan", "wifi", "internet"] },
            { emoji: "📶", keywords: ["signal", "empfang", "balken", "netz", "lte", "5g"] },
            { emoji: "📱", keywords: ["handy", "smartphone", "telefon", "laden", "app", "mobil"] },
            { emoji: "💻", keywords: ["laptop", "computer", "notebook", "arbeit", "pc"] },
            { emoji: "🖥️", keywords: ["bildschirm", "monitor", "display", "pc"] },
            { emoji: "⌨️", keywords: ["tastatur", "eingabe", "computer"] },
            { emoji: "🖱️", keywords: ["maus", "klick", "computer"] },
            { emoji: "🖨️", keywords: ["drucker", "papier", "büro"] },
            { emoji: "📷", keywords: ["kamera", "foto", "bild", "aufnahme"] },
            { emoji: "📹", keywords: ["videokamera", "film", "aufnahme", "video"] },
            { emoji: "📺", keywords: ["fernseher", "tv", "bildschirm", "video"] },
            { emoji: "🔊", keywords: ["lautsprecher", "ton", "musik", "audio", "sound"] },
            { emoji: "🔇", keywords: ["stumm", "kein-ton", "ruhe"] },
            { emoji: "🔔", keywords: ["glocke", "benachrichtigung", "alarm"] },
            { emoji: "🔕", keywords: ["glocke-aus", "stumm", "ruhe"] },
            { emoji: "⏱️", keywords: ["stoppuhr", "zeit", "timer", "messung"] },
            { emoji: "⏲️", keywords: ["timer", "uhr", "zeit", "eieruhr"] },
            { emoji: "⏰", keywords: ["wecker", "alarm", "zeit", "aufstehen"] },
            { emoji: "🌡️", keywords: ["thermometer", "temperatur", "wärme", "grad", "messung"] },
            { emoji: "🧊", keywords: ["kühlbox", "eis", "kühlung", "kühlschrank", "gefrierschrank", "kalt"] },
            { emoji: "🪫", keywords: ["batterie-leer", "akku-leer", "laden", "niedrig"] },
            { emoji: "🕹️", keywords: ["joystick", "steuerung", "game", "kontrolle"] },
            { emoji: "🎮", keywords: ["gamepad", "spiel", "konsole", "zocken"] },
        ],
    },
    {
        name: "Werkstatt & Reparatur",
        emojis: [
            { emoji: "🏗️", keywords: ["baukran", "bau", "montage"] },
            { emoji: "🔨", keywords: ["hammer", "nagel", "schlagen", "bauen", "werkzeug"] },
            { emoji: "🪚", keywords: ["säge", "holz", "schneiden", "werkzeug"] },
            { emoji: "🪛", keywords: ["schraubendreher", "schraubenzieher", "werkzeug", "drehen"] },
            { emoji: "🪜", keywords: ["leiter", "aufstieg", "höhe", "klettern"] },
            { emoji: "🧰", keywords: ["werkzeugkasten", "box", "koffer", "ausrüstung"] },
            { emoji: "📏", keywords: ["lineal", "messen", "länge", "maß"] },
            { emoji: "📐", keywords: ["geodreieck", "messen", "winkel", "plan"] },
            { emoji: "🖇️", keywords: ["klammer", "verbindung", "halten"] },
            { emoji: "🖊️", keywords: ["stift", "schreiben", "markieren"] },
            { emoji: "✏️", keywords: ["bleistift", "zeichnen", "skizze"] },
            { emoji: "✂️", keywords: ["schere", "schneiden", "trennen", "basteln"] },
            { emoji: "🗝️", keywords: ["schlüssel", "alt", "öffnen"] },
            { emoji: "🧱", keywords: ["ziegel", "wand", "bau", "stein"] },
            { emoji: "⛓️", keywords: ["kette", "metall", "verbindung", "stark"] },
            { emoji: "🪝", keywords: ["haken", "befestigung", "angeln", "halten"] },
            { emoji: "🧯", keywords: ["feuerlöscher", "sicherheit", "brand", "Notfall"] },
            { emoji: "🦺", keywords: ["weste", "sicherheit", "schutz", "bau"] },
            { emoji: "🧤", keywords: ["handschuhe", "arbeit", "schutz", "winter"] },
        ],
    },
    {
        name: "Küche & Verpflegung",
        emojis: [
            { emoji: "🍳", keywords: ["kochen", "pfanne", "braten", "ei", "essen"] },
            { emoji: "🥘", keywords: ["pfanne", "essen", "topf", "gericht", "paella"] },
            { emoji: "🍲", keywords: ["topf", "eintopf", "suppe", "essen", "warm"] },
            { emoji: "🥣", keywords: ["schüssel", "müsli", "frühstück", "essen"] },
            { emoji: "🥗", keywords: ["salat", "gesund", "essen", "gemüse"] },
            { emoji: "🥪", keywords: ["sandwich", "brot", "snack", "essen"] },
            { emoji: "🍔", keywords: ["burger", "fastfood", "fleisch", "essen"] },
            { emoji: "🍕", keywords: ["pizza", "italienisch", "essen", "käse"] },
            { emoji: "🥖", keywords: ["baguette", "brot", "backwaren", "frankreich"] },
            { emoji: "🥨", keywords: ["brezel", "bäckerei", "salzig", "laugengebäck"] },
            { emoji: "🥓", keywords: ["speck", "bacon", "fleisch", "frühstück"] },
            { emoji: "🥩", keywords: ["fleisch", "steak", "roh", "grillen"] },
            { emoji: "🌽", keywords: ["mais", "gemüse", "gelb", "kolben"] },
            { emoji: "🥕", keywords: ["karotte", "gemüse", "gesund", "orange"] },
            { emoji: "🍎", keywords: ["apfel", "obst", "frucht", "gesund"] },
            { emoji: "🍌", keywords: ["banane", "obst", "frucht", "gelb"] },
            { emoji: "🍉", keywords: ["wassermelone", "sommer", "frucht", "rot"] },
            { emoji: "🍋", keywords: ["zitrone", "sauer", "gelb", "frucht"] },
            { emoji: "🫖", keywords: ["teekanne", "kaffee", "wasser", "heiß", "tee"] },
            { emoji: "☕", keywords: ["kaffee", "heißgetränk", "tasse", "morgen", "cafe"] },
            { emoji: "🥛", keywords: ["milch", "glas", "trinken", "weiß"] },
            { emoji: "🍺", keywords: ["bier", "alkohol", "trinken", "feier", "glas"] },
            { emoji: "🍻", keywords: ["anstoßen", "bier", "feier", "prost"] },
            { emoji: "🍷", keywords: ["wein", "rotwein", "glas", "alkohol"] },
            { emoji: "🍾", keywords: ["sekt", "champagner", "flasche", "feier"] },
            { emoji: "🍹", keywords: ["cocktail", "drink", "sommer", "party"] },
            { emoji: "🧂", keywords: ["salz", "streuer", "würzen", "kochen"] },
            { emoji: "🍽️", keywords: ["teller", "besteck", "essen", "tisch"] },
            { emoji: "🍴", keywords: ["besteck", "gabel", "messer", "essen"] },
            { emoji: "🥄", keywords: ["löffel", "essen", "suppe"] },
            { emoji: "🥢", keywords: ["stäbchen", "asiatisch", "essen"] },
            { emoji: "🥤", keywords: ["becher", "trinken", "strohhalm", "togo"] },
            { emoji: "🥡", keywords: ["takeout", "box", "essen", "mitnehmen"] },
        ],
    },
    {
        name: "Umgebung & Tiere",
        emojis: [
            { emoji: "🏔️", keywords: ["berg", "alpen", "gebirge", "gipfel", "schnee"] },
            { emoji: "⛰️", keywords: ["berg", "wandern", "gipfel", "natur"] },
            { emoji: "🌋", keywords: ["vulkan", "berg", "feuer", "natur"] },
            { emoji: "🗻", keywords: ["fuji", "berg", "japan", "schnee"] },
            { emoji: "🌊", keywords: ["wasser", "welle", "meer", "see", "ozean"] },
            { emoji: "🏖️", keywords: ["strand", "urlaub", "meer", "sonne", "sand"] },
            { emoji: "🏜️", keywords: ["wüste", "sand", "trocken", "hitze"] },
            { emoji: "🏝️", keywords: ["insel", "palme", "meer", "urlaub"] },
            { emoji: "🌅", keywords: ["sonnenuntergang", "abend", "romantik", "horizont"] },
            { emoji: "🌄", keywords: ["sonnenaufgang", "morgen", "berge", "start"] },
            { emoji: "🌍", keywords: ["erde", "welt", "planet", "reisen", "europa"] },
            { emoji: "🌺", keywords: ["blume", "hibiskus", "tropisch", "rot"] },
            { emoji: "🌻", keywords: ["sonnenblume", "gelb", "sommer", "blume"] },
            { emoji: "🐕", keywords: ["hund", "haustier", "tier", "bellend"] },
            { emoji: "🐈", keywords: ["katze", "haustier", "tier", "schmusen"] },
            { emoji: "🐾", keywords: ["pfote", "spur", "tier", "abdruck"] },
            { emoji: "🦊", keywords: ["fuchs", "wald", "tier", "orange"] },
            { emoji: "🐻", keywords: ["bär", "wald", "tier", "braun"] },
            { emoji: "🐗", keywords: ["wildschwein", "wald", "tier", "sau"] },
            { emoji: "🦅", keywords: ["adler", "vogel", "fliegen", "greifvogel"] },
            { emoji: "🦉", keywords: ["eule", "nacht", "vogel", "weisheit"] },
            { emoji: "🦆", keywords: ["ente", "vogel", "wasser", "teich"] },
            { emoji: "🐝", keywords: ["biene", "insekt", "honig", "gelb"] },
            { emoji: "🦟", keywords: ["mücke", "insekt", "stich", "sommer"] },
            { emoji: "🕷️", keywords: ["spinne", "netz", "insekt", "angst"] },
            { emoji: "🐍", keywords: ["schlange", "tier", "gefahr", "grün"] },
            { emoji: "🐟", keywords: ["fisch", "wasser", "meer", "essen"] },
            { emoji: "🦈", keywords: ["hai", "fisch", "meer", "gefahr"] },
        ],
    },
    {
        name: "Haushalt & Reinigung",
        emojis: [
            { emoji: "🚿", keywords: ["dusche", "wasser", "hygiene", "bad"] },
            { emoji: "🛁", keywords: ["badewanne", "bad", "wasser", "waschen"] },
            { emoji: "🚽", keywords: ["toilette", "wc", "klo", "bad"] },
            { emoji: "🧻", keywords: ["klopapier", "rolle", "toilette", "wc"] },
            { emoji: "🚰", keywords: ["wasserhahn", "wasser", "trinken", "quelle"] },
            { emoji: "🪣", keywords: ["eimer", "wasser", "reinigung", "putzen"] },
            { emoji: "🧹", keywords: ["besen", "reinigung", "sauber", "fegen"] },
            { emoji: "🧽", keywords: ["schwamm", "putzen", "sauber", "reinigung"] },
            { emoji: "🧺", keywords: ["korb", "wäsche", "aufbewahrung", "waschen"] },
            { emoji: "🧼", keywords: ["seife", "waschen", "sauber", "hygiene"] },
            { emoji: "🪥", keywords: ["zahnbürste", "zähne", "putzen", "bad"] },
            { emoji: "💺", keywords: ["sitz", "stuhl", "camping-stuhl", "platz"] },
            { emoji: "🛏️", keywords: ["bett", "schlafen", "matratze", "hotel"] },
            { emoji: "🛋️", keywords: ["sofa", "couch", "sitzen", "wohnzimmer"] },
            { emoji: "🚪", keywords: ["tür", "eingang", "ausgang", "öffnen"] },
            { emoji: "🔑", keywords: ["schlüssel", "tür", "öffnen", "schloss"] },
        ],
    },
    {
        name: "Sicherheit, Warnung & Symbole",
        emojis: [
            { emoji: "🔒", keywords: ["schloss", "sicherheit", "geschlossen", "zu"] },
            { emoji: "🔓", keywords: ["offen", "schloss", "entsperrt", "frei"] },
            { emoji: "🛡️", keywords: ["schutz", "sicherheit", "schild", "abwehr"] },
            { emoji: "⚠️", keywords: ["warnung", "achtung", "gefahr", "hinweis", "dreieck"] },
            { emoji: "⛔", keywords: ["verboten", "stop", "nein", "keine-einfahrt"] },
            { emoji: "🚫", keywords: ["verboten", "nein", "stop", "nicht"] },
            { emoji: "🛑", keywords: ["stop", "halt", "rot", "schild"] },
            { emoji: "✅", keywords: ["ok", "fertig", "erledigt", "haken", "grün", "check"] },
            { emoji: "❌", keywords: ["nein", "falsch", "abbrechen", "kreuz", "rot"] },
            { emoji: "ℹ️", keywords: ["info", "information", "hinweis", "blau"] },
            { emoji: "❓", keywords: ["frage", "hilfe", "unbekannt", "was"] },
            { emoji: "❗", keywords: ["ausrufezeichen", "wichtig", "achtung", "rot"] },
            { emoji: "♻️", keywords: ["recycling", "trennzeichen", "umwelt", "wiederverwertung"] },
            { emoji: "🚮", keywords: ["müll", "abfall", "entsorgung", "papierkorb"] },
            { emoji: "🚯", keywords: ["kein-müll", "verboten", "sauber"] },
            { emoji: "📍", keywords: ["standort", "position", "ort", "gps", "nadel"] },
            { emoji: "🚩", keywords: ["flagge", "markierung", "ziel", "rot"] },
            { emoji: "🏁", keywords: ["zielflagge", "rennen", "fertig", "ende"] },
            { emoji: "🚾", keywords: ["wc", "toilette", "klo", "schild"] },
            { emoji: "🅿️", keywords: ["parken", "parkplatz", "auto", "schild"] },
            { emoji: "🆘", keywords: ["bitte-helfen", "notfall", "hilfe", "sos"] },
            { emoji: "💯", keywords: ["hundert", "perfekt", "alles", "top"] },
            { emoji: "🆙", keywords: ["oben", "update", "neu", "hoch"] },
            { emoji: "🆒", keywords: ["cool", "blau", "kalt", "super"] },
            { emoji: "🆕", keywords: ["neu", "aktuell", "frisch", "blau"] },
            { emoji: "🆓", keywords: ["gratis", "kostenlos", "frei", "umsonst"] },
        ],
    },
    {
        name: "Finanzen, Statistik & Sonstiges",
        emojis: [
            { emoji: "💰", keywords: ["geld", "preis", "kosten", "euro", "beutel"] },
            { emoji: "💵", keywords: ["geld", "bargeld", "euro", "dollar", "schein"] },
            { emoji: "💳", keywords: ["kreditkarte", "karte", "bezahlen", "geld"] },
            { emoji: "🧾", keywords: ["rechnung", "beleg", "papier", "kosten"] },
            { emoji: "📦", keywords: ["paket", "lieferung", "box", "versand", "karton"] },
            { emoji: "🏷️", keywords: ["etikett", "label", "preis", "schild", "tag"] },
            { emoji: "🛒", keywords: ["einkaufswagen", "kaufen", "shop", "laden"] },
            { emoji: "🛍️", keywords: ["einkaufstasche", "shoppen", "tüte", "laden"] },
            { emoji: "🎁", keywords: ["geschenk", "überraschung", "paket", "schleife"] },
            { emoji: "📊", keywords: ["statistik", "diagramm", "daten", "balken"] },
            { emoji: "📈", keywords: ["wachstum", "anstieg", "börse", "kurs"] },
            { emoji: "📉", keywords: ["abstieg", "fall", "börse", "kurs"] },
            { emoji: "📅", keywords: ["kalender", "datum", "termin", "tag"] },
            { emoji: "📆", keywords: ["kalender", "termin", "datum", "plan"] },
            { emoji: "📝", keywords: ["notiz", "schreiben", "papier", "memo"] },
            { emoji: "📂", keywords: ["ordner", "datei", "dokument", "organisation"] },
            { emoji: "📁", keywords: ["ordner", "datei", "zu", "organisation"] },
            { emoji: "🔄", keywords: ["aktualisieren", "wiederholen", "sync", "laden"] },
            { emoji: "➕", keywords: ["plus", "hinzufügen", "mehr", "positiv"] },
            { emoji: "➖", keywords: ["minus", "weniger", "reduzieren", "negativ"] },
            { emoji: "🎯", keywords: ["ziel", "treffer", "fokus", "dart", "genau"] },
            { emoji: "🏆", keywords: ["pokal", "gewinner", "sieg", "preis", "gold"] },
            { emoji: "🥇", keywords: ["medaille", "gold", "erster", "gewinner"] },
            { emoji: "🥈", keywords: ["medaille", "silber", "zweiter", "platz"] },
            { emoji: "🥉", keywords: ["medaille", "bronze", "dritter", "platz"] },
        ],
    },
];

export function EmojiPickerModal({ isOpen, onClose, onSelect }: EmojiPickerModalProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter emojis based on search query
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return EMOJI_CATEGORIES;

        const query = searchQuery.toLowerCase().trim();

        return EMOJI_CATEGORIES.map((category) => ({
            ...category,
            emojis: category.emojis.filter(
                (item) =>
                    item.keywords.some((keyword) => keyword.includes(query)) ||
                    item.emoji.includes(query)
            ),
        })).filter((category) => category.emojis.length > 0);
    }, [searchQuery]);

    const handleSelect = (emoji: string) => {
        onSelect(emoji);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Icon auswählen</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Search */}
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Suchen (z.B. Batterie, Sonne, Zelt...)"
                            className="pl-9"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Emoji Grid */}
                <div className="p-4 overflow-y-auto max-h-[50vh]">
                    {filteredCategories.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            <p>Keine Icons gefunden</p>
                            <p className="text-sm mt-1">Versuche andere Suchbegriffe</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredCategories.map((category) => (
                                <div key={category.name}>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                        {category.name}
                                    </h3>
                                    <div className="grid grid-cols-8 gap-1">
                                        {category.emojis.map((item) => (
                                            <button
                                                key={item.emoji}
                                                type="button"
                                                onClick={() => handleSelect(item.emoji)}
                                                className="p-2 text-2xl hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                                                title={item.keywords.join(", ")}
                                            >
                                                {item.emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t bg-muted/30">
                    <p className="text-xs text-muted-foreground text-center">
                        Klicke auf ein Icon, um es auszuwählen
                    </p>
                </div>
            </div>
        </div>
    );
}
