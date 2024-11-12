# Roadmap

# TODOs

- [ ] Being able to group files for a job instead of applying the prompt separately for each file
- [ ] Decide what to do with completed jobs in the long term
- [ ] Explore deploying the bucket in ca and the lambdas/bedrock calls in us
- [ ] Add metrics + reports on the total tokens in/ou + alerts
- [ ] Add metrics to monitor average length of files and the average maount of bedrock calls per files or corpus
- [ ] Add staging environment + distribution for features development
- [X] Optimize pipeline to reduce cdn invalidations (right now it is one invalidation for every code push)
- [ ] Friendly names for result files
- [ ] Add tests
- [ ] API - constraint on file amount, file type etc...
- [ ] Garder les fichier input+output dans le resultat des jobs.
- [ ] Supression manuelle des jobs
- [ ] Lifecycle sur les fichiers d'input
- [ ] Liste des processus -> pagner ou hauteur fixe + scroll
- [ ] Ajout details de l'erreur quand le job est en erreur
- [ ] Donner plus de controle au client sur l'inference (temperature, templates...)
- [ ] Meilleur affichage des resultats et inputs
- [ ] Backend content type validation
- [ ] Prompt favoris
- [ ] Pouvoir grouper les fichiers d'une tache d'inference au lieu d'appliquer le prompt par fichier seulement
- [ ] Input texte direct
- [ ] Gestion des prompts d'equipe
- [ ] Templater les fichiers dans le prompt
- [X] Bouton refresh en haut