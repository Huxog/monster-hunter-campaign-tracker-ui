---
name: API Client Context
description: Comprehensive prompt for understanding MHCampaignApi as a consuming client — endpoints, auth, data shapes, enums, and business rules
type: reference
originSessionId: 22fe4ce5-f86e-44b2-a612-01edfced3058
---
# MHCampaignApi — Client Consuming Prompt

Use the following as a system-level context when acting as a client consuming this API.

---

## What this API is

A REST API for managing **Monster Hunter tabletop game campaigns**. It tracks campaigns, the hunters (player characters) within them, their equipment and weapons, materials gathered from monsters, and quest history. It is a pure data API — no server-rendered views.

Base URL supports two equivalent prefixes: `/` and `/v1`. All routes below omit the prefix.

---

## Authentication

Token-based via **Laravel Sanctum**. Send `Authorization: Bearer <token>` on every authenticated request.

| Action | Endpoint | Auth required |
|---|---|---|
| Register | `POST /auth/register` | No |
| Login | `POST /auth/login` | No |
| Logout | `POST /auth/logout` | Yes |
| Get current user | `GET /auth/me` | Yes |

**Register body:** `{ name, email, password, password_confirmation }`
**Login body:** `{ email, password }`
**Both return:** `{ data: UserResource, token: "..." }`

### Roles

- `player` — assigned at registration. Can read all resources and perform hunter actions (loot, equip, craft).
- `admin` — required for all write operations (POST/PATCH/DELETE on catalog entities).

---

## Response envelope

All single-resource responses:
```json
{ "data": { ...resource fields } }
```

All collection responses (paginated):
```json
{
  "data": [ ...resource items ],
  "links": { "first", "last", "prev", "next" },
  "meta": { "current_page", "last_page", "per_page", "total", ... }
}
```

All IDs are **UUIDs**. All timestamps are camelCase (`createdAt`, `updatedAt`). Relationships are included only `whenLoaded` — they appear in the response only when the backend has eager-loaded them (typically on `show`, not on `index`).

---

## Enums

### WeaponClass
`Bow` | `Great Sword` | `Dual Blades` | `Long Sword` | `Sword and Shield` | `Hammer` | `Lance` | `Gun Lance` | `Switch Axe` | `Charge Blade` | `Insect Glaive` | `Light Bowgun` | `Heavy Bowgun` | `Hunting Horn`

### ElementalType
`Fire` | `Water` | `Thunder` | `Ice` | `Dragon` | `None`

### EquipmentType
`helmet` | `vest` | `trouser`

### QuestOutcome
`success` | `failure` | `abandoned`

### AilmentType (used in monster weaknesses)
`Poison` | `Paralysis` | `Sleep` | `Stun` | `Blast`

---

## Resources (field shapes)

### UserResource
`id, name, email, roles[], createdAt, updatedAt`

### MapResource
`id, name, createdAt, updatedAt`
Optional: `campaigns[]` (CampaignResource)

### CampaignResource
`id, name, teamName, mapId, createdAt, updatedAt`
Optional: `map` (MapResource), `hunters[]`, `quests[]`

### HunterResource
`id, playerName, hunterName, campaignId, class (WeaponClass), helmetId, vestId, trousersId, createdAt, updatedAt`
Optional: `campaign`, `helmet` (EquipmentResource), `vest`, `trousers`, `weapon` (WeaponResource), `quests[]`, `loot[]` (MaterialResource with pivot quantity), `inventoryWeapons[]`, `inventoryEquipment[]`

### WeaponResource
`id, name, class (WeaponClass), element (ElementalType), damage[], createdAt, updatedAt`
Optional: `hunter` (HunterResource)

### EquipmentResource
`id, name, effect, type (EquipmentType), armor, elementalResistances{fire,ice,thunder,water,dragon}, class (WeaponClass), createdAt, updatedAt`
Optional: `materials[]`

### MaterialResource
`id, name, createdAt, updatedAt`
Optional: `hunters[]`, `weapons[]`, `equipment[]`, `monsters[]`

### MonsterResource
`id, name, description, stars (1–7), elementalWeaknesses{Fire,Water,Thunder,Ice,Dragon} (0–3 scale), ailmentWeaknesses{Poison,Paralysis,Sleep,Stun,Blast} (0–3 scale), imagePath, createdAt, updatedAt`
Optional: `materials[]`, `quests[]`

### QuestResource
`id, campaignId, monsterId, outcome (QuestOutcome|null), completedAt (datetime|null), createdAt, updatedAt`
Optional: `campaign`, `monster`, `hunters[]`

---

## Endpoints

