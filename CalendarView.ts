import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import App from './src/App';
import AnnualLinearCalendarPlugin from './main';
import React from 'react';

export const CALENDAR_VIEW_TYPE = 'annual-linear-calendar';

export class CalendarView extends ItemView {
    root: Root | null = null;
    plugin: AnnualLinearCalendarPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: AnnualLinearCalendarPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return CALENDAR_VIEW_TYPE;
    }

    getIcon() {
        return 'panorama-icon';
    }

    getDisplayText() {
        return 'Panorama calendar';
    }

    onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        this.root = createRoot(this.containerEl.children[1] as HTMLElement);
        this.containerEl.addClass('panorama-calendar-view');
        // Passing plugin instance to App for accessing settings/storage
        this.root.render(React.createElement(App, { plugin: this.plugin }));
        return Promise.resolve();
    }

    onClose(): Promise<void> {
        this.root?.unmount();
        return Promise.resolve();
    }
}
