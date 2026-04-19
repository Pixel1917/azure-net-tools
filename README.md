# @azure-net/tools

**A collection of universal utilities.**
Ideal for TypeScript/JavaScript projects, covering a wide range of tasks: object and string manipulation, DOM observation, event bus logic, and more.

## Installation

```bash
npm install @azure-net/tools
```

## Utilities

> All utilities can be imported directly from the package.

### `EnvironmentUtil`

Detects the current execution environment:

* `EnvironmentUtil.isBrowser`
* `EnvironmentUtil.isServer`
* `EnvironmentUtil.isWebWorker`
* `EnvironmentUtil.isDevelopment`
* `EnvironmentUtil.isProduction`
* `EnvironmentUtil.currentEnvironment()` → `'browser' | 'server' | 'webWorker' | 'unknown'`
* `EnvironmentUtil.currentMode()` → `'development' | 'production' | 'unknown'`

For build-time env flags (for dead code elimination), use:

```ts
import { BROWSER, DEV, NODE } from '@azure-net/tools/environment';
```

---

### `DownloadUtil`

Triggers file download in the browser:
First argument can be a string URL, Blob, or File.

```ts
DownloadUtil.download('https://example.com/file.pdf', 'myFile.pdf');
```

---

### `EventBus<E>`

A lightweight event bus implementation.

```ts
type AppEvents = {
	loaded: { status: 'ok' };
	error: { message: string };
};

const bus = new EventBus<AppEvents>();

const unsubscribe = bus.subscribe('loaded', (data) => console.log('Loaded:', data.status));
bus.once('error', (data) => console.error(data.message));
bus.subscribeAll((event, payload) => console.log(event, payload));

await bus.publish('loaded', async () => ({ status: 'ok' }));
unsubscribe();
```

---

### `IntersectionObserverUtil<T>`

Simplified wrapper for `IntersectionObserver`.

```ts
const observer = new IntersectionObserverUtil(element, {
	callback(entry) {
		console.log('Element is visible:', entry);
	},
	once: true
});
```

---

### `TextUtil`

String utilities:

* `formatText(number, ['one', 'few', 'many'])` — pluralization.
* `truncate('long text...', 10)`
* `capitalize('hello')` → `'Hello'`
* `decapitalize('Hello')` → `'hello'`
* `isEmptyOrWhitespace('   ')` → `true`

---

### `ObjectUtil`

Object utilities:

* `clone(obj)` — shallow clone.
* `deepClone(obj, structured = false)` — deep clone (via `structuredClone` or JSON).
* `compareAsString(obj1, obj2)` — compares objects via their stringified forms.
* `equals(obj1, obj2)` — deep equality check (supports functions).
* `isAllKeysEmpty(obj)` — checks if all properties are `null` or `undefined`.
* `isObjectEmpty(obj)` — checks if object has no keys.
* `pick(obj, keys)` — returns object with only the given keys (typed as `Pick<T, K>`).
* `omit(obj, keys)` — returns object without the given keys (typed as `Omit<T, K>`).
* `renderAsString(obj, options?)` — pretty-printed, syntax-highlighted JSON HTML. Wrapped in `<pre><code>` by default.  Pass `{ wrap: false }` to get only the inner highlighted string.

---

### `FormDataUtil`

Utility class for converting between `FormData` and deeply nested JavaScript objects, supporting complex structures including arrays, nested objects, Maps, Sets, Dates, and Blob/File objects.

- Converts `FormData` keys with bracket notation (e.g., `foo[bar][baz]`) into nested objects.
- Supports serialization of objects with nested structures into `FormData`.
- Detects cyclic references during serialization and throws an error.
- Handles special types like `Date`, `Blob`, `File`, `Map`, and `Set`.

#### Example usage

```ts
import { FormDataUtil } from '@azure-net/tools';

// Convert FormData to object
const formData = new FormData();
formData.append('user[name]', 'Alice');
formData.append('user[age]', '30');
const obj = FormDataUtil.toObject<{ user: { name: string; age: string } }>(formData);
console.log(obj.user.name); // Alice

// Convert object to FormData
const objToSerialize = {
	user: {
		name: 'Bob',
		age: 25,
		files: [new File(['content'], 'file.txt')],
		birthDate: new Date('1995-12-17')
	}
};
const fd = FormDataUtil.fromObject(objToSerialize);
```

---

### `DateUtil`

The `DateUtil` class offers helper methods to format and manipulate dates and times, including support for different locales.

### Features

