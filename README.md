## Spotly

## French Version

Spotly est une application open source de gestion et de réservation de ressources 
pour les entreprises. Elle permet aux employés de réserver et d'organiser efficacement 
l'utilisation de ressources partagées telles que les salles, les équipements, les véhicules,
etc. Grâce à une interface intuitive et des fonctionnalités avancées de gestion des créneaux,
Spotly simplifie la planification et optimise l’utilisation des ressources.

## Fonctionnalités

+ Réservation de ressources : Réservez facilement des ressources partagées pour une période donnée.
+ Affichage des disponibilités en temps réel  : Consultez rapidement les ressources disponibles.
+ Créneaux récurrents  : Organisez des réservations récurrentes pour une utilisation planifiée sur plusieurs semaines ou mois.
+ Gestion par catégories  : Triez les ressources par catégories (salles, équipements, véhicules) et sites géographiques.
+ Options d’authentification sécurisées  : Intégration LDAP et SSO pour une authentification sécurisée (selon les besoins d'entreprise).
+ Adaptabilité mobile : Utilisation responsive pour une expérience optimale sur tous les appareils.

## Prérequis

+ Node.js (v14+ recommandé)
+ Next.js (v12+)
+ Prisma pour la gestion de base de données
+ Base de données compatible (MySQL, PostgreSQL, etc.)
+ Optionnel : Serveur LDAP/SSO pour l’authentification

## Installation

Clonez le projet et installez les dépendances :

```bash
git clone https://github.com/lowouis/spotly.git
cd spotly
npm install
```

Créez un fichier `.env.local` à la racine du projet et ajoutez les variables d'environnement suivantes :

```bash
DATABASE_URL="mysql://user:password@localhost:3306/spotly"
LDAP_URL="ldap://ldap.example.com"
LDAP_BIND_DN="cn=admin,dc=example,dc=com"
LDAP_BIND_CREDENTIALS="password"
```


## Démarrage

Pour lancer l'application en mode développement :

```bash
npm run dev
```

Pour lancer l'application en mode production :

```bash
npm run build
npm run start
```

## Licence

Ce projet est sous licence MIT. Pour plus d'informations, consultez le fichier `LICENSE`.

## Auteur

Ce projet a été développé par Louis GURITA et est maintenu par lui même. 
Pour toute question ou suggestion, n'hésitez pas à nous contacter.


#### English Version

Spotly is an open-source resource management and booking application designed for businesses. 
It enables employees to reserve and efficiently organize the use of shared resources, such as 
meeting rooms, equipment, vehicles, and more. With its intuitive interface and advanced scheduling
features, Spotly simplifies planning and optimizes resource utilization.

## Features

+ Resource Booking: Easily reserve shared resources for a given time period.
+ Real-Time Availability: Quickly check available resources.
+ Recurring Slots: Schedule recurring reservations for planned use over several weeks or months.
+ Category Management: Sort resources by categories (rooms, equipment, vehicles) and geographical locations.
+ Secure Authentication Options: LDAP and SSO integration for secure authentication (according to company needs).
+ Mobile Adaptability: Responsive design for an optimal experience across all devices.

## Prerequisites

+ Node.js (v14+ recommended)
+ Next.js (v12+)
+ Prisma for database management
+ Compatible Database (MySQL, PostgreSQL, etc.)
+ Optional: LDAP/SSO server for authentication

## Installation

Clone the project and install the dependencies:

```bash
git clone
cd spotly
npm install
```

Create a `.env.local` file at the root of the project and add the following environment variables:

```bash
DATABASE_URL="mysql://user:password@localhost:3306/spotly"
LDAP_URL="ldap://ldap.example.com"
LDAP_BIND_DN="cn=admin,dc=example,dc=com"
LDAP_BIND_CREDENTIALS="password"
```

## Getting Started

To run the application in development mode:

```bash
npm run dev
```

To run the application in production mode:

```bash
npm run build
npm run start
```

## License

This project is licensed under the MIT License. For more information, see the `LICENSE` file.

## Author

This project was developed by Louis GURITA and is maintained by him.
For any questions or suggestions, feel free to contact us.
```



