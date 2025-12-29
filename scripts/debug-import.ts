
// scripts/debug-import.ts
console.log("Start debug script");
try {
    const products = require("../src/lib/schemas/products");
    console.log("Products schema imported:", Object.keys(products));

    const ai = require("../src/lib/ai");
    console.log("AI lib imported:", Object.keys(ai));
} catch (e) {
    console.error("Import failed:", e);
}
