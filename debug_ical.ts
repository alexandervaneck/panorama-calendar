
import ICAL from 'ical.js';

async function test() {
    const url = "https://calendar.google.com/calendar/ical/c_2bcec2be3cdcc9fa3260a60882d9ed34798711ea549f3ba7f5671025073b495a%40group.calendar.google.com/private-0bc526efd88159f0014e9956b8588842/basic.ics";
    console.log("Fetching URL:", url);
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error("Fetch failed:", res.status, res.statusText);
            return;
        }
        const text = await res.text();
        console.log("Fetch success. Content length:", text.length);
        console.log("First 100 chars:", text.substring(0, 100));

        const jcalData = ICAL.parse(text);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');
        console.log(`Found ${vevents.length} events:`);

        vevents.forEach((vevent: any) => {
            const event = new ICAL.Event(vevent);
            console.log(`- ${event.summary} (Start: ${event.startDate.toString()})`);
        });
    } catch (e) {
        console.error("Error during test:", e);
    }
}

test();
