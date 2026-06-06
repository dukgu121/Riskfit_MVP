/**
 * App entry composition.
 *
 * The real layout and routing live in `src/router.tsx` (which renders an
 * `<AppLayout/>` outlet host with all the route definitions). This file is
 * intentionally tiny — it just hands the router off to `<RouterProvider/>`
 * so the rest of the app can rely on data router primitives (loaders, lazy
 * routes, `useNavigate`, etc.) without further setup.
 */

import { RouterProvider } from "react-router-dom";

import { router } from "./router";

function App() {
  return <RouterProvider router={router} />;
}

export default App;
