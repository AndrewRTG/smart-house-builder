import { useState } from "react";
import MySetups from "./MySetups";
import Wishlist from "./Wishlist";
import Activity from "./Activity";
import AccountSettings from "./AccountSettings";

const initialSetups = [
    { id: 1, title: "Living Room Pro",       status: "Publicat", statusColor: "published", devices: 12, price: "2.400 EUR", tags: ["Confort", "Entertainment"], likes: 84, comments: 23 },
    { id: 2, title: "Smart Security Suite",  status: "Publicat", statusColor: "published", devices: 7,  price: "1.100 EUR", tags: ["Securitate"],               likes: 41, comments: 9  },
    { id: 3, title: "Dormitor Automatizat",  status: "Ciornă",   statusColor: "draft",     devices: 5,  price: "650 EUR",   tags: ["Confort", "Energie"],        likes: 7,  comments: 2  },
];

export default function ProfilePage({ darkMode }) {
    const [page, setPage]           = useState("mysetups");
    const [profile, setProfile]     = useState({ name: "Ciobanu Andrei", email: "exemplu@mail.ro" });
    const [setups, setSetups]       = useState(initialSetups);
    const [showModal, setShowModal] = useState(false);
    const [language, setLanguage]   = useState("en");

    const handleNavigate = (destination) => setPage(destination);

    const sharedProps = {
        isDark: darkMode,
        onNavigate: handleNavigate,
        profile, setProfile,
        setups, setSetups,
        showModal, setShowModal,
        language, setLanguage,
    };

    switch (page) {
        case "wishlist":  return <Wishlist        {...sharedProps} />;
        case "activity":  return <Activity        {...sharedProps} />;
        case "settings":  return <AccountSettings {...sharedProps} />;
        default:          return <MySetups        {...sharedProps} />;
    }
}
