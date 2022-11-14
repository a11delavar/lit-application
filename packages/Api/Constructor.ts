declare global {
	type AbstractConstructor<T> = abstract new (...args: Array<any>) => T;
	type Constructor<T> = new (...args: Array<any>) => T;
}