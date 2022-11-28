import { useLocalObservable } from "mobx-react";

/**
 * State with a single value.
 * @param initial initial value.
 */
export function useSimpleState<T>(initial: T) {
    return useLocalObservable<{
        value: T,
        set: (newValue: T) => void,
        is: (expected: T) => boolean,
        toggle: () => void;
    }>(() => ({
        value: initial,
        set(newValue) {
            this.value = newValue;
        },
        is(expected) {
            return this.value === expected;
        },
        toggle() {
            if (typeof this.value === "boolean") {
                this.set(!this.value as unknown as T);
            }
        }
    }));
}
