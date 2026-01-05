
declare module 'ical.js' {
    export class Component {
        constructor(jcal: unknown[] | string);
        getAllSubcomponents(name: string): Component[];
        getFirstPropertyValue(name: string): unknown;
        getFirstProperty(name: string): Property | null;
    }

    export class Property {
        getFirstValue(): unknown;
    }

    export class Event {
        constructor(component: Component);
        uid: string;
        summary: string;
        description: string;
        location: string;
        startDate: Time;
        endDate: Time;
        duration: Duration;
    }

    export class Time {
        isDate: boolean;
        toJSDate(): Date;
        static fromString(str: string): Time;
    }

    export class Duration {

    }

    export function parse(input: string): unknown[];
}
