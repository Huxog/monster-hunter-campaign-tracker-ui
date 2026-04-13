// Root store — compose feature slices here as they are added.
// Each feature exports a slice creator; this file wires them together.
//
// Example (once auth slice exists):
//   import { createAuthSlice, AuthSlice } from '../../features/auth/store'
//   export const useStore = create<AuthSlice>()((...a) => ({
//     ...createAuthSlice(...a),
//   }))
//
// For now, each feature store is standalone. Import feature stores directly.

export {};
