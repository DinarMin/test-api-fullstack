import fs from "fs";
const VARIABLES = Array.from({ length: 1000000 }, (_, i) => ({
    id: i + 1,
    name: `Variable ${i + 1}`,
}));
fs.writeFileSync("variables.json", JSON.stringify(VARIABLES));