### Maps
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/maps` | player | — |
| POST | `/maps` | admin | `{ name }` |
| GET | `/maps/{id}` | player | — |
| PATCH | `/maps/{id}` | admin | `{ name? }` |
| DELETE | `/maps/{id}` | admin | — |

### Campaigns
| Method | Path | Auth | Filters / Body |
|---|---|---|---|
| GET | `/campaigns` | player | `?mapId=uuid&page=N` |
| POST | `/campaigns` | admin | `{ name, teamName, mapId? }` |
| GET | `/campaigns/{id}` | player | — |
| PATCH | `/campaigns/{id}` | admin | `{ name?, teamName?, mapId? }` |
| DELETE | `/campaigns/{id}` | admin | — |
| GET | `/campaigns/{id}/hunters` | player | pagination |
| GET | `/campaigns/{id}/quests` | player | pagination |

### Hunters
| Method | Path | Auth | Filters / Body |
|---|---|---|---|
| GET | `/hunters` | player | `?campaignId=uuid&class=WeaponClass&page=N` |
| POST | `/hunters` | player | `{ playerName, hunterName, campaignId, helmetId?, vestId?, trousersId? }` |
| GET | `/hunters/{id}` | player | — |
| PATCH | `/hunters/{id}` | player | `{ playerName?, hunterName?, helmetId?, vestId?, trousersId? }` |
| DELETE | `/hunters/{id}` | admin | — |

**Note:** Hunter `class` (WeaponClass) is set at creation via the weapon they carry, not directly as a field. Equipment IDs are validated against type — helmets only to `helmetId`, vests to `vestId`, etc.

### Hunter Actions
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/hunters/{id}/craft` | player | `{ craftableType: "weapon"\|"equipment", craftableId: uuid }` |
| POST | `/hunters/{id}/loot` | player | `{ materialId: uuid, quantity: int(≥1) }` |
| PATCH | `/hunters/{id}/loot/{materialId}` | player | `{ quantity: int(≥1) }` (decreases by this amount) |
| DELETE | `/hunters/{id}/loot/{materialId}` | player | — |
| POST | `/hunters/{id}/equip/weapon` | player | `{ equippableId: uuid }` |
| POST | `/hunters/{id}/equip/helmet` | player | `{ equippableId: uuid }` |
| POST | `/hunters/{id}/equip/vest` | player | `{ equippableId: uuid }` |
| POST | `/hunters/{id}/equip/trouser` | player | `{ equippableId: uuid }` |

### Weapons
| Method | Path | Auth | Filters / Body |
|---|---|---|---|
| GET | `/weapons` | player | `?class=WeaponClass&element=ElementalType&page=N` |
| POST | `/weapons` | admin | `{ name, class (WeaponClass), element? (ElementalType), damage[]? }` |
| GET | `/weapons/{id}` | player | — |
| PATCH | `/weapons/{id}` | admin | `{ name?, class?, element?, damage[]? }` |
| DELETE | `/weapons/{id}` | admin | — |

### Equipment
| Method | Path | Auth | Filters / Body |
|---|---|---|---|
| GET | `/equipment` | player | `?type=EquipmentType&class=WeaponClass&page=N` |
| POST | `/equipment` | admin | `{ name, type (EquipmentType), class (WeaponClass), effect?, armor?, elementalResistances? }` |
| GET | `/equipment/{id}` | player | — |
| PATCH | `/equipment/{id}` | admin | `{ name?, class?, effect?, armor?, elementalResistances? }` |
| DELETE | `/equipment/{id}` | admin | — |

`elementalResistances` shape: `{ fire: 0–5, ice: 0–5, thunder: 0–5, water: 0–5, dragon: 0–5 }`

### Materials
| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/materials` | player | `?page=N` |
| POST | `/materials` | admin | `{ name }` (unique) |
| GET | `/materials/{id}` | player | — |
| PATCH | `/materials/{id}` | admin | `{ name }` |
| DELETE | `/materials/{id}` | admin | — |

### Monsters
| Method | Path | Auth | Filters / Body |
|---|---|---|---|
| GET | `/monsters` | player | `?stars=1-7&page=N` |
| POST | `/monsters` | admin | `{ name, description?, stars (1–7), elementalWeaknesses{}, ailmentWeaknesses{}, imagePath?, materials[]? }` |
| GET | `/monsters/{id}` | player | — |
| PATCH | `/monsters/{id}` | admin | same fields as store, all optional |
| DELETE | `/monsters/{id}` | admin | — |

`elementalWeaknesses` and `ailmentWeaknesses` are objects keyed by type name with integer ratings 0–3.

### Quests
| Method | Path | Auth | Filters / Body |
|---|---|---|---|
| GET | `/quests` | player | `?campaignId=uuid&monsterId=uuid&outcome=QuestOutcome&page=N` |
| POST | `/quests` | admin | `{ campaignId, monsterId, hunterIds[] (all must belong to campaign), outcome?, completedAt? }` |
| GET | `/quests/{id}` | player | — |
| PATCH | `/quests/{id}` | admin | `{ campaignId?, monsterId?, hunterIds[]?, outcome?, completedAt? }` |
| DELETE | `/quests/{id}` | admin | — |

---

## Domain relationships (mental model)

```
Map → Campaign → Hunter
                   ├── equipped: helmet (Equipment), vest, trousers, weapon (Weapon)
                   ├── inventory: weapons[], equipment[]
                   └── loot: materials[] (with quantity pivot)

Monster → drops → Material
Monster → Quest ← Campaign
Quest ←→ Hunter (many-to-many)

Weapon/Equipment → recipe → Material[] (with quantity pivot)
```

**Craft flow:** A hunter crafts a weapon or equipment from materials in their loot. The crafted item moves into their inventory. Equipping pulls from inventory to set the active slot.

**Quest flow:** A quest links a campaign, a monster, and participating hunters. Outcome and completedAt are set when the hunt resolves.

---

## Key constraints to keep in mind

- All deletes are soft deletes — deleted resources are excluded from queries unless explicitly specified.
- Equipment type is locked at creation — `type` cannot be changed via PATCH.
- When equipping, the item must already exist in the hunter's inventory.
- `hunterIds` in quest store must all belong to the given campaign.
- Monster `stars` range is 1–7 (Rajang is 7, the hardest).
- `elementalWeaknesses` and `ailmentWeaknesses` use a 0–3 scale (0 = no weakness, 3 = extreme weakness).
- Material names and map names must be globally unique.
