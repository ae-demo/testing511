import { Route, Routes } from "react-router";
import appRoutes, { type AppRoute } from "./config/appRoutes";

// Recursive, because `AppRoute.children` needs a renderer that walks every
// level, not just one — an index route may not carry children, so the branch
// is required for both to type-check.
function renderRoute(route: AppRoute, key: string) {
  if (route.index) return <Route key={key} index element={route.element} />;
  return (
    <Route key={key} path={route.path} element={route.element}>
      {route.children?.map((child, i) => renderRoute(child, child.path ?? `index-${i}`))}
    </Route>
  );
}

export default function App() {
  return <Routes>{appRoutes.map((route, i) => renderRoute(route, route.path ?? `layout-${i}`))}</Routes>;
}
