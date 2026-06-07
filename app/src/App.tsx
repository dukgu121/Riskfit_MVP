/**
 * App entry composition.
 *
 * The real layout and routing live in `src/router.tsx` (which renders an
 * `<AppLayout/>` outlet host with all the route definitions). Keep this
 * component aligned with `main.tsx` so future entrypoints importing `<App />`
 * get the same auth and cloud-sync providers as the browser entry.
 */

import { RouterProvider } from "react-router-dom";

import { AuthProvider } from "./lib/firebase/AuthProvider";
import { RiskfitCloudSync } from "./lib/firebase/RiskfitCloudSync";
import { router } from "./router";

function App() {
  return (
    <AuthProvider>
      <RiskfitCloudSync>
        <RouterProvider router={router} />
      </RiskfitCloudSync>
    </AuthProvider>
  );
}

export default App;
