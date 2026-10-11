# Security notes

LuaForge executes Lua client-side using Fengari. Code is not sent to a LuaForge backend. The CDN runtime is a network dependency; for supply-chain-hardened/offline distribution, vendor a reviewed, version-pinned bundle and verify its checksum. Each run uses a fresh Lua state, but this is not a hardened security sandbox. Do not add secrets, privileged APIs, arbitrary JavaScript bridges, or server-side execution of untrusted code.
