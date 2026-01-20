import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import {  HashRouter } from "react-router-dom";
import '../src/assets/scss/style.scss';


createRoot(document.getElementById("root")!).render(
  <HashRouter>
    {/* <CookiesProvider defaultSetOptions={{ path: '/' }}>
      <Provider store={store}>
        <AuthProvider> */}
          <App />
        {/* </AuthProvider>
      </Provider>
    </CookiesProvider> */}
  </HashRouter>
);
