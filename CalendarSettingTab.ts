
import { App, PluginSettingTab, Setting } from 'obsidian';
import type AnnualLinearCalendarPlugin from './main';
import { createCalendar } from './src/lib/calendars';

export class CalendarSettingTab extends PluginSettingTab {
    plugin: AnnualLinearCalendarPlugin;

    constructor(app: App, plugin: AnnualLinearCalendarPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Panorama Calendar Settings' });

        new Setting(containerEl)
            .setName('Default View Mode')
            .setDesc('Choose the default view when opening the calendar')
            .addDropdown(dropdown => dropdown
                .addOption('date-grid', 'Date Grid')
                .addOption('fixed-week', 'Fixed Week')
                .addOption('cyclical', 'Cyclical')
                .setValue(this.plugin.settings.viewMode)
                .onChange(async (value) => {
                    this.plugin.settings.viewMode = value as any;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', { text: 'Manage Calendars' });

        // Add New Calendar
        let newCalendarUrl = '';
        new Setting(containerEl)
            .setName('Add Calendar URL')
            .setDesc('Enter the iCal URL of the calendar you want to add.')
            .addText(text => text
                .setPlaceholder('https://example.com/calendar.ics')
                .onChange(async (value) => {
                    newCalendarUrl = value;
                }))
            .addButton(button => button
                .setButtonText('Add Calendar')
                .onClick(async () => {
                    if (newCalendarUrl) {
                        try {
                            const newCal = await createCalendar(newCalendarUrl, this.plugin.settings.calendars);
                            this.plugin.settings.calendars.push(newCal);
                            // By default select it
                            this.plugin.settings.selectedCalendars.push(newCal.id);

                            await this.plugin.saveSettings();
                            newCalendarUrl = ''; // Reset (UI won't reflect unless we rebuild, so display() calls usually needed)
                            this.display(); // Refresh to show new list

                            // Trigger refresh in active views? 
                            // We will handle this in main.ts logic or generic event
                        } catch (error: any) {
                            console.error(error);
                            // Ideally show a notice
                            alert(`Error adding calendar: ${error.message}`);
                        }
                    }
                }));

        // List Existing Calendars
        this.plugin.settings.calendars.forEach((calendar, index: number) => {
            const div = containerEl.createDiv();
            div.addClass('calendar-setting-item');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'space-between';
            div.style.marginTop = '10px';
            div.style.padding = '10px';
            div.style.backgroundColor = 'var(--background-secondary)';
            div.style.borderRadius = 'var(--radius-sm)';

            const info = div.createDiv();
            info.style.display = 'flex';
            info.style.alignItems = 'center';
            info.style.gap = '10px';

            const colorDot = info.createDiv();
            colorDot.style.width = '12px';
            colorDot.style.height = '12px';
            colorDot.style.borderRadius = '50%';
            colorDot.style.backgroundColor = calendar.color;

            const name = info.createDiv();
            name.innerText = calendar.title;
            name.style.fontWeight = 'bold';

            new Setting(div)
                .addButton(button => button
                    .setButtonText('Remove')
                    .setWarning()
                    .onClick(async () => {
                        if (confirm(`Are you sure you want to remove "${calendar.title}"?`)) {
                            this.plugin.settings.calendars.splice(index, 1);
                            this.plugin.settings.selectedCalendars = this.plugin.settings.selectedCalendars.filter((id: string) => id !== calendar.id);
                            await this.plugin.saveSettings();
                            this.display();
                        }
                    }));
        });
    }
}

