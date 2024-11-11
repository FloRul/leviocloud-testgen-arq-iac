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
- 


## Notes
garder les fichier input+output dans le resultat des jobs.
supression manuelle des jobs
lifecycle sur les fichiers d'input
liste des processus -> pagner ou hauteur fixe + scroll
ajout details de l'erreur quand le job est en erreur
donner plus de controle au client sur l'inference (temperature, templates...)
meilleur affichage des resultats et inputs
backend content type validation
prompt favoris