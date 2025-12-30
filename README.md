# ExamPilot 🎓

**Système intelligent de gestion et planification d'examens**

ExamPilot est une application desktop complète qui automatise la planification des sessions d'examens en optimisant l'allocation des salles, la gestion des horaires et la coordination des cohortes d'étudiants.

---

## ✨ Fonctionnalités Principales

### 📊 Gestion Complète
- **Salles** : Configuration des amphithéâtres, salles TD et laboratoires avec capacités
- **Cohortes** : Organisation par filières et niveaux (L1, L2, M1, M2, etc.)
- **Unités d'Enseignement** : Gestion des matières et examens associés
- **Sessions** : Historique complet des plannings générés

### 🤖 Algorithme Intelligent
- Planification automatisée avec contraintes multiples
- Optimisation de l'occupation des salles
- Respect des capacités et disponibilités
- Randomisation pour varier les résultats

### 📥 Importation Massive
- Import Excel/CSV pour salles, cohortes et UE
- Modèles téléchargeables intégrés
- Validation automatique des données
- Transactions sécurisées (tout ou rien)

### 📤 Exports Professionnels
- **PDF** : Planning formaté avec groupement par date/heure
- **Excel** : Tableaux avec cellules fusionnées
- Exports personnalisables

### 🎨 Personnalisation
- Logo personnalisé dans la sidebar
- Couleur primaire configurable
- Interface responsive et moderne

---

## 🚀 Installation

### Prérequis
- **Node.js** 20+ et npm
- **Windows** (pour la version desktop)

### Installation des dépendances

```bash
npm install
```

### Configuration de la base de données

```bash
npx prisma db push
```

---

## 💻 Utilisation

### Mode Développement (Web)

```bash
npm run dev
```

Accédez à l'application sur [http://localhost:3000](http://localhost:3000)

### Mode Desktop (Electron)

```bash
npm run electron:dev
```

### Build Production

#### Version Web
```bash
npm run build
npm start
```

#### Version Desktop Windows
```bash
npm run build:win
```

L'installateur sera généré dans `dist/ExamPilot Setup.exe`

---

## 📁 Structure du Projet

```
exam-pilot/
├── app/
│   ├── actions/          # Server Actions (API)
│   │   ├── import.ts     # Importation massive
│   │   ├── scheduler.ts  # Algorithme de planification
│   │   └── ...
│   ├── dashboard/        # Pages du tableau de bord
│   └── layout.tsx
├── components/
│   ├── modals/          # Modales réutilisables
│   ├── ui/              # Composants UI
│   └── providers/       # Context providers
├── lib/
│   ├── algorithm.ts     # Algorithme de planification
│   └── prisma.ts        # Client Prisma
├── prisma/
│   ├── schema.prisma    # Schéma de base de données
│   └── dev.db           # Base SQLite
├── build/
│   └── license_fr.txt   # EULA pour l'installateur
├── main.js              # Point d'entrée Electron
└── package.json
```

---

## 🗄️ Base de Données

ExamPilot utilise **SQLite** avec **Prisma ORM** pour une gestion locale et performante.

### Modèles Principaux
- `Room` : Salles d'examen
- `Cohort` : Groupes d'étudiants
- `Subject` : Unités d'enseignement
- `Exam` : Épreuves à planifier
- `Schedule` : Planning généré
- `PlanningSession` : Sessions de planification
- `Settings` : Configuration de l'application

---

## 🔧 Technologies Utilisées

### Frontend
- **Next.js 16** (App Router)
- **React 19**
- **TailwindCSS 4**
- **TypeScript**

### Backend
- **Prisma** (ORM)
- **SQLite** (Base de données)
- **Server Actions** (API)

### Desktop
- **Electron 33**
- **electron-builder** (Packaging)
- **NSIS** (Installateur Windows)

### Exports
- **jsPDF** + **jspdf-autotable** (PDF)
- **xlsx** (Excel)

---

## 📦 Version Desktop

### Caractéristiques
- ✅ Installation professionnelle avec EULA
- ✅ Raccourcis bureau et menu démarrer
- ✅ Base de données réinitialisée au premier lancement
- ✅ Fonctionnement 100% offline
- ✅ Désinstalleur intégré

### Génération de l'Installateur

Sur Linux (avec Wine) :
```bash
./build-windows.sh
```

Sur Windows :
```bash
npm run build:win
```

---

## 🎯 Workflow Typique

1. **Configuration Initiale**
   - Ajouter les salles (manuellement ou par import)
   - Créer les cohortes
   - Définir les UE et examens

2. **Génération du Planning**
   - Cliquer sur "Nouvelle Session"
   - Définir la période (dates de début/fin)
   - Lancer l'algorithme

3. **Consultation et Export**
   - Visualiser en mode carte ou tableau
   - Exporter en PDF ou Excel
   - Consulter l'historique des sessions

---

## 👨‍💻 Développeur

**Gervais Azanga Ayissi**  
📞 +237 695 183 768  
📧 gerazayisti@gmail.com

---

## 📄 Licence

Copyright © 2024 Gervais Azanga Ayissi. Tous droits réservés.

Licence d'utilisation éducative. Voir `build/license_fr.txt` pour les détails.

---

## 🐛 Problèmes Connus

### Build Windows sur Linux
La compilation croisée peut échouer avec des erreurs de timeout. Solutions :
- Utiliser le script `build-windows.sh`
- Compiler directement sur Windows
- Désactiver la signature de code dans `package.json`

### Polices Google Fonts
Pour la version offline, les polices Google ont été remplacées par des polices système.

---

## 🔮 Roadmap

- [ ] Support multi-langues
- [ ] Mode sombre
- [ ] Notifications push
- [ ] Export iCal
- [ ] API REST
- [ ] Version macOS/Linux

---

## 🙏 Remerciements

Merci d'utiliser ExamPilot ! Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub.

**⭐ N'oubliez pas de mettre une étoile si ce projet vous est utile !**
