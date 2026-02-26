import { Toaster } from "react-hot-toast";
import WebInterface from "./WebInterface";

function App() {
  return (
    <>
      <WebInterface></WebInterface>
      <Toaster
        position="bottom-center"
        toastOptions={{ duration: 4000 }}
        reverseOrder={false}
      />
    </>
  );
}

export default App;