* Locale resolver via `setLocale(() => localeCode)` and default locale fallback.
* Flexible date and time formatting.
* Locale-aware month name rendering.
* Popular built-in locales (`ru`, `en`, `es`, `fr`, `de`, `it`, `pt`, `ja`, `ko`, `zh`) with `Intl` fallback for others.
* Custom formatting with tokens (`yyyy`, `MM`, `dd`, `HH`, etc.).
* Optional `utc`, `timeZone`, and `locale` per call via settings object.
* Strict ISO-like string parsing (`YYYY-MM-DD` and ISO date-time).
* Helpers: `isDate`, `now`, `fromTimestamp`.

### Example Usage

```ts
DateUtil.setLocale(() => 'en'); // resolver-based locale

DateUtil.toDate('2025-05-23'); // "23.05.2025"
DateUtil.toDateTime(new Date(), { utc: true }); // UTC formatting
DateUtil.toDayMonth('2025-08-15', { locale: 'fr' }); // "15 août" / localized month
DateUtil.toTime('2025-08-15T12:00:00Z', { timeZone: 'Asia/Tokyo' }); // "21:00"
DateUtil.toFormat('2025-12-01', 'dd MM yyyy', { locale: 'en' }); // "01 December 2025"
DateUtil.isDate('2025-12-01'); // true
DateUtil.now(); // Date
DateUtil.fromTimestamp(0); // Date(1970-01-01T00:00:00.000Z)
```

### Supported Format Tokens

| Token  | Description                    |
| ------ | ------------------------------ |
| `yyyy` | Full year (e.g., `2025`)       |
| `yy`   | Short year (e.g., `25`)        |
| `MM`   | Month name from locale         |
| `mm`   | Month number with leading zero |
| `dd`   | Day with leading zero          |
| `d`    | Day without leading zero       |
| `HH`   | Hours with leading zero        |
| `ii`   | Minutes with leading zero      |
| `ss`   | Seconds with leading zero      |

---

### `Cookies`

The `Cookies` class provides a simple interface for interacting with cookies in the browser.

### Features

* Set, get, delete, and clear cookies.
* Supports JSON-serializable values.
* Custom options (expiration, path, domain, secure, SameSite).
* Auto-check for browser environment.

### Example Usage

```ts
Cookies.set('theme', 'dark', { expires: 7 }); // expires in 7 days
const theme = Cookies.get('theme'); // "dark"

Cookies.set('user', { name: 'Alice' });
const user = Cookies.get<{ name: string }>('user'); // { name: 'Alice' }

Cookies.delete('theme');
```

---

### `DebounceUtil`

Creates a debounced function that runs only after `ms` milliseconds have passed since the last call.

```ts
const onSearch = DebounceUtil.debounce((query: string) => fetchSuggestions(query), 300);
onSearch('a'); onSearch('ab'); onSearch('abc'); // only last call runs after 300ms
```

---

### `ThrottleUtil`

Creates a throttled function that runs at most once per `ms` milliseconds (leading + one trailing call).

```ts
const onScroll = ThrottleUtil.throttle(() => updatePosition(), 100);
```

---

### `LocalStorageUtil`

Utility for `localStorage` in the browser. Uses `EnvironmentUtil` and does not access storage on the server. API mirrors `Cookies`: set, get, delete, has, keys, getAll, clear. Non-string values are JSON-serialized.

```ts
LocalStorageUtil.set('theme', 'dark');
const theme = LocalStorageUtil.get<string>('theme'); // "dark"

LocalStorageUtil.set('user', { name: 'Alice' });
const user = LocalStorageUtil.get<{ name: string }>('user'); // { name: 'Alice' }

LocalStorageUtil.delete('theme');
const allKeys = LocalStorageUtil.keys();
LocalStorageUtil.clear();
```

---

## Usage Example

```ts
import { EnvironmentUtil, TextUtil, ObjectUtil, DebounceUtil, LocalStorageUtil } from '@azure-net/tools';

if (EnvironmentUtil.isBrowser) {
	console.log(TextUtil.capitalize('hello world'));
	LocalStorageUtil.set('pref', { theme: 'dark' });
}

const user = { id: 1, name: 'Alice', password: 'secret' };
const safe = ObjectUtil.pick(user, ['id', 'name']); // { id: 1, name: 'Alice' }
const withoutPassword = ObjectUtil.omit(user, ['password']); // { id: 1, name: 'Alice' }

const fn = DebounceUtil.debounce((x: number) => console.log(x), 200);
fn(1); fn(2); fn(3); // logs 3 once after 200ms
```

---

## 📄 License

MIT
