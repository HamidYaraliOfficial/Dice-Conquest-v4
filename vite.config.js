import {defineConfig} from "vite";
export default defineConfig({build:{assetsInlineLimit:2000000},base:process.env.VITE_BASE||"./",test:{environment:"node"}});
