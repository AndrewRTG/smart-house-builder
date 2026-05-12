function getInitials(name) {
  return name.trim().split(" ").filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join("");
}

function getUsername(name) {
  return "@" + name.trim().toLowerCase().split(" ").filter(Boolean).join(".");
}

export default function Sidebar({ profile, activePage, onNavigate, setupCount, onOpenModal, setups }) {
  const initials = getInitials(profile.name);
  const username = getUsername(profile.name);

  // Suma like-urilor doar de la setup-urile publicate
  const totalLikes = setups
    .filter((s) => s.statusColor === "published")
    .reduce((sum, s) => sum + s.likes, 0);

  const navItems = [
    { key: "mysetups", icon: "⊞", label: "Setup-urile mele" },
    { key: "wishlist",  icon: "♡", label: "Lista de dorințe"  },
    { key: "activity",  icon: "✦", label: "Activitate"        },
    { key: "settings",  icon: "⚙", label: "Setări cont"       },
  ];

  const handleNewSetup = () => {
    if (activePage !== "mysetups") onNavigate("mysetups");
    onOpenModal();
  };

  return (
    <aside className="sidebar">
      <div className="profile-card">
        <div className="avatar">{initials}</div>
        <div className="profile-name">{profile.name}</div>
        <div className="profile-email">{username}</div>
        <div className="profile-email">{profile.email}</div>
        <div className="profile-stats">
          <div><strong>{setupCount}</strong><span>Setups</span></div>
          <div><strong>{totalLikes}</strong><span>Like-uri</span></div>
        </div>
        <button className="btn btn-outline">+ Create New Post</button>
        <button className="btn btn-solid" onClick={handleNewSetup}>
          + Create New Setup
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.key}
            className={`nav-item ${activePage === item.key ? "active" : ""}`}
            onClick={() => onNavigate(item.key)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(item.key); } }}
            role="button"
            tabIndex={0}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}
