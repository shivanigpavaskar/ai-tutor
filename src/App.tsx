import { Toaster } from "react-hot-toast";
import WebIntetface from "./WebInterface";

function App() {
  return (
    <>
      <WebIntetface></WebIntetface>
      <Toaster
        position="bottom-center"
        toastOptions={{ duration: 4000 }}
        reverseOrder={false}
      />
    </>
  );
}

export default App;
