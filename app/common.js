export class Human {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }

    get age() {
        return this._age;
    }

    set age(value) {
        this._age = value<0 ? 0:value;
    }

    say() {
        console.log("Hello, world! I'm " + this.name);
    }
}