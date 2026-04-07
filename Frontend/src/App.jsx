import React from "react";
import WizardSidebar from "./features/wizard/components/WizardSidebar";
import useFilterStore from "./store/useFilterStore";
import "./index.css";

function App() {
    const { darkMode } = useFilterStore();

    return (
        <div style={{
            display: "flex",
            backgroundColor: darkMode ? "#1e2535" : "#E3E9F0",
            height: "100vh",
            width: "100vw",
            overflow: "hidden",
            transition: "background-color 0.22s"
        }}>
            <WizardSidebar />
            <main style={{
                flex: 1,
                padding: "20px",
                overflowY: "auto",
                height: "100%"
            }}>
                <div style={{ color: darkMode ? "#fff" : "#02114B" }}>
                    <h1>Dashboard Workspace</h1>
                    <p>Conținutul se va derula aici independent de sidebar.</p>
                    <div style={{ height: "1500px", border: "2px dashed #ccc", marginTop: "20px" }}>
                        Placeholder pentru Catalog / Workspace
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;