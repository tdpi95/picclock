import { useEffect } from "react";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import Home from "./pages/Home";

const AppContent = () => {
    const { generalSettings } = useSettings();

    useEffect(() => {
        document.documentElement.lang = generalSettings.language;
    }, [generalSettings.language]);

    return <Home />;
};

function App() {
    return (
        <SettingsProvider>
            <AppContent />
        </SettingsProvider>
    );
}

export default App;
