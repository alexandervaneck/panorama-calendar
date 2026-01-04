# Panorama Calendar for Obsidian

Panorama Calendar is a beautiful, panoramic, annual linear calendar designed for long-term planning and project overview within Obsidian. It provides a unique "linear" perspective of your year, helping you visualize deadlines, projects, and life events in a single, continuous flow.

![Panorama Calendar Preview](https://raw.githubusercontent.com/alexandervaneck/annual-linear-calendar/main/preview.png) *(Placeholder: Replace with actual screenshot)*

## ✨ Features

- **Panoramic Annual View**: See your entire year mapped out in a clean, linear grid.
- **Multiple Views**: Switch between **Date Grid**, **Fixed Week**, and **Cyclical** planning views to suit your planning style.
- **Project Filtering**: Add multiple iCal URLs (Google, Apple, Outlook, etc.) to track different areas of your life.
- **Color Coding**: Each calendar is automatically assigned a unique color, making it easy to distinguish between work, personal, and project-specific events.
- **Native Obsidian Integration**: Settings are managed directly within Obsidian, and events are fetched using native APIs to bypass CORS issues.

## 🚀 Installation

Since this plugin is in development, you can install it manually:

### Quick Install (Terminal)
1. Open your terminal.
2. Navigate to your Obsidian Vault's plugin directory:
   ```bash
   cd "/path/to/your/vault/.obsidian/plugins"
   ```
3. Create a folder named `panorama-calendar`:
   ```bash
   mkdir panorama-calendar
   ```
4. Copy the files from the `dist` directory of this project into that folder:
   ```bash
   cp -r "/path/to/panorama-calendar/obsidian-plugin/dist/"* panorama-calendar/
   ```

### Manual Install
1. Locate your Obsidian Vault in your file explorer.
2. Go to `.obsidian/plugins/` (you may need to show hidden files with `Cmd+Shift+.` on Mac).
3. Create a new folder called `panorama-calendar`.
4. Copy `main.js`, `manifest.json`, and `styles.css` from the `obsidian-plugin/dist` folder into the new plugin folder.
5. In Obsidian, go to **Settings > Community Plugins**, refresh the list, and enable **Panorama Calendar**.

## ⚙️ How to Add a Calendar

1. Open **Obsidian Settings**.
2. Find **Panorama Calendar** in the sidebar.
3. Paste an **iCal URL** (e.g., from Google Calendar "Secret address in iCal format").
4. Click **Add Calendar**.
5. Your events will automatically sync and display in the calendar view.

## 📂 Project Management & Filtering

Adding multiple calendars allows for powerful filtering:
- **Project Isolation**: Give each project its own iCal link.
- **Visual Distinction**: Events will appear in the color assigned to that calendar.
- **Filtering**: Use the **Calendars** dropdown in the top navigation of the view to toggle visibility for specific projects or areas of focus.

---
Developed by [Alexander VanEck](https://github.com/alexandervaneck)
