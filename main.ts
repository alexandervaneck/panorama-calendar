
import { App, Plugin, WorkspaceLeaf, addIcon } from 'obsidian';
import { CalendarView, CALENDAR_VIEW_TYPE } from './CalendarView';
import { CalendarSettingTab } from './CalendarSettingTab';

import { CalendarInfo } from './src/lib/calendars';
import { ViewMode } from './src/lib/date';

// Interface for Plugin Settings
interface CalendarSettings {
    year: number;
    viewMode: ViewMode;
    calendars: CalendarInfo[];
    selectedCalendars: string[];
}

const DEFAULT_SETTINGS: CalendarSettings = {
    year: new Date().getFullYear(),
    viewMode: 'date-grid',
    calendars: [],
    selectedCalendars: []
}

export default class AnnualLinearCalendarPlugin extends Plugin {
    settings: CalendarSettings;
    private listeners: (() => void)[] = [];

    async onload() {
        await this.loadSettings();

        // Register custom icon
        addIcon('panorama-icon', `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4H4v16h2M18 4h2v16h-2" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /></svg>`);

        // Register the View
        this.registerView(
            CALENDAR_VIEW_TYPE,
            (leaf) => new CalendarView(leaf, this)
        );

        // Add Ribbon Icon to open view
        this.addRibbonIcon('panorama-icon', 'Open Panorama Calendar', () => {
            this.activateView();
        });

        // Add Command to open view
        this.addCommand({
            id: 'open-calendar-view',
            name: 'Open Panorama Calendar',
            callback: () => {
                this.activateView();
            }
        });

        // Add Settings Tab
        this.addSettingTab(new CalendarSettingTab(this.app, this));

        console.log('Panorama Calendar Plugin loaded');
    }

    onunload() {
        console.log('Panorama Calendar Plugin unloaded');
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            leaf = leaves[0];
        } else {
            // Our view could not be found in the workspace, create a new leaf
            // in the right sidebar for example, or main.
            // "getRightLeaf" deprecated? usually getLeaf(true) for main, or 'right' split.
            // Let's open in main area.
            leaf = workspace.getLeaf(true);
            await leaf.setViewState({ type: CALENDAR_VIEW_TYPE, active: true });
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        workspace.revealLeaf(leaf);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.triggerSettingsUpdate();
    }

    onSettingsUpdate(callback: () => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    private triggerSettingsUpdate() {
        this.listeners.forEach(cb => cb());
    }

    openSettings() {
        // @ts-ignore - Internal Obsidian API
        const setting = this.app.setting;
        setting.open();
        setting.openTabById(this.manifest.id);
    }
}

