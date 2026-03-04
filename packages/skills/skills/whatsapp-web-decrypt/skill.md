# WhatsApp Web Message Decryption & Analysis

Decrypt and read WhatsApp Web messages via live browser interception using Playwright. Intercepts `crypto.subtle.decrypt` to capture plaintext message content, encryption keys, and sender metadata. Also analyzes WhatsApp IndexedDB metadata for contacts, groups, social graph, and communication patterns.

## Part 1: Live Message Decryption (Playwright)

### How It Works

WhatsApp Web encrypts messages in IndexedDB (`msgRowOpaqueData`) using **AES-CBC-128** with keys derived via **HKDF-SHA256**. The crypto happens on the **main thread** (not Web Workers). By intercepting `crypto.subtle` before page JS loads, we capture plaintext output and extractable keys.

### Prerequisites

- Playwright MCP browser (or any Playwright-based browser automation)
- WhatsApp Web logged in (or QR code scan needed)

### Step 1: Navigate to WhatsApp Web

```
Use browser_navigate to go to https://web.whatsapp.com
Wait for the page to load. If QR code appears, user must scan it.
Use browser_snapshot to verify the chat list is visible.
```

### Step 2: Install the crypto interceptor

Use `browser_run_code` with this **exact** code to install the interceptor via `addInitScript` (runs before any page JS on reload):

```javascript
async (page) => {
    await page.addInitScript(() => {
        const scope = (typeof globalThis !== 'undefined') ? globalThis : self;
        scope.__waCaptured = { decrypt: [], deriveKey: [], importKey: [] };

        // Force all imported/generated keys to be extractable
        const origImportKey = crypto.subtle.importKey.bind(crypto.subtle);
        crypto.subtle.importKey = function(format, keyData, algorithm, extractable, keyUsages) {
            return origImportKey(format, keyData, algorithm, true, keyUsages);
        };

        const origGenerateKey = crypto.subtle.generateKey.bind(crypto.subtle);
        crypto.subtle.generateKey = function(algorithm, extractable, keyUsages) {
            return origGenerateKey(algorithm, true, keyUsages);
        };

        // Capture HKDF key derivations with extractable output
        const origDeriveKey = crypto.subtle.deriveKey.bind(crypto.subtle);
        crypto.subtle.deriveKey = async function(algorithm, baseKey, derivedKeyType, extractable, keyUsages) {
            const result = await origDeriveKey(algorithm, baseKey, derivedKeyType, true, keyUsages);
            try {
                const raw = await crypto.subtle.exportKey('raw', result);
                const b64 = btoa(String.fromCharCode(...new Uint8Array(raw)));
                scope.__waCaptured.deriveKey.push({
                    ts: Date.now(),
                    alg: algorithm.name,
                    saltLen: algorithm.salt ? algorithm.salt.byteLength : 0,
                    derivedAlg: derivedKeyType.name,
                    derivedLen: derivedKeyType.length,
                    keyB64: b64,
                    usages: keyUsages
                });
            } catch(e) {}
            return result;
        };

        // Capture all decrypt operations with plaintext output
        const origDecrypt = crypto.subtle.decrypt.bind(crypto.subtle);
        crypto.subtle.decrypt = async function(algorithm, key, data) {
            const result = await origDecrypt(algorithm, key, data);
            let keyB64 = null;
            try {
                const raw = await crypto.subtle.exportKey('raw', key);
                keyB64 = btoa(String.fromCharCode(...new Uint8Array(raw)));
            } catch(e) { keyB64 = 'export-failed'; }

            const entry = {
                ts: Date.now(),
                alg: algorithm.name,
                key: keyB64,
                inSize: data.byteLength,
                outSize: result.byteLength
            };

            // Capture decrypted output (up to 1500 bytes) for text extraction
            if (result.byteLength > 0 && result.byteLength < 500000) {
                const slice = new Uint8Array(result.slice(0, Math.min(1500, result.byteLength)));
                entry.outB64 = btoa(String.fromCharCode(...slice));
            }
            scope.__waCaptured.decrypt.push(entry);
            return result;
        };
    });

    // Reload to trigger fresh decryption of all cached messages
    await page.reload({ waitUntil: 'networkidle' });
    // Wait for WhatsApp to load and decrypt messages
    await new Promise(r => setTimeout(r, 8000));
    return 'Interceptor installed and page reloaded. Decryptions are being captured.';
}
```

### Step 3: Collect captured decryptions

Wait 10-15 seconds after reload, then extract with `browser_run_code`:

```javascript
async (page) => {
    const data = await page.evaluate(() => {
        const c = (globalThis || self).__waCaptured;
        if (!c) return JSON.stringify({error: 'no captures'});
        return JSON.stringify({
            decryptCount: c.decrypt.length,
            deriveKeyCount: c.deriveKey.length,
            derivedKeys: c.deriveKey,
            sample: c.decrypt.slice(0, 5)
        });
    });
    return data;
}
```

### Step 4: Extract and parse message text

Decrypted output is **protobuf**. Extract text with `browser_run_code`:

