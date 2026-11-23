/* ═══════════════════════════════════════════════════════════════
   auth.js — FreeDrop authentication module
   Handles: JWT storage, Google OAuth callback, login, register,
            profile dropdown, Epic ID connection
═══════════════════════════════════════════════════════════════ */

const API = "/api/auth";

// ── State ─────────────────────────────────────────────────────
let currentUser = null;

// ── Token helpers ─────────────────────────────────────────────
const getToken  = ()        => localStorage.getItem("fd_token");
const setToken  = (t)       => localStorage.setItem("fd_token", t);
const clearToken = ()       => localStorage.removeItem("fd_token");

// Attach JWT to any fetch call that needs it
const authFetch = (url, opts = {}) => {
    const token = getToken();
    return fetch(url, {
        ...opts,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(opts.headers || {}),
        },
    });
};

// ── DOM refs ──────────────────────────────────────────────────
const $  = (id) => document.getElementById(id);
const els = {
    btnOpenAuth:      $("btnOpenAuth"),
    authOverlay:      $("authOverlay"),
    authClose:        $("authClose"),
    authError:        $("authError"),

    tabLogin:         $("tabLogin"),
    tabRegister:      $("tabRegister"),
    panelLogin:       $("panelLogin"),
    panelRegister:    $("panelRegister"),

    loginForm:        $("loginForm"),
    loginEmail:       $("loginEmail"),
    loginPassword:    $("loginPassword"),
    loginSubmit:      $("loginSubmit"),

    registerForm:     $("registerForm"),
    regName:          $("regName"),
    regEmail:         $("regEmail"),
    regPassword:      $("regPassword"),
    regEpicId:        $("regEpicId"),
    registerSubmit:   $("registerSubmit"),

    switchToRegister: $("switchToRegister"),
    switchToLogin:    $("switchToLogin"),

    // User menu
    userMenu:         $("userMenu"),
    userAvatarBtn:    $("userAvatarBtn"),
    userDropdown:     $("userDropdown"),
    userAvatar:       $("userAvatar"),
    userAvatarInitial:$("userAvatarInitial"),
    userDropdownName: $("userDropdownName"),
    userDropdownEmail:$("userDropdownEmail"),
    btnConnectEpic:   $("btnConnectEpic"),
    btnLogout:        $("btnLogout"),

    // Epic modal
    epicOverlay:      $("epicOverlay"),
    epicClose:        $("epicClose"),
    epicForm:         $("epicForm"),
    epicIdInput:      $("epicIdInput"),
    epicSubmit:       $("epicSubmit"),
    epicError:        $("epicError"),
};

// ── Auth modal helpers ────────────────────────────────────────
const openAuthModal  = (tab = "login") => {
    switchTab(tab);
    clearAuthError();
    els.authOverlay.style.display = "flex";
    document.body.style.overflow  = "hidden";
    setTimeout(() => (tab === "login" ? els.loginEmail : els.regName)?.focus(), 50);
};
const closeAuthModal = () => {
    els.authOverlay.style.display = "none";
    document.body.style.overflow  = "";
};

const switchTab = (tab) => {
    const isLogin = tab === "login";
    els.tabLogin.classList.toggle("active", isLogin);
    els.tabRegister.classList.toggle("active", !isLogin);
    els.panelLogin.style.display    = isLogin ? "block" : "none";
    els.panelRegister.style.display = isLogin ? "none"  : "block";
    clearAuthError();
};

const showAuthError = (msg) => {
    els.authError.textContent    = msg;
    els.authError.style.display  = "block";
};
const clearAuthError = () => {
    els.authError.style.display  = "none";
    els.authError.textContent    = "";
};

const setSubmitLoading = (btn, loading, label) => {
    btn.disabled     = loading;
    btn.textContent  = loading ? "Please wait…" : label;
};

// ── Render user state in navbar ───────────────────────────────
const renderUserState = () => {
    if (currentUser) {
        // Show user menu, hide sign-in button
        els.btnOpenAuth.style.display = "none";
        els.userMenu.style.display    = "flex";

        // Avatar: photo or initial
        const initial = (currentUser.name || currentUser.email || "?")[0].toUpperCase();
        els.userAvatarInitial.textContent = initial;
        if (currentUser.avatar) {
            els.userAvatar.src            = currentUser.avatar;
            els.userAvatar.style.display  = "block";
            els.userAvatarInitial.style.display = "none";
        } else {
            els.userAvatar.style.display  = "none";
            els.userAvatarInitial.style.display = "flex";
        }

        // Dropdown labels
        els.userDropdownName.textContent  = currentUser.name  || "";
        els.userDropdownEmail.textContent = currentUser.email || "";

        // Epic button label
        els.btnConnectEpic.textContent = currentUser.epicStoreId
            ? `🎮 Epic: ${currentUser.epicStoreId}`
            : "🎮 Connect Epic ID";
    } else {
        els.btnOpenAuth.style.display = "flex";
        els.userMenu.style.display    = "none";
    }
};

// ── Load user from token (on page load) ───────────────────────
const loadUserFromToken = async () => {
    const token = getToken();
    if (!token) return;

    try {
        const res  = await authFetch(`${API}/me`);
        const data = await res.json();

        if (data.success) {
            currentUser = data.user;
            renderUserState();
        } else {
            clearToken(); // token is invalid/expired
        }
    } catch {
        // Network error — keep token, just don't block the page
    }
};

