/** @format */

// src/index.ts  (your Express entry point)

import app from "./app";
// import { bootstrapSuperAdmin } from "./bootstrap/admin";

const PORT = process.env.PORT || 5000;

async function startServer() {
    // ── Run bootstrap BEFORE accepting requests ───────────────
    //TODO: await bootstrapSuperAdmin();

    app.listen(PORT, () => {
        console.log(`[server] Running on http://localhost:${PORT}`);
    });
}

startServer();
