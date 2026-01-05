
import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type AnnualLinearCalendarPlugin from './main';
import { createCalendar } from './src/lib/calendars';
import { ViewMode } from './src/lib/date';

export class CalendarSettingTab extends PluginSettingTab {
    plugin: AnnualLinearCalendarPlugin;

    constructor(app: App, plugin: AnnualLinearCalendarPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Default view mode')
            .setDesc('Choose the default view when opening the calendar.')
            .addDropdown(dropdown => dropdown
                .addOption('date-grid', 'Date grid')
                .addOption('fixed-week', 'Fixed week')
                .addOption('cyclical', 'Cyclical')
                .setValue(this.plugin.settings.viewMode)
                .onChange(async (value) => {
                    this.plugin.settings.viewMode = value as ViewMode;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Manage calendars')
            .setHeading();

        // Add New Calendar
        let newCalendarUrl = '';
        new Setting(containerEl)
            .setName('Add calendar.')
            .setDesc('Enter an iCalendar URL to add.')
            .addText(text => text
                .setPlaceholder('https://example.com/calendar.ics')
                .onChange((value) => {
                    newCalendarUrl = value;
                }))
            .addButton(button => button
                .setButtonText('Add calendar')
                .onClick(async () => {
                    if (newCalendarUrl) {
                        try {
                            const newCal = await createCalendar(newCalendarUrl, this.plugin.settings.calendars);
                            this.plugin.settings.calendars.push(newCal);
                            // By default select it
                            this.plugin.settings.selectedCalendars.push(newCal.id);

                            await this.plugin.saveSettings();
                            newCalendarUrl = '';
                            this.display();
                        } catch (error: unknown) {
                            console.error(error);
                            const message = error instanceof Error ? error.message : "unknown error";
                            new Notice(`Error adding calendar: ${message}`);
                        }
                    }
                }));

        // List Existing Calendars
        this.plugin.settings.calendars.forEach((calendar, index: number) => {
            const div = containerEl.createDiv();
            div.addClass('calendar-setting-item');

            const info = div.createDiv();
            info.addClass('calendar-setting-info');

            const colorDot = info.createDiv();
            colorDot.addClass('calendar-setting-color-dot');
            colorDot.style.backgroundColor = calendar.color;

            const name = info.createDiv();
            name.addClass('calendar-setting-name');
            name.setText(calendar.title);

            new Setting(div)
                .addColorPicker(cp => cp
                    .setValue(calendar.color || '#0ea5e9')
                    .onChange(async (value) => {
                        calendar.color = value;
                        await this.plugin.saveSettings();
                        colorDot.style.backgroundColor = value;
                    }))
                .addButton(button => button
                    .setButtonText('Remove')
                    .setWarning()
                    .onClick(async () => {
                        this.plugin.settings.calendars.splice(index, 1);
                        this.plugin.settings.selectedCalendars = this.plugin.settings.selectedCalendars.filter((id: string) => id !== calendar.id);
                        await this.plugin.saveSettings();
                        this.display();
                    }));
        });
    }
}

