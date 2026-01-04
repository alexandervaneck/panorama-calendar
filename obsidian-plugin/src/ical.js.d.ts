
declare module 'ical.js' {
    export class Component {
        constructor(jcal: any[] | string);
        getAllSubcomponents(name: string): Component[];
        getFirstPropertyValue(name: string): any;
    }

    export class Event {
        constructor(component: Component | any);
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

    export function parse(input: string): any[];
}
