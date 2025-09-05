import path from "path";
import { scan } from "../packages/code-explorer/scan.js";

const rootDir = path.resolve(import.meta.dirname, "..");
export const functionIndex = scan(rootDir);

export default functionIndex;
