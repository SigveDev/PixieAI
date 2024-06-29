import Home from "./pages/Home";
import Login from "./pages/Login";

const code = new URLSearchParams(window.location.search).get("code");

const Router = () => {
  return code ? <Home code={code} /> : <Login />;
};

export default Router;
