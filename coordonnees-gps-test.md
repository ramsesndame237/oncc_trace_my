# Coordonnées GPS de Test pour ONCC-V1

Ce fichier contient des coordonnées GPS réelles du Cameroun pour tester les fonctionnalités géographiques de l'application.

## Points GPS (3 points différents)

### Point 1 - Yaoundé (Capitale politique)

```json
{
  "latitude": 3.848,
  "longitude": 11.5021
}
```

### Point 2 - Douala (Capitale économique)

```json
{
  "latitude": 4.0511,
  "longitude": 9.7679
}
```

### Point 3 - Bafoussam (Région de l'Ouest - Zone café)

```json
{
  "latitude": 5.4698,
  "longitude": 10.4178
}
```

---

## Polygones GPS (3 polygones différents)

### Polygone 1 - Zone de production de cacao (Sud-Ouest)

**Triangle autour de Kumba**

```json
[
  {
    "latitude": 4.6344,
    "longitude": 9.4432
  },
  {
    "latitude": 4.7,
    "longitude": 9.5
  },
  {
    "latitude": 4.6,
    "longitude": 9.52
  }
]
```

### Polygone 2 - Zone de production de café (Ouest)

**Quadrilatère autour de Dschang**

```json
[
  {
    "latitude": 5.45,
    "longitude": 10.05
  },
  {
    "latitude": 5.5,
    "longitude": 10.1
  },
  {
    "latitude": 5.48,
    "longitude": 10.15
  },
  {
    "latitude": 5.43,
    "longitude": 10.12
  }
]
```

### Polygone 3 - Zone mixte cacao/café (Littoral)

**Pentagone autour de Nkongsamba**

```json
[
  {
    "latitude": 4.9547,
    "longitude": 9.9382
  },
  {
    "latitude": 5.0,
    "longitude": 9.98
  },
  {
    "latitude": 5.02,
    "longitude": 10.02
  },
  {
    "latitude": 4.98,
    "longitude": 10.05
  },
  {
    "latitude": 4.93,
    "longitude": 10.0
  }
]
```

---

## Format pour les tests API

### Point GPS (Format compact)

```json
{
  "type": "Point",
  "coordinates": [11.5021, 3.848]
}
```

**Note**: Le format GeoJSON utilise `[longitude, latitude]`

### Polygone GPS (Format GeoJSON)

```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [9.4432, 4.6344],
      [9.5, 4.7],
      [9.52, 4.6],
      [9.4432, 4.6344]
    ]
  ]
}
```

**Note**: Le premier et le dernier point doivent être identiques pour fermer le polygone

---

## Utilisation dans les tests

### Exemple de test pour un point

```typescript
const point = {
  latitude: 3.848,
  longitude: 11.5021,
};
```

### Exemple de test pour un polygone

```typescript
const polygon = [
  { latitude: 4.6344, longitude: 9.4432 },
  { latitude: 4.7, longitude: 9.5 },
  { latitude: 4.6, longitude: 9.52 },
];
```

---

## Carte des régions

| Région    | Ville principale | Production principale | Point GPS  |
| --------- | ---------------- | --------------------- | ---------- |
| Centre    | Yaoundé          | Administrative        | Point 1    |
| Littoral  | Douala           | Port/Export           | Point 2    |
| Ouest     | Bafoussam        | Café                  | Point 3    |
| Sud-Ouest | Kumba            | Cacao                 | Polygone 1 |
| Ouest     | Dschang          | Café                  | Polygone 2 |
| Littoral  | Nkongsamba       | Cacao/Café            | Polygone 3 |

---

_Généré le: 2025-10-03_
_Projet: ONCC-V1 - Système d'Information pour les Filières Cacao et Café_

// Désinstaller tous les Service Workers
navigator.serviceWorker.getRegistrations().then(regs => {
regs.forEach(reg => reg.unregister());
console.log('✅ Service Workers désinstallés');
});

// Nettoyer tous les caches
caches.keys().then(names => {
names.forEach(name => caches.delete(name));
console.log('✅ Caches nettoyés');
});

// Rafraîchir dans 1 seconde
setTimeout(() => location.reload(), 1000);