```javascript
async (page) => {
    const result = await page.evaluate(() => {
        const c = (globalThis || self).__waCaptured;
        if (!c) return JSON.stringify({error: 'no captures'});

        function readVarint(bytes, pos) {
            let result = 0, shift = 0;
            while (pos < bytes.length) {
                const byte = bytes[pos];
                result |= (byte & 0x7f) << shift;
                shift += 7; pos++;
                if (!(byte & 0x80)) return [result, pos];
            }
            return [null, pos];
        }

        function parseProtobufText(bytes) {
            if (!bytes || bytes[0] !== 0x0a) return null;
            let pos = 1;
            let [outerLen, p1] = readVarint(bytes, pos);
            if (outerLen === null || p1 >= bytes.length) return null;
            pos = p1;
            if (bytes[pos] !== 0x0a) return null;
            pos++;
            let [textLen, p2] = readVarint(bytes, pos);
            if (textLen === null || textLen <= 0 || p2 + textLen > bytes.length) return null;
            pos = p2;
            try {
                return new TextDecoder('utf-8').decode(bytes.slice(pos, pos + textLen));
            } catch(e) { return null; }
        }

        function extractSender(bytes) {
            try {
                const str = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
                const match = str.match(/(\d+@(?:s\.whatsapp\.net|lid|g\.us))/);
                return match ? match[1] : null;
            } catch(e) { return null; }
        }

        const messages = [];
        for (const d of c.decrypt) {
            if (!d.outB64 || d.alg !== 'AES-CBC') continue;
            try {
                const bytes = Uint8Array.from(atob(d.outB64), c => c.charCodeAt(0));
                const text = parseProtobufText(bytes);
                if (text && text.length > 0) {
                    messages.push({
                        text: text,
                        sender: extractSender(bytes),
                        ts: d.ts
                    });
                }
            } catch(e) {}
        }

        return JSON.stringify({
            totalDecrypts: c.decrypt.length,
            textMessages: messages.length,
            messages: messages
        });
    });
    return result;
}
```

### Step 5: Navigate to more chats for additional messages

WhatsApp only decrypts messages for loaded chats. To capture more:

- Use `browser_snapshot` to see the chat list
- Click on different chats using `browser_click` with the ref for each chat
- Wait 3-5 seconds between clicks for decryption to complete
- Re-run Step 4 to collect newly decrypted messages

After the initial page reload (Step 2), WhatsApp decrypts all cached/visible messages (~700-1000+). Clicking individual chats adds more but the bulk comes from the reload.

### Key Technical Details

- Crypto happens on the **main thread**, not Web Workers (3 workers exist but don't do message crypto)
- `page.addInitScript()` is critical -- must run BEFORE page JS to force `extractable: true` on all key imports
- Decrypted output is protobuf: field 1 (wire type 2) -> field 1 (wire type 2) = message text
- Sender JID appears as string like `16507961489@s.whatsapp.net` or `123456@lid`
- AES-GCM operations are noise protocol frames (not message content)
- Keys are session-specific (HKDF-SHA256 with 128-byte salt) -- captured keys only work for the session they were captured in

---

## Part 2: Metadata Analysis (Offline from IndexedDB)

WhatsApp Web stores 51 IndexedDB object stores. Message bodies are encrypted but all metadata is plaintext.

### Available Stores

| Store | What's in it |
|-------|-------------|
| contact | Phone numbers, names, isAddressBook, isBusiness |
| chat | Chat IDs, last message timestamps, unread counts, mute/archive state |
| group-metadata | Group subjects, creation dates, owner phone number |
| participant | Group member phone lists |
| message | Message type, from/to/author, timestamps, media metadata (NOT body text) |
| reactions | Emoji reactions with sender, timestamp |
| profile-pic-thumb | Profile picture CDN URLs |
| verified-business-name | Business names linked to phone numbers |
| blocklist | Blocked phone numbers |
| device-list | Linked devices per user |

### Contact Name Lookup

WhatsApp uses two ID formats. Build a unified phone-to-name map:

```python
contacts = {}  # phone -> name
lid_to_phone = {}  # lid -> phone
for record in rows:
    val = json.loads(record[0])
    cid = val.get('id', '')
    name = val.get('name', '')
    pnum = cid.split('@')[0]
    phone_field = val.get('phoneNumber', '')
    if phone_field:
        phone = phone_field.split('@')[0]
        lid_to_phone[pnum] = phone
        if name:
            contacts[phone] = name
    if name and '@c.us' in cid:
        contacts[pnum] = name
```

### Inner Circle Detection

Count how many groups each person shares with the account owner:

```python
your_groups = set()
person_groups = {}
for record in participants:
    gid = record['groupId']
    for p in record['participants']:
        phone = p.split('@')[0]
        resolved = lid_to_phone.get(phone, phone)
        if resolved == YOUR_NUMBER:
            your_groups.add(gid)
        person_groups.setdefault(resolved, set()).add(gid)
shared = {p: len(gs & your_groups) for p, gs in person_groups.items() if p != YOUR_NUMBER}
top_connections = sorted(shared.items(), key=lambda x: -x[1])
```

### Message Metadata Fields

- `type`: chat, image, video, ptt (voice), document, sticker, location, vcard, revoked
- `t`: unix timestamp
- `from`: sender (phone@c.us or group@g.us)
- `author`: in group messages, the actual sender
- `ack`: delivery status (0=sent, 1=delivered, 2=read)
- `isForwarded`, `forwardingScore`: forwarding chain info

## Known Limitations

- **Session-specific keys**: HKDF-derived keys change per browser session (128-byte salt)
- **Offline decryption**: Does not work across sessions -- keys from one session can't decrypt another session's data
- **Record cap**: IndexedDB stores may cap at ~1000 records
- **Contact names**: Only available for address book contacts
- **lid-to-phone mapping**: Incomplete for some contacts
