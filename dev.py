import os
import sys
import subprocess
import time
import json
import re
import webbrowser
from urllib.request import urlopen
from urllib.error import URLError

# ──────────────────────────────────────────────────────────────────────────────
# Configure stdout/stderr to UTF-8 so emojis print correctly on Windows
# ──────────────────────────────────────────────────────────────────────────────
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass  # Older Python fallback

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# .env files whose VITE_API_URL will be rewritten with the live Ngrok URL
FRONTEND_ENVS = [
    os.path.join(BASE_DIR, "Retrop_RMS_Frontend",    ".env"),
    os.path.join(BASE_DIR, "Retrop_Admin_Dashboard", ".env"),
    os.path.join(BASE_DIR, "Retrop_Website",         ".env"),
]

# Frontend dev server local URLs to open in the browser once ready
BROWSER_TABS = [
    "http://localhost:5173",   # RMS Frontend
    "http://localhost:5175",   # Admin Dashboard
    "http://localhost:5180",   # Retrop Website
]

# Ngrok local API endpoint – always available on 4040 while ngrok is running
NGROK_API = "http://localhost:4040/api/tunnels"

# How long (seconds) to keep retrying the Ngrok API before giving up
NGROK_WAIT_TIMEOUT = 40


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def log(emoji: str, msg: str) -> None:
    print(f"{emoji}  {msg}", flush=True)


def launch_terminal(title: str, folder: str, command: str) -> None:
    """Open a new CMD window with the given title, cd into folder, run command."""
    target_path = os.path.join(BASE_DIR, folder)
    if not os.path.exists(target_path):
        log("❌", f"Directory not found: '{folder}' — skipping '{title}'")
        return

    # Use start's /D flag to set the working directory.
    # This avoids nested-quote issues when the path contains spaces.
    full_cmd = f'start "{title}" /D "{target_path}" cmd /k "title {title} && {command}"'
    subprocess.Popen(full_cmd, shell=True)
    log("📦", f"Launched  [{title}]  →  {command}")


def fetch_ngrok_url(timeout: int = NGROK_WAIT_TIMEOUT) -> str:
    """
    Poll the Ngrok local API until a public HTTPS tunnel URL is available.
    Returns the URL string or raises RuntimeError on timeout.
    """
    log("⏳", f"Waiting for Ngrok to start (up to {timeout}s)...")
    deadline = time.time() + timeout
    attempt = 0

    while time.time() < deadline:
        attempt += 1
        try:
            with urlopen(NGROK_API, timeout=3) as resp:
                data = json.loads(resp.read().decode())
                tunnels = data.get("tunnels", [])
                for tunnel in tunnels:
                    url = tunnel.get("public_url", "")
                    if url.startswith("https://"):
                        log("🌐", f"Ngrok public URL → {url}")
                        return url
        except (URLError, json.JSONDecodeError, OSError):
            pass  # Ngrok not ready yet

        # Progress dots every 5 attempts
        if attempt % 5 == 0:
            elapsed = int(time.time() - (deadline - timeout))
            print(f"    ... still waiting ({elapsed}s elapsed)", flush=True)

        time.sleep(1)

    raise RuntimeError(
        f"Ngrok did not expose a public HTTPS URL within {timeout} seconds.\n"
        "Make sure ngrok is installed and authenticated (`ngrok config add-authtoken <token>`)."
    )


def update_env_file(env_path: str, key: str, new_value: str) -> None:
    """
    Read the .env file, replace (or append) the line for `key=`, write it back.
    All other lines are preserved exactly as-is.
    """
    lines: list[str] = []
    found = False

    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

    new_lines: list[str] = []
    for line in lines:
        if re.match(rf"^\s*{re.escape(key)}\s*=", line):
            new_lines.append(f"{key}={new_value}\n")
            found = True
        else:
            new_lines.append(line)

    if not found:
        new_lines.append(f"{key}={new_value}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

    short = os.path.relpath(env_path, BASE_DIR)
    log("✏️ ", f"Updated  {short}  →  {key}={new_value}")


def open_browser_tabs(urls: list[str], delay_between: float = 0.4) -> None:
    """Open each URL as a new browser tab with a small delay between each."""
    log("🌍", "Opening browser tabs...")
    for url in urls:
        webbrowser.open_new_tab(url)
        time.sleep(delay_between)


# ──────────────────────────────────────────────────────────────────────────────
# Main Orchestration
# ──────────────────────────────────────────────────────────────────────────────

def main() -> None:
    print("=" * 64, flush=True)
    print("  🚀  Retrop Dev Orchestrator  —  Smart Startup", flush=True)
    print("=" * 64, flush=True)
    print(flush=True)

    # ── Step 1: Start the Backend Server ─────────────────────────────────────
    log("▶ ", "STEP 1 — Starting Backend Server")
    launch_terminal("Backend Server", "Server", "npm run dev")
    time.sleep(2)   # Give the backend a head-start before Ngrok connects

    # ── Step 2: Start Ngrok ───────────────────────────────────────────────────
    log("▶ ", "STEP 2 — Starting Ngrok Tunnel")
    launch_terminal("Ngrok Tunnel", ".", "ngrok http 3000")
    time.sleep(2)   # Give Ngrok's process a moment to initialise

    # ── Step 3: Fetch the Live Ngrok Public URL ───────────────────────────────
    log("▶ ", "STEP 3 — Fetching Ngrok Public URL")
    try:
        ngrok_url = fetch_ngrok_url()
    except RuntimeError as e:
        print(f"\n❌  ERROR: {e}", flush=True)
        sys.exit(1)

    # ── Step 4: Update .env Files ─────────────────────────────────────────────
    log("▶ ", "STEP 4 — Updating .env Files")
    for env_path in FRONTEND_ENVS:
        update_env_file(env_path, "VITE_API_URL", ngrok_url)
    print(flush=True)

    # ── Step 5: Start Frontend Dev Servers ────────────────────────────────────
    log("▶ ", "STEP 5 — Starting Frontend Dev Servers")
    launch_terminal("RMS Frontend",    "Retrop_RMS_Frontend",    "npm run dev")
    time.sleep(0.5)
    launch_terminal("Admin Dashboard", "Retrop_Admin_Dashboard", "npm run dev")
    time.sleep(0.5)
    launch_terminal("Website",         "Retrop_Website",         "npm run dev")
    time.sleep(0.5)
    print(flush=True)

    # ── Step 6: Start Expo App ────────────────────────────────────────────────
    log("▶ ", "STEP 6 — Starting Expo / RMS App")
    launch_terminal("RMS App (Expo)", "Retrop_RMS_App", "npx expo start")
    print(flush=True)

    # ── Step 7: Open Browser Tabs ────────────────────────────────────────────
    log("▶ ", "STEP 7 — Opening browser tabs (waiting 6s for Vite to boot...)")
    time.sleep(6)   # Give Vite dev servers time to finish compiling
    open_browser_tabs(BROWSER_TABS)
    print(flush=True)

    # ── Done ──────────────────────────────────────────────────────────────────
    print("=" * 64, flush=True)
    print("  ✅  All done! Here's your stack summary:", flush=True)
    print(f"     Backend       → http://localhost:3000", flush=True)
    print(f"     Ngrok Tunnel  → {ngrok_url}", flush=True)
    print(f"     RMS Frontend  → http://localhost:5173", flush=True)
    print(f"     Admin Panel   → http://localhost:5175", flush=True)
    print(f"     Website       → http://localhost:5180", flush=True)
    print(f"     Expo App      → http://localhost:8081", flush=True)
    print("=" * 64, flush=True)


if __name__ == "__main__":
    main()
