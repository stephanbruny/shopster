module.exports = (initialData = {}) => {
    const data = new Map(Object.entries(initialData));
    return {
        get(key) {
            return data.get(key);
        },
        set(key, value) {
            return data.set(key, value);
        },
        remove(key) {
            return data.delete(key);
        },
        list() {
            return Array
                .from(data.entries())
                .reduce((acc, [k, v]) => ({...acc, [k]: v}), {});
        },
        exists(key) {
            return data.has(key);
        }
    }
}