// ── Handle Google OAuth token in URL (after redirect) ─────────
const handleOAuthCallback = () => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");
    const failed = params.get("auth");

    if (token) {
        setToken(token);
        // Clean the URL
        window.history.replaceState({}, "", window.location.pathname);
        loadUserFromToken();
    }

    if (failed === "failed") {
        window.history.replaceState({}, "", window.location.pathname);
        openAuthModal("login");
        showAuthError("Google sign-in failed. Please try again.");
    }
};

// ── Login form submit ──────────────────────────────────────────
els.loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthError();

    const email    = els.loginEmail.value.trim();
    const password = els.loginPassword.value;

    if (!email || !password) return showAuthError("Please fill in all fields.");

    setSubmitLoading(els.loginSubmit, true, "Sign In");
    try {
        const res  = await fetch(`${API}/login`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (data.success) {
            setToken(data.token);
            currentUser = data.user;
            renderUserState();
            closeAuthModal();
            els.loginForm.reset();
        } else {
            showAuthError(data.message || "Login failed.");
        }
    } catch {
        showAuthError("Network error. Please try again.");
    } finally {
        setSubmitLoading(els.loginSubmit, false, "Sign In");
    }
});

// ── Register form submit ───────────────────────────────────────
els.registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthError();

    const name       = els.regName.value.trim();
    const email      = els.regEmail.value.trim();
    const password   = els.regPassword.value;
    const epicStoreId = els.regEpicId.value.trim() || undefined;

    if (!name || !email || !password) return showAuthError("Name, email and password are required.");
    if (password.length < 6)          return showAuthError("Password must be at least 6 characters.");

    setSubmitLoading(els.registerSubmit, true, "Create Account");
    try {
        const res  = await fetch(`${API}/register`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ name, email, password, epicStoreId }),
        });
        const data = await res.json();

        if (data.success) {
            setToken(data.token);
            currentUser = data.user;
            renderUserState();
            closeAuthModal();
            els.registerForm.reset();
        } else {
            showAuthError(data.message || "Registration failed.");
        }
    } catch {
        showAuthError("Network error. Please try again.");
    } finally {
        setSubmitLoading(els.registerSubmit, false, "Create Account");
    }
});

// ── Epic ID modal ─────────────────────────────────────────────
const openEpicModal  = () => {
    els.epicError.style.display  = "none";
    els.epicIdInput.value        = currentUser?.epicStoreId || "";
    els.epicOverlay.style.display = "flex";
    document.body.style.overflow  = "hidden";
    setTimeout(() => els.epicIdInput.focus(), 50);
};
const closeEpicModal = () => {
    els.epicOverlay.style.display = "none";
    document.body.style.overflow  = "";
};

els.epicForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    els.epicError.style.display = "none";

    const epicStoreId = els.epicIdInput.value.trim();
    if (!epicStoreId) {
        els.epicError.textContent   = "Please enter your Epic Store ID.";
        els.epicError.style.display = "block";
        return;
    }

    setSubmitLoading(els.epicSubmit, true, "Connect");
    try {
        const res  = await authFetch(`${API}/connect-epic`, {
            method: "POST",
            body:   JSON.stringify({ epicStoreId }),
        });
        const data = await res.json();

        if (data.success) {
            currentUser = data.user;
            renderUserState();
            closeEpicModal();
        } else {
            els.epicError.textContent   = data.message || "Failed to connect Epic ID.";
            els.epicError.style.display = "block";
        }
    } catch {
        els.epicError.textContent   = "Network error. Please try again.";
        els.epicError.style.display = "block";
    } finally {
        setSubmitLoading(els.epicSubmit, false, "Connect");
    }
});

// ── Event wiring ─────────────────────────────────────────────
els.btnOpenAuth?.addEventListener("click",   () => openAuthModal("login"));
els.authClose?.addEventListener("click",     closeAuthModal);
els.epicClose?.addEventListener("click",     closeEpicModal);

els.tabLogin?.addEventListener("click",      () => switchTab("login"));
els.tabRegister?.addEventListener("click",   () => switchTab("register"));
els.switchToRegister?.addEventListener("click", () => switchTab("register"));
els.switchToLogin?.addEventListener("click",    () => switchTab("login"));

// Close modals when clicking the backdrop
[els.authOverlay, els.epicOverlay].forEach((overlay) => {
    overlay?.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay === els.authOverlay ? closeAuthModal() : closeEpicModal();
        }
    });
});

// Toggle user dropdown
els.userAvatarBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    els.userDropdown.classList.toggle("open");
});
document.addEventListener("click", () => {
    els.userDropdown?.classList.remove("open");
});

// Connect Epic from dropdown
els.btnConnectEpic?.addEventListener("click", () => {
    els.userDropdown.classList.remove("open");
    openEpicModal();
});

// Logout
els.btnLogout?.addEventListener("click", () => {
    clearToken();
    currentUser = null;
    renderUserState();
    els.userDropdown.classList.remove("open");
});

// Close modals with Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeAuthModal();
        closeEpicModal();
    }
});

// ── Init ──────────────────────────────────────────────────────
handleOAuthCallback();
loadUserFromToken();
